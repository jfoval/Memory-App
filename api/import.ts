// Vercel serverless function: fetch a URL server-side and return readable text.
// This is the only server-side code in the app and needs no secret. Netlify
// users get an equivalent wrapper at netlify/functions/import.ts.
//
// Deployed at /api/import?url=<encoded url>. The readable-text extraction lives
// in src/logic/readability.ts so it can be unit-tested with the rest of the app.

import { extractReadableText } from '../src/logic/readability';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });

  if (!target) return json({ error: 'Missing url parameter' }, 400);
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return json({ error: 'Invalid URL' }, 400);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return json({ error: 'Only http(s) URLs are allowed' }, 400);
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: { 'user-agent': 'MemoryPalaceBot/1.0' },
      redirect: 'follow',
    });
    if (!res.ok) return json({ error: `Fetch failed (${res.status})` }, 502);
    const text = extractReadableText(await res.text());
    if (!text) return json({ error: 'No readable text found' }, 422);
    return json({ text: text.slice(0, 20000) });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}
