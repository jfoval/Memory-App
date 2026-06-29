import { useRoutes } from '../store/routesStore';
import { streetViewLink } from './streetview';

// Bottom sheet to edit the selected pin: the place name, what to remember there,
// a vivid association, plus a free "Street View" link and reorder/delete.
export function PointPanel() {
  const route = useRoutes((s) => s.route);
  const selectedId = useRoutes((s) => s.selectedId);
  const update = useRoutes((s) => s.update);
  const remove = useRoutes((s) => s.remove);
  const move = useRoutes((s) => s.move);
  const select = useRoutes((s) => s.select);

  const point = route?.points.find((p) => p.id === selectedId);
  if (!point) return null;

  return (
    <div className="absolute inset-x-0 bottom-3 z-30 mx-auto max-w-lg px-3">
      <div className="card pointer-events-auto max-h-[55vh] space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Stop {point.order}</span>
          <div className="flex gap-1">
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => move(point.id, -1)}>
              ↑
            </button>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => move(point.id, 1)}>
              ↓
            </button>
            <a
              className="btn-ghost px-2 py-1 text-xs"
              href={streetViewLink(point.lat, point.lng)}
              target="_blank"
              rel="noreferrer"
            >
              Street View ↗
            </a>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => select(null)}>
              Close
            </button>
          </div>
        </div>

        <input
          className="input text-sm"
          placeholder="The place (e.g. the oak tree, Joe's Diner)"
          value={point.label}
          onChange={(e) => update(point.id, { label: e.target.value })}
        />
        <textarea
          className="input text-sm"
          placeholder="What to remember here"
          value={point.content}
          onChange={(e) => update(point.id, { content: e.target.value })}
        />
        <input
          className="input text-sm"
          placeholder="Your vivid association (optional)"
          value={point.association}
          onChange={(e) => update(point.id, { association: e.target.value })}
        />
        <button className="btn-danger w-full text-xs" onClick={() => remove(point.id)}>
          Delete stop
        </button>
      </div>
    </div>
  );
}
