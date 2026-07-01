import { useUi, type Tab } from '../store/uiStore';
import { useAuth } from '../auth/authStore';
import { RoutesScreen } from './screens/RoutesScreen';
import { InstructionsScreen } from './screens/InstructionsScreen';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'instructions', label: 'Instructions', icon: '📖' },
  { id: 'routes', label: 'Routes', icon: '🗺️' },
];

export function AppShell() {
  const { tab, setTab } = useUi();
  const { user, signOut, mode } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <header className="z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <span className="font-semibold">Memory Palace</span>
          {mode === 'local' && (
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">
              local
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:inline">{user?.email}</span>
          <button className="btn-ghost px-2 py-1 text-xs" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {tab === 'routes' && <RoutesScreen />}
        {tab === 'instructions' && <InstructionsScreen />}
      </main>

      <nav
        className="z-10 grid grid-cols-2 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              tab === t.id ? 'text-blue-600' : 'text-slate-500'
            }`}
            aria-current={tab === t.id}
          >
            <span className="text-lg" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
