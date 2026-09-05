import { describe, expect, it } from "vitest";
import { dailyEntrySchema } from "../src/entries/entry-schema.js";
import { validEntry } from "./fixtures.js";

describe("dailyEntrySchema", () => {
  it("accepts a complete entry", () => {
    expect(dailyEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it("requires three English sentences when completed", () => {
    const result = dailyEntrySchema.safeParse({
      ...validEntry,
      summary: "Too short."
    });

    expect(result.success).toBe(false);
  });

  it("requires three expressions when completed", () => {
    const result = dailyEntrySchema.safeParse({
      ...validEntry,
      expressions: []
    });

    expect(result.success).toBe(false);
  });

  it("allows an unfinished draft", () => {
    const { completedAt: _completedAt, ...draft } = validEntry;

    expect(
      dailyEntrySchema.safeParse({
        ...draft,
        expressions: [],
        summary: ""
      }).success
    ).toBe(true);
  });
});
