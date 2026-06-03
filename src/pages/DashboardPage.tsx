import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Bot, Zap, TrendingUp, CreditCard, Globe, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Workout, Post } from '../types/database';

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

const WORKOUT_COLORS: Record<string, string> = {
  'Musculação': 'bg-accent-blue',
  'Cardio': 'bg-warning',
  'Yoga': 'bg-success',
  'Natação': 'bg-accent-sky',
  'Funcional': 'bg-orange-500',
  'Outro': 'bg-gray-500',
};

export function DashboardPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [posts, setPosts] = useState<(Post & { users: { full_name: string; avatar_url: string | null } | null })[]>([]);
  const [weekCount, setWeekCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    supabase.from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_at', now.toISOString())
      .order('scheduled_at')
      .limit(3)
      .then(({ data }) => setWorkouts(data || []));

    supabase.from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_at', weekStart.toISOString())
      .lte('scheduled_at', new Date(weekStart.getTime() + 7 * 86400000).toISOString())
      .then(({ data }) => setWeekCount(data?.length || 0));

    supabase.from('posts')
      .select('*, users(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setPosts((data as any) || []));

    // Simple streak: count consecutive days with workouts
    supabase.from('workouts')
      .select('scheduled_at')
      .eq('user_id', user.id)
      .lte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        let s = 0;
        let day = new Date();
        day.setHours(0, 0, 0, 0);
        const dates = new Set(data.map(w => new Date(w.scheduled_at).toDateString()));
        while (dates.has(day.toDateString())) {
          s++;
          day.setDate(day.getDate() - 1);
        }
        setStreak(s);
      });
  }, [user]);

  const planName = (user as any)?.plans?.name || 'Free';
  const planColors: Record<string, string> = {
    Free: 'text-text-muted bg-white/10',
    Pro: 'text-accent-sky bg-accent-sky/10',
    Elite: 'text-warning bg-warning/10',
  };

  const nextWorkout = workouts[0];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="animated-bg rounded-2xl p-8 border border-white/[0.07] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/10 via-transparent to-accent-sky/5 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-1">
            Olá, {user?.full_name?.split(' ')[0] || 'Atleta'}! 💪
          </h1>
          {nextWorkout ? (
            <p className="text-text-muted">
              Seu próximo treino é <span className="text-accent-sky font-medium">{nextWorkout.title}</span>{' '}
              em <span className="text-text-primary">{formatDate(nextWorkout.scheduled_at)}</span>
            </p>
          ) : (
            <p className="text-text-muted">Você não tem treinos agendados. <Link to="/calendar" className="text-accent-sky hover:underline">Agendar agora</Link></p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: 'Treinos esta semana', value: weekCount, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
          { icon: Zap, label: 'Sequência atual', value: `${streak} dias`, color: 'text-warning', bg: 'bg-warning/10' },
          { icon: CreditCard, label: 'Plano atual', value: planName, color: 'text-accent-sky', bg: 'bg-accent-sky/10', badge: true },
          { icon: MapPin, label: 'Academias próximas', value: '5', color: 'text-success', bg: 'bg-success/10' },
        ].map(({ icon: Icon, label, value, color, bg, badge }) => (
          <div key={label} className="glass-card p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className={`text-2xl font-display font-bold ${badge ? planColors[planName]?.split(' ')[0] || color : color} mb-1`}>
              {badge ? (
                <span className={`text-sm px-2 py-1 rounded-full font-medium ${planColors[planName]}`}>{value}</span>
              ) : value}
            </div>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming workouts */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-text-primary">Próximos Treinos</h2>
            <Link to="/calendar" className="text-accent-sky text-sm hover:underline">Ver todos</Link>
          </div>
          {workouts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-muted text-sm">Nenhum treino agendado</p>
              <Link to="/calendar" className="btn-primary text-sm mt-3 inline-block">Agendar treino</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map(w => (
                <div key={w.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <div className={`w-2 h-10 rounded-full flex-shrink-0`} style={{ backgroundColor: w.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{w.title}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(w.scheduled_at).toLocaleDateString('pt-BR')} · {w.duration_minutes}min · {w.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent feed */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-text-primary">Feed Recente</h2>
            <Link to="/feed" className="text-accent-sky text-sm hover:underline">Ver feed</Link>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <Globe size={32} className="text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-muted text-sm">Nenhuma publicação ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
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
                    <p className="text-sm font-medium text-text-primary">{post.users?.full_name}</p>
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
      <div>
        <h2 className="font-display text-lg font-bold text-text-primary mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/calendar', icon: Plus, label: 'Agendar Treino', color: 'accent-blue', desc: 'Adicione um novo treino ao calendário' },
            { to: '/map', icon: MapPin, label: 'Ver Academias', color: 'success', desc: 'Encontre academias perto de você' },
            { to: '/ai-chat', icon: Bot, label: 'Falar com IA', color: 'accent-sky', desc: 'Receba dicas personalizadas de treino' },
          ].map(({ to, icon: Icon, label, color, desc }) => (
            <Link key={to} to={to} className="glass-card p-5 flex items-start gap-4 group">
              <div className={`w-12 h-12 bg-${color}/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-${color}/20 transition-colors`}>
                <Icon size={22} className={`text-${color}`} />
              </div>
              <div>
                <p className="font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted mt-1">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ODS 3 card */}
      <div className="glass-card p-6 border-l-4 border-success">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">🌍</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">ODS 3</span>
              <h3 className="font-display font-bold text-text-primary">Saúde e Bem-Estar</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              O AdaptiveMove apoia o Objetivo de Desenvolvimento Sustentável 3 da ONU — garantir vida saudável e promover bem-estar para todas as idades, com foco em inclusão e acessibilidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
