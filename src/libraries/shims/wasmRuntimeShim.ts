/**
 * Serverless / Cloudflare Worker safe shim for @ultrst-armada/kloks/wasm-runtime.
 * Replaces browser-only Web Worker compilation runtime and prevents bundling
 * browser forge scripts that fail on top-level `import.meta.url` evaluation.
 */

export class ForgeToolchainResolver {
  resolve() {
    return null;
  }
}

export class ForgeWasmExecutor {
  constructor(_engine?: unknown) {}
  disposed = false;
  async execute() {
    throw new Error('Forge WASM executor is not supported in serverless/worker runtime.');
  }
  dispose() {}
}

export const createForgeWasmExecutor = async () => new ForgeWasmExecutor();

export const createBrowserWasmRuntime = async () => ({
  execute: async () => {
    throw new Error('Browser WASM runtime is not supported in serverless/worker runtime.');
  },
  dispose: () => {},
});

export const createWasmRuntime = createBrowserWasmRuntime;

export function resolveLanguage(request: { language?: string; filename?: string }) {
  const language = request.language || (request.filename?.endsWith('.rs') ? 'rust' : 'go');
  return { language };
}

export function supportedLanguages() {
  return Object.freeze(['rust', 'go']);
}

export function supportedRuntimeEnvironments() {
  return {
    node: false,
    vercel: false,
    'cloudflare-worker': false,
  };
}

export default {
  ForgeToolchainResolver,
  ForgeWasmExecutor,
  createBrowserWasmRuntime,
  createForgeWasmExecutor,
  createWasmRuntime,
  resolveLanguage,
  supportedLanguages,
  supportedRuntimeEnvironments,
};
