import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// ─── Pure utils (stable, no external deps) ───────────────────────────────────

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizePhoneNumber = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const compact = raw.replace(/[^\d+]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) {
    const digits = compact.slice(1).replace(/\D/g, '');
    return digits.length >= 7 ? `+${digits}` : '';
  }
  const digits = compact.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.length >= 7 ? `+${digits}` : '';
};

const getInviteIdentityFromRow = (row) => {
  const rowEmail = normalizeEmail(row?.email);
  if (rowEmail) return rowEmail;
  const rowPhone = normalizePhoneNumber(row?.phone);
  if (rowPhone) return rowPhone;
  return '';
};

const getShareRecipientFromRow = (row) => {
  const rowEmail = normalizeEmail(row?.shared_with_email);
  if (rowEmail) return rowEmail;
  const rowPhone = normalizePhoneNumber(row?.shared_with_phone);
  if (rowPhone) return rowPhone;
  return '';
};

const buildMemberRecipientFilter = (email, phone) => {
  const clauses = [];
  if (email) clauses.push(`email.eq.${email}`);
  if (phone) clauses.push(`phone.eq.${phone}`);
  return clauses.join(',');
};

const buildShareRecipientFilter = (userId, email, phone) => {
  const clauses = [];
  if (userId) clauses.push(`shared_with_id.eq.${String(userId).trim()}`);
  if (email) clauses.push(`shared_with_email.eq.${email}`);
  if (phone) clauses.push(`shared_with_phone.eq.${phone}`);
  return clauses.join(',');
};

const arePendingTripInvitesEqual = (a, b) => {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    const cur = left[i] || {};
    const nxt = right[i] || {};
    if (
      String(cur.subCalendarId || '') !== String(nxt.subCalendarId || '')
      || String(cur.tripName || '') !== String(nxt.tripName || '')
      || String(cur.layerId || '') !== String(nxt.layerId || '')
      || String(cur.ownerId || '') !== String(nxt.ownerId || '')
      || String(cur.startDate || '') !== String(nxt.startDate || '')
      || String(cur.endDate || '') !== String(nxt.endDate || '')
      || String(cur.invitedAt || '') !== String(nxt.invitedAt || '')
      || String(cur.identity || '') !== String(nxt.identity || '')
    ) return false;
  }
  return true;
};

const arePendingCalendarInvitesEqual = (a, b) => {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    const cur = left[i] || {};
    const nxt = right[i] || {};
    if (
      String(cur.shareId || '') !== String(nxt.shareId || '')
      || String(cur.layerId || '') !== String(nxt.layerId || '')
      || String(cur.calendarName || '') !== String(nxt.calendarName || '')
      || String(cur.ownerId || '') !== String(nxt.ownerId || '')
      || String(cur.createdAt || '') !== String(nxt.createdAt || '')
    ) return false;
  }
  return true;
};

const arePendingChapterInvitesEqual = (a, b) => {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    const cur = left[i] || {};
    const nxt = right[i] || {};
    if (
      String(cur.chapterId || '') !== String(nxt.chapterId || '')
      || String(cur.chapterTitle || '') !== String(nxt.chapterTitle || '')
      || String(cur.invitedBy || '') !== String(nxt.invitedBy || '')
      || String(cur.invitedAt || '') !== String(nxt.invitedAt || '')
    ) return false;
  }
  return true;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Owns all in-app notification state, the invite Realtime channel + polling,
 * and localStorage persistence for notifications.
 *
 * @param user               - from useAuth
 * @param notificationsEnabled - controls whether browser notifications fire
 */
export function useNotifications({ user, notificationsEnabled }) {
  const [inAppNotifications, setInAppNotifications] = useState([]);
  const [pendingTripInvites, setPendingTripInvites] = useState([]);
  const [pendingCalendarInvites, setPendingCalendarInvites] = useState([]);
  const [pendingChapterInvites, setPendingChapterInvites] = useState([]);
  const [chapterInviteRefreshToken, setChapterInviteRefreshToken] = useState(0);

  const seenInAppNotificationKeysRef = useRef(new Set());
  const seenInAppNotificationSignaturesRef = useRef(new Set());
  const dismissedCalendarInviteIdsRef = useRef(new Set());
  const inAppSyncCursorRef = useRef({ events: null, subCalEvents: null, tripPhotos: null, sharedListItems: null, tripInvites: null });
  const seenExpenseIdsRef = useRef(new Set());

  // Stable ref so callbacks always read the latest value without re-subscribing.
  const notificationsEnabledRef = useRef(notificationsEnabled);
  useEffect(() => { notificationsEnabledRef.current = notificationsEnabled; });

  // ── Load notification state from localStorage when user changes ──────────
  useEffect(() => {
    if (!user?.id) {
      seenInAppNotificationKeysRef.current = new Set();
      seenInAppNotificationSignaturesRef.current = new Set();
      dismissedCalendarInviteIdsRef.current = new Set();
      seenExpenseIdsRef.current = new Set();
      inAppSyncCursorRef.current = { events: null, subCalEvents: null, tripPhotos: null, sharedListItems: null, tripInvites: null };
      setInAppNotifications([]);
      return;
    }
    const storageKey = `in-app-notifications-${user.id}`;
    const dismissedKey = `dismissed-calendar-invites-${user.id}`;
    const expenseSeenKey = `in-app-seen-expenses-${user.id}`;
    const cursorKey = `in-app-notification-cursor-${user.id}`;
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = Array.isArray(parsed) ? parsed.slice(0, 75).map(item => {
        const key = String(item.key || '');
        const stableKey = String(item.stableKey || '').trim() || (() => {
          if (key.startsWith('calendar_invite:')) { const p = key.split(':'); return `calendar_invite:${p[1] || ''}:${p[2] || ''}`; }
          if (key.startsWith('trip_invite:')) { const p = key.split(':'); return `trip_invite:${p[1] || ''}:${p[2] || ''}`; }
          if (key.startsWith('chapter_invite:')) { const p = key.split(':'); return `chapter_invite:${p[1] || ''}:${p[2] || ''}`; }
          return key;
        })();
        const target = (item?.target && typeof item.target === 'object') ? item.target : null;
        const stableSignature = String(item.stableSignature || '').trim() || [
          String(item.type || 'update').trim().toLowerCase(), stableKey,
          String(target?.layerId || '').trim(), String(target?.eventId || '').trim(),
          String(target?.listId || '').trim(), String(target?.listItemId || '').trim(),
          String(target?.subCalendarId || '').trim(), String(target?.dateKey || '').trim(),
          String(target?.panel || '').trim(),
        ].join('|');
        return {
          id: item.id || `ian_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          key, stableKey, stableSignature,
          type: item.type || 'update',
          message: item.message || '',
          createdAt: item.createdAt || new Date().toISOString(),
          read: Boolean(item.read),
          target,
        };
      }).filter(item => item.key && item.message) : [];
      const deduped = normalized.filter((item, idx, arr) => (
        arr.findIndex(c => String(c?.stableKey || c?.key || '') === String(item?.stableKey || item?.key || '')) === idx
      ));
      seenInAppNotificationKeysRef.current = new Set(deduped.flatMap(item => [item.key, item.stableKey].filter(Boolean)));
      seenInAppNotificationSignaturesRef.current = new Set(
        deduped.flatMap((item) => [[
          String(item.type || 'update').trim().toLowerCase(), String(item.message || '').trim(),
          String(item?.target?.layerId || '').trim(), String(item?.target?.eventId || '').trim(),
          String(item?.target?.listId || '').trim(), String(item?.target?.listItemId || '').trim(),
          String(item?.target?.subCalendarId || '').trim(), String(item?.target?.dateKey || '').trim(),
          String(item?.target?.panel || '').trim(),
        ].join('|'), item.stableSignature].filter(Boolean))
      );
      setInAppNotifications(deduped);

      const cursorRaw = localStorage.getItem(cursorKey);
      const parsedCursor = cursorRaw ? JSON.parse(cursorRaw) : null;
      const seenExpensesRaw = localStorage.getItem(expenseSeenKey);
      const parsedSeenExpenses = seenExpensesRaw ? JSON.parse(seenExpensesRaw) : [];
      const dismissedRaw = localStorage.getItem(dismissedKey);
      const parsedDismissed = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      const fallbackTs = new Date(Date.now() - (5 * 60 * 1000)).toISOString();
      seenExpenseIdsRef.current = new Set(Array.isArray(parsedSeenExpenses) ? parsedSeenExpenses.map(v => String(v)) : []);
      dismissedCalendarInviteIdsRef.current = new Set(Array.isArray(parsedDismissed) ? parsedDismissed.map(v => String(v)) : []);
      inAppSyncCursorRef.current = {
        events: parsedCursor?.events || fallbackTs,
        subCalEvents: parsedCursor?.subCalEvents || fallbackTs,
        tripPhotos: parsedCursor?.tripPhotos || fallbackTs,
        sharedListItems: parsedCursor?.sharedListItems || fallbackTs,
        tripInvites: parsedCursor?.tripInvites || fallbackTs,
      };
    } catch {
      seenInAppNotificationKeysRef.current = new Set();
      seenInAppNotificationSignaturesRef.current = new Set();
      dismissedCalendarInviteIdsRef.current = new Set();
      seenExpenseIdsRef.current = new Set();
      const fallbackTs = new Date(Date.now() - (5 * 60 * 1000)).toISOString();
      inAppSyncCursorRef.current = { events: fallbackTs, subCalEvents: fallbackTs, tripPhotos: fallbackTs, sharedListItems: fallbackTs, tripInvites: fallbackTs };
      setInAppNotifications([]);
    }
  }, [user?.id]);

  // ── Persist notifications to localStorage when they change ───────────────
  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`in-app-notifications-${user.id}`, JSON.stringify(inAppNotifications.slice(0, 75)));
      localStorage.setItem(`in-app-notification-cursor-${user.id}`, JSON.stringify(inAppSyncCursorRef.current));
      localStorage.setItem(`in-app-seen-expenses-${user.id}`, JSON.stringify(Array.from(seenExpenseIdsRef.current).slice(-300)));
    } catch {}
  }, [user?.id, inAppNotifications]);

  // ── Invite channel + polling ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const me = String(user.id);
    const myEmail = normalizeEmail(user.email);
    const myPhone = normalizePhoneNumber(user.phone);
    const memberRecipientFilter = buildMemberRecipientFilter(myEmail, myPhone);
    if (!memberRecipientFilter) return;

    const notifyInvites = async (rows) => {
      const inviteRows = (rows || []).filter(row => {
        const identity = getInviteIdentityFromRow(row);
        if (!identity || (identity !== myEmail && identity !== myPhone)) return false;
        if (String(row?.added_by || '') === me) return false;
        const status = String(row?.status || '').trim().toLowerCase();
        if (status && status !== 'pending') return false;
        if (row?.accepted_at) return false;
        return Boolean(row?.sub_calendar_id);
      });
      if (inviteRows.length === 0) return;
      const subIds = Array.from(new Set(inviteRows.map(row => String(row.sub_calendar_id))));
      let nameMap = {};
      if (subIds.length > 0) {
        const { data: tripRows } = await supabase.from('sub_calendars').select('id,name').in('id', subIds);
        (tripRows || []).forEach(trip => { nameMap[String(trip.id)] = trip.name || 'a trip'; });
      }
      inviteRows.forEach(row => {
        const subCalId = String(row.sub_calendar_id);
        const stamp = String(row?.invited_at || row?.accepted_at || '');
        const identity = getInviteIdentityFromRow(row);
        addInAppNotification({
          key: `trip_invite:${subCalId}:${identity}:${stamp}`,
          type: 'invite',
          message: `You were invited to ${nameMap[subCalId] || 'a trip'}.`,
          createdAt: row.invited_at || row.accepted_at || new Date().toISOString(),
        });
      });
    };

    const pollInviteRows = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const cursor = inAppSyncCursorRef.current.tripInvites || new Date(Date.now() - (5 * 60 * 1000)).toISOString();
        const [{ data: datedRows }, { data: nullRows }] = await Promise.all([
          supabase.from('sub_calendar_members')
            .select('sub_calendar_id,email,phone,added_by,status,accepted_at,invited_at')
            .or(memberRecipientFilter).eq('status', 'pending')
            .or(`accepted_at.gt.${cursor},invited_at.gt.${cursor}`)
            .order('invited_at', { ascending: true, nullsFirst: false }).limit(200),
          supabase.from('sub_calendar_members')
            .select('sub_calendar_id,email,phone,added_by,status,accepted_at,invited_at')
            .or(memberRecipientFilter).eq('status', 'pending')
            .is('invited_at', null).limit(200),
        ]);
        const merged = Array.from(new Map(
          [...(datedRows || []), ...(nullRows || [])].map(row => [`${String(row?.sub_calendar_id || '')}|${getInviteIdentityFromRow(row)}`, row])
        ).values());
        await notifyInvites(merged);
        if (Array.isArray(datedRows) && datedRows.length > 0) {
          const maxTs = datedRows.reduce((max, row) => {
            const ts = String(row?.invited_at || row?.accepted_at || '');
            return (!ts) ? max : (!max || ts > max ? ts : max);
          }, inAppSyncCursorRef.current.tripInvites || null);
          if (maxTs) inAppSyncCursorRef.current.tripInvites = maxTs;
        }
      } catch (err) {
        console.error('Invite notification poll failed:', err);
      }
    };

    let inviteChannel = null;
    if (myEmail || myPhone) {
      let ch = supabase.channel(`invite-updates-${me}`);
      if (myEmail) ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: 'sub_calendar_members', filter: `email=eq.${myEmail}` }, async ({ new: row }) => { if (row) await notifyInvites([row]); });
      if (myPhone) ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: 'sub_calendar_members', filter: `phone=eq.${myPhone}` }, async ({ new: row }) => { if (row) await notifyInvites([row]); });
      inviteChannel = ch.subscribe();
    }

    pollInviteRows();
    window.addEventListener('focus', pollInviteRows);
    const onVisible = () => { if (document.visibilityState === 'visible') pollInviteRows(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('focus', pollInviteRows);
      document.removeEventListener('visibilitychange', onVisible);
      if (inviteChannel) supabase.removeChannel(inviteChannel);
    };
  }, [user?.id, user?.email, user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Functions ────────────────────────────────────────────────────────────

  const maybeSendInAppSystemNotification = (type, key, message, options = {}) => {
    if (!notificationsEnabledRef.current) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const normalizedType = String(type || '').trim().toLowerCase();
    if (document.visibilityState === 'visible' && normalizedType !== 'invite' && !options?.allowWhenVisible) return;
    const title = { invite: 'Calendar Invite', event: 'Calendar Update', list: 'List Update', photo: 'Trip Photo', expense: 'Expense Update', update: 'Calendar Update' }[normalizedType] || 'Calendar Update';
    const tag = `in-app:${String(key || '').trim()}`;
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').then((reg) => {
          if (reg?.showNotification) reg.showNotification(title, { body: message, tag, data: { url: '/' } });
          else new Notification(title, { body: message, tag });
        }).catch(() => new Notification(title, { body: message, tag }));
      } else {
        new Notification(title, { body: message, tag });
      }
    } catch {}
  };

  // addInAppNotification is called from App.js's master channel effect — must be stable.
  // Using a ref pattern: the function body always reads the latest refs without
  // needing to be in any dep array.
  const addInAppNotificationRef = useRef(null);
  addInAppNotificationRef.current = ({ key, type, message, createdAt, target = null }) => {
    if (!key || !message) return;
    const normalizedKey = String(key);
    const normalizedType = String(type || 'update').trim().toLowerCase();
    const stableKey = (() => {
      if (normalizedKey.startsWith('calendar_invite:')) { const p = normalizedKey.split(':'); return `calendar_invite:${p[1] || ''}:${p[2] || ''}`; }
      if (normalizedKey.startsWith('trip_invite:')) { const p = normalizedKey.split(':'); return `trip_invite:${p[1] || ''}:${p[2] || ''}`; }
      if (normalizedKey.startsWith('chapter_invite:')) { const p = normalizedKey.split(':'); return `chapter_invite:${p[1] || ''}:${p[2] || ''}`; }
      return normalizedKey;
    })();
    const mkSig = (k) => [normalizedType, k,
      String(target?.layerId || '').trim(), String(target?.eventId || '').trim(),
      String(target?.listId || '').trim(), String(target?.listItemId || '').trim(),
      String(target?.subCalendarId || '').trim(), String(target?.dateKey || '').trim(),
      String(target?.panel || '').trim(),
    ].join('|');
    const normalizedSignature = mkSig(String(message || '').trim());
    const normalizedStableSignature = mkSig(stableKey);
    if (seenInAppNotificationKeysRef.current.has(normalizedKey)) return;
    if (stableKey !== normalizedKey && seenInAppNotificationKeysRef.current.has(stableKey)) return;
    if (seenInAppNotificationSignaturesRef.current.has(normalizedSignature)) return;
    if (seenInAppNotificationSignaturesRef.current.has(normalizedStableSignature)) return;
    seenInAppNotificationKeysRef.current.add(normalizedKey);
    seenInAppNotificationKeysRef.current.add(stableKey);
    seenInAppNotificationSignaturesRef.current.add(normalizedSignature);
    seenInAppNotificationSignaturesRef.current.add(normalizedStableSignature);
    maybeSendInAppSystemNotification(type, normalizedKey, message);
    setInAppNotifications(prev => {
      if (prev.some(n => n.key === normalizedKey || n.stableKey === stableKey)) return prev;
      if (prev.some(n => [normalizedType, String(n.message || '').trim(),
        String(n?.target?.layerId || '').trim(), String(n?.target?.eventId || '').trim(),
        String(n?.target?.listId || '').trim(), String(n?.target?.listItemId || '').trim(),
        String(n?.target?.subCalendarId || '').trim(), String(n?.target?.dateKey || '').trim(),
        String(n?.target?.panel || '').trim(),
      ].join('|') === normalizedSignature)) return prev;
      if (prev.some(n => n.stableSignature === normalizedStableSignature)) return prev;
      return [{
        id: `ian_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        key: normalizedKey, stableKey, stableSignature: normalizedStableSignature,
        type: type || 'update', message,
        createdAt: createdAt || new Date().toISOString(),
        read: false,
        target: (target && typeof target === 'object') ? target : null,
      }, ...prev].slice(0, 75);
    });
  };
  // Stable wrapper so callers (master channel effect in App.js) don't need to
  // re-subscribe every render.
  const addInAppNotification = useCallback((...args) => addInAppNotificationRef.current(...args), []);

  const clearInviteNotifications = useCallback(({ kind, subCalendarId, shareId, chapterId }) => {
    const normalizedKind = String(kind || '').trim().toLowerCase();
    const normalizedSubCalId = String(subCalendarId || '').trim();
    const normalizedShareId = String(shareId || '').trim();
    const normalizedChapterId = String(chapterId || '').trim();
    const removedKeys = [];
    const removedSignatures = [];
    setInAppNotifications(prev => prev.filter((item) => {
      const k = String(item?.key || '');
      let shouldRemove = false;
      if (normalizedKind === 'trip' && normalizedSubCalId) shouldRemove = k.startsWith(`trip_invite:${normalizedSubCalId}:`);
      else if (normalizedKind === 'calendar' && normalizedShareId) shouldRemove = k.startsWith(`calendar_invite:${normalizedShareId}:`);
      else if (normalizedKind === 'chapter' && normalizedChapterId) shouldRemove = k.startsWith(`chapter_invite:${normalizedChapterId}:`);
      if (shouldRemove && k) removedKeys.push(k);
      if (shouldRemove) removedSignatures.push([String(item?.type || 'update').trim().toLowerCase(), String(item?.message || '').trim(),
        String(item?.target?.layerId || '').trim(), String(item?.target?.eventId || '').trim(),
        String(item?.target?.listId || '').trim(), String(item?.target?.listItemId || '').trim(),
        String(item?.target?.subCalendarId || '').trim(), String(item?.target?.dateKey || '').trim(),
        String(item?.target?.panel || '').trim()].join('|'));
      return !shouldRemove;
    }));
    removedKeys.forEach(k => seenInAppNotificationKeysRef.current.delete(k));
    removedSignatures.forEach(sig => seenInAppNotificationSignaturesRef.current.delete(sig));
  }, []);

  const markCalendarInviteDismissed = useCallback((shareId) => {
    const normalized = String(shareId || '').trim();
    if (!normalized || !user?.id) return;
    dismissedCalendarInviteIdsRef.current.add(normalized);
    try {
      localStorage.setItem(`dismissed-calendar-invites-${user.id}`, JSON.stringify(Array.from(dismissedCalendarInviteIdsRef.current)));
    } catch {}
  }, [user?.id]);

  const parseInviteNotification = useCallback((item) => {
    const key = String(item?.key || '');
    if (key.startsWith('trip_invite:')) {
      const parts = key.split(':');
      if (parts.length < 3) return null;
      const subCalendarId = String(parts[1] || '').trim();
      const identity = String(parts[2] || '').trim().toLowerCase();
      if (!subCalendarId || !identity) return null;
      return { kind: 'trip', subCalendarId, identity };
    }
    if (key.startsWith('calendar_invite:')) {
      const parts = key.split(':');
      if (parts.length < 3) return null;
      const shareId = String(parts[1] || '').trim();
      const identity = String(parts[2] || '').trim().toLowerCase();
      if (!shareId || !identity) return null;
      return { kind: 'calendar', shareId, identity };
    }
    if (key.startsWith('chapter_invite:')) {
      const parts = key.split(':');
      if (parts.length < 3) return null;
      const chapterId = String(parts[1] || '').trim();
      if (!chapterId) return null;
      return { kind: 'chapter', chapterId };
    }
    return null;
  }, []);

  const loadPendingTripInvites = useCallback(async () => {
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    const filter = buildMemberRecipientFilter(myEmail, myPhone);
    if (!filter) { setPendingTripInvites(prev => prev.length ? [] : prev); return; }
    try {
      const me = String(user?.id || '');
      let rows = [];
      const primary = await supabase.from('sub_calendar_members')
        .select('sub_calendar_id,email,phone,added_by,status,invited_at,accepted_at')
        .or(filter).eq('status', 'pending')
        .order('invited_at', { ascending: false, nullsFirst: false }).limit(200);
      if (!primary.error) {
        rows = primary.data || [];
      } else {
        const fallback = await supabase.from('sub_calendar_members')
          .select('sub_calendar_id,email,phone,added_by,status,invited_at,accepted_at')
          .or(filter).order('invited_at', { ascending: false, nullsFirst: false }).limit(200);
        if (fallback.error) { setPendingTripInvites(prev => prev.length ? [] : prev); return; }
        rows = (fallback.data || []).filter(r => String(r?.status || '').toLowerCase() === 'pending');
      }
      const subCalIds = Array.from(new Set(rows.map(r => String(r?.sub_calendar_id || '')).filter(Boolean)));
      if (!subCalIds.length) { setPendingTripInvites(prev => prev.length ? [] : prev); return; }
      const { data: tripRows } = await supabase.from('sub_calendars')
        .select('id,name,layer_id,owner_id,start_date,end_date').in('id', subCalIds);
      const tripMap = new Map((tripRows || []).map(t => [String(t.id), t]));
      const pending = rows.map(row => {
        const subCalId = String(row?.sub_calendar_id || '');
        const trip = tripMap.get(subCalId) || null;
        return { subCalendarId: subCalId, tripName: trip?.name || 'Trip Invite', layerId: String(trip?.layer_id || ''), ownerId: String(trip?.owner_id || row?.added_by || ''), startDate: trip?.start_date || null, endDate: trip?.end_date || null, invitedAt: row.invited_at || row.accepted_at || null, identity: getInviteIdentityFromRow(row) };
      }).filter(Boolean);
      setPendingTripInvites(prev => arePendingTripInvitesEqual(prev, pending) ? prev : pending);
    } catch (err) {
      console.error('loadPendingTripInvites exception:', err);
      setPendingTripInvites(prev => prev.length ? [] : prev);
    }
  }, [user?.email, user?.phone, user?.id]);

  const loadPendingChapterInvites = useCallback(async () => {
    const myEmail = normalizeEmail(user?.email);
    if (!myEmail) { setPendingChapterInvites(prev => prev.length ? [] : prev); return; }
    try {
      const primary = await supabase.from('chapter_collaborators')
        .select('chapter_id,email,invited_by,status,created_at,invited_at,accepted_at')
        .eq('email', myEmail).eq('status', 'pending')
        .order('invited_at', { ascending: false, nullsFirst: false });
      let rows = [];
      if (!primary.error) {
        rows = primary.data || [];
      } else {
        const fallback = await supabase.from('chapter_collaborators')
          .select('chapter_id,email,invited_by,status,created_at').eq('email', myEmail);
        if (fallback.error) { setPendingChapterInvites(prev => prev.length ? [] : prev); return; }
        rows = (fallback.data || []).filter(r => String(r?.status || '').trim().toLowerCase() === 'pending');
      }
      const chapterIds = Array.from(new Set((rows || []).map(r => String(r?.chapter_id || '')).filter(Boolean)));
      if (!chapterIds.length) { setPendingChapterInvites(prev => prev.length ? [] : prev); return; }
      const { data: chapterRows } = await supabase.from('chapters').select('id,title').in('id', chapterIds);
      const titleById = new Map((chapterRows || []).map(r => [String(r?.id || ''), String(r?.title || 'A Chapter').trim() || 'A Chapter']));
      const pending = (rows || []).map(row => ({ chapterId: String(row?.chapter_id || ''), chapterTitle: titleById.get(String(row?.chapter_id || '')) || 'A Chapter', invitedBy: String(row?.invited_by || ''), invitedAt: row?.invited_at || row?.created_at || null })).filter(i => i.chapterId);
      setPendingChapterInvites(prev => arePendingChapterInvitesEqual(prev, pending) ? prev : pending);
    } catch (err) {
      console.error('loadPendingChapterInvites exception:', err);
      setPendingChapterInvites(prev => prev.length ? [] : prev);
    }
  }, [user?.email]);

  const loadPendingCalendarInvites = useCallback(async () => {
    if (!user?.id) { setPendingCalendarInvites(prev => prev.length ? [] : prev); return; }
    const myEmail = normalizeEmail(user?.email);
    const myPhone = normalizePhoneNumber(user?.phone);
    const filter = buildShareRecipientFilter(user.id, myEmail, myPhone);
    if (!filter) { setPendingCalendarInvites(prev => prev.length ? [] : prev); return; }
    try {
      const { data: rows, error } = await supabase.from('shared_access')
        .select('id,layer_id,calendar_id,owner_id,shared_with_id,shared_with_email,shared_with_phone,created_at')
        .or(filter).is('shared_with_id', null)
        .order('created_at', { ascending: false, nullsFirst: false }).limit(200);
      if (error) { setPendingCalendarInvites(prev => prev.length ? [] : prev); return; }
      const filtered = (rows || []).filter(row => {
        const shareId = String(row?.id || '').trim();
        if (shareId && dismissedCalendarInviteIdsRef.current.has(shareId)) return false;
        if (String(row?.shared_with_id || '').trim()) return false;
        const recipient = getShareRecipientFromRow(row);
        return recipient === myEmail || recipient === myPhone;
      });
      const layerIds = Array.from(new Set(filtered.map(r => String(r?.layer_id || r?.calendar_id || '')).filter(Boolean)));
      let layerNameById = new Map();
      if (layerIds.length > 0) {
        const { data: layerRows } = await supabase.from('calendar_layers').select('id,name').in('id', layerIds);
        layerNameById = new Map((layerRows || []).map(r => [String(r?.id || ''), String(r?.name || 'Shared calendar').trim() || 'Shared calendar']));
      }
      const pending = filtered.map(row => {
        const layerId = String(row?.layer_id || row?.calendar_id || '').trim();
        return { shareId: String(row?.id || '').trim(), layerId, ownerId: String(row?.owner_id || '').trim(), calendarName: layerNameById.get(layerId) || 'Shared calendar', createdAt: row?.created_at || null };
      }).filter(i => i.shareId && i.layerId);
      setPendingCalendarInvites(prev => arePendingCalendarInvitesEqual(prev, pending) ? prev : pending);
    } catch (err) {
      console.error('loadPendingCalendarInvites exception:', err);
      setPendingCalendarInvites(prev => prev.length ? [] : prev);
    }
  }, [user?.email, user?.id, user?.phone]);

  return {
    inAppNotifications,
    setInAppNotifications,
    pendingTripInvites,
    setPendingTripInvites,
    pendingCalendarInvites,
    setPendingCalendarInvites,
    pendingChapterInvites,
    setPendingChapterInvites,
    chapterInviteRefreshToken,
    setChapterInviteRefreshToken,
    seenExpenseIdsRef,
    dismissedCalendarInviteIdsRef,
    inAppSyncCursorRef,
    addInAppNotification,
    clearInviteNotifications,
    markCalendarInviteDismissed,
    parseInviteNotification,
    loadPendingTripInvites,
    loadPendingCalendarInvites,
    loadPendingChapterInvites,
  };
}
