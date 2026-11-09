# 给后续开发看的规定

每次改这个仓库之前先读完这一页，并照做。

## 模型

这是强制准则。本仓库的开发、测试、审查和验证，只使用 Grok 相关模型。常规 agent 和 subagent 都一样。

包括这些流程：

- 实现、修改、排错、写文档和生成内容
- 自动化测试、手动测试和浏览器里的页面检查
- 代码审查、安全审查、调试，以及任何并行或下一级子任务
- 选择模型、传入模型参数，或把一步交给另一个代理

禁止使用 Grok 以外的模型。禁止启动会改用其他模型的 subagent 或工具。不能在当前 Grok 会话里完成时，就停下来说明，不要换模型。

## 验证

用户没有明确要求时，不要为每次改动截图或录视频。用自动化测试和必要的页面检查确认行为即可。

## 生词

不要再预生成单词表。学习者在 Changelog 文字稿里选中不认识的单词或短语，写入进度的 `terms`。每一条必须留下原句 `sentence`、节目 `episodeId`、时间 `start`。导入导出都走 `english-progress.json`。拿到导出文件后，按那一条的原句说明这个词在该节目里的用法，不要脱离那一句另编场景。把交回来的文件更新到 `content/progress/english-progress.json`。浏览器没有本地记录时用这份作为起始进度，不要覆盖已经写在 localStorage 里的记录。

## Changelog 文字稿

`content/changelog/` 里的 Markdown 是 Changelog Media LLC 的文字稿原文，许可是 CC BY-SA 4.0。页面上保留署名、节目链接和许可链接。不要改这些原文，不要删署名。音频用 Changelog CDN 的地址在浏览器里播放，不要把 mp3 放进仓库。`content/changelog/timings/` 里是每一段的开始时间，由 `scripts/transcribe-changelog.py` 和 `scripts/align-changelog.py` 对着公开音频对齐得到。稿里印的时间如果和听到的句子差在一秒半以内，就用印的时间；差得更多就用对齐到的时间。不要手改这些时间，也不要把音频或词级识别结果放进仓库。
