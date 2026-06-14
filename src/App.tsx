import { useEffect } from 'react';
import { useAuth } from './auth/authStore';
import { AuthScreen } from './app/AuthScreen';
import { AppShell } from './app/AppShell';
import { repository } from './data/repository';

export default function App() {
  const { user, loading, init } = useAuth();

  useEffect(() => {
    void init();
  }, [init]);

  // Flush any queued offline writes once on load.
  useEffect(() => {
    if (user) void repository.flush();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-slate-400">Loading…</div>
    );
  }

  return user ? <AppShell /> : <AuthScreen />;
}
