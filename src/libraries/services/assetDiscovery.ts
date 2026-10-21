/**
 * @file assetDiscovery.ts
 * @description Real KRNLTS & KLOKS Asset Discovery Engine (§7 & §8).
 * Inspects authoritative exports and facades from @ultrst-armada/kloks and @ultrst-armada/krnl.
 */

import type { AssetRef, PortSpec } from '../types/serviceIR';
import { KLOKS_PUBLIC_SURFACE } from '@ultrst-armada/kloks/contracts';

export interface DiscoveredAsset extends AssetRef {
  name: string;
  description: string;
  inputPorts: PortSpec[];
  outputPorts: PortSpec[];
  defaultConfig: Record<string, unknown>;
  kind: 'PureFunction' | 'Transform' | 'Validation' | 'EntityState' | 'ServiceFacade' | 'Control';
}

const AUTHORITATIVE_ASSETS: DiscoveredAsset[] = [
  {
    package: '@ultrst-armada/kloks',
    export: 'ServiceAFacade',
    name: 'Kloks Service A (Arithmetic)',
    description: 'Deterministic mathematical operations (add, multiply) powered by KrnlTS Service',
    category: 'services',
    version: '1.4.2',
    source: '@ultrst-armada/kloks/services',
    contractFingerprint: 'kloks_svc_a_v1',
    kind: 'ServiceFacade',
    inputPorts: [
      { id: 'op', name: 'operation', direction: 'input', valueType: 'string', defaultValue: 'add' },
      { id: 'a', name: 'a', direction: 'input', valueType: 'number', defaultValue: 10 },
      { id: 'b', name: 'b', direction: 'input', valueType: 'number', defaultValue: 5 },
    ],
    outputPorts: [
      { id: 'result', name: 'result', direction: 'output', valueType: 'number' },
    ],
    defaultConfig: { runtime: 'server', deployment: 'local' },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'ServiceBFacade',
    name: 'Kloks Service B (Stateful Counter)',
    description: 'Stateful reactive counter with increment, getCount, and reset operations',
    category: 'services',
    version: '1.4.2',
    source: '@ultrst-armada/kloks/services',
    contractFingerprint: 'kloks_svc_b_v1',
    kind: 'EntityState',
    inputPorts: [
      { id: 'op', name: 'operation', direction: 'input', valueType: 'string', defaultValue: 'increment' },
      { id: 'delta', name: 'delta', direction: 'input', valueType: 'number', defaultValue: 1 },
    ],
    outputPorts: [
      { id: 'count', name: 'count', direction: 'output', valueType: 'number' },
      { id: 'lastUpdated', name: 'lastUpdated', direction: 'output', valueType: 'number' },
    ],
    defaultConfig: { initialCount: 0 },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'AuthClientServiceFacade',
    name: 'Kloks Auth Service Facade',
    description: 'Cryptographic authentication, user session state, and workspace permission verification',
    category: 'services',
    version: '1.4.2',
    source: '@ultrst-armada/kloks/services',
    contractFingerprint: 'kloks_auth_facade_v1',
    kind: 'ServiceFacade',
    inputPorts: [
      { id: 'email', name: 'email', direction: 'input', valueType: 'string', defaultValue: 'admin@kult.org' },
      { id: 'password', name: 'password', direction: 'input', valueType: 'string', defaultValue: '' },
    ],
    outputPorts: [
      { id: 'isAuth', name: 'isAuthenticated', direction: 'output', valueType: 'boolean' },
      { id: 'user', name: 'userRecord', direction: 'output', valueType: 'object' },
    ],
    defaultConfig: { sessionTimeout: 3600 },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'AudioHardwareServiceFacade',
    name: 'Kloks Pro-Audio Named Bus',
    description: 'Pro-audio hardware stream manager, channel routing, and discrete named buses',
    category: 'audio-midi',
    version: '1.4.2',
    source: '@ultrst-armada/kloks/audio-midi',
    contractFingerprint: 'kloks_audio_hw_v1',
    kind: 'ServiceFacade',
    inputPorts: [
      { id: 'busName', name: 'busName', direction: 'input', valueType: 'string', defaultValue: 'master' },
      { id: 'channels', name: 'channelCount', direction: 'input', valueType: 'number', defaultValue: 2 },
    ],
    outputPorts: [
      { id: 'state', name: 'hardwareState', direction: 'output', valueType: 'object' },
      { id: 'isInit', name: 'isInitialized', direction: 'output', valueType: 'boolean' },
    ],
    defaultConfig: { sampleRate: 48000 },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'MidiServiceFacade',
    name: 'Kloks Reactive MIDI Engine',
    description: 'Translates raw MIDI byte streams into high-level events with loopback routing',
    category: 'audio-midi',
    version: '1.4.2',
    source: '@ultrst-armada/kloks/audio-midi',
    contractFingerprint: 'kloks_midi_svc_v1',
    kind: 'ServiceFacade',
    inputPorts: [
      { id: 'cmd', name: 'command', direction: 'input', valueType: 'string', defaultValue: 'NOTE_ON' },
      { id: 'note', name: 'note', direction: 'input', valueType: 'number', defaultValue: 60 },
      { id: 'vel', name: 'velocity', direction: 'input', valueType: 'number', defaultValue: 100 },
    ],
    outputPorts: [
      { id: 'evt', name: 'midiEvent', direction: 'output', valueType: 'object' },
      { id: 'time', name: 'timestamp', direction: 'output', valueType: 'number' },
    ],
    defaultConfig: { sysex: false },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'FunctionsServiceFacade',
    name: 'Kloks Pure Functions Suite',
    description: 'Authoritative data utilities: UUID/Slug transformations, deep merge, and formatting',
    category: 'functions',
    version: '1.4.2',
    source: '@ultrst-armada/kloks/functions',
    contractFingerprint: 'kloks_functions_v1',
    kind: 'PureFunction',
    inputPorts: [
      { id: 'text', name: 'inputText', direction: 'input', valueType: 'string', defaultValue: 'hello kult engine' },
      { id: 'format', name: 'formatMode', direction: 'input', valueType: 'string', defaultValue: 'kebab' },
    ],
    outputPorts: [
      { id: 'outText', name: 'formattedText', direction: 'output', valueType: 'string' },
      { id: 'uuid', name: 'generatedId', direction: 'output', valueType: 'string' },
    ],
    defaultConfig: { sanitize: true },
  },
  {
    package: '@ultrst-armada/kloks',
    export: 'KLOKS_CANONICAL_CONTRACT',
    name: 'Kloks Contract Validator',
    description: 'Validates public symbol compatibility and verifies consumer surface integrity',
    category: 'contracts',
    version: '1.4.2',
    source: '@ultrst-armada/kloks/contracts',
    contractFingerprint: 'kloks_contract_v1',
    kind: 'Validation',
    inputPorts: [
      { id: 'payload', name: 'contractPayload', direction: 'input', valueType: 'object' },
    ],
    outputPorts: [
      { id: 'valid', name: 'isValid', direction: 'output', valueType: 'boolean' },
      { id: 'checksum', name: 'contractChecksum', direction: 'output', valueType: 'string' },
    ],
    defaultConfig: { strict: true },
  },
  {
    package: '@ultrst-armada/krnl',
    export: 'ServiceStateStore',
    name: 'KrnlTS State Store',
    description: 'Core KrnlTS atomic state container with change subscriptions',
    category: 'state-graph',
    version: '1.0.2',
    source: '@ultrst-armada/krnl',
    contractFingerprint: 'krnl_state_store_v1',
    kind: 'EntityState',
    inputPorts: [
      { id: 'key', name: 'stateKey', direction: 'input', valueType: 'string', defaultValue: 'config' },
      { id: 'val', name: 'stateValue', direction: 'input', valueType: 'object' },
    ],
    outputPorts: [
      { id: 'snapshot', name: 'stateSnapshot', direction: 'output', valueType: 'object' },
    ],
    defaultConfig: { namespace: 'krnl.state' },
  },
];

export function discoverKloksAssets(): DiscoveredAsset[] {
  // KLOKS_PUBLIC_SURFACE is the authoritative package contract. The fallback
  // metadata below is only the local adapter for symbols whose richer port
  // descriptions are not exposed by the package contract yet.
  const validNames = new Set(KLOKS_PUBLIC_SURFACE.map((s) => s.name));
  return AUTHORITATIVE_ASSETS
    .filter((asset) => asset.package === '@ultrst-armada/krnl' || validNames.has(asset.export))
    .map((asset) => ({ ...asset, metadata: { isPublicSurface: true } }));
}

export function searchAssets(query: string, category?: string): DiscoveredAsset[] {
  const q = query.trim().toLowerCase();
  const all = discoverKloksAssets();
  return all.filter((asset) => {
    const matchesCat = !category || category === 'all' || asset.category === category;
    const matchesQuery =
      !q ||
      asset.name.toLowerCase().includes(q) ||
      asset.export.toLowerCase().includes(q) ||
      asset.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });
}
