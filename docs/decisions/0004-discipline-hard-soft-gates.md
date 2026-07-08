# 0004. 纪律硬/软分界：门禁二值化、桶三人在环、评测与发布

- 状态:已接受（决策四的自建 F runner 路线与 trigger.yaml/execution.yaml 格式被 [ADR-0005](0005-delegate-to-skill-creator.md) 修正；其余决策与证据继续有效）
- 日期:2026-07-03
- 决策人:terry（公司电脑）+ Claude


## 背景

议题4（纪律硬/软分界）承接 [ADR-0003](0003-discipline-dual-file-drift-check.md) 与 W1 仓库级门禁。W1 已落地"路径 ASCII / ADR 留痕 / 纪律漂移"三项硬门禁，并初步认可"桶三人在环"。本篇把议题4聊完并留痕：确立门禁哲学、E.1 规范合规三分、E.4 中文化修订、F 评测形态、G 发布门禁落点。

聊前对以下外部事实做了联网一手查证（A1 查证优先）：官方 `skills-ref validate` 的实际检查项与运行时、Claude Code 的 skill 激活可观测性。**Codex 侧未做一手查证**（F 已定 Claude-Code-first，见决策四），留 Codex 适配器阶段专项查证。


## 决策


### 一、门禁哲学：消灭"不阻断的 warning"（新增私有纪律 A5）

- 每项检查只有两种归宿：
  - **能机械判定 → 硬门禁**（红/绿，失败即阻断，进 lint/CI）。
  - **判不了但重要 → 桶三人在环**（遇到即停 + 给修复方案 + 等用户确认 + 再执行，阻断式）。
  - 既判不了又不值得停 → 不检查。
- **禁止"warning 但放行"的中间态**——不阻断的告警会被无视，日后酿大问题。门禁只有失败或通过两态。
- **CI 只跑二值硬门禁**；**桶三只在 agent 会话时生效**（CI 无法"等确认"）。据此**作废** ADR-0003 之后 handoff 里"桶三 CI 只能告警"的旧说法。


### 二、E.1 规范合规三分

- **桶一 = 委托官方 `skills-ref validate`**（不重复实现，§B）：frontmatter/命名/结构 17 项，二值 pass/fail。
- **桶二 = 自建硬门禁**（skills-ref 不覆盖、可脚本化，进 lint/CI）：dist 一致性、平台可移植、中文化兵底（至少含 CJK）。
- **桶三 = 人在环**（语义判不了）：`description` 第三人称三要素、中文化质量、正文长度。
- **skills-ref 接入方式 = 直接 pip 依赖（选项 A）**：Python≥3.11，`pip install skills-ref`。这是工具链**首个第三方依赖**，为"官方权威 + 跟随 spec 演进 + 不自己重写正则"付出的代价；先前 lint 的"零第三方依赖"表述随之作废。


### 三、E.4 中文化修订

- 旧"产出物内容一律中文" → **"中文为主；通用/专业术语保留英文并加中文注释"**（形如 `TDD（测试驱动开发）`、`BDD（行为驱动开发）`）。
- 硬门禁只兜底（description/正文/changelog 至少含中文，防纯英文产出）；"术语加注释、不生硬直译"的质量走桶三。


### 四、F 评测形态（Claude-Code-first · YAML · 系统测量全栈）

> ⚠️ **部分已验证 / 整体试行待验证**：**触发评测的检测机制已实机验证**（子代理 spawn + 转录解析，见证据 8–10）；但**完整 F 流程（执行评测的 judge/baseline/pass^k、端到端 runner）仍无 skill 跑过**，待建 runner 时按"失败即用例"暴露并回填。

- **哲学**：系统测量 > 结果打分（四层：结果 / 轨迹 / 验证 / 环境）；Skill eval 三件套 = 边界清晰任务 + 确定性 verifier + **no-skill baseline**；**子代理隔离执行 + 独立 judge 子代理**（环境干净、评分客观）；**pass^k** 一致性（非确定性 → 多次采样，生产级要 k 次全过）。
- **触发评测**：用例 YAML（`id / should_trigger / prompt / category`，category ∈ 显式|隐式|情境|负例）；判定 = 把待测 skill 暂存到 `.claude/skills/`，用 **Agent 工具 spawn 隔离子代理**（会话内、**无鉴权问题**）自然处理 prompt，再解析该子代理转录 `<session>/subagents/agent-<id>.jsonl` 中是否出现 `"name":"Skill"` 且 `"skill":"<目标>"` 的 tool_use。**不用外部 `claude -p`**——本环境嵌套 headless 子进程无法鉴权（见证据 8）。因用自然 prompt 驱动（绝不打 `/skill-name`），出现即自动激活，规避"auto vs 显式不可区分"。
- **执行评测**：用例 YAML（`id / scenario / setup / 确定性检查 / rubric`）；判定 = ①轨迹层：解析子代理转录 JSONL 断言命令/产物；②结果层：独立 judge 子代理打结构化分（schema 约束输出）；③baseline：同 prompt 跑 skill-off 子代理对照，skill-on 须显著优于 baseline。
- **存放** `skills/<name>/evals/`（`trigger.yaml` + `execution.yaml`）；运行产物（JSONL trace、评分）不入库。`evals/` 为本仓库自建约定，**非官方 spec 目录**。
- **失败即用例**：线上失败 → 回填 YAML 用例（先挂红）→ 改源码 → 全量回归绿 → 才 re-release。
- **范围**：先 Claude-Code-first 跑通整套；Codex 适配器（足迹断言）后补。


### 五、G 发布门禁五关落点

- **① `skills-ref validate` + 自建 lint、③ version bump（`metadata.version`）+ changelog、④ dist 与源一致** → **CI 常驻**（每次 push/PR）。③ 以 **git tag `skill-name/vX.Y.Z`** 作"上个发布版本"参照。
- **② 触发/执行评测达标** → **agent 发布时驱动**（跑 F 全栈、结果留痕、达标才发；不放 CI，规避 API 额度与非确定性）。阈值 = **全局底线**（负例误触发 = 0、执行须优于 no-skill baseline）+ **每 skill 可调**（正例触发率、pass^k 的 k），后者写在该 skill 的 evals 配置里。
- **⑤ 难逆转决策有 ADR** → **发布时人在环**（停 + 确认，非 warning）。


## 证据（附来源，区分已证实/推断）

**已证实 · `skills-ref validate`（读源码 + 官方 spec + PyPI）：**

1. 全部检查产出 **error，源码无 "warning"/"warn" 概念**；共 17 项：`name`（非空 / ≤64 / 全小写 / 不以连字符起止 / 无连续连字符 / 仅字母数字连字符 / **等于父目录名，NFKC 归一化后比较**）、`description`（非空 / ≤1024）、`compatibility`（是字符串 / ≤500）、frontmatter 白名单（仅 `name/description/license/allowed-tools/metadata/compatibility`）、结构（路径存在且是目录 / 有 SKILL.md / frontmatter 可解析）。源码：`skills-ref/src/skills_ref/validator.py`、`models.py`。
2. **不查**：SKILL.md 正文长度 / 行数、`evals` 是否存在、`description` 语义质量（只查非空）。
3. `<500 行`是 spec 的**建议**（"Keep your main SKILL.md under 500 lines"），validate 不强制。
4. 运行时 **Python（requires_python ≥3.11）**；PyPI 有 `skills-ref`（最新 0.1.1），`pip install skills-ref`；另有非官方 Rust 版 `skills-ref-rs`。

**已证实 · Claude Code skill 激活可观测（子代理查证官方文档 code.claude.com）：**

5. skill 经 `Skill` 工具调用 → headless `claude -p --output-format json/stream-json` 输出中为 `tool_use`（`name:"Skill"`）；`PreToolUse` hook 可 `matcher:"Skill"` 拦截。
6. session JSONL（`~/.claude/projects/.../<id>.jsonl`）格式官方声明**内部不稳、不建议直接解析**；优先 headless JSON 或 hook。
7. **无官方 skill eval 框架**（仅社区工具）。

**已证实 · F 触发检测机制（本会话实机验证，非文档推断）：**

8. **外部 `claude -p` 此环境不可用**：从会话内 spawn 的 headless `claude -p` 子进程鉴权失败（"organization does not have access"、0 token），因本会话是 OAuth + 自定义 `ANTHROPIC_BASE_URL` 的托管鉴权、子进程无法复用。→ F runner **不走外部 headless，改用会话内子代理**。
9. **子代理机制可用**：`Agent` 工具 spawn 的子代理在会话内运行（无鉴权问题），能发现 `.claude/skills/` 下暂存的 skill 并真实激活（`Skill` tool_use，实测 `tool_uses>0`）。
10. **客观检测链路**：子代理转录在 `<session>/subagents/agent-<id>.jsonl`，实测记录为 `"name":"Skill","input":{"skill":"new-skill","args":"..."}`。→ **`Skill` 工具入参字段 = `skill`**（更正先前文档推断的 `input.name`）；触发检测 = grep 转录里 `"skill":"<目标>"` 的 Skill tool_use，**客观、非自报**。

**推断 / 待验证：**

- **auto 激活 vs 显式 `/skill` 在输出中不可区分**；我们用自然 prompt 驱动规避（出现即自动激活）。
- **Codex 侧 skill 激活可观测性与官方评测范式：本篇未做一手查证**。初步印象为 Codex 无直接激活事件、官方倾向足迹断言 + `codex exec --output-schema`，均**待 Codex 适配器阶段专项查证**，不在本篇作既证事实。


## 影响

- 私有纪律：新增 **A5**（门禁二值化 + 桶三人在环）；**E 段重构**为桶一/桶二/桶三 + E.4 中文化修订；F/G 指向本篇。`CLAUDE.md` + `AGENTS.md` 共享段同步，漂移校验须绿。
- 工具链：引入**首个第三方依赖** `skills-ref`（pip）；`tools/lint.py` **删除 warning 机制**，与 A5 一致。
- 后续实施（W2/W3）：接入 `skills-ref`、建桶二三项检查（可移植 grep / dist 一致 / 中文化兵底）、建 F runner（触发 + 执行两层）、G 发布门禁。


## 存疑 / 待验证

- **F 评测形态：触发检测机制已验证，其余待实跑**：触发检测（子代理 spawn + 转录解析）本会话已坐实；但 no-skill baseline 对照、judge 子代理打分、pass^k 成本与稳定性、端到端 runner 仍无 skill 跑过，可能在建 runner 时暴露问题，届时按"失败即用例"回填决策四。
- `Skill` tool_use 入参字段名（`input.name` vs `skill`），建 runner 时实测。
- ②"agent 发布时驱动"的强制力弱于 CI 硬门禁，靠发布流程纪律 + 结果留痕保证；是否日后补一层发布 CI 复跑，留观察。
- `pass^k` 的 k、各 skill 触发率阈值的具体值，建 runner 时定。
- git tag 作 version 参照的命名与 CI 检查实现（W3）。
- Codex 适配器（足迹断言）与 Codex skill 激活可观测性，待 Claude-Code-first 跑通后专项查证。


## 来源

- https://github.com/agentskills/agentskills/tree/main/skills-ref
- https://raw.githubusercontent.com/agentskills/agentskills/main/skills-ref/src/skills_ref/validator.py
- https://agentskills.io/specification
- https://pypi.org/project/skills-ref/
- https://code.claude.com/docs/en/headless.md
- https://code.claude.com/docs/en/hooks.md
- https://code.claude.com/docs/en/sessions.md
