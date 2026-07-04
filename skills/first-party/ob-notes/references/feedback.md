---
name: feedback
metadata:
  version: 1.0.0
  provides: [feedback-loop]
  depends_on: []
---

# 失败回填 — 真实使用的失败案例流回评测（仅维护者）

宿主仓库纪律 F「失败即用例」的 ob-notes 落地：真实使用中每个失败案例，先回填成 eval 用例、再改源码。本文件是捕获格式、暂存位置、转换流程与发布闸的唯一家。**普通使用者无需理会**：未配置 `dev_repo` 时本通道完全惰性。

## 何时启动

用户在沉淀后（或之后的会话里）指出本次产出有问题并要求记录 / 回填——如「这次沉淀不对，回填用例」「这笔记有问题，记下来待修」。失败类型举例：呈现侧重误判、该留的确切细节被压、无问存档没引导好、误触发 / 漏触发、落点或格式违规。

## 前置：dev_repo 配置（维护者标识）

读 `~/.config/ob-notes/config.json` 的可选键 `dev_repo`（ob-notes 源码仓在本机的路径）：

```json
{ "kb_root": "<盘符>:\\my-kbase", "dev_repo": "<盘符>:\\path\\to\\nexgaios-skills" }
```

- **配了** → 本机是维护环境，执行下面的捕获。
- **没配** → 本机不是维护环境：把失败描述整理后贴给用户，建议其反馈给 skill 维护者，到此为止。

## 捕获：一次失败一个 JSON

写入 `{dev_repo}/skills/first-party/ob-notes/evals/pending/YYYY-MM-DD-<slug>.json`（目录不存在则创建；slug 用英文 kebab-case 概括失败点，如 `2026-07-05-detail-compressed.json`）：

```json
{
  "captured_at": "YYYY-MM-DD",
  "agent": "claude-code | codex",
  "trigger_query": "用户当时的触发语，原样",
  "scenario": "失败场景概述：对话在做什么、素材是什么（可由 agent 组织）",
  "produced_note_path": "坏笔记的落盘路径",
  "produced_note_excerpt": "笔记暴露问题的关键段，原样摘录",
  "user_complaint": "用户指出问题的原话，逐字保真",
  "suspected_rule": "疑似违反的规则项（受控词表标识符；拿不准可多个或留空）",
  "draft_assertion": "这次失败对应的正确行为，一句断言草稿"
}
```

**捕获纪律**（与本 skill 主流程同源）：`trigger_query` 与 `user_complaint` 逐字保真、不许改写；`produced_note_excerpt` 原样摘录、不概括；判断类字段（scenario / suspected_rule / draft_assertion）由 agent 组织。**只写这一个 JSON，不动仓库其他文件、不 commit、不 push**——留 dirty 状态即可，下次维护会话的 C1 巡检（git 是否 clean）自然看见。

跨机注意：pending 留在捕获机的工作区；要跨机处理，随该机下次常规收工 commit + push 带走。

## 回填：pending → evals.json（维护会话，人在环）

1. C1 巡检发现 `evals/pending/` 有文件 → 逐个处理。
2. agent 读 pending JSON，起草正式 eval 条目（prompt / expected_output / assertions，格式同 `evals/evals.json` 既有条目）。
3. **用户过目批准**（宿主纪律 F：用例人在环，不许闷头自测）→ 追加进 `evals/evals.json`，删除对应 pending 文件。
4. 记 dev-log（失败根因 + 是否引出源码修改），随正常流程 commit。

## 发布闸

`python tools/lint.py --release` 检查 `evals/pending/` 必须为空——有未回填的失败案例不得发布（G·2 前置）。平时 CI 不查 pending，否则捕获文件一 push 就红、堵死捕获通道本身。
