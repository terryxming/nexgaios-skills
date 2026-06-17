# Test Matrix

用本文件设计 skill 审计和发布前测试。

## 测试类型

| 类型 | 目的 | 最低要求 |
|---|---|---|
| 结构测试 | 确认 skill 文件和协议完整 | `skill.yaml`、`SKILL.md`、`CHANGELOG.md` 存在且版本一致 |
| 触发测试 | 确认自然语言能触发 | 至少 3 个真实用户 prompt |
| 误触发测试 | 确认边界清楚 | 至少 2 个不应触发的 prompt |
| 输出契约测试 | 确认报告稳定可用 | 包含结论、证据、优先级、修复建议 |
| 生命周期测试 | 确认可发布、可回滚 | 检查 CHANGELOG、版本号、冻结状态、回滚目标 |
| forward-test | 独立验证真实使用效果 | 非 patch 版本优先执行 |

## 推荐测试 prompt

Audit mode：

- `使用 $skill-doctor 审计 skills/skill-governance/skill-doctor`
- `帮我挑刺这个 SKILL.md，看看真实用户会不会用不起来`
- `从产品经理、生产端、消费端三个视角诊断这个 skill`

Release mode：

- `使用 $skill-doctor 检查 skill-doctor 是否可以发布 v0.2.0`
- `检查这个 skill 的 CHANGELOG 和版本冻结是否合格`
- `对比 v0.1.0 和 v0.2.0，告诉我能不能回滚`

误触发：

- `帮我写一份普通 README`
- `解释一下什么是 Codex skill`
- `把这个 Python 脚本重构一下`

## Forward-test 规则

需要 forward-test 时，把目标 skill 和真实任务交给独立上下文，不泄漏诊断结论、预期答案或修复方向。

推荐提示形式：

```text
Use $skill-doctor at <skill-path> to audit <target-skill-path>.
```

不要写成：

```text
请测试 skill-doctor 是否能发现我认为的这些问题：...
```

## 发布前最小测试清单

- 运行仓库验证命令。
- 运行 `scripts/inspect_skill.py <skill-dir>`。
- 检查 `CHANGELOG.md` 最新版本在最前。
- 用 3 个 audit prompt 和 2 个 release prompt 人工检查输出形态。
- 若改动触发描述或输出契约，补做误触发测试。
