# nexgaios-skills-dev

多 agent（Claude Code + Codex）的 **skill 生产流水线**：开发、测试、评测、发布、迭代一条龙。

## 为什么有这个仓库

过去用单 skill 仓库开发，工程纪律、发布声明、评测等横切工作每次重写，维护累、效率低。本仓库把这些**只写一次**上提到流水线层，skill 目录里只放它独有的东西。

## 核心设计

- **单一事实源**：`skills/` 里只写一种 [Agent Skills 开放规范](https://agentskills.io/specification) 的 `SKILL.md`，Claude Code 与 Codex 直接兼容，构建层只做分发打包、不做格式翻译。
- **用 skill 造 skill**：流水线自身的能力（新建 / 评测 / 发布 / 交接）也做成 `.claude/skills/` 里的 skill。
- **纪律即约束**：能脚本化的纪律进 lint/CI 硬门禁，不留在文档里靠自觉。
- **全面中文化**：产出物（含 skill 的 `description`）一律中文，工作语言为中文。

## 目录结构

| 目录 | 用途 |
|---|---|
| `skills/` | 每个 skill 一个目录（唯一事实源） |
| `standards/` | 工程纪律：通用层 + 私有层（单一事实源） |
| `templates/` | 脚手架模板 |
| `tools/` | 确定性脚本：lint / build / eval / release / sync / handoff |
| `dist/claude/`、`dist/codex/` | 构建产物，按平台分，**永不手改** |
| `docs/decisions/` | 决策记录（ADR），附证据来源 |
| `journal/` | 跨设备交接文档（handoff） |
| `.claude/skills/` | 流水线自身的 skill |

## 平台与分发

- 目标平台：**Claude Code + Codex** 两家。
- 分发渠道：自用 + 团队共享 + 公开 marketplace + GitHub。
- 一个公开 GitHub 仓库同时充当 Claude marketplace 源与 Codex 可安装源。

## 工程纪律

见 [`standards/`](standards/)。通用纪律 + 私有纪律两层，并已内联进 [`CLAUDE.md`](CLAUDE.md) 与 [`AGENTS.md`](AGENTS.md) 常驻上下文。任何 agent 在本仓库干活都受其约束。

## 跨设备协作

家用/公司两台 Windows 机器经 git/GitHub 接续开发。铁律：**一切需延续的状态必须进仓库并 push**，git 是唯一同步通道。收工用 `/handoff`，续工用 `/resume`。
