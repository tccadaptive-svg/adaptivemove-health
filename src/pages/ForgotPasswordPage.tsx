import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { LighthouseIcon } from '../components/ui/LighthouseIcon';
import { supabase } from '../lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Informe seu email.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError('Erro ao enviar o email. Verifique o endereço e tente novamente.');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <LighthouseIcon size={36} />
          <h1 className="font-display text-2xl font-bold text-text-primary">AdaptiveMove</h1>
        </div>

        {sent ? (
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-success" />
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Email enviado!</h2>
            <p className="text-text-muted mb-6">
              Enviamos um link para <strong className="text-text-primary">{email}</strong>. Verifique sua caixa de entrada.
            </p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-3xl font-bold text-text-primary mb-2">Esqueceu a senha?</h2>
            <p className="text-text-muted mb-8">Digite seu email e enviaremos um link para redefinir sua senha.</p>

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
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" className="input-field pl-10" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 font-semibold disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>

            <p className="text-center mt-6">
              <Link to="/login" className="text-accent-sky hover:underline text-sm flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Voltar para o login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
