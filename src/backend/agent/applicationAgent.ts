import { AikoRuntime, type AikoAgentDefinition, type AikoCapability } from '@ultrst-armada/kloks/aiko';
import { AIKeyServiceFacade } from '@ultrst-armada/kloks/krnl-ai-services';
import { CapabilityExecutionRuntime, CapabilityRegistry, ContextResolver, type AgentContext, type CapabilityDescriptor, type RuntimeContext } from '@ultrst-armada/kloks/semantic-runtime';
import { guttsApiDefinitions, executeGuttsApi, resolveSemanticInput, rankSemanticInputCandidates } from '@dinilmusick/gutts';

export interface ApplicationAgentOptions { id: string; name: string; version?: string; backend: Record<string, unknown>; }
export interface ApplicationAgent { handle(request: string, context: RuntimeContext): Promise<unknown>; execute(capabilityId: string, input: unknown, context: RuntimeContext): Promise<unknown>; capabilities(): CapabilityDescriptor[]; manifest(): unknown; aiko(): AikoRuntime; }
const blocked = /password|secret|token|authorization|credential|private.?key/i;
function schemaFor(_fn: Function) { return { type: 'object', properties: { input: { type: 'object' }, args: { type: 'array' } } }; }

function scanBackend(registry: CapabilityRegistry, backend: Record<string, unknown>) {
  const visit = (value: unknown, path: string[], depth: number) => {
    if (!value || depth > 4 || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (blocked.test(key)) continue;
      const next = [...path, key];
      if (typeof child === 'function') {
        const id = 'backend.' + next.join('.');
        registry.upsert({ id, name: next.join('.'), description: 'Execute ' + next.join('.') + ' on the application backend.', kind: 'endpoint', inputSchema: schemaFor(child), outputSchema: { type: 'object' }, sideEffects: 'external', metadata: { source: 'backend-facade', path: next } });
      } else visit(child, next, depth + 1);
    }
  };
  visit(backend, [], 0);
}
function makeContext(runtime: RuntimeContext, registry: CapabilityRegistry): AgentContext {
  return { runtime, task: { taskId: crypto.randomUUID(), request: '', requirements: [], artifacts: [] }, capabilities: registry.list() };
}

export function createApplicationAgent(options: ApplicationAgentOptions): ApplicationAgent {
  const registry = new CapabilityRegistry();
  scanBackend(registry, options.backend);
  for (const api of guttsApiDefinitions) registry.upsert({ id: api.id, name: api.name, description: api.description, kind: 'gutts', inputSchema: api.inputSchema, outputSchema: api.output, sideEffects: api.semantics.pure ? 'compute' : 'external', metadata: { apiId: api.id, category: api.category, source: 'gutts' } });
  const resolver = new ContextResolver(registry);
  const authorization = { authorize: async (capability: CapabilityDescriptor, context: AgentContext) => capability.sideEffects === 'external' && !context.runtime.userId ? { allowed: false, reason: 'AUTH_REQUIRED' } : { allowed: true } };
  const executor = new CapabilityExecutionRuntime(authorization);
  const invoke = async (capability: CapabilityDescriptor, input: any, context: AgentContext): Promise<unknown> => {
    const run = async () => {
      if (capability.kind === 'gutts') return executeGuttsApi(String(capability.metadata?.apiId), input ?? {});
      const path = capability.metadata?.path as string[];
      let owner: any = options.backend;
      for (const segment of path.slice(0, -1)) owner = owner?.[segment];
      const fn = owner?.[path[path.length - 1]];
      if (typeof fn !== 'function') throw new Error('CAPABILITY_NOT_EXECUTABLE:' + capability.id);
      const args = Array.isArray(input?.args) ? input.args : [input?.input ?? input ?? {}];
      return fn.apply(owner, args);
    };
    const result = await executor.execute(capability, input, context, { execute: run });
    return result.artifact.value;
  };
  const execute = async (capabilityId: string, input: unknown, runtime: RuntimeContext) => { const capability = registry.get(capabilityId); if (!capability) throw new Error('CAPABILITY_NOT_FOUND:' + capabilityId); return invoke(capability, input, makeContext(runtime, registry)); };
  const handle = async (request: string, runtime: RuntimeContext) => {
    const context = makeContext(runtime, registry);
    const parts = request.split(/\s+(?:and then|then)\s+/i).map(x => x.trim()).filter(Boolean);
    const outputs: unknown[] = [];
    for (const part of parts) {
      const ranked = await rankSemanticInputCandidates(part, registry.list().map(c => c.name + ': ' + c.description), 'fast');
      const selectedText = ranked[0]?.value;
      const capability = registry.list().find(c => c.name + ': ' + c.description === selectedText) ?? registry.list()[0];
      if (!capability) throw new Error('NO_CAPABILITIES');
      let input: any = {};
      try { const resolved = await resolveSemanticInput({ input: part, schema: (capability.inputSchema ?? { type: 'object' }) as any, context: { application: options.id, locale: runtime.locale } }); if (resolved.status === 'resolved') input = resolved.value; } catch {}
      const resolvedContext = makeContext(runtime, registry);
      outputs.push(await invoke(capability, input, resolvedContext));
    }
    return outputs.length === 1 ? outputs[0] : outputs;
  };
  const capabilities = async (): Promise<AikoCapability[]> => registry.list().map(capability => ({ id: capability.id, name: capability.name, description: capability.description, sourceKind: capability.kind === 'gutts' ? 'gutts-api' : 'endpoint', sourceId: capability.id, inputSchema: capability.inputSchema, execute: (input: unknown) => invoke(capability, input, makeContext({ applicationId: options.id, sessionId: 'aiko', userId: 'system' }, registry)) }));
  const applicationTool = { id: options.id + '.application-agent', name: options.name + ' Application Agent', description: 'Conversational engineering agent for ' + options.name + '.', inputSchema: { type: 'object', properties: { request: { type: 'string' } }, required: ['request'] }, sourceKind: 'custom' as const, sourceId: options.id, execute: async (input: unknown) => handle(typeof input === 'string' ? input : String((input as any)?.request ?? ''), { applicationId: options.id, sessionId: 'aiko', userId: 'system' }) };
  const definition: AikoAgentDefinition = { schemaVersion: '1.0.0', id: options.id + '-application-agent', name: applicationTool.name, description: applicationTool.description, agentType: 'AIKO', tool: applicationTool, intelligenceSpec: { mode: 'semantic-runtime' }, sourceKind: 'custom', sourceId: options.id, custom: true };
  const runtime = new AikoRuntime({ customAgents: [definition], capabilities, resolver: { resolve: async specId => ({ spec: { mode: 'semantic-runtime', specId: specId ?? 'semantic-runtime' }, specId: specId ?? 'semantic-runtime' }) }, keys: { listKeys: async () => AIKeyServiceFacade.getKeys() as any, getActiveKey: async (providerId: string) => (AIKeyServiceFacade as any).getActiveKey?.(providerId) ?? null, rotateKey: async (providerId: string) => (AIKeyServiceFacade as any).rotateKey?.(providerId) ?? null, addKey: async (input: any) => AIKeyServiceFacade.addKey(input) as any, syncFromAikoEngine: async () => ({ synced: 0 }) } });
  return { handle, execute, aiko: () => runtime, capabilities: () => registry.list(), manifest: () => ({ id: options.id, name: options.name, version: options.version ?? '0.0.0', capabilities: registry.list(), agents: [definition] }) };
}