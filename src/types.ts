// Shared domain types. The palace itself lives in code (src/palace); the
// database only ever holds per-user content and progress.

// A locus is a marked direction (a "hotspot") inside one panoramic room. You
// look around the real place and each locus is a spot you anchor a memory to.
export interface Locus {
  index: number; // 1..52, the walking order
  roomId: number; // which panorama this locus lives in
  name: string; // short, memorable (e.g. "Courtyard 1")
  landmark: string; // the room's vibe, shown as a hint
  yaw: number; // horizontal direction within the room (radians)
  pitch: number; // vertical direction within the room (radians)
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
