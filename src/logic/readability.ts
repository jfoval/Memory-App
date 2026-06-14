// Minimal readable-text extraction shared by the URL-import serverless function
// and unit tests. Strips scripts/styles/markup, prefers paragraph text, and
// collapses whitespace — good enough to feed the deterministic chunker. Pure.

export function extractReadableText(html: string): string {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const paragraphs = [...s.matchAll(/<(?:p|h[1-6]|li)[^>]*>([\s\S]*?)<\/(?:p|h[1-6]|li)>/gi)]
    .map((m) => stripTags(m[1]).trim())
    .filter((t) => t.length > 0);

  if (paragraphs.length >= 3) return decodeEntities(paragraphs.join('\n'));

  s = stripTags(s);
  return decodeEntities(s.replace(/\s+/g, ' ').trim());
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
