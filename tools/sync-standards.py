#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync-standards.py — 从 standards/ 单一事实源生成 CLAUDE.md 与 AGENTS.md。

背景决策：工程纪律必须常驻上下文（"不在上下文窗口的信息等于不存在"）。
AGENTS.md 标准无 import 机制，故纪律全文内联进两份文件；但不手工维护双份，
一律由本脚本从 standards/ 生成，并提供 --check 做漂移校验（CI 用）。

用法：
    python tools/sync-standards.py            # 生成/更新 CLAUDE.md 与 AGENTS.md
    python tools/sync-standards.py --check     # 只校验，有漂移则退出码 1（不写文件）

零第三方依赖，仅用标准库。
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 纳入常驻上下文的纪律源文件，按顺序拼接
STANDARDS = [
    "standards/engineering-discipline-universal.zh.md",
    "standards/skill-engineering.zh.md",
]

# 生成目标：文件名 -> 抬头里对本平台的一句话称呼
TARGETS = {
    "CLAUDE.md": "Claude Code",
    "AGENTS.md": "Codex",
}

MARK_BEGIN = "<!-- AUTOGEN:standards BEGIN — 由 tools/sync-standards.py 生成，勿手改此标记内的内容 -->"
MARK_END = "<!-- AUTOGEN:standards END -->"

# 体积护栏：Codex 合并 AGENTS.md 的总预算 project_doc_max_bytes 默认 32 KiB，超出静默截断。
# 见 docs/decisions/0002。逼近即告警，超硬顶即拦截（连写入模式也返回非零）。
HARD_CAP_BYTES = 32 * 1024      # Codex 默认硬顶
WARN_AT_BYTES = 28 * 1024       # 逼近阈值（留约 4 KiB 余量给嵌套/未来增长）


def header(platform: str) -> str:
    return f"""# 面向 {platform} 的工作约束（本仓库）

> 本文件由 `tools/sync-standards.py` 从 `standards/` 生成。**请勿手改**下方自动生成区；
> 要改工程纪律，改 `standards/` 里的源文件，再跑 `python tools/sync-standards.py`。

本仓库是多 agent（Claude Code + Codex）的 skill 生产流水线。任何在此干活的 agent 都必须遵守下面内联的工程纪律——分**通用**与**私有（skill 生产）**两层，同时生效，冲突时以更严格一方为准。

## 一分钟速览

- **单一事实源**：skill 源在 `skills/`；`dist/` 是构建产物，**永不手改**。工程纪律源在 `standards/`；`CLAUDE.md`/`AGENTS.md` 由脚本生成，**永不手改**。
- **全面中文化**：一切产出物（含 skill 的 `description`）用中文。
- **决策留痕**：难逆转的选择写进 `docs/decisions/`，并附证据来源。
- **跨设备铁律**：需要在另一台机器接续的状态，必须进仓库并 push——git 是唯一同步通道。收工 `/handoff`，续工 `/resume`。
- **涉及 Codex 等非 Claude 平台的事实**：先查官方文档，再落笔；存疑项标注待实机验证，不凭记忆断言。

---
"""


def build(platform: str) -> str:
    parts: list[str] = [header(platform), MARK_BEGIN, ""]
    for rel in STANDARDS:
        text = (ROOT / rel).read_text(encoding="utf-8").strip("\n")
        parts.append(f"<!-- 源：{rel} -->\n")
        parts.append(text)
        parts.append("\n")
    parts.append(MARK_END)
    parts.append("")  # 结尾换行
    return "\n".join(parts)


def check_size(fname: str, content: str) -> tuple[int, str | None]:
    """返回 (字节数, 严重级别)。级别为 'over' 超硬顶 / 'warn' 逼近 / None 正常。"""
    n = len(content.encode("utf-8"))
    if n > HARD_CAP_BYTES:
        return n, "over"
    if n > WARN_AT_BYTES:
        return n, "warn"
    return n, None


def main() -> int:
    check = "--check" in sys.argv[1:]
    drift = []
    oversize = False
    for fname, platform in TARGETS.items():
        target = ROOT / fname
        expected = build(platform)
        current = target.read_text(encoding="utf-8") if target.exists() else None

        n, level = check_size(fname, expected)
        if level == "over":
            oversize = True
            print(f"  ✗ {fname} {n} 字节，超 Codex 32 KiB 硬顶——会被静默截断，必须瘦身 standards/ 源")
        elif level == "warn":
            print(f"  ⚠ {fname} {n} 字节，逼近 32 KiB 上限（告警阈 {WARN_AT_BYTES}），注意增长")

        if check:
            if current != expected:
                drift.append(fname)
        else:
            if current != expected:
                target.write_text(expected, encoding="utf-8", newline="\n")
                print(f"  已生成 {fname}（{n} 字节）")
            else:
                print(f"  {fname} 已是最新（{n} 字节）")

    if oversize:
        return 1  # 无论 check 还是写入，超硬顶都失败

    if check:
        if drift:
            print("漂移检测失败，以下文件与 standards/ 源不一致：", ", ".join(drift))
            print("请运行：python tools/sync-standards.py")
            return 1
        print("漂移检测通过：CLAUDE.md / AGENTS.md 与 standards/ 源一致。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
