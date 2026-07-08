# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（§14 跨设备协作·收工），历史见 `git log -- handoff.md`，不另存副本。续工：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 §14「开工」巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。


## 当前状态

分支 `ob-notes`，**本地领先 `origin/ob-notes` 多个 commit、待 push**。`958e775` 为并行会话的全仓机械层归一；`6bbeb14`/`f8ddcf6` + 本收工 commit 为本会话。

- **纪律本体**（`CLAUDE.md`/`AGENTS.md`）：通用 §1–§14 + 仓库私有 A（Skill 开发纪律）已定稿；共享段逐字节一致、drift + lint 全绿。
- **§11 规则升级** → `f8ddcf6`：markdown「留白」从「二级标题前空两行」推广为「**所有非一级标题前空两行**」（`##`/`###`/`####` 一律前空两行），全仓按新规归一。
- **§11 全仓判断层审查** → `6bbeb14`（纪律源）+ `f8ddcf6`（其余 35 文件）：一文件一 Claude 子代理并行、主代理 `git diff` + `s11check` 复验；仅 `0001`/`0008`/`0011`/`dev-log.md`/`skill-creator-zh`/`presentation` 少数动刀，锚点/无 H1 日志/生成物 `dependency-map` 按裁决保留。
- **旧纪律引用对齐** → 本收工 commit：`纪律 A/B/C`→`§12/§13/§14` 活引用全仓转正；深度史实（`0004` 私有 A5、`0009` 旧结构 A3/A5/C1-C4）保留。
- **Codex 插件**：`codex@openai-codex` v1.0.6 已装、`/codex:setup` 全绿（本机 Codex 已登录）。

**ob-notes v2.0.0 发布链仍 parked**（本会话只做 markdown 排版与引用对齐，未碰发布）。


## 下一步

1. **push**：本会话所有 commit 一并推 `origin/ob-notes`（本收工提交后）。
2. **ob-notes v2.0.0 发布链**（parked，之后主线）：evals 用户过目 → 委托 skill-creator 跑（依赖 `claude -p`）→ 补 dogfood（主题网/解法卡逐字 n=0）→ `source-fidelity` `[待定]` 拍板 → 合 main → tag `ob-notes/v2.0.0`（中文 message）→ 更 `marketplace.json` path、过 `lint --release`。


## 未决问题

- **s11check 审查器仅存 scratchpad**：本会话的 §11 机械审查器（含新规「所有非一级标题空两行」+ frontmatter/锚点识别）在临时目录、未入仓；要长期化需落成 `tools/` 门禁，否则下次得重造。
- **旧纪律引用保留项**：`0004`「私有纪律 A5」、`0009:62`「纪律 B 条/A3/A5/C1-C4」是旧结构史实，有意保留、未转 §-编号。
- **ob-notes**：逐字正文正向效果未 dogfood；`source-fidelity` 逐字处理 `[待定]`；`run_loop.py` 依赖 `claude -p` 嵌套鉴权坑；Codex 侧逐字全链路待实机。
- pass^k 阈值、多 skill 触发互斥、ADR-0010 third-party 安装路径 —— 待首个第三方 skill。


## 环境备忘

- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53.0 / Python 3.13.5（另装 3.14）/ Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设。
- 家用机 TerryXming：git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB。
- 两机各配 `~/.config/ob-notes/config.json` 指向自己 kbase（公司机 `D:\nexgaios-kbase`；读取顺序见 `references/preflight.md`）。
- **共享段协作**：`CLAUDE.md`/`AGENTS.md` 的 `DISCIPLINE:SHARED` 段须逐字节一致。改共享段：改 `CLAUDE.md` 后把共享段整体覆盖同步进 `AGENTS.md`、跑 `tools/check-discipline-drift.py` 须绿；agent 编辑前须重读。
- **标题空行归一**：§11 新规「所有非一级标题前空两行」是纯机械规则，宜脚本一次性归一（确定 + 幂等），别逐文件靠子代理判。
- **共享 worktree 有并行会话**：本分支可能有其他会话同时在动；动手前先看 `git log`/`git status`，派写盘子代理前确认无并行活（见 lessons-learned 本会话条）。


## 上次会话摘要（2026-07-08 · 本会话）

装 Codex 插件（`codex@openai-codex` v1.0.6）后对全仓 markdown 做 §11 审查，中途按用户裁决把 §11「留白」升级为「所有非一级标题前空两行」。

**方法**：一文件一 Claude 子代理、7 批并行，各出「s11check 前后 + 判断层逐条判定 + 改动证据」；主代理逐文件 `git diff` + `s11check` 独立复验；纯机械的标题空行用 `normalize` 脚本一次性归一。判断层铁律：只改明确违规、行内 code 绝不过度、散文分号不拆、拿不准交裁决。

**过程教训**（详见 lessons-learned）：① 首批误用 Codex 自主改（只读沙箱写不稳 + 过度标记/乱拆），回滚重来、改为子代理审 + 主代理机械脚本兜底 + 复验。② 同任务多并行会话撞同一 `ob-notes` 分支（另一会话已提交 `958e775`、实时改 `lessons-learned`）→ 派写盘子代理前须查 git 历史/工作区、确认无并行活。③ 对照明文规则审查禁自造豁免（审查脚本里藏 marker 后门放过 `## 通用工程纪律`，被用户抓出）。
