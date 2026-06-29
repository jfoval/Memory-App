// Deterministic chunking of pasted text into up to 52 items. No LLM — the user
// keeps full control and edits the result. Pure functions only.

export const MAX_ITEMS = 52; // cap per route/import

export interface ChunkResult {
  items: string[];
  truncated: boolean; // true when the input produced more than 52 items
  overflowCount: number; // how many items were left out (0 when not truncated)
  detectedAs: 'list' | 'prose' | 'empty';
}

const BULLET_RE = /^\s*([-*•]|\d+[.)])\s+/;
// Verse markers like "12 In the beginning" or "1:3" at line start.
const VERSE_RE = /^\s*\d+(?::\d+)?\s+\S/;
// Common abbreviations that should not end a sentence.
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'eg', 'ie', 'no', 'vol',
]);

export function normalize(input: string): string {
  return input.replace(/\r\n?/g, '\n').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').trim();
}

function nonEmptyLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function looksLikeList(lines: string[]): boolean {
  if (lines.length === 0) return false;
  const markerCount = lines.filter((l) => BULLET_RE.test(l) || VERSE_RE.test(l)).length;
  return markerCount >= lines.length / 2;
}

function stripMarker(line: string): string {
  return line.replace(BULLET_RE, '').trim();
}

// Split prose into sentences on . ! ? with an abbreviation guard, then merge any
// fragment under 4 words into the previous sentence.
export function splitProse(text: string): string[] {
  const raw: string[] = [];
  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    buf += ch;
    if (ch === '.' || ch === '!' || ch === '?') {
      const next = text[i + 1];
      const lastWord = buf
        .slice(0, -1)
        .split(/\s+/)
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z]/g, '');
      const isAbbrev = ch === '.' && lastWord && ABBREVIATIONS.has(lastWord);
      const boundary = next === undefined || /\s/.test(next);
      if (boundary && !isAbbrev) {
        const trimmed = buf.trim();
        if (trimmed) raw.push(trimmed);
        buf = '';
      }
    }
  }
  if (buf.trim()) raw.push(buf.trim());

  // Merge short fragments into the previous sentence.
  const merged: string[] = [];
  for (const s of raw) {
    const words = s.split(/\s+/).filter(Boolean).length;
    if (words < 4 && merged.length > 0) {
      merged[merged.length - 1] += ' ' + s;
    } else {
      merged.push(s);
    }
  }
  return merged;
}

export function chunk(input: string): ChunkResult {
  const text = normalize(input);
  if (!text) {
    return { items: [], truncated: false, overflowCount: 0, detectedAs: 'empty' };
  }

  const lines = nonEmptyLines(text);
  let items: string[];
  let detectedAs: 'list' | 'prose';

  if (looksLikeList(lines)) {
    detectedAs = 'list';
    items = lines.map(stripMarker).filter((l) => l.length > 0);
  } else {
    detectedAs = 'prose';
    items = splitProse(text).filter((l) => l.length > 0);
  }

  if (items.length > MAX_ITEMS) {
    const overflow = items.length - MAX_ITEMS;
    return {
      items: items.slice(0, MAX_ITEMS),
      truncated: true,
      overflowCount: overflow,
      detectedAs,
    };
  }
  return { items, truncated: false, overflowCount: 0, detectedAs };
}

// Manual editing helpers (pure) used by the editor UI.
export function splitItem(items: string[], index: number, at: number): string[] {
  if (index < 0 || index >= items.length) return items;
  const item = items[index];
  const left = item.slice(0, at).trim();
  const right = item.slice(at).trim();
  if (!left || !right) return items;
  return [...items.slice(0, index), left, right, ...items.slice(index + 1)];
}

export function mergeItem(items: string[], index: number): string[] {
  if (index <= 0 || index >= items.length) return items;
  const merged = `${items[index - 1]} ${items[index]}`.trim();
  return [...items.slice(0, index - 1), merged, ...items.slice(index + 1)];
}

export function moveItem(items: string[], from: number, to: number): string[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return items;
  const copy = [...items];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}
