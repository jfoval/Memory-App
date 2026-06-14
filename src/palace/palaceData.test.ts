import { describe, expect, it } from 'vitest';
import { PALACE, getLocus, LOCI_COUNT } from './palaceData';

describe('shared palace', () => {
  it('has exactly 52 loci', () => {
    expect(LOCI_COUNT).toBe(52);
  });

  it('is numbered 1..52 in order', () => {
    PALACE.forEach((l, i) => expect(l.index).toBe(i + 1));
  });

  it('has 4 zones of 13', () => {
    for (const zone of [1, 2, 3, 4] as const) {
      expect(PALACE.filter((l) => l.zone === zone)).toHaveLength(13);
    }
  });

  it('assigns zones in route order (13 each)', () => {
    expect(PALACE[0].zone).toBe(1);
    expect(PALACE[12].zone).toBe(1);
    expect(PALACE[13].zone).toBe(2);
    expect(PALACE[26].zone).toBe(3);
    expect(PALACE[51].zone).toBe(4);
  });

  it('has unique, non-empty names', () => {
    const names = new Set(PALACE.map((l) => l.name));
    expect(names.size).toBe(52);
    expect([...names].every((n) => n.length > 0)).toBe(true);
  });

  it('never repeats a colour between immediate neighbours', () => {
    for (let i = 1; i < PALACE.length; i++) {
      expect(PALACE[i].color).not.toBe(PALACE[i - 1].color);
    }
  });

  it('spaces every locus at least 6m from the previous one', () => {
    for (let i = 1; i < PALACE.length; i++) {
      const a = PALACE[i].position;
      const b = PALACE[i - 1].position;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      expect(d).toBeGreaterThanOrEqual(6);
    }
  });

  it('looks up a locus by index', () => {
    expect(getLocus(1)?.name).toBe('Street Lamp');
    expect(getLocus(52)?.name).toBe('Solar Array');
    expect(getLocus(99)).toBeUndefined();
  });
});
