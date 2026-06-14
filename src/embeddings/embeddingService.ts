// Clean interface over the embedding worker. Always safe to call: if the model
// is unavailable (offline first load, unsupported device, opt-out) it resolves
// to null and scoring falls back to lexical-only.

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (v: number[] | null) => void>();
let enabled = false;
let failed = false;

export function isEmbeddingEnabled(): boolean {
  return enabled && !failed;
}

export function enableEmbeddings(): void {
  if (worker || failed) return;
  try {
    worker = new Worker(new URL('./embeddingWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; vector?: number[]; error?: string }>) => {
      const resolve = pending.get(e.data.id);
      if (!resolve) return;
      pending.delete(e.data.id);
      resolve(e.data.vector ?? null);
    };
    worker.onerror = () => {
      failed = true;
    };
    enabled = true;
  } catch {
    failed = true;
  }
}

export function disableEmbeddings(): void {
  enabled = false;
}

// Returns an embedding, or null if embeddings are disabled/unavailable. Times
// out gracefully so the UI never blocks on the model.
export function embed(text: string, timeoutMs = 15000): Promise<number[] | null> {
  if (!enabled || failed || !worker || !text.trim()) return Promise.resolve(null);
  const id = nextId++;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve(null);
    }, timeoutMs);
    pending.set(id, (v) => {
      clearTimeout(timer);
      resolve(v);
    });
    worker!.postMessage({ id, text });
  });
}
