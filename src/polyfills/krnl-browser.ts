export interface BrowserServiceDefinition {
  id: string;
  name: string;
  version: string;
  operations: Record<string, { handler: (input?: unknown) => unknown | Promise<unknown> }>;
}

export function createServiceDefinition<T extends BrowserServiceDefinition>(definition: T): T {
  return definition;
}

export function createService(definition: BrowserServiceDefinition) {
  return {
    async start() {},
    async call<TIn = unknown, TOut = unknown>(operation: string, input?: TIn): Promise<TOut> {
      const entry = definition.operations[operation];
      if (!entry) throw new Error(`Unknown service operation: ${operation}`);
      return await entry.handler(input) as TOut;
    },
  };
}
