---
title: "两台电脑协同开发时以 GitHub 为唯一源码事实源"
date: 2026-06-17
domain: workflow
tags: "multi-computer, github, pull, push, sync, home, office, handoff"
status: active
---

# 两台电脑协同开发时以 GitHub 为唯一源码事实源

## 触发场景

同一个 `nexgaios-skills` 仓库需要在公司电脑和家里电脑之间协同开发。

## 症状

- 一台电脑上改了 skill，另一台电脑看不到。
- 本机 Codex 安装目录和仓库源码不同步。
- Obsidian 镜像路径只在某台电脑存在。
- 一台电脑上未完成的 skill 工作，另一台电脑不知道下一步要做什么。

## 根因

GitHub 仓库才是源码事实源。

`$env:USERPROFILE\.codex\skills` 是每台电脑自己的 Codex 安装目录，不是源码事实源。CLI 实际按当前登录用户的 home 目录计算，不能写死某一台电脑的用户名。

E 盘 Obsidian 镜像是本机知识库文件，不是 GitHub 仓库文件。

## 解法

每台电脑开始工作前：

```powershell
cd D:\nexgaios-skills
git status --short --branch
git fetch origin
git pull --ff-only
pnpm install --frozen-lockfile
```

开始工作前不默认同步到本机 Codex 安装目录。需要刷新本机已安装 skill 时，先明确询问用户；用户确认后再运行 `pnpm skill:install <skill-id>` 或 `pnpm skill:sync`。

完成工作后：

```powershell
pnpm skills:docs
pnpm skills:guard
pnpm skills:validate
git status --short --branch
```

如果修改了 `docs/repository-guide.md`，并且本机存在 E 盘 Obsidian 镜像：

```powershell
pnpm guide:sync
pnpm guide:check
```

如果本机不存在 E 盘 Obsidian 镜像，必须询问用户，不要自动创建。

如果 skill 工作没有完成，需要换电脑继续，创建或更新交接文档：

```powershell
pnpm handoff:new <skill-id> --title "<交接标题>"
```

交接文档必须提交并推送到 GitHub。另一台电脑继续工作时，用 `pnpm handoff:list <skill-id>` 找到并阅读。

## 适用边界

适用于公司电脑和家里电脑都通过 GitHub 同步 `nexgaios-skills` 源码的情况。

不适用于把某台电脑的 Codex skill 安装目录当作源码目录直接互相复制。

## 验证记录

- 日期：2026-06-17
- 验证命令：`git status --short --branch`、`pnpm handoff:list`
- 结果：源码仓库、本机 Codex 安装目录和未完成工作交接职责分离。
