import { useEffect, useState } from 'react';
import { useUi } from '../../store/uiStore';

// Street View is outdoors, along roads and sidewalks — so every idea here is an
// outdoor route you travel past building fronts, signs, and landmarks.
const PLACE_IDEAS = [
  {
    title: 'Your childhood neighborhood',
    why: 'Drive or walk the streets you grew up on — you can still name every house you pass.',
  },
  {
    title: 'Your daily commute',
    why: 'The exact route you drive or ride to work or school, landmark by landmark.',
  },
  {
    title: "The drive to a friend's or relative's house",
    why: 'A familiar route with memorable turns, signs, and corner buildings along the way.',
  },
  {
    title: 'Downtown in a favorite city',
    why: "A sidewalk you've walked many times — each storefront makes a distinct, vivid stop.",
  },
  {
    title: 'The street you live on now',
    why: 'Head out the front door and go past each house or building down the block, in order.',
  },
  {
    title: "A scenic drive you've done",
    why: 'A memorable stretch of highway, coast, or country road — turnoffs and views as stops.',
  },
  {
    title: 'Your route to a regular spot',
    why: 'The way to the gym, church, or coffee shop — use what you pass, not the inside.',
  },
  {
    title: 'A famous place, explored fresh',
    why: 'No familiar route handy? Learn a new one — Times Square, an old-town center, a boardwalk.',
  },
];

// The first screen on load: how the method works, the two game modes, how to fill
// each box, best practices, and the learning drill.
export function InstructionsScreen() {
  const setTab = useUi((s) => s.setTab);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mp:theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4 pb-8">
        <div>
          <h1 className="text-2xl font-bold">Memory Palace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your brain is far better at remembering <em>places</em> than facts. The Method of Loci
            turns that into a superpower: take a place you know, walk a fixed path through it, and at
            each spot leave a vivid, bizarre image of what you want to remember. To recall it, you
            just take the walk again — each spot hands back what you left there. It's how memory
            champions memorize whole decks of cards and pages of text, and you can learn a lot, fast,
            and actually keep it.
          </p>
        </div>

        <div className="card space-y-2">
          <h2 className="font-semibold">The basic idea</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>
              Pick an outdoor route you know well — your street, a commute, a neighborhood — or
              explore a new one in Street View.
            </li>
            <li>Drop a handful of <b>stops</b> (loci) along a path through it.</li>
            <li>At each stop, place one thing to remember plus a weird image that ties it there.</li>
            <li>Walk the route in your mind, in order, to recall everything.</li>
          </ol>
        </div>

        <div className="card space-y-3 border-blue-500/40">
          <div>
            <h2 className="font-semibold">📍 Not sure what place to pick?</h2>
            <p className="text-sm text-slate-500">
              You'll be walking it in Google Street View, so pick a <b>real outdoor route</b> you can
              picture with your eyes closed — streets and sidewalks you travel in a natural order,
              past house fronts, storefronts, and landmarks. A few that work especially well:
            </p>
          </div>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {PLACE_IDEAS.map((p) => (
              <li key={p.title} className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                <span className="font-semibold">{p.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{p.why}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">
            Tip: use a <b>different place for each topic</b> so your memories don't blur together —
            you can build as many routes as you like. Start small (5–10 stops); a long, familiar route
            can hold dozens.
          </p>
        </div>

        <h2 className="pt-1 text-lg font-bold">Two ways to play</h2>

        <div className="card space-y-2">
          <h3 className="font-semibold">🃏 Practice mode — playing cards</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Great for training the skill itself. Choose your stops at a location, then tap{' '}
            <b>🃏 Deal</b> — the app drops a random playing card at each stop. Learn them with the
            drill below, then hit <b>Test</b>: at each stop you name the card from a menu. See how
            many you can get <b>in a row</b> — your best streak is saved, so you can watch yourself
            get better over time.
          </p>
        </div>

        <div className="card space-y-2">
          <h3 className="font-semibold">✍️ Your own material</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Memorizing something specific? Skip the cards and just type it at each stop — Bible
            verses, a grocery list, the U.S. state capitals, a speech, vocabulary, anything. Use{' '}
            <b>Walk</b> mode to study, revealing each stop to quiz yourself.
          </p>
        </div>

        <h2 className="pt-1 text-lg font-bold">Filling in a stop</h2>
        <div className="card space-y-3 text-sm">
          <div>
            <p className="font-semibold">The place</p>
            <p className="text-slate-500">
              A name for the spot that's instantly obvious to you — “the red door”, “Joe's Diner”,
              “the big oak”.
            </p>
          </div>
          <div>
            <p className="font-semibold">What to remember</p>
            <p className="text-slate-500">
              The actual item — your verse, list entry, or the playing card dealt here.
            </p>
          </div>
          <div>
            <p className="font-semibold">Your vivid association</p>
            <p className="text-slate-500">
              The strange little scene that glues the item to the place. This is the real work — see
              the next section.
            </p>
          </div>
        </div>

        <h2 className="pt-1 text-lg font-bold">Best practices</h2>
        <div className="card space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <b>Use spots you know cold.</b> Real places you can picture with your eyes shut. The
              familiarity does half the work.
            </li>
            <li>
              <b>One item per spot.</b> Don't crowd a single place with several things — give each its
              own stop.
            </li>
            <li>
              <b>Overload the image.</b> The more your brain can grab onto, the stickier it is. Make
              it huge, loud, moving, funny, gross, or impossible.
            </li>
            <li>
              <b>Put the item inside the action.</b> Don't picture the 7♠ just sitting there — picture
              the dog at that house gulping down a giant <b>7 of spades</b> and choking on it.
              Whatever you're memorizing has to be <em>in</em> the scene.
            </li>
            <li>
              <b>Use senses, motion, and emotion.</b> Hear it, smell it, feel it, react to it. Still,
              silent pictures fade; loud moving ones stick.
            </li>
            <li>
              <b>Always walk the same direction,</b> stop 1 → 2 → 3. The fixed order is the thread
              your memories hang on.
            </li>
            <li>
              <b>Invent your own images.</b> The effort of making them up is exactly what locks them
              in — so the app never makes them for you.
            </li>
          </ul>
        </div>

        <h2 className="pt-1 text-lg font-bold">How to actually learn a route</h2>
        <div className="card space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>Once every stop has a name, an item, and a vivid image, drill it like this:</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Go to <b>stop 1</b>. Really be there. Say its name out loud, say the item, and watch
              your weird image happen in full detail. Hold it for 3–5 seconds.
            </li>
            <li>Go to <b>stop 2</b> and do the same.</li>
            <li>
              Go <b>back to 1</b> and recall it from memory, then <b>2</b>.
            </li>
            <li>
              Go to <b>stop 3</b>, build it, hold it — then run <b>1 → 2 → 3</b> from the start.
            </li>
            <li>
              Keep stacking: add the next stop, then always run from stop 1. This spacing burns the
              whole route in.
            </li>
            <li>
              When you can walk the whole thing, switch to <b>Walk</b> (reveal/hide) or <b>Test</b>{' '}
              to prove it.
            </li>
          </ol>
        </div>

        <button className="btn-primary w-full" onClick={() => setTab('routes')}>
          Start building →
        </button>

        <div className="card flex items-center justify-between text-sm">
          <span>Dark mode</span>
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
        </div>
      </div>
    </div>
  );
}
