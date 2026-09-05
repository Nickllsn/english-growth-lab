import { mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { atomicWrite } from "../entries/entry-store.js";

export const weeklyReviewSchema = z.object({
  week: z
    .string()
    .regex(/^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/, "周格式无效"),
  theme: z.string().trim().min(1, "请输入本周主题"),
  materials: z
    .array(
      z.object({
        title: z.string().trim().min(1, "请输入材料标题"),
        url: z.url("请输入有效链接")
      })
    )
    .min(1, "请至少添加一个材料"),
  technicalPerspective: z.string().trim().min(1, "请输入技术视角"),
  businessPerspective: z.string().trim().min(1, "请输入商业或社会视角"),
  myView: z.string().trim().min(1, "请输入自己的观点"),
  reusedExpressions: z.array(z.string().trim().min(1)).min(1, "请复用至少一个表达"),
  nextWeek: z.string().trim().min(1, "请输入下周调整")
});

export type WeeklyReview = z.infer<typeof weeklyReviewSchema>;

export interface StoredReview {
  week: string;
  theme: string;
  markdown: string;
}

export function renderWeeklyReview(input: WeeklyReview): string {
  const review = weeklyReviewSchema.parse(input);
  const materials = review.materials
    .map(({ title, url }) => `- [${title}](${url})`)
    .join("\n");
  const expressions = review.reusedExpressions
    .map((expression) => `- ${expression}`)
    .join("\n");

  return `# ${review.week} Weekly Review

## Theme
${review.theme}

## Materials
${materials}

## Technical Perspective
${review.technicalPerspective}

## Business or Social Perspective
${review.businessPerspective}

## My View
${review.myView}

## Reused Expressions
${expressions}

## Next Week
${review.nextWeek}
`;
}

export class ReviewStore {
  constructor(private readonly reviewsDir: string) {}

  async save(input: unknown): Promise<StoredReview> {
    const review = weeklyReviewSchema.parse(input);
    const markdown = renderWeeklyReview(review);
    await atomicWrite(
      join(this.reviewsDir, `${review.week}-review.md`),
      markdown
    );
    return { week: review.week, theme: review.theme, markdown };
  }

  async list(): Promise<StoredReview[]> {
    await mkdir(this.reviewsDir, { recursive: true });
    const names = (await readdir(this.reviewsDir))
      .filter((name) => /^\d{4}-W\d{2}-review\.md$/.test(name))
      .sort()
      .reverse();

    return Promise.all(
      names.map(async (name) => {
        const markdown = await readFile(join(this.reviewsDir, name), "utf8");
        const week = name.slice(0, 8);
        const theme =
          markdown.match(/## Theme\r?\n([^\r\n]+)/)?.[1]?.trim() ?? "";
        return { week, theme, markdown };
      })
    );
  }
}
