import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadRoadmap } from "../src/roadmap/roadmap-store.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

describe("loadRoadmap", () => {
  it("loads the complete four-stage route", async () => {
    const roadmapPath = resolve(process.cwd(), "../../content/roadmap.json");

    const days = await loadRoadmap(roadmapPath);

    expect(days).toHaveLength(30);
    expect(days.map((day) => day.day)).toEqual(
      Array.from({ length: 30 }, (_, index) => index + 1)
    );
    expect(days[0].theme).toContain("Linux");
    expect(days[7].theme).toContain("架构");
    expect(days[14].theme).toContain("AI");
    expect(days[21].theme).toContain("商业");
  });

  it("rejects a day whose suggested time is not 30 minutes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "egl-roadmap-"));
    temporaryDirectories.push(directory);
    const path = join(directory, "roadmap.json");
    await writeFile(
      path,
      JSON.stringify({
        days: [
          {
            day: 1,
            week: 1,
            theme: "Linux",
            source: {
              name: "InfoQ",
              url: "https://www.infoq.com/",
              difficulty: 3
            },
            focus: "IO",
            suggestedMinutes: { reading: 10, listening: 10, output: 5 }
          }
        ]
      })
    );

    await expect(loadRoadmap(path)).rejects.toThrow("建议时长总和必须为 30 分钟");
  });
});

describe("GET /api/roadmap", () => {
  it("returns all validated roadmap days", async () => {
    const roadmapPath = resolve(process.cwd(), "../../content/roadmap.json");

    const response = await request(createApp({ roadmapPath })).get("/api/roadmap");

    expect(response.status).toBe(200);
    expect(response.body.days).toHaveLength(30);
  });
});
