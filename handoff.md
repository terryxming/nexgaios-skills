# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（§14 跨设备协作·收工），历史见 `git log -- handoff.md`，不另存副本。续工：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 §14「开工」巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。


## 当前状态

分支 `main`，**ob-notes v2.0.0 已完成发布收尾**；tag 为 `ob-notes/v2.0.0`，marketplace 已对齐 `skills/first-party/ob-notes`。

- ob-notes 核心能力已从「三种呈现正文一律逐字」改为「证据约束的忠实提炼」：显式问答实录继续逐字，解法卡与主题网允许忠实提炼。
- 新增内部证据账本、受保护原子、来源时间 / 事件时间区分、重要结论来源脚注与写盘前漂移检查；ADR-0015 已接受并取代 ADR-0014。
- 当前规则已统一：操作旁白默认过滤；用户明确要求完整逐字 / 原样保留时保留。
- 行为评测在当前断言下为 36/36；旧 HEAD 基线人工严格复核为 26/36。评测写入隔离临时知识库，未触碰真实 Obsidian 库。
- `quick_validate.py`、依赖图、普通 lint、`lint --release`、JSON、`git diff --check` 与旧规则冲突扫描全部通过。
- Claude Code 与 Codex 用户级 `ob-notes` 均已覆盖安装为 `2.0.0`；两端各 21 个文件与仓库源码逐文件 SHA-256 一致，且 `quick_validate.py` 均通过。
- learn-everything v0.1.0 已在 main 发布，tag 为 `learn-everything/v0.1.0`，marketplace 与本机 Claude 用户级安装已完成。


## 下一步

1. 在真实对话中使用 ob-notes v2.0.0，观察忠实提炼、重要结论来源脚注与时间字段的实际成本和收益。
2. 只有发现真实失败样本时，按失败回填流程补评测与规则；不要预先扩展本轮未确认的能力。


## 未决问题

- ob-notes：外部长文 `source-fidelity` 本轮未重构，继续按既有覆盖机制执行，待单独拍板。
- ob-notes：Codex transcript 定位、compaction 跨文件回溯、`parentUuid` 分支重建与图片附件不在 v2.0.0 本轮范围内。
- learn-everything：审查关「一律必审」需在真实使用后评估成本；执行评测待 runner 环境；T6「做速查表」触发边界继续观察。
- §11 机械审查器接入 `lint.py` / CI 尚待设计已裁决豁免机制。
- pass^k 阈值、多 skill 触发互斥、ADR-0010 third-party 安装路径待后续真实用例。


## 环境备忘

- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53.0 / Python 3.13.5（另装 3.14）/ Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设。
- 家用机 TerryXming：Windows 11；git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB；skills-ref 0.1.1。
- 两机各配 `~/.config/ob-notes/config.json` 指向各自知识库；公司机为 `D:\nexgaios-kbase`。
- learn-everything 失败回填门控读取 `~/.config/learn-everything/config.json` 的 `dev_repo`，普通环境惰性。
- Codex 用户级目录 `C:\Users\terry\.codex\skills\ob-notes` 与 Claude Code 用户级目录 `C:\Users\terry\.claude\skills\ob-notes` 当前均为 `2.0.0`；安装后需重启对应 agent 才能让新会话重新发现版本。
- `CLAUDE.md` / `AGENTS.md` 的 `DISCIPLINE:SHARED` 段须逐字节一致；改共享段后必须运行漂移校验。


## 上次会话摘要（2026-08-04 · Codex）

用户重新审视「逐字保真」是否应作为 ob-notes 的最高优先级，并确认把核心能力改为「证据约束的忠实提炼」，同时要求重要结论使用来源脚注并带来源时间。

本次按确认范围更新 SKILL、规则 references、评测契约、CHANGELOG、dev-log 与 ADR；没有改外部长文机制、transcript 脚本、附件、触发边界或知识库配置。修正 Eval 5 的完整逐字契约及活动规则中的旧矛盾；当前版行为评测 36/36，旧 HEAD 基线 26/36，全部发布门禁通过。

发布候选提交 `9c69d5b` 与 main 同步合并提交 `6f514ee` 已推送到 `ob-notes`；`main` 已快进合入，创建 `ob-notes/v2.0.0`，并把 marketplace 更新为 `2.0.0`。Claude Code / Codex 用户级目录均已覆盖安装，版本、结构与逐文件哈希验证通过。
