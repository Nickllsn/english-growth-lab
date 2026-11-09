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
