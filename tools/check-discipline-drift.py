#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-discipline-drift.py — 工程纪律双份一致性门禁（对应私有纪律 B，选项 B）。

背景：工程纪律须同时常驻 CLAUDE.md 与 AGENTS.md（AGENTS.md 无 import，两平台各读各的，
见 ADR-0002）。二者的"共享段"（DISCIPLINE:SHARED 之间）必须逐字节一致；本脚本做机械校验，
使"就地编辑两份 + 漂移不了"成立。另做体积护栏，防 AGENTS.md 超 Codex project_doc_max_bytes。

用法：python tools/check-discipline-drift.py   # 一致且不超限 → 退出 0；否则打印原因 → 退出 1

零第三方依赖。
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = ["CLAUDE.md", "AGENTS.md"]

BEGIN = "DISCIPLINE:SHARED BEGIN"
END = "<!-- DISCIPLINE:SHARED END -->"

# 体积护栏：本仓库要求 Codex project_doc_max_bytes = 128 KiB（见 ADR-0002 / config.toml）。
HARD_CAP_BYTES = 128 * 1024      # 128 KiB


def shared_region(text: str, fname: str) -> str:
    if BEGIN not in text or END not in text:
        raise SystemExit(f"✗ {fname} 缺少 DISCIPLINE:SHARED 标记，无法校验")
    b = text.index(BEGIN)
    b_end = text.index("-->", b) + len("-->")
    e = text.index(END)
    return text[b_end:e]


def first_diff_line(a: str, b: str) -> str:
    la, lb = a.splitlines(), b.splitlines()
    for i in range(min(len(la), len(lb))):
        if la[i] != lb[i]:
            return f"第 {i+1} 行起不同：\n    CLAUDE: {la[i]!r}\n    AGENTS: {lb[i]!r}"
    if len(la) != len(lb):
        return f"行数不同：CLAUDE {len(la)} 行 vs AGENTS {len(lb)} 行"
    return "（字节级不同但逐行相同，疑为行尾/空白差异）"


def main() -> int:
    texts = {f: (ROOT / f).read_text(encoding="utf-8") for f in FILES}
    regions = {f: shared_region(t, f) for f, t in texts.items()}

    rc = 0
    # ① 共享段一致性
    if regions["CLAUDE.md"] == regions["AGENTS.md"]:
        n = len(regions["CLAUDE.md"].encode("utf-8"))
        print(f"✅ 共享段逐字节一致（{n} 字节）")
    else:
        print("✗ 共享段漂移：CLAUDE.md 与 AGENTS.md 的 DISCIPLINE:SHARED 段不一致")
        print("  " + first_diff_line(regions["CLAUDE.md"], regions["AGENTS.md"]))
        print("  修复：以正确的一份为准，同步另一份，使二者共享段一致。")
        rc = 1

    # ② 体积护栏
    for f, t in texts.items():
        b = len(t.encode("utf-8"))
        if b > HARD_CAP_BYTES:
            print(f"✗ {f} {b} 字节，超 128 KiB 硬顶——Codex 会静默截断，必须精简")
            rc = 1
        else:
            print(f"✅ {f} {b} 字节，在 128 KiB 内")

    return rc


if __name__ == "__main__":
    raise SystemExit(main())
