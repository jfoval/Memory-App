import { create } from 'zustand';
import { getLocus } from '../palace/palaceData';
import { ROOMS } from '../palace/rooms';

// Navigation state for the panorama palace. You look around a room (handled in
// the viewer) and move between loci 1..52 via the guided walk, which faces each
// locus and teleports between rooms as needed.
interface NavState {
  labelsVisible: boolean;
  reducedMotion: boolean;

  currentRoom: number; // room currently displayed
  selectedIndex: number | null; // locus tapped to read/edit
  guidedTarget: number | null; // locus to face
  arrivedIndex: number; // last locus reached (1..52)

  toggleLabels: () => void;
  setReducedMotion: (v: boolean) => void;
  select: (index: number | null) => void;
  gotoLocus: (index: number) => void;
  gotoRoom: (roomId: number) => void;
  next: () => void;
  prev: () => void;
  arrive: (index: number) => void;
}

export const useNav = create<NavState>((set, get) => ({
  labelsVisible: true,
  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,

  currentRoom: 0,
  selectedIndex: null,
  guidedTarget: 1,
  arrivedIndex: 1,

  toggleLabels: () => set((s) => ({ labelsVisible: !s.labelsVisible })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  select: (selectedIndex) => set({ selectedIndex }),

  gotoLocus: (index) => set({ guidedTarget: index, selectedIndex: index }),
  gotoRoom: (roomId) => {
    // Face the first locus of that room.
    const first = getLocus(ROOMS.slice(0, roomId).reduce((n, r) => n + r.count, 0) + 1);
    if (first) set({ guidedTarget: first.index, selectedIndex: first.index });
  },
  next: () => {
    const i = Math.min(52, get().arrivedIndex + 1);
    set({ guidedTarget: i, selectedIndex: i });
  },
  prev: () => {
    const i = Math.max(1, get().arrivedIndex - 1);
    set({ guidedTarget: i, selectedIndex: i });
  },
  arrive: (index) => {
    const locus = getLocus(index);
    set({ guidedTarget: null, arrivedIndex: index, currentRoom: locus ? locus.roomId : get().currentRoom });
  },
}));
