// ══════════════════════════════════════════════════════════════════════════════
// 1. MINIMAL BACKEND FACADE (@kloks/* COMPOSITION)
// ══════════════════════════════════════════════════════════════════════════════

import { ServiceAFacade, ServiceBFacade } from '@kloks/services';
import { OrchestratorAFacade } from '@kloks/orchestrations';
import { AudioHardwareServiceFacade, MidiServiceFacade, AudioMidiOrchestratorFacade } from '@kloks/audio-midi';
import { AuthServiceFacade, StorageServiceFacade, WorkspaceServiceFacade } from '@kloks/backend';
import { ExecutableBackendFacade, WorkerExecutionBoundary } from '@kloks/backend/execution';

export const services = {
  serviceA: ServiceAFacade,
  serviceB: ServiceBFacade,
  audioHardware: AudioHardwareServiceFacade,
  midi: MidiServiceFacade,
  auth: AuthServiceFacade,
  storage: StorageServiceFacade,
  workspace: WorkspaceServiceFacade,
};

export const orchestrations = {
  orchestratorA: OrchestratorAFacade,
  audioMidi: AudioMidiOrchestratorFacade,
};

export const executableFacade = new ExecutableBackendFacade('AppBackend');
export const appWorkerBoundary = new WorkerExecutionBoundary('app_worker_main', executableFacade);

export const AppBackend = {
  services,
  orchestrations,
  worker: appWorkerBoundary,
  WorkerExecutionBoundary: appWorkerBoundary,
};

export default AppBackend;
