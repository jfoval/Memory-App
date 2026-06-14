import { PALACE } from '../palace/palaceData';

// Simple, robust collision: keep the player inside the floor bounds and outside
// a keep-out circle around each locus. Movement that would enter a circle slides
// along it instead of stopping, so the player can never clip through or get
// stuck. Pure functions so the behaviour is unit-testable.

export const WORLD_BOUND = 47; // half-extent of the walkable floor
export const LOCUS_RADIUS = 2.3; // keep-out radius around each landmark
export const EYE_HEIGHT = 1.7;

export interface Pt {
  x: number;
  z: number;
}

const OBSTACLES: Pt[] = PALACE.map((l) => ({ x: l.position.x, z: l.position.z }));

function clampBounds(p: Pt): Pt {
  return {
    x: Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, p.x)),
    z: Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, p.z)),
  };
}

function pushOut(p: Pt, obstacles: Pt[]): Pt {
  let { x, z } = p;
  for (const o of obstacles) {
    const dx = x - o.x;
    const dz = z - o.z;
    const dist = Math.hypot(dx, dz);
    if (dist < LOCUS_RADIUS) {
      if (dist < 1e-4) {
        // Exactly on the centre — nudge along +x deterministically.
        x = o.x + LOCUS_RADIUS;
      } else {
        const scale = LOCUS_RADIUS / dist;
        x = o.x + dx * scale;
        z = o.z + dz * scale;
      }
    }
  }
  return { x, z };
}

export function resolveMove(desired: Pt, obstacles: Pt[] = OBSTACLES): Pt {
  return pushOut(clampBounds(desired), obstacles);
}

export const palaceObstacles = OBSTACLES;
