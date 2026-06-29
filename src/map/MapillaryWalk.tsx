import { useEffect, useRef, useState } from 'react';
import { Viewer, SimpleMarker, type MarkerComponent, type ViewerImageEvent } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import { useRoutes } from '../store/routesStore';
import { getMapillaryToken, hasMapillary, nearestMapillaryImage } from './streetview';

type Status = 'loading' | 'ready' | 'none' | 'notoken';

// The immersive walk: a real street-level viewer you navigate image-to-image.
// In edit mode you drop stops where you stand; in walk mode it flies you stop to
// stop. Markers for your stops are drawn into the view itself.
export function MapillaryWalk() {
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const currentImage = useRef<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const route = useRoutes((s) => s.route)!;
  const mode = useRoutes((s) => s.mode);
  const entry = useRoutes((s) => s.entry);
  const walkIndex = useRoutes((s) => s.walkIndex);
  const revealed = useRoutes((s) => s.revealed);
  const setView = useRoutes((s) => s.setView);

  // Initialise the viewer once when we enter Street View.
  useEffect(() => {
    if (!hasMapillary) {
      setStatus('notoken');
      return;
    }
    let cancelled = false;
    (async () => {
      const selected = route.points.find((p) => p.id === useRoutes.getState().selectedId);
      const startId =
        selected?.imageId ||
        route.points.find((p) => p.imageId)?.imageId ||
        (entry ? await nearestMapillaryImage(entry.lat, entry.lng) : null);
      if (cancelled) return;
      if (!startId || !container.current) {
        setStatus('none');
        return;
      }
      const v = new Viewer({
        accessToken: getMapillaryToken()!,
        container: container.current,
        imageId: startId,
        component: { cover: false, marker: true },
      });
      v.on('image', (e: ViewerImageEvent) => {
        currentImage.current = e.image.id;
      });
      viewer.current = v;
      setStatus('ready');
      drawMarkers();
    })();
    return () => {
      cancelled = true;
      viewer.current?.remove();
      viewer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw a marker for each saved stop that has a known location.
  const drawMarkers = () => {
    const v = viewer.current;
    if (!v) return;
    try {
      const mc = v.getComponent('marker') as MarkerComponent;
      mc.removeAll();
      mc.add(
        route.points
          .filter((p) => p.lat && p.lng)
          .map((p) => new SimpleMarker(p.id, { lat: p.lat, lng: p.lng }, { color: '#ef4444' })),
      );
    } catch {
      /* marker component unavailable — navigation still works */
    }
  };
  useEffect(drawMarkers, [route.points, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guided walk: fly to each stop's image.
  useEffect(() => {
    if (mode !== 'walk' || status !== 'ready') return;
    const v = viewer.current;
    const stop = route.points[walkIndex];
    if (!v || !stop) return;
    (async () => {
      const id = stop.imageId || (await nearestMapillaryImage(stop.lat, stop.lng));
      if (id) v.moveTo(id).catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkIndex, mode, status]);

  const dropStop = async () => {
    const v = viewer.current;
    if (!v) return;
    const pos = await v.getPosition().catch(() => null);
    if (!pos) return;
    useRoutes.getState().addStreetStop(pos.lat, pos.lng, currentImage.current ?? '');
  };

  if (status === 'notoken') return <SetupNotice />;

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="palace-canvas h-full w-full bg-slate-900" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
          Finding street imagery…
        </div>
      )}

      {status === 'none' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
          <p>No Mapillary street imagery near this spot.</p>
          <button className="btn-ghost" onClick={() => setView('map')}>
            ‹ Back to map — try another start
          </button>
        </div>
      )}

      {/* Edit: drop a stop where you're standing. */}
      {status === 'ready' && mode === 'edit' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
          <button className="btn-primary pointer-events-auto shadow-lg" onClick={dropStop}>
            ＋ Drop stop here
          </button>
        </div>
      )}

      {/* Walk: show the stop's content with reveal/hide. */}
      {status === 'ready' && mode === 'walk' && <WalkOverlay revealed={revealed} />}
    </div>
  );
}

function WalkOverlay({ revealed }: { revealed: boolean }) {
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
            <>
              <p>{stop.content || <span className="text-slate-400">Nothing placed here.</span>}</p>
              {stop.association && (
                <p className="mt-1 text-xs italic text-slate-500">💭 {stop.association}</p>
              )}
            </>
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

function SetupNotice() {
  const setView = useRoutes((s) => s.setView);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <h3 className="text-lg font-semibold">Street View needs a free Mapillary token</h3>
      <p className="max-w-sm text-sm text-slate-500">
        Create a free token at mapillary.com/dashboard/developers, add it as the{' '}
        <code>VITE_MAPILLARY_TOKEN</code> build secret, and Street View turns on here — no cost.
      </p>
      <button className="btn-ghost" onClick={() => setView('map')}>
        ‹ Back to map
      </button>
    </div>
  );
}
