/**
 * @file starterServices.ts
 * @description Canonical pre-authored KRNLTS service definitions for immediate authoring.
 */

import type { ServiceDocument } from '../types/serviceIR';

export const STARTER_AUDIO_SERVICE: ServiceDocument = {
  schemaVersion: '1.0.0',
  service: {
    id: 'svc-audio-harmonic',
    name: 'Audio Harmonic Processor',
    version: '1.2.0',
    description: 'Generates polyphonic harmonic waves and filters resonant spectrums',
    entryNodeId: 'node-in',
    inputPorts: [
      { id: 'in-freq', name: 'frequency', direction: 'input', valueType: 'number', defaultValue: 440 },
      { id: 'in-harmonics', name: 'harmonicCount', direction: 'input', valueType: 'number', defaultValue: 6 },
      { id: 'in-cutoff', name: 'cutoffFreq', direction: 'input', valueType: 'number', defaultValue: 1500 },
    ],
    outputPorts: [
      { id: 'out-signal', name: 'signalOut', direction: 'output', valueType: 'object' },
      { id: 'out-amp', name: 'peakAmplitude', direction: 'output', valueType: 'number' },
    ],
  },
  nodes: [
    {
      id: 'node-in',
      kind: 'ServiceInput',
      type: 'ServiceInput',
      version: '1.0.0',
      position: { x: 80, y: 160 },
      config: {},
      inputs: [],
      outputs: [
        { id: 'p-freq', name: 'frequency', direction: 'output', valueType: 'number', defaultValue: 440 },
        { id: 'p-harmonics', name: 'harmonicCount', direction: 'output', valueType: 'number', defaultValue: 6 },
        { id: 'p-cutoff', name: 'cutoffFreq', direction: 'output', valueType: 'number', defaultValue: 1500 },
      ],
    },
    {
      id: 'node-synth',
      kind: 'ServiceFacade',
      type: 'AudioHarmonicSynthesizer',
      version: '1.4.3',
      position: { x: 380, y: 120 },
      config: { interpolation: 'cubic', sampleRate: 48000 },
      inputs: [
        { id: 'freq', name: 'frequency', direction: 'input', valueType: 'number', defaultValue: 440 },
        { id: 'harmonics', name: 'harmonicCount', direction: 'input', valueType: 'number', defaultValue: 6 },
        { id: 'gain', name: 'gain', direction: 'input', valueType: 'number', defaultValue: 0.8 },
      ],
      outputs: [
        { id: 'wave', name: 'waveformBuffer', direction: 'output', valueType: 'object' },
        { id: 'peak', name: 'peakAmplitude', direction: 'output', valueType: 'number' },
      ],
    },
    {
      id: 'node-filter',
      kind: 'Transform',
      type: 'BiquadFrequencyFilter',
      version: '1.4.3',
      position: { x: 700, y: 120 },
      config: { filterMode: 'lowpass' },
      inputs: [
        { id: 'signal', name: 'signalIn', direction: 'input', valueType: 'object' },
        { id: 'cutoff', name: 'cutoffFreq', direction: 'input', valueType: 'number', defaultValue: 1500 },
        { id: 'q', name: 'resonanceQ', direction: 'input', valueType: 'number', defaultValue: 1.2 },
      ],
      outputs: [
        { id: 'filtered', name: 'signalOut', direction: 'output', valueType: 'object' },
      ],
    },
    {
      id: 'node-out',
      kind: 'ServiceOutput',
      type: 'ServiceOutput',
      version: '1.0.0',
      position: { x: 1020, y: 160 },
      config: {},
      inputs: [
        { id: 'p-sig-in', name: 'signalOut', direction: 'input', valueType: 'object' },
        { id: 'p-amp-in', name: 'peakAmplitude', direction: 'input', valueType: 'number' },
      ],
      outputs: [],
    },
  ],
  edges: [
    { id: 'e1', sourceNodeId: 'node-in', sourcePort: 'p-freq', targetNodeId: 'node-synth', targetPort: 'freq' },
    { id: 'e2', sourceNodeId: 'node-in', sourcePort: 'p-harmonics', targetNodeId: 'node-synth', targetPort: 'harmonics' },
    { id: 'e3', sourceNodeId: 'node-synth', sourcePort: 'wave', targetNodeId: 'node-filter', targetPort: 'signal' },
    { id: 'e4', sourceNodeId: 'node-in', sourcePort: 'p-cutoff', targetNodeId: 'node-filter', targetPort: 'cutoff' },
    { id: 'e5', sourceNodeId: 'node-filter', sourcePort: 'filtered', targetNodeId: 'node-out', targetPort: 'p-sig-in' },
    { id: 'e6', sourceNodeId: 'node-synth', sourcePort: 'peak', targetNodeId: 'node-out', targetPort: 'p-amp-in' },
  ],
  uiSchema: {
    version: '1.0.0',
    title: 'Harmonic Synth Control Surface',
    description: 'Realtime interactive controls bound to KRNLTS service inputs',
    fields: [
      { id: 'f-freq', type: 'number', label: 'Base Frequency (Hz)', targetPort: 'frequency', defaultValue: 440 },
      { id: 'f-harm', type: 'number', label: 'Harmonic Count', targetPort: 'harmonicCount', defaultValue: 6 },
      { id: 'f-cut', type: 'number', label: 'Cutoff Frequency (Hz)', targetPort: 'cutoffFreq', defaultValue: 1500 },
    ],
    submitActionLabel: 'Execute Audio Pipeline',
    outputBindingPort: 'peakAmplitude',
  },
  assets: [],
  tests: [
    {
      id: 't-default',
      name: 'Default 440Hz Concert Pitch Test',
      input: { frequency: 440, harmonicCount: 6, cutoffFreq: 1500 },
      expectedOutput: { peakAmplitude: 0.84 },
      assertions: [
        { port: 'peakAmplitude', operator: 'greaterThan', value: 0.5 },
      ],
      enabled: true,
    },
    {
      id: 't-bass',
      name: 'Deep Bass 110Hz Sub-harmonic Test',
      input: { frequency: 110, harmonicCount: 12, cutoffFreq: 800 },
      assertions: [
        { port: 'peakAmplitude', operator: 'defined', value: true },
      ],
      enabled: true,
    },
  ],
  metadata: { author: 'Kult System', createdAt: '2026-10-16' },
};

export const STARTER_SERVICES = [STARTER_AUDIO_SERVICE];
