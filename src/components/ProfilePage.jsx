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
const ProfileAvatar = ({ url, name, gradientSeed, size = 72, darkMode }) => {
  const [imgError, setImgError] = useState(false);
  const initial = String(name || '?').trim().charAt(0).toUpperCase();

  if (!url || imgError) {
    return (
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0 font-bold select-none"
        style={{
          width: size,
          height: size,
          background: avatarGradient(gradientSeed ?? name),
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
    <ProfileAvatar url={friend.avatarUrl} name={friend.displayName || friend.handle || friend.email} gradientSeed={friend.email} size={44} darkMode={darkMode} />
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
  prefetchedFriendsList = null,
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
  const isOwnProfile = viewedUserId
    ? String(viewedUserId) === String(currentUser?.id || '')
    : (!viewedUserEmail || viewedUserEmail === userEmail);

  const knownHandlesRef = useRef(knownHandlesByEmail);
  useEffect(() => { knownHandlesRef.current = knownHandlesByEmail; }, [knownHandlesByEmail]);

  const [sharingPrefs, setSharingPrefs] = useState({
    sharePhotoOfDay: false,
    shareMemories: false,
    shareKomoItems: false,
    shareChapters: false,
  });
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [friendProfile, setFriendProfile] = useState(null);
  const [connectionContext, setConnectionContext] = useState(null);
  const [friendSharedPhoto, setFriendSharedPhoto] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [reactionsLoading, setReactionsLoading] = useState(false);
  const [submittingReaction, setSubmittingReaction] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const lastTapRef = useRef(0);
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
      const dbKeyMap = { sharePhotoOfDay: 'share_photo_of_day', shareMemories: 'share_memories', shareKomoItems: 'share_komo_items' };
      const dbKey = dbKeyMap[key];
      if (dbKey) {
        supabase.from('user_profiles').upsert(
          { user_id: currentUser.id, [dbKey]: value, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        ).then(() => {});
      }
      return next;
    });
  }, [currentUser?.id]);

  // ─── Fetch reactions for the friend's shared photo
  useEffect(() => {
    if (!friendSharedPhoto || isOwnProfile) { setReactions([]); return; }
    const { memoryDate } = friendSharedPhoto;
    const ownerId = String(viewedUserId || '').trim();
    if (!ownerId || !memoryDate) return;
    let cancelled = false;
    setReactionsLoading(true);
    (async () => {
      try {
        const { data } = await supabase
          .from('memory_reactions')
          .select('id, type, comment_text, reactor_user_id, created_at')
          .eq('memory_owner_id', ownerId)
          .eq('memory_date', memoryDate)
          .order('created_at', { ascending: true });
        if (!cancelled) setReactions(data || []);
      } catch {} finally {
        if (!cancelled) setReactionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [friendSharedPhoto, isOwnProfile, viewedUserId]);

  const myUserId = String(currentUser?.id || '').trim();

  const myLike = reactions.find(
    (r) => r.type === 'like' && String(r.reactor_user_id) === myUserId
  );

  const toggleLike = useCallback(async () => {
    if (!friendSharedPhoto || !myUserId || submittingReaction) return;
    const { memoryDate } = friendSharedPhoto;
    const ownerId = String(viewedUserId || '').trim();
    setSubmittingReaction(true);
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
    } catch {} finally {
      setSubmittingReaction(false);
    }
  }, [friendSharedPhoto, myUserId, viewedUserId, myLike, submittingReaction]);

  const submitComment = useCallback(async () => {
    const text = commentDraft.trim();
    if (!text || !friendSharedPhoto || !myUserId || submittingReaction) return;
    const { memoryDate } = friendSharedPhoto;
    const ownerId = String(viewedUserId || '').trim();
    setSubmittingReaction(true);
    try {
      const { data } = await supabase
        .from('memory_reactions')
        .insert({ memory_owner_id: ownerId, memory_date: memoryDate, reactor_user_id: myUserId, type: 'comment', comment_text: text })
        .select('id, type, comment_text, reactor_user_id, created_at')
        .single();
      if (data) { setReactions((prev) => [...prev, data]); setCommentDraft(''); }
    } catch {} finally {
      setSubmittingReaction(false);
    }
  }, [commentDraft, friendSharedPhoto, myUserId, viewedUserId, submittingReaction]);

  const handlePhotoTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      // double-tap → like
      lastTapRef.current = 0;
      if (!myLike && !submittingReaction) {
        setHeartBurst(true);
        setTimeout(() => setHeartBurst(false), 800);
        toggleLike();
      }
    } else {
      lastTapRef.current = now;
    }
  }, [myLike, submittingReaction, toggleLike]);

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

    // Use prefetched data from App.js if available — instant render, no fetch needed
    if (prefetchedFriendsList !== null) {
      setFriendsList(prefetchedFriendsList);
      setLoading(false);
      return;
    }

    const CACHE_KEY = `komo-friends-${currentUser?.id || userEmail}`;
    const CACHE_TTL = 10 * 60 * 1000;

    // Show cached data immediately (stale-while-revalidate)
    let hadCache = false;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached?.friends && Array.isArray(cached.friends) && Date.now() - (cached.ts || 0) < CACHE_TTL) {
        setFriendsList(cached.friends);
        setLoading(false);
        hadCache = true;
      }
    } catch {}

    // Dedup rows by user_id (prevents double-counting when same row exists in both handle tables)
    const dedupeById = (rows) =>
      [...new Map(rows.filter(h => h.user_id).map(h => [h.user_id, h])).values()];

    const load = async () => {
      if (!hadCache) setLoading(true);
      try {
        const friendMap = new Map(); // email → { trips: string[], sharedCalendars: number, sharedEvents: number, userId: string|null }

        // Step 1 (6 parallel): no inter-dependencies, only needs user identity.
        // Inlines getMyTripData's first half alongside the layer/event queries so they all fire together.
        const [ownedTripsRes, memberTripIdsRes, myLayerAccessRes, ownedLayersRes, myEventMembershipsRes] = await Promise.all([
          currentUser?.id
            ? supabase.from('sub_calendars').select('id, name').eq('owner_id', currentUser.id)
            : Promise.resolve({ data: [] }),
          userEmail
            ? supabase.from('sub_calendar_members').select('sub_calendar_id').eq('email', userEmail)
            : Promise.resolve({ data: [] }),
          supabase.from('shared_access').select('layer_id, owner_id').eq('shared_with_email', userEmail),
          currentUser?.id
            ? supabase.from('categories').select('id').eq('owner_id', currentUser.id)
            : Promise.resolve({ data: [] }),
          currentUser?.id
            ? supabase.from('popup_event_members').select('event_id').eq('user_id', currentUser.id)
            : Promise.resolve({ data: [] }),
        ]);

        const ownedTripNameById = {};
        for (const t of (ownedTripsRes.data || [])) ownedTripNameById[t.id] = t.name || 'Trip';

        const memberTripIds = (memberTripIdsRes.data || [])
          .map(m => m.sub_calendar_id).filter(id => id && !ownedTripNameById[id]);
        const allTripIds = [...Object.keys(ownedTripNameById), ...memberTripIds];

        const receivedLayerIds = (myLayerAccessRes.data || []).map(a => a.layer_id).filter(Boolean);
        // owner_id is read directly from shared_access — no extra categories round trip needed
        const calendarOwnerIds = [...new Set(
          (myLayerAccessRes.data || []).map(a => a.owner_id).filter(id => id && id !== currentUser?.id)
        )];
        const calendarOwnerIdSet = new Set(calendarOwnerIds);
        const ownedLayerIds = (ownedLayersRes.data || []).map(l => l.id).filter(Boolean);
        const uniqueLayerIds = [...new Set([...receivedLayerIds, ...ownedLayerIds])];
        const myEventIds = (myEventMembershipsRes.data || []).map(m => m.event_id).filter(Boolean);

        // Step 2 (5 parallel): needs trip IDs and layer IDs from Step 1.
        // memberTripDataRes replaces getMyTripData's second query + memberTripOwnersRes — one query yields both names and owners.
        // Calendar owner emails can start here since calendarOwnerIds is already known.
        const [memberTripDataRes, coMembersRes, coCalMembersRes, calOwnerHandlesRes, calOwnerHandlesFbRes] = await Promise.all([
          memberTripIds.length > 0
            ? supabase.from('sub_calendars').select('id, owner_id, name').in('id', memberTripIds)
            : Promise.resolve({ data: [] }),
          allTripIds.length > 0
            ? supabase.from('sub_calendar_members').select('email, sub_calendar_id').in('sub_calendar_id', allTripIds).neq('email', userEmail)
            : Promise.resolve({ data: [] }),
          uniqueLayerIds.length > 0
            ? supabase.from('shared_access').select('shared_with_email, shared_with_id').in('layer_id', uniqueLayerIds).neq('shared_with_email', userEmail)
            : Promise.resolve({ data: [] }),
          calendarOwnerIds.length > 0
            ? supabase.from('user_handles').select('email, user_id').in('user_id', calendarOwnerIds)
            : Promise.resolve({ data: [] }),
          calendarOwnerIds.length > 0
            ? supabase.from('handles').select('email, user_id').in('user_id', calendarOwnerIds)
            : Promise.resolve({ data: [] }),
        ]);

        // Build full trip name map and collect trip owner IDs
        const tripNameById = { ...ownedTripNameById };
        const tripOwnerIdToName = {};
        for (const t of (memberTripDataRes.data || [])) {
          if (!t.id) continue;
          tripNameById[t.id] = t.name || 'Trip';
          if (t.owner_id && t.owner_id !== currentUser?.id) {
            tripOwnerIdToName[t.owner_id] = t.name || 'Shared trip';
          }
        }
        const tripOwnerIds = Object.keys(tripOwnerIdToName);

        // Populate friendMap from trip co-members
        for (const m of (coMembersRes.data || [])) {
          const email = String(m.email || '').toLowerCase().trim();
          if (!email) continue;
          const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null };
          const tripName = tripNameById[m.sub_calendar_id] || 'Shared trip';
          if (!entry.trips.includes(tripName)) entry.trips.push(tripName);
          friendMap.set(email, entry);
        }

        // Populate friendMap from calendar co-members
        for (const m of (coCalMembersRes.data || [])) {
          const email = String(m.shared_with_email || '').toLowerCase().trim();
          if (!email) continue;
          const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null };
          entry.sharedCalendars++;
          if (!entry.userId && m.shared_with_id) entry.userId = m.shared_with_id;
          friendMap.set(email, entry);
        }

        // Add calendar owners (deduped across both handle tables)
        for (const h of dedupeById([...(calOwnerHandlesRes.data || []), ...(calOwnerHandlesFbRes.data || [])])) {
          const email = String(h.email || '').toLowerCase().trim();
          if (!email || email === userEmail) continue;
          const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null };
          if (!entry.userId) entry.userId = h.user_id;
          if (calendarOwnerIdSet.has(h.user_id)) entry.sharedCalendars++;
          friendMap.set(email, entry);
        }

        // Step 3 (4 parallel): trip owner emails + userId resolution for event counting.
        // Both sets of inputs are ready after Step 2.
        const emailsMissingId = [...friendMap.entries()].filter(([, ctx]) => !ctx.userId).map(([email]) => email);
        const [tripOwnerHandlesRes, tripOwnerHandlesFbRes, handleRowsRes, handleRowsFbRes] = await Promise.all([
          tripOwnerIds.length > 0
            ? supabase.from('user_handles').select('email, user_id').in('user_id', tripOwnerIds)
            : Promise.resolve({ data: [] }),
          tripOwnerIds.length > 0
            ? supabase.from('handles').select('email, user_id').in('user_id', tripOwnerIds)
            : Promise.resolve({ data: [] }),
          emailsMissingId.length > 0
            ? supabase.from('user_handles').select('email, user_id').in('email', emailsMissingId)
            : Promise.resolve({ data: [] }),
          emailsMissingId.length > 0
            ? supabase.from('handles').select('email, user_id').in('email', emailsMissingId)
            : Promise.resolve({ data: [] }),
        ]);

        // Add trip owners
        for (const h of dedupeById([...(tripOwnerHandlesRes.data || []), ...(tripOwnerHandlesFbRes.data || [])])) {
          const email = String(h.email || '').toLowerCase().trim();
          if (!email || email === userEmail) continue;
          const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null };
          if (!entry.userId) entry.userId = h.user_id;
          if (h.user_id && tripOwnerIdToName[h.user_id]) {
            const tripName = tripOwnerIdToName[h.user_id];
            if (!entry.trips.includes(tripName)) entry.trips.push(tripName);
          }
          friendMap.set(email, entry);
        }

        // Fill missing userIds (needed for event counting in Step 4)
        for (const row of [...(handleRowsRes.data || []), ...(handleRowsFbRes.data || [])]) {
          const email = String(row.email || '').toLowerCase().trim();
          if (row.user_id && friendMap.has(email) && !friendMap.get(email).userId) {
            friendMap.get(email).userId = row.user_id;
          }
        }

        // Step 4: discover event-based connections + count shared events (bidirectional)
        if (myEventIds.length > 0) {
          const { data: eventCoMembers } = await supabase
            .from('popup_event_members')
            .select('event_id, user_id')
            .in('event_id', myEventIds)
            .neq('user_id', currentUser?.id || '');

          const sharedEventsByUserId = {};
          for (const m of (eventCoMembers || [])) {
            if (!m.user_id || !m.event_id) continue;
            if (!sharedEventsByUserId[m.user_id]) sharedEventsByUserId[m.user_id] = new Set();
            sharedEventsByUserId[m.user_id].add(m.event_id);
          }
          // Enrich existing friends with event counts
          for (const ctx of friendMap.values()) {
            if (ctx.userId && sharedEventsByUserId[ctx.userId]) ctx.sharedEvents = sharedEventsByUserId[ctx.userId].size;
          }
          // Discover NEW friends from shared events (people not yet in friendMap)
          const knownUserIds = new Set([...friendMap.values()].map(ctx => ctx.userId).filter(Boolean));
          const newCoMemberUserIds = [...new Set(
            (eventCoMembers || []).map(r => r.user_id).filter(uid => uid && !knownUserIds.has(uid))
          )];
          if (newCoMemberUserIds.length > 0) {
            const [newHandlesRes, newHandlesFbRes] = await Promise.all([
              supabase.from('user_handles').select('email, user_id').in('user_id', newCoMemberUserIds),
              supabase.from('handles').select('email, user_id').in('user_id', newCoMemberUserIds),
            ]);
            for (const h of dedupeById([...(newHandlesRes.data || []), ...(newHandlesFbRes.data || [])])) {
              const email = String(h.email || '').toLowerCase().trim();
              if (!email || email === userEmail) continue;
              const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: h.user_id };
              if (!entry.userId) entry.userId = h.user_id;
              if (sharedEventsByUserId[h.user_id]) entry.sharedEvents = sharedEventsByUserId[h.user_id].size;
              friendMap.set(email, entry);
            }
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
            avatarUrl: ctx.userId
              ? `${supabase.supabaseUrl}/storage/v1/object/public/avatars/${ctx.userId}/avatar`
              : '',
            connectionSummary: parts.join(' · ') || 'Connected',
          });
        }

        setFriendsList(friends);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ friends, ts: Date.now() })); } catch {}
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOwnProfile, userEmail, currentUser?.id, prefetchedFriendsList]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load friend profile + connection context
  useEffect(() => {
    if (isOwnProfile || !viewedUserId) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      setFriendSharedPhoto(null);
      try {
        // If opened by userId only, resolve email from user_handles so email-based queries still work
        let email = viewedUserEmail ? viewedUserEmail.toLowerCase().trim() : null;
        if (!email && viewedUserId) {
          const { data: ehRow } = await supabase
            .from('user_handles').select('email').eq('user_id', viewedUserId).maybeSingle();
          email = ehRow?.email?.toLowerCase().trim() || null;
        }

        // Batch 1: all queries independent of each other — run in parallel
        const [
          handleRowRes,
          myMemberTripIdsRes,
          myOwnedTripsRes,
          friendTripMembershipsRes,
          friendOwnedTripsRes,
          myLayerAccessRes,
          ownedLayersRes,
          myEventMembershipsRes,
          friendEventMembershipsRes,
          userProfilesRes,
        ] = await Promise.all([
          email
            ? supabase.from('user_handles').select('handle').ilike('email', email).maybeSingle()
            : supabase.from('user_handles').select('handle').eq('user_id', viewedUserId).maybeSingle(),
          userEmail
            ? supabase.from('sub_calendar_members').select('sub_calendar_id').ilike('email', userEmail)
            : Promise.resolve({ data: [] }),
          currentUser?.id
            ? supabase.from('sub_calendars').select('id').eq('owner_id', currentUser.id)
            : Promise.resolve({ data: [] }),
          email
            ? supabase.from('sub_calendar_members').select('sub_calendar_id').ilike('email', email)
            : Promise.resolve({ data: [] }),
          viewedUserId
            ? supabase.from('sub_calendars').select('id').eq('owner_id', viewedUserId)
            : Promise.resolve({ data: [] }),
          supabase.from('shared_access').select('layer_id').eq('shared_with_email', userEmail),
          currentUser?.id
            ? supabase.from('categories').select('id').eq('owner_id', currentUser.id)
            : Promise.resolve({ data: [] }),
          currentUser?.id
            ? supabase.from('popup_event_members').select('event_id').eq('user_id', currentUser.id)
            : Promise.resolve({ data: [] }),
          viewedUserId
            ? supabase.from('popup_event_members').select('event_id').eq('user_id', viewedUserId)
            : Promise.resolve({ data: [] }),
          viewedUserId
            ? supabase.from('user_profiles').select('share_photo_of_day, share_memories, share_komo_items').eq('user_id', viewedUserId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        const handle = handleRowRes.data?.handle || knownHandlesRef.current[email] || email?.split('@')[0] || viewedUserId?.slice(0, 8) || '?';
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
          shareChapters: false,
        });

        const allMyTripIdSet = new Set([
          ...(myMemberTripIdsRes.data || []).map(m => m.sub_calendar_id),
          ...(myOwnedTripsRes.data || []).map(t => t.id),
        ].filter(Boolean));
        const friendMemberIds = new Set([
          ...(friendTripMembershipsRes.data || []).map(m => m.sub_calendar_id),
          ...(friendOwnedTripsRes.data || []).map(t => t.id),
        ].filter(Boolean));
        const sharedTripIds = [...allMyTripIdSet].filter(id => friendMemberIds.has(id));

        // Symmetric event count: intersection of both users' distinct event memberships
        const myEventIdSet = new Set((myEventMembershipsRes.data || []).map(m => m.event_id).filter(Boolean));
        const friendEventIdSet = new Set((friendEventMembershipsRes.data || []).map(m => m.event_id).filter(Boolean));
        const sharedEventCount = [...myEventIdSet].filter(id => friendEventIdSet.has(id)).length;

        const receivedLayerIds = (myLayerAccessRes.data || []).map(a => a.layer_id).filter(Boolean);
        const ownedLayerIds = (ownedLayersRes.data || []).map(l => l.id).filter(Boolean);
        const allMyLayerIds = [...new Set([...receivedLayerIds, ...ownedLayerIds])];

        const friendPrefs = userProfilesRes.data || {};

        // Batch 2: trip/calendar queries + optional photo fetch all run in parallel
        const [[tripRowsRes, friendLayerAccessRes, friendOwnedLayersRes], todayPhoto] = await Promise.all([
          Promise.all([
            sharedTripIds.length > 0
              ? supabase.from('sub_calendars').select('id, name').in('id', sharedTripIds)
              : Promise.resolve({ data: [] }),
            allMyLayerIds.length > 0 && email
              ? supabase.from('shared_access').select('layer_id').in('layer_id', allMyLayerIds).ilike('shared_with_email', email)
              : Promise.resolve({ data: [] }),
            receivedLayerIds.length > 0 && viewedUserId
              ? supabase.from('categories').select('id').in('id', receivedLayerIds).eq('owner_id', viewedUserId)
              : Promise.resolve({ data: [] }),
          ]),
          (async () => {
            if (friendPrefs.share_photo_of_day === false || !viewedUserId) return null;
            const _d = new Date();
            const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
            const _t = new Date(_d.getFullYear(), _d.getMonth(), _d.getDate() + 1);
            const tomorrow = `${_t.getFullYear()}-${String(_t.getMonth() + 1).padStart(2, '0')}-${String(_t.getDate()).padStart(2, '0')}`;
            // Two parallel queries: one for explicit memory_date, one for legacy null memory_date records created today
            const [{ data: memByDate }, { data: memByCreated }] = await Promise.all([
              supabase.from('user_memories').select('memory').eq('owner_user_id', viewedUserId).eq('memory_date', today).limit(1).maybeSingle(),
              supabase.from('user_memories').select('memory').eq('owner_user_id', viewedUserId).is('memory_date', null).gte('created_at', `${today}T00:00:00.000Z`).lt('created_at', `${tomorrow}T00:00:00.000Z`).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
            ]);
            const memRow = memByDate || memByCreated;
            if (!memRow?.memory) return null;
            const mem = typeof memRow.memory === 'object' ? memRow.memory : {};
            const photoUrl = String(
              mem.coverPhoto || mem.photos?.[0]?.url || mem.photos?.[0]?.photoUrl || mem.photoUrl || mem.photo_url || ''
            ).trim();
            return photoUrl ? { photoUrl, title: String(mem.title || '').trim(), memoryDate: today } : null;
          })(),
        ]);

        setFriendSharedPhoto(todayPhoto);

        const sharedTrips = (tripRowsRes.data || []).map(t => ({ name: t.name || 'Trip', archived: false }));
        const sharedCalendarCount = (friendLayerAccessRes.data || []).length + (friendOwnedLayersRes.data || []).length;

        setConnectionContext({ trips: sharedTrips, sharedCalendarCount, sharedEventCount });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOwnProfile, viewedUserEmail, viewedUserId, userEmail, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
                <ToggleRow
                  label="Chapters"
                  description="Your dream destinations and travel plans"
                  value={sharingPrefs.shareChapters}
                  onChange={v => updatePref('shareChapters', v)}
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

            {/* Sign out */}
            <button
              onClick={() => onLogout?.()}
              className={`w-full mt-4 py-3 rounded-2xl text-sm font-medium ${darkMode ? 'bg-white/8 text-white/70 hover:bg-white/12' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition-colors`}
            >
              Sign out
            </button>
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
              {loading ? (
                <p className="text-sm" style={{ color: mutedColor }}>Loading…</p>
              ) : friendSharedPhoto ? (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: mutedColor }}>📷 Photo of the Day</p>
                  {/* Tappable photo — opens fullscreen modal */}
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(true)}
                    className="block w-full rounded-2xl overflow-hidden active:opacity-90 transition-opacity"
                    style={{ aspectRatio: '4/3' }}
                  >
                    <img
                      src={friendSharedPhoto.photoUrl}
                      alt={friendSharedPhoto.title || 'Photo of the day'}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  {/* Teaser counts below the card photo */}
                  {!isOwnProfile && (
                    <div className="flex items-center gap-3 mt-2 px-0.5">
                      <span className="text-sm" style={{ color: myLike ? '#f43f5e' : mutedColor }}>
                        {myLike ? '❤️' : '🤍'} {reactions.filter((r) => r.type === 'like').length || ''}
                      </span>
                      {reactions.filter((r) => r.type === 'comment').length > 0 && (
                        <span className="text-sm" style={{ color: mutedColor }}>
                          💬 {reactions.filter((r) => r.type === 'comment').length}
                        </span>
                      )}
                    </div>
                  )}
                  {friendSharedPhoto.title && (
                    <p className="text-sm mt-1 text-center" style={{ color: mutedColor }}>{friendSharedPhoto.title}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-center py-6 leading-relaxed" style={{ color: mutedColor }}>
                  {friendName} hasn't shared anything yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Photo fullscreen modal ── */}
      {photoModalOpen && friendSharedPhoto && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ background: 'rgba(0,0,0,0.97)' }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2 shrink-0">
            <p className="text-white/60 text-sm font-medium">{friendName}</p>
            <button
              type="button"
              onClick={() => setPhotoModalOpen(false)}
              className="text-white/70 text-2xl leading-none active:opacity-50 transition-opacity p-1"
            >
              ✕
            </button>
          </div>

          {/* Photo with double-tap */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden cursor-pointer select-none"
            onClick={isOwnProfile ? undefined : handlePhotoTap}
          >
            <img
              src={friendSharedPhoto.photoUrl}
              alt={friendSharedPhoto.title || 'Photo of the day'}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
            {/* Heart burst on double-tap */}
            {heartBurst && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ animation: 'heartPop 0.7s ease-out forwards' }}
              >
                <span style={{ fontSize: 96, filter: 'drop-shadow(0 0 24px rgba(244,63,94,0.7))' }}>❤️</span>
              </div>
            )}
          </div>

          {/* Bottom panel — reactions + comment input */}
          <div
            className="shrink-0 px-4 pb-safe pb-6 pt-3 space-y-3"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          >
            {friendSharedPhoto.title && (
              <p className="text-white/70 text-sm text-center">{friendSharedPhoto.title}</p>
            )}

            {!isOwnProfile && (
              <>
                {/* Like row */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleLike}
                    disabled={submittingReaction}
                    className="text-2xl leading-none active:scale-125 transition-transform disabled:opacity-50"
                  >
                    {myLike ? '❤️' : '🤍'}
                  </button>
                  {reactions.filter((r) => r.type === 'like').length > 0 && (
                    <span className="text-white/60 text-sm">
                      {reactions.filter((r) => r.type === 'like').length}
                    </span>
                  )}
                </div>

                {/* Comments */}
                {reactions.filter((r) => r.type === 'comment').length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {reactions.filter((r) => r.type === 'comment').map((c) => (
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
                    disabled={!commentDraft.trim() || submittingReaction}
                    className="text-sm font-semibold transition-opacity disabled:opacity-40 active:opacity-60 shrink-0 text-pink-400"
                  >
                    Post
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

export default ProfilePage;
