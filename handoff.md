# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C 跨设备协作·收工），历史见 `git log -- handoff.md`，不另存副本。续工：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑纪律 C「开工」巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

分支 `ob-notes`。工程纪律与全仓 markdown 重构**全部完成并入库**（`d222cd8` + `61a612f`），**本地领先 `origin/ob-notes` 2 个 commit、未 push**。

- **纪律本体**（`CLAUDE.md`/`AGENTS.md`）：通用 §1–§10 + markdown 写作纪律 + 本仓 A/B/C + Skill 开发纪律，已定稿；共享段逐字节一致、drift + lint 全绿。
- **①② 收官** → `d222cd8`：① 序号规范化（死号清理、引用改「序号+标题」）+ ② 重叠归并（补 escalation→§4、rule of three→§3、失败要认→§9 三处 MECE 缺口，§10 瘦成症状索引）。
- **③④ 收官** → `61a612f`：按 markdown 写作纪律（排版 12 条 + 语气）逐文件重审全仓 33 个 markdown（排版归一 + 死序号转现行），32 文件改动。
- **范围**：ob-notes skill 正文 11 + docs 3 + ADR 14 + dev-log/CHANGELOG 5 + CLAUDE/AGENTS 均已过；未动 `skills/third-party/`、`docs/reference/` 官方副本、`dependency-map.md`（生成物）、`handoff.md`。

**ob-notes v2.0.0 发布链仍 parked**（代码在更早的 `27403c9`，本轮只对其 skill 文件做了 markdown 排版，未碰发布）。


## 下一步

1. **push**（本次收工提交后）：`d222cd8` + `61a612f` + 本收工 commit 一并推 `origin/ob-notes`。
2. **ob-notes v2.0.0 发布链**（parked，之后的主线）：evals 用户过目 → 委托 skill-creator 跑（依赖 `claude -p`）→ 补 dogfood（主题网/解法卡逐字 n=0）→ `source-fidelity` `[待定]` 拍板 → 合 main → tag `ob-notes/v2.0.0`（中文 message）→ 更 `marketplace.json` path、过 `lint --release`。


## 未决问题

- **本轮按建议留下的三处**（要动再说）：`0007` 的「过 G 门禁」（被推翻死方案的机制描述，当史实留）；`CHANGELOG` 行内 code 系统性混用（对外版本历史，不全量重排）；`CLAUDE.md` 速览「单一事实源」较密的分号串（速览本性，未拆）。
- **「序号+标题」规约范围**：现只强制在纪律正文与仓库 markdown；`tools/*.py` 注释与 pre-flight 钩子里的简写（`纪律 A`/`§7` 等）未强制带标题——是否扩待定。
- **ob-notes**：逐字正文正向效果未 dogfood；`source-fidelity` 逐字处理 `[待定]`；`run_loop.py` 依赖 `claude -p` 嵌套鉴权坑；Codex 侧逐字全链路待实机。
- pass^k 阈值、多 skill 触发互斥、ADR-0010 third-party 安装路径 —— 待首个第三方 skill。


## 环境备忘

- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53.0 / Python 3.13.5（另装 3.14）/ Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设。
- 家用机 TerryXming：git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex 128 KiB。
- 两机各配 `~/.config/ob-notes/config.json` 指向自己 kbase（公司机 `D:\nexgaios-kbase`；读取顺序见 `references/preflight.md`）。
- **共享段协作**：`CLAUDE.md`/`AGENTS.md` 的 `DISCIPLINE:SHARED` 段须逐字节一致。改共享段的做法：改 `CLAUDE.md` 后把共享段整体覆盖同步进 `AGENTS.md`、跑 `tools/check-discipline-drift.py` 须绿；agent 编辑前须重读（否则撞「文件已被修改」）。
- **模块空两行归一**：纯机械的「并列 `##`/`###` 空 2 行、首节 1 行、删每节 `---`」宜脚本一次性归一（确定 + 幂等），别逐文件靠子代理判——本轮子代理理解不一。


## 上次会话摘要（2026-07-08 · 本会话）

承接纪律重构，走完 ①②③④。① 序号规范化 + ② 重叠归并 → `d222cd8`。③④ 合并做：按 markdown 写作纪律逐文件重审全仓 33 个 markdown → `61a612f`。

**方法**：一文件一子代理、各出「改动证据 + 13 条逐条复审」两证，主代理 `git diff` + 死号 grep 独立双验；模块空两行脚本兜底统一；死序号按「活引用仍存在的规则 → 转现行『序号+标题』；已废/记录 → 留 + 理由」（历史 ADR/dev-log 记录事实一字未动）。

**过程教训**（详见 lessons-learned）：① 对照纪律审查一度扫读、宣称 `distill.md`「已合规」被用户抓出系统性漏（模块空两行整轮没执行）→ 改为逐行逐条 + 两证。② 子代理对死序号「转/留」判断跨文件不一致（`0009` 留 A3 / `0010` 转 A3；`0011` 以假前提漏转 G 门禁）→ 主代理逐文件双验兜底、跨文件对齐。③ 纯机械排版规则宜脚本归一。
