import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatClock } from "../content/parse-transcript";
import { termNote } from "../content/term-notes";
import {
  downloadProgress,
  loadProgress,
  parseProgress,
  removeTerm,
  saveProgress,
  type ProgressState
} from "../progress/store";

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

  const groups = new Map<string, ProgressState["terms"]>();
  for (const term of progress.terms) {
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
            这里是你在文字稿里选中、标成不认识的单词、短语和句型。已经导入的条目按那一句写了学习分析：先看整句在说什么，再看这个说法的字面意思和在这句里的意思。新选的词会先出现在这里，分析随后补上。
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
      {message && <p className="success-message">{message}</p>}
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
              return (
              <li className="term-card" key={term.id}>
                <div>
                  <strong>
                    {note && <em className="term-kind">{note.kind}</em>}
                    {term.text}
                  </strong>
                  <span>
                    {formatClock(term.start)}
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
