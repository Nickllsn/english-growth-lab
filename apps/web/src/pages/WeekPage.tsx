import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { weeks } from "../content/load";
import { resolveSession, shanghaiToday, weekdayLabel } from "../content/schedule";
import { MaterialView } from "../components/MaterialView";
import { VocabList } from "../components/VocabList";
import type { StudyDay } from "../content/types";
import { loadProgress, saveProgress, setUnknown, type ProgressState } from "../progress/store";

export function WeekPage({ today = shanghaiToday() }: { today?: string }) {
  const session = resolveSession(today, weeks);
  const [params] = useSearchParams();
  const focus = params.get("focus");
  const [weekId, setWeekId] = useState(session.week.id);
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const week = useMemo(() => weeks.find((item) => item.id === weekId) ?? session.week, [session.week, weekId]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{week.phase}</p>
          <h1>{week.title}</h1>
          <p>{week.goal}</p>
        </div>
        <label className="filter-field">
          周次
          <select onChange={(event) => setWeekId(event.target.value)} value={week.id}>
            {weeks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} {item.title}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="week-days">
        {week.days.map((day) => (
          <DayCard
            day={day}
            key={day.date}
            onVocab={(id, isUnknown) => setProgress((current) => setUnknown(current, id, isUnknown))}
            open={day.date === (focus ?? today)}
            unknown={progress.unknown}
          />
        ))}
      </div>
    </section>
  );
}

function DayCard({
  day,
  open,
  unknown,
  onVocab
}: {
  day: StudyDay;
  open: boolean;
  unknown: string[];
  onVocab: (id: string, isUnknown: boolean) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current && open) detailsRef.current.open = true;
  }, [open]);

  return (
    <details className="panel day-card" ref={detailsRef}>
      <summary>
        {weekdayLabel(day.date)} {day.date.slice(5)} · {day.theme}
      </summary>
      <p>{day.objective}</p>
      <VocabList items={day.vocab} onChange={onVocab} unknown={unknown} />
      {day.slots.map((slot) => (
        <section key={slot.id}>
          <h2>
            {slot.place} · {slot.minutes} 分钟 · {slot.title}
          </h2>
          <ol className="step-list">
            {slot.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {slot.links.map((link) => (
            <MaterialView key={link.url + link.title} link={link} showCaptions={slot.id === "evening"} />
          ))}
        </section>
      ))}
      {day.chunks.length > 0 && (
        <ul className="chunk-list">
          {day.chunks.map((chunk) => (
            <li key={chunk.text}>
              <strong>{chunk.text}</strong>
              <span>{chunk.meaning}</span>
            </li>
          ))}
        </ul>
      )}
      {day.shadow.length > 0 && (
        <ol className="shadow-list">
          {day.shadow.map((sentence) => (
            <li key={sentence}>{sentence}</li>
          ))}
        </ol>
      )}
    </details>
  );
}
