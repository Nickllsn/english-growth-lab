import { type FormEvent, useEffect, useState } from "react";
import {
  getEntries,
  getEntry,
  getRoadmap,
  saveEntry,
  type DailyEntry,
  type RoadmapDay
} from "../api/client";
import { ExpressionFields } from "../components/ExpressionFields";

interface TodayPageProps {
  today?: string;
}

function localDate(): string {
  return new Date().toLocaleDateString("en-CA");
}

function emptyEntry(date: string, day: RoadmapDay): DailyEntry {
  return {
    date,
    roadmapDay: day.day,
    topic: day.theme,
    material: { title: "", url: day.source.url, source: day.source.name },
    readingMinutes: day.suggestedMinutes.reading,
    listeningMinutes: day.suggestedMinutes.listening,
    understanding: 3,
    expressions: Array.from({ length: 3 }, () => ({
      text: "",
      meaning: "",
      usedInSummary: false
    })),
    summary: ""
  };
}

export function TodayPage({ today = localDate() }: TodayPageProps) {
  const [day, setDay] = useState<RoadmapDay | null>(null);
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [loadingError, setLoadingError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    void Promise.all([getRoadmap(), getEntries(), getEntry(today)])
      .then(([roadmap, entries, existing]) => {
        if (!active) return;
        const current =
          roadmap[Math.min(entries.filter((item) => item.completedAt).length, 29)] ??
          roadmap[0];
        if (!current) {
          throw new Error("学习路线为空");
        }

        const draftKey = `egl:draft:${today}`;
        const draft = localStorage.getItem(draftKey);
        setDay(current);
        setEntry(
          existing ??
            (draft ? (JSON.parse(draft) as DailyEntry) : emptyEntry(today, current))
        );
      })
      .catch(() => {
        if (active) setLoadingError("今天的学习任务加载失败，请刷新重试");
      });

    return () => {
      active = false;
    };
  }, [today]);

  useEffect(() => {
    if (entry && !entry.completedAt) {
      localStorage.setItem(`egl:draft:${today}`, JSON.stringify(entry));
    }
  }, [entry, today]);

  const update = (patch: Partial<DailyEntry>) => {
    setSaved(false);
    setEntry((current) => (current ? { ...current, ...patch } : current));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!entry) return;

    const validExpressions = entry.expressions.filter(
      ({ text, meaning }) => text.trim() && meaning.trim()
    );
    if (validExpressions.length < 3) {
      setValidationError("请至少记录 3 个英文表达");
      return;
    }
    if ((entry.summary.match(/[.!?]+(?=\s|$)/g) ?? []).length < 3) {
      setValidationError("请至少写 3 句英文总结");
      return;
    }

    setValidationError("");
    const completed = {
      ...entry,
      expressions: validExpressions,
      completedAt: new Date().toISOString()
    };
    try {
      const result = await saveEntry(today, completed);
      setEntry(result);
      setSaved(true);
      localStorage.removeItem(`egl:draft:${today}`);
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "今天的成果保存失败"
      );
    }
  };

  if (loadingError) {
    return <p className="error-message">{loadingError}</p>;
  }
  if (!day || !entry) {
    return <p>正在准备今天的学习任务…</p>;
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">DAY {day.day} · WEEK {day.week}</p>
          <h1>{day.theme}</h1>
          <p>{day.focus}</p>
        </div>
        <a href={day.source.url} target="_blank" rel="noreferrer">
          打开 {day.source.name}
        </a>
      </header>

      <div className="time-plan">
        <span>阅读 {day.suggestedMinutes.reading} 分钟</span>
        <span>听力 {day.suggestedMinutes.listening} 分钟</span>
        <span>输出 {day.suggestedMinutes.output} 分钟</span>
      </div>

      <form className="entry-form" noValidate onSubmit={submit}>
        <div className="form-grid">
          <label>
            材料标题
            <input
              value={entry.material.title}
              onChange={(event) =>
                update({
                  material: { ...entry.material, title: event.target.value }
                })
              }
              required
            />
          </label>
          <label>
            材料链接
            <input
              type="url"
              value={entry.material.url}
              onChange={(event) =>
                update({
                  material: { ...entry.material, url: event.target.value }
                })
              }
              required
            />
          </label>
          <label>
            材料来源
            <input
              value={entry.material.source}
              onChange={(event) =>
                update({
                  material: { ...entry.material, source: event.target.value }
                })
              }
              required
            />
          </label>
          <label>
            理解度
            <select
              value={entry.understanding}
              onChange={(event) =>
                update({ understanding: Number(event.target.value) })
              }
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>
          <label>
            阅读分钟
            <input
              type="number"
              min="0"
              value={entry.readingMinutes}
              onChange={(event) =>
                update({ readingMinutes: Number(event.target.value) })
              }
            />
          </label>
          <label>
            听力分钟
            <input
              type="number"
              min="0"
              value={entry.listeningMinutes}
              onChange={(event) =>
                update({ listeningMinutes: Number(event.target.value) })
              }
            />
          </label>
        </div>

        <ExpressionFields
          expressions={entry.expressions}
          onChange={(expressions) => update({ expressions })}
        />

        <label>
          英文总结
          <textarea
            rows={7}
            value={entry.summary}
            onChange={(event) => update({ summary: event.target.value })}
            placeholder="Write at least three sentences in your own words."
          />
        </label>

        {validationError && (
          <p className="error-message" role="alert">
            {validationError}
          </p>
        )}
        {saved && (
          <div className="success-message" role="status">
            <strong>今天的成果已保存</strong>
            <span>学习成果已写入 data/entries，记得提交 Git。</span>
          </div>
        )}
        <button className="primary-button" type="submit">
          完成今日学习
        </button>
      </form>
    </section>
  );
}
