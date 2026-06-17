---
title: "skill:new 只证明骨架正确，不证明业务能力正确"
date: 2026-06-17
domain: skill-governance
tags: "skill:new, validation, boundary, business capability, forward-test"
status: active
---

# skill:new 只证明骨架正确，不证明业务能力正确

## 触发场景

新建 skill 后，需要判断“自动化到底帮我完成了什么，以及如何证明完成正确”。

## 症状

容易把 `pnpm skill:new`、`pnpm skill:validate` 的通过结果误解为“skill 已经可用”。

## 根因

`skill:new` 只生成标准目录和协议文件。

`skill:validate` 只检查基础结构，例如：

- `skill.yaml` 必填字段。
- SemVer 版本号。
- skill 目录位置。
- `entry` 指向的入口文件存在。

这些检查不覆盖真实用户触发、业务流程、脚本行为、输出质量和发布治理效果。

## 解法

结论必须分开写：

```text
骨架创建正确：可以由 skill:new 和 skill:validate 证明。
业务能力正确：必须由该 skill 自己的测试证明。
```

业务能力至少需要按需补充：

- 脚本测试。
- 真实 prompt 测试。
- 误触发测试。
- 输出契约测试。
- forward-test。

## 适用边界

适用于所有新建或迁移进 `nexgaios-skills` 的 skill。

## 验证记录

- 日期：2026-06-17
- 验证命令：`pnpm skill:validate skill-doctor`、`python skills\skill-governance\skill-doctor\scripts\inspect_skill.py ...`
- 结果：`skill-doctor` 的结构和协议通过；真实 prompt 测试仍需单独记录。
