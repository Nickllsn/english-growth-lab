# English Growth Lab

分布式存储工程师的英语周课。页面按上海时间打开今天的四段任务，部署到 GitHub Pages 之后，手机和公司电脑都能直接学。

## 每天

周一到周五：

| 时段 | 哪里 | 做什么 |
| --- | --- | --- |
| 20 分钟 | 早高峰地铁 | 听，不查词 |
| 20 分钟 | 公司午休 | 对着文字稿听，把不认识的单词和短语选进学习记录 |
| 20 分钟 | 晚高峰地铁 | 带字幕再听同一段 |
| 10 到 20 分钟 | 到家 | 跟读，然后不看稿回答一个问题 |

周六和周日预习下一周，并写本周复盘。新的一周要在周五放进 `content/weeks/`，周六才预习得了。

## 已经排好的两周

- `2026-W45`（11 月 2 日到 11 月 8 日）：11 月 4 日起精听 Changelog 475，ZFS。11 月 2 日和 3 日的旧材料已撤下。
- `2026-W46`（11 月 9 日到 11 月 15 日）：听完 ZFS，再听 Bryan Cantrill、Talos Linux、分布式系统排障。

文字稿按 CC BY-SA 4.0 放在页面里，版权 Changelog Media LLC。音频从 Changelog 的服务器播放，不放进仓库。生词不是预先生成的，而是你在文字稿里选中后写入 `terms`。

## 进度

打卡、复盘和生词保存在当前浏览器。手机和公司电脑不会自动同步。在「进度」或「词汇」页导出 `english-progress.json`，换设备后再导入。`terms` 里的每一条有原句、节目和时间，发回来后可以按那一句解释用法。

## 本地打开

```powershell
npm install
npm run dev
```

打开 <http://127.0.0.1:4311>。这个地址只在正在运行 `npm run dev` 的那台电脑上有效，不能从手机或其他电脑直接打开。

## 发布

推到 `main` 后，GitHub Actions 把 `apps/web` 部署到 GitHub Pages。仓库需要在 Settings → Pages 里把 Source 设为 GitHub Actions。站点地址是：

<https://nickllsn.github.io/english-growth-lab/>

## 检查

```powershell
npm test
npm run typecheck
npm run build
npm run test:e2e
```

`apps/api` 和 `content/roadmap.json` 是上一版本机记录器，页面不再调用它们。

## 周五备下一周

在 `content/weeks/` 新增一个 `YYYY-Www.json`，并在 `apps/web/src/content/load.ts` 里引入。一周 7 天：前 5 天是学习日，后 2 天是周末。学习日必须有早听、午读、晚听、跟读，词块 5 到 8 个，跟读稿 6 到 10 句，而且当天的材料要同时覆盖 text、audio、video。`npm test` 会检查这些约束。
