#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Compare two Codex skill version directories by file content."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


IGNORE_DIRS = {".git", "node_modules", "__pycache__", ".pytest_cache", ".mypy_cache", "dist"}
IGNORE_SUFFIXES = {".pyc"}


def should_include(path: Path) -> bool:
    if any(part in IGNORE_DIRS for part in path.parts):
        return False
    if path.suffix in IGNORE_SUFFIXES:
        return False
    return path.is_file()


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def snapshot(root: Path) -> dict[str, str]:
    root = root.resolve()
    files: dict[str, str] = {}
    for path in root.rglob("*"):
        if should_include(path):
            files[path.relative_to(root).as_posix()] = file_hash(path)
    return files


def compare(old_dir: Path, new_dir: Path) -> dict[str, list[str]]:
    old = snapshot(old_dir)
    new = snapshot(new_dir)
    old_keys = set(old)
    new_keys = set(new)
    common = old_keys & new_keys
    return {
        "added": sorted(new_keys - old_keys),
        "removed": sorted(old_keys - new_keys),
        "modified": sorted(path for path in common if old[path] != new[path]),
        "unchanged": sorted(path for path in common if old[path] == new[path]),
    }


def render_markdown(result: dict[str, list[str]]) -> str:
    lines = ["# 版本目录对比", ""]
    for key, title in [
        ("added", "新增"),
        ("removed", "移除"),
        ("modified", "修改"),
        ("unchanged", "未变化"),
    ]:
        values = result[key]
        lines.append(f"## {title} ({len(values)})")
        if values:
            lines.extend(f"- `{value}`" for value in values)
        else:
            lines.append("- 无")
        lines.append("")
    return "\n".join(lines).rstrip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare two skill version directories.")
    parser.add_argument("old_dir", help="Old skill version directory.")
    parser.add_argument("new_dir", help="New skill version directory.")
    parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    args = parser.parse_args()

    old_dir = Path(args.old_dir)
    new_dir = Path(args.new_dir)
    if not old_dir.is_dir():
        parser.error(f"old_dir is not a directory: {old_dir}")
    if not new_dir.is_dir():
        parser.error(f"new_dir is not a directory: {new_dir}")

    result = compare(old_dir, new_dir)
    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(render_markdown(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
