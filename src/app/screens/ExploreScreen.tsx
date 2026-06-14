import { lazy, Suspense } from 'react';
import { useNav } from '../../store/navStore';
import { getLocus } from '../../palace/palaceData';
import { useAllItems } from '../../data/hooks';
import { WorldLoader } from '../world/WorldLoader';

// The 3D palace (and its ~1 MB Three.js engine) is loaded only when this screen
// is opened, so the rest of the app paints instantly — important on mobile data.
const PalaceCanvas = lazy(() =>
  import('../../scene/PalaceCanvas').then((m) => ({ default: m.PalaceCanvas })),
);

// The immersive palace view plus a detail sheet for the tapped locus, showing
// any content the user has placed there across their sets.
export function ExploreScreen() {
  const selectedIndex = useNav((s) => s.selectedIndex);
  const select = useNav((s) => s.select);
  const { data: items = [] } = useAllItems();

  const locus = selectedIndex ? getLocus(selectedIndex) : null;
  const here = items.filter((i) => i.locusIndex === selectedIndex);

  return (
    <div className="relative h-full w-full">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-slate-400">
            Loading the palace…
          </div>
        }
      >
        <PalaceCanvas />
      </Suspense>

      {/* Load a content set or card deck into the world. */}
      <div className="pointer-events-none absolute inset-x-0 top-2 z-20 mx-auto max-w-md px-3">
        <WorldLoader />
      </div>

      {locus && (
        <div className="absolute inset-x-0 bottom-16 z-20 mx-auto max-w-lg px-3">
          <div className="card pointer-events-auto max-h-[40vh] overflow-y-auto">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Location {locus.index}
                </div>
                <h3 className="text-lg font-semibold">{locus.name}</h3>
                <p className="text-sm text-slate-500">{locus.landmark}</p>
              </div>
              <button className="btn-ghost px-2 py-1 text-xs" onClick={() => select(null)}>
                Close
              </button>
            </div>

            {here.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nothing placed here yet. Add content in the Content tab.
              </p>
            ) : (
              <ul className="space-y-2">
                {here.map((item) => (
                  <li key={item.id} className="rounded-lg bg-slate-100 p-2 text-sm dark:bg-slate-800">
                    <p>{item.content}</p>
                    {item.association && (
                      <p className="mt-1 text-xs italic text-slate-500">💭 {item.association}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
