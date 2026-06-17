---
title: "{{title}}"
date: {{date}}
skill: "{{skill_id}}"
domain: "{{skill_domain}}"
status: draft
---

# {{title}}

## 交接对象

- Skill：`{{skill_id}}`
- 业务域：`{{skill_domain}}`
- 当前版本：`{{skill_version}}`
- 源码路径：`{{skill_path}}`
- 当前分支：`{{branch}}`
- 当前 commit：`{{commit}}`

## 当前目标

写清楚这次开发或维护要解决什么问题。

## 已完成

- 

## 未完成和下一步

- 

## 当前阻塞或风险

- 无

## 需要继续查看的文件

- `{{skill_path}}/SKILL.md`

## 已运行验证

- 尚未记录。

## 工作区状态

```text
{{worktree_status}}
```

## 下台电脑恢复步骤

```powershell
cd <本机 nexgaios-skills 仓库路径>
git fetch origin
git pull --ff-only
pnpm install --frozen-lockfile
pnpm handoff:list {{skill_id}}
```

继续工作前，先阅读本交接文档，再查看 `{{skill_path}}` 的最新 diff 或后续提交。

## 本机 Codex 安装同步状态

本次交接不代表已经同步到本机 Codex 安装目录。

如果修改过 `skills/<domain>/<skill-id>/`，完成验证后必须显式询问用户是否要同步到本机 Codex 安装目录；只有用户明确同意后，才运行：

```powershell
pnpm skill:install {{skill_id}}
```
