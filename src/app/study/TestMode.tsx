import { useMemo, useState } from 'react';
import { useItems, useReviews, useSaveReview } from '../../data/hooks';
import { getLocus } from '../../palace/palaceData';
import { scoreAnswer, buildChoices, type ScoreResult } from '../../logic/scoring';
import { review as sm2, initialSrs } from '../../logic/scheduling';
import { embed, isEmbeddingEnabled } from '../../embeddings/embeddingService';
import { useAuth } from '../../auth/authStore';
import { uuid, nowIso } from '../../lib/ids';
import type { Review } from '../../types';

interface Props {
  setId: string;
  onExit: () => void;
}

// Prompt recall at each placed location, score it (lexical, plus semantic when
// the model is loaded), show the band, and write an SM-2 review record. A
// multiple-choice fallback is available per item.
export function TestMode({ setId, onExit }: Props) {
  const uid = useAuth((s) => s.user?.id);
  const { data: items = [] } = useItems(setId);
  const { data: reviews = [] } = useReviews();
  const saveReview = useSaveReview();

  const placed = useMemo(() => [...items].sort((a, b) => a.locusIndex - b.locusIndex), [items]);
  const reviewByItem = useMemo(
    () => new Map(reviews.map((r) => [r.itemId, r])),
    [reviews],
  );

  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [showChoices, setShowChoices] = useState(false);
  const [checking, setChecking] = useState(false);

  if (placed.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        Nothing to test yet.
        <button className="btn-ghost ml-2" onClick={onExit}>
          Back
        </button>
      </div>
    );
  }

  const done = i >= placed.length;
  if (done) {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <h2 className="text-2xl font-bold">Test complete</h2>
        <p className="text-5xl font-bold text-blue-600">{avg}%</p>
        <p className="text-slate-500">
          {scores.filter((s) => s >= 85).length} of {scores.length} recalled well.
        </p>
        <button className="btn-primary" onClick={onExit}>
          Done
        </button>
      </div>
    );
  }

  const item = placed[i];
  const locus = getLocus(item.locusIndex)!;
  const choices = showChoices
    ? buildChoices(item.content, placed.map((p) => p.content))
    : [];

  const recordReview = (score: number) => {
    if (!uid) return;
    const prior = reviewByItem.get(item.id);
    const state = prior
      ? { repetitions: prior.repetitions, intervalDays: prior.intervalDays, easeFactor: prior.easeFactor }
      : initialSrs;
    const upd = sm2(state, score);
    const record: Review = {
      id: prior?.id ?? uuid(),
      userId: uid,
      itemId: item.id,
      repetitions: upd.repetitions,
      intervalDays: upd.intervalDays,
      easeFactor: upd.easeFactor,
      scheduledFor: upd.scheduledFor,
      lastReviewed: nowIso(),
      lastScore: score,
      updatedAt: nowIso(),
    };
    saveReview.mutate(record);
  };

  const check = async () => {
    setChecking(true);
    let answerEmbedding: number[] | null = null;
    if (isEmbeddingEnabled() && item.embedding) answerEmbedding = await embed(answer);
    const r = scoreAnswer(item.content, answer, {
      conceptMode: item.contentType === 'concept',
      answerEmbedding,
      expectedEmbedding: item.embedding ?? null,
    });
    setResult(r);
    recordReview(r.score);
    setScores((s) => [...s, r.score]);
    setChecking(false);
  };

  const pickChoice = (choice: string) => {
    const score = choice === item.content ? 100 : 0;
    setResult(scoreAnswer(item.content, choice));
    recordReview(score);
    setScores((s) => [...s, score]);
  };

  const next = () => {
    setI((p) => p + 1);
    setAnswer('');
    setResult(null);
    setShowChoices(false);
  };

  const bandColor =
    result?.band === 'correct'
      ? 'text-green-600'
      : result?.band === 'partial'
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="flex items-center justify-between">
          <button className="btn-ghost px-2 py-1 text-sm" onClick={onExit}>
            ‹ Quit
          </button>
          <span className="text-sm text-slate-400">
            {i + 1} / {placed.length}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm text-slate-400">What did you place at</p>
          <h2 className="text-2xl font-bold">
            {locus.index}. {locus.name}?
          </h2>
          <p className="text-sm text-slate-500">{locus.landmark}</p>

          {!result && !showChoices && (
            <div className="mt-6 w-full space-y-2">
              <textarea
                className="input"
                placeholder="Type what you remember…"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button className="btn-primary flex-1" onClick={check} disabled={checking}>
                  {checking ? 'Scoring…' : 'Check'}
                </button>
                <button className="btn-ghost" onClick={() => setShowChoices(true)}>
                  Multiple choice
                </button>
              </div>
            </div>
          )}

          {showChoices && !result && (
            <div className="mt-6 grid w-full gap-2">
              {choices.map((c, idx) => (
                <button key={idx} className="btn-ghost text-left" onClick={() => pickChoice(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {result && (
            <div className="mt-6 w-full space-y-2">
              <p className={`text-3xl font-bold ${bandColor}`}>{result.score}%</p>
              <p className="text-sm uppercase tracking-wide text-slate-400">{result.band}</p>
              <div className="card text-left">
                <p className="text-xs text-slate-400">Correct answer</p>
                <p>{item.content}</p>
                {result.usedSemantic && (
                  <p className="mt-1 text-xs text-slate-400">
                    semantic {result.semantic}% · lexical {result.lexical}%
                  </p>
                )}
              </div>
              <button className="btn-primary w-full" onClick={next}>
                {i === placed.length - 1 ? 'See results' : 'Next ›'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
