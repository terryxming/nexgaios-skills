import type { GraphEdge, GraphNode, ImpactState, RadarState } from "../types/impact";
import { labelStatus, matchesNodeSearch, riskStatuses } from "../utils/impactText";
import { fileNodeId } from "../utils/radarState";

interface FileIndexProps {
  payload: ImpactState | null;
  radar: RadarState | null;
  search: string;
  selectedNodeId: string;
  onSelectNode: (id: string, options?: { focusMode?: boolean; clearSearch?: boolean }) => void;
}

interface FileIndexItem {
  id: string;
  label: string;
  meta: string;
  state: string;
  tone: "normal" | "changed" | "new" | "unlinked" | "risk";
  node: GraphNode;
}

export function FileIndex({ payload, radar, search, selectedNodeId, onSelectNode }: FileIndexProps) {
  if (!payload || !radar) {
    return (
      <aside className="panel side-panel">
        <div className="panel-head">
          <h2 className="panel-title">文件索引</h2>
          <span className="panel-caption">0 files</span>
        </div>
        <div className="scroll"><div className="empty">正在连接文件关系图谱。</div></div>
      </aside>
    );
  }

  const edges = payload.graph.edges || [];
  const changes = new Map((payload.changes || []).map((change) => [fileNodeId(change.skillFile), change.kind]));
  const fileItems = (payload.graph.nodes || [])
    .filter((node) => node.kind === "file" || Boolean(node.file))
    .map((node) => toFileItem(node, edges, changes, radar))
    .sort((a, b) => sortFileItems(a, b));

  const filtered = fileItems.filter((item) => matchesNodeSearch(item.node, search));
  const changed = filtered.filter((item) => radar.changedNodeIds.has(item.id) || Boolean(item.node.changed));
  const added = filtered.filter((item) => item.state === "added" || item.tone === "new");
  const unlinked = filtered.filter((item) => item.tone === "unlinked" || item.tone === "risk");
  const countLabel = search ? `${filtered.length}/${fileItems.length} files` : `${fileItems.length} files`;

  return (
    <aside className="panel side-panel file-index">
      <div className="panel-head">
        <h2 className="panel-title">文件索引</h2>
        <span className="panel-caption">{countLabel}</span>
      </div>
      <div className="scroll">
        <IndexGroup
          title="变更文件"
          emptyText={search ? "没有匹配搜索的变更文件。" : "当前没有变更文件。"}
          items={changed}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          open
        />
        <IndexGroup
          title="新增文件"
          emptyText={search ? "没有匹配搜索的新增文件。" : "当前没有新增文件。"}
          items={added}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
        <IndexGroup
          title="未接入文件"
          emptyText={search ? "没有匹配搜索的未接入文件。" : "当前没有未接入文件。"}
          items={unlinked}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          open={unlinked.length > 0}
        />
        <IndexGroup
          title="全部文件"
          emptyText={search ? "没有匹配搜索的文件。" : "该 skill 暂无文件节点。"}
          items={filtered}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          open={!search}
        />
      </div>
    </aside>
  );
}

function IndexGroup(props: {
  title: string;
  emptyText: string;
  items: FileIndexItem[];
  selectedNodeId: string;
  open?: boolean;
  onSelectNode: FileIndexProps["onSelectNode"];
}) {
  return (
    <details className="index-group" open={props.open}>
      <summary>
        <span>{props.title}</span>
        <span>{props.items.length}</span>
      </summary>
      {props.items.length ? props.items.map((item) => (
        <button
          className={`index-item ${item.tone} ${item.id === props.selectedNodeId ? "active" : ""}`}
          type="button"
          key={`${props.title}:${item.id}`}
          onClick={() => props.onSelectNode(item.id, { focusMode: true, clearSearch: true })}
        >
          <span className={`status-bar ${item.state || "file"}`} />
          <span className="index-title">{item.label}</span>
          <span className="index-meta">{item.meta}</span>
          <span className="index-state">{labelStatus(item.state)}</span>
        </button>
      )) : <div className="empty good">{props.emptyText}</div>}
    </details>
  );
}

function toFileItem(
  node: GraphNode,
  edges: GraphEdge[],
  changes: Map<string, string>,
  radar: RadarState
): FileIndexItem {
  const incident = edges.filter((edge) => edge.from === node.id || edge.to === node.id);
  const contracts = node.contracts || [];
  const statuses = node.status || [];
  const changedKind = changes.get(node.id);
  const relationText = incident.length ? `${incident.length} 条关系` : "无关系";
  const contractText = contracts.length ? `${contracts.length} 个契约` : "未纳入契约";
  const state = primaryState(node, changedKind, radar);
  const unlinked = node.covered === false || statuses.includes("orphan") || incident.length === 0;
  const risky = statuses.some((status) => riskStatuses.has(status)) || radar.pendingClosureNodeIds.has(node.id);
  const tone = risky ? "risk" : unlinked ? "unlinked" : changedKind === "added" || statuses.includes("added") ? "new" : radar.changedNodeIds.has(node.id) || node.changed ? "changed" : "normal";

  return {
    id: node.id,
    label: node.file || node.label,
    meta: `${relationText} · ${contractText}`,
    state,
    tone,
    node
  };
}

function primaryState(node: GraphNode, changedKind: string | undefined, radar: RadarState) {
  const statuses = node.status || [];
  if (changedKind) {
    return changedKind;
  }
  if (radar.pendingClosureNodeIds.has(node.id)) {
    return statuses.find((status) => riskStatuses.has(status)) || "witness-pending";
  }
  if (statuses.includes("orphan")) {
    return "orphan";
  }
  if (radar.changedNodeIds.has(node.id) || node.changed) {
    return "changed";
  }
  return statuses[0] || "clean";
}

function sortFileItems(a: FileIndexItem, b: FileIndexItem) {
  const priority = { risk: 0, changed: 1, new: 2, unlinked: 3, normal: 4 };
  return priority[a.tone] - priority[b.tone] || a.label.localeCompare(b.label);
}
