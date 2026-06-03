import React, { useState } from 'react';
import { User, Lock, Bell, Accessibility, Save, AlertTriangle, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useA11y } from '../contexts/A11yContext';
import { supabase } from '../lib/supabase';

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'account', label: 'Conta', icon: Lock },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'accessibility', label: 'Acessibilidade', icon: Accessibility },
];

export function SettingsPage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { settings, updateSetting } = useA11y();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    location_city: user?.location_city || '',
    instagram: (user?.social_links as any)?.instagram || '',
    twitter: (user?.social_links as any)?.twitter || '',
    strava: (user?.social_links as any)?.strava || '',
  });
  const [emailForm, setEmailForm] = useState({ email: user?.email || '', current_password: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', password: '', confirm: '' });
  const [notifications, setNotifications] = useState({
    workout_reminders: true,
    comments: true,
    direct_messages: true,
    plan_updates: true,
    newsletter: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function saveProfile() {
    setSaving(true);
    setMessage('');
    setError('');
    await updateUser({
      full_name: profileForm.full_name,
      bio: profileForm.bio || null,
      location_city: profileForm.location_city || null,
      social_links: {
        instagram: profileForm.instagram,
        twitter: profileForm.twitter,
        strava: profileForm.strava,
      },
    });
    setSaving(false);
    setMessage('Perfil salvo com sucesso!');
    setTimeout(() => setMessage(''), 3000);
  }

  async function changePassword() {
    if (passwordForm.password !== passwordForm.confirm) { setError('As senhas não coincidem.'); return; }
    if (passwordForm.password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password: passwordForm.password });
    setSaving(false);
    if (err) { setError('Erro ao alterar senha. Tente novamente.'); }
    else { setMessage('Senha alterada com sucesso!'); setPasswordForm({ current: '', password: '', confirm: '' }); }
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadErr) { setError('Erro ao fazer upload da foto.'); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await updateUser({ avatar_url: publicUrl });
    await refreshUser();
    setMessage('Foto atualizada!');
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-text-primary mb-6">Configurações</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === id ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {message && <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg mb-6 text-sm">{message}</div>}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="glass-card p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-accent-blue/20 border-2 border-accent-blue/30 flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-2xl font-bold text-accent-blue">{user?.full_name?.charAt(0)}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-accent-blue rounded-full p-1.5 cursor-pointer hover:bg-blue-500 transition-colors">
                <Camera size={12} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <p className="font-medium text-text-primary">{user?.full_name}</p>
              <p className="text-sm text-text-muted">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Nome completo</label>
            <input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Bio</label>
            <textarea value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Fale um pouco sobre você..." className="input-field resize-none h-24" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Cidade</label>
            <input value={profileForm.location_city} onChange={e => setProfileForm(f => ({ ...f, location_city: e.target.value }))}
              placeholder="Ex: São Paulo, SP" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">Redes Sociais</label>
            <div className="space-y-3">
              {[
                { key: 'instagram', label: 'Instagram', placeholder: '@seu.perfil' },
                { key: 'twitter', label: 'Twitter/X', placeholder: '@seu.perfil' },
                { key: 'strava', label: 'Strava', placeholder: 'URL do perfil' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-text-muted mb-1">{label}</label>
                  <input
                    value={(profileForm as any)[key]}
                    onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="input-field text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      )}

      {/* Account Tab */}
      {tab === 'account' && (
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-text-primary">Alterar senha</h2>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Nova senha</label>
              <input type="password" value={passwordForm.password}
                onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mín. 6 caracteres" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Confirmar nova senha</label>
              <input type="password" value={passwordForm.confirm}
                onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repita a senha" className="input-field" />
            </div>
            <button onClick={changePassword} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>

          <div className="glass-card p-6 border-red-500/20 space-y-3">
            <h2 className="font-display font-bold text-lg text-red-400 flex items-center gap-2">
              <AlertTriangle size={18} /> Zona de Perigo
            </h2>
            <p className="text-text-muted text-sm">Ao excluir sua conta, todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.</p>
            <button onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
              Excluir minha conta
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-text-primary mb-4">Notificações</h2>
          {[
            { key: 'workout_reminders', label: 'Lembretes de treino', desc: 'Notificações 30 minutos antes do treino' },
            { key: 'comments', label: 'Novos comentários', desc: 'Quando alguém comentar suas publicações' },
            { key: 'direct_messages', label: 'Mensagens diretas', desc: 'Novas mensagens no chat' },
            { key: 'plan_updates', label: 'Atualizações de plano', desc: 'Cobranças e mudanças de assinatura' },
            { key: 'newsletter', label: 'Newsletter semanal', desc: 'Dicas de treino e novidades da plataforma' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between py-3 border-b border-white/[0.07] last:border-0">
              <div>
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [key]: !(n as any)[key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${(notifications as any)[key] ? 'bg-accent-blue' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${(notifications as any)[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Accessibility Tab */}
      {tab === 'accessibility' && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-display font-bold text-lg text-text-primary mb-2">Acessibilidade</h2>
          <p className="text-text-muted text-sm">Estas configurações são salvas automaticamente e aplicadas em todas as sessões.</p>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Tamanho da fonte</label>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'normal', 'large', 'xlarge'] as const).map(size => (
                <button key={size} onClick={() => updateSetting('fontSize', size)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${settings.fontSize === size ? 'bg-accent-blue text-white' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}>
                  {size === 'small' ? 'Pequeno' : size === 'normal' ? 'Normal' : size === 'large' ? 'Grande' : 'Extra'}
                </button>
              ))}
            </div>
          </div>

          {[
            { key: 'highContrast' as const, label: 'Alto contraste', desc: 'Aumenta o contraste visual para melhor legibilidade' },
            { key: 'reduceMotion' as const, label: 'Reduzir animações', desc: 'Desativa transições e animações' },
            { key: 'textSpacing' as const, label: 'Espaçamento de texto', desc: 'Aumenta espaço entre linhas e letras' },
            { key: 'enhancedFocus' as const, label: 'Foco visível', desc: 'Adiciona contornos ao elemento focado pelo teclado' },
            { key: 'largeCursor' as const, label: 'Cursor grande', desc: 'Aumenta o tamanho do cursor do mouse' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between py-3 border-b border-white/[0.07] last:border-0">
              <div>
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
              <button onClick={() => updateSetting(key, !settings[key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${settings[key] ? 'bg-accent-blue' : 'bg-white/20'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Modo Daltonismo</label>
            <select value={settings.colorBlindness} onChange={e => updateSetting('colorBlindness', e.target.value as any)} className="input-field">
              <option value="none">Nenhum</option>
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
            </select>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display text-xl font-bold text-red-400 mb-2">Excluir conta</h3>
            <p className="text-text-muted text-sm mb-6">Esta ação é permanente e não pode ser desfeita. Todos os seus dados, treinos, mensagens e histórico serão removidos.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors text-sm">
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
