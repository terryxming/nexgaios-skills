import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Core } from "cytoscape";
import { connectImpactEvents, loadImpactState } from "./api/impactState";
import { GraphCanvas } from "./components/GraphCanvas";
import { FileIndex } from "./components/FileIndex";
import { Inspector } from "./components/Inspector";
import { Toolbar } from "./components/Toolbar";
import { TopBar } from "./components/TopBar";
import type { ActivityMap, GraphFilters, GraphLayer, GraphPosition, ImpactState, LayoutEngine, RelationFilter } from "./types/impact";
import { matchesNodeSearch } from "./utils/impactText";
import { buildRadarState, fileNodeId } from "./utils/radarState";

export function App() {
  const [payload, setPayload] = useState<ImpactState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [mode, setMode] = useState<GraphLayer>("all");
  const [search, setSearch] = useState("");
  const [contract, setContract] = useState("");
  const [relation, setRelation] = useState<RelationFilter>("");
  const [layoutEngine, setLayoutEngine] = useState<LayoutEngine>("d3-force");
  const [layoutNonce, setLayoutNonce] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("正在连接实时图谱");
  const [error, setError] = useState("");
  const [activity, setActivity] = useState<ActivityMap>({});
  const [activityClock, setActivityClock] = useState(() => Date.now());
  const cyRef = useRef<Core | null>(null);
  const positionsRef = useRef(new Map<string, GraphPosition>());
  const hasLoadedInitialPayloadRef = useRef(false);
  const previousChangeSnapshotRef = useRef(new Map<string, string>());

  const filters = useMemo<GraphFilters>(() => ({ mode, search, contract, relation }), [mode, search, contract, relation]);
  const radar = useMemo(
    () => payload ? buildRadarState(payload, selectedNodeId, activity, activityClock) : null,
    [payload, selectedNodeId, activity, activityClock]
  );

  const applyPayload = useCallback((next: ImpactState) => {
    const now = Date.now();
    const isInitialPayload = !hasLoadedInitialPayloadRef.current;
    hasLoadedInitialPayloadRef.current = true;
    const nextChangeSnapshot = new Map<string, string>();
    for (const change of next.changes || []) {
      nextChangeSnapshot.set(fileNodeId(change.skillFile), `${change.kind}:${change.file}`);
    }
    const activityChanges = isInitialPayload
      ? []
      : (next.changes || []).filter((change) => {
        const id = fileNodeId(change.skillFile);
        return previousChangeSnapshotRef.current.get(id) !== nextChangeSnapshot.get(id);
      });
    previousChangeSnapshotRef.current = nextChangeSnapshot;
    setPayload(next);
    setActivity((current) => {
      const updated: ActivityMap = { ...current };
      if (!isInitialPayload) {
        for (const change of activityChanges) {
          const id = fileNodeId(change.skillFile);
          updated[id] = {
            firstSeen: updated[id]?.firstSeen || now,
            lastSeen: now,
            kind: change.kind
          };
        }
      }
      for (const [id, entry] of Object.entries(updated)) {
        if (now - entry.lastSeen > 25_000) {
          delete updated[id];
        }
      }
      return updated;
    });
    setActivityClock(now);
    setSelectedNodeId((current) => current && next.graph.nodes.some((node) => node.id === current) ? current : "");
    setConnectionStatus("实时连接已建立");
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setActivity((current) => {
        let changed = false;
        const updated: ActivityMap = { ...current };
        for (const [id, entry] of Object.entries(updated)) {
          if (now - entry.lastSeen > 25_000) {
            delete updated[id];
            changed = true;
          }
        }
        return changed ? updated : current;
      });
      setActivityClock(now);
    }, 2_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    let cleanupEvents: (() => void) | undefined;
    loadImpactState()
      .then((state) => mounted && applyPayload(state))
      .then(() => {
        if (!mounted) {
          return undefined;
        }
        return connectImpactEvents(
          (state) => mounted && applyPayload(state),
          () => mounted && setConnectionStatus("实时连接重试中")
        );
      })
      .then((cleanup) => {
        cleanupEvents = cleanup;
        if (!mounted && cleanupEvents) {
          cleanupEvents();
        }
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      });

    return () => {
      mounted = false;
      cleanupEvents?.();
    };
  }, [applyPayload]);

  const selectNode = useCallback((id: string, options: { focusMode?: boolean; clearSearch?: boolean } = {}) => {
    if (!id) {
      return;
    }
    if (options.focusMode) {
      setContract("");
      setRelation("");
      if (options.clearSearch) {
        setSearch("");
      }
    }
    setSelectedNodeId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId("");
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    positionsRef.current.clear();
    setLayoutNonce((current) => current + 1);
    if (!payload || !value.trim()) {
      return;
    }
    setSelectedNodeId((current) => {
      const currentNode = payload.graph.nodes.find((node) => node.id === current);
      if (currentNode && matchesNodeSearch(currentNode, value)) {
        return current;
      }
      return payload.graph.nodes.find((node) => matchesNodeSearch(node, value))?.id || current;
    });
  }, [payload]);

  const handleMode = useCallback((value: GraphLayer) => {
    setMode(value);
    positionsRef.current.clear();
    setLayoutNonce((current) => current + 1);
  }, []);

  const handleContract = useCallback((value: string) => {
    setContract(value);
    positionsRef.current.clear();
    setLayoutNonce((current) => current + 1);
  }, []);

  const handleRelation = useCallback((value: RelationFilter) => {
    setRelation(value);
    positionsRef.current.clear();
    setLayoutNonce((current) => current + 1);
  }, []);

  const handleLayoutEngine = useCallback((value: LayoutEngine) => {
    setLayoutEngine(value);
    positionsRef.current.clear();
    setLayoutNonce((current) => current + 1);
  }, []);

  const fitGraph = useCallback(() => {
    cyRef.current?.fit(undefined, 58);
  }, []);

  const relayoutGraph = useCallback(() => {
    positionsRef.current.clear();
    setLayoutNonce((current) => current + 1);
  }, []);

  const focusSelected = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNodeId) {
      return;
    }
    const node = cy.$id(selectedNodeId);
    if (node.length) {
      cy.animate({ fit: { eles: node.closedNeighborhood(), padding: 72 } }, { duration: 280 });
    }
  }, [selectedNodeId]);

  const clearFilters = useCallback(() => {
    setMode("all");
    setSearch("");
    setContract("");
    setRelation("");
    setSelectedNodeId("");
    setLayoutNonce((current) => current + 1);
  }, []);

  return (
    <div className="app">
        <TopBar payload={payload} radar={radar} connectionStatus={connectionStatus} />
      <main className="workspace">
        <FileIndex payload={payload} radar={radar} search={search} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
        <section className="panel graph-panel">
          <Toolbar
            search={search}
            mode={mode}
            contract={contract}
            relation={relation}
            layoutEngine={layoutEngine}
            contracts={payload?.graph.contracts || []}
            onSearch={handleSearch}
            onMode={handleMode}
            onContract={handleContract}
            onRelation={handleRelation}
            onLayoutEngine={handleLayoutEngine}
            onFit={fitGraph}
            onRelayout={relayoutGraph}
            onFocus={focusSelected}
            onClear={clearFilters}
          />
          {payload ? (
            <GraphCanvas
              payload={payload}
              filters={filters}
              radar={radar}
              selectedNodeId={selectedNodeId}
              layoutEngine={layoutEngine}
              layoutNonce={layoutNonce}
              cyRef={cyRef}
              positionsRef={positionsRef}
              onSelectNode={selectNode}
              onClearSelection={clearSelection}
              onSetMode={handleMode}
            />
          ) : (
            <div className="empty">正在加载图谱状态。</div>
          )}
        </section>
        <Inspector payload={payload} radar={radar} selectedNodeId={selectedNodeId} filters={filters} error={error} />
      </main>
    </div>
  );
}
