import { describe, expect, it } from "vitest";
import episode156 from "../../../content/changelog/go-time-156.md?raw";
import episode84 from "../../../content/changelog/ship-it-84.md?raw";
import episode475 from "../../../content/changelog/the-changelog-475.md?raw";
import episode592 from "../../../content/changelog/the-changelog-592.md?raw";
import timings475 from "../../../content/changelog/timings/475.json";
import timings156 from "../../../content/changelog/timings/gotime-156.json";
import { formatClock, parseTranscript } from "../src/content/parse-transcript";

const sample = `**Ada:** Hello there.

**Grace:** \\[01:05\\] The queue is full.

Still waiting on disk.

**Jingle:** \\[59:32\\] to \\[59:52\\]

**Grace:** \\[01:04:14.03\\] The cache is warm. \\[laughs\\]
`;

describe("parseTranscript", () => {
  const cues = parseTranscript(sample);

  it("gives every spoken turn its own time between the marked stamps", () => {
    expect(cues.map((cue) => cue.paragraphs[0].text)).toEqual([
      "Hello there.",
      "The queue is full.",
      "Still waiting on disk.",
      "",
      "The cache is warm. [laughs]"
    ]);
    expect(cues[0].start).toBe(0);
    expect(cues[1].start).toBe(65);
    expect(cues[2].start).toBeCloseTo(65 + ((59 * 60 + 32 - 65) * 4) / 8);
    expect(cues[3].start).toBe(59 * 60 + 32);
    expect(cues[4].start).toBeCloseTo(3600 + 4 * 60 + 14.03);
    expect(new Set(cues.map((cue) => cue.start)).size).toBe(cues.length);
  });

  it("keeps official stamps and uses aligned times for the other lines", () => {
    const aligned = parseTranscript(sample, [3, 70, 120, 3500, 3900]);

    expect(aligned.map((cue) => cue.start)).toEqual([3, 70, 120, 3500, 3900]);
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

    expect(zfs.some((cue) => cue.start === 4 * 60 + 2)).toBe(true);
    expect(zfs.some((cue) => Math.abs(cue.start - (1 * 3600 + 23 * 60 + 56.1)) < 0.01)).toBe(true);
    expect(zfs.length).toBeGreaterThan(100);
    expect(cantrill.length).toBeGreaterThan(30);
    expect(talos.length).toBeGreaterThan(10);
    expect(gotime.some((cue) => cue.start === 59 * 60 + 32)).toBe(true);
    expect(new Set(zfs.map((cue) => cue.start)).size).toBe(zfs.length);
    expect(zfs.every((cue, index) => index === 0 || cue.start > zfs[index - 1].start)).toBe(true);
  });

  it("places each ZFS line at the measured audio time", () => {
    const cues = parseTranscript(episode475, timings475.starts);
    const startOf = (prefix: string) => cues.find((cue) => cue.paragraphs[0].text.startsWith(prefix))?.start;

    expect(timings475.starts).toHaveLength(cues.length);
    expect(startOf("Yeah. I know the hosts")).toBe(242);
    expect(startOf("Yeah, yeah. You should go on the show.")).toBeGreaterThan(244);
    expect(startOf("Yeah, yeah. You should go on the show.")).toBeLessThan(249);
    expect(startOf("Sure. I joined Sun")).toBeGreaterThan(299);
    expect(startOf("Sure. I joined Sun")).toBeLessThan(303);
    expect(startOf("Wow.")).toBeGreaterThan(306);
    expect(startOf("Wow.")).toBeLessThan(309);
    expect(cues.every((cue, index) => index === 0 || cue.start > cues[index - 1].start)).toBe(true);
  });

  it("follows the spoken words when a printed timestamp has drifted", () => {
    const cues = parseTranscript(episode156, timings156.starts);
    const core = cues.find((cue) => cue.paragraphs[0].text.startsWith("When I was a CoreOS"));

    expect(timings156.starts).toHaveLength(cues.length);
    expect(core?.start).toBeGreaterThan(3360);
    expect(cues.every((cue, index) => index === 0 || cue.start > cues[index - 1].start)).toBe(true);
  });
});
