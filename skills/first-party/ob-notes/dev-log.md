---
title: ob-notes 开发日志
date: 2026-06-26
updated: 2026-08-03
source: claude (网页对话) / 交接给 Claude Code 续做
tags: [状态/持续]
---

# ob-notes 开发日志

> [!note] 交接说明
> 本文件是 ob-notes 这个 skill 自身的维护日志的**索引**，属于仓库内开发记录，不代表 ob-notes 对外提供"写 dev-log"能力。它在一个 Claude 网页对话里设计成型，现由 Claude Code / Codex 接力维护。接手前请先读**本文件 + SKILL.md + references/maintenance.md**，历史决策 / 时间线 / 踩坑见下方分册，即可恢复全部设计上下文，无需原始对话记录。


## 项目意图

做一个遵循 Agent Skills 开放标准、可被 Claude/Codex 等多 agent 通用的 skill，把人与 agent 对话中产生的高价值信息（决策、踩坑、知识点、方案取舍、研究结论、连续追问）按统一规范沉淀成结构化 Markdown 笔记，回写到 Obsidian 知识库。

成功标准：解决用户随手让 agent "记一下"时的四类毛病——不知道记什么、压缩过狠、格式丑、没重点；并且 skill 自身可长期维护、不随复杂度上升而前后矛盾。


## 分册（单一事实源 + 指针）

本日志按职责拆分，三个只追加日志各有唯一家，改动只进对应分册：

- **架构与关键决策** → [`dev-log/decisions.md`](dev-log/decisions.md)
- **进展时间线** → [`dev-log/timeline.md`](dev-log/timeline.md)
- **踩坑记录** → [`dev-log/pitfalls.md`](dev-log/pitfalls.md)

本文件（索引）只留：项目意图、当前状态 / 下一步（含已解决）、关联。


## 当前状态 / 下一步（覆盖更新）

- 现状：**v2.0.0 候选**（核心改为可追溯的忠实提炼，宿主 ADR-0015，取代 ADR-0014）。显式问答实录继续逐字；解法卡 / 主题网允许忠实提炼。新增内部证据账本、受保护原子、来源时间 / 事件时间区分、重要结论来源脚注与写盘前漂移检查。已同步 SKILL / distill / presentation / quality-check / frontmatter-tags / maintenance / evals / CHANGELOG / ADR；外部长文 source-fidelity、Codex transcript、compaction 回溯等不在本轮范围。当前改动在分支 `ob-notes`，待用户过目 evals、行为评测与发布门禁完成后才合 main 打 tag `ob-notes/v2.0.0`。
- 下一步：
  1. **evals 用户过目后跑**：七条用例已按证据链与时间重写，需用户确认贴近真实场景（ADR-0012）再跑 with-skill vs baseline(v1.0.0)。
  2. **跑门禁**：`build_depmap.py` 重生成、宿主 `lint.py` 全绿（已含 `dev-log/` 豁免）。
  3. **补 dogfood**：用真实多轮素材验证主题网综合后的漂移率与解法卡扫读性，重点查确定性、否定 / 条件 / 边界和来源时间。
  4. **source-fidelity 待定项**：外部长文在逐字架构下怎么处理，单独找用户拍板后重构。
  5. 达标后合 main 打 tag `ob-notes/v2.0.0`。
- 卡点：无。
- **续做提示（给接手的你/agent）**：先读宿主仓库 `CLAUDE.md`/`AGENTS.md`（工程纪律，含 skill 迁入/发布门禁）与 `docs/decisions/`；改本 skill 任何文件前必读 `references/maintenance.md`（§6 修改流程）。换新机器需自配 `~/.config/ob-notes/config.json` 指向自己的 kbase（读取顺序见 `preflight.md`）。旧仓库的"并 main/OKC console"开放项已随原仓库退役作废。
- 已解决：
  - 原"与 OKC 做职责边界对比"——OKC 是本 skill 的**前作**(用户早先 Codex 版，流程过重而重做)，已捞五件并入 v0.3.0；项目记忆之争以 ob-notes dev-log 为准。
  - **mode-decision 是否细化**——判定维持粗分、misfit 走模板层、定可量化触发闸（见决策表 2026-06-26）；触发条件挂在上方"继续观察数据"。
  - **dogfood / kb_root 环境**——公司机实测 kbase 与 dogfood 笔记均在 `D:\nexgaios-kbase`，已补建 `config.json` 指向它，dogfood 可复现。
  - **git 身份**——global 即 terryxming，署名正确，无需重设。
  - **package.command 是否要补**——查同级 skill：全 monorepo 每个 `package.command` 都空，属统一约定（打包不在 per-skill 层），无需补、结案。


## 关联

- [[ob-notes SKILL]]
- [[obsidian-knowledge-curator]]  （**前作**：用户早先的 Codex 版，因流程过重而重做本 skill；v0.3.0 已从中捞取五件编辑智慧并入。未捞部分见"下一步"。）
