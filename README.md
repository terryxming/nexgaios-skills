# nexgaios-skills-dev

多 agent（Claude Code + Codex）的 **skill 生产流水线**：开发、测试、评测、发布、迭代一条龙。

## 为什么有这个仓库

过去用单 skill 仓库开发，工程纪律、发布声明、评测等横切工作每次重写，维护累、效率低。本仓库把这些**只写一次**上提到流水线层，skill 目录里只放它独有的东西。

## 核心设计

- **单一事实源**：`skills/` 里只写一种 [Agent Skills 开放规范](https://agentskills.io/specification) 的 `SKILL.md`，Claude Code 与 Codex 直接兼容，构建层只做分发打包、不做格式翻译。
- **不重复造轮子**：skill 的创作与评测委托两端官方内置的 skill-creator；本仓库只做官方不管的事——硬门禁、工程纪律、双平台分发、中文化（见 [ADR-0005](docs/decisions/0005-delegate-to-skill-creator.md)）。
- **纪律即约束**：能脚本化的纪律进 lint/CI 硬门禁，不留在文档里靠自觉。
- **全面中文化**：内容以中文为主，通用/专业术语保留英文并加中文注释（如 TDD（测试驱动开发））；标识符/文件名/路径用英文 kebab-case。

## 目录结构

| 目录 | 用途 |
|---|---|
| `skills/` | 每个 skill 一个目录（唯一事实源，含流水线自用 skill） |
| `tools/` | 确定性脚本：lint（skills-ref / 可移植 / 中文化门禁）、纪律漂移校验；构建/发布脚本随 dist 专题后补 |
| `dist/claude/`、`dist/codex/` | 构建产物，按平台分，**永不手改** |
| `docs/decisions/` | 决策记录（ADR），附证据来源 |
| `journal/` | 跨设备交接文档（handoff） |
| `.claude/skills/` | 评测/运行时暂存区（gitignore 不入库；skill 源一律在 `skills/`） |

## 平台与分发

- 目标平台：**Claude Code + Codex** 两家。
- 分发渠道：自用 + 团队共享 + 公开 marketplace + GitHub。
- 一个公开 GitHub 仓库同时充当 Claude marketplace 源与 Codex 可安装源。

## 工程纪律

通用纪律 + 私有纪律两层，全文内联进 [`CLAUDE.md`](CLAUDE.md) 与 [`AGENTS.md`](AGENTS.md) 常驻上下文（两份的"共享段"逐字节一致，由 [`tools/check-discipline-drift.py`](tools/check-discipline-drift.py) 校验；改一份须同步另一份）。任何 agent 在本仓库干活都受其约束。

## 跨设备协作

家用/公司两台 Windows 机器经 git/GitHub 接续开发。铁律：**一切需延续的状态必须进仓库并 push**，git 是唯一同步通道。收工用 `/handoff`，续工用 `/resume`。
