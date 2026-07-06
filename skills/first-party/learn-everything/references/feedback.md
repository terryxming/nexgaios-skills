# 失败回填 — 真实使用的失败案例流回评测（仅维护者）

宿主仓库纪律 F「失败即用例」在 learn-everything 的落地：真实使用中每个失败案例，先回填成 eval 用例、再改源码——**迭代从使用效果里产生，不靠凭空设计**。本文件是捕获格式、暂存位置、转换流程与发布闸的唯一家。**普通使用者无需理会**：未配置 `dev_repo` 时本通道完全惰性。

## 何时启动

用户在一次学习后（或之后的会话里）指出本次产出有问题并要求记录 / 回填——如「这次的认知地图不对，回填用例」「这次学得不对味，记下来待修」。失败类型举例：

- **认知地图套了框架、没自生长**（塞进预设维度清单，而非从主题逻辑长出骨架）；
- **地图不能双向导航**（拆不到原子，或原子逆推不回整体）；
- 学习阶梯没给定位、依赖顺序错；
- 某一法产出不对味（20% 圈错、速查表没当骨架锚点、费曼没逼输出、考官一次多问）；
- 误触发 / 漏触发；
- 该交 ob-notes 落盘却自己写盘 / 写了项目目录。

## 前置：dev_repo 配置（维护者标识）

读 `~/.config/learn-everything/config.json` 的可选键 `dev_repo`（learn-everything 源码仓在本机的路径）：

```json
{ "dev_repo": "<盘符>:\\path\\to\\nexgaios-skills" }
```

- **配了** → 本机是维护环境，执行下面的捕获。
- **没配** → 本机不是维护环境：把失败描述整理后贴给用户，建议其反馈给 skill 维护者，到此为止。

## 捕获：一次失败一个 JSON

写入 `{dev_repo}/skills/first-party/learn-everything/evals/pending/YYYY-MM-DD-<slug>.json`（目录不存在则创建；slug 用英文 kebab-case 概括失败点，如 `2026-07-06-map-templated.json`）：

```json
{
  "captured_at": "YYYY-MM-DD",
  "agent": "claude-code | codex",
  "trigger_query": "用户当时的触发语，原样",
  "scenario": "失败场景概述：在学什么主题、走到哪一法（可由 agent 组织）",
  "produced_output_excerpt": "产出里暴露问题的关键段，原样摘录",
  "user_complaint": "用户指出问题的原话，逐字保真",
  "suspected_step": "疑似出问题的方法 / 环节（如 认知地图-自生长 / 双向导航 / 20% / 速查表 / 资源 / 费曼 / 考官 / 触发 / 落盘；拿不准可多个或留空）",
  "draft_assertion": "这次失败对应的正确行为，一句断言草稿"
}
```

**捕获纪律**：`trigger_query` 与 `user_complaint` 逐字保真、不许改写；`produced_output_excerpt` 原样摘录、不概括；判断类字段（scenario / suspected_step / draft_assertion）由 agent 组织。**只写这一个 JSON，不动仓库其他文件、不 commit、不 push**——留 dirty 状态即可，下次维护会话的 C1 巡检（git 是否 clean）自然看见。

跨机注意：pending 留在捕获机的工作区；要跨机处理，随该机下次常规收工 commit + push 带走。

## 回填：pending → evals.json（维护会话，人在环）

1. C1 巡检发现 `evals/pending/` 有文件 → 逐个处理。
2. agent 读 pending JSON，起草正式 eval 条目（prompt / expected_output / assertions，格式同 `evals/evals.json` 既有条目）。
3. **用户过目批准**（宿主纪律 F：用例人在环，不许闷头自测）→ 追加进 `evals/evals.json`，删除对应 pending 文件。
4. 记 dev-log（失败根因 + 是否引出源码修改），随正常流程 commit。

## 发布闸

`python tools/lint.py --release` 检查 `evals/pending/` 必须为空——有未回填的失败案例不得发布（G·2 前置）。平时 CI 不查 pending，否则捕获文件一 push 就红、堵死捕获通道本身。
