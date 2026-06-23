---
title: "首次拉仓库时先做环境检查而不是自动安装"
date: 2026-06-20
domain: "repo"
tags: "env, setup, pnpm, corepack, approval"
status: active
---

# 首次拉仓库时先做环境检查而不是自动安装

## 触发场景

首次 clone `nexgaios-skills`、换电脑继续工作，或发现 `pnpm`、`node`、`python`、`git` 等基础命令不可用。

## 症状

- 直接运行 `pnpm ...` 报 `pnpm` 不在 PATH。
- 在普通权限 PowerShell 中运行 `corepack enable` 可能报 `EPERM: operation not permitted, open 'C:\Program Files\nodejs\yarn.CMD'`。
- 仓库其实可以通过 `node tools/skills/skill-cli.mjs ...` 运行部分命令，但标准工作流还没准备好。
- 容易把“发现缺依赖”误处理成“直接帮用户安装或启用工具”。

## 根因

仓库首次拉取后，当前机器状态可能缺少工具入口或工作区依赖，例如 `pnpm` shim 未启用、`node_modules` 尚未安装、GitHub CLI 未在 PATH 中。

这些属于本机环境状态，不是仓库源码状态。Codex 不应该在未获用户批准时自动安装、启用或修改工具。

Windows 上的 `corepack enable` 可能需要写入 Node.js 安装目录。普通权限无法写入 `C:\Program Files\nodejs` 时，直接启用全局 shim 会失败，但 `corepack pnpm ...` 仍可作为无管理员权限 fallback 使用。

## 解法

1. 先运行环境检查：

   ```powershell
   node tools/skills/skill-cli.mjs env-check
   ```

2. 如果 `node` 本身不可用，在 Windows 下运行：

   ```powershell
   .\skill.ps1 env-check
   ```

3. 把缺失项和建议命令报告给用户，等待明确批准。
4. 只有用户批准后，才执行修复命令，例如：

   ```powershell
   corepack prepare pnpm@11.7.0 --activate
   corepack pnpm install --frozen-lockfile
   ```

5. 如果用户明确要求 `pnpm` 直接命令可用，再提示需要管理员权限运行 `corepack enable` 或采用其他用户级安装方式。

## 适用边界

适用于 `nexgaios-skills` 的首次环境准备、跨电脑续工和本机 PATH 异常。

不适用于 skill 业务运行时依赖的外部系统检查；那些应该由具体 skill 的验证流程单独判断。

## 验证记录

- 日期：2026-06-20
- 验证命令：`node tools/skills/skill-cli.mjs env-check`、`.\skill.ps1 env-check`、`node tools/skills/skill-cli.mjs validate --all`、`node tools/skills/skill-cli.mjs docs --check`、`node tools/skills/skill-cli.mjs guard`
- 结果：环境检查正确报告 `pnpm` 命令入口状态和 `node_modules` 安装状态；命令只报告建议操作，不自动安装；无管理员权限时可使用 `corepack pnpm` 继续工作；既有 skill 验证、文档检查和防误传检查通过。
