import { useEffect, useState } from "react";
import { allVocab, weeks } from "../content/load";
import { weekdayLabel } from "../content/schedule";
import type { StudyDay } from "../content/types";
import { VocabList } from "../components/VocabList";
import { isLikelyUnknown, judgeVocab } from "../progress/predict";
import { loadProgress, saveProgress, setMark, type ProgressState } from "../progress/store";

const catalog = allVocab();

const slotLabel = {
  morning: "早听",
  noon: "午读",
  evening: "晚听"
} as const;

export function VocabPage() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [view, setView] = useState<"marked" | "likely">("marked");

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const unknown = new Set(progress.unknown);
  const onMark = (id: string, mark: "known" | "unknown") => setProgress((current) => setMark(current, id, mark));

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">跟着进度一起导出</p>
          <h1>不认识的说法</h1>
          <p>默认只留下你点过「不认识」的词、短语和句型。点「可能不认识」会按这些标记，估后面材料里你可能还不认识的说法。还没标记时，这一份就是基线。</p>
        </div>
      </header>
      <div className="choice-row">
        <button
          aria-pressed={view === "marked"}
          className="choice-button"
          onClick={() => setView("marked")}
          type="button"
        >
          已标不认识
        </button>
        <button
          aria-pressed={view === "likely"}
          className="choice-button"
          onClick={() => setView("likely")}
          type="button"
        >
          可能不认识
        </button>
      </div>
      {view === "marked" &&
        weeks.map((week) => {
          const days = week.days
            .map((day) => ({ day, items: markedItems(day, unknown) }))
            .filter((entry) => entry.items.length > 0);
          return (
            <section className="panel" key={week.id}>
              <h2>{week.title}</h2>
              {days.length === 0 && <p>这一周没有不认识的项。</p>}
              {days.map(({ day, items }) => (
                <VocabList
                  catalog={catalog}
                  heading={`${weekdayLabel(day.date)} · ${day.theme}`}
                  items={items}
                  key={day.date}
                  known={progress.known}
                  onMark={onMark}
                  showNote={false}
                  unknown={progress.unknown}
                />
              ))}
            </section>
          );
        })}
      {view === "likely" &&
        weeks.map((week) => {
          const days = week.days.filter((day) => day.kind === "study");
          const any = days.some((day) =>
            day.slots.some((slot) =>
              slot.vocab.some((item) => isLikelyUnknown(judgeVocab(item, progress, catalog)))
            )
          );
          return (
            <section className="panel" key={week.id}>
              <h2>{week.title}</h2>
              {!any && <p>按你的标记，这一周没有估出来的生词。</p>}
              {days.map((day) =>
                day.slots
                  .filter((slot): slot is StudyDay["slots"][number] & { id: keyof typeof slotLabel } =>
                    slot.id === "morning" || slot.id === "noon" || slot.id === "evening"
                  )
                  .filter((slot) => slot.vocab.some((item) => isLikelyUnknown(judgeVocab(item, progress, catalog))))
                  .map((slot) => (
                    <VocabList
                      catalog={catalog}
                      heading={`${weekdayLabel(day.date)} ${day.date.slice(5)} · ${slotLabel[slot.id]}`}
                      items={slot.vocab}
                      key={`${day.date}-${slot.id}`}
                      known={progress.known}
                      onMark={onMark}
                      showNote={false}
                      unknown={progress.unknown}
                    />
                  ))
              )}
            </section>
          );
        })}
    </section>
  );
}

function markedItems(day: StudyDay, unknown: Set<string>) {
  const seen = new Set<string>();
  return day.slots.flatMap((slot) =>
    slot.vocab.filter((item) => {
      if (!unknown.has(item.id) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
  );
}
