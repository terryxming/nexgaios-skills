---
title: "Windows 中 gh 不在 PATH 时使用固定 GitHub CLI 路径"
date: 2026-06-17
domain: repo
tags: "github, gh, windows, path, pr, release"
status: active
---

# Windows 中 gh 不在 PATH 时使用固定 GitHub CLI 路径

## 触发场景

在 Windows 的 Codex shell 中运行 `gh --version`、`gh auth status`、`gh pr create` 或 `gh release view` 时，出现 `The term 'gh' is not recognized`。

## 症状

- `gh` 命令无法识别。
- 但本机实际已经安装 GitHub CLI。
- PowerShell 中 `where.exe gh` 可能找不到结果。

## 根因

GitHub CLI 已安装，但当前 Codex shell 的 PATH 没包含安装目录。

本机已验证可用路径：

```text
C:\Program Files\GitHub CLI\gh.exe
```

## 解法

直接使用完整路径调用：

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' auth status
& 'C:\Program Files\GitHub CLI\gh.exe' pr view 7
& 'C:\Program Files\GitHub CLI\gh.exe' release view skill-doctor@0.1.0
```

如果需要定位：

```powershell
Get-ChildItem -Path 'C:\Program Files','C:\Program Files (x86)',$env:LOCALAPPDATA -Recurse -Filter gh.exe -ErrorAction SilentlyContinue | Select-Object -First 10 -ExpandProperty FullName
```

## 适用边界

适用于 Windows 本机 Codex shell 找不到 `gh`，但 GitHub CLI 已安装的情况。

不适用于 GitHub CLI 未安装或未登录的情况；未登录时需要运行 `gh auth login`。

## 验证记录

- 日期：2026-06-17
- 验证命令：`& 'C:\Program Files\GitHub CLI\gh.exe' auth status`
- 结果：已登录 `terryxming`，可创建 PR、查看 Actions、查看 Release。
