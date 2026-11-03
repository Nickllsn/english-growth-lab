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

function firstStamp(paragraph: string): number | null {
  const match = paragraph.match(STAMP);
  return match ? stampSeconds(match) : null;
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

export function parseTranscript(source: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  let current: TranscriptCue | null = null;
  let speaker: string | null = null;

  for (const raw of source.trim().split(/\n\s*\n/)) {
    const start: number = firstStamp(raw) ?? current?.start ?? 0;
    const parsed = parseParagraph(raw);
    if (!parsed) continue;
    if (parsed.speaker) speaker = parsed.speaker;
    const paragraph = parsed.speaker ? parsed : { ...parsed, speaker };
    if (!current || current.start !== start) {
      current = { start, paragraphs: [] };
      cues.push(current);
    }
    current.paragraphs.push(paragraph);
  }

  return cues;
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

export function activeCueIndex(cues: TranscriptCue[], seconds: number): number {
  let index = 0;
  for (let i = 0; i < cues.length; i += 1) {
    if (cues[i].start <= seconds + 0.2) index = i;
    else break;
  }
  return index;
}
