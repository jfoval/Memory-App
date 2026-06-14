// Netlify Functions wrapper around the same readable-text extraction used by the
// Vercel edge function. Deployed at /.netlify/functions/import; netlify.toml
// redirects /api/import to it so the client path is identical on both hosts.

import { extractReadableText } from '../../src/logic/readability';

interface NetlifyEvent {
  queryStringParameters?: Record<string, string | undefined>;
}

export async function handler(event: NetlifyEvent) {
  const target = event.queryStringParameters?.url;
  const reply = (statusCode: number, body: unknown) => ({
    statusCode,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });

  if (!target) return reply(400, { error: 'Missing url parameter' });
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return reply(400, { error: 'Invalid URL' });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return reply(400, { error: 'Only http(s) URLs are allowed' });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: { 'user-agent': 'MemoryPalaceBot/1.0' },
      redirect: 'follow',
    });
    if (!res.ok) return reply(502, { error: `Fetch failed (${res.status})` });
    const text = extractReadableText(await res.text());
    if (!text) return reply(422, { error: 'No readable text found' });
    return reply(200, { text: text.slice(0, 20000) });
  } catch (err) {
    return reply(500, { error: String(err) });
  }
}
