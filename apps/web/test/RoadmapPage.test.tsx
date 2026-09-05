import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoadmapPage } from "../src/pages/RoadmapPage";

const api = vi.hoisted(() => ({
  getRoadmap: vi.fn(),
  getEntries: vi.fn()
}));

vi.mock("../src/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/api/client")>()),
  getRoadmap: api.getRoadmap,
  getEntries: api.getEntries
}));

beforeEach(() => {
  api.getRoadmap.mockResolvedValue(
    Array.from({ length: 30 }, (_, index) => ({
      day: index + 1,
      week: Math.min(Math.floor(index / 7) + 1, 4),
      theme: `主题 ${index + 1}`,
      source: {
        name: "InfoQ",
        url: "https://www.infoq.com/",
        difficulty: 3
      },
      focus: `重点 ${index + 1}`,
      suggestedMinutes: { reading: 12, listening: 8, output: 10 }
    }))
  );
  api.getEntries.mockResolvedValue([
    { date: "2026-09-05", roadmapDay: 1, completedAt: "2026-09-05T08:00:00.000Z" }
  ]);
});

describe("RoadmapPage", () => {
  it("groups all route days and exposes progress state", async () => {
    render(<RoadmapPage />);

    expect(await screen.findByRole("heading", { name: "第 1 周" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "第 4 周" })).toBeInTheDocument();
    expect(screen.getAllByText(/^DAY \d+$/)).toHaveLength(30);
    expect(screen.getByLabelText("DAY 1：已完成")).toBeInTheDocument();
    expect(screen.getByLabelText("DAY 2：当前任务")).toBeInTheDocument();
  });
});
