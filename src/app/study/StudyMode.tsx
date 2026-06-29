import { useMemo, useState } from 'react';
import { useItems } from '../../data/hooks';
import { getLocus } from '../../palace/palaceData';
import { roomById } from '../../palace/rooms';

interface Props {
  setId: string;
  onExit: () => void;
}

// Walk the palace location by location, revealing or hiding each item. The
// progressive mode hides everything and reveals one at a time for active recall.
export function StudyMode({ setId, onExit }: Props) {
  const { data: items = [] } = useItems(setId);
  const placed = useMemo(() => [...items].sort((a, b) => a.locusIndex - b.locusIndex), [items]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(true);
  const [progressive, setProgressive] = useState(false);

  if (placed.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        Nothing to study yet.
        <button className="btn-ghost ml-2" onClick={onExit}>
          Back
        </button>
      </div>
    );
  }

  const item = placed[i];
  const locus = getLocus(item.locusIndex)!;
  const show = progressive ? revealed : true;

  const go = (delta: number) => {
    setI((prev) => Math.max(0, Math.min(placed.length - 1, prev + delta)));
    setRevealed(!progressive);
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="flex items-center justify-between">
          <button className="btn-ghost px-2 py-1 text-sm" onClick={onExit}>
            ‹ Done
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={progressive}
              onChange={(e) => {
                setProgressive(e.target.checked);
                setRevealed(!e.target.checked);
              }}
            />
            Progressive recall
          </label>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div
            className="mb-2 rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: roomById(locus.roomId).accent }}
          >
            {roomById(locus.roomId).name}
          </div>
          <h2 className="text-2xl font-bold">
            {locus.index}. {locus.name}
          </h2>
          <p className="text-sm text-slate-500">{locus.landmark}</p>

          <div className="card mt-6 min-h-[120px] w-full">
            {show ? (
              <>
                <p className="text-lg">{item.content}</p>
                {item.association && (
                  <p className="mt-2 text-sm italic text-slate-500">💭 {item.association}</p>
                )}
              </>
            ) : (
              <button className="btn-primary mt-6" onClick={() => setRevealed(true)}>
                Reveal
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button className="btn-ghost" onClick={() => go(-1)} disabled={i === 0}>
            ‹ Prev
          </button>
          <span className="text-sm text-slate-400">
            {i + 1} / {placed.length}
          </span>
          <button className="btn-ghost" onClick={() => go(1)} disabled={i === placed.length - 1}>
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
