import type { ApplicationAgent } from './applicationAgent';
import type { FodFlow } from './fodModule';
export function createAgentRoutes(agent: ApplicationAgent, fod: { listFlows(): FodFlow[]; executeFlow(id: string, input: unknown, context: any): Promise<unknown> }) {
  return async function handleAgentRoutes(request: Request, url: URL, jsonRes: (data: unknown, status?: number) => Response, parseBody: (req: Request) => Promise<any>): Promise<Response | null> {
    if (url.pathname === '/api/agent/manifest' && request.method === 'GET') return jsonRes(agent.manifest());
    if (url.pathname === '/api/agent/capabilities' && request.method === 'GET') return jsonRes(agent.capabilities());
    if (url.pathname === '/api/converse' && request.method === 'POST') { const body = await parseBody(request); const userId = request.headers.get('x-user-id') || body.userId; if (!userId) return jsonRes({ error: 'Authentication required' }, 401); try { return jsonRes({ output: await agent.handle(String(body.request ?? ''), { applicationId: String(body.applicationId ?? 'application'), sessionId: String(body.sessionId ?? crypto.randomUUID()), userId, locale: body.locale }) }); } catch (error) { return jsonRes({ error: error instanceof Error ? error.message : String(error) }, 400); } }
    if (url.pathname === '/api/fod/flows' && request.method === 'GET') return jsonRes(fod.listFlows());
    const match = url.pathname.match(/^\/api\/fod\/flows\/([^/]+)\/execute$/);
    if (match && request.method === 'POST') { const body = await parseBody(request); try { return jsonRes(await fod.executeFlow(decodeURIComponent(match[1]), body.input ?? body, { applicationId: body.applicationId ?? 'application', sessionId: body.sessionId ?? crypto.randomUUID(), userId: body.userId })); } catch (error) { return jsonRes({ error: error instanceof Error ? error.message : String(error) }, 400); } }
    return null;
  };
}