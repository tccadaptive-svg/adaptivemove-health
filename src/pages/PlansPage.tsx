import React, { useEffect, useState } from 'react';
import { Check, Zap, Star, HelpCircle, ChevronDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Plan } from '../types/database';

const FAQ = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso continua até o fim do período pago.' },
  { q: 'O plano Free tem limite de funcionalidades?', a: 'O plano Free inclui 5 treinos/mês e 10 mensagens de IA por dia. Para uso ilimitado, recomendamos o plano Pro.' },
  { q: 'Existe desconto para pagamento anual?', a: 'Sim! Ao escolher o plano anual, você economiza 20% em relação ao pagamento mensal.' },
  { q: 'Como funciona o suporte prioritário do Elite?', a: 'Usuários Elite têm acesso a um canal exclusivo de suporte com tempo de resposta garantido de até 2 horas.' },
];

export function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('plans').select('*').order('price_monthly').then(({ data }) => setPlans(data || []));
  }, []);

  const currentPlanId = (user as any)?.plans?.id || user?.plan_id;

  async function subscribe(plan: Plan) {
    if (!user) return;
    if (plan.price_monthly === 0) return;

    // Demo mode: simulate subscription upgrade
    alert(`✓ Simulação: Você foi "atualizado" para o plano ${plan.name}.\n\nEm modo desenvolvimento, nenhum débito é realizado.`);

    // Update user's plan in demo mode
    await supabase.from('users').update({ plan_id: plan.id }).eq('id', user.id);
  }

  const planIcons: Record<string, React.ReactNode> = {
    Free: <span className="text-2xl">🌱</span>,
    Pro: <Zap size={24} className="text-accent-sky" />,
    Elite: <Star size={24} className="text-warning fill-warning" />,
  };

  const planColors: Record<string, string> = {
    Free: 'border-white/10',
    Pro: 'border-accent-blue blue-glow',
    Elite: 'border-warning/40',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12 animate-fade-in">
      {/* Demo info */}
      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" />
        <div className="text-sm text-warning">
          <strong>Modo Demo:</strong> Pagamentos desativados localmente. Os botões simularão uma atualização de plano sem integração Stripe.
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-text-primary mb-3">Escolha seu plano</h1>
        <p className="text-text-muted max-w-xl mx-auto">Comece grátis. Escale quando precisar. Cancele quando quiser.</p>

        <div className="inline-flex items-center gap-3 mt-6 bg-white/5 border border-white/10 rounded-xl p-1">
          {(['monthly', 'yearly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${billing === b ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}>
              {b === 'monthly' ? 'Mensal' : (
                <span className="flex items-center gap-2">Anual <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded-full">-20%</span></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const features = plan.features as string[];
          const price = billing === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
          const isCurrent = plan.id === currentPlanId;
          const isFeatured = plan.is_featured;

          return (
            <div key={plan.id} className={`glass-card p-6 border-2 relative ${planColors[plan.name] || 'border-white/10'} ${isFeatured ? 'scale-105' : ''}`}>
              {isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent-blue text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">Mais Popular</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.name === 'Free' ? 'bg-white/10' : plan.name === 'Pro' ? 'bg-accent-sky/10' : 'bg-warning/10'}`}>
                  {planIcons[plan.name]}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-text-primary">{plan.name}</h3>
                  {isCurrent && <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">Plano atual</span>}
                </div>
              </div>

              <div className="mb-6">
                {plan.price_monthly === 0 ? (
                  <div className="text-4xl font-display font-bold text-text-primary">Grátis</div>
                ) : (
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-sm text-text-muted">R$</span>
                      <span className="text-4xl font-display font-bold text-text-primary">{price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-text-muted mb-1">/mês</span>
                    </div>
                    {billing === 'yearly' && (
                      <p className="text-xs text-text-muted mt-1">
                        <span className="line-through">R${plan.price_monthly.toFixed(2).replace('.', ',')}</span>
                        {' '}cobrado anualmente
                      </p>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-muted">
                    <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.price_monthly === 0 ? null : subscribe(plan)}
                disabled={isCurrent || loading === plan.id}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  isCurrent
                    ? 'bg-white/10 text-text-muted cursor-default'
                    : isFeatured
                    ? 'bg-accent-blue hover:bg-blue-500 text-white'
                    : 'btn-secondary'
                } disabled:opacity-70`}
              >
                {loading === plan.id ? 'Redirecionando...' :
                  isCurrent ? 'Plano atual' :
                  plan.price_monthly === 0 ? 'Começar Grátis' :
                  `Assinar ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-text-primary text-center mb-6">Perguntas Frequentes</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-medium text-text-primary text-sm">{item.q}</span>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-text-muted border-t border-white/[0.07] pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm border border-success/20">
          <span className="w-2 h-2 rounded-full bg-success" />
          ODS 3 — Plataforma comprometida com saúde inclusiva para todos
        </div>
      </div>
    </div>
  );
}
