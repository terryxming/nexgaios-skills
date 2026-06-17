---
title: "repository-guide.md 变更后必须同步 Obsidian 镜像"
date: 2026-06-17
domain: docs
tags: "repository-guide, Obsidian, mirror, E drive, guide:sync, guide:check"
status: active
---

# repository-guide.md 变更后必须同步 Obsidian 镜像

## 触发场景

修改仓库内：

```text
docs/repository-guide.md
```

## 症状

- 仓库内指南已经变化。
- E 盘 Obsidian 知识库中的同名文件没有同步。
- 后续从 Obsidian 阅读会看到旧内容。

## 根因

`docs/repository-guide.md` 是仓库源文件，E 盘路径是本机 Obsidian 镜像文件。两者不由 Git 自动同步。

E 盘镜像路径：

```text
E:\terry-nexgaios-gbrain\01 - AI Work\0102 - 项目\Nexgaios-skills 仓库\repository-guide.md
```

## 解法

修改 `docs/repository-guide.md` 后运行：

```powershell
pnpm guide:sync
pnpm guide:check
```

如果 `pnpm guide:check` 提示 E 盘文件不存在，不能自动创建文件，必须先询问用户是否创建或恢复。

## 适用边界

适用于公司电脑或存在该 E 盘 Obsidian 路径的电脑。

不适用于 GitHub Actions；GitHub Actions 无法访问本机 E 盘，因此该检查不接入 CI。

## 验证记录

- 日期：2026-06-17
- 验证命令：`pnpm guide:sync`、`pnpm guide:check`
- 结果：仓库指南与 Obsidian 镜像一致。
