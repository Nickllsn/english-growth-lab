export function acceptSelection(raw: string): string | null {
  const text = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
  if (!text || text.length > 240) return null;
  const words = text.split(" ");
  if (words.length > 20) return null;
  if (!words.every((word) => /[A-Za-z]/.test(word))) return null;
  return text;
}

export function sentenceAround(paragraph: string, selected: string): string {
  const compact = paragraph.replace(/\s+/g, " ").trim();
  const parts = compact.split(/(?<=[.!?])\s+/);
  const found = parts.find((part) => part.toLowerCase().includes(selected.toLowerCase()));
  const chosen = found ?? compact;
  return chosen.length > 400 ? `${chosen.slice(0, 400).trim()}…` : chosen;
}
