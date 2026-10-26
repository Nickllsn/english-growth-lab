import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { englishNarration, pageReadings } from "../src/content/page-text";

const audioDir = resolve(process.cwd(), "public/audio");

describe("english narration", () => {
  it("reads the English study text and leaves the Chinese note out", () => {
    const script = englishNarration([
      "这一集的逐字稿属于 BBC，页面里不转载。",
      "I have been working as a software engineer for eight years."
    ]);

    expect(script).toBe("I have been working as a software engineer for eight years.");
  });

  it("keeps an mp3 whose text matches the study passage", () => {
    const manifest = JSON.parse(readFileSync(resolve(audioDir, "manifest.json"), "utf8")) as Record<string, string>;
    const names = new Set<string>();

    for (const reading of Object.values(pageReadings)) {
      expect(names.has(reading.audio)).toBe(false);
      names.add(reading.audio);
      const script = englishNarration(reading.paragraphs);
      expect(script.length).toBeGreaterThan(40);
      expect(statSync(resolve(audioDir, reading.audio)).size).toBeGreaterThan(8000);
      expect(manifest[reading.audio]).toBe(createHash("sha256").update(script).digest("hex"));
    }
  });
});
