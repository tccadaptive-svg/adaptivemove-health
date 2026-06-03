import React, { useEffect, useRef, useState } from 'react';
import { Send, Search, Plus, Circle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Message, User } from '../types/database';

type ConversationUser = Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email' | 'updated_at'>;

interface Conversation {
  user: ConversationUser;
  lastMessage: Message | null;
  unread: number;
}

function Avatar({ user, size = 'sm' }: { user: ConversationUser; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  return (
    <div className={`${s} rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
      {user.avatar_url ? (
        <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
      ) : (
        <span className={`font-bold text-accent-blue ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
          {user.full_name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function isOnline(updatedAt: string) {
  return Date.now() - new Date(updatedAt).getTime() < 5 * 60000;
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();

    const sub = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as Message;
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
  }, [threadMessages]);

  async function loadConversations() {
    if (!user) return;
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) return;

    const userIds = new Set<string>();
    data.forEach(m => {
      const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      userIds.add(other);
    });

    if (userIds.size === 0) return;

    const { data: users } = await supabase.from('users')
      .select('id, full_name, avatar_url, email, updated_at')
      .in('id', Array.from(userIds));

    const convs: Conversation[] = (users || []).map(u => {
      const msgs = data.filter(m => m.sender_id === u.id || m.receiver_id === u.id);
      const unread = msgs.filter(m => m.receiver_id === user.id && !m.read).length;
      return { user: u as ConversationUser, lastMessage: msgs[0] || null, unread };
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
      .update({ read: true })
      .eq('sender_id', u.id)
      .eq('receiver_id', user.id)
      .eq('read', false);
    loadConversations();
  }

  async function sendMessage() {
    if (!input.trim() || !user || !selected) return;
    const content = input.trim();
    setInput('');
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selected.id, content });
    loadConversations();
  }

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

  return (
    <div className="flex h-screen">
      {/* Left panel */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-white/[0.07] bg-bg-secondary`}>
        <div className="p-4 border-b border-white/[0.07]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-xl font-bold text-text-primary">Mensagens</h1>
            <button onClick={() => setShowSearch(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted transition-colors">
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
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left">
                      <Avatar user={u} />
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
              <p className="text-text-muted text-sm">Nenhuma conversa ainda.</p>
              <button onClick={() => setShowSearch(true)} className="btn-primary text-sm mt-3">Nova conversa</button>
            </div>
          ) : (
            conversations.map(({ user: u, lastMessage, unread }) => (
              <button
                key={u.id}
                onClick={() => selectConversation(u)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 border-b border-white/[0.07] text-left transition-colors ${selected?.id === u.id ? 'bg-accent-blue/10 border-l-2 border-l-accent-blue' : ''}`}
              >
                <div className="relative">
                  <Avatar user={u} />
                  {isOnline(u.updated_at) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-bg-secondary rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary truncate">{u.full_name}</span>
                    {lastMessage && (
                      <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
                        {new Date(lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {lastMessage && <p className="text-xs text-text-muted truncate mt-0.5">{lastMessage.content}</p>}
                </div>
                {unread > 0 && (
                  <span className="bg-accent-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
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
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] bg-bg-secondary">
            <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg text-text-muted">
              ←
            </button>
            <div className="relative">
              <Avatar user={selected} />
              {isOnline(selected.updated_at) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-bg-secondary rounded-full" />
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{selected.full_name}</p>
              <p className="text-xs text-text-muted">
                {isOnline(selected.updated_at) ? (
                  <span className="text-success">Online</span>
                ) : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {threadMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender_id === user?.id
                    ? 'bg-accent-blue text-white rounded-tr-sm'
                    : 'bg-bg-card border border-white/[0.07] text-text-primary rounded-tl-sm'
                }`}>
                  {msg.content}
                  <div className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? 'text-blue-200' : 'text-text-muted'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-4 border-t border-white/[0.07] bg-bg-secondary">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="input-field flex-1"
              />
              <button type="submit" disabled={!input.trim()} className="btn-primary w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-50">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send size={32} className="text-text-muted" />
            </div>
            <p className="text-text-muted">Selecione uma conversa ou inicie uma nova</p>
          </div>
        </div>
      )}
    </div>
  );
}
