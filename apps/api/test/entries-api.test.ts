import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { validEntry } from "./fixtures.js";

let entriesDir: string;

beforeEach(async () => {
  entriesDir = await mkdtemp(join(tmpdir(), "egl-api-entries-"));
});

afterEach(async () => {
  await rm(entriesDir, { recursive: true, force: true });
});

describe("entries API", () => {
  it("returns 404 for a missing date", async () => {
    const response = await request(
      createApp({
        entriesDir,
        roadmapPath: resolve(process.cwd(), "../../content/roadmap.json")
      })
    ).get("/api/entries/2026-09-05");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ENTRY_NOT_FOUND");
  });

  it("validates and persists a daily entry", async () => {
    const app = createApp({
      entriesDir,
      roadmapPath: resolve(process.cwd(), "../../content/roadmap.json")
    });

    const saved = await request(app)
      .put("/api/entries/2026-09-05")
      .send(validEntry);
    const listed = await request(app).get("/api/entries");

    expect(saved.status).toBe(200);
    expect(listed.body.entries).toEqual([validEntry]);
  });

  it("returns field errors for an invalid completed entry", async () => {
    const response = await request(
      createApp({
        entriesDir,
        roadmapPath: resolve(process.cwd(), "../../content/roadmap.json")
      })
    )
      .put("/api/entries/2026-09-05")
      .send({ ...validEntry, summary: "One sentence." });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        fields: expect.objectContaining({
          summary: expect.any(Array)
        })
      })
    );
  });
});
