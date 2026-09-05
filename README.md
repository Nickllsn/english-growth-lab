# English Growth Lab

一个运行在 Windows 本机的 30 天英语成长仪表盘。它以技术内容为起点，把每天的阅读、听力、英文表达和总结沉淀成可由 Git 追踪的真实成果。

## 你会得到什么

- “今日”页：每天一个 30 分钟学习闭环。
- “进度”页：连续天数、完成率、累计时长、英文词数、表达复用和理解度趋势。
- “输出”页：每日英文总结与每周英文复盘。
- “路线”页：从 Linux/性能逐步扩展到架构、AI、商业、产品与思维。
- `data/entries/*.json`：每天一份可读、可提交、可恢复的记录。
- `outputs/*.md`：每周一份英文主题作品。

## 环境要求

- Windows 10 或更新版本
- Node.js 22 或更新版本
- npm 10 或更新版本
- Git

当前开发环境已验证 Node.js 24 LTS。

## 启动

在 PowerShell 中进入仓库：

```powershell
cd E:\english-growth-lab
npm install
npm run dev
```

打开：

- Web：<http://127.0.0.1:4311>
- API 健康检查：<http://127.0.0.1:4310/api/health>

根命令会同时启动 React 前端与本地 API。按 `Ctrl+C` 停止。

## 每日使用

1. 打开“今日”，按路线选择一篇相关英文材料。
2. 阅读约 10–12 分钟。
3. 听同主题内容约 8–10 分钟。
4. 记录至少 3 个可复用英文表达。
5. 用自己的英文写至少 3 句总结。
6. 点击“完成今日学习”。
7. 到“进度”和“输出”查看累计成果。

未完成表单会保存在当前浏览器的本地草稿中。完成后，记录写入 `data/entries/YYYY-MM-DD.json`。

## 用 Git 留住进步

应用不会擅自提交 Git。完成学习后，在 PowerShell 执行：

```powershell
git status
git add data/entries outputs
git commit -m "learn: record daily English progress"
```

这样 Git 历史本身就是成长时间线，可以清楚看到每天新增的总结和表达。

## 数据与恢复

- `content/roadmap.json`：30 天路线的唯一事实来源，纳入 Git。
- `data/entries/*.json`：每日记录的唯一事实来源，纳入 Git。
- `outputs/*.md`：每周复盘的唯一事实来源，纳入 Git。
- `data/learning.db`：统计查询缓存，不纳入 Git。

每次读取进度时，API 都会从 JSON 同步 SQLite。数据库损坏时会保留为 `learning.db.corrupt-<timestamp>`，随后从 JSON 自动重建。删除 `learning.db` 不会丢失学习成果。

## 质量检查

```powershell
npm test
npm run typecheck
npm run build
npm run test:e2e
```

- `npm test`：API 与界面单元/集成测试。
- `npm run typecheck`：严格 TypeScript 检查。
- `npm run build`：生产构建。
- `npm run test:e2e`：在隔离测试目录中完成一次真实浏览器学习流程。

端到端测试使用本机已安装的 Chrome，数据写入被忽略的 `e2e/.tmp/`，不会污染个人学习记录。若本机没有 Chrome，可改用：

```powershell
npx playwright install chromium
```

## 项目结构

```text
apps/web/              React 本地网页
apps/api/              Express 本地 API
content/roadmap.json   30 天固定路线
data/entries/          每日可读记录
outputs/               每周 Markdown 复盘
docs/superpowers/      设计与实施计划
e2e/                   浏览器验收测试
```

## 第一版边界

第一版专注于建立稳定、可见、可回顾的学习闭环，不包含账号、云同步、自动抓取、AI 点评、自动 Git 提交、积分或排行榜。
