import { useRef } from 'react';
import { useNav } from '../store/navStore';

// On-screen joystick (left) to move and a look pad (right) to drag-look. Shown
// only in free-roam on coarse-pointer (touch) devices.
export function TouchControls() {
  const controlMode = useNav((s) => s.controlMode);
  const setMove = useNav((s) => s.setMove);
  const addLook = useNav((s) => s.addLook);

  const knob = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const lookLast = useRef<{ x: number; y: number } | null>(null);

  const coarse =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  if (controlMode !== 'free' || !coarse) return null;

  const onJoyMove = (e: React.PointerEvent) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = rect.width / 2;
    const dist = Math.hypot(dx, dy);
    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    setMove(dx / max, -dy / max);
  };
  const endJoy = () => {
    if (knob.current) knob.current.style.transform = 'translate(0,0)';
    setMove(0, 0);
  };

  const onLookMove = (e: React.PointerEvent) => {
    if (!lookLast.current) return;
    addLook(e.clientX - lookLast.current.x, e.clientY - lookLast.current.y);
    lookLast.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <>
      <div
        ref={baseRef}
        className="absolute bottom-24 left-6 h-32 w-32 touch-none rounded-full border border-white/30 bg-white/10"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onJoyMove(e);
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && onJoyMove(e)}
        onPointerUp={endJoy}
        onPointerCancel={endJoy}
        aria-label="Movement joystick"
      >
        <div
          ref={knob}
          className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70"
        />
      </div>

      <div
        className="absolute bottom-24 right-6 flex h-32 w-32 touch-none items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs text-white/60"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          lookLast.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={onLookMove}
        onPointerUp={() => (lookLast.current = null)}
        onPointerCancel={() => (lookLast.current = null)}
        aria-label="Look pad"
      >
        drag to look
      </div>
    </>
  );
}
