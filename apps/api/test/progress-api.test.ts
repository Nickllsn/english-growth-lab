import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { validEntry } from "./fixtures.js";

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "egl-progress-api-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("GET /api/progress", () => {
  it("reflects saved daily entries", async () => {
    const app = createApp({
      entriesDir: join(directory, "entries"),
      databasePath: join(directory, "learning.db"),
      roadmapPath: resolve(process.cwd(), "../../content/roadmap.json"),
      today: () => "2026-09-05"
    });

    await request(app).put("/api/entries/2026-09-05").send(validEntry);
    const response = await request(app).get("/api/progress");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        currentStreak: 1,
        completedDays: 1,
        totalMinutes: 20
      })
    );
  });
});
