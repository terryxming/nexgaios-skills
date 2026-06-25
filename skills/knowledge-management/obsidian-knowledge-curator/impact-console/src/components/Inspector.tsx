import type { ReactNode } from "react";
import type { GraphContract, GraphEdge, GraphFilters, GraphNode, ImpactState, RadarState } from "../types/impact";
import { labelStatus, positiveStatuses, riskStatuses } from "../utils/impactText";
import { contractIdsForNode } from "../utils/radarState";

interface InspectorProps {
  payload: ImpactState | null;
  radar: RadarState | null;
  selectedNodeId: string;
  filters: GraphFilters;
  error?: string;
}

interface CheckItem {
  id: string;
  label: string;
  reason: string;
  state: string;
  action: string;
  tone: "todo" | "changed" | "reviewed" | "risk";
}

export function Inspector({ payload, radar, selectedNodeId, filters, error }: InspectorProps) {
  if (error) {
    return <InspectorShell meta="error"><div className="empty">{error}</div></InspectorShell>;
  }
  if (!payload || !radar) {
    return <InspectorShell meta="waiting"><div className="empty">等待文件关系图谱状态。</div></InspectorShell>;
  }

  const selected = (payload.graph.nodes || []).find((node) => node.id === selectedNodeId);
  if (!selected) {
    return (
      <InspectorShell meta={filters.mode === "risk" ? "缺口图层" : "未选择"}>
        <GraphOverview payload={payload} radar={radar} />
        <Insight title="文件影响检查">
          <p>在图谱或左侧文件索引中选择一个文件，查看它的上下游关系和需要检查的相关文件。</p>
        </Insight>
      </InspectorShell>
    );
  }

  const relatedEdges = (payload.graph.edges || []).filter((edge) => edge.from === selected.id || edge.to === selected.id);
  const contracts = contractsForSelected(payload, selected);
  const checkItems = relatedFileChecks(payload, selected, radar);
  const diagnostics = (payload.diagnostics || []).filter((item) => selected.file && item.file && item.file.endsWith(selected.file));
  const tasks = (payload.tasks || []).filter((task) => selected.file && task.file && task.file.endsWith(selected.file));

  return (
    <InspectorShell meta={inspectorMeta(selected, radar)}>
      <h3 className="node-heading">{selected.file || selected.label}</h3>
      <div className="chips">{(selected.status || [selected.kind]).map((status) => <Chip status={status} key={status} />)}</div>
      <Insight title="关系摘要">
        <List items={relationSummary(payload, selected, relatedEdges, contracts)} />
      </Insight>
      <CheckList items={checkItems} />
      <Insight title="当前文件状态">
        <List items={currentFileState(selected, radar, tasks, diagnostics)} />
      </Insight>
      <Insight title="相关契约">
        <List items={contracts.map(formatContract)} />
      </Insight>
    </InspectorShell>
  );
}

function InspectorShell({ meta, children }: { meta: string; children: ReactNode }) {
  return (
    <aside className="panel inspector">
      <div className="panel-head">
        <h2 className="panel-title">文件影响检查</h2>
        <span className="panel-caption">{meta}</span>
      </div>
      <div className="inspector-body">{children}</div>
    </aside>
  );
}

function GraphOverview({ payload, radar }: { payload: ImpactState; radar: RadarState }) {
  const fileCount = (payload.graph.nodes || []).filter((node) => node.kind === "file" || node.file).length;
  const relationCount = (payload.graph.edges || []).length;
  const missing = radar.missingNodeIds.size;
  const unlinked = radar.orphanNodeIds.size;
  return (
    <Insight title="图谱概览">
      <List items={[
        `${fileCount} 个文件节点，${relationCount} 条关系。`,
        `${payload.summary.changedFiles} 个变更文件正在被监控。`,
        `${radar.pendingClosureCount} 个缺口，${unlinked} 个未接入节点，${missing} 个断裂或缺失引用。`
      ]} />
    </Insight>
  );
}

function Chip({ status }: { status: string }) {
  const cls = riskStatuses.has(status) ? "fail" : positiveStatuses.has(status) ? "pass" : "warn";
  return <span className={`chip ${cls}`}>{labelStatus(status)}</span>;
}

function Insight({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="insight-card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function List({ items }: { items: string[] }) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) {
    return <ul><li>无</li></ul>;
  }
  return <ul>{filtered.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function CheckList({ items }: { items: CheckItem[] }) {
  return (
    <article className="insight-card impact-check">
      <h3>需要检查的相关文件</h3>
      {items.length ? (
        <div className="impact-check-list">
          {items.map((item) => (
            <div className={`impact-check-row ${item.tone}`} key={item.id}>
              <div>
                <div className="check-title">{item.label}</div>
                <div className="check-reason">{item.reason}</div>
              </div>
              <div className="check-state">{item.state}</div>
              <div className="check-action">{item.action}</div>
            </div>
          ))}
        </div>
      ) : (
        <p>当前文件没有命中需要同步检查的相关文件。</p>
      )}
    </article>
  );
}

function inspectorMeta(node: GraphNode, radar: RadarState) {
  if (node.covered === false || (node.status || []).includes("orphan")) {
    return "未接入";
  }
  if (radar.pendingClosureNodeIds.has(node.id)) {
    return "仍需处理";
  }
  if (radar.closedWitnessNodeIds.has(node.id)) {
    return "已审查";
  }
  if (radar.changedNodeIds.has(node.id)) {
    return "已修改";
  }
  return node.kind;
}

function contractsForSelected(payload: ImpactState, selected: GraphNode) {
  const contractIds = contractIdsForNode(payload, selected.id);
  return (payload.graph.contracts || []).filter((contract) => contractIds.has(contract.id));
}

function relationSummary(
  payload: ImpactState,
  selected: GraphNode,
  relatedEdges: GraphEdge[],
  contracts: GraphContract[]
) {
  const nodes = new Map((payload.graph.nodes || []).map((node) => [node.id, node]));
  const upstream = relatedEdges
    .filter((edge) => edge.to === selected.id)
    .map((edge) => nodes.get(edge.from)?.label || edge.from);
  const downstream = relatedEdges
    .filter((edge) => edge.from === selected.id)
    .map((edge) => nodes.get(edge.to)?.label || edge.to);
  const items = [
    `直接上游：${upstream.length ? upstream.join(", ") : "无"}`,
    `直接下游：${downstream.length ? downstream.join(", ") : "无"}`,
    `关联契约：${contracts.length ? contracts.map((contract) => contract.id).join(", ") : "无"}`,
    `直接关系：${relatedEdges.length} 条`
  ];
  if (selected.covered === false || (selected.status || []).includes("orphan")) {
    items.push("该文件未进入 impact.yaml 契约或真实引用网络，需要接入后才能被严格检查覆盖。");
  }
  return items;
}

function relatedFileChecks(payload: ImpactState, selected: GraphNode, radar: RadarState) {
  const nodes = new Map((payload.graph.nodes || []).map((node) => [node.id, node]));
  const edges = payload.graph.edges || [];
  const candidates = new Map<string, CheckItem>();
  const addCandidate = (nodeId: string, reason: string) => {
    if (nodeId === selected.id) {
      return;
    }
    const node = nodes.get(nodeId);
    if (!node || (node.kind !== "file" && !node.file)) {
      return;
    }
    const existing = candidates.get(nodeId);
    if (existing) {
      if (!existing.reason.includes(reason)) {
        existing.reason = `${existing.reason}；${reason}`;
      }
      return;
    }
    candidates.set(nodeId, toCheckItem(node, reason, radar));
  };

  for (const edge of edges) {
    if (edge.from === selected.id) {
      addCandidate(edge.to, relationReason(edge, "downstream"));
    }
    if (edge.to === selected.id) {
      addCandidate(edge.from, relationReason(edge, "upstream"));
    }
  }

  for (const contractId of contractIdsForNode(payload, selected.id)) {
    for (const edge of edges) {
      if (edge.contract !== contractId && edge.from !== `contract:${contractId}` && edge.to !== `contract:${contractId}`) {
        continue;
      }
      if (edge.relation === "source" || edge.relation === "witness") {
        addCandidate(edge.from, `同属 ${contractId} 契约`);
        addCandidate(edge.to, `同属 ${contractId} 契约`);
      }
    }
  }

  return [...candidates.values()].sort((a, b) => tonePriority(a.tone) - tonePriority(b.tone) || a.label.localeCompare(b.label));
}

function toCheckItem(node: GraphNode, reason: string, radar: RadarState): CheckItem {
  const changed = radar.changedNodeIds.has(node.id) || Boolean(node.changed);
  const reviewed = radar.closedWitnessNodeIds.has(node.id) || (node.status || []).some((status) => status === "reviewed" || status === "updated");
  const risky = radar.pendingClosureNodeIds.has(node.id) || (node.status || []).some((status) => riskStatuses.has(status));
  const unlinked = node.covered === false || (node.status || []).includes("orphan");

  if (risky || unlinked) {
    return {
      id: node.id,
      label: node.file || node.label,
      reason,
      state: unlinked ? "未接入" : "仍需处理",
      action: unlinked ? "补 impact.yaml 契约或真实引用" : "同步修改或补 review receipt",
      tone: "risk"
    };
  }
  if (changed) {
    return {
      id: node.id,
      label: node.file || node.label,
      reason,
      state: "已修改",
      action: reviewed ? "已覆盖本次影响" : "确认修改是否覆盖依赖变化",
      tone: "changed"
    };
  }
  if (reviewed) {
    return {
      id: node.id,
      label: node.file || node.label,
      reason,
      state: "已审查",
      action: "无需补改",
      tone: "reviewed"
    };
  }
  return {
    id: node.id,
    label: node.file || node.label,
    reason,
    state: "待检查",
    action: "判断是否需要同步修改",
    tone: "todo"
  };
}

function relationReason(edge: GraphEdge, direction: "upstream" | "downstream") {
  if (edge.contract && (edge.relation === "source" || edge.relation === "witness")) {
    return `${direction === "upstream" ? "上游" : "下游"} ${edge.contract} 契约`;
  }
  if (edge.relation === "mentions") {
    return "真实引用关系";
  }
  if (edge.relation === "missing") {
    return "断裂或缺失引用";
  }
  return `${direction === "upstream" ? "上游" : "下游"} ${edge.relation} 关系`;
}

function currentFileState(
  node: GraphNode,
  radar: RadarState,
  tasks: Array<{ reason: string }>,
  diagnostics: Array<{ reason: string }>
) {
  const items = (node.status || []).map((status) => `状态：${labelStatus(status)}`);
  if (node.covered === false || (node.status || []).includes("orphan")) {
    items.push("接入：未进入 impact.yaml 契约或真实引用网络。");
  }
  if (radar.recentlyChangedNodeIds.has(node.id)) {
    items.push("实时监控：最近 10 秒内发生变更，图谱节点会保持高亮。");
  } else if (radar.activityTrailNodeIds.has(node.id)) {
    items.push("实时监控：保留最近变更余波。");
  }
  if (tasks.length) {
    items.push(...tasks.map((task) => `待处理：${task.reason}`));
  }
  if (diagnostics.length) {
    items.push(...diagnostics.map((item) => `诊断：${item.reason}`));
  }
  if (!items.length) {
    items.push("当前没有风险状态；可继续查看上下游文件是否需要同步修改。");
  }
  return items;
}

function formatContract(contract: GraphContract) {
  const missing = contract.current?.missingWitnesses || [];
  const changed = contract.current?.changedSources || [];
  const state = missing.length ? `缺口 ${missing.length}` : "已通过";
  const sourceText = changed.length ? `变更源 ${changed.join(", ")}` : "无变更源";
  return `${contract.id} · ${state} · ${sourceText}`;
}

function tonePriority(tone: CheckItem["tone"]) {
  return { risk: 0, todo: 1, changed: 2, reviewed: 3 }[tone];
}
