---
title: "PR 自动合并必须以 validate 通过为前置条件"
date: 2026-06-17
domain: workflow
tags: "pr, ci, auto-merge, validate, github-actions"
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

Draft PR 是暂停开关。Draft 不会自动合并。

## 解法

仓库规则：

- 目标分支必须是 `main`。
- PR 来源必须是本仓库分支，不处理 fork PR。
- PR 不能是 Draft。
- `validate` 必须通过。
- 条件满足后自动 squash merge，并删除分支。
- 仓库允许更新 PR 分支，减少因 `main` 变化导致自动合并卡住的概率。

如果 PR 尚未准备好进入 `main`，保持 Draft。

## 适用边界

适用于 `nexgaios-skills` 的同仓库 PR。

不适用于外部 fork PR，也不适用于 Draft PR。

## 验证记录

- 日期：2026-06-17
- 验证命令：`gh api repos/terryxming/nexgaios-skills --jq '{allow_auto_merge,delete_branch_on_merge,allow_update_branch}'`
- 结果：仓库允许 auto-merge，允许更新 PR 分支，并在合并后删除分支。
