import { create } from 'zustand';

export type Tab = 'explore' | 'sets' | 'cards' | 'review' | 'stats' | 'learn';

interface UiState {
  tab: Tab;
  activeSetId: string | null;
  setTab: (t: Tab) => void;
  openSet: (id: string) => void;
  closeSet: () => void;
}

export const useUi = create<UiState>((set) => ({
  tab: 'explore',
  activeSetId: null,
  setTab: (tab) => set({ tab }),
  openSet: (id) => set({ activeSetId: id, tab: 'sets' }),
  closeSet: () => set({ activeSetId: null }),
}));
