import { useState } from "react";
import type { VocabItem, VocabKind } from "../content/types";
import { isLikelyUnknown, judgeVocab, type VocabJudgement } from "../progress/predict";

const kindLabel: Record<VocabKind, string> = {
  word: "单词",
  phrase: "短语",
  pattern: "句型"
};

const badgeLabel: Record<VocabJudgement, string> = {
  known: "认识",
  unknown: "不认识",
  "predicted-known": "可能认识",
  "predicted-unknown": "可能不认识"
};

interface VocabListProps {
  items: VocabItem[];
  known: string[];
  unknown: string[];
  catalog: VocabItem[];
  onMark: (id: string, mark: "known" | "unknown") => void;
  heading?: string;
  showNote?: boolean;
}

export function VocabList({
  items,
  known,
  unknown,
  catalog,
  onMark,
  heading = "这一时段的进阶重点",
  showNote = true
}: VocabListProps) {
  const [onlyLikely, setOnlyLikely] = useState(true);
  if (items.length === 0) return null;

  const progress = { known, unknown };
  const visible = items
    .map((item) => ({ item, judgement: judgeVocab(item, progress, catalog) }))
    .filter((row) => !onlyLikely || isLikelyUnknown(row.judgement));

  return (
    <section className="vocab-block">
      {heading && <h3>{heading}</h3>}
      {showNote && (
        <p className="vocab-note">
          这些是从这一时段的完整字幕，或链接里的文档挑出的进阶重点，按已经通过四级、接近六级来估。中文和例句是另写的，不是字幕原句。你标过认识或不认识之后，后面的材料会按你标的不认识重估。
        </p>
      )}
      <button
        aria-pressed={onlyLikely}
        className="choice-button"
        onClick={() => setOnlyLikely((current) => !current)}
        type="button"
      >
        只看可能不认识
      </button>
      {visible.length === 0 && <p className="vocab-note">按你的标记，这一时段没有估出来的生词。</p>}
      <ul className="vocab-list">
        {visible.map(({ item, judgement }) => (
          <li className="vocab-card" key={item.id}>
            <p>
              <span className="vocab-kind">{kindLabel[item.kind]}</span>
              <strong>{item.text}</strong>
            </p>
            <span className={`vocab-badge ${judgement}`}>{badgeLabel[judgement]}</span>
            <span>{item.meaning}</span>
            <span className="vocab-example">{item.example}</span>
            <small>{item.source}</small>
            <div className="choice-row">
              <button
                aria-label={`${item.text} 认识`}
                aria-pressed={judgement === "known"}
                className="choice-button"
                onClick={() => onMark(item.id, "known")}
                type="button"
              >
                认识
              </button>
              <button
                aria-label={`${item.text} 不认识`}
                aria-pressed={judgement === "unknown"}
                className="choice-button"
                onClick={() => onMark(item.id, "unknown")}
                type="button"
              >
                不认识
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
