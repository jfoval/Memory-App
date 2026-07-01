import { useRoutes } from '../store/routesStore';
import { CardBadge } from './CardBadge';

// The walk-mode card shown over a street viewer: the current stop's content with
// reveal/hide and prev/next. Shared by both the Mapillary and Google walkers.
export function WalkOverlay({ revealed }: { revealed: boolean }) {
  const route = useRoutes((s) => s.route)!;
  const walkIndex = useRoutes((s) => s.walkIndex);
  const walkTo = useRoutes((s) => s.walkTo);
  const setRevealed = useRoutes((s) => s.setRevealed);
  const stop = route.points[walkIndex];
  if (!stop) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 mx-auto max-w-lg px-3">
      <div className="card pointer-events-auto space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {stop.order}. {stop.label}
          </span>
          <span className="text-xs text-slate-400">
            {walkIndex + 1} / {route.points.length}
          </span>
        </div>
        <div className="min-h-[52px] rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
          {revealed ? (
            <div className="flex items-start gap-3">
              {stop.card != null && <CardBadge cardId={stop.card} size="md" />}
              <div className="min-w-0 flex-1">
                {stop.content ? (
                  <p>{stop.content}</p>
                ) : stop.card == null ? (
                  <span className="text-slate-400">Nothing placed here.</span>
                ) : null}
                {stop.association && (
                  <p className="mt-1 text-xs italic text-slate-500">💭 {stop.association}</p>
                )}
              </div>
            </div>
          ) : (
            <button className="btn-primary w-full" onClick={() => setRevealed(true)}>
              Reveal
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <button className="btn-ghost" disabled={walkIndex === 0} onClick={() => walkTo(walkIndex - 1)}>
            ‹ Prev
          </button>
          <button className="btn-ghost text-xs" onClick={() => setRevealed(!revealed)}>
            {revealed ? 'Hide' : 'Show'}
          </button>
          <button
            className="btn-primary"
            disabled={walkIndex >= route.points.length - 1}
            onClick={() => walkTo(walkIndex + 1)}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
