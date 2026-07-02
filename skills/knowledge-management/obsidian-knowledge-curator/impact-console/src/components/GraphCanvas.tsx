import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import cytoscape, { type Core } from "cytoscape";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum
} from "d3-force";
import type { GraphFilters, GraphLayer, GraphPosition, ImpactState, LayoutEngine, RadarState } from "../types/impact";
import { emptyGraphText, graphElements, layoutForCurrentMode, layoutOptions, stageDescription } from "../graph/graphModel";
import { graphStyle } from "../graph/graphStyle";
import { matchesNodeSearch } from "../utils/impactText";

interface GraphCanvasProps {
  payload: ImpactState | null;
  filters: GraphFilters;
  radar: RadarState | null;
  selectedNodeId: string;
  layoutEngine: LayoutEngine;
  layoutNonce: number;
  cyRef: MutableRefObject<Core | null>;
  positionsRef: MutableRefObject<Map<string, GraphPosition>>;
  onSelectNode: (id: string, options?: { focusMode?: boolean; clearSearch?: boolean }) => void;
  onClearSelection: () => void;
  onSetMode: (mode: GraphLayer) => void;
}

interface GraphSyncStats {
  addedNodes: number;
  addedEdges: number;
  removedElements: number;
  updatedElements: number;
  preservedPanZoom: boolean;
  localReheat: boolean;
  layoutEngine: string;
  addedNodeIds: string[];
}

interface D3ForceNode extends SimulationNodeDatum {
  id: string;
  radius: number;
  degree: number;
  componentSize: number;
  componentRank: number;
  isIsolated: boolean;
  targetX: number;
  targetY: number;
}

interface D3ForceLink extends SimulationLinkDatum<D3ForceNode> {
  id: string;
  relation: string;
  distance: number;
  strength: number;
}

interface D3LayoutOptions {
  fit: boolean;
  alpha: number;
  warmTicks: number;
  maxAnimatedTicks: number;
}

interface ComponentTarget {
  componentSize: number;
  componentRank: number;
  isIsolated: boolean;
  targetX: number;
  targetY: number;
}

interface ViewportSnapshot {
  zoom: number;
  panX: number;
  panY: number;
}

const COMPACT_LABEL_ZOOM = 0.7;
const DETAIL_LABEL_ZOOM = 1.08;

declare global {
  interface Window {
    skillImpactConsole?: {
      cy: Core;
      state: {
        payload: ImpactState;
        selectedNodeId: string;
        filters: GraphFilters;
      };
      selectNode: GraphCanvasProps["onSelectNode"];
      clearSelection: GraphCanvasProps["onClearSelection"];
      setMode: GraphCanvasProps["onSetMode"];
    };
  }
}

export function GraphCanvas(props: GraphCanvasProps) {
  const {
    payload,
    filters,
    radar,
    selectedNodeId,
    layoutEngine,
    layoutNonce,
    cyRef,
    positionsRef,
    onSelectNode,
    onClearSelection,
    onSetMode
  } = props;
  const graphRef = useRef<HTMLDivElement | null>(null);
  const d3SimulationRef = useRef<Simulation<D3ForceNode, D3ForceLink> | null>(null);
  const currentLayoutNameRef = useRef("");
  const rebuildCountRef = useRef(0);
  const lastLayoutKeyRef = useRef("");
  const lastSyncStatsRef = useRef<GraphSyncStats | null>(null);
  const [emptyText, setEmptyText] = useState("没有匹配当前筛选的节点。");
  const [isEmpty, setIsEmpty] = useState(false);
  const [stageLabel, setStageLabel] = useState("正在加载文件关系图谱。");

  const elements = useMemo(() => {
    if (!payload || !radar) {
      return [];
    }
    return graphElements(payload, filters, selectedNodeId, radar, positionsRef.current, false);
  }, [payload, filters, radar, selectedNodeId, layoutNonce, positionsRef]);

  const layoutKey = useMemo(
    () => `${layoutEngine}|${layoutNonce}|${filters.mode}|${filters.search}|${filters.contract}|${filters.relation}`,
    [filters.contract, filters.mode, filters.relation, filters.search, layoutEngine, layoutNonce]
  );

  const reheatAfterDrag = useCallback(() => {
    const cy = cyRef.current;
    const graphElement = graphRef.current;
    if (!cy || !graphElement || currentLayoutNameRef.current !== "d3-force") {
      return;
    }
    runD3ForceLayout(cy, graphElement, positionsRef.current, d3SimulationRef, {
      fit: false,
      alpha: 0.18,
      warmTicks: 0,
      maxAnimatedTicks: 42
    });
  }, [cyRef, positionsRef]);

  useEffect(() => {
    if (!payload || !radar || !graphRef.current) {
      return undefined;
    }

    let cy = cyRef.current;
    const layoutName = resolveLayoutName(filters, layoutEngine);
    currentLayoutNameRef.current = layoutName;
    const shouldCreate = !cy || cy.destroyed();

    if (shouldCreate) {
      cy = cytoscape({
        container: graphRef.current,
        elements: [],
        minZoom: 0.18,
        maxZoom: 2.8,
        textureOnViewport: true,
        motionBlur: true,
        motionBlurOpacity: 0.16,
        panningEnabled: true,
        userPanningEnabled: true,
        zoomingEnabled: true,
        userZoomingEnabled: true,
        autoungrabify: false,
        boxSelectionEnabled: true,
        selectionType: "single",
        layout: layoutOptions("preset"),
        style: graphStyle()
      });

      cyRef.current = cy;
      graphRef.current.dataset.rebuilds = String(++rebuildCountRef.current);
      bindGraphEvents(cy, graphRef.current, positionsRef, onSelectNode, onClearSelection, reheatAfterDrag);
    }

    if (!cy) {
      return undefined;
    }
    const activeCy = cy;
    const forceLayout = shouldCreate || layoutKey !== lastLayoutKeyRef.current;
    const syncStats = syncGraphElements(activeCy, elements, positionsRef.current, forceLayout);
    syncStats.layoutEngine = layoutName;

    if (forceLayout) {
      runGraphLayout(activeCy, layoutName, graphRef.current, positionsRef.current, d3SimulationRef, {
        fit: true,
        alpha: 0.82,
        warmTicks: layoutName === "d3-force" ? 112 : 0,
        maxAnimatedTicks: 150
      });
      lastLayoutKeyRef.current = layoutKey;
    } else if (syncStats.addedNodeIds.length) {
      syncStats.localReheat = reheatAddedNeighborhood(
        activeCy,
        syncStats.addedNodeIds,
        layoutName,
        graphRef.current,
        positionsRef.current,
        d3SimulationRef
      );
    }

    lastSyncStatsRef.current = syncStats;
    window.skillImpactConsole = {
      cy: activeCy,
      state: {
        payload,
        selectedNodeId,
        filters
      },
      selectNode: onSelectNode,
      clearSelection: onClearSelection,
      setMode: onSetMode
    };
    applyHighlight(activeCy, selectedNodeId, filters, graphRef.current);
    writeGraphDataset(graphRef.current, activeCy, syncStats);
    return undefined;
  }, [cyRef, elements, filters, layoutEngine, layoutKey, onClearSelection, onSelectNode, onSetMode, payload, positionsRef, radar, reheatAfterDrag, selectedNodeId]);

  useEffect(() => {
    return () => {
      stopD3Simulation(d3SimulationRef);
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      if (!cy.destroyed()) {
        cy.stop();
        cy.nodes().forEach((node) => {
          positionsRef.current.set(node.id(), node.position());
        });
        cy.destroy();
      }
      if (cyRef.current === cy) {
        cyRef.current = null;
      }
    };
  }, [cyRef, positionsRef]);

  useEffect(() => {
    if (!payload || !radar || !graphRef.current) {
      return;
    }

    const graphNodeCount = elements.filter((element) => element.group === "nodes").length;
    setEmptyText(emptyGraphText(payload, filters));
    const searchHitCount = filters.search.trim()
      ? (payload.graph.nodes || []).filter((node) => matchesNodeSearch(node, filters.search)).length
      : graphNodeCount;
    setIsEmpty(graphNodeCount === 0 || searchHitCount === 0);
    setStageLabel(stageDescription(payload, filters, selectedNodeId, elements));

    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    window.skillImpactConsole = {
      cy,
      state: {
        payload,
        selectedNodeId,
        filters
      },
      selectNode: onSelectNode,
      clearSelection: onClearSelection,
      setMode: onSetMode
    };
    applyHighlight(cy, selectedNodeId, filters, graphRef.current);
    writeGraphDataset(graphRef.current, cy, lastSyncStatsRef.current);
  }, [cyRef, elements, filters, onClearSelection, onSelectNode, onSetMode, payload, radar, selectedNodeId]);

  useEffect(() => {
    if (cyRef.current && graphRef.current) {
      applyHighlight(cyRef.current, selectedNodeId, filters, graphRef.current);
      writeGraphDataset(graphRef.current, cyRef.current, lastSyncStatsRef.current);
    }
  }, [cyRef, filters, selectedNodeId]);

  return (
    <>
      <div className="graph-stage-label">{stageLabel}</div>
      <div className="graph-canvas pulse" ref={graphRef} aria-label="impact graph" />
      <div className={`graph-empty ${isEmpty ? "show" : ""}`}>{emptyText}</div>
      <div className="legend">
        <span className="legend-item"><span className="dot changed" />changed</span>
        <span className="legend-item"><span className="dot contract" />contract</span>
        <span className="legend-item"><span className="dot pending" />pending</span>
        <span className="legend-item"><span className="dot ok" />reviewed</span>
        <span className="legend-item"><span className="dot bad" />risk</span>
      </div>
    </>
  );
}

function bindGraphEvents(
  cy: Core,
  graphElement: HTMLElement,
  positionsRef: MutableRefObject<Map<string, GraphPosition>>,
  onSelectNode: GraphCanvasProps["onSelectNode"],
  onClearSelection: GraphCanvasProps["onClearSelection"],
  onDragReheat: () => void
) {
  cy.on("tap", "node", (event) => {
    onSelectNode(event.target.id(), { clearSearch: false });
  });

  cy.on("mouseover", "node", (event) => {
    cy.elements().removeClass("hovered hover-neighbor hover-muted");
    const node = event.target;
    const neighborhood = node.closedNeighborhood();
    node.addClass("hovered");
    neighborhood.addClass("hover-neighbor");
    cy.elements().not(neighborhood).addClass("hover-muted");
    graphElement.setAttribute("data-hovered", node.id());
    writeGraphDataset(graphElement, cy);
  });

  cy.on("mouseout", "node", () => {
    cy.elements().removeClass("hovered hover-neighbor hover-muted");
    graphElement.setAttribute("data-hovered", "");
    writeGraphDataset(graphElement, cy);
  });

  cy.on("tap", (event) => {
    if (event.target === cy) {
      onClearSelection();
    }
  });

  cy.on("dragfree", "node", (event) => {
    positionsRef.current.set(event.target.id(), event.target.position());
    onDragReheat();
    writeGraphDataset(graphElement, cy);
  });

  cy.on("pan zoom layoutstop", () => {
    writeGraphDataset(graphElement, cy);
  });
}

function syncGraphElements(
  cy: Core,
  elements: ReturnType<typeof graphElements>,
  positions: Map<string, GraphPosition>,
  forceLayout: boolean
): GraphSyncStats {
  const before = viewportSnapshot(cy);
  const incomingIds = new Set(elements.map((element) => String(element.data?.id || "")).filter(Boolean));
  const stats: GraphSyncStats = {
    addedNodes: 0,
    addedEdges: 0,
    removedElements: 0,
    updatedElements: 0,
    preservedPanZoom: true,
    localReheat: false,
    layoutEngine: "",
    addedNodeIds: []
  };

  cy.batch(() => {
    cy.elements().forEach((target) => {
      if (incomingIds.has(target.id())) {
        return;
      }
      if (target.isNode()) {
        positions.set(target.id(), target.position());
      }
      target.remove();
      stats.removedElements += 1;
    });

    const nodeElements = elements.filter((element) => element.group === "nodes");

    for (const element of nodeElements) {
      const id = String(element.data?.id || "");
      if (!id) {
        continue;
      }
      const target = cy.$id(id);
      if (target.length) {
        target.data(element.data || {});
        target.classes(String(element.classes || ""));
        stats.updatedElements += 1;
        continue;
      }
      const position = forceLayout
        ? undefined
        : element.position || positions.get(id) || placeNewNodeNearNeighbor(cy, id, elements, stats.addedNodes);
      cy.add({
        ...element,
        position
      });
      stats.addedNodes += 1;
      stats.addedNodeIds.push(id);
    }

    for (const element of elements) {
      const id = String(element.data?.id || "");
      if (!id) {
        continue;
      }
      if (element.group === "nodes") {
        continue;
      }
      const target = cy.$id(id);
      if (!target.length) {
        cy.add(element);
        stats.addedEdges += 1;
        continue;
      }
      target.data(element.data || {});
      target.classes(String(element.classes || ""));
      stats.updatedElements += 1;
    }
  });

  for (const node of cy.nodes()) {
    positions.set(node.id(), node.position());
  }

  const after = viewportSnapshot(cy);
  stats.preservedPanZoom = forceLayout ? false : sameViewport(before, after);
  return stats;
}

function placeNewNodeNearNeighbor(
  cy: Core,
  id: string,
  elements: ReturnType<typeof graphElements>,
  index: number
) {
  const incident = elements.filter((element) => {
    if (element.group !== "edges") {
      return false;
    }
    return element.data?.source === id || element.data?.target === id;
  });

  for (const edge of incident) {
    const source = String(edge.data?.source || "");
    const target = String(edge.data?.target || "");
    const neighborId = source === id ? target : source;
    const neighbor = cy.$id(neighborId);
    if (!neighbor.length) {
      continue;
    }
    const position = neighbor.position();
    const offset = radialOffset(id, 56 + index * 6);
    return {
      x: position.x + offset.x,
      y: position.y + offset.y
    };
  }

  const extent = cy.elements().length ? cy.extent() : { x1: -80, x2: 80, y1: -80, y2: 80 };
  const center = {
    x: (extent.x1 + extent.x2) / 2,
    y: (extent.y1 + extent.y2) / 2
  };
  const offset = radialOffset(id, 130 + index * 12);
  return {
    x: center.x + offset.x,
    y: center.y + offset.y
  };
}

function radialOffset(id: string, radius: number) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 9973;
  }
  const angle = (hash / 9973) * Math.PI * 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
}

function resolveLayoutName(filters: GraphFilters, layoutEngine: LayoutEngine) {
  if (layoutEngine === "d3-force") {
    return "d3-force";
  }
  return layoutForCurrentMode(filters);
}

function runGraphLayout(
  cy: Core,
  layoutName: string,
  graphElement: HTMLElement,
  positions: Map<string, GraphPosition>,
  d3SimulationRef: MutableRefObject<Simulation<D3ForceNode, D3ForceLink> | null>,
  options: D3LayoutOptions
) {
  if (!cy.nodes().length) {
    return;
  }
  if (layoutName === "d3-force") {
    runD3ForceLayout(cy, graphElement, positions, d3SimulationRef, options);
    return;
  }
  stopD3Simulation(d3SimulationRef);
  writeD3Dataset(graphElement, 0, 0, false);
  const layout = cy.layout(layoutOptions(layoutName));
  layout.run();
}

function reheatAddedNeighborhood(
  cy: Core,
  addedNodeIds: string[],
  layoutName: string,
  graphElement: HTMLElement,
  positions: Map<string, GraphPosition>,
  d3SimulationRef: MutableRefObject<Simulation<D3ForceNode, D3ForceLink> | null>
) {
  let added = cy.collection();
  for (const id of addedNodeIds) {
    added = added.union(cy.$id(id));
  }
  if (!added.length) {
    return false;
  }
  const neighborhood = added.closedNeighborhood();
  if (neighborhood.nodes().length <= 1) {
    return false;
  }

  if (layoutName === "d3-force") {
    runD3ForceLayout(cy, graphElement, positions, d3SimulationRef, {
      fit: false,
      alpha: 0.42,
      warmTicks: 12,
      maxAnimatedTicks: 90
    });
    return true;
  }

  stopD3Simulation(d3SimulationRef);
  neighborhood.layout({
    ...layoutOptions("cose"),
    fit: false,
    padding: 24,
    animate: true,
    animationDuration: 360,
    randomize: false,
    numIter: 450,
    initialTemp: 70,
    coolingFactor: 0.92
  } as ReturnType<typeof layoutOptions>).run();
  return true;
}

function runD3ForceLayout(
  cy: Core,
  graphElement: HTMLElement,
  positions: Map<string, GraphPosition>,
  d3SimulationRef: MutableRefObject<Simulation<D3ForceNode, D3ForceLink> | null>,
  options: D3LayoutOptions
) {
  stopD3Simulation(d3SimulationRef);

  const links = d3LinksFromCy(cy);
  const nodes = d3NodesFromCy(cy, positions, links);
  if (!nodes.length) {
    writeD3Dataset(graphElement, 0, 0, false);
    writeD3LayoutMetrics(graphElement, []);
    return;
  }
  writeD3LayoutMetrics(graphElement, nodes);

  const linkForce = forceLink<D3ForceNode, D3ForceLink>(links)
    .id((node) => node.id)
    .distance((link) => link.distance)
    .strength((link) => link.strength)
    .iterations(2);

  const simulation = forceSimulation<D3ForceNode>(nodes)
    .force("link", linkForce)
    .force("charge", forceManyBody<D3ForceNode>().strength((node) => (
      node.isIsolated
        ? -58 - node.radius * 2.4
        : -66 - node.radius * 3.1 - Math.min(54, node.degree * 3.4)
    )))
    .force("collide", forceCollide<D3ForceNode>().radius((node) => node.radius + (node.isIsolated ? 16 : 5)).strength(0.9).iterations(2))
    .force("x", forceX<D3ForceNode>((node) => node.targetX).strength((node) => node.isIsolated ? 0.075 : node.componentSize <= 3 ? 0.045 : 0.014))
    .force("y", forceY<D3ForceNode>((node) => node.targetY).strength((node) => node.isIsolated ? 0.075 : node.componentSize <= 3 ? 0.045 : 0.014))
    .alpha(options.alpha)
    .alphaMin(0.018)
    .alphaDecay(0.024)
    .velocityDecay(0.29)
    .stop();

  let ticks = 0;
  if (options.warmTicks > 0) {
    simulation.tick(options.warmTicks);
    ticks += options.warmTicks;
    applyD3Positions(cy, nodes, positions);
  }

  if (options.fit) {
    cy.fit(cy.elements(), 84);
  }

  writeD3Dataset(graphElement, ticks, simulation.alpha(), true);
  d3SimulationRef.current = simulation;
  let finished = false;
  const finish = () => {
    if (finished) {
      return;
    }
    finished = true;
    simulation.stop();
    applyD3Positions(cy, nodes, positions);
    if (options.fit) {
      cy.fit(cy.elements(), 86);
    }
    writeD3Dataset(graphElement, ticks, simulation.alpha(), false);
    if (d3SimulationRef.current === simulation) {
      d3SimulationRef.current = null;
    }
  };

  simulation
    .on("tick", () => {
      ticks += 1;
      applyD3Positions(cy, nodes, positions);
      writeD3Dataset(graphElement, ticks, simulation.alpha(), true);
      if (ticks >= options.warmTicks + options.maxAnimatedTicks) {
        finish();
      }
    })
    .on("end", () => {
      finish();
    });

  simulation.alpha(options.alpha).restart();
}

function stopD3Simulation(d3SimulationRef: MutableRefObject<Simulation<D3ForceNode, D3ForceLink> | null>) {
  if (!d3SimulationRef.current) {
    return;
  }
  d3SimulationRef.current.stop();
  d3SimulationRef.current = null;
}

function d3NodesFromCy(cy: Core, positions: Map<string, GraphPosition>, links: D3ForceLink[]) {
  const cyNodes = cy.nodes();
  const nodeIds = cyNodes.map((node) => node.id());
  const componentTargets = componentTargetsByNodeId(nodeIds, links);
  return cy.nodes().map((node, index) => {
    const id = node.id();
    const target = componentTargets.get(id) || {
      componentSize: 1,
      componentRank: index,
      isIsolated: true,
      targetX: 0,
      targetY: 0
    };
    const stored = positions.get(id);
    const current = node.position();
    const hasPosition = Boolean(stored)
      || Math.abs(current.x) > 0.5
      || Math.abs(current.y) > 0.5;
    const seedOffset = radialOffset(`${id}:seed`, target.isIsolated ? 18 : 44 + Math.min(70, target.componentSize * 1.8));
    const seed = hasPosition
      ? (stored || current)
      : {
        x: target.targetX + seedOffset.x,
        y: target.targetY + seedOffset.y
      };
    const visualSize = Number(node.data("visualSize") || 12);
    return {
      id,
      radius: Math.max(12, visualSize * 0.72 + 10),
      degree: node.connectedEdges().length,
      componentSize: target.componentSize,
      componentRank: target.componentRank,
      isIsolated: target.isIsolated,
      targetX: target.targetX,
      targetY: target.targetY,
      x: seed.x,
      y: seed.y
    };
  });
}

function componentTargetsByNodeId(nodeIds: string[], links: D3ForceLink[]) {
  const parent = new Map<string, string>();
  for (const id of nodeIds) {
    parent.set(id, id);
  }

  const find = (id: string): string => {
    const current = parent.get(id) || id;
    if (current === id) {
      parent.set(id, id);
      return id;
    }
    const root = find(current);
    parent.set(id, root);
    return root;
  };

  const union = (left: string, right: string) => {
    if (!parent.has(left) || !parent.has(right)) {
      return;
    }
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parent.set(rightRoot, leftRoot);
    }
  };

  for (const link of links) {
    union(linkEndpointId(link.source), linkEndpointId(link.target));
  }

  const groups = new Map<string, string[]>();
  for (const id of nodeIds) {
    const root = find(id);
    const group = groups.get(root) || [];
    group.push(id);
    groups.set(root, group);
  }

  const components = [...groups.values()].sort((left, right) => {
    if (right.length !== left.length) {
      return right.length - left.length;
    }
    return left[0].localeCompare(right[0]);
  });
  const connected = components.filter((component) => component.length > 1);
  const isolated = components.filter((component) => component.length === 1).flat();
  const targets = new Map<string, ComponentTarget>();
  const centers = [
    { x: 64, y: -38 },
    { x: -210, y: 170 },
    { x: 255, y: 185 },
    { x: -295, y: -145 },
    { x: 320, y: -160 }
  ];

  connected.forEach((component, rank) => {
    const center = centers[rank] || radialOffset(`component:${rank}`, 250 + rank * 34);
    for (const id of component) {
      targets.set(id, {
        componentSize: component.length,
        componentRank: rank,
        isIsolated: false,
        targetX: center.x,
        targetY: center.y
      });
    }
  });

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  isolated.sort().forEach((id, index) => {
    const radius = 360 + (index % 28) * 5 + Math.floor(index / 28) * 72;
    const angle = index * goldenAngle - Math.PI * 0.72;
    targets.set(id, {
      componentSize: 1,
      componentRank: connected.length + index,
      isIsolated: true,
      targetX: Math.cos(angle) * radius - 48,
      targetY: Math.sin(angle) * radius + 24
    });
  });

  return targets;
}

function linkEndpointId(endpoint: string | number | D3ForceNode | undefined) {
  if (!endpoint) {
    return "";
  }
  if (typeof endpoint === "string" || typeof endpoint === "number") {
    return String(endpoint);
  }
  return endpoint.id;
}

function d3LinksFromCy(cy: Core) {
  return cy.edges().map((edge) => {
    const relation = String(edge.data("relation") || "");
    const isContractMain = edge.hasClass("contract-main") || relation === "source" || relation === "witness";
    const isSupport = edge.hasClass("support-edge") || relation === "mentions" || relation === "entry" || relation === "command";
    const isMissing = relation === "missing";
    return {
      id: edge.id(),
      source: String(edge.data("source") || ""),
      target: String(edge.data("target") || ""),
      relation,
      distance: isMissing ? 118 : isContractMain ? 62 : isSupport ? 108 : 88,
      strength: isMissing ? 0.04 : isContractMain ? 0.2 : isSupport ? 0.045 : 0.09
    };
  });
}

function applyD3Positions(cy: Core, nodes: D3ForceNode[], positions: Map<string, GraphPosition>) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  cy.batch(() => {
    cy.nodes().forEach((node) => {
      const d3Node = byId.get(node.id());
      if (!d3Node || typeof d3Node.x !== "number" || typeof d3Node.y !== "number") {
        return;
      }
      const position = { x: d3Node.x, y: d3Node.y };
      node.position(position);
      positions.set(node.id(), position);
    });
  });
}

function writeD3Dataset(graphElement: HTMLElement, ticks: number, alpha: number, running: boolean) {
  graphElement.dataset.d3Ticks = String(ticks);
  graphElement.dataset.d3Alpha = alpha.toFixed(3);
  graphElement.dataset.d3Running = String(running);
}

function writeD3LayoutMetrics(graphElement: HTMLElement, nodes: D3ForceNode[]) {
  const componentKeys = new Set(nodes.map((node) => node.componentRank));
  const componentSizes = nodes.map((node) => node.componentSize);
  graphElement.dataset.d3Components = String(componentKeys.size);
  graphElement.dataset.d3IsolatedNodes = String(nodes.filter((node) => node.isIsolated).length);
  graphElement.dataset.d3LargestComponent = String(componentSizes.length ? Math.max(...componentSizes) : 0);
}

function viewportSnapshot(cy: Core): ViewportSnapshot {
  const pan = cy.pan();
  return {
    zoom: cy.zoom(),
    panX: pan.x,
    panY: pan.y
  };
}

function sameViewport(before: ViewportSnapshot, after: ViewportSnapshot) {
  return Math.abs(before.zoom - after.zoom) < 0.001
    && Math.abs(before.panX - after.panX) < 0.1
    && Math.abs(before.panY - after.panY) < 0.1;
}

function writeGraphDataset(graphElement: HTMLElement, cy: Core, syncStats?: GraphSyncStats | null) {
  applyLabelLod(cy, graphElement);
  writeGraphTopologyMetrics(graphElement, cy);
  const hasTopologyDelta = Boolean(syncStats && (syncStats.addedNodes || syncStats.addedEdges || syncStats.removedElements));
  graphElement.dataset.ready = "true";
  graphElement.dataset.nodes = String(cy.nodes().length);
  graphElement.dataset.edges = String(cy.edges().length);
  graphElement.dataset.panning = String(cy.userPanningEnabled());
  graphElement.dataset.zooming = String(cy.userZoomingEnabled());
  graphElement.dataset.grabbable = String(cy.nodes()[0] ? cy.nodes()[0].grabbable() : false);
  graphElement.dataset.zoom = cy.zoom().toFixed(3);
  graphElement.dataset.panX = cy.pan().x.toFixed(1);
  graphElement.dataset.panY = cy.pan().y.toFixed(1);
  graphElement.dataset.addedNodes = String(syncStats ? (hasTopologyDelta ? syncStats.addedNodes : graphElement.dataset.addedNodes ?? 0) : graphElement.dataset.addedNodes ?? 0);
  graphElement.dataset.addedEdges = String(syncStats ? (hasTopologyDelta ? syncStats.addedEdges : graphElement.dataset.addedEdges ?? 0) : graphElement.dataset.addedEdges ?? 0);
  graphElement.dataset.removedElements = String(syncStats ? (hasTopologyDelta ? syncStats.removedElements : graphElement.dataset.removedElements ?? 0) : graphElement.dataset.removedElements ?? 0);
  graphElement.dataset.updatedElements = String(syncStats?.updatedElements ?? graphElement.dataset.updatedElements ?? 0);
  graphElement.dataset.preservedPanZoom = String(syncStats?.preservedPanZoom ?? graphElement.dataset.preservedPanZoom ?? true);
  graphElement.dataset.localReheat = String(syncStats ? (hasTopologyDelta ? syncStats.localReheat : graphElement.dataset.localReheat ?? false) : graphElement.dataset.localReheat ?? false);
  graphElement.dataset.layoutEngine = syncStats?.layoutEngine || graphElement.dataset.layoutEngine || "";
  graphElement.dataset.activePathNodes = String(cy.nodes(".active-path").length);
  graphElement.dataset.recentNodes = String(cy.nodes(".recently-changed").length);
  graphElement.dataset.changedNodes = String(cy.nodes(".changed-node").length);
  graphElement.dataset.pendingNodes = String(cy.nodes(".pending-closure").length);
  graphElement.dataset.activePathEdges = String(cy.edges(".active-path-edge").length);
  graphElement.dataset.triggerEdges = String(cy.edges(".trigger-edge").length);
  graphElement.dataset.hoverNeighborNodes = String(cy.nodes(".hover-neighbor").length);
  graphElement.dataset.hoverNeighborEdges = String(cy.edges(".hover-neighbor").length);
  graphElement.dataset.hoverMuted = String(cy.elements(".hover-muted").length);
  const visualSizes = cy.nodes().map((node) => Number(node.data("visualSize") || 0)).filter(Boolean);
  graphElement.dataset.minNodeSize = String(visualSizes.length ? Math.min(...visualSizes) : 0);
  graphElement.dataset.maxNodeSize = String(visualSizes.length ? Math.max(...visualSizes) : 0);
  graphElement.dataset.nodeSizeSteps = String(new Set(visualSizes).size);
}

function writeGraphTopologyMetrics(graphElement: HTMLElement, cy: Core) {
  const nodeIds = cy.nodes().map((node) => node.id());
  const targets = componentTargetsByNodeId(nodeIds, d3LinksFromCy(cy));
  const componentSizes = nodeIds.map((id) => targets.get(id)?.componentSize || 0);
  const componentRanks = new Set(nodeIds.map((id) => targets.get(id)?.componentRank));
  graphElement.dataset.d3Components = String(nodeIds.length ? componentRanks.size : 0);
  graphElement.dataset.d3IsolatedNodes = String(nodeIds.filter((id) => targets.get(id)?.isIsolated).length);
  graphElement.dataset.d3LargestComponent = String(componentSizes.length ? Math.max(...componentSizes) : 0);
}

function applyLabelLod(cy: Core, graphElement: HTMLElement) {
  const zoom = cy.zoom();
  const mode = zoom < COMPACT_LABEL_ZOOM ? "compact" : zoom < DETAIL_LABEL_ZOOM ? "focus" : "detail";
  const degrees = cy.nodes().map((node) => Number(node.data("degree") || node.connectedEdges().length || 0));
  const maxDegree = degrees.length ? Math.max(...degrees) : 0;
  const hubDegree = mode === "compact"
    ? Math.max(6, Math.ceil(maxDegree * 0.42))
    : Math.max(3, Math.ceil(maxDegree * 0.18));
  let visibleLabels = 0;
  let softLabels = 0;
  let hiddenLabels = 0;

  cy.batch(() => {
    cy.nodes().removeClass("label-hidden label-soft label-visible");
    cy.nodes().forEach((node) => {
      if (node.hasClass("search-dim") || node.hasClass("faded") || node.hasClass("hover-muted")) {
        node.addClass("label-hidden");
        hiddenLabels += 1;
        return;
      }

      const degree = Number(node.data("degree") || node.connectedEdges().length || 0);
      const pinned = node.hasClass("selected-node")
        || node.hasClass("search-hit")
        || node.hasClass("hovered")
        || node.hasClass("hover-neighbor")
        || node.hasClass("highlighted")
        || node.hasClass("active-path");
      const needsAttention = node.hasClass("recently-changed")
        || node.hasClass("pending-closure")
        || node.hasClass("witness-pending")
        || node.hasClass("version-pending")
        || node.hasClass("orphan-node")
        || node.hasClass("missing-node")
        || node.hasClass("broken-reference");
      const isContractHub = node.hasClass("contract-role") && degree >= (mode === "compact" ? 4 : 2);
      const shouldShow = mode === "detail" || pinned || needsAttention || isContractHub || degree >= hubDegree;

      if (!shouldShow) {
        node.addClass("label-hidden");
        hiddenLabels += 1;
        return;
      }

      if (!pinned && !needsAttention && mode === "focus") {
        node.addClass("label-soft");
        softLabels += 1;
        return;
      }

      node.addClass("label-visible");
      visibleLabels += 1;
    });
  });

  graphElement.dataset.labelLod = mode;
  graphElement.dataset.labelHubDegree = String(hubDegree);
  graphElement.dataset.visibleLabels = String(visibleLabels + softLabels);
  graphElement.dataset.softLabels = String(softLabels);
  graphElement.dataset.hiddenLabels = String(hiddenLabels);
}

function applyHighlight(cy: Core, selectedNodeId: string, filters: GraphFilters, graphElement: HTMLElement) {
  cy.elements().removeClass("faded highlighted selected-node");
  if (!selectedNodeId) {
    graphElement.dataset.highlighted = "0";
    graphElement.dataset.faded = "0";
    return;
  }

  const node = cy.$id(selectedNodeId);
  if (!node.length) {
    graphElement.dataset.highlighted = "0";
    graphElement.dataset.faded = "0";
    return;
  }

  const neighborhood = node.closedNeighborhood();
  cy.elements().not(neighborhood).addClass("faded");
  neighborhood.addClass("highlighted");
  node.addClass("selected-node");
  node.select();
  graphElement.dataset.highlighted = String(cy.elements(".highlighted").length);
  graphElement.dataset.faded = String(cy.elements(".faded").length);
}
