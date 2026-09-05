import { useEffect, useState } from "react";
import {
  getEntries,
  getProgress,
  type DailyEntry,
  type ProgressStats
} from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { StreakCalendar } from "../components/StreakCalendar";
import { UnderstandingChart } from "../components/UnderstandingChart";

export function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([getProgress(), getEntries()])
      .then(([nextStats, nextEntries]) => {
        if (!active) return;
        setStats(nextStats);
        setEntries(nextEntries);
      })
      .catch(() => {
        if (active) setError("进度加载失败，请刷新重试");
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="error-message">{error}</p>;
  if (!stats) return <p>正在整理你的学习进度…</p>;

  const completedDates = new Set(
    entries.filter((entry) => entry.completedAt).map((entry) => entry.date)
  );

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">PROGRESS</p>
          <h1>一点点，正在变成很多</h1>
          <p>每个数字都来自你真正读过、听过和写下的内容。</p>
        </div>
      </header>

      <div className="metric-grid">
        <MetricCard
          label="当前连续"
          value={`连续 ${stats.currentStreak} 天`}
          detail={`最长 ${stats.longestStreak} 天`}
        />
        <MetricCard
          label="30 天路线"
          value={`完成 ${stats.completionRate}%`}
          detail={`${stats.completedDays} / 30 天`}
        />
        <MetricCard
          label="累计投入"
          value={`${stats.totalMinutes} 分钟`}
          detail={`阅读 ${stats.readingMinutes} · 听力 ${stats.listeningMinutes}`}
        />
        <MetricCard
          label="英文输出"
          value={`${stats.englishWordCount} 个词`}
          detail={`已积累 ${stats.expressionCount} 条可复用表达`}
        />
        <MetricCard
          label="表达积累"
          value={`${stats.expressionCount} 个表达`}
          detail={`已复用 ${stats.reusedExpressionCount} 次`}
        />
      </div>

      <StreakCalendar completedDates={completedDates} />
      <UnderstandingChart data={stats.weeklyUnderstanding} />
    </section>
  );
}
