import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { LighthouseIcon } from '../components/ui/LighthouseIcon';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

export function ForgotPasswordPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!email) {
      setError('Informe seu email.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      const msg = 'Erro ao enviar o email. Verifique o endereço e tente novamente.';
      setError(msg);
      addToast(msg, 'error');
    } else {
      setSent(true);
      addToast('Email de redefinição enviado!', 'success');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
            <LighthouseIcon size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">AdaptiveMove</h1>
        </div>

        {sent ? (
          <div className="glass-card p-8 text-center animate-fade-in gradient-border">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
              <Mail size={28} className="text-success" aria-hidden="true" />
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Email enviado!</h2>
            <p className="text-text-muted mb-6">
              Enviamos um link para <strong className="text-text-primary">{email}</strong>. Verifique sua caixa de entrada.
            </p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
              <ArrowLeft size={16} aria-hidden="true" /> Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-3xl font-bold text-text-primary mb-2">Esqueceu a senha?</h2>
            <p className="text-text-muted mb-8">Digite seu email e enviaremos um link para redefinir sua senha.</p>

            {error && touched && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm animate-fade-in" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className={`input-field pl-10 ${touched && !email ? 'border-red-500/50 focus:border-red-500' : ''}`}
                    aria-invalid={touched && !email}
                    aria-describedby={touched && !email ? 'forgot-email-error' : undefined}
                  />
                </div>
                {touched && !email && <p id="forgot-email-error" className="text-red-400 text-xs mt-1">Email é obrigatório</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>

            <p className="text-center mt-6">
              <Link to="/login" className="text-accent-sky hover:underline text-sm flex items-center justify-center gap-1 hover:text-accent-sky/80 transition-colors">
                <ArrowLeft size={14} aria-hidden="true" /> Voltar para o login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
