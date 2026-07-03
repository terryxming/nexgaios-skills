# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

- 工作分支：`codex/ob-notes-obsidian-only`（ob-notes **v1.0.0 候选**，未合 main）——Obsidian-only 收敛 + 问答实录模板 + 模板重构「问题保真、回答重写」（`913f2c8`）。
- main：交接体系重构（本次，ADR-0009）+ install.py 双端恢复与 GBK 修复（`d3bb020`）+ ob-notes v0.8.0 已发布（tag `ob-notes/v0.8.0` + marketplace 条目）。
- 门禁：lint 全绿（新增 marketplace↔tag 一致性检查）；CI 扩至全分支 push，新增 handoff 联动检查（**试行待验证**——真实 push 事件下的表现待观察）。

## 下一步（建议顺序）

1. **ob-notes v1.0.0 继续迭代**（用户明确：还没迭代完，暂不重跑评测）。
2. 迭代完走发布链：eval 用例过目（F 人在环，注意 eval #4 新增"讲解体/每轮总纲"两断言）→ 触发+执行评测重跑（description 大改，必须重测）→ 合 main → tag `ob-notes/v1.0.0`（tag message 用中文）→ 更新 marketplace.json 的 ref/version/description（lint 一致性门禁会兜底）。
3. Codex 侧遗留：run_loop.py 嵌套鉴权、AGENTS.md 平台段接管（承前）。

## 未决问题

- skill-creator 的 run_loop.py（description 优化）依赖 `claude -p`，本机嵌套鉴权失败，待有 API key 的环境再试。
- pass^k 的 k 与各 skill 触发率阈值未定（首个正式发布时定，且宜落成机器可读文件）。
- 多 skill 触发互斥性未测（第二个 skill 出现时，负例集应互含对方正例）。

## 环境备忘

- 家用机 TerryXming：Windows 11；git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072` 已设；skills-ref 0.1.1；`~/.codex/skills/ob-notes` 装的是 v1.0.0 候选（dogfood）。
- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53 / Python 3.13.5 / Node 24.14.1；Codex 128 KiB 已设；skills-ref 0.1.1。
- 两机各自配 `~/.config/ob-notes/config.json` 指向自己的 kbase（读取顺序见 ob-notes preflight.md）。

## 上次会话摘要（2026-07-04 · 家用机）

检查并修正 Codex 产出（恢复 install.py 的 Claude `~/.claude/skills` 目标——官方文档证实其存在，tag/marketplace 核验通过）；ob-notes dialogue 模板按实库对比重构（「问题保真、回答重写」，`913f2c8`）；交接体系重构落地：journal/ 退役删除 → 本文件 + lessons-learned 台账 + C1-C3 修订 + CI 两门禁（ADR-0009）；纪律双份风格统一（私有纪律改为通用纪律的讲解体，规则语义与标识符 A1-A5/C1-C4/桶一二三/G①-⑤ 原样保留；删通用标题"一字未改"括注）+ README 增协作运行手册。
