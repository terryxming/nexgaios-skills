# 2026-07-03 home ob-notes Obsidian-only 收工 handoff

## 当前分支

- 分支：`codex/ob-notes-obsidian-only`
- 基线：从 `main` 切出
- 最新提交：`fb69e95 收敛 ob-notes 为 Obsidian 写回`
- 远端：已推送到 `origin/codex/ob-notes-obsidian-only`

## 本次完成

- 将 `skills/ob-notes` 对外能力收敛为 Obsidian-only：只把人与 agent 对话中值得长期复用的信息写回 Obsidian。
- 删除项目目录写入能力：移除 Mode B / dev-log 对外写入路径，删除 `references/mode-b-devlog.md`。
- 删除 monitoring 回访机制：删除 `references/monitoring.md`，移除 `read_count` / `last_read`、`review-flow`、`revisit-signal`、`jsonl-schema`、`concurrency-safe` 等规则项。
- frontmatter/tag 契约已更新：frontmatter 只保留笔记内容字段，tag 移除 `类型/项目日志`。
- evals 已更新：项目决策正例改为 Obsidian-only；新增 dev-log 写入负例，防止旧能力回流。
- 已重建 `references/dependency-map.md`，受控词表从 31 项收敛为 25 项。
- 本机 Codex 安装已覆盖更新到 `C:\Users\terry\.codex\skills\ob-notes`，安装版 `SKILL.md` 显示 `metadata.version: 1.0.0`。

## 验证

- `python scripts/build_depmap.py`：通过。
- `python tools/lint.py`：通过。
- `python -m json.tool skills/ob-notes/evals/trigger-queries.json`：通过。
- `python -m json.tool skills/ob-notes/evals/evals.json`：通过。
- `git diff --check`：通过。
- 安装目录检查：`mode-b-devlog.md` / `monitoring.md` 均不存在；安装版规则文件未搜到 `类型/项目日志`、`read_count`、`last_read`、`mode-b-devlog`、`monitoring.md`。

## 已定决策

- ob-notes 的产品定位改为单一职责：把人与 agent 对话中值得长期复用的信息写回 Obsidian。
- 项目进度流水、项目目录 dev-log、README、代码注释、临时草稿都不是 ob-notes 的职责。
- 项目相关内容只有在包含可复用决策、踩坑、方案取舍、研究结论时，才以 Obsidian 笔记形式沉淀。
- `dev-log.md` 作为 skill 自身仓库维护文件保留，但不代表 ob-notes 对外具备写 dev-log 能力。

## 下一步

1. 补跑宿主纪律 F/G2 要求的评测：重点覆盖 Obsidian-only 正例、dev-log 负例、kb_root 未配置停问。
2. 评测达标后再合入 `main`。
3. 合入后打 tag `ob-notes/v1.0.0`。

## 未决 / 注意

- 当前工作区仍有未跟踪目录 `.codex/`，本次未纳入提交；后续处理前先确认它是否为本地工具产物。
- 本 handoff 是补写：前一轮已先推了 skill 改动，违反了 C2“收工 handoff 后 commit + push”的顺序要求。后续推送前必须把 handoff 纳入同一收工检查。
