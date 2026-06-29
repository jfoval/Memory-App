import { useRoutes } from '../store/routesStore';

// During a map walk, the map flies stop-to-stop. This panel shows the current
// stop's content (hide/reveal for self-testing) and a button to walk this spot
// in the in-app Mapillary Street View.
export function WalkPanel() {
  const route = useRoutes((s) => s.route);
  const walkIndex = useRoutes((s) => s.walkIndex);
  const walkTo = useRoutes((s) => s.walkTo);
  const revealed = useRoutes((s) => s.revealed);
  const setRevealed = useRoutes((s) => s.setRevealed);
  const setEntry = useRoutes((s) => s.setEntry);

  if (!route || route.points.length === 0) return null;
  const point = route.points[walkIndex];
  if (!point) return null;

  return (
    <div className="absolute inset-x-0 bottom-3 z-30 mx-auto max-w-lg px-3">
      <div className="card pointer-events-auto space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {point.order}. {point.label}
          </span>
          <span className="text-xs text-slate-400">
            {walkIndex + 1} / {route.points.length}
          </span>
        </div>

        <button
          className="btn-ghost w-full text-sm"
          onClick={() => setEntry({ lat: point.lat, lng: point.lng, imageId: point.imageId })}
        >
          🚶 Walk this spot in Street View
        </button>

        <div className="min-h-[60px] rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
          {revealed ? (
            <>
              <p>{point.content || <span className="text-slate-400">No content placed here.</span>}</p>
              {point.association && (
                <p className="mt-1 text-xs italic text-slate-500">💭 {point.association}</p>
              )}
            </>
          ) : (
            <button className="btn-primary w-full" onClick={() => setRevealed(true)}>
              Reveal
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            className="btn-ghost"
            disabled={walkIndex === 0}
            onClick={() => walkTo(walkIndex - 1)}
          >
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
