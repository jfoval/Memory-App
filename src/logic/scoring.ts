// Recall scoring. Lexical scoring always works; semantic scoring is layered on
// when an on-device embedding is available. Pure functions only.

// Named weight constants so scoring stays transparent and tunable.
export const LEXICAL_JACCARD_WEIGHT = 0.5;
export const LEXICAL_LEV_WEIGHT = 0.5;
export const SEMANTIC_LEXICAL_WEIGHT = 0.4;
export const SEMANTIC_COSINE_WEIGHT = 0.6;

export const BAND_CORRECT = 85;
export const BAND_PARTIAL = 60;

export type ScoreBand = 'correct' | 'partial' | 'incorrect';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'is', 'are',
  'was', 'were', 'be', 'by', 'with', 'as', 'that', 'this', 'it', 'from',
]);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(s: string, removeStopwords = false): string[] {
  const tokens = normalize(s).split(' ').filter(Boolean);
  return removeStopwords ? tokens.filter((t) => !STOPWORDS.has(t)) : tokens;
}

export function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size === 0 && sb.size === 0) return 1;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(na) * Math.sqrt(nb))));
}

export function band(score: number): ScoreBand {
  if (score >= BAND_CORRECT) return 'correct';
  if (score >= BAND_PARTIAL) return 'partial';
  return 'incorrect';
}

export interface ScoreOptions {
  conceptMode?: boolean; // strip stopwords before tokenizing
  answerEmbedding?: number[] | null;
  expectedEmbedding?: number[] | null;
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  lexical: number;
  semantic: number | null;
  usedSemantic: boolean;
  exact: boolean;
}

export function lexicalScore(expected: string, answer: string, conceptMode = false): number {
  const na = normalize(answer);
  const ne = normalize(expected);
  if (na === ne) return 100;
  const ta = tokenize(answer, conceptMode);
  const te = tokenize(expected, conceptMode);
  const j = jaccard(ta, te);
  const maxLen = Math.max(na.length, ne.length) || 1;
  const lev = 1 - levenshtein(na, ne) / maxLen;
  const raw = LEXICAL_JACCARD_WEIGHT * j + LEXICAL_LEV_WEIGHT * Math.max(0, lev);
  return Math.round(100 * raw);
}

export function scoreAnswer(expected: string, answer: string, opts: ScoreOptions = {}): ScoreResult {
  const conceptMode = opts.conceptMode ?? false;
  const exact = normalize(answer) === normalize(expected) && normalize(expected).length > 0;
  const lexical = lexicalScore(expected, answer, conceptMode);

  let semantic: number | null = null;
  let usedSemantic = false;
  let score = lexical;

  if (opts.answerEmbedding && opts.expectedEmbedding) {
    const cos = cosine(opts.answerEmbedding, opts.expectedEmbedding);
    semantic = Math.round(100 * cos);
    usedSemantic = true;
    score = Math.round(
      100 * (SEMANTIC_LEXICAL_WEIGHT * (lexical / 100) + SEMANTIC_COSINE_WEIGHT * cos),
    );
  }

  // An exact match should never be dragged below 100 by a weak embedding.
  if (exact) score = 100;

  return { score, band: band(score), lexical, semantic, usedSemantic, exact };
}

// Multiple-choice fallback: correct answer plus distractors from the same set.
export function buildChoices(
  correct: string,
  pool: string[],
  count = 4,
  rng: () => number = Math.random,
): string[] {
  const distractors = pool.filter((p) => normalize(p) !== normalize(correct));
  // Fisher-Yates shuffle of the distractor pool.
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }
  const choices = [correct, ...distractors.slice(0, Math.max(0, count - 1))];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
