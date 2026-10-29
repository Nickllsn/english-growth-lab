import { describe, expect, it } from "vitest";
import type { VocabItem } from "../src/content/types";
import { judgeVocab } from "../src/progress/predict";

function item(id: string, text: string, level: 1 | 2 | 3): VocabItem {
  return { id, kind: "word", text, meaning: "词", example: text, source: "test", level };
}

const catalog = [
  item("a-struggle", "struggle", 1),
  item("b-struggle", "struggle", 1),
  item("a-block", "block", 2),
  item("b-easy", "diet", 1),
  item("b-mid", "latency", 2),
  item("b-hard", "quorum", 3)
];

describe("judgeVocab", () => {
  it("treats an unmarked baseline as likely unknown", () => {
    expect(judgeVocab(catalog[0], { known: [], unknown: [] }, catalog)).toBe("predicted-unknown");
  });

  it("keeps an explicit mark on that card", () => {
    expect(judgeVocab(catalog[0], { known: [], unknown: ["a-struggle"] }, catalog)).toBe("unknown");
    expect(judgeVocab(catalog[0], { known: ["a-struggle"], unknown: [] }, catalog)).toBe("known");
  });

  it("copies the same wording onto a later card", () => {
    expect(judgeVocab(catalog[1], { known: ["a-struggle"], unknown: [] }, catalog)).toBe("predicted-known");
    expect(judgeVocab(catalog[1], { known: [], unknown: ["a-struggle"] }, catalog)).toBe("predicted-unknown");
  });

  it("estimates later items from the difficulty already marked unknown", () => {
    const progress = { known: ["a-struggle"], unknown: ["b-hard"] };
    expect(judgeVocab(catalog[3], progress, catalog)).toBe("predicted-known");
    expect(judgeVocab(catalog[4], progress, catalog)).toBe("predicted-unknown");
    expect(judgeVocab(catalog[2], progress, catalog)).toBe("predicted-unknown");
  });

  it("keeps harder items unknown when only easier items were marked known", () => {
    const progress = { known: ["a-block"], unknown: [] };
    expect(judgeVocab(catalog[3], progress, catalog)).toBe("predicted-known");
    expect(judgeVocab(catalog[5], progress, catalog)).toBe("predicted-unknown");
  });
});
