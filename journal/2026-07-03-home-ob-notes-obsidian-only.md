# 交接:2026-07-03 家用机 · ob-notes Obsidian-only 分支候选

> 续工先 `git pull`,读本文件 + `skills/ob-notes/dev-log.md` + `docs/decisions/0008-single-public-repo.md`,再动手。当前分支为 `codex/ob-notes-obsidian-only`,尚未合入 `main`。

## 本次起点状态

- 从 `main` 切出分支 `codex/ob-notes-obsidian-only`。
- 起点工作区仅有未跟踪 `.codex/`,本次未纳入提交。
- 目标:按用户确认,把 `ob-notes` 收敛为只写回 Obsidian,移除项目目录写入、dev-log 对外能力、monitoring 回访机制,并移除 tag `类型/项目日志`;随后按真实使用反馈补齐 `类型/问答实录`。

## 本次完成

1. **ob-notes 定位收敛为 Obsidian-only**:`SKILL.md` 对外描述与主流程改为只把人与 agent 对话中值得长期复用的信息写入 Obsidian 知识库。
2. **删除项目目录写入能力**:删除 Mode B / dev-log 对外写入路径,删除 `references/mode-b-devlog.md`;项目相关内容只有在包含可复用决策、踩坑、方案取舍、研究结论时,才以 Obsidian 笔记沉淀。
3. **删除 monitoring 回访机制**:删除 `references/monitoring.md`;移除 `read_count` / `last_read`、`review-flow`、`revisit-signal`、`jsonl-schema`、`concurrency-safe` 等规则项。
4. **frontmatter/tag 契约更新**:frontmatter 只保留笔记内容字段;tag 体系移除 `类型/项目日志`,新增 `类型/问答实录`。
5. **新增问答实录型模板**:`references/mode-a-dialogue.md` 提供 `dialogue-template`,用于连续追问、教学讲解、认知纠错、"不要压缩/保留我的问题"这类场景。
6. **Obsidian 误写笔记已修正**:知识库中原 `Codex 执行仓库纪律三次失守 2026-07-03.md` 已改为 `Codex 执行仓库纪律三次失守：问答实录.md`,按现有 MCP 问答实录体例重写;旧文件已删除。
7. **evals 更新**:项目决策正例改为 Obsidian-only;新增 dev-log 写入负例与问答实录正例,防止旧能力回流和模板误判。
8. **维护记录更新**:`CHANGELOG.md` 增 `1.0.0`;`skills/ob-notes/dev-log.md` 记录本次破坏性定位变更与问答实录补齐;`references/dependency-map.md` 重建,受控词表从 31 项收敛为 26 项。
9. **本机 Codex 安装已同步**:`python tools/install.py ob-notes --force` 已把当前候选版覆盖到 `C:\Users\terry\.codex\skills\ob-notes`,安装版 `metadata.version` 为 `1.0.0`,且包含 `references/mode-a-dialogue.md`。

## 验证记录

- `python scripts/build_depmap.py`(在 `skills/ob-notes`) → 通过,受控词表 26 项。
- `python tools/lint.py` → 全绿。
- `python -m json.tool skills/ob-notes/evals/trigger-queries.json` → 通过。
- `python -m json.tool skills/ob-notes/evals/evals.json` → 通过。
- `git diff --check` → 通过。
- 安装目录检查:安装版 `mode-b-devlog.md` / `monitoring.md` 均不存在;安装版存在 `references/mode-a-dialogue.md`,且 `frontmatter-tags.md` 含 `类型/问答实录`。
- Obsidian 知识库检查:新文件 `D:\nexgaios-kbase\00 - raw\00 - inbox\Codex 执行仓库纪律三次失守：问答实录.md` 存在;旧文件 `Codex 执行仓库纪律三次失守 2026-07-03.md` 不存在。

## 已推送

- branch `codex/ob-notes-obsidian-only` → `origin/codex/ob-notes-obsidian-only`。
- commit `fb69e95` — `收敛 ob-notes 为 Obsidian 写回`。
- commit `d76a870` — `补充 ob-notes 收工 handoff`。
- commit `47e93d3` — `对齐 ob-notes handoff 格式`。

## 未决 / 后续

- **尚未正式发布**:本分支还需补跑宿主纪律 F/G2 评测,重点覆盖 Obsidian-only 正例、dev-log 负例、问答实录正例、kb_root 未配置停问。
- 评测达标后再合入 `main`,再打 tag `ob-notes/v1.0.0`。
- 当前工作区仍有未跟踪 `.codex/`,本次未纳入提交;处理前先确认它是否为本地工具产物。
- 本 handoff 最初补写时未先阅读既有 handoff 正文,导致格式漂移;已按既有 journal 风格改写。后续写 journal 前必须先读同类文件正文,不能只列文件名。
