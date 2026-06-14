import { useState } from 'react';
import { chunk, splitItem, mergeItem, moveItem, MAX_ITEMS } from '../../logic/chunking';
import { importUrlText } from '../../data/urlImport';

interface Props {
  startLocus: number; // where placement begins (1..52)
  onPlace: (items: string[], startLocus: number) => void;
}

// Paste text or import a URL -> deterministic chunking -> an editable, ordered
// preview (edit / split / merge / reorder) -> place onto loci in order.
export function ChunkImportPanel({ startLocus, onPlace }: Props) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [truncated, setTruncated] = useState(0);
  const [detected, setDetected] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runChunk = (src: string) => {
    const r = chunk(src);
    setItems(r.items);
    setTruncated(r.overflowCount);
    setDetected(r.detectedAs);
  };

  const doUrl = async () => {
    setError(null);
    setImporting(true);
    try {
      const t = await importUrlText(url);
      setText(t);
      runChunk(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const capacity = MAX_ITEMS - (startLocus - 1);

  return (
    <div className="space-y-3">
      <textarea
        className="input min-h-[120px] font-mono text-xs"
        placeholder="Paste text or a list here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={() => runChunk(text)}>
          Chunk text
        </button>
        <input
          className="input flex-1"
          placeholder="…or import readable text from a URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="btn-ghost" onClick={doUrl} disabled={!url || importing}>
          {importing ? 'Importing…' : 'Import URL'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {items.length} items · detected as {detected}
              {truncated > 0 && ` · ${truncated} trimmed (over ${MAX_ITEMS})`}
            </span>
            {items.length > capacity && (
              <span className="text-amber-600">
                Only {capacity} fit from locus {startLocus}; the rest are dropped.
              </span>
            )}
          </div>

          <ol className="space-y-1">
            {items.map((it, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="w-6 text-right text-xs text-slate-400">{startLocus + i}</span>
                <input
                  className="input flex-1 py-1 text-sm"
                  value={it}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[i] = e.target.value;
                    setItems(copy);
                  }}
                />
                <button
                  className="btn-ghost px-2 py-1 text-xs"
                  title="Split in half"
                  onClick={() => setItems(splitItem(items, i, Math.floor(it.length / 2)))}
                >
                  ✂
                </button>
                <button
                  className="btn-ghost px-2 py-1 text-xs"
                  title="Merge up"
                  disabled={i === 0}
                  onClick={() => setItems(mergeItem(items, i))}
                >
                  ⤴
                </button>
                <button
                  className="btn-ghost px-2 py-1 text-xs"
                  title="Move up"
                  disabled={i === 0}
                  onClick={() => setItems(moveItem(items, i, i - 1))}
                >
                  ↑
                </button>
                <button
                  className="btn-ghost px-2 py-1 text-xs"
                  title="Remove"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>

          <button
            className="btn-primary w-full"
            onClick={() => onPlace(items.slice(0, capacity), startLocus)}
          >
            Place {Math.min(items.length, capacity)} items from locus {startLocus}
          </button>
        </div>
      )}
    </div>
  );
}
