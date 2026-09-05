import { useEffect, useMemo, useState } from "react";
import {
  getEntries,
  getRoadmap,
  type DailyEntry,
  type RoadmapDay
} from "../api/client";

const weekNames: Record<number, string> = {
  1: "Linux 与性能",
  2: "工程与架构",
  3: "AI、科技与工程讨论",
  4: "商业、产品与思维"
};

export function RoadmapPage() {
  const [days, setDays] = useState<RoadmapDay[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([getRoadmap(), getEntries()])
      .then(([nextDays, nextEntries]) => {
        if (!active) return;
        setDays(nextDays);
        setEntries(nextEntries);
      })
      .catch(() => {
        if (active) setError("学习路线加载失败，请刷新重试");
      });
    return () => {
      active = false;
    };
  }, []);

  const completedDays = useMemo(
    () =>
      new Set(
        entries
          .filter((entry) => entry.completedAt)
          .map((entry) => entry.roadmapDay)
      ),
    [entries]
  );
  const currentDay = Math.min(completedDays.size + 1, 30);

  if (error) return <p className="error-message">{error}</p>;
  if (!days.length) return <p>正在展开 30 天学习路线…</p>;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">ROADMAP</p>
          <h1>从技术出发，走向更大的世界</h1>
          <p>四周逐步扩大视野；每天只需完成一个清晰的小闭环。</p>
        </div>
      </header>

      {[1, 2, 3, 4].map((week) => (
        <section className="roadmap-week" key={week}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">STAGE {week}</p>
              <h2>第 {week} 周</h2>
            </div>
            <span>{weekNames[week]}</span>
          </div>
          <div className="roadmap-grid">
            {days
              .filter((day) => day.week === week)
              .map((day) => {
                const state = completedDays.has(day.day)
                  ? "已完成"
                  : day.day === currentDay
                    ? "当前任务"
                    : "未开始";
                return (
                  <article
                    aria-label={`DAY ${day.day}：${state}`}
                    className={`roadmap-card ${state === "已完成" ? "completed" : ""} ${state === "当前任务" ? "current" : ""}`}
                    key={day.day}
                  >
                    <div className="output-meta">
                      <span>DAY {day.day}</span>
                      <span>{state}</span>
                    </div>
                    <h3>{day.theme}</h3>
                    <p>{day.focus}</p>
                    <footer>
                      <a href={day.source.url} target="_blank" rel="noreferrer">
                        {day.source.name}
                      </a>
                      <span>难度 {day.source.difficulty} / 5</span>
                    </footer>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </section>
  );
}
