import { create } from 'zustand';

export type Tab = 'routes' | 'learn';

interface UiState {
  tab: Tab;
  setTab: (t: Tab) => void;
}

export const useUi = create<UiState>((set) => ({
  tab: 'routes',
  setTab: (tab) => set({ tab }),
}));
