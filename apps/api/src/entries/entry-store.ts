import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { dailyEntrySchema, type DailyEntry } from "./entry-schema.js";

export type AtomicWriter = (path: string, contents: string) => Promise<void>;

export async function atomicWrite(
  path: string,
  contents: string
): Promise<void> {
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  await mkdir(join(path, ".."), { recursive: true });

  try {
    await writeFile(temporaryPath, contents, "utf8");
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

export class InvalidEntryFileError extends Error {
  constructor(public readonly fileName: string) {
    super(`学习记录文件无效: ${fileName}`);
  }
}

export class EntryStore {
  constructor(
    private readonly entriesDir: string,
    private readonly writer: AtomicWriter = atomicWrite
  ) {}

  async list(): Promise<DailyEntry[]> {
    await mkdir(this.entriesDir, { recursive: true });
    const names = (await readdir(this.entriesDir))
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .sort();

    return Promise.all(
      names.map(async (name) => {
        try {
          const contents = await readFile(join(this.entriesDir, name), "utf8");
          return dailyEntrySchema.parse(JSON.parse(contents));
        } catch {
          throw new InvalidEntryFileError(name);
        }
      })
    );
  }

  async get(date: string): Promise<DailyEntry | null> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return null;
    }

    try {
      const contents = await readFile(join(this.entriesDir, `${date}.json`), "utf8");
      return dailyEntrySchema.parse(JSON.parse(contents));
    } catch (error) {
      const fileError = error as NodeJS.ErrnoException;
      if (fileError.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async save(input: unknown): Promise<DailyEntry> {
    const entry = dailyEntrySchema.parse(input);
    const path = join(this.entriesDir, `${entry.date}.json`);
    await this.writer(path, `${JSON.stringify(entry, null, 2)}\n`);
    return entry;
  }
}
