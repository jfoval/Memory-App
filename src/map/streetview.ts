// Street-level provider abstraction. Two real providers can do the full
// experience (walk panorama-to-panorama + place markers in the view):
//   - Mapillary  — free, no per-load cost at any scale (crowd-sourced coverage)
//   - Google     — best/universal coverage, but billed per panorama at scale
// Plus a universal free "open in Google Street View" link as a fallback.
// Switching providers is just setting the matching env var.

const mapillaryToken = import.meta.env.VITE_MAPILLARY_TOKEN;
const googleKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export const hasMapillary = !!mapillaryToken;
export const hasGoogleStreetView = !!googleKey;
export const getMapillaryToken = () => mapillaryToken;

// Which interactive walker to use. Google (universal 360°) wins when its key is
// set; Mapillary is the free fallback.
export type StreetViewProvider = 'google' | 'mapillary' | 'none';
export const streetViewProvider: StreetViewProvider = hasGoogleStreetView
  ? 'google'
  : hasMapillary
    ? 'mapillary'
    : 'none';

// Mapillary coverage vector tiles — paint these on the map so the user can see
// exactly which streets have imagery (and tap one to jump in).
export function mapillaryCoverageTiles(): string | null {
  if (!mapillaryToken) return null;
  return `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${encodeURIComponent(
    mapillaryToken,
  )}`;
}

// Free, universal: opens Google Street View at this spot in a new tab.
export function streetViewLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

// Embeddable Google Street View (only when a key is configured).
export function streetViewEmbed(lat: number, lng: number): string | null {
  if (!googleKey) return null;
  return `https://www.google.com/maps/embed/v1/streetview?key=${googleKey}&location=${lat},${lng}&fov=90`;
}

// Find the nearest Mapillary street-level image to a point (its id is what the
// viewer navigates to). Returns null if there's no coverage there.
export async function nearestMapillaryImage(lat: number, lng: number): Promise<string | null> {
  if (!mapillaryToken) return null;
  const d = 0.0012; // ~120m search box
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  try {
    const res = await fetch(
      `https://graph.mapillary.com/images?access_token=${mapillaryToken}&fields=id&bbox=${bbox}&limit=1`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { id: string }[] };
    return json.data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}
