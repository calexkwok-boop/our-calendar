import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Plus, Users, Lock, Globe, Edit3, Crown, Send,
  Shield, UserMinus, ChevronRight, MapPin, Clock,
  Calendar, CheckCircle, AlertCircle, Loader, Copy, Check,
  Navigation, Radio, Gamepad2, MessageCircle, Map,
} from 'lucide-react';

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
  cohost: { bg: '#ede9fe', text: '#5b21b6', dark_bg: 'rgba(167,139,250,0.2)', dark_text: '#a78bfa' },
  player: { bg: '#f3f4f6', text: '#374151', dark_bg: 'rgba(255,255,255,0.08)',dark_text: '#9ca3af' },
};
const ROLE_ICONS = { host: Crown, cohost: Shield, player: null };

const Avatar = ({ name, size = 32, accent, role, darkMode }) => {
  const colors = ROLE_COLORS[role || 'player'];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: role === 'host' || role === 'cohost' ? (darkMode ? colors.dark_bg : colors.bg) : `${accent}22`,
      border: `2px solid ${role === 'host' ? '#fbbf24' : role === 'cohost' ? '#a78bfa' : accent + '44'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 900,
      color: role === 'host' ? '#f59e0b' : role === 'cohost' ? '#8b5cf6' : accent,
      letterSpacing: '-0.02em',
    }}>
      {initials(name)}
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
        description: form.description.trim() || null, status: 'open',
      }).select().single();
      if (err) throw err;
      await supabase.from('popup_event_members').insert({ event_id: data.id, user_id: user.id, display_name: displayName || user.email || 'Host', role: 'host' });
      onCreated(data);
    } catch (e) { setError(e.message || 'Could not create event.'); }
    finally { setSaving(false); }
  };

  const F = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>{children}</div>
  );
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 12, fontSize: 16, border: `1.5px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.06)' : '#fff', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
      <div><F>Event Name</F><input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Saturday Pickleball" style={inp} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><F>Date</F><input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} style={inp} /></div>
        <div><F>Time</F><input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} style={inp} /></div>
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
                <Icon style={{ width: 14, height: 14, color: sel ? (darkMode ? '#111' : '#fff') : 'var(--color-text-secondary)', flexShrink: 0 }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: sel ? (darkMode ? '#111' : '#fff') : 'var(--color-text-primary)' }}>{label}</div>
                  <div style={{ fontSize: 10, color: sel ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)' }}>{sub}</div>
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

const RosterRow = ({ member, isMe, isHost, accent, darkMode, onKick, onPromote, onDemote }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const RoleIcon = ROLE_ICONS[member.role];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>
      <Avatar name={member.display_name} size={34} accent={accent} role={member.role} darkMode={darkMode} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {member.display_name}{isMe && <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500, marginLeft: 4 }}>(you)</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          {RoleIcon && <RoleIcon style={{ width: 10, height: 10, color: member.role === 'host' ? '#f59e0b' : '#8b5cf6' }} />}
          <span style={{ fontSize: 10, fontWeight: 700, color: member.role === 'host' ? '#f59e0b' : member.role === 'cohost' ? '#8b5cf6' : 'var(--color-text-secondary)' }}>
            {member.role === 'host' ? 'Host' : member.role === 'cohost' ? 'Co-host' : 'Player'}
          </span>
        </div>
      </div>
      {isHost && !isMe && member.role !== 'host' && (
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: 'var(--color-text-secondary)' }}>•••</button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 50, minWidth: 150, borderRadius: 12, background: darkMode ? '#1f2937' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              {member.role === 'player' && <button onClick={() => { onPromote(member); setMenuOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', background: 'transparent', color: '#8b5cf6', fontSize: 12, fontWeight: 700, textAlign: 'left' }}><Shield style={{ width: 13, height: 13 }} />Make co-host</button>}
              {member.role === 'cohost' && <button onClick={() => { onDemote(member); setMenuOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 700, textAlign: 'left' }}><UserMinus style={{ width: 13, height: 13 }} />Remove co-host</button>}
              <button onClick={() => { onKick(member); setMenuOpen(false); }} style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 700, textAlign: 'left' }}><UserMinus style={{ width: 13, height: 13 }} />Kick player</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatRoom
// ─────────────────────────────────────────────────────────────────────────────

const ChatRoom = ({ eventId, supabase, user, displayName, accent, darkMode, border, softBg, members }) => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const memberRole = members.find((m) => m.user_id === user?.id)?.role || 'player';

  const loadMessages = useCallback(async () => {
    if (!eventId || !supabase) return;
    const { data } = await supabase.from('popup_event_messages').select('*').eq('event_id', eventId).order('created_at').limit(200);
    if (data) setMessages(data);
  }, [eventId, supabase]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!eventId || !supabase) return;
    const channel = supabase.channel(`chat-${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'popup_event_messages', filter: `event_id=eq.${eventId}` },
        (payload) => setMessages((prev) => [...prev, payload.new]))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [eventId, supabase]);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft('');
    try {
      await supabase.from('popup_event_messages').insert({ event_id: eventId, user_id: user.id, display_name: displayName || user.email || 'Player', content });
    } catch {}
    setSending(false);
    inputRef.current?.focus();
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
  const msgRole = (msg) => members.find((m) => m.user_id === msg.user_id)?.role || 'player';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.5 }}>
            <MessageCircle style={{ width: 32, height: 32, color: accent }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>No messages yet</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Be the first to say something 👋</div>
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
                    <span style={{ fontSize: 11, fontWeight: 800, color: role === 'host' ? '#f59e0b' : role === 'cohost' ? '#8b5cf6' : accent }}>{msg.display_name}</span>
                    {role !== 'player' && <span style={{ fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 999, background: role === 'host' ? 'rgba(251,191,36,0.2)' : 'rgba(139,92,246,0.2)', color: role === 'host' ? '#f59e0b' : '#8b5cf6' }}>{role}</span>}
                  </div>
                )}
                <div style={{ padding: '8px 12px', borderRadius: me ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: 13, lineHeight: 1.5, fontWeight: 500,
                  background: me ? accent : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                  color: me ? (darkMode ? '#111' : '#fff') : 'var(--color-text-primary)',
                  wordBreak: 'break-word' }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 3, opacity: 0.6 }}>{formatMsgTime(msg.created_at)}</div>
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
          style={{ flex: 1, padding: '10px 12px', borderRadius: 16, fontSize: 14, border: `1.5px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.08)' : '#fff', color: 'var(--color-text-primary)', outline: 'none', resize: 'none', lineHeight: 1.4, maxHeight: 80, overflowY: 'auto' }} />
        <button onClick={sendMessage} disabled={!draft.trim() || sending}
          style={{ width: 40, height: 40, borderRadius: 12, border: 'none', cursor: draft.trim() ? 'pointer' : 'default', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: draft.trim() ? accent : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), transition: 'all 0.2s' }}>
          <Send style={{ width: 16, height: 16, color: draft.trim() ? (darkMode ? '#111' : '#fff') : 'var(--color-text-secondary)' }} />
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
  const [sharing, setSharing] = useState(false);
  const [locations, setLocations] = useState([]);
  const [geoError, setGeoError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  // Init Google Map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps || mapInstanceRef.current) return;
    const center = event.location_lat && event.location_lng
      ? { lat: event.location_lat, lng: event.location_lng }
      : { lat: 37.7749, lng: -122.4194 };
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center, zoom: 15,
      disableDefaultUI: true, zoomControl: true,
      styles: darkMode ? [{ elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] }] : [],
    });
    // Venue marker
    if (event.location_lat && event.location_lng) {
      new window.google.maps.Marker({ position: center, map: mapInstanceRef.current,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: accent, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        title: event.location || 'Venue' });
    }
    setMapReady(true);
  }, [mapRef.current]);

  // Load + realtime locations
  const loadLocations = useCallback(async () => {
    if (!event?.id || !supabase) return;
    const { data } = await supabase.from('popup_event_locations').select('*').eq('event_id', event.id);
    if (data) setLocations(data);
  }, [event?.id, supabase]);

  useEffect(() => { loadLocations(); }, [loadLocations]);

  useEffect(() => {
    if (!event?.id || !supabase) return;
    const channel = supabase.channel(`locations-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_locations', filter: `event_id=eq.${event.id}` },
        () => loadLocations())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [event?.id, supabase, loadLocations]);

  // Update map markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const seen = new Set();
    locations.forEach((loc) => {
      seen.add(loc.user_id);
      const pos = { lat: loc.lat, lng: loc.lng };
      const member = members.find((m) => m.user_id === loc.user_id);
      const isMe = loc.user_id === user?.id;
      if (markersRef.current[loc.user_id]) {
        markersRef.current[loc.user_id].setPosition(pos);
      } else {
        const label = initials(loc.display_name);
        markersRef.current[loc.user_id] = new window.google.maps.Marker({
          position: pos, map: mapInstanceRef.current,
          label: { text: label, color: '#fff', fontWeight: '900', fontSize: '11px' },
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 16,
            fillColor: isMe ? accent : (member?.role === 'host' ? '#f59e0b' : '#6366f1'),
            fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
          title: loc.display_name,
          zIndex: isMe ? 10 : 1,
        });
      }
    });
    // Remove stale markers
    Object.keys(markersRef.current).forEach((uid) => {
      if (!seen.has(uid)) { markersRef.current[uid].setMap(null); delete markersRef.current[uid]; }
    });
  }, [locations, mapReady]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Map */}
      <div ref={mapRef} style={{ height: 300, background: darkMode ? '#1d2c4d' : '#e5e7eb' }} />

      {/* Controls */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, background: softBg }}>
        {geoError && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{geoError}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Radio style={{ width: 13, height: 13, color: sharing ? '#10b981' : accent }} />
              {sharing ? 'Sharing your location' : 'Location sharing off'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {locations.length} player{locations.length !== 1 ? 's' : ''} visible on map
            </div>
          </div>
          <button onClick={sharing ? stopSharing : startSharing}
            style={{ padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 900, cursor: 'pointer', border: 'none',
              background: sharing ? 'rgba(239,68,68,0.1)' : accent,
              color: sharing ? '#ef4444' : (darkMode ? '#111' : '#fff'),
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

const GameModeLauncher = ({ event, members, accent, darkMode, border, softBg, btnStyle, onLaunchRoundRobin, onLaunchGauntlet, isHost }) => {
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
              color: m.role === 'host' ? '#f59e0b' : 'var(--color-text-secondary)' }}>
              {m.role === 'host' && <Crown style={{ width: 10, height: 10 }} />}
              {m.display_name}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
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
            style={{ padding: '14px 16px', borderRadius: 16, fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, border: `2px solid ${accent}`, background: 'transparent', color: accent }}>
            <span style={{ fontSize: 24 }}>⚔️</span>
            <div style={{ textAlign: 'left' }}>
              <div>Gauntlet</div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>Bracket elimination style</div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, marginLeft: 'auto' }} />
          </button>
        </div>
      )}
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
  onClose, onEventCreated,
  formatTime, formatDateKeyMMDDYYYY, resolveHandleLikeLabel,
  onLaunchRoundRobin, onLaunchGauntlet,
}) {
  const accent = activeLayerPageTheme?.accent || '#16a34a';
  const isLight = (hex) => { const h = (hex || '#000').replace('#', ''); return (0.2126 * parseInt(h.slice(0,2),16) + 0.7152 * parseInt(h.slice(2,4),16) + 0.0722 * parseInt(h.slice(4,6),16)) / 255 > 0.72; };
  const btnFg = isLight(accent) ? '#111827' : '#fff';
  const btnStyle = { backgroundColor: accent, color: btnFg, border: 'none', cursor: 'pointer' };
  const softBg = darkMode ? `${accent}18` : `${accent}0d`;
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#fff';
  const border = `${accent}30`;

  const [screen, setScreen] = useState(initialEventId ? 'detail' : 'create');
  const [event, setEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(Boolean(initialEventId));
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const myMember = members.find((m) => m.user_id === user?.id);
  const isHost = myMember?.role === 'host';
  const isCohost = myMember?.role === 'cohost';
  const isHostOrCohost = isHost || isCohost;
  const isMember = Boolean(myMember);
  const isFull = event && members.length >= (event.max_players || 99);

  const loadEvent = useCallback(async (id) => {
    if (!id || !supabase) return;
    setLoading(true);
    try {
      const [{ data: ev }, { data: mems }, { data: signups, error: signupsErr }] = await Promise.all([
        supabase.from('popup_event_details').select('*').eq('id', id).single(),
        supabase.from('popup_event_members').select('*').eq('event_id', id).order('joined_at'),
        supabase.from('popup_event_signups').select('*').eq('event_id', id).order('created_at'),
      ]);
      console.log('loadEvent', { ev, mems, signups, signupsErr });
      if (ev) setEvent(ev);
      else if (eventMetaFallback) setEvent(eventMetaFallback);
      // Merge popup_event_members + popup_event_signups, dedupe by user_id
      const memberList = [...(mems || [])];
      const memberUserIds = new Set(memberList.map(m => String(m.user_id || '')));
      (signups || []).forEach(s => {
        const uid = String(s.user_id || '');
        if (!uid || memberUserIds.has(uid)) return;
        memberUserIds.add(uid);
        memberList.push({
          id: `signup-${s.user_id}`,
          event_id: id,
          user_id: s.user_id,
          display_name: s.display_name || 'Player',
          role: 'player',
          joined_at: s.created_at,
        });
      });
      setMembers(memberList);
    } catch {}
    setLoading(false);
  }, [supabase, eventMetaFallback]);

  useEffect(() => { if (initialEventId) loadEvent(initialEventId); }, [initialEventId, loadEvent]);

  useEffect(() => {
    if (!event?.id || !supabase) return;
    const channel = supabase.channel(`popup-members-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_members', filter: `event_id=eq.${event.id}` }, () => loadEvent(event.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_signups', filter: `event_id=eq.${event.id}` }, () => loadEvent(event.id))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [event?.id, supabase, loadEvent]);

  const handleJoin = async () => {
    if (!event || isMember || isFull) return;
    setJoining(true);
    try { await supabase.from('popup_event_members').insert({ event_id: event.id, user_id: user.id, display_name: displayName || user.email || 'Player', role: 'player' }); await loadEvent(event.id); } catch {}
    setJoining(false);
  };
  const handleLeave = async () => { if (!myMember || isHost) return; await supabase.from('popup_event_members').delete().eq('id', myMember.id); await loadEvent(event.id); };
  const handleKick = async (member) => { if (!isHostOrCohost) return; await supabase.from('popup_event_members').delete().eq('id', member.id); await loadEvent(event.id); };
  const handlePromote = async (member) => { if (!isHost) return; await supabase.from('popup_event_members').update({ role: 'cohost' }).eq('id', member.id); await loadEvent(event.id); };
  const handleDemote = async (member) => { if (!isHost) return; await supabase.from('popup_event_members').update({ role: 'player' }).eq('id', member.id); await loadEvent(event.id); };
  const handleCopyLink = () => { navigator.clipboard.writeText(`${window.location.origin}?popup=${event.id}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const panelStyle = { borderRadius: 24, overflow: 'hidden', marginBottom: 24, border: `1.5px solid ${border}`, background: darkMode ? 'rgba(17,24,39,0.95)' : '#fff', boxShadow: `0 8px 40px ${accent}18` };
  const headerStyle = { background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`, padding: '18px 20px 16px', position: 'relative', overflow: 'hidden' };

  if (loading) return (
    <div style={{ ...panelStyle, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <Loader style={{ width: 20, height: 20, color: accent }} />
      <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading event...</span>
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

  if (!event) return null;

  const memberCount = members.length;
  const hostMember = members.find((m) => m.role === 'host');

  // ── TABS ───────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'detail',   label: 'Info',             emoji: 'ℹ️' },
    { id: 'roster',   label: `(${memberCount})`,  emoji: '👥' },
    { id: 'chat',     label: 'Chat',              emoji: '💬' },
    { id: 'map',      label: 'Map',               emoji: '📍' },
    { id: 'game',     label: 'Play',              emoji: '🎮' },
  ];

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <CourtBg />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <StatusBadge status={event.status} />
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {event.is_public ? <Globe style={{ width: 10, height: 10 }} /> : <Lock style={{ width: 10, height: 10 }} />}
                  {event.is_public ? 'Public' : 'Private'}
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 4 }}>{event.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar style={{ width: 11, height: 11 }} />{formatDateKeyMMDDYYYY?.(event.date) || event.date}</span>
                {event.time && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 11, height: 11 }} />{formatTime?.(event.time) || event.time}</span>}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users style={{ width: 11, height: 11 }} />{memberCount}/{event.max_players}</span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onClose?.(); }} style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: 6, cursor: 'pointer' }}>
              <X style={{ width: 16, height: 16, color: '#111' }} />
            </button>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: '#fff', width: `${Math.min(100, (memberCount / (event.max_players || 1)) * 100)}%`, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, background: softBg, overflowX: 'auto' }}>
        {tabs.map(({ id, label, emoji }) => (
          <button key={id} onClick={() => setScreen(id)}
            style={{ flex: 1, minWidth: 56, padding: '11px 6px', fontSize: 11, fontWeight: 900, cursor: 'pointer', border: 'none',
              background: 'transparent', color: screen === id ? accent : 'var(--color-text-secondary)',
              borderBottom: screen === id ? `2px solid ${accent}` : '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {screen === 'detail' && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {event.location && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14, background: softBg, border: `1px solid ${border}` }}>
              <MapPin style={{ width: 16, height: 16, color: accent, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: 2 }}>Location</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{event.location}</div>
              </div>
            </div>
          )}
          {event.description && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: softBg, border: `1px solid ${border}` }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: 4 }}>About</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{event.description}</div>
            </div>
          )}
          {hostMember && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Crown style={{ width: 14, height: 14, color: '#f59e0b' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>Hosted by {hostMember.display_name}</span>
            </div>
          )}
          {!isMember && event.status === 'open' && !isFull && (
            <button onClick={handleJoin} disabled={joining} style={{ ...btnStyle, padding: 13, borderRadius: 14, fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 20px ${accent}40`, opacity: joining ? 0.7 : 1 }}>
              {joining ? <Loader style={{ width: 16, height: 16 }} /> : <Plus style={{ width: 16, height: 16 }} />}
              {joining ? 'Joining...' : 'Join Event'}
            </button>
          )}
          {isFull && !isMember && <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, fontWeight: 700, color: '#d97706', textAlign: 'center' }}>🏓 Event is full</div>}
          {isMember && !isHost && (
            <button onClick={handleLeave} style={{ padding: 11, borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: '1.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <UserMinus style={{ width: 14, height: 14 }} /> Leave Event
            </button>
          )}
          {isHost && (
            <div style={{ borderRadius: 14, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, background: softBg, borderBottom: `1px solid ${border}` }}>Host Controls</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: border }}>
                {[
                  { label: 'Copy Link',         icon: copied ? Check : Copy,  action: handleCopyLink,                            color: copied ? '#10b981' : undefined },
                  { label: 'Go to Roster',      icon: Users,                  action: () => setScreen('roster') },
                  { label: 'Start Round Robin', icon: Gamepad2,               action: () => setScreen('game'),                   color: accent },
                  { label: 'Open Chat',         icon: MessageCircle,          action: () => setScreen('chat') },
                ].map(({ label, icon: Icon, action, color }) => (
                  <button key={label} onClick={action} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', background: darkMode ? 'rgba(255,255,255,0.04)' : '#fff', color: color || 'var(--color-text-primary)', fontSize: 12, fontWeight: 700 }}>
                    <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />{label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ROSTER TAB ── */}
      {screen === 'roster' && (
        <div>
          <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent }}>{memberCount} / {event.max_players} players</div>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: border, margin: '0 12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: accent, width: `${Math.min(100, (memberCount / (event.max_players || 1)) * 100)}%`, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: isFull ? '#f59e0b' : 'var(--color-text-secondary)' }}>{isFull ? 'Full' : `${event.max_players - memberCount} spots left`}</div>
          </div>
          {members.map((m) => (
            <RosterRow key={m.id || m.user_id} member={m} isMe={m.user_id === user?.id}
              isHost={isHostOrCohost} accent={accent} darkMode={darkMode}
              onKick={handleKick} onPromote={handlePromote} onDemote={handleDemote} />
          ))}
          {members.length === 0 && <div style={{ padding: '32px 20px', textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 8 }}>🎾</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)' }}>No players yet</div></div>}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {screen === 'chat' && (
        <ChatRoom eventId={event.id} supabase={supabase} user={user} displayName={displayName}
          accent={accent} darkMode={darkMode} border={border} softBg={softBg} members={members} />
      )}

      {/* ── MAP TAB ── */}
      {screen === 'map' && (
        <LiveMap event={event} supabase={supabase} user={user} displayName={displayName}
          accent={accent} darkMode={darkMode} border={border} softBg={softBg} members={members} />
      )}

      {/* ── GAME TAB ── */}
      {screen === 'game' && (
        <GameModeLauncher event={event} members={members} accent={accent} darkMode={darkMode}
          border={border} softBg={softBg} btnStyle={btnStyle} isHost={isHostOrCohost}
          onLaunchRoundRobin={onLaunchRoundRobin} onLaunchGauntlet={onLaunchGauntlet} />
      )}
    </div>
  );
}
