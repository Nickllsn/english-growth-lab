import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  openStatsCache,
  StatsCache
} from "../src/stats/stats-cache.js";
import { validEntry } from "./fixtures.js";

let directory: string;
let cache: StatsCache | undefined;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "egl-stats-"));
});

afterEach(async () => {
  cache?.close();
  cache = undefined;
  await rm(directory, { recursive: true, force: true });
});

describe("StatsCache", () => {
  it("rebuilds progress from readable entries", () => {
    cache = new StatsCache(join(directory, "learning.db"));
    cache.rebuild([
      validEntry,
      {
        ...validEntry,
        date: "2026-09-06",
        completedAt: "2026-09-06T08:30:00.000Z"
      }
    ]);

    const stats = cache.read("2026-09-06");

    expect(stats.completedDays).toBe(2);
    expect(stats.currentStreak).toBe(2);
    expect(stats.totalMinutes).toBe(40);
  });

  it("quarantines a corrupt database and creates a fresh cache", async () => {
    const path = join(directory, "learning.db");
    await writeFile(path, "not a sqlite database");

    cache = await openStatsCache(path);
    cache.rebuild([validEntry]);

    expect(cache.read("2026-09-05").completedDays).toBe(1);
    expect(
      (await readdir(directory)).some((name) =>
        name.startsWith("learning.db.corrupt-")
      )
    ).toBe(true);
  });
});
