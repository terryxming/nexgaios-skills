---
title: "Skill Impact Hard Gate"
date: 2026-06-23
domain: "skill-governance"
tags: "impact, ci, skill, dependency-graph, hard-gate"
status: active
---

# Skill Impact Hard Gate

## 触发场景

维护 Codex skill 时，发现修改一个文件后经常忘记同步检查关联的 reference、测试、样本、版本、CHANGELOG 或项目母文档。

尤其适用于：

- 想把“改 A 要检查 B/C/D”从人工记忆变成 CI 硬闸门。
- 新增 skill 文件后，需要防止无人维护的孤儿文件。
- 需要给“已检查但无需修改”留下机器可读证据。

## 症状

- 只靠 `SKILL.md` 或 README 写维护规则，Agent 仍会漏检查相关文件。
- 手写 `when_changed: SKILL.md -> must_review: [...]` 清单容易自以为穷尽，实际漏掉动态新增文件。
- 强制所有关联文件都必须修改又太僵硬，因为有些 witness 检查后确实无需变更。

## 根因

- 这是文件级语义依赖，不是普通代码 import 或包依赖；现成 Nx、Bazel、Pants、dependency-cruiser 只能借鉴思想，不能直接覆盖 skill 规则、reference 路由、测试契约和样本资产。
- “硬自动化”不能只提示，还必须要求可检查证据：要么 witness 文件同步修改，要么提供机器可读审查回执。
- 新文件如果没有进入自动引用图或显式契约组，依赖图会从第一天开始失真。

## 解法

1. 给试点 skill 增加 `impact.yaml`，按契约组声明 `sources` 和 `witnesses`。
2. 增加 `tools/skills/impact-graph.mjs`，动态读取 git changed files、skill 文件列表、Markdown 本地路径引用和 `impact.yaml`。
3. 在 `skill-cli.mjs` 中接入 `impact` 命令，并在 `package.json` 暴露：

   ```powershell
   pnpm skill:impact <skill-id> --strict
   pnpm skills:impact --base origin/main...HEAD --strict
   ```

4. 在 PR workflow 中加入 `pnpm skills:impact --base "origin/${{ github.base_ref }}...HEAD" --strict`。
5. 关联 witness 确认无需修改时，在 `docs/impact-reviews/<skill-id>/` 新增审查回执；`deferred` 不通过 strict。
6. 生成用户可读关系图谱：`pnpm skill:impact <skill-id> --visualize --format all`，默认输出 Markdown/Mermaid、Obsidian Canvas 和 JSON 到对应 skill 的 `impact/graph.*`；如需仓库级集中导出，再显式追加 `--output docs/impact-graphs`。
7. 对首个试点 `obsidian-knowledge-curator` 增加实时控制台：

   ```powershell
   pnpm skill:impact:watch obsidian-knowledge-curator
   ```

   控制台前端资产放在 skill 自身的 `impact/` 目录，通过本地 HTTP server + SSE 展示当前变更、契约链路、断裂引用、孤儿文件和待处理 witness。
8. 用户确认该控制台应作为真正的前端产品，而不是离线静态图；0.4.5 起允许在线加载固定版本 Cytoscape.js，并要求拖动画布、滚轮缩放、拖拽节点、点击聚焦邻居、搜索、筛选和重布局。

## 适用边界

- 适用于 skill 文档、reference、测试、样本、版本、CHANGELOG、项目母文档之间的语义依赖治理。
- 不适合作为通用代码调用图替代品；代码函数调用关系仍应使用语言工具、tree-sitter、Bazel/Pants/Nx 或专门的代码图谱工具。
- 初期不要强制所有既有 skill 立刻接入；先用一个试点跑通，再把模板和迁移规则推广。

## 验证记录

- 日期：2026-06-23
- 验证命令：`pnpm skill:impact obsidian-knowledge-curator --strict`
- 验证命令：`pnpm skill:validate obsidian-knowledge-curator`
- 验证命令：`pnpm skills:impact --strict`
- 验证命令：`pnpm skills:docs:check`
- 验证命令：`pnpm skills:guard`
- 验证命令：`pnpm skills:validate`
- 验证命令：`pnpm skill:impact obsidian-knowledge-curator --visualize --format all`
- 验证命令：`pnpm skill:impact:watch obsidian-knowledge-curator`，并通过 `/api/state` 和浏览器 DOM 几何检查确认 30 个节点、131 条边正常渲染。
- 验证命令：浏览器检查 Cytoscape 实例、pan/zoom/drag 开关、节点点击高亮和筛选控件。
- 结果：OKC impact 契约通过；模拟仅修改 `SKILL.md` 且无 witness/回执时返回 3 个失败，证明 hard gate 会阻断遗漏。
