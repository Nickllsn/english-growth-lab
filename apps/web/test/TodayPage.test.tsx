import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findEpisode } from "../src/content/changelog-episodes";
import { parseTranscript, segmentStop } from "../src/content/parse-transcript";
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

  it("pauses when the day's transcript has finished", () => {
    const pause = vi.fn();
    HTMLMediaElement.prototype.pause = pause;
    render(
      <MemoryRouter>
        <TodayPage today="2026-11-04" />
      </MemoryRouter>
    );

    const episode = findEpisode("475");
    const cues = parseTranscript(episode!.transcript, episode!.cueStarts);
    const stop = segmentStop(cues, 1200)!;
    const audio = screen.getByLabelText("Making the ZFS file system 音频") as HTMLAudioElement;

    audio.currentTime = stop + 0.4;
    fireEvent.timeUpdate(audio);
    expect(pause).toHaveBeenCalledOnce();
    expect(audio.currentTime).toBe(stop);

    pause.mockClear();
    audio.currentTime = stop + 2;
    fireEvent.timeUpdate(audio);
    expect(pause).not.toHaveBeenCalled();

    audio.currentTime = stop - 30;
    fireEvent.timeUpdate(audio);
    audio.currentTime = stop + 0.4;
    fireEvent.timeUpdate(audio);
    expect(pause).toHaveBeenCalledOnce();
  });
});
