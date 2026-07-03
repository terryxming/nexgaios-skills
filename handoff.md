# 交接（唯一交接文档）

> 本文件每次收工**覆盖重写**（纪律 C2），历史见 `git log -- handoff.md`，不另存副本。续工（C3）：先 `git pull`，读本文件 + `docs/decisions/`；切机器先跑 C1 巡检。坑与经验的沉淀见 [docs/lessons-learned.md](docs/lessons-learned.md)（追加式，本文件不复述）。

## 当前状态

- **目录结构已定型**（ADR-0010）：`skills/first-party/`（自主开发，发布单元）+ `skills/third-party/`（第三方原样副本，门禁全豁免、license 入库边界、sources.md 溯源）；ob-notes 已 `git mv` 至 `skills/first-party/ob-notes`，历史无损。
- **工作分支**：`codex/ob-notes-obsidian-only`（ob-notes **v1.0.0 候选**，未合 main，`5f4709d`）——Obsidian-only 收敛 + 问答实录模板 + 「问题保真、回答重写」重构，目录迁移已同步。
- **main**（`2a82f37`）：今日完成 install.py 双端修复、交接体系（ADR-0009）、纪律讲解体化 + 编号规范化（两层命名空间、圈号清零、G·2 式引用）、skills 二分（ADR-0010）。
- **门禁**：lint 12 项全绿（新增布局检查——skills/ 一级仅两分类目录）；CI 全分支 push + handoff 联动（试行）真实事件已通过多轮。
- **发布态**：`ob-notes/v0.8.0` 已发布；marketplace 条目 pin 于 v0.8.0 tag 的旧路径 `skills/ob-notes`（该 tag 树内有效，勿改），v1.0.0 发布时更新。

## 下一步（公司机，建议顺序）

1. C1 巡检 + pull（main 与分支都拉），切工作分支**续 ob-notes v1.0.0 迭代**（用户明确：还没迭代完，暂不跑评测）。
2. 迭代完走发布链：eval 用例过目（F 人在环，注意 eval #4 新增"讲解体/每轮总纲"两断言）→ 触发 + 执行评测重跑（description 大改必须重测）→ 合 main → tag `ob-notes/v1.0.0`（tag message 用中文）→ **更新 marketplace.json**（path 改 `skills/first-party/ob-notes` + ref/version/description，lint 一致性门禁兜底）。
3. Codex 侧遗留：run_loop.py 嵌套鉴权、AGENTS.md 平台段接管。

## 未决问题

- run_loop.py（description 优化）依赖 `claude -p`，嵌套鉴权失败，待 API key 环境。
- pass^k 的 k 与各 skill 触发率阈值未定（宜落成机器可读文件，首个正式发布时定）。
- 多 skill 触发互斥性未测（第二个 skill 出现时负例集互含对方正例）。
- ADR-0010 存疑：third-party 安装路径待首个第三方 skill 收藏时实测。

## 环境备忘

- 家用机 TerryXming：Windows 11；git 2.53.0 / Python 3.14.2 / Node 24.14.1 / pwsh 7.6.3；Codex `project_doc_max_bytes=131072`；skills-ref 0.1.1；`~/.codex/skills/ob-notes` 装的是 v1.0.0 候选（dogfood）。
- 公司机 CHINAMI-5T8IKFA：Windows 11；git 2.53 / Python 3.13.5 / Node 24.14.1；Codex 128 KiB 已设；skills-ref 0.1.1。
- 两机各自配 `~/.config/ob-notes/config.json` 指向自己的 kbase（读取顺序见 ob-notes preflight.md）。

## 上次会话摘要（2026-07-04 · 家用机 · 全天）

六批工作：①检查并修正 Codex 产出（恢复 install.py 的 Claude `~/.claude/skills` 目标——跨 agent 幻觉实例，见台账）②ob-notes dialogue 模板重构「问题保真、回答重写」+ anti-patterns 坏例 7（`913f2c8`）③交接体系重构（ADR-0009：journal/ 退役删除 → handoff.md + lessons-learned；CI 扩全分支 + handoff 联动 + marketplace↔tag 门禁）④纪律双份讲解体化、删"一字未改"括注 ⑤编号规范化（通用数字 / 私有字母双命名空间、圈号清零、"父号·数字"引用式、lint 陈旧引用 E.3/E.4 修正）⑥skills 二分落位（ADR-0010，含同日澄清修正：顶层 third-party/ 改 skills/ 内嵌套；布局防呆首跑拦下存量 `.gitkeep`）。全部门禁红/绿两态实测，CI 全绿。
