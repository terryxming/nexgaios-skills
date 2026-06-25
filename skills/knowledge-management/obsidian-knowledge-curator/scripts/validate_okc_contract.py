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
    impact_console_js = read("impact/assets/console.js")
    impact_readme = read("impact/README.md")
    impact_console_package = read("impact-console/package.json")
    impact_console_api = read("impact-console/src/api/impactState.ts")
    impact_console_app = read("impact-console/src/App.tsx")
    impact_console_graph = read("impact-console/src/components/GraphCanvas.tsx")
    impact_console_index = read("impact-console/src/components/FileIndex.tsx")
    impact_console_toolbar = read("impact-console/src/components/Toolbar.tsx")
    impact_console_types = read("impact-console/src/types/impact.ts")
    impact_console_model = read("impact-console/src/graph/graphModel.ts")
    impact_console_style = read("impact-console/src/graph/graphStyle.ts")
    impact_console_radar = read("impact-console/src/utils/radarState.ts")
    impact_console_inspector = read("impact-console/src/components/Inspector.tsx")
    impact_console_topbar = read("impact-console/src/components/TopBar.tsx")
    impact_console_vite = read("impact-console/vite.config.ts")

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
    require("impact must define frontend source contract", "impact-console-frontend-contract" in impact)
    require("impact must require witness review", "witness_changed_or_reviewed" in impact)
    require("impact must require version review", "version_changed_or_reviewed" in impact)

    require("impact console html must load built assets", "./assets/console.js" in impact_console and "./assets/console.css" in impact_console)
    require("impact console build must include React root", '<div id="root"></div>' in impact_console)
    require("impact console frontend must use SSE", 'new EventSource("/events")' in impact_console_api)
    require("impact console frontend must fetch graph state from backend", 'fetch("/api/state"' in impact_console_api)
    require("impact console frontend must use Cytoscape graph engine", 'from "cytoscape"' in impact_console_graph and '"cytoscape"' in impact_console_package)
    require("impact console frontend must use D3 force layout engine", '"d3-force"' in impact_console_package and 'from "d3-force"' in impact_console_graph and "forceSimulation" in impact_console_graph)
    require("impact console frontend must use React and Vite", '"react"' in impact_console_package and '"vite"' in impact_console_package and '"typescript"' in impact_console_package)
    require("impact console build must target skill impact assets", 'outDir: "../impact"' in impact_console_vite)
    require("impact console build asset must include SSE client", "EventSource" in impact_console_js and "/events" in impact_console_js)
    require("impact console must enable product graph interactions", "userPanningEnabled: true" in impact_console_graph and "userZoomingEnabled: true" in impact_console_graph and "dragfree" in impact_console_graph)
    require("impact console must default to full file relationship graph", 'useState<GraphLayer>("all")' in impact_console_app)
    require("impact console graph must scale nodes by file size and degree", "fileBytes" in impact_console_model and "visualSize" in impact_console_model and "degreeByNodeId" in impact_console_model)
    require("impact console graph must keep readable short labels", "displayNodeLabel" in impact_console_model and "shortLabel" in impact_console_model)
    require("impact console graph must use stable edge ids", "edgeCounts" in impact_console_model and "__${index}" not in impact_console_model)
    require("impact console must expose visual QA metrics", "minNodeSize" in impact_console_graph and "nodeSizeSteps" in impact_console_graph and "dataset.zoom" in impact_console_graph and "dataset.panX" in impact_console_graph)
    require("impact console must expose label LOD QA metrics", "applyLabelLod" in impact_console_graph and "dataset.labelLod" in impact_console_graph and "dataset.visibleLabels" in impact_console_graph and "label-hidden" in impact_console_style)
    require("impact console must expose hover focus QA metrics", "dataset.hoverMuted" in impact_console_graph and "dataset.hoverNeighborNodes" in impact_console_graph and "hover-muted" in impact_console_style)
    require("impact console must use incremental graph synchronization", "syncGraphElements" in impact_console_graph and "placeNewNodeNearNeighbor" in impact_console_graph and "reheatAddedNeighborhood" in impact_console_graph)
    require("impact console must expose incremental QA metrics", "dataset.addedNodes" in impact_console_graph and "dataset.preservedPanZoom" in impact_console_graph and "dataset.layoutEngine" in impact_console_graph and "localReheat" in impact_console_graph)
    require("impact console must expose D3 layout QA metrics", "LayoutEngine" in impact_console_types and 'useState<LayoutEngine>("d3-force")' in impact_console_app and "dataset.d3Ticks" in impact_console_graph and "dataset.d3Running" in impact_console_graph and "dataset.d3Components" in impact_console_graph)
    require("impact console must derive radar activity state", "recentlyChangedNodeIds" in impact_console_radar and "activePathNodeIds" in impact_console_radar and "pendingClosureNodeIds" in impact_console_radar)
    require("impact console must keep selected-file impact as graph highlight layer", "closedNeighborhood" in impact_console_graph and "trigger-edge" in impact_console_model and "active-path-edge" in impact_console_model)
    require("impact console must style radar semantic layers", "active-path-edge" in impact_console_style and "pending-closure" in impact_console_style and "orphan-node" in impact_console_style and "missing-node" in impact_console_style)
    require("impact console must style Obsidian-like graph interaction layers", "data(visualSize)" in impact_console_style and "text-max-width" in impact_console_style and "text-opacity" in impact_console_style and "hover-muted" in impact_console_style and "underlay-opacity" in impact_console_style)
    require("impact console D3 layout must support component clustering", "componentTargetsByNodeId" in impact_console_graph and "writeGraphTopologyMetrics" in impact_console_graph and "d3IsolatedNodes" in impact_console_graph and "d3LargestComponent" in impact_console_graph)
    require("impact console must expose file index", "文件索引" in impact_console_index and "变更文件" in impact_console_index and "新增文件" in impact_console_index and "未接入文件" in impact_console_index and "全部文件" in impact_console_index)
    require("impact console must expose file impact inspector", "文件影响检查" in impact_console_inspector and "需要检查的相关文件" in impact_console_inspector and "待检查" in impact_console_inspector and "仍需处理" in impact_console_inspector)
    require("impact console toolbar must expose graph layers, not separate impact views", "图层" in impact_console_toolbar and "完整图谱" in impact_console_toolbar and "只看缺口" in impact_console_toolbar and "D3 force" in impact_console_toolbar and "影响检查" not in impact_console_toolbar and "缺口视图" not in impact_console_toolbar)
    require("impact console topbar must speak file graph status", "文件关系图谱" in impact_console_topbar and "radarSentence" in impact_console_topbar)
    require("impact README must document watch command", "pnpm skill:impact:watch obsidian-knowledge-curator" in impact_readme)
    require("impact README must describe file graph infrastructure", "文件关系图谱 + 实时修改监控 + 影响链路检查" in impact_readme and "新文件必须立即出现在图中" in impact_readme)
    require("impact README must describe Obsidian-like graph feel", "文件名短标签按缩放" in impact_readme and "节点大小更明显地参考连接度" in impact_readme)
    require("impact README must describe incremental graph updates", "增量" in impact_readme and "add/remove/update" in impact_readme and "保留 pan、zoom" in impact_readme and "局部" in impact_readme and "reheat" in impact_readme)
    require("impact README must keep strict gate visible", "pnpm skill:impact obsidian-knowledge-curator --strict" in impact_readme)

    print("okc contract checks passed")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"okc contract check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
