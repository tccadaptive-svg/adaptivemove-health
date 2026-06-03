import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Image, Send, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Post, PostComment, User } from '../types/database';

type PostWithUser = Post & {
  users: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null;
  isLiked?: boolean;
  comments?: (PostComment & { users: Pick<User, 'full_name' | 'avatar_url'> | null })[];
  showComments?: boolean;
};

function UserAvatar({ u, size = 10 }: { u: Pick<User, 'full_name' | 'avatar_url'> | null; size?: number }) {
  const s = `w-${size} h-${size}`;
  return (
    <div className={`${s} rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
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

  useEffect(() => {
    loadPosts();
  }, [tab]);

  async function loadPosts() {
    let query = supabase.from('posts')
      .select('*, users(id, full_name, avatar_url)')
      .order(tab === 'trending' ? 'likes_count' : 'created_at', { ascending: false })
      .limit(20);

    const { data } = await query;
    if (!data || !user) return;

    const { data: likes } = await supabase.from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', data.map(p => p.id));

    const likedSet = new Set(likes?.map(l => l.post_id) || []);
    setPosts((data as PostWithUser[]).map(p => ({ ...p, isLiked: likedSet.has(p.id) })));
  }

  async function createPost() {
    if (!content.trim() || !user) return;
    setPosting(true);
    await supabase.from('posts').insert({ user_id: user.id, content: content.trim() });
    setContent('');
    setPosting(false);
    loadPosts();
  }

  async function toggleLike(post: PostWithUser) {
    if (!user) return;
    if (post.isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      await supabase.from('posts').update({ likes_count: Math.max(0, post.likes_count - 1) }).eq('id', post.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      await supabase.from('posts').update({ likes_count: post.likes_count + 1 }).eq('id', post.id);
    }
    setPosts(prev => prev.map(p => p.id === post.id
      ? { ...p, isLiked: !p.isLiked, likes_count: p.isLiked ? p.likes_count - 1 : p.likes_count + 1 }
      : p
    ));
  }

  async function toggleComments(post: PostWithUser) {
    if (post.showComments) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, showComments: false } : p));
      return;
    }
    const { data } = await supabase.from('post_comments')
      .select('*, users(full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at');
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, showComments: true, comments: (data as any) || [] } : p));
  }

  async function addComment(postId: string) {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;
    await supabase.from('post_comments').insert({ post_id: postId, user_id: user.id, content: text });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    // Reload comments for that post
    const { data } = await supabase.from('post_comments')
      .select('*, users(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at');
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: (data as any) || [] } : p));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Create post */}
      <div className="glass-card p-5">
        <div className="flex gap-3">
          <UserAvatar u={user} />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Compartilhe sua conquista de hoje..."
              className="input-field resize-none w-full min-h-[80px]"
            />
            <div className="flex items-center justify-between mt-3">
              <button className="btn-ghost text-sm flex items-center gap-1.5 text-text-muted">
                <Image size={16} /> Foto
              </button>
              <button onClick={createPost} disabled={!content.trim() || posting}
                className="btn-primary text-sm px-5 disabled:opacity-50">
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
        {([['forYou', 'Para Você'], ['trending', 'Em Alta']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {posts.map(post => (
        <div key={post.id} className="glass-card overflow-hidden animate-fade-in">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${post.isLiked ? 'text-red-400 bg-red-500/10' : 'text-text-muted hover:text-red-400 hover:bg-red-500/10'}`}>
              <Heart size={16} className={post.isLiked ? 'fill-red-400' : ''} />
              <span>{post.likes_count}</span>
            </button>
            <button onClick={() => toggleComments(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-accent-sky hover:bg-accent-sky/10 transition-colors">
              <MessageCircle size={16} />
              <span>{post.comments?.length || 0}</span>
            </button>
            <button onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors">
              <Share2 size={16} />
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
                  />
                  <button onClick={() => addComment(post.id)} className="btn-primary px-3 py-2">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
