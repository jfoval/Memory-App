import { describe, expect, it } from 'vitest';
import { chunk, splitItem, mergeItem, moveItem, MAX_ITEMS } from './chunking';

describe('chunk', () => {
  it('returns empty for blank input', () => {
    expect(chunk('   ').detectedAs).toBe('empty');
    expect(chunk('').items).toEqual([]);
  });

  it('detects a bulleted list, one item per line', () => {
    const r = chunk('- milk\n- eggs\n* bread\n1. butter');
    expect(r.detectedAs).toBe('list');
    expect(r.items).toEqual(['milk', 'eggs', 'bread', 'butter']);
  });

  it('detects numbered verse markers as list', () => {
    const r = chunk('1 In the beginning\n2 And the earth\n3 And God said');
    expect(r.detectedAs).toBe('list');
    expect(r.items).toHaveLength(3);
  });

  it('splits prose on sentence boundaries', () => {
    const r = chunk('The cat sat down. The dog ran away! Did the bird fly?');
    expect(r.detectedAs).toBe('prose');
    expect(r.items).toHaveLength(3);
  });

  it('does not split on common abbreviations', () => {
    const r = chunk('Dr. Smith arrived at the lab today. He was very late.');
    expect(r.items).toHaveLength(2);
  });

  it('merges fragments under four words into the previous sentence', () => {
    const r = chunk('The experiment ran for many hours. Yes. It finally worked out well.');
    // "Yes." merges into the first sentence.
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toContain('Yes');
  });

  it('caps at 52 items and reports overflow', () => {
    const many = Array.from({ length: 60 }, (_, i) => `- item ${i}`).join('\n');
    const r = chunk(many);
    expect(r.items).toHaveLength(MAX_ITEMS);
    expect(r.truncated).toBe(true);
    expect(r.overflowCount).toBe(8);
  });
});

describe('manual editing helpers', () => {
  it('splits an item at an offset', () => {
    expect(splitItem(['hello world'], 0, 5)).toEqual(['hello', 'world']);
  });
  it('does not split when one side is empty', () => {
    expect(splitItem(['hello'], 0, 0)).toEqual(['hello']);
  });
  it('merges an item into the previous one', () => {
    expect(mergeItem(['a', 'b', 'c'], 1)).toEqual(['a b', 'c']);
  });
  it('moves an item', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });
});
