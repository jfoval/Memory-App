import { useState } from 'react';
import { useAuth } from '../auth/authStore';

export function AuthScreen() {
  const { signIn, signUp, error, clearError, mode } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    clearError();
    if (isSignUp) await signUp(email, password);
    else await signIn(email, password);
    setBusy(false);
  };

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="card w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Memory Palace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Build memory routes on real maps you know.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600 dark:text-slate-300">Email</span>
            <input
              type="email"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600 dark:text-slate-300">Password</span>
            <input
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          className="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
          onClick={() => {
            setIsSignUp(!isSignUp);
            clearError();
          }}
        >
          {isSignUp ? 'Have an account? Sign in' : 'New here? Create an account'}
        </button>

        {mode === 'local' && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Running in local mode (no Supabase keys). Your data is stored privately on this device.
          </p>
        )}
      </div>
    </div>
  );
}
