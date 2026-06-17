---
title: "两台电脑协同开发时以 GitHub 为唯一源码事实源"
date: 2026-06-17
domain: workflow
tags: "multi-computer, github, pull, push, sync, home, office"
status: active
---

# 两台电脑协同开发时以 GitHub 为唯一源码事实源

## 触发场景

同一个 `nexgaios-skills` 仓库需要在公司电脑和家里电脑之间协同开发。

## 症状

- 一台电脑上改了 skill，另一台电脑看不到。
- 本机 Codex 安装目录和仓库源码不同步。
- Obsidian 镜像路径只在某台电脑存在。

## 根因

GitHub 仓库才是源码事实源。

`C:\Users\EDY\.codex\skills` 是每台电脑自己的 Codex 安装目录，不是源码事实源。

E 盘 Obsidian 镜像是本机知识库文件，不是 GitHub 仓库文件。

## 解法

每台电脑开始工作前：

```powershell
cd D:\nexgaios-skills
git status --short --branch
git fetch origin
git pull --ff-only
pnpm install --frozen-lockfile
pnpm skill:sync
```

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

## 适用边界

适用于公司电脑和家里电脑都通过 GitHub 同步 `nexgaios-skills` 源码的情况。

不适用于把 `C:\Users\EDY\.codex\skills` 当作源码目录直接互相复制。

## 验证记录

- 日期：2026-06-17
- 验证命令：`git status --short --branch`、`pnpm skill:sync`
- 结果：源码仓库和本机 Codex 安装目录职责分离。
