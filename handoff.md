# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

- **纪律新增 C5 · 一 skill 一 worktree**（已 push main `cff24fa`；CLAUDE.md/AGENTS.md 逐字节同步）：多 agent 共享单一工作区、HEAD 全局被并行会话切换，导致 commit 落错分支 / 工作区文件"消失"（本会话真实复发并返工）。C5 立"每个 first-party skill 用专属 git worktree + 分支、主克隆根目录停 main"根治。⚠️ **Codex 需遵守 C5**：别再占用主目录 `D:\nexgaios-skills` 切分支，改用 `git worktree add` 起独立目录。
- **learn-everything v0.1.0**（分支 `learn-everything-skill` `1561eed`，已 push；worktree `D:\nexgaios-skills-learn-everything`）：认知地图自生长引擎（不套框架、整体↔原子双向）+ 六法定序 1→2→4→5→6→3 + 铁律五·审查关（一律必审、独立子 agent 联网查证、可信度五级）+ 失败回填。lint 绿；harness 主题 dogfood 六法全程跑通、审查关抓出 6 处记忆错并修正。**未走正式评测、未合 main**。
- **ob-notes v1.0.0 候选**（分支 `codex/ob-notes-obsidian-only` `878166f`，主目录）：进行中，见下 ob-notes 下一步。
- **工作区（三 worktree）**：`D:\nexgaios-skills`(codex/ob-notes) · `D:\nexgaios-skills-learn-everything`(learn-everything-skill) · `D:\nexgaios-skills-main`(main，改纪律用、可 `git worktree remove`)。
- **门禁**：lint 全绿（含共享段逐字节一致）；main 已含 C5。

## 下一步

**learn-everything**（在 `D:\nexgaios-skills-learn-everything`）：① evals 用例过目（F 人在环，含审查关回归用例 id 7）→ 触发 + 执行评测（skill-creator）达标；② 合 main + tag `learn-everything/v0.1.0`；③ 审查关"一律必审"使用一段后再评估是否放宽（智能判断）。
**ob-notes**：续 v1.0.0 迭代（用户明确还没迭代完，暂不跑评测）→ 发布链：eval 过目 → 触发 + 执行评测重跑（description 大改必重测）→ 合 main → tag `ob-notes/v1.0.0`（中文 tag message）→ 更新 marketplace.json（path 改 `skills/first-party/ob-notes`）。
**Codex 侧**：采用 C5 worktree 制；run_loop.py 嵌套鉴权、AGENTS.md 平台段接管遗留。

## 未决问题

- 多 skill 触发互斥性未测——现在有 learn-everything + ob-notes 两个 skill，负例集可能互含对方正例，第二个 skill 出现即该测。
- learn-everything 审查关"一律必审"的开销/放宽策略待真实使用验证（每次一个联网子 agent，十万 token 级）。
- run_loop.py（description 优化）依赖 `claude -p` 嵌套鉴权失败，待 API key 环境。
- pass^k 的 k 与各 skill 触发率阈值未定（宜落成机器可读文件，首个正式发布时定）。
- ADR-0010 存疑：third-party 安装路径待首个第三方 skill 收藏时实测。

## 环境备忘

- 家用机 TerryXming：Windows 11；git 2.53 / Python 3.14 / Node 24 / pwsh 7.6；Codex `project_doc_max_bytes=131072`；skills-ref 0.1.1。
- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53 / Python 3.13.5 / Node 24；Codex 128 KiB 已设；skills-ref 0.1.1。
- ob-notes：两机各配 `~/.config/ob-notes/config.json` 指向自己的 kbase（读取顺序见 ob-notes preflight.md）。
- learn-everything：失败回填门控读 `~/.config/learn-everything/config.json` 的 `dev_repo`（仅维护者机器配；普通环境该通道惰性）。

## 上次会话摘要（2026-07-06 · learn-everything + C5）

① 从零建 learn-everything skill——经多轮纠偏（六法编排 → 13 维元维度模板，均被否）回到"**认知地图自生长为引擎、六法定序、迭代靠失败回填**"；核心是主题自生长认知地图（不套框架、整体↔原子双向）。gold standard = 维护者 kbase 已产出的学习实录（四柱等）。② dogfood harness 主题走完六法；认知地图**审查关**（独立子 agent 联网核实官方文档）抓出权限四档→六档、hook 31→33、prompt caching 归类错、memory 压扁等 6 处并修正，回填审查关 eval（id 7）。③ 踩多 agent 共享 worktree 切 HEAD 坑（commit 落错分支、文件消失），`git worktree` 隔离修复 + 立纪律 C5。④ 建三 worktree、push main(C5) + learn-everything-skill。（上一份 2026-07-04 ob-notes 摘要见 `git log -- handoff.md`。）
