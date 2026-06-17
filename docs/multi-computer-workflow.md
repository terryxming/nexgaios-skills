# 双电脑协同工作流

本文档说明公司电脑和家里电脑如何共同维护 `nexgaios-skills`。

## 职责边界

必须区分三个位置：

```text
D:\nexgaios-skills
```

这是源码仓库。两台电脑都应该通过 GitHub 同步这个仓库。

如果另一台电脑的本地克隆路径不同，使用那台电脑的实际仓库路径；不要把某台电脑的绝对路径当作跨电脑通用事实。

```text
$env:USERPROFILE\.codex\skills
```

这是每台电脑自己的 Codex skill 安装目录。CLI 实际按当前登录用户的 home 目录计算，等价于 Node.js 的 `os.homedir()` 下的 `.codex\skills`。它由用户明确确认后，通过 `pnpm skill:install <skill-id>` 或 `pnpm skill:sync` 从源码仓库同步生成，不作为源码事实源。

```text
E:\terry-nexgaios-gbrain\01 - AI Work\0102 - 项目\Nexgaios-skills 仓库\repository-guide.md
```

这是公司电脑和家用电脑当前约定使用的 Obsidian 镜像文件路径。它不是 GitHub 源码仓库的一部分；两台电脑都需要各自保证这个本机路径存在。

## 唯一源码事实源

GitHub 仓库是唯一源码事实源：

```text
https://github.com/terryxming/nexgaios-skills
```

不要把某台电脑的 Codex skill 安装目录当作源码源头。

## 每次开始工作前

在当前电脑执行：

```powershell
cd D:\nexgaios-skills
git status --short --branch
git fetch origin
git pull --ff-only
pnpm install --frozen-lockfile
```

规则：

- 如果 `git status` 显示有本地未提交改动，先判断这些改动是否属于当前任务。
- 如果本地有未提交改动，不要直接 `git pull` 覆盖。
- `git pull --ff-only` 只允许快进，避免自动生成不清楚的 merge commit。
- 开始工作前不默认同步到本机 Codex 安装目录。需要刷新本机已安装 skill 时，先明确询问用户；用户确认后再运行 `pnpm skill:install <skill-id>` 或 `pnpm skill:sync`。

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

每次修改 `skills/<domain>/<skill-id>/` 后，最终回复前必须显式询问用户是否要同步到本机 Codex 安装目录。用户明确同意后，优先同步单个 skill：

```powershell
pnpm skill:install <skill-id>
```

只有用户明确要求同步全部 active skill 时，才运行：

```powershell
pnpm skill:sync
```

不得把“源码已更新”表述为“本机 Codex 已安装更新”。

## 未完成工作交接

如果在公司电脑开发或维护 skill 时没有完成，需要回到家里电脑继续，必须创建或更新交接文档：

```powershell
pnpm handoff:new <skill-id> --title "<交接标题>"
```

交接文档位置：

```text
docs/handoffs/<skill-id>/<yyyy-mm-dd>-<slug>.md
```

交接文档必须写清楚：

- 目标 skill。
- 当前分支和 commit。
- 已完成事项。
- 未完成事项和下一步。
- 阻塞或风险。
- 需要继续查看的文件。
- 已运行的验证命令和结果。
- 是否已经同步到本机 Codex 安装目录。

交接文档必须随当前分支提交并推送到 GitHub，否则另一台电脑无法续接。

另一台电脑继续工作时：

```powershell
cd D:\nexgaios-skills
git fetch origin
git pull --ff-only
pnpm install --frozen-lockfile
pnpm handoff:list <skill-id>
```

先阅读对应交接文档，再继续修改 skill。

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

指向 `main`、来源于本仓库分支、且不是 Draft 的 PR，会在 `validate` 通过后自动 squash merge，并删除对应分支。

如果工作还没准备好进入 `main`，必须保持 Draft PR。

PR 合并到 `main` 后，在另一台电脑执行：

```powershell
cd D:\nexgaios-skills
git fetch origin
git switch main
git pull --ff-only
pnpm install --frozen-lockfile
```

如果需要把仓库中的 skill 安装到当前电脑的 Codex，再明确询问用户；用户确认后运行 `pnpm skill:install <skill-id>` 或 `pnpm skill:sync`。

## 冲突处理原则

- 不使用 `git reset --hard` 清理不明改动。
- 不使用 `git checkout -- <file>` 回退用户未确认的改动。
- 先看 `git status --short --branch` 和 `git diff`。
- 如果两台电脑都改了同一文件，优先通过 PR 或明确 diff 合并。

## 经验沉淀

如果跨电脑协同中遇到可复用问题，新增经验卡片：

```powershell
pnpm experience:new <slug> --domain workflow --tags "multi-computer,github,sync,handoff"
```

然后用关键词确认能检索到：

```powershell
pnpm experience:search "multi-computer sync handoff"
```
