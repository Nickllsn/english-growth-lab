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

function weekday(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
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
  if (weekday(week.startsOn) !== 1 || addDays(week.startsOn, 6) !== week.endsOn) {
    at("一周要从周一开始，到周日结束");
  }
  if (week.days.length === 0) at("一周至少要有一天");

  week.days.forEach((day, index) => {
    if (!isIsoDate(day.date) || day.date < week.startsOn || day.date > week.endsOn) {
      at(`${day.date} 不在这一周里`);
    }
    if (index > 0 && day.date <= week.days[index - 1].date) at(`${day.date} 没有按日期排好`);
    const isWeekend = weekday(day.date) === 0 || weekday(day.date) === 6;
    if (isWeekend && day.kind !== "weekend") at(`${day.date} 应该是周末`);
    if (!isWeekend && day.kind !== "study") at(`${day.date} 应该是学习日`);

    const expectedSlots = day.kind === "study" ? STUDY_SLOTS : WEEKEND_SLOTS;
    const actualSlots = day.slots.map((slot) => slot.id);
    if (actualSlots.join() !== expectedSlots.join()) {
      at(`${day.date} 的时段应为 ${expectedSlots.join("、")}`);
    }

    for (const slot of day.slots) {
      if (slot.steps.length < 2) at(`${day.date} ${slot.id} 至少两步`);
      if (day.kind === "study" && slot.minutes !== 10) {
        at(`${day.date} ${slot.id} 需要 10 分钟`);
      }
      if ((slot.vocab ?? []).length > 0) at(`${day.date} ${slot.id} 不再预放词表`);
      for (const link of slot.links) {
        if (!link.url.startsWith("https://")) at(`${day.date} 链接需要 https`);
        if (link.formats.length === 0) at(`${day.date} ${link.title} 缺少格式`);
      }
    }

    if (day.listen) {
      if (!day.listen.episodeId.trim()) at(`${day.date} 缺少节目`);
      if (day.listen.end - day.listen.start !== 600) at(`${day.date} 收听需要 10 分钟`);
      if (day.shadow.length < 6 || day.shadow.length > 10) at(`${day.date} 跟读稿需要 6 到 10 句`);
      if (!day.speakPrompt.trim()) at(`${day.date} 缺少开口问题`);
      if (!dayFormats(day).has("text") || !dayFormats(day).has("audio")) {
        at(`${day.date} 需要文本和音频`);
      }
      return;
    }

    if (day.kind === "study") {
      if (!day.speakPrompt.trim()) at(`${day.date} 缺少开口问题`);
      for (const format of FORMATS) {
        if (!dayFormats(day).has(format)) at(`${day.date} 缺少${format}材料`);
      }
    }
  });

  return errors;
}
