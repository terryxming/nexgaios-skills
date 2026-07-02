# 交接:2026-07-02/03 家用机 · 骨架 + 纪律双份化 + W1 门禁

> 续工前先 `git pull`,读本文件 + `docs/decisions/` 最新篇,再动手。切机器先跑开发巡检(私有纪律 C1)。

## 已完成(本次会话)

1. **仓库骨架 + git + GitHub 远端**:`origin` = https://github.com/terryxming/nexgaios-skills-dev (private),`main` 已推送并跟踪。
2. **工程纪律 = 双份文件 + 漂移校验(ADR-0003,取代 0002 落地方式)**:
   - `CLAUDE.md` / `AGENTS.md` 三段式:一分钟速览 + 通用工程纪律(10 条正文照搬,H1 中性化)+ 私有工程纪律(第二人称:A 行为闸门/7 款防幻觉、B 单一源例外、C 巡检+跨设备、D–G 映射/硬约束/评测/发布)+ 平台专属约定(各自维护)。
   - 共享段逐字节一致,`tools/check-discipline-drift.py` 机械校验 + 128 KiB 体积护栏。
   - 已拆除 `standards/` 与 `tools/sync-standards.py`(不再走生成)。
3. **Codex 本机 `project_doc_max_bytes = 131072`(128 KiB)已设**。⚠️ **公司机需同样设置**,巡检会查(`~/.codex/config.toml`)。
4. **文件名英文化**(路径英文 / 内容中文)。
5. **决策留痕**:ADR-0001(平台兼容与单一事实源)、ADR-0002(常驻内联,落地方式已被 0003 取代)、ADR-0003(双份 + 校验),均附证据。
6. **议题4 · W1 仓库级硬门禁**:`tools/lint.py`(聚合 路径 ASCII + ADR 留痕 + 纪律漂移 三项)+ `.github/workflows/ci.yml`;本地绿 + **GitHub Actions CI 已绿(success)**。

## 已定决策(勿重复调研)

- 平台仅 Claude Code + Codex;同一 SKILL.md 两家原生兼容,构建层只做分发打包 → ADR-0001。
- 纪律双份文件互为源、就地编辑 + 漂移校验;不再走 `standards/` 生成 → ADR-0003。
- 全面中文化 = 内容中文,标识符/路径英文 kebab-case。
- 通用 + 私有纪律全部常驻(1M 窗口够用);平台差异段由当值 agent 维护。
- 两台开发机均 Windows;工具链 Python 标准库(uv 未装,python 3.14 直用)。
- **议题4(纪律硬/软分界)进行中**:
  - 已认可做硬门禁:A3 路径、A1 ADR 留痕、E.3 可移植、E.4 中文化;W1 已落地其中"路径 + ADR + 漂移"三项。
  - **桶三**(启发式:diff 跨关注点 / 三方依赖 / description 边界)采用**"遇到即停 → 告警 + 给修复方案 → 用户确认 → 再执行"的人在环模式**(非被动 warn)。注意:CI 无法"等确认",故桶三是 agent 工作时行为,CI 至多告警——协同方式待建检查时定。
  - **未聊**:E.1 规范合规、F/G 评测发布。
  - `ADR-0004`(议题4 结论)待 E.1、F/G 聊完后一次性起草,并把桶三"停+提案+确认"行为写进私有纪律。

## 下一步(建议顺序)

1. **聊完议题4 剩余两块**:①**E.1 规范合规**——聊前须先**查证官方 `skills-ref validate` 的实际检查项**(A1 查证优先,不凭记忆),再和自建检查划边界(用户已否掉"<500 行");②**F/G 评测发布**。
2. 聊完起草 **ADR-0004**,桶三行为写进私有纪律。
3. 建**桶三三项检查**(人在环模式)、**W2**(skills-ref 集成 / 可移植 grep / dist 一致性)、**W3**(评测 / 发布门禁)。
4. 第一条流水线 skill **`/new-skill`**(脚手架)。
5. **`/handoff`、`/resume`、`/inspect`(巡检)做成 `.claude/skills`**(本文件与巡检脚本是手写实样,待固化)。
6. 评测 runner(触发 + 执行两层);分发(`marketplace.json` + Codex 安装脚本)。

## 未决 / 待实机验证

- **Codex 用户级路径** `~/.agents/skills` vs `~/.codex/skills`,在装 Codex 的机器跑 `/skills` 实证(ADR-0001 存疑项)。
- **`dist/` 是否入库**(公开 marketplace 从 GitHub 拉取可能要求),待专门 ADR。
- **`skills-ref` 运行时**(Python / Go?)与安装方式——直接影响 E.1 与 W2。
- 桶三"停 + 确认"在 CI 与本地/会话内如何协同(CI 只能告警)。
- 是否统一装 uv。

## 环境备忘

- 家用机 TERRYXMING:Windows 11,`D:\nexgaios-skills-dev`;git 2.53 / python 3.14 / node 24 / pwsh 7.6;**uv 未装**;Codex config 已设 128 KiB。
- 远端 `origin` = https://github.com/terryxming/nexgaios-skills-dev (private)。
- 提交历史到 `893123c`(W1)。
