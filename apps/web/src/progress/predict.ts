import type { VocabItem } from "../content/types";
import type { ProgressState } from "./store";

export type VocabJudgement = "known" | "unknown" | "predicted-known" | "predicted-unknown";

export function normalizeVocabText(text: string): string {
  return text
    .toLowerCase()
    .replace(/…/g, " ")
    .replace(/[^a-z0-9'+ -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function judgeVocab(
  item: VocabItem,
  progress: Pick<ProgressState, "known" | "unknown">,
  catalog: VocabItem[]
): VocabJudgement {
  if (progress.known.includes(item.id)) return "known";
  if (progress.unknown.includes(item.id)) return "unknown";

  const text = normalizeVocabText(item.text);
  const known = catalog.filter((other) => progress.known.includes(other.id));
  const unknown = catalog.filter((other) => progress.unknown.includes(other.id));
  const sameKnown = known.some((other) => normalizeVocabText(other.text) === text);
  const sameUnknown = unknown.some((other) => normalizeVocabText(other.text) === text);
  if (sameUnknown) return "predicted-unknown";
  if (sameKnown) return "predicted-known";

  if (known.length === 0 && unknown.length === 0) return "predicted-unknown";

  const unknownFloor = unknown.length > 0 ? Math.min(...unknown.map((other) => other.level)) : 99;
  const knownCeiling = known.length > 0 ? Math.max(...known.map((other) => other.level)) : 0;
  if (unknown.length > 0 && item.level >= unknownFloor) return "predicted-unknown";
  if (item.level <= knownCeiling && item.level < unknownFloor) return "predicted-known";
  return "predicted-unknown";
}

export function isLikelyUnknown(judgement: VocabJudgement): boolean {
  return judgement === "unknown" || judgement === "predicted-unknown";
}
