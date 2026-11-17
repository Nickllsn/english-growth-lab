import { weekdayLabel } from "../content/schedule";
import type { WeekPack } from "../content/types";

export interface ContentSchedule {
  date: string;
  weekId: string;
  weekday: string;
}

export function contentSchedule(
  term: { episodeId: string; start: number },
  weeks: WeekPack[]
): ContentSchedule | undefined {
  for (const week of weeks) {
    for (const day of week.days) {
      const listen = day.listen;
      if (!listen || listen.episodeId !== term.episodeId) continue;
      if (term.start >= listen.start && term.start < listen.end) {
        return { date: day.date, weekId: week.id, weekday: weekdayLabel(day.date) };
      }
    }
  }
  return undefined;
}

export function studyDate(term: { episodeId: string; start: number; scheduledOn?: string }, weeks: WeekPack[]): string {
  return contentSchedule(term, weeks)?.date ?? term.scheduledOn ?? "";
}

export function byNewestStudyDay<T extends { episodeId: string; start: number; scheduledOn?: string; addedAt?: string }>(
  terms: T[],
  weeks: WeekPack[]
): T[] {
  return [...terms].sort((left, right) => {
    const leftDate = studyDate(left, weeks);
    const rightDate = studyDate(right, weeks);
    if (leftDate !== rightDate) {
      if (!leftDate) return 1;
      if (!rightDate) return -1;
      return rightDate.localeCompare(leftDate);
    }
    const added = (right.addedAt ?? "").localeCompare(left.addedAt ?? "");
    if (added !== 0) return added;
    return right.start - left.start;
  });
}
