import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  return app;
}
