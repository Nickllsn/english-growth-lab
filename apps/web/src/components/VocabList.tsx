import type { VocabItem, VocabKind } from "../content/types";

const kindLabel: Record<VocabKind, string> = {
  word: "单词",
  phrase: "短语",
  pattern: "句型"
};

interface VocabListProps {
  items: VocabItem[];
  unknown: string[];
  onChange: (id: string, isUnknown: boolean) => void;
  heading?: string;
  showNote?: boolean;
}

export function VocabList({
  items,
  unknown,
  onChange,
  heading = "今天会听到的说法",
  showNote = true
}: VocabListProps) {
  if (items.length === 0) return null;
  const missed = new Set(unknown);

  return (
    <section className="vocab-block">
      <h3>{heading}</h3>
      {showNote && (
        <p className="vocab-note">
          这些词、短语和句型来自当天要听的 BBC 或视频字幕，只保留很短的说法。中文和例句是另写的，不是字幕原句。
        </p>
      )}
      <ul className="vocab-list">
        {items.map((item) => {
          const isUnknown = missed.has(item.id);
          return (
            <li className="vocab-card" key={item.id}>
              <p>
                <span className="vocab-kind">{kindLabel[item.kind]}</span>
                <strong>{item.text}</strong>
              </p>
              <span>{item.meaning}</span>
              <span className="vocab-example">{item.example}</span>
              <small>{item.source}</small>
              <div className="choice-row">
                <button
                  aria-label={`${item.text} 认识`}
                  aria-pressed={!isUnknown}
                  className="choice-button"
                  onClick={() => onChange(item.id, false)}
                  type="button"
                >
                  认识
                </button>
                <button
                  aria-label={`${item.text} 不认识`}
                  aria-pressed={isUnknown}
                  className="choice-button"
                  onClick={() => onChange(item.id, true)}
                  type="button"
                >
                  不认识
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
