# 0003. 工程纪律：双份文件 + 漂移校验

- 状态:已接受（取代 [ADR-0002](0002-discipline-always-in-context.md) 的落地方式）
- 日期:2026-07-02
- 决策人:terry（家用电脑）+ Claude


## 背景

ADR-0002 定了"纪律全文内联、常驻两家",落地用 `standards/` 单一源 + 脚本生成 `CLAUDE.md`/`AGENTS.md`。讨论中用户否决"生成"路线,并明确若干新约束(命名、防幻觉、平台差异段治理等),遂改落地方式。


## 决策

1. **两份文件互为源、就地编辑**:纪律直接维护在 `CLAUDE.md` 与 `AGENTS.md`,不再有 `standards/` 生成源。
2. **三段式结构**:① 一分钟速览 ② 通用工程纪律(10 条正文照搬,H1 中性化为「通用工程纪律」)+ 私有工程纪律——合为**共享段**(`DISCIPLINE:SHARED`);③ 平台专属约定(`DISCIPLINE:PLATFORM`)。
3. **共享段逐字节一致**,由 `tools/check-discipline-drift.py` 机械校验(+ 128 KiB 体积护栏),接 CI;改一份必须同步另一份、校验须绿。
4. **照搬边界**:仅 10 条规则**正文**一字不改;文档 H1 与自我指涉框架句可中性化(修复 AGENTS.md 曾内联「CLAUDE.md(中文版)」的缺陷)。
5. **中文化边界**:全面中文化 = **内容**中文;**标识符/文件名/路径**用英文 kebab-case。
6. **平台差异段**不写死、预留机制,**由当值平台 agent 维护**(Claude 不懂 Codex、反之亦然),不参与漂移校验。
7. **Codex `project_doc_max_bytes` 各机器设 128 KiB(131072)**;属机器本地配置,每台机器各设,巡检核查。
8. **通用 + 私有纪律全部常驻**(不下沉按需),因上下文窗口已达 1M 级、够用。
9. **私有纪律成文**:A 每次行动的行为闸门(A1 查证优先 / A2 写前声明 / A3 命名 / A4 防幻觉七条)、B 单一事实源(含本双份例外)、C 跨设备协作与开发巡检、D 通用→skill 映射、E skill 硬约束、F 评测即回归、G 发布门禁;人称统一**第二人称**。


## 证据（附来源）

1. **AGENTS.md 无 import 机制**(同 ADR-0002)→ 两份物理文件不可避免,故"单一逻辑源 + 双份渲染 + 机械校验"是 MECE 下的正解。
2. **`project_doc_max_bytes` 默认 32 KiB、可调、官方无文档硬上限**,示例见调至 64 KiB;本仓库设 128 KiB。
3. **单份文件实测 ~25.9 KB(AGENTS.md)**,远在 128 KiB 内;共享段 24174 字节两文件一致(校验通过)。


## 影响

- 维护模式:就地编辑两份 + 漂移校验绿灯,**无生成步骤**。
- MECE:删除 `standards/` 消除第三份拷贝;两份为平台强制渲染,一致性由校验保证(§13 单一事实源 的例外条款)。
- 待接 CI:`check-discipline-drift.py` + 官方 `skills-ref validate`。


## 存疑 / 待验证 / 风险

- 内联体积(~25.9 KB)虽在 128 KiB 内,仍远超"根 AGENTS.md 宜精简"的官方建议;体积护栏监控,退路同 ADR-0002。
- "手动同步两份"的可靠性依赖校验必跑;接 CI 前靠 agent 自觉 + 本地 `check-discipline-drift.py`。
- Codex `~/.agents/skills` vs `~/.codex/skills` 路径分歧待实机验证(承 ADR-0001)。


## 来源

- https://developers.openai.com/codex/config-reference
- https://developers.openai.com/codex/guides/agents-md
- https://github.com/openai/codex/issues/7138
