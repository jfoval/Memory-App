/// <reference lib="webworker" />
// Web Worker that runs a small MiniLM-class sentence-embedding model via
// Transformers.js over WASM. Embeddings are computed entirely on-device; no API.
// The model is loaded lazily on the first request and cached by the browser.

import { pipeline, env } from '@xenova/transformers';

// Allow remote model download (cached by the PWA service worker afterwards).
env.allowLocalModels = false;

type Extractor = (
  text: string,
  opts: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<Extractor> | null = null;

async function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
    ) as unknown as Promise<Extractor>;
  }
  return extractorPromise;
}

interface RequestMsg {
  id: number;
  text: string;
}

self.onmessage = async (e: MessageEvent<RequestMsg>) => {
  const { id, text } = e.data;
  try {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    (self as unknown as Worker).postMessage({ id, vector });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, error: String(err) });
  }
};
