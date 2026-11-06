import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCloudflareAdapter, createDenoAdapter, createPortableRuntimeSet, createVercelAdapter } from "./portableRuntime";
import { createNodeRuntimeAdapter } from "./nodeRuntimeAdapter";

const handler = async (request: Request, env: { runtime: string }) =>
  new Response(JSON.stringify({ runtime: env.runtime, path: new URL(request.url).pathname }));

describe("portable runtime adapters", () => {
  it("preserves one fetch contract across Cloudflare, Vercel, Node and Deno", async () => {
    const adapters = createPortableRuntimeSet(handler);
    for (const runtime of ["cloudflare", "vercel", "node", "deno"] as const) {
      const result = await adapters[runtime].invoke(new Request("https://kult.test/health"), { runtime });
      assert.equal(result.status, 200);
      assert.deepEqual(await result.json(), { runtime, path: "/health" });
    }
  });

  it("keeps Node request bridging opt-in and does not require a server", async () => {
    const adapter = createNodeRuntimeAdapter(handler);
    const result = await adapter.invoke(new Request("https://kult.test/api"), { runtime: "node" });
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { runtime: "node", path: "/api" });
    assert.equal(typeof adapter.handleNodeRequest, "function");
  });

  it("exposes explicit Cloudflare, Vercel and Deno factories", async () => {
    assert.equal((await createCloudflareAdapter(handler).invoke(new Request("https://kult.test/cf"), { runtime: "cloudflare" })).status, 200);
    assert.equal((await createVercelAdapter(handler).invoke(new Request("https://kult.test/vercel"), { runtime: "vercel" })).status, 200);
    const deno = createDenoAdapter(handler);
    assert.equal(deno.runtime, "deno");
    assert.throws(() => deno.serve({ runtime: "deno" }), /Deno\.serve is unavailable/);
  });
});
