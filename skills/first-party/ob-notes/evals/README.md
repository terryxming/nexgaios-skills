# ob-notes 评测规则（仅维护者）

本文件说明 ob-notes 测什么、阈值多少、用例与规则怎么对应。评测引擎委托官方 skill-creator，本仓库只定阈值、消费结果（见宿主仓库 ADR-0005、纪律 F/G②）。沉淀笔记时无需理会本文件。

## 两类评测

| 类型 | 用例文件 | 测什么 |
|---|---|---|
| **触发评测** | `trigger-queries.json` | 正/负例的触发率——该触发的触发、近义负例不误触发 |
| **执行评测** | `evals.json` | with-skill 对 no-skill / 旧版 baseline 的子代理对照，grader 按 assertions 打分 |

- 用例入库 `evals/`；运行产物（子代理输出、grading、benchmark）**不入库**。
- 失败回填的暂存用例在 `evals/pending/`；发布前必须清空（宿主 `lint.py --release` 门禁，ADR-0012）。

## 阈值

- **全局底线（G 纪律，不可破）**：负例误触发为零；执行评测 with-skill 优于 baseline。
- **每 skill 可调**：具体 assertion 通过率阈值随用例演化，由维护者在发布时判定。
- 触发评测采多次采样得触发率，不以单次为准（pass^k）。

## 用例 → 规则映射

`evals.json` 每条针对一个规则/铁律的可验证行为：

| 用例 | 主测 | 对应规则 |
|---|---|---|
| `solution-card-exact-details` | 解法卡：30 秒读法 + 现象·根因·解法逐字块 + 确切细节 | iron-laws 二、presentation-modes、transcript-extract |
| `project-decision-to-obsidian-only` | 只写 Obsidian、不碰项目 dev-log；确切数字保留 | trigger-rule、landing-rule、iron-laws 二 |
| `iron-law-1-halt-on-unverified-target` | kb_root 不确定即停问、不静默写盘、不假装成功 | iron-laws 一、preflight-flow |
| `dialogue-transcript-preserve-questions` | 追问链：三轮问原文保留、答逐字不改讲解体、每轮总纲 | transcript-extract、presentation-modes |
| `verbatim-extract-no-compress` | 追问链：对比表/确切结论逐字、操作旁白滤除 | transcript-extract、signal-noise ③ |
| `topic-web-verbatim-organized` | 主题网：逐字块按内容编排、不重写、不留问答形态 | presentation-modes、transcript-extract、signal-noise ② |

## 架构翻转（v2.0.0）后的用例状态

v2.0.0 把「主题网/解法卡答重写」翻成「三种呈现正文一律逐字、只编排不重写」（宿主 ADR-0014）。连带用例改动：

- `topic-web-still-rewrites` → 更名 `topic-web-verbatim-organized`，断言从「综合重写」翻为「逐字块按内容编排、不重写」，prompt 改为真实多轮 transcript（原为内容摘要，逐字扣无从谈起）。
- `solution-card-exact-details` 补两条断言：30 秒读法综合头齐全、正文逐字块编排不重写。
- 追问链两条（id 4/5）本就测逐字，与新契约一致，不动。

## 怎么跑

用 skill-creator 的机器（run_loop / aggregate / viewer），不自造 runner。**用例跑前必须给用户过目确认**（纪律 F：是否贴近真实场景由人判定，不许闷头自测）。失败案例先按 `references/feedback.md` 回填成用例，再改源码；改完跑全量回归，通过才允许重新发布（G②）。
