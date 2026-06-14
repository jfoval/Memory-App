import { create } from 'zustand';

// What is currently "placed" in the world at each locus. A layer can be a
// content set or a card deck; either way the world shows the placed item at its
// locus so you learn the content WITH the location, by walking the palace.

export interface PlacedItem {
  title: string; // main text shown in the world (item content or card label)
  subtitle?: string; // optional smaller line (e.g. association)
  accent?: string; // optional colour (e.g. red for hearts/diamonds)
}

interface WorldState {
  layerName: string | null;
  placed: Record<number, PlacedItem>; // keyed by locus index 1..52
  hidden: boolean; // hide content for self-testing while walking
  setLayer: (name: string, placed: Record<number, PlacedItem>) => void;
  clearLayer: () => void;
  setHidden: (v: boolean) => void;
}

export const useWorld = create<WorldState>((set) => ({
  layerName: null,
  placed: {},
  hidden: false,
  setLayer: (layerName, placed) => set({ layerName, placed, hidden: false }),
  clearLayer: () => set({ layerName: null, placed: {}, hidden: false }),
  setHidden: (hidden) => set({ hidden }),
}));
