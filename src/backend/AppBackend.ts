// ══════════════════════════════════════════════════════════════════════════════
// 1. MINIMAL BACKEND FACADE (@ultrst-armada/kloks COMPOSITION)
// ══════════════════════════════════════════════════════════════════════════════

import {
  AudioHardwareServiceFacade,
  AudioMidiOrchestratorFacade,
  AuthServiceFacade,
} from '@ultrst-armada/kloks';

export const services = {
  audioHardware: AudioHardwareServiceFacade,
  auth: AuthServiceFacade,
};

export const orchestrations = {
  audioMidi: AudioMidiOrchestratorFacade,
};

export const AppBackend = {
  services,
  orchestrations,
};

export default AppBackend;
