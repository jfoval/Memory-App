import { describe, expect, it } from 'vitest';
import { PALACE, getLocus, lociInRoom, LOCI_COUNT } from './palaceData';
import { ROOMS } from './rooms';

describe('shared palace (panorama rooms)', () => {
  it('has exactly 52 loci', () => {
    expect(LOCI_COUNT).toBe(52);
  });

  it('room counts sum to 52', () => {
    expect(ROOMS.reduce((n, r) => n + r.count, 0)).toBe(52);
  });

  it('is numbered 1..52 in order', () => {
    PALACE.forEach((l, i) => expect(l.index).toBe(i + 1));
  });

  it('assigns each locus to a real room', () => {
    for (const l of PALACE) {
      expect(l.roomId).toBeGreaterThanOrEqual(0);
      expect(l.roomId).toBeLessThan(ROOMS.length);
    }
  });

  it('groups loci by room with the right counts', () => {
    for (const room of ROOMS) {
      expect(lociInRoom(room.id)).toHaveLength(room.count);
    }
  });

  it('keeps loci within a room contiguous in walking order', () => {
    for (const room of ROOMS) {
      const indices = lociInRoom(room.id).map((l) => l.index);
      const sorted = [...indices].sort((a, b) => a - b);
      expect(indices).toEqual(sorted);
      // contiguous block
      expect(indices[indices.length - 1] - indices[0]).toBe(indices.length - 1);
    }
  });

  it('keeps pitch gentle (near the horizon)', () => {
    for (const l of PALACE) {
      expect(Math.abs(l.pitch)).toBeLessThan(0.5);
    }
  });

  it('looks up a locus by index', () => {
    expect(getLocus(1)?.name).toBe('Courtyard 1');
    expect(getLocus(52)).toBeDefined();
    expect(getLocus(99)).toBeUndefined();
  });
});
