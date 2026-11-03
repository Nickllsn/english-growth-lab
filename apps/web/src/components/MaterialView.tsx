import type { MaterialLink } from "../content/types";

function youtubeEmbed(url: string): { id: string; start: number } | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  const id = host === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
  if (!id || (host !== "youtube.com" && host !== "youtu.be" && host !== "m.youtube.com")) return undefined;
  const raw = parsed.searchParams.get("t") ?? parsed.searchParams.get("start") ?? "0";
  const start = Number(raw.replace(/s$/, ""));
  return { id, start: Number.isFinite(start) ? start : 0 };
}

export function MaterialView({ link, showCaptions = false }: { link: MaterialLink; showCaptions?: boolean }) {
  const video = youtubeEmbed(link.url);
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
      <a className="material-link" href={link.url} rel="noreferrer" target="_blank">
        <strong>{link.title}</strong>
        <span>{link.formats.join(" · ")}</span>
        <small>{link.note}</small>
      </a>
    </article>
  );
}
