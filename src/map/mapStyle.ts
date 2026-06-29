import type { StyleSpecification } from 'maplibre-gl';

// Free, no-key, full-street-detail vector tiles from OpenFreeMap — purpose-built
// as a free Google-Maps alternative for web apps. This is the default style.
export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Fallback: OpenStreetMap raster tiles (also no key). Kept as a backup style.
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
