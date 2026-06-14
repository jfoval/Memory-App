import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Keys are public by design and safe in the client. When they are absent (or
// left as the example placeholder) the app runs entirely on a local backend so
// every feature is usable without a Supabase project.
export const hasSupabase =
  !!url && !!anonKey && !url.includes('your-project') && !anonKey.includes('your-anon');

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
