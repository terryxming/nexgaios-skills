#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Inspect a Codex skill directory for structure and lifecycle issues."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


REQUIRED_ROOT_FILES = ["skill.yaml", "SKILL.md", "CHANGELOG.md"]
REQUIRED_SKILL_FIELDS = ["id", "domain", "version", "entry", "status"]
SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$")


@dataclass
class Finding:
    severity: str
    code: str
    message: str
    path: str


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def clean_scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_simple_yaml(path: Path) -> dict[str, Any]:
    data: dict[str, Any] = {}
    current_section: str | None = None

    for raw_line in read_text(path).splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        line = raw_line.strip()
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = clean_scalar(value)

        if indent == 0:
            if value:
                data[key] = value
                current_section = None
            else:
                data[key] = {}
                current_section = key
            continue

        if current_section and isinstance(data.get(current_section), dict):
            data[current_section][key] = value

    return data


def parse_frontmatter(path: Path) -> dict[str, str]:
    text = read_text(path)
    if not text.startswith("---"):
        return {}
    match = re.match(r"^---\s*\n([\s\S]*?)\n---\s*\n", text)
    if not match:
        return {}
    fields: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = clean_scalar(value)
    return fields


def current_changelog_entry(changelog: str, version: str) -> str | None:
    escaped = re.escape(version)
    match = re.search(
        rf"(?:^|\n)##\s+v?{escaped}[^\n]*\n([\s\S]*?)(?=\n##\s+|\s*$)",
        changelog,
    )
    if not match:
        return None
    return match.group(1).strip()


def first_changelog_version(changelog: str) -> str | None:
    match = re.search(r"(?:^|\n)##\s+(v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)", changelog)
    if not match:
        return None
    return match.group(1).lstrip("v")


def inspect_skill(skill_dir: Path) -> list[Finding]:
    findings: list[Finding] = []
    root = skill_dir.resolve()

    if not root.exists() or not root.is_dir():
        return [Finding("error", "missing-dir", "目标 skill 目录不存在。", str(skill_dir))]

    def add(severity: str, code: str, message: str, path: Path | str) -> None:
        findings.append(Finding(severity, code, message, str(path)))

    for filename in REQUIRED_ROOT_FILES:
        path = root / filename
        if not path.exists():
            add("error", f"missing-{filename.lower()}", f"缺少必需文件 {filename}。", path)

    yaml_path = root / "skill.yaml"
    skill: dict[str, Any] = {}
    if yaml_path.exists():
        skill = parse_simple_yaml(yaml_path)
        for field in REQUIRED_SKILL_FIELDS:
            if not skill.get(field):
                add("error", f"missing-field-{field}", f"skill.yaml 缺少字段 {field}。", yaml_path)

        version = str(skill.get("version", ""))
        if version and not SEMVER_RE.match(version):
            add("error", "invalid-version", f"版本号不是有效 SemVer：{version}。", yaml_path)

        release = skill.get("release")
        tag = release.get("tag") if isinstance(release, dict) else ""
        skill_id = str(skill.get("id", ""))
        expected_tag = f"{skill_id}@{version}" if skill_id and version else ""
        if expected_tag and tag and tag != expected_tag:
            add("warning", "release-tag-mismatch", f"release.tag 应为 {expected_tag}，当前是 {tag}。", yaml_path)

        entry = str(skill.get("entry", "SKILL.md") or "SKILL.md")
        if not (root / entry).exists():
            add("error", "missing-entry", f"入口文件不存在：{entry}。", root / entry)

    skill_md = root / str(skill.get("entry", "SKILL.md") or "SKILL.md")
    if skill_md.exists():
        fm = parse_frontmatter(skill_md)
        if not fm:
            add("error", "missing-frontmatter", "SKILL.md 缺少 YAML frontmatter。", skill_md)
        else:
            for field in ["name", "description"]:
                if not fm.get(field):
                    add("error", f"missing-frontmatter-{field}", f"frontmatter 缺少 {field}。", skill_md)
            unexpected = sorted(set(fm) - {"name", "description"})
            if unexpected:
                add("warning", "extra-frontmatter-fields", f"frontmatter 建议只保留 name 和 description：{', '.join(unexpected)}。", skill_md)
            if "……" in fm.get("description", "") or "TODO" in fm.get("description", "").upper():
                add("error", "placeholder-description", "frontmatter description 仍含占位文本。", skill_md)
            if skill.get("id") and fm.get("name") and fm["name"] != skill["id"]:
                add("warning", "name-id-mismatch", f"frontmatter name 与 skill.yaml id 不一致：{fm['name']} != {skill['id']}。", skill_md)

    changelog_path = root / "CHANGELOG.md"
    if changelog_path.exists() and skill.get("version"):
        changelog = read_text(changelog_path)
        version = str(skill["version"])
        entry = current_changelog_entry(changelog, version)
        if entry is None:
            add("error", "missing-changelog-version", f"CHANGELOG.md 未找到 v{version} 对应条目。", changelog_path)
        elif not entry.strip():
            add("error", "empty-changelog-version", f"CHANGELOG.md 中 v{version} 条目为空。", changelog_path)

        first_version = first_changelog_version(changelog)
        if first_version and first_version != version:
            add("warning", "changelog-not-latest-first", f"CHANGELOG.md 首个版本是 v{first_version}，当前 skill.yaml 版本是 v{version}。", changelog_path)

        for section in ["新增", "变更", "修复", "移除", "测试", "生命周期"]:
            if entry is not None and f"### {section}" not in entry:
                add("warning", "missing-changelog-section", f"当前版本条目缺少“{section}”小节。", changelog_path)

    if not (root / "references").exists():
        add("warning", "missing-references-dir", "缺少 references 目录；复杂 skill 通常应拆分引用资料。", root / "references")

    return findings


def render_markdown(findings: list[Finding]) -> str:
    if not findings:
        return "未发现结构性问题。"
    lines = ["# Skill 体检结果", ""]
    for finding in findings:
        lines.append(f"- [{finding.severity.upper()}] {finding.code}: {finding.message} ({finding.path})")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect a Codex skill directory.")
    parser.add_argument("skill_dir", help="Path to the skill directory.")
    parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    parser.add_argument("--fail-on-error", action="store_true", help="Exit with code 1 when errors exist.")
    parser.add_argument("--quiet", action="store_true", help="Only print findings when warnings or errors exist.")
    args = parser.parse_args()

    findings = inspect_skill(Path(args.skill_dir))
    has_error = any(f.severity == "error" for f in findings)

    if findings or not args.quiet:
        if args.format == "json":
            print(json.dumps([asdict(f) for f in findings], ensure_ascii=False, indent=2))
        else:
            print(render_markdown(findings))

    if args.fail_on_error and has_error:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
