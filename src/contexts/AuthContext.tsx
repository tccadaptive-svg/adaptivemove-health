import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types/database';

interface AuthContextType {
  session: Session | null;
  authUser: AuthUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, plans(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } else {
        setUser(data as User | null);
      }
    } catch (err) {
      console.error('Error fetching user (exception):', err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchUser(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        if (mounted) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!mounted) return;
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchUser(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setUser(null);
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('SignIn error:', error);
        return { error: error.message || 'Email ou senha inválidos. Tente novamente.' };
      }
      return { error: null };
    } catch (err) {
      console.error('SignIn exception:', err);
      return { error: 'Erro inesperado ao fazer login. Tente novamente.' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          email_confirm: false,
        },
      });
      if (error) {
        console.error('SignUp error:', error);
        const msg = error.message || '';
        if (msg.includes('already registered') || msg.includes('already exists')) {
          return { error: 'Este email já está cadastrado. Faça login ou use outro email.' };
        }
        if (msg.includes('password')) {
          return { error: 'A senha deve ter ao menos 6 caracteres.' };
        }
        return { error: msg || 'Erro ao criar conta. Tente novamente.' };
      }
      // Se o usuário foi criado mas o trigger falhou, tentar criar o perfil manualmente
      if (data.user) {
        try {
          const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: 'user',
            social_links: { instagram: '', twitter: '', strava: '' },
            accessibility_settings: { fontSize: 'normal', highContrast: false, reduceMotion: false, textSpacing: false, enhancedFocus: false, colorBlindness: 'none', largeCursor: false },
          });
          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Não falha o cadastro se o perfil já existir
          }
        } catch (profileErr) {
          console.error('Profile creation exception:', profileErr);
        }
      }
      return { error: null };
    } catch (err) {
      console.error('SignUp exception:', err);
      return { error: 'Erro inesperado ao criar conta. Tente novamente.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setAuthUser(null);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!authUser) return { error: 'Usuário não autenticado.' };
    try {
      const { error } = await supabase.from('users').update(data as never).eq('id', authUser.id);
      if (error) {
        console.error('Update user error:', error);
        return { error: error.message || 'Erro ao atualizar perfil.' };
      }
      await fetchUser(authUser.id);
      return { error: null };
    } catch (err) {
      console.error('Update user exception:', err);
      return { error: 'Erro inesperado ao atualizar perfil.' };
    }
  }, [authUser, fetchUser]);

  const refreshUser = useCallback(async () => {
    if (authUser) await fetchUser(authUser.id);
  }, [authUser, fetchUser]);

  return (
    <AuthContext.Provider value={{ session, authUser, user, loading, signIn, signUp, signOut, signInWithGoogle, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth: contexto não encontrado. Verifique se o componente está dentro de <AuthProvider>.');
  return ctx;
}
