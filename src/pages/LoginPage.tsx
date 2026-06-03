import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { LighthouseIcon } from '../components/ui/LighthouseIcon';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Preencha todos os campos.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError('Email ou senha inválidos. Tente novamente.');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-bg-primary">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 animated-bg p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 via-transparent to-accent-sky/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <LighthouseIcon size={48} />
            <div>
              <h1 className="font-display text-3xl font-bold text-text-primary">AdaptiveMove</h1>
              <p className="text-text-muted text-sm">Movimento para todos. Saúde para o mundo.</p>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="font-display text-4xl font-bold text-text-primary leading-tight">
              Sua jornada de saúde começa aqui
            </h2>
            <p className="text-text-muted text-lg leading-relaxed">
              Uma plataforma inclusiva para todos os corpos, todas as capacidades. Encontre academias, agende treinos e conecte-se com sua comunidade.
            </p>
          </div>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-success/20 text-success px-4 py-2 rounded-full text-sm font-medium border border-success/30">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            ODS 3 — Saúde e Bem-Estar para Todos
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <LighthouseIcon size={36} />
            <h1 className="font-display text-2xl font-bold text-text-primary">AdaptiveMove</h1>
          </div>

          <h2 className="font-display text-3xl font-bold text-text-primary mb-2">Entrar</h2>
          <p className="text-text-muted mb-8">Bem-vindo de volta! Acesse sua conta.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-accent-blue"
                />
                <span className="text-sm text-text-muted">Lembrar-me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-accent-sky hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-primary px-2 text-text-muted">ou</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg py-3 text-text-primary font-medium transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <p className="text-center text-text-muted text-sm mt-6">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-accent-sky hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
