import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Workout } from '../types/database';

const WORKOUT_TYPES = ['Musculação', 'Cardio', 'Yoga', 'Natação', 'Funcional', 'Outro'];
const DAYS_HEADER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface WorkoutForm {
  title: string;
  type: string;
  date: string;
  time: string;
  duration_minutes: number;
  description: string;
  color: string;
  reminder: boolean;
}

const EMPTY_FORM: WorkoutForm = {
  title: '',
  type: 'Musculação',
  date: '',
  time: '08:00',
  duration_minutes: 60,
  description: '',
  color: '#2563EB',
  reminder: false,
};

export function CalendarPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [form, setForm] = useState<WorkoutForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    setFetchError(null);
    try {
      const start = new Date(year, month, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(year, month + 1, 0);
      end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase.from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .order('scheduled_at');
      if (error) throw error;
      setWorkouts((data as Workout[] | null) || []);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setFetchError('Não foi possível carregar os treinos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [user, year, month]);

  useEffect(() => {
    setLoading(true);
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Reminder check
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 60000);
      workouts.forEach((w: Workout) => {
        const wTime = new Date(w.scheduled_at);
        if (!w.reminder_sent && wTime >= now && wTime <= soon) {
          showReminder(w);
          supabase.from('workouts').update({ reminder_sent: true } as never).eq('id', w.id);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [workouts]);

  function showReminder(w: Workout) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Treino em 30 minutos: ${w.title}`, { body: `${w.type} · ${w.duration_minutes}min` });
    }
  }

  const openCreate = useCallback((date?: string) => {
    setEditingWorkout(null);
    setForm({ ...EMPTY_FORM, date: date || new Date().toISOString().split('T')[0] });
    setModalOpen(true);
    setError('');
  }, []);

  const openEdit = useCallback((w: Workout) => {
    setEditingWorkout(w);
    const d = new Date(w.scheduled_at);
    setForm({
      title: w.title,
      type: w.type,
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().slice(0, 5),
      duration_minutes: w.duration_minutes,
      description: w.description || '',
      color: w.color,
      reminder: !w.reminder_sent,
    });
    setModalOpen(true);
    setError('');
  }, []);

  const saveWorkout = useCallback(async () => {
    if (!form.title.trim()) { setError('Informe o título do treino.'); return; }
    if (!form.date) { setError('Informe a data.'); return; }
    setSaving(true);
    setError('');
    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString();
    const payload = {
      user_id: user!.id,
      title: form.title,
      type: form.type,
      scheduled_at,
      duration_minutes: form.duration_minutes,
      description: form.description || null,
      color: form.color,
      reminder_sent: !form.reminder,
    };
    try {
      if (editingWorkout) {
        const { error } = await supabase.from('workouts').update(payload as never).eq('id', editingWorkout.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workouts').insert(payload as never);
        if (error) throw error;
      }
      setSaving(false);
      setModalOpen(false);
      fetchWorkouts();
    } catch {
      setSaving(false);
      setError('Erro ao salvar treino. Tente novamente.');
    }
  }, [form, editingWorkout, user, fetchWorkouts]);

  const deleteWorkout = useCallback(async (id: string) => {
    if (!confirm('Excluir este treino?')) return;
    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;
      setModalOpen(false);
      fetchWorkouts();
    } catch {
      setError('Erro ao excluir treino. Tente novamente.');
    }
  }, [fetchWorkouts]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const displayed = filterType ? workouts.filter(w => w.type === filterType) : workouts;
  const workoutsByDay: Record<number, Workout[]> = {};
  displayed.forEach(w => {
    const d = new Date(w.scheduled_at);
    const day = d.getDate();
    if (!workoutsByDay[day]) workoutsByDay[day] = [];
    workoutsByDay[day].push(w);
  });


  // Week view: get current week days
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6" role="status" aria-label="Carregando calendário">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-white/5 rounded w-48" />
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-16">
          <AlertTriangle size={48} className="text-warning mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Erro ao carregar</h2>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">{fetchError}</p>
          <button onClick={fetchWorkouts} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Meu Calendário</h1>
          <p className="text-text-muted text-sm">Gerencie seus treinos</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="input-field w-auto text-sm py-2"
            aria-label="Filtrar por tipo de treino"
          >
            <option value="">Todos os tipos</option>
            {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5" role="tablist" aria-label="Visualização do calendário">
            {(['month', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                role="tab"
                aria-selected={view === v}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue ${view === v ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                {v === 'month' ? 'Mês' : 'Semana'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="glass-card p-4 flex items-center justify-between">
        <button
          onClick={() => {
            const d = new Date(currentDate);
            view === 'month' ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7);
            setCurrentDate(d);
          }}
          className="p-2 hover:bg-white/10 rounded-lg text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue"
          aria-label={view === 'month' ? 'Mês anterior' : 'Semana anterior'}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h2 className="font-display text-xl font-bold text-text-primary">
          {view === 'month'
            ? `${MONTH_NAMES[month]} ${year}`
            : `${weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
          }
        </h2>
        <button
          onClick={() => {
            const d = new Date(currentDate);
            view === 'month' ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7);
            setCurrentDate(d);
          }}
          className="p-2 hover:bg-white/10 rounded-lg text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue"
          aria-label={view === 'month' ? 'Próximo mês' : 'Próxima semana'}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="glass-card overflow-hidden" role="grid" aria-label="Calendário mensal">
          <div className="grid grid-cols-7 border-b border-white/[0.07]">
            {DAYS_HEADER.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-text-muted uppercase" role="columnheader">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-b border-r border-white/[0.07] bg-white/[0.02]" role="gridcell" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayWorkouts = workoutsByDay[day] || [];
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              return (
                <div
                  key={day}
                  className={`h-24 border-b border-r border-white/[0.07] p-1.5 cursor-pointer hover:bg-white/5 hover:scale-[1.02] transition-all focus:outline-none focus:bg-white/10 ${(day + firstDay - 1) % 7 === 6 ? 'border-r-0' : ''}`}
                  onClick={() => openCreate(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                  onKeyDown={e => e.key === 'Enter' && openCreate(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                  tabIndex={0}
                  role="gridcell"
                  aria-label={`Dia ${day}${dayWorkouts.length > 0 ? `, ${dayWorkouts.length} treino(s)` : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-accent-blue text-white' : 'text-text-muted'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayWorkouts.slice(0, 3).map(w => (
                      <div
                        key={w.id}
                        onClick={e => { e.stopPropagation(); openEdit(w); }}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
                        style={{ backgroundColor: w.color + 'cc' }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Treino: ${w.title}`}
                      >
                        {w.title}
                      </div>
                    ))}
                    {dayWorkouts.length > 3 && (
                      <div className="text-[10px] text-text-muted px-1">+{dayWorkouts.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="glass-card overflow-hidden" role="grid" aria-label="Calendário semanal">
          <div className="grid grid-cols-7 border-b border-white/[0.07]">
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`py-3 text-center border-r border-white/[0.07] last:border-r-0 ${isToday ? 'bg-accent-blue/10' : ''}`} role="columnheader">
                  <div className="text-xs text-text-muted uppercase">{DAYS_HEADER[i]}</div>
                  <div className={`text-lg font-display font-bold mt-1 mx-auto w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-accent-blue text-white' : 'text-text-primary'}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-64">
            {weekDays.map((d, i) => {
              const dayWorkouts = displayed.filter(w => new Date(w.scheduled_at).toDateString() === d.toDateString());
              return (
                <div
                  key={i}
                  className="border-r border-white/[0.07] last:border-r-0 p-2 min-h-48 cursor-pointer hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/10"
                  onClick={() => openCreate(d.toISOString().split('T')[0])}
                  onKeyDown={e => e.key === 'Enter' && openCreate(d.toISOString().split('T')[0])}
                  tabIndex={0}
                  role="gridcell"
                  aria-label={`${d.toLocaleDateString('pt-BR', { weekday: 'long' })}, ${dayWorkouts.length} treino(s)`}
                >
                  {dayWorkouts.map(w => (
                    <div
                      key={w.id}
                      onClick={e => { e.stopPropagation(); openEdit(w); }}
                      className="mb-1.5 p-2 rounded-lg text-xs text-white font-medium cursor-pointer hover:scale-105 active:scale-95 hover:shadow-lg transition-all"
                      style={{ backgroundColor: w.color + 'cc', boxShadow: `0 2px 8px ${w.color}40` }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Treino: ${w.title} às ${new Date(w.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <div className="font-semibold truncate">{w.title}</div>
                      <div className="opacity-80">{new Date(w.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => openCreate()}
        className="fixed bottom-6 right-6 bg-accent-blue text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl blue-glow hover:bg-blue-500 transition-all z-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-bg-primary"
        aria-label="Novo treino"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }} role="dialog" aria-modal="true" aria-label={editingWorkout ? 'Editar treino' : 'Novo treino'}>
          <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.07]">
              <h3 className="font-display text-xl font-bold text-text-primary">
                {editingWorkout ? 'Editar Treino' : 'Novo Treino'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue" aria-label="Fechar modal">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>}

              <div>
                <label htmlFor="workout-title" className="block text-sm font-medium text-text-primary mb-1.5">Título *</label>
                <input id="workout-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Treino de peito" className="input-field" />
              </div>

              <div>
                <label htmlFor="workout-type" className="block text-sm font-medium text-text-primary mb-1.5">Tipo</label>
                <select id="workout-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field">
                  {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="workout-date" className="block text-sm font-medium text-text-primary mb-1.5">Data *</label>
                  <input id="workout-date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label htmlFor="workout-time" className="block text-sm font-medium text-text-primary mb-1.5">Horário</label>
                  <input id="workout-time" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="input-field" />
                </div>
              </div>

              <div>
                <label htmlFor="workout-duration" className="block text-sm font-medium text-text-primary mb-1.5">Duração (minutos)</label>
                <input id="workout-duration" type="number" min={5} max={480} value={form.duration_minutes}
                  onChange={e => setForm(f => ({ ...f, duration_minutes: +e.target.value }))} className="input-field" />
              </div>

              <div>
                <label htmlFor="workout-desc" className="block text-sm font-medium text-text-primary mb-1.5">Descrição</label>
                <textarea id="workout-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Opcional..." className="input-field resize-none h-20" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Cor</label>
                <div className="flex gap-2" role="radiogroup" aria-label="Cor do treino">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-bg-secondary ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-secondary scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                      role="radio"
                      aria-checked={form.color === c}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">Ativar lembrete</span>
                <button
                  onClick={() => setForm(f => ({ ...f, reminder: !f.reminder }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue ${form.reminder ? 'bg-accent-blue' : 'bg-white/20'}`}
                  role="switch"
                  aria-checked={form.reminder}
                  aria-label="Ativar lembrete"
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.reminder ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              {editingWorkout && (
                <button onClick={() => deleteWorkout(editingWorkout.id)}
                  className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-accent-blue">
                  <Trash2 size={16} aria-hidden="true" /> Excluir
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => setModalOpen(false)} className="btn-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue">Cancelar</button>
              <button onClick={saveWorkout} disabled={saving} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-blue" aria-busy={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
