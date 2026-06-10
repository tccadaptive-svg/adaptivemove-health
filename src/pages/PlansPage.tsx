import { useEffect, useState, useCallback, useMemo } from 'react';
import { Check, Zap, Star, ChevronDown, AlertCircle, Heart, Users, Shield, TrendingUp, Activity, RefreshCw, CheckCircle2, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Plan } from '../types/database';
import { useScrollAnimation } from '../hooks/useAnimations';

const FAQ = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso continua até o fim do período pago.' },
  { q: 'O plano Free tem limite de funcionalidades?', a: 'O plano Free inclui 5 treinos/mês e 10 mensagens de IA por dia. Para uso ilimitado, recomendamos o plano Pro.' },
  { q: 'Existe desconto para pagamento anual?', a: 'Sim! Ao escolher o plano anual, você economiza 20% em relação ao pagamento mensal.' },
  { q: 'Como funciona o suporte prioritário do Elite?', a: 'Usuários Elite têm acesso a um canal exclusivo de suporte com tempo de resposta garantido de até 2 horas.' },
];

const comparisonFeatures = [
  { name: 'Treinos por mês', free: '5', pro: 'Ilimitado', elite: 'Ilimitado' },
  { name: 'Mensagens IA/dia', free: '10', pro: 'Ilimitado', elite: 'Ilimitado' },
  { name: 'Mapa de academias', free: true, pro: true, elite: true },
  { name: 'Feed social', free: true, pro: true, elite: true },
  { name: 'Perfil público', free: true, pro: true, elite: true },
  { name: 'Calendário avançado', free: false, pro: true, elite: true },
  { name: 'Análise de desempenho', free: false, pro: true, elite: true },
  { name: 'Suporte prioritário', free: false, pro: false, elite: true },
  { name: 'Personal trainer virtual', free: false, pro: false, elite: true },
];

interface PlanCardProps {
  plan: Plan;
  price: number;
  isCurrent: boolean;
  isFeatured: boolean;
  isLoading: boolean;
  onSubscribe: (plan: Plan) => void;
}

function PlanCard({ plan, price, isCurrent, isFeatured, isLoading, onSubscribe }: PlanCardProps) {
  const features = plan.features as string[];

  const planConfig = useMemo(() => ({
    Free: {
      icon: <Activity size={28} className="text-text-muted" aria-hidden="true" />,
      bg: 'bg-white/10',
      border: 'border-white/10',
      badge: 'bg-white/10 text-text-muted',
      btnClass: 'btn-secondary',
    },
    Pro: {
      icon: <Zap size={28} className="text-accent-sky" aria-hidden="true" />,
      bg: 'bg-accent-sky/10',
      border: 'border-accent-blue blue-glow',
      badge: 'bg-accent-sky/10 text-accent-sky',
      btnClass: 'bg-accent-blue hover:bg-blue-500 text-white shadow-lg shadow-accent-blue/20',
    },
    Elite: {
      icon: <Star size={28} className="text-warning fill-warning" aria-hidden="true" />,
      bg: 'bg-warning/10',
      border: 'border-warning/40',
      badge: 'bg-warning/10 text-warning',
      btnClass: 'bg-warning hover:bg-amber-500 text-white shadow-lg shadow-warning/20',
    },
  }), []);

  const config = planConfig[plan.name as keyof typeof planConfig] || planConfig.Free;

  return (
    <div className={`glass-card p-6 border-2 relative hover-lift gradient-border ${config.border} ${isFeatured ? 'md:scale-105 shadow-lg' : ''}`}>
      {isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-primary text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-lg">
            Mais Popular
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${config.bg} group-hover:scale-110 transition-transform`}>
          {config.icon}
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-text-primary group-hover:text-accent-sky transition-colors">{plan.name}</h3>
          {isCurrent && (
            <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-success/20">
              <CheckCircle2 size={12} aria-hidden="true" />
              Plano atual
            </span>
          )}
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
          </div>
        )}
      </div>

      <ul className="space-y-2.5 mb-6" aria-label={`Recursos do plano ${plan.name}`}>
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-muted group-hover:text-text-primary transition-colors">
            <Check size={14} className="text-success mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(plan)}
        disabled={isCurrent || isLoading}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-bg-secondary ${config.btnClass}`}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
            Processando...
          </span>
        ) : isCurrent ? (
          'Plano atual'
        ) : plan.price_monthly === 0 ? (
          'Começar Grátis'
        ) : (
          `Assinar ${plan.name}`
        )}
      </button>
    </div>
  );
}

export function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headerRef = useScrollAnimation();
  const plansRef = useScrollAnimation();
  const comparisonRef = useScrollAnimation();
  const faqRef = useScrollAnimation();
  const odsRef = useScrollAnimation();

  const loadPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('plans').select('*').order('price_monthly');
      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Não foi possível carregar os planos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const currentPlanId = user?.plans?.id || user?.plan_id;

  const subscribe = useCallback(async (plan: Plan) => {
    if (!user) return;
    if (plan.price_monthly === 0) return;

    setLoadingPlan(plan.id);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { error } = await supabase.from('users').update({ plan_id: plan.id } as never).eq('id', user.id);
      if (error) throw error;

      alert(`✓ Simulação: Você foi "atualizado" para o plano ${plan.name}.\n\nEm modo desenvolvimento, nenhum débito é realizado.`);
      window.location.reload();
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Erro ao assinar plano. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  }, [user]);

  const toggleFaq = useCallback((index: number) => {
    setOpenFaq(prev => prev === index ? null : index);
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8" role="status" aria-label="Carregando planos">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-48 mx-auto" />
          <div className="h-12 bg-white/5 rounded-xl w-64 mx-auto" />
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center py-16">
          <AlertCircle size={48} className="text-warning mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Erro ao carregar</h2>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">{error}</p>
          <button onClick={loadPlans} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12 sm:space-y-16">
      {/* Demo info */}
      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in" role="note" aria-label="Informação sobre modo demonstração">
        <AlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="text-sm text-warning">
          <strong>Modo Demo:</strong> Pagamentos desativados localmente. Os botões simularão uma atualização de plano sem integração Stripe.
        </div>
      </div>

      {/* Header */}
      <div ref={headerRef.ref} className={`text-center ${headerRef.isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-3">Escolha seu plano</h1>
        <p className="text-text-muted max-w-xl mx-auto text-sm sm:text-base">Comece grátis. Escale quando precisar. Cancele quando quiser.</p>

        <div className="inline-flex items-center gap-3 mt-6 bg-white/5 border border-white/10 rounded-xl p-1" role="tablist" aria-label="Tipo de cobrança">
          {(['monthly', 'yearly'] as const).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              role="tab"
              aria-selected={billing === b}
              className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue ${billing === b ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              {b === 'monthly' ? 'Mensal' : (
                <span className="flex items-center gap-2">
                  Anual
                  <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded-full">-20%</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div ref={plansRef.ref} className={`grid md:grid-cols-3 gap-4 sm:gap-6 ${plansRef.isVisible ? 'stagger-children visible' : 'stagger-children'}`}>
        {plans.map(plan => {
          const price = billing === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
          const isCurrent = plan.id === currentPlanId;
          const isFeatured = plan.is_featured;

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              price={price}
              isCurrent={isCurrent}
              isFeatured={isFeatured}
              isLoading={loadingPlan === plan.id}
              onSubscribe={subscribe}
            />
          );
        })}
        {plans.length === 0 && (
          <div className="md:col-span-3 text-center py-12">
            <CreditCard size={40} className="text-text-muted mx-auto mb-3" aria-hidden="true" />
            <p className="text-text-muted text-sm">Nenhum plano disponível no momento</p>
          </div>
        )}
      </div>

      {/* Comparison table */}
      <div ref={comparisonRef.ref} className={`${comparisonRef.isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary text-center mb-6 sm:mb-8">Compare os planos</h2>
        <div className="glass-card overflow-x-auto">
          <table className="w-full min-w-[500px]" aria-label="Tabela comparativa de planos">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-text-muted">Recurso</th>
                <th className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-text-muted text-center">Free</th>
                <th className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-accent-sky text-center">Pro</th>
                <th className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-warning text-center">Elite</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feature, i) => (
                <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] transition-colors group">
                  <td className="p-3 sm:p-4 text-xs sm:text-sm text-text-primary font-medium group-hover:text-accent-sky transition-colors">{feature.name}</td>
                  <td className="p-3 sm:p-4 text-center group-hover:bg-white/5 transition-colors">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? <Check size={14} className="text-success mx-auto group-hover:scale-110 transition-transform" aria-label="Incluído" /> : <span className="text-text-muted/50" aria-label="Não incluído">—</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-text-muted group-hover:text-text-primary transition-colors">{feature.free}</span>
                    )}
                  </td>
                  <td className="p-3 sm:p-4 text-center group-hover:bg-white/5 transition-colors">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? <Check size={14} className="text-success mx-auto group-hover:scale-110 transition-transform" aria-label="Incluído" /> : <span className="text-text-muted/50" aria-label="Não incluído">—</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-text-muted group-hover:text-text-primary transition-colors">{feature.pro}</span>
                    )}
                  </td>
                  <td className="p-3 sm:p-4 text-center group-hover:bg-white/5 transition-colors">
                    {typeof feature.elite === 'boolean' ? (
                      feature.elite ? <Check size={14} className="text-success mx-auto group-hover:scale-110 transition-transform" aria-label="Incluído" /> : <span className="text-text-muted/50" aria-label="Não incluído">—</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-text-muted group-hover:text-text-primary transition-colors">{feature.elite}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ODS 3 Section */}
      <div ref={odsRef.ref} className={`${odsRef.isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="glass-card p-6 sm:p-8 border-success/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <Heart size={32} className="text-success" aria-hidden="true" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-2">ODS 3 — Saúde e Bem-Estar</h2>
              <p className="text-text-muted max-w-2xl text-sm sm:text-base">
                O AdaptiveMove está alinhado com o <strong className="text-success">Objetivo de Desenvolvimento Sustentável 3</strong> da ONU,
                que visa garantir uma vida saudável e promover o bem-estar para todos, em todas as idades.
                Nossa plataforma democratiza o acesso a informações de saúde, incentiva a prática regular de exercícios
                e conecta pessoas a academias e profissionais qualificados.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 hover:scale-105 transition-all cursor-default">
                  <Users size={24} className="text-accent-sky mx-auto mb-2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  <p className="text-sm font-medium text-text-primary">Comunidade Ativa</p>
                  <p className="text-xs text-text-muted mt-1">Milhares de usuários conectados</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 hover:scale-105 transition-all cursor-default">
                  <Shield size={24} className="text-success mx-auto mb-2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  <p className="text-sm font-medium text-text-primary">Saúde Inclusiva</p>
                  <p className="text-xs text-text-muted mt-1">Acessível para todos os perfis</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 hover:scale-105 transition-all cursor-default">
                  <TrendingUp size={24} className="text-warning mx-auto mb-2 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  <p className="text-sm font-medium text-text-primary">Resultados Reais</p>
                  <p className="text-xs text-text-muted mt-1">Acompanhamento de progresso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div ref={faqRef.ref} className={`max-w-2xl mx-auto ${faqRef.isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary text-center mb-6">Perguntas Frequentes</h2>
        <div className="space-y-3" role="region" aria-label="Perguntas frequentes">
          {FAQ.map((item, i) => (
            <div key={i} className="glass-card overflow-hidden hover-glow gradient-border">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-inset group"
                aria-expanded={openFaq === i}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="font-medium text-text-primary text-sm pr-4 group-hover:text-accent-sky transition-colors">{item.q}</span>
                <ChevronDown size={16} className={`text-text-muted transition-all duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-180 text-accent-sky' : ''}`} aria-hidden="true" />
              </button>
              <div
                id={`faq-answer-${i}`}
                className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}
                aria-hidden={openFaq !== i}
              >
                <div className="px-4 pb-4 text-sm text-text-muted border-t border-white/[0.07] pt-3 animate-fade-in">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm border border-success/20">
          <Heart size={14} aria-hidden="true" />
          ODS 3 — Plataforma comprometida com saúde inclusiva para todos
        </div>
      </div>
    </div>
  );
}
