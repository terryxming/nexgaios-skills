# 更新日志

所有重要变更都记录在此文件中。时间线倒叙，最新版本放在最前；每个版本从 `v0.1.0` 开始记录，并随发布物冻结。

## v0.1.0 - 2026-06-17

### 新增

- 建立 `skill-doctor` 中文化 skill 的基础能力边界。
- 支持 audit mode：从资深 AI 产品经理、生产端、消费端三个视角诊断 skill。
- 支持 release mode：检查版本冻结、CHANGELOG、可追溯、可回滚、可测试和可复盘。
- 新增 `references/audit-rubric.md`、`references/lifecycle-policy.md`、`references/report-format.md`、`references/test-matrix.md`。
- 新增 `scripts/inspect_skill.py`，用于结构、frontmatter、版本和 CHANGELOG 体检。
- 新增 `scripts/compare_versions.py`，用于两个 skill 版本目录的文件差异对比。

### 变更

- 无，首个版本。

### 修复

- 无，首个版本。

### 移除

- 无，首个版本。

### 测试

- 配置 `skill.yaml` 验证命令：`python scripts/inspect_skill.py . --fail-on-error --quiet`。
- 设计首批触发测试、误触发测试、真实 prompt 测试和发布门禁测试。

### 生命周期

- 状态：active。
- 发布状态：候选首发版本。
- 冻结要求：合并发布后，`v0.1.0` 作为已发布版本不得原地修改；后续变更必须进入新版本。
- 回滚目标：无，首个版本。
