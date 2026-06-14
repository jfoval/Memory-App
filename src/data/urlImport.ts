// Client for the URL-import serverless function. The function fetches a URL
// server-side and returns readable text; this is the only server-side code.

export async function importUrlText(url: string): Promise<string> {
  const res = await fetch(`/api/import?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Import failed (${res.status})`);
  }
  const data = (await res.json()) as { text?: string };
  if (!data.text) throw new Error('No readable text found at that URL.');
  return data.text;
}
