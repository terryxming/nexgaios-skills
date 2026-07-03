# 交接:2026-07-03 公司机 · 议题4收口 + W2 门禁 + 转向委托 skill-creator

> 续工前先 `git pull`,读本文件 + `docs/decisions/`(重点 ADR-0004、**ADR-0005**),再动手。切机器先跑开发巡检(私有纪律 C1)。

## 先纠正旧 handoff 的错误(2026-07-02-home-scaffold.md)

- **python 版本**:旧记 3.14,公司机实测 **3.13.5**(家用机版本待复核)。
- **机器名**:`CHINAMI-5T8IKFA` 是**公司机**(hostname 与旧 handoff"家用机 TERRYXMING"之说无冲突,是两台机器);公司机 Codex `project_doc_max_bytes=131072` **已确认设好**,旧 handoff 的"公司机待设"项闭环。
- **"桶三 CI 只能告警"已作废**:现行 A5 纪律=门禁二值化,CI 只跑硬门禁,桶三只在 agent 会话人在环(ADR-0004)。

## 已完成(本次会话,公司机)

1. **议题4 收口 → ADR-0004**:门禁哲学 A5(二值化、无 warning 中间态)、E.1 三分(桶一 skills-ref/桶二自建/桶三人在环)、E.4 中文化修订(中文为主+术语加注)、G 五关落点。lint/drift 的 warning 机制全数拆除。
2. **纪律 A4·3 扩写(含自评)**:未实跑/未实测的自有方案,起草时就标「试行待验证」,不等用户提醒。
3. **W2 skill 级硬门禁落地**:lint.py 新增桶一 skills-ref validate(Python API)/桶二可移植 grep/桶二中文化兵底,fixture 实测 green+red;`tools/requirements.txt` 固定 `skills-ref==0.1.1`(工具链首个第三方依赖);CI 加 pip install。
4. **F 触发检测机制实机验证**(ADR-0004 证据 8–10):嵌套 `claude -p` 在本环境**鉴权失败**(不可用);**会话内子代理**能发现 `.claude/skills` 暂存 skill 并真实激活;客观判定=解析 `<session>/subagents/agent-<id>.jsonl` 里 `"name":"Skill"`,入参字段实测为 **`skill`**。
5. **重大转向 → ADR-0005**:发现两端都内置官方 skill-creator(Claude plugin + Codex `~/.codex/skills/.system/`),实读证实其覆盖创作+触发/执行评测(含 no-skill baseline、grader、benchmark、description 优化)完整闭环 → **评测与创作委托官方,不自建**;曾建的 `/new-skill`(scaffold.py+YAML evals)**整体废弃删除**;skill 内**不放 CHANGELOG.md**(版本历史=git tag `skill-name/vX.Y.Z`+`metadata.version`);eval 格式改用其 `evals/evals.json` 约定;**评测用例运行前必须给用户过目**(人在环,入 F 纪律)。
6. **Fable 5 全仓审查 + 9 项修复**:README 对齐 0005(删"用 skill 造 skill")、lint 可移植检查排除 `evals/`(防误杀官方建议的实路径查询)、ADR-0001 存疑项补实机证据、删 templates/ 与 tools/.gitkeep。
7. 全程 lint+CI 绿;`.claude/skills/*` 已 gitignore(评测暂存区,skill 源一律在 `skills/`)。

## 已定决策(勿重复调研)

- ADR-0004:门禁二值化 + 桶三人在环 + G 五关落点(全局底线:负例误触发=0、优于 baseline;每 skill 可调阈值)。
- ADR-0005:委托 skill-creator;new-skill 废弃;无 CHANGELOG.md;evals.json 格式;用例人在环。
- dist/build + dist 入库与否:**整块推后专题**(含专门 ADR),first-skill 不依赖它。

## 下一步(建议顺序)

1. **首条真实业务 skill**:走「skill-creator 创作 → 用例给用户过目 → W2 门禁 → G 发布」全流程磨合(F 纪律首次实跑,暴露问题即回填)。
2. ~~pre-flight hook 待装~~ **已装**(同日闭环,commit `6e0aa5d`):UserPromptSubmit hook 每回合注入 3 条微清单(`tools/preflight-reminder.py` + `.claude/settings.json`,已入库两机共用);维护约定:清单 ≤3 条,失守模式变化时替换不追加。
3. **dist/build 专题**:build 脚本、dist 入库 ADR、dist 一致性门禁(桶二第4项)、marketplace/Codex 分发。
4. **Codex 侧实机复核**:用户级路径终审(`~/.codex/skills`,见 ADR-0001 实机证据)、AGENTS.md 平台段接管、Codex 跑 skill-creator 的适配。

## 未决 / 待实机验证

- skill-creator 的 description 优化(`run_loop.py`)走 `claude -p` 子进程——本机嵌套鉴权失败,该环节可能不可用(主评测循环用子代理不受影响),待实跑。
- pass^k 的 k、各 skill 触发率阈值,首条 skill 时定。
- 会话稳定性:本会话多次 UI 卡顿/渲染丢失(一次审查报告没显示就弹了确认框)——重要决策依据务必确认用户**看到了**再问。

## 环境备忘

- **公司机 CHINAMI-5T8IKFA**:Windows 11,`D:\nexgaios-skills-dev`;git 2.53 / python 3.13.5 / node 24.14.1 / pwsh;Codex 128 KiB 已设;`skills-ref` 0.1.1 已 pip 装;`claude` CLI 2.1.101。
- 家用机(TERRYXMING,见旧 handoff):工具链版本待下次当值复核。
- 远端 `origin` = https://github.com/terryxming/nexgaios-skills-dev (private)。
