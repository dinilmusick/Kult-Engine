/**
 * @file KultCanvas.tsx
 * @description Central React Flow Service Graph Surface (§9 of IMPLEMENTATION-SPEC.md).
 * Synchronizes React Flow graph interactions with the canonical SERVICE_IR document.
 */

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useServiceDocumentStore } from '../../../frontend-state/serviceDocumentStore';
import { KultServiceNode } from './KultServiceNode';

const nodeTypes = {
  serviceNode: KultServiceNode,
};

const proOptions = { hideAttribution: true };

export const KultCanvas: React.FC = () => {
  const {
    document,
    selectedNodeId,
    lastRun,
    selectNode,
    updateNodePosition,
    connectPorts,
    removeEdge,
    removeNode,
  } = useServiceDocumentStore();

  const nodes: Node[] = useMemo(() => {
    return document.nodes.map((n) => {
      const result = lastRun?.nodeResults.find((r) => r.nodeId === n.id);
      return {
        id: n.id,
        type: 'serviceNode',
        position: n.position,
        data: {
          spec: n,
          lastResult: result,
          isSelected: selectedNodeId === n.id,
        },
      };
    });
  }, [document.nodes, selectedNodeId, lastRun]);

  const edges: Edge[] = useMemo(() => {
    return document.edges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      sourceHandle: e.sourcePort,
      target: e.targetNodeId,
      targetHandle: e.targetPort,
      animated: true,
      style: { stroke: 'var(--skipo-accent)', strokeWidth: 2 },
    }));
  }, [document.edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateNodePosition(change.id, change.position);
        }
      }
    },
    [updateNodePosition]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.sourceHandle && connection.targetHandle) {
        connectPorts(
          connection.source,
          connection.sourceHandle,
          connection.target,
          connection.targetHandle
        );
      }
    },
    [connectPorts]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      for (const e of deletedEdges) removeEdge(e.id);
    },
    [removeEdge]
  );

  return (
    <div
      className="w-full h-full relative bg-[var(--skipo-bg)]"
      data-skipo-label="Service Graph"
      data-skipo-desc="Visual KRNLTS service composition canvas with typed ports and live execution overlay"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgesDelete={onEdgesDelete}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={proOptions}
      >
        <Background gap={18} size={1.2} color="rgba(255, 255, 255, 0.08)" />
        <Controls className="!bg-[var(--skipo-surface)] !border-[var(--skipo-border-color)]/30 !rounded-md" />
        <MiniMap
          className="!bg-[var(--skipo-surface)] !border-[var(--skipo-border-color)]/30 !rounded-md"
          style={{ transform: 'scale(0.70)', transformOrigin: 'bottom right' }}
          nodeColor="var(--skipo-accent)"
          maskColor="rgba(0, 0, 0, 0.65)"
        />
      </ReactFlow>
    </div>
  );
};
