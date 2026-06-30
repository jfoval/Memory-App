// Loads the Google Maps JavaScript API once, and a helper to resolve the nearest
// Street View panorama to a point. The key is a referrer-restricted public client
// token (VITE_GOOGLE_MAPS_KEY), same treatment as the Mapillary token.

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

let promise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (promise) return promise;
  promise = new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.maps) {
      resolve(google);
      return;
    }
    if (!KEY) {
      reject(new Error('Missing VITE_GOOGLE_MAPS_KEY'));
      return;
    }
    const cb = '__mpGmapsReady';
    (window as unknown as Record<string, () => void>)[cb] = () => resolve(google);
    const params = new URLSearchParams({
      key: KEY,
      v: 'weekly',
      libraries: 'geometry',
      loading: 'async',
      callback: cb,
    });
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error('Failed to load the Google Maps JavaScript API.'));
    document.head.appendChild(s);
  });
  return promise;
}

export interface NearestPano {
  panoId: string;
  lat: number;
  lng: number;
}

// Find the closest Street View panorama to a lat/lng (null if there's no coverage).
export async function nearestGooglePano(
  lat: number,
  lng: number,
  radius = 50,
): Promise<NearestPano | null> {
  const g = await loadGoogleMaps();
  const svc = new g.maps.StreetViewService();
  try {
    const { data } = await svc.getPanorama({
      location: { lat, lng },
      radius,
      preference: g.maps.StreetViewPreference.NEAREST,
    });
    const loc = data.location;
    if (!loc?.pano || !loc.latLng) return null;
    return { panoId: loc.pano, lat: loc.latLng.lat(), lng: loc.latLng.lng() };
  } catch {
    return null;
  }
}
