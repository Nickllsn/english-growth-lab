import { z } from "zod";

export const expressionSchema = z.object({
  text: z.string().trim().min(1, "请输入英文表达"),
  meaning: z.string().trim().min(1, "请输入中文含义"),
  usedInSummary: z.boolean()
});

export function countEnglishSentences(text: string): number {
  return (text.match(/[.!?]+(?=\s|$)/g) ?? []).length;
}

export const dailyEntrySchema = z
  .object({
    date: z.iso.date("日期格式无效"),
    roadmapDay: z.number().int().min(1).max(30),
    topic: z.string().trim().min(1, "请输入学习主题"),
    material: z.object({
      title: z.string().trim().min(1, "请输入材料标题"),
      url: z.url("请输入有效链接"),
      source: z.string().trim().min(1, "请输入材料来源")
    }),
    readingMinutes: z.number().int().nonnegative(),
    listeningMinutes: z.number().int().nonnegative(),
    understanding: z.number().int().min(1).max(5),
    expressions: z.array(expressionSchema),
    summary: z.string(),
    completedAt: z.iso.datetime().optional()
  })
  .superRefine((entry, context) => {
    if (!entry.completedAt) {
      return;
    }

    if (entry.expressions.length < 3) {
      context.addIssue({
        code: "custom",
        path: ["expressions"],
        message: "完成记录至少需要 3 个英文表达"
      });
    }

    if (countEnglishSentences(entry.summary) < 3) {
      context.addIssue({
        code: "custom",
        path: ["summary"],
        message: "完成记录至少需要 3 句英文总结"
      });
    }
  });

export type DailyEntry = z.infer<typeof dailyEntrySchema>;
export type Expression = z.infer<typeof expressionSchema>;
