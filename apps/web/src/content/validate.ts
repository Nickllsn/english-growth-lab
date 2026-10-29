import { pageReadings } from "./page-text";
import type { StudyDay, VocabKind, WeekPack } from "./types";

const VOCAB_KINDS: VocabKind[] = ["word", "phrase", "pattern"];
const STUDY_SLOTS = ["morning", "noon", "evening", "home"] as const;
const WEEKEND_SLOTS = ["preview", "review"] as const;
const FORMATS = ["text", "audio", "video"] as const;

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9'-]+/)
    .filter((word) => word.length >= 3);
}

function dayFormats(day: StudyDay): Set<string> {
  const formats = new Set(day.slots.flatMap((slot) => slot.links.flatMap((link) => link.formats)));
  if (day.shadow.length > 0) formats.add("text");
  return formats;
}

export function validateWeek(week: WeekPack): string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`${week.id}: ${message}`);

  if (!/^20\d{2}-W\d{2}$/.test(week.id)) at("周编号需要像 2026-W44");
  if (!week.title.trim() || !week.goal.trim()) at("标题和目标不能为空");
  if (!isIsoDate(week.startsOn) || !isIsoDate(week.endsOn)) at("起止日期无效");
  if (week.days.length !== 7) at("一周需要 7 天");

  week.days.forEach((day, index) => {
    const expected = addDays(week.startsOn, index);
    if (day.date !== expected) at(`${day.date} 应该是 ${expected}`);
    if (index < 5 && day.kind !== "study") at(`${day.date} 应该是学习日`);
    if (index >= 5 && day.kind !== "weekend") at(`${day.date} 应该是周末`);

    const expectedSlots = day.kind === "study" ? STUDY_SLOTS : WEEKEND_SLOTS;
    const actualSlots = day.slots.map((slot) => slot.id);
    if (actualSlots.join() !== expectedSlots.join()) {
      at(`${day.date} 的时段应为 ${expectedSlots.join("、")}`);
    }

    for (const slot of day.slots) {
      if (slot.steps.length < 2) at(`${day.date} ${slot.id} 至少两步`);
      if (day.kind === "study" && slot.id !== "home" && slot.minutes !== 20) {
        at(`${day.date} ${slot.id} 需要 20 分钟`);
      }
      if (slot.id === "home" && (slot.minutes < 10 || slot.minutes > 20)) {
        at(`${day.date} 跟读需要 10 到 20 分钟`);
      }
      for (const link of slot.links) {
        if (!link.url.startsWith("https://")) at(`${day.date} 链接需要 https`);
        if (link.formats.length === 0) at(`${day.date} ${link.title} 缺少格式`);
        const reading = pageReadings[link.url];
        if (!reading) at(`${day.date} 缺少页面文本：${link.url}`);
        else if (!/^[a-z0-9-]+\.mp3$/.test(reading.audio)) at(`${day.date} 朗读文件名无效：${link.url}`);
      }
    }

    const vocab = day.vocab ?? [];
    const seen = new Set<string>();
    if (day.kind === "weekend" && vocab.length > 0) at(`${day.date} 周末不放新的一列词汇`);
    if (day.kind === "study") {
      if (vocab.length < 6 || vocab.length > 8) at(`${day.date} 词汇需要 6 到 8 个`);
      const kinds = new Set(vocab.map((item) => item.kind));
      for (const kind of VOCAB_KINDS) {
        if (!kinds.has(kind)) at(`${day.date} 词汇需要包含${kind}`);
      }
    }
    for (const item of vocab) {
      if (seen.has(item.id)) at(`${day.date} 词汇编号重复：${item.id}`);
      seen.add(item.id);
      if (!item.id.startsWith(`${day.date}-`)) at(`${day.date} 词汇编号要以日期开头：${item.id}`);
      if (!VOCAB_KINDS.includes(item.kind)) at(`${day.date} 词汇类型无效：${item.text}`);
      if (item.text.split(/\s+/).length > 6) at(`${day.date} 词汇太长：${item.text}`);
      if (!/[\u4e00-\u9fff]/.test(item.meaning)) at(`${day.date} 词汇缺少中文：${item.text}`);
      if (/[\u4e00-\u9fff]/.test(item.example)) at(`${day.date} 例句要是英语：${item.text}`);
      if (item.example.split(/\s+/).length > 18) at(`${day.date} 例句太长：${item.text}`);
      if (!item.source.trim()) at(`${day.date} 词汇缺少来源：${item.text}`);
      const example = item.example.toLowerCase();
      for (const word of contentWords(item.text)) {
        if (!example.includes(word)) at(`${day.date} 例句没有用到 ${item.text}`);
      }
    }

    if (day.kind === "study") {
      if (day.chunks.length < 5 || day.chunks.length > 8) {
        at(`${day.date} 词块需要 5 到 8 个`);
      }
      if (day.shadow.length < 6 || day.shadow.length > 10) {
        at(`${day.date} 跟读稿需要 6 到 10 句`);
      }
      if (!day.speakPrompt.trim()) at(`${day.date} 缺少开口问题`);
      for (const format of FORMATS) {
        if (!dayFormats(day).has(format)) at(`${day.date} 缺少${format}材料`);
      }
    }
  });

  if (week.days[0]?.date !== week.startsOn || week.days[6]?.date !== week.endsOn) {
    at("起止日期和每天的日期不一致");
  }

  return errors;
}
