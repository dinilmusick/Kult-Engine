/**
 * @file assetDiscovery.ts
 * @description KRNLTS & KLOKS Asset Discovery Adapter (§7 & §8 of IMPLEMENTATION-SPEC.md).
 * Surfaces authoritative symbols from @ultrst-armada/krnl and @ultrst-armada/kloks.
 */

import type { AssetRef, PortSpec } from '../types/serviceIR';

export interface DiscoveredAsset extends AssetRef {
  name: string;
  description: string;
  inputPorts: PortSpec[];
  outputPorts: PortSpec[];
  defaultConfig: Record<string, unknown>;
  kind: 'PureFunction' | 'Transform' | 'Validation' | 'EntityState' | 'ServiceFacade' | 'Control';
}

export const CANONICAL_ASSETS: DiscoveredAsset[] = [
  {
    package: '@ultrst-armada/kloks',
    export: 'AudioHarmonicSynthesizer',
    name: 'Audio Harmonic Synthesizer',
    description: 'Generates polyphonic harmonic waves with overtone control',
    category: 'audio-midi',
    version: '1.4.3',
    source: '@ultrst-armada/kloks/audio-midi',
    contractFingerprint: 'sig_audio_harmonic_v1',
    kind: 'ServiceFacade',
    inputPorts: [
      { id: 'freq', name: 'frequency', direction: 'input', valueType: 'number', defaultValue: 440 },
      { id: 'harmonics', name: 'harmonicCount', direction: 'input', valueType: 'number', defaultValue: 8 },
      { id: 'gain', name: 'gain', direction: 'input', valueType: 'number', defaultValue: 0.8 },
    ],
    outputPorts: [
      { id: 'wave', name: 'waveformBuffer', direction: 'output', valueType: 'object' },
      { id: 'peak', name: 'peakAmplitude', direction: 'output', valueType: 'number' },
    ],
    defaultConfig: { interpolation: 'cubic', sampleRate: 48000 },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'BiquadFilterNode',
    name: 'Biquad Frequency Filter',
    description: 'Low-pass, high-pass, and band-pass filter with resonance',
    category: 'audio-midi',
    version: '1.4.3',
    source: '@ultrst-armada/kloks/audio-midi',
    contractFingerprint: 'sig_biquad_filter_v1',
    kind: 'Transform',
    inputPorts: [
      { id: 'signal', name: 'signalIn', direction: 'input', valueType: 'object' },
      { id: 'cutoff', name: 'cutoffFreq', direction: 'input', valueType: 'number', defaultValue: 1200 },
      { id: 'q', name: 'resonanceQ', direction: 'input', valueType: 'number', defaultValue: 1.5 },
    ],
    outputPorts: [
      { id: 'filtered', name: 'signalOut', direction: 'output', valueType: 'object' },
    ],
    defaultConfig: { filterMode: 'lowpass' },
  },
  {
    package: '@ultrst-armada/krnl',
    export: 'ServiceValidator',
    name: 'Payload Schema Validator',
    description: 'Enforces strict JSON schema validation and types for input contracts',
    category: 'contracts',
    version: '1.0.1',
    source: '@ultrst-armada/krnl',
    contractFingerprint: 'sig_krnl_validator_v1',
    kind: 'Validation',
    inputPorts: [
      { id: 'data', name: 'payload', direction: 'input', valueType: 'object' },
    ],
    outputPorts: [
      { id: 'valid', name: 'isValid', direction: 'output', valueType: 'boolean' },
      { id: 'sanitized', name: 'sanitizedData', direction: 'output', valueType: 'object' },
    ],
    defaultConfig: { strictMode: true },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'AuthServiceFacade',
    name: 'Auth Credential Verifier',
    description: 'Validates cryptographic session tokens and role permissions',
    category: 'backend',
    version: '1.4.3',
    source: '@ultrst-armada/kloks/backend',
    contractFingerprint: 'sig_auth_verifier_v1',
    kind: 'ServiceFacade',
    inputPorts: [
      { id: 'token', name: 'authToken', direction: 'input', valueType: 'string', defaultValue: 'Bearer sess::token' },
      { id: 'role', name: 'requiredRole', direction: 'input', valueType: 'string', defaultValue: 'user' },
    ],
    outputPorts: [
      { id: 'authorized', name: 'isAuthorized', direction: 'output', valueType: 'boolean' },
      { id: 'userId', name: 'userId', direction: 'output', valueType: 'string' },
    ],
    defaultConfig: { sessionExpiryMinutes: 60 },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'DataTransformer',
    name: 'Array Map & Aggregate',
    description: 'Performs statistical aggregation and transformation over collections',
    category: 'functions',
    version: '1.4.3',
    source: '@ultrst-armada/kloks/functions',
    contractFingerprint: 'sig_data_aggregator_v1',
    kind: 'PureFunction',
    inputPorts: [
      { id: 'items', name: 'inputList', direction: 'input', valueType: 'array', defaultValue: [10, 20, 30, 40] },
      { id: 'multiplier', name: 'scaleFactor', direction: 'input', valueType: 'number', defaultValue: 1.5 },
    ],
    outputPorts: [
      { id: 'transformed', name: 'resultList', direction: 'output', valueType: 'array' },
      { id: 'sum', name: 'totalSum', direction: 'output', valueType: 'number' },
    ],
    defaultConfig: { roundResults: true },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'StateStoreNode',
    name: 'Persistent State Store',
    description: 'Key-value state store with atomic mutate operations',
    category: 'state-graph',
    version: '1.4.3',
    source: '@ultrst-armada/kloks/state-graph',
    contractFingerprint: 'sig_state_store_v1',
    kind: 'EntityState',
    inputPorts: [
      { id: 'key', name: 'stateKey', direction: 'input', valueType: 'string', defaultValue: 'user_profile' },
      { id: 'val', name: 'stateValue', direction: 'input', valueType: 'any' },
    ],
    outputPorts: [
      { id: 'stored', name: 'savedRecord', direction: 'output', valueType: 'object' },
      { id: 'version', name: 'stateVersion', direction: 'output', valueType: 'number' },
    ],
    defaultConfig: { namespace: 'default' },
  },
];

export function searchAssets(query: string, category?: string): DiscoveredAsset[] {
  const q = query.trim().toLowerCase();
  return CANONICAL_ASSETS.filter((asset) => {
    const matchesCat = !category || category === 'all' || asset.category === category;
    const matchesQuery =
      !q ||
      asset.name.toLowerCase().includes(q) ||
      asset.export.toLowerCase().includes(q) ||
      asset.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });
}
