# nexgaios-skills

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
| `skills/first-party/` | 自主开发 skill，每个一个目录（唯一事实源与发布单元；evals 用例与 `dev-log.md`/`CHANGELOG.md` 等域内开发文件随源入库，见 [ADR-0006](docs/decisions/0006-skill-domain-vs-distribution.md)） |
| `skills/third-party/` | 第三方 skill 原样副本（研究/安装用，不参与门禁与发布；入库须有再分发许可，溯源见 [`sources.md`](skills/third-party/sources.md)，[ADR-0010](docs/decisions/0010-third-party-skills-directory.md)） |
| `tools/` | 确定性脚本：lint（skills-ref / 可移植 / 中文化 / 杂物拦截 / `metadata.version` / marketplace↔tag 一致性门禁）、纪律漂移校验、handoff 联动检查、本地安装脚本 |
| `docs/decisions/` | 决策记录（ADR），附证据来源 |
| `docs/lessons-learned.md` | 流水线/平台层经验台账（追加式，含"已固化到哪"列） |
| `handoff.md` | 唯一交接文档（收工覆盖重写，历史在 git，见 [ADR-0009](docs/decisions/0009-single-handoff-and-lessons.md)） |
| `.claude/skills/` | 评测/运行时暂存区（gitignore 不入库；skill 源一律在 `skills/`） |
| `.claude-plugin/marketplace.json` | Claude Code marketplace 索引，首个发布项为 `ob-notes` |

## 平台与分发

- 目标平台：**Claude Code + Codex** 两家。
- 分发渠道：自用 + 团队共享 + 公开 marketplace + GitHub。
- **单仓公开制**（见 [ADR-0008](docs/decisions/0008-single-public-repo.md)）：本仓（公开）即开发仓即分发仓；**skill 是发布单元**，发布 = 过 G 门禁合入 main 并打 tag（main = 可安装态，装到的永远是已发布版）；外部用户经 Claude marketplace / Codex `$skill-installer` 直装本仓；自用走本地 `tools/install.py` 纯复制完整 skill 目录到两端用户目录，Claude Code 亦可走 plugin marketplace。内部 skill 未来另立私有仓。

### 本地安装（自用）

```bash
python tools/install.py --list
python tools/install.py ob-notes
```

`tools/install.py` 默认安装到 Claude Code 的 `~/.claude/skills`（用户级 personal skills 目录，对所有项目生效）与 Codex 的 `$CODEX_HOME/skills`（无 `CODEX_HOME` 时为 `~/.codex/skills`）。目标已存在时会停止；确认要覆盖再加 `--force`；`--dest` 只装到自定义目录。`skills/first-party/` 与 `skills/third-party/` 均可安装，同名冲突时用 `--from` 指定来源。

### Claude Code marketplace 安装

本仓提供 `.claude-plugin/marketplace.json`：

```bash
claude plugin marketplace add terryxming/nexgaios-skills
claude plugin install ob-notes@nexgaios-skills
```

## 工程纪律

通用纪律 + 私有纪律两层，全文内联进 [`CLAUDE.md`](CLAUDE.md) 与 [`AGENTS.md`](AGENTS.md) 常驻上下文（两份的"共享段"逐字节一致，由 [`tools/check-discipline-drift.py`](tools/check-discipline-drift.py) 校验；改一份须同步另一份）。任何 agent 在本仓库干活都受其约束。

## 协作运行手册（跨设备 · 跨 agent）

规则本体常驻 [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md)（私有纪律 C 节），本节只做人读的操作指引。

### 机器与 agent

- 两台 Windows 11 机器经 git/GitHub 接力开发，hostname 即机器识别：家用机 `TerryXming`、公司机 `CHINAMI-5T8IKFA`。铁律：**一切需延续的状态必须进仓库并 push**，git 是唯一同步通道。
- 两个 agent 共用本仓：Claude Code 读 `CLAUDE.md`，Codex 读 `AGENTS.md`——工程纪律共享段逐字节一致（`tools/check-discipline-drift.py` 校验）。跨 agent 的平台断言不臆测，一律查官方文档（纪律 A4·6）。

### 交接与续工

- **收工**：覆盖重写 [`handoff.md`](handoff.md)（当前状态 / 下一步 / 未决问题 / 环境备忘 / 上次会话摘要），坑与经验追加进 [`docs/lessons-learned.md`](docs/lessons-learned.md)，commit + push。历史在 `git log -- handoff.md`。
- **续工**：先 pull，读 `handoff.md` 与 `docs/decisions/`，再动手。
- **机械兜底**：CI 的 handoff 联动检查——推送动了 `skills/first-party/` 或 `docs/decisions/` 而未同批更新 `handoff.md` 即红（见 [ADR-0009](docs/decisions/0009-single-handoff-and-lessons.md)）。

### 冷启动（新机器 / 新克隆）

1. 装工具链：git、Python ≥ 3.11、Node、pwsh（当前各机实际版本见 `handoff.md` 环境备忘）。
2. clone 本仓，`pip install -r tools/requirements.txt`（skills-ref，lint 桶一依赖）。
3. Codex 侧：`~/.codex/config.toml` 设 `project_doc_max_bytes = 131072`——纪律常驻超默认 32 KiB 上限，不设会被静默截断（见 ADR-0002）。
4. 自用 skill 安装见上文「本地安装（自用）」；ob-notes 使用者另配 `~/.config/ob-notes/config.json` 指向本机知识库。
5. 开工第一件事是 C1 巡检（agent 会自动跑并显式报结果）：git 状态与分支、工具链版本、Codex 上限、读 `handoff.md`。

### 环境自检

- `python tools/lint.py`——仓库健康基线（全部硬门禁一次跑齐）。
- `python tools/check-discipline-drift.py`——单查纪律双份共享段一致性。
