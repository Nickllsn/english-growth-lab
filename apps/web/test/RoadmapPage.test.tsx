import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RoadmapPage } from "../src/pages/RoadmapPage";

describe("RoadmapPage", () => {
  it("shows the year plan and the published weeks", () => {
    render(
      <MemoryRouter>
        <RoadmapPage today="2026-10-24" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "第 1 个月 · 重建基础" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /2026-W44 自我介绍与分布式存储/ })).toBeInTheDocument();
    expect(screen.getByText(/周五放进 content\/weeks/)).toBeInTheDocument();
  });
});
