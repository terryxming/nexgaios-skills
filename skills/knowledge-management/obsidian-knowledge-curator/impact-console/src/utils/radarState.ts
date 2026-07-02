import type { ActivityMap, GraphEdge, GraphNode, ImpactState, RadarState } from "../types/impact";
import { riskStatuses } from "./impactText";

const RECENT_ACTIVITY_MS = 20_000;
const TRAIL_ACTIVITY_MS = 35_000;

export function fileNodeId(file: string) {
  const value = String(file || "");
  return value.startsWith("file:") ? value : `file:${value}`;
}

export function repoFileToNodeId(payload: ImpactState, repoFile: string) {
  const prefix = `${payload.skill.relativeDir}/`;
  const value = String(repoFile || "");
  return fileNodeId(value.startsWith(prefix) ? value.slice(prefix.length) : value);
}

export function buildRadarState(
  payload: ImpactState,
  selectedNodeId: string,
  activity: ActivityMap,
  now = Date.now()
): RadarState {
  const nodes = payload.graph.nodes || [];
  const edges = payload.graph.edges || [];
  const selected = selectedNodeId;
  const changedNodeIds = new Set<string>();
  const recentlyChangedNodeIds = new Set<string>();
  const activityTrailNodeIds = new Set<string>();
  const activeContractIds = new Set((payload.graph.contracts || []).filter((contract) => contract.active).map((contract) => contract.id));
  const selectedContractIds = contractIdsForNode(payload, selected);
  const pathContractIds = new Set([...activeContractIds, ...selectedContractIds]);
  const activePathNodeIds = new Set<string>();
  const pendingClosureNodeIds = new Set<string>();
  const closedWitnessNodeIds = new Set<string>();
  const riskNodeIds = new Set<string>();
  const orphanNodeIds = new Set<string>();
  const missingNodeIds = new Set<string>();

  for (const change of payload.changes || []) {
    if (change.skillFile) {
      changedNodeIds.add(fileNodeId(change.skillFile));
    }
  }

  for (const node of nodes) {
    const statuses = node.status || [];
    if (node.changed) {
      changedNodeIds.add(node.id);
    }
    if (statuses.some((status) => riskStatuses.has(status))) {
      riskNodeIds.add(node.id);
      pendingClosureNodeIds.add(node.id);
    }
    if (statuses.includes("orphan")) {
      orphanNodeIds.add(node.id);
    }
    if (statuses.includes("missing") || statuses.includes("broken-reference") || node.kind === "missing") {
      missingNodeIds.add(node.id);
    }
  }

  for (const task of payload.tasks || []) {
    if (task.file) {
      pendingClosureNodeIds.add(repoFileToNodeId(payload, task.file));
    }
  }

  for (const contract of payload.graph.contracts || []) {
    if (contract.current?.missingWitnesses?.length) {
      for (const witness of contract.current.missingWitnesses) {
        pendingClosureNodeIds.add(fileNodeId(witness));
      }
    }
    if (!pathContractIds.has(contract.id)) {
      continue;
    }
    activePathNodeIds.add(`contract:${contract.id}`);
    for (const source of contract.current?.changedSources || []) {
      activePathNodeIds.add(fileNodeId(source));
    }
  }

  for (const edge of edges) {
    if (!edge.contract || !pathContractIds.has(edge.contract)) {
      continue;
    }
    if (edge.relation === "source" || edge.relation === "witness") {
      activePathNodeIds.add(edge.from);
      activePathNodeIds.add(edge.to);
    }
    if (edge.relation === "witness" && !pendingClosureNodeIds.has(edge.to)) {
      closedWitnessNodeIds.add(edge.to);
    }
  }

  for (const [nodeId, entry] of Object.entries(activity || {})) {
    const age = now - entry.lastSeen;
    if (age <= TRAIL_ACTIVITY_MS) {
      activityTrailNodeIds.add(nodeId);
    }
    if (age <= RECENT_ACTIVITY_MS) {
      recentlyChangedNodeIds.add(nodeId);
    }
  }

  return {
    now,
    changedNodeIds,
    recentlyChangedNodeIds,
    activityTrailNodeIds,
    activeContractIds,
    activePathNodeIds,
    pendingClosureNodeIds,
    closedWitnessNodeIds,
    riskNodeIds,
    orphanNodeIds,
    missingNodeIds,
    selectedContractIds,
    activePathCount: activeContractIds.size,
    pendingClosureCount: pendingClosureNodeIds.size
  };
}

export function contractIdsForNode(payload: ImpactState, nodeId: string) {
  const node = (payload.graph.nodes || []).find((item) => item.id === nodeId);
  const contractIds = new Set<string>();

  if (node?.kind === "contract") {
    contractIds.add(node.id.replace(/^contract:/, ""));
  }

  for (const contract of node?.contracts || []) {
    contractIds.add(contract.id);
  }

  for (const edge of payload.graph.edges || []) {
    if (edge.from !== nodeId && edge.to !== nodeId) {
      continue;
    }
    if (edge.contract && (edge.relation === "source" || edge.relation === "witness")) {
      contractIds.add(edge.contract);
    }
  }

  return contractIds;
}

export function isMainContractEdge(edge: GraphEdge) {
  return edge.relation === "source" || edge.relation === "witness";
}

export function isActivePathEdge(edge: GraphEdge, radar: RadarState) {
  return Boolean(edge.contract && radar.activeContractIds.has(edge.contract) && isMainContractEdge(edge));
}

export function isSelectedPathEdge(edge: GraphEdge, radar: RadarState) {
  return Boolean(edge.contract && radar.selectedContractIds.has(edge.contract) && isMainContractEdge(edge));
}

export function nodeRole(node: GraphNode) {
  if (node.kind === "contract") {
    return "contract";
  }
  if ((node.contracts || []).some((contract) => contract.role === "source")) {
    return "source";
  }
  if ((node.contracts || []).some((contract) => contract.role === "witness")) {
    return "witness";
  }
  return "file";
}

export function radarSentence(payload: ImpactState | null, radar: RadarState | null) {
  if (!payload || !radar) {
    return "正在连接文件关系图谱";
  }

  const gaps = radar.pendingClosureCount;
  const files = (payload.graph.nodes || []).filter((node) => node.kind === "file" || node.file).length;
  const relations = (payload.graph.edges || []).length;
  const changed = payload.summary.changedFiles || radar.changedNodeIds.size;
  if (payload.summary.status === "passing" && gaps === 0) {
    return `已绘制 ${files} 个文件 · ${relations} 条关系 · 监控 ${changed} 个变更 · 0 个缺口`;
  }
  return `已绘制 ${files} 个文件 · ${relations} 条关系 · 监控 ${changed} 个变更 · ${gaps} 个缺口`;
}

export function primaryRiskStatus(node: GraphNode) {
  const statuses = node.status || [];
  return statuses.find((status) => status === "broken-reference")
    || statuses.find((status) => status === "missing")
    || statuses.find((status) => status === "orphan")
    || statuses.find((status) => status === "witness-pending")
    || statuses.find((status) => status === "version-pending")
    || statuses.find((status) => riskStatuses.has(status))
    || "";
}

export function riskPriority(status: string) {
  return {
    "broken-reference": 10,
    missing: 20,
    orphan: 30,
    "witness-pending": 40,
    "version-pending": 50,
    failing: 60
  }[status] || 90;
}
