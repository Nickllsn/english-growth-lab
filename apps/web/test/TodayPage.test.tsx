import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayPage } from "../src/pages/TodayPage";

beforeEach(() => {
  localStorage.clear();
  HTMLMediaElement.prototype.play = () => Promise.resolve();
});

describe("TodayPage", () => {
  it("opens tomorrow's Changelog lesson before 4 Nov", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-11-03" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "ZFS 要解决什么" })).toBeInTheDocument();
    expect(screen.getByText(/新课从 2026-11-04 开始/)).toBeInTheDocument();
    expect(screen.getByLabelText("Making the ZFS file system 音频")).toHaveAttribute(
      "src",
      "https://cdn.changelog.com/uploads/podcast/475/the-changelog-475.mp3"
    );
  });

  it("checks off the morning listen on the first podcast day", () => {
    render(
      <MemoryRouter>
        <TodayPage today="2026-11-04" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "ZFS 要解决什么" })).toBeInTheDocument();
    expect(screen.queryByText(/新课从/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "这一段做完了" }));

    expect(localStorage.getItem("egl.progress.v1")).toContain("2026-11-04");
    expect(localStorage.getItem("egl.progress.v1")).toContain("morning");
  });
});
