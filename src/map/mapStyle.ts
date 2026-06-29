import type { StyleSpecification } from 'maplibre-gl';

// A free MapLibre style backed by OpenStreetMap raster tiles — no API key, no
// account. (For heavy production traffic you'd swap in a proper tile provider or
// a Google key; this is the zero-cost default.)
export const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0b1220' } },
    { id: 'osm', type: 'raster', source: 'osm' },
  ],
};
