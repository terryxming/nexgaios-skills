# ob-notes 评测规则（仅维护者）

本文件说明 ob-notes 测什么、阈值多少、用例与规则怎么对应。

评测引擎委托官方 skill-creator，本仓库只定阈值、消费结果（见宿主仓库 ADR-0005）。

沉淀笔记时无需理会本文件。


## 两类评测

| 类型 | 用例文件 | 测什么 |
|---|---|---|
| **触发评测** | `trigger-queries.json` | 正/负例的触发率——该触发的触发、近义负例不误触发 |
| **执行评测** | `evals.json` | with-skill 对 no-skill / 旧版 baseline 的子代理对照，grader 按 assertions 打分 |

- 用例入库 `evals/`；运行产物（子代理输出、grading、benchmark）**不入库**。
- 失败回填的暂存用例在 `evals/pending/`；发布前必须清空（宿主 `lint.py --release` 门禁，ADR-0012）。


## 阈值

- **全局底线**（不可破）：
  - 负例误触发为零。
  - 执行评测 with-skill 优于 baseline。
- **每 skill 可调**：具体 assertion 通过率阈值随用例演化，由维护者在发布时判定。
- 触发评测采多次采样得触发率，不以单次为准（pass^k）。


## 用例 → 规则映射

`evals.json` 每条针对一个规则/铁律的可验证行为：

| 用例 | 主测 | 对应规则 |
|---|---|---|
| `solution-card-protected-atoms-and-sources` | 解法卡：忠实提炼 + 受保护原子 + 可信度 + 带时间的来源脚注 | iron-laws 二、evidence-chain、presentation-modes |
| `project-decision-to-obsidian-only` | 只写 Obsidian、不碰项目 dev-log；区分来源时间与事件时间 | trigger-rule、landing-rule、evidence-chain |
| `iron-law-1-halt-on-unverified-target` | kb_root 不确定即停问、不静默写盘、不假装成功 | iron-laws 一、preflight-flow |
| `dialogue-transcript-preserve-questions` | 追问链：三轮问答逐字、每轮来源时间与总纲脚注 | transcript-extract、presentation-modes、evidence-chain |
| `verbatim-extract-no-compress` | 显式逐字模式：对比表、确切结论与操作旁白均原样保留 | transcript-extract、signal-noise |
| `topic-web-evidence-grounded-synthesis` | 主题网：证据约束的综合讲解、受保护原子与带时间脚注 | presentation-modes、evidence-chain |
| `no-strengthening-or-boundary-loss` | 漂移控制：不升级确定性、不丢否定/条件/边界 | evidence-chain、quality-rubric |


## 证据约束重构（v2.0.0 候选）后的用例状态

v2.0.0 候选改为「可追溯的忠实提炼」：显式问答实录逐字，解法卡 / 主题网忠实综合；通用防漂移机制是内部证据账本、受保护原子、可信度与带来源时间的脚注（宿主 ADR-0015）。连带用例改动：

- `solution-card-exact-details` → `solution-card-protected-atoms-and-sources`，从全文逐字改测受保护原子、确定性与来源脚注。
- `topic-web-verbatim-organized` → `topic-web-evidence-grounded-synthesis`，改测跨轮综合后事实、条件与来源仍不漂移。
- 追问链两条继续测显式逐字，并补来源时间与脚注断言。
- 新增 `no-strengthening-or-boundary-loss`，专测「可能」不变「一定」、条件与否定不丢。
- 所有含事实来源的执行用例都补对话时间；事件时间另给时，断言两者不得混淆。


## 怎么跑

用 skill-creator 的机器（run_loop / aggregate / viewer），不自造 runner。

**用例跑前必须给用户过目确认**：是否贴近真实场景由人判定，不许闷头自测。

失败案例先按 `references/feedback.md` 回填成用例，再改源码。

改完跑全量回归，通过才允许重新发布。
