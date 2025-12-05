import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/profile' } });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await (supabase as any).auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin + '/profile' } });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Unknown error' };
    }
  };

  const signOut = async () => {
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
