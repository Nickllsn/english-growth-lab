import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodayPage } from "../src/pages/TodayPage";

const api = vi.hoisted(() => ({
  getRoadmap: vi.fn(),
  getEntries: vi.fn(),
  getEntry: vi.fn(),
  saveEntry: vi.fn()
}));

vi.mock("../src/api/client", () => api);

const roadmapDay = {
  day: 1,
  week: 1,
  theme: "Linux 与性能",
  source: {
    name: "InfoQ",
    url: "https://www.infoq.com/",
    difficulty: 3
  },
  focus: "定位真实瓶颈",
  suggestedMinutes: { reading: 12, listening: 8, output: 10 }
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  api.getRoadmap.mockResolvedValue([roadmapDay]);
  api.getEntries.mockResolvedValue([]);
  api.getEntry.mockResolvedValue(null);
  api.saveEntry.mockImplementation(async (_date, entry) => entry);
});

describe("TodayPage", () => {
  it("completes and saves today's learning output", async () => {
    render(<TodayPage today="2026-09-05" />);
    await screen.findByText("Linux 与性能");

    fireEvent.change(screen.getByLabelText("材料标题"), {
      target: { value: "Finding the bottleneck" }
    });
    fireEvent.change(screen.getByLabelText("材料链接"), {
      target: { value: "https://example.com/performance" }
    });
    fireEvent.change(screen.getByLabelText("材料来源"), {
      target: { value: "InfoQ" }
    });
    fireEvent.change(screen.getByLabelText("阅读分钟"), {
      target: { value: "10" }
    });
    fireEvent.change(screen.getByLabelText("听力分钟"), {
      target: { value: "10" }
    });

    ["the real bottleneck", "in practice", "at scale"].forEach(
      (value, index) => {
        fireEvent.change(screen.getByLabelText(`英文表达 ${index + 1}`), {
          target: { value }
        });
        fireEvent.change(screen.getByLabelText(`中文含义 ${index + 1}`), {
          target: { value: `含义 ${index + 1}` }
        });
      }
    );

    fireEvent.change(screen.getByLabelText("英文总结"), {
      target: {
        value:
          "The article explains a bottleneck. Measurement matters in practice. The method works at scale."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "完成今日学习" }));

    await waitFor(() => {
      expect(api.saveEntry).toHaveBeenCalledWith(
        "2026-09-05",
        expect.objectContaining({
          topic: "Linux 与性能",
          completedAt: expect.any(String)
        })
      );
    });
    expect(await screen.findByText("今天的成果已保存")).toBeInTheDocument();
  });

  it("shows a clear error when expressions are missing", async () => {
    render(<TodayPage today="2026-09-05" />);
    await screen.findByText("Linux 与性能");

    fireEvent.click(screen.getByRole("button", { name: "完成今日学习" }));

    expect(
      await screen.findByText("请至少记录 3 个英文表达")
    ).toBeInTheDocument();
    expect(api.saveEntry).not.toHaveBeenCalled();
  });
});
