# 双电脑协同工作流

本文档说明公司电脑和家里电脑如何共同维护 `nexgaios-skills`。

## 职责边界

必须区分三个位置：

```text
D:\nexgaios-skills
```

这是源码仓库。两台电脑都应该通过 GitHub 同步这个仓库。

```text
C:\Users\EDY\.codex\skills
```

这是每台电脑自己的 Codex skill 安装目录。它由 `pnpm skill:sync` 从源码仓库同步生成，不作为源码事实源。

```text
E:\Terry LLM-Wiki Obsidian\raw\01 - AI Work\0102 - 项目\Nexgaios-skills 仓库\repository-guide.md
```

这是公司电脑上的 Obsidian 镜像文件。它不是 GitHub 源码仓库的一部分。

## 唯一源码事实源

GitHub 仓库是唯一源码事实源：

```text
https://github.com/terryxming/nexgaios-skills
```

不要把某台电脑的 `C:\Users\EDY\.codex\skills` 当作源码源头。

## 每次开始工作前

在当前电脑执行：

```powershell
cd D:\nexgaios-skills
git status --short --branch
git fetch origin
git pull --ff-only
pnpm install --frozen-lockfile
pnpm skill:sync
```

规则：

- 如果 `git status` 显示有本地未提交改动，先判断这些改动是否属于当前任务。
- 如果本地有未提交改动，不要直接 `git pull` 覆盖。
- `git pull --ff-only` 只允许快进，避免自动生成不清楚的 merge commit。
- `pnpm skill:sync` 把仓库内 active skill 同步到本机 Codex 安装目录。

## 开发过程中

建议每个任务使用独立分支：

```powershell
git switch -c codex/<task-name>
```

修改 skill 时只改对应目录：

```text
skills/<domain>/<skill-id>/
```

修改仓库工具、模板或文档时，明确它不是某个 skill 的发布变更。

## 提交前检查

至少运行：

```powershell
pnpm skills:docs
pnpm skills:docs:check
pnpm skills:guard
pnpm skills:validate
```

如果修改了 `docs/repository-guide.md`，并且当前电脑存在 E 盘 Obsidian 镜像文件，运行：

```powershell
pnpm guide:sync
pnpm guide:check
```

如果当前电脑找不到 E 盘 Obsidian 镜像文件，必须先询问用户是否创建或恢复，不得自动创建。

## 提交和同步到另一台电脑

完成当前任务后：

```powershell
git status --short --branch
git add <本次任务相关文件>
git commit -m "<清晰提交信息>"
git push -u origin <当前分支>
```

通过 PR 合并到 `main` 后，在另一台电脑执行：

```powershell
cd D:\nexgaios-skills
git fetch origin
git switch main
git pull --ff-only
pnpm install --frozen-lockfile
pnpm skill:sync
```

## 冲突处理原则

- 不使用 `git reset --hard` 清理不明改动。
- 不使用 `git checkout -- <file>` 回退用户未确认的改动。
- 先看 `git status --short --branch` 和 `git diff`。
- 如果两台电脑都改了同一文件，优先通过 PR 或明确 diff 合并。

## 经验沉淀

如果跨电脑协同中遇到可复用问题，新增经验卡片：

```powershell
pnpm experience:new <slug> --domain workflow --tags "multi-computer,github,sync"
```

然后用关键词确认能检索到：

```powershell
pnpm experience:search "multi-computer sync"
```
