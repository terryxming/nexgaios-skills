# 0002. 工程纪律常驻上下文

- 状态:**落地方式已被 [ADR-0003](0003-discipline-dual-file-drift-check.md) 取代**（"纪律须常驻内联两家"的核心结论仍有效；"由 `standards/` 单一源经脚本生成"的落地方式已废弃）
- 日期:2026-07-02
- 决策人:terry（家用电脑，规划阶段）

> ⚠️ 本篇记录初版落地方式（`standards/` 单一源 → 脚本生成 CLAUDE.md/AGENTS.md）。同日经讨论改为 ADR-0003 方案（两份文件互为源、就地编辑 + 机械漂移校验，拆除 `standards/`）。保留本篇作历史；现行方案以 ADR-0003 为准。


## 背景

工程纪律要对两家 agent 都**常驻生效**(用户原则:"不在上下文窗口的信息等于不存在")。Claude Code 常驻读 `CLAUDE.md`,Codex 常驻读 `AGENTS.md`。纪律源在 `standards/`,问题是:如何让它常驻两家、又不手工维护双份、还不发生漂移?


## 决策

1. 纪律**全文内联**进 `CLAUDE.md` 与 `AGENTS.md`(不是引用)。
2. 两文件由 `tools/sync-standards.py` 从 `standards/` **生成**,永不手改;提供 `--check` 漂移校验接入 CI。
3. 脚本内置**体积护栏**:逼近 28 KiB 告警、超 32 KiB 硬顶拦截(退出码 1)。


## 证据（附来源）

1. **AGENTS.md 标准无 import 机制。** 标准本身不提供文件级 include/import 语法(nested AGENTS.md 只是"逐目录 concat",非 import)。→ 对 Codex **必须内联**,引用行不通。(注:Claude Code 可用 `@AGENTS.md` 导入,但那是 Claude 专属,不通用。)
2. **Codex 合并上限 32 KiB。** `project_doc_max_bytes` 默认 32 KiB(可在 `~/.codex/config.toml` 调大);这是**多个嵌套 AGENTS.md 合并后的总预算**,一旦超出**静默截断**(codex#7138),后发现的项目级指令会被丢。
3. **当前生成物 ~21.9 KB**,在 32 KiB 内,距 28 KiB 告警阈约 6 KB 余量。


## 影响

- 改纪律**只改 `standards/` 源**,跑 `python tools/sync-standards.py`;CI 用 `--check` 防漂移。
- 常驻/按需分界(定为原则):**影响每次行动的行为约束→常驻内联**;特定流程的操作手册→放对应 skill 按需加载,不塞进常驻文件。


## 存疑 / 待验证 / 风险

- ⚠️ **内联体积是持续风险**。官方建议根 AGENTS.md 保持精简(~2–3 KB),我们 21.9 KB 远超该建议,吃掉大半合并预算。今天够用(本仓库根、无深层嵌套),但纪律增长或 skill 子目录新增 AGENTS.md 会逼近 32 KiB。**缓解**:已加体积护栏(告警+硬拦截);若将来触顶,退路是调高 `project_doc_max_bytes` 或把私有纪律的操作细节下沉到按需 skill。
- `project_doc_max_bytes` 默认值随 Codex 版本可能变动,升级后需复核。


## 来源

- https://developers.openai.com/codex/guides/agents-md
- https://github.com/openai/codex/issues/7138
- https://github.com/agentsmd/agents.md/issues/11
