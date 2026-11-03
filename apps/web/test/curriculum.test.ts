import { describe, expect, it } from "vitest";
import { weeks } from "../src/content/load";
import { resolveSession } from "../src/content/schedule";

describe("published weeks", () => {
  it("starts Changelog study on 4 Nov", () => {
    expect(resolveSession("2026-11-03", weeks)).toMatchObject({
      mode: "day",
      day: { date: "2026-11-03", archived: true }
    });
    expect(resolveSession("2026-11-04", weeks)).toMatchObject({
      mode: "day",
      day: { theme: "ZFS 要解决什么", listen: { episodeId: "475", start: 0, end: 1200 } }
    });
    expect(resolveSession("2026-11-09", weeks)).toMatchObject({
      mode: "day",
      week: { id: "2026-W46" }
    });
    const lessons = weeks.flatMap((week) => week.days.filter((day) => day.listen));
    expect(lessons).toHaveLength(8);
    for (const day of lessons) {
      expect(day.shadow.length).toBeGreaterThanOrEqual(6);
      expect(day.shadow.length).toBeLessThanOrEqual(10);
      expect(day.slots.every((slot) => slot.vocab.length === 0)).toBe(true);
    }
  });

  it("points lesson links at Changelog episode pages", () => {
    const urls = weeks.flatMap((week) =>
      week.days.flatMap((day) => day.slots.flatMap((slot) => slot.links.map((link) => link.url)))
    );
    expect(urls).toContain("https://changelog.com/podcast/475");
    expect(urls.some((url) => url.includes("youtube.com") || url.includes("brendangregg.com"))).toBe(false);
  });
});
