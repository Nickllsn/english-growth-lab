# English Growth Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Windows 本地学习仪表盘，用 30 天“阅读 → 听力 → 表达”闭环积累可进入 Git 的英文学习成果，并可视化真实进步。

**Architecture:** npm workspaces 管理 React/Vite 前端与 Express API。每日 JSON 和每周 Markdown 是唯一事实来源；API 负责校验和原子写入，SQLite 只作为可删除重建的统计缓存。前端只通过 HTTP API 访问数据。

**Tech Stack:** Node.js 22+、npm 10+、TypeScript 5、React 19、Vite 7、Express 5、Zod 4、better-sqlite3、Recharts、Vitest、Testing Library、Playwright

## Global Constraints

- 第一版运行于 Windows 本机，优先桌面浏览器，同时保证窄屏可以完成每日记录。
- `content/roadmap.json` 是路线唯一事实来源。
- `data/entries/*.json` 与 `outputs/*.md` 是学习成果唯一事实来源并纳入 Git。
- `data/learning.db` 是可重建缓存，必须加入 `.gitignore`。
- 不实现账号、云同步、RSS、AI 点评、自动 Git commit、积分或排行榜。
- 所有用户可见的校验错误使用中文。
- 根目录 `npm run dev` 必须同时启动前端和 API。

---

## Locked File Map

```text
.
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── entries/entry-schema.ts
│   │   │   ├── entries/entry-store.ts
│   │   │   ├── roadmap/roadmap-store.ts
│   │   │   ├── reviews/review-store.ts
│   │   │   └── stats/
│   │   │       ├── calculate-stats.ts
│   │   │       └── stats-cache.ts
│   │   └── test/
│   └── web/
│       ├── src/
│       │   ├── api/client.ts
│       │   ├── components/
│       │   ├── pages/
│       │   ├── App.tsx
│       │   └── styles.css
│       └── test/
├── content/roadmap.json
├── data/entries/.gitkeep
├── outputs/.gitkeep
├── e2e/learning-flow.spec.ts
├── playwright.config.ts
├── package.json
└── README.md
```

---

### Task 1: 可运行的工作区骨架

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Test: `apps/api/test/health.test.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/styles.css`
- Create: `data/entries/.gitkeep`
- Create: `outputs/.gitkeep`

**Interfaces:**
- Produces: `createApp(): Express`
- Produces: `GET /api/health -> { ok: true }`
- Produces: root scripts `dev`, `test`, `typecheck`, `build`

- [ ] **Step 1: 写失败的 API 健康检查测试**

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns a healthy response", async () => {
    const response = await request(createApp()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: 创建 workspace 配置并安装依赖**

根 `package.json`：

```json
{
  "name": "english-growth-lab",
  "private": true,
  "workspaces": ["apps/*"],
  "engines": { "node": ">=22", "npm": ">=10" },
  "scripts": {
    "dev": "concurrently -k \"npm run dev -w @egl/api\" \"npm run dev -w @egl/web\"",
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "build": "npm run build --workspaces --if-present"
  },
  "devDependencies": {
    "concurrently": "^9.2.0"
  }
}
```

API 使用 Express、CORS、tsx、TypeScript、Vitest、Supertest；Web 使用 React、React Router、Vite、Vitest、Testing Library。执行 `npm install` 生成锁文件。

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test -w @egl/api`

Expected: FAIL，原因是 `src/app.ts` 尚不存在。

- [ ] **Step 4: 实现最小 API 与网页壳**

```ts
// apps/api/src/app.ts
import express from "express";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/api/health", (_request, response) => response.json({ ok: true }));
  return app;
}
```

```tsx
// apps/web/src/App.tsx
export function App() {
  return <main><h1>English Growth Lab</h1><p>每天进步一点点</p></main>;
}
```

`server.ts` 只负责监听 `127.0.0.1:4310`；Vite 使用 `4311` 并把 `/api` 代理到 API。

- [ ] **Step 5: 验证工作区**

Run: `npm test && npm run typecheck && npm run build`

Expected: 健康检查 PASS，两个 workspace 类型检查和构建均退出 0。

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore apps data/entries/.gitkeep outputs/.gitkeep
git commit -m "feat: scaffold local learning workspace"
```

---

### Task 2: 30 天路线

**Files:**
- Create: `content/roadmap.json`
- Create: `apps/api/src/roadmap/roadmap-store.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/roadmap.test.ts`

**Interfaces:**
- Produces: `RoadmapDay`
- Produces: `loadRoadmap(path): Promise<RoadmapDay[]>`
- Produces: `GET /api/roadmap -> { days: RoadmapDay[] }`

- [ ] **Step 1: 写失败的路线测试**

```ts
const days = await loadRoadmap(roadmapPath);
expect(days).toHaveLength(30);
expect(days.map(day => day.day)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
expect(days[0].theme).toContain("Linux");
expect(days[7].theme).toContain("架构");
expect(days[14].theme).toContain("AI");
expect(days[21].theme).toContain("商业");
```

另测重复日期、缺少来源、分钟数总和不等于 30 时拒绝加载。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -w @egl/api -- roadmap.test.ts`

Expected: FAIL，原因是路线读取模块不存在。

- [ ] **Step 3: 实现路线契约与完整数据**

```ts
export const roadmapDaySchema = z.object({
  day: z.number().int().min(1).max(30),
  week: z.number().int().min(1).max(4),
  theme: z.string().min(1),
  source: z.object({
    name: z.string().min(1),
    url: z.string().url(),
    difficulty: z.number().int().min(1).max(5)
  }),
  focus: z.string().min(1),
  suggestedMinutes: z.object({
    reading: z.number().int().nonnegative(),
    listening: z.number().int().nonnegative(),
    output: z.number().int().nonnegative()
  })
}).refine(value =>
  value.suggestedMinutes.reading +
  value.suggestedMinutes.listening +
  value.suggestedMinutes.output === 30,
  "建议时长总和必须为 30 分钟"
);
```

填满 30 天：

- Day 1–7：Brendan Gregg、InfoQ；CPU、内存、IO、perf、eBPF、可观测性、瓶颈定位。
- Day 8–14：The Pragmatic Engineer、ByteByteGo、InfoQ；架构、分布式、可靠性、工程效率、平台工程。
- Day 15–21：MIT Technology Review、Hacker News；AI 基础设施、科技影响、工程取舍、真实讨论。
- Day 22–30：Stratechery、Paul Graham、Farnam Street；战略、商业模式、产品、创业、决策、最终综合。

- [ ] **Step 4: 增加路线 API**

`createApp` 接受 `{ roadmapPath }` 配置，`GET /api/roadmap` 返回经过校验的 30 天路线。加载错误统一返回：

```json
{ "error": { "code": "ROADMAP_INVALID", "message": "学习路线文件无效" } }
```

- [ ] **Step 5: 验证并提交**

Run: `npm test -w @egl/api && npm run typecheck -w @egl/api`

Expected: 路线单测与 API 测试 PASS。

```bash
git add content apps/api
git commit -m "feat: add thirty-day learning roadmap"
```

---

### Task 3: 每日记录、原子存储与 API

**Files:**
- Create: `apps/api/src/entries/entry-schema.ts`
- Create: `apps/api/src/entries/entry-store.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/entry-schema.test.ts`
- Test: `apps/api/test/entry-store.test.ts`
- Test: `apps/api/test/entries-api.test.ts`

**Interfaces:**
- Produces: `DailyEntry`, `dailyEntrySchema`
- Produces: `EntryStore.list()`, `get(date)`, `save(input)`
- Produces: `GET /api/entries`, `GET /api/entries/:date`, `PUT /api/entries/:date`

- [ ] **Step 1: 写失败的契约测试**

```ts
const validEntry = {
  date: "2026-09-05",
  roadmapDay: 1,
  topic: "Linux Performance",
  material: {
    title: "Finding the bottleneck",
    url: "https://example.com/performance",
    source: "InfoQ"
  },
  readingMinutes: 10,
  listeningMinutes: 10,
  understanding: 3,
  expressions: [
    { text: "the real bottleneck", meaning: "真正的瓶颈", usedInSummary: true },
    { text: "in practice", meaning: "在实践中", usedInSummary: true },
    { text: "at scale", meaning: "大规模场景下", usedInSummary: false }
  ],
  summary: "The article explains a bottleneck. In practice, measurement matters. The method works at scale.",
  completedAt: "2026-09-05T08:30:00.000Z"
};

expect(dailyEntrySchema.safeParse(validEntry).success).toBe(true);
expect(dailyEntrySchema.safeParse({ ...validEntry, summary: "Too short." }).success).toBe(false);
expect(dailyEntrySchema.safeParse({ ...validEntry, expressions: [] }).success).toBe(false);
```

未含 `completedAt` 的草稿允许空表达和空总结。完成记录必须至少 3 个表达和 3 个由 `.?!` 结束的英文句子。

- [ ] **Step 2: 写失败的存储测试**

使用 Vitest 临时目录：

```ts
await store.save(validEntry);
expect(await store.get("2026-09-05")).toEqual(validEntry);
expect((await store.list()).map(item => item.date)).toEqual(["2026-09-05"]);

await store.save({ ...validEntry, readingMinutes: 15 });
expect((await readdir(entriesDir)).filter(name => name.endsWith(".json"))).toHaveLength(1);
```

注入一个会抛错的 rename 函数，验证更新失败后原文件内容保持不变。

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test -w @egl/api -- entry-schema.test.ts entry-store.test.ts`

Expected: FAIL，原因是记录模块不存在。

- [ ] **Step 4: 实现验证与原子写入**

`EntryStore` 签名固定为：

```ts
export class EntryStore {
  constructor(private readonly entriesDir: string) {}
  list(): Promise<DailyEntry[]>;
  get(date: string): Promise<DailyEntry | null>;
  save(input: unknown): Promise<DailyEntry>;
}
```

保存流程：校验输入 → 创建父目录 → UTF-8 写入同目录随机 `.tmp` → rename 替换目标 → 失败时删除临时文件并重新抛错。只读取 `YYYY-MM-DD.json`；无效文件不删除，并通过标准错误响应报告文件名。

- [ ] **Step 5: 实现记录 API**

`PUT /api/entries/:date` 必须校验路径日期与 body 日期一致。Zod 错误转换为：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请检查填写内容",
    "fields": { "summary": ["完成记录至少需要 3 句英文总结"] }
  }
}
```

不存在的日期返回 404；列表按日期升序。

- [ ] **Step 6: 验证并提交**

Run: `npm test -w @egl/api && npm run typecheck -w @egl/api`

Expected: 契约、原子写入、更新语义和路由测试全部 PASS。

```bash
git add apps/api
git commit -m "feat: persist readable daily entries"
```

---

### Task 4: 进度统计与 SQLite 可重建缓存

**Files:**
- Create: `apps/api/src/stats/calculate-stats.ts`
- Create: `apps/api/src/stats/stats-cache.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/server.ts`
- Test: `apps/api/test/calculate-stats.test.ts`
- Test: `apps/api/test/stats-cache.test.ts`

**Interfaces:**
- Produces: `calculateStats(entries, today): ProgressStats`
- Produces: `StatsCache.rebuild(entries)`, `read()`, `close()`
- Produces: `GET /api/progress`

- [ ] **Step 1: 写失败的纯统计测试**

```ts
const stats = calculateStats([
  makeEntry("2026-09-03", 10, 5, 3),
  makeEntry("2026-09-04", 10, 5, 4),
  makeEntry("2026-09-05", 10, 5, 5)
], "2026-09-05");

expect(stats.currentStreak).toBe(3);
expect(stats.longestStreak).toBe(3);
expect(stats.completedDays).toBe(3);
expect(stats.completionRate).toBe(10);
expect(stats.totalMinutes).toBe(45);
expect(stats.expressionCount).toBe(9);
expect(stats.reusedExpressionCount).toBe(6);
```

另测空数据、日期断档、重复日期、英文缩写词和 ISO 周跨年。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -w @egl/api -- calculate-stats.test.ts`

Expected: FAIL，原因是统计函数不存在。

- [ ] **Step 3: 实现纯统计函数**

```ts
export interface ProgressStats {
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  completionRate: number;
  readingMinutes: number;
  listeningMinutes: number;
  totalMinutes: number;
  englishWordCount: number;
  expressionCount: number;
  reusedExpressionCount: number;
  weeklyUnderstanding: Array<{ week: string; average: number }>;
}
```

只统计含 `completedAt` 的记录；按日期去重排序；完成率相对 30 天保留一位小数；英文词匹配 `/[A-Za-z]+(?:['’-][A-Za-z]+)*/g`。

- [ ] **Step 4: 实现 SQLite 缓存与恢复**

SQLite 表保存日期、主题、来源、阅读/听力分钟、理解度、词数、表达数、复用数、完成时间。`rebuild` 在单事务中清表并插入所有有效 JSON。启动时：

1. 从 JSON 加载有效记录。
2. 打开 `data/learning.db`。
3. 打开或 schema 失败时，把损坏文件重命名为 `learning.db.corrupt-<timestamp>`。
4. 新建数据库并重建。

SQLite 永远不反向覆盖 JSON。

- [ ] **Step 5: 增加进度 API 并验证**

Run: `npm test -w @egl/api && npm run typecheck -w @egl/api`

Expected: 纯统计、重建、损坏恢复和 `GET /api/progress` 全部 PASS。

- [ ] **Step 6: Commit**

```bash
git add apps/api package.json package-lock.json
git commit -m "feat: calculate and cache learning progress"
```

---

### Task 5: 每周复盘

**Files:**
- Create: `apps/api/src/reviews/review-store.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/review-store.test.ts`

**Interfaces:**
- Produces: `WeeklyReview`, `renderWeeklyReview(review)`
- Produces: `GET /api/reviews`, `PUT /api/reviews/:isoWeek`
- Writes: `outputs/YYYY-Www-review.md`

- [ ] **Step 1: 写失败的 Markdown 测试**

```ts
expect(renderWeeklyReview(review)).toBe(`# 2026-W36 Weekly Review

## Theme
Linux Performance

## Materials
- [Finding the bottleneck](https://example.com/article)

## Technical Perspective
Measurement should precede optimization.

## Business or Social Perspective
Performance affects infrastructure cost.

## My View
I should measure production workloads first.

## Reused Expressions
- in practice

## Next Week
Compare two architecture articles.
`);
```

校验 ISO week、至少一个材料、三个视角、本周复用表达和下周调整均非空。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -w @egl/api -- review-store.test.ts`

Expected: FAIL，原因是复盘模块不存在。

- [ ] **Step 3: 实现原子 Markdown 存储与 API**

复用每日记录的原子写入函数。文件名只接受 `/^\d{4}-W\d{2}-review\.md$/`。列表返回 `{ week, theme, markdown }[]` 并按周倒序。保存成功返回渲染后的 Markdown；无效输入返回标准字段错误。

- [ ] **Step 4: 验证并提交**

Run: `npm test -w @egl/api && npm run typecheck -w @egl/api`

Expected: Markdown 精确输出、覆盖更新、列表排序和 API 测试全部 PASS。

```bash
git add apps/api outputs/.gitkeep
git commit -m "feat: publish weekly English reviews"
```

---

### Task 6: 今日页学习闭环

**Files:**
- Create: `apps/web/src/api/client.ts`
- Create: `apps/web/src/components/AppShell.tsx`
- Create: `apps/web/src/components/ExpressionFields.tsx`
- Create: `apps/web/src/pages/TodayPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/test/TodayPage.test.tsx`

**Interfaces:**
- Consumes: roadmap and entry API。
- Produces routes: `/`, `/progress`, `/outputs`, `/roadmap`
- Writes a completed entry with `PUT /api/entries/:date`

- [ ] **Step 1: 写失败的用户流程测试**

Mock API，填写材料、分钟数、理解度、3 个表达和 3 句总结，点击“完成今日学习”，断言：

```ts
expect(api.saveEntry).toHaveBeenCalledWith("2026-09-05", expect.objectContaining({
  topic: "Linux 与性能",
  completedAt: expect.any(String)
}));
expect(await screen.findByText("今天的成果已保存")).toBeInTheDocument();
```

另测空表单显示“请至少记录 3 个英文表达”且不调用 API。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -w @egl/web -- TodayPage.test.tsx`

Expected: FAIL，原因是 Today 页面不存在。

- [ ] **Step 3: 实现 API 客户端与表单**

API 客户端把标准错误响应转换为带字段错误的 `ApiError`。Today 页面按本地日期加载已有记录，以已完成天数 + 1 确定当前路线日；未完成草稿保存到 `localStorage` 键 `egl:draft:YYYY-MM-DD`。

表单必须有可访问标签：

- 材料标题、链接、来源
- 阅读分钟、听力分钟
- 理解度 1–5
- 3 个及以上“英文表达/中文含义/已在总结复用”行
- 英文总结

成功后清除草稿并显示“学习成果已写入 data/entries，记得提交 Git”。

- [ ] **Step 4: 实现应用壳与样式**

导航固定包含今日、进度、输出、路线。CSS 使用深浅色变量、清晰焦点态、桌面卡片布局和窄屏单列布局。

- [ ] **Step 5: 验证并提交**

Run: `npm test -w @egl/web && npm run typecheck -w @egl/web && npm run build -w @egl/web`

Expected: Today 流程测试 PASS，类型检查和 Vite 构建退出 0。

```bash
git add apps/web package-lock.json
git commit -m "feat: complete daily learning workflow"
```

---

### Task 7: 进度、输出与路线页面

**Files:**
- Create: `apps/web/src/components/MetricCard.tsx`
- Create: `apps/web/src/components/StreakCalendar.tsx`
- Create: `apps/web/src/components/UnderstandingChart.tsx`
- Create: `apps/web/src/components/WeeklyReviewForm.tsx`
- Create: `apps/web/src/pages/ProgressPage.tsx`
- Create: `apps/web/src/pages/OutputsPage.tsx`
- Create: `apps/web/src/pages/RoadmapPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/test/ProgressPage.test.tsx`
- Test: `apps/web/test/OutputsPage.test.tsx`
- Test: `apps/web/test/RoadmapPage.test.tsx`

**Interfaces:**
- Consumes: progress, entries, reviews, and roadmap API。
- Produces: visible metrics, 30-day calendar, weekly trend, filterable output history, weekly review form, grouped route.

- [ ] **Step 1: 写失败的页面测试**

进度页断言 `连续 3 天`、`完成 10%`、`45 分钟`、`9 个表达` 和周标签。输出页按 `Performance` 筛选后只保留匹配总结，并能保存周复盘。路线页断言 30 天按四周分组、已完成日有可访问状态、当前日高亮。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -w @egl/web -- ProgressPage.test.tsx OutputsPage.test.tsx RoadmapPage.test.tsx`

Expected: FAIL，原因是三个页面不存在。

- [ ] **Step 3: 实现进度页**

展示当前/最长连续天数、完成率、阅读/听力/总分钟、英文词数、表达数和复用数。30 天日历为每格提供日期和完成状态文本。Recharts 折线图展示每周理解度，并保留文字列表作为无障碍替代。

- [ ] **Step 4: 实现输出与路线页**

输出按日期倒序，支持主题/来源不区分大小写筛选，展示总结、表达和安全外链。周复盘表单提交后刷新列表并展示 Markdown。

路线按四周分组，展示来源、难度、用途和安全外链；已完成日、当前日、未开始日视觉及文本状态均不同。

- [ ] **Step 5: 验证并提交**

Run: `npm test -w @egl/web && npm run typecheck -w @egl/web && npm run build -w @egl/web`

Expected: 三页测试全部 PASS，类型检查和构建退出 0。

```bash
git add apps/web package.json package-lock.json
git commit -m "feat: visualize progress and accumulated output"
```

---

### Task 8: 端到端验收与文档

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/learning-flow.spec.ts`
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Produces root script `test:e2e`
- Documents one-command local operation and manual Git workflow.

- [ ] **Step 1: 写端到端测试**

Playwright 流程：

1. 打开今日页。
2. 填写材料、分钟、评分、3 个表达和 3 句英文总结。
3. 完成并看到保存提示。
4. 进入进度页看到指标增加。
5. 进入输出页看到刚才的精确总结。
6. 在 Node 侧读取相应 JSON，断言内容一致。

- [ ] **Step 2: 增加 Playwright 配置**

`webServer.command` 使用 `npm run dev`，等待 `http://127.0.0.1:4311`，设置单 worker，失败保留截图和 trace。测试使用临时 `EGL_DATA_DIR`，不污染真实学习记录。

- [ ] **Step 3: 编写 README**

明确 Node.js 22+，启动命令：

```powershell
npm install
npm run dev
```

记录本地 URL、测试/类型检查/构建/E2E 命令、JSON/Markdown 与 SQLite 的职责、损坏恢复和手动 Git 工作流：

```powershell
git status
git add data/entries outputs
git commit -m "learn: record daily English progress"
```

- [ ] **Step 4: 完整验证**

Run:

```powershell
npm test
npm run typecheck
npm run build
npm run test:e2e
git diff --check
git status --short
```

Expected: 所有测试 PASS，类型检查和构建退出 0，E2E PASS，`git diff --check` 无输出，只存在计划内改动。

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e README.md package.json package-lock.json
git commit -m "docs: complete local learning workflow"
```

