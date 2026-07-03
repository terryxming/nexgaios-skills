#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/install.py — 本仓库 skill 的本机离线安装脚本。

按 ADR-0008，skill 目录本身就是发布单元；本脚本只做完整目录复制，
不做构建、净化或文件排除。

用法（默认安装到本机两端用户级 skills 目录）：
  python tools/install.py --list
  python tools/install.py ob-notes
  python tools/install.py ob-notes --force
  python tools/install.py ob-notes --dest D:/tmp/skills   # 只装到自定义目录

默认目标：Claude Code `~/.claude/skills`（官方 plugins-reference：personal scope，
对所有项目生效）与 Codex `$CODEX_HOME/skills`（无 CODEX_HOME 时 `~/.codex/skills`，
同官方 skill-installer）。外部用户另可走 Claude plugin marketplace（见 README）。
"""
from __future__ import annotations

import argparse
import os
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")  # Windows GBK 控制台直跑也能输出中文

ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = ROOT / "skills"


class InstallError(Exception):
    pass


@dataclass(frozen=True)
class Target:
    name: str
    dest_root: Path


def codex_home() -> Path:
    return Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))


def default_targets() -> list[Target]:
    return [
        Target("claude", Path.home() / ".claude" / "skills"),
        Target("codex", codex_home() / "skills"),
    ]


def skill_dirs() -> list[Path]:
    if not SKILLS_DIR.is_dir():
        return []
    return sorted(d for d in SKILLS_DIR.iterdir() if d.is_dir() and (d / "SKILL.md").is_file())


def find_skill(name: str) -> Path:
    src = SKILLS_DIR / name
    if not src.is_dir() or not (src / "SKILL.md").is_file():
        available = ", ".join(d.name for d in skill_dirs()) or "无"
        raise InstallError(f"未找到 skill：{name}。可安装项：{available}")
    return src


def copy_skill(src: Path, target: Target, force: bool) -> Path:
    dest = target.dest_root / src.name
    if dest.exists():
        if not force:
            raise InstallError(f"{target.name} 目标已存在：{dest}（如需覆盖，加 --force）")
        if not dest.is_dir():
            raise InstallError(f"{target.name} 目标存在但不是目录：{dest}")
        shutil.rmtree(dest)
    target.dest_root.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dest)
    return dest


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="完整复制本仓库 skills/<name> 到本机 Claude Code 与 Codex 的用户级 skills 目录，或自定义目录。")
    parser.add_argument("skills", nargs="*", help="要安装的 skill 名称；为空时配合 --list 查看")
    parser.add_argument("--list", action="store_true", help="列出本仓库可安装的 skill")
    parser.add_argument(
        "--dest",
        help="自定义目标 skills 根目录；默认安装到 Claude ~/.claude/skills 与 Codex $CODEX_HOME/skills",
    )
    parser.add_argument("--force", action="store_true", help="目标已存在时先删除再复制")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)

    if args.list:
        dirs = skill_dirs()
        if not dirs:
            print("本仓库暂无可安装 skill。")
            return 0
        print("本仓库可安装 skill：")
        for d in dirs:
            print(f"- {d.name}")
        return 0

    if not args.skills:
        raise InstallError("请提供至少一个 skill 名称，或使用 --list 查看可安装项。")

    targets = [Target("custom", Path(args.dest).expanduser())] if args.dest else default_targets()
    for skill_name in args.skills:
        src = find_skill(skill_name)
        for target in targets:
            dest = copy_skill(src, target, args.force)
            print(f"已安装 {skill_name} -> {target.name}: {dest}")

    print("安装完成。重启对应 agent 后生效。")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except InstallError as exc:
        print(f"错误：{exc}", file=sys.stderr)
        raise SystemExit(1)
