import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  renderWeeklyReview,
  ReviewStore
} from "../src/reviews/review-store.js";

const review = {
  week: "2026-W36",
  theme: "Linux Performance",
  materials: [
    {
      title: "Finding the bottleneck",
      url: "https://example.com/article"
    }
  ],
  technicalPerspective: "Measurement should precede optimization.",
  businessPerspective: "Performance affects infrastructure cost.",
  myView: "I should measure production workloads first.",
  reusedExpressions: ["in practice"],
  nextWeek: "Compare two architecture articles."
};

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "egl-reviews-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("renderWeeklyReview", () => {
  it("renders deterministic readable Markdown", () => {
    expect(renderWeeklyReview(review)).toBe(`# 2026-W36 Weekly Review

## Theme
Linux Performance

## Materials
- [Finding the bottleneck](https://example.com/article)

## Technical Perspective
Measurement should precede optimization.

## Business or Social Perspective
Performance affects infrastructure cost.

## My View
I should measure production workloads first.

## Reused Expressions
- in practice

## Next Week
Compare two architecture articles.
`);
  });
});

describe("ReviewStore", () => {
  it("saves and lists weekly Markdown newest first", async () => {
    const store = new ReviewStore(directory);

    await store.save(review);
    await store.save({ ...review, week: "2026-W37", theme: "Architecture" });

    expect(await store.list()).toEqual([
      expect.objectContaining({ week: "2026-W37", theme: "Architecture" }),
      expect.objectContaining({ week: "2026-W36", theme: "Linux Performance" })
    ]);
    expect(
      await readFile(join(directory, "2026-W36-review.md"), "utf8")
    ).toBe(renderWeeklyReview(review));
  });
});
