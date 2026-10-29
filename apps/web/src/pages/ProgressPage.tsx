import { useState } from "react";
import { weeks } from "../content/load";
import { shanghaiToday } from "../content/schedule";
import { MetricCard } from "../components/MetricCard";
import { StreakCalendar } from "../components/StreakCalendar";
import {
  completedDates,
  currentStreak,
  loadProgress,
  parseProgress,
  saveProgress,
  weekMarkdown,
  type ProgressState
} from "../progress/store";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("这个文件不是学习进度"));
    reader.readAsText(file);
  });
}

export function ProgressPage({ today = shanghaiToday() }: { today?: string }) {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [message, setMessage] = useState("");
  const done = completedDates(weeks, progress);
  const studyDays = weeks.flatMap((week) => week.days.filter((day) => day.kind === "study"));
  const finishedStudyDays = studyDays.filter((day) => done.has(day.date)).length;

  const update = (next: ProgressState) => {
    setProgress(next);
    saveProgress(next);
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "english-progress.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      update(parseProgress(await readFile(file)));
      setMessage("进度已导入");
    } catch {
      setMessage("这个文件不是学习进度");
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">只统计已发布的周</p>
          <h1>进度</h1>
          <p>完成是指当天每个时段都打了卡。记录只在这台浏览器里。</p>
        </div>
      </header>
      <div className="metric-grid">
        <MetricCard detail="学习日" label="已完成" value={`${finishedStudyDays} / ${studyDays.length}`} />
        <MetricCard detail="含周末，中断就重新计" label="连续天数" value={`${currentStreak(done, today)} 天`} />
      </div>
      <StreakCalendar completedDates={done} today={today} />
      <section className="panel">
        <div className="section-heading">
          <h2>换设备</h2>
        </div>
        <div className="button-row">
          <button className="primary-button" onClick={exportFile} type="button">
            导出进度
          </button>
          <label className="secondary-button file-button">
            导入进度
            <input
              accept="application/json"
              aria-label="导入进度"
              onChange={(event) => void importFile(event.target.files?.[0])}
              type="file"
            />
          </label>
        </div>
        {message && <p className="success-message">{message}</p>}
        <p className="save-note">导出的 english-progress.json 里有打卡 slots、每周复盘 reviews，还有不认识的说法 unknown。导入会写回复盘框和词汇页。</p>
      </section>
      {weeks.map((week) => (
        <section className="panel" key={week.id}>
          <div className="section-heading">
            <h2>{week.title}</h2>
            <button
              className="secondary-button"
              onClick={() => {
                void navigator.clipboard?.writeText(weekMarkdown(week, progress));
                setMessage(`已复制 ${week.id} 的复盘`);
              }}
              type="button"
            >
              复制复盘
            </button>
          </div>
          <label className="review-field">
            {week.id} 复盘
            <textarea
              aria-label={`${week.id} 复盘`}
              onChange={(event) => {
                const text = event.target.value;
                setProgress((current) => {
                  const next = {
                    ...current,
                    reviews: { ...current.reviews, [week.id]: text }
                  };
                  saveProgress(next);
                  return next;
                });
              }}
              placeholder="用英语写。不要写公司机密。"
              rows={6}
              value={progress.reviews[week.id] ?? ""}
            />
          </label>
          <pre className="markdown-output">{weekMarkdown(week, progress)}</pre>
        </section>
      ))}
    </section>
  );
}
