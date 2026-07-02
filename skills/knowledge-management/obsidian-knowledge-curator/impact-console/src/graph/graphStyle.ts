import type { StylesheetJson } from "cytoscape";

export function graphStyle(): StylesheetJson {
  return [
    {
      selector: "node",
      style: {
        label: "data(short)",
        "font-family": "Segoe UI, Microsoft YaHei, Arial, sans-serif",
        "font-size": 9,
        "font-weight": 500,
        color: "#4e5257",
        "text-opacity": 0.52,
        "text-wrap": "wrap",
        "text-max-width": 96,
        "text-valign": "bottom",
        "text-margin-y": 3,
        "min-zoomed-font-size": 7,
        "text-events": "yes",
        "text-background-color": "#ffffff",
        "text-background-opacity": 0,
        "text-background-padding": 2,
        "text-background-shape": "roundrectangle",
        width: "data(visualSize)",
        height: "data(visualSize)",
        shape: "ellipse",
        "background-color": "#565a5f",
        "border-width": 0,
        "border-color": "#565a5f",
        opacity: 0.82,
        "overlay-opacity": 0,
        "underlay-opacity": 0,
        "underlay-padding": 0,
        "transition-property": "background-color, border-color, opacity, text-opacity, width, height, line-color, target-arrow-color, underlay-opacity, underlay-padding",
        "transition-duration": "160ms"
      }
    },
    {
      selector: "node.show-label, node.hovered, node.hover-neighbor, node.search-hit",
      style: {
        label: "data(short)",
        "text-opacity": 0.96,
        "text-background-opacity": 0.72
      }
    },
    {
      selector: "node.label-hidden",
      style: {
        label: "",
        "text-opacity": 0,
        "text-background-opacity": 0
      }
    },
    {
      selector: "node.label-soft",
      style: {
        label: "data(short)",
        "text-opacity": 0.38,
        "text-background-opacity": 0
      }
    },
    {
      selector: "node.label-visible",
      style: {
        label: "data(short)",
        "text-opacity": 0.94,
        "text-background-opacity": 0.58
      }
    },
    {
      selector: "node.contract-role",
      style: {
        shape: "round-octagon",
        "background-color": "#62666c",
        "border-color": "#62666c",
        "border-width": 0,
        opacity: 0.84
      }
    },
    {
      selector: "node.source-role.active-path, node.source-changed",
      style: {
        "background-color": "#585c61",
        "border-color": "#a56b17",
        "border-width": 1,
        "underlay-color": "#f6c453",
        "underlay-opacity": 0.06,
        "underlay-padding": 3
      }
    },
    {
      selector: "node.witness-role",
      style: {
        "background-color": "#595d63",
        "border-color": "#595d63"
      }
    },
    {
      selector: "node.changed-node",
      style: {
        "background-color": "#585b60",
        "border-color": "#8f7448",
        "border-width": 0.65,
        "underlay-color": "#f1b847",
        "underlay-opacity": 0.018,
        "underlay-padding": 1
      }
    },
    {
      selector: "node.recently-changed",
      style: {
        "background-color": "#5e5e5b",
        "border-color": "#bb7a08",
        "border-width": 1.2,
        "overlay-color": "#f59e0b",
        "overlay-opacity": 0.04,
        "overlay-padding": 7,
        "underlay-color": "#f59e0b",
        "underlay-opacity": 0.08,
        "underlay-padding": 5
      }
    },
    {
      selector: "node.activity-trail",
      style: {
        "border-color": "#d9a441",
        "overlay-color": "#f59e0b",
        "overlay-opacity": 0.025,
        "overlay-padding": 5
      }
    },
    {
      selector: "node.active-path",
      style: {
        opacity: 1,
        "z-index": 120
      }
    },
    {
      selector: "node.pending-closure, node.witness-pending, node.version-pending",
      style: {
        "background-color": "#6d434a",
        "border-color": "#b63a4c",
        "border-width": 1.5,
        "overlay-color": "#be123c",
        "overlay-opacity": 0.045,
        "overlay-padding": 7,
        "underlay-color": "#be123c",
        "underlay-opacity": 0.12,
        "underlay-padding": 6
      }
    },
    {
      selector: "node.closed-witness, node.reviewed, node.updated",
      style: {
        "background-color": "#5a605f",
        "border-color": "#0f766e",
        "border-width": 0.95,
        "underlay-color": "#14b8a6",
        "underlay-opacity": 0.045,
        "underlay-padding": 2
      }
    },
    {
      selector: "node.orphan-node, node.orphan",
      style: {
        "background-color": "#5e5c5a",
        "border-color": "#c2410c",
        "border-style": "dashed",
        "border-width": 1.05,
        "underlay-color": "#f97316",
        "underlay-opacity": 0.065,
        "underlay-padding": 4
      }
    },
    {
      selector: "node.missing-node, node.missing, node.broken-reference",
      style: {
        shape: "ellipse",
        "background-color": "#7f3030",
        "border-color": "#991b1b",
        "border-width": 1.5,
        "underlay-color": "#ef4444",
        "underlay-opacity": 0.14,
        "underlay-padding": 7
      }
    },
    {
      selector: "node.search-hit",
      style: {
        "background-color": "#2f3338",
        "border-color": "#111827",
        "border-width": 1.4,
        color: "#111827",
        "font-weight": 700,
        "text-opacity": 1,
        opacity: 1,
        "underlay-color": "#111827",
        "underlay-opacity": 0.1,
        "underlay-padding": 6,
        "z-index": 240
      }
    },
    {
      selector: "node.search-dim",
      style: {
        opacity: 0.12,
        label: ""
      }
    },
    {
      selector: "node.selected-node",
      style: {
        "background-color": "#22262b",
        "border-color": "#f59e0b",
        "border-width": 1.8,
        color: "#111827",
        "font-size": 11,
        "font-weight": 700,
        "text-opacity": 1,
        "text-outline-width": 3,
        "text-outline-color": "#ffffff",
        "underlay-color": "#f59e0b",
        "underlay-opacity": 0.13,
        "underlay-padding": 8,
        "z-index": 999
      }
    },
    {
      selector: "node.hovered, node.hover-neighbor",
      style: {
        opacity: 1,
        "text-opacity": 1,
        "text-background-opacity": 0.8,
        "z-index": 320
      }
    },
    {
      selector: "node.hover-muted",
      style: {
        opacity: 0.045,
        label: ""
      }
    },
    {
      selector: "node.highlighted",
      style: {
        opacity: 1,
        "z-index": 260
      }
    },
    {
      selector: "node.faded",
      style: {
        opacity: 0.08,
        label: ""
      }
    },
    {
      selector: "edge",
      style: {
        width: 0.65,
        "line-color": "#c6c9ce",
        "target-arrow-color": "#c6c9ce",
        "target-arrow-shape": "none",
        "curve-style": "bezier",
        opacity: 0.14,
        label: "",
        "font-size": 8,
        color: "#5f6670",
        "text-background-color": "#fff",
        "text-background-opacity": 0.8,
        "text-background-padding": 2
      }
    },
    {
      selector: "edge.contract-main",
      style: {
        width: 0.78,
        "line-color": "#b9bec6",
        "target-arrow-color": "#b9bec6",
        "target-arrow-shape": "none",
        opacity: 0.2
      }
    },
    {
      selector: "edge.support-edge, edge.mentions",
      style: {
        "line-color": "#d7dbe1",
        "target-arrow-color": "#d7dbe1",
        "target-arrow-shape": "none",
        "line-style": "dotted",
        opacity: 0.085
      }
    },
    {
      selector: "edge.map-edge",
      style: {
        opacity: 0.1
      }
    },
    {
      selector: "edge.active-path-edge",
      style: {
        width: 1.25,
        "line-color": "#a66b16",
        "target-arrow-color": "#a66b16",
        "target-arrow-shape": "triangle",
        opacity: 0.66,
        "z-index": 220
      }
    },
    {
      selector: "edge.trigger-edge",
      style: {
        width: 1.55,
        "line-color": "#3d4146",
        "target-arrow-color": "#3d4146",
        opacity: 0.86,
        "z-index": 300
      }
    },
    {
      selector: "edge.missing-link, edge.missing",
      style: {
        width: 1.35,
        "line-color": "#be123c",
        "target-arrow-color": "#be123c",
        "target-arrow-shape": "triangle",
        "line-style": "dashed",
        opacity: 0.78,
        "z-index": 260
      }
    },
    {
      selector: "edge.background-edge",
      style: {
        opacity: 0.04
      }
    },
    {
      selector: "edge.hover-neighbor, edge.highlighted",
      style: {
        opacity: 0.62,
        width: 1,
        "z-index": 260
      }
    },
    {
      selector: "edge.hover-muted",
      style: {
        opacity: 0.015
      }
    },
    {
      selector: "edge.faded",
      style: {
        opacity: 0.03,
        label: ""
      }
    }
  ] as unknown as StylesheetJson;
}
