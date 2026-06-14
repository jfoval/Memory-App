import { useMemo, useState } from 'react';
import { useAllItems, useReviews, useSaveReview } from '../../data/hooks';
import { getLocus } from '../../palace/palaceData';
import { isDue, review as sm2, initialSrs } from '../../logic/scheduling';
import { scoreAnswer, type ScoreResult } from '../../logic/scoring';
import { useAuth } from '../../auth/authStore';
import { uuid, nowIso } from '../../lib/ids';
import type { Item, Review } from '../../types';

// "Due today" across all of a user's sets, driven by SM-2 scheduling.
export function ReviewScreen() {
  const uid = useAuth((s) => s.user?.id);
  const { data: items = [] } = useAllItems();
  const { data: reviews = [] } = useReviews();
  const saveReview = useSaveReview();

  const reviewByItem = useMemo(() => new Map(reviews.map((r) => [r.itemId, r])), [reviews]);
  const due = useMemo(
    () => items.filter((it) => isDue(reviewByItem.get(it.id)?.scheduledFor)),
    [items, reviewByItem],
  );

  const [queue] = useState<Item[]>(() => due);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ScoreResult | null>(null);

  if (items.length === 0) {
    return <Empty msg="Add some content sets first, then come back to review." />;
  }
  if (queue.length === 0) {
    return <Empty msg="🎉 Nothing due right now. Come back later." />;
  }
  if (i >= queue.length) {
    return <Empty msg="✅ Review session complete. Great work!" />;
  }

  const item = queue[i];
  const locus = getLocus(item.locusIndex)!;

  const check = () => {
    const r = scoreAnswer(item.content, answer, {
      conceptMode: item.contentType === 'concept',
    });
    setResult(r);
    if (uid) {
      const prior = reviewByItem.get(item.id);
      const state = prior
        ? {
            repetitions: prior.repetitions,
            intervalDays: prior.intervalDays,
            easeFactor: prior.easeFactor,
          }
        : initialSrs;
      const upd = sm2(state, r.score);
      const record: Review = {
        id: prior?.id ?? uuid(),
        userId: uid,
        itemId: item.id,
        repetitions: upd.repetitions,
        intervalDays: upd.intervalDays,
        easeFactor: upd.easeFactor,
        scheduledFor: upd.scheduledFor,
        lastReviewed: nowIso(),
        lastScore: r.score,
        updatedAt: nowIso(),
      };
      saveReview.mutate(record);
    }
  };

  const next = () => {
    setI((p) => p + 1);
    setAnswer('');
    setResult(null);
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="text-sm text-slate-400">
          Due today · {i + 1} / {queue.length}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold">
            {locus.index}. {locus.name}
          </h2>
          <p className="text-sm text-slate-500">{locus.landmark}</p>

          {!result ? (
            <div className="mt-6 w-full space-y-2">
              <textarea
                className="input"
                placeholder="What did you place here?"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoFocus
              />
              <button className="btn-primary w-full" onClick={check}>
                Check
              </button>
            </div>
          ) : (
            <div className="mt-6 w-full space-y-2">
              <p className="text-3xl font-bold text-blue-600">{result.score}%</p>
              <div className="card text-left">
                <p className="text-xs text-slate-400">Answer</p>
                <p>{item.content}</p>
              </div>
              <button className="btn-primary w-full" onClick={next}>
                {i === queue.length - 1 ? 'Finish' : 'Next ›'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
      {msg}
    </div>
  );
}
