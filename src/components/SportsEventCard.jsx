// ─────────────────────────────────────────────────────────────────────────────
// SportsEventCard
// Slots into EventCardRouter for category === 'sports'.
// Dark hero header with sport watermark, invitation-style body,
// "Organized by" instead of "Hosted by".
// Same props contract as GenericEventCard / PartyEventCard.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  MapPin, Clock, Calendar, Users, Lock, Globe,
  Copy, Check, MessageCircle, Gamepad2, UserMinus,
  Loader, AlertCircle, Shield,
} from 'lucide-react';

const APP_FONT_STACK = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ── helpers ───────────────────────────────────────────────────────────────────

const gInitials = (name) => {
  const parts = String(name || '?').trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : String(name || '?')[0].toUpperCase();
};

const getProfileImageUrl = (person = {}) => {
  const candidates = [
    person.photoUrl,
    person.photo_url,
    person.avatarUrl,
    person.avatar_url,
    person.profilePhotoUrl,
    person.profile_photo_url,
    person.imageUrl,
    person.image_url,
    person.picture,
    person.avatar,
  ];
  return candidates
    .map((value) => String(value || '').trim())
    .find((value) => /^(https?:\/\/|data:image\/|blob:)/i.test(value)) || '';
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return null;
  try {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      weekday: dt.toLocaleDateString('en-US', { weekday: 'long' }),
      short:   dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      month:   dt.toLocaleDateString('en-US', { month: 'long' }),
      day: d, year: y,
    };
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

const buildMapHref = (loc) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(loc || '').trim())}`;

const POPUP_NO_MAX_SENTINEL = 1000000;

// ── sport-type watermark SVGs ─────────────────────────────────────────────────
// Deterministic based on event title keywords — falls back to a generic court.

const detectSportType = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  if (/pickleball/.test(text))  return 'pickleball';
  if (/tennis/.test(text))      return 'tennis';
  if (/basket/.test(text))      return 'basketball';
  if (/soccer|football/.test(text)) return 'soccer';
  if (/volley/.test(text))      return 'volleyball';
  if (/badminton/.test(text))   return 'badminton';
  return 'court'; // generic
};

const SportWatermark = ({ sport }) => {
  const base = { position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', opacity: 0.1, pointerEvents: 'none' };

  if (sport === 'pickleball' || sport === 'tennis' || sport === 'badminton') {
    // Pickleball court: service areas on outside, narrow kitchen zones flanking the net
    // Real proportions: court 44ft total, kitchen 7ft each side of net (~16% each side)
    return (
      <svg style={base} width="100" height="64" viewBox="0 0 100 64" fill="none">
        {/* Outer border */}
        <rect x="1" y="1" width="98" height="62" rx="3" stroke="white" strokeWidth="2"/>
        {/* Service area fills */}
        <rect x="1" y="1" width="33" height="62" fill="white" fillOpacity="0.25"/>
        <rect x="66" y="1" width="33" height="62" fill="white" fillOpacity="0.25"/>
        {/* Kitchen boundary lines */}
        <line x1="34" y1="1" x2="34" y2="63" stroke="white" strokeWidth="1.5"/>
        <line x1="66" y1="1" x2="66" y2="63" stroke="white" strokeWidth="1.5"/>
        {/* Net — center */}
        <line x1="50" y1="1" x2="50" y2="63" stroke="white" strokeWidth="3"/>
        {/* Center service lines — only in the service courts, not through kitchen */}
        <line x1="1" y1="32" x2="34" y2="32" stroke="white" strokeWidth="1.5"/>
        <line x1="66" y1="32" x2="99" y2="32" stroke="white" strokeWidth="1.5"/>
      </svg>
    );
  }
  if (sport === 'basketball') {
    return (
      <svg style={base} width="90" height="64" viewBox="0 0 90 64" fill="none">
        <rect x="1" y="1" width="88" height="62" rx="3" stroke="white" strokeWidth="2"/>
        <line x1="45" y1="1" x2="45" y2="63" stroke="white" strokeWidth="2"/>
        <circle cx="45" cy="32" r="12" stroke="white" strokeWidth="1.5"/>
        <rect x="1" y="16" width="18" height="32" stroke="white" strokeWidth="1.5"/>
        <rect x="71" y="16" width="18" height="32" stroke="white" strokeWidth="1.5"/>
        <line x1="1" y1="32" x2="19" y2="32" stroke="white" strokeWidth="1"/>
        <line x1="71" y1="32" x2="89" y2="32" stroke="white" strokeWidth="1"/>
      </svg>
    );
  }
  if (sport === 'soccer') {
    return (
      <svg style={base} width="100" height="64" viewBox="0 0 100 64" fill="none">
        <rect x="1" y="1" width="98" height="62" rx="3" stroke="white" strokeWidth="2"/>
        <line x1="50" y1="1" x2="50" y2="63" stroke="white" strokeWidth="2"/>
        <circle cx="50" cy="32" r="10" stroke="white" strokeWidth="1.5"/>
        <rect x="1" y="20" width="14" height="24" stroke="white" strokeWidth="1.5"/>
        <rect x="85" y="20" width="14" height="24" stroke="white" strokeWidth="1.5"/>
        <rect x="1" y="12" width="22" height="40" stroke="white" strokeWidth="1"/>
        <rect x="77" y="12" width="22" height="40" stroke="white" strokeWidth="1"/>
      </svg>
    );
  }
  if (sport === 'volleyball') {
    return (
      <svg style={base} width="100" height="40" viewBox="0 0 100 40" fill="none">
        <line x1="1" y1="20" x2="99" y2="20" stroke="white" strokeWidth="2.5"/>
        <line x1="1" y1="16" x2="99" y2="16" stroke="white" strokeWidth="1"/>
        <line x1="1" y1="24" x2="99" y2="24" stroke="white" strokeWidth="1"/>
        <line x1="1" y1="1" x2="1" y2="39" stroke="white" strokeWidth="2"/>
        <line x1="99" y1="1" x2="99" y2="39" stroke="white" strokeWidth="2"/>
      </svg>
    );
  }
  // generic court
  return (
    <svg style={base} width="90" height="58" viewBox="0 0 90 58" fill="none">
      <rect x="1" y="1" width="88" height="56" rx="3" stroke="white" strokeWidth="2"/>
      <rect x="1" y="1" width="26" height="56" fill="white" fillOpacity="0.4"/>
      <rect x="63" y="1" width="26" height="56" fill="white" fillOpacity="0.4"/>
      <line x1="27" y1="1" x2="27" y2="57" stroke="white" strokeWidth="1.5"/>
      <line x1="63" y1="1" x2="63" y2="57" stroke="white" strokeWidth="1.5"/>
      <line x1="45" y1="1" x2="45" y2="57" stroke="white" strokeWidth="2.5"/>
      <line x1="27" y1="29" x2="63" y2="29" stroke="white" strokeWidth="1"/>
    </svg>
  );
};

// ── status badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    open:   { label: 'Open',  color: '#10b981' },
    full:   { label: 'Full',  color: '#f59e0b' },
    active: { label: 'Live',  color: '#ef4444' },
    ended:  { label: 'Ended', color: '#94a3b8' },
  };
  const s = map[status] || map.open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
      background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44`,
    }}>
      {status === 'active' && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      )}
      {s.label}
    </span>
  );
};

// ── player pip ────────────────────────────────────────────────────────────────

const PlayerPip = ({ person, name, role, accent, size = 28 }) => {
  const isOrganizer = role === 'host';
  const isCohost    = role === 'cohost';
  const profileImageUrl = getProfileImageUrl(person);
  return (
    <div title={name} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isOrganizer ? '#fef3c7' : isCohost ? `${accent}22` : 'rgba(255,255,255,0.12)',
      border: `2px solid ${isOrganizer ? '#fbbf24' : isCohost ? `${accent}55` : 'rgba(255,255,255,0.2)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.34), fontWeight: 900,
      color: isOrganizer ? '#f59e0b' : isCohost ? accent : 'rgba(255,255,255,0.85)',
      fontFamily: APP_FONT_STACK,
      marginLeft: -5,
      overflow: 'hidden',
    }}>
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={name ? `${name} profile` : 'Player profile'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : gInitials(name)}
    </div>
  );
};

// ── main ──────────────────────────────────────────────────────────────────────

export default function SportsEventCard({
  event = {},
  darkMode = false,
  accent = '#3b82f6',
  // action handlers passed from PopupEventPanel / EventCardRouter
  onPrimaryAction,
  primaryActionLabel,
  hidePrimaryAction = false,
  onLeave,
  isHost = false,
  isMember = false,
  isFull = false,
  joining = false,
  joinError = '',
  copied = false,
  onCopyLink,
  onViewRoster,
  onOpenChat,
  onOpenMap,
  onStartPlay,
  onGoToInfo,
  onTogglePublic,
  activeTab = 'info',
  bodyContent = null,
  onEditCapacity,
  memberCount = 0,
  // legacy guard
  isLegacyInvalidEvent = false,
}) {
  const invitees    = Array.isArray(event.invitees) ? event.invitees : [];
  const organizer   = invitees.find((i) => i.role === 'host');
  const cohosts     = invitees.filter((i) => i.role === 'cohost');
  const allPlayers  = invitees;
  const preview     = allPlayers.slice(0, 6);
  const overflow    = Math.max(0, allPlayers.length - 6);

  const dateParts   = formatDateFull(event.date);
  const timePretty  = formatTimePretty(event.time);
  const sport       = detectSportType(event.title, event.description);

  const noMax       = Number(event.max_players || 0) >= POPUP_NO_MAX_SENTINEL;
  const capacityLabel = noMax
    ? `${memberCount} joined`
    : `${memberCount} / ${event.max_players} players`;

  // ── colour tokens ──
  // Hero always dark regardless of darkMode — it's a stadium/court aesthetic
  const heroBg        = 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f2a4a 100%)';
  const heroText      = '#f8fafc';
  const heroMuted     = 'rgba(248,250,252,0.55)';
  const heroBorder    = 'rgba(255,255,255,0.1)';

  // Body follows darkMode
  const bodyBg        = darkMode ? '#0f172a' : '#ffffff';
  const surfaceBg     = darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc';
  const border        = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const primaryText   = darkMode ? '#f1f5f9' : '#0f172a';
  const secondaryText = darkMode ? '#94a3b8' : '#64748b';
  const mutedText     = darkMode ? '#475569' : '#94a3b8';
  const divider       = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Capacity bar fill — use accent, clamp at 100%
  const capacityPct = noMax ? 0 : Math.min(100, (memberCount / (event.max_players || 1)) * 100);

  return (
    <div style={{
      borderRadius: 20,
      overflow: 'hidden',
      fontFamily: APP_FONT_STACK,
      width: '100%',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
    }}>

      {/* ══════════════════════════════════════════
          DARK HERO HEADER
      ══════════════════════════════════════════ */}
      <div style={{
        background: heroBg,
        padding: '20px 20px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* sport watermark */}
        <SportWatermark sport={sport} />

        {/* badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, position: 'relative' }}>
          <span style={{
            background: `${accent}33`, color: accent,
            fontSize: 10, fontWeight: 700, padding: '3px 10px',
            borderRadius: 999, border: `1px solid ${accent}44`,
            textTransform: 'capitalize',
          }}>
            {sport === 'court' ? 'Sports' : sport.charAt(0).toUpperCase() + sport.slice(1)}
          </span>
          <button
            type="button"
            onClick={onTogglePublic || undefined}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.08)', color: heroMuted,
              fontSize: 10, fontWeight: 600, padding: '3px 10px',
              borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)',
              cursor: onTogglePublic ? 'pointer' : 'default',
              fontFamily: APP_FONT_STACK,
            }}
          >
            {event.is_public ? <Globe style={{ width: 9, height: 9 }} /> : <Lock style={{ width: 9, height: 9 }} />}
            {event.is_public ? 'Public' : 'Private'}
          </button>
          <StatusBadge status={event.status} />
        </div>

        {/* title */}
        <div style={{
          fontSize: 29, fontWeight: 900, color: heroText,
          letterSpacing: '-0.02em', lineHeight: 1.15,
          marginBottom: 10, position: 'relative',
          fontFamily: "'Caveat', cursive",
        }}>
          {event.title || 'Untitled Event'}
        </div>

        {/* meta row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          flexWrap: 'wrap', marginBottom: 12, position: 'relative',
        }}>
          {dateParts && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: heroMuted }}>
              <Calendar style={{ width: 11, height: 11 }} />{dateParts.short}
            </span>
          )}
          {timePretty && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: heroMuted }}>
              <Clock style={{ width: 11, height: 11 }} />{timePretty}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: heroMuted }}>
            <Users style={{ width: 11, height: 11 }} />{capacityLabel}
          </span>
        </div>

        {/* capacity bar */}
        {!noMax && (
          <div style={{
            height: 3, borderRadius: 999,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${capacityPct}%`,
              background: `linear-gradient(90deg, ${accent}, ${accent}bb)`,
              transition: 'width 0.5s',
            }} />
          </div>
        )}

        {/* ── tab bar — flush to bottom of hero ── */}
        <div style={{
          display: 'flex', marginTop: 14, marginLeft: -20, marginRight: -20,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          {[
            { id: 'info', label: 'Info', action: onGoToInfo || null },
            { id: 'roster', label: 'People', action: onViewRoster },
            { id: 'chat', label: 'Chat', action: onOpenChat },
            { id: 'map', label: 'Map', action: onOpenMap },
            { id: 'game', label: 'Play', action: onStartPlay },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.action || undefined}
                style={{
                flex: 1, padding: '11px 0',
                fontSize: 13, fontWeight: active ? 700 : 500,
                textAlign: 'center', cursor: 'pointer',
                color: active ? (darkMode ? heroText : '#0f172a') : heroMuted,
                background: active ? bodyBg : 'transparent',
                borderTop: active ? `2px solid ${accent}` : '2px solid transparent',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                transition: 'all 0.15s',
                fontFamily: APP_FONT_STACK,
              }}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BODY
      ══════════════════════════════════════════ */}
      <div style={{
        background: bodyBg,
        padding: '18px 18px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {bodyContent || (
          <>

        {/* ── location ── */}
        {event.location && (
          <a
            href={buildMapHref(event.location)}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 14,
              background: surfaceBg, border: `1px solid ${border}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: `${accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MapPin style={{ width: 14, height: 14, color: accent }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: secondaryText, marginBottom: 2 }}>Location</div>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: primaryText,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {event.location}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 12 12" style={{ flexShrink: 0, color: mutedText }}>
                <path d="M4.5 2.5 L8 6 L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </a>
        )}

        {/* ── organizer row ── */}
        {organizer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            padding: '10px 14px', borderRadius: 14,
            background: darkMode ? 'rgba(251,191,36,0.08)' : '#fefce8',
            border: '1px solid rgba(251,191,36,0.25)',
          }}>
            {/* organizer pip */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: '#fef3c7', border: '2px solid #fbbf24',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#f59e0b',
              fontFamily: APP_FONT_STACK, overflow: 'hidden',
            }}>
              {getProfileImageUrl(organizer)
                ? <img src={getProfileImageUrl(organizer)} alt={organizer.display_name || organizer.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : gInitials(organizer.display_name || organizer.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 15, color: darkMode ? '#fbbf24' : '#92400e', fontWeight: 700 }}>
                Organized by{' '}
                <span style={{ color: darkMode ? '#fde68a' : '#78350f', fontWeight: 900 }}>
                  {organizer.display_name || organizer.name}
                </span>
              </span>
            </div>
            {/* cohost pills */}
            {cohosts.map((c) => (
              <div key={c.id || c.user_id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 8px', borderRadius: 999,
                background: `${accent}18`, border: `1px solid ${accent}33`,
              }}>
                <Shield style={{ width: 11, height: 11, color: accent }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>
                  {c.display_name || c.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── about / description ── */}
        {event.description && (
          <div style={{
            padding: '12px 14px', borderRadius: 14,
            background: surfaceBg, border: `1px solid ${border}`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: accent, marginBottom: 5,
            }}>
              About
            </div>
            <div style={{ fontSize: 15, color: secondaryText, lineHeight: 1.6, fontWeight: 700 }}>
              {event.description}
            </div>
          </div>
        )}

        {/* ── player roster pips ── */}
        {allPlayers.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 14,
            background: surfaceBg, border: `1px solid ${border}`,
          }}>
            <div style={{ display: 'flex', paddingLeft: 5 }}>
              {preview.map((p, i) => (
                <PlayerPip
                  key={p.id || i}
                  person={p}
                  name={p.display_name || p.name}
                  role={p.role}
                  accent={accent}
                  size={28}
                />
              ))}
              {overflow > 0 && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)',
                  border: '2px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, color: secondaryText,
                  marginLeft: -5, fontFamily: APP_FONT_STACK,
                }}>
                  +{overflow}
                </div>
              )}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: secondaryText }}>
              {allPlayers.length === 1 ? '1 player in' : `${allPlayers.length} players in`}
            </span>
          </div>
        )}

        {/* ── legacy warning ── */}
        {isLegacyInvalidEvent && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 14px', borderRadius: 14,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          }}>
            <AlertCircle style={{ width: 15, height: 15, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 14, color: '#b45309', lineHeight: 1.5, fontWeight: 700 }}>
              Legacy event — can be viewed but not joined or managed. Recreate it to use the full panel.
            </div>
          </div>
        )}

        {/* ── join button ── */}
        {!hidePrimaryAction && !isLegacyInvalidEvent && !isMember && event.status === 'open' && !isFull && (
          <button
            onClick={onPrimaryAction}
            disabled={joining}
            style={{
              width: '100%', padding: '13px 0',
              borderRadius: 14, border: 'none', cursor: joining ? 'default' : 'pointer',
              background: accent, color: '#fff',
              fontSize: 18, fontWeight: 900, fontFamily: APP_FONT_STACK,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: joining ? 0.75 : 1,
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)',
              pointerEvents: 'none',
            }} />
            {joining
              ? <><Loader style={{ width: 15, height: 15 }} /> Joining…</>
              : <>{primaryActionLabel || 'Join Event'}</>}
          </button>
        )}

        {/* join error */}
        {joinError && (
          <div style={{
            padding: '10px 14px', borderRadius: 12,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: 13, fontWeight: 700, color: '#ef4444',
          }}>
            {joinError}
          </div>
        )}

        {/* full message */}
        {isFull && !isMember && (
          <div style={{
            padding: '12px 14px', borderRadius: 14,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            fontSize: 14, fontWeight: 700, color: '#d97706', textAlign: 'center',
          }}>
            Event is full
          </div>
        )}

        {/* leave button (non-host members) */}
        {isMember && !isHost && !isLegacyInvalidEvent && (
          <button
            onClick={onLeave}
            style={{
              width: '100%', padding: '11px 0',
              borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: 'pointer',
              border: '1.5px solid rgba(239,68,68,0.28)',
              background: 'rgba(239,68,68,0.06)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: APP_FONT_STACK,
            }}
          >
            <UserMinus style={{ width: 14, height: 14 }} /> Leave Event
          </button>
        )}

        {/* ── host controls ── */}
        {isHost && !isLegacyInvalidEvent && (
          <div style={{
            borderRadius: 14, border: `1px solid ${border}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px',
              fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: accent,
              background: surfaceBg,
              borderBottom: `1px solid ${border}`,
            }}>
              Controls
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '0.5px', background: divider,
            }}>
              {[
                { label: copied ? 'Copied!' : 'Copy Link', icon: copied ? Check : Copy, action: onCopyLink, color: copied ? '#10b981' : undefined },
                { label: 'View Roster',  icon: Users,          action: onViewRoster },
                { label: 'Open Chat',    icon: MessageCircle,  action: onOpenChat },
                { label: 'Start Play',   icon: Gamepad2,       action: onStartPlay, color: accent },
              ].map(({ label, icon: Icon, action, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  style={{
                    padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', border: 'none',
                    background: darkMode ? 'rgba(255,255,255,0.03)' : '#fff',
                    color: color || primaryText,
                    fontSize: 14, fontWeight: 700,
                    fontFamily: APP_FONT_STACK,
                  }}
                >
                  <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
          </>
        )}

      </div>
    </div>
  );
}
