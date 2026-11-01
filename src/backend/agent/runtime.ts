import { DepmBackend } from '../DepmBackend';
import { createApplicationAgent } from './applicationAgent';
import { createFodModule } from './fodModule';
export const applicationAgent = createApplicationAgent({ id: 'kult', name: 'Kult', version: '1.0.0', backend: DepmBackend as unknown as Record<string, unknown> });
export const fodModule = createFodModule(applicationAgent);
export const handleAgentRoutes = (await import('./agentRoutes')).createAgentRoutes(applicationAgent, fodModule);