# Skill Doctor

## 用途

`skill-doctor` 是一个中文优先的 Codex skill 质量诊断与发布治理 skill。它帮助维护者从三个维度挑刺指定 skill：

- 资深 AI 产品经理：判断定位、触发、边界、用户价值和成功标准。
- 生产端：判断 SKILL.md、references、scripts、assets、测试和上下文成本是否可维护。
- 消费端：判断真实用户是否能顺利触发、理解、信任并使用输出。

它也提供 release mode，用于检查版本冻结、CHANGELOG、可追溯、可回滚、可测试和可复盘。

## 使用方式

```text
使用 $skill-doctor 审计 skills/skill-governance/skill-doctor
使用 $skill-doctor 检查这个 skill 是否可以发布 v0.2.0
使用 $skill-doctor 对比 releases/skill-x/v0.1.0 和 releases/skill-x/v0.2.0
```

## 目录说明

```text
SKILL.md          skill 入口说明
skill.yaml        monorepo 管理协议
references/       任务相关参考资料
scripts/          可执行脚本
assets/           可复用资产
tests/            测试样例和夹具
CHANGELOG.md      版本变更记录
```

## 开发命令

```powershell
pnpm skill:validate skill-doctor
python skills/skill-governance/skill-doctor/scripts/inspect_skill.py skills/skill-governance/skill-doctor
python skills/skill-governance/skill-doctor/scripts/compare_versions.py <old-skill-dir> <new-skill-dir>
pnpm skill:install skill-doctor
pnpm skill:package skill-doctor --print-path
```
