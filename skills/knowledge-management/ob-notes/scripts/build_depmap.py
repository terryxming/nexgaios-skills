#!/usr/bin/env python3
# build_depmap.py — ob-notes 依赖图生成与 MECE 校验
#
# 行为契约（见 references/maintenance.md 第 4 节，规则项 dependency-spec）：
#   纯只读：除生成 references/dependency-map.md 外不改任何文件；
#   不读写用户知识库；不联网；仅用 Python 标准库。
#
# 受控词表（controlled-vocab）唯一定义在 references/maintenance.md 第 1 节归属表，
# 本脚本在运行时从该表动态解析，不在代码内保存副本——彻底单一真相源。
#
# depends_on: dependency-spec, controlled-vocab, ssot-registry
#   （脚本非 markdown，无 frontmatter；依赖以本注释等价声明。
#    依赖 ssot-registry：解析逻辑与归属表格式耦合，表格式变则此处需同步。）

import sys
import re
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
MAINTENANCE = SKILL_ROOT / "references" / "maintenance.md"
OUTPUT = SKILL_ROOT / "references" / "dependency-map.md"
GENERATED_NOTICE = "本文件由 scripts/build_depmap.py 自动生成，请勿手动编辑。"


def load_vocab_and_homes():
    """从 maintenance.md 第 1 节归属表解析受控词表。
    返回 (vocab:set, declared_home:dict[rule -> filename])。
    表行格式： | `rule-id` | 含义 | 唯一家文件名 |
    """
    text = MAINTENANCE.read_text(encoding="utf-8")
    sec = re.search(r"##\s*1\..*?(?=\n##\s*2\.)", text, re.S)
    if not sec:
        sys.exit("致命：maintenance.md 未找到第 1 节归属表，无法解析受控词表。")
    block = sec.group(0)
    vocab, homes = set(), {}
    for m in re.finditer(r"^\|\s*`([a-z0-9-]+)`\s*\|[^|]*\|\s*([^|]+?)\s*\|\s*$", block, re.M):
        rule, home = m.group(1).strip(), m.group(2).strip()
        vocab.add(rule)
        homes[rule] = home
    if not vocab:
        sys.exit("致命：归属表解析为空，请检查 maintenance.md 第 1 节表格格式。")
    return vocab, homes


def parse_fm_list(block, key):
    # 字段位于 frontmatter 的 metadata 下，带缩进：`  provides: [...]`
    m = re.search(rf"^\s*{key}:\s*\[(.*?)\]\s*$", block, re.M)
    if not m or not m.group(1).strip():
        return []
    return [s.strip() for s in m.group(1).split(",") if s.strip()]


def collect_md(path):
    text = path.read_text(encoding="utf-8")
    fm = re.match(r"^---\n(.*?)\n---", text, re.S)
    block = fm.group(1) if fm else ""
    return parse_fm_list(block, "provides"), parse_fm_list(block, "depends_on")


def collect_script(path):
    text = path.read_text(encoding="utf-8")
    m = re.search(r"#\s*depends_on:\s*(.+)", text)
    deps = [s.strip() for s in m.group(1).split(",")] if m else []
    return [], deps


def main():
    vocab, declared_home = load_vocab_and_homes()

    nodes = {}
    for md in sorted(SKILL_ROOT.rglob("*.md")):
        if md.resolve() == OUTPUT.resolve():
            continue
        nodes[md.relative_to(SKILL_ROOT).as_posix()] = collect_md(md)
    for py in sorted(SKILL_ROOT.rglob("*.py")):
        nodes[py.relative_to(SKILL_ROOT).as_posix()] = collect_script(py)

    errors, warnings = [], []

    definer = {}
    for f, (pv, _) in nodes.items():
        for r in pv:
            definer.setdefault(r, []).append(f)
    for r, files in definer.items():
        if len(files) > 1:
            errors.append(f"[重复定义] '{r}' 被多个文件 provides：{', '.join(files)}（违反 SSOT）")
    defined = set(definer)

    for f, (pv, dp) in nodes.items():
        for r in pv + dp:
            if r not in vocab:
                errors.append(f"[未登记] {f} 使用了受控词表外的标识符 '{r}'")

    for f, (_, dp) in nodes.items():
        for r in dp:
            if r in vocab and r not in defined:
                errors.append(f"[悬空依赖] {f} 依赖 '{r}'，但无任何文件 provides 它")

    # 校验：归属表声明的唯一家 与 实际 provides 是否一致
    for r, home_name in declared_home.items():
        if r in definer:
            actual = definer[r][0]
            if actual.split("/")[-1] != home_name:
                errors.append(
                    f"[归属不符] '{r}' 归属表声明唯一家为 {home_name}，但实际由 {actual} 提供")

    for r in sorted(vocab - defined):
        warnings.append(f"[孤儿规则] 受控词表中的 '{r}' 尚无文件 provides（可能待实现）")

    if not errors:
        write_map(nodes, definer)

    print("=" * 60)
    print("ob-notes 依赖图校验")
    print("=" * 60)
    print(f"受控词表：从 maintenance.md 解析到 {len(vocab)} 个规则项")
    if warnings:
        print(f"\n警告 {len(warnings)} 项：")
        for w in warnings:
            print("  " + w)
    if errors:
        print(f"\n错误 {len(errors)} 项：")
        for e in errors:
            print("  " + e)
        print("\n校验未通过，未生成依赖图。请修复后重试。")
        sys.exit(1)
    print(f"\n校验通过。依赖图已生成：{OUTPUT.relative_to(SKILL_ROOT).as_posix()}")
    sys.exit(0)


def write_map(nodes, definer):
    L = [f"<!-- {GENERATED_NOTICE} -->", "", "# ob-notes 依赖图", "",
         f"> {GENERATED_NOTICE}",
         "> 修改 skill 后请运行 `python scripts/build_depmap.py` 刷新。", "",
         "## 按文件", "", "| 文件 | provides | depends_on |", "|---|---|---|"]
    for f in sorted(nodes):
        pv, dp = nodes[f]
        L.append(f"| `{f}` | {', '.join(pv) or '—'} | {', '.join(dp) or '—'} |")
    L += ["", "## 按规则项（反向索引）", "", "| 规则项 | 定义于 | 被谁依赖 |", "|---|---|---|"]
    dependents = {}
    for f, (_, dp) in nodes.items():
        for r in dp:
            dependents.setdefault(r, []).append(f)
    for r in sorted(set(definer) | set(dependents)):
        home = definer.get(r, ["—"])[0]
        deps = dependents.get(r, [])
        deps_str = ", ".join(f"`{d}`" for d in deps) if deps else "—"
        L.append(f"| `{r}` | `{home}` | {deps_str} |")
    # 显式用 LF 写出，避免 Windows 上 write_text 默认把 \n 转成 \r\n、
    # 导致每次校验都把 dependency-map.md 弄脏（与本脚本"纯只读"契约相悖）。
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
