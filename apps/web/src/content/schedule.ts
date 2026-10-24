import type { StudyDay, WeekPack } from "./types";

export type Session =
  | { mode: "day"; week: WeekPack; day: StudyDay }
  | { mode: "preview"; week: WeekPack; daysUntil: number }
  | { mode: "waiting"; week: WeekPack };

export function shanghaiToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function weekdayLabel(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function sortedWeeks(weeks: WeekPack[]): WeekPack[] {
  return [...weeks].sort((left, right) => left.startsOn.localeCompare(right.startsOn));
}

export function resolveSession(today: string, weeks: WeekPack[]): Session {
  const ordered = sortedWeeks(weeks);
  if (ordered.length === 0) {
    throw new Error("还没有周课");
  }

  for (const week of ordered) {
    const day = week.days.find((item) => item.date === today);
    if (day) return { mode: "day", week, day };
  }

  const upcoming = ordered.find((week) => week.startsOn > today);
  if (upcoming) {
    const daysUntil = daysBetween(today, upcoming.startsOn);
    if (daysUntil <= 2) return { mode: "preview", week: upcoming, daysUntil };
  }

  const latest = [...ordered].reverse().find((week) => week.endsOn < today) ?? ordered[0];
  return { mode: "waiting", week: latest };
}

export function nextWeek(weeks: WeekPack[], current: WeekPack): WeekPack | undefined {
  return sortedWeeks(weeks).find((week) => week.startsOn > current.endsOn);
}

export function previousStudyDays(week: WeekPack, date: string): StudyDay[] {
  return week.days.filter((day) => day.kind === "study" && day.date < date);
}
