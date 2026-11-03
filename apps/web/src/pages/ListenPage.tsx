import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { TranscriptPlayer } from "../components/TranscriptPlayer";
import { changelogEpisodes, findEpisode } from "../content/changelog-episodes";
import { addTerm, loadProgress, saveProgress, type ProgressState } from "../progress/store";

export function ListenPage() {
  const { episodeId } = useParams();
  const [params] = useSearchParams();
  const episode = findEpisode(episodeId);
  const requested = Number(params.get("t") ?? "0");
  const start = Number.isFinite(requested) && requested > 0 ? requested : 0;
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  if (!episode) {
    return (
      <section className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Changelog · 点文字跳到音频</p>
            <h1>播客精听</h1>
            <p>点一段文字会从对应时间播放。选中不认识的单词或短语，可以加入学习记录。</p>
          </div>
        </header>
        <div className="episode-grid">
          {changelogEpisodes.map((item) => (
            <Link className="episode-card" key={item.id} to={`/listen/${item.id}`}>
              <p className="eyebrow">{item.show}</p>
              <h2>{item.title}</h2>
              <p>{item.guest}</p>
              <p>{item.why}</p>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            {episode.show} · {episode.guest}
          </p>
          <h1>{episode.title}</h1>
          <p>{episode.why}</p>
        </div>
        <Link to="/listen">全部节目</Link>
      </header>
      <TranscriptPlayer
        episode={episode}
        onAdd={(draft) => setProgress((current) => addTerm(current, draft))}
        savedIds={new Set(progress.terms.map((term) => term.id))}
        start={start}
      />
    </section>
  );
}
