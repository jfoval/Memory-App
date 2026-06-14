# BUILD_LOG.md

Decisions and progress for the Memory Palace build. Newest notes at the bottom.

## Decisions

- **Local backend as default (no keys required).** The spec asks to build the
  core working without real Supabase keys, stubbing where needed. Rather than a
  throwaway stub, the app ships a full `LocalBackend` (localStorage) selected
  automatically when no keys are present. Benefits: every feature is demoable and
  offline-capable with zero setup, and the same class doubles as the offline
  mirror/cache for the Supabase backend. With keys, `SupabaseBackend` is used and
  RLS enforces isolation. Both implement one `DataBackend` interface.

- **Local "accounts" are not real auth.** In local mode, sign-in maps an email to
  a deterministic per-device user id (localStorage). This is explicitly a
  no-backend convenience, surfaced in the UI ("local" badge + note on the auth
  screen). Real auth/isolation comes from Supabase + RLS when configured.

- **Palace positions are generated deterministically, not hand-typed.** Names,
  landmarks, shapes and colors for all 52 loci are hand-authored. Positions come
  from a fixed serpentine layout per zone — deliberate and reproducible (not
  random), giving guaranteed ≥6 m neighbour spacing (asserted in tests). This
  satisfies "author deliberately; do not generate randomly" while keeping the
  data maintainable.

- **Labels via canvas textures, not a web font.** drei `<Text>`/troika can fetch
  a font from the network; to stay fully offline the index labels are rendered to
  a `CanvasTexture` (`src/scene/labels.ts`) on billboards.

- **Collision = bounds + keep-out circles.** A simple, robust model: clamp the
  player to the floor and push them out of a radius around each locus, sliding
  along the circle rather than stopping. Guarantees "no clipping, never stuck"
  without a physics engine. Pure and unit-tested.

- **Embeddings are optional and non-blocking.** Transformers.js runs in a Web
  Worker; `embed()` times out and returns null if the model is unavailable, so
  scoring always falls back to lexical. The model is opt-in from the Learn screen
  (first load downloads weights; cached by the PWA afterward).

- **Images.** Local mode stores images as data URLs (no bucket needed). With
  Supabase, images upload to the owner-scoped `item-images` Storage bucket and we
  store the object path; display uses signed URLs.

- **URL-import readability is intentionally minimal** (regex strip + paragraph
  preference) to avoid heavy deps in a free serverless function. Shared logic in
  `src/logic/readability.ts` is unit-tested; `api/import.ts` (Vercel edge) and
  `netlify/functions/import.ts` are thin wrappers. These functions are compiled
  by the host, not by our `tsc -b`, so they're excluded from the TS project
  references (avoids cross-project file errors).

- **Card recall input** uses rank + suit dropdowns per position (exact suit+rank
  scored). Simple and unambiguous on touch; a full 52-card picker was overkill.

## Assumptions

- A "review" row is one-per-item (SM-2 state), upserted on `item_id`. The Test
  and Review flows both update it.
- Conflict resolution is last-write-wins by `updatedAt`; offline-created review
  and card results queue and replay on reconnect.
- Mid-range-phone performance targets are coded for (instancing-friendly setup,
  clamped dpr, paused loop) but can only be confirmed on real hardware.

## Progress

1. ✅ Scaffold (Vite/React/TS strict/Tailwind/R3F/PWA/Vitest/ESLint/Prettier);
   deployable skeleton; safe Supabase stubs.
2. ✅ Authored the fixed 52-location palace; stylized 3D render; desktop + touch
   movement + guided walk; collision; resize/orientation handling; perf budget;
   labels, zone tints, tap-to-select.
3. ✅ Supabase schema, RLS on every table, Storage bucket + policies, client.
4. ✅ Auth (sign-up/in/out, session persistence, protected app, profile on first
   sign-in) for both Supabase and local modes.
5. ✅ Content sets (create/name/list/delete); editable chunking + placement UI;
   paste → chunk → place; per-item association + image.
6. ✅ URL-import serverless function (Vercel + Netlify) feeding the pipeline.
7. ✅ Optional embedding model (worker + service) behind the scoring interface.
8. ✅ Study mode (walk, reveal/hide, progressive recall).
9. ✅ Test mode + scoring (lexical + optional semantic) + multiple-choice
   fallback; writes reviews.
10. ✅ SM-2 spaced repetition + due-today view.
11. ✅ Card-deck mode (shuffle, map, study, timed test, save).
12. ✅ Stats (accuracy over time, retention per set, card bests).
13. ✅ Onboarding sample set + Method of Loci tutorial; accessibility (keyboard,
    focus, contrast, reduced motion); dark mode.
14. ✅ PWA offline review + sync-on-reconnect queue (last-write-wins).
15. ✅ README, CLAUDE.md, this log. Final verification in the build summary.

All quality gates green throughout (typecheck, lint, 60 unit tests, build).
