import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { MaterialView } from "../src/components/MaterialView";
import { findEpisode } from "../src/content/changelog-episodes";
import { parseTranscript, segmentStop } from "../src/content/parse-transcript";
import { PlaybackBar } from "../src/playback/PlaybackBar";
import { PLAYBACK_KEY } from "../src/playback/engine";
import { TodayPage } from "../src/pages/TodayPage";
import { MemoryRouter } from "react-router-dom";

beforeEach(() => {
  localStorage.clear();
  HTMLMediaElement.prototype.play = () => Promise.resolve();
});

function renderToday(today: string) {
  return render(
    <MemoryRouter>
      <PlaybackBar />
      <TodayPage today={today} />
    </MemoryRouter>
  );
}

describe("playback", () => {
  it("keeps the same audio playing across the week, vocab, and progress pages", () => {
    const pause = vi.fn();
    HTMLMediaElement.prototype.pause = pause;
    window.location.hash = "#/?today=2026-11-04";
    render(<App />);

    const audio = screen.getByLabelText("Making the ZFS file system 音频") as HTMLAudioElement;
    audio.currentTime = 180;
    fireEvent.timeUpdate(audio);
    pause.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "本周" }));
    expect(screen.getByText("周次")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "生词" }));
    expect(screen.getByRole("heading", { name: "学习记录" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "进度" }));
    expect(screen.getByRole("heading", { name: "进度" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "路线" }));
    expect(screen.getByRole("heading", { name: "十二个月路线" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "今日" }));

    expect(pause).not.toHaveBeenCalled();
    expect(audio.isConnected).toBe(true);
    expect(audio.currentTime).toBe(180);
    expect(screen.getByLabelText("Making the ZFS file system 音频")).toBe(audio);
  });

  it("restores the paused time after the page is opened again", () => {
    const play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.play = play;
    localStorage.setItem(
      PLAYBACK_KEY,
      JSON.stringify({ episodeId: "475", time: 250, rate: 1.25, held: false })
    );
    renderToday("2026-11-04");

    const audio = screen.getByLabelText("Making the ZFS file system 音频") as HTMLAudioElement;
    fireEvent.loadedMetadata(audio);

    expect(audio.currentTime).toBe(250);
    expect(audio.playbackRate).toBe(1.25);
    expect(play).not.toHaveBeenCalled();

    audio.currentTime = 400;
    fireEvent.pause(audio);
    expect(JSON.parse(localStorage.getItem(PLAYBACK_KEY) ?? "{}")).toMatchObject({
      episodeId: "475",
      time: 400,
      held: false
    });
  });

  it("does not resume a pause that belongs to another ten-minute window", () => {
    localStorage.setItem(
      PLAYBACK_KEY,
      JSON.stringify({ episodeId: "475", time: 4000, rate: 1, held: false })
    );
    renderToday("2026-11-04");
    const audio = screen.getByLabelText("Making the ZFS file system 音频") as HTMLAudioElement;
    fireEvent.loadedMetadata(audio);
    expect(audio.currentTime).toBe(0);
  });

  it("remembers an automatic pause at the transcript boundary", () => {
    const episode = findEpisode("475")!;
    const cues = parseTranscript(episode.transcript, episode.cueStarts);
    const stop = segmentStop(cues, 600)!;
    localStorage.setItem(
      PLAYBACK_KEY,
      JSON.stringify({ episodeId: "475", time: stop, rate: 1, held: true })
    );
    const pause = vi.fn();
    HTMLMediaElement.prototype.pause = pause;
    renderToday("2026-11-04");
    const audio = screen.getByLabelText("Making the ZFS file system 音频") as HTMLAudioElement;
    fireEvent.loadedMetadata(audio);
    expect(audio.currentTime).toBe(stop);

    audio.currentTime = stop + 0.4;
    fireEvent.timeUpdate(audio);
    expect(pause).not.toHaveBeenCalled();
  });

  it("keeps a video frame mounted after leaving the page", () => {
    const view = (
      <>
        <PlaybackBar />
        <MaterialView
          link={{
            title: "Talk",
            url: "https://www.youtube.com/watch?v=abcdef12345",
            formats: ["video"],
            note: "watch"
          }}
        />
      </>
    );
    const first = render(view);
    const frame = document.querySelector("iframe");
    expect(frame).not.toBeNull();
    const src = frame?.getAttribute("src");
    first.unmount();
    expect(frame?.isConnected).toBe(true);
    expect(frame?.getAttribute("src")).toBe(src);

    render(view);
    expect(document.querySelector("iframe")).toBe(frame);
  });
});
