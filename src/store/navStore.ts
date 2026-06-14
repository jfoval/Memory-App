import { create } from 'zustand';

export type ControlMode = 'guided' | 'free';

// Live input from the on-screen touch controls (joystick + look drag). Desktop
// uses keyboard/pointer-lock directly in the Player component.
export interface TouchInput {
  moveX: number; // -1..1 strafe
  moveY: number; // -1..1 forward/back
  lookDX: number; // consumed look delta (yaw)
  lookDY: number; // consumed look delta (pitch)
}

interface NavState {
  controlMode: ControlMode;
  labelsVisible: boolean;
  reducedMotion: boolean;

  selectedIndex: number | null; // locus the user tapped to read/edit
  guidedTarget: number | null; // locus to glide the camera to
  arrivedIndex: number; // last guided destination reached (1..52)

  touch: TouchInput;

  setControlMode: (m: ControlMode) => void;
  toggleLabels: () => void;
  setReducedMotion: (v: boolean) => void;
  select: (index: number | null) => void;
  gotoLocus: (index: number) => void;
  next: () => void;
  prev: () => void;
  clearGuidedTarget: (arrivedAt: number) => void;

  setMove: (x: number, y: number) => void;
  addLook: (dx: number, dy: number) => void;
  consumeLook: () => { dx: number; dy: number };
}

export const useNav = create<NavState>((set, get) => ({
  controlMode: 'guided',
  labelsVisible: true,
  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,

  selectedIndex: null,
  guidedTarget: 1,
  arrivedIndex: 1,

  touch: { moveX: 0, moveY: 0, lookDX: 0, lookDY: 0 },

  setControlMode: (controlMode) => set({ controlMode }),
  toggleLabels: () => set((s) => ({ labelsVisible: !s.labelsVisible })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  select: (selectedIndex) => set({ selectedIndex }),

  gotoLocus: (index) => set({ guidedTarget: index, selectedIndex: index }),
  next: () => {
    const i = Math.min(52, get().arrivedIndex + 1);
    set({ guidedTarget: i, selectedIndex: i });
  },
  prev: () => {
    const i = Math.max(1, get().arrivedIndex - 1);
    set({ guidedTarget: i, selectedIndex: i });
  },
  clearGuidedTarget: (arrivedAt) => set({ guidedTarget: null, arrivedIndex: arrivedAt }),

  setMove: (moveX, moveY) =>
    set((s) => ({ touch: { ...s.touch, moveX, moveY } })),
  addLook: (dx, dy) =>
    set((s) => ({ touch: { ...s.touch, lookDX: s.touch.lookDX + dx, lookDY: s.touch.lookDY + dy } })),
  consumeLook: () => {
    const { lookDX, lookDY } = get().touch;
    set((s) => ({ touch: { ...s.touch, lookDX: 0, lookDY: 0 } }));
    return { dx: lookDX, dy: lookDY };
  },
}));
