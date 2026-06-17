#!/usr/bin/env python3
"""Apple HIG 前端视觉改造的建议性静态检查。

脚本保持保守：它只捕捉常见的清晰度、动效、焦点和材质风险，
不能替代浏览器截图或人工视觉判断。
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


TEXT_EXTENSIONS = {
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
    ".htm",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".vue",
    ".svelte",
}

IGNORED_DIRS = {
    ".git",
    ".next",
    ".nuxt",
    ".svelte-kit",
    "coverage",
    "dist",
    "build",
    "node_modules",
    "out",
}


def iter_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in TEXT_EXTENSIONS:
            yield path


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def add_issue(issues, severity, code, path, line, message):
    issues.append(
        {
            "severity": severity,
            "code": code,
            "file": str(path),
            "line": line,
            "message": message,
        }
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default=".", help="要扫描的项目根目录")
    parser.add_argument("--json", action="store_true", help="仅输出 JSON")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    issues = []
    counters = {
        "files_scanned": 0,
        "backdrop_filter_count": 0,
        "has_focus_visible": False,
        "has_reduced_motion": False,
        "has_color_scheme": False,
        "has_viewport_meta": False,
    }

    negative_letter_spacing = re.compile(r"letter-spacing\s*:\s*-\d", re.I)
    viewport_font_size = re.compile(r"font-size\s*:\s*[^;]*(vw|vmin|vmax)", re.I)
    backdrop_filter = re.compile(r"backdrop-filter\s*:", re.I)
    focus_visible = re.compile(r":focus-visible|focusVisible")
    reduced_motion = re.compile(r"prefers-reduced-motion", re.I)
    color_scheme = re.compile(r"color-scheme|prefers-color-scheme", re.I)
    viewport_meta = re.compile(r"<meta[^>]+name=[\"']viewport[\"']", re.I)

    for path in iter_files(root):
        counters["files_scanned"] += 1
        text = read_text(path)
        rel = path.relative_to(root)

        if focus_visible.search(text):
            counters["has_focus_visible"] = True
        if reduced_motion.search(text):
            counters["has_reduced_motion"] = True
        if color_scheme.search(text):
            counters["has_color_scheme"] = True
        if viewport_meta.search(text):
            counters["has_viewport_meta"] = True

        matches = list(backdrop_filter.finditer(text))
        counters["backdrop_filter_count"] += len(matches)

        for match in negative_letter_spacing.finditer(text):
            add_issue(
                issues,
                "warning",
                "negative-letter-spacing",
                rel,
                line_number(text, match.start()),
                "除非品牌系统明确要求，否则 Apple HIG 风格 Web UI 不应使用负 letter-spacing。",
            )

        for match in viewport_font_size.finditer(text):
            add_issue(
                issues,
                "warning",
                "viewport-font-size",
                rel,
                line_number(text, match.start()),
                "正文或界面文字避免使用视口单位缩放；请使用响应式字阶或有安全边界的 clamp。",
            )

    if counters["backdrop_filter_count"] > 8:
        add_issue(
            issues,
            "warning",
            "glass-overuse",
            ".",
            0,
            f"发现 {counters['backdrop_filter_count']} 处 backdrop-filter 声明。请检查是否存在整页玻璃或重复玻璃滥用。",
        )

    if not counters["has_focus_visible"]:
        add_issue(
            issues,
            "warning",
            "missing-focus-visible",
            ".",
            0,
            "未发现 focus-visible 样式。被改动的交互控件应有可见键盘焦点状态。",
        )

    if not counters["has_reduced_motion"]:
        add_issue(
            issues,
            "warning",
            "missing-reduced-motion",
            ".",
            0,
            "未发现 prefers-reduced-motion 处理。带动效的 UI 应补充 reduced-motion fallback。",
        )

    if not counters["has_viewport_meta"] and any(root.glob("**/*.html")):
        add_issue(
            issues,
            "warning",
            "missing-viewport-meta",
            ".",
            0,
            "HTML 文件中未检测到 viewport meta。移动端 QA 可能不可靠。",
        )

    result = {"root": str(root), "counters": counters, "issues": issues}

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Apple HIG 静态检查：{root}")
        print(f"扫描文件数：{counters['files_scanned']}")
        print(f"Backdrop-filter 声明数：{counters['backdrop_filter_count']}")
        if not issues:
            print("未发现建议性问题。")
        else:
            for issue in issues:
                location = issue["file"]
                if issue["line"]:
                    location = f"{location}:{issue['line']}"
                print(f"[{issue['severity']}] {issue['code']} {location} - {issue['message']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
