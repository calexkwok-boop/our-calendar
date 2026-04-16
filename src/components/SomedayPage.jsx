/**
 * SomedayPage.jsx — Pinboard redesign matching Explore theme
 *
 * Props:
 *   dreams            – Dream[]
 *   onAddDream        – (dream) => void
 *   onUpdateDream     – (dream) => void
 *   onDeleteDream     – (id) => void
 *   onConvertToEvent  – (dream) => void
 *   onConvertToTrip   – (dream) => void
 *   onUploadImage     – (dreamId, file) => Promise<string>
 *   currentUser       – { id, name }
 *   darkMode          – boolean
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

const CAVEAT = '"Caveat", cursive';

const SAMPLE_PINS = [
  { id: '1', type: 'photo', x: 18,  y: 70,  rot: -2.5, label: 'Trek in Patagonia',       emoji: '🏔️', imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80', pinColor: 'teal',   categoryId: 'places',      status: 'dreaming' },
  { id: '2', type: 'photo', x: 175, y: 52,  rot:  2.1, label: 'A week in Japan',          emoji: '🗾', imageUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&q=80', pinColor: 'purple', categoryId: 'places',      status: 'planning' },
  { id: '3', type: 'note',  x: 318, y: 64,  rot: -1.2, text: 'Cherry blossom April 2026 — book flights NOW!!', noteColor: 'yellow', pinColor: 'amber',  categoryId: 'places',      status: 'planning' },
  { id: '4', type: 'photo', x: 18,  y: 272, rot:  1.8, label: 'See the Northern Lights',  emoji: '🌌', imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80', pinColor: 'purple', categoryId: 'places',      status: 'dreaming' },
  { id: '5', type: 'photo', x: 188, y: 260, rot: -1.5, label: 'Try omakase in LA',         emoji: '🍣', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80', pinColor: 'teal',   categoryId: 'food',        status: 'dreaming' },
  { id: '6', type: 'note',  x: 18,  y: 472, rot:  2.2, text: 'Learn to surf this summer — Santa Cruz?', noteColor: 'pink',   pinColor: 'pink',   categoryId: 'experiences', status: 'dreaming' },
  { id: '7', type: 'photo', x: 185, y: 462, rot: -2.0, label: 'Road trip down PCH',        emoji: '🚗', imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80', pinColor: 'teal',   categoryId: 'places',      status: 'planning' },
  { id: '8', type: 'note',  x: 328, y: 300, rot: -0.8, text: 'Get a Vitamix — wait for Black Friday sale', noteColor: 'blue',   pinColor: 'purple', categoryId: 'buy',         status: 'dreaming' },
  { id: '9',  type: 'photo',   x: 325, y: 460, rot:  1.5, label: 'Redecorate living room', emoji: '🛋️', imageUrl: '', pinColor: 'amber', categoryId: 'home', status: 'planning' },
  { id: '10', type: 'label',   x: 318, y: 62,  rot: -1.8, text: 'MOVIES',      fontStyle: 'bold',        fontSize: 'large',  textColor: '#7c3aed', styleVariant: 'highlight' },
  { id: '11', type: 'label',   x: 18,  y: 390, rot:  1.4, text: 'My Wishlist', fontStyle: 'handwritten', fontSize: 'medium', textColor: '#0d9488', styleVariant: 'tape' },
  { id: '12', type: 'sticker', x: 290, y: 192, rot:  11,  sticker: '⭐', size: 'medium' },
  { id: '13', type: 'sticker', x: 150, y: 370, rot: -7,   sticker: '🌸', size: 'large' },
];

const NOTE_COLORS = {
  yellow: { light: { bg: '#fef9c3', fold: '#fde047', text: '#713f12' }, dark: { bg: '#2d2a0a', fold: '#854d0e', text: '#fef08a' } },
  pink:   { light: { bg: '#fce7f3', fold: '#f9a8d4', text: '#831843' }, dark: { bg: '#2d0a1e', fold: '#9d174d', text: '#fbcfe8' } },
  blue:   { light: { bg: '#dbeafe', fold: '#93c5fd', text: '#1e3a8a' }, dark: { bg: '#0a1628', fold: '#1d4ed8', text: '#bfdbfe' } },
  green:  { light: { bg: '#dcfce7', fold: '#86efac', text: '#14532d' }, dark: { bg: '#0a2010', fold: '#15803d', text: '#bbf7d0' } },
};

const PIN_COLORS = {
  teal:   { light: '#0d9488', dark: '#2dd4bf' },
  purple: { light: '#7c3aed', dark: '#c084fc' },
  pink:   { light: '#db2777', dark: '#f472b6' },
  amber:  { light: '#d97706', dark: '#fbbf24' },
  red:    { light: '#dc2626', dark: '#f87171' },
};

const CATEGORY_FILTERS = [
  { id: 'all',         label: 'All',          emoji: '✦' },
  { id: 'places',      label: 'Places',       emoji: '🌍' },
  { id: 'food',        label: 'Food',         emoji: '🍜' },
  { id: 'experiences', label: 'Experiences',  emoji: '✨' },
  { id: 'home',        label: 'Home',         emoji: '🏡' },
  { id: 'buy',         label: 'Things to buy',emoji: '🛍️' },
];

const NOTE_COLOR_OPTIONS = ['yellow', 'pink', 'blue', 'green'];
const PIN_COLOR_OPTIONS   = ['teal', 'purple', 'pink', 'amber', 'red'];

const STICKERS = ['✈️','🍣','🎬','🎲','❤️','⭐','🌸','🏔️','🏡','🛍️','🍜','🚗','🍕','🎵','📚','🌊','🏄','🌮','☕','🍷','🎪','🌙','🌈','🎭'];
const LABEL_COLORS = ['#1a1a2e','#ffffff','#0d9488','#7c3aed','#d97706','#db2777','#2563eb','#065f46'];

// ─── Pushpin SVG ─────────────────────────────────────────────────────────────
function Pushpin({ colorKey, darkMode }) {
  const col = (PIN_COLORS[colorKey] || PIN_COLORS.teal)[darkMode ? 'dark' : 'light'];
  return (
    <div style={{
      position: 'absolute', top: -11, left: '50%',
      transform: 'translateX(-50%)', zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        background: col,
        boxShadow: `0 2px 6px ${col}55, inset 0 -1px 2px rgba(0,0,0,0.2)`,
        border: darkMode ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.6)',
      }} />
      <div style={{ width: 2.5, height: 9, background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', borderRadius: '0 0 2px 2px', marginTop: -1 }} />
    </div>
  );
}

// ─── PhotoPin ────────────────────────────────────────────────────────────────
function PhotoPin({ pin, isDragging, onDelete, onTap, darkMode }) {
  // Polaroids are always white/off-white regardless of dark mode — matches home page style
  const cardBg  = darkMode ? '#e2e8f0' : '#ffffff';
  const labelCol = '#374151';
  const shadow  = isDragging
    ? '0 20px 50px rgba(0,0,0,0.5)'
    : '3px 5px 16px rgba(0,0,0,0.22)';

  return (
    <div
      style={{ background: cardBg, padding: '6px 6px 0', boxShadow: shadow, width: 150, borderRadius: 2, cursor: isDragging ? 'grabbing' : 'grab', position: 'relative', transition: isDragging ? 'none' : 'box-shadow 0.2s' }}
      onClick={onTap}
    >
      <Pushpin colorKey={pin.pinColor} darkMode={darkMode} />
      {/* Square image area */}
      <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 2 }}>
        {pin.imageUrl ? (
          <img src={pin.imageUrl} alt={pin.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} draggable={false} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            {pin.emoji || '📌'}
          </div>
        )}
      </div>
      {/* Caption strip — emoji + label, handwritten font */}
      <div style={{ padding: '6px 2px 7px', textAlign: 'center' }}>
        <div style={{ fontFamily: CAVEAT, fontSize: 12, color: labelCol, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {pin.emoji ? `${pin.emoji} ${pin.label}` : pin.label}
        </div>
      </div>
      {pin.status === 'planning' && (
        <div style={{ position: 'absolute', top: 5, right: 5, background: '#fef3c7', color: '#92400e', fontSize: 8, fontWeight: 700, padding: '2px 4px', borderRadius: 4, letterSpacing: '0.05em' }}>PLANNING</div>
      )}
      {pin.status === 'done' && (
        <div style={{ position: 'absolute', top: 5, right: 5, background: '#d1fae5', color: '#065f46', fontSize: 8, fontWeight: 700, padding: '2px 4px', borderRadius: 4 }}>DONE ✓</div>
      )}
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.10)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#6b7280', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── NotePin ─────────────────────────────────────────────────────────────────
function NotePin({ pin, isDragging, onDelete, onTap, darkMode }) {
  const scheme = (NOTE_COLORS[pin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'];
  const shadow = isDragging
    ? '0 20px 50px rgba(0,0,0,0.5)'
    : darkMode ? '3px 4px 16px rgba(0,0,0,0.5)' : '3px 4px 12px rgba(0,0,0,0.15)';

  return (
    <div
      style={{ background: scheme.bg, padding: '13px 13px 14px', boxShadow: shadow, width: 148, minHeight: 108, position: 'relative', cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'box-shadow 0.2s' }}
      onClick={onTap}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, borderWidth: '0 20px 20px 0', borderStyle: 'solid', borderColor: `transparent ${scheme.fold} transparent transparent` }} />
      <Pushpin colorKey={pin.pinColor} darkMode={darkMode} />
      <p style={{ fontFamily: CAVEAT, fontSize: 15, color: scheme.text, lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>{pin.text}</p>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', bottom: 5, right: 7, background: 'none', border: 'none', fontSize: 10, color: scheme.fold, cursor: 'pointer', padding: 0 }}>✕</button>
    </div>
  );
}

// ─── LabelPin ────────────────────────────────────────────────────────────────
function LabelPin({ pin, isDragging, onDelete, darkMode }) {
  const sizes  = { small: 17, medium: 24, large: 32 };
  const fs     = sizes[pin.fontSize] || 24;
  const ff     = pin.fontStyle === 'clean' ? 'system-ui, sans-serif' : CAVEAT;
  const fw     = pin.fontStyle === 'bold' ? 700 : 400;
  const color  = pin.textColor || (darkMode ? '#e8eaf0' : '#1a1a2e');

  let wrapStyle = {
    position: 'relative', display: 'inline-block',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none', whiteSpace: 'nowrap',
    padding: '4px 10px',
    transition: isDragging ? 'none' : 'box-shadow 0.2s',
  };

  if (pin.styleVariant === 'highlight') {
    wrapStyle = { ...wrapStyle, borderBottom: `3px solid ${color}`, background: `${color}22`, borderRadius: '4px 4px 0 0', padding: '5px 10px 3px' };
  } else if (pin.styleVariant === 'tape') {
    wrapStyle = { ...wrapStyle, background: darkMode ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.84)', boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.14)', borderRadius: 3, padding: '6px 16px' };
  }

  return (
    <div style={wrapStyle}>
      <span style={{ fontFamily: ff, fontWeight: fw, fontSize: fs, color, lineHeight: 1.2, display: 'block' }}>
        {pin.text}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(0,0,0,0.22)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
      >✕</button>
    </div>
  );
}

// ─── StickerPin ───────────────────────────────────────────────────────────────
function StickerPin({ pin, isDragging, onDelete }) {
  const sizes = { small: 32, medium: 46, large: 62 };
  const fs    = sizes[pin.size] || 46;

  return (
    <div style={{ position: 'relative', display: 'inline-block', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}>
      <span style={{ fontSize: fs, display: 'block', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.22))' }}>
        {pin.sticker}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
      >✕</button>
    </div>
  );
}

// ─── Add Sheet ────────────────────────────────────────────────────────────────
function AddSheet({ onClose, onAdd, darkMode }) {
  const [type, setType]               = useState('photo');
  // photo fields
  const [label, setLabel]             = useState('');
  const [emoji, setEmoji]             = useState('✨');
  const [imageUrl, setUrl]            = useState('');
  // note fields
  const [text, setText]               = useState('');
  const [noteColor, setNoteColor]     = useState('yellow');
  // shared photo/note fields
  const [pinColor, setPinColor]       = useState('teal');
  const [catId, setCatId]             = useState('experiences');
  // label fields
  const [labelText, setLabelText]     = useState('');
  const [fontStyle, setFontStyle]     = useState('handwritten');
  const [fontSize, setFontSize]       = useState('medium');
  const [textColor, setTextColor]     = useState(darkMode ? '#e8eaf0' : '#1a1a2e');
  const [styleVariant, setStyleVar]   = useState('plain');
  // sticker fields
  const [sticker, setSticker]         = useState('⭐');
  const [stickerSize, setStickerSize] = useState('medium');

  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const inputBg  = darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#4a5568' : '#9ca3af';
  const divider  = darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4';
  const inputStyle = { background: inputBg, border: `1px solid ${inputBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 16, color: tp, outline: 'none', width: '100%' };

  function pillStyle(active) {
    return { flex: 1, padding: '7px 4px', borderRadius: 12, border: `1px solid ${active ? '#2dd4bf' : inputBdr}`, background: active ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', color: active ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' };
  }

  function submit() {
    if (type === 'photo'   && !label.trim())     return;
    if (type === 'note'    && !text.trim())       return;
    if (type === 'label'   && !labelText.trim())  return;
    let data = { type, status: 'dreaming' };
    if (type === 'photo')   data = { ...data, label: label.trim(), emoji, pinColor, categoryId: catId, imageUrl };
    if (type === 'note')    data = { ...data, text: text.trim(), noteColor, pinColor, categoryId: catId };
    if (type === 'label')   data = { ...data, text: labelText.trim(), fontStyle, fontSize, textColor, styleVariant };
    if (type === 'sticker') data = { ...data, sticker, size: stickerSize };
    onAdd(data);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '20px 18px max(44px, calc(env(safe-area-inset-bottom) + 44px))', width: '100%', maxWidth: 480, margin: '0 auto', borderTop: `1px solid ${divider}`, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 18px' }} />
        <p style={{ fontFamily: CAVEAT, fontSize: 24, fontWeight: 700, color: tp, marginBottom: 16 }}>Pin something new</p>

        {/* Type selector — 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[['photo','📸','Photo / emoji'],['note','📝','Quick note'],['label','🏷️','Label'],['sticker','✦','Sticker']].map(([t, ic, lbl]) => (
            <button key={t} onClick={() => setType(t)} style={{ padding: '9px 6px', borderRadius: 14, border: `1px solid ${type === t ? '#2dd4bf' : inputBdr}`, background: type === t ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', color: type === t ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>
              {ic} {lbl}
            </button>
          ))}
        </div>

        {/* ── Photo fields ── */}
        {type === 'photo' && (
          <>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Visit Boston)" style={{ ...inputStyle, marginBottom: 10 }} />
            {/* Photo source */}
            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Photo</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setUrl(ev.target.result); r.readAsDataURL(f); }; i.click(); }}
                style={{ flex: 1, padding: '9px 6px', borderRadius: 12, border: `1px solid ${inputBdr}`, background: 'transparent', color: ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}
              >📁 Upload photo</button>
              <button
                onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.capture='environment'; i.onchange=e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setUrl(ev.target.result); r.readAsDataURL(f); }; i.click(); }}
                style={{ flex: 1, padding: '9px 6px', borderRadius: 12, border: `1px solid ${inputBdr}`, background: 'transparent', color: ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}
              >📷 Take photo</button>
            </div>
            {imageUrl && imageUrl.startsWith('data:') && (
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <img src={imageUrl} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }} />
                <button onClick={() => setUrl('')} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}
            <input value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={e => setUrl(e.target.value)} placeholder="or paste image URL (optional)" style={{ ...inputStyle, marginBottom: 12 }} />
            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Emoji</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
              {['✨','🌍','🍜','🏔️','🚗','🏡','🎬','🎲','🛍️','🌊','🏄','🎵','📚','🍣','🌸','✈️','🍕','🎪','🌮','☕','🍷','🌙','🌈','🎭'].map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${emoji === e ? '#2dd4bf' : inputBdr}`, background: emoji === e ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', fontSize: 18, cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
          </>
        )}

        {/* ── Note fields ── */}
        {type === 'note' && (
          <>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your mind?" rows={3} style={{ ...inputStyle, resize: 'none', marginBottom: 12 }} />
            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Note colour</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {NOTE_COLOR_OPTIONS.map(k => {
                const c = NOTE_COLORS[k][darkMode ? 'dark' : 'light'];
                return <button key={k} onClick={() => setNoteColor(k)} style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, border: noteColor === k ? `2px solid #2dd4bf` : `1px solid ${c.fold}33`, cursor: 'pointer' }} />;
              })}
            </div>
          </>
        )}

        {/* ── Label fields ── */}
        {type === 'label' && (
          <>
            <input value={labelText} onChange={e => setLabelText(e.target.value)} placeholder="MOVIES · My Wishlist · This Summer" style={{ ...inputStyle, marginBottom: 12 }} />

            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Style</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['plain','Plain'],['highlight','Highlight'],['tape','Tape']].map(([v, lbl]) => (
                <button key={v} onClick={() => setStyleVar(v)} style={pillStyle(styleVariant === v)}>{lbl}</button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Font</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['handwritten','Caveat'],['clean','Clean'],['bold','Bold']].map(([v, lbl]) => (
                <button key={v} onClick={() => setFontStyle(v)} style={{ ...pillStyle(fontStyle === v), fontFamily: v === 'handwritten' ? CAVEAT : 'system-ui', fontWeight: v === 'bold' ? 700 : 400 }}>{lbl}</button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Size</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['small','Small'],['medium','Medium'],['large','Large']].map(([v, lbl]) => (
                <button key={v} onClick={() => setFontSize(v)} style={pillStyle(fontSize === v)}>{lbl}</button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Colour</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {LABEL_COLORS.map(c => (
                <button key={c} onClick={() => setTextColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: textColor === c ? '2px solid #2dd4bf' : c === '#ffffff' ? `1px solid ${inputBdr}` : '2px solid transparent', outline: textColor === c ? `2px solid ${c}55` : 'none', cursor: 'pointer' }} />
              ))}
            </div>
          </>
        )}

        {/* ── Sticker fields ── */}
        {type === 'sticker' && (
          <>
            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pick a sticker</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
              {STICKERS.map(s => (
                <button key={s} onClick={() => setSticker(s)} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${sticker === s ? '#2dd4bf' : inputBdr}`, background: sticker === s ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', fontSize: 22, cursor: 'pointer' }}>{s}</button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Size</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['small','Small'],['medium','Medium'],['large','Large']].map(([v, lbl]) => (
                <button key={v} onClick={() => setStickerSize(v)} style={pillStyle(stickerSize === v)}>{lbl}</button>
              ))}
            </div>
          </>
        )}

        {/* Category + pin colour — only for photo/note */}
        {(type === 'photo' || type === 'note') && (
          <>
            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {CATEGORY_FILTERS.filter(c => c.id !== 'all').map(c => (
                <button key={c.id} onClick={() => setCatId(c.id)} style={{ padding: '5px 11px', borderRadius: 20, border: `1px solid ${catId === c.id ? '#2dd4bf' : inputBdr}`, background: catId === c.id ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', fontFamily: CAVEAT, fontSize: 14, color: catId === c.id ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, cursor: 'pointer' }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pin colour</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
              {PIN_COLOR_OPTIONS.map(k => {
                const col = PIN_COLORS[k][darkMode ? 'dark' : 'light'];
                return <button key={k} onClick={() => setPinColor(k)} style={{ width: 24, height: 24, borderRadius: '50%', background: col, border: pinColor === k ? '2px solid white' : '2px solid transparent', outline: pinColor === k ? `2px solid ${col}` : 'none', cursor: 'pointer' }} />;
              })}
            </div>
          </>
        )}

        <button onClick={submit} style={{ width: '100%', padding: '13px', borderRadius: 16, background: '#2dd4bf', color: '#0a1020', border: 'none', fontFamily: CAVEAT, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>
          Pin it 📌
        </button>
      </div>
    </div>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────
function DetailSheet({ pin, onClose, onConvertToEvent, onConvertToTrip, onMarkDone, onSetHero, heroId, darkMode }) {
  const sheetBg = darkMode ? '#131c2e' : '#ffffff';
  const tp      = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts      = darkMode ? '#4a5568' : '#9ca3af';
  const divider = darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4';
  const secBg   = darkMode ? 'rgba(255,255,255,0.04)' : '#f8f7f2';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '20px 18px max(128px, calc(env(safe-area-inset-bottom) + 128px))', width: '100%', maxWidth: 480, margin: '0 auto', borderTop: `1px solid ${divider}` }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 16px' }} />

        {pin.type === 'photo' && pin.imageUrl && (
          <img src={pin.imageUrl} alt={pin.label} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 16, marginBottom: 14 }} />
        )}

        <p style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, marginBottom: 4, lineHeight: 1.2 }}>
          {!pin.imageUrl && pin.emoji ? `${pin.emoji} ` : ''}{pin.label || pin.text}
        </p>

        {pin.type === 'note' && (
          <div style={{ background: (NOTE_COLORS[pin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'].bg, borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontFamily: CAVEAT, fontSize: 16, color: (NOTE_COLORS[pin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'].text, margin: 0, lineHeight: 1.5 }}>{pin.text}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          {pin.status !== 'done' && (
            <>
              <button onClick={() => { onConvertToEvent?.(pin); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb', color: darkMode ? '#2dd4bf' : '#0d9488', border: `1px solid ${darkMode ? 'rgba(45,212,191,0.2)' : '#99f6e4'}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
                📅 Make it an event
              </button>
              <button onClick={() => { onConvertToTrip?.(pin); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: darkMode ? 'rgba(192,132,252,0.1)' : '#faf5ff', color: darkMode ? '#c084fc' : '#7c3aed', border: `1px solid ${darkMode ? 'rgba(192,132,252,0.2)' : '#e9d5ff'}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
                ✈️ Plan a trip
              </button>
            </>
          )}
          <button onClick={() => { onMarkDone?.(pin); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: pin.status === 'done' ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : secBg, color: pin.status === 'done' ? (darkMode ? '#2dd4bf' : '#0d9488') : (darkMode ? '#cbd5e1' : ts), border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : '#e5e0d5'}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
            {pin.status === 'done' ? '✓ Done!' : 'Mark done'}
          </button>
          <button onClick={() => { onSetHero?.(pin.id === heroId ? null : pin.id); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: pin.id === heroId ? (darkMode ? 'rgba(251,191,36,0.12)' : '#fffbeb') : secBg, color: pin.id === heroId ? (darkMode ? '#fbbf24' : '#92400e') : (darkMode ? '#cbd5e1' : ts), border: `1px solid ${pin.id === heroId ? (darkMode ? 'rgba(251,191,36,0.3)' : '#fde68a') : (darkMode ? 'rgba(255,255,255,0.12)' : '#e5e0d5')}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
            {pin.id === heroId ? '★ Remove focus' : '☆ Set as focus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grid layout helper ───────────────────────────────────────────────────────
// Places pins in a staggered 2-column layout with small random jitter.
function gridPosition(index) {
  const col = index % 2;
  const row = Math.floor(index / 2);
  const jx  = (Math.random() - 0.5) * 14;
  const jy  = (Math.random() - 0.5) * 14;
  return {
    x:   (col === 0 ? 16 : 208) + jx,
    y:   64 + row * 240 + jy,
    rot: (col === 0 ? -1 : 1) * (0.4 + Math.random() * 2.2),
  };
}

// ─── Main SomedayPage ─────────────────────────────────────────────────────────
const SomedayPage = ({
  dreams = SAMPLE_PINS,
  onAddDream,
  onUpdateDream,
  onDeleteDream,
  onConvertToEvent,
  onConvertToTrip,
  onBack,
  currentUser,
  ownerName,
  darkMode = false,
}) => {
  const [pins, setPins]           = useState(() => dreams.map((d, idx) => {
    const pos = (d.x == null || d.y == null) ? gridPosition(idx) : { x: d.x, y: d.y, rot: d.rot };
    return {
      ...d,
      ...pos,
      rot:       pos.rot       ?? d.rot ?? (Math.random() * 6 - 3),
      pinColor:  d.pinColor  ?? PIN_COLOR_OPTIONS[Math.floor(Math.random() * PIN_COLOR_OPTIONS.length)],
      noteColor: d.noteColor ?? 'yellow',
      type:      d.type      ?? (d.imageUrl || d.emoji ? 'photo' : 'note'),
    };
  }));
  const [filter, setFilter]       = useState('all');
  const [showAdd, setShowAdd]     = useState(false);
  const [detailPin, setDetailPin] = useState(null);
  const [dragging, setDragging]   = useState(null);
  const [heroId, setHeroId]       = useState(() => { try { return localStorage.getItem('someday-hero-id') || null; } catch { return null; } });
  const dragOffset                = useRef({ x: 0, y: 0 });
  const canvasRef                 = useRef();
  const didDrag                   = useRef(false);
  const draggingTypeRef           = useRef(null); // tracks pin type during drag for bound adjustments

  useEffect(() => {
    try { if (heroId) localStorage.setItem('someday-hero-id', heroId); else localStorage.removeItem('someday-hero-id'); } catch {}
  }, [heroId]);

  // Sync new items added externally (from home page bucket list / quick notes)
  useEffect(() => {
    setPins(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const toAdd = (Array.isArray(dreams) ? dreams : []).filter(d => !existingIds.has(d.id));
      if (!toAdd.length) return prev;
      const newPins = toAdd.map((d, i) => {
        const pos = (d.x == null || d.y == null) ? gridPosition(prev.length + i) : { x: d.x, y: d.y, rot: d.rot };
        return {
          ...d,
          ...pos,
          rot:       pos.rot       ?? d.rot ?? (Math.random() * 6 - 3),
          pinColor:  d.pinColor  ?? PIN_COLOR_OPTIONS[Math.floor(Math.random() * PIN_COLOR_OPTIONS.length)],
          noteColor: d.noteColor ?? 'yellow',
          type:      d.type      ?? (d.imageUrl || d.emoji ? 'photo' : 'note'),
        };
      });
      return [...prev, ...newPins];
    });
  }, [dreams]);

  const pageBg   = darkMode ? '#0e1520' : '#faf8f3';
  const topbarBg = darkMode ? '#131c2e' : '#ffffff';
  const topBdr   = darkMode ? 'rgba(255,255,255,0.05)' : '#e5e0d5';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#4a5568' : '#9ca3af';
  const pillAct  = darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfb';
  const pillActBdr = darkMode ? 'rgba(45,212,191,0.3)' : '#2dd4bf';
  const pillActTxt = darkMode ? '#2dd4bf' : '#0d9488';
  const pillIdle   = darkMode ? 'rgba(255,255,255,0.04)' : '#f5f3ee';
  const pillIdleBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';

  // Board background: subtle dot grid instead of cork
  const boardBg = darkMode
    ? { backgroundColor: '#0e1520', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }
    : { backgroundColor: '#f5f2eb', backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' };

  const visiblePins = (filter === 'all' ? pins : pins.filter(p => p.categoryId === filter)).filter(p => p.id !== heroId);
  const displayedPins = filter === 'all'
    ? visiblePins
    : [...visiblePins].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const nudgedPins = filter === 'all'
    ? displayedPins
    : displayedPins.map((pin, index) => ({
        ...pin,
        y: Math.max(0, pin.y - (index * 14)),
      }));
  const BOARD_HEIGHT = Math.max(600, Math.ceil(pins.length / 2) * 240 + 240);

  // ─── Drag ──────────────────────────────────────────────────────────────────
  function startDrag(e, id) {
    e.preventDefault();
    e.stopPropagation();
    didDrag.current = false;
    const touch = e.touches?.[0] ?? e;
    const pin = pins.find(p => p.id === id);
    if (!pin) return;
    draggingTypeRef.current = pin.type;
    dragOffset.current = { x: touch.clientX - pin.x, y: touch.clientY - pin.y };
    setDragging(id);
    setPins(ps => {
      const idx = ps.findIndex(p => p.id === id);
      const arr = [...ps];
      const [item] = arr.splice(idx, 1);
      arr.push(item);
      return arr;
    });
  }

  const onMove = useCallback((e) => {
    if (!dragging) return;
    didDrag.current = true;
    const touch = e.touches?.[0] ?? e;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let nx = touch.clientX - dragOffset.current.x;
    let ny = touch.clientY - dragOffset.current.y;
    const isDecor = draggingTypeRef.current === 'label' || draggingTypeRef.current === 'sticker';
    const isSticker = draggingTypeRef.current === 'sticker';
    // Labels/stickers: allow negative y so they can overlap the hero/focus section above the board.
    // Stickers: allow further right since they're much smaller than photo/note cards.
    nx = Math.max(0, Math.min(isSticker ? rect.width - 24 : rect.width - 170, nx));
    ny = Math.max(isDecor ? -320 : 0, Math.min(BOARD_HEIGHT - 240, ny));
    setPins(ps => ps.map(p => p.id === dragging ? { ...p, x: nx, y: ny } : p));
  }, [dragging, BOARD_HEIGHT]);

  const stopDrag = useCallback(() => {
    if (dragging) {
      const pin = pins.find(p => p.id === dragging);
      if (pin) onUpdateDream?.({ ...pin });
    }
    setDragging(null);
  }, [dragging, pins, onUpdateDream]);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [onMove, stopDrag]);

  function addPin(data) {
    const pos = gridPosition(pins.length);
    const newPin = { id: Date.now().toString(), ...pos, ...data };
    setPins(ps => [...ps, newPin]);
    onAddDream?.(newPin);
  }

  function deletePin(id) {
    setPins(ps => ps.filter(p => p.id !== id));
    onDeleteDream?.(id);
  }

  function markDone(pin) {
    const updated = { ...pin, status: pin.status === 'done' ? 'dreaming' : 'done' };
    setPins(ps => ps.map(p => p.id === pin.id ? updated : p));
    onUpdateDream?.(updated);
  }

  function handlePinClick(pin) {
    if (didDrag.current) return;
    // Labels and stickers are decorative — no detail sheet, just drag/delete
    if (pin.type === 'label' || pin.type === 'sticker') return;
    setDetailPin(pin);
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 'max(100px, calc(env(safe-area-inset-bottom) + 100px))' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>

      {/* Sticky top bar — matches ExplorePage */}
      <div style={{ background: topbarBg, borderBottom: `1px solid ${topBdr}`, padding: '18px 16px 12px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ts, fontSize: 26, lineHeight: 1, padding: '0 4px', display: 'flex', alignItems: 'center' }}>‹</button>
            )}
            <div>
              <h1 style={{ fontFamily: CAVEAT, fontSize: 34, fontWeight: 700, color: tp, margin: 0, lineHeight: 1 }}>
              {(!ownerName || ownerName === currentUser) ? '✦ Your Someday' : `${ownerName}'s Someday`}
            </h1>
              <p style={{ fontSize: 11, color: ts, margin: '3px 0 0', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>
                {pins.filter(p => p.type !== 'label' && p.type !== 'sticker').length} things pinned
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ width: 42, height: 42, borderRadius: '50%', background: '#2dd4bf', border: 'none', color: '#0a1020', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(45,212,191,0.4)', fontWeight: 700 }}
          >+</button>
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {CATEGORY_FILTERS.map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)} style={{ flexShrink: 0, padding: '5px 13px', borderRadius: 20, background: filter === c.id ? pillAct : pillIdle, border: `1px solid ${filter === c.id ? pillActBdr : pillIdleBdr}`, color: filter === c.id ? pillActTxt : ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero pin */}
      {(() => {
        const heroPin = heroId ? pins.find(p => p.id === heroId) : null;
        if (!heroPin) return null;
        const isNote = heroPin.type === 'note';
        const noteScheme = isNote ? (NOTE_COLORS[heroPin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'] : null;
        return (
          <div style={{ padding: '20px 16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: 10, color: darkMode ? '#fbbf24' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, fontWeight: 700 }}>★ Focus</p>
            <div
              onClick={() => setDetailPin(heroPin)}
              style={{ cursor: 'pointer', transform: `rotate(${(heroPin.rot ?? 0) * 0.3}deg)`, transition: 'transform 0.2s' }}
            >
              {isNote ? (
                <div style={{ background: noteScheme.bg, padding: '18px 18px 20px', boxShadow: '0 10px 36px rgba(0,0,0,0.18)', width: 240, minHeight: 120, position: 'relative', borderRadius: 2 }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, borderWidth: '0 26px 26px 0', borderStyle: 'solid', borderColor: `transparent ${noteScheme.fold} transparent transparent` }} />
                  <Pushpin colorKey={heroPin.pinColor} darkMode={darkMode} />
                  <p style={{ fontFamily: CAVEAT, fontSize: 19, color: noteScheme.text, lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>{heroPin.text}</p>
                </div>
              ) : (
                <div style={{ background: darkMode ? '#e2e8f0' : '#ffffff', padding: '8px 8px 0', borderRadius: 3, boxShadow: '0 10px 36px rgba(0,0,0,0.18)', width: 220, position: 'relative' }}>
                  <Pushpin colorKey={heroPin.pinColor} darkMode={darkMode} />
                  <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 2 }}>
                    {heroPin.imageUrl ? (
                      <img src={heroPin.imageUrl} alt={heroPin.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                        {heroPin.emoji || '📌'}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '8px 4px 10px', textAlign: 'center' }}>
                    <div style={{ fontFamily: CAVEAT, fontSize: 16, color: '#374151', lineHeight: 1.3 }}>
                      {heroPin.emoji ? `${heroPin.emoji} ${heroPin.label || heroPin.text}` : (heroPin.label || heroPin.text)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Pin board */}
      <div ref={canvasRef} style={{ ...boardBg, position: 'relative', zIndex: 1, width: '100%', height: BOARD_HEIGHT, overflowX: 'hidden', touchAction: dragging ? 'none' : 'pan-y' }}>

        {nudgedPins.map(pin => (
          <div
            key={pin.id}
            style={{
              position: 'absolute',
              left: pin.x, top: pin.y,
              transform: `rotate(${pin.rot}deg)${dragging === pin.id ? ' scale(1.06)' : ''}`,
              zIndex: dragging === pin.id ? 50 : (pin.type === 'label' || pin.type === 'sticker') ? 10 : 2,
              userSelect: 'none',
              transition: dragging === pin.id ? 'none' : 'transform 0.15s',
              touchAction: 'none',
              filter: dragging === pin.id
                ? darkMode ? 'drop-shadow(0 16px 32px rgba(0,0,0,0.7))' : 'drop-shadow(0 16px 32px rgba(0,0,0,0.3))'
                : 'none',
            }}
            onMouseDown={e => startDrag(e, pin.id)}
            onTouchStart={e => startDrag(e, pin.id)}
          >
            {pin.type === 'note'
              ? <NotePin    pin={pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} onTap={() => handlePinClick(pin)} darkMode={darkMode} />
              : pin.type === 'label'
              ? <LabelPin   pin={pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} darkMode={darkMode} />
              : pin.type === 'sticker'
              ? <StickerPin pin={pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} />
              : <PhotoPin   pin={pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} onTap={() => handlePinClick(pin)} darkMode={darkMode} />
            }
          </div>
        ))}

        {displayedPins.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <p style={{ fontFamily: CAVEAT, fontSize: 22, color: ts, fontStyle: 'italic' }}>Nothing pinned here yet</p>
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', borderRadius: 16, border: `2px dashed ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: ts, fontFamily: CAVEAT, fontSize: 18, cursor: 'pointer' }}>
              + Pin something
            </button>
          </div>
        )}
      </div>

      {showAdd && <AddSheet onClose={() => setShowAdd(false)} onAdd={addPin} darkMode={darkMode} />}
      {detailPin && <DetailSheet pin={detailPin} onClose={() => setDetailPin(null)} onConvertToEvent={onConvertToEvent} onConvertToTrip={onConvertToTrip} onMarkDone={markDone} heroId={heroId} onSetHero={setHeroId} darkMode={darkMode} />}
    </div>
  );
};

export default SomedayPage;
