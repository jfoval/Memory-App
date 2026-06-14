import { useMemo } from 'react';
import { useAllItems, useReviews, useCardResults, useContentSets } from '../../data/hooks';

// Recall accuracy over time, retention per content set, and card-deck bests.
export function StatsScreen() {
  const { data: items = [] } = useAllItems();
  const { data: reviews = [] } = useReviews();
  const { data: sets = [] } = useContentSets();
  const { data: cards = [] } = useCardResults();

  const recent = useMemo(
    () =>
      [...reviews]
        .filter((r) => r.lastReviewed)
        .sort((a, b) => (a.lastReviewed! < b.lastReviewed! ? -1 : 1))
        .slice(-20),
    [reviews],
  );
  const avgScore = recent.length
    ? Math.round(recent.reduce((a, r) => a + (r.lastScore ?? 0), 0) / recent.length)
    : 0;

  const perSet = useMemo(() => {
    const reviewByItem = new Map(reviews.map((r) => [r.itemId, r]));
    return sets.map((s) => {
      const setItems = items.filter((it) => it.contentSetId === s.id);
      const scored = setItems
        .map((it) => reviewByItem.get(it.id)?.lastScore)
        .filter((v): v is number => typeof v === 'number');
      const retention = scored.length
        ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
        : null;
      return { name: s.name, count: setItems.length, retention };
    });
  }, [sets, items, reviews]);

  const cardBests = useMemo(() => {
    return [13, 26, 52].map((size) => {
      const plays = cards.filter((c) => c.deckOrder.length === size);
      const bestScore = plays.reduce((m, c) => Math.max(m, c.score), 0);
      const perfect = plays.filter((c) => c.score >= 100);
      const bestTime = perfect.reduce((m, c) => (m === 0 ? c.timeMs : Math.min(m, c.timeMs)), 0);
      return { size, plays: plays.length, bestScore, bestTime };
    });
  }, [cards]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-xl font-bold">Stats</h2>

        <div className="card">
          <h3 className="font-semibold">Recall accuracy (last {recent.length})</h3>
          <p className="text-3xl font-bold text-blue-600">{avgScore}%</p>
          {recent.length > 0 ? (
            <div className="mt-3 flex h-20 items-end gap-1">
              {recent.map((r, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-blue-500"
                  style={{ height: `${Math.max(4, r.lastScore ?? 0)}%` }}
                  title={`${r.lastScore}%`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Test some items to see your trend.</p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-2 font-semibold">Retention per set</h3>
          {perSet.length === 0 && <p className="text-sm text-slate-400">No sets yet.</p>}
          <div className="space-y-2">
            {perSet.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="text-slate-400">
                    {s.retention !== null ? `${s.retention}%` : 'untested'} · {s.count} items
                  </span>
                </div>
                <div className="mt-1 h-2 rounded bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-2 rounded bg-green-500"
                    style={{ width: `${s.retention ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2 font-semibold">Card deck bests</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            {cardBests.map((c) => (
              <div key={c.size} className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <div className="font-medium">{c.size} cards</div>
                <div className="text-blue-600">{c.bestScore}%</div>
                <div className="text-xs text-slate-400">
                  {c.bestTime ? `${(c.bestTime / 1000).toFixed(1)}s` : '—'}
                </div>
                <div className="text-xs text-slate-400">{c.plays} plays</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
