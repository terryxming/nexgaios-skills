#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/lint.py — 仓库级硬门禁（议题 4 · W1）。

聚合三条已认可的硬约束（能脚本化的纪律进门禁，不靠自觉）：
  ① 路径 ASCII 检查      —— 私有纪律 A3（标识符/文件名/路径用英文 kebab-case）
  ② ADR 留痕格式          —— 私有纪律 A1 / 通用纪律 ⑨（难逆转决策进 docs/decisions 并附据）
  ③ 纪律漂移校验          —— 私有纪律 B（调用 check-discipline-drift.py）

二值门禁（见纪律 A5）：任一 error → 退出 1（CI 挡）；不设 warning 中间态。零第三方依赖。
用法：python tools/lint.py
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # Windows 直跑也能输出中文

ROOT = Path(__file__).resolve().parent.parent
errors: list[str] = []


def tracked_paths() -> list[str]:
    """git 跟踪的文件路径；-z 原样输出，绕开 core.quotepath 的八进制转义。"""
    out = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "-z"],
        capture_output=True, check=True,
    ).stdout
    return [p for p in out.decode("utf-8").split("\0") if p]


def check_paths() -> None:
    bad = [p for p in tracked_paths() if any(ord(c) > 127 for c in p)]
    if bad:
        errors.append("路径含非 ASCII 字符（A3：标识符/路径须英文 kebab-case）：\n    "
                      + "\n    ".join(bad))
    else:
        print("✅ 路径 ASCII 检查：全部 tracked 路径均为 ASCII")


def check_adrs() -> None:
    adrs = sorted((ROOT / "docs" / "decisions").glob("[0-9][0-9][0-9][0-9]-*.md"))
    if not adrs:
        print("• 无 ADR，跳过 ADR 格式检查")
        return
    for adr in adrs:
        text = adr.read_text(encoding="utf-8")
        if "状态" not in text:
            errors.append(f"ADR {adr.name} 缺「状态」")
        if not re.search(r"证据|来源|依据", text):
            errors.append(f"ADR {adr.name} 缺「证据/来源/依据」段（A1：决策须留痕附据）")
    print(f"✅ ADR 格式检查：核对 {len(adrs)} 篇")


def check_drift() -> None:
    env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}
    r = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "check-discipline-drift.py")],
        capture_output=True, text=True, encoding="utf-8", env=env,
    )
    sys.stdout.write(r.stdout)
    if r.returncode != 0:
        errors.append("纪律漂移校验失败（见上）")


def main() -> int:
    print("== 仓库级 lint（W1）==")
    check_paths()
    check_adrs()
    check_drift()

    if errors:
        print("\n✗ lint 失败：")
        for e in errors:
            print("  - " + e)
        return 1
    print("\n✅ lint 全绿")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
