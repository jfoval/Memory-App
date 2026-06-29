// Street-level imagery provider abstraction. Today it always offers a free
// "open in Google Street View" link (no key, no cost). When a Google Maps key is
// configured (VITE_GOOGLE_MAPS_KEY) it also exposes an embeddable Street View URL
// so the view can live inside the app. Swapping is just adding the env var.

const googleKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export const hasGoogleStreetView = !!googleKey;

// Free, universal: opens Google Street View at this spot in a new tab.
export function streetViewLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

// A plain Google Maps link to the spot (always free, for context).
export function mapLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// Embeddable Street View iframe URL — only when a key is configured. The Maps
// Embed API is free and unlimited; the key just needs billing enabled.
export function streetViewEmbed(lat: number, lng: number): string | null {
  if (!googleKey) return null;
  return `https://www.google.com/maps/embed/v1/streetview?key=${googleKey}&location=${lat},${lng}&fov=90`;
}
