import { describe, expect, it } from 'vitest';
import {
  scoreAnswer,
  lexicalScore,
  jaccard,
  levenshtein,
  cosine,
  band,
  buildChoices,
  tokenize,
} from './scoring';

describe('primitives', () => {
  it('jaccard of identical sets is 1', () => {
    expect(jaccard(['a', 'b'], ['a', 'b'])).toBe(1);
  });
  it('jaccard of disjoint sets is 0', () => {
    expect(jaccard(['a'], ['b'])).toBe(0);
  });
  it('levenshtein basic', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
  });
  it('cosine of identical vectors is 1', () => {
    expect(cosine([1, 0, 1], [1, 0, 1])).toBeCloseTo(1);
  });
  it('cosine of orthogonal vectors is 0', () => {
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });
});

describe('scoreAnswer', () => {
  it('gives 100 for an exact match', () => {
    const r = scoreAnswer('Hello World', 'hello world');
    expect(r.score).toBe(100);
    expect(r.exact).toBe(true);
    expect(r.band).toBe('correct');
  });

  it('gives a partial score for a near miss', () => {
    const r = scoreAnswer('the quick brown fox', 'the quick brown dog');
    expect(r.score).toBeGreaterThan(60);
    expect(r.score).toBeLessThan(100);
  });

  it('gives a low score for an unrelated answer', () => {
    const r = scoreAnswer('photosynthesis', 'banana');
    expect(r.band).toBe('incorrect');
  });

  it('falls back to lexical when no embeddings supplied', () => {
    const r = scoreAnswer('cat', 'cat');
    expect(r.usedSemantic).toBe(false);
    expect(r.semantic).toBeNull();
  });

  it('uses semantic blend when embeddings supplied', () => {
    const r = scoreAnswer('a feline animal', 'a cat', {
      answerEmbedding: [1, 0, 0],
      expectedEmbedding: [0.9, 0.1, 0],
    });
    expect(r.usedSemantic).toBe(true);
    expect(r.semantic).not.toBeNull();
  });

  it('concept mode ignores stopwords', () => {
    const withStop = lexicalScore('the cat is on the mat', 'cat mat', false);
    const concept = lexicalScore('the cat is on the mat', 'cat mat', true);
    expect(concept).toBeGreaterThan(withStop);
  });

  it('tokenize can strip stopwords', () => {
    expect(tokenize('the cat and a dog', true)).toEqual(['cat', 'dog']);
  });
});

describe('band', () => {
  it('maps thresholds', () => {
    expect(band(90)).toBe('correct');
    expect(band(70)).toBe('partial');
    expect(band(40)).toBe('incorrect');
  });
});

describe('buildChoices', () => {
  it('always includes the correct answer and is capped', () => {
    const choices = buildChoices('apple', ['banana', 'cherry', 'date', 'fig'], 4, () => 0);
    expect(choices).toContain('apple');
    expect(choices).toHaveLength(4);
  });
  it('excludes the correct answer from distractors', () => {
    const choices = buildChoices('apple', ['apple', 'banana'], 4, () => 0);
    expect(choices.filter((c) => c === 'apple')).toHaveLength(1);
  });
});
