/**
 * InvitePicker — shared invite/people-picker sheet used across trips, chapters, and calendars.
 *
 * Props:
 *   targetType   'chapter' | 'trip' | 'calendar'
 *   targetId     ID of the target resource (for share link generation)
 *   targetTitle  Display name shown in the sheet header
 *   ownerId      owner_id written to share_links when generating an invite link
 *   collaborators  [{ email, handle? }]  already-added members to show at bottom
 *   onInvite     async (email: string) => void   called when a Komo user is added
 *   onClose      () => void
 *   darkMode     boolean
 */

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const GRADIENTS = [
  'linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)',
  'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
  'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
];
const gradient = (seed) => {
  let h = 0;
  const s = String(seed || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
};

export default function InvitePicker({
  targetType = 'chapter',
  targetId,
  targetTitle = '',
  ownerId = '',
  collaborators = [],
  onInvite,
  onClose,
  darkMode = false,
}) {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [added, setAdded]           = useState(new Set());
  const [linkCopied, setLinkCopied] = useState(false);
  const searchTimer                 = useRef(null);

  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#64748b' : '#9ca3af';
  const inputBg  = darkMode ? 'rgba(255,255,255,0.05)' : '#f9f8f5';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5';
  const rowBg    = darkMode ? 'rgba(255,255,255,0.04)' : '#f9f8f5';

  const collabEmails = new Set((collaborators || []).map(c => String(c.email || c.handle || '')));

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('handles')
        .select('handle, email, user_id, phone')
        .or(`handle.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(6);
      setResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  async function handleAdd(user) {
    const email = user.email || '';
    if (!email) return;
    await onInvite?.(email);
    setAdded(prev => new Set([...prev, email]));
  }

  async function handleShareLink() {
    const token = Math.random().toString(36).slice(2, 12);
    await supabase.from('share_links').insert({
      owner_id: ownerId || '',
      target_type: targetType,
      target_id: targetId || '',
      token,
      is_active: true,
    });
    const link = `${window.location.origin}${window.location.pathname}?${targetType}_invite=${token}`;
    if (navigator.share) {
      navigator.share({ title: `Join "${targetTitle}" on Komo`, url: link }).catch(() => {});
    } else {
      navigator.clipboard.writeText(link).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
      });
    }
  }

  const showNoResults = query.trim().length >= 2 && !searching && results.length === 0;

  const typeLabel = targetType === 'trip' ? 'trip' : targetType === 'calendar' ? 'calendar' : 'chapter';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: sheetBg, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', maxHeight: '88dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 20px max(36px, calc(env(safe-area-inset-bottom) + 20px))' }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 20px' }} />

        <h3 style={{ fontSize: 20, fontWeight: 700, color: tp, margin: '0 0 4px' }}>
          Invite to {targetTitle}
        </h3>
        <p style={{ fontSize: 13, color: ts, margin: '0 0 18px' }}>
          Search by name or username — they'll be added to this {typeLabel} instantly.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, opacity: 0.5 }}>🔍</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name or username…"
            style={{ width: '100%', background: inputBg, border: `1px solid ${inputBdr}`, borderRadius: 14, padding: '11px 14px 11px 38px', fontSize: 15, color: tp, outline: 'none', boxSizing: 'border-box' }}
          />
          {searching && (
            <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: ts }}>…</span>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {results.map(u => {
              const email = u.email || '';
              const isCollab = collabEmails.has(email);
              const isAdded  = added.has(email);
              return (
                <div key={email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: rowBg, borderRadius: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: gradient(email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                    {(u.handle || email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: tp, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.handle || email}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#2dd4bf', fontWeight: 600 }}>✓ Komo user</p>
                  </div>
                  <button
                    onClick={() => handleAdd(u)}
                    disabled={isCollab || isAdded}
                    style={{ background: (isCollab || isAdded) ? 'transparent' : '#2dd4bf', border: (isCollab || isAdded) ? `1px solid ${inputBdr}` : 'none', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: (isCollab || isAdded) ? ts : '#0a1020', cursor: (isCollab || isAdded) ? 'default' : 'pointer', flexShrink: 0 }}
                  >
                    {isCollab ? 'Added' : isAdded ? '✓ Done' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Not on Komo → share link */}
        {showNoResults && (
          <div style={{ padding: '16px', background: rowBg, borderRadius: 14, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: tp }}>Not on Komo yet</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: ts }}>Send them an invite link</p>
            </div>
            <button
              onClick={handleShareLink}
              style={{ background: darkMode ? 'rgba(99,102,241,0.18)' : '#eef2ff', border: `1px solid ${darkMode ? 'rgba(99,102,241,0.35)' : '#c7d2fe'}`, borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 700, color: darkMode ? '#a5b4fc' : '#4f46e5', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {linkCopied ? '✓ Copied!' : (typeof navigator !== 'undefined' && navigator.share) ? 'Share link' : 'Copy link'}
            </button>
          </div>
        )}

        {/* Current collaborators */}
        {collaborators.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 10px' }}>
              Already added
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {collaborators.map((c, i) => {
                const label = c.email || c.handle || String(c);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: rowBg, borderRadius: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: gradient(label), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                      {label[0]?.toUpperCase() || '?'}
                    </div>
                    <span style={{ fontSize: 14, color: tp }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
