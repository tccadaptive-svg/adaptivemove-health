import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Bot, Zap, CreditCard, Globe, Plus, Heart, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, Target, Dumbbell, Users, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Workout, Post } from '../types/database';
import { useScrollAnimation } from '../hooks/useAnimations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'agora há pouco';
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function sanitizeName(name: string | undefined | null): string {
  if (!name) return 'Atleta';
  // Remove HTML tags and limit length
  const clean = name.replace(/<[^>]*>/g, '').trim();
  const firstWord = clean.split(/\s+/)[0];
  if (!firstWord || firstWord.length === 0) return 'Atleta';
  // Limit to 30 chars and remove any remaining special chars
  return firstWord.slice(0, 30).replace(/[^\p{L}\p{N}\s-]/gu, '');
}

interface StatCard {
  icon: typeof Calendar;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  badge?: boolean;
}

interface QuickAction {
  to: string;
  icon: typeof Plus;
  label: string;
  color: 'accent-blue' | 'success' | 'accent-sky' | 'warning';
  desc: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { to: '/calendar', icon: Plus, label: 'Agendar Treino', color: 'accent-blue', desc: 'Adicione um novo treino ao calendário' },
  { to: '/map', icon: MapPin, label: 'Ver Academias', color: 'success', desc: 'Encontre academias perto de você' },
  { to: '/ai-chat', icon: Bot, label: 'Falar com IA', color: 'accent-sky', desc: 'Receba dicas personalizadas de treino' },
];

const COLOR_MAP: Record<string, { text: string; bg: string; hover: string }> = {
  'accent-blue': { text: 'text-accent-blue', bg: 'bg-accent-blue/10', hover: 'group-hover:bg-accent-blue/20' },
  'success': { text: 'text-success', bg: 'bg-success/10', hover: 'group-hover:bg-success/20' },
  'accent-sky': { text: 'text-accent-sky', bg: 'bg-accent-sky/10', hover: 'group-hover:bg-accent-sky/20' },
  'warning': { text: 'text-warning', bg: 'bg-warning/10', hover: 'group-hover:bg-warning/20' },
};

export function DashboardPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [posts, setPosts] = useState<(Post & { users: { full_name: string; avatar_url: string | null } | null })[]>([]);
  const [weekCount, setWeekCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const welcomeRef = useScrollAnimation();
  const statsRef = useScrollAnimation();
  const workoutsRef = useScrollAnimation();
  const feedRef = useScrollAnimation();
  const actionsRef = useScrollAnimation();
  const odsRef = useScrollAnimation();

  const planName = useMemo(() => user?.plans?.name || 'Free', [user?.plans?.name]);
  const sanitizedUserName = useMemo(() => sanitizeName(user?.full_name), [user?.full_name]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const [workoutsRes, weekRes, postsRes, streakRes] = await Promise.all([
        supabase.from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .gte('scheduled_at', now.toISOString())
          .order('scheduled_at')
          .limit(3),
        supabase.from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .gte('scheduled_at', weekStart.toISOString())
          .lte('scheduled_at', new Date(weekStart.getTime() + 7 * 86400000).toISOString()),
        supabase.from('posts')
          .select('*, users(full_name, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('workouts')
          .select('scheduled_at')
          .eq('user_id', user.id)
          .lte('scheduled_at', now.toISOString())
          .order('scheduled_at', { ascending: false })
          .limit(60),
      ]);

      if (workoutsRes.error) throw workoutsRes.error;
      if (weekRes.error) throw weekRes.error;
      if (postsRes.error) throw postsRes.error;
      if (streakRes.error) throw streakRes.error;

      setWorkouts(workoutsRes.data || []);
      setWeekCount(weekRes.data?.length || 0);
      setPosts(postsRes.data || []);

      // Calculate streak
      if (streakRes.data && streakRes.data.length > 0) {
        let s = 0;
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        const dates = new Set(streakRes.data.map((w: { scheduled_at: string }) => new Date(w.scheduled_at).toDateString()));
        while (dates.has(day.toDateString())) {
          s++;
          day.setDate(day.getDate() - 1);
        }
        setStreak(s);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(true);
    loadData();
  }, [loadData]);

  const nextWorkout = workouts[0];

  const stats: StatCard[] = useMemo(() => [
    { icon: Calendar, label: 'Treinos esta semana', value: weekCount, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
    { icon: Zap, label: 'Sequência atual', value: `${streak} dias`, color: 'text-warning', bg: 'bg-warning/10' },
    { icon: CreditCard, label: 'Plano atual', value: planName, color: 'text-accent-sky', bg: 'bg-accent-sky/10', badge: true },
    { icon: MapPin, label: 'Academias próximas', value: '5', color: 'text-success', bg: 'bg-success/10' },
  ], [weekCount, streak, planName]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6" role="status" aria-label="Carregando dashboard">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-white/5 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-48 bg-white/5 rounded-xl" />
            <div className="h-48 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-16">
          <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Erro ao carregar</h2>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">{error}</p>
          <button onClick={handleRefresh} disabled={refreshing} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Tentando...' : 'Tentar novamente'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div ref={welcomeRef.ref} className={`animated-bg rounded-2xl p-6 sm:p-8 border border-white/[0.07] relative overflow-hidden gradient-border ${welcomeRef.isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/10 via-transparent to-accent-sky/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gradient mb-1">
              Olá, {sanitizedUserName}!
            </h1>
            {nextWorkout ? (
              <p className="text-text-muted text-sm sm:text-base">
                Seu próximo treino é <span className="text-accent-sky font-medium">{nextWorkout.title}</span>{' '}
                em <span className="text-text-primary">{formatDate(nextWorkout.scheduled_at)}</span>
              </p>
            ) : (
              <p className="text-text-muted text-sm sm:text-base">
                Você não tem treinos agendados.{' '}
                <Link to="/calendar" className="text-accent-sky hover:underline font-medium">Agendar agora</Link>
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-ghost inline-flex items-center gap-2 text-sm self-start sm:self-auto"
            aria-label="Atualizar dados do dashboard"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div ref={statsRef.ref} className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${statsRef.isVisible ? 'stagger-children visible' : 'stagger-children'}`}>
        {stats.map(({ icon: Icon, label, value, color, bg, badge }) => (
          <div key={label} className="glass-card p-4 sm:p-5 hover-lift group cursor-default" role="status" aria-label={label}>
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon size={20} className={color} aria-hidden="true" />
            </div>
            <div className={`text-xl sm:text-2xl font-display font-bold ${badge && planName !== 'Free' ? COLOR_MAP[planName]?.text || color : color} mb-1`}>
              {badge ? (
                <span className={`text-xs sm:text-sm px-2 py-1 rounded-full font-medium ${planName !== 'Free' ? COLOR_MAP[planName]?.bg || bg : bg}`}>{value}</span>
              ) : (
                value
              )}
            </div>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upcoming workouts */}
        <div ref={workoutsRef.ref} className={`glass-card p-4 sm:p-6 ${workoutsRef.isVisible ? 'animate-on-scroll-left visible' : 'animate-on-scroll-left'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base sm:text-lg font-bold text-text-primary">Próximos Treinos</h2>
            <Link to="/calendar" className="text-accent-sky text-sm hover:underline font-medium">Ver todos</Link>
          </div>
          {workouts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Calendar size={28} className="text-text-muted" aria-hidden="true" />
              </div>
              <p className="text-text-muted text-sm mb-1 font-medium">Nenhum treino agendado</p>
              <p className="text-text-muted/60 text-xs mb-4">Comece criando seu primeiro treino</p>
              <Link to="/calendar" className="btn-primary text-sm inline-flex items-center gap-2 hover-scale">
                <Plus size={16} aria-hidden="true" />
                Agendar treino
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {workouts.map(w => (
                <div key={w.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/[0.07] hover:translate-x-1 transition-all group">
                  <div className="w-2 h-10 rounded-full flex-shrink-0 shadow-lg" style={{ backgroundColor: w.color, boxShadow: `0 0 8px ${w.color}40` }} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate group-hover:text-accent-sky transition-colors">{w.title}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(w.scheduled_at).toLocaleDateString('pt-BR')} · {w.duration_minutes}min · {w.type}
                    </p>
                  </div>
                  <Link
                    to="/calendar"
                    className="btn-ghost text-xs px-3 py-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Editar treino: ${w.title}`}
                  >
                    Editar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent feed */}
        <div ref={feedRef.ref} className={`glass-card p-4 sm:p-6 ${feedRef.isVisible ? 'animate-on-scroll-right visible' : 'animate-on-scroll-right'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base sm:text-lg font-bold text-text-primary">Feed Recente</h2>
            <Link to="/feed" className="text-accent-sky text-sm hover:underline font-medium">Ver feed</Link>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Globe size={28} className="text-text-muted" aria-hidden="true" />
              </div>
              <p className="text-text-muted text-sm mb-1 font-medium">Nenhuma publicação ainda</p>
              <p className="text-text-muted/60 text-xs">Seja o primeiro a compartilhar!</p>
              <Link to="/feed" className="btn-ghost text-sm mt-3 inline-flex items-center gap-1.5">
                Ir para o feed
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {posts.map(post => (
                <div key={post.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {post.users?.avatar_url ? (
                      <img src={post.users.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xs font-bold text-accent-blue">
                        {(post.users?.full_name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{post.users?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{post.content}</p>
                    <p className="text-xs text-text-muted mt-1">{formatRelative(post.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div ref={actionsRef.ref} className={`${actionsRef.isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
        <h2 className="font-display text-base sm:text-lg font-bold text-text-primary mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {QUICK_ACTIONS.map(({ to, icon: Icon, label, color, desc }) => {
            const colors = COLOR_MAP[color];
            return (
              <Link
                key={to}
                to={to}
                className="glass-card p-4 sm:p-5 flex items-start gap-4 group hover-lift gradient-border"
                aria-label={`${label}: ${desc}`}
              >
                <div className={`w-12 h-12 ${colors.bg} ${colors.hover} rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110`}>
                  <Icon size={22} className={colors.text} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm sm:text-base group-hover:text-accent-sky transition-colors">{label}</p>
                  <p className="text-xs text-text-muted mt-1">{desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ODS 3 card */}
      <div ref={odsRef.ref} className={`glass-card p-4 sm:p-6 border-l-4 border-success relative overflow-hidden ${odsRef.isVisible ? 'animate-on-scroll-scale visible' : 'animate-on-scroll-scale'}`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-success/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Heart size={24} className="text-success" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">ODS 3</span>
              <h3 className="font-display font-bold text-text-primary text-sm sm:text-base">Saúde e Bem-Estar</h3>
            </div>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              O AdaptiveMove apoia o Objetivo de Desenvolvimento Sustentável 3 da ONU — garantir vida saudável e promover bem-estar para todas as idades, com foco em inclusão e acessibilidade.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                <Users size={20} className="text-accent-sky mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs font-medium text-text-primary">Comunidade Ativa</p>
                <p className="text-[10px] text-text-muted mt-0.5">Milhares de usuários</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                <Shield size={20} className="text-success mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs font-medium text-text-primary">Saúde Inclusiva</p>
                <p className="text-[10px] text-text-muted mt-0.5">Acessível para todos</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                <TrendingUp size={20} className="text-warning mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs font-medium text-text-primary">Resultados Reais</p>
                <p className="text-[10px] text-text-muted mt-0.5">Acompanhamento contínuo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
