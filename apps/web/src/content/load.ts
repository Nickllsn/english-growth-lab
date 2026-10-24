import type { Curriculum, WeekPack } from "./types";
import curriculumJson from "../../../../content/curriculum.json";
import week44 from "../../../../content/weeks/2026-W44.json";
import week45 from "../../../../content/weeks/2026-W45.json";
import { validateWeek } from "./validate";

export const curriculum = curriculumJson as Curriculum;

export const weeks = [week44, week45] as WeekPack[];

const errors = weeks.flatMap(validateWeek);
if (errors.length > 0) {
  throw new Error(errors.join("\n"));
}
