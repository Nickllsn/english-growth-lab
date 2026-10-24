import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { ProgressPage } from "../src/pages/ProgressPage";
import { TodayPage } from "../src/pages/TodayPage";

beforeEach(() => {
  localStorage.clear();
});

describe("ProgressPage", () => {
  it("counts a finished study day", () => {
    localStorage.setItem(
      "egl.progress.v1",
      JSON.stringify({
        slots: { "2026-10-26": ["morning", "noon", "evening", "home"] },
        reviews: {}
      })
    );

    render(<ProgressPage today="2026-10-26" />);

    expect(screen.getByText("1 / 10")).toBeInTheDocument();
    expect(screen.getByText("1 天")).toBeInTheDocument();
    expect(screen.getByLabelText("2026-10-26：已完成")).toBeInTheDocument();
  });

  it("edits a week review into the progress json", () => {
    render(<ProgressPage today="2026-10-31" />);

    fireEvent.change(screen.getByRole("textbox", { name: "2026-W44 复盘" }), {
      target: { value: "I can explain Ceph." }
    });

    const saved = JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}") as {
      reviews: Record<string, string>;
    };
    expect(saved.reviews["2026-W44"]).toBe("I can explain Ceph.");
    expect(screen.getByRole("textbox", { name: "2026-W44 复盘" })).toHaveValue("I can explain Ceph.");
  });

  it("restores an imported review into the editor", async () => {
    render(<ProgressPage today="2026-10-31" />);
    const file = new File(
      [JSON.stringify({ slots: {}, reviews: { "2026-W45": "imported line" } })],
      "english-progress.json",
      { type: "application/json" }
    );

    fireEvent.change(screen.getByLabelText("导入进度"), { target: { files: [file] } });

    expect(await screen.findByDisplayValue("imported line")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}")).toMatchObject({
      reviews: { "2026-W45": "imported line" }
    });
  });

  it("shows the progress-page review on Sunday", () => {
    const { unmount } = render(<ProgressPage today="2026-11-01" />);
    fireEvent.change(screen.getByRole("textbox", { name: "2026-W44 复盘" }), {
      target: { value: "I can explain Ceph." }
    });
    unmount();

    render(
      <MemoryRouter>
        <TodayPage today="2026-11-01" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("tab", { name: "复盘" }));

    expect(screen.getByRole("textbox", { name: "本周复盘" })).toHaveValue("I can explain Ceph.");
  });
});
