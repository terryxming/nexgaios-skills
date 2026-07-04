# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

- **ob-notes v1.0.0 候选完成架构翻转**（ADR-0011，分支 `codex/ob-notes-obsidian-only`）：从"判定 research/practice/dialogue 三选一套模板"翻转为 **问答基底 + 信号/噪音分离（核心引擎）+ 呈现侧重**。
  - 新 `references/distill.md`（signal-noise 引擎：三限定判据 + 问保真答重写四镣铐 + 操作留结果不留过程 + source-fidelity）；新 `references/presentation.md`（三呈现骨架：追问链/解法卡有骨架、**主题网去骨架**、mastery-lens 挂主题网）。
  - 删三个 mode-a 文件；SKILL workflow 翻转 + metadata 改；受控词表 26→25。
  - **门禁全绿**：depmap 25 项 + lint 12 项。
  - **已首次 dogfood 执行测通过**（隔离子代理、未碰真库，写 scratchpad 测试目录）：把 AWS 记忆文沉淀成主题网笔记——①主题网去骨架生效（结构服从文章逻辑、未套固定格子）；②旧版被压没的机制细节（Mem0 六层模块名、Letta 三工具名、AgentCore API）**全保留**；③可信度/反幻觉在起作用（整篇钉待验证、选型钉推测、剔除 WebFetch 脑补）。暴露并已回填一处判据：SKILL.md `mode-decision` 补「追问链 vs 主题网」边界（看追问有无独立认知增量）。
  - **整套架构仍试行待验证**：n=1，一次成功 ≠ 可靠；判据主观性、去骨架深度、无问存档反弹见 ADR-0011 存疑段。
  - **流程走查后补七处疏漏**（`1efdcfc`，均纸面补丁待 dogfood）：三对呈现消歧、交叉选主判据、试错弯路划界（消 distill 与解法卡矛盾）、无问引导话术、增量优先升写盘前必做、手存补文件名+落点、写盘后回确认。**CHANGELOG 按 maintenance §5 分工瘦身**——理由/触发/否决拆除（唯一家在 dev-log），只留"变了什么"。
  - **新版 v1.0.0 已装本机两端**（Claude 新装、Codex `--force` 覆盖旧 v0.7.0），dogfood 测试目录在 scratchpad。
- 目录结构（ADR-0010）、纪律双份、CI 门禁同前，未动。
- **发布态**：`ob-notes/v0.8.0` 已发布；marketplace 条目 pin 于 v0.8.0 tag 旧路径 `skills/ob-notes`（该 tag 树内有效，勿改），v1.0.0 发布时更新 path。

## 下一步

1. **再测凑 A/B+N**：已首测通过（研究型/主题网）；下一步测 **追问链型**（真有认知转折的，验刚补的判据是否让 agent 判成追问链）、解法卡型、负例（纯讨论不该触发）。要当真可靠需 N≥数轮（dev-log 教训：n=1 会高估）。
2. **重写 evals 执行用例**：覆盖信号/噪音分离、问保真答重写、操作过程滤除、无问存档划出、主题网去骨架，并补一条「追问链 vs 主题网」对照用例（回填本次盲区，纪律 F）。
3. 走发布链：eval 用例过目（F 人在环）→ 触发 + 执行评测重跑（架构大改必测）→ 合 main → tag `ob-notes/v1.0.0`（对外仍 1.0.0，候选内演化；tag message 用中文）→ **更新 marketplace.json**（path 改 `skills/first-party/ob-notes` + ref/version/description，lint 一致性门禁兜底）。

## 未决问题

- ob-notes 架构翻转整套**试行待验证**，发布前须再测凑 A/B+N + 完整评测（ADR-0011 存疑段四项）。
- evals 执行用例未随架构重写（发布前必做，G②；含「追问链 vs 主题网」对照用例）。
- run_loop.py（description 优化）依赖 `claude -p`，嵌套鉴权失败，待 API key 环境。
- pass^k 的 k 与各 skill 触发率阈值未定（首个正式发布时定，宜落成机器可读文件）。
- 多 skill 触发互斥性未测；ADR-0010 third-party 安装路径待首个第三方 skill 收藏时实测。
- Codex 侧遗留：run_loop.py 嵌套鉴权、AGENTS.md 平台段接管。

## 环境备忘

- 公司机 CHINAMI-5T8IKFA（本次续工机）：Windows 11；git 2.53.0 / Python 3.13.5 / Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设；skills-ref 桶一通过。两端已装 ob-notes v1.0.0 候选。
- 家用机 TerryXming：git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB；`~/.codex/skills/ob-notes` 装的是旧候选，架构翻转后需 `install.py --force` 重装再 dogfood。
- 两机各自配 `~/.config/ob-notes/config.json` 指向自己的 kbase（公司机在 `D:\nexgaios-kbase`；读取顺序见 ob-notes preflight.md）。

## 上次会话摘要（2026-07-04 · 公司机 · 续工）

与用户逐轮设计对齐，把 ob-notes 从"分类驱动"翻转为"问答基底"：①问答是基底而非三类之一、"问"是消化判据（无问顺手存档划出）②信号/噪音分离为核心引擎（三限定判据、问保真答重写四镣铐、操作留结果不留过程）③呈现侧重退居其后，用户以 AWS 记忆文点破"研究型套骨架削足适履"→ **主题网去骨架**。落 ADR-0011 → 建 distill/presentation、删三 mode-a、SKILL 翻转、词表 26→25、修死引用与措辞、CHANGELOG/dev-log 同步 → depmap + lint 全绿 → commit `4ee5a42`（里程碑）。随后按仓库评测法用**隔离子代理**做首次 dogfood 执行测：AWS 记忆文沉淀通过，去骨架/机制保留/反幻觉全成立；暴露「追问链 vs 主题网」判据盲区，已回填 SKILL.md mode-decision（本次 commit）。评测其余（追问链/解法卡/负例、A/B+N、发布链）按用户意愿续做时再推进，架构标试行待验证。随后用户走查整套 workflow，逐项补七处疏漏（边界判据 + 末端体验，`1efdcfc`）；CHANGELOG 瘦身，拆除与 dev-log 重复的理由/触发叙事（B 纪律）。
