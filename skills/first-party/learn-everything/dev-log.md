---
title: learn-everything 开发日志
date: 2026-07-06
updated: 2026-07-06
source: Claude Code
tags: [状态/持续]
---

# learn-everything 开发日志

> [!note] 交接说明
> 本文件是 learn-everything 这个 skill 自身的维护日志（面向维护者），记设计意图、关键决策、踩坑与进展。它随 skill 入库并一同分发（ADR-0006），不写用户对外版本叙事——那在 `CHANGELOG.md`。

## 项目意图

把一段视频（`如何用 Claude 以 10 倍速度学习任何东西.txt`）总结的六种学习法，组合成一套"系统学会任何主题"的导师式 skill，支撑维护者本人正在学的技术主题（如何像专家一样驾驭 agent、彻底搞懂 LLM、harness 是什么等）。

六法本质是一套闭环学习系统（路径 → 测试 → 压缩 → 筛选 → 反馈），不是六个孤立技巧：学习阶梯、20% 帕累托、AI 考官、一页速查表、资源筛选、费曼讲解。

## 架构与关键决策（只追加）

| 日期 | 决策 | 理由 | 否决的备选 |
| --- | --- | --- | --- |
| 2026-07-06 | 产物落盘**交给 ob-notes**，本 skill 不自己写盘 | 职责单一（MECE）；ob-notes 已实现 Obsidian 落点校验/frontmatter/tag 全套，重复造轮子既冗余又会漂移 | ①纯对话不落盘（跨会话不留痕）；②自带进度文件（要自管状态与落点，与 ob-notes 职责重叠） |
| 2026-07-06 | 触发**保守**：只认明确学习意图，一次性"X 是什么"不触发 | 守住仓库零误触发红线（A5/G·2）；快速求解释与"想真正学会"是两件事，误触发会让人烦 | 激进·学习语境全接管（误触发风险高、负例难守零） |
| 2026-07-06 | **编排导师为主 + 工具箱兜底** | 最贴"10 倍速学习系统"原意（主动串联而非散点）；同时不挡用户点名单法的轻量用法 | 纯工具箱（少了系统感，退化成六个 prompt 的菜单） |
| 2026-07-06 | 六法按**三阶段**分组进 3 个 reference（建图/精进/固化），非一法一文件也非单一大 catalog | 三阶段就是 SKILL.md 的编排骨架，reference 切分与之同构、按需加载清晰；一法一文件太碎（6 个小文件），单一 catalog 又过长 | ①一法一 reference；②单个 methods.md 大清单 |
| 2026-07-06 | frontmatter 只留 name + metadata.version，**不加** provides/depends_on | 那是 ob-notes 依赖图（build_depmap.py）专用机械；此处六法相对独立、无依赖图治理，加了会误示存在一套不存在的机械 | 照抄 ob-notes 的 provides/depends_on 声明 |
| 2026-07-06 | 不建 repo 级 ADR，跨 skill 落盘边界记进本 dev-log | 单 skill 内部设计选择，非流水线级难逆转决策；ADR 留给仓库结构/门禁级决定 | 为 learn-everything↔ob-notes 边界单开一篇 ADR |

## 当前状态 / 下一步（覆盖更新）

- **现状**：v0.1.0 骨架落地——SKILL.md + 三个 reference + 双 evals + CHANGELOG/dev-log 齐全，在分支 `learn-everything-skill`（off main）。
- **下一步**：① 跑 `python tools/lint.py` 确认 10 道门禁全绿；② evals 用例经用户过目确认（F 纪律）后，委托 skill-creator 跑触发率 + 执行对照；③ 拿真实主题 dogfood 一轮；④ 达标后 merge main 打 tag `learn-everything/v0.1.0`。
- **卡点**：无。
- **续做提示**：评测执行达标（G·2）与实际教学效果均为 `[试行待验证]`，未 dogfood 前不发布。
- **已解决**：三个设计取舍已与用户敲定（见决策表）。

## 进展时间线（只追加，倒序）

- 2026-07-06：初版落地。探索 ob-notes 结构与 tools/lint.py 十道门禁 → 与用户敲定三取舍（落盘交 ob-notes / 保守触发 / 编排为主）→ 写 SKILL.md + mapping/practice/cheatsheet 三 reference + trigger-queries(12+11)/evals(4) + CHANGELOG/dev-log。

## 踩坑记录（只追加）

- 2026-07-06 探索阶段：subagent 曾报"skill 放 domain 子目录（如 skills/knowledge-management/）"，核对 `tools/lint.py` 的 `check_layout` 后确认是幻觉——skills/ 一级只允许 first-party/third-party，skill 一律扁平在 `skills/first-party/<name>/`。已按此落地。
