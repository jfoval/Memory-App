// The shared palace is a sequence of real photographed places (equirectangular
// 360° panoramas). You stand inside each room, look around, and anchor memories
// to marked directions (loci). Rooms are walked in order; loci are numbered
// 1..52 across all rooms. Images are bundled in /public/panoramas.

export interface Room {
  id: number;
  name: string;
  theme: string;
  image: string; // slug -> /public/panoramas/<image>.jpg
  accent: string; // marker/label tint
  count: number; // how many loci live in this room
}

export const ROOMS: Room[] = [
  { id: 0, name: 'The Courtyard', theme: 'a sunlit stone courtyard', image: 'courtyard', accent: '#3b82f6', count: 7 },
  { id: 1, name: 'The Overlook', theme: 'a high hilltop at dawn', image: 'overlook', accent: '#f59e0b', count: 7 },
  { id: 2, name: 'The Forest', theme: 'a green woodland clearing', image: 'forest', accent: '#22c55e', count: 6 },
  { id: 3, name: 'The Tunnel', theme: 'a long echoing tunnel', image: 'tunnel', accent: '#64748b', count: 6 },
  { id: 4, name: 'The Observatory', theme: 'a view out among the planets', image: 'observatory', accent: '#a855f7', count: 6 },
  { id: 5, name: 'The Meadow', theme: 'an open grassy meadow', image: 'meadow', accent: '#10b981', count: 7 },
  { id: 6, name: 'The Harbor', theme: 'a quiet harbor at sunset', image: 'harbor', accent: '#ef4444', count: 7 },
  { id: 7, name: 'The Suite', theme: 'a warm indoor suite', image: 'suite', accent: '#eab308', count: 6 },
];

export function roomById(id: number): Room {
  return ROOMS[id];
}
