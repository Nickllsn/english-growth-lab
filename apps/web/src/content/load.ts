import type { WeekPack } from "./types";
import curriculumJson from "../../../../content/curriculum.json";
import week45 from "../../../../content/weeks/2026-W45.json";
import week46 from "../../../../content/weeks/2026-W46.json";
import { pickShadow } from "./shadow";
import { validateWeek } from "./validate";
import type { Curriculum } from "./types";

export const curriculum = curriculumJson as Curriculum;

function prepareWeek(week: WeekPack): WeekPack {
  return {
    ...week,
    days: week.days.map((day) => ({
      ...day,
      shadow: day.listen ? pickShadow(day.listen) : day.shadow,
      slots: day.slots.map((slot) => ({
        ...slot,
        vocab: slot.vocab ?? []
      }))
    }))
  };
}

export const weeks = [week45, week46].map((week) => prepareWeek(week as WeekPack));

const errors = weeks.flatMap(validateWeek);
if (errors.length > 0) {
  throw new Error(errors.join("\n"));
}
