import { formatClock } from "../content/parse-transcript";
import type { VocabItem, WeekPack } from "../content/types";

const STORAGE_KEY = "egl.progress.v1";

export interface LearningTerm {
  id: string;
  text: string;
  episodeId: string;
  episodeTitle: string;
  start: number;
  speaker: string | null;
  sentence: string;
  addedAt: string;
}

export interface TermDraft {
  text: string;
  episodeId: string;
  episodeTitle: string;
  start: number;
  speaker: string | null;
  sentence: string;
}

export interface ProgressState {
  slots: Record<string, string[]>;
  reviews: Record<string, string>;
  known: string[];
  unknown: string[];
  terms: LearningTerm[];
}

export function emptyProgress(): ProgressState {
  return { slots: {}, reviews: {}, known: [], unknown: [], terms: [] };
}

export function termId(episodeId: string, text: string): string {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  return `${episodeId}:${normalized}`;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function loadProgress(): ProgressState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyProgress();
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      slots: parsed.slots ?? {},
      reviews: parsed.reviews ?? {},
      known: stringList(parsed.known),
      unknown: stringList(parsed.unknown),
      terms: termList(parsed.terms)
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function toggleSlot(state: ProgressState, date: string, slotId: string): ProgressState {
  const current = new Set(state.slots[date] ?? []);
  if (current.has(slotId)) current.delete(slotId);
  else current.add(slotId);
  return {
    ...state,
    slots: { ...state.slots, [date]: [...current] }
  };
}

export function setMark(state: ProgressState, id: string, mark: "known" | "unknown"): ProgressState {
  const known = new Set(state.known);
  const unknown = new Set(state.unknown);
  const already = mark === "known" ? known.has(id) : unknown.has(id);
  known.delete(id);
  unknown.delete(id);
  if (!already) {
    if (mark === "known") known.add(id);
    else unknown.add(id);
  }
  return { ...state, known: [...known], unknown: [...unknown] };
}

export function addTerm(state: ProgressState, draft: TermDraft, addedAt = new Date().toISOString()): ProgressState {
  const id = termId(draft.episodeId, draft.text);
  if (!id.endsWith(":") && state.terms.some((term) => term.id === id)) return state;
  if (id.endsWith(":")) return state;
  return {
    ...state,
    terms: [...state.terms, { ...draft, id, addedAt }]
  };
}

export function removeTerm(state: ProgressState, id: string): ProgressState {
  return { ...state, terms: state.terms.filter((term) => term.id !== id) };
}

export function downloadProgress(progress: ProgressState): void {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "english-progress.json";
  link.click();
  URL.revokeObjectURL(url);
}

export function isComplete(required: string[], done: string[] | undefined): boolean {
  const finished = new Set(done ?? []);
  return required.length > 0 && required.every((slotId) => finished.has(slotId));
}

export function completedDates(weeks: WeekPack[], state: ProgressState): Set<string> {
  const dates = new Set<string>();
  for (const week of weeks) {
    for (const day of week.days) {
      if (isComplete(day.slots.map((slot) => slot.id), state.slots[day.date])) {
        dates.add(day.date);
      }
    }
  }
  return dates;
}

export function currentStreak(dates: Set<string>, today: string): number {
  let cursor = today;
  if (!dates.has(cursor)) {
    const [year, month, day] = today.split("-").map(Number);
    const previous = new Date(Date.UTC(year, month - 1, day));
    previous.setUTCDate(previous.getUTCDate() - 1);
    cursor = previous.toISOString().slice(0, 10);
  }
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    const [year, month, day] = cursor.split("-").map(Number);
    const previous = new Date(Date.UTC(year, month - 1, day));
    previous.setUTCDate(previous.getUTCDate() - 1);
    cursor = previous.toISOString().slice(0, 10);
  }
  return streak;
}

export function weekMarkdown(week: WeekPack, state: ProgressState): string {
  const lines = [`# ${week.id} ${week.title}`, "", week.goal, ""];
  for (const day of week.days) {
    const done = state.slots[day.date] ?? [];
    const marks = day.slots
      .map((slot) => `${done.includes(slot.id) ? "x" : " " } ${slot.place}`)
      .join("，");
    lines.push(`- ${day.date} ${day.theme}：${marks}`);
  }
  lines.push("", "## 周末复盘", "", state.reviews[week.id]?.trim() || "（还没写）", "");
  lines.push("## 还不认识", "");
  const episodeIds = new Set(week.days.map((day) => day.listen?.episodeId).filter((id): id is string => Boolean(id)));
  const terms = state.terms.filter((term) => episodeIds.has(term.episodeId));
  if (terms.length === 0) lines.push("（没有从文字稿加入的生词）", "");
  else {
    terms.forEach((term) => {
      lines.push(`- ${term.text}`);
      lines.push(`  ${term.episodeTitle} ${formatClock(term.start)}：${term.sentence}`);
    });
    lines.push("");
  }
  return lines.join("\n");
}

export function unknownItems(week: WeekPack, state: ProgressState): VocabItem[] {
  const unknown = new Set(state.unknown);
  return week.days.flatMap((day) => day.slots.flatMap((slot) => slot.vocab.filter((item) => unknown.has(item.id))));
}

export function parseProgress(raw: string): ProgressState {
  const parsed = JSON.parse(raw) as Partial<ProgressState>;
  if (!parsed.slots || !parsed.reviews) {
    throw new Error("这个文件不是学习进度");
  }
  return {
    slots: parsed.slots,
    reviews: parsed.reviews,
    known: stringList(parsed.known),
    unknown: stringList(parsed.unknown),
    terms: termList(parsed.terms)
  };
}

function termList(value: unknown): LearningTerm[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTerm);
}

function isTerm(value: unknown): value is LearningTerm {
  if (!value || typeof value !== "object") return false;
  const term = value as Partial<LearningTerm>;
  return (
    typeof term.id === "string" &&
    typeof term.text === "string" &&
    typeof term.episodeId === "string" &&
    typeof term.episodeTitle === "string" &&
    typeof term.start === "number" &&
    (term.speaker === null || typeof term.speaker === "string") &&
    typeof term.sentence === "string" &&
    typeof term.addedAt === "string"
  );
}
