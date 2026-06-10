import React, { useState } from 'react';
import { User, Lock, Bell, Accessibility, Save, AlertTriangle, Camera, Eye, EyeOff, Palette, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useA11y } from '../contexts/A11yContext';
import { supabase } from '../lib/supabase';

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'account', label: 'Conta', icon: Lock },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'privacy', label: 'Privacidade', icon: Shield },
  { id: 'theme', label: 'Tema', icon: Palette },
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
    instagram: user?.social_links?.instagram || '',
    twitter: user?.social_links?.twitter || '',
    strava: user?.social_links?.strava || '',
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setEmailForm] = useState({ email: user?.email || '', current_password: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', password: '', confirm: '' });
  const [notifications, setNotifications] = useState({
    workout_reminders: true,
    comments: true,
    direct_messages: true,
    plan_updates: true,
    newsletter: false,
  });
  const [privacy, setPrivacy] = useState({
    profile_public: true,
    show_email: false,
    show_location: true,
    allow_messages: true,
    data_analytics: true,
  });
  const [theme, setTheme] = useState({
    accentColor: 'blue',
    compactMode: false,
    sidebarCollapsed: false,
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

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Apenas imagens (JPG, PNG, WebP, GIF) são permitidas.');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande (máx 5MB).');
      return;
    }

    const ext = file.type.split('/')[1];
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
      <p className="text-text-muted text-sm mb-6">Gerencie seu perfil, preferências e configurações de acessibilidade.</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 mb-8 overflow-x-auto" role="tablist" aria-label="Abas de configurações">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            role="tab"
            aria-selected={tab === id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue ${tab === id ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}
          >
            <Icon size={14} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {message && <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg mb-6 text-sm">{message}</div>}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="glass-card p-6 space-y-5 gradient-border">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-accent-blue/20 border-2 border-accent-blue/30 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                {user?.avatar_url && user.avatar_url.startsWith('http') ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <span className="text-2xl font-bold text-accent-blue">{user?.full_name?.charAt(0)}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-accent-blue rounded-full p-1.5 cursor-pointer hover:bg-blue-500 hover:scale-110 active:scale-90 transition-all">
                <Camera size={12} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <p className="font-medium text-text-primary group-hover:text-accent-sky transition-colors">{user?.full_name}</p>
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
                    value={profileForm[key as keyof typeof profileForm] as string}
                    onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="input-field text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-transform">
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      )}

      {/* Account Tab */}
      {tab === 'account' && (
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4 gradient-border">
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
            <button onClick={changePassword} disabled={saving} className="btn-primary disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-transform">
              {saving ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>

          <div className="glass-card p-6 border-red-500/20 space-y-3 gradient-border">
            <h2 className="font-display font-bold text-lg text-red-400 flex items-center gap-2">
              <AlertTriangle size={18} /> Zona de Perigo
            </h2>
            <p className="text-text-muted text-sm">Ao excluir sua conta, todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.</p>
            <button onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all text-sm font-medium">
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
            <div key={key} className="flex items-start justify-between py-3 border-b border-white/[0.07] last:border-0 group">
              <div>
                <p className="text-sm font-medium text-text-primary group-hover:text-accent-sky transition-colors">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [key]: !(n as any)[key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 focus:outline-none focus:ring-2 focus:ring-accent-blue ${(notifications as any)[key] ? 'bg-accent-blue' : 'bg-white/20'}`}
                role="switch"
                aria-checked={(notifications as any)[key]}
                aria-label={label}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${(notifications as any)[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Privacy Tab */}
      {tab === 'privacy' && (
        <div className="glass-card p-6 space-y-4 gradient-border">
          <h2 className="font-display font-bold text-lg text-text-primary mb-4">Privacidade</h2>
          {[
            { key: 'profile_public', label: 'Perfil público', desc: 'Permitir que outros usuários vejam seu perfil', icon: Eye },
            { key: 'show_email', label: 'Mostrar e-mail', desc: 'Exibir seu e-mail publicamente no perfil', icon: EyeOff },
            { key: 'show_location', label: 'Mostrar localização', desc: 'Compartilhar sua cidade no perfil', icon: Eye },
            { key: 'allow_messages', label: 'Permitir mensagens', desc: 'Receber mensagens de outros usuários', icon: Bell },
            { key: 'data_analytics', label: 'Análise de dados', desc: 'Permitir coleta de dados anônimos para melhorar a plataforma', icon: Shield },
          ].map(({ key, label, desc, icon: Icon }) => (
            <div key={key} className="flex items-start justify-between py-3 border-b border-white/[0.07] last:border-0 group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent-blue/10 group-hover:scale-110 transition-all">
                  <Icon size={14} className="text-text-muted group-hover:text-accent-sky transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-accent-sky transition-colors">{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => setPrivacy(p => ({ ...p, [key]: !(p as any)[key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 focus:outline-none focus:ring-2 focus:ring-accent-blue ${(privacy as any)[key] ? 'bg-accent-blue' : 'bg-white/20'}`}
                role="switch"
                aria-checked={(privacy as any)[key]}
                aria-label={label}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${(privacy as any)[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/[0.07]">
            <p className="text-xs text-text-muted">
              Seus dados são protegidos conforme a LGPD. Você pode solicitar a exclusão completa dos seus dados a qualquer momento entrando em contato com nosso suporte.
            </p>
          </div>
        </div>
      )}

      {/* Theme Tab */}
      {tab === 'theme' && (
        <div className="glass-card p-6 space-y-6 gradient-border">
          <h2 className="font-display font-bold text-lg text-text-primary mb-4">Aparência</h2>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Cor de destaque</label>
            <div className="flex gap-3">
              {[
                { id: 'blue', color: 'bg-blue-500', label: 'Azul' },
                { id: 'sky', color: 'bg-sky-400', label: 'Céu' },
                { id: 'purple', color: 'bg-purple-500', label: 'Roxo' },
                { id: 'green', color: 'bg-emerald-500', label: 'Verde' },
                { id: 'orange', color: 'bg-orange-500', label: 'Laranja' },
              ].map(({ id, color, label }) => (
                <button
                  key={id}
                  onClick={() => setTheme(t => ({ ...t, accentColor: id }))}
                  className={`w-10 h-10 rounded-xl ${color} transition-all ${theme.accentColor === id ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-secondary scale-110' : 'opacity-60 hover:opacity-100'}`}
                  title={label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between py-3 border-b border-white/[0.07]">
            <div>
              <p className="text-sm font-medium text-text-primary">Modo compacto</p>
              <p className="text-xs text-text-muted mt-0.5">Reduz espaçamentos para mostrar mais conteúdo</p>
            </div>
            <button
              onClick={() => setTheme(t => ({ ...t, compactMode: !t.compactMode }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 focus:outline-none focus:ring-2 focus:ring-accent-blue ${theme.compactMode ? 'bg-accent-blue' : 'bg-white/20'}`}
              role="switch"
              aria-checked={theme.compactMode}
              aria-label="Modo compacto"
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${theme.compactMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-start justify-between py-3 border-b border-white/[0.07]">
            <div>
              <p className="text-sm font-medium text-text-primary">Barra lateral recolhida</p>
              <p className="text-xs text-text-muted mt-0.5">Ocultar textos da barra lateral, mostrando apenas ícones</p>
            </div>
            <button
              onClick={() => setTheme(t => ({ ...t, sidebarCollapsed: !t.sidebarCollapsed }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 focus:outline-none focus:ring-2 focus:ring-accent-blue ${theme.sidebarCollapsed ? 'bg-accent-blue' : 'bg-white/20'}`}
              role="switch"
              aria-checked={theme.sidebarCollapsed}
              aria-label="Barra lateral recolhida"
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${theme.sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/[0.07]">
            <p className="text-xs text-text-muted">
              As preferências de tema são salvas localmente no seu navegador e aplicadas automaticamente em todas as sessões.
            </p>
          </div>
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
              <button
                onClick={() => updateSetting(key, !settings[key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 focus:outline-none focus:ring-2 focus:ring-accent-blue ${settings[key] ? 'bg-accent-blue' : 'bg-white/20'}`}
                role="switch"
                aria-checked={settings[key]}
                aria-label={label}
              >
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
