import { useEffect, useState } from 'react';
import { useRoutes } from '../store/routesStore';
import { RANKS, SUITS, SUIT_SYMBOLS } from '../logic/cards';
import { CardBadge } from './CardBadge';

// Test mode: walk the route and name the playing card at each stop. It's a
// survival run — keep going until your first miss; the app saves your best
// streak so you can see yourself improve.
export function TestOverlay() {
  const route = useRoutes((s) => s.route)!;
  const walkIndex = useRoutes((s) => s.walkIndex);
  const walkTo = useRoutes((s) => s.walkTo);
  const recordTestScore = useRoutes((s) => s.recordTestScore);

  const [phase, setPhase] = useState<'guess' | 'correct' | 'wrong' | 'done'>('guess');
  const [guess, setGuess] = useState<number | ''>('');
  const [endStreak, setEndStreak] = useState(0);
  const [prevBest, setPrevBest] = useState(route.bestStreak ?? 0);

  const total = route.points.length;
  const point = route.points[walkIndex];
  const hasCards = route.points.some((p) => p.card != null);

  // Reset the picker whenever we move to a different stop.
  useEffect(() => {
    setPhase('guess');
    setGuess('');
  }, [walkIndex]);

  if (!point) return null;

  if (!hasCards) {
    return (
      <Shell>
        <p className="text-sm">
          Test mode quizzes you on playing cards. Switch to <b>Edit</b> and tap{' '}
          <b>🃏 Deal cards</b> to place a random card at each stop, learn them, then come back.
        </p>
      </Shell>
    );
  }

  const finish = (streak: number) => {
    setPrevBest(route.bestStreak ?? 0);
    setEndStreak(streak);
    recordTestScore(streak, total);
  };

  const submit = () => {
    if (guess === '') return;
    if (guess === point.card) {
      if (walkIndex >= total - 1) {
        finish(total);
        setPhase('done');
      } else {
        setPhase('correct');
      }
    } else {
      finish(walkIndex); // walkIndex cards were named correctly before this miss
      setPhase('wrong');
    }
  };

  const restart = () => {
    setEndStreak(0);
    walkTo(0); // effect resets phase + guess
  };

  const best = route.bestStreak ?? 0;

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {point.order}. {point.label || 'Stop'}
        </span>
        <span className="text-xs text-slate-400">
          streak {phase === 'correct' ? walkIndex + 1 : walkIndex} · best {best}
        </span>
      </div>

      {phase === 'guess' && (
        <>
          <p className="text-sm text-slate-500">Which playing card lives at this spot?</p>
          <select
            className="input text-sm"
            value={guess}
            onChange={(e) => setGuess(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Pick a card…</option>
            {SUITS.map((suit, si) => (
              <optgroup key={suit} label={`${suit[0].toUpperCase()}${suit.slice(1)} ${SUIT_SYMBOLS[si]}`}>
                {RANKS.map((rank, ri) => (
                  <option key={si * 13 + ri} value={si * 13 + ri}>
                    {rank} {SUIT_SYMBOLS[si]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button className="btn-primary w-full" disabled={guess === ''} onClick={submit}>
            Guess
          </button>
        </>
      )}

      {phase === 'correct' && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-green-600">✓ Correct!</span>
          <button className="btn-primary" onClick={() => walkTo(walkIndex + 1)}>
            Next stop ›
          </button>
        </div>
      )}

      {(phase === 'wrong' || phase === 'done') && (
        <div className="space-y-2">
          {phase === 'wrong' ? (
            <div className="flex items-center gap-3">
              {point.card != null && <CardBadge cardId={point.card} size="md" />}
              <div className="text-sm">
                <p className="font-semibold text-red-600">Not quite — it was this card.</p>
                <p className="text-slate-500">
                  You named <b>{endStreak}</b> in a row.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-green-600">
              🎉 Perfect! All {total} in a row.
            </p>
          )}
          {endStreak > prevBest && endStreak > 0 && (
            <p className="text-sm font-semibold text-amber-500">★ New best streak: {endStreak}!</p>
          )}
          <button className="btn-primary w-full" onClick={restart}>
            Play again from stop 1
          </button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 mx-auto max-w-lg px-3">
      <div className="card pointer-events-auto space-y-2">{children}</div>
    </div>
  );
}
