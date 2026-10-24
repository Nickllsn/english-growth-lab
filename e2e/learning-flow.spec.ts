import { expect, test } from "@playwright/test";

test("published week can be opened and checked off", async ({ page }) => {
  await page.goto("/#/?today=2026-10-26");
  await expect(page.getByRole("heading", { name: "用英语介绍你自己" })).toBeVisible();
  await expect(page.getByRole("link", { name: /6 Minute English/ })).toBeVisible();

  const checkbox = page.getByRole("checkbox", { name: "这一段做完了" });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "这一段做完了" })).toBeChecked();

  await page.getByRole("link", { name: "本周" }).click();
  await expect(page.getByRole("heading", { name: "自我介绍与分布式存储" })).toBeVisible();
  await page.getByRole("link", { name: "路线" }).click();
  await expect(page.getByRole("heading", { name: "第 1 个月 · 重建基础" })).toBeVisible();
});
