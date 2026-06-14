import { create } from 'zustand';
import { hasSupabase, supabase } from '../lib/supabase';
import { repository } from '../data/repository';
import { uuid } from '../lib/ids';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  mode: 'local' | 'supabase';
  init: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const LOCAL_SESSION = 'mp:localSession:v1';

// Local accounts (no Supabase keys): deterministic user id per email so the same
// email always maps to the same private data on this device. Not real auth — it
// exists so every feature is usable without a backend.
function localUserId(email: string): string {
  const key = `mp:localUid:${email.toLowerCase()}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = uuid();
    localStorage.setItem(key, id);
  }
  return id;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  mode: hasSupabase ? 'supabase' : 'local',

  async init() {
    if (hasSupabase && supabase) {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      set({ user: u ? { id: u.id, email: u.email ?? '' } : null, loading: false });
      supabase.auth.onAuthStateChange((_event, session) => {
        const su = session?.user;
        set({ user: su ? { id: su.id, email: su.email ?? '' } : null });
        if (su) void repository.ensureProfile(su.id, su.email ?? '');
      });
      if (u) await repository.ensureProfile(u.id, u.email ?? '');
    } else {
      const raw = localStorage.getItem(LOCAL_SESSION);
      const user = raw ? (JSON.parse(raw) as AuthUser) : null;
      if (user) await repository.ensureProfile(user.id, user.email);
      set({ user, loading: false });
    }
  },

  async signUp(email, password) {
    set({ error: null });
    if (hasSupabase && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return set({ error: error.message });
      if (data.user) await repository.ensureProfile(data.user.id, email);
    } else {
      await get().signIn(email, password);
    }
  },

  async signIn(email, password) {
    set({ error: null });
    if (!email.includes('@')) return set({ error: 'Enter a valid email address.' });
    if (password.length < 6) return set({ error: 'Password must be at least 6 characters.' });
    if (hasSupabase && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return set({ error: error.message });
    } else {
      const user: AuthUser = { id: localUserId(email), email };
      localStorage.setItem(LOCAL_SESSION, JSON.stringify(user));
      await repository.ensureProfile(user.id, user.email);
      set({ user });
    }
  },

  async signOut() {
    if (hasSupabase && supabase) await supabase.auth.signOut();
    localStorage.removeItem(LOCAL_SESSION);
    repository.clearLocalCache();
    set({ user: null });
  },

  clearError() {
    set({ error: null });
  },
}));
