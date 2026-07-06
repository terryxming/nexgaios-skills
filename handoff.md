# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

- **工作区模型（标准单仓）**：`skills/first-party/` 是所有 skill 的家；各 skill 在**各自分支**开发，共享单一工作区 `D:\nexgaios-skills`，`git checkout <skill 分支>` 切换在研 skill。⚠️ 现有两个 Claude 线程共享此工作区（一个开发 ob-notes、一个 learn-everything），同一目录一次只一个分支、切分支会互相影响——**切分支 / commit 前先 `git branch --show-current` 核对、多线程错开**。（本会话曾试行"一 skill 一 worktree"C5，判过度复杂**已撤销**，回归标准单仓。）
- **learn-everything v0.1.0**（分支 `learn-everything-skill` `1561eed`，已 push）：认知地图自生长引擎（不套框架、整体↔原子双向）+ 六法定序 1→2→4→5→6→3 + 铁律五·审查关（一律必审、独立子 agent 联网查证、可信度五级）+ 失败回填。lint 绿；harness dogfood 六法全程跑通、审查关抓出 6 处记忆错并修正。**未走正式评测、未合 main**。
- **ob-notes v1.0.0 候选**（分支 `codex/ob-notes-obsidian-only`，另一个 Claude 线程在开发）：进行中。
- **门禁**：lint 全绿（含共享段逐字节一致）。

## 下一步

**learn-everything**（`git checkout learn-everything-skill`）：① evals 过目（F 人在环，含审查关回归用例 id 7）→ 触发 + 执行评测达标；② 合 main + tag `learn-everything/v0.1.0`；③ 审查关"一律必审"使用一段后再评估是否放宽。
**ob-notes**：续 v1.0.0 迭代（用户明确还没迭代完，暂不跑评测）→ 发布链：eval 过目 → 评测重跑 → 合 main → tag `ob-notes/v1.0.0` → 更新 marketplace.json（path 改 `skills/first-party/ob-notes`）。

## 未决问题

- 两个 Claude 线程共享单一工作区的分支切换协调：错开使用，无成文机制（C5 worktree 制已撤）。
- 多 skill 触发互斥性未测——learn-everything + ob-notes 负例集可能互含对方正例。
- learn-everything 审查关"一律必审"的开销 / 放宽策略待真实使用验证（每次一个联网子 agent，十万 token 级）。
- run_loop.py 嵌套鉴权待 API key 环境；pass^k 的 k 与各 skill 触发率阈值未定。
- ADR-0010 third-party 安装路径待首个第三方 skill 收藏时实测。

## 环境备忘

- 家用机 TerryXming：Windows 11；git 2.53 / Python 3.14 / Node 24 / pwsh 7.6；Codex `project_doc_max_bytes=131072`；skills-ref 0.1.1。
- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53 / Python 3.13.5 / Node 24；Codex 128 KiB 已设；skills-ref 0.1.1。
- ob-notes：两机各配 `~/.config/ob-notes/config.json` 指向自己的 kbase（读取顺序见 ob-notes preflight.md）。
- learn-everything：失败回填门控读 `~/.config/learn-everything/config.json` 的 `dev_repo`（仅维护者机器配；普通环境该通道惰性）。

## 上次会话摘要（2026-07-06 · learn-everything）

① 从零建 learn-everything skill——多轮纠偏（六法编排 → 13 维元维度模板，均被否）回到"**认知地图自生长为引擎、六法定序、迭代靠失败回填**"；核心是主题自生长认知地图（不套框架、整体↔原子双向）。gold standard = 维护者 kbase 已产出的学习实录（四柱等）。② dogfood harness 主题走完六法；**审查关**（独立子 agent 联网核实官方文档）抓出权限四档→六档、hook 31→33、prompt caching 归类错、memory 压扁等 6 处并修正，回填审查关 eval（id 7）。③ 一段弯路：把"commit 落错分支"的坑误判为需 worktree 隔离，立了 C5"一 skill 一 worktree"并散建多个 worktree 目录——经用户校正，认清初衷是**标准单仓**（各 skill 各分支、一个 `first-party` 家），已撤 C5、拆掉多余 worktree、回归单一工作区。（上一份 2026-07-04 ob-notes 摘要见 `git log -- handoff.md`。）
