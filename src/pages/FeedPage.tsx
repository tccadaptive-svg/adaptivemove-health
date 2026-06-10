import { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Image, Send, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Post, PostComment, User } from '../types/database';

type PostWithUser = Post & {
  users: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null;
  isLiked?: boolean;
  comments?: (PostComment & { users: Pick<User, 'full_name' | 'avatar_url'> | null })[];
  showComments?: boolean;
};

const AVATAR_SIZES: Record<number, string> = {
  8: 'w-8 h-8',
  10: 'w-10 h-10',
};

function UserAvatar({ u, size = 10 }: { u: Pick<User, 'full_name' | 'avatar_url'> | null; size?: number }) {
  const sizeClass = AVATAR_SIZES[size] || 'w-10 h-10';
  return (
    <div className={`${sizeClass} rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
      {u?.avatar_url ? (
        <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
      ) : (
        <span className="text-xs font-bold text-accent-blue">{(u?.full_name || '?').charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'agora';
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'forYou' | 'trending'>('forYou');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setError(null);
    try {
      let query = supabase.from('posts')
        .select('*, users(id, full_name, avatar_url)')
        .order(tab === 'trending' ? 'likes_count' : 'created_at', { ascending: false })
        .limit(20);

      const { data: postsData, error: postsError } = await query;
      if (postsError) throw postsError;
      if (!postsData || !user) {
        setLoading(false);
        return;
      }

      const typedPosts = postsData as PostWithUser[];
      const { data: likes, error: likesError } = await supabase.from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', typedPosts.map(p => p.id));

      if (likesError) throw likesError;

      const likedSet = new Set(likes?.map((l: { post_id: string }) => l.post_id) || []);
      setPosts(typedPosts.map(p => ({ ...p, isLiked: likedSet.has(p.id) })));
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Não foi possível carregar o feed. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [tab, user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = useCallback(async () => {
    if (!content.trim() || !user) return;
    if (content.length > 1000) {
      setError('Postagem muito longa (máximo 1000 caracteres)');
      return;
    }
    setPosting(true);
    setError(null);
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content: content.trim() } as never);
    setPosting(false);
    if (error) {
      setError('Erro ao publicar. Tente novamente.');
      return;
    }
    setContent('');
    loadPosts();
  }, [content, user, loadPosts]);

  const toggleLike = useCallback(async (post: PostWithUser) => {
    if (!user) return;
    try {
      const wasLiked = post.isLiked;
      const newCount = wasLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1;

      // Optimistic update
      setPosts(prev => prev.map(p => p.id === post.id
        ? { ...p, isLiked: !wasLiked, likes_count: newCount }
        : p
      ));

      if (wasLiked) {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
      }
      const { error: updateError } = await supabase.from('posts').update({ likes_count: newCount }).eq('id', post.id);
      if (updateError) throw updateError;
    } catch {
      // Revert on error
      setPosts(prev => prev.map(p => p.id === post.id
        ? { ...p, isLiked: post.isLiked, likes_count: post.likes_count }
        : p
      ));
      setError('Erro ao atualizar like');
    }
  }, [user]);

  const toggleComments = useCallback(async (post: PostWithUser) => {
    if (post.showComments) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, showComments: false } : p));
      return;
    }
    try {
      const { data, error } = await supabase.from('post_comments')
        .select('*, users(full_name, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at');
      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, showComments: true, comments: data || [] } : p));
    } catch {
      setError('Erro ao carregar comentários');
    }
  }, []);

  const addComment = useCallback(async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;
    if (text.length > 500) {
      setError('Comentário muito longo (máximo 500 caracteres)');
      return;
    }
    try {
      const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: user.id, content: text } as never);
      if (error) throw error;
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      const { data } = await supabase.from('post_comments')
        .select('*, users(full_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at');
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data || [] } : p));
    } catch {
      setError('Erro ao adicionar comentário');
    }
  }, [commentInputs, user]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6" role="status" aria-label="Carregando feed">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center py-16">
          <AlertTriangle size={48} className="text-warning mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Erro ao carregar</h2>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">{error}</p>
          <button onClick={loadPosts} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Create post */}
      <div className="glass-card p-5 gradient-border hover-lift">
        <div className="flex gap-3">
          <UserAvatar u={user} />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Compartilhe sua conquista de hoje..."
              className="input-field resize-none w-full min-h-[80px] focus:ring-2 focus:ring-accent-blue/50"
              aria-label="Nova publicação"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs ${content.length > 900 ? 'text-warning' : 'text-text-muted'}`}>
                  {content.length}/1000
                </span>
                <button className="btn-ghost text-sm flex items-center gap-1.5 text-text-muted hover:text-text-primary" aria-label="Adicionar foto">
                  <Image size={16} aria-hidden="true" /> Foto
                </button>
              </div>
              <button onClick={handleCreatePost} disabled={!content.trim() || posting}
                className="btn-primary text-sm px-5 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
                aria-busy={posting}
              >
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10" role="tablist" aria-label="Filtro de feed">
        {([['forYou', 'Para Você'], ['trending', 'Em Alta']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            role="tab"
            aria-selected={tab === key}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue ${tab === key ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Image size={28} className="text-text-muted" aria-hidden="true" />
          </div>
          <p className="text-text-muted text-sm font-medium">Nenhuma publicação ainda</p>
          <p className="text-text-muted/60 text-xs mt-1">Seja o primeiro a compartilhar!</p>
        </div>
      ) : (
        posts.map(post => (
          <article key={post.id} className="glass-card overflow-hidden animate-fade-in hover-lift gradient-border">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <UserAvatar u={post.users} />
                  <div>
                    <p className="font-medium text-text-primary text-sm">{post.users?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-text-muted">{formatRelative(post.created_at)}</p>
                  </div>
                </div>
              </div>

              <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {(post.media_urls as string[])?.length > 0 && (
                <div className="mt-3 rounded-xl overflow-hidden">
                  <img src={(post.media_urls as string[])[0]} alt="" className="w-full object-cover max-h-80" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 px-5 py-3 border-t border-white/[0.07]">
              <button onClick={() => toggleLike(post)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent-blue ${post.isLiked ? 'text-red-400 bg-red-500/10' : 'text-text-muted hover:text-red-400 hover:bg-red-500/10'}`}
                aria-label={post.isLiked ? 'Descurtir' : 'Curtir'}
                aria-pressed={post.isLiked}
              >
                <Heart size={16} className={`${post.isLiked ? 'fill-red-400' : ''} transition-transform`} aria-hidden="true" />
                <span>{post.likes_count}</span>
              </button>
              <button onClick={() => toggleComments(post)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-accent-sky hover:bg-accent-sky/10 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                aria-label="Comentários"
                aria-expanded={post.showComments}
              >
                <MessageCircle size={16} aria-hidden="true" />
                <span>{post.comments?.length || 0}</span>
              </button>
              <button onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/10 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                aria-label="Compartilhar"
              >
                <Share2 size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Comments */}
            {post.showComments && (
              <div className="px-5 pb-5 space-y-3 border-t border-white/[0.07] pt-3">
                {(post.comments || []).map(c => (
                  <div key={c.id} className="flex gap-2 items-start">
                    <UserAvatar u={c.users} size={8} />
                    <div className="flex-1 bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-xs font-medium text-text-primary">{c.users?.full_name}</p>
                      <p className="text-xs text-text-muted mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <UserAvatar u={user} size={8} />
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addComment(post.id)}
                      placeholder="Comentar..."
                      className="input-field text-sm py-2 flex-1"
                      aria-label="Escrever comentário"
                    />
                    <button onClick={() => addComment(post.id)} className="btn-primary px-3 py-2" aria-label="Enviar comentário">
                      <Send size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}
