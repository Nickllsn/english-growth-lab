import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ChangelogEpisode } from "../content/changelog-episodes";
import { activeCueIndex, formatClock, parseTranscript, segmentStop } from "../content/parse-transcript";
import { acceptSelection, sentenceAround } from "../content/selection";
import { claimEpisode, getAudio, getPlaybackSnapshot, playFrom, subscribePlayback } from "../playback/engine";
import { termId, type TermDraft } from "../progress/store";

interface SelectionMenu {
  text: string | null;
  message: string;
  x: number;
  y: number;
  draft?: TermDraft;
}

export function TranscriptPlayer({
  episode,
  start = 0,
  end,
  savedIds,
  onAdd,
  manageAudio = true
}: {
  episode: ChangelogEpisode;
  start?: number;
  end?: number;
  savedIds?: Set<string>;
  onAdd?: (draft: TermDraft) => void;
  manageAudio?: boolean;
}) {
  const activeRef = useRef<HTMLLIElement | null>(null);
  const followRef = useRef(false);
  const allCues = parseTranscript(episode.transcript, episode.cueStarts);
  const windowEnd = end ?? Number.POSITIVE_INFINITY;
  const stopAt = segmentStop(allCues, end);
  const cues = allCues.filter((cue, index) => {
    const next = allCues[index + 1]?.start ?? Number.POSITIVE_INFINITY;
    return cue.start < windowEnd && next > start;
  });
  const playback = useSyncExternalStore(subscribePlayback, getPlaybackSnapshot, getPlaybackSnapshot);
  const seconds = playback.episodeId === episode.id ? playback.seconds : start;
  const [menu, setMenu] = useState<SelectionMenu | null>(null);
  const active = activeCueIndex(cues, seconds);

  useEffect(() => {
    if (!manageAudio) return;
    claimEpisode(episode, start, stopAt);
  }, [episode, manageAudio, start, stopAt]);

  useEffect(() => {
    const audio = getAudio();
    const onPlay = () => {
      followRef.current = true;
    };
    const onPause = () => {
      followRef.current = false;
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    const node = activeRef.current;
    if (!followRef.current || !node || typeof node.scrollIntoView !== "function") return;
    node.scrollIntoView({ block: "nearest" });
  }, [active]);

  function seek(time: number) {
    followRef.current = true;
    playFrom(episode, time, stopAt);
  }

  function capture(paragraph: HTMLElement, cueStart: number, speaker: string | null, sentence: string) {
    if (!onAdd) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setMenu(null);
      return;
    }
    const node = selection.anchorNode;
    if (!node || (node !== paragraph && !paragraph.contains(node))) return;
    const chosen = acceptSelection(selection.toString());
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (!chosen) {
      setMenu({
        text: null,
        message: "请选一个单词或短语，最多 20 个词",
        x: rect.left,
        y: rect.bottom
      });
      return;
    }
    const id = termId(episode.id, chosen);
    setMenu({
      text: chosen,
      message: savedIds?.has(id) ? "已经在学习记录里" : "加入不认识",
      x: rect.left,
      y: rect.bottom,
      draft: savedIds?.has(id)
        ? undefined
        : {
            text: chosen,
            episodeId: episode.id,
            episodeTitle: episode.title,
            start: cueStart,
            speaker,
            sentence: sentenceAround(sentence, chosen)
          }
    });
  }

  return (
    <div className="listen-layout">
      <div className="listen-player-row">
        <button className="secondary-button" type="button" onClick={() => seek(start)}>
          从 {formatClock(start)} 播放
        </button>
        <p className="listen-note">
          点每段左边的时间才会播放。每一句的时间对着这句在音频里开始的位置。这段文字稿播完会自动暂停，要接着听后面再按播放。换到本周、进度或生词时会接着播。手动暂停后，重新打开任务页再按播放，会从暂停的时间继续。选中文字不会跳转，最多 20 个词，再点「加入不认识」。
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
            <button
              aria-label={`播放 ${formatClock(cue.start)}`}
              className="cue-jump"
              type="button"
              onClick={() => seek(cue.start)}
            >
              {formatClock(cue.start)}
            </button>
            {cue.paragraphs.map((paragraph, paragraphIndex) => (
              <div
                className="cue-paragraph"
                key={`${cue.start}-${paragraphIndex}`}
                onPointerUp={(event) =>
                  capture(event.currentTarget, cue.start, paragraph.speaker, paragraph.text)
                }
              >
                {paragraph.speaker && <span className="cue-speaker">{paragraph.speaker}</span>}
                {paragraph.text}
              </div>
            ))}
          </li>
        ))}
      </ol>
      {menu && (
        <div className="select-menu" style={{ left: menu.x, top: menu.y + 8 }}>
          {menu.text && <strong>{menu.text}</strong>}
          {menu.draft ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (menu.draft) onAdd?.(menu.draft);
                setMenu(null);
                window.getSelection()?.removeAllRanges();
              }}
            >
              {menu.message}
            </button>
          ) : (
            <span>{menu.message}</span>
          )}
        </div>
      )}
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
