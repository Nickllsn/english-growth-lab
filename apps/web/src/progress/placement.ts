import { weekdayLabel } from "../content/schedule";
import type { WeekPack } from "../content/types";
import type { LearningTerm, StudyPeriod } from "./store";

export type { StudyPeriod };

export const periodLabel: Record<StudyPeriod, string> = {
  morning: "早听",
  noon: "午读",
  evening: "晚听",
  home: "跟读"
};

export interface TermPlacement {
  date: string;
  hour: number;
  period: StudyPeriod;
  weekId?: string;
  weekday: string;
}

function shanghaiParts(iso: string): { date: string; hour: number } {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(iso));
  const hourText = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    hourCycle: "h23"
  }).format(new Date(iso));
  return { date, hour: Number(hourText) };
}

export function periodFromHour(hour: number): Exclude<StudyPeriod, "home"> {
  if (hour < 11) return "morning";
  if (hour < 16) return "noon";
  return "evening";
}

export function termPlacement(term: LearningTerm, weeks: WeekPack[]): TermPlacement {
  const derived = shanghaiParts(term.addedAt);
  const date = term.studiedOn ?? derived.date;
  const period = term.period ?? periodFromHour(derived.hour);
  const week = weeks.find((item) => item.startsOn <= date && date <= item.endsOn);
  return {
    date,
    hour: derived.hour,
    period,
    weekId: week?.id,
    weekday: weekdayLabel(date)
  };
}
