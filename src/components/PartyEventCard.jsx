// ─────────────────────────────────────────────────────────────────────────────
// PartyEventCard — v3
// Dark hero header with clean party sections: theme, guests, music, potluck, notes.
// Clean white body with party sections: theme, guests, music, potluck, notes.
// Same props contract as original PartyEventCard.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  MapPin, Clock, Calendar, Users, Lock, Globe,
  Edit3, Trash2, Camera, MessageCircle, Check, Copy,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

const gInitials = (name) => {
  const parts = String(name || '?').trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : String(name || '?')[0].toUpperCase();
};

const isProbablyUrl = (v) => /^(https?:\/\/|data:image\/|blob:)/i.test(String(v || '').trim());

const getCardBackdropUrl = (event) => {
  const candidates = [
    event?.coverImageUrl, event?.event_data?.coverImageUrl,
    event?.event_data?.cover_image_url, event?.backgroundImageUrl,
    event?.event_data?.backgroundImageUrl, event?.event_data?.background_image_url,
    event?.cover_image_url, event?.background_image_url,
  ];
  return candidates.map((v) => String(v || '').trim()).find(isProbablyUrl) || '';
};

const detectPlaylistService = (v) => {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  if (s.includes('spotify.com'))  return { name: 'Spotify' };
  if (s.includes('music.apple.com') || s.includes('itunes.apple.com')) return { name: 'Apple Music' };
  return null;
};

const normalizeEventNotes = (event) => {
  const raw = String(event?.description || '').trim();
  if (!raw) return '';
  const n = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  if (/^(party|kids event|celebration|hangout|custom|sports)( we event)?$/.test(n)) return '';
  if (/^[a-z ]+ we event$/.test(n)) return '';
  return raw;
};

const buildMapHref = (loc) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(loc || '').trim())}`;

const parseLineItems = (v) =>
  String(v || '').split('\n').map((l) => l.trim()).filter(Boolean)
    .map((l) => { const [item, person] = l.split('|').map((p) => p.trim()); return { item: item || '', person: person || '' }; })
    .filter((e) => e.item);

const normalizePotluckItems = (v) =>
  Array.isArray(v)
    ? v.map((e) => ({ item: String(e?.item || '').trim(), person: String(e?.person || '').trim(), claimedByUserId: String(e?.claimedByUserId || '').trim() })).filter((e) => e.item)
    : [];

const parseGuestListItems = (v) =>
  String(v || '').split('\n').map((l) => l.trim()).filter(Boolean)
    .map((l) => {
      const [name, status] = l.split('|').map((p) => p.trim());
      const ns = String(status || '').toLowerCase();
      return { name: name || '', rsvp: (ns === 'yes' || ns === 'going') ? 'yes' : (ns === 'no' || ns === 'declined') ? 'no' : 'pending' };
    }).filter((e) => e.name);

const formatDateShort = (dateStr) => {
  if (!dateStr) return null;
  try {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return null; }
};

const formatTimePretty = (t) => {
  if (!t) return null;
  try {
    const [h, m] = String(t).split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return null; }
};

// ── spotify icon ──────────────────────────────────────────────────────────────

const SpotifyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#1db954"/>
    <path d="M7.2 9.3c3.2-1 6.8-.8 9.8.6"  stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M8.1 12.1c2.5-.8 5.2-.6 7.5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 14.7c1.8-.5 3.8-.4 5.2.4"   stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const AppleMusicIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="5" fill="#fa233b" />
    <path d="M15.8 6.4v8.15a2.35 2.35 0 1 1-1.2-2.05V8.35l-5.2.95v6a2.35 2.35 0 1 1-1.2-2.05V8.15l7.6-1.75Z" fill="#fff" />
  </svg>
);

// ── guest pip ─────────────────────────────────────────────────────────────────

const GuestPip = ({ name, role, accent, darkMode, size = 28 }) => {
  const isHost = role === 'host';
  return (
    <div title={name} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isHost ? '#fef3c7' : darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
      border: `2px solid ${isHost ? '#fbbf24' : darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.34), fontWeight: 900,
      color: isHost ? '#f59e0b' : darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)',
      fontFamily: "'Caveat', cursive",
      marginLeft: -5,
    }}>
      {gInitials(name)}
    </div>
  );
};

// ── edit pill ─────────────────────────────────────────────────────────────────

const EditPill = ({ onClick, children, accent }) => (
  <button onClick={onClick} type="button" style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
    fontSize: 12, fontWeight: 800, fontFamily: "'Caveat', cursive",
    background: 'transparent', border: `1.5px solid ${accent}44`, color: accent,
  }}>
    {children}
  </button>
);

// ── section wrapper ───────────────────────────────────────────────────────────

const Section = ({ title, subtitle, actions, children, border, surfaceBg, primaryText, secondaryText }) => (
  <div style={{
    borderRadius: 14, border: `1px solid ${border}`,
    background: surfaceBg, overflow: 'hidden',
  }}>
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 12, padding: '10px 14px',
      borderBottom: `1px solid ${border}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.09em', color: secondaryText }}>{title}</div>
        {subtitle && <div style={{ marginTop: 3, fontSize: 12, fontWeight: 700, color: secondaryText }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
    <div style={{ padding: '12px 14px' }}>{children}</div>
  </div>
);

// ── main component ────────────────────────────────────────────────────────────

const PartyEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const darkMode = props.darkMode || false;
  const accent   = props.accent   || '#f59e0b'; // warm amber — party accent

  // party-specific data
  const potluckItems    = Array.isArray(event?.potluckItems) ? event.potluckItems : [];
  const guestList       = Array.isArray(event?.guestList) ? event.guestList.filter((g) => String(g?.name || '').trim()) : [];
  const theme           = String(event?.theme || '').trim();
  const musicPlaylist   = String(event?.musicPlaylist || '').trim();
  const playlistService = detectPlaylistService(musicPlaylist);
  const plusOnesAllowed = event?.plusOnesAllowed !== false;
  const titleText       = String(event?.title || '').trim();
  const coverImageUrl   = getCardBackdropUrl(event);
  const notes           = normalizeEventNotes(event);

  const claimedCount  = potluckItems.filter((i) => String(i?.claimedByUserId || i?.person || '').trim()).length;
  const openCount     = Math.max(0, potluckItems.length - claimedCount);
  const potluckPreview = potluckItems.slice(0, 3);
  const guestSummary  = guestList.length
    ? `${guestList.filter((g) => g?.rsvp === 'yes').length} / ${guestList.length} going`
    : plusOnesAllowed ? 'Plus-ones welcome' : 'Invite only';
  const currentUserId   = String(props.currentUserId || '').trim();
  const canClaimPotluck = Boolean(props.canClaimPotluck && typeof props.onClaimPotluck === 'function');
  const activeTab = String(props.activeTab || 'info').trim().toLowerCase();

  // invitees
  const invitees  = Array.isArray(event.invitees) ? event.invitees : [];
  const host      = invitees.find((i) => i.role === 'host');
  const preview   = invitees.slice(0, 6);
  const overflow  = Math.max(0, invitees.length - 6);
  const hostFirst = host ? (host.display_name || host.name || '').split(' ')[0] : null;

  const dateShort  = formatDateShort(event.date);
  const timePretty = formatTimePretty(event.time);

  // colour tokens — body matches sports card (clean, neutral)
  const heroBg      = 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 55%, #1a1040 100%)'; // deep violet-purple
  const heroText    = '#f8fafc';
  const heroMuted   = 'rgba(248,250,252,0.5)';
  const bodyBg      = darkMode ? '#0f0a1a' : '#ffffff';
  const surfaceBg   = darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc';
  const border      = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const primaryText = darkMode ? '#f1f5f9' : '#0f172a';
  const secondaryText = darkMode ? '#94a3b8' : '#64748b';
  const mutedText   = darkMode ? '#475569' : '#94a3b8';
  const divider     = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const canEdit = typeof onUpdateEventData === 'function' && typeof openEditor === 'function';

  // ── editor openers ──
  const openHeaderEditor = canEdit ? () => openEditor({
    variant: 'party', title: 'Party Details',
    fields: [
      { key: 'title',    label: 'Title',    value: titleText,                        placeholder: 'House Party @ Mine' },
      { key: 'date',     label: 'Date',     value: String(event?.date || '').trim(), placeholder: '2026-04-12' },
      { key: 'time',     label: 'Time',     value: String(event?.time || '').trim(), placeholder: '8:00 PM' },
      { key: 'location', label: 'Location', type: 'location', value: String(event?.location || '').trim(), placeholder: 'Search venue...' },
    ],
    onSave: (values) => onUpdateEventData({
      title: String(values.title || '').trim(), date: String(values.date || '').trim(),
      time: String(values.time || '').trim(), location: String(values.location || '').trim(),
    }),
  }) : onEdit;

  const openCoverEditor = canEdit ? () => openEditor({
    variant: 'party', title: coverImageUrl ? 'Change Cover' : 'Add Cover Photo',
    fields: [{ key: 'coverImageUrl', label: 'Cover photo', type: 'image-upload', value: coverImageUrl }],
    onSave: (values) => onUpdateEventData({ coverImageUrl: String(values.coverImageUrl || '').trim() || null }),
  }) : null;

  const openThemeEditor = canEdit ? () => openEditor({
    variant: 'party', title: 'Theme',
    fields: [{ key: 'theme', label: 'Theme', value: theme, placeholder: 'Game night, disco, rooftop glow...' }],
    onSave: (values) => onUpdateEventData({ theme: String(values.theme || '').trim() }),
  }) : undefined;

  const openGuestEditor = canEdit ? () => openEditor({
    variant: 'party', title: 'Guest List',
    fields: [
      { key: 'guestList', label: 'Guest List', type: 'guest-list', value: guestList, placeholder: 'Guest name' },
      { key: 'plusOnesAllowed', label: 'Allow plus-ones', type: 'toggle', value: plusOnesAllowed },
    ],
    onSave: (values) => onUpdateEventData({
      guestList: Array.isArray(values.guestList)
        ? values.guestList.map((g) => ({ name: String(g?.name || '').trim(), rsvp: String(g?.rsvp || 'pending').toLowerCase() === 'yes' ? 'yes' : String(g?.rsvp || '').toLowerCase() === 'no' ? 'no' : 'pending' })).filter((g) => g.name)
        : parseGuestListItems(values.guestList),
      plusOnesAllowed: Boolean(values.plusOnesAllowed),
    }),
  }) : undefined;

  const openMusicEditor = canEdit ? () => openEditor({
    variant: 'party', title: 'Music',
    fields: [{ key: 'musicPlaylist', label: 'Music link', type: 'music-link', value: musicPlaylist, placeholder: 'Paste a Spotify or Apple Music link...' }],
    onSave: (values) => onUpdateEventData({ musicPlaylist: String(values.musicPlaylist || '').trim() }),
  }) : undefined;

  const openPotluckEditor = canEdit ? () => openEditor({
    variant: 'party', title: 'Potluck',
    fields: [{ key: 'potluckItems', label: 'Items', type: 'potluck-list', value: potluckItems, placeholder: 'Chips' }],
    onSave: (values) => onUpdateEventData({ potluckItems: Array.isArray(values.potluckItems) ? normalizePotluckItems(values.potluckItems) : parseLineItems(values.potluckItems) }),
  }) : undefined;

  const openNotesEditor = canEdit ? () => openEditor({
    variant: 'party', title: 'Party Notes',
    fields: [{ key: 'description', label: 'Notes', type: 'textarea', rows: 5, value: notes, placeholder: 'Parking, dress code, what to bring...' }],
    onSave: (values) => onUpdateEventData({ description: String(values.description || '').trim() }),
  }) : onEdit;

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden', width: '100%',
      fontFamily: "'Caveat', cursive",
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
    }}>
      {/* ══════════════════════════════════════════
          DARK HERO HEADER
      ══════════════════════════════════════════ */}
      <div style={{
        background: heroBg,
        padding: '20px 20px 0',
        position: 'relative', overflow: 'hidden',
        minHeight: 140,
      }}>
        {/* cover image as subtle background tint */}
        {coverImageUrl && (
          <>
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: `url(${coverImageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: 0.18,
            }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: heroBg, opacity: 0.72 }} />
          </>
        )}

        {/* edit / delete controls */}
        {(props.onEdit || props.onDelete || openCoverEditor) && (
          <div style={{ position: 'absolute', top: 14, left: 16, display: 'flex', gap: 7, zIndex: 10 }}>
            {openCoverEditor && (
              <button onClick={openCoverEditor} type="button" style={{
                width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }} title={coverImageUrl ? 'Change cover' : 'Add cover'}>
                <Camera style={{ width: 13, height: 13 }} />
              </button>
            )}
            {props.onEdit && (
              <button onClick={props.onEdit} type="button" style={{
                width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Edit3 style={{ width: 13, height: 13 }} />
              </button>
            )}
            {props.onDelete && (
              <button onClick={props.onDelete} type="button" style={{
                width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        )}

        {/* party badge + privacy */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, position: 'relative', zIndex: 1 }}>
          <span style={{
            background: 'rgba(245,158,11,0.25)', color: '#fcd34d',
            fontSize: 10, fontWeight: 700, padding: '3px 10px',
            borderRadius: 999, border: '1px solid rgba(245,158,11,0.35)',
          }}>
            🎉 Party
          </span>
          {theme && (
            <span style={{
              background: 'rgba(255,255,255,0.1)', color: heroMuted,
              fontSize: 10, fontWeight: 600, padding: '3px 10px',
              borderRadius: 999, border: '1px solid rgba(255,255,255,0.15)',
              textTransform: 'capitalize',
            }}>
              {theme}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.08)', color: heroMuted,
            fontSize: 10, fontWeight: 600, padding: '3px 10px',
            borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)',
          }}>
            {event.is_public ? <Globe style={{ width: 9, height: 9 }} /> : <Lock style={{ width: 9, height: 9 }} />}
            {event.is_public ? 'Public' : 'Private'}
          </span>
        </div>

        {/* title */}
        <div style={{
          fontSize: 26, fontWeight: 900, color: heroText,
          letterSpacing: '-0.02em', lineHeight: 1.15,
          marginBottom: 10, position: 'relative', zIndex: 1,
        }}>
          {titleText || 'Untitled Party'}
        </div>

        {/* meta row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          flexWrap: 'wrap', marginBottom: 12,
          position: 'relative', zIndex: 1,
        }}>
          {dateShort && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: heroMuted }}>
              <Calendar style={{ width: 11, height: 11 }} />{dateShort}
            </span>
          )}
          {timePretty && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: heroMuted }}>
              <Clock style={{ width: 11, height: 11 }} />{timePretty}
            </span>
          )}
          {event.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: heroMuted }}>
              <MapPin style={{ width: 11, height: 11 }} />
              <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.location}
              </span>
            </span>
          )}
        </div>

        {/* tab bar — flush to hero bottom */}
        <div style={{
          display: 'flex', marginLeft: -20, marginRight: -20,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          position: 'relative', zIndex: 1,
        }}>
          {[
            { id: 'info', label: 'Info', action: null },
            { id: 'people', label: 'People', action: props.onViewPeople },
            { id: 'chat', label: 'Chat', action: props.onOpenChat },
            { id: 'map', label: 'Map', action: props.onOpenMap },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.action || undefined}
                style={{
                flex: 1, padding: '11px 0',
                fontSize: 12, fontWeight: active ? 600 : 400,
                textAlign: 'center', cursor: 'pointer',
                color: active ? heroText : heroMuted,
                background: active ? bodyBg : 'transparent',
                borderTop: active ? `2px solid ${accent}` : '2px solid transparent',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                fontFamily: "'Caveat', cursive",
              }}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BODY — clean, no decorations
      ══════════════════════════════════════════ */}
      <div style={{
        background: bodyBg,
        padding: '16px 16px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>

        {/* who's coming */}
        {invitees.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 14,
            background: surfaceBg, border: `1px solid ${border}`,
          }}>
            <div style={{ display: 'flex', paddingLeft: 5 }}>
              {preview.map((inv, i) => (
                <GuestPip key={inv.id || i} name={inv.display_name || inv.name}
                  role={inv.role} accent={accent} darkMode={darkMode} size={28} />
              ))}
              {overflow > 0 && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  border: `2px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900, color: secondaryText,
                  marginLeft: -5, fontFamily: "'Caveat', cursive",
                }}>+{overflow}</div>
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: secondaryText }}>
              {invitees.length === 1 ? '1 person going' : `${invitees.length} people going`}
            </span>
          </div>
        )}

        {/* RSVP / join button */}
        {!props.hidePrimaryAction && props.onPrimaryAction && props.primaryActionLabel && (
          <button onClick={props.onPrimaryAction} style={{
            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
            cursor: 'pointer', background: accent, color: '#fff',
            fontSize: 16, fontWeight: 900, fontFamily: "'Caveat', cursive",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.1) 50%,transparent 65%)', pointerEvents: 'none' }} />
            {props.primaryActionLabel}
          </button>
        )}

        {/* ── Invitation Details — theme / guests / music ── */}
        <Section
          title="Invitation Details"
          border={border} surfaceBg={surfaceBg}
          primaryText={primaryText} secondaryText={secondaryText}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>

            {/* Theme */}
            <button onClick={openThemeEditor} type="button" style={{
              padding: '10px 12px', borderRadius: 12, textAlign: 'left',
              border: `1px solid ${border}`, background: bodyBg,
              cursor: openThemeEditor ? 'pointer' : 'default',
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, marginBottom: 5 }}>Theme</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: primaryText, lineHeight: 1.3 }}>
                {theme || <span style={{ color: mutedText, fontStyle: 'italic' }}>None set</span>}
              </div>
            </button>

            {/* Guests */}
            <button onClick={openGuestEditor} type="button" style={{
              padding: '10px 12px', borderRadius: 12, textAlign: 'left',
              border: `1px solid ${border}`, background: bodyBg,
              cursor: openGuestEditor ? 'pointer' : 'default',
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: secondaryText, marginBottom: 5 }}>Guests</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: primaryText, lineHeight: 1.3 }}>{guestSummary}</div>
              {guestList.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {guestList.slice(0, 2).map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: secondaryText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{g.name}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '1px 5px', borderRadius: 999, flexShrink: 0,
                        background: g.rsvp === 'yes' ? '#d1fae5' : g.rsvp === 'no' ? '#fee2e2' : darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                        color: g.rsvp === 'yes' ? '#065f46' : g.rsvp === 'no' ? '#991b1b' : secondaryText,
                      }}>
                        {g.rsvp === 'yes' ? 'Yes' : g.rsvp === 'no' ? 'No' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {guestList.length > 2 && <span style={{ fontSize: 11, color: mutedText, fontWeight: 700 }}>+{guestList.length - 2} more</span>}
                </div>
              )}
            </button>

            {/* Music */}
            <button onClick={openMusicEditor} type="button" style={{
              padding: '10px 12px', borderRadius: 12, textAlign: 'left',
              border: `1px solid ${border}`, background: bodyBg,
              cursor: openMusicEditor ? 'pointer' : 'default',
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: secondaryText, marginBottom: 5 }}>Music</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: primaryText, lineHeight: 1.3 }}>
                {musicPlaylist ? (playlistService?.name || 'Ready') : <span style={{ color: mutedText, fontStyle: 'italic' }}>Not set</span>}
              </div>
              {musicPlaylist && isProbablyUrl(musicPlaylist) && (
                <div style={{ marginTop: 6 }}>
                  <a href={musicPlaylist} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                      background: playlistService?.name === 'Spotify' ? '#1ed76018' : `${accent}18`,
                      color: playlistService?.name === 'Spotify' ? '#166534' : accent,
                      textDecoration: 'none',
                    }}>
                    {playlistService?.name === 'Spotify' && <SpotifyIcon />}
                    {playlistService?.name === 'Apple Music' && <AppleMusicIcon />}
                    {playlistService?.name || 'Open'}
                  </a>
                </div>
              )}
            </button>
          </div>
        </Section>

        {/* ── Potluck ── */}
        {(potluckItems.length > 0 || openPotluckEditor) && (
          <Section
            title="Potluck"
            subtitle={potluckItems.length > 0 ? `${potluckItems.length} items · ${claimedCount} claimed${openCount ? ` · ${openCount} open` : ''}` : undefined}
            actions={openPotluckEditor ? <EditPill onClick={openPotluckEditor} accent={accent}>{potluckItems.length > 0 ? 'Edit' : 'Add'}</EditPill> : null}
            border={border} surfaceBg={surfaceBg} primaryText={primaryText} secondaryText={secondaryText}
          >
            {potluckItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {potluckPreview.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '9px 12px', borderRadius: 12,
                    border: `1px solid ${border}`, background: bodyBg,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: primaryText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item?.item || item}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: secondaryText, marginTop: 1 }}>
                        {item?.person ? `Claimed by ${item.person}` : 'Open signup'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{
                        padding: '2px 9px', borderRadius: 999,
                        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                        background: item?.person ? `${accent}18` : '#fef9c3',
                        color: item?.person ? accent : '#854d0e',
                      }}>
                        {item?.person ? 'Claimed' : 'Open'}
                      </span>
                      {canClaimPotluck && (!item?.claimedByUserId || item.claimedByUserId === currentUserId) && (
                        <button type="button" onClick={() => props.onClaimPotluck?.(idx)} style={{
                          padding: '2px 9px', borderRadius: 999,
                          fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                          cursor: 'pointer', border: 'none',
                          background: item?.claimedByUserId === currentUserId ? '#fee2e2' : '#d1fae5',
                          color: item?.claimedByUserId === currentUserId ? '#991b1b' : '#065f46',
                        }}>
                          {item?.claimedByUserId === currentUserId ? 'Unclaim' : 'Claim'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {potluckItems.length > 3 && (
                  <button type="button" onClick={openPotluckEditor} style={{
                    width: '100%', padding: '8px 0', borderRadius: 12, cursor: 'pointer',
                    background: 'transparent', border: `1px dashed ${accent}33`,
                    fontSize: 12, fontWeight: 800, color: accent, fontFamily: "'Caveat', cursive",
                  }}>
                    +{potluckItems.length - 3} more items
                  </button>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 700, color: mutedText, fontStyle: 'italic' }}>
                Nothing added yet.
              </div>
            )}
          </Section>
        )}

        {/* ── Party Notes ── */}
        {(notes || openNotesEditor) && (
          <Section
            title="Notes"
            actions={openNotesEditor ? <EditPill onClick={openNotesEditor} accent={accent}>{notes ? 'Edit' : 'Add'}</EditPill> : null}
            border={border} surfaceBg={surfaceBg} primaryText={primaryText} secondaryText={secondaryText}
          >
            {notes ? (
              <div style={{ fontSize: 14, fontWeight: 700, color: primaryText, lineHeight: 1.65 }}>
                {notes}
              </div>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 700, color: mutedText, fontStyle: 'italic' }}>
                Nothing added yet.
              </div>
            )}
          </Section>
        )}

      </div>
    </div>
  );
};

export default PartyEventCard;
