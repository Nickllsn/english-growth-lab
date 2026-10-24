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
});
