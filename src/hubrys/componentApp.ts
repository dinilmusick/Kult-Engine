import { DepmBackend } from '../backend/DepmBackend.js';
import { kultServiceAuthoring } from '../backend/services/kultServiceAuthoring.js';

type CapabilitySource = Record<string, unknown>;
const baseServices = (DepmBackend as unknown as { services?: CapabilitySource }).services ?? {};
const services: CapabilitySource = {
  ...baseServices,
  service: kultServiceAuthoring,
};
const source = {
  services,
  orchestrations: (DepmBackend as unknown as { orchestrations?: CapabilitySource }).orchestrations ?? {},
};

function resolve(name: string, operation?: string): { owner: unknown; operation: string } {
  if (operation && source.services[name]) {
    return { owner: source.services[name], operation };
  }
  const parts = name.split('.');
  const serviceName = parts.shift() ?? '';
  const op = parts.join('.');
  const owner = source.services[serviceName] ?? source.orchestrations[serviceName];
  if (!owner) throw new Error('[Hubrys] Capability service not found: ' + serviceName);
  return { owner, operation: op || operation || '' };
}

export const hubrysComponentApp = {
  manifest: { id: 'kult', name: 'Kult', version: '0.0.0' },
  backend: {
    listServices: () => Object.keys(source.services),
    hasCapability: (name: string, op?: string) => {
      try {
        const { owner, operation } = resolve(name, op);
        if (!operation) return Boolean(owner);
        return typeof (owner as Record<string, unknown>)[operation] === 'function';
      } catch {
        return false;
      }
    },
    getOrchestration: <T = unknown>(name: string) => source.orchestrations[name] as T,
    async executeCapability<TIn = unknown, TOut = unknown>(capabilityName: string, operation?: string, input?: TIn): Promise<TOut> {
      const { owner, operation: op } = resolve(capabilityName, operation);
      const fn = (owner as Record<string, unknown>)[op];
      if (typeof fn !== 'function') throw new Error('[Hubrys] Capability operation not found: ' + capabilityName + (op ? '.' + op : ''));
      return await (fn as (value?: TIn) => Promise<TOut>)(input);
    },
  },
};
export default hubrysComponentApp;
