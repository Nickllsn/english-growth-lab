import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { weeks } from "../content/load";
import { findEpisode } from "../content/changelog-episodes";
import { nextWeek, resolveSession, shanghaiToday, weekdayLabel } from "../content/schedule";
import type { SlotPlan, StudyDay, WeekPack } from "../content/types";
import { MaterialView } from "../components/MaterialView";
import { ShadowTrainer } from "../components/ShadowTrainer";
import { TranscriptPlayer } from "../components/TranscriptPlayer";
import { addTerm, loadProgress, saveProgress, toggleSlot, type ProgressState, type TermDraft } from "../progress/store";

const slotLabel: Record<SlotPlan["id"], string> = {
  morning: "早听",
  noon: "午读",
  evening: "晚听",
  home: "跟读",
  preview: "预习",
  review: "复盘"
};

const previewTasks = [
  { id: "open", label: "下一周每一天的播客都能打开" },
  { id: "goals", label: "读过每一天的目标" },
  { id: "sample", label: "每一段只听了前 2 分钟" }
];

interface TodayPageProps {
  today?: string;
}

export function TodayPage({ today = shanghaiToday() }: TodayPageProps) {
  const session = resolveSession(today, weeks);
  const day = session.mode === "day" ? session.day : undefined;
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [slotId, setSlotId] = useState<SlotPlan["id"]>(day?.slots[0].id ?? "preview");

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const activeSlot = day?.slots.find((slot) => slot.id === slotId) ?? day?.slots[0];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            {session.week.id} · {session.week.phase} · 上海时间 {today}
          </p>
          <h1>
            {session.mode === "day"
              ? day?.theme
              : session.mode === "none"
                ? "这一天没有课"
                : `预习 ${session.week.title}`}
          </h1>
          <p>
            {session.mode === "day"
              ? day?.objective
              : session.mode === "none"
                ? "今天没有安排新的 10 分钟片段。"
                : session.week.goal}
          </p>
        </div>
      </header>

      {session.mode === "none" && (
        <div className="panel">
          <p>「{session.week.title}」这一周没有把今天排成新的 10 分钟。</p>
        </div>
      )}

      {session.mode === "preview" && (
        <PreviewPanel
          daysUntil={session.daysUntil}
          onToggle={(taskId) => setProgress((current) => toggleSlot(current, previewKey(session.week.id), taskId))}
          progress={progress}
          week={session.week}
        />
      )}

      {session.mode === "waiting" && (
        <div className="panel">
          <h2>这一周的资料还没发布</h2>
          <p>
            已发布的最后一周是 {session.week.startsOn} 的「{session.week.title}」。新的一周会在周五放进页面。
          </p>
          <Link to="/roadmap">查看全年路线</Link>
        </div>
      )}

      {day && activeSlot && session.mode === "day" && (
        <DayPanel
          day={day}
          done={progress.slots[day.date] ?? []}
          onAdd={(draft) =>
            setProgress((current) =>
              addTerm(current, {
                ...draft,
                studiedOn: day.date,
                period: activeSlot.id === "preview" || activeSlot.id === "review" ? undefined : activeSlot.id
              })
            )
          }
          onReview={(text) =>
            setProgress((current) => ({
              ...current,
              reviews: { ...current.reviews, [session.week.id]: text }
            }))
          }
          onSelect={setSlotId}
          onToggle={(id) => setProgress((current) => toggleSlot(current, day.date, id))}
          progress={progress}
          review={progress.reviews[session.week.id] ?? ""}
          slot={activeSlot}
          week={session.week}
        />
      )}
    </section>
  );
}

function previewKey(weekId: string): string {
  return `preview:${weekId}`;
}

function PreviewPanel({
  week,
  daysUntil,
  progress,
  onToggle
}: {
  week: WeekPack;
  daysUntil: number;
  progress: ProgressState;
  onToggle: (taskId: string) => void;
}) {
  const done = new Set(progress.slots[previewKey(week.id)] ?? []);
  const studyDays = week.days.filter((day) => day.kind === "study");

  return (
    <div className="panel">
      <p>
        距离 {week.startsOn} 还有 {daysUntil} 天。这个周末先听每一段的前两分钟，周一再按 10 分钟精听。
      </p>
      <ul className="task-list">
        {previewTasks.map((task) => (
          <li key={task.id}>
            <label className="checkbox-label">
              <input checked={done.has(task.id)} onChange={() => onToggle(task.id)} type="checkbox" />
              {task.label}
            </label>
          </li>
        ))}
      </ul>
      <ol className="day-index">
        {studyDays.map((day) => (
          <li key={day.date}>
            <Link to={`/week?focus=${day.date}`}>
              {weekdayLabel(day.date)} {day.theme}
            </Link>
            <span>{day.objective}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DayPanel({
  week,
  day,
  slot,
  done,
  review,
  progress,
  onSelect,
  onToggle,
  onReview,
  onAdd
}: {
  week: WeekPack;
  day: StudyDay;
  slot: SlotPlan;
  done: string[];
  review: string;
  progress: ProgressState;
  onSelect: (slotId: SlotPlan["id"]) => void;
  onToggle: (slotId: string) => void;
  onReview: (text: string) => void;
  onAdd: (draft: TermDraft) => void;
}) {
  const finished = new Set(done);
  const following = nextWeek(weeks, week);
  const episode = day.listen ? findEpisode(day.listen.episodeId) : undefined;

  return (
    <>
      {episode && day.listen && (
        <TranscriptPlayer
          end={day.listen.end}
          episode={episode}
          onAdd={onAdd}
          savedIds={new Set(progress.terms.map((term) => term.id))}
          start={day.listen.start}
        />
      )}
      <div className="slot-switch" role="tablist" aria-label="今天的时段">
        {day.slots.map((item) => (
          <button
            aria-selected={item.id === slot.id}
            className={item.id === slot.id ? "slot-chip active" : "slot-chip"}
            key={item.id}
            onClick={() => onSelect(item.id)}
            role="tab"
            type="button"
          >
            {slotLabel[item.id]}
            {finished.has(item.id) ? " · 完成" : ""}
          </button>
        ))}
      </div>
      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{slot.place}</p>
            <h2>
              {slot.minutes} 分钟 · {slot.title}
            </h2>
          </div>
          <span>
            {finished.size} / {day.slots.length}
          </span>
        </div>
        <ol className="step-list">
          {slot.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="material-list">
          {slot.links.map((link) => (
            <MaterialView key={link.url + link.title} link={link} />
          ))}
        </div>
        {slot.id === "preview" && following && (
          <ol className="day-index">
            {following.days
              .filter((item) => item.kind === "study")
              .map((item) => (
                <li key={item.date}>
                  <Link to={`/week?focus=${item.date}`}>{item.theme}</Link>
                  <span>{item.objective}</span>
                </li>
              ))}
          </ol>
        )}
        {slot.id === "preview" && !following && <p>下一周还没发布。先把本周选出的生词再听一遍。</p>}
        {slot.id === "home" && day.shadow.length > 0 && (
          <>
            <p className="listen-note">这几句是这一段文字稿里的原句，用来跟读。版权 Changelog Media LLC，CC BY-SA 4.0。</p>
            <ShadowTrainer sentences={day.shadow} />
          </>
        )}
        {slot.id === "home" && day.speakPrompt && <p className="speak-prompt">不看稿回答：{day.speakPrompt}</p>}
        {slot.id === "review" && <Link to="/vocab">查看从文字稿加入的生词</Link>}
        {slot.id === "review" && (
          <label className="review-field">
            本周复盘
            <textarea
              onChange={(event) => onReview(event.target.value)}
              placeholder="用英语写。不要写公司机密。"
              rows={8}
              value={review}
            />
          </label>
        )}
        <label className="checkbox-label done-toggle">
          <input checked={finished.has(slot.id)} onChange={() => onToggle(slot.id)} type="checkbox" />
          这一段做完了
        </label>
      </article>
      <p className="save-note">打卡和生词保存在这台浏览器。换设备时，到进度页或词汇页导出 english-progress.json。</p>
    </>
  );
}
