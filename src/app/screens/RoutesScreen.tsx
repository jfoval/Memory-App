import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from '../../auth/authStore';
import { useRoutes } from '../../store/routesStore';
import { createRoute, deleteRoute, listRoutes, type Route } from '../../data/routes';
import { PointPanel } from '../../map/PointPanel';
import { WalkPanel } from '../../map/WalkPanel';
import { TestOverlay } from '../../map/TestOverlay';
import { streetViewProvider } from '../../map/streetview';

// Heavy map/street libraries load only when a route is opened.
const RouteMap = lazy(() => import('../../map/RouteMap').then((m) => ({ default: m.RouteMap })));
const MapillaryWalk = lazy(() =>
  import('../../map/MapillaryWalk').then((m) => ({ default: m.MapillaryWalk })),
);
const GoogleWalk = lazy(() => import('../../map/GoogleWalk').then((m) => ({ default: m.GoogleWalk })));

// Google (universal 360°) is preferred when its key is set; Mapillary is the
// free fallback.
const StreetWalk = streetViewProvider === 'google' ? GoogleWalk : MapillaryWalk;

export function RoutesScreen() {
  const uid = useAuth((s) => s.user?.id);
  const { route, mode, view, open, close, setMode, setView, rename, dealCards } = useRoutes();
  const [routes, setRoutesList] = useState<Route[]>([]);
  const [name, setName] = useState('');

  const refresh = () => uid && setRoutesList(listRoutes(uid));
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, route]);

  // --- Active route: map editor / walk / test ---
  if (route) {
    const dealNow = () => {
      if (route.points.length === 0) return;
      const already = route.points.some((p) => p.card != null);
      if (already && !confirm('Re-deal new random cards to every stop? This replaces the current cards.'))
        return;
      dealCards();
      setMode('edit');
    };
    return (
      <div className="flex h-full w-full flex-col">
        {/* Header row (its own band, so nothing overlaps the map). */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-900">
          <button
            className="btn-ghost shrink-0 px-2 py-1 text-xs"
            onClick={() => {
              close();
              refresh();
            }}
          >
            ‹
          </button>
          <input
            className="input min-w-0 flex-1 py-1 text-sm"
            value={route.name}
            onChange={(e) => rename(e.target.value)}
          />
          {mode === 'edit' && (
            <button
              className="btn-ghost shrink-0 px-2 py-1 text-xs"
              onClick={dealNow}
              disabled={route.points.length === 0}
              title="Deal a random playing card to each stop (Practice mode)"
            >
              🃏 Deal
            </button>
          )}
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-700">
            <button
              className={`px-2.5 py-1.5 ${view === 'map' ? 'bg-slate-700 text-white' : 'bg-transparent'}`}
              onClick={() => setView('map')}
            >
              Map
            </button>
            <button
              className={`px-2.5 py-1.5 ${view === 'street' ? 'bg-slate-700 text-white' : 'bg-transparent'}`}
              onClick={() => setView('street')}
            >
              Street
            </button>
          </div>
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-700">
            <button
              className={`px-2.5 py-1.5 ${mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-transparent'}`}
              onClick={() => setMode('edit')}
            >
              Edit
            </button>
            <button
              className={`px-2.5 py-1.5 ${mode === 'walk' ? 'bg-blue-600 text-white' : 'bg-transparent'}`}
              onClick={() => setMode('walk')}
              disabled={route.points.length === 0}
            >
              Walk
            </button>
            <button
              className={`px-2.5 py-1.5 ${mode === 'test' ? 'bg-blue-600 text-white' : 'bg-transparent'}`}
              onClick={() => setMode('test')}
              disabled={route.points.length === 0}
            >
              Test
            </button>
          </div>
        </div>

        {/* Map or Street View fills the rest; panels overlay only this area. */}
        <div className="relative min-h-0 flex-1">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>
            }
          >
            {view === 'map' ? <RouteMap /> : <StreetWalk />}
          </Suspense>
          {/* Edit content in a panel; map walk/test use their overlays; street has its own. */}
          {mode === 'edit' && <PointPanel />}
          {mode === 'walk' && view === 'map' && <WalkPanel />}
          {mode === 'test' && view === 'map' && <TestOverlay />}
        </div>
      </div>
    );
  }

  // --- Route list ---
  const create = () => {
    if (!uid || !name.trim()) return;
    const r = createRoute(uid, name);
    setName('');
    open(r, 'edit');
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h2 className="text-xl font-bold">Your memory routes</h2>
          <p className="text-sm text-slate-500">
            Pick a path you know well — a walk, a commute, your street. Drop stops along it on the
            map, then place what you want to remember at each stop and walk it in your mind.
          </p>
        </div>

        <div className="card flex gap-2">
          <input
            className="input flex-1"
            placeholder="New route name (e.g. Walk to school)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <button className="btn-primary" onClick={create}>
            Create
          </button>
        </div>

        <div className="space-y-2">
          {routes.map((r) => (
            <div key={r.id} className="card flex items-center justify-between">
              <button className="flex-1 text-left" onClick={() => open(r, r.points.length ? 'walk' : 'edit')}>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-slate-400">
                  {r.points.length} stops · updated {new Date(r.updatedAt).toLocaleDateString()}
                </div>
              </button>
              <button className="btn-ghost px-2 py-1 text-xs" onClick={() => open(r, 'edit')}>
                Edit
              </button>
              <button
                className="btn-danger px-2 py-1 text-xs"
                onClick={() => {
                  if (confirm(`Delete "${r.name}"?`)) {
                    deleteRoute(r.id);
                    refresh();
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
          {routes.length === 0 && <p className="text-slate-400">No routes yet. Create one above.</p>}
        </div>
      </div>
    </div>
  );
}
