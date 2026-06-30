# HANDOFF — for the next session

## Where we are

Live app: **https://jfoval.github.io/Memory-App/** (branch
`claude/memory-palace-app-h2rzaz`, auto-deploys on push).

The app works: map → tap a Mapillary coverage dot → walk Street View → drop
memory stops → walk the route with hide/reveal. See CLAUDE.md for the file map.

**Why we're switching to Google:** Mapillary coverage in the user's area (Baton
Rouge) is mostly **flat/perspective images**, not true **360°** (purple dots in
the app = 360, and there are few). The user wants real look-around 360 like
Google Street View, which has ~universal 360 coverage. Cost is ~$0 for solo/test
use but scales per-panorama for many users (Street View is a pricier SKU).

## THE CURRENT TASK: switch Street View to Google

### What the user must do first (gating — they're doing this now)

Create a Google Maps API key:
1. console.cloud.google.com → create a project.
2. **Enable billing** (requires a credit card; ~$0 in practice for testing).
3. APIs & Services → Library → enable **"Maps JavaScript API"**.
4. APIs & Services → Credentials → Create credentials → **API key**; copy it.
5. Restrict the key: Application restrictions → **HTTP referrers** → add
   `https://jfoval.github.io/*` and `http://localhost:*`. API restrictions →
   restrict to **Maps JavaScript API**.
6. Paste the key into the new session (or add as `VITE_GOOGLE_MAPS_KEY` in
   `.env.production`). It's a referrer-restricted public client key — safe to
   commit, like the Mapillary token already there.

### Implementation plan (for the assistant)

The provider abstraction already exists in `src/map/streetview.ts`
(`hasGoogleStreetView` from `VITE_GOOGLE_MAPS_KEY`). Build a Google walker
parallel to `MapillaryWalk.tsx`:

1. **`src/map/GoogleWalk.tsx`** using the Google Maps JS API:
   - Dynamically load `https://maps.googleapis.com/maps/api/js?key=KEY&v=weekly`
     once (a small loader util; or `@googlemaps/js-api-loader`).
   - `new google.maps.StreetViewPanorama(container, { position, pov, visible })`.
     Built-in arrows give the walk; it's true 360.
   - Track location via `pano.addListener('position_changed', ...)` →
     `pano.getPosition()` (LatLng) and `pano.getPano()` (panoId).
   - **Drop stop**: read current position + panoId; store panoId in
     `RoutePoint.imageId` (reuse the field) + lat/lng.
   - **Markers in view**: `new google.maps.Marker({ position, map: pano })` —
     markers render inside the panorama. Recreate on points change.
   - **Walk mode**: `pano.setPano(stop.imageId)` (or `setPosition` from lat/lng)
     per `walkIndex`.
2. **Entry / finding the nearest pano**: use
   `new google.maps.StreetViewService().getPanorama({ location, radius: 50 })`
   → gives a panoId for a tapped map point. So in `RouteMap.tsx`, when Google is
   active, drop the Mapillary coverage overlay (Google is everywhere) and on map
   click resolve the nearest pano via StreetViewService, then `setEntry({ lat,
   lng, imageId: panoId })`.
3. **Switch in `RoutesScreen.tsx`**: render `GoogleWalk` when
   `hasGoogleStreetView`, else `MapillaryWalk`. Keep both (Mapillary stays the
   free fallback).
4. Keep `RoutePoint.imageId` as the provider-agnostic pano/image id. (If mixing
   providers ever matters, add a `provider` tag — not needed for now.)

### Notes / risks
- Google Maps JS loads at runtime in the user's browser (sandbox can't reach it).
  Verify the non-key path in headless; the user verifies the real thing.
- Don't embed the Google key without referrer restriction set, or it can be
  abused for other Google APIs.

## Verifying (do this before every deploy)

Headless check with the pre-installed Chromium (egress is locked, so tiles/SV
won't load here, but you catch crashes, 0-height containers, wrong states):

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i -D playwright-core
npm run build && npx vite preview --port 4321 &
# script: sign in (any email + 6+ char pw), create a route, drive the UI,
# read console/pageerror + element sizes. Chromium at
# /opt/pw-browsers/chromium-1194/chrome-linux/chrome
npm uninstall playwright-core   # clean up after
```

## Deploy status checks
`mcp__github__actions_list` output overflows the tool; it saves to a file — slice
first 3000 chars with python and grep `status`/`conclusion`.
