# 交接:2026-07-02 家用机 · 骨架 + 工程纪律双份化

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

## 已定决策(勿重复调研)

- 平台仅 Claude Code + Codex;同一 SKILL.md 两家原生兼容,构建层只做分发打包 → ADR-0001。
- 纪律双份文件互为源、就地编辑 + 漂移校验;不再走 `standards/` 生成 → ADR-0003。
- 全面中文化 = 内容中文,标识符/路径英文 kebab-case。
- 通用 + 私有纪律全部常驻(1M 窗口够用);平台差异段由当值 agent 维护。
- 两台开发机均 Windows;工具链 Python 标准库(uv 未装,python 3.14 直用)。

## 下一步(建议顺序)

1. **议题 4:纪律里"硬约束(可脚本化→进 lint/CI)"vs"软指导(靠自觉)"的分界**——此前约定晚点讨论,决定 `tools/` 要建哪些检查。
2. 第一条流水线 skill **`/new-skill`**(脚手架)。
3. lint 接入官方 **`skills-ref validate`**(先确认其运行时/安装方式,见未决项)。
4. **`/handoff`、`/resume`、`/inspect`(巡检)做成 `.claude/skills`**(本文件与巡检脚本是手写实样,待固化)。
5. 评测 runner(触发 + 执行两层);分发(`marketplace.json` + Codex 安装脚本)。
6. CI 接入 `check-discipline-drift.py` + `skills-ref validate`。

## 未决 / 待实机验证

- **Codex 用户级路径** `~/.agents/skills` vs `~/.codex/skills`,在装 Codex 的机器跑 `/skills` 实证(ADR-0001 存疑项)。
- **`dist/` 是否入库**(公开 marketplace 从 GitHub 拉取可能要求),待专门 ADR。
- **`skills-ref` 运行时**(Python / Go?)与安装方式。
- 是否统一装 uv。

## 环境备忘

- 家用机 TERRYXMING:Windows 11,`D:\nexgaios-skills-dev`;git 2.53 / python 3.14 / node 24 / pwsh 7.6;**uv 未装**;Codex config 已设 128 KiB。
- 远端 `origin` = https://github.com/terryxming/nexgaios-skills-dev (private)。
