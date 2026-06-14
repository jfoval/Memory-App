// SM-2 spaced repetition. Pure functions; the store persists the result.

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
export const DAY_MS = 24 * 60 * 60 * 1000;

export interface SrsState {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
}

export interface SrsUpdate extends SrsState {
  scheduledFor: string; // ISO timestamp
}

export const initialSrs: SrsState = {
  repetitions: 0,
  intervalDays: 0,
  easeFactor: DEFAULT_EASE,
};

// Map a 0..100 recall score to an SM-2 quality grade 0..5.
export function scoreToQuality(score: number): number {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

export function review(state: SrsState, score: number, now: Date = new Date()): SrsUpdate {
  const q = scoreToQuality(score);
  let { repetitions, intervalDays, easeFactor } = state;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;

  const scheduledFor = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  return { repetitions, intervalDays, easeFactor, scheduledFor };
}

export function isDue(scheduledFor: string | null | undefined, now: Date = new Date()): boolean {
  if (!scheduledFor) return true; // never reviewed -> due
  return new Date(scheduledFor).getTime() <= now.getTime();
}
