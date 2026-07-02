import type { GraphNode, ImpactState } from "../types/impact";

export const riskStatuses = new Set([
  "failing",
  "broken-reference",
  "missing",
  "orphan",
  "witness-pending",
  "version-pending"
]);

export const positiveStatuses = new Set(["reviewed", "updated", "clean", "active"]);

export function labelStatus(status: string) {
  return {
    clean: "clean",
    changed: "changed",
    added: "added",
    modified: "modified",
    deleted: "deleted",
    renamed: "renamed",
    orphan: "orphan",
    "source-changed": "source changed",
    "witness-pending": "witness pending",
    "version-pending": "version pending",
    reviewed: "reviewed",
    updated: "updated",
    "broken-reference": "broken reference",
    missing: "missing",
    active: "active",
    failing: "failing"
  }[status] || status;
}

export function shortLabel(value: string, length = 34) {
  const text = String(value || "");
  if (text.length <= length) {
    return text;
  }
  const keep = Math.max(8, Math.floor((length - 3) / 2));
  return `${text.slice(0, keep)}...${text.slice(-keep)}`;
}

export function currentSearch(search: string) {
  return search.trim().toLowerCase();
}

export function nodeSearchText(node: GraphNode) {
  return `${node.label || ""} ${node.kind || ""} ${node.category || ""} ${(node.status || []).join(" ")} ${(node.roles || []).join(" ")}`.toLowerCase();
}

export function matchesNodeSearch(node: GraphNode, search: string) {
  const normalized = currentSearch(search);
  return !normalized || nodeSearchText(node).includes(normalized);
}

export function queueSearchText(item: { title?: string; meta?: string; id?: string }) {
  return `${item.title || ""} ${item.meta || ""} ${item.id || ""}`.toLowerCase();
}

export function matchesQueueSearch(item: { title?: string; meta?: string; id?: string }, search: string) {
  const normalized = currentSearch(search);
  return !normalized || queueSearchText(item).includes(normalized);
}

export function riskyNodes(nodes: GraphNode[] = []) {
  return nodes.filter((node) => (node.status || []).some((status) => riskStatuses.has(status)));
}

export function autoSelectNodeId(payload: ImpactState | null) {
  const nodes = payload?.graph.nodes || [];
  const risky = nodes.find((node) => (node.status || []).some((status) => riskStatuses.has(status)));
  if (risky) {
    return risky.id;
  }
  const changed = nodes.find((node) => node.changed);
  if (changed) {
    return changed.id;
  }
  return nodes[0]?.id || "";
}

export function toSkillRelative(payload: ImpactState, repoFile: string) {
  const prefix = `${payload.skill.relativeDir}/`;
  return String(repoFile || "").startsWith(prefix) ? String(repoFile).slice(prefix.length) : repoFile;
}
