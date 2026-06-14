// Shared domain types. The palace itself lives in code (src/palace); the
// database only ever holds per-user content and progress.

export type ZoneId = 1 | 2 | 3 | 4;

export type LocusShape =
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'pyramid'
  | 'arch'
  | 'ring';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Locus {
  index: number; // 1..52, the walking order
  zone: ZoneId;
  name: string; // short, memorable
  landmark: string; // distinctive description driving the visual
  shape: LocusShape;
  color: string; // hex, distinct from immediate neighbours
  position: Vec3; // authored for clear spacing along the route
}

export type ContentSetKind = 'study' | 'list' | 'verbatim' | 'numbers' | 'custom';
export type ItemContentType = 'fact' | 'list-item' | 'concept' | 'number' | 'image-ref';

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface ContentSet {
  id: string;
  userId: string;
  name: string;
  kind: ContentSetKind;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  userId: string;
  contentSetId: string;
  locusIndex: number; // 1..52
  content: string;
  contentType: ItemContentType;
  association?: string | null;
  imagePath?: string | null;
  embedding?: number[] | null; // computed on-device; null if unavailable
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  itemId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  scheduledFor: string;
  lastReviewed: string | null;
  lastScore: number | null;
  updatedAt: string;
}

export interface CardResult {
  id: string;
  userId: string;
  deckSeed: number;
  deckOrder: number[]; // 0..51 card ids in shuffled order
  recalled: (number | null)[]; // user answers per position
  score: number;
  timeMs: number;
  createdAt: string;
}
