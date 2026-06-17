# AGENTS.md

本仓库是 `nexgaios-skills`，用于统一维护 Nexgaios Codex skills。

默认使用中文与用户交流。

## 新线程启动规则

在开始任何代码、文档或 skill 修改前，先阅读：

1. `docs/repository-guide.md`
2. `docs/skill-protocol.md`
3. `docs/skills-overview.md`

如果任务涉及公司电脑和家里电脑协同，阅读：

```text
docs/multi-computer-workflow.md
```

## 经验库检索规则

不要一次性读取整个 `docs/experience/cards/` 目录。

遇到以下情况时，先检索经验库：

- 命令失败。
- CI 或 GitHub Actions 失败。
- GitHub CLI、PR、release、tag、权限、登录异常。
- Git 状态、分支、合并、路径解析异常。
- `docs/repository-guide.md` 和 Obsidian 镜像不一致。
- 两台电脑同步、Codex skill 安装目录、E 盘路径问题。
- skill 新建、迁移、发布、验证边界不清楚。

检索命令：

```powershell
pnpm experience:search "<关键词>"
```

只阅读搜索结果中相关的 1-3 条经验卡片。问题解决后，如果经验可复用，新增或更新经验卡片：

```powershell
pnpm experience:new <slug> --domain <domain> --tags "<tag1,tag2>"
```

经验卡片必须包含：触发场景、症状、根因、解法、适用边界、验证记录。

## 仓库边界

- `skills/<domain>/<skill-id>/` 是 skill 源码位置。
- `<domain>` 只负责分类，不作为发布单位。
- 单个 `<skill-id>` 才是发布单位。
- 每个 skill 的版本由自己的 `skill.yaml` 维护。
- 只有某个 skill 的 `version` 变化，main 发布 workflow 才会发布该 skill。

## 常用命令

```powershell
pnpm skill:list
pnpm skills:docs
pnpm skills:docs:check
pnpm skills:guard
pnpm skills:validate
pnpm skill:sync
```

如果修改了 `docs/repository-guide.md`，必须同步本机 Obsidian 镜像：

```powershell
pnpm guide:sync
pnpm guide:check
```

如果 E 盘 Obsidian 镜像文件不存在，必须先询问用户是否创建或恢复；在用户确认前，不得自动创建该文件。

## 双电脑协同规则

GitHub 仓库是唯一源码事实源。

每台电脑开始工作前：

```powershell
cd D:\nexgaios-skills
git status --short --branch
git fetch origin
git pull --ff-only
pnpm install --frozen-lockfile
pnpm skill:sync
```

不要把 `C:\Users\EDY\.codex\skills` 当作源码目录。它只是当前电脑的 Codex skill 安装目录。

## 新建 skill 的验证边界

`pnpm skill:new <domain> <skill-id>` 只证明仓库骨架和基础协议已经生成，不证明业务能力正确。

业务能力必须通过该 skill 自己的验证命令、脚本测试、真实 prompt 测试、误触发测试、输出契约测试和必要的 forward-test 证明。

## Git 与文件安全

- 不要使用 `git reset --hard` 或 `git checkout -- <file>` 回退用户未确认的改动。
- 提交前先看 `git status --short --branch`。
- 暂存文件时只暂存当前任务相关文件。
- 不提交 `.env`、临时报告、截图缓存、`__pycache__`、`dist`、`artifacts`、`data` 或大文件。
