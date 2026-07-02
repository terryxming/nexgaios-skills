export type GraphLayer = "all" | "risk";

export type RelationFilter = "" | "source" | "witness" | "mentions" | "missing";

export type LayoutEngine = "d3-force" | "cose";

export interface ImpactSummary {
  status: "passing" | "failing" | "skipped";
  changedFiles: number;
  failureCount: number;
  warningCount: number;
  activeContracts: number;
  taskCount?: number;
}

export interface SkillMeta {
  id: string;
  domain: string;
  version: string;
  relativeDir: string;
}

export interface ChangeEntry {
  file: string;
  skillFile: string;
  kind: string;
}

export interface Diagnostic {
  level: "error" | "warning";
  file: string;
  reason: string;
}

export interface ConsoleTask {
  id: string;
  kind: string;
  severity: "error" | "warning";
  priority: number;
  file: string;
  contract?: string;
  reason: string;
  action: string;
}

export interface NodeContractRole {
  role: string;
  id: string;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: "file" | "contract" | "missing" | string;
  file?: string;
  changed?: boolean;
  covered?: boolean;
  category?: string;
  fileBytes?: number;
  status?: string[];
  roles?: string[];
  contracts?: NodeContractRole[];
  description?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: "source" | "witness" | "mentions" | "missing" | "entry" | "command" | string;
  contract?: string;
}

export interface ContractState {
  id: string;
  changedSources: string[];
  witnessCount: number;
  missingWitnesses: string[];
}

export interface GraphContract {
  id: string;
  description?: string;
  sources?: string[];
  witnesses?: string[];
  requires?: string[];
  active: boolean;
  current?: ContractState;
}

export interface ImpactGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  contracts: GraphContract[];
  brokenReferences?: Array<{ from: string; to: string }>;
}

export interface ImpactState {
  generatedAt: string;
  skill: SkillMeta;
  summary: ImpactSummary;
  changes: ChangeEntry[];
  diagnostics: Diagnostic[];
  tasks: ConsoleTask[];
  graph: ImpactGraph;
}

export interface GraphFilters {
  mode: GraphLayer;
  search: string;
  contract: string;
  relation: RelationFilter;
}

export interface GraphPosition {
  x: number;
  y: number;
}

export interface ActivityEntry {
  firstSeen: number;
  lastSeen: number;
  kind: string;
}

export type ActivityMap = Record<string, ActivityEntry>;

export interface RadarState {
  now: number;
  changedNodeIds: Set<string>;
  recentlyChangedNodeIds: Set<string>;
  activityTrailNodeIds: Set<string>;
  activeContractIds: Set<string>;
  activePathNodeIds: Set<string>;
  pendingClosureNodeIds: Set<string>;
  closedWitnessNodeIds: Set<string>;
  riskNodeIds: Set<string>;
  orphanNodeIds: Set<string>;
  missingNodeIds: Set<string>;
  selectedContractIds: Set<string>;
  activePathCount: number;
  pendingClosureCount: number;
}
