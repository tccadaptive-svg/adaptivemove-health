import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Trash2, Sparkles, AlertCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getMockAiResponse, generateLoadingDelay } from '../lib/mockAi';
import type { AiChatMessage } from '../types/database';
import { LighthouseIcon } from '../components/ui/LighthouseIcon';

const QUICK_PROMPTS = [
  'Me dê um plano de treino semanal',
  'Quais exercícios são bons para iniciantes?',
  'Como melhorar minha alimentação?',
  'Treinos acessíveis para cadeirantes',
];

export function AiChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const { data, error } = await supabase.from('ai_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) throw error;
      setMessages(data || []);
    } catch {
      setError('Não foi possível carregar o histórico. Tente novamente.');
    } finally {
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading || !user) return;
    setInput('');
    setError(null);

    const userMsg: AiChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('ai_chat_messages').insert({ user_id: user.id, role: 'user', content });
    if (insertError) {
      setError('Erro ao enviar mensagem. Tente novamente.');
      return;
    }
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const delay = generateLoadingDelay();
      await new Promise(resolve => setTimeout(resolve, delay));
      const reply = getMockAiResponse(content);

      const { error: replyError } = await supabase.from('ai_chat_messages').insert({ user_id: user.id, role: 'assistant', content: reply });
      if (replyError) throw replyError;

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        user_id: user.id,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      }]);
    } catch {
      setError('Erro ao processar resposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, user]);

  const clearChat = useCallback(async () => {
    if (!user || !confirm('Limpar todo o histórico desta conversa?')) return;
    try {
      const { error } = await supabase.from('ai_chat_messages').delete().eq('user_id', user.id);
      if (error) throw error;
      setMessages([]);
    } catch {
      setError('Erro ao limpar histórico.');
    }
  }, [user]);

  if (initialLoading) {
    return (
      <div className="flex flex-col h-screen" role="status" aria-label="Carregando chat">
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-accent-blue animate-spin" />
            <p className="text-text-muted text-sm">Carregando conversa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center max-w-md px-4">
            <AlertTriangle size={48} className="text-warning mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold text-text-primary mb-2">Erro ao carregar</h2>
            <p className="text-text-muted text-sm mb-6">{error}</p>
            <button onClick={loadMessages} className="btn-primary inline-flex items-center gap-2">
              <RefreshCw size={16} aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-bg-secondary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-blue/20 rounded-xl flex items-center justify-center">
            <LighthouseIcon size={24} />
          </div>
          <div>
            <h1 className="font-display font-bold text-text-primary">Assistente AdaptiveMove</h1>
            <p className="text-xs text-success flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full" aria-hidden="true" />Online</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn-ghost text-sm flex items-center gap-1.5 text-text-muted hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-accent-blue">
            <Trash2 size={14} aria-hidden="true" /> Limpar
          </button>
        )}
      </div>

      {/* Demo info banner */}
      <div className="px-4 py-2 bg-accent-sky/10 border-b border-accent-sky/20 flex items-start gap-2" role="note" aria-label="Informação sobre modo demonstração">
        <AlertCircle size={14} className="text-accent-sky mt-0.5 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-accent-sky"><strong>Modo Demo:</strong> Respostas simuladas. Em produção com ANTHROPIC_API_KEY configurado, usará Claude real.</p>
      </div>

      {/* Error banner */}
      {error && messages.length > 0 && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2" role="alert">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-red-400 hover:underline">Fechar</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-6">
            <div className="w-20 h-20 bg-accent-blue/10 rounded-2xl flex items-center justify-center">
              <LighthouseIcon size={48} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Como posso ajudar?</h2>
              <p className="text-text-muted max-w-sm">Sou o assistente da AdaptiveMove, especialista em fitness, bem-estar e acessibilidade.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="glass-card p-3 text-sm text-left text-text-muted hover:text-text-primary hover:scale-[1.02] active:scale-[0.98] hover:border-accent-sky/30 transition-all flex items-start gap-2 focus:outline-none focus:ring-2 focus:ring-accent-blue gradient-border"
                >
                  <Sparkles size={14} className="text-accent-sky mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-accent-blue/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" aria-hidden="true">
                <LighthouseIcon size={20} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent-blue text-white rounded-tr-sm'
                  : 'bg-bg-card text-text-primary border border-white/[0.07] rounded-tl-sm'
              }`}
              aria-label={`${msg.role === 'user' ? 'Você' : 'Assistente'}: ${msg.content.replace(/[#*`]/g, '').slice(0, 50)}...`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
              <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-text-muted'}`}>
                {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in" aria-label="Assistente está digitando">
            <div className="w-8 h-8 bg-accent-blue/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" aria-hidden="true">
              <LighthouseIcon size={20} />
            </div>
            <div className="bg-bg-card border border-white/[0.07] rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 bg-accent-sky rounded-full animate-typing" style={{ animationDelay: `${i * 0.2}s` }} aria-hidden="true" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/[0.07] bg-bg-secondary">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
          className="flex gap-3 items-end max-w-4xl mx-auto"
        >
          <label htmlFor="ai-chat-input" className="sr-only">Mensagem</label>
          <textarea
            id="ai-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            className="input-field flex-1 resize-none min-h-[44px] max-h-32 py-3"
            rows={1}
            disabled={loading}
            aria-describedby="ai-chat-hint"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-blue"
            aria-label="Enviar mensagem"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
        <p id="ai-chat-hint" className="text-center text-[10px] text-text-muted mt-2">
          Não substitui consulta médica profissional.
        </p>
      </div>
    </div>
  );
}
