import { useEffect, useState } from "react";
import { weeks } from "../content/load";
import { weekdayLabel } from "../content/schedule";
import { VocabList } from "../components/VocabList";
import { loadProgress, saveProgress, setUnknown, type ProgressState } from "../progress/store";

export function VocabPage() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const unknown = new Set(progress.unknown);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">跟着进度一起导出</p>
          <h1>不认识的说法</h1>
          <p>这里只留下你点过「不认识」的词、短语和句型，按周分开。认识了就点掉。</p>
        </div>
      </header>
      {weeks.map((week) => {
        const days = week.days.filter((day) => day.vocab.some((item) => unknown.has(item.id)));
        return (
          <section className="panel" key={week.id}>
            <h2>{week.title}</h2>
            {days.length === 0 && <p>这一周没有不认识的项。</p>}
            {days.map((day) => (
              <VocabList
                heading={`${weekdayLabel(day.date)} · ${day.theme}`}
                items={day.vocab.filter((item) => unknown.has(item.id))}
                key={day.date}
                onChange={(id, isUnknown) => setProgress((current) => setUnknown(current, id, isUnknown))}
                showNote={false}
                unknown={progress.unknown}
              />
            ))}
          </section>
        );
      })}
    </section>
  );
}
