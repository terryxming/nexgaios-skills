# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

- **ob-notes v1.0.0 候选完成架构翻转**（ADR-0011，分支 `codex/ob-notes-obsidian-only`）：从"判定 research/practice/dialogue 三选一套模板"翻转为 **问答基底 + 信号/噪音分离（核心引擎）+ 呈现侧重**。
  - 新 `references/distill.md`（signal-noise 引擎：三限定判据 + 问保真答重写四镣铐 + 操作留结果不留过程 + source-fidelity）；新 `references/presentation.md`（三呈现骨架：追问链/解法卡有骨架、**主题网去骨架**、mastery-lens 挂主题网）。
  - 删 `mode-a-research/practice/dialogue.md`；SKILL workflow 翻转 + metadata 改；受控词表 26→25。
  - **门禁全绿**：depmap 25 项 + lint 12 项（ADR 11 篇格式、共享段逐字节一致、skills-ref 桶一、桶二四项、marketplace↔tag）。
  - **整套架构试行待验证**（判据主观性、主题网去骨架的深度成色、无问存档划出的需求反弹——见 ADR-0011 存疑段）；**未 dogfood、未跑评测**（用户明确暂缓评测）。
- 目录结构（ADR-0010）、纪律双份、CI 门禁同前，未动。
- **发布态**：`ob-notes/v0.8.0` 已发布；marketplace 条目 pin 于 v0.8.0 tag 旧路径 `skills/ob-notes`（该 tag 树内有效，勿改），v1.0.0 发布时更新 path。

## 下一步

1. **建议先 dogfood**：用 AWS 记忆文《Agent 记忆模块最佳实践》重测主题网去骨架是否真比骨架版更好（架构翻转的核心待验证点，dev-log 决策表已记诱因）。
2. **重写 evals 执行用例**：覆盖信号/噪音分离、问保真答重写、操作过程滤除、无问存档划出、主题网去骨架（触发用例基本不变）。
3. 走发布链：eval 用例过目（F 人在环）→ 触发 + 执行评测重跑（架构大改必测）→ 合 main → tag `ob-notes/v1.0.0`（对外仍 1.0.0，候选内演化；tag message 用中文）→ **更新 marketplace.json**（path 改 `skills/first-party/ob-notes` + ref/version/description，lint 一致性门禁兜底）。

## 未决问题

- ob-notes 架构翻转整套**试行待验证**，发布前须 dogfood + 评测（ADR-0011 存疑段四项：判据松紧、主题网深度、research/practice 终态、无问存档需求反弹）。
- evals 执行用例未随架构重写（发布前必做，G②）。
- run_loop.py（description 优化）依赖 `claude -p`，嵌套鉴权失败，待 API key 环境。
- pass^k 的 k 与各 skill 触发率阈值未定（首个正式发布时定，宜落成机器可读文件）。
- 多 skill 触发互斥性未测；ADR-0010 third-party 安装路径待首个第三方 skill 收藏时实测。
- Codex 侧遗留：run_loop.py 嵌套鉴权、AGENTS.md 平台段接管。

## 环境备忘

- 公司机 CHINAMI-5T8IKFA（本次续工机）：Windows 11；git 2.53.0 / Python 3.13.5 / Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设；skills-ref 桶一通过。
- 家用机 TerryXming：git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB；skills-ref 0.1.1；`~/.codex/skills/ob-notes` dogfood 装的是旧候选，架构翻转后需重装再 dogfood。
- 两机各自配 `~/.config/ob-notes/config.json` 指向自己的 kbase（公司机在 `D:\nexgaios-kbase`；读取顺序见 ob-notes preflight.md）。

## 上次会话摘要（2026-07-04 · 公司机 · 续工）

与用户逐轮设计对齐，把 ob-notes 从"分类驱动"翻转为"问答基底"：①问答不是三类之一而是基底、"问"是消化判据（无问顺手存档划出本 skill）②信号/噪音分离为核心引擎（三限定参照读者判据、问保真答重写四镣铐、操作留结果不留过程）③呈现侧重退居其后（追问链/解法卡/主题网），用户以 AWS 记忆文点破"研究型套骨架削足适履"→ **主题网去骨架**。落 ADR-0011 → 建 distill/presentation、删三 mode-a、SKILL 翻转、词表 26→25、修 5 处死引用与两处措辞、CHANGELOG 重写 [1.0.0]、dev-log 追加 → depmap + lint 全绿。评测按用户意愿暂缓，架构标试行待验证。本次 commit 保存里程碑，未合 main。
