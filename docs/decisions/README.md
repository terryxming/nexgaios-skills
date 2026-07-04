# 决策记录（ADR）

本目录记录**难逆转的决策**——平台兼容策略、架构形状、发布机制等。目的:另一台机器上的 agent(或未来的自己)不必重新调研或凭记忆瞎猜,直接读这里。

## 约定

- 文件名:`NNNN-简短标题.md`,四位序号递增。
- 每篇必含:**状态、背景、决策、证据(附来源 URL)、影响、存疑/待验证**。
- 涉及 Codex 等非 Claude 平台的事实,**必须附官方来源**;存疑项显式标注待实机验证,不凭记忆断言。
- 决策变更不删旧篇,新开一篇并在旧篇标注"被 NNNN 取代"。

## 模板

```markdown
# NNNN. 标题

- 状态:提议 / 已接受 / 被 NNNN 取代
- 日期:YYYY-MM-DD
- 决策人:

## 背景
（为什么需要这个决策，约束是什么）

## 决策
（定了什么）

## 证据
（关键事实 + 来源 URL；区分"已证实"与"推断"）

## 影响
（对仓库结构/流程的影响）

## 存疑 / 待验证
（尚未确证、需实机验证的点）
```

## 索引

- [0001 平台兼容与单一事实源](0001-platform-compat-single-source.md)
- [0002 工程纪律常驻上下文](0002-discipline-always-in-context.md)（落地方式已被 0003 取代）
- [0003 工程纪律：双份文件 + 漂移校验](0003-discipline-dual-file-drift-check.md)
- [0004 纪律硬/软分界：门禁二值化 + 桶三人在环 + 评测发布](0004-discipline-hard-soft-gates.md)（决策四之自建评测路线被 0005 修正）
- [0005 评测与创作委托官方 skill-creator，仓库不自建](0005-delegate-to-skill-creator.md)（决策 3 被 0006 精化）
- [0006 skill 源域与分发物分层：开发文件域内聚合、分发时排除](0006-skill-domain-vs-distribution.md)
- [0007 分发与开源架构：双仓晋升制](0007-dual-repo-promotion.md)（被 0008 取代）
- [0008 单仓公开制：仓库即分发，skill 为发布单元](0008-single-public-repo.md)
- [0009 单一交接文档 + 经验台账 + C2/G④ 机械门禁](0009-single-handoff-and-lessons.md)
- [0010 skills 目录二分：first-party 与 third-party](0010-third-party-skills-directory.md)
- [0011 问答为基底、信号/噪音分离（ob-notes 架构翻转）](0011-dialogue-first-signal-noise.md)
