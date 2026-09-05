import express, { type Express } from "express";
import { resolve } from "node:path";
import { loadRoadmap } from "./roadmap/roadmap-store.js";

export interface AppOptions {
  roadmapPath?: string;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const roadmapPath =
    options.roadmapPath ?? resolve(process.cwd(), "../../content/roadmap.json");

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

  return app;
}
