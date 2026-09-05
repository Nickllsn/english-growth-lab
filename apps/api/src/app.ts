import express, { type Express } from "express";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { EntryStore, InvalidEntryFileError } from "./entries/entry-store.js";
import { loadRoadmap } from "./roadmap/roadmap-store.js";

export interface AppOptions {
  roadmapPath?: string;
  entriesDir?: string;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const roadmapPath =
    options.roadmapPath ?? resolve(process.cwd(), "../../content/roadmap.json");
  const entryStore = new EntryStore(
    options.entriesDir ?? resolve(process.cwd(), "../../data/entries")
  );

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
      response.json(await entryStore.save(request.body));
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

  return app;
}
