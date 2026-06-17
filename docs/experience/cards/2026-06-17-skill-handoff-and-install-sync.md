---
title: "修改 skill 后必须区分交接和本机安装同步"
date: 2026-06-17
domain: workflow
tags: "skill, handoff, sync, install, multi-computer, codex"
status: active
---

# 修改 skill 后必须区分交接和本机安装同步

## 触发场景

维护 `nexgaios-skills` 时，修改了 `skills/<domain>/<skill-id>/`，或者工作未完成但需要换电脑继续。

## 症状

- 公司电脑改了源码，家里电脑不知道下一步要做什么。
- 源码仓库已经更新，但本机 Codex 安装目录仍是旧版本。
- 新线程把“源码已更新”误说成“本机 Codex 已安装更新”。

## 根因

源码仓库、交接文档、本机 Codex 安装目录是三个不同状态：

- 本机 `nexgaios-skills` 克隆目录是源码工作区，路径可以因电脑不同而不同。
- GitHub 仓库是源码事实源。
- `docs/handoffs/<skill-id>/` 记录未完成工作的续接信息。
- `$env:USERPROFILE\.codex\skills` 是当前电脑自己的 Codex skill 安装目录。

这三者不会自动互相等同。

## 解法

如果工作未完成且需要换电脑继续，创建交接文档：

```powershell
pnpm handoff:new <skill-id> --title "<交接标题>"
```

交接文档必须随当前分支提交并推送到 GitHub。

如果修改了 `skills/<domain>/<skill-id>/`，最终回复前必须询问用户是否要同步到本机 Codex 安装目录。用户明确同意后，优先同步单个 skill：

```powershell
pnpm skill:install <skill-id>
```

只有用户明确要求同步全部 active skill 时，才运行：

```powershell
pnpm skill:sync
```

## 适用边界

适用于 `nexgaios-skills` 仓库内的 skill 开发、维护、迁移和跨电脑续工。

不适用于普通文档或工具改动，因为这些改动不一定对应某个本机可安装的 skill。

## 验证记录

- 日期：2026-06-17
- 验证命令：`pnpm handoff:new skill-doctor --title "smoke handoff"`、`pnpm handoff:list skill-doctor`
- 结果：交接文档可生成、可列出；同步安装仍需用户明确确认。
