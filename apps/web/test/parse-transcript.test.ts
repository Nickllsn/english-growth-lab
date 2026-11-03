import { describe, expect, it } from "vitest";
import episode156 from "../../../content/changelog/go-time-156.md?raw";
import episode84 from "../../../content/changelog/ship-it-84.md?raw";
import episode475 from "../../../content/changelog/the-changelog-475.md?raw";
import episode592 from "../../../content/changelog/the-changelog-592.md?raw";
import { formatClock, parseTranscript } from "../src/content/parse-transcript";

const sample = `**Ada:** Hello there.

**Grace:** \\[01:05\\] The queue is full.

Still waiting on disk.

**Jingle:** \\[59:32\\] to \\[59:52\\]

**Grace:** \\[01:04:14.03\\] The cache is warm. \\[laughs\\]
`;

describe("parseTranscript", () => {
  const cues = parseTranscript(sample);

  it("turns timestamped paragraphs into seek points", () => {
    expect(cues.map((cue) => cue.start)).toEqual([0, 65, 59 * 60 + 32, 3600 + 4 * 60 + 14.03]);
    expect(cues[0].paragraphs[0]).toEqual({ speaker: "Ada", text: "Hello there." });
    expect(cues[1].paragraphs).toEqual([
      { speaker: "Grace", text: "The queue is full." },
      { speaker: "Grace", text: "Still waiting on disk." }
    ]);
    expect(cues[2].paragraphs[0]).toEqual({ speaker: "Jingle", text: "" });
    expect(cues[3].paragraphs[0].text).toBe("The cache is warm. [laughs]");
  });

  it("formats clocks without the fractional seconds", () => {
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(3600 + 4 * 60 + 14.03)).toBe("1:04:14");
  });

  it("reads the vendored Changelog transcripts", () => {
    const zfs = parseTranscript(episode475);
    const cantrill = parseTranscript(episode592);
    const talos = parseTranscript(episode84);
    const gotime = parseTranscript(episode156);

    expect(zfs[1].start).toBe(4 * 60 + 2);
    expect(zfs.at(-1)?.start).toBe(1 * 3600 + 23 * 60 + 56.1);
    expect(zfs.length).toBeGreaterThan(20);
    expect(cantrill.length).toBeGreaterThan(30);
    expect(talos.length).toBeGreaterThan(10);
    expect(gotime.some((cue) => cue.start === 59 * 60 + 32)).toBe(true);
    expect(zfs.every((cue, index) => index === 0 || cue.start >= zfs[index - 1].start)).toBe(true);
  });
});
