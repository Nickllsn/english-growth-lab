import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { weeks } from "../content/load";
import { formatClock } from "../content/parse-transcript";
import { weekdayLabel } from "../content/schedule";
import { termNote } from "../content/term-notes";
import { contentSchedule } from "../progress/placement";
import {
  downloadProgress,
  loadProgress,
  parseProgress,
  removeTerm,
  saveProgress,
  type LearningTerm,
  type ProgressState
} from "../progress/store";

const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function placement(term: LearningTerm) {
  return contentSchedule(term, weeks) ?? (term.scheduledOn && term.weekId
    ? { date: term.scheduledOn, weekId: term.weekId, weekday: weekdayLabel(term.scheduledOn) }
    : undefined);
}

function TermAnalysis({ sentence, id }: { sentence: string; id: string }) {
  const note = termNote(id);
  return (
    <div className="term-note">
      <p>
        <span className="term-label">这句话是</span>
        “{sentence}”
      </p>
      {note ? (
        <>
          <p>
            <span className="term-label">它的意思是</span>
            {note.meaning}
          </p>
          <div>
            <span className="term-label">词义拆解</span>
            <ul className="term-parts">
              {note.parts.map((part) => (
                <li key={part.text}>
                  <strong>{part.text}</strong>
                  <span>字面：{part.literal}</span>
                  <span>这里：{part.here}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p>这条还没有按原句写过学习分析。</p>
      )}
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("这个文件不是学习进度"));
    reader.readAsText(file);
  });
}

export function VocabPage() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [message, setMessage] = useState("");
  const [weekId, setWeekId] = useState("");
  const [weekday, setWeekday] = useState("");

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = parseProgress(await readFile(file));
      setProgress(next);
      setMessage(`已导入 ${next.terms.length} 条生词`);
    } catch {
      setMessage("这个文件不是学习进度");
    }
  };

  const visible = progress.terms.filter((term) => {
    const place = placement(term);
    if (weekId && place?.weekId !== weekId) return false;
    if (weekday && place?.weekday !== weekday) return false;
    return true;
  });
  const groups = new Map<string, ProgressState["terms"]>();
  for (const term of visible) {
    const list = groups.get(term.episodeTitle) ?? [];
    list.push(term);
    groups.set(term.episodeTitle, list);
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">从文字稿里自己选</p>
          <h1>学习记录</h1>
          <p>
            这里是你在文字稿里选中、标成不认识的单词、短语和句型。每条生词按它所在的那段音频归到课表上的那一天，不按加入时间。同一天的早听、午读和晚听是同一段，所以按周和周几筛选。导出的进度里会写上这个日期。
          </p>
        </div>
      </header>
      <div className="button-row">
        <button className="primary-button" onClick={() => downloadProgress(progress)} type="button">
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
      <div className="vocab-filters">
        <label>
          周
          <select aria-label="周" onChange={(event) => setWeekId(event.target.value)} value={weekId}>
            <option value="">全部</option>
            {weeks.map((week) => (
              <option key={week.id} value={week.id}>
                {week.id} {week.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          周几
          <select aria-label="周几" onChange={(event) => setWeekday(event.target.value)} value={weekday}>
            <option value="">全部</option>
            {weekdays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <p>
          {visible.length} / {progress.terms.length} 条
        </p>
      </div>
      {message && <p className="success-message">{message}</p>}
      {progress.terms.length > 0 && visible.length === 0 && (
        <section className="panel">
          <p>这个范围里没有生词。</p>
        </section>
      )}
      {progress.terms.length === 0 && (
        <section className="panel">
          <p>还没有生词。打开今天的文字稿，选中一个单词或短语，点「加入不认识」。</p>
          <Link to="/listen">去播客里选</Link>
        </section>
      )}
      {[...groups.entries()].map(([title, terms]) => (
        <section className="panel" key={title}>
          <h2>{title}</h2>
          <ul className="term-list">
            {terms.map((term) => {
              const note = termNote(term.id);
              const place = placement(term);
              return (
              <li className="term-card" key={term.id}>
                <div>
                  <p className="term-title">
                    {note && <em className="term-kind">{note.kind}</em>}
                    <strong>{term.text}</strong>
                  </p>
                  <span>
                    {place ? `${place.weekId} · ${place.weekday} · ${place.date}` : "未排进周课"} · {formatClock(term.start)}
                    {term.speaker ? ` · ${term.speaker}` : ""}
                  </span>
                  <TermAnalysis sentence={term.sentence} id={term.id} />
                </div>
                <div className="button-row">
                  <Link to={`/listen/${term.episodeId}?t=${Math.floor(term.start)}`}>回到这一句</Link>
                  <button type="button" onClick={() => setProgress((current) => removeTerm(current, term.id))}>
                    移出
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        </section>
      ))}
    </section>
  );
}
