import { useEffect, useState } from 'react';
import { useContentSets, useItems } from '../../data/hooks';
import { useWorld, type PlacedItem } from '../../store/worldStore';
import { cardFromId, shuffledDeck, makeSeed } from '../../logic/cards';

type Selection = { kind: 'none' } | { kind: 'set'; id: string } | { kind: 'deck'; size: number };

// Lets you load a content set OR a card deck "into the world" so each item/card
// appears at its locus as you walk — learning the content WITH the place.
export function WorldLoader() {
  const { data: sets = [] } = useContentSets();
  const setLayer = useWorld((s) => s.setLayer);
  const clearLayer = useWorld((s) => s.clearLayer);
  const layerName = useWorld((s) => s.layerName);
  const hidden = useWorld((s) => s.hidden);
  const setHidden = useWorld((s) => s.setHidden);

  const [sel, setSel] = useState<Selection>({ kind: 'none' });
  const [seed, setSeed] = useState(() => makeSeed());
  const { data: items = [] } = useItems(sel.kind === 'set' ? sel.id : null);

  // Build the placed map whenever the selection (or its data) changes.
  useEffect(() => {
    if (sel.kind === 'none') {
      clearLayer();
      return;
    }
    if (sel.kind === 'set') {
      const set = sets.find((s) => s.id === sel.id);
      const placed: Record<number, PlacedItem> = {};
      for (const it of items) {
        placed[it.locusIndex] = { title: it.content, subtitle: it.association ?? undefined };
      }
      setLayer(set?.name ?? 'Set', placed);
    } else {
      const deck = shuffledDeck(seed, sel.size);
      const placed: Record<number, PlacedItem> = {};
      deck.forEach((id, i) => {
        const card = cardFromId(id);
        const red = card.suit === 'hearts' || card.suit === 'diamonds';
        placed[i + 1] = { title: card.label, accent: red ? '#f87171' : '#93c5fd' };
      });
      setLayer(`Deck of ${sel.size}`, placed);
    }
  }, [sel, items, seed, sets, setLayer, clearLayer]);

  return (
    <div className="card pointer-events-auto space-y-2 !p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Load into world:</span>
        <select
          className="input flex-1 py-1 text-sm"
          value={sel.kind === 'set' ? sel.id : sel.kind === 'deck' ? `deck:${sel.size}` : 'none'}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'none') setSel({ kind: 'none' });
            else if (v.startsWith('deck:')) {
              setSeed(makeSeed());
              setSel({ kind: 'deck', size: Number(v.slice(5)) });
            } else setSel({ kind: 'set', id: v });
          }}
        >
          <option value="none">Nothing (just explore)</option>
          <optgroup label="Content sets">
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Card deck">
            <option value="deck:13">Card deck — 13</option>
            <option value="deck:26">Card deck — 26</option>
            <option value="deck:52">Card deck — 52</option>
          </optgroup>
        </select>
      </div>

      {layerName && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Showing: {layerName}</span>
          <button className="btn-ghost ml-auto px-2 py-1 text-xs" onClick={() => setHidden(!hidden)}>
            {hidden ? 'Reveal' : 'Hide & test'}
          </button>
          {sel.kind === 'deck' && (
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setSeed(makeSeed())}>
              Reshuffle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
