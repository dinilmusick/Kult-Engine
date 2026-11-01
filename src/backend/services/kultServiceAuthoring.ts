import { executeServiceGraph } from '../../libraries/services/graphExecutor.js';
import { validateServiceDocument } from '../../libraries/services/graphValidator.js';
import { generateKloksArtifact } from '../../libraries/services/kloksExporter.js';
import { runAllKultEngineContractTests } from '../../libraries/services/kultEngineSuite.js';
import { STARTER_KLOKS_ARITHMETIC_SERVICE } from '../../libraries/services/starterServices.js';
import type { ServiceDocument } from '../../libraries/types/serviceIR.js';

const serviceStore = new Map<string, ServiceDocument>();
serviceStore.set(STARTER_KLOKS_ARITHMETIC_SERVICE.service.id, STARTER_KLOKS_ARITHMETIC_SERVICE);

export const kultServiceAuthoring = {
  create: async (input: { id?: string; name?: string; description?: string; document?: ServiceDocument } = {}) => {
    const id = input.id || `service-${Date.now().toString(36)}`;
    const name = input.name || 'ArithmeticService';
    const doc: ServiceDocument = input.document
      ? JSON.parse(JSON.stringify(input.document))
      : {
          ...JSON.parse(JSON.stringify(STARTER_KLOKS_ARITHMETIC_SERVICE)),
          service: {
            ...STARTER_KLOKS_ARITHMETIC_SERVICE.service,
            id,
            name,
            description: input.description || STARTER_KLOKS_ARITHMETIC_SERVICE.service.description,
          },
        };
    serviceStore.set(id, doc);
    return { success: true, serviceId: id, document: doc, status: 'draft' as const };
  },

  inspect: async (input: { serviceId?: string; document?: ServiceDocument } = {}) => {
    const doc = input.document || (input.serviceId ? serviceStore.get(input.serviceId) : undefined) || STARTER_KLOKS_ARITHMETIC_SERVICE;
    return {
      success: true,
      serviceId: doc.service.id,
      name: doc.service.name,
      document: doc,
      nodesCount: doc.nodes.length,
      edgesCount: doc.edges.length,
      validation: validateServiceDocument(doc),
    };
  },

  edit: async (input: { serviceId: string; document?: ServiceDocument; patch?: Partial<ServiceDocument> }) => {
    const existing = serviceStore.get(input.serviceId) || STARTER_KLOKS_ARITHMETIC_SERVICE;
    const updated: ServiceDocument = input.document
      ? JSON.parse(JSON.stringify(input.document))
      : { ...existing, ...(input.patch || {}) };
    serviceStore.set(input.serviceId, updated);
    return { success: true, serviceId: input.serviceId, document: updated, validation: validateServiceDocument(updated) };
  },

  run: async (input: { serviceId?: string; document?: ServiceDocument; inputs?: Record<string, unknown> } = {}) => {
    const doc = input.document || (input.serviceId ? serviceStore.get(input.serviceId) : undefined) || STARTER_KLOKS_ARITHMETIC_SERVICE;
    return await executeServiceGraph(doc, input.inputs || {});
  },

  test: async (input: { serviceId?: string; document?: ServiceDocument; inputs?: Record<string, unknown> } = {}) => {
    if (input.document || input.serviceId) {
      const doc = input.document || (input.serviceId ? serviceStore.get(input.serviceId) : undefined) || STARTER_KLOKS_ARITHMETIC_SERVICE;
      const validation = validateServiceDocument(doc);
      const execution = await executeServiceGraph(doc, input.inputs || { a: 10, b: 20, operation: 'add' });
      return {
        success: validation.isValid && execution.status === 'passed',
        validation,
        execution,
      };
    }
    const results = await runAllKultEngineContractTests();
    const passed = results.every(r => r.passed);
    return { success: passed, results };
  },

  validate: async (input: { serviceId?: string; document?: ServiceDocument } = {}) => {
    const doc = input.document || (input.serviceId ? serviceStore.get(input.serviceId) : undefined) || STARTER_KLOKS_ARITHMETIC_SERVICE;
    return validateServiceDocument(doc);
  },

  promote: async (input: { serviceId?: string; document?: ServiceDocument } = {}) => {
    const doc = input.document || (input.serviceId ? serviceStore.get(input.serviceId) : undefined) || STARTER_KLOKS_ARITHMETIC_SERVICE;
    const validation = validateServiceDocument(doc);
    if (!validation.isValid) {
      return { success: false, error: `Promotion rejected: ${validation.errorCount} blocking errors`, errors: validation.errors };
    }
    const artifact = generateKloksArtifact(doc);
    return {
      success: true,
      serviceId: doc.service.id,
      promotedAt: new Date().toISOString(),
      packageName: artifact.packageName,
      manifest: artifact.manifest,
      contractDiff: artifact.contractDiff,
      filesCount: artifact.files.length,
    };
  },
};
