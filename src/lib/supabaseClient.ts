import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.PUBLIC_SUPABASE_URL as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseAnonKey =
  (import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined);

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('[Supabase] Missing SUPABASE env (PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) or (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY). Auth features disabled.');
}

// Minimal mock to avoid runtime crashes when env is missing
const mock = {
  auth: {
    async getUser() { return { data: { user: null } } as any; },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } as any; },
    async signInWithOtp() { return { error: { message: 'Supabase not configured' } } as any; },
    async signInWithPassword() { return { error: { message: 'Supabase not configured' } } as any; },
    async signUp() { return { error: { message: 'Supabase not configured' } } as any; },
    async resetPasswordForEmail() { return { error: { message: 'Supabase not configured' } } as any; },
    async updateUser() { return { error: { message: 'Supabase not configured' } } as any; },
    async resend() { return { error: { message: 'Supabase not configured' } } as any; },
    async signOut() { return; },
  },
  from() {
    return {
      select: () => ({
        data: [],
        error: { message: 'Supabase not configured' },
        maybeSingle: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      }),
      insert: () => ({ error: { message: 'Supabase not configured' } }),
      upsert: () => ({ error: { message: 'Supabase not configured' } }),
      delete: () => ({ error: { message: 'Supabase not configured' } }),
      eq: () => ({ data: [], error: { message: 'Supabase not configured' } }),
      order: () => ({ data: [], error: { message: 'Supabase not configured' } }),
    } as any;
  },
} as unknown as SupabaseClient;

export const supabase = (client ?? mock);
export const isSupabaseEnabled = !!client;
