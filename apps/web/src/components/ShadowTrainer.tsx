import { useState } from "react";

interface ShadowTrainerProps {
  sentences: string[];
}

export function ShadowTrainer({ sentences }: ShadowTrainerProps) {
  const [index, setIndex] = useState(0);
  const [onlyCurrent, setOnlyCurrent] = useState(false);
  const current = sentences[index] ?? "";

  if (sentences.length === 0) return null;

  return (
    <div className="shadow-box">
      <div className="section-heading">
        <h2>跟读稿</h2>
        <span>
          {index + 1} / {sentences.length}
        </span>
      </div>
      <ol className="shadow-list">
        {sentences.map((sentence, sentenceIndex) => {
          const active = sentenceIndex === index;
          if (onlyCurrent && !active) return null;
          return (
            <li className={active ? "shadow-line active" : "shadow-line"} key={sentence}>
              {sentence}
            </li>
          );
        })}
      </ol>
      <p className="speak-prompt">现在读：{current}</p>
      <div className="button-row">
        <button
          className="secondary-button"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          type="button"
        >
          上一句
        </button>
        <button
          className="primary-button"
          onClick={() => setIndex((value) => Math.min(sentences.length - 1, value + 1))}
          type="button"
        >
          下一句
        </button>
        <button
          className="secondary-button"
          onClick={() => setOnlyCurrent((value) => !value)}
          type="button"
        >
          {onlyCurrent ? "看全部" : "只看当前句"}
        </button>
      </div>
    </div>
  );
}
