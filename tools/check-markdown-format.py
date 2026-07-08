#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/check-markdown-format.py — §11「markdown 写作纪律」机械层审查（只读，纯确定性）。

对照 CLAUDE.md/AGENTS.md 的 §11 逐文件查，只覆盖可机械判定的"排版层"，不做"判断层"
（行内 code 用词、分号语义、语气等需人/agent 判断的项）。

检查项：
  H1  恰一个 `# `，且为 frontmatter（若有）后的首个内容行。
  B1  连续 2+ 空行只允许紧邻在标题（一级标题除外）前；别处出现即违规。
  B2  任何位置不得连续 3+ 空行。
  B3  非一级标题（`## `–`###### `）前空行数：紧跟 H1 时应为 1（§11「# 后…第一个 ##…空一行」）；
      其余一律 2（§11「标题前空两行」，一级标题外所有层级）。
  B4  一级标题 `# ` 后应空 1 行。
  M   无序列表标记同文档统一（只用 `-`）。
  F   围栏代码块起始 ``` 必须带语言标注。
  S   标题不跳级（`##` 后不直接出现 `####`）。
围栏块内部一律跳过；文件首为 `---…---` 视作 YAML frontmatter（skills 规范强制，§12 既定惯例优先）。

用法：python tools/check-markdown-format.py <file> [<file>...]   # 全 OK → 退出 0；有违规 → 打印并退出 1

注意：本工具只认机械规则、不认"已裁决豁免"——如 references 的 `<a id>` 页内锚点紧贴 `##`、
dev-log 的 append-only 无 H1 结构、生成物 `dependency-map.md`，都会被照常报为违规，属预期，需人工甄别。
故本工具是审查/复核辅助，暂未接入 lint.py 硬门禁（接门禁需先设计豁免机制）。

零第三方依赖。
"""
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # Windows GBK 控制台直跑也能输出中文


def fence_mask(lines):
    """返回每行是否处于围栏代码块内部（含起止行本身标 True）。"""
    inside = False
    mask = []
    for ln in lines:
        s = ln.lstrip()
        if s.startswith("```"):
            mask.append(True)
            inside = not inside
        else:
            mask.append(inside)
    return mask


def heading_level(s):
    """标题层级：`# `→1 … `###### `→6；非标题→0。"""
    j = 0
    while j < len(s) and s[j] == "#":
        j += 1
    return j if (1 <= j <= 6 and j < len(s) and s[j] == " ") else 0


def audit(path: Path):
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")
    if lines and lines[-1] == "":
        lines = lines[:-1]  # 末尾换行不算空行
    n = len(lines)
    mask = fence_mask(lines)
    v = []

    def code(i):
        return mask[i] if 0 <= i < n else False

    # frontmatter：文件首行为 `---` 时，到下一 `---` 为 YAML frontmatter（skills 规范强制的外部惯例，
    # §12 既定惯例优先）。H1 应出现在 frontmatter 之后的首个内容行——不算"非首行"违规。
    content_start = 0
    has_fm = False
    if lines and lines[0].strip() == "---":
        for t in range(1, n):
            if lines[t].strip() == "---":
                content_start = t + 1
                has_fm = True
                break
    # H1
    h1 = [i for i, l in enumerate(lines) if l.startswith("# ") and not code(i)]
    first_content = content_start
    while first_content < n and lines[first_content].strip() == "":
        first_content += 1
    if not h1:
        v.append("H1: 缺一级标题 `# `（若为 append-only 日志文件，属既定结构，交判断）")
    else:
        if h1[0] != first_content:
            where = "frontmatter 后首个内容行" if has_fm else "文件开头"
            v.append(f"H1: 一级标题在第 {h1[0]+1} 行，非{where}（第 {first_content+1} 行）")
        if len(h1) > 1:
            v.append(f"H1: 出现 {len(h1)} 个一级标题（应仅 1）：行 {[i+1 for i in h1]}")

    # 空行游程
    i = 0
    while i < n:
        if lines[i].strip() == "" and not code(i):
            j = i
            while j < n and lines[j].strip() == "" and not code(j):
                j += 1
            run = j - i
            nxt = lines[j] if j < n else "<EOF>"
            nxt_heading = heading_level(nxt) >= 2  # 非一级标题
            if run >= 3:
                v.append(f"B2 行{i+1}-{j}: 连续 {run} 空行（禁 3+），后接 {nxt[:36]!r}")
            elif run == 2 and not nxt_heading:
                v.append(f"B1 行{i+1}-{j}: 连续 2 空行但后接非标题，后接 {nxt[:44]!r}")
            i = j
        else:
            i += 1

    # B3 / B4：标题前后空行
    for k in range(n):
        ln = lines[k]
        if code(k):
            continue
        if heading_level(ln) >= 2:
            b = 0
            t = k - 1
            while t >= 0 and lines[t].strip() == "":
                b += 1
                t -= 1
            prev = lines[t] if t >= 0 else "<BOF>"
            after_h1 = heading_level(prev) == 1
            exp = 1 if after_h1 else 2
            if b != exp:
                v.append(f"B3 行{k+1}: `{ln[:26]}` 前 {b} 空行（应 {exp}；前一非空 {prev[:24]!r}）")
        if ln.startswith("# ") and not ln.startswith("## "):
            a = 0
            t = k + 1
            while t < n and lines[t].strip() == "":
                a += 1
                t += 1
            if t < n and a != 1:
                v.append(f"B4 行{k+1}: 一级标题后 {a} 空行（应 1）")

    # M：无序列表标记
    for k in range(n):
        if code(k):
            continue
        s = lines[k].lstrip()
        if s.startswith("* ") or s.startswith("+ "):
            v.append(f"M 行{k+1}: 无序列表用 `{s[0]}`（应统一 `-`）：{lines[k].strip()[:40]!r}")

    # F：围栏语言
    inside = False
    for k in range(n):
        s = lines[k].lstrip()
        if s.startswith("```"):
            if not inside and s[3:].strip() == "":
                v.append(f"F 行{k+1}: 围栏代码块缺语言标注")
            inside = not inside

    # S：标题跳级 ## -> ####（无 ###）
    last_h = 0
    for k in range(n):
        if code(k):
            continue
        s = lines[k]
        lvl = 0
        while lvl < len(s) and s[lvl] == "#":
            lvl += 1
        if 1 <= lvl <= 6 and lvl < len(s) and s[lvl] == " ":
            if last_h and lvl > last_h + 1:
                v.append(f"S 行{k+1}: 标题从 h{last_h} 跳到 h{lvl}（跳级）：{s[:30]!r}")
            last_h = lvl
    return v


def main() -> int:
    if len(sys.argv) < 2:
        print("用法：python tools/check-markdown-format.py <file> [<file>...]")
        return 2
    any_bad = False
    for arg in sys.argv[1:]:
        vs = audit(Path(arg))
        if vs:
            any_bad = True
            print(f"=== {arg} — {len(vs)} 项 ===")
            for x in vs:
                print("  " + x)
        else:
            print(f"=== {arg} — OK ===")
    return 1 if any_bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
