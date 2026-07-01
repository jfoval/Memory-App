import { nowIso, uuid } from '../lib/ids';
import { makeSeed, shuffledDeck } from '../logic/cards';

// A "palace" is now a user-defined route on a real map: an ordered list of pins
// (loci) the user drops along a path they know. Each pin holds the thing to
// remember. Stored per-user in localStorage (cloud sync can layer on later via
// the existing repository pattern).

// Where to look from the viewing panorama to see this locus (Google Street View).
export interface StreetViewPov {
  heading: number; // compass bearing, degrees
  pitch: number; // vertical tilt, degrees
  zoom: number; // magnification
}

export interface RoutePoint {
  id: string;
  order: number; // 1-based position along the walk
  lat: number;
  lng: number;
  imageId?: string; // street-level pano/image this stop was viewed from (Mapillary id or Google panoId)
  pov?: StreetViewPov; // gaze direction toward the locus, so a walk returns facing it
  label: string; // the place ("the oak tree", "Joe's Diner")
  content: string; // what to remember here
  association: string; // the user's vivid link (optional)
  card?: number; // playing-card id 0..51 in Practice mode (see logic/cards.ts)
}

// One Test-mode result, kept so the user can see progress over time.
export interface ScoreEntry {
  date: string;
  streak: number; // how many in a row before the first miss
  total: number; // number of stops in the route at the time
}

export interface Route {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  points: RoutePoint[];
  bestStreak?: number; // best Test-mode run on this route
  scoreHistory?: ScoreEntry[]; // recent Test results, newest last
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

export function addPoint(
  route: Route,
  lat: number,
  lng: number,
  imageId?: string,
  pov?: StreetViewPov,
): Route {
  const point: RoutePoint = {
    id: uuid(),
    order: route.points.length + 1,
    lat,
    lng,
    imageId,
    pov,
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

// --- Practice (card) mode ---

// Deal one distinct random playing card to each stop (Practice mode).
export function dealCards(route: Route): Route {
  const deck = shuffledDeck(makeSeed(), route.points.length);
  return { ...route, points: route.points.map((p, i) => ({ ...p, card: deck[i] })) };
}

// Record a Test-mode run, updating the all-time best streak and recent history.
export function recordScore(route: Route, streak: number, total: number): Route {
  const entry: ScoreEntry = { date: nowIso(), streak, total };
  return {
    ...route,
    bestStreak: Math.max(route.bestStreak ?? 0, streak),
    scoreHistory: [...(route.scoreHistory ?? []), entry].slice(-20),
  };
}
