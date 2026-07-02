# 交接:2026-07-02 家用电脑 · 骨架搭建

> 续工前先 `git pull`,读本文件 + `docs/decisions/` 最新篇,再动手。

## 本次进度(已完成)

1. **仓库骨架 + git**:`main` 分支;目录 `skills/ standards/ templates/ tools/ dist/{claude,codex}/ docs/decisions/ journal/ .claude/skills/`;`.gitignore`(隔离机器特有文件);`README.md`。
2. **工程纪律双层**:
   - `standards/engineering-discipline-universal.zh.md`——用户通用纪律,**字节级照搬**(15879 字节)。
   - `standards/skill-engineering.zh.md`——私有纪律(通用→skill 场景映射、硬约束、评测即回归、发布门禁、跨设备)。
3. **常驻上下文链路**:`tools/sync-standards.py`(纯标准库,`--check` 漂移校验 + 体积护栏)→ 生成 `CLAUDE.md` / `AGENTS.md`(各 ~21.9 KB,含全文纪律)。
4. **决策记录**:ADR-0001(平台兼容与单一事实源)、ADR-0002(工程纪律常驻上下文),均附官方证据来源。

## 已定决策(勿重复调研)

- 平台:仅 Claude Code + Codex;同一 SKILL.md 两家原生兼容,构建层只做分发打包 → ADR-0001。
- 纪律全文内联 CLAUDE.md/AGENTS.md,由 standards/ 经 sync 生成,永不手改 → ADR-0002。
- 全面中文化;两台开发机均 Windows;工具链首选 Python 标准库(uv 未装,python 3.14 可直接用)。

## 下一步(建议顺序)

1. **创建 GitHub 远程仓库 + 首推**——团队共享/公开分发的前提,也是跨设备同步的通道。
2. **第一条流水线 skill `/new-skill`**:从 `templates/` 生成 `skills/<name>/` 骨架(SKILL.md + evals/ + metadata),自动带上发布声明模板。
3. **lint 集成**:接入官方 `skills-ref validate`(需先确认其运行时与安装方式,见未决项)+ 自建检查(name==目录名、description 触发边界、SKILL.md 行数)。
4. **`/handoff` + `/resume` 做成 `.claude/skills` 里的 skill**(本文件是手写示范,应固化为可复用 skill)。
5. 评测 runner 骨架(触发评测 + 执行评测两层)。
6. 分发:`marketplace.json`(Claude 侧)+ Codex 安装脚本。

## 未决 / 待实机验证

- **Codex 用户级路径**:官方 `~/.agents/skills` vs 部分教程 `~/.codex/skills`,在装 Codex 的机器跑 `/skills` 实测确认(ADR-0001 存疑项)。
- **`dist/` 是否入库**:公开 marketplace 从 GitHub 拉取可能要求产物入库;待专门决策(未来 ADR)。
- **`skills-ref` 运行时**:Python 还是 Go?安装方式?决定 lint 怎么接。
- **是否装 uv**:目前 python 直跑够用;若工具链统一走 uv,两台机器都要装。

## 环境备忘

- 家用电脑:Windows 11,`D:\nexgaios-skills-dev`;git 2.53 / python 3.14 / node 24 / pwsh 7.6;**uv 未装**。
- 尚未创建 GitHub 远程,尚未首次 commit 之外的推送。
