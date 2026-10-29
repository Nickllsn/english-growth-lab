import type { VocabItem, WeekPack } from "../content/types";

const STORAGE_KEY = "egl.progress.v1";

export interface ProgressState {
  slots: Record<string, string[]>;
  reviews: Record<string, string>;
  unknown: string[];
}

export function emptyProgress(): ProgressState {
  return { slots: {}, reviews: {}, unknown: [] };
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
      unknown: stringList(parsed.unknown)
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

export function setUnknown(state: ProgressState, id: string, unknown: boolean): ProgressState {
  const next = new Set(state.unknown);
  if (unknown) next.add(id);
  else next.delete(id);
  return { ...state, unknown: [...next] };
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
  const missed = unknownItems(week, state);
  if (missed.length === 0) lines.push("（没有标记不认识）", "");
  else missed.forEach((item) => lines.push(`- ${item.text}：${item.meaning}`));
  lines.push("");
  return lines.join("\n");
}

export function unknownItems(week: WeekPack, state: ProgressState): VocabItem[] {
  const unknown = new Set(state.unknown);
  return week.days.flatMap((day) => day.vocab.filter((item) => unknown.has(item.id)));
}

export function parseProgress(raw: string): ProgressState {
  const parsed = JSON.parse(raw) as Partial<ProgressState>;
  if (!parsed.slots || !parsed.reviews) {
    throw new Error("这个文件不是学习进度");
  }
  return { slots: parsed.slots, reviews: parsed.reviews, unknown: stringList(parsed.unknown) };
}
