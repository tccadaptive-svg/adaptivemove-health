import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User, AccessibilitySettings } from '../types/database';

interface AuthContextType {
  session: Session | null;
  authUser: AuthUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser(id: string) {
    const { data } = await supabase
      .from('users')
      .select('*, plans(*)')
      .eq('id', id)
      .maybeSingle();
    setUser(data as User | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchUser(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await fetchUser(session.user.id);
        })();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const updateUser = async (data: Partial<User>) => {
    if (!authUser) return;
    await supabase.from('users').update(data).eq('id', authUser.id);
    await fetchUser(authUser.id);
  };

  const refreshUser = async () => {
    if (authUser) await fetchUser(authUser.id);
  };

  return (
    <AuthContext.Provider value={{ session, authUser, user, loading, signIn, signUp, signOut, signInWithGoogle, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
