import { describe, expect, it } from 'vitest';
import { extractReadableText } from './readability';

describe('extractReadableText', () => {
  it('strips scripts and styles', () => {
    const html =
      '<html><head><style>p{color:red}</style></head><body><script>alert(1)</script>' +
      '<p>First paragraph here.</p><p>Second paragraph here.</p><p>Third one too.</p></body></html>';
    const text = extractReadableText(html);
    expect(text).not.toContain('alert');
    expect(text).not.toContain('color');
    expect(text).toContain('First paragraph here.');
  });

  it('joins paragraphs and headings with newlines', () => {
    const html = '<h1>Title</h1><p>Body one.</p><li>Item two.</li><p>Body three.</p>';
    const text = extractReadableText(html);
    expect(text.split('\n').length).toBeGreaterThanOrEqual(3);
  });

  it('decodes common entities', () => {
    const html = '<p>Tom &amp; Jerry</p><p>1 &lt; 2</p><p>third para to pass threshold</p>';
    expect(extractReadableText(html)).toContain('Tom & Jerry');
  });

  it('falls back to stripped text for markup-light input', () => {
    expect(extractReadableText('<div>just some text</div>')).toBe('just some text');
  });
});
