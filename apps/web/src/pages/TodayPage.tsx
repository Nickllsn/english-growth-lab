import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { allVocab, weeks } from "../content/load";
import { nextWeek, previousStudyDays, resolveSession, shanghaiToday, weekdayLabel } from "../content/schedule";
import type { SlotPlan, StudyDay, WeekPack } from "../content/types";
import { MaterialView } from "../components/MaterialView";
import { ShadowTrainer } from "../components/ShadowTrainer";
import { VocabList } from "../components/VocabList";
import { isLikelyUnknown, judgeVocab } from "../progress/predict";
import { loadProgress, saveProgress, setMark, toggleSlot, type ProgressState } from "../progress/store";

const catalog = allVocab();

const slotLabel: Record<SlotPlan["id"], string> = {
  morning: "早听",
  noon: "午读",
  evening: "晚听",
  home: "跟读",
  preview: "预习",
  review: "复盘"
};

const previewTasks = [
  { id: "open", label: "五个学习日的视频都能打开" },
  { id: "goals", label: "读过每一天的目标" },
  { id: "sample", label: "每个视频只听了前 2 分钟" }
];

interface TodayPageProps {
  today?: string;
}

export function TodayPage({ today = shanghaiToday() }: TodayPageProps) {
  const session = resolveSession(today, weeks);
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [slotId, setSlotId] = useState<SlotPlan["id"]>(
    session.mode === "day" ? session.day.slots[0].id : "preview"
  );

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const day = session.mode === "day" ? session.day : undefined;
  const activeSlot = day?.slots.find((slot) => slot.id === slotId) ?? day?.slots[0];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            {session.week.id} · {session.week.phase} · 上海时间 {today}
          </p>
          <h1>{session.mode === "day" ? day?.theme : `预习 ${session.week.title}`}</h1>
          <p>{session.mode === "day" ? day?.objective : session.week.goal}</p>
        </div>
      </header>

      {session.mode === "preview" && (
        <PreviewPanel
          daysUntil={session.daysUntil}
          onToggle={(taskId) =>
            setProgress((current) => toggleSlot(current, previewKey(session.week.id), taskId))
          }
          onMark={(id, mark) => setProgress((current) => setMark(current, id, mark))}
          progress={progress}
          week={session.week}
        />
      )}

      {session.mode === "waiting" && (
        <div className="panel">
          <h2>这一周的资料还没发布</h2>
          <p>
            已发布的最后一周是 {session.week.startsOn} 的「{session.week.title}」。新的一周会在周五放进页面，周六和周日用来预习。
          </p>
          <Link to="/roadmap">查看全年路线</Link>
        </div>
      )}

      {day && activeSlot && (
        <DayPanel
          day={day}
          done={progress.slots[day.date] ?? []}
          onReview={(text) =>
            setProgress((current) => ({
              ...current,
              reviews: { ...current.reviews, [session.week.id]: text }
            }))
          }
          onSelect={setSlotId}
          onToggle={(id) => setProgress((current) => toggleSlot(current, day.date, id))}
          onMark={(id, mark) => setProgress((current) => setMark(current, id, mark))}
          review={progress.reviews[session.week.id] ?? ""}
          known={progress.known}
          unknown={progress.unknown}
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
  onToggle,
  onMark
}: {
  week: WeekPack;
  daysUntil: number;
  progress: ProgressState;
  onToggle: (taskId: string) => void;
  onMark: (id: string, mark: "known" | "unknown") => void;
}) {
  const done = new Set(progress.slots[previewKey(week.id)] ?? []);
  const studyDays = week.days.filter((day) => day.kind === "study");

  return (
    <div className="panel">
      <p>
        距离 {week.startsOn} 还有 {daysUntil} 天。这个周末只预习，周一早上再开始 20 分钟听力。
      </p>
      <ul className="task-list">
        {previewTasks.map((task) => (
          <li key={task.id}>
            <label className="checkbox-label">
              <input
                checked={done.has(task.id)}
                onChange={() => onToggle(task.id)}
                type="checkbox"
              />
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
      <p className="vocab-note">每个时段先列出按完整字幕或链接文档估出的六级和更高阶重点。标过之后，后面几天会按你点的不认识重估。</p>
      {studyDays.map((day) => (
        <SlotPreviews day={day} key={day.date} onMark={onMark} progress={progress} />
      ))}
    </div>
  );
}

function DayPanel({
  week,
  day,
  slot,
  done,
  review,
  onSelect,
  onToggle,
  onReview,
  known,
  unknown,
  onMark
}: {
  week: WeekPack;
  day: StudyDay;
  slot: SlotPlan;
  done: string[];
  review: string;
  known: string[];
  unknown: string[];
  onSelect: (slotId: SlotPlan["id"]) => void;
  onToggle: (slotId: string) => void;
  onReview: (text: string) => void;
  onMark: (id: string, mark: "known" | "unknown") => void;
}) {
  const finished = new Set(done);
  const following = nextWeek(weeks, week);
  const earlier = previousStudyDays(week, day.date);
  const studyIndex = week.days.filter((item) => item.kind === "study").findIndex((item) => item.date === day.date);

  return (
    <>
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
        {(slot.id === "morning" || slot.id === "noon" || slot.id === "evening") && (
          <VocabList
            catalog={catalog}
            heading={`${slotLabel[slot.id]} · 进阶重点`}
            items={slot.vocab}
            known={known}
            onMark={onMark}
            unknown={unknown}
          />
        )}
        <ol className="step-list">
          {slot.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="material-list">
          {slot.links.map((link) => (
            <MaterialView key={link.url + link.title} link={link} showCaptions={slot.id === "evening"} />
          ))}
        </div>
        {slot.id === "preview" && following && (
          <>
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
            {following.days
              .filter((item) => item.kind === "study")
              .map((item) => (
                <SlotPreviews day={item} key={item.date} onMark={onMark} progress={{ known, unknown }} />
              ))}
          </>
        )}
        {slot.id === "preview" && !following && (
          <p>下一周还没发布。先把本周跟读稿再讲一遍，不要改去听会议论文。</p>
        )}
        {slot.id === "home" && <ShadowTrainer sentences={day.shadow} />}
        {slot.id === "home" && <p className="speak-prompt">不看稿回答：{day.speakPrompt}</p>}
        {(slot.id === "noon") && day.chunks.length > 0 && (
          <ChunkList chunks={day.chunks} title="今天的词块" />
        )}
        {slot.id === "noon" && studyIndex === 4 && (
          <ChunkList
            chunks={earlier.flatMap((item) => item.chunks)}
            title="本周已经学过的词块"
          />
        )}
        {slot.id === "review" && <Link to="/vocab">按周查看不认识的说法</Link>}
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
          <input
            checked={finished.has(slot.id)}
            onChange={() => onToggle(slot.id)}
            type="checkbox"
          />
          这一段做完了
        </label>
      </article>
      <p className="save-note">打卡保存在这台浏览器。换手机或公司电脑时，到进度页导出再导入。</p>
    </>
  );
}

function SlotPreviews({
  day,
  progress,
  onMark
}: {
  day: StudyDay;
  progress: Pick<ProgressState, "known" | "unknown">;
  onMark: (id: string, mark: "known" | "unknown") => void;
}) {
  const slots = day.slots.filter((slot) => slot.id === "morning" || slot.id === "noon" || slot.id === "evening");
  return (
    <section>
      <h3>
        {weekdayLabel(day.date)} · {day.theme}
      </h3>
      {slots.map((slot) => {
        const count = slot.vocab.filter((item) => isLikelyUnknown(judgeVocab(item, progress, catalog))).length;
        return (
          <details className="vocab-slot" key={slot.id}>
            <summary>
              {slotLabel[slot.id]} · 进阶重点 {count}
            </summary>
            <VocabList
              catalog={catalog}
              heading=""
              items={slot.vocab}
              known={progress.known}
              onMark={onMark}
              showNote={false}
              unknown={progress.unknown}
            />
          </details>
        );
      })}
    </section>
  );
}

function ChunkList({ chunks, title }: { chunks: { text: string; meaning: string }[]; title: string }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className="chunk-list">
        {chunks.map((chunk) => (
          <li key={chunk.text}>
            <strong>{chunk.text}</strong>
            <span>{chunk.meaning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
