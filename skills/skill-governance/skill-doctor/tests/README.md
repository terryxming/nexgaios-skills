# 测试

本目录用于存放 `skill-doctor` 的测试样例、夹具和验收记录。

## 首批测试矩阵

### Audit mode

- `使用 $skill-doctor 审计 skills/skill-governance/skill-doctor`
- `帮我挑刺这个 SKILL.md，看看真实用户会不会用不起来`
- `从产品经理、生产端、消费端三个视角诊断这个 skill`

### Release mode

- `使用 $skill-doctor 检查 skill-doctor 是否可以发布 v0.2.0`
- `检查这个 skill 的 CHANGELOG 和版本冻结是否合格`
- `对比 v0.1.0 和 v0.2.0，告诉我能不能回滚`

### 误触发边界

- `帮我写一份普通 README`
- `解释一下什么是 Codex skill`
- `把这个 Python 脚本重构一下`

## 自动验证

```powershell
pnpm skill:validate skill-doctor
python scripts/inspect_skill.py . --fail-on-error
python scripts/compare_versions.py . .
```

维护要求：

- 测试数据必须脱敏。
- 不提交真实 token、用户隐私数据或平台导出原始数据。
- 如果测试需要大文件，改用生成脚本或外部说明，不直接提交大文件。
