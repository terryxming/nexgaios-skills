# 0005. 评测与创作引擎委托官方 skill-creator，仓库不自建

- 状态:已接受（修正 [ADR-0004](0004-discipline-hard-soft-gates.md) 决策四的自建 F runner 路线，并废弃 new-skill）
- 日期:2026-07-03
- 决策人:terry（公司电脑）+ Claude


## 背景

执行 W3（F 评测 runner）前，用户提出两个问题：①Claude 与 Codex **都内置了 skill-creator**，为何要自己造 new-skill 和评测 runner？②评测用例必须显式给用户过目，否则用户不知道用例是否贴近真实场景。

按 纪律 A「没有调查就没有发言权」实读两端内置 skill-creator 的 SKILL.md 后证实：**本仓库正在重复造轮子**。官方 skill-creator 已覆盖创作脚手架、触发评测、执行评测（含 no-skill baseline）、grader、benchmark 聚合、结果可视化、description 触发优化的完整闭环——与我们的 new-skill + F runner 设计大面积重叠，且官方版本更完整（用例给用户签字、train/test 防过拟合、viewer 人工复核）。


## 决策

1. **评测与创作引擎委托官方 skill-creator，不自建**。Claude 侧用内置 `skill-creator`（plugin），Codex 侧用 `~/.codex/skills/.system/skill-creator`（含 `init_skill.py` / `quick_validate.py`）。仓库**不建** F runner、不建脚手架 skill、不自造评测编排。
2. **废弃 new-skill**（含 `scripts/scaffold.py`，提交 `2d4917d`/`6a7578b` 引入）。两方案对比：
   - A 废弃：仓库约定由 **W2 硬门禁（强制）+ 文档指引（引导）** 保证，规则靠门禁不靠脚手架自觉；避免与 skill-creator 的触发竞争（探针实测 new-skill 会抢触发）。
   - B 瘦身成"调 skill-creator + 套约定"的薄包装：仍与官方重复、层级绕、触发打架。
   - **采 A**。
3. **skill 内不放 CHANGELOG.md**：官方 skill-creator 明确将 CHANGELOG.md 列为不该出现在 skill 里的杂物（"Do NOT create extraneous documentation ... CHANGELOG.md"）。版本历史 = **git tag `skill-name/vX.Y.Z`** + frontmatter `metadata.version`（与 G③ 的 CI 参照本就一致，消除双源）。
   > **被 [ADR-0006](0006-skill-domain-vs-distribution.md) 精化（2026-07-03）**：官方杂物约束的对象是**分发物**而非源域——dev-log/CHANGELOG 为域内开发文件，留在 `skills/<name>/`、构建分发时排除；git tag + metadata.version 仍是版本机械参照。
4. **eval 用例格式采用 skill-creator 约定**（`skills/<name>/evals/evals.json` + 触发查询 JSON），复用其 viewer / aggregate_benchmark / run_loop，不自造 YAML 格式（作废 ADR-0004 的 trigger.yaml/execution.yaml 约定）。
5. **评测用例人在环**：任何评测运行前，用例（触发正/负例、执行场景）**必须显式给用户过目确认**——是否贴近真实场景由人判定，不许闷头自测。此为官方 skill-creator 的标准动作（"Here are a few test cases... Do these look right?"），升格为本仓库纪律。
6. **仓库保留的独有价值**（skill-creator 不覆盖）：W2 skill 级硬门禁（skills-ref/可移植/中文化）、工程纪律与 ADR 体系、双平台对等与分发（marketplace + Codex 安装 + sidecar）、中文化约定、发布门禁 G（**消费** skill-creator 的评测结果、按阈值放行，阈值 = 全局底线[负例误触发 = 0、优于 baseline] + 每 skill 可调）。


## 证据（附来源）

1. **Claude 内置 skill-creator 覆盖完整评测闭环**（本机实读 `skills-plugin/.../skill-creator/SKILL.md`）：test prompts 需用户确认；with-skill 与 baseline 子代理同轮 spawn；grader 子代理 + `aggregate_benchmark`（pass_rate、mean±stddev）；eval-viewer 供人工复核；description 优化 `run_loop.py`（20 条正/负查询、每条 3 次采样、60/40 train/test 防过拟合）。
2. **Codex 内置 skill-creator**（本机实读 `~/.codex/skills/.system/skill-creator/SKILL.md`）：`init_skill.py` 脚手架、`quick_validate.py` 校验、`agents/openai.yaml` 生成；**明确禁止 skill 内放 CHANGELOG.md/README.md 等杂物**；含 forward-testing（子代理盲测）方法论。
3. **触发竞争实测**：探针子代理场景中 new-skill 与 skill-creator 同时可见，new-skill 因"本仓库"限定抢得触发——自建脚手架与官方并存会互相干扰。
4. ADR-0004 证据 8–10（触发检测机制、`Skill` 入参字段 = `skill`）仍为**已证实事实**，继续有效；被修正的只是"自建 runner"的实施路线。


## 影响

- 删除 `skills/new-skill/`；`skills/` 回到空（首条真实业务 skill 待来）。
- 纪律双份 F/G/E/速览中 changelog 与自建评测相关表述同步修订（漂移校验须绿）。
- W2 三门禁、CI、`tools/requirements.txt`（skills-ref）**保留不动**。
- W3 从"建 runner"改为"用 skill-creator 跑评测 + G 门禁消费结果"，工作量大幅缩减。


## 存疑 / 待验证

- skill-creator 的 description 优化环节（`run_loop.py`）**经由 `claude -p` 子进程**——本环境已证嵌套 headless 鉴权失败（ADR-0004 证据 8），该环节在本机可能不可用，待实跑验证；主评测循环用会话内子代理，不受影响。
- Codex 侧 skill-creator 的实际运行效果（含 `init_skill.py` 在本仓库目录结构下的适配）待装 Codex 的实机验证。
- 首条真实 skill 落地时，走"skill-creator 创作 + W2 门禁 + G 发布"全流程的磨合问题未知。


## 来源

- 本机 Claude skill-creator：`%APPDATA%/Claude/local-agent-mode-sessions/skills-plugin/.../skills/skill-creator/SKILL.md`（实读全文）
- 本机 Codex skill-creator：`~/.codex/skills/.system/skill-creator/SKILL.md`（实读全文）
- https://agentskills.io/specification （skill 结构规范，无 CHANGELOG 约定）
