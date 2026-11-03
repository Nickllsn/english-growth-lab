import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ListenPage } from "../src/pages/ListenPage";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/listen/:episodeId?" element={<ListenPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ListenPage", () => {
  beforeEach(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
  });

  it("lists the four episodes", () => {
    renderAt("/listen");

    expect(screen.getByRole("heading", { name: "播客精听" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Making the ZFS file system/ })).toHaveAttribute(
      "href",
      "/listen/475"
    );
    expect(screen.getByRole("link", { name: /From Sun to Oxide/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Talos Linux/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /distributed systems/ })).toBeInTheDocument();
  });

  it("seeks the Changelog audio when a transcript line is clicked", () => {
    renderAt("/listen/475");

    const audio = screen.getByLabelText("Making the ZFS file system 音频") as HTMLAudioElement;
    expect(audio).toHaveAttribute(
      "src",
      "https://cdn.changelog.com/uploads/podcast/475/the-changelog-475.mp3"
    );

    const line = screen.getByText(/Yeah\. I know the hosts of that podcast/);
    fireEvent.click(line);
    expect(audio.currentTime).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "播放 4:02" }));

    expect(audio.currentTime).toBe(242);
    expect(screen.getByRole("button", { name: "播放 4:02" }).closest("li")).toHaveClass("active");
    expect(screen.getByText(/Changelog Media LLC/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "许可" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/"
    );
  });
});
