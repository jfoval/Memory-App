import type { ZoneId } from '../types';

export interface ZoneMeta {
  id: ZoneId;
  name: string;
  theme: string;
  /** Tint used for labels, suit mapping and subtle floor colour. */
  tint: string;
  /** Card suit this zone maps to in card-deck mode. */
  suit: '♠' | '♥' | '♦' | '♣';
  suitName: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  /** South-west corner of this zone's rectangular area on the floor plan. */
  origin: { x: number; z: number };
}

// Four spatially and visually distinct zones, walked in order 1 -> 4. Each
// occupies its own quadrant of the floor plan so the four sections never blur
// together, and each maps onto one card suit for card-deck mode.
export const ZONES: Record<ZoneId, ZoneMeta> = {
  1: {
    id: 1,
    name: 'Garden Court',
    theme: 'Open-air entrance: water, stone and greenery',
    tint: '#3b82f6',
    suit: '♠',
    suitName: 'spades',
    origin: { x: -44, z: 8 },
  },
  2: {
    id: 2,
    name: 'Kitchen Wing',
    theme: 'Warm domestic interior: copper, tile and flame',
    tint: '#10b981',
    suit: '♥',
    suitName: 'hearts',
    origin: { x: 8, z: 8 },
  },
  3: {
    id: 3,
    name: 'Library Hall',
    theme: 'Quiet study: wood, brass and lamplight',
    tint: '#f59e0b',
    suit: '♦',
    suitName: 'diamonds',
    origin: { x: 8, z: -44 },
  },
  4: {
    id: 4,
    name: 'Observatory Tower',
    theme: 'High and cold: glass, steel and starlight',
    tint: '#a855f7',
    suit: '♣',
    suitName: 'clubs',
    origin: { x: -44, z: -44 },
  },
};

export const ZONE_IDS: ZoneId[] = [1, 2, 3, 4];
export const ZONE_SIZE = 36; // square side length of each zone area
