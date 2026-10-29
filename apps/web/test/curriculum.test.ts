import { describe, expect, it } from "vitest";
import { weeks } from "../src/content/load";
import { resolveSession } from "../src/content/schedule";

describe("published weeks", () => {
  it("starts with a preview weekend and ten study days", () => {
    expect(resolveSession("2026-10-24", weeks).mode).toBe("preview");
    expect(resolveSession("2026-10-26", weeks)).toMatchObject({
      mode: "day",
      day: { theme: "用英语介绍你自己" }
    });
    expect(resolveSession("2026-11-02", weeks)).toMatchObject({
      mode: "day",
      week: { id: "2026-W45" }
    });
    expect(weeks.flatMap((week) => week.days.filter((day) => day.kind === "study"))).toHaveLength(10);
  });

  it("does not send Gregg readings to the host that fails to finish loading", () => {
    const urls = weeks.flatMap((week) => week.days.flatMap((day) => day.slots.flatMap((slot) => slot.links.map((link) => link.url))));

    expect(urls).toContain(
      "https://web.archive.org/web/20250106073356/https://www.brendangregg.com/usemethod.html"
    );
    expect(urls).toContain(
      "https://web.archive.org/web/20261014044803/https://www.brendangregg.com/linuxperf.html"
    );
    expect(urls).toContain(
      "https://www.usenix.org/sites/default/files/conference/protected-files/lisa19_slides_gregg.pdf"
    );
    expect(urls.some((url) => url.startsWith("https://www.brendangregg.com/"))).toBe(false);
  });

  it("puts a baseline on every morning, noon, and evening slot", () => {
    const seen = new Map<string, string>();
    const tooBasic = new Set([
      "quality",
      "immediately",
      "struggle",
      "client",
      "software",
      "calculate",
      "average",
      "particular",
      "familiar with",
      "instead of",
      "for example",
      "rather than",
      "according to",
      "used to"
    ]);

    for (const week of weeks) {
      for (const day of week.days) {
        for (const slot of day.slots) {
          const listening = day.kind === "study" && (slot.id === "morning" || slot.id === "noon" || slot.id === "evening");
          if (!listening) {
            expect(slot.vocab).toEqual([]);
            continue;
          }
          expect(slot.vocab.length).toBeGreaterThan(7);
          expect(new Set(slot.vocab.map((item) => item.kind))).toEqual(new Set(["word", "phrase", "pattern"]));
          const ids = slot.vocab.map((item) => item.id);
          expect(new Set(ids).size).toBe(ids.length);
          for (const item of slot.vocab) {
            expect(item.id.startsWith(`${day.date}-`)).toBe(true);
            expect([1, 2, 3]).toContain(item.level);
            expect(item.meaning).toMatch(/[\u4e00-\u9fff]/);
            expect(item.example).not.toMatch(/[\u4e00-\u9fff]/);
            expect(item.example.split(/\s+/).length).toBeLessThanOrEqual(18);
            expect(item.text.split(/\s+/).length).toBeLessThanOrEqual(6);
            expect(item.source.trim().length).toBeGreaterThan(0);
            expect(tooBasic.has(item.text.toLowerCase())).toBe(false);
            const previous = seen.get(item.id);
            if (previous) expect(previous).toBe(item.text);
            seen.set(item.id, item.text);
          }
        }
      }
    }
  });
});
