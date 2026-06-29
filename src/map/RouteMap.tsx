import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OPENFREEMAP_STYLE } from './mapStyle';
import { mapillaryCoverageTiles } from './streetview';
import { useRoutes } from '../store/routesStore';

// The map is the "find your start" step. Mapillary coverage is painted on it in
// green, and tapping a green point drops you into that exact panorama — no flaky
// "nearby" lookup. Existing stops show as numbered pins.
export function RouteMap() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const [hint, setHint] = useState('Green = Street View coverage. Zoom in and tap a green dot to walk it.');

  const route = useRoutes((s) => s.route);
  const selectedId = useRoutes((s) => s.selectedId);
  const mode = useRoutes((s) => s.mode);
  const walkIndex = useRoutes((s) => s.walkIndex);

  useEffect(() => {
    if (!container.current || map.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: OPENFREEMAP_STYLE,
      center: [-91.187, 30.4515],
      zoom: 14,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    const ensureLayers = () => {
      if (!m.isStyleLoaded()) return;
      if (!m.getSource('route-line')) {
        m.addSource('route-line', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
        });
        m.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line',
          paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.85 },
        });
      }
      // Mapillary coverage overlay (green) so it's obvious what you can pick.
      const cov = mapillaryCoverageTiles();
      if (cov && !m.getSource('mly')) {
        m.addSource('mly', { type: 'vector', tiles: [cov], minzoom: 6, maxzoom: 14 });
        m.addLayer({
          id: 'mly-seq',
          type: 'line',
          source: 'mly',
          'source-layer': 'sequence',
          paint: { 'line-color': '#22c55e', 'line-width': 3, 'line-opacity': 0.7 },
        });
        m.addLayer({
          id: 'mly-image',
          type: 'circle',
          source: 'mly',
          'source-layer': 'image',
          minzoom: 14,
          paint: {
            'circle-color': '#16a34a',
            'circle-radius': 4,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
          },
        });
      }
      setReady(true);
    };
    m.on('load', () => {
      ensureLayers();
      m.resize();
    });
    m.on('styledata', ensureLayers);
    setTimeout(() => m.resize(), 250);

    // Tap a green coverage point -> enter Street View at that exact image.
    m.on('click', (e) => {
      const box: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 10, e.point.y - 10],
        [e.point.x + 10, e.point.y + 10],
      ];
      let imgs: maplibregl.MapGeoJSONFeature[] = [];
      try {
        imgs = m.queryRenderedFeatures(box, { layers: ['mly-image'] });
      } catch {
        /* layer not ready */
      }
      if (imgs.length) {
        const f = imgs[0];
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
        useRoutes.getState().setEntry({ lat, lng, imageId: String(f.properties.id) });
        return;
      }
      // Tapped a covered street but no dot yet — zoom in so points appear.
      let lines: maplibregl.MapGeoJSONFeature[] = [];
      try {
        lines = m.queryRenderedFeatures(box, { layers: ['mly-seq'] });
      } catch {
        /* ignore */
      }
      if (lines.length) {
        m.easeTo({ center: e.lngLat, zoom: Math.max(m.getZoom(), 17) });
        setHint('Now tap one of the green dots to drop into Street View.');
      } else {
        setHint('No Street View coverage there. Pan to a green street and tap a green dot.');
      }
    });

    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Numbered pins for saved stops + the connecting line.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !route) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current = route.points.map((p) => {
      const el = document.createElement('div');
      const selected = p.id === selectedId;
      el.textContent = String(p.order);
      el.style.cssText = `width:28px;height:28px;border-radius:9999px;display:flex;align-items:center;justify-content:center;
        font:600 13px system-ui;color:#fff;cursor:pointer;border:2px solid #fff;
        background:${selected ? '#ef4444' : '#3b82f6'};box-shadow:0 1px 4px rgba(0,0,0,.5)`;
      el.onclick = (ev) => {
        ev.stopPropagation();
        const st = useRoutes.getState();
        st.select(p.id);
        if (st.mode === 'walk') st.walkTo(p.order - 1);
      };
      return new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(m);
    });
    const src = m.getSource('route-line') as maplibregl.GeoJSONSource | undefined;
    src?.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: route.points.map((p) => [p.lng, p.lat]) },
      properties: {},
    });
  }, [route, selectedId, ready]);

  // Fly to the current stop during a walk.
  useEffect(() => {
    const m = map.current;
    if (!m || !route || mode !== 'walk') return;
    const p = route.points[walkIndex];
    if (p) m.flyTo({ center: [p.lng, p.lat], zoom: 17, speed: 1.2 });
  }, [walkIndex, mode, route]);

  const locate = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      map.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 });
    });
  };

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(search)}`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      setResults(data.map((d) => ({ name: d.display_name, lat: +d.lat, lon: +d.lon })));
    } catch {
      setResults([]);
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="palace-canvas h-full w-full" />

      {mode === 'edit' && (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-20 mx-auto max-w-md px-3">
          <form onSubmit={runSearch} className="pointer-events-auto flex gap-2">
            <input
              className="input flex-1"
              placeholder="Search a place you know…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-primary" type="submit">
              Go
            </button>
            <button type="button" className="btn-ghost" onClick={locate} title="Use my location">
              📍
            </button>
          </form>
          {results.length > 0 && (
            <div className="pointer-events-auto mt-1 overflow-hidden rounded-lg bg-white shadow dark:bg-slate-900">
              {results.map((r, i) => (
                <button
                  key={i}
                  className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    map.current?.flyTo({ center: [r.lon, r.lat], zoom: 16 });
                    setResults([]);
                    setSearch(r.name.split(',')[0]);
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
          <p className="pointer-events-none mt-1 rounded bg-black/40 px-2 py-1 text-center text-xs text-white">
            {hint}
          </p>
        </div>
      )}
    </div>
  );
}
