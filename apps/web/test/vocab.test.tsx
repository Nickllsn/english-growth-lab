import { fireEvent, render, screen, within } from "@testing-library/react";
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
  it("shows the morning baseline and stores a mark", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-10-26" />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("button", { name: / 不认识$/ }).length).toBeGreaterThan(7);
    expect(screen.getByText("nutrients")).toBeInTheDocument();
    expect(screen.queryByText("quality")).not.toBeInTheDocument();
    expect(screen.queryByText("struggle")).not.toBeInTheDocument();
    expect(screen.getByText(/不是字幕原句/)).toBeInTheDocument();
    expect(screen.getByText(/接近六级/)).toBeInTheDocument();
    expect(screen.getAllByText("可能不认识").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "nutrients 认识" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "nutrients 不认识" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "nutrients 不认识" }));

    const saved = JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}") as { unknown: string[] };
    expect(saved.unknown).toContain("2026-10-26-morning-nutrients");
    expect(screen.getByRole("button", { name: "nutrients 不认识" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "nutrients 认识" }));
    const cleared = JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}") as { known: string[]; unknown: string[] };
    expect(cleared.unknown).not.toContain("2026-10-26-morning-nutrients");
    expect(cleared.known).toContain("2026-10-26-morning-nutrients");
  });

  it("lets the weekend preview mark next week's items", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-10-24" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByRole("button", { name: "nutrients 不认识" })[0]);
    expect(JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}")).toMatchObject({
      unknown: ["2026-10-26-morning-nutrients"]
    });
  });

  it("shows the week's items before the day starts", () => {
    render(
      <MemoryRouter initialEntries={["/week?focus=2026-10-27"]}>
        <WeekPage today="2026-10-26" />
      </MemoryRouter>
    );

    expect(screen.getAllByText("primary key").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "primary key 不认识" })[0]);
    expect(JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}")).toMatchObject({
      unknown: ["2026-10-27-morning-primary-key"]
    });
  });

  it("groups unknown items by week and can clear a mark", () => {
    localStorage.setItem(
      "egl.progress.v1",
      JSON.stringify({
        slots: {},
        reviews: {},
        unknown: ["2026-10-26-morning-nutrients", "2026-11-02-morning-page-cache"]
      })
    );

    render(
      <MemoryRouter>
        <VocabPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "自我介绍与分布式存储" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Linux 性能英语" })).toBeInTheDocument();
    expect(screen.getByText("nutrients")).toBeInTheDocument();
    expect(screen.getByText("page cache")).toBeInTheDocument();
    expect(screen.queryByText("saturated fats")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "nutrients 认识" }));
    expect(screen.queryByText("nutrients")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}")).toMatchObject({
      unknown: ["2026-11-02-morning-page-cache"]
    });
  });

  it("keeps an older progress file and includes unknown items in the week note", () => {
    expect(parseProgress(JSON.stringify({ slots: { "2026-10-26": ["morning"] }, reviews: {} }))).toEqual({
      slots: { "2026-10-26": ["morning"] },
      reviews: {},
      known: [],
      unknown: []
    });

    const week = weeks[0];
    const note = weekMarkdown(week, {
      slots: {},
      reviews: {},
      known: [],
      unknown: ["2026-10-26-morning-nutrients"]
    });
    expect(note).toContain("还不认识");
    expect(note).toContain("nutrients");
  });

  it("estimates a later item after a known and an unknown mark", () => {
    localStorage.setItem(
      "egl.progress.v1",
      JSON.stringify({
        slots: {},
        reviews: {},
        known: ["2026-10-26-morning-associated"],
        unknown: ["2026-10-26-morning-magic-bullet"]
      })
    );

    render(
      <MemoryRouter>
        <VocabPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "可能不认识" }));
    const morning = screen.getByRole("heading", { name: "周一 10-26 · 早听" }).closest("section");
    expect(morning).not.toBeNull();
    const list = within(morning as HTMLElement);
    expect(list.getByText("nutrients").closest("li")).toHaveTextContent("可能不认识");
    fireEvent.click(list.getByRole("button", { name: "只看可能不认识" }));
    expect(list.getByText("long-term").closest("li")).toHaveTextContent("可能认识");
  });
});
