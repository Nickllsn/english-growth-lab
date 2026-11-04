export interface TranscriptParagraph {
  speaker: string | null;
  text: string;
}

export interface TranscriptCue {
  start: number;
  paragraphs: TranscriptParagraph[];
}

const STAMP =
  /\\?\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2}(?:\.\d+)?)\\?\]/;

function stampSeconds(match: RegExpMatchArray): number {
  const hours = match[1] === undefined ? 0 : Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  return hours * 3600 + minutes * 60 + seconds;
}

function stampsIn(paragraph: string): number[] {
  const expression = new RegExp(STAMP.source, "g");
  return [...paragraph.matchAll(expression)].map((match) => stampSeconds(match));
}

function wordWeight(text: string): number {
  const count = text.split(/\s+/).filter(Boolean).length;
  return Math.max(count, 1);
}

function parseParagraph(raw: string): TranscriptParagraph | null {
  const withoutStamps = raw.replace(
    /\\?\[(?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d+)?\\?\]/g,
    " "
  );
  const unescaped = withoutStamps.replace(/\\\[([^\]]*)\\\]/g, "[$1]");
  const speakerMatch = unescaped.match(/^\*\*([^*]+):\*\*\s*([\s\S]*)$/);
  const speaker = speakerMatch ? speakerMatch[1].trim() : null;
  let text = (speakerMatch ? speakerMatch[2] : unescaped).replace(/\s+/g, " ").trim();
  if (/^to$/i.test(text)) text = "";
  if (!speaker && !text) return null;
  return { speaker, text };
}

export interface DraftParagraph extends TranscriptParagraph {
  stamp: number | null;
}

export function transcriptDrafts(source: string): DraftParagraph[] {
  const drafts: DraftParagraph[] = [];
  let speaker: string | null = null;

  for (const raw of source.trim().split(/\n\s*\n/)) {
    const parsed = parseParagraph(raw);
    if (!parsed) continue;
    if (parsed.speaker) speaker = parsed.speaker;
    const paragraph = parsed.speaker ? parsed : { ...parsed, speaker };
    const [stamp = null] = stampsIn(raw);
    drafts.push({ ...paragraph, stamp });
  }

  return drafts;
}

export function parseTranscript(source: string, alignedStarts?: readonly number[]): TranscriptCue[] {
  const drafts = transcriptDrafts(source);
  const starts =
    alignedStarts && alignedStarts.length === drafts.length
      ? constrainStarts(alignedStarts)
      : interpolatedStarts(drafts);
  return drafts.map((draft, index) => ({
    start: starts[index],
    paragraphs: [{ speaker: draft.speaker, text: draft.text }]
  }));
}

function constrainStarts(aligned: readonly number[]): number[] {
  const starts = aligned.map((time) => (Number.isFinite(time) ? time : 0));
  for (let index = 1; index < starts.length; index += 1) {
    if (starts[index] <= starts[index - 1]) starts[index] = starts[index - 1] + 0.05;
  }
  return starts;
}

function interpolatedStarts(drafts: DraftParagraph[]): number[] {
  return placeCues(drafts).map((cue) => cue.start);
}

function placeCues(drafts: DraftParagraph[]): TranscriptCue[] {
  const anchors = drafts.flatMap((draft, index) => (draft.stamp == null ? [] : [{ index, time: draft.stamp }]));
  const regions: { from: number; to: number; start: number; end: number }[] = [];
  const rate = speakingSecondsPerWord(drafts, anchors);

  if (anchors.length === 0) {
    const words = drafts.reduce((sum, draft) => sum + wordWeight(draft.text), 0);
    regions.push({ from: 0, to: drafts.length, start: 0, end: words * rate });
  } else {
    if (anchors[0].index > 0) {
      regions.push({ from: 0, to: anchors[0].index, start: 0, end: anchors[0].time });
    }
    anchors.forEach((anchor, index) => {
      const next = anchors[index + 1];
      const from = anchor.index;
      const to = next ? next.index : drafts.length;
      const words = drafts.slice(from, to).reduce((sum, draft) => sum + wordWeight(draft.text), 0);
      regions.push({
        from,
        to,
        start: anchor.time,
        end: next ? next.time : anchor.time + words * rate
      });
    });
  }

  const cues = regions.flatMap((region) => placeRegion(drafts.slice(region.from, region.to), region.start, region.end));
  for (let index = 1; index < cues.length; index += 1) {
    if (cues[index].start <= cues[index - 1].start) cues[index].start = cues[index - 1].start + 0.05;
  }
  return cues;
}

function speakingSecondsPerWord(
  drafts: DraftParagraph[],
  anchors: { index: number; time: number }[]
): number {
  if (anchors.length < 2) return 0.4;
  const words = drafts
    .slice(anchors[0].index, anchors[anchors.length - 1].index)
    .reduce((sum, draft) => sum + wordWeight(draft.text), 0);
  const seconds = anchors[anchors.length - 1].time - anchors[0].time;
  if (words <= 0 || seconds <= 0) return 0.4;
  return seconds / words;
}

function placeRegion(drafts: DraftParagraph[], start: number, end: number): TranscriptCue[] {
  const weights = drafts.map((draft) => wordWeight(draft.text));
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const span = Math.max(end - start, 0);
  let spoken = 0;
  return drafts.map((draft, index) => {
    const at = draft.stamp == null ? start + (spoken / total) * span : draft.stamp;
    spoken += weights[index];
    return {
      start: at,
      paragraphs: [{ speaker: draft.speaker, text: draft.text }]
    };
  });
}

export function formatClock(seconds: number): string {
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remain = whole % 60;
  const padded = String(remain).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${padded}`;
  return `${minutes}:${padded}`;
}

export function segmentStop(cues: TranscriptCue[], end: number | undefined): number | null {
  if (end == null || !Number.isFinite(end)) return null;
  return cues.find((cue) => cue.start >= end)?.start ?? end;
}

export function activeCueIndex(cues: TranscriptCue[], seconds: number): number {
  let index = 0;
  for (let i = 0; i < cues.length; i += 1) {
    if (cues[i].start <= seconds + 0.2) index = i;
    else break;
  }
  return index;
}
