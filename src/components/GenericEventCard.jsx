// ─────────────────────────────────────────────────────────────────────────────
// GenericEventCard — invitation redesign
// Feels like a hand-delivered invite, not a dashboard widget.
// Same props contract as before.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { MapPin, Edit3, AlertCircle, Check } from 'lucide-react';

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

// Each invite theme: warm paper tone + complementary ink colour.
const INVITE_THEMES = [
  // warm parchment / terracotta
  { paper: '#fdf6ee', paperDark: '#1c1410', ink: '#c2410c', inkLight: '#fb923c', stripe: '#fed7aa' },
  // blush / raspberry
  { paper: '#fdf2f8', paperDark: '#1c1018', ink: '#be185d', inkLight: '#f9a8d4', stripe: '#fbcfe8' },
  // sage / forest
  { paper: '#f0fdf4', paperDark: '#0f1a12', ink: '#166534', inkLight: '#6ee7b7', stripe: '#bbf7d0' },
  // lavender / violet
  { paper: '#f5f3ff', paperDark: '#130f1e', ink: '#5b21b6', inkLight: '#c4b5fd', stripe: '#ddd6fe' },
  // sky / navy
  { paper: '#eff6ff', paperDark: '#0b1220', ink: '#1e40af', inkLight: '#93c5fd', stripe: '#bfdbfe' },
];

const pickTheme = (id) => {
  const code = String(id || '0').charCodeAt(String(id || '0').length - 1);
  return INVITE_THEMES[code % INVITE_THEMES.length];
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return null;
  try {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      weekday: dt.toLocaleDateString('en-US', { weekday: 'long' }),
      month:   dt.toLocaleDateString('en-US', { month: 'long' }),
      day:     d,
      year:    y,
    };
  } catch { return null; }
};

const formatTimePretty = (timeStr) => {
  if (!timeStr) return null;
  try {
    const [h, m] = String(timeStr).split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return null; }
};

// ── decorative wax-seal monogram ──────────────────────────────────────────────
const WaxSeal = ({ letter, ink, size = 46 }) => (
  <svg width={size} height={size} viewBox="0 0 46 46" style={{ flexShrink: 0, display: 'block' }}>
    {/* outer ring */}
    <circle cx="23" cy="23" r="22" fill={ink} />
    {/* subtle inner ring */}
    <circle cx="23" cy="23" r="18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
    {/* tiny star/asterisk marks at compass points */}
    {[[23,5],[41,23],[23,41],[5,23]].map(([x,y], i) => (
      <circle key={i} cx={x} cy={y} r="1.5" fill="rgba(255,255,255,0.3)" />
    ))}
    <text
      x="23" y="29" textAnchor="middle"
      fontFamily={APP_FONT_STACK} fontWeight="900" fontSize="18"
      fill="rgba(255,255,255,0.93)"
    >
      {letter}
    </text>
  </svg>
);

// ── corner flourish SVGs ──────────────────────────────────────────────────────
const CornerTL = ({ color }) => (
  <svg width="52" height="52" viewBox="0 0 52 52"
    style={{ position: 'absolute', top: 6, left: 0, opacity: 0.15, pointerEvents: 'none' }}>
    <path d="M2 2 Q26 2 26 26" fill="none" stroke={color} strokeWidth="1.5"/>
    <path d="M2 2 Q40 2 40 40" fill="none" stroke={color} strokeWidth="0.8"/>
    <circle cx="7" cy="7" r="2" fill={color}/>
  </svg>
);
const CornerBR = ({ color }) => (
  <svg width="52" height="52" viewBox="0 0 52 52"
    style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.15, pointerEvents: 'none' }}>
    <path d="M50 50 Q26 50 26 26" fill="none" stroke={color} strokeWidth="1.5"/>
    <path d="M50 50 Q12 50 12 12" fill="none" stroke={color} strokeWidth="0.8"/>
    <circle cx="45" cy="45" r="2" fill={color}/>
  </svg>
);

// ── guest pip ─────────────────────────────────────────────────────────────────
const GuestPip = ({ person, name, role, ink, darkMode = false, size = 28 }) => {
  const isHost = role === 'host';
  const profileImageUrl = getProfileImageUrl(person);
  return (
    <div title={name} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isHost ? ink : (darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'),
      border: `2px solid ${isHost ? ink : (darkMode ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.12)')}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.34), fontWeight: 900,
      color: isHost ? '#fff' : (darkMode ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.5)'),
      fontFamily: APP_FONT_STACK,
      marginLeft: -5,
      overflow: 'hidden',
    }}>
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={name ? `${name} profile` : 'Guest profile'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : gInitials(name)}
    </div>
  );
};

// ── main ──────────────────────────────────────────────────────────────────────

export default function GenericEventCard({
  event = {},
  darkMode = false,
  accent = '#7c3aed',
  onEditBasics,
  onUpdateEventData,
  hidePrimaryAction = false,
  onPrimaryAction,
  primaryActionLabel,
  currentUserId,
  currentUserName,
  canClaimPotluck,
  onClaimPotluck,
}) {
  const [noteDraft, setNoteDraft]     = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [savingNote, setSavingNote]   = useState(false);

  const theme = pickTheme(event.id);

  const cardBg        = darkMode ? theme.paperDark : theme.paper;
  const ink           = theme.ink;
  const inkLight      = theme.inkLight;
  const stripeColor   = darkMode ? `${ink}2a` : theme.stripe;
  const primaryText   = darkMode ? '#f1f5f9' : '#1c1917';
  const secondaryText = darkMode ? '#94a3b8' : '#57534e';
  const mutedText     = darkMode ? '#64748b' : '#a8a29e';
  const dividerColor  = darkMode ? `${ink}22` : `${ink}20`;

  const canEdit = typeof onEditBasics === 'function';

  const invitees = Array.isArray(event.invitees) ? event.invitees : [];
  const host     = invitees.find((i) => i.role === 'host');
  const preview  = invitees.slice(0, 6);
  const overflow = Math.max(0, invitees.length - 6);

  const dateParts  = formatDateFull(event.date);
  const timePretty = formatTimePretty(event.time);
  const noteText   = event.notes || event.description || '';

  const hostFirstName = host
    ? (host.display_name || host.name || '').split(' ')[0]
    : null;
  const sealLetter = String(event.title || '?')[0].toUpperCase();

  const handleSaveNote = async () => {
    if (!onUpdateEventData) return;
    setSavingNote(true);
    try {
      await onUpdateEventData({ notes: noteDraft.trim() || null });
      setEditingNote(false);
    } catch {}
    setSavingNote(false);
  };

  return (
    <div style={{
      borderRadius: 20,
      background: cardBg,
      border: `1.5px solid ${darkMode ? `${ink}28` : `${ink}20`}`,
      overflow: 'hidden',
      fontFamily: APP_FONT_STACK,
      width: '100%',
      position: 'relative',
    }}>

      {/* decorative corner lines */}
      <CornerTL color={ink} />
      <CornerBR color={ink} />

      {/* ── top stripe ── */}
      <div style={{
        height: 7,
        background: `linear-gradient(90deg, ${ink} 0%, ${inkLight} 100%)`,
      }} />

      {/* ── optional cover image ── */}
      {event.coverImageUrl && (
        <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
          <img src={event.coverImageUrl} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to bottom, transparent 30%, ${cardBg})`,
          }} />
        </div>
      )}

      {/* ── salutation + title ── */}
      <div style={{
        padding: '20px 22px 0',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 14,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* "X is inviting you to" */}
          <div style={{
            fontSize: 12, fontWeight: 700, color: ink,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            marginBottom: 5, opacity: 0.8,
          }}>
            {hostFirstName
              ? `${hostFirstName} is inviting you to`
              : 'You\'re invited to'}
          </div>
          {/* title — the biggest thing on the card */}
          <div style={{
            fontSize: 30, fontWeight: 900, color: primaryText,
            letterSpacing: '-0.02em', lineHeight: 1.1,
            fontFamily: "'Caveat', cursive",
          }}>
            {event.title || 'Untitled Event'}
          </div>
        </div>

        {/* wax seal + optional edit button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <WaxSeal letter={sealLetter} ink={ink} size={46} />
          {canEdit && (
            <button onClick={() => onEditBasics?.({})}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '2px 4px', color: mutedText, borderRadius: 6 }}
              title="Edit event">
              <Edit3 style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>
      </div>

      {/* ── hairline divider ── */}
      <div style={{
        margin: '16px 22px',
        height: 1,
        background: `linear-gradient(90deg, transparent, ${dividerColor}, transparent)`,
      }} />

      {/* ── date / time / location block ── */}
      <div style={{
        margin: '0 22px',
        padding: '14px 16px',
        borderRadius: 14,
        background: stripeColor,
        border: `1px solid ${dividerColor}`,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>

        {dateParts && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* big day number */}
            <div style={{
              fontSize: 42, fontWeight: 900, lineHeight: 1,
              color: ink, minWidth: 50, flexShrink: 0,
              letterSpacing: '-0.03em',
            }}>
              {dateParts.day}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: primaryText, lineHeight: 1.2 }}>
                {dateParts.weekday}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: secondaryText, marginTop: 1 }}>
                {dateParts.month} · {dateParts.year}
              </div>
              {timePretty && (
                <div style={{
                  marginTop: 3, fontSize: 15, fontWeight: 900,
                  color: ink, letterSpacing: '0.01em',
                }}>
                  {timePretty}
                </div>
              )}
            </div>
          </div>
        )}

        {event.location && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            paddingTop: dateParts ? 10 : 0,
            borderTop: dateParts ? `1px dashed ${dividerColor}` : 'none',
          }}>
            <MapPin style={{ width: 14, height: 14, color: ink, flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: primaryText, lineHeight: 1.4 }}>
              {event.location}
            </span>
          </div>
        )}
      </div>

      {/* ── personal message from host ── */}
      <div style={{ margin: '14px 22px 0', position: 'relative', zIndex: 1 }}>
        {editingNote ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
              placeholder="Write a personal message to your guests…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: 12,
                fontSize: 16, fontFamily: APP_FONT_STACK, fontWeight: 700,
                border: `1.5px solid ${ink}44`,
                background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                color: primaryText, outline: 'none', resize: 'none', lineHeight: 1.6,
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingNote(false)}
                style={{
                  padding: '5px 14px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                  background: 'transparent', border: `1px solid ${dividerColor}`,
                  color: secondaryText, cursor: 'pointer', fontFamily: APP_FONT_STACK,
                }}>
                Cancel
              </button>
              <button onClick={handleSaveNote} disabled={savingNote}
                style={{
                  padding: '5px 18px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                  background: ink, border: 'none', color: '#fff',
                  cursor: savingNote ? 'default' : 'pointer',
                  opacity: savingNote ? 0.7 : 1, fontFamily: APP_FONT_STACK,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                {savingNote ? 'Saving…' : <><Check style={{ width: 13, height: 13 }} /> Save</>}
              </button>
            </div>
          </div>
        ) : noteText ? (
          /* handwritten note card */
          <div style={{
            padding: '12px 16px 12px 20px',
            borderRadius: 12,
            background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
            border: `1px dashed ${ink}30`,
            position: 'relative',
          }}>
            {/* decorative open-quote */}
            <div style={{
              position: 'absolute', top: -4, left: 8,
              fontSize: 42, lineHeight: 1, color: ink, opacity: 0.15,
              fontFamily: 'Georgia, serif', pointerEvents: 'none', userSelect: 'none',
            }}>"</div>
            <div style={{
              fontSize: 16, fontWeight: 700, color: primaryText,
              lineHeight: 1.6, position: 'relative',
            }}>
              {noteText}
            </div>
            {canEdit && (
              <button onClick={() => { setNoteDraft(noteText); setEditingNote(true); }}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '2px 4px', color: mutedText,
                }}>
                <Edit3 style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
        ) : canEdit ? (
          /* prompt host to add a message */
          <button
            onClick={() => { setNoteDraft(''); setEditingNote(true); }}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'transparent', border: `1px dashed ${ink}22`,
              color: mutedText, fontSize: 14, fontWeight: 700,
              fontFamily: APP_FONT_STACK, textAlign: 'left',
            }}>
            + Add a personal message for your guests…
          </button>
        ) : null}
      </div>

      {/* ── who's going ── */}
      {invitees.length > 0 && (
        <div style={{
          margin: '14px 22px 0',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ display: 'flex', paddingLeft: 5 }}>
            {preview.map((inv, idx) => (
              <GuestPip
                key={inv.id || idx}
                person={inv}
                name={inv.display_name || inv.name}
                role={inv.role}
                ink={ink}
                darkMode={darkMode}
                size={26}
              />
            ))}
            {overflow > 0 && (
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: darkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
                border: `2px solid ${darkMode ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 900, color: darkMode ? 'rgba(255,255,255,0.88)' : secondaryText,
                marginLeft: -5, fontFamily: APP_FONT_STACK,
              }}>
                +{overflow}
              </div>
            )}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: secondaryText }}>
            {invitees.length === 1 ? '1 person going' : `${invitees.length} people going`}
          </span>
        </div>
      )}

      {/* ── urgent badge ── */}
      {event.isUrgent && (
        <div style={{
          margin: '12px 22px 0',
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 700, color: '#ef4444',
        }}>
          <AlertCircle style={{ width: 12, height: 12 }} />
          Limited spots — RSVP soon
        </div>
      )}

      {/* ── RSVP / join button ── */}
      {!hidePrimaryAction && onPrimaryAction && primaryActionLabel && (
        <div style={{ padding: '16px 22px 20px' }}>
          <button
            onClick={onPrimaryAction}
            style={{
              width: '100%', padding: '14px 0',
              borderRadius: 14, border: 'none', cursor: 'pointer',
              background: ink,
              color: '#fff', fontSize: 18, fontWeight: 900,
              fontFamily: APP_FONT_STACK,
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* shimmer */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)',
              pointerEvents: 'none',
            }} />
            {primaryActionLabel}
          </button>
        </div>
      )}

      {/* bottom padding when no button */}
      {(hidePrimaryAction || !onPrimaryAction) && <div style={{ height: 22 }} />}

    </div>
  );
}
