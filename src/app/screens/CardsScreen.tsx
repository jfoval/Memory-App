import { useMemo, useState } from 'react';
import {
  cardFromId,
  shuffledDeck,
  scoreDeck,
  makeSeed,
  RANKS,
  SUITS,
  SUIT_SYMBOLS,
} from '../../logic/cards';
import { getLocus } from '../../palace/palaceData';
import { useCardResults, useSaveCardResult } from '../../data/hooks';
import { useAuth } from '../../auth/authStore';
import { uuid, nowIso } from '../../lib/ids';

type Phase = 'setup' | 'study' | 'test' | 'results';

// Card-deck mode: shuffle from a seed, map each shuffled card onto a location,
// study, then recall the card at each location in order, timed and scored.
export function CardsScreen() {
  const uid = useAuth((s) => s.user?.id);
  const { data: history = [] } = useCardResults();
  const saveResult = useSaveCardResult();

  const [phase, setPhase] = useState<Phase>('setup');
  const [size, setSize] = useState(13);
  const [seed, setSeed] = useState(() => makeSeed());
  const [pos, setPos] = useState(0);
  const [recalled, setRecalled] = useState<(number | null)[]>([]);
  const [startMs, setStartMs] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  const deck = useMemo(() => shuffledDeck(seed, size), [seed, size]);

  const best = useMemo(() => {
    const full = history.filter((h) => h.deckOrder.length === size);
    const bestScore = full.reduce((m, h) => Math.max(m, h.score), 0);
    const bestTime = full
      .filter((h) => h.score >= 100)
      .reduce((m, h) => (m === 0 ? h.timeMs : Math.min(m, h.timeMs)), 0);
    return { bestScore, bestTime, plays: full.length };
  }, [history, size]);

  const startStudy = () => {
    setSeed(makeSeed());
    setPos(0);
    setPhase('study');
  };
  const startTest = () => {
    setRecalled(Array(size).fill(null));
    setPos(0);
    setStartMs(Date.now());
    setPhase('test');
  };
  const finish = (answers: (number | null)[]) => {
    const time = Date.now() - startMs;
    const result = scoreDeck(deck, answers);
    setFinalScore(result.score);
    setFinalTime(time);
    if (uid) {
      saveResult.mutate({
        id: uuid(),
        userId: uid,
        deckSeed: seed,
        deckOrder: deck,
        recalled: answers,
        score: result.score,
        timeMs: time,
        createdAt: nowIso(),
      });
    }
    setPhase('results');
  };

  if (phase === 'setup') {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="mx-auto max-w-md space-y-4">
          <h2 className="text-xl font-bold">Card deck</h2>
          <p className="text-sm text-slate-500">
            Memorise a shuffled deck by placing each card at a location, then recall the order.
          </p>
          <div className="card space-y-3">
            <p className="text-sm font-medium">Deck size</p>
            <div className="flex gap-2">
              {[13, 26, 52].map((n) => (
                <button
                  key={n}
                  className={`flex-1 rounded-lg py-2 text-sm ${
                    size === n ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                  onClick={() => setSize(n)}
                >
                  {n} cards
                </button>
              ))}
            </div>
            <button className="btn-primary w-full" onClick={startStudy}>
              Start
            </button>
          </div>
          <div className="card text-sm">
            <p className="font-medium">Your best ({size} cards)</p>
            <p className="text-slate-500">
              Best accuracy: {best.bestScore}% · Best time (100%):{' '}
              {best.bestTime ? `${(best.bestTime / 1000).toFixed(1)}s` : '—'} · {best.plays} plays
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'study') {
    const card = cardFromId(deck[pos]);
    const locus = getLocus(pos + 1)!;
    const red = card.suit === 'hearts' || card.suit === 'diamonds';
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-slate-400">
          Study · {pos + 1} / {size}
        </p>
        <h3 className="text-xl font-bold">
          {locus.index}. {locus.name}
        </h3>
        <div className={`text-7xl font-bold ${red ? 'text-red-500' : ''}`}>{card.label}</div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setPos((p) => Math.max(0, p - 1))} disabled={pos === 0}>
            ‹ Prev
          </button>
          {pos < size - 1 ? (
            <button className="btn-primary" onClick={() => setPos((p) => p + 1)}>
              Next ›
            </button>
          ) : (
            <button className="btn-primary" onClick={startTest}>
              Test recall →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'test') {
    const locus = getLocus(pos + 1)!;
    const submit = (rankIdx: number, suitIdx: number) => {
      const id = suitIdx * 13 + rankIdx;
      const copy = [...recalled];
      copy[pos] = id;
      setRecalled(copy);
      if (pos < size - 1) setPos((p) => p + 1);
      else finish(copy);
    };
    return <CardPicker pos={pos} size={size} locusName={`${locus.index}. ${locus.name}`} onSubmit={submit} />;
  }

  // results
  const result = scoreDeck(deck, recalled);
  return (
    <div className="h-full overflow-y-auto p-6 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <h2 className="text-2xl font-bold">Results</h2>
        <p className="text-5xl font-bold text-blue-600">{finalScore}%</p>
        <p className="text-slate-500">
          {result.correctCount} / {size} correct · {(finalTime / 1000).toFixed(1)}s
        </p>
        {result.wrongPositions.length > 0 && (
          <div className="card text-left text-sm">
            <p className="mb-2 font-medium">Missed positions</p>
            {result.wrongPositions.map((p) => (
              <div key={p} className="flex justify-between">
                <span>
                  {p + 1}. {getLocus(p + 1)!.name}
                </span>
                <span>
                  you: {recalled[p] !== null ? cardFromId(recalled[p]!).label : '—'} · was:{' '}
                  {cardFromId(deck[p]).label}
                </span>
              </div>
            ))}
          </div>
        )}
        <button className="btn-primary" onClick={() => setPhase('setup')}>
          Play again
        </button>
      </div>
    </div>
  );
}

function CardPicker({
  pos,
  size,
  locusName,
  onSubmit,
}: {
  pos: number;
  size: number;
  locusName: string;
  onSubmit: (rankIdx: number, suitIdx: number) => void;
}) {
  const [rank, setRank] = useState(0);
  const [suit, setSuit] = useState(0);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm text-slate-400">
        Recall · {pos + 1} / {size}
      </p>
      <h3 className="text-xl font-bold">{locusName}</h3>
      <div className="flex gap-2">
        <select className="input w-24" value={rank} onChange={(e) => setRank(+e.target.value)}>
          {RANKS.map((r, i) => (
            <option key={r} value={i}>
              {r}
            </option>
          ))}
        </select>
        <select className="input w-24" value={suit} onChange={(e) => setSuit(+e.target.value)}>
          {SUITS.map((s, i) => (
            <option key={s} value={i}>
              {SUIT_SYMBOLS[i]} {s}
            </option>
          ))}
        </select>
      </div>
      <button className="btn-primary" onClick={() => onSubmit(rank, suit)}>
        {pos === size - 1 ? 'Finish' : 'Next ›'}
      </button>
    </div>
  );
}
