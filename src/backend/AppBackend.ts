// ══════════════════════════════════════════════════════════════════════════════
// 1. MINIMAL BACKEND FACADE (@ultrst-armada/kloks COMPOSITION)
// ══════════════════════════════════════════════════════════════════════════════

import {
  AudioHardwareServiceFacade,
  AuthServiceFacade,
} from '@ultrst-armada/kloks';
import { skipoAgentService } from '../libraries/services/skipoAgent';

export const services = {
  audioHardware: AudioHardwareServiceFacade,
  auth: AuthServiceFacade,
  skipoAgent: skipoAgentService,
};

export const AppBackend = {
  services,
};

export default AppBackend;
