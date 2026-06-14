import { useEffect, useState } from 'react';
import { enableEmbeddings, isEmbeddingEnabled } from '../../embeddings/embeddingService';
import { ZONES, ZONE_IDS } from '../../palace/zones';
import { useNav } from '../../store/navStore';

const STEPS = [
  {
    title: 'Make it vivid and absurd',
    body: 'Ordinary images fade. Picture things that are huge, bizarre, on fire, or impossibly out of place. The stranger the image, the stickier the memory.',
  },
  {
    title: 'Use all your senses',
    body: 'Hear the sizzle, smell the smoke, feel the cold. Multi-sensory images are recalled far more reliably than a flat picture.',
  },
  {
    title: 'Add motion and interaction',
    body: 'Let your images move and collide with the location. A pie exploding on the kitchen counter beats a pie sitting quietly.',
  },
  {
    title: 'Generate your own associations',
    body: 'The app never invents images for you — and that is the point. The effort of creating your own link is exactly what cements it.',
  },
  {
    title: 'Walk the same route every time',
    body: 'Always travel locations 1 → 52 in order. The fixed route is the thread your memories hang on.',
  },
];

export function LearnScreen() {
  const [embedOn, setEmbedOn] = useState(isEmbeddingEnabled());
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const reducedMotion = useNav((s) => s.reducedMotion);
  const setReducedMotion = useNav((s) => s.setReducedMotion);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mp:theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-xl font-bold">The Method of Loci</h2>
        <p className="text-sm text-slate-500">
          Place what you want to remember at fixed locations along a familiar route, then walk the
          route to recall it. You share one carefully designed 52-location palace with everyone —
          learn it once, deeply, and reuse it forever.
        </p>

        <div className="card">
          <h3 className="mb-2 font-semibold">The four zones</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {ZONE_IDS.map((id) => (
              <div key={id} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ZONES[id].tint }} />
                <span>
                  <strong>
                    {ZONES[id].suit} {ZONES[id].name}
                  </strong>{' '}
                  — {ZONES[id].theme}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {STEPS.map((s, i) => (
            <div key={i} className="card">
              <h3 className="font-semibold">
                {i + 1}. {s.title}
              </h3>
              <p className="text-sm text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold">Settings</h3>

          <label className="flex items-center justify-between text-sm">
            <span>
              Smart (semantic) scoring
              <span className="block text-xs text-slate-400">
                Loads a small model in your browser. No data leaves your device.
              </span>
            </span>
            <button
              className={embedOn ? 'btn-primary text-xs' : 'btn-ghost text-xs'}
              onClick={() => {
                enableEmbeddings();
                setEmbedOn(true);
              }}
              disabled={embedOn}
            >
              {embedOn ? 'Enabled' : 'Enable'}
            </button>
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Dark mode</span>
            <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Reduced motion (instant camera moves)</span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
