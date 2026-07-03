# 0001. 平台兼容与单一事实源

- 状态:已接受
- 日期:2026-07-02
- 决策人:terry（家用电脑，规划阶段）

## 背景

流水线需同时服务 Claude Code 与 Codex 两家。规划初期担心要在 `skills/` 里维护两套格式，构建层做"格式翻译"。查证后需确认:两家到底是不是同一种 skill 格式。

## 决策

采用 **Agent Skills 开放标准**的 `SKILL.md` 作为**唯一事实源**。构建层职责缩小为**分发打包**,不做格式翻译。平台特有配置放 **sidecar 文件**,不污染 `SKILL.md`。

## 证据（均附官方来源）

1. **同一标准,两家原生兼容。** Anthropic 于 2025-12 将 Agent Skills 作为开放标准发布于 agentskills.io,30+ 平台采用,含 Codex、Gemini CLI、Cursor、GitHub Copilot。OpenAI 官方文档写明 Codex skills "build on the open agent skills standard"。→ **同一份 SKILL.md 两家直接可用,无需翻译。**
2. **规范 frontmatter 边界。** 必填 `name`(≤64 字符,小写字母/数字/连字符,不以连字符起止、无连续连字符,**必须等于父目录名**)、`description`(≤1024 字符,写清做什么+何时用)。可选 `license`、`compatibility`(≤500)、`metadata`(任意键值,放 version/author 的合法位置)、`allowed-tools`(实验性)。官方提供 `skills-ref validate` 校验工具。
3. **Codex 读取路径。** 仓库级 `.agents/skills`(从 cwd 向上扫到 repo root)、用户级 `~/.agents/skills`、管理员级 `/etc/codex/skills`;支持 symlink。
4. **Codex sidecar 不污染规范。** Codex 专属增强是独立的 `agents/openai.yaml`(`display_name`、`allow_implicit_invocation`、MCP `tools` 依赖声明),非必需。→ SKILL.md 保持纯净,平台差异隔离在 sidecar。
5. **分发:一个仓库两端通吃。** Codex 侧 `$skill-installer`(从 GitHub 仓库拉取)+ plugin 打包;Claude 侧 `marketplace.json`。→ **一个公开 GitHub 仓库 = Claude marketplace 源 + Codex 可安装源**,覆盖自用/团队/公开 marketplace/GitHub 四渠道。

## 影响

- `skills/` 只写一种格式;`tools/build` 只做分发打包。
- lint 集成官方 `skills-ref validate`,再叠加自建质量检查(见 CLAUDE.md/AGENTS.md《私有工程纪律》§E)。
- 新增第三家平台时,只加分发 adapter,不动 skill 源。

## 存疑 / 待验证

- **Codex 用户级路径分歧**:官方文档为 `~/.agents/skills`,但部分第三方教程写 `~/.codex/skills`。判断后者为旧版遗留,但**属推断**。落地时在装有 Codex 的机器跑 `/skills` 实测确认,两路径都试。
  - **2026-07-03 实机证据（公司机）**:本机 Codex 内置 skill 位于 `~/.codex/skills/.system/skill-creator/`,且该官方 SKILL.md 明说无 `CODEX_HOME` 时回落 `~/.codex/skills` 自动发现——本机版本**实证倾向 `~/.codex/skills`**,与"旧版遗留"的原推断相反。待 Codex 当值跑 `/skills` 终审（联动 ADR-0005）。

## 来源

- https://developers.openai.com/codex/skills
- https://github.com/openai/codex/blob/main/docs/skills.md
- https://agentskills.io/specification
- https://agentskills.io/home
- https://github.com/openai/skills
- https://venturebeat.com/technology/anthropic-launches-enterprise-agent-skills-and-opens-the-standard
