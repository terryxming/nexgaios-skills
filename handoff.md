# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（§14 跨设备协作·收工），历史见 `git log -- handoff.md`，不另存副本。续工：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 §14「开工」巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。


## 当前状态

分支 `ob-notes`，与 `origin/ob-notes` 起点一致；工作区为 **ob-notes v2.0.0 发布候选**，尚未提交。

- 核心能力已从「三种呈现正文一律逐字」改为「证据约束的忠实提炼」：显式问答实录继续逐字，解法卡与主题网允许忠实提炼。
- 新增内部证据账本、受保护原子、来源时间 / 事件时间区分、重要结论来源脚注与写盘前漂移检查；ADR-0015 已接受并取代 ADR-0014。
- 当前规则已统一：操作旁白默认过滤；用户明确要求完整逐字 / 原样保留时保留。
- 行为评测在当前断言下为 36/36；旧 HEAD 基线人工严格复核为 26/36。评测写入隔离临时知识库，未触碰真实 Obsidian 库。
- `quick_validate.py`、依赖图、普通 lint、`lint --release`、JSON、`git diff --check` 与旧规则冲突扫描全部通过。
- 分支相对 `origin/main` 已分叉：main 独有 11 个提交，ob-notes 独有 34 个提交；发布时先把最新 main 合入分支，再合回 main。


## 下一步

1. 提交并推送当前 `ob-notes` 发布候选。
2. 合入最新 `origin/main`，处理冲突并重跑发布门禁。
3. 把 `ob-notes` 合入 `main`，创建带中文说明的 tag `ob-notes/v2.0.0`。
4. 更新 `.claude-plugin/marketplace.json`：路径改为 `skills/first-party/ob-notes`，版本与 ref 改为 `2.0.0` / `ob-notes/v2.0.0`，description 对齐当前 Obsidian-only 触发边界。
5. 推送 `main` 与 tag；用 `tools/install.py ob-notes --from first-party --force` 覆盖 Claude Code / Codex 用户级安装，并验证两端均为 `2.0.0`。


## 未决问题

- 外部长文 `source-fidelity` 本轮未重构，继续按既有覆盖机制执行，待单独拍板。
- Codex transcript 定位、compaction 跨文件回溯、`parentUuid` 分支重建与图片附件不在 v2.0.0 本轮范围内。
- §11 机械审查器接入 `lint.py` / CI 尚待设计已裁决豁免机制。
- pass^k 阈值、多 skill 触发互斥、ADR-0010 third-party 安装路径待后续真实用例。


## 环境备忘

- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53.0 / Python 3.13.5（另装 3.14）/ Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设。
- 家用机 TerryXming：git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB。
- 两机各配 `~/.config/ob-notes/config.json` 指向各自知识库；公司机为 `D:\nexgaios-kbase`。
- Codex 用户级 `ob-notes` 当前仍为 `1.0.0`；发布后需覆盖为 `2.0.0`。Claude Code 用户级安装状态在最终安装步骤一并核验。
- `CLAUDE.md` / `AGENTS.md` 的 `DISCIPLINE:SHARED` 段须逐字节一致；改共享段后必须运行漂移校验。


## 上次会话摘要（2026-08-04 · Codex）

用户重新审视「逐字保真」是否应作为 ob-notes 的最高优先级，并确认把核心能力改为「证据约束的忠实提炼」，同时要求重要结论使用来源脚注并带来源时间。

本次按确认范围更新 SKILL、规则 references、评测契约、CHANGELOG、dev-log 与 ADR；没有改外部长文机制、transcript 脚本、附件、触发边界、知识库配置或发布渠道。修正 Eval 5 的完整逐字契约及活动规则中的旧矛盾；当前版行为评测 36/36，旧 HEAD 基线 26/36，全部发布门禁通过。用户已授权执行提交、合并、打 tag、推送、marketplace 更新与用户级覆盖安装。
