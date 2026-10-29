import type { Curriculum, SlotPlan, VocabItem, WeekPack } from "./types";
import curriculumJson from "../../../../content/curriculum.json";
import vocabJson from "../../../../content/vocab.json";
import week44 from "../../../../content/weeks/2026-W44.json";
import week45 from "../../../../content/weeks/2026-W45.json";
import { validateWeek } from "./validate";

export const curriculum = curriculumJson as Curriculum;

const vocabByDay = vocabJson as Record<string, Partial<Record<SlotPlan["id"], VocabItem[]>>>;

function withVocab(week: WeekPack): WeekPack {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      slots: day.slots.map((slot) => ({
        ...slot,
        vocab: vocabByDay[day.date]?.[slot.id] ?? []
      }))
    }))
  };
}

export const weeks = [week44, week45].map((week) => withVocab(week as WeekPack));

export function allVocab(packs: WeekPack[] = weeks): VocabItem[] {
  return packs.flatMap((week) => week.days.flatMap((day) => day.slots.flatMap((slot) => slot.vocab)));
}

const errors = weeks.flatMap(validateWeek);
if (errors.length > 0) {
  throw new Error(errors.join("\n"));
}
