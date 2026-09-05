import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OutputsPage } from "../src/pages/OutputsPage";

const api = vi.hoisted(() => ({
  getEntries: vi.fn(),
  getReviews: vi.fn(),
  saveReview: vi.fn()
}));

vi.mock("../src/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/api/client")>()),
  getEntries: api.getEntries,
  getReviews: api.getReviews,
  saveReview: api.saveReview
}));

beforeEach(() => {
  api.getEntries.mockResolvedValue([
    {
      date: "2026-09-05",
      roadmapDay: 1,
      topic: "Linux Performance",
      material: {
        title: "Finding the bottleneck",
        url: "https://example.com/performance",
        source: "InfoQ"
      },
      readingMinutes: 10,
      listeningMinutes: 10,
      understanding: 4,
      expressions: [
        { text: "at scale", meaning: "大规模", usedInSummary: true }
      ],
      summary: "Performance measurement matters.",
      completedAt: "2026-09-05T08:00:00.000Z"
    },
    {
      date: "2026-09-04",
      roadmapDay: 2,
      topic: "AI Strategy",
      material: {
        title: "AI and products",
        url: "https://example.com/ai",
        source: "MIT Technology Review"
      },
      readingMinutes: 10,
      listeningMinutes: 5,
      understanding: 3,
      expressions: [],
      summary: "AI changes product strategy.",
      completedAt: "2026-09-04T08:00:00.000Z"
    }
  ]);
  api.getReviews.mockResolvedValue([]);
  api.saveReview.mockResolvedValue({
    week: "2026-W36",
    theme: "Linux Performance",
    markdown: "# 2026-W36 Weekly Review"
  });
});

describe("OutputsPage", () => {
  it("filters daily summaries by topic or source", async () => {
    render(<OutputsPage />);
    await screen.findByText("Performance measurement matters.");

    fireEvent.change(screen.getByLabelText("筛选每日输出"), {
      target: { value: "performance" }
    });

    expect(screen.getByText("Performance measurement matters.")).toBeInTheDocument();
    expect(screen.queryByText("AI changes product strategy.")).not.toBeInTheDocument();
  });
});
