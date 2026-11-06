export type PortableRuntime = "cloudflare" | "vercel" | "node" | "deno";
export type PortableServiceHandler<TEnv = unknown> = (request: Request, env: TEnv) => Response | Promise<Response>;

export interface PortableRuntimeAdapter<TEnv = unknown> {
  readonly runtime: PortableRuntime;
  readonly invoke: (request: Request, env: TEnv) => Promise<Response>;
}

export interface PortableRuntimeSet<TEnv = unknown> {
  readonly cloudflare: PortableRuntimeAdapter<TEnv>;
  readonly vercel: PortableRuntimeAdapter<TEnv>;
  readonly node: PortableRuntimeAdapter<TEnv>;
  readonly deno: PortableRuntimeAdapter<TEnv>;
}

const createAdapter = <TEnv>(runtime: PortableRuntime, handler: PortableServiceHandler<TEnv>): PortableRuntimeAdapter<TEnv> => ({
  runtime,
  invoke: async (request, env) => handler(request, env),
});

export const createCloudflareAdapter = <TEnv>(handler: PortableServiceHandler<TEnv>) => createAdapter("cloudflare", handler);
export const createVercelAdapter = <TEnv>(handler: PortableServiceHandler<TEnv>) => createAdapter("vercel", handler);

export const createDenoAdapter = <TEnv>(handler: PortableServiceHandler<TEnv>): PortableRuntimeAdapter<TEnv> & { serve: (env: TEnv) => unknown } => ({
  ...createAdapter("deno", handler),
  serve: (env) => {
    const deno = (globalThis as { Deno?: { serve: (handler: (request: Request) => Response | Promise<Response>) => unknown } }).Deno;
    if (!deno?.serve) throw new Error("Deno.serve is unavailable in this runtime");
    return deno.serve((request) => handler(request, env));
  },
});

export const createPortableRuntimeSet = <TEnv>(handler: PortableServiceHandler<TEnv>): PortableRuntimeSet<TEnv> => ({
  cloudflare: createCloudflareAdapter(handler),
  vercel: createVercelAdapter(handler),
  node: createAdapter("node", handler),
  deno: createDenoAdapter(handler),
});
