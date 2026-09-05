import { readFile } from "node:fs/promises";
import { z } from "zod";

const suggestedMinutesSchema = z
  .object({
    reading: z.number().int().nonnegative(),
    listening: z.number().int().nonnegative(),
    output: z.number().int().nonnegative()
  })
  .refine(
    (value) => value.reading + value.listening + value.output === 30,
    "建议时长总和必须为 30 分钟"
  );

export const roadmapDaySchema = z.object({
  day: z.number().int().min(1).max(30),
  week: z.number().int().min(1).max(4),
  theme: z.string().trim().min(1),
  source: z.object({
    name: z.string().trim().min(1),
    url: z.url(),
    difficulty: z.number().int().min(1).max(5)
  }),
  focus: z.string().trim().min(1),
  suggestedMinutes: suggestedMinutesSchema
});

const roadmapSchema = z
  .object({
    days: z.array(roadmapDaySchema)
  })
  .superRefine(({ days }, context) => {
    if (days.length !== 30) {
      context.addIssue({
        code: "custom",
        path: ["days"],
        message: "学习路线必须包含 30 天"
      });
    }

    const actualDays = days.map(({ day }) => day);
    const expectedDays = Array.from({ length: 30 }, (_, index) => index + 1);
    if (
      actualDays.length === 30 &&
      actualDays.some((day, index) => day !== expectedDays[index])
    ) {
      context.addIssue({
        code: "custom",
        path: ["days"],
        message: "学习路线日期必须按 1 到 30 顺序且不重复"
      });
    }
  });

export type RoadmapDay = z.infer<typeof roadmapDaySchema>;

export async function loadRoadmap(path: string): Promise<RoadmapDay[]> {
  const contents = await readFile(path, "utf8");
  return roadmapSchema.parse(JSON.parse(contents)).days;
}
