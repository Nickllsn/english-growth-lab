import { mkdirSync } from "node:fs";
import { rename } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  dailyEntrySchema,
  type DailyEntry
} from "../entries/entry-schema.js";
import {
  calculateStats,
  type ProgressStats
} from "./calculate-stats.js";

export class StatsCache {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.database = new DatabaseSync(path);
    try {
      this.database.exec(`
        CREATE TABLE IF NOT EXISTS entry_stats (
          date TEXT PRIMARY KEY,
          topic TEXT NOT NULL,
          source TEXT NOT NULL,
          reading_minutes INTEGER NOT NULL,
          listening_minutes INTEGER NOT NULL,
          understanding INTEGER NOT NULL,
          word_count INTEGER NOT NULL,
          expression_count INTEGER NOT NULL,
          reused_expression_count INTEGER NOT NULL,
          completed_at TEXT NOT NULL,
          payload TEXT NOT NULL
        )
      `);
    } catch (error) {
      this.database.close();
      throw error;
    }
  }

  rebuild(entries: DailyEntry[]): void {
    const insert = this.database.prepare(`
      INSERT INTO entry_stats (
        date, topic, source, reading_minutes, listening_minutes,
        understanding, word_count, expression_count,
        reused_expression_count, completed_at, payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.exec("DELETE FROM entry_stats");
      for (const entry of entries.filter(({ completedAt }) => completedAt)) {
        insert.run(
          entry.date,
          entry.topic,
          entry.material.source,
          entry.readingMinutes,
          entry.listeningMinutes,
          entry.understanding,
          (entry.summary.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []).length,
          entry.expressions.length,
          entry.expressions.filter(({ usedInSummary }) => usedInSummary).length,
          entry.completedAt!,
          JSON.stringify(entry)
        );
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  read(today: string): ProgressStats {
    const rows = this.database
      .prepare("SELECT payload FROM entry_stats ORDER BY date")
      .all() as Array<{ payload: string }>;
    const entries = rows.map(({ payload }) =>
      dailyEntrySchema.parse(JSON.parse(payload))
    );
    return calculateStats(entries, today);
  }

  close(): void {
    this.database.close();
  }
}

export async function openStatsCache(path: string): Promise<StatsCache> {
  try {
    return new StatsCache(path);
  } catch {
    await rename(path, `${path}.corrupt-${Date.now()}`);
    return new StatsCache(path);
  }
}
