// ══════════════════════════════════════════════════════════════════════════════
// HOVER INSPECTION ZUSTAND STORE (Laws L9, L18, L19 Compliance)
// Exclusivity: BottomStrip hover inspection and dynamic 'D' key inspector
// ══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';

export interface InspectionState {
  hoverLabel: string;
  hoverDescription: string;
  isDKeyPressed: boolean;
  activeApiCount: number;
  systemMessage: string;
  setHover: (label: string, description?: string) => void;
  clearHover: () => void;
  setDKeyPressed: (pressed: boolean) => void;
  setApiCount: (count: number) => void;
  incrementApiCount: () => void;
  decrementApiCount: () => void;
  setSystemMessage: (msg: string) => void;
}

export const useInspectionStore = create<InspectionState>((set) => ({
  hoverLabel: '',
  hoverDescription: '',
  isDKeyPressed: false,
  activeApiCount: 0,
  systemMessage: 'SYSTEM ONLINE',
  setHover: (label, description = '') => set({ hoverLabel: label, hoverDescription: description }),
  clearHover: () => set({ hoverLabel: '', hoverDescription: '' }),
  setDKeyPressed: (isDKeyPressed) => set({ isDKeyPressed }),
  setApiCount: (activeApiCount) => set({ activeApiCount: Math.max(0, activeApiCount) }),
  incrementApiCount: () => set((state) => ({ activeApiCount: state.activeApiCount + 1 })),
  decrementApiCount: () => set((state) => ({ activeApiCount: Math.max(0, state.activeApiCount - 1) })),
  setSystemMessage: (systemMessage) => set({ systemMessage }),
}));
