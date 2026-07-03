#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scaffold.py — 为本仓库生成一个结构合规的新 skill 骨架（/new-skill 的确定性产出层）。

产出 skills/<name>/：SKILL.md（frontmatter + 正文模板）、CHANGELOG.md、
evals/trigger.yaml、evals/execution.yaml。可选目录（references/ scripts/ assets/、
Codex sidecar agents/openai.yaml）按需再加，不预造空目录（纪律 §3 简单性）。

名校验对齐官方 skills-ref（桶一）：仅 [a-z0-9-]、≤64、不以连字符起止、无连续连字符。
生成的骨架开箱即过 W2 三门禁（名=父目录名、含中文、无机器路径）。

用法：python scaffold.py <skill-name>
零第三方依赖。
"""
from __future__ import annotations

import sys
from pathlib import Path

# ^[a-z0-9]+(-[a-z0-9]+)*$ 等价于：首尾字母数字、单连字符分隔、无连续连字符、仅 [a-z0-9-]
import re

NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MAX_NAME = 64

SKILL_MD = """\
---
name: {name}
description: TODO 用第三人称写清三件事——这个 skill 是干嘛的、何时用、何时不用（≤1024 字符，须含中文）。
metadata:
  version: 0.1.0
---

# {name}

TODO 一句话说明这个 skill 解决哪一类任务。

## 何时触发 / 何时不触发

- **触发**：TODO 描述该在什么情形下用它（写具体的正例语境）。
- **不触发**：TODO 描述哪些相邻但不该用它的情形（写具体的负例语境）。

## 步骤

1. TODO 第一步。
2. TODO 第二步。
"""

CHANGELOG_MD = """\
# 变更记录

## 0.1.0
- 初始骨架（由 /new-skill 生成）。
"""

TRIGGER_YAML = """\
# 触发评测用例（承纪律 F）：验证该触发才触发、不该触发不触发。
# 判定：headless 子会话跑 prompt，看输出里是否出现本 skill 的 Skill 工具调用。
# category：显式 / 隐式 / 情境 / 负例。负例误触发是重点，全局底线要求为 0。
cases:
  - id: explicit-1
    should_trigger: true
    category: 显式
    prompt: "TODO 一个显式点名本 skill 任务的 prompt"
  - id: implicit-1
    should_trigger: true
    category: 隐式
    prompt: "TODO 一个不点名、但语义应触发本 skill 的 prompt"
  - id: negative-1
    should_trigger: false
    category: 负例
    prompt: "TODO 一个相关但不该触发本 skill 的 prompt"
"""

EXECUTION_YAML = """\
# 执行评测用例（承纪律 F）：触发后做得好不好。
# 判定 = 轨迹层确定性检查 + judge 子代理 rubric 打分 + no-skill baseline 对照。
# 隔离子代理执行、独立 judge 评分；非确定性用 pass^k 采样。
cases:
  - id: scenario-1
    scenario: "TODO 场景描述"
    setup: "TODO 前置条件（可留空）"
    deterministic_checks:
      - "TODO 期望产生的可机械验证的足迹，例如某文件存在/某命令被执行"
    rubric:
      - "TODO judge 评分要点，例如产出结构是否合规、是否优于 no-skill baseline"
"""


def skills_root() -> Path:
    # 本文件位于 skills/new-skill/scripts/scaffold.py → parents[2] = skills/
    return Path(__file__).resolve().parents[2]


def validate_name(name: str) -> str | None:
    if len(name) > MAX_NAME:
        return f"skill 名 '{name}' 超 {MAX_NAME} 字符"
    if not NAME_RE.match(name):
        return (f"非法 skill 名 '{name}'：须为 kebab-case"
                "（仅 [a-z0-9-]、不以连字符起止、无连续连字符）")
    return None


def scaffold(name: str) -> int:
    err = validate_name(name)
    if err:
        print(f"✗ {err}", file=sys.stderr)
        return 1
    target = skills_root() / name
    if target.exists():
        print(f"✗ skills/{name}/ 已存在，拒绝覆盖", file=sys.stderr)
        return 1

    (target / "evals").mkdir(parents=True)
    (target / "SKILL.md").write_text(SKILL_MD.format(name=name), encoding="utf-8")
    (target / "CHANGELOG.md").write_text(CHANGELOG_MD, encoding="utf-8")
    (target / "evals" / "trigger.yaml").write_text(TRIGGER_YAML, encoding="utf-8")
    (target / "evals" / "execution.yaml").write_text(EXECUTION_YAML, encoding="utf-8")

    print(f"✅ 已生成 skills/{name}/：SKILL.md、CHANGELOG.md、evals/trigger.yaml、evals/execution.yaml")
    print("下一步：填 description（第三人称三要素）、正文触发边界、evals 用例；跑 tools/lint.py 验证。")
    return 0


def main() -> int:
    if len(sys.argv) != 2:
        print("用法：python scaffold.py <skill-name>", file=sys.stderr)
        return 2
    return scaffold(sys.argv[1])


if __name__ == "__main__":
    raise SystemExit(main())
