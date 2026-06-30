# CLAUDE.md — Memory Palace (map-based)

Guidance for working in this repo. **Read HANDOFF.md too** — it has live status and
the current task (switching Street View to Google).

## What this app is (current direction)

A memory trainer built on the Method of Loci, but the "palace" is a **real-world
route on a map**. The user:

1. Opens a map (MapLibre + free OpenStreetMap/OpenFreeMap tiles), finds a path
   they know, and sees **Mapillary street-level coverage** painted on it.
2. **Enters Street View** and walks it, dropping memory **stops** where they
   stand (each stop stores lat/lng + the street image id + the thing to
   remember).
3. **Walks** the route stop-to-stop in Street View, with hide/reveal recall.

Per-user routes (not one shared palace). Runs free on GitHub Pages.

## Commands

```bash
npm run dev | typecheck | lint | test | build
```

Keep all gates green. **Verify UI in a headless browser before shipping** (see
HANDOFF.md "Verifying") — several bugs here were only visible at runtime.

## Architecture

- **Auth + storage**: `src/auth/authStore.ts` (Supabase or local demo accounts);
  `src/data/repository.ts` + `backend.ts`/`localBackend.ts`/`supabaseBackend.ts`.
  Deployed build runs in **local mode** (no Supabase keys) → data in localStorage.
- **Routes (the palace)**: `src/data/routes.ts` (Route + RoutePoint types, pure
  edit helpers, localStorage persistence). `src/store/routesStore.ts` holds the
  active route + view/mode/walk state.
- **Map**: `src/map/RouteMap.tsx` (MapLibre map, Mapillary coverage overlay,
  tap-a-coverage-dot → enter Street View). `src/map/mapStyle.ts` (OpenFreeMap).
- **Street View**: `src/map/MapillaryWalk.tsx` (MapillaryJS viewer: navigate
  image-to-image, drop stops, in-view markers, guided walk). `PointPanel.tsx`
  (edit a stop), `WalkPanel.tsx` (map-walk overlay).
- **Provider abstraction**: `src/map/streetview.ts` — Mapillary today; Google is
  wired to light up via `VITE_GOOGLE_MAPS_KEY` (see HANDOFF.md for the plan).
- **Screens/shell**: `src/app/screens/RoutesScreen.tsx` (orchestrates map/street
  + edit/walk), `LearnScreen.tsx`, `AppShell.tsx` (tabs: Routes, Learn).
- **Pure logic kept for the recall engine** (not yet wired onto routes):
  `src/logic/scoring.ts`, `scheduling.ts` (SM-2), `chunking.ts`, `cards.ts`,
  `readability.ts` — all unit-tested.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` (auto-deploys on push to
`claude/memory-palace-app-h2rzaz`). Live at
**https://jfoval.github.io/Memory-App/**. Vite `base` is `/Memory-App/` on Pages
(set by `BASE_PATH` env in the workflow), `/` elsewhere.

## Keys / env

- `VITE_MAPILLARY_TOKEN` — in **`.env.production`** (committed; public client
  token, fine to expose). Read at build time.
- `VITE_GOOGLE_MAPS_KEY` — not set yet; will go in `.env.production` too
  (referrer-restricted public client key).
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — optional, enable cloud sync.

## Gotchas (learned the hard way)

- The sandbox network is **locked to GitHub/npm** — you can't fetch map tiles,
  Mapillary, Poly Haven, etc. Build code that works in the user's browser; verify
  logic locally, not network.
- MapLibre forces `position: relative` on its container → never size the map with
  `absolute inset-0` (collapses to 0px). Use `h-full w-full`.
- `mcp__github__actions_list` output overflows; slice the saved file with python.
