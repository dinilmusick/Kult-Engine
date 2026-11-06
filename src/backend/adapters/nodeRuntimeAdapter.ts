import { adaptNodeRequest } from "./nodeBridge";
import type { PortableServiceHandler } from "./portableRuntime";

export interface NodeRuntimeAdapter<TEnv = unknown> {
  readonly runtime: "node";
  readonly invoke: (request: Request, env: TEnv) => Promise<Response>;
  readonly handleNodeRequest: (request: any, response: any, env: TEnv) => Promise<unknown>;
}

export const createNodeRuntimeAdapter = <TEnv>(handler: PortableServiceHandler<TEnv>): NodeRuntimeAdapter<TEnv> => ({
  runtime: "node",
  invoke: async (request, env) => handler(request, env),
  handleNodeRequest: (request, response, env) => adaptNodeRequest(request, response, async (webRequest) => handler(webRequest, env), env),
});
