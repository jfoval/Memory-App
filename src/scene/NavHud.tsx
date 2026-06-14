import { useNav } from '../store/navStore';
import { getLocus } from '../palace/palaceData';
import { ZONES } from '../palace/zones';

// HTML overlay above the canvas: guided walk (prev/next), current locus, and the
// mode/label toggles. Pointer events are limited to the controls so canvas
// gestures still pass through everywhere else.
export function NavHud() {
  const { controlMode, labelsVisible, arrivedIndex, setControlMode, toggleLabels, next, prev } =
    useNav();
  const locus = getLocus(arrivedIndex);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
      {/* Top bar: current locus + toggles. */}
      <div className="flex items-start justify-between gap-2">
        {locus && (
          <div className="pointer-events-auto rounded-lg bg-black/55 px-3 py-2 text-white backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-white/60">
              Zone {locus.zone} · {ZONES[locus.zone].name}
            </div>
            <div className="text-base font-semibold">
              {locus.index}. {locus.name}
            </div>
            <div className="text-xs text-white/70">{locus.landmark}</div>
          </div>
        )}
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="flex overflow-hidden rounded-lg border border-white/20 text-xs">
            <button
              className={`px-3 py-2 ${controlMode === 'guided' ? 'bg-blue-600 text-white' : 'bg-black/50 text-white/80'}`}
              onClick={() => setControlMode('guided')}
            >
              Guided
            </button>
            <button
              className={`px-3 py-2 ${controlMode === 'free' ? 'bg-blue-600 text-white' : 'bg-black/50 text-white/80'}`}
              onClick={() => setControlMode('free')}
            >
              Free-roam
            </button>
          </div>
          <button
            className="pointer-events-auto rounded-lg bg-black/50 px-3 py-2 text-xs text-white/90"
            onClick={toggleLabels}
          >
            {labelsVisible ? 'Hide labels' : 'Show labels'}
          </button>
        </div>
      </div>

      {/* Bottom bar: guided walk controls. */}
      <div className="flex items-center justify-center gap-3">
        <button
          className="pointer-events-auto rounded-full bg-black/60 px-5 py-3 text-white disabled:opacity-40"
          onClick={prev}
          disabled={arrivedIndex <= 1}
          aria-label="Previous location"
        >
          ‹ Prev
        </button>
        <div className="pointer-events-auto rounded-full bg-black/60 px-4 py-3 text-sm text-white">
          {arrivedIndex} / 52
        </div>
        <button
          className="pointer-events-auto rounded-full bg-black/60 px-5 py-3 text-white disabled:opacity-40"
          onClick={next}
          disabled={arrivedIndex >= 52}
          aria-label="Next location"
        >
          Next ›
        </button>
      </div>

      {controlMode === 'free' && (
        <div className="pointer-events-none absolute inset-x-0 top-20 text-center text-xs text-white/50">
          <span className="hidden sm:inline">WASD to move · click + drag (or mouse-look) to turn</span>
        </div>
      )}
    </div>
  );
}
