import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatClock } from "../content/parse-transcript";
import {
  downloadProgress,
  loadProgress,
  parseProgress,
  removeTerm,
  saveProgress,
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
            这里是你在文字稿里选中、标成不认识的单词和短语。导出的 english-progress.json 里，每一条都有原句、节目和时间。把文件发回来，就可以按那一句说明这个词在节目里怎么用。
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
            {terms.map((term) => (
              <li className="term-card" key={term.id}>
                <div>
                  <strong>{term.text}</strong>
                  <span>
                    {formatClock(term.start)}
                    {term.speaker ? ` · ${term.speaker}` : ""}
                  </span>
                  <p>{term.sentence}</p>
                </div>
                <div className="button-row">
                  <Link to={`/listen/${term.episodeId}?t=${Math.floor(term.start)}`}>回到这一句</Link>
                  <button type="button" onClick={() => setProgress((current) => removeTerm(current, term.id))}>
                    移出
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
