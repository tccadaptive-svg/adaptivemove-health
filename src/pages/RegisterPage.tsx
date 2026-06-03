import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { LighthouseIcon } from '../components/ui/LighthouseIcon';
import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!name.trim()) return 'Informe seu nome completo.';
    if (!email) return 'Informe seu email.';
    if (password.length < 6) return 'A senha deve ter ao menos 6 caracteres.';
    if (password !== confirmPassword) return 'As senhas não coincidem.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError('');
    const { error: err } = await signUp(email, password, name);
    setLoading(false);
    if (err) {
      if (err.message?.includes('already registered')) {
        setError('Este email já está cadastrado. Faça login ou use outro email.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-bg-primary">
      <div className="hidden lg:flex flex-col justify-between w-1/2 animated-bg p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 via-transparent to-success/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <LighthouseIcon size={48} />
            <div>
              <h1 className="font-display text-3xl font-bold text-text-primary">AdaptiveMove</h1>
              <p className="text-text-muted text-sm">Movimento para todos. Saúde para o mundo.</p>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-display text-4xl font-bold text-text-primary leading-tight">
              Junte-se à comunidade
            </h2>
            <p className="text-text-muted text-lg">
              Mais de <span className="text-accent-sky font-semibold">10.000 pessoas</span> já usam o AdaptiveMove para transformar sua saúde e bem-estar.
            </p>
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            'Acesso ao mapa de academias inclusivas',
            'Calendário de treinos personalizado',
            'IA especialista em fitness e acessibilidade',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-text-muted text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <LighthouseIcon size={36} />
            <h1 className="font-display text-2xl font-bold text-text-primary">AdaptiveMove</h1>
          </div>

          <h2 className="font-display text-3xl font-bold text-text-primary mb-2">Criar conta</h2>
          <p className="text-text-muted mb-8">Comece sua jornada de saúde hoje mesmo.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Nome completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Seu nome" className="input-field pl-10" autoComplete="name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" className="input-field pl-10" autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres"
                  className="input-field pl-10 pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Confirmar senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha" className="input-field pl-10" autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50">
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-accent-sky hover:underline font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
