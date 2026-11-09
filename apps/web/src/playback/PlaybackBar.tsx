import { useEffect, useRef, useSyncExternalStore } from "react";
import { formatClock } from "../content/parse-transcript";
import {
  getPlaybackSnapshot,
  mountAudio,
  setPlaybackRate,
  setVideoDock,
  subscribePlayback
} from "./engine";

const rates = ["0.75", "1", "1.25"];

export function PlaybackBar() {
  const snap = useSyncExternalStore(subscribePlayback, getPlaybackSnapshot, getPlaybackSnapshot);
  const audioHost = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioHost.current) mountAudio(audioHost.current);
    setVideoDock(dock.current);
    return () => setVideoDock(null);
  }, []);

  const visible = snap.episodeId !== "" || snap.parkedVideos > 0;

  return (
    <div className="playback-bar" hidden={!visible}>
      <div className="listen-player-row">
        <p>
          正在听 <strong>{formatClock(snap.seconds)}</strong>
          {snap.title ? ` · ${snap.title}` : ""}
        </p>
        <label>
          语速
          <select
            aria-label="语速"
            value={snap.rate}
            onChange={(event) => setPlaybackRate(event.target.value)}
          >
            {rates.map((item) => (
              <option key={item} value={item}>
                {item}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <div ref={audioHost} />
      <div className="video-frame" hidden={snap.parkedVideos === 0} ref={dock} />
    </div>
  );
}
