import type { Locus } from '../types';
import { ROOMS } from './rooms';

// The 52 loci are generated deterministically from the rooms: each room gets its
// `count` loci spread evenly around the horizon (varied pitch so markers don't
// overlap), numbered continuously 1..52 in walking order. Directions are evenly
// distributed so hotspots are clearly separated inside each real place.

function buildPalace(): Locus[] {
  const loci: Locus[] = [];
  let index = 1;
  for (const room of ROOMS) {
    for (let k = 0; k < room.count; k++) {
      // Spread evenly around the circle, offset a little per room so the first
      // marker isn't always due north.
      const yaw = (k / room.count) * Math.PI * 2 + (room.id * 0.4);
      // Gentle up/down wave around the horizon.
      const pitch = Math.sin(k * 1.3) * 0.18 + 0.02;
      loci.push({
        index,
        roomId: room.id,
        name: `${room.name.replace(/^The /, '')} ${k + 1}`,
        landmark: room.theme,
        yaw,
        pitch,
      });
      index++;
    }
  }
  return loci;
}

export const PALACE: Locus[] = buildPalace();

export function getLocus(index: number): Locus | undefined {
  return PALACE[index - 1];
}

export function lociInRoom(roomId: number): Locus[] {
  return PALACE.filter((l) => l.roomId === roomId);
}

export const LOCI_COUNT = PALACE.length; // 52
