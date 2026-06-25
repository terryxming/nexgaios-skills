---
title: "Impact Directory Reference Broken"
date: 2026-06-23
domain: "skill-governance"
tags: "impact, markdown, reference"
status: active
---

# Impact Directory Reference Broken

## 触发场景

在启用 `impact.yaml` 的 skill 文档中记录构建产物或资产路径，尤其是写到 `impact/assets/`、`assets/` 这类目录路径时。

## 症状

- `pnpm skill:impact <skill-id> --strict` 失败。
- 失败原因类似：`引用的本 skill 文件不存在：impact/assets/`。
- 实际目录和文件都存在，但 impact 引用图只按文件节点判断，目录路径被当成缺失文件。

## 根因

- impact 引擎会从 Markdown/YAML 文本中提取形如 `impact/...`、`assets/...` 的本地路径引用。
- 当前引用图的存在性检查以 skill 内文件清单为准，不把目录本身视为可引用节点。
- 因此文档里写目录路径并带尾部斜杠时，会被解析成一个本 skill 引用，但无法在文件清单中找到对应文件。

## 解法

1. 不在长期文档中用裸目录路径作为 impact 可解析引用。
2. 改成具体文件路径，例如把 `impact/assets/` 改成 `impact/assets/console.js` 和 `impact/assets/console.css`。
3. 如果确实要说明目录概念，避开可解析路径形态，或在 impact 引擎中显式支持目录节点后再使用。
4. 重新运行：

   ```powershell
   pnpm skill:impact <skill-id> --strict
   ```

## 适用边界

- 适用于本仓库 `tools/skills/impact-graph.mjs` 当前的 Markdown/YAML 本地引用解析规则。
- 不适用于普通 Markdown 阅读语义；这是 impact strict gate 的机器解析边界。
- 若未来 impact 引擎支持目录节点或目录引用白名单，本经验需要更新。

## 验证记录

- 日期：2026-06-23
- 验证命令：`pnpm skill:impact obsidian-knowledge-curator --strict`
- 结果：把 `impact/assets/` 改为 `impact/assets/console.js` 和 `impact/assets/console.css` 后，strict impact 检查通过。
