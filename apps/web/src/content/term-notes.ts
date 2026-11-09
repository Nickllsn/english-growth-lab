import notes from "../../../../content/progress/term-notes.json";

export interface TermNotePart {
  text: string;
  literal: string;
  here: string;
}

export interface TermNote {
  kind: "单词" | "短语" | "句型" | "专名";
  meaning: string;
  parts: TermNotePart[];
}

const table = notes as Record<string, TermNote>;

export function termNote(id: string): TermNote | undefined {
  return table[id];
}
