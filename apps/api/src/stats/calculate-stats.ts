import type { DailyEntry } from "../entries/entry-schema.js";

export interface ProgressStats {
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  completionRate: number;
  readingMinutes: number;
  listeningMinutes: number;
  totalMinutes: number;
  englishWordCount: number;
  expressionCount: number;
  reusedExpressionCount: number;
  weeklyUnderstanding: Array<{ week: string; average: number }>;
}

function previousDate(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function isoWeek(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const year = value.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(
    ((value.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function longestStreak(dates: string[]): number {
  let longest = 0;
  let current = 0;
  let prior: string | undefined;

  for (const date of dates) {
    current = prior && previousDate(date) === prior ? current + 1 : 1;
    longest = Math.max(longest, current);
    prior = date;
  }

  return longest;
}

export function calculateStats(
  entries: DailyEntry[],
  today: string
): ProgressStats {
  const byDate = new Map(
    entries
      .filter((entry) => entry.completedAt)
      .map((entry) => [entry.date, entry])
  );
  const completed = [...byDate.values()].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
  const dates = completed.map(({ date }) => date);

  let currentStreak = 0;
  let cursor = today;
  while (byDate.has(cursor)) {
    currentStreak += 1;
    cursor = previousDate(cursor);
  }

  const weekly = new Map<string, number[]>();
  for (const entry of completed) {
    const week = isoWeek(entry.date);
    weekly.set(week, [...(weekly.get(week) ?? []), entry.understanding]);
  }

  const readingMinutes = completed.reduce(
    (sum, entry) => sum + entry.readingMinutes,
    0
  );
  const listeningMinutes = completed.reduce(
    (sum, entry) => sum + entry.listeningMinutes,
    0
  );

  return {
    currentStreak,
    longestStreak: longestStreak(dates),
    completedDays: completed.length,
    completionRate: Math.round((completed.length / 30) * 1_000) / 10,
    readingMinutes,
    listeningMinutes,
    totalMinutes: readingMinutes + listeningMinutes,
    englishWordCount: completed.reduce(
      (sum, entry) =>
        sum +
        (entry.summary.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []).length,
      0
    ),
    expressionCount: completed.reduce(
      (sum, entry) => sum + entry.expressions.length,
      0
    ),
    reusedExpressionCount: completed.reduce(
      (sum, entry) =>
        sum + entry.expressions.filter(({ usedInSummary }) => usedInSummary).length,
      0
    ),
    weeklyUnderstanding: [...weekly.entries()].map(([week, values]) => ({
      week,
      average:
        Math.round(
          (values.reduce((sum, value) => sum + value, 0) / values.length) * 10
        ) / 10
    }))
  };
}
