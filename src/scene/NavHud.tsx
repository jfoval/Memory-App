import { useNav } from '../store/navStore';
import { getLocus } from '../palace/palaceData';
import { ROOMS, roomById } from '../palace/rooms';

// HTML overlay above the photo-sphere: current room + locus, the guided walk
// (prev/next), room jump dots, and the label toggle. Drag anywhere else to look.
export function NavHud() {
  const { labelsVisible, arrivedIndex, toggleLabels, next, prev, gotoRoom } = useNav();
  const locus = getLocus(arrivedIndex);
  const room = locus ? roomById(locus.roomId) : ROOMS[0];

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
      {/* Top: where you are + label toggle. */}
      <div className="flex items-start justify-between gap-2">
        {locus && (
          <div className="pointer-events-auto rounded-lg bg-black/55 px-3 py-2 text-white backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-white/60">{room.name}</div>
            <div className="text-base font-semibold">
              {locus.index}. {locus.name}
            </div>
            <div className="text-xs text-white/70">{room.theme}</div>
          </div>
        )}
        <button
          className="pointer-events-auto rounded-lg bg-black/50 px-3 py-2 text-xs text-white/90"
          onClick={toggleLabels}
        >
          {labelsVisible ? 'Hide markers' : 'Show markers'}
        </button>
      </div>

      {/* Room jump dots. */}
      <div className="pointer-events-none flex justify-center">
        <div className="pointer-events-auto flex gap-1.5 rounded-full bg-black/50 px-3 py-2">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              onClick={() => gotoRoom(r.id)}
              title={r.name}
              className="h-3 w-3 rounded-full border border-white/40"
              style={{ backgroundColor: r.id === room.id ? r.accent : 'transparent' }}
              aria-label={`Go to ${r.name}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom: guided walk through the 52 loci. */}
      <div className="flex items-center justify-center gap-3">
        <button
          className="pointer-events-auto rounded-full bg-black/60 px-5 py-3 text-white disabled:opacity-40"
          onClick={prev}
          disabled={arrivedIndex <= 1}
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
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
