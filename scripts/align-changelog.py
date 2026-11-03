#!/usr/bin/env python3
"""Align each Changelog transcript paragraph to the public episode audio.

The markdown transcript is read, not modified. Word times come from a local
JSON file produced by faster-whisper (base.en) and are not committed.
Official timestamps already printed in the transcript stay exact.

Usage:
  python3 scripts/align-changelog.py <transcript.md> <words.json> <out.json>
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from difflib import SequenceMatcher
from pathlib import Path


def normalize(token: str) -> str:
    token = token.lower().replace("’", "'").replace("‘", "'")
    return re.sub(r"^[^a-z0-9']+|[^a-z0-9']+$", "", token)


def tokens(text: str) -> list[str]:
    return [word for word in (normalize(raw) for raw in text.split()) if word]


def paragraph_end(pairs: list[tuple[int, float]]) -> float:
    times = sorted(time for _token, time in pairs)
    median = times[len(times) // 2]
    span = max(12.0, (max(token for token, _time in pairs) - min(token for token, _time in pairs)) * 0.45 + 4)
    cluster = [time for _token, time in pairs if median - span <= time <= median + span]
    return max(cluster or times)


def paragraph_start(pairs: list[tuple[int, float]]) -> float:
    pairs = sorted(pairs)
    times = sorted(time for _token, time in pairs)
    median = times[len(times) // 2]
    span = max(12.0, (pairs[-1][0] - pairs[0][0]) * 0.45 + 4)
    cluster = [(token, time) for token, time in pairs if median - span <= time <= median + 4]
    if not cluster:
        cluster = pairs
    token_index, time = min(cluster)
    if token_index == 0:
        return time
    if token_index <= 8:
        return time - token_index * 0.28
    return time


def load_drafts(transcript: Path) -> list[dict]:
    root = Path(__file__).resolve().parents[1]
    completed = subprocess.run(
        ["npx", "vite-node", str(root / "scripts" / "dump-drafts.ts"), str(transcript)],
        cwd=root / "apps" / "web",
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def align(drafts: list[dict], words: list[dict]) -> tuple[list[float | None], float, dict[int, float]]:
    official: list[tuple[int, int, str]] = []
    for index, draft in enumerate(drafts):
        for token_index, word in enumerate(tokens(draft["text"])):
            official.append((index, token_index, word))
    spoken: list[tuple[float, str]] = []
    for word in words:
        token = normalize(word["word"])
        if token:
            spoken.append((float(word["start"]), token))

    hits: dict[int, list[tuple[int, float]]] = {}
    if official and spoken:
        matcher = SequenceMatcher(
            a=[word for _index, _token, word in official],
            b=[word for _start, word in spoken],
            autojunk=False,
        )
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                width = min(i2 - i1, j2 - j1)
                for offset in range(width):
                    paragraph, token_index, _word = official[i1 + offset]
                    hits.setdefault(paragraph, []).append((token_index, spoken[j1 + offset][0]))
        ratio = matcher.ratio()
    else:
        ratio = 0

    matched = {index: paragraph_start(pairs) for index, pairs in hits.items()}
    endings = {index: paragraph_end(pairs) for index, pairs in hits.items()}
    starts: list[float | None] = []
    for index, draft in enumerate(drafts):
        measured = matched.get(index)
        stamp = None if draft["stamp"] is None else float(draft["stamp"])
        # A printed timestamp is kept when it lands on the same moment.
        # Some episodes drift, so a larger gap follows the words that were actually heard.
        if measured is not None and (stamp is None or abs(measured - stamp) > 1.5):
            starts.append(measured)
        elif stamp is not None:
            starts.append(stamp)
            endings.setdefault(index, stamp)
        else:
            starts.append(None)

    index = 0
    while index < len(starts):
        if starts[index] is not None:
            index += 1
            continue
        end = index
        while end < len(starts) and starts[end] is None:
            end += 1
        previous = index - 1
        left = endings.get(previous, starts[previous] if previous >= 0 else 0.0)
        right = starts[end] if end < len(starts) else None
        count = end - index
        for offset, cursor in enumerate(range(index, end)):
            if right is None:
                starts[cursor] = float(left) + 0.4 * (offset + 1)
            elif float(right) - float(left) <= 0.3 * (count + 1):
                starts[cursor] = float(left) + (offset + 1) * (float(right) - float(left)) / (count + 1)
            else:
                starts[cursor] = min(float(right) - 0.2 * (count - offset), float(left) + 0.45 * (offset + 1))
        index = end
    return starts, ratio, matched


def consistency(drafts: list[dict], starts: list[float | None], words: list[dict]) -> tuple[float, list[str]]:
    spoken = [(float(word["start"]), normalize(word["word"])) for word in words if normalize(word["word"])]
    hits = 0
    checked = 0
    misses: list[str] = []
    for draft, start in zip(drafts, starts):
        first = tokens(draft["text"])[:6]
        if start is None or len(first) < 3:
            continue
        checked += 1
        window = [word for time, word in spoken if float(start) - 0.6 <= time <= float(start) + 3]
        overlap = sum(word in window for word in first[:4])
        if overlap >= 2:
            hits += 1
        else:
            misses.append(f"{float(start):8.2f} {draft['text'][:70]}")
    return (hits / checked if checked else 0), misses


def main() -> None:
    transcript, words_path, out_path = sys.argv[1:]
    drafts = load_drafts(Path(transcript))
    words = json.loads(Path(words_path).read_text(encoding="utf-8"))
    _raw_starts, ratio, matched = align([{**draft, "stamp": None} for draft in drafts], words)
    errors = [
        abs(float(draft["stamp"]) - matched[index])
        for index, draft in enumerate(drafts)
        if draft["stamp"] is not None and index in matched
    ]
    missing = sum(1 for index, draft in enumerate(drafts) if draft["stamp"] is not None and index not in matched)
    final_starts, _ratio, _matched = align(drafts, words)
    score, misses = consistency(drafts, final_starts, words)
    if errors:
        errors.sort()
        median = errors[len(errors) // 2]
        over = sum(error > 2 for error in errors)
        worst = max(errors)
        print(
            f"paragraphs {len(drafts)} words {len(words)} match {ratio:.3f} "
            f"stamp median {median:.2f}s max {worst:.2f}s off-by-2s {over}/{len(errors)} "
            f"unmatched-stamps {missing} line-check {score:.3f}"
        )
    else:
        worst = 0
        print(f"paragraphs {len(drafts)} words {len(words)} match {ratio:.3f} line-check {score:.3f}")
    for line in misses[:12]:
        print("miss", line)
    if ratio < 0.55 or score < 0.75:
        raise SystemExit("alignment does not agree with the transcript's own timestamps")
    payload = {
        "model": "Systran/faster-whisper-base.en",
        "matchRatio": round(ratio, 4),
        "starts": [round(float(start), 3) for start in final_starts],
    }
    Path(out_path).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
