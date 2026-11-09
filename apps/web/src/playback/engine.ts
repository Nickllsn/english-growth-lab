import type { ChangelogEpisode } from "../content/changelog-episodes";

export const PLAYBACK_KEY = "egl.playback.v1";

export interface PlaybackRecord {
  episodeId: string;
  time: number;
  rate: number;
  held: boolean;
}

export interface PlaybackSnapshot {
  episodeId: string;
  title: string;
  seconds: number;
  rate: string;
  parkedVideos: number;
}

const rates = ["0.75", "1", "1.25"];

const listeners = new Set<() => void>();
const videos = new Map<string, HTMLIFrameElement>();
const parked = new Set<HTMLIFrameElement>();

let audioNode: HTMLAudioElement | null = null;
let garage: HTMLDivElement | null = null;
let videoDock: HTMLElement | null = null;
let snapshot: PlaybackSnapshot = {
  episodeId: "",
  title: "",
  seconds: 0,
  rate: "1",
  parkedVideos: 0
};
let stopAt: number | null = null;
let held = false;
let applying = false;
let lastWrite = 0;

function parkRoot(): HTMLDivElement {
  if (!garage) {
    garage = document.createElement("div");
    garage.dataset.playbackGarage = "true";
    garage.style.position = "fixed";
    garage.style.left = "-10000px";
    garage.style.top = "0";
    document.body.appendChild(garage);
  }
  return garage;
}

function readRecord(): PlaybackRecord | null {
  try {
    const raw = localStorage.getItem(PLAYBACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlaybackRecord>;
    if (!parsed.episodeId || typeof parsed.time !== "number" || !Number.isFinite(parsed.time)) return null;
    return {
      episodeId: parsed.episodeId,
      time: parsed.time,
      rate: typeof parsed.rate === "number" && Number.isFinite(parsed.rate) ? parsed.rate : 1,
      held: Boolean(parsed.held)
    };
  } catch {
    return null;
  }
}

function remember() {
  const audio = audioNode;
  if (applying || !audio?.dataset.episodeId) return;
  const record: PlaybackRecord = {
    episodeId: audio.dataset.episodeId,
    time: audio.currentTime,
    rate: audio.playbackRate,
    held
  };
  localStorage.setItem(PLAYBACK_KEY, JSON.stringify(record));
  lastWrite = Date.now();
}

function rememberSoon() {
  if (Date.now() - lastWrite < 5000) return;
  remember();
}

function shouldResume(saved: PlaybackRecord, episodeId: string, start: number, boundary: number | null) {
  if (saved.episodeId !== episodeId || saved.time < start - 1) return false;
  if (boundary == null) return true;
  return saved.time <= boundary + 1.5;
}

function nearestRate(value: number): string {
  return rates.reduce((best, item) =>
    Math.abs(Number(item) - value) < Math.abs(Number(best) - value) ? item : best
  );
}

function publish() {
  const audio = audioNode;
  const next: PlaybackSnapshot = {
    episodeId: audio?.dataset.episodeId ?? "",
    title: audio?.dataset.title ?? "",
    seconds: audio?.currentTime || 0,
    rate: nearestRate(audio?.playbackRate || 1),
    parkedVideos: parked.size
  };
  if (
    next.episodeId === snapshot.episodeId &&
    next.title === snapshot.title &&
    next.seconds === snapshot.seconds &&
    next.rate === snapshot.rate &&
    next.parkedVideos === snapshot.parkedVideos
  ) {
    return;
  }
  snapshot = next;
  for (const listener of listeners) listener();
}

function holdAtBoundary() {
  const audio = audioNode;
  if (!audio || stopAt == null) return;
  if (audio.currentTime < stopAt - 0.2) {
    held = false;
    return;
  }
  if (!held && audio.currentTime >= stopAt) {
    held = true;
    audio.pause();
    if (audio.currentTime > stopAt) audio.currentTime = stopAt;
  }
}

function onTime() {
  if (applying && (audioNode?.readyState ?? 0) >= 1) applying = false;
  holdAtBoundary();
  rememberSoon();
  publish();
}

function onSeeked() {
  holdAtBoundary();
  remember();
  publish();
}

function onPause() {
  if (applying) return;
  remember();
  publish();
}

function label(audio: HTMLAudioElement, episode: ChangelogEpisode) {
  audio.dataset.title = episode.title;
  audio.setAttribute("aria-label", `${episode.title} 音频`);
}

export function getAudio(): HTMLAudioElement {
  if (!audioNode) {
    audioNode = document.createElement("audio");
    audioNode.controls = true;
    audioNode.preload = "metadata";
    audioNode.addEventListener("timeupdate", onTime);
    audioNode.addEventListener("seeked", onSeeked);
    audioNode.addEventListener("pause", onPause);
    parkRoot().appendChild(audioNode);
    window.addEventListener("pagehide", () => remember());
  }
  return audioNode;
}

export function subscribePlayback(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPlaybackSnapshot(): PlaybackSnapshot {
  return snapshot;
}

export function mountAudio(host: HTMLElement) {
  host.appendChild(getAudio());
}

export function claimEpisode(episode: ChangelogEpisode, start: number, boundary: number | null) {
  const audio = getAudio();
  const saved = readRecord();
  const same = audio.dataset.episodeId === episode.id && Boolean(audio.getAttribute("src"));
  stopAt = boundary;
  label(audio, episode);
  if (same) {
    if (!applying && (boundary == null || audio.currentTime < boundary - 0.2)) held = false;
    publish();
    return;
  }
  applying = true;
  audio.dataset.episodeId = episode.id;
  audio.src = episode.audioUrl;
  const resume = saved && shouldResume(saved, episode.id, start, boundary) ? saved.time : start;
  held = Boolean(saved?.held && saved.episodeId === episode.id && boundary != null && resume >= boundary - 0.2);
  audio.playbackRate = saved?.episodeId === episode.id ? saved.rate : 1;
  const apply = () => {
    if (audio.dataset.episodeId !== episode.id) return;
    audio.currentTime = resume;
    applying = false;
    publish();
  };
  audio.addEventListener("loadedmetadata", apply, { once: true });
  if (audio.readyState >= 1) apply();
  publish();
}

export function playFrom(episode: ChangelogEpisode, time: number, boundary: number | null) {
  const audio = getAudio();
  stopAt = boundary;
  if (boundary == null || time < boundary) held = false;
  label(audio, episode);
  const same = audio.dataset.episodeId === episode.id && Boolean(audio.getAttribute("src"));
  const start = () => {
    audio.currentTime = time;
    applying = false;
    publish();
    const pending = audio.play?.();
    void pending?.catch(() => undefined);
  };
  if (!same) {
    applying = true;
    audio.dataset.episodeId = episode.id;
    audio.src = episode.audioUrl;
    audio.addEventListener("loadedmetadata", start, { once: true });
  }
  audio.dataset.episodeId = episode.id;
  start();
}

export function setPlaybackRate(rate: string) {
  const audio = getAudio();
  audio.playbackRate = Number(rate);
  remember();
  publish();
}

export function retainVideo(src: string, title: string): HTMLIFrameElement {
  let frame = videos.get(src);
  if (!frame) {
    frame = document.createElement("iframe");
    frame.src = src;
    frame.title = title;
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    videos.set(src, frame);
  }
  parked.delete(frame);
  publish();
  return frame;
}

export function parkVideo(frame: HTMLIFrameElement) {
  parked.add(frame);
  (videoDock ?? parkRoot()).appendChild(frame);
  publish();
}

export function setVideoDock(node: HTMLElement | null) {
  if (!node && videoDock) {
    for (const frame of [...videoDock.querySelectorAll("iframe")]) {
      parked.add(frame);
      parkRoot().appendChild(frame);
    }
  }
  videoDock = node;
  if (!node) return;
  for (const frame of parked) node.appendChild(frame);
}

export function resetPlaybackForTests() {
  if (!audioNode) {
    parked.clear();
    videos.clear();
    return;
  }
  applying = true;
  audioNode.removeAttribute("src");
  delete audioNode.dataset.episodeId;
  delete audioNode.dataset.title;
  audioNode.removeAttribute("aria-label");
  stopAt = null;
  held = false;
  lastWrite = 0;
  for (const frame of videos.values()) frame.remove();
  videos.clear();
  parked.clear();
  applying = false;
  publish();
}
