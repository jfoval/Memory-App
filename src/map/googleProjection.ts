// Project a click in the Street View panorama onto a real-world ground point.
// Reconstructs the camera ray from the current point-of-view + zoom-derived field
// of view, then intersects it with a flat ground plane at camera height. It's an
// approximation, but it lands a marker close to where you click on the street;
// pins stay draggable on the map for fine-tuning.

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const CAMERA_HEIGHT = 2.6; // metres above the road

export interface Placement {
  markerPos: { lat: number; lng: number };
  pov: { heading: number; pitch: number; zoom: number };
  distance: number;
}

export function screenToGround(
  pano: google.maps.StreetViewPanorama,
  container: HTMLElement,
  clientX: number,
  clientY: number,
): Placement | null {
  const rect = container.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (!w || !h) return null;

  const dx = clientX - (rect.left + w / 2);
  const dy = clientY - (rect.top + h / 2);

  const pov = pano.getPov();
  const zoom = pano.getZoom() ?? 1;
  const hFov = clamp(180 / Math.pow(2, zoom), 10, 120);
  const f = w / 2 / Math.tan(toRad(hFov / 2));

  const rayHeading = pov.heading + toDeg(Math.atan2(dx, f));
  const rayPitch = (pov.pitch ?? 0) + toDeg(Math.atan2(-dy, f));

  let dist = rayPitch < -1 ? CAMERA_HEIGHT / Math.tan(toRad(-rayPitch)) : 12;
  dist = clamp(dist, 1.5, 70);

  const pos = pano.getPosition();
  if (!pos) return null;
  const target = google.maps.geometry.spherical.computeOffset(pos, dist, rayHeading);

  return {
    markerPos: { lat: target.lat(), lng: target.lng() },
    pov: { heading: rayHeading, pitch: Math.min(rayPitch, -6), zoom },
    distance: dist,
  };
}
