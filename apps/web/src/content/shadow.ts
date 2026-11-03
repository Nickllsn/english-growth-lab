import { findEpisode } from "./changelog-episodes";
import { parseTranscript } from "./parse-transcript";
import type { ListenWindow } from "./types";

function linesFrom(text: string): string[] {
  const lines: string[] = [];
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    const words = part.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length < 8) continue;
    const slice = words.length > 22 ? words.slice(0, 16) : words;
    let line = slice.join(" ");
    if (!/[.!?]$/.test(line)) line = `${line}.`;
    lines.push(line);
  }
  return lines;
}

export function pickShadow(window: ListenWindow): string[] {
  const episode = findEpisode(window.episodeId);
  if (!episode) return [];
  const cues = parseTranscript(episode.transcript, episode.cueStarts);
  const picked: string[] = [];
  for (let index = 0; index < cues.length; index += 1) {
    const cue = cues[index];
    const next = cues[index + 1]?.start ?? Number.POSITIVE_INFINITY;
    if (cue.start >= window.end || next <= window.start) continue;
    for (const paragraph of cue.paragraphs) {
      for (const line of linesFrom(paragraph.text)) {
        if (picked.includes(line)) continue;
        picked.push(line);
        if (picked.length === 8) return picked;
      }
    }
  }
  return picked;
}
