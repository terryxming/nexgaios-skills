#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/check-handoff-sync.py — C2 收工 handoff 的机械兜底（ADR-0009，试行待验证）。

规则：一次 push 的提交范围内若动了 skills/first-party/** 或 docs/decisions/**，
必须同批更新根目录 handoff.md——防"改了正事、漏了交接"（纪律常驻 ≠ 执行器，
见 lessons-learned）。第三方收藏（skills/third-party/）不强制交接（ADR-0010）。

用法：python tools/check-handoff-sync.py <base-sha> <head-sha>
  CI 传 github.event.before / github.sha；base 为全零（新分支首推）时回退
  origin/main 的 merge-base；找不到基准则跳过（exit 0），不误伤。

零第三方依赖。
"""
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # Windows GBK 控制台直跑也能输出中文

ROOT = Path(__file__).resolve().parent.parent
ZERO = "0" * 40
WATCHED = ("skills/first-party/", "docs/decisions/")
HANDOFF = "handoff.md"


def git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(ROOT), *args],
                          capture_output=True, text=True, encoding="utf-8")


def main(base: str, head: str) -> int:
    if base == ZERO:
        mb = git("merge-base", "origin/main", head)
        if mb.returncode != 0 or not mb.stdout.strip():
            print("• 新分支且无 origin/main 基准，跳过 handoff 联动检查")
            return 0
        base = mb.stdout.strip()
    r = git("diff", "--name-only", f"{base}..{head}")
    if r.returncode != 0:
        print(f"✗ git diff {base[:12]}..{head[:12]} 失败：{r.stderr.strip()}")
        return 1
    files = [f for f in r.stdout.splitlines() if f]
    watched = [f for f in files if f.startswith(WATCHED)]
    if not watched:
        print("✅ handoff 联动检查：本次推送未动 skills/first-party/ 或 docs/decisions/")
        return 0
    if HANDOFF in files:
        print(f"✅ handoff 联动检查：{len(watched)} 个受关注变更，handoff.md 已同批更新")
        return 0
    print("✗ handoff 联动检查失败（C2 · ADR-0009）：动了 skills/first-party/ 或 docs/decisions/，但未更新 handoff.md")
    print("  受关注变更：\n    " + "\n    ".join(watched[:20]))
    print("  修复：覆盖重写 handoff.md（当前状态/下一步/未决问题/环境备忘/上次会话摘要）并纳入本次推送。")
    return 1


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("用法：python tools/check-handoff-sync.py <base-sha> <head-sha>")
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
