---
name: new-skill
description: 脚手架 skill：在本仓库为一个新 skill 生成结构合规的骨架（skills/<name>/ 下的 SKILL.md、CHANGELOG.md、evals/trigger.yaml、evals/execution.yaml），并指挥作者把模板填成可发布的 skill。当用户要在本仓库“新建/创建/从零搭一个 skill”时使用；修改已有 skill、或与本仓库 skill 无关的通用代码生成，不用它。
metadata:
  version: 0.1.0
---

# new-skill

本仓库 skill 生产流水线的**入口脚手架**。它把“新建一个 skill”这件事标准化为：确定性生成骨架（脚本）+ 作者填充语义（agent 指挥）。产出结构见纪律 §E 与 ADR-0004。

## 何时触发 / 何时不触发

- **触发**：用户要在**本仓库**新建 / 创建 / 从零搭一个 skill；或说“加一条流水线 skill”“scaffold 一个 skill”。
- **不触发**：
  - 修改 / 优化**已有** skill（那是直接改其 `SKILL.md` 与 `evals/`，不走脚手架）。
  - 与本仓库 skill 体系无关的通用代码 / 文件生成（写个普通脚本、函数、配置）。
  - 询问 skill 概念、规范、评测机制等**只需回答**、不需落盘的场景。

## 步骤

1. **定名**：和用户确认 skill 名（英文 kebab-case，将等于父目录名）。名不合规先纠正。
2. **生成骨架**：运行 `python skills/new-skill/scripts/scaffold.py <name>`，得到 `skills/<name>/` 骨架。
3. **填 description**：用**第三人称**写清三件事——这个 skill 是干嘛的、何时用、何时不用（桶三质量关）。术语中文为主，专业词保留英文加中文注释。
4. **填正文**：写清触发 / 不触发边界与执行步骤；正文过长时拆 `references/`。
5. **填 evals**：把 `evals/trigger.yaml`（正/负例，负例误触发须为 0）与 `evals/execution.yaml`（场景 + 确定性检查 + rubric）从 TODO 填成真实用例。
6. **验证**：跑 `python tools/lint.py`（过 W2 桶一/桶二三门禁）；再按纪律 F 跑评测。全绿方可进入发布门禁（纪律 §G）。

## 备注

- 脚手架**不预造**空的 `references/`、`scripts/`、`assets/` 或 Codex sidecar `agents/openai.yaml`——按需再加（§3 简单性）。
- `metadata.version` 从 `0.1.0` 起步，按 skill 独立 bump（纪律 §G③）。
