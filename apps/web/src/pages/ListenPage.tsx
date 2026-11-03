import { Link, useParams } from "react-router-dom";
import { TranscriptPlayer } from "../components/TranscriptPlayer";
import { changelogEpisodes, findEpisode } from "../content/changelog-episodes";

export function ListenPage() {
  const { episodeId } = useParams();
  const episode = findEpisode(episodeId);

  if (!episode) {
    return (
      <section className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Changelog · 点文字跳到音频</p>
            <h1>播客精听</h1>
            <p>
              每集只精听 5 到 10 分钟。点一段文字，音频从这段记录的时间开始。先不看字听一遍，再点开没听清的那几段。
            </p>
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
      <TranscriptPlayer episode={episode} />
    </section>
  );
}
