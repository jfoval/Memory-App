// Card-deck mode logic. A deck is 52 cards (0..51). A seed gives a reproducible
// Fisher-Yates shuffle, then shuffled position i maps onto palace location i.

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

export type Suit = (typeof SUITS)[number];

export interface Card {
  id: number; // 0..51
  suit: Suit;
  suitSymbol: string;
  rank: string;
  label: string; // e.g. "Q♥"
}

export function cardFromId(id: number): Card {
  const suitIndex = Math.floor(id / 13);
  const rankIndex = id % 13;
  return {
    id,
    suit: SUITS[suitIndex],
    suitSymbol: SUIT_SYMBOLS[suitIndex],
    rank: RANKS[rankIndex],
    label: `${RANKS[rankIndex]}${SUIT_SYMBOLS[suitIndex]}`,
  };
}

// Mulberry32 — a small, fast, deterministic PRNG so a seed reproduces a deck.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffledDeck(seed: number, size = 52): number[] {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  const rng = mulberry32(seed);
  // Fisher-Yates.
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, Math.min(size, 52));
}

export function makeSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

export interface CardScore {
  score: number; // 0..100 percentage of positions correct
  correctCount: number;
  total: number;
  wrongPositions: number[]; // indices the user got wrong
}

// Score recalled deck order against the true order; exact card id per position.
export function scoreDeck(deckOrder: number[], recalled: (number | null)[]): CardScore {
  const total = deckOrder.length;
  let correctCount = 0;
  const wrongPositions: number[] = [];
  for (let i = 0; i < total; i++) {
    if (recalled[i] !== null && recalled[i] === deckOrder[i]) correctCount++;
    else wrongPositions.push(i);
  }
  return {
    score: total === 0 ? 0 : Math.round((100 * correctCount) / total),
    correctCount,
    total,
    wrongPositions,
  };
}
