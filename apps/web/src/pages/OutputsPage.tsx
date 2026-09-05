import { useEffect, useMemo, useState } from "react";
import {
  getEntries,
  getReviews,
  type DailyEntry,
  type StoredReview
} from "../api/client";
import { WeeklyReviewForm } from "../components/WeeklyReviewForm";

export function OutputsPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([getEntries(), getReviews()])
      .then(([nextEntries, nextReviews]) => {
        if (!active) return;
        setEntries(nextEntries);
        setReviews(nextReviews);
      })
      .catch(() => {
        if (active) setError("输出记录加载失败，请刷新重试");
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleEntries = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    return [...entries]
      .sort((left, right) => right.date.localeCompare(left.date))
      .filter(
        (entry) =>
          !query ||
          entry.topic.toLocaleLowerCase().includes(query) ||
          entry.material.source.toLocaleLowerCase().includes(query)
      );
  }, [entries, filter]);

  if (error) return <p className="error-message">{error}</p>;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">OUTPUTS</p>
          <h1>你留下的英文作品</h1>
          <p>每日总结证明你完成过输入，每周复盘证明你形成了自己的观点。</p>
        </div>
      </header>

      <WeeklyReviewForm
        onSaved={(review) =>
          setReviews((current) => [
            review,
            ...current.filter((item) => item.week !== review.week)
          ])
        }
      />

      <section className="output-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DAILY NOTES</p>
            <h2>每日总结</h2>
          </div>
          <label className="filter-field">
            筛选每日输出
            <input
              type="search"
              placeholder="主题或来源"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>
        </div>
        <div className="output-list">
          {visibleEntries.map((entry) => (
            <article className="output-card" key={entry.date}>
              <div className="output-meta">
                <time dateTime={entry.date}>{entry.date}</time>
                <span>{entry.topic}</span>
                <span>{entry.material.source}</span>
              </div>
              <h3>
                <a href={entry.material.url} target="_blank" rel="noreferrer">
                  {entry.material.title}
                </a>
              </h3>
              <p className="english-output">{entry.summary}</p>
              <div className="expression-tags">
                {entry.expressions.map((expression) => (
                  <span key={expression.text}>{expression.text}</span>
                ))}
              </div>
            </article>
          ))}
          {!visibleEntries.length && (
            <p className="empty-state">还没有匹配的每日输出。</p>
          )}
        </div>
      </section>

      <section className="output-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WEEKLY REVIEWS</p>
            <h2>每周复盘</h2>
          </div>
        </div>
        <div className="output-list">
          {reviews.map((review) => (
            <article className="output-card" key={review.week}>
              <div className="output-meta">
                <span>{review.week}</span>
                <span>{review.theme}</span>
              </div>
              <pre className="markdown-output">{review.markdown}</pre>
            </article>
          ))}
          {!reviews.length && <p className="empty-state">完成第一周后，在这里写下复盘。</p>}
        </div>
      </section>
    </section>
  );
}
