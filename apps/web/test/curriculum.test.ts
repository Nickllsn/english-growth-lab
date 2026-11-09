import { describe, expect, it } from "vitest";
import { weeks } from "../src/content/load";
import { resolveSession } from "../src/content/schedule";

describe("published weeks", () => {
  it("keeps every Changelog task at 10 minutes", () => {
    expect(resolveSession("2026-11-03", weeks)).toMatchObject({
      mode: "none",
      week: { id: "2026-W45" }
    });
    expect(resolveSession("2026-11-04", weeks)).toMatchObject({
      mode: "day",
      day: { theme: "ZFS 要解决什么", listen: { episodeId: "475", start: 0, end: 600 } }
    });
    expect(resolveSession("2026-11-09", weeks)).toMatchObject({
      mode: "day",
      week: { id: "2026-W46" },
      day: { listen: { episodeId: "475", start: 1800, end: 2400 } }
    });
    expect(resolveSession("2026-11-27", weeks)).toMatchObject({
      mode: "none",
      week: { id: "2026-W48" }
    });

    const lessons = weeks.flatMap((week) => week.days.filter((day) => day.listen));
    expect(lessons).toHaveLength(17);
    for (const day of lessons) {
      expect(day.listen && day.listen.end - day.listen.start).toBe(600);
      expect(day.shadow.length).toBeGreaterThanOrEqual(6);
      expect(day.shadow.length).toBeLessThanOrEqual(10);
      expect(day.slots.every((slot) => slot.minutes === 10 && slot.vocab.length === 0)).toBe(true);
    }
    const themes = weeks.flatMap((week) => week.days.map((day) => day.theme));
    expect(themes).not.toContain("旧材料已撤下");
  });

  it("points lesson links at Changelog episode pages", () => {
    const urls = weeks.flatMap((week) =>
      week.days.flatMap((day) => day.slots.flatMap((slot) => slot.links.map((link) => link.url)))
    );
    expect(urls).toContain("https://changelog.com/podcast/475");
    expect(urls.some((url) => url.includes("youtube.com") || url.includes("brendangregg.com"))).toBe(false);
  });
});
