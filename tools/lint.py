#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/lint.py — 仓库级 + skill 级硬门禁（议题 4 · W1/W2）。

仓库级（W1，零外部依赖）：
  ① 路径 ASCII 检查      —— 私有纪律 A3（标识符/文件名/路径用英文 kebab-case）
  ② ADR 留痕格式          —— 私有纪律 A1 / 通用纪律 ⑨（难逆转决策进 docs/decisions 并附据）
  ③ 纪律漂移校验          —— 私有纪律 B（调用 check-discipline-drift.py）
skill 级（W2，需 skills-ref）：
  ④ 桶一 · skills-ref validate —— 私有纪律 E 桶一（frontmatter/命名/结构 17 项）
  ⑤ 桶二 · 可移植            —— 私有纪律 E 桶二（skill 源不写死机器路径）
  ⑥ 桶二 · 中文化兵底         —— 私有纪律 E 桶二（SKILL.md 至少含中文）
  ⑦ 桶二 · 无杂物文件          —— ADR-0005/0006（顶层禁 README.md 等重复文档；dev-log/CHANGELOG 属域内开发文件例外）
  ⑧ 桶二 · metadata.version   —— 纪律 G③ 版本门禁前置（版本历史 = git tag + metadata.version）
  ⑨ marketplace↔tag 一致性    —— 纪律 G④ 发布一致性（ADR-0009：条目 ref 须为已存在 tag，
                                 version 与该 tag 处的 metadata.version 一致）
  （dist/晋升一致性已随单仓公开制取消，见 ADR-0008）

二值门禁（见纪律 A5）：任一 error → 退出 1（CI 挡）；不设 warning 中间态。
依赖：skills-ref（桶一，ADR-0004 选项 A）；其余零外部依赖。无 skill 时 ④⑤⑥ 空过。
用法：python tools/lint.py
"""
from __future__ import annotations

import json
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


def skill_dirs() -> list[Path]:
    """skills/ 下每个含 SKILL.md 的目录 = 一个 skill 源。"""
    root = ROOT / "skills"
    if not root.is_dir():
        return []
    return sorted(d for d in root.iterdir() if d.is_dir() and (d / "SKILL.md").is_file())


def check_skills_ref() -> None:
    """桶一：委托官方 skills-ref validate（frontmatter/命名/结构 17 项）。"""
    dirs = skill_dirs()
    if not dirs:
        print("• 无 skill，跳过 skills-ref 校验（桶一）")
        return
    try:
        from skills_ref import validate
    except ImportError:
        errors.append("skills-ref 未安装（桶一硬门禁依赖）：pip install -r tools/requirements.txt")
        return
    bad = 0
    for d in dirs:
        for e in validate(d):
            bad += 1
            errors.append(f"skills-ref · {d.name}：{e}")
    if not bad:
        print(f"✅ skills-ref 校验（桶一）：{len(dirs)} 个 skill 全通过")


def check_portability() -> None:
    """桶二：skill 源不写死机器路径（E.3 可移植）。"""
    dirs = skill_dirs()
    if not dirs:
        print("• 无 skill，跳过可移植检查（桶二）")
        return
    # 机器路径：Windows 盘符路径（负向前瞻排除 http(s):/ 等多字母 scheme）、Unix 家目录绝对路径
    pat = re.compile(r"(?<![A-Za-z])[A-Za-z]:[\\/]|/(?:Users|home|root)/")
    hits: list[str] = []
    for d in dirs:
        for f in d.rglob("*"):
            if not f.is_file():
                continue
            rel = f.relative_to(d)
            if "evals" in rel.parts:
                continue  # 评测用例除外：官方 skill-creator 明确建议触发查询写实机路径（贴近真实场景）
            if len(rel.parts) == 1 and rel.name in ("dev-log.md", "CHANGELOG.md"):
                continue  # 域内开发文件除外：历史忠实记录含真机路径是本性，不分发（ADR-0006）
            try:
                text = f.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue  # 跳过二进制/不可读
            for i, line in enumerate(text.splitlines(), 1):
                if pat.search(line):
                    hits.append(f"{f.relative_to(ROOT).as_posix()}:{i}: {line.strip()[:80]}")
    if hits:
        errors.append("skill 源含机器路径（E.3 可移植）：\n    " + "\n    ".join(hits))
    else:
        print(f"✅ 可移植检查（桶二）：{len(dirs)} 个 skill 无机器路径")


def check_chinese() -> None:
    """桶二：中文化兵底——SKILL.md 至少含中文（防纯英文产出）。"""
    dirs = skill_dirs()
    if not dirs:
        print("• 无 skill，跳过中文化兵底（桶二）")
        return
    cjk = re.compile("[一-鿿]")
    bad = [f"{d.name}/SKILL.md 无中文字符（E.4 中文化兵底）"
           for d in dirs if not cjk.search((d / "SKILL.md").read_text(encoding="utf-8"))]
    if bad:
        errors.extend(bad)
    else:
        print(f"✅ 中文化兵底（桶二）：{len(dirs)} 个 SKILL.md 均含中文")


def check_clutter() -> None:
    """桶二：skill 顶层禁与 SKILL.md 重复的文档（官方 skill-creator 点名）。

    只查顶层：assets/ 内的 README 等可能是合法模板资源，不误伤。
    dev-log.md / CHANGELOG.md 属域内开发文件，随 skill 入库并一同分发（ADR-0008）。
    """
    dirs = skill_dirs()
    if not dirs:
        print("• 无 skill，跳过杂物检查（桶二）")
        return
    clutter = {"README.md", "INSTALLATION_GUIDE.md", "QUICK_REFERENCE.md"}
    bad = [f"{d.name}/{f.name} 属杂物文件（与 SKILL.md 职责重复，不入 skill，见 ADR-0005/0006）"
           for d in dirs for f in d.iterdir() if f.is_file() and f.name in clutter]
    if bad:
        errors.extend(bad)
    else:
        print(f"✅ 杂物检查（桶二）：{len(dirs)} 个 skill 顶层无杂物")


def check_version() -> None:
    """桶二：SKILL.md 须有 metadata.version（G③ 版本门禁前置）。"""
    dirs = skill_dirs()
    if not dirs:
        print("• 无 skill，跳过 version 检查（桶二）")
        return
    try:
        from skills_ref import read_properties
    except ImportError:
        return  # 依赖缺失已由桶一报错，不重复
    bad = []
    unparsed = 0
    for d in dirs:
        try:
            props = read_properties(d)
        except Exception:
            unparsed += 1  # 结构/frontmatter 问题由桶一报错，此处不虚报绿
            continue
        if not (props.metadata or {}).get("version"):
            bad.append(f"{d.name}/SKILL.md 缺 metadata.version（G③：版本历史 = git tag + metadata.version）")
    if bad:
        errors.extend(bad)
    elif unparsed:
        print(f"• version 检查（桶二）：{len(dirs) - unparsed} 个通过，{unparsed} 个 frontmatter 不可解析（见桶一报错）")
    else:
        print(f"✅ version 检查（桶二）：{len(dirs)} 个 skill 均有 metadata.version")


def _skill_md_version(text: str) -> str | None:
    """从 SKILL.md 全文取 frontmatter 里的 metadata.version。"""
    fm = re.match(r"^---\n(.*?)\n---", text, re.S)
    if not fm:
        return None
    m = re.search(r"^\s*version:\s*[\"']?([0-9A-Za-z.\-]+)", fm.group(1), re.M)
    return m.group(1) if m else None


def check_marketplace() -> None:
    """⑨ G④ 发布一致性：marketplace 条目 ref 须为已存在 tag，version 与该 tag 处一致（ADR-0009）。"""
    mp = ROOT / ".claude-plugin" / "marketplace.json"
    if not mp.is_file():
        print("• 无 marketplace.json，跳过发布一致性检查")
        return
    try:
        data = json.loads(mp.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"marketplace.json 不可解析：{e}")
        return
    before = len(errors)
    plugins = data.get("plugins", [])
    for entry in plugins:
        name = entry.get("name", "?")
        version = entry.get("version")
        src = entry.get("source")
        if isinstance(src, dict) and src.get("source") == "git-subdir":
            ref, path = src.get("ref"), (src.get("path") or "").rstrip("/")
            if not ref:
                continue  # 无 ref = 跟默认分支，无 tag 可校
            tag = subprocess.run(["git", "-C", str(ROOT), "tag", "-l", ref],
                                 capture_output=True, text=True, encoding="utf-8").stdout.strip()
            if not tag:
                errors.append(f"marketplace · {name}：ref '{ref}' 不是已存在的 git tag（G④：发布 = merge + tag）")
                continue
            show = subprocess.run(["git", "-C", str(ROOT), "show", f"{ref}:{path}/SKILL.md"],
                                  capture_output=True, text=True, encoding="utf-8")
            if show.returncode != 0:
                errors.append(f"marketplace · {name}：tag '{ref}' 下不存在 {path}/SKILL.md")
                continue
            tag_ver = _skill_md_version(show.stdout)
            if version and tag_ver and version != tag_ver:
                errors.append(f"marketplace · {name}：条目 version={version} 与 tag '{ref}' 处 "
                              f"metadata.version={tag_ver} 不一致（G④ 发布一致性）")
        elif isinstance(src, str) and src.startswith("./"):
            skill_md = ROOT / src.lstrip("./") / "SKILL.md"
            if not skill_md.is_file():
                errors.append(f"marketplace · {name}：相对路径 {src} 下不存在 SKILL.md")
                continue
            tree_ver = _skill_md_version(skill_md.read_text(encoding="utf-8"))
            if version and tree_ver and version != tree_ver:
                errors.append(f"marketplace · {name}：条目 version={version} 与 {src}/SKILL.md 的 "
                              f"metadata.version={tree_ver} 不一致（相对路径源装的即工作树）")
    if len(errors) == before:
        print(f"✅ marketplace↔tag 一致性（G④）：{len(plugins)} 个条目通过")


def main() -> int:
    print("== 仓库级 + skill 级 lint（W1/W2）==")
    check_paths()
    check_adrs()
    check_drift()
    check_skills_ref()
    check_portability()
    check_chinese()
    check_clutter()
    check_version()
    check_marketplace()

    if errors:
        print("\n✗ lint 失败：")
        for e in errors:
            print("  - " + e)
        return 1
    print("\n✅ lint 全绿")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
