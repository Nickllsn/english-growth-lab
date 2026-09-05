import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressPage } from "../src/pages/ProgressPage";

const api = vi.hoisted(() => ({
  getProgress: vi.fn(),
  getEntries: vi.fn()
}));

vi.mock("../src/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/api/client")>()),
  getProgress: api.getProgress,
  getEntries: api.getEntries
}));

beforeEach(() => {
  api.getProgress.mockResolvedValue({
    currentStreak: 3,
    longestStreak: 5,
    completedDays: 3,
    completionRate: 10,
    readingMinutes: 30,
    listeningMinutes: 15,
    totalMinutes: 45,
    englishWordCount: 72,
    expressionCount: 9,
    reusedExpressionCount: 6,
    weeklyUnderstanding: [{ week: "2026-W36", average: 4 }]
  });
  api.getEntries.mockResolvedValue([
    { date: "2026-09-05", completedAt: "2026-09-05T08:00:00.000Z" }
  ]);
});

describe("ProgressPage", () => {
  it("shows streak, completion and accumulated output", async () => {
    render(<ProgressPage />);

    expect(await screen.findByText("连续 3 天")).toBeInTheDocument();
    expect(screen.getByText("完成 10%")).toBeInTheDocument();
    expect(screen.getByText("45 分钟")).toBeInTheDocument();
    expect(screen.getByText("9 个表达")).toBeInTheDocument();
    expect(screen.getByText("2026-W36")).toBeInTheDocument();
    expect(screen.getByLabelText("2026-09-05：已完成")).toBeInTheDocument();
  });
});
