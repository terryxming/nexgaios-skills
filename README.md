# nexgaios-skills

这是 Nexgaios agent skills 的统一源码仓库，面向多运行时（Claude Code / Codex）通用。

Agent 项目指令：[AGENTS.md](AGENTS.md)（Claude Code 从 [CLAUDE.md](CLAUDE.md) 引用同一份）。

新人先读：[仓库架构与工作指南](docs/repository-guide.md)。

## 首次环境检查

首次 clone 或换电脑后，先运行环境检查：

```bash
node tools/skills/skill-cli.mjs env-check
```

如果 `node` 本身不可用，在 Windows 下运行：

```bash
.\skill.ps1 env-check
```

环境检查只报告缺失项和建议操作，不会自动安装、启用或修改任何工具。发现缺失时，先向用户报告并等待明确批准，再执行类似下面的修复命令：

```bash
corepack prepare pnpm@11.7.0 --activate
corepack pnpm install --frozen-lockfile
```

这个仓库按三层边界管理：

- 仓库边界：统一管理脚本、CI、模板和发布规则。
- 业务域边界：只用于分类，例如 `amazon`、`knowledge-management`。
- 发布边界：永远是单个技能目录。

## 目录结构

```text
skills/
  <domain>/
    <skill-id>/
      skill.yaml
      SKILL.md
      README.md
      CHANGELOG.md

tools/
  skills/
    skill-cli.mjs

templates/
  skill/
```

## 日常命令

新建技能：

```bash
pnpm skill:new amazon amazon-review-insight
```

新建命令会生成 `SKILL.md`、`skill.yaml`、`README.md`、`CHANGELOG.md`，以及 `references/`、`scripts/`、`assets/`、`tests/` 目录说明。

从本地目录或 GitHub 仓库导入技能：

```bash
pnpm skill:import <domain> <skill-id> --from <本地目录或 GitHub URL> [--ref <tag/branch>]
```

如果目标技能已存在，需要显式追加 `--force` 才会覆盖：

```bash
pnpm skill:import <domain> <skill-id> --from <本地目录> --version <semver> --force
```

列出所有技能：

```bash
pnpm skill:list
```

验证单个技能：

```bash
pnpm skill:validate lingxing-ad-operation-audit
```

安装到本机运行时目录（按 skill.yaml 的 `targets` 分发）：

```bash
pnpm skill:install lingxing-ad-operation-audit                    # 安装到该 skill 声明的所有运行时
pnpm skill:install lingxing-ad-operation-audit --runtime claude   # 只安装到 Claude Code（~/.claude/skills）
pnpm skill:install lingxing-ad-operation-audit --runtime codex    # 只安装到 Codex（~/.codex/skills）
```

修改 `skills/<domain>/<skill-id>/` 后，需要先询问用户是否同步到本机安装目录；用户明确同意后再运行安装或同步命令。不要把“源码已更新”表述为“本机已安装更新”。

安装仓库内全部 active 技能到本机运行时：

```bash
pnpm skill:sync                    # 每个 skill 按自己的 targets 分发
pnpm skill:sync --runtime claude   # 只同步 Claude Code 一侧
```

`skill:sync` 默认只覆盖本仓库中同名 skill 的安装目录，不删除运行时目录里的其他 skill。如果要删除曾由本仓库安装、但当前仓库已经不存在的旧 skill，显式使用：

```bash
pnpm skill:sync --prune
```

Claude Code 一侧还可以走插件市场通道：仓库根的 `.claude-plugin/marketplace.json` 是私有插件源清单，当前发布 `ob-notes`（在 Claude Code 中把本仓库添加为 marketplace 即可安装）。

重新生成技能总览和业务域 README：

```bash
pnpm skills:docs
```

检查生成文档是否已同步：

```bash
pnpm skills:docs:check
```

同步仓库架构指南到 Obsidian 镜像：

```bash
pnpm guide:sync
```

检查仓库架构指南与 Obsidian 镜像是否一致：

```bash
pnpm guide:check
```

检索项目经验库：

```bash
pnpm experience:search "GitHub CLI PATH"
```

新增经验卡片：

```bash
pnpm experience:new github-cli-path --domain repo --tags "github,windows,path"
```

创建未完成工作的交接文档：

```bash
pnpm handoff:new ob-notes --title "补充触发规则"
```

查看某个技能的交接文档：

```bash
pnpm handoff:list ob-notes
```

检查是否误提交临时文件、大文件或常见密钥格式：

```bash
pnpm skills:guard
```

提交技能变更、推送分支并创建 PR：

```bash
pnpm skill:ship lingxing-ad-operation-audit --patch -m "优化审计报告"
```

需要时可以使用 `--minor`、`--major` 或 `--no-release`。

Windows 下也可以直接使用仓库里的包装脚本：

```bash
.\skill.cmd new amazon amazon-review-insight
.\skill.cmd validate lingxing-ad-operation-audit
.\skill.cmd ship lingxing-ad-operation-audit --patch -m "优化审计报告"
```

如果要自动创建 PR，需要先安装并登录 GitHub CLI：

```bash
gh auth login
```

## 发布规则

只有某个技能自己的 `skill.yaml` 版本号发生变化时，才会发布这个技能。

更新 `tools/`、`templates/`、CI 或其他技能，不会发布无关技能。

PR 验证会自动评论本次变更涉及哪些 skill、版本是否变化、合并到 `main` 后是否会发布。

创建指向 `main`、来源于本仓库分支、且不是 Draft 的 PR 后，使用本机已登录的 GitHub CLI 启用 auto-merge。`validate` 通过后，GitHub 会自动 squash merge，并删除对应分支。未准备好合并的 PR 必须保持 Draft。

GitHub Release 使用 `pnpm skill-cli release-notes` 生成中文发布说明。
