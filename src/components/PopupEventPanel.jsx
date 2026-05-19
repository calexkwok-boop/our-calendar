import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Plus, Users, Lock, Globe, Edit3, Crown, Send,
  Shield, UserMinus, ChevronRight, MapPin, Clock,
  Calendar, CheckCircle, AlertCircle, Loader, Copy, Check, Trash2,
  Navigation, Radio, Gamepad2, MessageCircle, Map as MapIcon,
} from 'lucide-react';
import EventCardRouter, { resolveEventCardCategory } from './EventCardRouter';
import SportsEventCard from './SportsEventCard';

const APP_FONT_STACK = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POPUP_NO_MAX_SENTINEL = 1000000;
const isUuid = (value) => UUID_RE.test(String(value || '').trim());
const getPopupManualPlayersStorageKey = (eventId) => `popup-manual-players:${String(eventId || '').trim()}`;
const readPopupManualPlayers = (eventId) => {
  if (typeof window === 'undefined') return [];
  const key = getPopupManualPlayersStorageKey(eventId);
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const writePopupManualPlayers = (eventId, players) => {
  if (typeof window === 'undefined') return;
  const key = getPopupManualPlayersStorageKey(eventId);
  if (!key) return;
  try {
    if (!Array.isArray(players) || players.length === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(players));
  } catch {}
};

const isValidLatLng = (lat, lng) => {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return false;
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) return false;
  // Treat the null-island sentinel as invalid for event venue coordinates.
  if (Math.abs(numLat) < 0.000001 && Math.abs(numLng) < 0.000001) return false;
  return true;
};

const hexToRgba = (hex, alpha = 1) => {
  const value = String(hex || '').trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return `rgba(99,102,241,${alpha})`;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatPopupCapacityLabel = (memberCount, maxPlayers, attendeeLabel) => {
  const singularLabel = attendeeLabel === 'players' ? 'player' : 'guest';
  const noMax = Number(maxPlayers || 0) >= POPUP_NO_MAX_SENTINEL;
  if (noMax) return `${memberCount} ${memberCount === 1 ? singularLabel : attendeeLabel} joined`;
  return `${memberCount}/${maxPlayers} ${attendeeLabel}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const initials = (name) => {
  const parts = String(name || '?').trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : String(name || '?')[0].toUpperCase();
};

const formatMsgTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ROLE_COLORS = {
  host:   { bg: '#fef3c7', text: '#92400e', dark_bg: 'rgba(251,191,36,0.2)',  dark_text: '#fbbf24' },
  player: { bg: '#f3f4f6', text: '#374151', dark_bg: 'rgba(255,255,255,0.08)',dark_text: '#9ca3af' },
};
const ROLE_ICONS = { host: Crown, cohost: Shield, player: null };
const Avatar = ({ name, photoUrl, size = 32, accent, role, darkMode }) => {
  const colors = ROLE_COLORS[role || 'player'] || ROLE_COLORS.player;
  const cohostBg = darkMode ? hexToRgba(accent, 0.22) : hexToRgba(accent, 0.12);
  const cohostBorder = hexToRgba(accent, darkMode ? 0.62 : 0.28);
  const url = String(photoUrl || '').trim();
  const hasPhoto = /^(https?:\/\/|data:image\/|blob:)/i.test(url);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: role === 'host'
        ? (darkMode ? colors.dark_bg : colors.bg)
        : role === 'cohost'
          ? cohostBg
          : `${accent}22`,
      border: `2px solid ${role === 'host' ? '#fbbf24' : role === 'cohost' ? cohostBorder : accent + '44'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 900,
      color: role === 'host' ? '#f59e0b' : accent,
      letterSpacing: '-0.02em',
      overflow: 'hidden',
    }}>
      {hasPhoto
        ? <img src={url} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : initials(name)}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    open:   { label: 'Open',   color: '#10b981' },
    full:   { label: 'Full',   color: '#f59e0b' },
    active: { label: 'Live',   color: '#ef4444' },
    ended:  { label: 'Ended',  color: '#9ca3af' },
  };
  const s = map[status] || map.open;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      borderRadius: 999, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
      background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44` }}>
      {status === 'active' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />}
      {s.label}
    </span>
  );
};

const CourtBg = () => (
  <svg style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', opacity: 0.12, pointerEvents: 'none' }}
    width="90" height="58" viewBox="0 0 90 58" fill="none">
    <rect x="1" y="1" width="88" height="56" rx="3" stroke="white" strokeWidth="2"/>
    <rect x="1" y="1" width="26" height="56" fill="white" fillOpacity="0.5"/>
    <rect x="63" y="1" width="26" height="56" fill="white" fillOpacity="0.5"/>
    <line x1="27" y1="1" x2="27" y2="57" stroke="white" strokeWidth="1.5"/>
    <line x1="63" y1="1" x2="63" y2="57" stroke="white" strokeWidth="1.5"/>
    <line x1="45" y1="1" x2="45" y2="57" stroke="white" strokeWidth="2.5"/>
    <line x1="27" y1="29" x2="63" y2="29" stroke="white" strokeWidth="1"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// usePlacesAutocomplete
// ─────────────────────────────────────────────────────────────────────────────

const usePlacesAutocomplete = (inputRef, onSelect) => {
  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, { types: ['establishment', 'geocode'] });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry) return;
      onSelect({ location: place.formatted_address || place.name || '', lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
    });
    return () => window.google.maps.event.clearInstanceListeners(ac);
  }, [inputRef.current]);
};

// ─────────────────────────────────────────────────────────────────────────────
// CreateEventForm
// ─────────────────────────────────────────────────────────────────────────────

const CreateEventForm = ({ accent, darkMode, btnStyle, border, softBg, supabase, user, calendarId, displayName, onCreated, onCancel }) => {
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', location_lat: null, location_lng: null, max_players: 10, is_public: true, description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const locationRef = useRef(null);
  const effectiveDisplayName = String(displayName || '').trim();
  const primaryText = darkMode ? '#f8fafc' : 'var(--color-text-primary)';
  const secondaryText = darkMode ? '#cbd5e1' : 'var(--color-text-secondary)';
  usePlacesAutocomplete(locationRef, ({ location, lat, lng }) => setForm((p) => ({ ...p, location, location_lat: lat, location_lng: lng })));
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Event name is required.'); return; }
    if (!form.date) { setError('Date is required.'); return; }
    setSaving(true); setError('');
    try {
      const { data, error: err } = await supabase.from('popup_event_details').insert({
        calendar_id: calendarId, created_by: user.id, title: form.title.trim(),
        date: form.date, time: form.time || null, location: form.location || null,
        location_lat: form.location_lat, location_lng: form.location_lng,
        max_players: Number(form.max_players) || 10, is_public: form.is_public,
        description: form.description.trim() || null, event_data: {}, status: 'open',
      }).select().single();
      if (err) throw err;
      // Ensure summary row exists in popup_events for cross-panel features (capacity bar, home cards, etc.)
      try {
        await supabase
          .from('popup_events')
          .upsert({
            layer_id: calendarId,
            event_id: data.id,
            max_people: Number(form.max_players) || 10,
            created_by_user_id: user.id,
            created_by_name: effectiveDisplayName || 'Host',
          }, { onConflict: 'event_id' });
      } catch {}
      await supabase.from('popup_event_members').insert({ event_id: data.id, user_id: user.id, display_name: effectiveDisplayName || 'Host', role: 'host' });
      onCreated(data);
    } catch (e) { setError(e.message || 'Could not create event.'); }
    finally { setSaving(false); }
  };

  const F = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: secondaryText, marginBottom: 6 }}>{children}</div>
  );
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 12, fontSize: 16, border: `1.5px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.06)' : '#fff', color: primaryText, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      <div><F>Event Name</F><input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Saturday Pickleball" style={inp} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
        <div style={{ minWidth: 0 }}><F>Date</F><input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} style={inp} /></div>
        <div style={{ minWidth: 0 }}><F>Time</F><input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} style={inp} /></div>
      </div>
      <div><F>Location</F>
        <div style={{ position: 'relative' }}>
          <MapPin style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: accent, opacity: 0.7 }} />
          <input ref={locationRef} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Search venue..." style={{ ...inp, paddingLeft: 30 }} />
        </div>
      </div>
      <div><F>Max Players</F>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={2} max={32} value={form.max_players} onChange={(e) => set('max_players', parseInt(e.target.value))} style={{ flex: 1, accentColor: accent }} />
          <div style={{ width: 40, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accent}18`, color: accent, fontSize: 14, fontWeight: 900, border: `1.5px solid ${accent}33` }}>{form.max_players}</div>
        </div>
      </div>
      <div><F>Visibility</F>
        <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${border}` }}>
          {[{ v: true, icon: Globe, label: 'Public', sub: 'Open to calendar' }, { v: false, icon: Lock, label: 'Private', sub: 'Invite only' }].map(({ v, icon: Icon, label, sub }) => {
            const sel = form.is_public === v;
            return (
              <button key={String(v)} onClick={() => set('is_public', v)} style={{ flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', background: sel ? accent : 'transparent', transition: 'all 0.2s' }}>
                <Icon style={{ width: 14, height: 14, color: sel ? (darkMode ? '#111' : '#fff') : secondaryText, flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: sel ? (darkMode ? '#111' : '#fff') : primaryText }}>{label}</div>
                  <div style={{ fontSize: 10, color: sel ? 'rgba(255,255,255,0.7)' : secondaryText }}>{sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div><F>Description <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></F>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Skill level, what to bring..." rows={3} style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
      </div>
      {error && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12 }}><AlertCircle style={{ width: 14, height: 14 }} />{error}</div>}
      <button onClick={handleSubmit} disabled={saving} style={{ ...btnStyle, padding: 13, borderRadius: 14, fontSize: 14, fontWeight: 900, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {saving ? <Loader style={{ width: 16, height: 16 }} /> : <Plus style={{ width: 16, height: 16 }} />}
        {saving ? 'Creating...' : 'Create Event'}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RosterRow
// ─────────────────────────────────────────────────────────────────────────────

const RosterRow = ({
  member,
  isMe,
  isHost,
  accent,
  darkMode,
  onKick,
  onPromote,
  onDemote,
  attendeeRoleLabel = 'Player',
  attendeeStatusLabel = '',
  attendeeStatusTone = '',
  canManageRoles = true,
  forceMenuUp = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const RoleIcon = ROLE_ICONS[member.role];
  const secondaryText = darkMode ? '#cbd5e1' : 'var(--color-text-secondary)';
  const menuActions = [];
  if (canManageRoles && member.role === 'player') {
    menuActions.push({
      key: 'promote',
      label: 'Make co-host',
      icon: Shield,
      color: accent,
      onClick: () => onPromote(member),
    });
  }
  if (canManageRoles && member.role === 'cohost') {
    menuActions.push({
      key: 'demote',
      label: 'Remove co-host',
      icon: UserMinus,
      color: secondaryText,
      onClick: () => onDemote(member),
    });
  }
  menuActions.push({
    key: 'kick',
    label: 'Kick player',
    icon: UserMinus,
    color: '#ef4444',
      onClick: () => onKick(member),
  });
  const normalizedStatusTone = String(attendeeStatusTone || '').trim().toLowerCase();
  const statusStyles = normalizedStatusTone === 'yes'
    ? {
        background: darkMode ? 'rgba(16,185,129,0.16)' : 'rgba(16,185,129,0.12)',
        color: darkMode ? '#86efac' : '#047857',
      }
    : normalizedStatusTone === 'no'
      ? {
          background: darkMode ? 'rgba(239,68,68,0.16)' : 'rgba(239,68,68,0.12)',
          color: darkMode ? '#fca5a5' : '#b91c1c',
        }
      : {
          background: darkMode ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.14)',
          color: darkMode ? '#cbd5e1' : '#475569',
        };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
        <Avatar name={member.display_name} photoUrl={member.photoUrl || member.photo_url || member.avatarUrl || member.avatar_url} size={34} accent={accent} role={member.role} darkMode={darkMode} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#f8fafc' : 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.display_name}{isMe && <span style={{ fontSize: 10, color: darkMode ? '#cbd5e1' : 'var(--color-text-secondary)', fontWeight: 500, marginLeft: 4 }}>(you)</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {RoleIcon && <RoleIcon style={{ width: 10, height: 10, color: member.role === 'host' ? '#f59e0b' : accent }} />}
            <span style={{ fontSize: 10, fontWeight: 700, color: member.role === 'host' ? '#f59e0b' : member.role === 'cohost' ? accent : (darkMode ? '#cbd5e1' : 'var(--color-text-secondary)') }}>
              {member.role === 'host' ? 'Host' : member.role === 'cohost' ? 'Co-host' : attendeeRoleLabel}
            </span>
            {attendeeStatusLabel ? (
              <span
                style={{
                  marginLeft: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  ...statusStyles,
                }}
              >
                {attendeeStatusLabel}
              </span>
            ) : null}
          </div>
        </div>
        {isHost && !isMe && member.role !== 'host' && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: secondaryText }}
          >
            •••
          </button>
        )}
      </div>
      {isHost && !isMe && member.role !== 'host' && menuOpen && (
        <div style={{ padding: forceMenuUp ? '0 16px 12px 60px' : '0 16px 12px 60px' }}>
          <div
            style={{
              borderRadius: 12,
              background: darkMode ? '#1f2937' : '#fff',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {menuActions.map(({ key, label, icon: Icon, color, onClick }) => (
              <button
                key={key}
                onClick={() => { onClick(); setMenuOpen(false); }}
                style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', background: 'transparent', color, fontSize: 12, fontWeight: 700, textAlign: 'left' }}
              >
                <Icon style={{ width: 13, height: 13 }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatRoom
// ─────────────────────────────────────────────────────────────────────────────

const ChatRoom = ({ eventId, supabase, user, displayName, accent, darkMode, border, softBg, members, embedded = false }) => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const memberRoleByUserId = useMemo(() => new Map(
    (Array.isArray(members) ? members : []).map((member) => [String(member?.user_id || ''), member?.role || 'player'])
  ), [members]);
  const primaryText = darkMode ? '#f8fafc' : 'var(--color-text-primary)';
  const secondaryText = darkMode ? '#cbd5e1' : 'var(--color-text-secondary)';
  const effectiveChatDisplayName = String(displayName || user?.email || user?.phone || 'Player').trim() || 'Player';

  const loadMessages = useCallback(async () => {
    if (!eventId || !supabase) return;
    const { data, error } = await supabase.from('popup_event_messages').select('*').eq('event_id', eventId).order('created_at').limit(200);
    if (error) {
      console.error('Could not load popup chat messages:', error);
      setChatError(error.message || 'Could not load chat.');
      return;
    }
    setChatError('');
    if (data) setMessages(data);
  }, [eventId, supabase]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!eventId || !supabase) return;
    const channel = supabase.channel(`chat-${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'popup_event_messages', filter: `event_id=eq.${eventId}` },
        (payload) => setMessages((prev) => (
          prev.some((msg) => String(msg?.id || '') === String(payload?.new?.id || ''))
            ? prev
            : [...prev, payload.new]
        )))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'popup_event_messages', filter: `event_id=eq.${eventId}` },
        (payload) => setMessages((prev) => prev.filter((msg) => String(msg?.id || '') !== String(payload?.old?.id || ''))))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [eventId]);

  // Auto-scroll only the chat scroller, not the whole parent sheet/card.
  useEffect(() => {
    const scroller = messagesRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || sending || !eventId || !user?.id) return;
    setSending(true);
    setChatError('');
    const optimisticId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMessage = {
      id: optimisticId,
      event_id: eventId,
      user_id: user.id,
      display_name: effectiveChatDisplayName,
      content,
      created_at: new Date().toISOString(),
    };
    setDraft('');
    setMessages((prev) => [...prev, optimisticMessage]);
    try {
      const { data, error } = await supabase
        .from('popup_event_messages')
        .insert({ event_id: eventId, user_id: user.id, display_name: effectiveChatDisplayName, content })
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setMessages((prev) => prev.map((msg) => (
          String(msg?.id || '') === optimisticId ? data : msg
        )));
      } else {
        await loadMessages();
      }
    } catch (error) {
      console.error('Could not send popup chat message:', error);
      setMessages((prev) => prev.filter((msg) => String(msg?.id || '') !== optimisticId));
      setDraft(content);
      setChatError(error?.message || 'Could not send message.');
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const deleteMessage = async (message) => {
    const messageId = String(message?.id || '').trim();
    if (!messageId || String(message?.user_id || '') !== String(user?.id || '')) return;
    if (String(messageId).startsWith('local-')) {
      setMessages((prev) => prev.filter((msg) => String(msg?.id || '') !== messageId));
      return;
    }
    const previousMessages = messages;
    setDeletingMessageId(messageId);
    setChatError('');
    setMessages((prev) => prev.filter((msg) => String(msg?.id || '') !== messageId));
    const { error } = await supabase
      .from('popup_event_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id);
    if (error) {
      console.error('Could not delete popup chat message:', error);
      setMessages(previousMessages);
      setChatError(error.message || 'Could not unsend message.');
    }
    setDeletingMessageId('');
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // Group consecutive messages by same sender
  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const isFirst = !prev || prev.user_id !== msg.user_id || (new Date(msg.created_at) - new Date(prev.created_at)) > 5 * 60 * 1000;
    acc.push({ ...msg, isFirst });
    return acc;
  }, []);

  const isMe = (msg) => msg.user_id === user?.id;
  const msgRole = (msg) => memberRoleByUserId.get(String(msg?.user_id || '')) || 'player';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: embedded ? 360 : 420,
        minHeight: 0,
        borderRadius: embedded ? 18 : 0,
        overflow: 'hidden',
        background: embedded ? (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.88)') : 'transparent',
        border: embedded ? `1px solid ${border}` : 'none',
        boxShadow: embedded ? (darkMode ? 'none' : '0 10px 30px rgba(15,23,42,0.06)') : 'none',
      }}
    >
      {/* Messages */}
      <div
        ref={messagesRef}
        style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {chatError && (
          <div style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#ef4444' }}>
            {chatError}
          </div>
        )}
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.5 }}>
            <MessageCircle style={{ width: 32, height: 32, color: accent }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: secondaryText }}>No messages yet</div>
            <div style={{ fontSize: 11, color: secondaryText }}>Be the first to say something 👋</div>
          </div>
        )}
        {grouped.map((msg) => {
          const me = isMe(msg);
          const role = msgRole(msg);
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: me ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginTop: msg.isFirst ? 10 : 2 }}>
              {/* Avatar — only on first in group, other side */}
              {!me && msg.isFirst && <Avatar name={msg.display_name} size={26} accent={accent} role={role} darkMode={darkMode} />}
              {!me && !msg.isFirst && <div style={{ width: 26, flexShrink: 0 }} />}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: me ? 'flex-end' : 'flex-start' }}>
                {msg.isFirst && !me && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: role === 'host' ? '#f59e0b' : accent }}>{msg.display_name}</span>
                    {role !== 'player' && <span style={{ fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 999, background: role === 'host' ? 'rgba(251,191,36,0.2)' : hexToRgba(accent, 0.2), color: role === 'host' ? '#f59e0b' : accent }}>{role}</span>}
                  </div>
                )}
                <div style={{ padding: '8px 12px', borderRadius: me ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: 13, lineHeight: 1.5, fontWeight: 500,
                  background: me ? accent : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                  color: me ? (darkMode ? '#111' : '#fff') : primaryText,
                  wordBreak: 'break-word' }}>
                  {msg.content}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <div style={{ fontSize: 10, color: secondaryText, opacity: 0.75 }}>{formatMsgTime(msg.created_at)}</div>
                  {me && (
                    <button
                      type="button"
                      onClick={() => deleteMessage(msg)}
                      disabled={deletingMessageId === String(msg.id || '')}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        color: secondaryText,
                        opacity: deletingMessageId === String(msg.id || '') ? 0.5 : 0.8,
                        cursor: deletingMessageId === String(msg.id || '') ? 'default' : 'pointer',
                      }}
                    >
                      <Trash2 style={{ width: 10, height: 10 }} />
                      Unsend
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${border}`, display: 'flex', gap: 8, alignItems: 'flex-end', background: softBg }}>
        <textarea ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Say something..." rows={1}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 16, fontSize: 14, border: `1.5px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.08)' : '#fff', color: primaryText, outline: 'none', resize: 'none', lineHeight: 1.4, maxHeight: 80, overflowY: 'auto' }} />
        <button onClick={sendMessage} disabled={!draft.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: 12, border: 'none', cursor: draft.trim() ? 'pointer' : 'default', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: draft.trim() ? accent : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), transition: 'all 0.2s' }}>
          <Send style={{ width: 16, height: 16, color: draft.trim() ? (darkMode ? '#111' : '#fff') : secondaryText }} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LiveMap
// ─────────────────────────────────────────────────────────────────────────────

const LiveMap = ({ event, supabase, user, displayName, accent, darkMode, border, softBg, members }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const watchIdRef = useRef(null);
  const eventMarkerRef = useRef(null);
  const currentUserMarkerRef = useRef(null);
  const manualZoomRef = useRef(false);
  const zoomLevelRef = useRef(15);
  const fallbackCenterRef = useRef({ lat: 37.7749, lng: -122.4194 });
  const [sharing, setSharing] = useState(false);
  const [locations, setLocations] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(Boolean(typeof window !== 'undefined' && window.googleMapsAuthFailed));
  const memberByUserId = useMemo(() => new Map(
    (Array.isArray(members) ? members : []).map((member) => [String(member?.user_id || ''), member])
  ), [members]);
  const hasEventCoordinates = isValidLatLng(event?.location_lat, event?.location_lng);
  const sharedSelfLocation = locations.find((loc) => loc.user_id === user?.id) || null;
  const hasSharedLocations = locations.length > 0;
  const shouldActivateMap = hasSharedLocations || sharing;
  const mapHref = event?.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(event.location || '').trim())}`
    : hasEventCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${Number(event.location_lat)},${Number(event.location_lng)}`)}`
      : '';

  const syncViewport = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;
    const points = [];
    if (hasEventCoordinates) {
      points.push({ lat: Number(event.location_lat), lng: Number(event.location_lng) });
    }
    if (currentPosition) {
      points.push(currentPosition);
    } else if (sharedSelfLocation && Number.isFinite(Number(sharedSelfLocation.lat)) && Number.isFinite(Number(sharedSelfLocation.lng))) {
      points.push({ lat: Number(sharedSelfLocation.lat), lng: Number(sharedSelfLocation.lng) });
    }
    if (points.length === 0) {
      map.setCenter(fallbackCenterRef.current);
      return;
    }
    if (points.length === 1) {
      map.setCenter(points[0]);
      if (!manualZoomRef.current) {
        zoomLevelRef.current = 15;
        map.setZoom(15);
      }
      return;
    }
    if (manualZoomRef.current) {
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, 48);
    window.setTimeout(() => {
      const fittedZoom = Number(map.getZoom?.());
      if (Number.isFinite(fittedZoom)) {
        zoomLevelRef.current = fittedZoom;
      }
    }, 0);
  }, [currentPosition, event.location_lat, event.location_lng, hasEventCoordinates, sharedSelfLocation]);

  useEffect(() => {
    if (!shouldActivateMap) return undefined;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return undefined;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        fallbackCenterRef.current = nextCenter;
        setCurrentPosition(nextCenter);
        if (mapInstanceRef.current) {
          syncViewport();
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
    );
    return () => {
      cancelled = true;
    };
  }, [shouldActivateMap, syncViewport]);

  useEffect(() => {
    if (shouldActivateMap) return undefined;
    Object.values(markersRef.current || {}).forEach((marker) => marker?.setMap?.(null));
    markersRef.current = {};
    if (eventMarkerRef.current) {
      eventMarkerRef.current.setMap(null);
      eventMarkerRef.current = null;
    }
    if (currentUserMarkerRef.current) {
      currentUserMarkerRef.current.setMap(null);
      currentUserMarkerRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.innerHTML = '';
    }
    mapInstanceRef.current = null;
    manualZoomRef.current = false;
    setMapReady(false);
    return undefined;
  }, [shouldActivateMap]);

  // Init Google Map
  useEffect(() => {
    if (!shouldActivateMap) return undefined;
    if (!mapRef.current || mapInstanceRef.current) return undefined;

    let cancelled = false;
    let retryId = null;

    const initMap = () => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;
      if (window.googleMapsAuthFailed) {
        setMapFailed(true);
        return;
      }
      if (!window.google?.maps) {
        retryId = window.setTimeout(initMap, 300);
        return;
      }
      const center = hasEventCoordinates
        ? { lat: Number(event.location_lat), lng: Number(event.location_lng) }
        : currentPosition || fallbackCenterRef.current;
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeId: 'roadmap',
        });
      } catch (error) {
        console.warn('LiveMap style init failed, retrying without custom styles:', error);
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeId: 'roadmap',
        });
      }
      zoomLevelRef.current = 15;
      if (typeof mapInstanceRef.current?.addListener === 'function') {
        mapInstanceRef.current.addListener('zoom_changed', () => {
          const nextZoom = Number(mapInstanceRef.current?.getZoom?.());
          if (Number.isFinite(nextZoom)) {
            zoomLevelRef.current = nextZoom;
          }
        });
      }
      window.setTimeout(() => {
        if (!mapInstanceRef.current || !window.google?.maps?.event) return;
        window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
        syncViewport();
      }, 250);
      window.setTimeout(() => {
        if (!mapInstanceRef.current || !window.google?.maps?.event) return;
        window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
        syncViewport();
      }, 900);
      setMapReady(true);
    };

    initMap();

    return () => {
      cancelled = true;
      if (retryId) window.clearTimeout(retryId);
    };
  }, [currentPosition, darkMode, event.location_lat, event.location_lng, hasEventCoordinates, shouldActivateMap, syncViewport]);

  useEffect(() => {
    if (!shouldActivateMap) return;
    if (!mapInstanceRef.current || !mapReady || !window.google?.maps) return;
    if (hasEventCoordinates) {
      const eventPosition = { lat: Number(event.location_lat), lng: Number(event.location_lng) };
      if (eventMarkerRef.current) {
        eventMarkerRef.current.setPosition(eventPosition);
      } else {
        eventMarkerRef.current = new window.google.maps.Marker({
          position: eventPosition,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: accent,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          title: event.location || 'Venue',
        });
      }
    } else if (eventMarkerRef.current) {
      eventMarkerRef.current.setMap(null);
      eventMarkerRef.current = null;
    }

    if (currentPosition) {
      if (currentUserMarkerRef.current) {
        currentUserMarkerRef.current.setPosition(currentPosition);
        currentUserMarkerRef.current.setMap(mapInstanceRef.current);
      } else {
        currentUserMarkerRef.current = new window.google.maps.Marker({
          position: currentPosition,
          map: mapInstanceRef.current,
          title: 'Your location',
          zIndex: 11,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
        });
      }
    } else if (currentUserMarkerRef.current) {
      currentUserMarkerRef.current.setMap(null);
    }

    syncViewport();
  }, [accent, currentPosition, event.location, event.location_lat, event.location_lng, hasEventCoordinates, mapReady, sharedSelfLocation, shouldActivateMap, syncViewport]);

  // Load + realtime locations
  const loadLocations = useCallback(async () => {
    if (!event?.id || !supabase) return;
    const { data } = await supabase.from('popup_event_locations').select('*').eq('event_id', event.id).limit(200);
    if (data) setLocations(data);
  }, [event?.id, supabase]);

  const applyLocationRealtimePayload = useCallback((payload) => {
    const nextRow = payload?.new || payload?.old;
    const rowId = String(nextRow?.id || '').trim();
    const userId = String(nextRow?.user_id || '').trim();
    if (!rowId && !userId) return;
    setLocations((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const matchIndex = current.findIndex((entry) => {
        const entryId = String(entry?.id || '').trim();
        const entryUserId = String(entry?.user_id || '').trim();
        return (rowId && entryId === rowId) || (!rowId && userId && entryUserId === userId);
      });
      if (payload?.eventType === 'DELETE') {
        if (matchIndex === -1) return current;
        return current.filter((_, index) => index !== matchIndex);
      }
      if (matchIndex === -1) return [...current, nextRow];
      return current.map((entry, index) => (index === matchIndex ? { ...entry, ...nextRow } : entry));
    });
  }, []);

  useEffect(() => { loadLocations(); }, [loadLocations]);

  useEffect(() => {
    if (!event?.id || !supabase) return;
    const channel = supabase.channel(`locations-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_locations', filter: `event_id=eq.${event.id}` },
        (payload) => applyLocationRealtimePayload(payload))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [event?.id, supabase, applyLocationRealtimePayload]);

  // Update map markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const seen = new Set();
    locations.forEach((loc) => {
      seen.add(loc.user_id);
      const pos = { lat: loc.lat, lng: loc.lng };
      const member = memberByUserId.get(String(loc?.user_id || ''));
      const isMe = loc.user_id === user?.id;
      if (isMe) return;
      if (markersRef.current[loc.user_id]) {
        markersRef.current[loc.user_id].setPosition(pos);
      } else {
        const label = initials(loc.display_name);
        markersRef.current[loc.user_id] = new window.google.maps.Marker({
          position: pos, map: mapInstanceRef.current,
          label: { text: label, color: '#fff', fontWeight: '900', fontSize: '11px' },
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 16,
            fillColor: isMe ? accent : (member?.role === 'host' ? '#f59e0b' : accent),
            fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
          title: loc.display_name,
          zIndex: isMe ? 10 : 1,
        });
      }
    });
    if (user?.id && markersRef.current[user.id]) {
      markersRef.current[user.id].setMap(null);
      delete markersRef.current[user.id];
    }
    // Remove stale markers
    Object.keys(markersRef.current).forEach((uid) => {
      if (!seen.has(uid)) { markersRef.current[uid].setMap(null); delete markersRef.current[uid]; }
    });
  }, [locations, mapReady, memberByUserId, user?.id]);

  const startSharing = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported on this device.'); return; }
    setSharing(true); setGeoError('');
    const upsertLocation = async (lat, lng) => {
      await supabase.from('popup_event_locations').upsert(
        { event_id: event.id, user_id: user.id, display_name: displayName || 'Player', lat, lng, updated_at: new Date().toISOString() },
        { onConflict: 'event_id,user_id' }
      );
    };
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => upsertLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => { setGeoError('Location access denied.'); setSharing(false); },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const stopSharing = async () => {
    if (watchIdRef.current != null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setSharing(false);
    await supabase.from('popup_event_locations').delete().eq('event_id', event.id).eq('user_id', user.id);
    await loadLocations();
  };

  useEffect(() => () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  const adjustZoom = (delta) => {
    const map = mapInstanceRef.current;
    if (!map || typeof map.getZoom !== 'function' || typeof map.setZoom !== 'function') return;
    manualZoomRef.current = true;
    const currentZoom = Number.isFinite(Number(zoomLevelRef.current))
      ? Number(zoomLevelRef.current)
      : Number(map.getZoom?.() || 15);
    const nextZoom = Math.max(2, Math.min(21, currentZoom + delta));
    zoomLevelRef.current = nextZoom;
    map.setZoom(nextZoom);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Map */}
      {mapFailed ? (
        <div style={{ height: 300, background: darkMode ? '#1d2c4d' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, borderRadius: 18, border: `1px solid ${border}`, background: softBg, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: darkMode ? '#fff' : 'var(--color-text-primary)' }}>Map preview unavailable</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: darkMode ? '#cbd5e1' : 'var(--color-text-secondary)', marginTop: 6 }}>
              Google Maps did not authorize correctly for the embedded preview.
            </div>
            {event?.location ? (
              <div style={{ fontSize: 12, lineHeight: 1.5, color: darkMode ? '#e2e8f0' : 'var(--color-text-primary)', marginTop: 10 }}>
                {event.location}
              </div>
            ) : null}
            {mapHref ? (
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 14, padding: '10px 14px', borderRadius: 12, background: accent, color: darkMode ? '#111' : '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}
              >
                Open in Google Maps
              </a>
            ) : null}
          </div>
        </div>
      ) : !shouldActivateMap ? (
        <div style={{ height: 300, background: darkMode ? '#0f172a' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360, borderRadius: 18, border: `1px solid ${border}`, background: softBg, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: darkMode ? '#fff' : 'var(--color-text-primary)' }}>No live location yet</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: darkMode ? '#cbd5e1' : 'var(--color-text-secondary)', marginTop: 6 }}>
              The map stays off until at least one person shares their location.
            </div>
            {event?.location ? (
              <div style={{ fontSize: 12, lineHeight: 1.5, color: darkMode ? '#e2e8f0' : 'var(--color-text-primary)', marginTop: 10 }}>
                {event.location}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
              <button
                type="button"
                onClick={startSharing}
                style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: accent, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Share my location
              </button>
              {mapHref ? (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', borderRadius: 12, border: `1px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.04)' : '#fff', color: darkMode ? '#f8fafc' : 'var(--color-text-primary)', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}
                >
                  Open venue
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div ref={mapRef} style={{ height: 300, background: darkMode ? '#0f172a' : '#e5e7eb' }} />
          <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 3 }}>
            <button
              type="button"
              onClick={() => adjustZoom(-1)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: darkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.96)',
                color: darkMode ? '#f8fafc' : 'var(--color-text-primary)',
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1,
                boxShadow: darkMode ? '0 10px 24px rgba(2,6,23,0.28)' : '0 10px 24px rgba(15,23,42,0.12)',
                cursor: 'pointer',
              }}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => adjustZoom(1)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: darkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.96)',
                color: darkMode ? '#f8fafc' : 'var(--color-text-primary)',
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1,
                boxShadow: darkMode ? '0 10px 24px rgba(2,6,23,0.28)' : '0 10px 24px rgba(15,23,42,0.12)',
                cursor: 'pointer',
              }}
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, background: softBg }}>
        {geoError && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{geoError}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: darkMode ? '#f8fafc' : 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Radio style={{ width: 13, height: 13, color: sharing ? '#10b981' : accent }} />
              {sharing ? 'Sharing your location' : 'Location sharing off'}
            </div>
            <div style={{ fontSize: 11, color: darkMode ? '#94a3b8' : 'var(--color-text-secondary)', marginTop: 2 }}>
              {locations.length} player{locations.length !== 1 ? 's' : ''} visible on map
            </div>
          </div>
          <button onClick={sharing ? stopSharing : startSharing}
            style={{ padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 900, cursor: 'pointer', border: 'none',
              background: sharing ? 'rgba(239,68,68,0.1)' : accent,
              color: sharing ? '#ef4444' : '#fff',
              border: sharing ? '1.5px solid rgba(239,68,68,0.3)' : 'none' }}>
            {sharing ? 'Stop sharing' : '📍 Share location'}
          </button>
        </div>

        {/* Player location list */}
        {locations.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {locations.map((loc) => {
              const member = members.find((m) => m.user_id === loc.user_id);
              const isMe = loc.user_id === user?.id;
              return (
                <div key={loc.user_id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: isMe ? `${accent}22` : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  color: isMe ? accent : 'var(--color-text-secondary)', border: `1px solid ${isMe ? accent + '33' : 'transparent'}` }}>
                  <Navigation style={{ width: 10, height: 10 }} />
                  {loc.display_name}{isMe ? ' (you)' : ''}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GameModeLauncher
// ─────────────────────────────────────────────────────────────────────────────

const GameModeLauncher = ({ event, members, accent, darkMode, border, softBg, btnStyle, onLaunchRoundRobin, onLaunchGauntlet, onLaunchScramble, isHost }) => {
  const playerCount = members.length;
  const canStart = playerCount >= 3;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '12px 14px', borderRadius: 14, background: softBg, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, marginBottom: 4 }}>Roster Ready</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {members.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: m.role === 'host' ? 'rgba(251,191,36,0.15)' : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
              color: m.role === 'host' ? '#f59e0b' : (darkMode ? '#ffffff' : 'var(--color-text-secondary)') }}>
              {m.role === 'host' && <Crown style={{ width: 10, height: 10 }} />}
              {m.display_name}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: darkMode ? '#ffffff' : 'var(--color-text-secondary)', marginTop: 8 }}>
          {playerCount} player{playerCount !== 1 ? 's' : ''} · {Math.floor(playerCount / 2)} possible doubles teams
        </div>
      </div>

      {!canStart && (
        <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, color: '#d97706', fontWeight: 700 }}>
          ⚠️ Need at least 3 players to start a game mode
        </div>
      )}

      {!isHost && (
        <div style={{ padding: '10px 14px', borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'center' }}>
          Only the host can launch a game mode
        </div>
      )}

      {isHost && canStart && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => onLaunchRoundRobin?.(event, members)}
            style={{ ...btnStyle, padding: '14px 16px', borderRadius: 16, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: `0 6px 20px ${accent}40` }}>
            <span style={{ fontSize: 24 }}>🏓</span>
            <div style={{ textAlign: 'left' }}>
              <div>Round Robin</div>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>Every team plays every team</div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, marginLeft: 'auto' }} />
          </button>

          <button onClick={() => onLaunchGauntlet?.(event, members)}
            style={{ ...btnStyle, padding: '14px 16px', borderRadius: 16, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: `0 6px 20px ${accent}40` }}>
            <span style={{ fontSize: 24 }}>⚔️</span>
            <div style={{ textAlign: 'left' }}>
              <div>Gauntlet</div>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>Bracket elimination style</div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, marginLeft: 'auto' }} />
          </button>

          <button onClick={() => onLaunchScramble?.(event, members)}
            style={{ ...btnStyle, padding: '14px 16px', borderRadius: 16, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: `0 6px 20px ${accent}40` }}>
            <span style={{ fontSize: 24 }}>🔀</span>
            <div style={{ textAlign: 'left' }}>
              <div>Scramble</div>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>Fresh random teams every round</div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, marginLeft: 'auto' }} />
          </button>
        </div>
      )}
    </div>
  );
};

const DragToCloseSheet = ({ onClose, darkMode, panelStyle, children }) => {
  const startYRef = useRef(null);
  const currentYRef = useRef(0);
  const sheetRef = useRef(null);

  const onPointerDown = (e) => {
    startYRef.current = e.clientY;
    currentYRef.current = 0;
  };
  const onPointerMove = (e) => {
    if (startYRef.current === null) return;
    const dy = e.clientY - startYRef.current;
    if (dy < 0) return;
    currentYRef.current = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onPointerUp = () => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    if (currentYRef.current > 80) {
      onClose?.();
    } else {
      if (sheetRef.current) sheetRef.current.style.transform = '';
    }
    currentYRef.current = 0;
  };

  return (
    <div
      ref={sheetRef}
      id="popup-event-panel-root"
      style={{ ...panelStyle, overflowY: 'auto', overscrollBehavior: 'contain', transition: 'transform 0.2s' }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px 0 8px', cursor: 'grab', touchAction: 'none', flexShrink: 0,
        }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
        }} />
      </div>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PopupEventPanel({
  activeLayerPageTheme, darkMode,
  supabase, user, calendarId, displayName,
  initialEventId,
  eventMetaFallback,
  currentUserProfilePhotoUrl = '',
  onClose, onEventCreated, onJoined,
  formatTime, formatDateKeyMMDDYYYY, resolveHandleLikeLabel,
  onLaunchRoundRobin, onLaunchGauntlet, onLaunchScramble,
}) {
  const accent = activeLayerPageTheme?.accent || '#16a34a';
  const isLight = (hex) => { const h = (hex || '#000').replace('#', ''); return (0.2126 * parseInt(h.slice(0,2),16) + 0.7152 * parseInt(h.slice(2,4),16) + 0.0722 * parseInt(h.slice(4,6),16)) / 255 > 0.72; };
  const btnFg = isLight(accent) ? '#111827' : '#fff';
  const primaryText = darkMode ? '#f8fafc' : 'var(--color-text-primary)';
  const secondaryText = darkMode ? '#cbd5e1' : 'var(--color-text-secondary)';
  const btnStyle = { backgroundColor: accent, color: btnFg, border: 'none', cursor: 'pointer' };
  const softBg = darkMode ? `${accent}18` : `${accent}0d`;
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#fff';
  const border = `${accent}30`;
  const themeBackgroundFrom = activeLayerPageTheme?.backgroundFrom || accent;
  const themeBackgroundVia = activeLayerPageTheme?.backgroundVia || accent;
  const themeBackgroundTo = activeLayerPageTheme?.backgroundTo || accent;
  const activeTabText = darkMode ? '#f8fafc' : (btnFg === '#111827' ? '#111827' : accent);
  const activeTabBackground = darkMode
    ? `linear-gradient(135deg, ${hexToRgba(themeBackgroundFrom, 0.32)} 0%, ${hexToRgba(themeBackgroundVia, 0.22)} 52%, ${hexToRgba(themeBackgroundTo, 0.28)} 100%)`
    : `linear-gradient(135deg, ${hexToRgba(themeBackgroundFrom, 0.16)} 0%, ${hexToRgba(themeBackgroundVia, 0.12)} 52%, ${hexToRgba(themeBackgroundTo, 0.18)} 100%)`;
  const activeTabBorder = darkMode ? hexToRgba(accent, 0.72) : hexToRgba(accent, 0.34);
  const effectiveDisplayName = String(displayName || '').trim()
    || (typeof resolveHandleLikeLabel === 'function'
      ? resolveHandleLikeLabel(user?.email || user?.phone || 'Player', user?.id)
      : (user?.email || user?.phone || 'Player'));
  const selfAliasSet = new Set(
    [
      effectiveDisplayName,
      user?.email,
      user?.phone,
      typeof resolveHandleLikeLabel === 'function' ? resolveHandleLikeLabel(user?.email || user?.phone || effectiveDisplayName, user?.id) : '',
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const normalizeOwnPopupLabel = (rawName, rawUserId) => {
    const uid = String(rawUserId || '').trim();
    const nextName = String(rawName || '').trim();
    if (uid && uid === String(user?.id || '').trim() && selfAliasSet.has(nextName.toLowerCase())) {
      return effectiveDisplayName;
    }
    return nextName || 'Player';
  };
  const resolvePopupMemberPhotoUrl = (memberLike = {}) => {
    const memberUserId = String(memberLike?.user_id || memberLike?.userId || '').trim();
    const isCurrentUser = memberUserId && memberUserId === String(user?.id || '').trim();
    const storageUrl = memberUserId && supabase?.supabaseUrl
      ? `${supabase.supabaseUrl}/storage/v1/object/public/avatars/${memberUserId}/avatar`
      : '';
    return String(
      memberLike?.photoUrl
      || memberLike?.photo_url
      || memberLike?.avatarUrl
      || memberLike?.avatar_url
      || (isCurrentUser ? currentUserProfilePhotoUrl : '')
      || storageUrl
      || ''
    ).trim();
  };
  const getPopupRoleOverridesStorageKey = (targetEventId = event?.id) => {
    const normalizedEventId = String(targetEventId || '').trim();
    if (!normalizedEventId) return '';
    return `popup-role-overrides:${normalizedEventId}`;
  };

  const [screen, setScreen] = useState(initialEventId ? 'detail' : 'create');
  const [event, setEvent] = useState(eventMetaFallback || null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(Boolean(initialEventId) && !eventMetaFallback);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  const [manualPlayerName, setManualPlayerName] = useState('');
  const [manualAddBusy, setManualAddBusy] = useState(false);
  const [manualAddError, setManualAddError] = useState('');
  const [rosterActionError, setRosterActionError] = useState('');
  const [memberRoleOverrides, setMemberRoleOverrides] = useState({});
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [capacityDraft, setCapacityDraft] = useState('10');
  const [capacityBusy, setCapacityBusy] = useState(false);
  const [capacityError, setCapacityError] = useState('');
  const eventMetaFallbackRef = useRef(eventMetaFallback);
  const eventRef = useRef(event);
  const memberRoleOverridesRef = useRef(memberRoleOverrides);
  const includeMembersRealtimeRef = useRef(false);
  const inFlightLoadRef = useRef(new Map());
  const hasLoadedFullMembersRef = useRef(false);
  const realtimeRefreshTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyLeft = document.body.style.left;
    const previousBodyRight = document.body.style.right;
    const previousBodyWidth = document.body.style.width;
    const previousBodyBackground = document.body.style.background;
    const previousBodyBackgroundColor = document.body.style.backgroundColor;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const previousHtmlBackground = document.documentElement.style.background;
    const previousHtmlBackgroundColor = document.documentElement.style.backgroundColor;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.background = 'rgb(2, 6, 23)';
    document.body.style.backgroundColor = 'rgb(2, 6, 23)';
    document.documentElement.style.background = 'rgb(2, 6, 23)';
    document.documentElement.style.backgroundColor = 'rgb(2, 6, 23)';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.left = previousBodyLeft;
      document.body.style.right = previousBodyRight;
      document.body.style.width = previousBodyWidth;
      document.body.style.background = previousBodyBackground;
      document.body.style.backgroundColor = previousBodyBackgroundColor;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      document.documentElement.style.background = previousHtmlBackground;
      document.documentElement.style.backgroundColor = previousHtmlBackgroundColor;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    eventMetaFallbackRef.current = eventMetaFallback;
  }, [eventMetaFallback]);

  useEffect(() => {
    eventRef.current = event;
  }, [event]);

  useEffect(() => {
    memberRoleOverridesRef.current = memberRoleOverrides;
  }, [memberRoleOverrides]);

  useEffect(() => {
    includeMembersRealtimeRef.current = screen !== 'detail' || hasLoadedFullMembersRef.current;
  }, [screen, event?.id]);

  const memberByUserId = useMemo(() => new Map(
    (Array.isArray(members) ? members : []).map((member) => [String(member?.user_id || '').trim(), member])
  ), [members]);
  const sortedMembers = useMemo(() => [...members].sort((a, b) => {
    const rank = (role) => (role === 'host' ? 0 : role === 'cohost' ? 1 : 2);
    const rankDelta = rank(a?.role) - rank(b?.role);
    if (rankDelta !== 0) return rankDelta;
    return String(a?.display_name || '').localeCompare(String(b?.display_name || ''));
  }), [members]);
  const hostMember = useMemo(() => members.find((m) => m.role === 'host') || null, [members]);
  const cohostMembers = useMemo(() => sortedMembers.filter((m) => m.role === 'cohost'), [sortedMembers]);
  const myMember = memberByUserId.get(String(user?.id || '').trim());
  const creatorUserId = String(event?.created_by || event?.created_by_user_id || '').trim();
  const isEventCreator = Boolean(creatorUserId) && creatorUserId === String(user?.id || '').trim();
  const isHost = myMember?.role === 'host' || isEventCreator;
  const isCohost = myMember?.role === 'cohost';
  const isHostOrCohost = isHost || isCohost;
  const isMember = Boolean(myMember);
  const currentNoMax = Number(event?.max_players || 0) >= POPUP_NO_MAX_SENTINEL;
  const isFull = event && !currentNoMax && members.length >= (event.max_players || 99);

  useEffect(() => {
    setCapacityDraft(currentNoMax ? String(POPUP_NO_MAX_SENTINEL) : String(Math.max(1, Number(event?.max_players || 10))));
  }, [currentNoMax, event?.max_players]);

  useEffect(() => {
    const storageKey = getPopupRoleOverridesStorageKey(event?.id || initialEventId);
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      setMemberRoleOverrides(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
    } catch {
      setMemberRoleOverrides({});
    }
  }, [event?.id, initialEventId]);

  useEffect(() => {
    const storageKey = getPopupRoleOverridesStorageKey(event?.id || initialEventId);
    if (!storageKey || typeof window === 'undefined') return;
    try {
      if (!memberRoleOverrides || Object.keys(memberRoleOverrides).length === 0) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(memberRoleOverrides));
    } catch {}
  }, [memberRoleOverrides, event?.id, initialEventId]);

  useEffect(() => {
    if (!event?.id) return;
    setMemberRoleOverrides((prev) => {
      const next = { ...(prev || {}) };
      const validUserIds = new Set((members || []).map((member) => String(member?.user_id || '').trim()).filter(Boolean));
      Object.keys(next).forEach((key) => {
        if (!validUserIds.has(String(key || '').trim())) delete next[key];
      });
      return next;
    });
  }, [event?.id]);

  const loadEvent = useCallback(async (id, options = {}) => {
    if (!id || !supabase) return;
    const normalizedId = String(id || '').trim();
    if (!normalizedId) return null;
    const silent = options?.silent === true;
    const includeMembers = options?.includeMembers === true;
    if (inFlightLoadRef.current.has(normalizedId)) {
      return inFlightLoadRef.current.get(normalizedId);
    }
    if (!silent || !eventRef.current) setLoading(true);
    if (!isUuid(id)) {
      if (eventMetaFallbackRef.current) setEvent(eventMetaFallbackRef.current);
      setMembers([]);
      setLoading(false);
      return eventMetaFallbackRef.current || null;
    }
    const request = (async () => {
      try {
        const currentUserId = String(user?.id || '').trim();
        const [{ data: ev }, { data: mems }, { data: myMemberRow }, { data: signups }] = await Promise.all([
          supabase.from('popup_event_details').select('*').eq('id', id).maybeSingle(),
          includeMembers
            ? supabase.from('popup_event_members').select('*').eq('event_id', id).order('joined_at').limit(500)
            : Promise.resolve({ data: [] }),
          !includeMembers && currentUserId
            ? supabase.from('popup_event_members').select('*').eq('event_id', id).eq('user_id', currentUserId).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from('popup_event_signups').select('*').eq('event_id', id).order('created_at').limit(500),
        ]);
        let normalizedEv = null;
        if (ev) {
          const fallback = eventMetaFallbackRef.current || {};
          const eventData = ev?.event_data && typeof ev.event_data === 'object' && !Array.isArray(ev.event_data)
            ? ev.event_data
            : {};
          normalizedEv = {
            ...fallback,
            ...ev,
            ...eventData,
            title: String(ev?.title || fallback?.title || '').trim() || 'Untitled Event',
            date: String(ev?.date || fallback?.date || '').trim() || '',
            time: ev?.time || fallback?.time || null,
            location: String(ev?.location || fallback?.location || '').trim() || null,
            description: String(ev?.description || fallback?.description || '').trim() || '',
            category: String(ev?.category || eventData?.category || eventData?.popupSubtype || fallback?.category || '').trim() || null,
            event_data: eventData,
          };
          setEvent(normalizedEv);
        } else if (eventMetaFallbackRef.current) {
          normalizedEv = eventMetaFallbackRef.current;
          setEvent(eventMetaFallbackRef.current);
        }
        const dedupedMembers = [];
        const seenSelfAliasByRole = new Set();
        const seenMemberIndexByUserId = new Map();
        const duplicateMemberIdsToDelete = [];
        const duplicateSignupIdsToDelete = [];
        const rolePriority = { host: 4, cohost: 3, player: 2, guest: 1 };
        const membersSource = includeMembers
          ? (mems || [])
          : (myMemberRow ? [myMemberRow] : []);
        (membersSource || []).forEach((member) => {
          const memberUserId = String(member?.user_id || '').trim();
          const memberRole = String(member?.role || 'player').trim() || 'player';
          const memberName = String(member?.display_name || '').trim();
          const memberKey = memberUserId === String(user?.id || '').trim() && selfAliasSet.has(memberName.toLowerCase())
            ? `self:${memberRole}`
            : null;
          if (memberKey) {
            if (seenSelfAliasByRole.has(memberKey)) return;
            seenSelfAliasByRole.add(memberKey);
          }
          const normalizedMember = {
            ...member,
            display_name: normalizeOwnPopupLabel(memberName, memberUserId),
            photoUrl: resolvePopupMemberPhotoUrl(member),
            photo_url: resolvePopupMemberPhotoUrl(member),
            avatarUrl: resolvePopupMemberPhotoUrl(member),
            avatar_url: resolvePopupMemberPhotoUrl(member),
          };
          if (memberUserId) {
            const existingIndex = seenMemberIndexByUserId.get(memberUserId);
            if (typeof existingIndex === 'number') {
              const existingRole = String(dedupedMembers[existingIndex]?.role || 'player').trim().toLowerCase();
              const nextRole = memberRole.toLowerCase();
              if ((rolePriority[nextRole] || 0) > (rolePriority[existingRole] || 0)) {
                const existingId = String(dedupedMembers[existingIndex]?.id || '').trim();
                if (isUuid(existingId)) duplicateMemberIdsToDelete.push(existingId);
                dedupedMembers[existingIndex] = normalizedMember;
              } else {
                const duplicateId = String(member?.id || '').trim();
                if (isUuid(duplicateId)) duplicateMemberIdsToDelete.push(duplicateId);
              }
              return;
            }
            seenMemberIndexByUserId.set(memberUserId, dedupedMembers.length);
          }
          dedupedMembers.push(normalizedMember);
        });
        if (includeMembers && duplicateMemberIdsToDelete.length > 0) {
          const uniqueDuplicateIds = Array.from(new Set(duplicateMemberIdsToDelete));
          window.setTimeout(() => {
            void Promise.all(uniqueDuplicateIds.map((memberId) => (
              supabase.from('popup_event_members').delete().eq('id', memberId)
            )));
          }, 0);
        }
        const memberList = [...dedupedMembers];
        const memberUserIds = new Set(memberList.map((m) => String(m.user_id || '')));
        (signups || []).forEach((s) => {
          const uid = String(s.user_id || '');
          if (!uid || memberUserIds.has(uid)) return;
          memberUserIds.add(uid);
          memberList.push({
            id: `signup-${s.user_id}`,
            event_id: id,
            user_id: s.user_id,
            display_name: normalizeOwnPopupLabel(s.display_name, s.user_id),
            photoUrl: resolvePopupMemberPhotoUrl(s),
            photo_url: resolvePopupMemberPhotoUrl(s),
            avatarUrl: resolvePopupMemberPhotoUrl(s),
            avatar_url: resolvePopupMemberPhotoUrl(s),
            role: 'player',
            joined_at: s.created_at,
            is_signup: true,
            signup_row_id: s.id,
          });
        });
        const storedManualPlayers = Array.isArray(ev?.event_data?.manualPlayers) ? ev.event_data.manualPlayers : [];
        const staleManualPlayerIdsToDrop = [];
        storedManualPlayers.forEach((player) => {
          const manualName = String(player?.display_name || '').trim();
          if (!manualName) return;
          const normalizedManualName = manualName.toLowerCase();
          const duplicate = memberList.some((entry) => String(entry?.display_name || '').trim().toLowerCase() === normalizedManualName);
          const aliasesCurrentUser = selfAliasSet.has(normalizedManualName);
          if (duplicate || aliasesCurrentUser) {
            const staleId = String(player?.id || '').trim();
            if (staleId) staleManualPlayerIdsToDrop.push(staleId);
            return;
          }
          memberList.push({
            id: String(player?.id || `manual-${manualName.toLowerCase()}`),
            event_id: id,
            user_id: '',
            display_name: manualName,
            role: 'player',
            joined_at: player?.joined_at || new Date().toISOString(),
            is_manual: true,
          });
        });
        if (staleManualPlayerIdsToDrop.length > 0 && ev?.id) {
          const staleIdSet = new Set(staleManualPlayerIdsToDrop);
          const cleanedManualPlayers = storedManualPlayers.filter((player) => !staleIdSet.has(String(player?.id || '').trim()));
          window.setTimeout(() => {
            void supabase
              .from('popup_event_details')
              .update({
                event_data: {
                  ...((ev?.event_data && typeof ev.event_data === 'object' && !Array.isArray(ev.event_data)) ? ev.event_data : {}),
                  manualPlayers: cleanedManualPlayers,
                },
              })
              .eq('id', ev.id);
          }, 0);
        }
        const nextMembersWithOverrides = memberList.map((entry) => {
          const overrideKey = String(entry?.user_id || '').trim();
          const overrideRole = String(memberRoleOverridesRef.current?.[overrideKey] || '').trim();
          return overrideRole ? { ...entry, role: overrideRole } : entry;
        });
        const normalizedCurrentUserId = String(user?.id || '').trim();
        const resolvedMembers = [];
        let keptSelfEntry = null;
        nextMembersWithOverrides.forEach((entry) => {
          const entryUserId = String(entry?.user_id || '').trim();
          const entryName = String(entry?.display_name || '').trim().toLowerCase();
          const matchesCurrentUser = (
            (normalizedCurrentUserId && entryUserId === normalizedCurrentUserId)
            || (entryName && selfAliasSet.has(entryName))
          );
          if (!matchesCurrentUser) {
            resolvedMembers.push(entry);
            return;
          }
          if (!keptSelfEntry) {
            keptSelfEntry = entry;
            return;
          }
          const keptRole = String(keptSelfEntry?.role || 'player').trim().toLowerCase();
          const nextRole = String(entry?.role || 'player').trim().toLowerCase();
          const keptScore = rolePriority[keptRole] || 0;
          const nextScore = rolePriority[nextRole] || 0;
          const keptIsStructured = !keptSelfEntry?.is_manual && !keptSelfEntry?.is_signup;
          const nextIsStructured = !entry?.is_manual && !entry?.is_signup;
          const shouldReplaceKept = nextScore > keptScore || (nextScore === keptScore && nextIsStructured && !keptIsStructured);
          const redundantEntry = shouldReplaceKept ? keptSelfEntry : entry;
          if (redundantEntry?.is_manual) {
            const staleId = String(redundantEntry?.id || '').trim();
            if (staleId) staleManualPlayerIdsToDrop.push(staleId);
          } else if (redundantEntry?.is_signup) {
            const staleSignupId = String(redundantEntry?.signup_row_id || '').trim();
            if (staleSignupId) duplicateSignupIdsToDelete.push(staleSignupId);
          } else {
            const staleMemberId = String(redundantEntry?.id || '').trim();
            if (isUuid(staleMemberId)) duplicateMemberIdsToDelete.push(staleMemberId);
          }
          if (shouldReplaceKept) keptSelfEntry = entry;
        });
        if (keptSelfEntry) resolvedMembers.push(keptSelfEntry);
        if (includeMembers) {
          hasLoadedFullMembersRef.current = true;
          includeMembersRealtimeRef.current = true;
        }
        setMembers(resolvedMembers);
        if (duplicateSignupIdsToDelete.length > 0) {
          const uniqueSignupIds = Array.from(new Set(duplicateSignupIdsToDelete));
          window.setTimeout(() => {
            void Promise.all(uniqueSignupIds.map((signupId) => (
              supabase.from('popup_event_signups').delete().eq('id', signupId)
            )));
          }, 0);
        }
        return normalizedEv;
      } catch {}
      return null;
    })();
    inFlightLoadRef.current.set(normalizedId, request);
    try {
      return await request;
    } finally {
      inFlightLoadRef.current.delete(normalizedId);
      if (!silent || !eventRef.current || String(eventRef.current?.id || '').trim() === normalizedId) {
        setLoading(false);
      }
    }
  }, [supabase, user?.id]);

  useEffect(() => { if (initialEventId) loadEvent(initialEventId); }, [initialEventId, loadEvent]);

  useEffect(() => {
    if (!event?.id || !isUuid(event.id)) return;
    if (screen === 'detail' || hasLoadedFullMembersRef.current) return;
    void loadEvent(event.id, { silent: true, includeMembers: true });
  }, [screen, event?.id, loadEvent]);

  useEffect(() => {
    if (!event?.id || !supabase || !isUuid(event.id)) return;
    const scheduleRealtimeRefresh = () => {
      if (realtimeRefreshTimeoutRef.current) window.clearTimeout(realtimeRefreshTimeoutRef.current);
      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        realtimeRefreshTimeoutRef.current = null;
        void loadEvent(event.id, { silent: true, includeMembers: includeMembersRealtimeRef.current });
      }, 150);
    };
    const channel = supabase.channel(`popup-members-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_members', filter: `event_id=eq.${event.id}` }, scheduleRealtimeRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_signups', filter: `event_id=eq.${event.id}` }, scheduleRealtimeRefresh)
      .subscribe();
    return () => {
      if (realtimeRefreshTimeoutRef.current) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [event?.id, supabase, loadEvent]);

  const handleJoin = async () => {
    if (!event || isMember || isFull || isEventCreator) return;
    if (!user?.id) {
      setJoinError('Sign in to RSVP to this event.');
      return;
    }
    if (!isUuid(event.id)) {
      setJoinError('This event cannot accept RSVPs yet.');
      return;
    }
    setJoinError('');
    setJoining(true);
    try {
      const targetLayerId = String(event?.layer_id || event?.calendar_id || calendarId || '').trim();
      if (!targetLayerId) {
        throw new Error('This event is missing its calendar link, so RSVP cannot be saved yet.');
      }
      const { data: existingSignup, error: existingError } = await supabase
        .from('popup_event_signups')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existingError) throw existingError;
      const { data: existingMember, error: existingMemberError } = await supabase
        .from('popup_event_members')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existingMemberError) throw existingMemberError;
      if (!existingSignup?.id && !existingMember?.id) {
        const { error } = await supabase
          .from('popup_event_signups')
          .insert({
            layer_id: targetLayerId,
            event_id: event.id,
            user_id: user.id,
            display_name: effectiveDisplayName || 'Player',
            created_at: new Date().toISOString(),
          });
        const errorCode = String(error?.code || '').trim();
        const errorStatus = Number(error?.status || 0);
        if (error && errorCode !== '23505' && errorStatus !== 409) throw error;
      }
      setMembers((prev) => {
        const alreadyPresent = (prev || []).some((entry) => String(entry?.user_id || '').trim() === String(user?.id || '').trim());
        if (alreadyPresent) return prev;
        return [
          ...(Array.isArray(prev) ? prev : []),
          {
            id: `self-${String(user?.id || '').trim()}`,
            event_id: event.id,
            user_id: user.id,
            display_name: effectiveDisplayName || 'Player',
            role: isEventCreator ? 'host' : 'player',
            joined_at: new Date().toISOString(),
            photoUrl: currentUserProfilePhotoUrl || '',
            photo_url: currentUserProfilePhotoUrl || '',
            avatarUrl: currentUserProfilePhotoUrl || '',
            avatar_url: currentUserProfilePhotoUrl || '',
          },
        ];
      });
      if (!isEventCreator && typeof onJoined === 'function') onJoined(event);
      void loadEvent(event.id, { silent: true });
    } catch (error) {
      setJoinError(error?.message || 'Could not RSVP right now.');
    } finally {
      setJoining(false);
    }
  };
  const ensurePopupMemberRecord = async (member, fallbackRole = 'player') => {
    if (!isUuid(event?.id)) return null;
    const memberUserId = String(member?.user_id || '').trim();
    if (!memberUserId) return null;
    const displayName = String(member?.display_name || 'Player').trim() || 'Player';
    const { data: existingRows, error: existingError } = await supabase
      .from('popup_event_members')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', memberUserId);
    if (existingError) {
      console.error('Could not look up popup member record:', existingError);
      return null;
    }
    const existingRow = Array.isArray(existingRows) ? existingRows[0] : existingRows;
    if (existingRow?.id) {
      return {
        event_id: event.id,
        user_id: memberUserId,
        display_name: displayName,
      };
    }

    const insertPayload = {
      event_id: event.id,
      user_id: memberUserId,
      display_name: displayName,
      role: fallbackRole,
    };
    const { data: insertedRow, error: insertError } = await supabase
      .from('popup_event_members')
      .insert(insertPayload)
      .select('id')
      .maybeSingle();
    if (insertError) {
      console.error('Could not create popup member record:', insertError);
      return null;
    }
    return {
      event_id: event.id,
      user_id: memberUserId,
      display_name: displayName,
    };
  };
  const handleLeave = async () => {
    if (!myMember || isHost || !isUuid(event?.id)) return;
    setJoinError('');
    try {
      const { error } = await supabase.from('popup_event_members').delete().eq('id', myMember.id);
      if (error) throw error;
      await loadEvent(event.id);
    } catch (error) {
      setJoinError(error?.message || 'Could not update your RSVP.');
    }
  };

  const handleHostLeave = async (newHostId) => {
    if (!isHost || !isUuid(event?.id)) return;
    setJoinError('');
    try {
      if (newHostId) {
        const { error } = await supabase
          .from('popup_event_members')
          .update({ role: 'host' })
          .eq('event_id', event.id)
          .eq('user_id', newHostId);
        if (error) throw error;
      }
      const hostRowId = myMember?.id;
      if (hostRowId && isUuid(hostRowId)) {
        const { error: leaveError } = await supabase
          .from('popup_event_members')
          .delete()
          .eq('id', hostRowId);
        if (leaveError) throw leaveError;
      } else if (user?.id) {
        await supabase
          .from('popup_event_members')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);
      }
      await loadEvent(event.id);
      onClose?.();
    } catch (error) {
      setJoinError(error?.message || 'Could not leave the event.');
    }
  };
  const handleKick = async (member) => {
    if (!isHostOrCohost || !isUuid(event?.id)) return;
    if (member?.is_manual) {
      const existingData = (event.event_data && typeof event.event_data === 'object' && !Array.isArray(event.event_data)) ? event.event_data : {};
      const currentManualPlayers = Array.isArray(existingData.manualPlayers) ? existingData.manualPlayers : [];
      const nextManualPlayers = currentManualPlayers.filter((p) => String(p?.id || '') !== String(member?.id || ''));
      await supabase
        .from('popup_event_details')
        .update({ event_data: { ...existingData, manualPlayers: nextManualPlayers } })
        .eq('id', event.id);
      await loadEvent(event.id);
      return;
    }
    await supabase.from('popup_event_members').delete().eq('id', member.id);
    await loadEvent(event.id);
  };
  const handlePromote = async (member) => {
    if (!isHostOrCohost || !isUuid(event?.id)) return;
    setRosterActionError('');
    const memberUserId = String(member?.user_id || '').trim();
    if (!memberUserId) {
      setRosterActionError('Only signed-in players can be promoted to co-host.');
      return;
    }
    const ensured = await ensurePopupMemberRecord(member, 'cohost');
    if (!ensured) {
      setRosterActionError('Could not promote this player to co-host.');
      return;
    }
    const { error } = await supabase
      .from('popup_event_members')
      .update({ role: 'cohost', display_name: ensured.display_name })
      .eq('event_id', event.id)
      .eq('user_id', memberUserId);
    if (error) {
      console.error('Could not promote popup member:', error);
      setRosterActionError(error.message || 'Could not promote this player to co-host.');
      return;
    }
    setMembers((prev) => prev.map((item) => (
      String(item?.user_id || '') === memberUserId
        ? { ...item, role: 'cohost' }
        : item
    )));
    setMemberRoleOverrides((prev) => ({
      ...(prev || {}),
      [memberUserId]: 'cohost',
    }));
    await loadEvent(event.id);
  };
  const handleDemote = async (member) => {
    if (!isHostOrCohost || !isUuid(event?.id)) return;
    const memberUserId = String(member?.user_id || '').trim();
    if (!memberUserId) return;
    const ensured = await ensurePopupMemberRecord(member, 'player');
    if (!ensured) return;
    await supabase
      .from('popup_event_members')
      .update({ role: 'player' })
      .eq('event_id', event.id)
      .eq('user_id', memberUserId);
    setMemberRoleOverrides((prev) => ({
      ...(prev || {}),
      [memberUserId]: 'player',
    }));
    await loadEvent(event.id);
  };
  const handleAddManualPlayer = async () => {
    const nextName = String(manualPlayerName || '').trim();
    if (!isHost || !isUuid(event?.id)) return;
    if (!nextName) {
      setManualAddError('Enter a player name.');
      return;
    }
    if (isFull) {
      setManualAddError('This event is already full.');
      return;
    }
    if (selfAliasSet.has(nextName.toLowerCase())) {
      setManualAddError('You are already on the roster as the host.');
      return;
    }
    const alreadyExists = members.some((member) => String(member?.display_name || '').trim().toLowerCase() === nextName.toLowerCase());
    if (alreadyExists) {
      setManualAddError('That player is already on the roster.');
      return;
    }
    setManualAddBusy(true);
    setManualAddError('');
    try {
      const existingData = (event.event_data && typeof event.event_data === 'object' && !Array.isArray(event.event_data)) ? event.event_data : {};
      const currentManualPlayers = Array.isArray(existingData.manualPlayers) ? existingData.manualPlayers : [];
      const nextManualPlayers = [...currentManualPlayers, {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        display_name: nextName,
        joined_at: new Date().toISOString(),
      }];
      const { error } = await supabase
        .from('popup_event_details')
        .update({ event_data: { ...existingData, manualPlayers: nextManualPlayers } })
        .eq('id', event.id);
      if (error) throw error;
      setManualPlayerName('');
      await loadEvent(event.id);
    } catch (err) {
      setManualAddError(err?.message || 'Could not add player.');
    }
    setManualAddBusy(false);
  };
  const upsertPopupEventDetails = async (patch = {}) => {
    if (!event || !isUuid(event?.id)) {
      throw new Error('This event cannot be updated yet.');
    }
    const existingEventData = (event?.event_data && typeof event.event_data === 'object' && !Array.isArray(event.event_data))
      ? event.event_data
      : {};
    const rawNextEventData = Object.prototype.hasOwnProperty.call(patch, 'event_data')
      ? patch.event_data
      : existingEventData;
    const nextEventData = {
      ...((rawNextEventData && typeof rawNextEventData === 'object' && !Array.isArray(rawNextEventData)) ? rawNextEventData : {}),
    };
    if (Object.prototype.hasOwnProperty.call(patch, 'category')) {
      nextEventData.category = patch.category || null;
      nextEventData.popupSubtype = patch.category || null;
    } else if (!Object.prototype.hasOwnProperty.call(nextEventData, 'category') && event?.category) {
      nextEventData.category = event.category;
      nextEventData.popupSubtype = event.category;
    }
    const detailPayload = {
      id: event.id,
      calendar_id: event.calendar_id || calendarId || null,
      created_by: event.created_by || user?.id || null,
      title: Object.prototype.hasOwnProperty.call(patch, 'title') ? patch.title : (event.title || 'Untitled Event'),
      date: Object.prototype.hasOwnProperty.call(patch, 'date') ? patch.date : (event.date || null),
      time: Object.prototype.hasOwnProperty.call(patch, 'time') ? patch.time : (event.time || null),
      location: Object.prototype.hasOwnProperty.call(patch, 'location') ? patch.location : (event.location || null),
      max_players: Object.prototype.hasOwnProperty.call(patch, 'max_players')
        ? patch.max_players
        : Math.max(1, Number(event.max_players || 10) || 10),
      is_public: Object.prototype.hasOwnProperty.call(patch, 'is_public')
        ? patch.is_public
        : (typeof event.is_public === 'boolean' ? event.is_public : true),
      description: Object.prototype.hasOwnProperty.call(patch, 'description')
        ? patch.description
        : (String(event.description || '').trim() || null),
      status: Object.prototype.hasOwnProperty.call(patch, 'status')
        ? patch.status
        : (event.status || 'open'),
      event_data: nextEventData,
    };
    const result = await supabase
      .from('popup_event_details')
      .upsert(detailPayload, { onConflict: 'id' });
    if (result.error) throw result.error;
    return detailPayload;
  };
  const handleSaveCapacity = async () => {
    if (!isHost || !isUuid(event?.id)) return;
    const parsedDraft = Number.parseInt(String(capacityDraft || '').trim(), 10) || 0;
    const nextMax = parsedDraft >= POPUP_NO_MAX_SENTINEL
      ? POPUP_NO_MAX_SENTINEL
      : Math.max(memberCount || 1, parsedDraft);
    if (!Number.isFinite(nextMax) || nextMax < Math.max(memberCount || 1, 1)) {
      setCapacityError(`Player limit must be at least ${Math.max(memberCount || 1, 1)}.`);
      return;
    }
    setCapacityBusy(true);
    setCapacityError('');
    try {
      await upsertPopupEventDetails({ max_players: nextMax });
      // Ensure popup_events has the summary row and keep it in sync
      try {
        await supabase
          .from('popup_events')
          .upsert({
            layer_id: event.calendar_id || calendarId,
            event_id: event.id,
            max_people: nextMax,
            created_by_user_id: event.created_by || user?.id,
            created_by_name: hostMember?.display_name || (displayName || 'Host'),
          }, { onConflict: 'event_id' });
      } catch {}
      setEvent((prev) => prev ? { ...prev, max_players: nextMax } : prev);
      setEditingCapacity(false);
      await loadEvent(event.id);
    } catch (err) {
      setCapacityError(err?.message || 'Could not update player limit.');
    }
    setCapacityBusy(false);
  };
  const handleEditEventBasics = async (patch = {}) => {
    if (!isHostOrCohost || !event || !isUuid(event?.id)) return false;
    const normalizedTitle = String(
      Object.prototype.hasOwnProperty.call(patch, 'title') ? patch.title : event?.title
    ).trim();
    if (!normalizedTitle) return false;

    const detailPayload = {
      title: normalizedTitle,
      location: Object.prototype.hasOwnProperty.call(patch, 'location')
        ? (String(patch.location || '').trim() || null)
        : (String(event?.location || '').trim() || null),
      description: Object.prototype.hasOwnProperty.call(patch, 'description')
        ? (String(patch.description || '').trim() || null)
        : (String(event?.description || '').trim() || null),
    };
    const nextEventData = {
      ...((event?.event_data && typeof event.event_data === 'object' && !Array.isArray(event.event_data)) ? event.event_data : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, 'coverImageUrl')
        ? { coverImageUrl: String(patch.coverImageUrl || '').trim() || null }
        : {}),
    };

    try {
      await upsertPopupEventDetails({ ...detailPayload, event_data: nextEventData });
      try {
        await supabase.from('events').update({
          title: normalizedTitle,
          location: detailPayload.location,
          description: detailPayload.description,
        }).eq('id', event.id);
      } catch {}
      setEvent((prev) => (
        prev ? { ...prev, ...detailPayload, ...(Object.prototype.hasOwnProperty.call(patch, 'coverImageUrl') ? { coverImageUrl: nextEventData.coverImageUrl, event_data: nextEventData } : {}) } : prev
      ));
      await loadEvent(event.id);
      return true;
    } catch (err) {
      window.alert(err?.message || 'Could not update this event.');
      return false;
    }
  };
  const handleUpdateEventData = async (patch) => {
    if (!isHostOrCohost || !event || !isUuid(event?.id) || !patch || typeof patch !== 'object') return false;
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(patch, key);
    const detailFieldKeys = ['title', 'date', 'time', 'location', 'description', 'max_players', 'is_public', 'status', 'category'];
    const detailPatch = {};
    detailFieldKeys.forEach((key) => {
      if (hasOwn(key)) detailPatch[key] = patch[key];
    });
    const metadataPatch = { ...patch };
    detailFieldKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(metadataPatch, key)) {
        delete metadataPatch[key];
      }
    });
    const explicitEventData = Object.prototype.hasOwnProperty.call(metadataPatch, 'event_data')
      ? metadataPatch.event_data
      : undefined;
    if (Object.prototype.hasOwnProperty.call(metadataPatch, 'event_data')) {
      delete metadataPatch.event_data;
    }
    const nextEventData = {
      ...((event?.event_data && typeof event.event_data === 'object' && !Array.isArray(event.event_data)) ? event.event_data : {}),
      ...((explicitEventData && typeof explicitEventData === 'object' && !Array.isArray(explicitEventData)) ? explicitEventData : {}),
      ...metadataPatch,
    };
    try {
      await upsertPopupEventDetails({ ...detailPatch, event_data: nextEventData });
      if (hasOwn('title') || hasOwn('date') || hasOwn('time') || hasOwn('location') || hasOwn('description')) {
        try {
          await supabase.from('events').update({
            ...(hasOwn('title') ? { title: String(patch.title || '').trim() || String(event?.title || '').trim() } : {}),
            ...(hasOwn('date') ? { date: String(patch.date || '').trim() || null } : {}),
            ...(hasOwn('time') ? { time: String(patch.time || '').trim() || null } : {}),
            ...(hasOwn('location') ? { location: String(patch.location || '').trim() || null } : {}),
            ...(hasOwn('description') ? { description: String(patch.description || '').trim() || null } : {}),
          }).eq('id', event.id);
        } catch {}
      }
      setEvent((prev) => (
        prev ? { ...prev, ...detailPatch, ...metadataPatch, event_data: nextEventData } : prev
      ));
      await loadEvent(event.id);
      return true;
    } catch (err) {
      window.alert(err?.message || 'Could not update this event.');
      return false;
    }
  };
  const handlePotluckClaim = async (itemIndex) => {
    if (!event || !isUuid(event?.id) || !user?.id || (!isMember && !isHostOrCohost)) return false;
    const existingItems = Array.isArray(event?.potluckItems) ? event.potluckItems : [];
    const nextItems = existingItems.map((entry, index) => {
      if (index !== itemIndex) return entry;
      const alreadyMine = String(entry?.claimedByUserId || '').trim() === String(user.id || '').trim();
      if (alreadyMine) {
        return {
          ...entry,
          person: '',
          claimedByUserId: '',
        };
      }
      if (String(entry?.claimedByUserId || '').trim()) {
        return entry;
      }
      return {
        ...entry,
        person: effectiveDisplayName || 'Guest',
        claimedByUserId: String(user.id || '').trim(),
      };
    });
    try {
      await handleUpdateEventData({ potluckItems: nextItems });
      return true;
    } catch {
      return false;
    }
  };
  const handleCopyLink = () => { navigator.clipboard.writeText(`${window.location.origin}?popup=${event.id}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const popupEventCardCategory = resolveEventCardCategory(event || {});
  const isSportsPopupEvent = popupEventCardCategory === 'sports';
  const weEventPanelTheme = (() => {
    switch (popupEventCardCategory) {
      case 'kids':
        return {
          borderLight: 'rgba(251,191,36,0.34)',
          borderDark: 'rgba(251,191,36,0.22)',
          backgroundLight: 'linear-gradient(180deg, rgba(255,251,235,0.99) 0%, rgba(240,249,255,0.98) 100%)',
          backgroundDark: 'linear-gradient(180deg, rgba(43,35,23,0.98) 0%, rgba(22,37,58,0.98) 100%)',
          headerFrom: '#f59e0b',
          headerTo: '#38bdf8',
          tabActiveLight: 'rgba(255,255,255,0.78)',
          tabActiveDark: 'rgba(251,191,36,0.14)',
        };
      case 'hangout':
        return {
          borderLight: 'rgba(34,211,238,0.34)',
          borderDark: 'rgba(34,211,238,0.22)',
          backgroundLight: 'linear-gradient(180deg, rgba(236,254,255,0.99) 0%, rgba(239,246,255,0.98) 100%)',
          backgroundDark: 'linear-gradient(180deg, rgba(24,37,45,0.98) 0%, rgba(19,34,50,0.98) 100%)',
          headerFrom: '#06b6d4',
          headerTo: '#38bdf8',
          tabActiveLight: 'rgba(255,255,255,0.8)',
          tabActiveDark: 'rgba(34,211,238,0.14)',
        };
      case 'celebration':
        return {
          borderLight: 'rgba(244,114,182,0.32)',
          borderDark: 'rgba(244,114,182,0.2)',
          backgroundLight: 'linear-gradient(180deg, rgba(255,241,242,0.99) 0%, rgba(255,247,237,0.98) 100%)',
          backgroundDark: 'linear-gradient(180deg, rgba(41,26,34,0.98) 0%, rgba(42,35,24,0.98) 100%)',
          headerFrom: '#f43f5e',
          headerTo: '#f59e0b',
          tabActiveLight: 'rgba(255,255,255,0.8)',
          tabActiveDark: 'rgba(244,114,182,0.14)',
        };
      case 'party':
        return {
          borderLight: 'rgba(217,70,239,0.3)',
          borderDark: 'rgba(217,70,239,0.2)',
          backgroundLight: 'linear-gradient(180deg, rgba(253,244,255,0.99) 0%, rgba(236,254,255,0.98) 100%)',
          backgroundDark: 'linear-gradient(180deg, rgba(32,22,46,0.98) 0%, rgba(22,35,58,0.98) 100%)',
          headerFrom: '#d946ef',
          headerTo: '#06b6d4',
          tabActiveLight: 'rgba(255,255,255,0.8)',
          tabActiveDark: 'rgba(217,70,239,0.14)',
        };
      default:
        return {
          borderLight: 'rgba(15,23,42,0.05)',
          borderDark: 'rgba(255,255,255,0.06)',
          backgroundLight: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.98) 100%)',
          backgroundDark: 'linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(15,23,42,0.98) 100%)',
          headerFrom: accent,
          headerTo: `${accent}cc`,
          tabActiveLight: 'rgba(255,255,255,0.72)',
          tabActiveDark: 'rgba(255,255,255,0.06)',
        };
    }
  })();
  const panelStyle = {
    borderRadius: 28,
    overflow: 'hidden',
    border: darkMode
      ? `1px solid ${weEventPanelTheme.borderDark}`
      : `1px solid ${weEventPanelTheme.borderLight}`,
    background: darkMode ? weEventPanelTheme.backgroundDark : weEventPanelTheme.backgroundLight,
    boxShadow: darkMode ? '0 24px 56px rgba(2,6,23,0.46)' : '0 24px 56px rgba(15,23,42,0.18)',
    maxHeight: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: APP_FONT_STACK,
  };
  const headerStyle = {
    position: 'relative',
    flexShrink: 0,
    borderBottom: `1px solid ${darkMode ? weEventPanelTheme.borderDark : weEventPanelTheme.borderLight}`,
    background: darkMode ? 'rgba(15,23,42,0.98)' : '#fff',
    padding: '20px 20px 16px',
  };

  if (loading) return (
    <div style={{ ...panelStyle, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <Loader style={{ width: 20, height: 20, color: accent }} />
      <span style={{ fontSize: 14, color: secondaryText }}>Loading event...</span>
    </div>
  );

  // ── CREATE ─────────────────────────────────────────────────────────────────
  if (screen === 'create') return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <CourtBg />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎾</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>New Pop-up Event</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Set up your game</div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose?.(); }} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: 6, cursor: 'pointer' }}>
            <X style={{ width: 16, height: 16, color: '#111' }} />
          </button>
        </div>
      </div>
      <div style={{ padding: '20px 20px 4px' }}>
        <CreateEventForm accent={accent} darkMode={darkMode} btnStyle={btnStyle} border={border} softBg={softBg}
          supabase={supabase} user={user} calendarId={calendarId} displayName={displayName}
          onCreated={(ev) => { setEvent(ev); setScreen('detail'); onEventCreated?.(ev); }} onCancel={onClose} />
      </div>
    </div>
  );

  if (!event || typeof event !== 'object') {
    return (
      <div style={{ ...panelStyle, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <AlertCircle style={{ width: 20, height: 20, color: accent }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: primaryText }}>This event could not be loaded.</div>
        <button onClick={() => onClose?.()} style={{ ...btnStyle, borderRadius: 14, padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>
          Close
        </button>
      </div>
    );
  }

  const memberCount = members.length;
  const eventId = String(event?.id || '').trim();
  const isLegacyInvalidEvent = !isUuid(eventId);
  const attendeeLabel = isSportsPopupEvent ? 'players' : 'guests';
  const joinLabel = isSportsPopupEvent ? 'Join Event' : 'RSVP';
  const joiningLabel = isSportsPopupEvent ? 'Joining...' : 'Saving RSVP...';
  const routedEvent = {
    ...event,
    category: popupEventCardCategory,
    invitees: sortedMembers.map((member) => ({
      id: member?.id || member?.user_id || member?.display_name,
      name: member?.display_name || 'Guest',
      display_name: member?.display_name || 'Guest',
      avatar: member?.avatar_url || member?.avatarUrl || member?.photo_url || member?.photoUrl || '👤',
      avatarUrl: member?.avatarUrl || member?.avatar_url || '',
      avatar_url: member?.avatar_url || member?.avatarUrl || '',
      photoUrl: resolvePopupMemberPhotoUrl(member),
      photo_url: resolvePopupMemberPhotoUrl(member),
      status: 'accepted',
      user_id: member?.user_id || '',
      role: member?.role || 'player',
    })),
  };

  // ── TABS ───────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'detail',   label: 'Info',             emoji: 'ℹ️' },
    { id: 'roster',   label: 'People',           emoji: '👥' },
    { id: 'chat',     label: 'Chat',              emoji: '💬' },
    { id: 'map',      label: 'Map',               emoji: '📍' },
    { id: 'game',     label: 'Play',              emoji: '🎮' },
  ];
  const visibleTabs = isSportsPopupEvent ? tabs : tabs.filter((tab) => tab.id !== 'game');
  const activeScreen = !isSportsPopupEvent && screen === 'game' ? 'detail' : screen;
  const nonSportsActiveTab = activeScreen === 'roster' ? 'people' : activeScreen;
  const renderNonSportsBodyContent = () => {
    if (nonSportsActiveTab === 'people') {
      return (
        <div style={{ paddingBottom: 4 }}>
          <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 900, color: accent, fontFamily: APP_FONT_STACK }}>
            {`${members.filter((member) => String(member?.rsvp || 'yes').trim().toLowerCase() === 'yes').length}/${memberCount} going`}
          </div>
          {sortedMembers.map((member) => (
            <RosterRow
              key={member.id || member.user_id || member.display_name}
              member={member}
              isMe={String(member?.user_id || '').trim() === String(user?.id || '').trim()}
              isHost={isHostOrCohost}
              accent={accent}
              darkMode={darkMode}
              onKick={handleKick}
              onPromote={handlePromote}
              onDemote={handleDemote}
              attendeeRoleLabel="Guest"
              attendeeStatusLabel={
                String(member?.source || '').trim().toLowerCase() === 'guest-list'
                  ? (String(member?.rsvp || 'pending').trim().toLowerCase() === 'yes'
                    ? 'Yes'
                    : String(member?.rsvp || '').trim().toLowerCase() === 'no'
                      ? 'No'
                      : 'Pending')
                  : ''
              }
              attendeeStatusTone={
                String(member?.source || '').trim().toLowerCase() === 'guest-list'
                  ? (String(member?.rsvp || 'pending').trim().toLowerCase() || 'pending')
                  : ''
              }
            />
          ))}
          {sortedMembers.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', fontFamily: APP_FONT_STACK, color: secondaryText, fontWeight: 800 }}>
              No guests yet
            </div>
          )}
        </div>
      );
    }
    if (nonSportsActiveTab === 'chat') {
      return (
        <ChatRoom
          eventId={eventId}
          supabase={supabase}
          user={user}
          displayName={effectiveDisplayName}
          accent={accent}
          darkMode={darkMode}
          border={border}
          softBg={softBg}
          members={members}
          embedded
        />
      );
    }
    if (nonSportsActiveTab === 'map') {
      return (
        <LiveMap
          event={{ ...event, id: eventId }}
          supabase={supabase}
          user={user}
          displayName={effectiveDisplayName}
          accent={accent}
          darkMode={darkMode}
          border={border}
          softBg={softBg}
          members={members}
        />
      );
    }
    return null;
  };
  const nonSportsPrimaryAction = !isSportsPopupEvent && !isLegacyInvalidEvent
    ? (
      !isMember && event.status === 'open' && !isFull
        ? { label: joinLabel, action: handleJoin }
        : isMember && !isHost
          ? { label: 'Cancel RSVP', action: handleLeave }
          : null
    )
    : null;

  if (isSportsPopupEvent && activeScreen === 'detail') return (
    <DragToCloseSheet onClose={onClose} darkMode={darkMode} panelStyle={panelStyle}>
      <SportsEventCard
        event={routedEvent}
        darkMode={darkMode}
        accent={accent}
        onPrimaryAction={handleJoin}
        primaryActionLabel={joining ? joiningLabel : joinLabel}
        onLeave={handleLeave}
        onHostLeave={handleHostLeave}
        isHost={isHost}
        isMember={isMember}
        isFull={isFull}
        joining={joining}
        joinError={joinError}
        copied={copied}
        onCopyLink={handleCopyLink}
        onGoToInfo={() => setScreen('detail')}
        onViewRoster={() => setScreen('roster')}
        onOpenChat={() => setScreen('chat')}
        onOpenMap={() => setScreen('map')}
        onStartPlay={() => setScreen('game')}
        activeTab={activeScreen === 'detail' ? 'info' : activeScreen}
        onEditCapacity={() => {
          setCapacityDraft(currentNoMax ? String(POPUP_NO_MAX_SENTINEL) : String(Math.max(memberCount || 1, Number(event?.max_players || 10))));
          setCapacityError('');
          setEditingCapacity(true);
        }}
        memberCount={memberCount}
        isLegacyInvalidEvent={isLegacyInvalidEvent}
      />
    </DragToCloseSheet>
  );

  if (!isSportsPopupEvent) return (
    <DragToCloseSheet onClose={onClose} darkMode={darkMode} panelStyle={panelStyle}>
      <EventCardRouter
        event={routedEvent}
        activeTab={nonSportsActiveTab === 'detail' ? 'info' : nonSportsActiveTab}
        bodyContent={nonSportsActiveTab === 'detail' ? null : renderNonSportsBodyContent()}
        darkMode={darkMode}
        accent={accent}
        onEditBasics={isHostOrCohost ? handleEditEventBasics : undefined}
        onUpdateEventData={isHostOrCohost ? handleUpdateEventData : undefined}
        onClaimPotluck={handlePotluckClaim}
        canClaimPotluck={Boolean(user?.id) && (isMember || isHostOrCohost)}
        currentUserId={String(user?.id || '').trim()}
        currentUserName={effectiveDisplayName || 'Guest'}
        onGoToInfo={() => setScreen('detail')}
        onViewPeople={() => setScreen('roster')}
        onOpenChat={() => setScreen('chat')}
        onOpenMap={() => setScreen('map')}
        onPrimaryAction={nonSportsPrimaryAction?.action}
        primaryActionLabel={joining && nonSportsPrimaryAction?.action === handleJoin ? joiningLabel : nonSportsPrimaryAction?.label}
        hidePrimaryAction={!nonSportsPrimaryAction}
      />
    </DragToCloseSheet>
  );

  return (
    <div style={panelStyle} id="popup-event-panel-root">
      {/* Header */}
      <div style={headerStyle}>
        {/* Thin gradient bar at top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${weEventPanelTheme.headerFrom}, ${weEventPanelTheme.headerTo})` }} />
        {isSportsPopupEvent ? <CourtBg /> : null}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ background: `linear-gradient(90deg, ${weEventPanelTheme.headerFrom}, ${weEventPanelTheme.headerTo})`, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                {popupEventCardCategory.charAt(0).toUpperCase() + popupEventCardCategory.slice(1)}
              </span>
              <span style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: secondaryText, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {event.is_public ? <Globe style={{ width: 9, height: 9 }} /> : <Lock style={{ width: 9, height: 9 }} />}
                {event.is_public ? 'Public' : 'Private'}
              </span>
              {isSportsPopupEvent ? <StatusBadge status={event.status} /> : null}
            </div>
            {/* Title */}
            <div style={{ fontSize: 24, fontWeight: 900, color: primaryText, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 8 }}>{event.title}</div>
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: secondaryText, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar style={{ width: 11, height: 11 }} />{formatDateKeyMMDDYYYY?.(event.date) || event.date}
              </span>
              {event.time && (
                <span style={{ fontSize: 12, color: secondaryText, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock style={{ width: 11, height: 11 }} />{formatTime?.(event.time) || event.time}
                </span>
              )}
              <span style={{ fontSize: 12, color: secondaryText, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Users style={{ width: 11, height: 11 }} />{formatPopupCapacityLabel(memberCount, event.max_players, attendeeLabel)}
              </span>
            </div>
            {/* Capacity bar */}
            <div style={{ height: 4, borderRadius: 999, background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${weEventPanelTheme.headerFrom}, ${weEventPanelTheme.headerTo})`, width: `${Math.min(100, (memberCount / (event.max_players || 1)) * 100)}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose?.(); }} style={{ flexShrink: 0, background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10, padding: 7, cursor: 'pointer', marginTop: 2 }}>
            <X style={{ width: 15, height: 15, color: secondaryText, display: 'block' }} />
          </button>
        </div>
      </div>

      {/* Tab bar — pill style */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px',
          overflowX: 'auto',
          borderBottom: `1px solid ${darkMode ? weEventPanelTheme.borderDark : weEventPanelTheme.borderLight}`,
          background: darkMode ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 4,
          pointerEvents: 'auto',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          scrollbarWidth: 'none',
        }}
      >
        {visibleTabs.map(({ id, label, emoji }) => (
          <button
            type="button"
            key={id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setScreen(id);
            }}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              fontFamily: APP_FONT_STACK,
              background: activeScreen === id
                ? `linear-gradient(90deg, ${weEventPanelTheme.headerFrom}, ${weEventPanelTheme.headerTo})`
                : darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              color: activeScreen === id ? '#fff' : secondaryText,
              boxShadow: activeScreen === id ? `0 4px 12px ${hexToRgba(accent, 0.28)}` : 'none',
            }}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {activeScreen === 'detail' && (
        <div
          style={{
            padding: '20px 20px 16px',
            paddingTop: 30,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            position: 'relative',
            zIndex: 1,
            paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))',
          }}
        >
          {!isSportsPopupEvent && (
            <div style={{ marginTop: 14, width: '100%', alignSelf: 'stretch' }}>
              <EventCardRouter
                event={routedEvent}
                hidePrimaryAction={!nonSportsPrimaryAction}
                onEditBasics={isHostOrCohost ? handleEditEventBasics : undefined}
                onUpdateEventData={isHostOrCohost ? handleUpdateEventData : undefined}
                onClaimPotluck={handlePotluckClaim}
                canClaimPotluck={Boolean(user?.id) && (isMember || isHostOrCohost)}
                currentUserId={String(user?.id || '').trim()}
                currentUserName={effectiveDisplayName || 'Guest'}
                onPrimaryAction={nonSportsPrimaryAction?.action}
                primaryActionLabel={joining && nonSportsPrimaryAction?.action === handleJoin ? joiningLabel : nonSportsPrimaryAction?.label}
              />
            </div>
          )}
          {isLegacyInvalidEvent && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, lineHeight: 1.5, color: '#b45309' }}>
                This is a legacy pop-up event with an invalid ID. It can be viewed, but it cannot be joined or managed. Recreate it to use the pop-up panel.
              </div>
            </div>
          )}
          {isSportsPopupEvent && event.location && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14, background: softBg, border: `1px solid ${border}` }}>
              <MapPin style={{ width: 16, height: 16, color: accent, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: 2 }}>Location</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: primaryText }}>{event.location}</div>
              </div>
            </div>
          )}
          {isSportsPopupEvent && event.description && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: softBg, border: `1px solid ${border}` }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: 4 }}>About</div>
              <div style={{ fontSize: 13, color: secondaryText, lineHeight: 1.6 }}>{event.description}</div>
            </div>
          )}
          {hostMember && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 14px', borderRadius: 14, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Crown style={{ width: 14, height: 14, color: '#f59e0b' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{hostMember.display_name}</span>
              </div>
              {cohostMembers.map((member) => (
                <div
                  key={`cohost-summary-${member.id || member.user_id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 999, background: hexToRgba(accent, 0.12), border: `1px solid ${hexToRgba(accent, 0.24)}` }}
                >
                  <Shield style={{ width: 12, height: 12, color: accent }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>{member.display_name}</span>
                </div>
              ))}
            </div>
          )}
          {isHost && !isLegacyInvalidEvent && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: softBg, border: `1px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: editingCapacity ? 10 : 0 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: 2 }}>
                    {isSportsPopupEvent ? 'Player limit' : 'Guest limit'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: primaryText }}>
                    {currentNoMax ? `${memberCount} joined (no max)` : `${memberCount} / ${event.max_players} ${attendeeLabel}`}
                  </div>
                </div>
                {!editingCapacity ? (
                  <button
                    onClick={() => { setCapacityDraft(currentNoMax ? String(POPUP_NO_MAX_SENTINEL) : String(Math.max(memberCount || 1, Number(event?.max_players || 10)))); setCapacityError(''); setEditingCapacity(true); }}
                    style={{ padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: `1px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff', color: primaryText, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={Math.max(memberCount || 1, 1)}
                      max={99}
                      value={Number(capacityDraft || 0) >= POPUP_NO_MAX_SENTINEL ? '' : capacityDraft}
                      onChange={(e) => { setCapacityDraft(e.target.value); if (capacityError) setCapacityError(''); }}
                      placeholder={Number(capacityDraft || 0) >= POPUP_NO_MAX_SENTINEL ? 'No max' : undefined}
                      disabled={Number(capacityDraft || 0) >= POPUP_NO_MAX_SENTINEL}
                      style={{ width: 72, padding: '8px 10px', borderRadius: 12, border: `1.5px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.06)' : '#fff', color: primaryText, outline: 'none', fontSize: 13, fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      onClick={() => { setCapacityDraft(String(POPUP_NO_MAX_SENTINEL)); if (capacityError) setCapacityError(''); }}
                      disabled={capacityBusy}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        border: `1px solid ${Number(capacityDraft || 0) >= POPUP_NO_MAX_SENTINEL ? accent : border}`,
                        background: Number(capacityDraft || 0) >= POPUP_NO_MAX_SENTINEL ? (darkMode ? 'rgba(255,255,255,0.12)' : `${accent}14`) : (darkMode ? 'rgba(255,255,255,0.05)' : '#fff'),
                        color: Number(capacityDraft || 0) >= POPUP_NO_MAX_SENTINEL ? accent : primaryText,
                        cursor: capacityBusy ? 'default' : 'pointer',
                        opacity: capacityBusy ? 0.7 : 1,
                      }}
                    >
                      No max
                    </button>
                    <button
                      onClick={handleSaveCapacity}
                      disabled={capacityBusy}
                      style={{ ...btnStyle, padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, opacity: capacityBusy ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {capacityBusy ? <Loader style={{ width: 14, height: 14 }} /> : null}
                      {capacityBusy ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingCapacity(false); setCapacityDraft(currentNoMax ? String(POPUP_NO_MAX_SENTINEL) : String(Math.max(1, Number(event?.max_players || 10)))); setCapacityError(''); }}
                      style={{ padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: 'none', background: 'transparent', color: secondaryText, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {editingCapacity && (
                <div style={{ fontSize: 11, color: secondaryText }}>
                  {Number(capacityDraft || 0) >= POPUP_NO_MAX_SENTINEL
                    ? `Anyone can join until you decide to cap the ${attendeeLabel} later.`
                    : `Set the max number of ${attendeeLabel}. Minimum: ${Math.max(memberCount || 1, 1)}.`}
                </div>
              )}
              {capacityError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{capacityError}</div>}
            </div>
          )}
          {!isLegacyInvalidEvent && !isMember && event.status === 'open' && !isFull && (
            <button onClick={handleJoin} disabled={joining} style={{ ...btnStyle, padding: 13, borderRadius: 14, fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 20px ${accent}40`, opacity: joining ? 0.7 : 1 }}>
              {joining ? <Loader style={{ width: 16, height: 16 }} /> : <Plus style={{ width: 16, height: 16 }} />}
              {joining ? joiningLabel : joinLabel}
            </button>
          )}
          {joinError && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
              {joinError}
            </div>
          )}
          {isFull && !isMember && <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, fontWeight: 700, color: '#d97706', textAlign: 'center' }}>🏓 Event is full</div>}
          {isMember && !isHost && !isLegacyInvalidEvent && (
            <button onClick={handleLeave} style={{ padding: 11, borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: '1.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <UserMinus style={{ width: 14, height: 14 }} /> {isSportsPopupEvent ? 'Leave Event' : 'Cancel RSVP'}
            </button>
          )}
          {isHost && !isLegacyInvalidEvent && (
            <div style={{ borderRadius: 14, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, background: softBg, borderBottom: `1px solid ${border}` }}>Host Controls</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: border }}>
                {[
                  { label: 'Copy Link', icon: copied ? Check : Copy, action: handleCopyLink, color: copied ? '#10b981' : undefined },
                  { label: `View ${isSportsPopupEvent ? 'Roster' : 'Guest List'}`, icon: Users, action: () => setScreen('roster') },
                  { label: 'Open Chat', icon: MessageCircle, action: () => setScreen('chat') },
                  ...(isSportsPopupEvent ? [{ label: 'Start Play', icon: Gamepad2, action: () => setScreen('game'), color: accent }] : []),
                ].map(({ label, icon: Icon, action, color }) => (
                  <button
                    type="button"
                    key={label}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      action?.();
                    }}
                    style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', background: darkMode ? 'rgba(255,255,255,0.04)' : '#fff', color: color || primaryText, fontSize: 12, fontWeight: 700 }}
                  >
                    <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />{label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ROSTER TAB ── */}
      {activeScreen === 'roster' && (
        <div style={{ paddingBottom: 112, flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent }}>{currentNoMax ? `${memberCount} ${attendeeLabel}` : `${memberCount} / ${event.max_players} ${attendeeLabel}`}</div>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: border, margin: '0 12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: accent, width: `${Math.min(100, (memberCount / (event.max_players || 1)) * 100)}%`, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: isFull ? '#f59e0b' : secondaryText }}>{currentNoMax ? 'Unlimited spots' : (isFull ? 'Full' : `${event.max_players - memberCount} spots left`)}</div>
          </div>
          {sortedMembers.map((m) => (
            <React.Fragment key={m.id || m.user_id}>
              <RosterRow member={m} isMe={m.id === myMember?.id}
                isHost={isHostOrCohost} accent={accent} darkMode={darkMode}
                onKick={handleKick} onPromote={handlePromote} onDemote={handleDemote}
                attendeeRoleLabel={isSportsPopupEvent ? 'Player' : 'Guest'}
                forceMenuUp />
              {isHost && !isLegacyInvalidEvent && m.role === 'host' && (
                <div style={{ padding: '0 16px 12px 88px' }}>
                  <div style={{ padding: '10px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={handleAddManualPlayer}
                        disabled={manualAddBusy || isFull || !String(manualPlayerName || '').trim()}
                        style={{ ...btnStyle, padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, opacity: manualAddBusy || isFull || !String(manualPlayerName || '').trim() ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        {manualAddBusy ? <Loader style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
                        {manualAddBusy ? 'Adding...' : `Add ${isSportsPopupEvent ? 'player' : 'guest'}`}
                      </button>
                      <input
                        value={manualPlayerName}
                        onChange={(e) => { setManualPlayerName(e.target.value); if (manualAddError) setManualAddError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManualPlayer(); } }}
                        placeholder={`${isSportsPopupEvent ? 'Player' : 'Guest'} name`}
                        style={{ flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: 999, fontSize: 13, border: `1.5px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.06)' : '#fff', color: primaryText, outline: 'none' }}
                      />
                    </div>
                    {manualAddError && <div style={{ fontSize: 12, color: '#ef4444' }}>{manualAddError}</div>}
                    {rosterActionError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{rosterActionError}</div>}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          {members.length === 0 && <div style={{ padding: '32px 20px', textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 8 }}>{isSportsPopupEvent ? '🎾' : '👥'}</div><div style={{ fontSize: 14, fontWeight: 700, color: secondaryText }}>{isSportsPopupEvent ? 'No players yet' : 'No guests yet'}</div></div>}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {activeScreen === 'chat' && (
        <ChatRoom eventId={eventId} supabase={supabase} user={user} displayName={effectiveDisplayName}
          accent={accent} darkMode={darkMode} border={border} softBg={softBg} members={members} />
      )}

      {/* ── MAP TAB ── */}
      {activeScreen === 'map' && (
        <LiveMap event={{ ...event, id: eventId }} supabase={supabase} user={user} displayName={displayName}
          accent={accent} darkMode={darkMode} border={border} softBg={softBg} members={members} />
      )}

      {/* ── GAME TAB ── */}
      {isSportsPopupEvent && activeScreen === 'game' && (
        <GameModeLauncher event={event} members={members} accent={accent} darkMode={darkMode}
          border={border} softBg={softBg} btnStyle={btnStyle} isHost={isHostOrCohost}
          onLaunchRoundRobin={onLaunchRoundRobin} onLaunchGauntlet={onLaunchGauntlet} onLaunchScramble={onLaunchScramble} />
      )}
    </div>
  );
}

export {
  RosterRow,
  ChatRoom,
  LiveMap,
  GameModeLauncher,
};
