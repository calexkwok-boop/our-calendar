import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Plus, Users, Lock, Globe, Edit3, Trash2, Crown,
  Shield, UserMinus, ChevronRight, MapPin, Clock,
  Calendar, CheckCircle, AlertCircle, Loader, Copy, Check,
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

const ROLE_COLORS = {
  host: { bg: '#fef3c7', text: '#92400e', dark_bg: 'rgba(251,191,36,0.2)', dark_text: '#fbbf24' },
  cohost: { bg: '#ede9fe', text: '#5b21b6', dark_bg: 'rgba(167,139,250,0.2)', dark_text: '#a78bfa' },
  player: { bg: '#f3f4f6', text: '#374151', dark_bg: 'rgba(255,255,255,0.08)', dark_text: '#9ca3af' },
};

const ROLE_ICONS = { host: Crown, cohost: Shield, player: null };

const Avatar = ({ name, size = 32, accent, role, darkMode }) => {
  const colors = ROLE_COLORS[role || 'player'];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: role === 'host' || role === 'cohost'
        ? (darkMode ? colors.dark_bg : colors.bg)
        : `${accent}22`,
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

const StatusBadge = ({ status, accent, darkMode }) => {
  const map = {
    open: { label: 'Open', color: '#10b981' },
    full: { label: 'Full', color: '#f59e0b' },
    active: { label: 'Live', color: '#ef4444' },
    ended: { label: 'Ended', color: '#9ca3af' },
  };
  const s = map[status] || map.open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 900,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      background: `${s.color}22`, color: s.color,
      border: `1px solid ${s.color}44`,
    }}>
      {status === 'active' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, animation: 'pulse 1.5s infinite' }} />
      )}
      {s.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Google Places autocomplete hook (reuses your existing API key)
// ─────────────────────────────────────────────────────────────────────────────

const usePlacesAutocomplete = (inputRef, onSelect, apiKey) => {
  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry) return;
      onSelect({
        location: place.formatted_address || place.name || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    });
    return () => window.google.maps.event.clearInstanceListeners(ac);
  }, [inputRef.current]);
};

// ─────────────────────────────────────────────────────────────────────────────
// CreateEventForm
// ─────────────────────────────────────────────────────────────────────────────

const CreateEventForm = ({
  accent, darkMode, btnStyle, border, softBg, cardBg,
  initialDate, supabase, user, calendarId, displayName,
  onCreated, onCancel,
}) => {
  const [form, setForm] = useState({
    title: '',
    date: initialDate || '',
    time: '',
    location: '',
    location_lat: null,
    location_lng: null,
    max_players: 10,
    is_public: true,
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const locationRef = useRef(null);

  usePlacesAutocomplete(locationRef, ({ location, lat, lng }) => {
    setForm((p) => ({ ...p, location, location_lat: lat, location_lng: lng }));
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Event name is required.'); return; }
    if (!form.date) { setError('Date is required.'); return; }
    setSaving(true); setError('');
    try {
      const { data, error: err } = await supabase
        .from('popup_event_details')
        .insert({
          calendar_id: calendarId,
          created_by: user.id,
          title: form.title.trim(),
          date: form.date,
          time: form.time || null,
          location: form.location || null,
          location_lat: form.location_lat,
          location_lng: form.location_lng,
          max_players: Number(form.max_players) || 10,
          is_public: form.is_public,
          description: form.description.trim() || null,
          status: 'open',
        })
        .select()
        .single();
      if (err) throw err;
      // Auto-join as host
      await supabase.from('popup_event_members').insert({
        event_id: data.id,
        user_id: user.id,
        display_name: displayName || user.email || 'Host',
        role: 'host',
      });
      onCreated(data);
    } catch (e) {
      setError(e.message || 'Could not create event.');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 12, fontSize: 16,
    border: `1.5px solid ${border}`,
    background: darkMode ? 'rgba(255,255,255,0.06)' : '#fff',
    color: 'var(--color-text-primary)',
    outline: 'none',
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '0 0 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Title */}
        <div>
          <Label>Event Name</Label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)}
            placeholder="Saturday Pickleball" style={fieldStyle} />
        </div>

        {/* Date + Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <Label>Date</Label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <Label>Time</Label>
            <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} style={fieldStyle} />
          </div>
        </div>

        {/* Location */}
        <div>
          <Label>Location</Label>
          <div style={{ position: 'relative' }}>
            <MapPin style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: accent, opacity: 0.7 }} />
            <input ref={locationRef} value={form.location} onChange={(e) => set('location', e.target.value)}
              placeholder="Search for a venue..." style={{ ...fieldStyle, paddingLeft: 30 }} />
          </div>
        </div>

        {/* Max players */}
        <div>
          <Label>Max Players</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min={2} max={32} value={form.max_players}
              onChange={(e) => set('max_players', parseInt(e.target.value))}
              style={{ flex: 1, accentColor: accent }} />
            <div style={{ width: 40, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${accent}18`, color: accent, fontSize: 14, fontWeight: 900, border: `1.5px solid ${accent}33` }}>
              {form.max_players}
            </div>
          </div>
        </div>

        {/* Public / Private */}
        <div>
          <Label>Visibility</Label>
          <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${border}` }}>
            {[{ v: true, icon: Globe, label: 'Public', sub: 'Anyone in calendar' },
              { v: false, icon: Lock, label: 'Private', sub: 'Invite only' }].map(({ v, icon: Icon, label, sub }) => {
              const sel = form.is_public === v;
              return (
                <button key={String(v)} onClick={() => set('is_public', v)}
                  style={{ flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none',
                    background: sel ? accent : 'transparent', transition: 'all 0.2s' }}>
                  <Icon style={{ width: 14, height: 14, color: sel ? (darkMode ? '#111' : '#fff') : 'var(--color-text-secondary)', flexShrink: 0 }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: sel ? (darkMode ? '#111' : '#fff') : 'var(--color-text-primary)' }}>{label}</div>
                    <div style={{ fontSize: 10, color: sel ? (darkMode ? '#33333388' : 'rgba(255,255,255,0.7)') : 'var(--color-text-secondary)' }}>{sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <Label>Description <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(optional)</span></Label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Any details, skill level, what to bring..."
            rows={3} style={{ ...fieldStyle, resize: 'none', lineHeight: 1.6 }} />
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12 }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving}
          style={{ ...btnStyle, padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 900,
            letterSpacing: '0.04em', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saving ? <Loader style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: 16, height: 16 }} />}
          {saving ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RosterRow
// ─────────────────────────────────────────────────────────────────────────────

const RosterRow = ({ member, isMe, isHost, accent, darkMode, onKick, onPromote, onDemote }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const RoleIcon = ROLE_ICONS[member.role];
  const colors = ROLE_COLORS[member.role || 'player'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>
      <Avatar name={member.display_name} size={34} accent={accent} role={member.role} darkMode={darkMode} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.display_name}
            {isMe && <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500, marginLeft: 4 }}>(you)</span>}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          {RoleIcon && <RoleIcon style={{ width: 10, height: 10, color: member.role === 'host' ? '#f59e0b' : '#8b5cf6' }} />}
          <span style={{ fontSize: 10, fontWeight: 700, color: member.role === 'host' ? '#f59e0b' : member.role === 'cohost' ? '#8b5cf6' : 'var(--color-text-secondary)' }}>
            {member.role === 'host' ? 'Host' : member.role === 'cohost' ? 'Co-host' : 'Player'}
          </span>
        </div>
      </div>

      {/* Host actions */}
      {isHost && !isMe && member.role !== 'host' && (
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: 'var(--color-text-secondary)' }}>
            •••
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 50, minWidth: 150, borderRadius: 12,
              background: darkMode ? '#1f2937' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              {member.role === 'player' && (
                <button onClick={() => { onPromote(member); setMenuOpen(false); }}
                  style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none',
                    background: 'transparent', color: '#8b5cf6', fontSize: 12, fontWeight: 700, textAlign: 'left' }}>
                  <Shield style={{ width: 13, height: 13 }} /> Make co-host
                </button>
              )}
              {member.role === 'cohost' && (
                <button onClick={() => { onDemote(member); setMenuOpen(false); }}
                  style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none',
                    background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 700, textAlign: 'left' }}>
                  <UserMinus style={{ width: 13, height: 13 }} /> Remove co-host
                </button>
              )}
              <button onClick={() => { onKick(member); setMenuOpen(false); }}
                style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none',
                  background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 700, textAlign: 'left' }}>
                <UserMinus style={{ width: 13, height: 13 }} /> Kick player
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function PopupEventPanel({
  // Theme
  activeLayerPageTheme,
  darkMode,
  // Auth + data
  supabase,
  user,
  calendarId,
  displayName,
  // Event to open (null = show create form)
  initialEventId,
  // Callbacks
  onClose,
  onEventCreated,
  // Helpers
  formatTime,
  formatDateKeyMMDDYYYY,
  resolveHandleLikeLabel,
  // Game mode launchers
  onLaunchRoundRobin,
  onLaunchGauntlet,
}) {
  const accent = activeLayerPageTheme?.accent || '#16a34a';
  const isLight = (hex) => {
    const h = (hex || '#000').replace('#', '');
    return (0.2126 * parseInt(h.slice(0,2),16) + 0.7152 * parseInt(h.slice(2,4),16) + 0.0722 * parseInt(h.slice(4,6),16)) / 255 > 0.72;
  };
  const btnFg = isLight(accent) ? '#111827' : '#fff';
  const btnStyle = { backgroundColor: accent, color: btnFg, border: 'none', cursor: 'pointer' };
  const softBg = darkMode ? `${accent}18` : `${accent}0d`;
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#fff';
  const border = `${accent}30`;

  // Screen: 'create' | 'detail' | 'roster' | 'chat' | 'map' | 'game'
  const [screen, setScreen] = useState(initialEventId ? 'detail' : 'create');
  const [event, setEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(Boolean(initialEventId));
  const [joining, setJoining] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const myMember = members.find((m) => m.user_id === user?.id);
  const isHost = myMember?.role === 'host';
  const isCohost = myMember?.role === 'cohost';
  const isHostOrCohost = isHost || isCohost;
  const isMember = Boolean(myMember);
  const isFull = event && members.length >= (event.max_players || 99);

  // ── Load event + members ───────────────────────────────────────────────────
  const loadEvent = useCallback(async (id) => {
    if (!id || !supabase) return;
    setLoading(true);
    try {
      const [{ data: ev }, { data: mems }] = await Promise.all([
        supabase.from('popup_event_details').select('*').eq('id', id).single(),
        supabase.from('popup_event_members').select('*').eq('event_id', id).order('joined_at'),
      ]);
      if (ev) setEvent(ev);
      if (mems) setMembers(mems);
    } catch {}
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (initialEventId) loadEvent(initialEventId);
  }, [initialEventId, loadEvent]);

  // ── Real-time members ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!event?.id || !supabase) return;
    const channel = supabase
      .channel(`popup-members-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_members', filter: `event_id=eq.${event.id}` },
        () => loadEvent(event.id))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [event?.id, supabase, loadEvent]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!event || isMember || isFull) return;
    setJoining(true);
    try {
      await supabase.from('popup_event_members').insert({
        event_id: event.id, user_id: user.id,
        display_name: displayName || user.email || 'Player', role: 'player',
      });
      await loadEvent(event.id);
    } catch {}
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!myMember || isHost) return;
    await supabase.from('popup_event_members').delete().eq('id', myMember.id);
    await loadEvent(event.id);
  };

  const handleKick = async (member) => {
    if (!isHostOrCohost) return;
    await supabase.from('popup_event_members').delete().eq('id', member.id);
    await loadEvent(event.id);
  };

  const handlePromote = async (member) => {
    if (!isHost) return;
    await supabase.from('popup_event_members').update({ role: 'cohost' }).eq('id', member.id);
    await loadEvent(event.id);
  };

  const handleDemote = async (member) => {
    if (!isHost) return;
    await supabase.from('popup_event_members').update({ role: 'player' }).eq('id', member.id);
    await loadEvent(event.id);
  };

  const handleUpdateStatus = async (status) => {
    if (!isHost) return;
    await supabase.from('popup_event_details').update({ status }).eq('id', event.id);
    setEvent((p) => ({ ...p, status }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?popup=${event.id}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const panelStyle = {
    borderRadius: 24, overflow: 'hidden', marginBottom: 24,
    border: `1.5px solid ${border}`,
    background: darkMode ? 'rgba(17,24,39,0.95)' : '#fff',
    boxShadow: `0 8px 40px ${accent}18`,
  };

  const headerStyle = {
    background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
    padding: '18px 20px 16px', position: 'relative', overflow: 'hidden',
  };

  // Decorative pickleball court in header
  const CourtBg = () => (
    <svg style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', opacity: 0.12 }}
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

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...panelStyle, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <Loader style={{ width: 20, height: 20, color: accent, animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading event...</span>
    </div>
  );

  // ── CREATE SCREEN ──────────────────────────────────────────────────────────
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
          <button onClick={onClose} style={{ ...btnStyle, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 6, position: 'absolute', right: 0, top: 0 }}>
            <X style={{ width: 16, height: 16, color: '#111' }} />
          </button>
        </div>
      </div>
      <div style={{ padding: '20px 20px 4px' }}>
        <CreateEventForm
          accent={accent} darkMode={darkMode} btnStyle={btnStyle} border={border} softBg={softBg} cardBg={cardBg}
          supabase={supabase} user={user} calendarId={calendarId} displayName={displayName}
          onCreated={(ev) => { setEvent(ev); setMembers([{ user_id: user.id, display_name: displayName, role: 'host' }]); setScreen('detail'); onEventCreated?.(ev); }}
          onCancel={onClose}
        />
      </div>
    </div>
  );

  if (!event) return null;

  const memberCount = members.length;
  const hostMember = members.find((m) => m.role === 'host');

  // ── DETAIL + ROSTER + TABS SCREEN ─────────────────────────────────────────
  const tabs = [
    { id: 'detail', label: 'Info', emoji: 'ℹ️' },
    { id: 'roster', label: `Players (${memberCount})`, emoji: '👥' },
    // Chat + Map + Game added in Part 2
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
                <StatusBadge status={event.status} accent={accent} darkMode={darkMode} />
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {event.is_public ? <Globe style={{ width: 10, height: 10 }} /> : <Lock style={{ width: 10, height: 10 }} />}
                  {event.is_public ? 'Public' : 'Private'}
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 4 }}>
                {event.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar style={{ width: 11, height: 11 }} />
                  {formatDateKeyMMDDYYYY?.(event.date) || event.date}
                </span>
                {event.time && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 11, height: 11 }} />
                    {formatTime?.(event.time) || event.time}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users style={{ width: 11, height: 11 }} />
                  {memberCount}/{event.max_players}
                </span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: 6, cursor: 'pointer' }}>
              <X style={{ width: 16, height: 16, color: '#111' }} />
            </button>
          </div>

          {/* Player count bar */}
          <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden', marginTop: 4 }}>
            <div style={{ height: '100%', borderRadius: 999, background: '#fff', width: `${Math.min(100, (memberCount / (event.max_players || 1)) * 100)}%`, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, background: softBg }}>
        {tabs.map(({ id, label, emoji }) => (
          <button key={id} onClick={() => setScreen(id)}
            style={{ flex: 1, padding: '12px 8px', fontSize: 11, fontWeight: 900, cursor: 'pointer', border: 'none',
              background: 'transparent', color: screen === id ? accent : 'var(--color-text-secondary)',
              borderBottom: screen === id ? `2px solid ${accent}` : '2px solid transparent', transition: 'all 0.15s' }}>
            {emoji} {label}
          </button>
        ))}
        {/* Part 2 tabs will go here */}
        <button style={{ flex: 1, padding: '12px 8px', fontSize: 11, fontWeight: 900, cursor: 'not-allowed', border: 'none',
          background: 'transparent', color: 'var(--color-text-secondary)', opacity: 0.4 }}>
          💬 Chat
        </button>
        <button style={{ flex: 1, padding: '12px 8px', fontSize: 11, fontWeight: 900, cursor: 'not-allowed', border: 'none',
          background: 'transparent', color: 'var(--color-text-secondary)', opacity: 0.4 }}>
          📍 Map
        </button>
      </div>

      {/* ── DETAIL TAB ── */}
      {screen === 'detail' && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {event.location && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14,
              background: softBg, border: `1px solid ${border}` }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14,
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Crown style={{ width: 14, height: 14, color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>Hosted by {hostMember.display_name}</span>
            </div>
          )}

          {/* Join / Leave */}
          {!isMember && event.status === 'open' && !isFull && (
            <button onClick={handleJoin} disabled={joining}
              style={{ ...btnStyle, padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 6px 20px ${accent}40`, opacity: joining ? 0.7 : 1 }}>
              {joining ? <Loader style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: 16, height: 16 }} />}
              {joining ? 'Joining...' : 'Join Event'}
            </button>
          )}

          {isFull && !isMember && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: 13, fontWeight: 700, color: '#d97706', textAlign: 'center' }}>
              🏓 Event is full ({event.max_players} players)
            </div>
          )}

          {isMember && !isHost && (
            <button onClick={handleLeave}
              style={{ padding: '11px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: `1.5px solid rgba(239,68,68,0.3)`,
                background: 'rgba(239,68,68,0.07)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <UserMinus style={{ width: 14, height: 14 }} /> Leave Event
            </button>
          )}

          {/* Host controls */}
          {isHost && (
            <div style={{ borderRadius: 14, border: `1.5px solid ${border}`, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: accent, background: softBg, borderBottom: `1px solid ${border}` }}>Host Controls</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: border }}>
                {[
                  { label: 'Edit Event', icon: Edit3, action: () => setEditing(true) },
                  { label: 'Copy Link', icon: copied ? Check : Copy, action: handleCopyLink, color: copied ? '#10b981' : undefined },
                  { label: 'Start Round Robin', icon: ChevronRight, action: () => onLaunchRoundRobin?.(event, members), color: accent },
                  { label: 'Start Gauntlet', icon: ChevronRight, action: () => onLaunchGauntlet?.(event, members), color: accent },
                ].map(({ label, icon: Icon, action, color }) => (
                  <button key={label} onClick={action}
                    style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none',
                      background: darkMode ? 'rgba(255,255,255,0.04)' : '#fff', color: color || 'var(--color-text-primary)', fontSize: 12, fontWeight: 700 }}>
                    <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                    {label}
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
            <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent }}>
              {memberCount} / {event.max_players} players
            </div>
            {/* Capacity bar */}
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: border, margin: '0 12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: accent, width: `${Math.min(100, (memberCount / (event.max_players || 1)) * 100)}%`, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: isFull ? '#f59e0b' : 'var(--color-text-secondary)' }}>
              {isFull ? 'Full' : `${event.max_players - memberCount} spots left`}
            </div>
          </div>
          <div>
            {members.map((m) => (
              <RosterRow key={m.id} member={m} isMe={m.user_id === user?.id}
                isHost={isHostOrCohost} accent={accent} darkMode={darkMode}
                onKick={handleKick} onPromote={handlePromote} onDemote={handleDemote} />
            ))}
          </div>
          {members.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎾</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)' }}>No players yet</div>
            </div>
          )}
        </div>
      )}

      {/* Footer note for Part 2 */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${border}`, background: softBg,
        fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'center', fontWeight: 600 }}>
        💬 Chat · 📍 Live Map · 🎮 Game Mode — coming in Part 2
      </div>
    </div>
  );
}
