import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Search, Plus, Bot, MessageSquare, Sparkles, Clock, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Message, User } from '../types/database';
import { useScrollAnimation } from '../hooks/useAnimations';

type ConversationUser = Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email' | 'updated_at'>;

interface Conversation {
  user: ConversationUser;
  lastMessage: Message | null;
  unread: number;
  isBot?: boolean;
}

const BOT_USERS: ConversationUser[] = [
  {
    id: 'bot-assistant',
    full_name: 'Assistente AdaptiveMove',
    avatar_url: null,
    email: 'bot@adaptivemove.local',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bot-coach',
    full_name: 'Coach Virtual',
    avatar_url: null,
    email: 'coach@adaptivemove.local',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bot-nutrition',
    full_name: 'Nutricionista IA',
    avatar_url: null,
    email: 'nutri@adaptivemove.local',
    updated_at: new Date().toISOString(),
  },
];

const BOT_RESPONSES: Record<string, { keywords: string[]; responses: string[] }> = {
  'bot-assistant': {
    keywords: ['ajuda', 'help', 'como', 'funciona', 'duvida', 'problema', 'erro'],
    responses: [
      'Olá! Sou o assistente do AdaptiveMove. Como posso ajudar você hoje?',
      'Posso ajudar com dúvidas sobre funcionalidades, planos ou configurações. O que precisa?',
      'Se tiver problemas técnicos, tente atualizar a página ou limpar o cache do navegador.',
    ],
  },
  'bot-coach': {
    keywords: ['treino', 'exercicio', 'musculacao', 'cardio', 'alongamento', 'descanso'],
    responses: [
      'Ótimo! Para treinos de força, recomendo 3-4 séries de 8-12 repetições. Quer uma sugestão personalizada?',
      'Lembre-se: o descanso é tão importante quanto o treino! Durma 7-8 horas por noite.',
      'Dica: varie seus exercícios a cada 4-6 semanas para evitar platôs e manter o progresso.',
      'Para iniciantes, sugiro começar com 3 dias por semana, focando em exercícios compostos.',
    ],
  },
  'bot-nutrition': {
    keywords: ['dieta', 'alimentacao', 'caloria', 'proteina', 'agua', 'refeicao', 'peso'],
    responses: [
      'Dica nutricional: beba pelo menos 2 litros de água por dia. A hidratação é fundamental!',
      'Para ganho de massa, consuma 1.6-2.2g de proteína por kg de peso corporal.',
      'Refeições pré-treino: carboidratos complexos 1-2h antes. Pós-treino: proteína + carboidrato.',
      'Evite dietas restritivas extremas. O equilíbrio é a chave para resultados sustentáveis.',
    ],
  },
};

function getBotResponse(botId: string, userMessage: string): string {
  const bot = BOT_RESPONSES[botId];
  if (!bot) return 'Olá! Como posso ajudar?';

  const lowerMsg = userMessage.toLowerCase();
  const matchedKeyword = bot.keywords.find(kw => lowerMsg.includes(kw));

  if (matchedKeyword) {
    const matchingResponses = bot.responses;
    return matchingResponses[Math.floor(Math.random() * matchingResponses.length)];
  }

  const defaultResponses = [
    'Interessante! Conte-me mais sobre isso.',
    'Entendi. Tem mais alguma dúvida?',
    'Posso ajudar com isso. Quer que eu explique melhor?',
    'Ótima pergunta! Deixe-me buscar a melhor informação para você.',
  ];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function BotAvatar({ botId }: { botId: string }) {
  const colors: Record<string, string> = {
    'bot-assistant': 'bg-accent-blue/20 border-accent-blue/30',
    'bot-coach': 'bg-warning/10 border-warning/30',
    'bot-nutrition': 'bg-success/10 border-success/30',
  };
  const icons: Record<string, React.ReactNode> = {
    'bot-assistant': <Sparkles size={16} className="text-accent-blue" />,
    'bot-coach': <Bot size={16} className="text-warning" />,
    'bot-nutrition': <MessageSquare size={16} className="text-success" />,
  };

  return (
    <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${colors[botId] || 'bg-white/10 border-white/20'}`}>
      {icons[botId] || <Bot size={16} className="text-text-muted" />}
    </div>
  );
}

export function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<ConversationUser | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const [searchResults, setSearchResults] = useState<ConversationUser[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const leftPanelRef = useScrollAnimation();
  const rightPanelRef = useScrollAnimation();

  useEffect(() => {
    if (!user) return;
    loadConversations();

    const sub = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: { new: Message }) => {
        const msg = payload.new;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          setThreadMessages(prev => {
            if (selected && (msg.sender_id === selected.id || msg.receiver_id === selected.id)) {
              return [...prev, msg];
            }
            return prev;
          });
          loadConversations();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user, selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages, isTyping]);

  async function loadConversations() {
    if (!user) return;
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) return;

    const userIds = new Set<string>();
    data.forEach((m: Message) => {
      const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      userIds.add(other);
    });

    // Add bot users
    BOT_USERS.forEach(bot => userIds.add(bot.id));

    if (userIds.size === 0) {
      // Show bots even with no messages
      const botConvs: Conversation[] = BOT_USERS.map(bot => ({
        user: bot,
        lastMessage: null,
        unread: 0,
        isBot: true,
      }));
      setConversations(botConvs);
      return;
    }

    const { data: users } = await supabase.from('users')
      .select('id, full_name, avatar_url, email, updated_at')
      .in('id', Array.from(userIds));

    const realUsers = users || [];
    const convs: Conversation[] = realUsers.map((u: any) => {
      const msgs = data.filter((m: Message) => m.sender_id === u.id || m.receiver_id === u.id);
      const unread = msgs.filter((m: Message) => m.receiver_id === user.id && !m.read).length;
      return { user: u as ConversationUser, lastMessage: msgs[0] || null, unread, isBot: false };
    });

    // Add bots without messages
    const existingIds = new Set(realUsers.map((u: any) => u.id));
    BOT_USERS.forEach(bot => {
      if (!existingIds.has(bot.id)) {
        convs.push({ user: bot, lastMessage: null, unread: 0, isBot: true });
      }
    });

    setConversations(convs);
  }

  async function selectConversation(u: ConversationUser) {
    setSelected(u);
    setShowSearch(false);
    if (!user) return;

    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`)
      .order('created_at');
    setThreadMessages(data || []);

    // Mark as read
    await supabase.from('messages')
      .update({ read: true } as never)
      .eq('sender_id', u.id)
      .eq('receiver_id', user.id)
      .eq('read', false);

    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !user || !selected) return;
    const content = input.trim();
    setInput('');

    // Insert user message
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selected.id, content } as never);
    loadConversations();

    // If talking to a bot, simulate response
    if (selected.id.startsWith('bot-')) {
      setIsTyping(true);
      const delay = 1000 + Math.random() * 2000;
      setTimeout(async () => {
        const botResponse = getBotResponse(selected.id, content);
        await supabase.from('messages').insert({
          sender_id: selected.id,
          receiver_id: user.id,
          content: botResponse,
        } as never);
        setIsTyping(false);
        loadConversations();
      }, delay);
    }
  }, [input, user, selected]);

  async function handleSearchUsers(q: string) {
    setSearchUsers(q);
    if (!q.trim() || !user) { setSearchResults([]); return; }
    const { data } = await supabase.from('users')
      .select('id, full_name, avatar_url, email, updated_at')
      .neq('id', user.id)
      .ilike('full_name', `%${q}%`)
      .limit(5);
    setSearchResults((data as ConversationUser[]) || []);
  }

  const quickReplies = selected?.id.startsWith('bot-')
    ? selected.id === 'bot-assistant'
      ? ['Como funciona o app?', 'Quais são os planos?', 'Problemas técnicos']
      : selected.id === 'bot-coach'
      ? ['Dica de treino', 'Quantos dias treinar?', 'Como ganhar massa?']
      : ['Dica de alimentação', 'Quantas calorias?', 'Como beber mais água?']
    : [];

  return (
    <div className="flex h-screen">
      {/* Left panel */}
      <div ref={leftPanelRef.ref} className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-white/[0.07] bg-bg-secondary gradient-border ${leftPanelRef.isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="p-4 border-b border-white/[0.07]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-xl font-bold text-text-primary">Mensagens</h1>
            <button onClick={() => setShowSearch(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted transition-colors hover-scale">
              <Plus size={18} />
            </button>
          </div>
          {showSearch ? (
            <div>
              <input
                autoFocus
                type="text"
                value={searchUsers}
                onChange={e => handleSearchUsers(e.target.value)}
                placeholder="Buscar usuário..."
                className="input-field text-sm"
              />
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults.map(u => (
                    <button key={u.id} onClick={() => selectConversation(u)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left transition-colors">
                      <div className="w-10 h-10 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-accent-blue">{u.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{u.full_name}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Pesquisar..." className="input-field pl-8 text-sm py-2" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
                <MessageSquare size={24} className="text-text-muted" aria-hidden="true" />
              </div>
              <p className="text-text-muted text-sm font-medium">Nenhuma conversa ainda</p>
              <p className="text-text-muted/60 text-xs mt-1 mb-3">Converse com assistentes virtuais ou outros usuários</p>
              <button onClick={() => setShowSearch(true)} className="btn-primary text-sm mt-1">Nova conversa</button>
            </div>
          ) : (
            conversations.map(({ user: u, lastMessage, unread, isBot }) => (
              <button
                key={u.id}
                onClick={() => selectConversation(u)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 border-b border-white/[0.07] text-left transition-all hover:translate-x-1 ${selected?.id === u.id ? 'bg-accent-blue/10 border-l-2 border-l-accent-blue' : ''}`}
              >
                {isBot ? (
                  <BotAvatar botId={u.id} />
                ) : (
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-sm font-bold text-accent-blue">{u.full_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary truncate flex items-center gap-1.5">
                      {u.full_name}
                      {isBot && <Bot size={12} className="text-accent-blue" />}
                    </span>
                    {lastMessage && (
                      <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
                        {new Date(lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {lastMessage ? (
                    <p className="text-xs text-text-muted truncate mt-0.5">{lastMessage.content}</p>
                  ) : (
                    <p className="text-xs text-accent-blue/60 truncate mt-0.5">Clique para iniciar conversa</p>
                  )}
                </div>
                {unread > 0 && (
                  <span className="bg-accent-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 pulse-ring">
                    {unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      {selected ? (
        <div ref={rightPanelRef.ref} className={`flex-1 flex flex-col gradient-border ${rightPanelRef.isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] bg-bg-secondary">
            <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg text-text-muted transition-colors">
              ←
            </button>
            {selected.id.startsWith('bot-') ? (
              <BotAvatar botId={selected.id} />
            ) : (
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-sm font-bold text-accent-blue">{selected.full_name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
            )}
            <div>
              <p className="font-semibold text-text-primary flex items-center gap-1.5">
                {selected.full_name}
                {selected.id.startsWith('bot-') && <Bot size={14} className="text-accent-blue" />}
              </p>
              <p className="text-xs text-text-muted">
                {selected.id.startsWith('bot-') ? (
                  <span className="text-accent-blue">Assistente virtual</span>
                ) : (
                  <span className="text-success">Online</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {threadMessages.length === 0 && !isTyping && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare size={24} className="text-text-muted" />
                </div>
                <p className="text-text-muted text-sm">Inicie a conversa!</p>
                {selected.id.startsWith('bot-') && (
                  <p className="text-xs text-text-muted/60 mt-1">O assistente responderá automaticamente</p>
                )}
              </div>
            )}
            {threadMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end slide-in-right' : 'justify-start slide-in-left'}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm transition-all hover:scale-[1.02] ${
                  msg.sender_id === user?.id
                    ? 'bg-accent-blue text-white rounded-tr-sm hover:shadow-lg hover:shadow-accent-blue/20'
                    : 'bg-bg-card border border-white/[0.07] text-text-primary rounded-tl-sm hover:bg-white/10'
                }`}>
                  {msg.content}
                  <div className={`flex items-center gap-1 text-[10px] mt-1 ${msg.sender_id === user?.id ? 'text-blue-200' : 'text-text-muted'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender_id === user?.id && <CheckCheck size={10} />}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start slide-in-left">
                <div className="bg-bg-card border border-white/[0.07] px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-text-muted/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-text-muted/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-text-muted/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies for bots */}
          {quickReplies.length > 0 && !isTyping && (
            <div className="px-4 py-2 border-t border-white/[0.07] bg-bg-secondary">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickReplies.map(reply => (
                  <button
                    key={reply}
                    onClick={() => { setInput(reply); }}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-text-muted hover:text-text-primary hover:bg-white/10 hover:scale-105 active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-4 border-t border-white/[0.07] bg-bg-secondary/95 backdrop-blur-sm">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={selected.id.startsWith('bot-') ? 'Digite sua mensagem...' : 'Digite uma mensagem...'}
                className="input-field flex-1"
                aria-label="Mensagem"
              />
              <button type="submit" disabled={!input.trim()} className="btn-primary w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <MessageSquare size={32} className="text-text-muted" aria-hidden="true" />
            </div>
            <p className="text-text-muted font-medium">Selecione uma conversa</p>
            <p className="text-xs text-text-muted/60 mt-1">Converse com assistentes virtuais ou outros usuários</p>
          </div>
        </div>
      )}
    </div>
  );
}
