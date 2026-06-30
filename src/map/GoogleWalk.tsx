import { useEffect, useRef, useState } from 'react';
import { useRoutes } from '../store/routesStore';
import { hasGoogleStreetView } from './streetview';
import { loadGoogleMaps, nearestGooglePano } from './googleLoader';
import { screenToGround } from './googleProjection';
import { WalkOverlay } from './WalkOverlay';
import type { RoutePoint, StreetViewPov } from '../data/routes';

type Status = 'loading' | 'ready' | 'none' | 'nokey';

// The immersive walk on Google Street View: true 360° look-around with the
// built-in arrows to move panorama-to-panorama. In edit mode you drop stops
// (where you stand, or by tapping a spot in the scene); in walk mode it flies
// you stop-to-stop, facing each locus. Stop markers are drawn into the view.
export function GoogleWalk() {
  const container = useRef<HTMLDivElement>(null);
  const pano = useRef<google.maps.StreetViewPanorama | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const curPos = useRef<{ lat: number; lng: number } | null>(null);
  const curPano = useRef<string | null>(null);
  const curPov = useRef<StreetViewPov>({ heading: 0, pitch: 0, zoom: 1 });
  const [status, setStatus] = useState<Status>('loading');
  const [placing, setPlacing] = useState(false);

  const route = useRoutes((s) => s.route)!;
  const mode = useRoutes((s) => s.mode);
  const entry = useRoutes((s) => s.entry);
  const walkIndex = useRoutes((s) => s.walkIndex);
  const revealed = useRoutes((s) => s.revealed);
  const selectedId = useRoutes((s) => s.selectedId);
  const setView = useRoutes((s) => s.setView);

  // Initialise the panorama once when we enter Street View.
  useEffect(() => {
    if (!hasGoogleStreetView) {
      setStatus('nokey');
      return;
    }
    let cancelled = false;
    (async () => {
      let g: typeof google;
      try {
        g = await loadGoogleMaps();
      } catch {
        if (!cancelled) setStatus('nokey');
        return;
      }
      if (cancelled || !container.current) return;

      // Where to start: a tapped pano on the map, else the selected/first stop.
      const sel =
        route.points.find((p) => p.id === selectedId) ??
        route.points.find((p) => p.imageId) ??
        route.points[0];
      let startPano: string | null = entry?.imageId ?? null;
      if (!startPano && entry) startPano = (await nearestGooglePano(entry.lat, entry.lng))?.panoId ?? null;
      if (!startPano && sel) startPano = (await nearestGooglePano(sel.lat, sel.lng))?.panoId ?? null;
      if (cancelled) return;
      if (!startPano || !container.current) {
        setStatus('none');
        return;
      }

      const startPov = sel?.pov;
      if (startPov) curPov.current = startPov;
      curPano.current = startPano;

      const p = new g.maps.StreetViewPanorama(container.current, {
        pano: startPano,
        pov: { heading: curPov.current.heading, pitch: curPov.current.pitch },
        zoom: curPov.current.zoom,
        visible: true,
        motionTracking: false,
        motionTrackingControl: false,
        fullscreenControl: false,
        addressControl: true,
        enableCloseButton: false,
        zoomControl: true,
        clickToGo: true,
      });
      p.addListener('position_changed', () => {
        const pos = p.getPosition();
        if (pos) curPos.current = { lat: pos.lat(), lng: pos.lng() };
        curPano.current = p.getPano();
      });
      p.addListener('pov_changed', () => {
        const v = p.getPov();
        curPov.current = { heading: v.heading, pitch: v.pitch, zoom: p.getZoom() ?? 1 };
      });
      pano.current = p;
      setStatus('ready');
      drawMarkers();
    })();
    return () => {
      cancelled = true;
      markers.current.forEach((m) => m.setMap(null));
      markers.current = [];
      if (pano.current) google.maps.event.clearInstanceListeners(pano.current);
      pano.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw a numbered marker for each saved stop, into the panorama itself.
  const drawMarkers = () => {
    const p = pano.current;
    if (!p) return;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = route.points
      .filter((pt) => pt.lat && pt.lng)
      .map((pt) => {
        const m = new google.maps.Marker({
          position: { lat: pt.lat, lng: pt.lng },
          map: p,
          icon: pinIcon(pt.order, pt.id === selectedId),
          title: pt.label,
        });
        m.addListener('click', () => {
          const st = useRoutes.getState();
          st.select(pt.id);
          if (st.mode === 'walk') st.walkTo(pt.order - 1);
        });
        return m;
      });
  };
  useEffect(drawMarkers, [route.points, status, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guided walk: fly to each stop's pano, facing the locus.
  useEffect(() => {
    if (mode !== 'walk' || status !== 'ready') return;
    const stop = route.points[walkIndex];
    if (stop) void gotoStop(stop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkIndex, mode, status]);

  const gotoStop = async (stop: RoutePoint) => {
    const p = pano.current;
    if (!p) return;
    let panoId = stop.imageId || null;
    if (!panoId) panoId = (await nearestGooglePano(stop.lat, stop.lng))?.panoId ?? null;
    if (!panoId) return;
    p.setPano(panoId);
    if (stop.pov) {
      p.setPov({ heading: stop.pov.heading, pitch: stop.pov.pitch });
      p.setZoom(stop.pov.zoom);
    }
  };

  // Drop a stop a few metres ahead of where you're standing/looking.
  const dropAhead = () => {
    const pos = curPos.current;
    if (!pos) return;
    const pov = curPov.current;
    const ahead = google.maps.geometry.spherical.computeOffset(
      new google.maps.LatLng(pos.lat, pos.lng),
      6,
      pov.heading,
    );
    useRoutes
      .getState()
      .addStreetStop(ahead.lat(), ahead.lng(), curPano.current ?? '', { ...pov, pitch: Math.min(pov.pitch, -4) });
  };

  // Drop a stop exactly where you tap in the 360° scene.
  const placeAt = (e: React.MouseEvent) => {
    const p = pano.current;
    if (!p || !container.current) return;
    const hit = screenToGround(p, container.current, e.clientX, e.clientY);
    setPlacing(false);
    if (!hit) return;
    useRoutes
      .getState()
      .addStreetStop(hit.markerPos.lat, hit.markerPos.lng, curPano.current ?? '', hit.pov);
  };

  if (status === 'nokey') return <SetupNotice />;

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="palace-canvas h-full w-full bg-slate-900" />

      {/* Tap-to-place overlay (intercepts the click so it doesn't move you). */}
      {placing && status === 'ready' && (
        <div className="absolute inset-0 z-30 cursor-crosshair" onClick={placeAt}>
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <span className="rounded-full border border-blue-400 bg-slate-900/80 px-4 py-2 text-sm font-medium text-blue-200">
              Tap the spot to drop a stop
            </span>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
          Loading Street View…
        </div>
      )}

      {status === 'none' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
          <p>No Street View imagery near this spot.</p>
          <button className="btn-ghost" onClick={() => setView('map')}>
            ‹ Back to map — try another start
          </button>
        </div>
      )}

      {/* Edit: drop a stop where you stand, or tap an exact spot. */}
      {status === 'ready' && mode === 'edit' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
          <button className="btn-primary pointer-events-auto shadow-lg" onClick={dropAhead}>
            ＋ Drop stop here
          </button>
          <button
            className={`pointer-events-auto shadow-lg ${placing ? 'btn-danger' : 'btn-ghost'}`}
            onClick={() => setPlacing((v) => !v)}
          >
            {placing ? 'Cancel' : '🎯 Tap a spot'}
          </button>
        </div>
      )}

      {/* Walk: show the stop's content with reveal/hide. */}
      {status === 'ready' && mode === 'walk' && <WalkOverlay revealed={revealed} />}
    </div>
  );
}

// A numbered teardrop pin, matching the app's blue/red marker colours.
function pinIcon(n: number, selected: boolean): google.maps.Icon {
  const color = selected ? '#ef4444' : '#3b82f6';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 41C16 41 30 24 30 15A14 14 0 1 0 2 15C2 24 16 41 16 41Z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="15" r="9" fill="#fff"/>
    <text x="16" y="19" font-family="system-ui,Arial,sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="${color}">${n}</text>
  </svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(32, 42),
    anchor: new google.maps.Point(16, 41),
  };
}

function SetupNotice() {
  const setView = useRoutes((s) => s.setView);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <h3 className="text-lg font-semibold">Street View needs a Google Maps key</h3>
      <p className="max-w-sm text-sm text-slate-500">
        Add a referrer-restricted <code>VITE_GOOGLE_MAPS_KEY</code> (Maps JavaScript API) to the
        build and Google Street View turns on here.
      </p>
      <button className="btn-ghost" onClick={() => setView('map')}>
        ‹ Back to map
      </button>
    </div>
  );
}
