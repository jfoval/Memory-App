import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from '../../auth/authStore';
import { useRoutes } from '../../store/routesStore';
import { createRoute, deleteRoute, listRoutes, type Route } from '../../data/routes';
import { PointPanel } from '../../map/PointPanel';
import { WalkPanel } from '../../map/WalkPanel';

// The map (and MapLibre) loads only when a route is opened.
const RouteMap = lazy(() => import('../../map/RouteMap').then((m) => ({ default: m.RouteMap })));

export function RoutesScreen() {
  const uid = useAuth((s) => s.user?.id);
  const { route, mode, open, close, setMode, rename } = useRoutes();
  const [routes, setRoutesList] = useState<Route[]>([]);
  const [name, setName] = useState('');

  const refresh = () => uid && setRoutesList(listRoutes(uid));
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, route]);

  // --- Active route: map editor / walk ---
  if (route) {
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
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-700">
            <button
              className={`px-3 py-1.5 ${mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-transparent'}`}
              onClick={() => setMode('edit')}
            >
              Edit
            </button>
            <button
              className={`px-3 py-1.5 ${mode === 'walk' ? 'bg-blue-600 text-white' : 'bg-transparent'}`}
              onClick={() => setMode('walk')}
              disabled={route.points.length === 0}
            >
              Walk
            </button>
          </div>
        </div>

        {/* Map fills the rest; panels overlay only the map area. */}
        <div className="relative min-h-0 flex-1">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-slate-400">Loading map…</div>
            }
          >
            <RouteMap />
          </Suspense>
          {mode === 'edit' ? <PointPanel /> : <WalkPanel />}
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
