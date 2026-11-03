#!/usr/bin/env python3
"""Write word-level times for a Changelog mp3.

The audio is read from a local file and is not stored in the repo.
Long files are transcribed in short pieces so a sentence keeps its real time.

Usage:
  python3 scripts/transcribe-changelog.py <audio.mp3> <words.json>
"""

from __future__ import annotations

import json
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

CHUNK = 60.0
STEP = 40.0


def load_audio(path: str) -> np.ndarray:
    completed = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "pipe:1"],
        check=True,
        stdout=subprocess.PIPE,
    )
    return np.frombuffer(completed.stdout, dtype=np.int16).astype(np.float32) / 32768.0


def transcribe(path: str, out_path: str) -> None:
    audio = load_audio(path)
    total = audio.shape[0] / 16000
    print(f"seconds {total:.1f}", flush=True)
    model = WhisperModel("base.en", device="cpu", compute_type="int8", cpu_threads=4)
    found: list[tuple[float, float, str, float]] = []
    start = 0.0
    while start < total:
        stop = min(start + CHUNK, total)
        piece = audio[int(start * 16000) : int(stop * 16000)]
        length = stop - start
        segments, _info = model.transcribe(
            piece,
            word_timestamps=True,
            vad_filter=False,
            beam_size=1,
            language="en",
            condition_on_previous_text=False,
        )
        for segment in segments:
            for word in segment.words or []:
                local = float(word.start)
                if local < 0 or local > length + 0.2:
                    continue
                edge = min(local, length - local)
                found.append((start + local, start + float(word.end), word.word, edge))
        print(f"through {stop:.0f}s words {len(found)}", flush=True)
        if stop >= total - 0.05:
            break
        start += STEP
    found.sort(key=lambda item: (item[0], -item[3]))
    words: list[dict] = []
    for begin, end, text, edge in found:
        token = "".join(ch for ch in text.lower() if ch.isalnum() or ch == "'")
        duplicate = False
        for previous in reversed(words[-8:]):
            if begin - previous["start"] > 1.2:
                break
            previous_token = "".join(ch for ch in previous["word"].lower() if ch.isalnum() or ch == "'")
            if token and token == previous_token:
                if edge > previous["edge"]:
                    previous.update(start=round(begin, 3), end=round(end, 3), word=text, edge=edge)
                duplicate = True
                break
        if duplicate:
            continue
        words.append({"start": round(begin, 3), "end": round(end, 3), "word": text, "edge": edge})
    for word in words:
        word.pop("edge", None)
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(words, handle)
    print(f"wrote {len(words)} {out_path}", flush=True)


if __name__ == "__main__":
    transcribe(sys.argv[1], sys.argv[2])
