import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListenPage } from "../src/pages/ListenPage";
import { VocabPage } from "../src/pages/VocabPage";
import { acceptSelection } from "../src/content/selection";
import { addTerm, emptyProgress, loadProgress, parseProgress, termId } from "../src/progress/store";

beforeEach(() => {
  localStorage.clear();
  HTMLMediaElement.prototype.play = () => Promise.resolve();
});

describe("learning terms", () => {
  it("keeps a short word or phrase and rejects a sentence", () => {
    expect(acceptSelection("  checksums, ")).toBe("checksums");
    expect(acceptSelection("copy-on-write")).toBe("copy-on-write");
    expect(acceptSelection("the end of the suffering of storage")).toBe(
      "the end of the suffering of storage"
    );
    expect(acceptSelection(Array.from({ length: 21 }, () => "word").join(" "))).toBeNull();
  });

  it("starts from the progress file saved in the project", () => {
    const progress = loadProgress();

    expect(progress.terms).toHaveLength(37);
    expect(progress.terms.map((term) => term.text)).toContain("newcomer");
    expect(progress.terms.map((term) => term.text)).toContain("RAIDZ expansion");
    expect(progress.slots["2026-11-09"]).toEqual(["morning", "noon", "evening"]);
  });

  it("keeps local-only terms and adds terms missing from the returned file", () => {
    localStorage.setItem(
      "egl.progress.v1",
      JSON.stringify({
        slots: { "2026-11-09": ["morning"] },
        reviews: {},
        known: [],
        unknown: [],
        terms: [
          {
            id: "475:local only",
            text: "local only",
            episodeId: "475",
            episodeTitle: "Making the ZFS file system",
            start: 1,
            speaker: null,
            sentence: "local sentence",
            addedAt: "2026-11-09T01:00:00.000Z"
          }
        ]
      })
    );

    const progress = loadProgress();
    expect(progress.terms.map((term) => term.text)).toContain("local only");
    expect(progress.terms.map((term) => term.text)).toContain("RAIDZ expansion");
    expect(progress.slots["2026-11-09"]).toEqual(["morning"]);
  });

  it("shows a sentence-based note for each imported term", () => {
    render(
      <MemoryRouter>
        <VocabPage />
      </MemoryRouter>
    );

    expect(screen.getByText("我其实不太关注科技播客圈。")).toBeInTheDocument();
    expect(screen.getByText(/插上电源/)).toBeInTheDocument();
    expect(screen.getByText("请 Matt 开始讲，话头由他来开。")).toBeInTheDocument();
    expect(screen.getAllByText("这句话是").length).toBe(37);

    fireEvent.change(screen.getByRole("combobox", { name: "周几" }), { target: { value: "周三" } });
    expect(screen.getByText("19 / 37 条")).toBeInTheDocument();
    expect(screen.getAllByText(/2026-W45 · 周三 · 2026-11-04/)).toHaveLength(19);
    expect(screen.queryByText(/2026-11-12/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "周几" }), { target: { value: "周四" } });
    fireEvent.change(screen.getByRole("combobox", { name: "周" }), { target: { value: "2026-W46" } });
    expect(screen.getByText("18 / 37 条")).toBeInTheDocument();
    expect(screen.getAllByText(/2026-W46 · 周四 · 2026-11-12/)).toHaveLength(18);
    expect(screen.queryByText(/2026-11-04/)).not.toBeInTheDocument();
  });

  it("stores the sentence and episode with the selected word", () => {
    const next = addTerm(emptyProgress(), {
      text: "checksums",
      episodeId: "475",
      episodeTitle: "Making the ZFS file system",
      start: 242,
      speaker: "Matthew Ahrens",
      sentence: "And you need to know that the data is correct, so you need checksums."
    }, "2026-11-04T02:00:00.000Z");

    expect(next.terms[0].id).toBe(termId("475", "checksums"));
    expect(next.terms[0].scheduledOn).toBe("2026-11-04");
    expect(next.terms[0].weekId).toBe("2026-W45");
    expect(addTerm(next, next.terms[0]).terms).toHaveLength(1);
  });

  it("keeps a late addition on the day whose audio window contains it", () => {
    const raw = JSON.stringify({
      slots: {},
      reviews: {},
      terms: [
        {
          id: "475:raidz expansion",
          text: "RAIDZ expansion",
          episodeId: "475",
          episodeTitle: "Making the ZFS file system",
          start: 3626.7,
          speaker: "Adam Stacoviak",
          sentence: "So four years later though, RAIDZ expansion.",
          addedAt: "2026-11-09T00:54:25.770Z",
          scheduledOn: "2026-11-09",
          weekId: "2026-W46"
        }
      ]
    });

    const progress = parseProgress(raw);
    expect(progress.terms[0].scheduledOn).toBe("2026-11-12");
    expect(progress.terms[0].weekId).toBe("2026-W46");
  });

  it("adds a selected transcript word and lists it for export", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/listen/475"]}>
        <Routes>
          <Route path="/listen/:episodeId" element={<ListenPage />} />
        </Routes>
      </MemoryRouter>
    );
    const paragraph = screen.getByText(/Yeah\. I know the hosts of that podcast/).closest("div");
    expect(paragraph).toBeTruthy();
    const range = {
      getBoundingClientRect: () => ({ left: 12, bottom: 24, top: 0, right: 40, width: 28, height: 16 })
    };
    vi.spyOn(window, "getSelection").mockReturnValue({
      isCollapsed: false,
      rangeCount: 1,
      toString: () => "podcast",
      anchorNode: paragraph,
      getRangeAt: () => range,
      removeAllRanges: () => undefined
    } as unknown as Selection);

    fireEvent.pointerUp(paragraph!);
    fireEvent.click(screen.getByRole("button", { name: "加入不认识" }));
    unmount();

    render(
      <MemoryRouter>
        <VocabPage />
      </MemoryRouter>
    );
    expect(screen.getByText("podcast")).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem("egl.progress.v1") ?? "{}") as {
      terms: { text: string; episodeId: string; sentence: string; start: number }[];
    };
    const podcast = saved.terms.find((term) => term.text === "podcast");
    expect(podcast).toMatchObject({ text: "podcast", episodeId: "475" });
    expect(podcast?.sentence.length).toBeGreaterThan(10);
    expect(podcast?.start).toBeGreaterThan(0);
  });
});
