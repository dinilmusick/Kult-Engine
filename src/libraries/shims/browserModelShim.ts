/**
 * Browser-safe stub for heavy ML runtimes (ONNX / Transformers / Cactus Needle)
 * Prevents bundling 27+ MB of WASM binaries into Cloudflare Workers / frontend dist.
 */

export const pipeline = async () => {
  throw new Error('In-browser transformer models are disabled in this environment.');
};
export const env = {};

export const createNeedle = async () => ({
  extract: async () => ({}),
  complete: async () => ({}),
  embed: async () => [],
  close: () => {},
});
export const createWhistle = async () => ({
  transcribe: async () => '',
  close: () => {},
});
export const downloadModel = async () => {};

export class ModelResidency {}
export class ModelLibrary {}
export const guttsModelDefinitions: unknown[] = [];
export const guttsModelById: Record<string, unknown> = {};

export const google = {};
export const drive_v3 = {};

export class Needle3 {
  complete() { return Promise.resolve(''); }
  embed() { return Promise.resolve([]); }
}
export const needle3CompleteApi = {};
export const needle3Metadata = {};

export class SmolLM2 {
  generate() { return Promise.resolve(''); }
}
export const smolLM2GenerateApi = {};
export const smolLM2Metadata = {};

export class Whistle {
  transcribe() { return Promise.resolve(''); }
}
export const whistleTranscribeApi = {};
export const whistleMetadata = {};

export class EttinReranker {
  rerank() { return Promise.resolve([]); }
}
export class EttinReranker17M extends EttinReranker {}
export class EttinReranker32M extends EttinReranker {}
export class EttinReranker68M extends EttinReranker {}
export class EttinReranker150M extends EttinReranker {}
export const ettinRerankApi = {};
export const ettinReranker17MMetadata = {};
export const ettinReranker32MMetadata = {};
export const ettinReranker68MMetadata = {};
export const ettinReranker150MMetadata = {};

export class MiniLM {
  similarity() { return Promise.resolve(0); }
}
export const miniLMSimilarityApi = {};
export const miniLML6Metadata = {};

export default {
  pipeline,
  env,
  createNeedle,
  createWhistle,
  downloadModel,
  ModelResidency,
  ModelLibrary,
  guttsModelDefinitions,
  guttsModelById,
  google,
  drive_v3,
  Needle3,
  needle3CompleteApi,
  needle3Metadata,
  SmolLM2,
  smolLM2GenerateApi,
  smolLM2Metadata,
  Whistle,
  whistleTranscribeApi,
  whistleMetadata,
  EttinReranker,
  EttinReranker17M,
  EttinReranker32M,
  EttinReranker68M,
  EttinReranker150M,
  ettinRerankApi,
  ettinReranker17MMetadata,
  ettinReranker32MMetadata,
  ettinReranker68MMetadata,
  ettinReranker150MMetadata,
  MiniLM,
  miniLMSimilarityApi,
  miniLML6Metadata,
};
