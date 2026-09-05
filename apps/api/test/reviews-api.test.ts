import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const review = {
  week: "2026-W36",
  theme: "Linux Performance",
  materials: [{ title: "Article", url: "https://example.com/article" }],
  technicalPerspective: "Measurement should precede optimization.",
  businessPerspective: "Performance affects infrastructure cost.",
  myView: "I should measure production workloads first.",
  reusedExpressions: ["in practice"],
  nextWeek: "Compare two architecture articles."
};

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "egl-reviews-api-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("reviews API", () => {
  it("validates, saves and lists a weekly review", async () => {
    const app = createApp({
      entriesDir: join(directory, "entries"),
      reviewsDir: join(directory, "outputs"),
      databasePath: join(directory, "learning.db"),
      roadmapPath: resolve(process.cwd(), "../../content/roadmap.json")
    });

    const saved = await request(app)
      .put("/api/reviews/2026-W36")
      .send(review);
    const listed = await request(app).get("/api/reviews");

    expect(saved.status).toBe(200);
    expect(saved.body.markdown).toContain("# 2026-W36 Weekly Review");
    expect(listed.body.reviews[0]).toEqual(
      expect.objectContaining({ week: "2026-W36" })
    );
  });

  it("rejects a week that differs from the request path", async () => {
    const app = createApp({
      entriesDir: join(directory, "entries"),
      reviewsDir: join(directory, "outputs"),
      databasePath: join(directory, "learning.db"),
      roadmapPath: resolve(process.cwd(), "../../content/roadmap.json")
    });

    const response = await request(app)
      .put("/api/reviews/2026-W37")
      .send(review);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
