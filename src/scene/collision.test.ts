import { describe, expect, it } from 'vitest';
import { resolveMove, WORLD_BOUND, LOCUS_RADIUS } from './collision';

describe('resolveMove', () => {
  it('clamps to the world bounds', () => {
    const p = resolveMove({ x: 999, z: -999 }, []);
    expect(p.x).toBe(WORLD_BOUND);
    expect(p.z).toBe(-WORLD_BOUND);
  });

  it('keeps the player outside an obstacle circle', () => {
    const obstacles = [{ x: 0, z: 0 }];
    const p = resolveMove({ x: 0.5, z: 0 }, obstacles);
    expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(LOCUS_RADIUS - 1e-6);
  });

  it('pushes out deterministically when exactly on a centre', () => {
    const p = resolveMove({ x: 0, z: 0 }, [{ x: 0, z: 0 }]);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(LOCUS_RADIUS);
  });

  it('leaves a free position untouched', () => {
    const p = resolveMove({ x: 20, z: 20 }, [{ x: 0, z: 0 }]);
    expect(p).toEqual({ x: 20, z: 20 });
  });
});
