import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EntryStore } from "../src/entries/entry-store.js";
import { validEntry } from "./fixtures.js";

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "egl-entries-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("EntryStore", () => {
  it("saves, reads and updates one readable file per date", async () => {
    const store = new EntryStore(directory);

    await store.save(validEntry);
    expect(await store.get(validEntry.date)).toEqual(validEntry);

    const updated = { ...validEntry, readingMinutes: 15 };
    await store.save(updated);

    expect(await store.list()).toEqual([updated]);
    expect(
      (await readdir(directory)).filter((name) => name.endsWith(".json"))
    ).toEqual(["2026-09-05.json"]);
  });

  it("preserves the previous file when an atomic update fails", async () => {
    const store = new EntryStore(directory);
    await store.save(validEntry);

    const failingStore = new EntryStore(directory, async () => {
      throw new Error("simulated rename failure");
    });

    await expect(
      failingStore.save({ ...validEntry, readingMinutes: 20 })
    ).rejects.toThrow("simulated rename failure");

    const persisted = JSON.parse(
      await readFile(join(directory, "2026-09-05.json"), "utf8")
    );
    expect(persisted.readingMinutes).toBe(10);
  });
});
