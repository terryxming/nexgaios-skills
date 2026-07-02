# Obsidian / Markdown 版式模式

版式服务信息结构。不要为了显得丰富而堆语法。

## Frontmatter

默认使用最小轻量字段，除非用户提供 vault 模板或明确确认更多字段。

```yaml
---
title:
type:
status: draft
created:
tags: []
freeze_id:
---
```

字段建议：

| 字段 | 用途 |
| --- | --- |
| `title` | 笔记标题。 |
| `type` | `pitfall`、`decision`、`review`、`concept`、`idea`、`discussion`、`preference`、`handoff`。 |
| `status` | `draft`、`reviewed`、`validated`、`deprecated`、`archived`。 |
| `freeze_id` | 用户确认前的预览版本编号，格式为 `OKC-YYYYMMDD-[开放式生成的主题]-NN`。 |

不要无依据地套用某个特定 vault 的复杂字段。来源、可信边界、作者、链接等信息优先放在正文结构中；只有用户确认需要查询字段时，才提升到 frontmatter。

## Callout

Callout 职责、类型选择、视觉边界和反例，以 `obsidian-visual-patterns.md` 为准。本文件只保留最小 Markdown 语法示例。

推荐用途：

```markdown
> [!summary] 30 秒读法
> ...

> [!decision] 决策
> ...

> [!warning] 风险边界
> ...
```

限制：

- 一篇短笔记 1-3 个 callout 足够。
- 不要把所有段落都包进 callout。
- callout 内避免长表格。
- 不要把“提示块使用规则”“CSS 规则”“Agent 执行说明”写进用户母文档；具体边界见 `obsidian-visual-patterns.md`。

## 表格

适合表达：

- 方案对比。
- 状态清单。
- 决策理由。
- 未闭环事项。
- 证据到结论的映射。

不适合：

- 长段落正文。
- 时间线中的每个细枝末节。
- 只为了对齐而做的两列表格。

## Checklist

用于未来动作，不用于伪装总结。

```markdown
## 下次遇到类似情况

- [ ] 先确认触发条件是否相同。
- [ ] 复核关键路径或文件是否存在。
- [ ] 查找是否已有更新版本替代本记录。
```

## 网页链接元数据

网页链接沉淀必须在正文开头使用引用语法放置元数据。只允许这些字段：

```markdown
> [!info] 网页链接元数据
> **原文链接**：
> **原文标题**：
> **作者**：
> **原文发布日期**：
> **笔记日期**：
```

字段能识别则真实填写；不能识别写“不适用”。不要自行添加其他未经用户确认的字段。

## Wikilink 与标签

raw 阶段默认不添加 `相关` 模块和 wikilink。只有用户明确要求、或当前任务是 wiki 编译/关系整理时，才使用 wikilink 连接稳定对象：

```markdown
派生关系：[[稳定主题页]]
```

标签用于检索，不用于替代正文分类：

```markdown
tags:
  - knowledge-management
  - decision
  - obsidian
```

标签保持少量、稳定、可复用。不要把整句话做成标签。

## Dataview 友好字段

可以在正文放轻量字段，方便未来查询，但不要要求用户安装插件，也不要把未确认字段默认塞进笔记。

```markdown
## 元信息

| 字段 | 值 |
| --- | --- |
| type | decision |
| status | draft |
| freeze_id | OKC-20260622-[TOPIC]-01 |
```

如果用户明确使用 Dataview 或提供 vault 字段约定，可在 frontmatter 增加对应字段；否则保持 Markdown 可读优先。

## 通用笔记骨架

用于踩坑、决策、复盘、想法、讨论、偏好、交接和普通项目记录。不要默认加入网页链接元数据或原文结构覆盖表。

```markdown
# 标题

> [!summary] 30 秒读法
> - 这是什么：
> - 为什么值得留下：
> - 下次怎么用：
> - 可信边界：

## 核心结论

## 关键依据

## 适用边界

## 下次怎么用
```

## 网页/长文/报告骨架

只有输入材料是网页、长文、报告或外部资料沉淀时，才使用这个骨架。若用户明确要求“只要摘要”，仍需说明原文主干被省略的范围和理由。

```markdown
# 标题

> [!info] 网页链接元数据
> ...

> [!summary] 30 秒读法
> - 这是什么：
> - 为什么值得留下：
> - 下次怎么用：
> - 可信度：

## 原文结构覆盖

| 原文部分 | 处理方式 | 原因 |
| --- | --- | --- |
|  | 保留 / 压缩 / 拆分 / 省略 |  |

## 核心内容

## 证据与来源

## 适用边界

## 下次怎么用
```
