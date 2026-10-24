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

  it("shows the video and its study text on the page", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-10-27" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("tab", { name: "晚听" }));
    expect(screen.getByTitle(/英文字幕/)).toHaveAttribute(
      "src",
      expect.stringContaining("cc_load_policy=1")
    );
    expect(screen.getByText(/A database stores each row as bytes on a disk/)).toBeInTheDocument();
    expect(screen.getByText(/row · bytes · block/)).toBeInTheDocument();
  });

  it("checks off the morning listen on the first study day", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-10-26" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "用英语介绍你自己" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /6 Minute English/ })).toBeInTheDocument();
    expect(screen.getByText(/这一集的逐字稿属于 BBC/)).toBeInTheDocument();
    expect(screen.getByText(/I have been working as a software engineer for eight years/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "这一段做完了" }));

    expect(localStorage.getItem("egl.progress.v1")).toContain("morning");
  });
});
