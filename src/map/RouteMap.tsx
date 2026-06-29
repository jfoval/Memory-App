import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OPENFREEMAP_STYLE } from './mapStyle';
import { useRoutes } from '../store/routesStore';

// The interactive map. In edit mode, clicking drops a numbered pin; in walk mode
// it flies to the current stop. Markers + the connecting line are managed
// imperatively (MapLibre is an imperative library).
export function RouteMap() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ name: string; lat: number; lon: number }[]>([]);

  const route = useRoutes((s) => s.route);
  const selectedId = useRoutes((s) => s.selectedId);
  const mode = useRoutes((s) => s.mode);
  const walkIndex = useRoutes((s) => s.walkIndex);

  // Init once.
  useEffect(() => {
    if (!container.current || map.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: OPENFREEMAP_STYLE,
      center: [-91.187, 30.4515], // Baton Rouge-ish default; user searches from here
      zoom: 13,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    // Add the route line once the style is ready (and re-add if the style reloads).
    const ensureLine = () => {
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
      setReady(true);
    };
    m.on('load', () => {
      ensureLine();
      m.resize();
    });
    m.on('styledata', ensureLine);
    // Belt-and-suspenders: ensure the canvas matches the container once laid out.
    setTimeout(() => m.resize(), 250);
    m.on('click', (e) => {
      if (useRoutes.getState().mode !== 'edit') return;
      useRoutes.getState().addAt(e.lngLat.lat, e.lngLat.lng);
    });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Sync markers + line whenever points/selection change.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !route) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current = route.points.map((p) => {
      const el = document.createElement('div');
      const selected = p.id === selectedId;
      el.className = 'mp-pin';
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
      return new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(m);
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
      {/* Explicit h-full: MapLibre forces position:relative on this element, which
          would cancel `absolute inset-0` and collapse it to zero height. */}
      <div ref={container} className="palace-canvas h-full w-full" />

      {/* Search + locate (only useful while editing). */}
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
          <p className="pointer-events-none mt-1 text-center text-xs text-white/80 drop-shadow">
            Tap the map to drop your next stop
          </p>
        </div>
      )}
    </div>
  );
}
