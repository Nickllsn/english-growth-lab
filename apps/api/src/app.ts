import express, { type Express } from "express";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { EntryStore, InvalidEntryFileError } from "./entries/entry-store.js";
import { loadRoadmap } from "./roadmap/roadmap-store.js";
import { ReviewStore } from "./reviews/review-store.js";
import { openStatsCache } from "./stats/stats-cache.js";

export interface AppOptions {
  roadmapPath?: string;
  entriesDir?: string;
  reviewsDir?: string;
  databasePath?: string;
  today?: () => string;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const roadmapPath =
    options.roadmapPath ?? resolve(process.cwd(), "../../content/roadmap.json");
  const entryStore = new EntryStore(
    options.entriesDir ?? resolve(process.cwd(), "../../data/entries")
  );
  const reviewStore = new ReviewStore(
    options.reviewsDir ?? resolve(process.cwd(), "../../outputs")
  );
  const databasePath =
    options.databasePath ?? resolve(process.cwd(), "../../data/learning.db");
  const today =
    options.today ?? (() => new Date().toLocaleDateString("en-CA"));

  const synchronizeStats = async () => {
    const cache = await openStatsCache(databasePath);
    try {
      cache.rebuild(await entryStore.list());
    } finally {
      cache.close();
    }
  };

  app.use(express.json());
  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });
  app.get("/api/roadmap", async (_request, response) => {
    try {
      response.json({ days: await loadRoadmap(roadmapPath) });
    } catch {
      response.status(500).json({
        error: {
          code: "ROADMAP_INVALID",
          message: "学习路线文件无效"
        }
      });
    }
  });
  app.get("/api/entries", async (_request, response) => {
    try {
      response.json({ entries: await entryStore.list() });
    } catch (error) {
      const fileName =
        error instanceof InvalidEntryFileError ? error.fileName : undefined;
      response.status(500).json({
        error: {
          code: "ENTRY_FILE_INVALID",
          message: "学习记录文件无效",
          ...(fileName ? { fileName } : {})
        }
      });
    }
  });
  app.get("/api/entries/:date", async (request, response) => {
    try {
      const entry = await entryStore.get(request.params.date);
      if (!entry) {
        response.status(404).json({
          error: {
            code: "ENTRY_NOT_FOUND",
            message: "没有找到这一天的学习记录"
          }
        });
        return;
      }
      response.json(entry);
    } catch {
      response.status(500).json({
        error: {
          code: "ENTRY_FILE_INVALID",
          message: "学习记录文件无效"
        }
      });
    }
  });
  app.put("/api/entries/:date", async (request, response) => {
    if (
      typeof request.body !== "object" ||
      request.body === null ||
      request.body.date !== request.params.date
    ) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "路径日期与记录日期必须一致",
          fields: { date: ["路径日期与记录日期必须一致"] }
        }
      });
      return;
    }

    try {
      const entry = await entryStore.save(request.body);
      await synchronizeStats();
      response.json(entry);
    } catch (error) {
      if (error instanceof ZodError) {
        response.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "请检查填写内容",
            fields: error.flatten().fieldErrors
          }
        });
        return;
      }

      response.status(500).json({
        error: {
          code: "ENTRY_WRITE_FAILED",
          message: "学习记录保存失败"
        }
      });
    }
  });
  app.get("/api/progress", async (_request, response) => {
    try {
      await synchronizeStats();
      const cache = await openStatsCache(databasePath);
      try {
        response.json(cache.read(today()));
      } finally {
        cache.close();
      }
    } catch {
      response.status(500).json({
        error: {
          code: "PROGRESS_UNAVAILABLE",
          message: "进度统计暂时不可用"
        }
      });
    }
  });
  app.get("/api/reviews", async (_request, response) => {
    try {
      response.json({ reviews: await reviewStore.list() });
    } catch {
      response.status(500).json({
        error: {
          code: "REVIEWS_UNAVAILABLE",
          message: "每周复盘暂时不可用"
        }
      });
    }
  });
  app.put("/api/reviews/:week", async (request, response) => {
    if (
      typeof request.body !== "object" ||
      request.body === null ||
      request.body.week !== request.params.week
    ) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "路径周次与复盘周次必须一致",
          fields: { week: ["路径周次与复盘周次必须一致"] }
        }
      });
      return;
    }

    try {
      response.json(await reviewStore.save(request.body));
    } catch (error) {
      if (error instanceof ZodError) {
        response.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "请检查填写内容",
            fields: error.flatten().fieldErrors
          }
        });
        return;
      }

      response.status(500).json({
        error: {
          code: "REVIEW_WRITE_FAILED",
          message: "每周复盘保存失败"
        }
      });
    }
  });

  return app;
}
