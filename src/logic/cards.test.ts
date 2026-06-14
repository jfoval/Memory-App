import { describe, expect, it } from 'vitest';
import { cardFromId, shuffledDeck, scoreDeck, mulberry32 } from './cards';

describe('cardFromId', () => {
  it('maps ids to suit and rank', () => {
    expect(cardFromId(0)).toMatchObject({ suit: 'spades', rank: 'A', label: 'A♠' });
    expect(cardFromId(12)).toMatchObject({ suit: 'spades', rank: 'K' });
    expect(cardFromId(13)).toMatchObject({ suit: 'hearts', rank: 'A' });
    expect(cardFromId(51)).toMatchObject({ suit: 'clubs', rank: 'K', label: 'K♣' });
  });
});

describe('shuffledDeck', () => {
  it('is reproducible for a seed', () => {
    expect(shuffledDeck(12345)).toEqual(shuffledDeck(12345));
  });

  it('differs across seeds', () => {
    expect(shuffledDeck(1)).not.toEqual(shuffledDeck(2));
  });

  it('is a permutation of 0..51', () => {
    const deck = shuffledDeck(999);
    expect(deck).toHaveLength(52);
    expect([...deck].sort((a, b) => a - b)).toEqual(Array.from({ length: 52 }, (_, i) => i));
  });

  it('supports partial decks', () => {
    expect(shuffledDeck(7, 13)).toHaveLength(13);
    expect(shuffledDeck(7, 26)).toHaveLength(26);
  });
});

describe('mulberry32', () => {
  it('produces values in [0,1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('scoreDeck', () => {
  it('scores a perfect recall', () => {
    const deck = [3, 1, 2, 0];
    const r = scoreDeck(deck, [3, 1, 2, 0]);
    expect(r.score).toBe(100);
    expect(r.correctCount).toBe(4);
    expect(r.wrongPositions).toEqual([]);
  });

  it('flags wrong and missing positions', () => {
    const deck = [3, 1, 2, 0];
    const r = scoreDeck(deck, [3, 9, null, 0]);
    expect(r.correctCount).toBe(2);
    expect(r.wrongPositions).toEqual([1, 2]);
    expect(r.score).toBe(50);
  });
});
