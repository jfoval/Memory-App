import { describe, expect, it } from 'vitest';
import { review, scoreToQuality, initialSrs, isDue, DAY_MS, MIN_EASE } from './scheduling';

describe('scoreToQuality', () => {
  it('maps score bands to quality', () => {
    expect(scoreToQuality(90)).toBe(5);
    expect(scoreToQuality(75)).toBe(4);
    expect(scoreToQuality(65)).toBe(3);
    expect(scoreToQuality(50)).toBe(2);
    expect(scoreToQuality(30)).toBe(1);
    expect(scoreToQuality(10)).toBe(0);
  });
});

describe('SM-2 review', () => {
  const now = new Date('2026-06-14T00:00:00Z');

  it('first successful review schedules in 1 day', () => {
    const r = review(initialSrs, 90, now);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(1);
  });

  it('second successful review schedules in 6 days', () => {
    let s = review(initialSrs, 90, now);
    s = review(s, 90, now);
    expect(s.repetitions).toBe(2);
    expect(s.intervalDays).toBe(6);
  });

  it('third successful review multiplies by ease factor', () => {
    let s = review(initialSrs, 90, now);
    s = review(s, 90, now);
    // The interval uses the ease factor as it stood *before* this review (2.7),
    // then the ease factor is bumped to 2.8.
    const third = review(s, 90, now);
    expect(third.intervalDays).toBe(Math.round(6 * s.easeFactor));
    expect(third.intervalDays).toBe(16);
    expect(third.repetitions).toBe(3);
  });

  it('a failure resets repetitions and schedules tomorrow', () => {
    let s = review(initialSrs, 90, now);
    s = review(s, 90, now);
    const failed = review(s, 30, now);
    expect(failed.repetitions).toBe(0);
    expect(failed.intervalDays).toBe(1);
  });

  it('ease factor never drops below the floor', () => {
    let s = initialSrs;
    for (let i = 0; i < 10; i++) s = review(s, 60, now);
    expect(s.easeFactor).toBeGreaterThanOrEqual(MIN_EASE);
  });

  it('schedules the correct future timestamp', () => {
    const r = review(initialSrs, 90, now);
    const expected = new Date(now.getTime() + 1 * DAY_MS).toISOString();
    expect(r.scheduledFor).toBe(expected);
  });
});

describe('isDue', () => {
  it('treats never-reviewed as due', () => {
    expect(isDue(null)).toBe(true);
  });
  it('past schedule is due', () => {
    expect(isDue('2020-01-01T00:00:00Z')).toBe(true);
  });
  it('future schedule is not due', () => {
    expect(isDue('2999-01-01T00:00:00Z')).toBe(false);
  });
});
