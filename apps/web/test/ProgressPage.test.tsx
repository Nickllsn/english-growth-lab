import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ProgressPage } from "../src/pages/ProgressPage";

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
});
