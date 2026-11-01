import type { ApplicationAgent } from './applicationAgent';
export interface FodFlow { id: string; name: string; description: string; inputSchema: unknown; outputSchema: unknown; }
export function createFodModule(agent: ApplicationAgent) {
  const listFlows = (): FodFlow[] => agent.capabilities().map(capability => ({ id: capability.id, name: capability.name, description: capability.description, inputSchema: capability.inputSchema ?? { type: 'object' }, outputSchema: capability.outputSchema ?? { type: 'object' } }));
  const executeFlow = async (flowId: string, input: unknown, context: any) => {
    const capability = agent.capabilities().find(item => item.id === flowId);
    if (!capability) throw new Error('FOD_FLOW_NOT_FOUND:' + flowId);
    return agent.execute(flowId, input, context);
  };
  return { listFlows, executeFlow };
}