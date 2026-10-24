import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayPage } from "../src/pages/TodayPage";

beforeEach(() => {
  localStorage.clear();
});

describe("TodayPage", () => {
  it("uses the weekend before 26 Oct to preview the first week", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-10-24" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "预习 自我介绍与分布式存储" })).toBeInTheDocument();
    expect(screen.getByText("五个学习日的视频都能打开")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /用英语介绍你自己/ })).toBeInTheDocument();
  });

  it("checks off the morning listen on the first study day", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-10-26" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "用英语介绍你自己" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /6 Minute English/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "这一段做完了" }));

    expect(localStorage.getItem("egl.progress.v1")).toContain("morning");
  });
});
