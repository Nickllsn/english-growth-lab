import { describe, expect, it } from "vitest";
import { calculateStats } from "../src/stats/calculate-stats.js";
import { validEntry } from "./fixtures.js";

function entry(date: string, understanding: number) {
  return {
    ...validEntry,
    date,
    understanding,
    completedAt: `${date}T08:30:00.000Z`
  };
}

describe("calculateStats", () => {
  it("calculates streaks, totals and reusable output", () => {
    const stats = calculateStats(
      [
        entry("2026-09-03", 3),
        entry("2026-09-04", 4),
        entry("2026-09-05", 5)
      ],
      "2026-09-05"
    );

    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.completedDays).toBe(3);
    expect(stats.completionRate).toBe(10);
    expect(stats.totalMinutes).toBe(60);
    expect(stats.expressionCount).toBe(9);
    expect(stats.reusedExpressionCount).toBe(6);
    expect(stats.weeklyUnderstanding).toEqual([
      { week: "2026-W36", average: 4 }
    ]);
  });

  it("returns zero values for an empty history", () => {
    const stats = calculateStats([], "2026-09-05");

    expect(stats.currentStreak).toBe(0);
    expect(stats.totalMinutes).toBe(0);
    expect(stats.weeklyUnderstanding).toEqual([]);
  });

  it("keeps the longest streak when the current streak is broken", () => {
    const stats = calculateStats(
      [
        entry("2026-08-30", 3),
        entry("2026-08-31", 3),
        entry("2026-09-02", 3)
      ],
      "2026-09-05"
    );

    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(2);
  });
});
