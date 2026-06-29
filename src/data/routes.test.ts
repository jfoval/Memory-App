import { describe, expect, it } from 'vitest';
import { addPoint, movePoint, removePoint, renumber, updatePoint, type Route } from './routes';

const base: Route = {
  id: 'r1',
  userId: 'u1',
  name: 'Test',
  createdAt: '',
  updatedAt: '',
  points: [],
};

describe('route point editing', () => {
  it('adds points and numbers them in order', () => {
    let r = addPoint(base, 10, 20);
    r = addPoint(r, 11, 21);
    expect(r.points).toHaveLength(2);
    expect(r.points.map((p) => p.order)).toEqual([1, 2]);
    expect(r.points[0]).toMatchObject({ lat: 10, lng: 20 });
  });

  it('updates a point', () => {
    const r = addPoint(base, 1, 2);
    const id = r.points[0].id;
    const updated = updatePoint(r, id, { content: 'remember this' });
    expect(updated.points[0].content).toBe('remember this');
  });

  it('removes a point and renumbers', () => {
    let r = addPoint(base, 1, 1);
    r = addPoint(r, 2, 2);
    r = addPoint(r, 3, 3);
    const midId = r.points[1].id;
    r = removePoint(r, midId);
    expect(r.points).toHaveLength(2);
    expect(r.points.map((p) => p.order)).toEqual([1, 2]);
  });

  it('moves a point up/down and renumbers', () => {
    let r = addPoint(base, 1, 1);
    r = addPoint(r, 2, 2);
    const firstId = r.points[0].id;
    r = movePoint(r, firstId, 1);
    expect(r.points[1].id).toBe(firstId);
    expect(r.points.map((p) => p.order)).toEqual([1, 2]);
  });

  it('renumber is idempotent on order', () => {
    const r = addPoint(addPoint(base, 1, 1), 2, 2);
    expect(renumber(r.points).map((p) => p.order)).toEqual([1, 2]);
  });
});
