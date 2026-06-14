# 🏛️ Memory Palace

A free, multi-user **Memory Palace** trainer built on the Method of Loci. Everyone
shares one carefully designed, fixed **52-location palace** and learns it deeply.
Each user privately fills that palace with their own material — study notes, a
list, a Bible chapter, a proposal, numbers — and drills recall with scoring and
spaced repetition. A dedicated card-deck mode reuses the same 52 locations to
memorize a shuffled deck.

It's a responsive web app, installable as a PWA, and uses **no paid APIs**.

## Highlights

- One shared, hand-authored 52-location palace (4 zones × 13) rendered in
  stylized 3D, walkable on desktop and mobile.
- First-person navigation with collision: WASD + mouse-look on desktop, an
  on-screen joystick + drag-look on touch, plus a guided walk on every device.
- Per-user content sets with deterministic chunking, drag-free placement onto
  the 52 loci, association notes, and per-item images.
- Study and Test modes; recall scoring is lexical (always) with an optional
  on-device semantic model; multiple-choice fallback per item.
- SM-2 spaced repetition with a "due today" queue across all your sets.
- Card-deck mode: seeded Fisher–Yates shuffle, study, timed recall, scored.
- Stats: accuracy over time, retention per set, card-deck bests.
- Offline review + PWA install; queued reviews sync on reconnect.
- Accounts and per-user data isolation via Supabase + Row-Level Security.

## Tech stack

React 18 + TypeScript (strict) + Vite · Three.js via @react-three/fiber +
@react-three/drei · Tailwind CSS · Zustand + TanStack Query · Supabase (Auth +
Postgres + Storage, RLS) · Transformers.js (MiniLM) in a Web Worker · Vitest ·
ESLint + Prettier · vite-plugin-pwa.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Quality gates:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

> **No Supabase keys needed to try it.** With no keys configured the app runs in
> **local mode**: accounts and all data live privately in your browser
> (localStorage), so every feature is usable offline for development and demos.

## Connecting Supabase (accounts + cross-device sync)

The Supabase URL and anon key are **public by design** and safe in the client;
there are no other secrets.

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). This
   creates the tables, enables **Row-Level Security** (`user_id = auth.uid()`)
   on every table, and creates the owner-scoped `item-images` Storage bucket.
3. Copy `.env.example` to `.env` and fill in:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Restart `npm run dev`. The app now uses Supabase for auth and data; sign in on
   any device to see the same content and progress.

## Deploy free

The app is a static SPA plus **one** serverless function (URL import).

### Vercel

```bash
npm i -g vercel
vercel            # detects Vite; api/import.ts deploys as an edge function
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project's
environment variables. `vercel.json` provides the SPA fallback.

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --build
```

`netlify.toml` sets the build, publishes `dist/`, deploys
`netlify/functions/import.ts`, and redirects `/api/import` to it so the client
path is identical on both hosts. Add the two `VITE_` env vars in the Netlify UI.

Everything runs on free tiers: static hosting, Supabase free (accounts, Postgres,
storage), the on-device model (no API), and one free serverless function.

## Install as a PWA

Open the deployed site and use your browser's "Install app" / "Add to Home
Screen". The app shell, the palace, and your loaded content sets are cached for
offline review; queued review results sync when you reconnect.

## How to extend

- **Chunking** — `src/logic/chunking.ts` (pure, unit-tested). Tweak list/prose
  detection or the sentence splitter; tests live alongside.
- **The palace** — `src/palace/palaceData.ts` authors the 52 loci;
  `src/palace/zones.ts` defines the four zones. Geometry is chosen by `shape`
  in `src/scene/LocusObject.tsx` behind one component, so richer authored models
  can replace the primitives without touching app logic.
- **Scoring** — `src/logic/scoring.ts` (pure). Lexical weights and the semantic
  blend are named constants; the embedding model is optional behind
  `src/embeddings/embeddingService.ts`.
- **Scheduling** — `src/logic/scheduling.ts` implements SM-2 (pure, tested).

## Project layout

```
api/                 URL-import edge function (Vercel)
netlify/functions/   URL-import function (Netlify)
supabase/schema.sql  tables + RLS + storage policies
src/
  palace/            shared 52-location palace data + zones
  scene/             3D rendering, navigation, collision, HUD, touch controls
  logic/             pure: chunking, scoring, scheduling, cards, readability
  data/              backend abstraction (local + Supabase), repository, hooks
  auth/              auth store (Supabase or local accounts)
  embeddings/        on-device embedding worker + service
  app/               screens (palace, content, study/test, review, cards, stats)
  store/             Zustand stores (nav, ui)
  onboarding/        first-run sample set + tutorial flag
```

## License

MIT.
