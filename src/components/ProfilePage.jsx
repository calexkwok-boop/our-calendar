import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

// ─── Supabase setup required ─────────────────────────────────────────────────
// Run in Supabase SQL editor before deploying:
//
// CREATE TABLE IF NOT EXISTS user_profiles (
//   user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
//   display_name TEXT,
//   share_photo_of_day BOOLEAN NOT NULL DEFAULT FALSE,
//   share_memories     BOOLEAN NOT NULL DEFAULT FALSE,
//   share_komo_items   BOOLEAN NOT NULL DEFAULT FALSE,
//   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Profiles viewable by authenticated users"
//   ON user_profiles FOR SELECT TO authenticated USING (true);
// CREATE POLICY "Users manage own profile"
//   ON user_profiles FOR ALL TO authenticated
//   USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
//
// Also add `user_id` column to user_handles if not present:
// ALTER TABLE user_handles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

const getSharingPrefsKey = (userId) => `profile-sharing-prefs-${String(userId || 'guest')}`;

// ─── Avatar gradients ─────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)',
  'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #84cc16 0%, #10b981 100%)',
  'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)',
  'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
];
const avatarGradient = (seed) => {
  let hash = 0;
  const s = String(seed || '');
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const ProfileAvatar = ({ url, name, size = 72, darkMode }) => {
  const [imgError, setImgError] = useState(false);
  const initial = String(name || '?').trim().charAt(0).toUpperCase();

  if (!url || imgError) {
    return (
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0 font-bold select-none"
        style={{
          width: size,
          height: size,
          background: avatarGradient(name),
          fontSize: size * 0.38,
          color: '#fff',
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setImgError(true)}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }}
    />
  );
};

// ─── Toggle row ───────────────────────────────────────────────────────────────
const ToggleRow = ({ label, description, value, onChange, darkMode }) => (
  <div className="flex items-start justify-between gap-3 py-3">
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${darkMode ? 'text-white/90' : 'text-slate-800'}`}>{label}</p>
      {description && (
        <p className={`text-xs mt-0.5 leading-snug ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${value ? 'bg-rose-500' : darkMode ? 'bg-white/10' : 'bg-slate-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

// ─── Friend card ──────────────────────────────────────────────────────────────
const FriendCard = ({ friend, onTap, darkMode }) => (
  <button
    onClick={() => onTap(friend)}
    className={`flex items-center gap-3 w-full text-left p-3 rounded-2xl active:opacity-70 transition-opacity ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}
  >
    <ProfileAvatar url={friend.avatarUrl} name={friend.displayName || friend.handle || friend.email} size={44} darkMode={darkMode} />
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white/90' : 'text-slate-800'}`}>
        {friend.displayName || friend.handle || friend.email}
      </p>
      <p className={`text-xs truncate mt-0.5 ${darkMode ? 'text-white/40' : 'text-slate-400'}`}>
        {friend.connectionSummary}
      </p>
    </div>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`flex-shrink-0 ${darkMode ? 'text-white/20' : 'text-slate-300'}`}>
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
);

// ─── Connection pill ──────────────────────────────────────────────────────────
const ConnectionPill = ({ emoji, label, darkMode }) => (
  <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
    <span className="text-base">{emoji}</span>
    <span className={`text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>{label}</span>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const ProfilePage = ({
  viewedUserEmail = null,
  viewedUserId = null,
  currentUser,
  accountHandle = '',
  profilePhotoUrl = '',
  darkMode = false,
  onBack,
  onOpenProfile,
  knownHandlesByEmail = {},
  // Account section (own profile only)
  accountHandleInput = '',
  onAccountHandleChange,
  accountHandleMessage = '',
  onSaveHandle,
  accountVenmoInput = '',
  onVenmoChange,
  accountCashAppInput = '',
  onCashAppChange,
  accountPaymentMessage = '',
  savingAccountPayments = false,
  onSavePaymentHandles,
  onLogout,
}) => {
  const userEmail = currentUser?.email?.toLowerCase().trim() || '';
  const isOwnProfile = !viewedUserEmail || viewedUserEmail === userEmail;

  const knownHandlesRef = useRef(knownHandlesByEmail);
  useEffect(() => { knownHandlesRef.current = knownHandlesByEmail; }, [knownHandlesByEmail]);

  const [sharingPrefs, setSharingPrefs] = useState({
    sharePhotoOfDay: false,
    shareMemories: false,
    shareKomoItems: false,
  });
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [friendProfile, setFriendProfile] = useState(null);
  const [connectionContext, setConnectionContext] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Own sharing prefs (localStorage; TODO: sync to user_profiles table)
  useEffect(() => {
    if (!isOwnProfile || !currentUser?.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem(getSharingPrefsKey(currentUser.id)) || 'null');
      if (saved && typeof saved === 'object') setSharingPrefs(p => ({ ...p, ...saved }));
    } catch {}
  }, [isOwnProfile, currentUser?.id]);

  const updatePref = useCallback((key, value) => {
    if (!currentUser?.id) return;
    setSharingPrefs(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(getSharingPrefsKey(currentUser.id), JSON.stringify(next)); } catch {}
      // TODO: supabase.from('user_profiles').upsert({ user_id: currentUser.id, [key]: value, updated_at: new Date().toISOString() })
      return next;
    });
  }, [currentUser?.id]);

  // ─── Shared helper: get all trip IDs + name map for the current user
  const getMyTripData = useCallback(async () => {
    const tripNameById = {};

    // Fetch owned trips and member records in parallel
    const [ownedResult, memberResult] = await Promise.all([
      currentUser?.id
        ? supabase.from('sub_calendars').select('id, name').eq('owner_id', currentUser.id)
        : Promise.resolve({ data: [] }),
      userEmail
        ? supabase.from('sub_calendar_members').select('sub_calendar_id').eq('email', userEmail)
        : Promise.resolve({ data: [] }),
    ]);

    for (const t of (ownedResult.data || [])) tripNameById[t.id] = t.name || 'Trip';

    const memberIds = (memberResult.data || []).map(m => m.sub_calendar_id).filter(id => id && !tripNameById[id]);
    if (memberIds.length > 0) {
      const { data: tripRows } = await supabase.from('sub_calendars').select('id, name').in('id', memberIds);
      for (const t of (tripRows || [])) tripNameById[t.id] = t.name || 'Trip';
    }

    return tripNameById;
  }, [currentUser?.id, userEmail]);

  // ─── Load friends list (own profile)
  useEffect(() => {
    if (!isOwnProfile || (!userEmail && !currentUser?.id)) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      try {
        const tripNameById = await getMyTripData();
        const allTripIds = Object.keys(tripNameById);
        const friendMap = new Map(); // email → { trips: string[], sharedCalendars: number, sharedEvents: number, userId: string|null }

        // Batch 1: all queries that only need trip IDs / user identity — run in parallel
        const [coMembersRes, myLayerAccessRes, ownedLayersRes, myEventMembershipsRes] = await Promise.all([
          allTripIds.length > 0
            ? supabase.from('sub_calendar_members').select('email, sub_calendar_id').in('sub_calendar_id', allTripIds).neq('email', userEmail)
            : Promise.resolve({ data: [] }),
          supabase.from('shared_access').select('layer_id').eq('shared_with_email', userEmail),
          currentUser?.id
            ? supabase.from('categories').select('id').eq('owner_id', currentUser.id)
            : Promise.resolve({ data: [] }),
          currentUser?.id
            ? supabase.from('popup_event_members').select('event_id').eq('user_id', currentUser.id)
            : Promise.resolve({ data: [] }),
        ]);

        for (const m of (coMembersRes.data || [])) {
          const email = String(m.email || '').toLowerCase().trim();
          if (!email) continue;
          if (!friendMap.has(email)) friendMap.set(email, { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null });
          const tripName = tripNameById[m.sub_calendar_id] || 'Shared trip';
          const entry = friendMap.get(email);
          if (!entry.trips.includes(tripName)) entry.trips.push(tripName);
        }

        const receivedLayerIds = (myLayerAccessRes.data || []).map(a => a.layer_id).filter(Boolean);
        const ownedLayerIds = (ownedLayersRes.data || []).map(l => l.id).filter(Boolean);
        const uniqueLayerIds = [...new Set([...receivedLayerIds, ...ownedLayerIds])];
        const myEventIds = (myEventMembershipsRes.data || []).map(m => m.event_id).filter(Boolean);

        // Batch 2: queries that depend on layer IDs — run in parallel
        const [coCalMembersRes, layerOwnersRes] = await Promise.all([
          uniqueLayerIds.length > 0
            ? supabase.from('shared_access').select('shared_with_email, shared_with_id').in('layer_id', uniqueLayerIds).neq('shared_with_email', userEmail)
            : Promise.resolve({ data: [] }),
          receivedLayerIds.length > 0
            ? supabase.from('categories').select('owner_id').in('id', receivedLayerIds).neq('owner_id', currentUser?.id || '')
            : Promise.resolve({ data: [] }),
        ]);

        for (const m of (coCalMembersRes.data || [])) {
          const email = String(m.shared_with_email || '').toLowerCase().trim();
          if (!email) continue;
          if (!friendMap.has(email)) friendMap.set(email, { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null });
          const entry = friendMap.get(email);
          entry.sharedCalendars++;
          if (!entry.userId && m.shared_with_id) entry.userId = m.shared_with_id;
        }

        const ownerIds = [...new Set((layerOwnersRes.data || []).map(l => l.owner_id).filter(Boolean))];

        // Batch 3: resolve owner emails + missing userIds for trip-only friends — run in parallel
        const emailsMissingId = [...friendMap.entries()].filter(([, ctx]) => !ctx.userId).map(([email]) => email);
        const [ownerHandlesRes, handleRowsRes] = await Promise.all([
          ownerIds.length > 0
            ? supabase.from('user_handles').select('email, user_id').in('user_id', ownerIds)
            : Promise.resolve({ data: [] }),
          emailsMissingId.length > 0
            ? supabase.from('user_handles').select('email, user_id').in('email', emailsMissingId)
            : Promise.resolve({ data: [] }),
        ]);

        for (const h of (ownerHandlesRes.data || [])) {
          const email = String(h.email || '').toLowerCase().trim();
          if (!email || email === userEmail) continue;
          if (!friendMap.has(email)) friendMap.set(email, { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null });
          const entry = friendMap.get(email);
          entry.sharedCalendars++;
          if (!entry.userId && h.user_id) entry.userId = h.user_id;
        }
        for (const row of (handleRowsRes.data || [])) {
          const email = String(row.email || '').toLowerCase().trim();
          if (row.user_id && friendMap.has(email)) friendMap.get(email).userId = row.user_id;
        }

        // Batch 4: shared event counts — now that all userIds are resolved
        const friendUserIds = [...friendMap.values()].map(ctx => ctx.userId).filter(Boolean);
        if (myEventIds.length > 0 && friendUserIds.length > 0) {
          const { data: friendEventRows } = await supabase
            .from('popup_event_members')
            .select('event_id, user_id')
            .in('user_id', friendUserIds)
            .in('event_id', myEventIds);

          const eventCountByUserId = {};
          for (const m of (friendEventRows || [])) {
            if (m.user_id) eventCountByUserId[m.user_id] = (eventCountByUserId[m.user_id] || 0) + 1;
          }
          for (const ctx of friendMap.values()) {
            if (ctx.userId && eventCountByUserId[ctx.userId]) ctx.sharedEvents = eventCountByUserId[ctx.userId];
          }
        }

        const friends = [];
        for (const [email, ctx] of friendMap.entries()) {
          const handle = knownHandlesRef.current[email] || email.split('@')[0];
          const parts = [];
          if (ctx.trips.length === 1) parts.push(ctx.trips[0]);
          else if (ctx.trips.length > 1) parts.push(`${ctx.trips.length} trips`);
          if (ctx.sharedCalendars > 0) parts.push('shared calendar');
          if (ctx.sharedEvents > 0) parts.push(`${ctx.sharedEvents} event${ctx.sharedEvents === 1 ? '' : 's'}`);
          friends.push({
            email,
            userId: ctx.userId || null,
            handle,
            displayName: handle,
            avatarUrl: '',
            connectionSummary: parts.join(' · ') || 'Connected',
          });
        }

        setFriendsList(friends);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOwnProfile, userEmail, currentUser?.id, getMyTripData]);

  // ─── Load friend profile + connection context
  useEffect(() => {
    if (isOwnProfile || !viewedUserEmail) { setLoading(false); return; }

    const email = viewedUserEmail.toLowerCase().trim();

    const load = async () => {
      setLoading(true);
      try {
        // Batch 1: all queries independent of each other — run in parallel
        const [
          handleRowRes,
          tripNameById,
          friendTripMembershipsRes,
          friendOwnedTripsRes,
          myLayerAccessRes,
          ownedLayersRes,
          myEventMembershipsRes,
        ] = await Promise.all([
          supabase.from('user_handles').select('handle').ilike('email', email).maybeSingle(),
          getMyTripData(),
          supabase.from('sub_calendar_members').select('sub_calendar_id').ilike('email', email),
          viewedUserId
            ? supabase.from('sub_calendars').select('id').eq('owner_id', viewedUserId)
            : Promise.resolve({ data: [] }),
          supabase.from('shared_access').select('layer_id').eq('shared_with_email', userEmail),
          currentUser?.id
            ? supabase.from('categories').select('id').eq('owner_id', currentUser.id)
            : Promise.resolve({ data: [] }),
          currentUser?.id && viewedUserId
            ? supabase.from('popup_event_members').select('event_id').eq('user_id', currentUser.id)
            : Promise.resolve({ data: [] }),
        ]);

        const handle = handleRowRes.data?.handle || knownHandlesRef.current[email] || email.split('@')[0];
        setFriendProfile({
          email,
          handle,
          displayName: handle,
          avatarUrl: viewedUserId
            ? `${supabase.supabaseUrl}/storage/v1/object/public/avatars/${viewedUserId}/avatar`
            : '',
          sharePhotoOfDay: false,
          shareMemories: false,
          shareKomoItems: false,
        });

        const allMyTripIds = Object.keys(tripNameById);
        const friendMemberIds = new Set(
          (friendTripMembershipsRes.data || []).map(m => m.sub_calendar_id).filter(Boolean)
        );
        for (const t of (friendOwnedTripsRes.data || [])) {
          if (t.id) friendMemberIds.add(t.id);
        }
        const sharedTripIds = allMyTripIds.filter(id => friendMemberIds.has(id));

        const receivedLayerIds = (myLayerAccessRes.data || []).map(a => a.layer_id).filter(Boolean);
        const ownedLayerIds = (ownedLayersRes.data || []).map(l => l.id).filter(Boolean);
        const allMyLayerIds = [...new Set([...receivedLayerIds, ...ownedLayerIds])];
        const myEventIds = (myEventMembershipsRes.data || []).map(m => m.event_id).filter(Boolean);

        // Batch 2: queries that depend on batch 1 results — run in parallel
        const [tripRowsRes, friendLayerAccessRes, friendOwnedLayersRes, friendEventMembershipsRes] = await Promise.all([
          sharedTripIds.length > 0
            ? supabase.from('sub_calendars').select('id, name').in('id', sharedTripIds)
            : Promise.resolve({ data: [] }),
          allMyLayerIds.length > 0
            ? supabase.from('shared_access').select('layer_id').in('layer_id', allMyLayerIds).ilike('shared_with_email', email)
            : Promise.resolve({ data: [] }),
          receivedLayerIds.length > 0 && viewedUserId
            ? supabase.from('categories').select('id').in('id', receivedLayerIds).eq('owner_id', viewedUserId)
            : Promise.resolve({ data: [] }),
          myEventIds.length > 0 && viewedUserId
            ? supabase.from('popup_event_members').select('event_id').eq('user_id', viewedUserId).in('event_id', myEventIds)
            : Promise.resolve({ data: [] }),
        ]);

        const sharedTrips = (tripRowsRes.data || []).map(t => ({ name: t.name || 'Trip', archived: false }));
        const sharedCalendarCount = (friendLayerAccessRes.data || []).length + (friendOwnedLayersRes.data || []).length;
        const sharedEventCount = (friendEventMembershipsRes.data || []).length;

        setConnectionContext({ trips: sharedTrips, sharedCalendarCount, sharedEventCount });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOwnProfile, viewedUserEmail, viewedUserId, userEmail, getMyTripData]);

  // ─── Styles
  const bg = darkMode ? '#0f1117' : '#f8f5f0';
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#fff';
  const cardBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const headingColor = darkMode ? 'rgba(255,255,255,0.9)' : '#2a2420';
  const mutedColor = darkMode ? 'rgba(255,255,255,0.4)' : '#8a8178';
  const dividerClass = darkMode ? 'divide-white/5' : 'divide-slate-100';

  const ownName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    accountHandle ||
    currentUser?.email?.split('@')[0] ||
    'You';

  const friendName = friendProfile?.displayName || friendProfile?.handle || '—';

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: bg }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className={`w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 flex-shrink-0 ${darkMode ? 'bg-white/5 text-slate-300' : 'bg-white/80 text-slate-600 border border-slate-200/70'}`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="font-bold text-xl" style={{ color: headingColor }}>
          {isOwnProfile ? 'Your Profile' : friendName}
        </h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">

        {/* Profile hero */}
        <div className="rounded-3xl p-5 mb-4 flex items-center gap-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <ProfileAvatar
            url={isOwnProfile ? profilePhotoUrl : friendProfile?.avatarUrl}
            name={isOwnProfile ? ownName : friendName}
            size={68}
            darkMode={darkMode}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate" style={{ color: headingColor }}>
              {isOwnProfile ? ownName : friendName}
            </p>
            <p className="text-sm truncate mt-0.5" style={{ color: mutedColor }}>
              @{isOwnProfile ? (accountHandle || '—') : (friendProfile?.handle || '—')}
            </p>
          </div>
        </div>

        {/* ── OWN PROFILE ── */}
        {isOwnProfile && (
          <>
            {/* Account */}
            <div className="rounded-3xl mb-4 overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <button
                onClick={() => setAccountExpanded(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 active:opacity-70"
              >
                <p className="font-semibold text-sm" style={{ color: headingColor }}>Account</p>
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className="flex-shrink-0 transition-transform"
                  style={{ color: mutedColor, transform: accountExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {accountExpanded && (
                <div className="px-5 pb-5">
                  {/* Handle */}
                  <div className="mb-4">
                    <p className="text-xs mb-1.5" style={{ color: mutedColor }}>Username</p>
                    <input
                      type="text"
                      value={accountHandleInput}
                      onChange={e => onAccountHandleChange?.(e.target.value)}
                      onBlur={() => onSaveHandle?.()}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSaveHandle?.(); } }}
                      placeholder="Set your handle"
                      maxLength={40}
                      className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                      style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f0ede8', color: headingColor, border: `1px solid ${cardBorder}` }}
                    />
                    {accountHandleMessage && (
                      <p className={`text-xs mt-1.5 ${/updated|already set/i.test(accountHandleMessage) ? 'text-green-500' : 'text-red-400'}`}>
                        {accountHandleMessage}
                      </p>
                    )}
                    {currentUser?.email && (
                      <p className="text-xs mt-1.5 truncate" style={{ color: mutedColor }}>{currentUser.email}</p>
                    )}
                  </div>

                  {/* Payment handles */}
                  <div className="mb-5">
                    <p className="text-xs mb-1.5" style={{ color: mutedColor }}>Payment handles</p>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={accountVenmoInput}
                        onChange={e => onVenmoChange?.(e.target.value)}
                        placeholder="Venmo @username"
                        className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                        style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f0ede8', color: headingColor, border: `1px solid ${cardBorder}` }}
                      />
                      <input
                        type="text"
                        value={accountCashAppInput}
                        onChange={e => onCashAppChange?.(e.target.value)}
                        placeholder="Cash App $cashtag"
                        className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                        style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f0ede8', color: headingColor, border: `1px solid ${cardBorder}` }}
                      />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      {accountPaymentMessage ? (
                        <p className={`text-xs ${/updated|saved/i.test(accountPaymentMessage) ? 'text-green-500' : 'text-red-400'}`}>
                          {accountPaymentMessage}
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: mutedColor }}>Used in expense tracker payment links</p>
                      )}
                      <button
                        onClick={() => onSavePaymentHandles?.()}
                        disabled={savingAccountPayments}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 text-white disabled:opacity-50 flex-shrink-0"
                      >
                        {savingAccountPayments ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => onLogout?.()}
                    className={`w-full py-2.5 rounded-2xl text-sm font-medium ${darkMode ? 'bg-white/8 text-white/70 hover:bg-white/12' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition-colors`}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Sharing preferences */}
            <div className="rounded-3xl p-5 mb-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <p className="font-semibold text-sm" style={{ color: headingColor }}>Share with friends</p>
              <p className="text-xs mt-0.5 mb-2" style={{ color: mutedColor }}>
                Friends can see these on your profile when they tap your name.
              </p>
              <div className={`divide-y ${dividerClass}`}>
                <ToggleRow
                  label="Photo of the Day"
                  description="Your latest daily moment"
                  value={sharingPrefs.sharePhotoOfDay}
                  onChange={v => updatePref('sharePhotoOfDay', v)}
                  darkMode={darkMode}
                />
                <ToggleRow
                  label="Recent Memories"
                  description="Your latest highlight reels"
                  value={sharingPrefs.shareMemories}
                  onChange={v => updatePref('shareMemories', v)}
                  darkMode={darkMode}
                />
                <ToggleRow
                  label="Komo Book picks"
                  description="Items you've added to your shelf"
                  value={sharingPrefs.shareKomoItems}
                  onChange={v => updatePref('shareKomoItems', v)}
                  darkMode={darkMode}
                />
              </div>
            </div>

            {/* Friends list */}
            <div className="rounded-3xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <p className="font-semibold text-sm mb-3" style={{ color: headingColor }}>
                Friends{friendsList.length > 0 ? ` · ${friendsList.length}` : ''}
              </p>
              {loading ? (
                <p className="text-sm text-center py-6" style={{ color: mutedColor }}>Loading…</p>
              ) : friendsList.length === 0 ? (
                <p className="text-sm text-center py-6 leading-relaxed" style={{ color: mutedColor }}>
                  Invite someone to a trip, event, or chapter and they'll appear here.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {friendsList.map(friend => (
                    <FriendCard
                      key={friend.email}
                      friend={friend}
                      onTap={() => onOpenProfile?.({ email: friend.email, userId: friend.userId })}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── FRIEND PROFILE ── */}
        {!isOwnProfile && (
          <>
            {/* Connection context */}
            <div className="rounded-3xl p-5 mb-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <p className="font-semibold text-sm mb-3" style={{ color: headingColor }}>
                You & {friendName}
              </p>
              {loading ? (
                <p className="text-sm" style={{ color: mutedColor }}>Loading…</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(connectionContext?.trips?.length || 0) === 1 && (
                    <ConnectionPill emoji="✈️" label={connectionContext.trips[0].name} darkMode={darkMode} />
                  )}
                  {(connectionContext?.trips?.length || 0) > 1 && (
                    <ConnectionPill emoji="✈️" label={`${connectionContext.trips.length} trips together`} darkMode={darkMode} />
                  )}
                  {(connectionContext?.sharedCalendarCount || 0) > 0 && (
                    <ConnectionPill emoji="📅" label="Shared calendar" darkMode={darkMode} />
                  )}
                  {(connectionContext?.sharedEventCount || 0) > 0 && (
                    <ConnectionPill
                      emoji="🎉"
                      label={`${connectionContext.sharedEventCount} event${connectionContext.sharedEventCount === 1 ? '' : 's'} together`}
                      darkMode={darkMode}
                    />
                  )}
                  {!loading && !(connectionContext?.trips?.length) && !(connectionContext?.sharedCalendarCount) && !(connectionContext?.sharedEventCount) && (
                    <p className="text-sm" style={{ color: mutedColor }}>Connected</p>
                  )}
                </div>
              )}
            </div>

            {/* Friend's shared content */}
            <div className="rounded-3xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <p className="font-semibold text-sm mb-3" style={{ color: headingColor }}>
                Shared by {friendName}
              </p>
              {/* Populated once user_profiles table is created + user_memories RLS allows friend reads */}
              <p className="text-sm text-center py-6 leading-relaxed" style={{ color: mutedColor }}>
                {friendName} hasn't shared anything yet.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
