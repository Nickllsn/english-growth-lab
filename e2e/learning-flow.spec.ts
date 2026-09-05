import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("daily output becomes visible progress and a readable file", async ({ page }) => {
  const today = new Date().toLocaleDateString("en-CA");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByLabel("材料标题").fill("Finding the real bottleneck");
  await page.getByLabel("材料链接").fill("https://example.com/performance");
  await page.getByLabel("材料来源").fill("InfoQ");
  await page.getByLabel("阅读分钟").fill("12");
  await page.getByLabel("听力分钟").fill("8");

  const expressions = ["the real bottleneck", "in practice", "at scale"];
  for (const [index, expression] of expressions.entries()) {
    await page.getByLabel(`英文表达 ${index + 1}`).fill(expression);
    await page.getByLabel(`中文含义 ${index + 1}`).fill(`含义 ${index + 1}`);
    await page.getByLabel(`已在总结中复用`).nth(index).check();
  }

  const summary =
    "The article explains the real bottleneck. Measurement matters in practice. The same method works at scale.";
  await page.getByLabel("英文总结").fill(summary);
  await page.getByRole("button", { name: "完成今日学习" }).click();
  await expect(page.getByText("今天的成果已保存")).toBeVisible();

  await page.getByRole("link", { name: "进度" }).click();
  await expect(page.getByText("完成 3.3%")).toBeVisible();
  await expect(page.getByText("20 分钟")).toBeVisible();

  await page.getByRole("link", { name: "输出" }).click();
  await expect(page.getByText(summary)).toBeVisible();

  const saved = JSON.parse(
    await readFile(resolve("e2e/.tmp/entries", `${today}.json`), "utf8")
  ) as { summary: string };
  expect(saved.summary).toBe(summary);
});
