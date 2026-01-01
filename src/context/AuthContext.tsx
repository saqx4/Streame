import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseEnabled } from '../lib/supabaseClient';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEV_USER_STORAGE_KEY = 'streame.devUser';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      try {
        const stored = localStorage.getItem(DEV_USER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed?.id === 'string' && typeof parsed?.email === 'string') {
            setUser(parsed as any);
          }
        }
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }

    let isMounted = true;
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(user ?? null);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // If Supabase sends a PASSWORD_RECOVERY event, we can route user to reset page
      if (event === 'PASSWORD_RECOVERY') {
        const url = new URL(window.location.href);
        // Ensure we are on reset route so the user can set a new password
        if (!url.pathname.includes('/reset-password')) {
          window.location.assign('/reset-password');
        }
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      isMounted = false;
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseEnabled) {
      if (!email || !password) return { error: 'Missing email or password' };
      const mockUser = { id: `local-${email}`, email };
      try {
        localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(mockUser));
      } catch {
        // ignore
      }
      setUser(mockUser as any);
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    if (!isSupabaseEnabled) {
      if (!email || !password) return { error: 'Missing email or password' };
      const mockUser = { id: `local-${email}`, email };
      try {
        localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(mockUser));
      } catch {
        // ignore
      }
      setUser(mockUser as any);
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/profile' } });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!isSupabaseEnabled) {
      return { error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseEnabled) {
      return { error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const resendConfirmation = async (email: string) => {
    if (!isSupabaseEnabled) {
      return { error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }
    try {
      const { error } = await (supabase as any).auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin + '/profile' } });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const signOut = async () => {
    if (!isSupabaseEnabled) {
      try {
        localStorage.removeItem(DEV_USER_STORAGE_KEY);
      } catch {
        // ignore
      }
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const value = useMemo(() => ({ 
    user, 
    loading, 
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
    updatePassword,
    resendConfirmation,
    signOut 
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
