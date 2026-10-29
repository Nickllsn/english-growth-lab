import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayPage } from "../src/pages/TodayPage";
import { VocabPage } from "../src/pages/VocabPage";
import { WeekPage } from "../src/pages/WeekPage";
import { parseProgress, weekMarkdown } from "../src/progress/store";
import { weeks } from "../src/content/load";

beforeEach(() => {
  localStorage.clear();
});

describe("caption vocabulary", () => {
  it("shows Monday's BBC items and stores an unknown mark", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-10-26" />
      </MemoryRouter>
    );

    expect(screen.getByText("struggle")).toBeInTheDocument();
    expect(screen.getByText(/不是字幕原句/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "struggle 不认识" }));

    const saved = JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}") as { unknown: string[] };
    expect(saved.unknown).toContain("2026-10-26-struggle");
    expect(screen.getByRole("button", { name: "struggle 不认识" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "struggle 认识" }));
    const cleared = JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}") as { unknown: string[] };
    expect(cleared.unknown).not.toContain("2026-10-26-struggle");
  });

  it("lets the weekend preview mark next week's items", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-10-24" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "nutrients 不认识" }));
    expect(JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}")).toMatchObject({
      unknown: ["2026-10-26-nutrients"]
    });
  });

  it("shows the week's items before the day starts", () => {
    render(
      <MemoryRouter initialEntries={["/week?focus=2026-10-27"]}>
        <WeekPage today="2026-10-26" />
      </MemoryRouter>
    );

    expect(screen.getByText("primary key")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "primary key 不认识" }));
    expect(JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}")).toMatchObject({
      unknown: ["2026-10-27-primary-key"]
    });
  });

  it("groups unknown items by week and can clear a mark", () => {
    localStorage.setItem(
      "egl.progress.v1",
      JSON.stringify({
        slots: {},
        reviews: {},
        unknown: ["2026-10-26-struggle", "2026-11-02-page-cache"]
      })
    );

    render(
      <MemoryRouter>
        <VocabPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "自我介绍与分布式存储" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Linux 性能英语" })).toBeInTheDocument();
    expect(screen.getByText("struggle")).toBeInTheDocument();
    expect(screen.getByText("page cache")).toBeInTheDocument();
    expect(screen.queryByText("nutrients")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "struggle 认识" }));
    expect(screen.queryByText("struggle")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}")).toMatchObject({
      unknown: ["2026-11-02-page-cache"]
    });
  });

  it("keeps an older progress file and includes unknown items in the week note", () => {
    expect(parseProgress(JSON.stringify({ slots: { "2026-10-26": ["morning"] }, reviews: {} }))).toEqual({
      slots: { "2026-10-26": ["morning"] },
      reviews: {},
      unknown: []
    });

    const week = weeks[0];
    const note = weekMarkdown(week, {
      slots: {},
      reviews: {},
      unknown: ["2026-10-26-struggle"]
    });
    expect(note).toContain("还不认识");
    expect(note).toContain("struggle");
  });
});
