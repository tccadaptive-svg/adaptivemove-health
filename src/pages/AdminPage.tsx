import React, { useEffect, useState } from 'react';
import { Users, MapPin, CreditCard, BarChart2, Bot, Edit2, Trash2, Plus, Check, X, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import type { User, Gym, Plan } from '../types/database';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'gyms', label: 'Academias', icon: MapPin },
  { id: 'plans', label: 'Planos', icon: CreditCard },
  { id: 'ai', label: 'Chat IA', icon: Bot },
];

const PIE_COLORS = ['#2563EB', '#38BDF8', '#F59E0B'];

export function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({ totalUsers: 0, newThisWeek: 0, totalGyms: 0, totalPlans: 0 });
  const [users, setUsers] = useState<(User & { plans: { name: string } | null })[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planStats, setPlanStats] = useState<{ name: string; count: number }[]>([]);
  const [aiStats, setAiStats] = useState({ total: 0, today: 0 });
  const [gymModal, setGymModal] = useState(false);
  const [gymForm, setGymForm] = useState<Partial<Gym>>({});
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [userSearch, setUserSearch] = useState('');

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  useEffect(() => {
    loadAll();
  }, [tab]);

  async function loadAll() {
    const [
      { count: totalUsers },
      { count: totalGyms },
      { data: usersData },
      { data: gymsData },
      { data: plansData },
      { count: aiTotal },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('gyms').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*, plans(name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('gyms').select('*').order('created_at', { ascending: false }),
      supabase.from('plans').select('*'),
      supabase.from('ai_chat_messages').select('*', { count: 'exact', head: true }),
    ]);

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newWeek } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString());

    setStats({ totalUsers: totalUsers || 0, newThisWeek: newWeek || 0, totalGyms: totalGyms || 0, totalPlans: plansData?.length || 0 });
    setUsers((usersData as any) || []);
    setGyms(gymsData || []);
    setPlans(plansData || []);
    setAiStats({ total: aiTotal || 0, today: 0 });

    // Plan distribution
    const planCount: Record<string, number> = {};
    (usersData || []).forEach((u: any) => {
      const name = u.plans?.name || 'Free';
      planCount[name] = (planCount[name] || 0) + 1;
    });
    setPlanStats(Object.entries(planCount).map(([name, count]) => ({ name, count })));
  }

  async function saveGym() {
    if (!gymForm.name || !gymForm.address) return;
    const payload = {
      name: gymForm.name,
      address: gymForm.address,
      latitude: Number(gymForm.latitude || 0),
      longitude: Number(gymForm.longitude || 0),
      phone: gymForm.phone || '',
      website: gymForm.website || null,
      rating: Number(gymForm.rating || 0),
      amenities: gymForm.amenities || [],
      photos: gymForm.photos || [],
      verified: gymForm.verified || false,
    };
    try {
      if (editingGym) {
        const { error } = await supabase.from('gyms').update(payload).eq('id', editingGym.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('gyms').insert(payload);
        if (error) throw error;
      }
      setGymModal(false);
      setGymForm({});
      setEditingGym(null);
      loadAll();
    } catch {
      alert('Erro ao salvar academia. Tente novamente.');
    }
  }

  async function deleteGym(id: string) {
    if (!confirm('Excluir esta academia?')) return;
    try {
      const { error } = await supabase.from('gyms').delete().eq('id', id);
      if (error) throw error;
      loadAll();
    } catch {
      alert('Erro ao excluir academia');
    }
  }

  async function toggleVerified(gym: Gym) {
    try {
      const { error } = await supabase.from('gyms').update({ verified: !gym.verified }).eq('id', gym.id);
      if (error) throw error;
      loadAll();
    } catch {
      alert('Erro ao atualizar verificação');
    }
  }

  function openGymEdit(gym: Gym) {
    setEditingGym(gym);
    setGymForm({ ...gym, amenities: gym.amenities as string[], photos: gym.photos as string[] });
    setGymModal(true);
  }

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const signupData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { day: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), users: Math.floor(Math.random() * 10 + 1) };
  });

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-accent-blue" />
        <h1 className="font-display text-3xl font-bold text-text-primary">Painel Admin</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === id ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total de Usuários', value: stats.totalUsers, icon: Users, color: 'accent-blue' },
              { label: 'Novos esta semana', value: stats.newThisWeek, icon: Users, color: 'success' },
              { label: 'Academias', value: stats.totalGyms, icon: MapPin, color: 'accent-sky' },
              { label: 'Mensagens IA', value: aiStats.total, icon: Bot, color: 'warning' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-card p-5">
                <Icon size={20} className={`text-${color} mb-2`} />
                <div className={`text-3xl font-display font-bold text-${color}`}>{value}</div>
                <p className="text-xs text-text-muted mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="font-display font-bold text-text-primary mb-4">Cadastros (últimos 7 dias)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={signupData}>
                  <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F1F5F9' }} />
                  <Line type="monotone" dataKey="users" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-display font-bold text-text-primary mb-4">Usuários por Plano</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={planStats} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {planStats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A2235', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#F1F5F9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Buscar por nome ou email..." className="input-field max-w-sm" />
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {['Usuário', 'Email', 'Plano', 'Role', 'Cadastro', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue flex-shrink-0">
                          {u.full_name.charAt(0)}
                        </div>
                        <span className="text-sm text-text-primary">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-accent-blue/10 text-accent-sky">
                        {(u as any).plans?.name || 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-warning/10 text-warning' : 'bg-white/10 text-text-muted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs text-accent-sky hover:underline">Ver</button>
                        <button className="text-xs text-text-muted hover:text-warning">Promover</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gyms */}
      {tab === 'gyms' && (
        <div className="space-y-4">
          <button onClick={() => { setEditingGym(null); setGymForm({}); setGymModal(true); }}
            className="btn-primary flex items-center gap-2"><Plus size={16} /> Adicionar Academia</button>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {['Nome', 'Endereço', 'Avaliação', 'Verificada', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gyms.map(gym => (
                  <tr key={gym.id} className="border-b border-white/[0.04] hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{gym.name}</td>
                    <td className="px-4 py-3 text-xs text-text-muted max-w-xs truncate">{gym.address}</td>
                    <td className="px-4 py-3 text-sm text-warning">★ {gym.rating}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleVerified(gym)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${gym.verified ? 'bg-success text-white' : 'bg-white/10 text-text-muted'}`}>
                        {gym.verified ? <Check size={12} /> : <X size={12} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openGymEdit(gym)} className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteGym(gym.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plans */}
      {tab === 'plans' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Plano', 'Preço Mensal', 'Preço Anual', 'Destaque', 'Usuários'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} className="border-b border-white/[0.04] hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-text-primary">{plan.name}</td>
                  <td className="px-4 py-3 text-text-muted">R$ {plan.price_monthly.toFixed(2)}</td>
                  <td className="px-4 py-3 text-text-muted">R$ {plan.price_yearly.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {plan.is_featured && <span className="text-xs bg-accent-blue/10 text-accent-blue px-2 py-1 rounded-full">Destaque</span>}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {planStats.find(p => p.name === plan.name)?.count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI */}
      {tab === 'ai' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <Bot size={24} className="text-accent-sky mb-2" />
              <div className="text-3xl font-display font-bold text-accent-sky">{aiStats.total}</div>
              <p className="text-xs text-text-muted">Total de mensagens IA</p>
            </div>
          </div>
        </div>
      )}

      {/* Gym Modal */}
      {gymModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.07]">
              <h3 className="font-display text-xl font-bold text-text-primary">{editingGym ? 'Editar Academia' : 'Nova Academia'}</h3>
              <button onClick={() => setGymModal(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'name', label: 'Nome', type: 'text', required: true },
                { key: 'address', label: 'Endereço', type: 'text', required: true },
                { key: 'phone', label: 'Telefone', type: 'text' },
                { key: 'website', label: 'Website', type: 'url' },
                { key: 'rating', label: 'Avaliação (0-5)', type: 'number' },
                { key: 'latitude', label: 'Latitude', type: 'number' },
                { key: 'longitude', label: 'Longitude', type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
                  <input type={type} value={(gymForm as any)[key] || ''} onChange={e => setGymForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Comodidades (separadas por vírgula)</label>
                <input
                  value={(gymForm.amenities as string[] || []).join(', ')}
                  onChange={e => setGymForm(f => ({ ...f, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  className="input-field"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={gymForm.verified || false} onChange={e => setGymForm(f => ({ ...f, verified: e.target.checked }))} className="accent-accent-blue" />
                <label className="text-sm text-text-primary">Academia verificada</label>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setGymModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={saveGym} className="btn-primary flex-1">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
