---
title: "PR 自动合并必须以 validate 通过为前置条件"
date: 2026-06-17
domain: workflow
tags: "pr, ci, auto-merge, validate, github-actions, release-workflow"
status: active
---

# PR 自动合并必须以 validate 通过为前置条件

## 触发场景

维护 `nexgaios-skills` 时，需要判断 PR 是否应该人工合并、自动合并，或者暂缓合并。

## 症状

- 不清楚 CI 通过后 PR 会不会自动进入 `main`。
- 工作还没准备好，但担心 PR 被自动合并。
- 想让通过验证的 PR 自动进入 `main`，减少人工操作。

## 根因

自动合并不能等同于跳过检查。仓库必须先用 `main` 分支保护要求 `validate` 通过，再由 GitHub auto-merge 在条件满足后合并。

不要用 GitHub Actions 的 `GITHUB_TOKEN` 合并需要触发后续 workflow 的 PR。`GITHUB_TOKEN` 触发的合并不会再触发 `push` workflow，可能导致 `release-skills.yml` 不运行。

Draft PR 是暂停开关。Draft 不会自动合并。

## 解法

仓库规则：

- 目标分支必须是 `main`。
- PR 来源必须是本仓库分支，不处理 fork PR。
- PR 不能是 Draft。
- `validate` 必须通过。
- auto-merge 必须由本机已登录的 GitHub CLI 以用户身份启用。
- 条件满足后自动 squash merge，并删除分支。
- 仓库允许更新 PR 分支，减少因 `main` 变化导致自动合并卡住的概率。

启用命令：

```powershell
gh pr merge <PR 编号或 URL> --auto --squash --delete-branch
```

如果 PR 尚未准备好进入 `main`，保持 Draft。

## 适用边界

适用于 `nexgaios-skills` 的同仓库 PR，尤其适用于合并后需要触发 `release-skills.yml` 的 skill 发布变更。

不适用于外部 fork PR，也不适用于 Draft PR。不适用于用 GitHub Actions `GITHUB_TOKEN` 直接合并 PR 的做法。

## 验证记录

- 日期：2026-06-17
- 验证命令：`gh api repos/terryxming/nexgaios-skills --jq '{allow_auto_merge,delete_branch_on_merge,allow_update_branch}'`
- 结果：仓库允许 auto-merge，允许更新 PR 分支，并在合并后删除分支。
- 复盘记录：PR #12 曾由 GitHub Actions 启用 auto-merge 并合并，合并成功但没有触发 `main` 的 `release-skills.yml` push workflow。因此改为由本机 GitHub CLI 以用户身份启用 auto-merge。
