import type { ElementDefinition, LayoutOptions } from "cytoscape";
import type { GraphEdge, GraphFilters, GraphNode, GraphPosition, ImpactState, RadarState } from "../types/impact";
import { matchesNodeSearch, positiveStatuses, riskyNodes, riskStatuses, shortLabel } from "../utils/impactText";
import { isActivePathEdge, isMainContractEdge, isSelectedPathEdge, nodeRole } from "../utils/radarState";

export function graphElements(
  payload: ImpactState,
  filters: GraphFilters,
  selectedNodeId: string,
  radar: RadarState,
  positions: Map<string, GraphPosition>,
  rerunLayout: boolean
) {
  const graph = payload.graph;
  const visible = visibleNodeIds(payload, filters, selectedNodeId, radar);
  const selected = selectedNodeId;
  const hasSearch = Boolean(filters.search.trim());
  const showImpactOverlay = Boolean(selectedNodeId) || filters.mode === "risk";
  const degrees = degreeByNodeId(graph.edges || []);
  const basenameCounts = basenameCountByNode(graph.nodes || []);

  const nodes: ElementDefinition[] = (graph.nodes || [])
    .filter((node) => visible.has(node.id))
    .map((node) => {
      const position = positions.get(node.id);
      const isSearchHit = hasSearch && matchesNodeSearch(node, filters.search);
      const degree = degrees.get(node.id) || 0;
      return {
        group: "nodes",
        data: {
          id: node.id,
          label: node.label,
          short: shortLabel(displayNodeLabel(node, basenameCounts), 26),
          fullLabel: node.label,
          kind: node.kind,
          role: nodeRole(node),
          category: node.category || node.kind,
          degree,
          fileBytes: node.fileBytes || 0,
          visualSize: visualNodeSize(node, degree),
          statuses: node.status || [],
          roles: node.roles || [],
          contracts: node.contracts || []
        },
        classes: nodeClasses(node, filters, radar, node.id === selected, isSearchHit, showImpactOverlay),
        position: position && !rerunLayout ? position : undefined
      };
    });

  const edgeCounts = new Map<string, number>();
  const edges: ElementDefinition[] = (graph.edges || [])
    .filter((edge) => visible.has(edge.from) && visible.has(edge.to))
    .filter((edge) => !filters.relation || edge.relation === filters.relation)
    .map((edge) => {
      const edgeKey = `${edge.from}__${edge.to}__${edge.relation}__${edge.contract || ""}`;
      const occurrence = edgeCounts.get(edgeKey) || 0;
      edgeCounts.set(edgeKey, occurrence + 1);
      return {
        group: "edges",
        data: {
          id: occurrence ? `${edgeKey}__${occurrence}` : edgeKey,
          source: edge.from,
          target: edge.to,
          relation: edge.relation,
          contract: edge.contract || "",
          label: edge.relation
        },
        classes: edgeClasses(edge, filters, radar, showImpactOverlay)
      };
    });

  return [...nodes, ...edges];
}

function basenameCountByNode(nodes: GraphNode[]) {
  const counts = new Map<string, number>();
  for (const node of nodes) {
    if (node.kind !== "file" || !node.file) {
      continue;
    }
    const base = node.file.split("/").pop() || node.file;
    counts.set(base, (counts.get(base) || 0) + 1);
  }
  return counts;
}

function displayNodeLabel(node: GraphNode, basenameCounts: Map<string, number>) {
  if (node.kind !== "file" || !node.file) {
    return node.label;
  }
  const parts = node.file.split("/");
  const base = parts.at(-1) || node.file;
  if ((basenameCounts.get(base) || 0) <= 1 || parts.length === 1) {
    return base;
  }
  return `${parts.at(-2)}/${base}`;
}

function degreeByNodeId(edges: GraphEdge[]) {
  const degrees = new Map<string, number>();
  for (const edge of edges) {
    degrees.set(edge.from, (degrees.get(edge.from) || 0) + 1);
    degrees.set(edge.to, (degrees.get(edge.to) || 0) + 1);
  }
  return degrees;
}

function visualNodeSize(node: GraphNode, degree: number) {
  if (node.kind === "missing") {
    return 16;
  }
  if (node.kind === "contract") {
    return Math.round(Math.min(28, 14 + Math.sqrt(Math.max(0, degree)) * 2.4));
  }

  const bytes = Math.max(0, node.fileBytes || 0);
  const byteScore = bytes ? Math.log10(bytes + 10) : 0;
  const degreeScore = Math.pow(Math.max(0, degree), 0.72);
  const roleBoost = (node.roles || []).length ? 1.1 : 0;
  const statusBoost = node.changed ? 0.6 : 0;
  return Math.round(Math.min(30, Math.max(7, 6.5 + byteScore * 1.35 + degreeScore * 2.65 + roleBoost + statusBoost)));
}

export function visibleNodeIds(payload: ImpactState, filters: GraphFilters, selectedNodeId: string, radar: RadarState) {
  const graph = payload.graph;
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const visible = new Set<string>();
  const hasSearch = Boolean(filters.search.trim());

  if (filters.mode === "risk" && !hasSearch && !filters.contract && radar.pendingClosureNodeIds.size === 0) {
    return visible;
  }

  for (const node of nodes) {
    const statuses = new Set(node.status || []);
    const nodeContracts = new Set((node.contracts || []).map((contract) => contract.id));
    const matchesContract = !filters.contract
      || node.id === `contract:${filters.contract}`
      || nodeContracts.has(filters.contract);
    const matchesSearch = matchesNodeSearch(node, filters.search);
    let matchesMode = true;

    if (hasSearch) {
      matchesMode = true;
    }

    if (filters.mode === "risk") {
      matchesMode = radar.pendingClosureNodeIds.has(node.id)
        || [...statuses].some((status) => riskStatuses.has(status))
        || (node.kind === "contract" && statuses.has("failing"));
    }

    if (matchesContract && matchesMode && (hasSearch || matchesSearch)) {
      visible.add(node.id);
    }
  }

  if (filters.mode === "risk" && !hasSearch) {
    const riskSeeds = new Set(visible);
    for (const edge of edges) {
      if (riskSeeds.has(edge.from) || riskSeeds.has(edge.to)) {
        visible.add(edge.from);
        visible.add(edge.to);
      }
    }
  } else if (!hasSearch) {
    for (const edge of edges) {
      if (visible.has(edge.from) || visible.has(edge.to)) {
        visible.add(edge.from);
        visible.add(edge.to);
      }
    }
  }

  if (filters.mode === "all" && selectedNodeId && !hasSearch) {
    visible.add(selectedNodeId);
    for (const edge of edges) {
      if (edge.from === selectedNodeId || edge.to === selectedNodeId) {
        visible.add(edge.from);
        visible.add(edge.to);
      }
    }
  } else if (filters.mode === "all" && selectedNodeId && hasSearch) {
    visible.add(selectedNodeId);
  }

  return visible;
}

function nodeClasses(
  node: GraphNode,
  filters: GraphFilters,
  radar: RadarState,
  selected: boolean,
  searchHit: boolean,
  showImpactOverlay: boolean
) {
  const role = nodeRole(node);
  const classes = [node.kind, node.category || "", `${role}-role`];
  for (const status of node.status || []) {
    classes.push(status);
  }
  if ((node.status || []).some((status) => riskStatuses.has(status))) {
    classes.push("risk");
  }
  if ((node.status || []).some((status) => positiveStatuses.has(status))) {
    classes.push("positive");
  }
  if (selected) {
    classes.push("selected-node", "show-label");
  }
  if (filters.mode === "risk") {
    classes.push("show-label");
  }
  if (radar.recentlyChangedNodeIds.has(node.id)) {
    classes.push("recently-changed");
  } else if (radar.activityTrailNodeIds.has(node.id)) {
    classes.push("activity-trail");
  }
  if (radar.changedNodeIds.has(node.id)) {
    classes.push("changed-node");
  }
  if (showImpactOverlay && radar.activePathNodeIds.has(node.id)) {
    classes.push("active-path");
  }
  if (radar.pendingClosureNodeIds.has(node.id)) {
    classes.push("pending-closure");
  }
  if (radar.closedWitnessNodeIds.has(node.id)) {
    classes.push("closed-witness");
  }
  if (radar.orphanNodeIds.has(node.id)) {
    classes.push("orphan-node");
  }
  if (radar.missingNodeIds.has(node.id)) {
    classes.push("missing-node");
  }
  if (searchHit) {
    classes.push("search-hit", "show-label");
  } else if (filters.search.trim()) {
    classes.push("search-dim");
  }
  return classes.filter(Boolean).join(" ");
}

function edgeClasses(edge: GraphEdge, filters: GraphFilters, radar: RadarState, showImpactOverlay: boolean) {
  const classes = [edge.relation];
  if (isMainContractEdge(edge)) {
    classes.push("contract-main");
  }
  if (edge.relation === "mentions" || edge.relation === "entry" || edge.relation === "command") {
    classes.push("support-edge");
  }
  if (edge.relation === "missing") {
    classes.push("missing-link");
  }
  if (showImpactOverlay && isActivePathEdge(edge, radar)) {
    classes.push("active-path-edge");
  }
  if (isSelectedPathEdge(edge, radar)) {
    classes.push("trigger-edge");
  }
  if (filters.mode === "all" && !classes.includes("active-path-edge") && edge.relation !== "missing") {
    classes.push("map-edge");
  }
  return classes.join(" ");
}

export function layoutForCurrentMode(filters: GraphFilters) {
  if (filters.search || filters.contract) {
    return "cose";
  }
  if (filters.mode === "risk") {
    return "concentric";
  }
  return "cose";
}

export function layoutOptions(name: string): LayoutOptions {
  if (name === "preset") {
    return { name: "preset", fit: false };
  }
  if (name === "breadthfirst") {
    return { name: "breadthfirst", directed: true, spacingFactor: 1.25, animate: false, padding: 70 } as LayoutOptions;
  }
  if (name === "concentric") {
    return { name: "concentric", minNodeSpacing: 72, animate: true, animationDuration: 360, padding: 92 } as LayoutOptions;
  }
  return {
    name: "cose",
    animate: true,
    animationDuration: 520,
    animationEasing: "ease-out-cubic",
    refresh: 24,
    fit: true,
    padding: 76,
    nodeRepulsion: 12000,
    nodeOverlap: 16,
    idealEdgeLength: 118,
    edgeElasticity: 96,
    gravity: 0.12,
    numIter: 2400,
    initialTemp: 220,
    coolingFactor: 0.96,
    minTemp: 1
  } as LayoutOptions;
}

export function emptyGraphText(payload: ImpactState, filters: GraphFilters) {
  if (filters.mode === "risk" && !filters.search && !filters.contract && riskyNodes(payload.graph.nodes).length === 0) {
    return "当前没有未接入、pending 或断裂引用节点。";
  }
  if (filters.search) {
    return `没有命中“${filters.search.trim()}”的节点。`;
  }
  return "没有匹配当前筛选的节点。";
}

export function stageDescription(payload: ImpactState, filters: GraphFilters, selectedNodeId: string, elements: ElementDefinition[]) {
  const nodeCount = elements.filter((element) => element.group === "nodes").length;
  if (filters.search) {
    const hitCount = (payload.graph.nodes || []).filter((node) => matchesNodeSearch(node, filters.search)).length;
    return `搜索“${filters.search.trim()}” · ${hitCount}/${nodeCount} 个命中 · 非命中节点已退到背景`;
  }
  if (filters.mode === "risk") {
    if (riskyNodes(payload.graph.nodes).length === 0 && !filters.contract) {
      return "缺口图层 · 当前没有未接入、pending 或断裂引用节点";
    }
    return `缺口图层 · ${nodeCount} 个节点 · 只显示 strict gate 会关注的对象`;
  }
  const node = payload.graph.nodes.find((item) => item.id === selectedNodeId);
  if (node) {
    return `${node.label} · 已高亮上下游关系 · 右侧查看需要检查的相关文件`;
  }
  return `文件关系图谱 · ${nodeCount} 个节点 · 可拖拽、缩放、搜索和筛选`;
}
