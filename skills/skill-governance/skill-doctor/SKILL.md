---
name: skill-doctor
description: 中文化的 Codex skill 质量诊断与发布治理 skill。用于用户要求审计、挑刺、体检、复盘、改造、发布检查、版本治理或回滚某个 Codex skill、skill 文件夹、SKILL.md、CHANGELOG.md 或候选发布版本时；默认从资深 AI 产品经理、生产端、消费端三个视角输出问题证据、风险优先级和修复方案，并在 release mode 检查已发布版本冻结、CHANGELOG、可追溯、可回滚、可测试和可复盘。
---

# Skill Doctor

Skill Doctor 用于诊断 Codex skill 的产品价值、构建质量、真实使用体验和发布治理风险。默认用中文工作，除非用户明确要求英文，或目标文件、API、命令、错误信息必须保留英文。

## 工作模式

先判断用户目标属于哪种模式：

- **audit mode**：用户要审计、挑刺、诊断、改造、复盘某个 skill。重点是找问题、给证据、排优先级、给修法。
- **release mode**：用户要检查某个 skill 是否可以发布、升级、回滚、冻结或补版本记录。重点是生命周期门禁和发布风险。

## 输入条件

优先从上下文和仓库中自行确认，不要过早打断用户。只有目标 skill 无法定位、审计范围会影响多个版本、或用户要求写入但发布状态不清楚时，才询问用户。

最小输入是以下任一种：

1. skill 文件夹路径。
2. `SKILL.md`、`skill.yaml`、`CHANGELOG.md` 或 references/scripts 的文件路径。
3. 一段 skill 草案文本。
4. 两个版本目录或两个 git ref，用于版本对比。

## 工作流程

1. 定位目标 skill，读取根目录结构、`skill.yaml`、`SKILL.md`、`CHANGELOG.md`、`agents/openai.yaml`，再按需读取 `references/`、`scripts/`、`assets/`、`tests/`。
2. 判断当前任务是 audit mode、release mode，还是两者都需要。
3. audit mode 必须从三个视角诊断：资深 AI 产品经理、生产端、消费端。读取 `references/audit-rubric.md`。
4. release mode 必须检查版本冻结、CHANGELOG、状态流转、测试、回滚和复盘。读取 `references/lifecycle-policy.md`。
5. 需要稳定报告时读取 `references/report-format.md`，按 P0/P1/P2 输出问题。每个问题必须包含证据、用户后果和修复建议。
6. 需要设计或验证测试时读取 `references/test-matrix.md`。复杂变更优先 forward-test，且不要把预期答案泄漏给测试代理。
7. 如果用户只要求诊断，禁止修改目标 skill。若用户明确要求修复，先说明会改哪些文件，再进行最小必要改动。
8. 验证可用命令，例如仓库内 `pnpm skill:validate <skill-id>`、`python scripts/inspect_skill.py <skill-dir>`，并在最终回复中说明验证结果和未覆盖边界。

## 诊断原则

- 证据优先：不要只说“可能有问题”，必须指向文件、片段、缺失项、行为后果或测试缺口。
- 真实使用优先：评估用户自然语言是否能触发，第一次使用是否顺畅，模糊输入时是否会问对问题。
- 版本治理优先：已发布版本必须冻结；任何后续修改都通过新版本承载。
- 中文优先：报告、阶段说明、CHANGELOG、复盘和建议默认中文化。
- 少即是多：不要把所有 reference 全部加载进上下文；按任务读取。

## 引用资料

- `references/audit-rubric.md`：audit mode 的三视角问题清单、优先级规则和证据标准。
- `references/lifecycle-policy.md`：release mode 的版本冻结、CHANGELOG、状态流转、回滚和复盘规则。
- `references/report-format.md`：诊断报告、发布门禁报告和复盘输出模板。
- `references/test-matrix.md`：触发测试、误触发测试、真实 prompt 测试、输出契约测试和 forward-test 设计。

## 可用脚本

- `scripts/inspect_skill.py <skill-dir>`：做结构、frontmatter、版本和 CHANGELOG 体检。发布前优先运行。
- `scripts/compare_versions.py <old-dir> <new-dir>`：对比两个 skill 版本目录的文件增删改，用于发布复盘和回滚判断。
