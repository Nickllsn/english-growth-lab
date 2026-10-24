import type { MaterialLink } from "../content/types";
import { pageReadings, youtubeEmbed } from "../content/page-text";

export function MaterialView({ link, showCaptions = false }: { link: MaterialLink; showCaptions?: boolean }) {
  const video = youtubeEmbed(link.url);
  const reading = pageReadings[link.url];
  const captionFlag = showCaptions ? "1" : "0";

  return (
    <article className="material-block">
      {video && (
        <div className="video-frame">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            src={`https://www.youtube-nocookie.com/embed/${video.id}?start=${video.start}&cc_load_policy=${captionFlag}&cc_lang_pref=en&rel=0`}
            title={`${link.title}，英文字幕`}
          />
        </div>
      )}
      {reading && (
        <div className="page-reading">
          <h3>{reading.label}</h3>
          {reading.keywords.length > 0 && (
            <p className="keyword-line">
              <span>关键词</span>
              {reading.keywords.join(" · ")}
            </p>
          )}
          {reading.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {reading.attribution && <p className="attribution">{reading.attribution}</p>}
        </div>
      )}
      <a className="material-link" href={link.url} rel="noreferrer" target="_blank">
        <strong>{link.title}</strong>
        <span>{link.formats.join(" · ")}</span>
        <small>{link.note}</small>
      </a>
    </article>
  );
}
