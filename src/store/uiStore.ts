import { create } from 'zustand';

export type Tab = 'routes' | 'instructions';

interface UiState {
  tab: Tab;
  setTab: (t: Tab) => void;
}

export const useUi = create<UiState>((set) => ({
  tab: 'instructions', // the instructions page greets you on every load
  setTab: (tab) => set({ tab }),
}));
