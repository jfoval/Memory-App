import { create } from 'zustand';
import {
  addPoint,
  movePoint,
  removePoint,
  saveRoute,
  updatePoint,
  type Route,
  type RoutePoint,
  type StreetViewPov,
} from '../data/routes';

// Holds the route currently being edited or walked. Every mutation persists.
interface RoutesState {
  route: Route | null;
  selectedId: string | null;
  mode: 'edit' | 'walk';
  view: 'map' | 'street';
  entry: { lat: number; lng: number; imageId?: string } | null; // where to enter Street View
  walkIndex: number; // index into points during a walk
  revealed: boolean;

  open: (route: Route, mode?: 'edit' | 'walk') => void;
  close: () => void;
  select: (id: string | null) => void;
  addAt: (lat: number, lng: number) => void;
  addStreetStop: (lat: number, lng: number, imageId: string, pov?: StreetViewPov) => void;
  update: (id: string, patch: Partial<RoutePoint>) => void;
  remove: (id: string) => void;
  move: (id: string, dir: -1 | 1) => void;
  rename: (name: string) => void;

  setMode: (mode: 'edit' | 'walk') => void;
  setView: (view: 'map' | 'street') => void;
  setEntry: (entry: { lat: number; lng: number; imageId?: string }) => void;
  walkTo: (index: number) => void;
  setRevealed: (v: boolean) => void;
}

function persist(route: Route): Route {
  saveRoute(route);
  return route;
}

export const useRoutes = create<RoutesState>((set, get) => ({
  route: null,
  selectedId: null,
  mode: 'edit',
  view: 'map',
  entry: null,
  walkIndex: 0,
  revealed: true,

  open: (route, mode = 'edit') =>
    set({ route, mode, view: 'map', entry: null, selectedId: null, walkIndex: 0, revealed: mode === 'edit' }),
  close: () => set({ route: null, selectedId: null }),
  select: (selectedId) => set({ selectedId }),

  addAt: (lat, lng) => {
    const r = get().route;
    if (!r) return;
    const next = persist(addPoint(r, lat, lng));
    set({ route: next, selectedId: next.points[next.points.length - 1].id });
  },
  addStreetStop: (lat, lng, imageId, pov) => {
    const r = get().route;
    if (!r) return;
    const next = persist(addPoint(r, lat, lng, imageId, pov));
    set({ route: next, selectedId: next.points[next.points.length - 1].id });
  },
  update: (id, patch) => {
    const r = get().route;
    if (!r) return;
    set({ route: persist(updatePoint(r, id, patch)) });
  },
  remove: (id) => {
    const r = get().route;
    if (!r) return;
    set({ route: persist(removePoint(r, id)), selectedId: null });
  },
  move: (id, dir) => {
    const r = get().route;
    if (!r) return;
    set({ route: persist(movePoint(r, id, dir)) });
  },
  rename: (name) => {
    const r = get().route;
    if (!r) return;
    set({ route: persist({ ...r, name }) });
  },

  setMode: (mode) => set({ mode, revealed: mode === 'edit' }),
  setView: (view) => set({ view }),
  setEntry: (entry) => set({ entry, view: 'street' }),
  walkTo: (walkIndex) => set({ walkIndex, revealed: false }),
  setRevealed: (revealed) => set({ revealed }),
}));
