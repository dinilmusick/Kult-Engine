/**
 * @file serviceDocumentStore.ts
 * @description Frontend Zustand state for Kult SERVICE_IR authoring, execution, and tests (< 200 lines).
 */

import { create } from 'zustand';
import type {
  ServiceDocument,
  NodeSpec,
  EdgeSpec,
  ExecutionRun,
  ServiceTestCase,
  UISchema,
} from '../libraries/types/serviceIR';
import { STARTER_KLOKS_ARITHMETIC_SERVICE } from '../libraries/services/starterServices';
import { validateServiceDocument, type ValidationReport } from '../libraries/services/graphValidator';
import { executeServiceGraph } from '../libraries/services/graphExecutor';
import { importKloksServiceCandidate } from '../libraries/services/kloksImporter';
import type { DiscoveredAsset } from '../libraries/services/assetDiscovery';

interface ServiceDocumentState {
  document: ServiceDocument;
  selectedNodeId: string | null;
  activeTestCaseId: string | null;
  activeDockTab: 'canvas' | 'execution' | 'tests' | 'uipreview' | 'export' | 'raw';
  lastRun: ExecutionRun | null;
  validationReport: ValidationReport;
  isRunning: boolean;

  setDocument: (doc: ServiceDocument) => void;
  importExistingService: (candidateId: string) => void;
  selectNode: (id: string | null) => void;
  setActiveTestCase: (id: string | null) => void;
  setActiveDockTab: (tab: 'canvas' | 'execution' | 'tests' | 'uipreview' | 'export' | 'raw') => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  addNodeFromAsset: (asset: DiscoveredAsset, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  connectPorts: (sourceNodeId: string, sourcePort: string, targetNodeId: string, targetPort: string) => void;
  removeEdge: (edgeId: string) => void;
  runService: (customInputs?: Record<string, unknown>) => Promise<ExecutionRun>;
  runSingleTest: (testId: string) => Promise<boolean>;
  updateUISchema: (schema: UISchema) => void;
  saveTestCase: (test: ServiceTestCase) => void;
}

export const useServiceDocumentStore = create<ServiceDocumentState>((set, get) => ({
  document: STARTER_KLOKS_ARITHMETIC_SERVICE,
  selectedNodeId: 'node-facade-a',
  activeTestCaseId: 't-add',
  activeDockTab: 'canvas',
  lastRun: null,
  validationReport: validateServiceDocument(STARTER_KLOKS_ARITHMETIC_SERVICE),
  isRunning: false,

  setDocument: (document) => {
    set({ document, validationReport: validateServiceDocument(document) });
  },

  importExistingService: (candidateId) => {
    const doc = importKloksServiceCandidate(candidateId);
    set({
      document: doc,
      selectedNodeId: doc.nodes[1]?.id || null,
      activeTestCaseId: doc.tests[0]?.id || null,
      validationReport: validateServiceDocument(doc),
      lastRun: null,
    });
  },

  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  setActiveTestCase: (activeTestCaseId) => set({ activeTestCaseId }),
  setActiveDockTab: (activeDockTab) => set({ activeDockTab }),

  updateNodePosition: (id, position) => {
    const doc = get().document;
    const updatedNodes = doc.nodes.map((n) => (n.id === id ? { ...n, position } : n));
    set({ document: { ...doc, nodes: updatedNodes } });
  },

  updateNodeConfig: (id, config) => {
    const doc = get().document;
    const updatedNodes = doc.nodes.map((n) => (n.id === id ? { ...n, config: { ...n.config, ...config } } : n));
    const nextDoc = { ...doc, nodes: updatedNodes };
    set({ document: nextDoc, validationReport: validateServiceDocument(nextDoc) });
  },

  addNodeFromAsset: (asset, position) => {
    const doc = get().document;
    const newNodeId = `node-${asset.export.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const newNode: NodeSpec = {
      id: newNodeId,
      kind: asset.kind,
      type: asset.export,
      version: asset.version,
      position,
      config: { ...asset.defaultConfig },
      inputs: [...asset.inputPorts],
      outputs: [...asset.outputPorts],
    };
    const nextDoc = { ...doc, nodes: [...doc.nodes, newNode] };
    set({ document: nextDoc, selectedNodeId: newNodeId, validationReport: validateServiceDocument(nextDoc) });
  },

  removeNode: (id) => {
    const doc = get().document;
    const nextDoc = {
      ...doc,
      nodes: doc.nodes.filter((n) => n.id !== id),
      edges: doc.edges.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id),
    };
    set({
      document: nextDoc,
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      validationReport: validateServiceDocument(nextDoc),
    });
  },

  connectPorts: (sourceNodeId, sourcePort, targetNodeId, targetPort) => {
    const doc = get().document;
    if (doc.edges.some((e) => e.targetNodeId === targetNodeId && e.targetPort === targetPort)) return;
    const newEdge: EdgeSpec = { id: `edge-${Date.now().toString(36)}`, sourceNodeId, sourcePort, targetNodeId, targetPort };
    const nextDoc = { ...doc, edges: [...doc.edges, newEdge] };
    set({ document: nextDoc, validationReport: validateServiceDocument(nextDoc) });
  },

  removeEdge: (edgeId) => {
    const doc = get().document;
    const nextDoc = { ...doc, edges: doc.edges.filter((e) => e.id !== edgeId) };
    set({ document: nextDoc, validationReport: validateServiceDocument(nextDoc) });
  },

  runService: async (customInputs) => {
    set({ isRunning: true });
    const { document } = get();
    const inputs: Record<string, unknown> = { ...customInputs };
    const inputNode = document.nodes.find((n) => n.kind === 'ServiceInput');
    if (inputNode) {
      for (const p of inputNode.outputs) {
        if (inputs[p.name] === undefined && p.defaultValue !== undefined) inputs[p.name] = p.defaultValue;
      }
    }
    const run = await executeServiceGraph(document, inputs);
    set({ lastRun: run, isRunning: false });
    return run;
  },

  runSingleTest: async (testId) => {
    const { document, runService } = get();
    const test = document.tests.find((t) => t.id === testId);
    if (!test) return false;
    const run = await runService(test.input);
    let passed = run.status === 'passed';
    for (const assertion of test.assertions) {
      const outputVal = run.output[assertion.port];
      if (assertion.operator === 'defined' && outputVal === undefined) passed = false;
      if (assertion.operator === 'greaterThan' && (Number(outputVal) <= Number(assertion.value) || isNaN(Number(outputVal)))) passed = false;
      if (assertion.operator === 'equals' && outputVal !== assertion.value) passed = false;
    }
    return passed;
  },

  updateUISchema: (schema) => {
    const doc = get().document;
    set({ document: { ...doc, uiSchema: schema } });
  },

  saveTestCase: (test) => {
    const doc = get().document;
    const exists = doc.tests.some((t) => t.id === test.id);
    const updatedTests = exists ? doc.tests.map((t) => (t.id === test.id ? test : t)) : [...doc.tests, test];
    set({ document: { ...doc, tests: updatedTests } });
  },
}));
