// ══════════════════════════════════════════════════════════════════════════════
// NODE GRAPH ZUSTAND STORE (React Flow + Undo/Redo + Clipboard + Selection)
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

export interface GraphSnapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface NodeGraphState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  clipboard: GraphSnapshot | null;
  history: { past: GraphSnapshot[]; future: GraphSnapshot[] };
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  selectNodes: (ids: string[]) => void;
  selectEdge: (id: string | null) => void;
  selectAll: () => void;
  clearSelection: () => void;
  addNode: (type: string, label: string, position?: { x: number; y: number }) => void;
  deleteSelection: () => void;
  copySelection: () => void;
  pasteClipboard: (targetPos?: { x: number; y: number }) => void;
  undo: () => void;
  redo: () => void;
}

const INITIAL_NODES: Node[] = [
  { id: 'node-ingest', type: 'customNode', position: { x: 100, y: 150 }, data: { label: 'Data Ingestion', type: 'SOURCE', status: 'READY' } },
  { id: 'node-process', type: 'customNode', position: { x: 420, y: 150 }, data: { label: 'Transform Worker', type: 'PROCESSOR', status: 'ACTIVE' } },
  { id: 'node-export', type: 'customNode', position: { x: 740, y: 150 }, data: { label: 'Storage Sink', type: 'SINK', status: 'STANDBY' } },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'edge-1-2', source: 'node-ingest', target: 'node-process', animated: true },
  { id: 'edge-2-3', source: 'node-process', target: 'node-export', animated: true },
];

export const useNodeGraphStore = create<NodeGraphState>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  selectedNodeIds: [],
  selectedEdgeId: null,
  clipboard: null,
  history: { past: [], future: [] },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) => set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
  onEdgesChange: (changes) => set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (connection) => {
    const { nodes, edges, history } = get();
    set({
      edges: addEdge({ ...connection, animated: true }, edges),
      history: { past: [...history.past.slice(-20), { nodes, edges }], future: [] },
    });
  },

  selectNodes: (selectedNodeIds) => set({ selectedNodeIds }),
  selectEdge: (selectedEdgeId) => set({ selectedEdgeId }),
  selectAll: () => set((state) => ({ selectedNodeIds: state.nodes.map((n) => n.id) })),
  clearSelection: () => set({ selectedNodeIds: [], selectedEdgeId: null }),

  addNode: (type, label, position = { x: 250, y: 200 }) => {
    const { nodes, edges, history } = get();
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'customNode',
      position,
      data: { label, type, status: 'READY' },
    };
    set({
      nodes: [...nodes, newNode],
      selectedNodeIds: [newNode.id],
      history: { past: [...history.past.slice(-20), { nodes, edges }], future: [] },
    });
  },

  deleteSelection: () => {
    const { nodes, edges, selectedNodeIds, selectedEdgeId, history } = get();
    if (selectedNodeIds.length === 0 && !selectedEdgeId) return;
    const selSet = new Set(selectedNodeIds);
    set({
      nodes: nodes.filter((n) => !selSet.has(n.id)),
      edges: edges.filter((e) => e.id !== selectedEdgeId && !selSet.has(e.source) && !selSet.has(e.target)),
      selectedNodeIds: [],
      selectedEdgeId: null,
      history: { past: [...history.past.slice(-20), { nodes, edges }], future: [] },
    });
  },

  copySelection: () => {
    const { nodes, edges, selectedNodeIds } = get();
    if (selectedNodeIds.length === 0) return;
    const selSet = new Set(selectedNodeIds);
    set({
      clipboard: {
        nodes: nodes.filter((n) => selSet.has(n.id)),
        edges: edges.filter((e) => selSet.has(e.source) && selSet.has(e.target)),
      },
    });
  },

  pasteClipboard: (targetPos) => {
    const { clipboard, nodes, edges, history } = get();
    if (!clipboard || clipboard.nodes.length === 0) return;
    const now = Date.now();
    const idMap = new Map<string, string>();
    const offsetX = targetPos ? targetPos.x - clipboard.nodes[0].position.x : 32;
    const offsetY = targetPos ? targetPos.y - clipboard.nodes[0].position.y : 32;

    const newNodes: Node[] = clipboard.nodes.map((n, idx) => {
      const newId = `node-copy-${now}-${idx}`;
      idMap.set(n.id, newId);
      return { ...n, id: newId, position: { x: n.position.x + offsetX, y: n.position.y + offsetY }, selected: true };
    });

    const newEdges: Edge[] = clipboard.edges.map((e, idx) => ({
      ...e,
      id: `edge-copy-${now}-${idx}`,
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
    }));

    set({
      nodes: [...nodes, ...newNodes],
      edges: [...edges, ...newEdges],
      selectedNodeIds: newNodes.map((n) => n.id),
      history: { past: [...history.past.slice(-20), { nodes, edges }], future: [] },
    });
  },

  undo: () => {
    const { history, nodes, edges } = get();
    if (history.past.length === 0) return;
    const prev = history.past[history.past.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      history: { past: history.past.slice(0, -1), future: [{ nodes, edges }, ...history.future] },
    });
  },

  redo: () => {
    const { history, nodes, edges } = get();
    if (history.future.length === 0) return;
    const next = history.future[0];
    set({
      nodes: next.nodes,
      edges: next.edges,
      history: { past: [...history.past, { nodes, edges }], future: history.future.slice(1) },
    });
  },
}));
