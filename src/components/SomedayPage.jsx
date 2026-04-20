/**
 * SomedayPage.jsx — Komo Book with chapters
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const CAVEAT = '"Caveat", cursive';

const SAMPLE_PINS = [
  { id: '1', type: 'photo', x: 18,  y: 70,  rot: -2.5, label: 'Trek in Patagonia',      emoji: '🏔️', imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80', pinColor: 'teal',   categoryId: 'places',      status: 'dreaming' },
  { id: '2', type: 'photo', x: 175, y: 52,  rot:  2.1, label: 'A week in Japan',         emoji: '🗾', imageUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&q=80', pinColor: 'purple', categoryId: 'places',      status: 'planning' },
  { id: '3', type: 'note',  x: 318, y: 64,  rot: -1.2, text: 'Cherry blossom April 2026 — book flights NOW!!', noteColor: 'yellow', pinColor: 'amber', categoryId: 'places', status: 'planning' },
  { id: '4', type: 'photo', x: 18,  y: 272, rot:  1.8, label: 'See the Northern Lights', emoji: '🌌', imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80', pinColor: 'purple', categoryId: 'places',      status: 'dreaming' },
  { id: '5', type: 'photo', x: 188, y: 260, rot: -1.5, label: 'Try omakase in LA',        emoji: '🍣', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80', pinColor: 'teal',   categoryId: 'food',        status: 'dreaming' },
  { id: '6', type: 'note',  x: 18,  y: 472, rot:  2.2, text: 'Learn to surf this summer — Santa Cruz?', noteColor: 'pink', pinColor: 'pink', categoryId: 'experiences', status: 'dreaming' },
  { id: '7', type: 'photo', x: 185, y: 462, rot: -2.0, label: 'Road trip down PCH',       emoji: '🚗', imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80', pinColor: 'teal',   categoryId: 'places',      status: 'planning' },
  { id: '8', type: 'note',  x: 328, y: 300, rot: -0.8, text: 'Get a Vitamix — wait for Black Friday sale', noteColor: 'blue', pinColor: 'purple', categoryId: 'buy', status: 'dreaming' },
  { id: '9',  type: 'photo',   x: 325, y: 460, rot: 1.5, label: 'Redecorate living room', emoji: '🛋️', imageUrl: '', pinColor: 'amber', categoryId: 'home', status: 'planning' },
  { id: '10', type: 'label',   x: 318, y: 62,  rot: -1.8, text: 'MOVIES',      fontStyle: 'bold',        fontSize: 'large',  textColor: '#7c3aed', styleVariant: 'highlight' },
  { id: '11', type: 'label',   x: 18,  y: 390, rot:  1.4, text: 'My Wishlist', fontStyle: 'handwritten', fontSize: 'medium', textColor: '#0d9488', styleVariant: 'tape' },
  { id: '12', type: 'sticker', x: 290, y: 192, rot: 11,   sticker: '⭐', size: 'medium' },
  { id: '13', type: 'sticker', x: 150, y: 370, rot: -7,   sticker: '🌸', size: 'large' },
];

const NOTE_COLORS = {
  yellow: { light: { bg: '#fef9c3', fold: '#fde047', text: '#713f12' }, dark: { bg: '#2d2a0a', fold: '#854d0e', text: '#fef08a' } },
  pink:   { light: { bg: '#fce7f3', fold: '#f9a8d4', text: '#831843' }, dark: { bg: '#2d0a1e', fold: '#9d174d', text: '#fbcfe8' } },
  blue:   { light: { bg: '#dbeafe', fold: '#93c5fd', text: '#1e3a8a' }, dark: { bg: '#0a1628', fold: '#1d4ed8', text: '#bfdbfe' } },
  green:  { light: { bg: '#dcfce7', fold: '#86efac', text: '#14532d' }, dark: { bg: '#0a2010', fold: '#15803d', text: '#bbf7d0' } },
};

function useSwipeDownSheet(onClose) {
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(null);
  const dragDistanceRef = useRef(0);
  const handleStart = (clientY) => { dragStartYRef.current = clientY; dragDistanceRef.current = 0; setDragY(0); };
  const handleMove = (clientY) => {
    if (dragStartYRef.current == null) return;
    const delta = Math.max(0, clientY - dragStartYRef.current);
    dragDistanceRef.current = delta;
    setDragY(delta);
  };
  const handleEnd = () => {
    const shouldClose = dragDistanceRef.current > 90;
    dragStartYRef.current = null; dragDistanceRef.current = 0; setDragY(0);
    if (shouldClose) onClose?.();
  };
  return {
    sheetStyle: { transform: `translateY(${dragY}px)`, transition: dragStartYRef.current ? 'none' : 'transform 180ms ease' },
    handleProps: {
      onTouchStart: (e) => handleStart(e.touches[0].clientY),
      onTouchMove: (e) => handleMove(e.touches[0].clientY),
      onTouchEnd: handleEnd,
      onMouseDown: (e) => handleStart(e.clientY),
      onMouseMove: (e) => { if (dragStartYRef.current == null) return; handleMove(e.clientY); },
      onMouseUp: handleEnd,
      onMouseLeave: () => { if (dragStartYRef.current != null) handleEnd(); },
      style: { touchAction: 'none', cursor: 'grab' },
    },
  };
}

const PIN_COLORS = {
  teal:   { light: '#0d9488', dark: '#2dd4bf' },
  purple: { light: '#7c3aed', dark: '#c084fc' },
  pink:   { light: '#db2777', dark: '#f472b6' },
  amber:  { light: '#d97706', dark: '#fbbf24' },
  red:    { light: '#dc2626', dark: '#f87171' },
};

const CATEGORY_FILTERS = [
  { id: 'all',         label: 'All',           emoji: '✦' },
  { id: 'places',      label: 'Places',        emoji: '🌍' },
  { id: 'food',        label: 'Food',          emoji: '🍜' },
  { id: 'experiences', label: 'Experiences',   emoji: '✨' },
  { id: 'home',        label: 'Home',          emoji: '🏡' },
  { id: 'buy',         label: 'Things to buy', emoji: '🛍️' },
  { id: 'notes',       label: 'Notes',         emoji: '📝' },
  { id: 'done',        label: 'Completed',     emoji: '✓'  },
];

const NOTE_COLOR_OPTIONS = ['yellow', 'pink', 'blue', 'green'];
const PIN_COLOR_OPTIONS   = ['teal', 'purple', 'pink', 'amber', 'red'];
const STICKERS = ['✈️','🍣','🎬','🎲','❤️','⭐','🌸','🏔️','🏡','🛍️','🍜','🚗','🍕','🎵','📚','🌊','🏄','🌮','☕','🍷','🎪','🌙','🌈','🎭'];
const LABEL_COLORS = ['#1a1a2e','#ffffff','#0d9488','#7c3aed','#d97706','#db2777','#2563eb','#065f46'];

// ─── Group detection (for suggestion prompt) ──────────────────────────────────
const THEME_KEYWORDS = {
  japan:    ['japan', 'tokyo', 'kyoto', 'osaka', 'sushi', 'ramen', 'sakura', 'blossom', 'jiro'],
  europe:   ['paris', 'france', 'italy', 'rome', 'barcelona', 'spain', 'london', 'amsterdam'],
  beach:    ['beach', 'surf', 'ocean', 'coast', 'hawaii', 'bali', 'caribbean', 'island', 'santa cruz'],
  food:     ['omakase', 'restaurant', 'dining', 'chef', 'tasting', 'cuisine', 'vitamix', 'brunch'],
  outdoors: ['hike', 'trail', 'camp', 'mountain', 'patagonia', 'northern lights', 'national park', 'trek'],
  road:     ['road trip', 'drive', 'pch', 'route', 'road', 'coast highway'],
  home:     ['redecorate', 'living room', 'kitchen', 'bedroom', 'renovate', 'decor'],
  fitness:  ['yoga', 'climb', 'run', 'gym', 'fitness', 'wellness', 'learn to surf'],
};

const THEME_TITLE_SUGGESTIONS = {
  japan:    'Japan Someday ✈️',
  europe:   'European Adventure 🗺️',
  beach:    'Beach Escape 🌊',
  food:     'Foodie Dreams 🍜',
  outdoors: 'Into the Wild 🏔️',
  road:     'Road Trip 🚗',
  home:     'Home Goals 🏡',
  fitness:  'Get Active 🏄',
};

function detectGroups(pins) {
  const content = pins.filter(p => p.type !== 'label' && p.type !== 'sticker' && p.status !== 'done' && !p.chapterId);
  const groups = [];
  const assigned = new Set();
  Object.entries(THEME_KEYWORDS).forEach(([theme, keywords]) => {
    const matches = content.filter(p => {
      if (assigned.has(p.id)) return false;
      const haystack = `${p.label || ''} ${p.text || ''} ${p.emoji || ''}`.toLowerCase();
      return keywords.some(kw => haystack.includes(kw));
    });
    if (matches.length < 2) return;
    const subset = matches.slice(0, 4);
    subset.forEach(p => assigned.add(p.id));
    groups.push({ id: `group-${theme}`, theme, pinIds: subset.map(p => p.id), suggestedTitle: THEME_TITLE_SUGGESTIONS[theme] || 'New Chapter' });
  });
  return groups;
}

// ─── Chapter cluster layout helper ───────────────────────────────────────────
const CLUSTER_LABEL_H = 64;
const CLUSTER_PHOTO_ROW_H = 224;
const CLUSTER_NOTE_ROW_H  = 168;
const CLUSTER_GAP = 40;

function getChapterClusterY(chapters, targetChapterId, pins) {
  let y = 20;
  for (const ch of chapters) {
    if (ch.id === targetChapterId) return y;
    const chPins = pins.filter(p => p.chapterId === ch.id && p.type !== 'label' && p.type !== 'sticker');
    const rows = Math.ceil(Math.max(chPins.length, 1) / 2);
    const rowH = chPins.some(p => p.type === 'photo') ? CLUSTER_PHOTO_ROW_H : CLUSTER_NOTE_ROW_H;
    y += CLUSTER_LABEL_H + rows * rowH + CLUSTER_GAP;
  }
  return y;
}

function computeChapterLayout(chapters, pins) {
  const layout = {};
  let y = 20;
  chapters.forEach(ch => {
    const chPins = pins.filter(p => p.chapterId === ch.id && p.type !== 'label' && p.type !== 'sticker');
    layout[ch.id] = { labelY: y };
    const rows = Math.ceil(Math.max(chPins.length, 1) / 2);
    const rowH = chPins.some(p => p.type === 'photo') ? CLUSTER_PHOTO_ROW_H : CLUSTER_NOTE_ROW_H;
    y += CLUSTER_LABEL_H + rows * rowH + CLUSTER_GAP;
  });
  return { layout, totalHeight: y };
}

// ─── Pushpin ─────────────────────────────────────────────────────────────────
function Pushpin({ colorKey, darkMode }) {
  const col = (PIN_COLORS[colorKey] || PIN_COLORS.teal)[darkMode ? 'dark' : 'light'];
  return (
    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: col, boxShadow: `0 2px 6px ${col}55, inset 0 -1px 2px rgba(0,0,0,0.2)`, border: darkMode ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.6)' }} />
      <div style={{ width: 2.5, height: 9, background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', borderRadius: '0 0 2px 2px', marginTop: -1 }} />
    </div>
  );
}

// ─── SharpieX ────────────────────────────────────────────────────────────────
function SharpieX({ size = 138 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ position: 'absolute', top: 6, left: 6, pointerEvents: 'none', zIndex: 4 }}>
      <line x1={s*.08} y1={s*.08} x2={s*.92} y2={s*.92} stroke="#c0392b" strokeWidth="7" strokeLinecap="round" opacity="0.88"/>
      <line x1={s*.92} y1={s*.08} x2={s*.08} y2={s*.92} stroke="#c0392b" strokeWidth="6.5" strokeLinecap="round" opacity="0.82"/>
      <line x1={s*.09} y1={s*.06} x2={s*.93} y2={s*.91} stroke="#a93226" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
      <line x1={s*.91} y1={s*.07} x2={s*.07} y2={s*.93} stroke="#a93226" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
    </svg>
  );
}

// ─── PhotoPin ────────────────────────────────────────────────────────────────
function PhotoPin({ pin, isDragging, onDelete, onTap, darkMode, chapterTitle }) {
  const cardBg  = darkMode ? '#e2e8f0' : '#ffffff';
  const labelCol = pin.status === 'done' ? '#9ca3af' : '#374151';
  const shadow  = isDragging ? '0 20px 50px rgba(0,0,0,0.5)' : '3px 5px 16px rgba(0,0,0,0.22)';
  return (
    <div style={{ background: cardBg, padding: '6px 6px 0', boxShadow: shadow, width: 150, borderRadius: 2, cursor: isDragging ? 'grabbing' : 'grab', position: 'relative', transition: isDragging ? 'none' : 'box-shadow 0.2s' }} onClick={onTap}>
      <Pushpin colorKey={pin.pinColor} darkMode={darkMode} />
      <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 2, position: 'relative' }}>
        {pin.imageUrl
          ? <img src={pin.imageUrl} alt={pin.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: pin.status === 'done' ? 'grayscale(40%) brightness(0.85)' : 'none' }} draggable={false} />
          : <div style={{ width: '100%', height: '100%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, filter: pin.status === 'done' ? 'grayscale(40%)' : 'none' }}>{pin.emoji || '📌'}</div>
        }
        {pin.status === 'done' && <SharpieX size={138} />}
      </div>
      <div style={{ padding: '6px 2px 7px', textAlign: 'center' }}>
        <div style={{ fontFamily: CAVEAT, fontSize: 12, color: labelCol, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textDecoration: pin.status === 'done' ? 'line-through' : 'none' }}>
          {pin.emoji ? `${pin.emoji} ${pin.label}` : pin.label}
        </div>
      </div>
      {pin.status === 'planning' && !pin.chapterId && (
        <div style={{ position: 'absolute', top: 5, right: 5, background: '#fef3c7', color: '#92400e', fontSize: 8, fontWeight: 700, padding: '2px 4px', borderRadius: 4, letterSpacing: '0.05em' }}>PLANNING</div>
      )}
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.10)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#6b7280', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── NotePin ─────────────────────────────────────────────────────────────────
function NotePin({ pin, isDragging, onDelete, onTap, darkMode }) {
  const scheme = (NOTE_COLORS[pin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'];
  const shadow = isDragging ? '0 20px 50px rgba(0,0,0,0.5)' : darkMode ? '3px 4px 16px rgba(0,0,0,0.5)' : '3px 4px 12px rgba(0,0,0,0.15)';
  return (
    <div style={{ background: scheme.bg, padding: '13px 13px 14px', boxShadow: shadow, width: 148, minHeight: 108, position: 'relative', cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'box-shadow 0.2s' }} onClick={onTap}>
      <div style={{ position: 'absolute', top: 0, right: 0, borderWidth: '0 20px 20px 0', borderStyle: 'solid', borderColor: `transparent ${scheme.fold} transparent transparent` }} />
      <Pushpin colorKey={pin.pinColor} darkMode={darkMode} />
      <p style={{ fontFamily: CAVEAT, fontSize: 15, color: scheme.text, lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>{pin.text}</p>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', bottom: 5, right: 7, background: 'none', border: 'none', fontSize: 10, color: scheme.fold, cursor: 'pointer', padding: 0 }}>✕</button>
    </div>
  );
}

// ─── LabelPin ────────────────────────────────────────────────────────────────
function LabelPin({ pin, isDragging, onDelete, darkMode }) {
  const sizes = { small: 17, medium: 24, large: 32 };
  const fs    = sizes[pin.fontSize] || 24;
  const ff    = pin.fontStyle === 'clean' ? 'system-ui, sans-serif' : CAVEAT;
  const fw    = pin.fontStyle === 'bold' ? 700 : 400;
  const color = pin.textColor || (darkMode ? '#e8eaf0' : '#1a1a2e');
  let wrapStyle = { position: 'relative', display: 'inline-block', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', whiteSpace: 'nowrap', padding: '4px 10px', transition: isDragging ? 'none' : 'box-shadow 0.2s' };
  if (pin.styleVariant === 'highlight') wrapStyle = { ...wrapStyle, borderBottom: `3px solid ${color}`, background: `${color}22`, borderRadius: '4px 4px 0 0', padding: '5px 10px 3px' };
  else if (pin.styleVariant === 'tape') wrapStyle = { ...wrapStyle, background: darkMode ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.84)', boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.14)', borderRadius: 3, padding: '6px 16px' };
  return (
    <div style={wrapStyle}>
      <span style={{ fontFamily: ff, fontWeight: fw, fontSize: fs, color, lineHeight: 1.2, display: 'block' }}>{pin.text}</span>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(0,0,0,0.22)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── StickerPin ───────────────────────────────────────────────────────────────
function StickerPin({ pin, isDragging, onDelete }) {
  const sizes = { small: 32, medium: 46, large: 62 };
  const fs = sizes[pin.size] || 46;
  return (
    <div style={{ position: 'relative', display: 'inline-block', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}>
      <span style={{ fontSize: fs, display: 'block', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.22))' }}>{pin.sticker}</span>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── Create Chapter Sheet ─────────────────────────────────────────────────────
function CreateChapterSheet({ onClose, onCreate, suggestedTitle = '', darkMode }) {
  const [title, setTitle] = useState(suggestedTitle);
  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#4a5568' : '#9ca3af';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';

  function submit() {
    const t = title.trim();
    if (!t) return;
    onCreate(t);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '24px 18px max(48px, calc(env(safe-area-inset-bottom) + 48px))', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 22px' }} />
        <p style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: '0 0 4px' }}>New Chapter</p>
        <p style={{ fontSize: 12, color: ts, margin: '0 0 18px' }}>Give it a name — you can always change it later</p>
        <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>Chapter title</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder='e.g. "Japan Someday" or "Road Trip"'
          autoFocus
          style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2', border: `1px solid ${inputBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 18, color: tp, outline: 'none', width: '100%', marginBottom: 20, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'transparent', border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()} style={{ flex: 2, padding: '12px', borderRadius: 14, background: title.trim() ? '#5eadce' : (darkMode ? 'rgba(94,173,206,0.3)' : '#bde0f0'), color: '#fff', border: 'none', fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, cursor: title.trim() ? 'pointer' : 'not-allowed' }}>
            Create Chapter 📖
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Suggestion Prompt (auto-detected groups) ────────────────────────
function ChapterSuggestionPrompt({ group, pins, onConfirm, onDismiss, darkMode }) {
  const [title, setTitle] = useState(group.suggestedTitle || 'New Chapter');
  const groupPins = pins.filter(p => group.pinIds.includes(p.id));
  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#4a5568' : '#9ca3af';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'flex-end' }} onClick={onDismiss}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '24px 18px max(48px, calc(env(safe-area-inset-bottom) + 48px))', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 22px' }} />
        <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 4px' }}>These seem connected</p>
        <p style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: '0 0 18px', lineHeight: 1.1 }}>Create a chapter?</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {groupPins.map(p => (
            <div key={p.id} style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 10, overflow: 'hidden', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              {p.imageUrl ? <img src={p.imageUrl} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>{p.emoji || (p.type === 'note' ? '📝' : '📌')}</span>}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>Chapter title — make it yours</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2', border: `1px solid ${inputBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 18, color: tp, outline: 'none', width: '100%', marginBottom: 20, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDismiss} style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'transparent', border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>Not now</button>
          <button onClick={() => onConfirm(title.trim() || group.suggestedTitle)} style={{ flex: 2, padding: '12px', borderRadius: 14, background: '#5eadce', color: '#fff', border: 'none', fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>Create Chapter 📖</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Sheet ────────────────────────────────────────────────────────────────
function AddSheet({ onClose, onAdd, darkMode }) {
  const [type, setType]             = useState('photo');
  const [label, setLabel]           = useState('');
  const [emoji, setEmoji]           = useState('✨');
  const [imageUrl, setUrl]          = useState('');
  const [text, setText]             = useState('');
  const [noteColor, setNoteColor]   = useState('yellow');
  const [pinColor, setPinColor]     = useState('teal');
  const [catId, setCatId]           = useState('experiences');
  const [labelText, setLabelText]   = useState('');
  const [fontStyle, setFontStyle]   = useState('handwritten');
  const [fontSize, setFontSize]     = useState('medium');
  const [textColor, setTextColor]   = useState(darkMode ? '#e8eaf0' : '#1a1a2e');
  const [styleVariant, setStyleVar] = useState('plain');
  const [sticker, setSticker]       = useState('⭐');
  const [stickerSize, setStickerSize] = useState('medium');
  const labelPresets = ['MOVIES', 'My Wishlist', 'Date Night', 'Trips'];
  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const inputBg  = darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';
  const tp = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts = darkMode ? '#4a5568' : '#9ca3af';
  const divider = darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4';
  const inputStyle = { background: inputBg, border: `1px solid ${inputBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 16, color: tp, outline: 'none', width: '100%' };
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  function pillStyle(active) {
    return { flex: 1, padding: '7px 4px', borderRadius: 12, border: `1px solid ${active ? '#2dd4bf' : inputBdr}`, background: active ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', color: active ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' };
  }
  function submit() {
    if (type === 'photo' && !label.trim()) return;
    if (type === 'note'  && !text.trim())  return;
    if (type === 'label' && !labelText.trim()) return;
    let data = { type, status: 'dreaming' };
    if (type === 'photo')   data = { ...data, label: label.trim(), emoji, pinColor, categoryId: catId, imageUrl };
    if (type === 'note')    data = { ...data, text: text.trim(), noteColor, pinColor, categoryId: catId };
    if (type === 'label')   data = { ...data, text: labelText.trim(), fontStyle, fontSize, textColor, styleVariant };
    if (type === 'sticker') data = { ...data, sticker, size: stickerSize };
    onAdd(data); onClose();
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', padding: '12px 12px max(12px, env(safe-area-inset-bottom))' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '20px 18px max(32px, calc(env(safe-area-inset-bottom) + 32px))', width: '100%', maxWidth: 480, margin: '0 auto', borderTop: `1px solid ${divider}`, maxHeight: 'calc(100dvh - 24px - env(safe-area-inset-bottom))', overflowY: 'auto', WebkitOverflowScrolling: 'touch', ...sheetStyle }}>
        <div {...handleProps} style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 18px', ...handleProps.style }} />
        <p style={{ fontFamily: CAVEAT, fontSize: 24, fontWeight: 700, color: tp, marginBottom: 16 }}>Pin something new</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[['photo','📸','Photo / emoji'],['note','📝','Quick note'],['label','🏷️','Label'],['sticker','✦','Sticker']].map(([t, ic, lbl]) => (
            <button key={t} onClick={() => setType(t)} style={{ padding: '9px 6px', borderRadius: 14, border: `1px solid ${type === t ? '#2dd4bf' : inputBdr}`, background: type === t ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', color: type === t ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>{ic} {lbl}</button>
          ))}
        </div>
        {type === 'photo' && (<>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Visit Boston)" style={{ ...inputStyle, marginBottom: 10 }} />
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Photo</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setUrl(ev.target.result);r.readAsDataURL(f);}; i.click(); }} style={{ flex: 1, padding: '9px 6px', borderRadius: 12, border: `1px solid ${inputBdr}`, background: 'transparent', color: ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>📁 Upload photo</button>
            <button onClick={() => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.capture='environment'; i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setUrl(ev.target.result);r.readAsDataURL(f);}; i.click(); }} style={{ flex: 1, padding: '9px 6px', borderRadius: 12, border: `1px solid ${inputBdr}`, background: 'transparent', color: ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>📷 Take photo</button>
          </div>
          {imageUrl && imageUrl.startsWith('data:') && (<div style={{ position: 'relative', marginBottom: 10 }}><img src={imageUrl} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }} /><button onClick={() => setUrl('')} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>)}
          <input value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={e => setUrl(e.target.value)} placeholder="or paste image URL (optional)" style={{ ...inputStyle, marginBottom: 12 }} />
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Emoji</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {['✨','🌍','🍜','🏔️','🚗','🏡','🎬','🎲','🛍️','🌊','🏄','🎵','📚','🍣','🌸','✈️','🍕','🎪','🌮','☕','🍷','🌙','🌈','🎭'].map(e => (<button key={e} onClick={() => setEmoji(e)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${emoji===e?'#2dd4bf':inputBdr}`, background: emoji===e?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', fontSize: 18, cursor: 'pointer' }}>{e}</button>))}
          </div>
        </>)}
        {type === 'note' && (<>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your mind?" rows={3} style={{ ...inputStyle, resize: 'none', marginBottom: 12 }} />
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Note colour</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {NOTE_COLOR_OPTIONS.map(k => { const c=NOTE_COLORS[k][darkMode?'dark':'light']; return <button key={k} onClick={() => setNoteColor(k)} style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, border: noteColor===k?'2px solid #2dd4bf':`1px solid ${c.fold}33`, cursor: 'pointer' }} />; })}
          </div>
        </>)}
        {type === 'label' && (<>
          <input value={labelText} onChange={e => setLabelText(e.target.value)} placeholder="MOVIES · My Wishlist · Date Night" style={{ ...inputStyle, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {labelPresets.map(preset => { const active=labelText.trim().toLowerCase()===preset.toLowerCase(); return <button key={preset} type="button" onClick={() => setLabelText(preset)} style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${active?'#2dd4bf':inputBdr}`, background: active?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', color: active?(darkMode?'#2dd4bf':'#0d9488'):ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>{preset}</button>; })}
          </div>
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Style</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[['plain','Plain'],['highlight','Highlight'],['tape','Tape']].map(([v,lbl]) => <button key={v} onClick={() => setStyleVar(v)} style={pillStyle(styleVariant===v)}>{lbl}</button>)}</div>
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Font</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[['handwritten','Caveat'],['clean','Clean'],['bold','Bold']].map(([v,lbl]) => <button key={v} onClick={() => setFontStyle(v)} style={{ ...pillStyle(fontStyle===v), fontFamily: v==='handwritten'?CAVEAT:'system-ui', fontWeight: v==='bold'?700:400 }}>{lbl}</button>)}</div>
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Size</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[['small','Small'],['medium','Medium'],['large','Large']].map(([v,lbl]) => <button key={v} onClick={() => setFontSize(v)} style={pillStyle(fontSize===v)}>{lbl}</button>)}</div>
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Colour</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>{LABEL_COLORS.map(c => <button key={c} onClick={() => setTextColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: textColor===c?'2px solid #2dd4bf':c==='#ffffff'?`1px solid ${inputBdr}`:'2px solid transparent', outline: textColor===c?`2px solid ${c}55`:'none', cursor: 'pointer' }} />)}</div>
        </>)}
        {type === 'sticker' && (<>
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pick a sticker</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>{STICKERS.map(s => <button key={s} onClick={() => setSticker(s)} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${sticker===s?'#2dd4bf':inputBdr}`, background: sticker===s?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', fontSize: 22, cursor: 'pointer' }}>{s}</button>)}</div>
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Size</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[['small','Small'],['medium','Medium'],['large','Large']].map(([v,lbl]) => <button key={v} onClick={() => setStickerSize(v)} style={pillStyle(stickerSize===v)}>{lbl}</button>)}</div>
        </>)}
        {(type === 'photo' || type === 'note') && (<>
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {CATEGORY_FILTERS.filter(c => c.id !== 'all').map(c => <button key={c.id} onClick={() => setCatId(c.id)} style={{ padding: '5px 11px', borderRadius: 20, border: `1px solid ${catId===c.id?'#2dd4bf':inputBdr}`, background: catId===c.id?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', fontFamily: CAVEAT, fontSize: 14, color: catId===c.id?(darkMode?'#2dd4bf':'#0d9488'):ts, cursor: 'pointer' }}>{c.emoji} {c.label}</button>)}
          </div>
          <p style={{ fontSize: 11, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pin colour</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {PIN_COLOR_OPTIONS.map(k => { const col=PIN_COLORS[k][darkMode?'dark':'light']; return <button key={k} onClick={() => setPinColor(k)} style={{ width: 24, height: 24, borderRadius: '50%', background: col, border: pinColor===k?'2px solid white':'2px solid transparent', outline: pinColor===k?`2px solid ${col}`:'none', cursor: 'pointer' }} />; })}
          </div>
        </>)}
        <button onClick={submit} style={{ width: '100%', padding: '13px', borderRadius: 16, background: '#2dd4bf', color: '#0a1020', border: 'none', fontFamily: CAVEAT, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>Pin it 📌</button>
      </div>
    </div>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────
function DetailSheet({ pin, chapters, onClose, onConvertToEvent, onConvertToTrip, onMarkDone, onSetHero, heroId, onAddToChapter, onRemoveFromChapter, darkMode }) {
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const sheetBg = darkMode ? '#131c2e' : '#ffffff';
  const tp      = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts      = darkMode ? '#4a5568' : '#9ca3af';
  const divider = darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4';
  const secBg   = darkMode ? 'rgba(255,255,255,0.04)' : '#f8f7f2';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.12)' : '#e5e0d5';
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  const currentChapter = chapters.find(c => c.itemIds.includes(pin.id));

  const handleTurnIntoPlan = () => {
    const tripLike = ['places', 'travel', 'adventure'].includes(String(pin.categoryId || '').toLowerCase());
    const planHandler = tripLike ? (onConvertToTrip || onConvertToEvent) : (onConvertToEvent || onConvertToTrip);
    planHandler?.(pin); onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '20px 18px max(48px, calc(env(safe-area-inset-bottom) + 48px))', width: '100%', maxWidth: 480, margin: '0 auto', borderTop: `1px solid ${divider}`, maxHeight: '90dvh', overflowY: 'auto', ...sheetStyle }}>
        <div {...handleProps} style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 16px', ...handleProps.style }} />

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

        {/* Chapter picker */}
        <div style={{ marginBottom: 12 }}>
          {currentChapter ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{ flex: 1, background: darkMode ? 'rgba(94,173,206,0.12)' : '#eef8fd', border: '1px solid rgba(94,173,206,0.35)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: '#5eadce', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Chapter</div>
                <div style={{ fontFamily: CAVEAT, fontSize: 16, color: darkMode ? '#5eadce' : '#0e7490' }}>📖 {currentChapter.title}</div>
              </div>
              <button onClick={() => setShowChapterPicker(v => !v)} style={{ padding: '0 14px', borderRadius: 12, background: secBg, border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>
                {showChapterPicker ? 'Done' : 'Change'}
              </button>
            </div>
          ) : (
            <button onClick={() => setShowChapterPicker(v => !v)} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: secBg, border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>
              📖 Add to a chapter…
            </button>
          )}

          {showChapterPicker && (
            <div style={{ marginTop: 8, background: secBg, borderRadius: 14, overflow: 'hidden', border: `1px solid ${inputBdr}` }}>
              {chapters.length === 0 && (
                <div style={{ padding: '14px 16px', fontFamily: CAVEAT, fontSize: 15, color: ts, fontStyle: 'italic' }}>No chapters yet — create one from the tab bar</div>
              )}
              {chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => { onAddToChapter(pin.id, ch.id); setShowChapterPicker(false); onClose(); }}
                  style={{ width: '100%', padding: '12px 16px', background: currentChapter?.id === ch.id ? (darkMode ? 'rgba(94,173,206,0.15)' : '#eef8fd') : 'transparent', border: 'none', borderBottom: i < chapters.length - 1 ? `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4'}` : 'none', fontFamily: CAVEAT, fontSize: 16, color: currentChapter?.id === ch.id ? (darkMode ? '#5eadce' : '#0e7490') : tp, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {currentChapter?.id === ch.id ? '✓ ' : ''}📖 {ch.title}
                </button>
              ))}
              {currentChapter && (
                <button onClick={() => { onRemoveFromChapter(pin.id); setShowChapterPicker(false); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4'}`, fontFamily: CAVEAT, fontSize: 15, color: '#ef4444', cursor: 'pointer', textAlign: 'left' }}>
                  Remove from chapter
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pin.status !== 'done' && (
            <button onClick={handleTurnIntoPlan} style={{ flex: '1 1 100%', minWidth: 120, padding: '12px', borderRadius: 14, background: darkMode ? 'rgba(139,92,246,0.12)' : '#f5f3ff', color: darkMode ? '#c4b5fd' : '#6d28d9', border: `1px solid ${darkMode ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.28)'}`, fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>Make it happen</button>
          )}
          <button onClick={() => { onMarkDone?.(pin); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: pin.status === 'done' ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : secBg, color: pin.status === 'done' ? (darkMode ? '#2dd4bf' : '#0d9488') : (darkMode ? '#cbd5e1' : ts), border: `1px solid ${inputBdr}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
            {pin.status === 'done' ? '✓ Done!' : 'Mark done'}
          </button>
          <button onClick={() => { onSetHero?.(pin.id === heroId ? null : pin.id); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: pin.id === heroId ? (darkMode ? 'rgba(251,191,36,0.12)' : '#fffbeb') : secBg, color: pin.id === heroId ? (darkMode ? '#fbbf24' : '#92400e') : (darkMode ? '#cbd5e1' : ts), border: `1px solid ${pin.id === heroId ? (darkMode ? 'rgba(251,191,36,0.3)' : '#fde68a') : inputBdr}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
            {pin.id === heroId ? '★ Remove focus' : '☆ Set as focus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Page ─────────────────────────────────────────────────────────────
function ChapterPage({ chapter, pins, onBack, onAddMemory, onDeleteMemory, darkMode }) {
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [memoryText, setMemoryText] = useState('');
  const chapterPins = pins.filter(p => chapter.itemIds.includes(p.id));
  const coverPin = chapterPins.find(p => p.imageUrl) || null;
  const pageBg = darkMode ? '#0e1520' : '#faf8f3';
  const tp     = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts     = darkMode ? '#4a5568' : '#9ca3af';
  const cardBg = darkMode ? '#131c2e' : '#ffffff';
  const divider = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';

  function submitMemory() {
    if (!memoryText.trim()) return;
    onAddMemory?.({ id: Date.now().toString(), type: 'note', text: memoryText.trim(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
    setMemoryText(''); setShowAddMemory(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: darkMode ? '#131c2e' : '#fff', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : '#e5e0d5'}`, padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ts, fontSize: 26, lineHeight: 1, padding: '0 4px', display: 'flex', alignItems: 'center' }}>‹</button>
          <div>
            <p style={{ fontSize: 10, color: '#5eadce', textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0, fontWeight: 700 }}>Chapter</p>
            <h1 style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: 0, lineHeight: 1.1 }}>{chapter.title}</h1>
          </div>
        </div>
      </div>

      {coverPin?.imageUrl && (
        <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden' }}>
          <img src={coverPin.imageUrl} alt={chapter.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.55))' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
            <span style={{ fontFamily: CAVEAT, fontSize: 30, color: '#fff', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>{chapter.title}</span>
          </div>
          {chapter.createdAt && <div style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>{chapter.createdAt}</div>}
        </div>
      )}

      <div style={{ padding: '22px 16px 0' }}>
        <p style={{ fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 14px', fontWeight: 600 }}>Pinned · {chapterPins.length} item{chapterPins.length !== 1 ? 's' : ''}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {chapterPins.map(p => (
            <div key={p.id} style={{ transform: `rotate(${(p.rot || 0) * 0.4}deg)` }}>
              {p.type === 'note' ? (
                <div style={{ background: (NOTE_COLORS[p.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'].bg, padding: '11px 12px', width: 140, minHeight: 80, borderRadius: 2, boxShadow: '2px 3px 10px rgba(0,0,0,0.12)', position: 'relative' }}>
                  <Pushpin colorKey={p.pinColor} darkMode={darkMode} />
                  <p style={{ fontFamily: CAVEAT, fontSize: 13, color: (NOTE_COLORS[p.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'].text, margin: 0, lineHeight: 1.45 }}>{p.text}</p>
                  {p.status === 'done' && <SharpieX size={118} />}
                </div>
              ) : (
                <div style={{ background: darkMode ? '#e2e8f0' : '#fff', padding: '5px 5px 0', width: 130, borderRadius: 2, boxShadow: '2px 3px 10px rgba(0,0,0,0.12)', position: 'relative' }}>
                  <Pushpin colorKey={p.pinColor} darkMode={darkMode} />
                  <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 1, position: 'relative' }}>
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: p.status === 'done' ? 'grayscale(40%) brightness(0.85)' : 'none' }} /> : <div style={{ width: '100%', height: '100%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{p.emoji || '📌'}</div>}
                    {p.status === 'done' && <SharpieX size={120} />}
                  </div>
                  <div style={{ padding: '5px 2px 6px', textAlign: 'center', fontFamily: CAVEAT, fontSize: 11, color: p.status === 'done' ? '#9ca3af' : '#374151', textDecoration: p.status === 'done' ? 'line-through' : 'none', lineHeight: 1.3 }}>{p.emoji ? `${p.emoji} ${p.label}` : p.label}</div>
                </div>
              )}
            </div>
          ))}
          {chapterPins.length === 0 && <p style={{ fontFamily: CAVEAT, fontSize: 16, color: ts, fontStyle: 'italic' }}>No pins yet — add items from Someday via the detail sheet</p>}
        </div>
      </div>

      <div style={{ margin: '32px 16px 0', borderTop: `2px dashed ${divider}`, paddingTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0, fontWeight: 600 }}>Memories</p>
            <p style={{ fontFamily: CAVEAT, fontSize: 22, color: tp, margin: '2px 0 0', lineHeight: 1 }}>As it happens…</p>
          </div>
          <button onClick={() => setShowAddMemory(v => !v)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#2dd4bf', border: 'none', color: '#0a1020', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>+</button>
        </div>
        {showAddMemory && (
          <div style={{ marginBottom: 16 }}>
            <textarea value={memoryText} onChange={e => setMemoryText(e.target.value)} placeholder="Write a memory, note, or moment…" rows={3} autoFocus style={{ width: '100%', background: cardBg, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5'}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 16, color: tp, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => { setShowAddMemory(false); setMemoryText(''); }} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5'}`, color: ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitMemory} disabled={!memoryText.trim()} style={{ flex: 2, padding: '10px', borderRadius: 12, background: '#2dd4bf', border: 'none', color: '#0a1020', fontFamily: CAVEAT, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: memoryText.trim() ? 1 : 0.5 }}>Save memory</button>
            </div>
          </div>
        )}
        {chapter.memories?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chapter.memories.map(mem => (
              <div key={mem.id} style={{ background: cardBg, borderRadius: 14, padding: '12px 14px', boxShadow: `0 1px 4px ${darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'}` }}>
                <p style={{ fontFamily: CAVEAT, fontSize: 16, color: tp, margin: 0, lineHeight: 1.5 }}>{mem.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: ts }}>{mem.date}</span>
                  <button onClick={() => onDeleteMemory?.(mem.id)} style={{ background: 'none', border: 'none', fontSize: 11, color: ts, cursor: 'pointer', padding: 0 }}>remove</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <p style={{ fontFamily: CAVEAT, fontSize: 19, color: ts, fontStyle: 'italic', margin: 0 }}>No memories yet — they'll live here</p>
            <p style={{ fontSize: 12, color: ts, margin: '6px 0 0', opacity: 0.7 }}>Add notes and moments as this chapter unfolds</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auto-sort helpers ────────────────────────────────────────────────────────
const SORT_CATEGORY_META = {
  places:      { text: 'Places ✈️',       textColor: '#0d9488', styleVariant: 'tape' },
  food:        { text: 'Food & Dining 🍜', textColor: '#d97706', styleVariant: 'tape' },
  experiences: { text: 'Experiences ✨',   textColor: '#7c3aed', styleVariant: 'tape' },
  home:        { text: 'Home 🏡',          textColor: '#db2777', styleVariant: 'tape' },
  buy:         { text: 'Wishlist 🛍️',      textColor: '#2563eb', styleVariant: 'tape' },
  notes:       { text: 'Notes 📝',         textColor: '#92400e', styleVariant: 'tape' },
};

function buildAutoSortedPins(pins, onAddDream, onDeleteDream, onUpdateDream) {
  const LEFT_X = 16, RIGHT_X = 208, LABEL_H = 54, PHOTO_ROW_H = 224, NOTE_ROW_H = 168, GROUP_GAP = 36;
  const autoOldLabels = pins.filter(p => p.autoGenerated);
  autoOldLabels.forEach(p => onDeleteDream?.(p.id));
  // Skip chapter pins — they are managed separately
  const contentPins = pins.filter(p => p.type !== 'label' && p.type !== 'sticker' && !p.autoGenerated && p.status !== 'done' && !p.chapterId);
  const donePins    = pins.filter(p => p.type !== 'label' && p.type !== 'sticker' && !p.autoGenerated && p.status === 'done' && !p.chapterId);
  const stickers    = pins.filter(p => p.type === 'sticker');
  const orderedCats = Object.keys(SORT_CATEGORY_META);
  const grouped = {};
  contentPins.forEach(p => {
    let cat;
    if (p.type === 'note') cat = 'notes';
    else if (p.sourceType === 'dreamshelf' || p.sourceType === 'products' || p.categoryId === 'buy') cat = 'buy';
    else cat = orderedCats.includes(p.categoryId) ? p.categoryId : 'experiences';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });
  const result = [...stickers];
  const newLabelPins = [];
  let yOffset = 20;
  orderedCats.forEach(catId => {
    const catPins = grouped[catId];
    if (!catPins || catPins.length === 0) return;
    const meta = SORT_CATEGORY_META[catId];
    const labelPin = { id: `auto-label-${catId}-${Date.now()}`, type: 'label', autoGenerated: true, text: meta.text, fontStyle: 'handwritten', fontSize: 'medium', textColor: meta.textColor, styleVariant: meta.styleVariant, x: LEFT_X, y: yOffset, rot: (Math.random() - 0.5) * 1.5 };
    result.push(labelPin); newLabelPins.push(labelPin); yOffset += LABEL_H;
    catPins.forEach((pin, i) => {
      const col = i % 2, row = Math.floor(i / 2), rowH = pin.type === 'note' ? NOTE_ROW_H : PHOTO_ROW_H;
      const updated = { ...pin, x: (col === 0 ? LEFT_X : RIGHT_X) + (Math.random() - 0.5) * 10, y: yOffset + row * rowH + (Math.random() - 0.5) * 8, rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8) };
      result.push(updated); onUpdateDream?.(updated);
    });
    yOffset += Math.ceil(catPins.length / 2) * (catPins.some(p => p.type === 'photo') ? PHOTO_ROW_H : NOTE_ROW_H) + GROUP_GAP;
  });
  if (donePins.length > 0) {
    const doneLabelPin = { id: `auto-label-done-${Date.now()}`, type: 'label', autoGenerated: true, text: 'Completed ✓', fontStyle: 'handwritten', fontSize: 'medium', textColor: '#c0392b', styleVariant: 'tape', x: LEFT_X, y: yOffset, rot: (Math.random() - 0.5) * 1.5 };
    result.push(doneLabelPin); newLabelPins.push(doneLabelPin); yOffset += LABEL_H;
    donePins.forEach((pin, i) => {
      const col = i % 2, row = Math.floor(i / 2), rowH = pin.type === 'note' ? NOTE_ROW_H : PHOTO_ROW_H;
      const updated = { ...pin, x: (col === 0 ? LEFT_X : RIGHT_X) + (Math.random() - 0.5) * 10, y: yOffset + row * rowH + (Math.random() - 0.5) * 8, rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8) };
      result.push(updated); onUpdateDream?.(updated);
    });
  }
  newLabelPins.forEach(lp => onAddDream?.(lp));
  return result;
}

function gridPosition(index) {
  const col = index % 2, row = Math.floor(index / 2);
  return { x: (col === 0 ? 16 : 208) + (Math.random() - 0.5) * 14, y: 64 + row * 240 + (Math.random() - 0.5) * 14, rot: (col === 0 ? -1 : 1) * (0.4 + Math.random() * 2.2) };
}

function estimatedPinHeight(pin = {}) {
  if (pin.type === 'label' || pin.type === 'sticker') return 80;
  if (pin.type === 'note') return 150;
  return 210;
}

function positionBelowLowestPin(existingPins = [], addIndex = 0) {
  const pinned = (Array.isArray(existingPins) ? existingPins : []).filter(pin => pin && pin.type !== 'label' && pin.type !== 'sticker');
  if (!pinned.length) return gridPosition(addIndex);
  const lowestBottom = Math.max(...pinned.map(pin => (Number(pin.y) || 0) + estimatedPinHeight(pin)));
  const col = addIndex % 2, row = Math.floor(addIndex / 2);
  return { x: (col === 0 ? 16 : 208) + (Math.random() - 0.5) * 14, y: lowestBottom + 28 + row * 240 + (Math.random() - 0.5) * 10, rot: (col === 0 ? -1 : 1) * (0.4 + Math.random() * 2.2) };
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
  const [pins, setPins] = useState(() => dreams.map((d, idx) => {
    const pos = (d.x == null || d.y == null) ? gridPosition(idx) : { x: d.x, y: d.y, rot: d.rot };
    return { ...d, ...pos, rot: pos.rot ?? d.rot ?? (Math.random() * 6 - 3), pinColor: d.pinColor ?? PIN_COLOR_OPTIONS[Math.floor(Math.random() * PIN_COLOR_OPTIONS.length)], noteColor: d.noteColor ?? 'yellow', type: d.type ?? (d.imageUrl || d.emoji ? 'photo' : 'note') };
  }));
  const [filter, setFilter]               = useState('all');
  const [showAdd, setShowAdd]             = useState(false);
  const [detailPin, setDetailPin]         = useState(null);
  const [dragging, setDragging]           = useState(null);
  const [heroId, setHeroId]               = useState(() => { try { return localStorage.getItem('someday-hero-id') || null; } catch { return null; } });
  const [chapters, setChapters]           = useState([]);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [chapterPromptGroup, setChapterPromptGroup] = useState(null);
  const [dismissedGroups, setDismissedGroups] = useState(new Set());

  const dragOffset      = useRef({ x: 0, y: 0 });
  const dragStartPoint  = useRef({ x: 0, y: 0 });
  const canvasRef       = useRef();
  const didDrag         = useRef(false);
  const draggingTypeRef = useRef(null);

  const groups = useMemo(() => detectGroups(pins), [pins]);

  // Chapter cluster layout (computed, not stored in pins)
  const { layout: chapterLayout, totalHeight: chapterTotalHeight } = useMemo(
    () => computeChapterLayout(chapters, pins),
    [chapters, pins]
  );

  useEffect(() => {
    try { if (heroId) localStorage.setItem('someday-hero-id', heroId); else localStorage.removeItem('someday-hero-id'); } catch {}
  }, [heroId]);

  useEffect(() => {
    setPins(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const toAdd = (Array.isArray(dreams) ? dreams : []).filter(d => !existingIds.has(d.id));
      if (!toAdd.length) return prev;
      const newPins = toAdd.reduce((acc, d) => {
        const pos = (d.x == null || d.y == null) ? positionBelowLowestPin([...prev, ...acc], acc.length) : { x: d.x, y: d.y, rot: d.rot };
        acc.push({ ...d, ...pos, rot: pos.rot ?? d.rot ?? (Math.random() * 6 - 3), pinColor: d.pinColor ?? PIN_COLOR_OPTIONS[Math.floor(Math.random() * PIN_COLOR_OPTIONS.length)], noteColor: d.noteColor ?? 'yellow', type: d.type ?? (d.imageUrl || d.emoji ? 'photo' : 'note') });
        return acc;
      }, []);
      return [...prev, ...newPins];
    });
  }, [dreams]);

  const pageBg      = darkMode ? '#0e1520' : '#faf8f3';
  const topbarBg    = darkMode ? '#131c2e' : '#ffffff';
  const topBdr      = darkMode ? 'rgba(255,255,255,0.05)' : '#e5e0d5';
  const tp          = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts          = darkMode ? '#4a5568' : '#9ca3af';
  const pillAct     = darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfb';
  const pillActBdr  = darkMode ? 'rgba(45,212,191,0.3)' : '#2dd4bf';
  const pillActTxt  = darkMode ? '#2dd4bf' : '#0d9488';
  const pillIdle    = darkMode ? 'rgba(255,255,255,0.04)' : '#f5f3ee';
  const pillIdleBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';
  const boardBg = darkMode
    ? { backgroundColor: '#0e1520', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }
    : { backgroundColor: '#f5f2eb', backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' };

  const completedCount = pins.filter(p => p.status === 'done' && p.type !== 'label' && p.type !== 'sticker').length;

  // Chapter pins excluded from category filter pills; only show in 'all'
  const visiblePins = (
    filter === 'all'  ? pins :
    filter === 'done' ? pins.filter(p => p.status === 'done' && !p.chapterId) :
                        pins.filter(p => p.categoryId === filter && p.status !== 'done' && !p.chapterId)
  ).filter(p => p.id !== heroId);

  const displayedPins = filter === 'all' ? visiblePins : [...visiblePins].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const nudgedPins = filter === 'all'
    ? displayedPins
    : displayedPins.map((pin, index) => {
        const row = Math.floor(index / 2), col = index % 2;
        return { ...pin, x: Math.min(220 + col * 170, pin.x), y: 24 + row * 210 };
      });

  const lowestPinBottom = pins.filter(p => !p.chapterId).reduce((max, pin) => Math.max(max, (Number(pin.y) || 0) + estimatedPinHeight(pin)), 0);
  const BOARD_HEIGHT = Math.max(600, chapterTotalHeight + Math.ceil(pins.length / 2) * 240 + 240, chapterTotalHeight + lowestPinBottom + 120);

  // ─── Drag ──────────────────────────────────────────────────────────────────
  function startDrag(e, id) {
    if (e.target?.closest?.('button')) return;
    e.preventDefault(); e.stopPropagation();
    didDrag.current = false;
    const touch = e.touches?.[0] ?? e;
    const pin = pins.find(p => p.id === id);
    if (!pin) return;
    draggingTypeRef.current = pin.type;
    dragOffset.current = { x: touch.clientX - pin.x, y: touch.clientY - pin.y };
    dragStartPoint.current = { x: touch.clientX, y: touch.clientY };
    setDragging(id);
    setPins(ps => { const idx = ps.findIndex(p => p.id === id); const arr = [...ps]; const [item] = arr.splice(idx, 1); arr.push(item); return arr; });
  }

  const onMove = useCallback((e) => {
    if (!dragging) return;
    const touch = e.touches?.[0] ?? e;
    const dx = touch.clientX - dragStartPoint.current.x, dy = touch.clientY - dragStartPoint.current.y;
    if (!didDrag.current && Math.hypot(dx, dy) < 6) return;
    didDrag.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let nx = touch.clientX - dragOffset.current.x, ny = touch.clientY - dragOffset.current.y;
    const isDecor = draggingTypeRef.current === 'label' || draggingTypeRef.current === 'sticker';
    const isSticker = draggingTypeRef.current === 'sticker';
    nx = Math.max(0, Math.min(isSticker ? rect.width - 24 : rect.width - 170, nx));
    ny = Math.max(isDecor ? -320 : 0, Math.min(BOARD_HEIGHT - 240, ny));
    setPins(ps => ps.map(p => p.id === dragging ? { ...p, x: nx, y: ny } : p));
  }, [dragging, BOARD_HEIGHT]);

  const stopDrag = useCallback(() => {
    if (dragging) {
      const pin = pins.find(p => p.id === dragging);
      if (pin && didDrag.current) onUpdateDream?.({ ...pin });
      else if (pin && pin.type !== 'label' && pin.type !== 'sticker') handlePinClick(pin);
    }
    setDragging(null);
  }, [dragging, pins, onUpdateDream]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', stopDrag); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', stopDrag); };
  }, [onMove, stopDrag]);

  function handlePinClick(pin) {
    if (didDrag.current) return;
    if (pin.type === 'label' || pin.type === 'sticker') return;
    // Suggest chapter creation for auto-detected groups (once per group)
    if (!pin.chapterId) {
      const pinGroup = groups.find(g => g.pinIds.includes(pin.id) && !dismissedGroups.has(g.id) && !chapters.some(c => g.pinIds.every(id => c.itemIds.includes(id))));
      if (pinGroup) { setChapterPromptGroup(pinGroup); return; }
    }
    setDetailPin(pin);
  }

  function createChapter(title, itemIds = []) {
    const newChapter = { id: `chapter-${Date.now()}`, title, itemIds: [...itemIds], memories: [], createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
    setChapters(prev => {
      const updated = [...prev, newChapter];
      // Position pins into cluster
      if (itemIds.length > 0) {
        const clusterY = getChapterClusterY(updated, newChapter.id, pins);
        setPins(ps => ps.map(p => {
          if (!itemIds.includes(p.id)) return p;
          const idx = itemIds.indexOf(p.id);
          const col = idx % 2, row = Math.floor(idx / 2);
          const rowH = p.type === 'note' ? CLUSTER_NOTE_ROW_H : CLUSTER_PHOTO_ROW_H;
          const updated2 = { ...p, chapterId: newChapter.id, x: (col === 0 ? 16 : 208) + (Math.random() - 0.5) * 10, y: clusterY + CLUSTER_LABEL_H + row * rowH + (Math.random() - 0.5) * 8, rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8) };
          onUpdateDream?.(updated2);
          return updated2;
        }));
      }
      return updated;
    });
    setChapterPromptGroup(null);
    setShowCreateChapter(false);
  }

  function addPinToChapter(pinId, chapterId) {
    setChapters(prev => prev.map(c => {
      if (c.id === chapterId) return { ...c, itemIds: [...new Set([...c.itemIds, pinId])] };
      return { ...c, itemIds: c.itemIds.filter(id => id !== pinId) };
    }));
    setPins(prev => {
      const chapterPinsCount = prev.filter(p => p.chapterId === chapterId).length;
      return prev.map(p => {
        if (p.id !== pinId) return p;
        const clusterY = getChapterClusterY(chapters, chapterId, prev);
        const col = chapterPinsCount % 2, row = Math.floor(chapterPinsCount / 2);
        const rowH = p.type === 'note' ? CLUSTER_NOTE_ROW_H : CLUSTER_PHOTO_ROW_H;
        const updated = { ...p, chapterId, x: (col === 0 ? 16 : 208) + (Math.random() - 0.5) * 10, y: clusterY + CLUSTER_LABEL_H + row * rowH + (Math.random() - 0.5) * 8, rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8) };
        onUpdateDream?.(updated);
        return updated;
      });
    });
  }

  function removePinFromChapter(pinId) {
    setChapters(prev => prev.map(c => ({ ...c, itemIds: c.itemIds.filter(id => id !== pinId) })));
    setPins(prev => prev.map(p => {
      if (p.id !== pinId) return p;
      const updated = { ...p, chapterId: undefined };
      onUpdateDream?.(updated);
      return updated;
    }));
  }

  function addMemoryToChapter(chapterId, memory) {
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, memories: [...(c.memories || []), memory] } : c));
  }

  function deleteMemoryFromChapter(chapterId, memoryId) {
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, memories: (c.memories || []).filter(m => m.id !== memoryId) } : c));
  }

  function autoSort() {
    setPins(prev => buildAutoSortedPins(prev, onAddDream, onDeleteDream, onUpdateDream));
  }

  function addPin(data) {
    const pos = positionBelowLowestPin(pins.filter(p => !p.chapterId));
    const newPin = { id: Date.now().toString(), ...pos, ...data };
    setPins(ps => [...ps, newPin]);
    onAddDream?.(newPin);
  }

  function deletePin(id) {
    setPins(ps => ps.filter(p => p.id !== id));
    onDeleteDream?.(id);
    setChapters(prev => prev.map(c => ({ ...c, itemIds: c.itemIds.filter(i => i !== id) })));
  }

  function markDone(pin) {
    const updated = { ...pin, status: pin.status === 'done' ? 'dreaming' : 'done' };
    setPins(ps => ps.map(p => p.id === pin.id ? updated : p));
    onUpdateDream?.(updated);
  }

  // ─── Chapter page view ────────────────────────────────────────────────────
  if (activeChapterId) {
    const chapter = chapters.find(c => c.id === activeChapterId);
    if (chapter) {
      return (
        <>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>
          <ChapterPage chapter={chapter} pins={pins} onBack={() => setActiveChapterId(null)} onAddMemory={mem => addMemoryToChapter(activeChapterId, mem)} onDeleteMemory={memId => deleteMemoryFromChapter(activeChapterId, memId)} darkMode={darkMode} />
        </>
      );
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 'max(100px, calc(env(safe-area-inset-bottom) + 100px))' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>

      {/* Sticky top bar */}
      <div style={{ background: topbarBg, borderBottom: `1px solid ${topBdr}`, position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ padding: '18px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ts, fontSize: 26, lineHeight: 1, padding: '0 4px', display: 'flex', alignItems: 'center' }}>‹</button>}
              <div>
                <h1 style={{ fontFamily: CAVEAT, fontSize: 34, fontWeight: 700, color: tp, margin: 0, lineHeight: 1 }}>
                  {(!ownerName || ownerName === currentUser)
                    ? <>✦ Your <span style={{ background: 'linear-gradient(90deg, #5eada0, #a89bc2, #c4867a, #c9a15d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Komo Book</span></>
                    : <>{ownerName}'s <span style={{ background: 'linear-gradient(90deg, #5eada0, #a89bc2, #c4867a, #c9a15d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Komo Book</span></>}
                </h1>
                <p style={{ fontSize: 11, color: ts, margin: '3px 0 0', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>
                  {pins.filter(p => p.type !== 'label' && p.type !== 'sticker').length} things pinned
                  {completedCount > 0 && <span style={{ color: '#c0392b', marginLeft: 6 }}>· {completedCount} dream{completedCount !== 1 ? 's' : ''} completed</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={autoSort} title="Auto-sort by category" style={{ width: 42, height: 42, borderRadius: '50%', background: darkMode ? 'rgba(139,92,246,0.15)' : '#f5f3ff', border: `1px solid ${darkMode ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.25)'}`, color: darkMode ? '#c4b5fd' : '#6d28d9', fontSize: 19, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✦</button>
              <button onClick={() => setShowAdd(true)} style={{ width: 42, height: 42, borderRadius: '50%', background: '#2dd4bf', border: 'none', color: '#0a1020', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(45,212,191,0.4)', fontWeight: 700 }}>+</button>
            </div>
          </div>

          {/* Book page tabs — always visible */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', borderBottom: `1px solid ${topBdr}` }}>
            <button onClick={() => setActiveChapterId(null)} style={{ flexShrink: 0, padding: '8px 14px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeChapterId === null ? '#2dd4bf' : 'transparent'}`, fontFamily: CAVEAT, fontSize: 15, color: activeChapterId === null ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
              📌 Someday
            </button>
            {chapters.map(ch => (
              <button key={ch.id} onClick={() => setActiveChapterId(ch.id)} style={{ flexShrink: 0, padding: '8px 14px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeChapterId === ch.id ? '#5eadce' : 'transparent'}`, fontFamily: CAVEAT, fontSize: 15, color: activeChapterId === ch.id ? (darkMode ? '#5eadce' : '#0e7490') : ts, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
                📖 {ch.title}
              </button>
            ))}
            <button onClick={() => setShowCreateChapter(true)} style={{ flexShrink: 0, padding: '8px 14px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', fontFamily: CAVEAT, fontSize: 15, color: ts, cursor: 'pointer', whiteSpace: 'nowrap', opacity: 0.7 }}>
              + Chapter
            </button>
          </div>

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '10px 0 10px' }}>
            {CATEGORY_FILTERS.map(c => (
              <button key={c.id} onClick={() => setFilter(c.id)} style={{ flexShrink: 0, padding: '5px 13px', borderRadius: 20, background: filter === c.id ? pillAct : pillIdle, border: `1px solid ${filter === c.id ? pillActBdr : pillIdleBdr}`, color: filter === c.id ? pillActTxt : ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
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
            <div onClick={() => setDetailPin(heroPin)} style={{ cursor: 'pointer', transform: `rotate(${(heroPin.rot ?? 0) * 0.3}deg)`, transition: 'transform 0.2s' }}>
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
                    {heroPin.imageUrl ? <img src={heroPin.imageUrl} alt={heroPin.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>{heroPin.emoji || '📌'}</div>}
                  </div>
                  <div style={{ padding: '8px 4px 10px', textAlign: 'center' }}>
                    <div style={{ fontFamily: CAVEAT, fontSize: 16, color: '#374151', lineHeight: 1.3 }}>{heroPin.emoji ? `${heroPin.emoji} ${heroPin.label || heroPin.text}` : (heroPin.label || heroPin.text)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Pin board */}
      <div ref={canvasRef} style={{ ...boardBg, position: 'relative', zIndex: 1, width: '100%', height: BOARD_HEIGHT, overflowX: 'hidden', touchAction: dragging ? 'none' : 'pan-y' }}>

        {/* Chapter cluster labels — rendered as virtual elements (not in pins state) */}
        {filter === 'all' && chapters.map(chapter => {
          const cl = chapterLayout[chapter.id];
          if (!cl) return null;
          const chPinCount = pins.filter(p => p.chapterId === chapter.id).length;
          return (
            <div
              key={`cluster-label-${chapter.id}`}
              onClick={() => setActiveChapterId(chapter.id)}
              style={{ position: 'absolute', left: 16, top: cl.labelY, zIndex: 11, cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(94,173,206,0.14)' : 'rgba(94,173,206,0.1)', border: '1px solid rgba(94,173,206,0.35)', borderRadius: 8, padding: '7px 16px 7px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <span style={{ fontFamily: CAVEAT, fontSize: 20, color: darkMode ? '#5eadce' : '#0e7490', fontWeight: 700 }}>📖 {chapter.title}</span>
                <span style={{ fontSize: 10, color: '#5eadce', opacity: 0.8 }}>{chPinCount} item{chPinCount !== 1 ? 's' : ''} · open →</span>
              </div>
            </div>
          );
        })}

        {nudgedPins.map(pin => (
          <div
            key={pin.id}
            style={{ position: 'absolute', left: pin.x, top: pin.y, transform: `rotate(${pin.rot}deg)${dragging === pin.id ? ' scale(1.06)' : ''}`, zIndex: dragging === pin.id ? 50 : (pin.type === 'label' || pin.type === 'sticker') ? 10 : 2, userSelect: 'none', transition: dragging === pin.id ? 'none' : 'transform 0.15s', touchAction: 'none', filter: dragging === pin.id ? (darkMode ? 'drop-shadow(0 16px 32px rgba(0,0,0,0.7))' : 'drop-shadow(0 16px 32px rgba(0,0,0,0.3))') : 'none' }}
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
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', borderRadius: 16, border: `2px dashed ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: ts, fontFamily: CAVEAT, fontSize: 18, cursor: 'pointer' }}>+ Pin something</button>
          </div>
        )}
      </div>

      {showAdd && <AddSheet onClose={() => setShowAdd(false)} onAdd={addPin} darkMode={darkMode} />}
      {detailPin && (
        <DetailSheet
          pin={detailPin}
          chapters={chapters}
          onClose={() => setDetailPin(null)}
          onConvertToEvent={onConvertToEvent}
          onConvertToTrip={onConvertToTrip}
          onMarkDone={markDone}
          heroId={heroId}
          onSetHero={setHeroId}
          onAddToChapter={addPinToChapter}
          onRemoveFromChapter={removePinFromChapter}
          darkMode={darkMode}
        />
      )}
      {showCreateChapter && (
        <CreateChapterSheet
          onClose={() => setShowCreateChapter(false)}
          onCreate={(title) => createChapter(title, [])}
          darkMode={darkMode}
        />
      )}
      {chapterPromptGroup && (
        <ChapterSuggestionPrompt
          group={chapterPromptGroup}
          pins={pins}
          onConfirm={(title) => createChapter(title, chapterPromptGroup.pinIds)}
          onDismiss={() => { setDismissedGroups(prev => new Set([...prev, chapterPromptGroup.id])); setChapterPromptGroup(null); }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default SomedayPage;
