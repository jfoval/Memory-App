import { useEffect, useState } from 'react';
import { enableEmbeddings, isEmbeddingEnabled } from '../../embeddings/embeddingService';

const STEPS = [
  {
    title: 'Use a route you already know',
    body: 'Pick a walk, a commute, or your own home — a path you can already picture with your eyes closed. Familiarity with the place is what makes the memories stick.',
  },
  {
    title: 'Make each image vivid and absurd',
    body: 'At each stop, picture what you want to remember as something huge, bizarre, on fire, or impossibly out of place. The stranger the image, the stickier.',
  },
  {
    title: 'Use all your senses and motion',
    body: 'Hear it, smell it, feel it, let it move and collide with the spot. Multi-sensory, moving images are recalled far more reliably than a flat picture.',
  },
  {
    title: 'Generate your own associations',
    body: 'The app never invents the images for you — that is the point. The effort of creating your own link is exactly what cements it.',
  },
  {
    title: 'Always walk the route in the same order',
    body: 'Travel your stops 1 → N in the same direction every time. The fixed path is the thread your memories hang on.',
  },
];

export function LearnScreen() {
  const [embedOn, setEmbedOn] = useState(isEmbeddingEnabled());
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mp:theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-xl font-bold">The Method of Loci</h2>
        <p className="text-sm text-slate-500">
          Place what you want to remember at fixed spots along a route you know, then walk the route
          in your mind to recall it. Build your routes on the map in the Routes tab — use real paths
          you have actually walked, so you already know every sight along the way.
        </p>

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
        </div>
      </div>
    </div>
  );
}
