import type { StudyDay, WeekPack } from "./types";

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
