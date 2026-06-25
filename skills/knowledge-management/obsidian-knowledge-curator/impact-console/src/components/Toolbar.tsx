import type { GraphContract, GraphLayer, LayoutEngine, RelationFilter } from "../types/impact";

interface ToolbarProps {
  search: string;
  mode: GraphLayer;
  contract: string;
  relation: RelationFilter;
  layoutEngine: LayoutEngine;
  contracts: GraphContract[];
  onSearch: (value: string) => void;
  onMode: (mode: GraphLayer) => void;
  onContract: (value: string) => void;
  onRelation: (value: RelationFilter) => void;
  onLayoutEngine: (value: LayoutEngine) => void;
  onFit: () => void;
  onRelayout: () => void;
  onFocus: () => void;
  onClear: () => void;
}

const layers: Array<{ value: GraphLayer; label: string }> = [
  { value: "all", label: "完整图谱" },
  { value: "risk", label: "只看缺口" }
];

const layoutEngines: Array<{ value: LayoutEngine; label: string }> = [
  { value: "d3-force", label: "D3 force" },
  { value: "cose", label: "CoSE" }
];

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="graph-toolbar">
      <div className="toolbar-search">
        <input
          id="graph-search"
          name="graph-search"
          className="search"
          type="search"
          value={props.search}
          onChange={(event) => props.onSearch(event.target.value)}
          placeholder="搜索文件、契约或状态"
        />
      </div>
      <details className="control-section" open>
        <summary>图层</summary>
        <div className="segmented">
          {layers.map((mode) => (
            <button
              className={`segment ${props.mode === mode.value ? "active" : ""}`}
              type="button"
              key={mode.value}
              onClick={() => props.onMode(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </details>
      <details className="control-section">
        <summary>筛选</summary>
        <select id="contract-filter" name="contract-filter" className="select" value={props.contract} onChange={(event) => props.onContract(event.target.value)} aria-label="契约组">
          <option value="">全部契约组</option>
          {props.contracts.map((contract) => (
            <option value={contract.id} key={contract.id}>{contract.id}</option>
          ))}
        </select>
      </details>
      <details className="control-section">
        <summary>状态</summary>
        <select id="relation-filter" name="relation-filter" className="select" value={props.relation} onChange={(event) => props.onRelation(event.target.value as RelationFilter)} aria-label="关系类型">
          <option value="">全部关系</option>
          <option value="source">source</option>
          <option value="witness">witness</option>
          <option value="mentions">mentions</option>
          <option value="missing">missing</option>
        </select>
      </details>
      <details className="control-section">
        <summary>布局</summary>
        <div className="segmented layout-engine">
          {layoutEngines.map((engine) => (
            <button
              className={`segment ${props.layoutEngine === engine.value ? "active" : ""}`}
              type="button"
              data-layout-engine={engine.value}
              aria-pressed={props.layoutEngine === engine.value}
              key={engine.value}
              onClick={() => props.onLayoutEngine(engine.value)}
            >
              {engine.label}
            </button>
          ))}
        </div>
        <div className="tool-row">
          <button className="tool-button" type="button" data-graph-action="fit" onClick={props.onFit}>Fit</button>
          <button className="tool-button" type="button" data-graph-action="relayout" onClick={props.onRelayout}>重布局</button>
          <button className="tool-button" type="button" data-graph-action="focus" onClick={props.onFocus}>聚焦选中</button>
          <button className="tool-button" type="button" data-graph-action="clear" onClick={props.onClear}>清除</button>
        </div>
      </details>
      </div>
  );
}
