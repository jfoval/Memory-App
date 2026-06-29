import { nowIso, uuid } from '../lib/ids';

// A "palace" is now a user-defined route on a real map: an ordered list of pins
// (loci) the user drops along a path they know. Each pin holds the thing to
// remember. Stored per-user in localStorage (cloud sync can layer on later via
// the existing repository pattern).

export interface RoutePoint {
  id: string;
  order: number; // 1-based position along the walk
  lat: number;
  lng: number;
  imageId?: string; // street-level image this stop was dropped at (Mapillary)
  label: string; // the place ("the oak tree", "Joe's Diner")
  content: string; // what to remember here
  association: string; // the user's vivid link (optional)
}

export interface Route {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  points: RoutePoint[];
}

const KEY = 'mp:routes:v1';

function loadAll(): Route[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Route[];
  } catch {
    return [];
  }
}
function saveAll(routes: Route[]): void {
  localStorage.setItem(KEY, JSON.stringify(routes));
}

export function listRoutes(userId: string): Route[] {
  return loadAll()
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getRoute(id: string): Route | undefined {
  return loadAll().find((r) => r.id === id);
}

export function createRoute(userId: string, name: string): Route {
  const all = loadAll();
  const route: Route = {
    id: uuid(),
    userId,
    name: name.trim() || 'Untitled route',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    points: [],
  };
  all.push(route);
  saveAll(all);
  return route;
}

export function saveRoute(route: Route): void {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === route.id);
  const updated = { ...route, updatedAt: nowIso() };
  if (idx >= 0) all[idx] = updated;
  else all.push(updated);
  saveAll(all);
}

export function deleteRoute(id: string): void {
  saveAll(loadAll().filter((r) => r.id !== id));
}

// --- pure helpers for editing a route's points (renumber on every change) ---
export function renumber(points: RoutePoint[]): RoutePoint[] {
  return points.map((p, i) => ({ ...p, order: i + 1 }));
}

export function addPoint(route: Route, lat: number, lng: number, imageId?: string): Route {
  const point: RoutePoint = {
    id: uuid(),
    order: route.points.length + 1,
    lat,
    lng,
    imageId,
    label: `Stop ${route.points.length + 1}`,
    content: '',
    association: '',
  };
  return { ...route, points: renumber([...route.points, point]) };
}

export function updatePoint(route: Route, id: string, patch: Partial<RoutePoint>): Route {
  return { ...route, points: route.points.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

export function removePoint(route: Route, id: string): Route {
  return { ...route, points: renumber(route.points.filter((p) => p.id !== id)) };
}

export function movePoint(route: Route, id: string, dir: -1 | 1): Route {
  const i = route.points.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= route.points.length) return route;
  const points = [...route.points];
  [points[i], points[j]] = [points[j], points[i]];
  return { ...route, points: renumber(points) };
}
