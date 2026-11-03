import { useEffect, useRef, useState } from "react";
import type { ChangelogEpisode } from "../content/changelog-episodes";
import { activeCueIndex, formatClock, parseTranscript } from "../content/parse-transcript";

const rates = ["0.75", "1", "1.25"];

function cueLabel(start: number, speaker: string | null, text: string): string {
  const who = speaker ? `${speaker}。` : "";
  return `跳到 ${formatClock(start)}。${who}${text}`;
}

export function TranscriptPlayer({ episode }: { episode: ChangelogEpisode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeRef = useRef<HTMLLIElement | null>(null);
  const followRef = useRef(false);
  const cues = parseTranscript(episode.transcript);
  const [seconds, setSeconds] = useState(0);
  const [rate, setRate] = useState("1");
  const active = activeCueIndex(cues, seconds);

  useEffect(() => {
    const node = activeRef.current;
    if (!followRef.current || !node || typeof node.scrollIntoView !== "function") return;
    node.scrollIntoView({ block: "nearest" });
  }, [active]);

  function seek(start: number) {
    const audio = audioRef.current;
    if (!audio) return;
    followRef.current = true;
    const apply = () => {
      audio.currentTime = start;
      setSeconds(start);
      void audio.play()?.catch(() => undefined);
    };
    apply();
    if (audio.readyState < 1) {
      audio.addEventListener("loadedmetadata", apply, { once: true });
    }
  }

  return (
    <div className="listen-layout">
      <div className="listen-player">
        <div className="listen-player-row">
          <p>
            正在听 <strong>{formatClock(seconds)}</strong>
          </p>
          <label>
            语速
            <select
              aria-label="语速"
              value={rate}
              onChange={(event) => {
                const next = event.target.value;
                setRate(next);
                if (audioRef.current) audioRef.current.playbackRate = Number(next);
              }}
            >
              {rates.map((item) => (
                <option key={item} value={item}>
                  {item}×
                </option>
              ))}
            </select>
          </label>
        </div>
        <audio
          ref={audioRef}
          aria-label={`${episode.title} 音频`}
          controls
          preload="metadata"
          src={episode.audioUrl}
          onTimeUpdate={(event) => setSeconds(event.currentTarget.currentTime)}
          onSeeked={(event) => setSeconds(event.currentTarget.currentTime)}
          onPlay={() => {
            followRef.current = true;
          }}
          onPause={() => {
            followRef.current = false;
          }}
        />
        <p className="listen-note">
          点下面某一段文字，就会从这段开头的时间播放。同一个时间下面的几段话，跳到的是这一个时间。文字稿大约每几分钟才标一次。
        </p>
      </div>
      <ol className="cue-list">
        {cues.map((cue, index) => (
          <li
            className={index === active ? "cue active" : "cue"}
            key={`${cue.start}-${index}`}
            ref={(node) => {
              if (index === active) activeRef.current = node;
            }}
          >
            <button className="cue-jump" type="button" onClick={() => seek(cue.start)}>
              {formatClock(cue.start)}
            </button>
            {cue.paragraphs.map((paragraph, paragraphIndex) => (
              <button
                className="cue-paragraph"
                key={`${cue.start}-${paragraphIndex}`}
                type="button"
                aria-label={cueLabel(cue.start, paragraph.speaker, paragraph.text)}
                onClick={() => seek(cue.start)}
              >
                {paragraph.speaker && <span className="cue-speaker">{paragraph.speaker}</span>}
                {paragraph.text}
              </button>
            ))}
          </li>
        ))}
      </ol>
      <p className="listen-note attribution">
        文字稿版权归 Changelog Media LLC，按 CC BY-SA 4.0 使用，这里是原文，没有改写。音频由浏览器向 Changelog
        的服务器请求，没有放进这个仓库。
        <a href={episode.pageUrl} rel="noreferrer" target="_blank">
          节目页
        </a>
        <a href={episode.transcriptUrl} rel="noreferrer" target="_blank">
          文字稿原文
        </a>
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noreferrer" target="_blank">
          许可
        </a>
      </p>
    </div>
  );
}
