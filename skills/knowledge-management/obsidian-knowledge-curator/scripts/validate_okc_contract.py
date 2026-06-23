from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]


def read(relpath: str) -> str:
    return (ROOT / relpath).read_text(encoding="utf-8")


def require(name: str, condition: bool) -> None:
    if not condition:
        raise AssertionError(name)


def main() -> int:
    skill_yaml = read("skill.yaml")
    changelog = read("CHANGELOG.md")
    skill = read("SKILL.md")
    refs = read("references/README.md")
    lifecycle = read("references/lifecycle-policy.md")
    layout = read("references/markdown-layout-patterns.md")
    project_memory = read("references/project-memory.md")
    tests = read("tests/README.md")
    template = read("assets/okc-showcase-template.md")
    impact = read("impact.yaml")
    impact_console = read("impact/console.html")
    impact_readme = read("impact/README.md")

    version_match = re.search(r"^version:\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$", skill_yaml, re.M)
    require("skill.yaml must contain version", version_match is not None)
    version = version_match.group(1)
    require("release tag must match version", f"obsidian-knowledge-curator@{version}" in skill_yaml)
    require("CHANGELOG must contain current version", f"## {version} - " in changelog)

    require("SKILL.md must route skill maintenance", "维护 skill 自身" in skill)
    require("SKILL.md must mention project-memory sync after skill changes", "修改任一 skill 的源码、规则、reference、模板、样本、测试、版本或安装状态" in skill)
    require("references README must route project-memory for skill changes", "修改 skill 源码、规则、reference、模板、样本、测试、版本、安装状态后检查母文档同步影响" in refs)
    require("lifecycle must require project-memory after source changes", "执行“Skill 修改后的母文档同步检查”" in lifecycle)

    require("layout must separate generic note skeleton", "## 通用笔记骨架" in layout)
    require("layout must separate webpage skeleton", "## 网页/长文/报告骨架" in layout)
    require("generic skeleton must forbid default webpage metadata", "不要默认加入网页链接元数据或原文结构覆盖表" in layout)

    require("project-memory must define status-symbol timeline title", "状态符号 ITER-XXXX" in project_memory)
    require("project-memory must define three-table binding", "同一事件的三种投影" in project_memory)
    require("project-memory must define skill change sync check", "Skill 修改后的母文档同步检查" in project_memory)

    require("tests must use status-symbol timeline title", "项目迭代标题必须采用 `状态符号 ITER-XXXX" in tests)
    require("tests must not keep old timeline title contract", "项目迭代标题必须采用 `ITER-XXXX" not in tests)
    require("tests must cover skill-change mother-doc sync", "修改 skill 源码、规则、reference、模板、样本、测试、版本或安装状态后" in tests)
    require("tests must cover closed-item projection", "已闭环事项必须回到时间轴" in tests)

    require("template must include three-projection sample", "同一事件的三种投影" in template)
    require("template must include status-symbol ITER sample", "### ⏳ ITER-" in template)
    require("template must include decision and open-item projection", "## 5. 已确认决策清单" in template and "## 6. 当前未闭环事项" in template)

    require("impact must define skill entry contract", "skill-entry-contract" in impact)
    require("impact must define reference system contract", "reference-system-contract" in impact)
    require("impact must define project memory contract", "project-memory-contract" in impact)
    require("impact must define impact governance contract", "impact-governance-contract" in impact)
    require("impact must define realtime console contract", "impact-console-contract" in impact)
    require("impact must require witness review", "witness_changed_or_reviewed" in impact)
    require("impact must require version review", "version_changed_or_reviewed" in impact)

    require("impact console must use SSE", "EventSource(\"/events\")" in impact_console)
    require("impact console must fetch graph state from backend", "fetch(\"/api/state\"" in impact_console)
    require("impact console must use Cytoscape graph engine", "cytoscape@3.34.0" in impact_console and "window.cytoscape" in impact_console)
    require("impact console must enable product graph interactions", "userPanningEnabled: true" in impact_console and "userZoomingEnabled: true" in impact_console and "dragfree" in impact_console)
    require("impact README must document watch command", "pnpm skill:impact:watch obsidian-knowledge-curator" in impact_readme)
    require("impact README must keep strict gate visible", "pnpm skill:impact obsidian-knowledge-curator --strict" in impact_readme)

    print("okc contract checks passed")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"okc contract check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
