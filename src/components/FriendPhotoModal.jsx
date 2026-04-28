import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const FriendPhotoModal = ({ friend, currentUser, darkMode, onClose, onOpenProfile }) => {
  const [reactions, setReactions] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const lastTapRef = useRef(0);

  const myUserId = String(currentUser?.id || '').trim();
  const ownerId = String(friend?.userId || '').trim();
  const memoryDate = friend?.memoryDate || '';

  useEffect(() => {
    if (!ownerId || !memoryDate) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('memory_reactions')
        .select('id, type, comment_text, reactor_user_id, created_at')
        .eq('memory_owner_id', ownerId)
        .eq('memory_date', memoryDate)
        .order('created_at', { ascending: true });
      if (!cancelled) setReactions(data || []);
    })();
    return () => { cancelled = true; };
  }, [ownerId, memoryDate]);

  const myLike = reactions.find((r) => r.type === 'like' && String(r.reactor_user_id) === myUserId);

  const toggleLike = useCallback(async () => {
    if (!myUserId || submitting) return;
    setSubmitting(true);
    try {
      if (myLike) {
        await supabase.from('memory_reactions').delete().eq('id', myLike.id);
        setReactions((prev) => prev.filter((r) => r.id !== myLike.id));
      } else {
        const { data } = await supabase
          .from('memory_reactions')
          .insert({ memory_owner_id: ownerId, memory_date: memoryDate, reactor_user_id: myUserId, type: 'like' })
          .select('id, type, comment_text, reactor_user_id, created_at')
          .single();
        if (data) setReactions((prev) => [...prev, data]);
      }
    } catch {} finally { setSubmitting(false); }
  }, [myUserId, myLike, ownerId, memoryDate, submitting]);

  const submitComment = useCallback(async () => {
    const text = commentDraft.trim();
    if (!text || !myUserId || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await supabase
        .from('memory_reactions')
        .insert({ memory_owner_id: ownerId, memory_date: memoryDate, reactor_user_id: myUserId, type: 'comment', comment_text: text })
        .select('id, type, comment_text, reactor_user_id, created_at')
        .single();
      if (data) { setReactions((prev) => [...prev, data]); setCommentDraft(''); }
    } catch {} finally { setSubmitting(false); }
  }, [commentDraft, myUserId, ownerId, memoryDate, submitting]);

  const handlePhotoTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      lastTapRef.current = 0;
      if (!myLike && !submitting) {
        setHeartBurst(true);
        setTimeout(() => setHeartBurst(false), 800);
        toggleLike();
      }
    } else {
      lastTapRef.current = now;
    }
  }, [myLike, submitting, toggleLike]);

  const likeCount = reactions.filter((r) => r.type === 'like').length;
  const comments = reactions.filter((r) => r.type === 'comment');

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: 'rgba(0,0,0,0.97)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pb-2 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
        <button
          type="button"
          onClick={() => onOpenProfile?.({ userId: friend.userId })}
          className="text-white/70 text-sm font-medium active:opacity-50 transition-opacity"
        >
          {friend.handle}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 text-2xl leading-none active:opacity-50 transition-opacity p-1"
        >
          ✕
        </button>
      </div>

      {/* Photo */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden select-none"
        onClick={handlePhotoTap}
        style={{ cursor: 'pointer', touchAction: 'manipulation' }}
      >
        <img
          src={friend.photoUrl}
          alt={friend.handle}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
        {heartBurst && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ animation: 'heartPop 0.7s ease-out forwards' }}
          >
            <span style={{ fontSize: 96, filter: 'drop-shadow(0 0 24px rgba(244,63,94,0.7))' }}>❤️</span>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div
        className="shrink-0 px-4 pb-safe pb-6 pt-3 space-y-3"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      >
        {/* Like row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLike}
            disabled={submitting}
            className="text-2xl leading-none active:scale-125 transition-transform disabled:opacity-50"
          >
            {myLike ? '❤️' : '🤍'}
          </button>
          {likeCount > 0 && (
            <span className="text-white/60 text-sm">{likeCount}</span>
          )}
        </div>

        {/* Comments */}
        {comments.length > 0 && (
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm text-white/80">
                <span className="font-semibold shrink-0 text-white/50">
                  {String(c.reactor_user_id) === myUserId ? 'You' : '👤'}
                </span>
                <span className="break-words min-w-0">{c.comment_text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitComment(); } }}
            placeholder="Add a comment…"
            className="flex-1 min-w-0 text-sm rounded-xl px-3 py-2 outline-none border bg-white/10 border-white/20 text-white placeholder-white/30"
          />
          <button
            type="button"
            onClick={submitComment}
            disabled={!commentDraft.trim() || submitting}
            className="text-sm font-semibold transition-opacity disabled:opacity-40 active:opacity-60 shrink-0 text-pink-400"
          >
            Post
          </button>
        </div>
      </div>

      <style>{`
        @keyframes heartPop {
          0%   { opacity: 0; transform: scale(0.4); }
          30%  { opacity: 1; transform: scale(1.2); }
          60%  { opacity: 1; transform: scale(1.0); }
          100% { opacity: 0; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default FriendPhotoModal;
