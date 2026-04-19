/**
 * MakeItHappenSheet.jsx — Dream budgeting card
 *
 * Slides up as a bottom sheet when user taps "Make it happen"
 * on any Someday / Dream Shelf item.
 *
 * Props:
 *   item            – { name, priceRange, emoji, brand, category }
 *   onClose         – () => void
 *   onAddEvent      – (eventData) => void   fires to add milestone to calendar
 *   darkMode        – boolean
 *
 * Usage:
 *   import MakeItHappenSheet from './MakeItHappenSheet';
 *
 *   {showBudget && (
 *     <MakeItHappenSheet
 *       item={selectedItem}
 *       onClose={() => setShowBudget(false)}
 *       onAddEvent={onAddEvent}
 *       darkMode={darkMode}
 *     />
 *   )}
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const CAVEAT = '"Caveat", cursive';

// ─── Swipe-down hook ──────────────────────────────────────────────────────────
function useSwipeDownSheet(onClose) {
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(null);
  const dragDistanceRef = useRef(0);

  const handleStart = (clientY) => {
    dragStartYRef.current = clientY;
    dragDistanceRef.current = 0;
    setDragY(0);
  };
  const handleMove = (clientY) => {
    if (dragStartYRef.current == null) return;
    const delta = Math.max(0, clientY - dragStartYRef.current);
    dragDistanceRef.current = delta;
    setDragY(delta);
  };
  const handleEnd = () => {
    const shouldClose = dragDistanceRef.current > 90;
    dragStartYRef.current = null;
    dragDistanceRef.current = 0;
    setDragY(0);
    if (shouldClose) onClose?.();
  };

  return {
    sheetStyle: {
      transform: `translateY(${dragY}px)`,
      transition: dragStartYRef.current ? 'none' : 'transform 200ms ease',
    },
    handleProps: {
      onTouchStart: (e) => handleStart(e.touches[0].clientY),
      onTouchMove:  (e) => handleMove(e.touches[0].clientY),
      onTouchEnd:   handleEnd,
      onMouseDown:  (e) => handleStart(e.clientY),
      onMouseMove:  (e) => { if (dragStartYRef.current == null) return; handleMove(e.clientY); },
      onMouseUp:    handleEnd,
      onMouseLeave: () => { if (dragStartYRef.current != null) handleEnd(); },
      style: { touchAction: 'none', cursor: 'grab' },
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePrice(raw = '') {
  const cleaned = String(raw).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function formatCurrency(val) {
  if (val == null || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function formatDateLong(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function weeksUntil(targetDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target - now;
  return Math.max(0, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
}

const OCCASION_PRESETS = [
  { label: 'Christmas',      emoji: '🎄', getDate: () => { const d = new Date(); d.setMonth(11, 25); if (d < new Date()) d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; } },
  { label: 'New Year',       emoji: '🥂', getDate: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1, 0, 1); return d.toISOString().split('T')[0]; } },
  { label: 'In 3 months',    emoji: '📅', getDate: () => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split('T')[0]; } },
  { label: 'In 6 months',    emoji: '📅', getDate: () => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d.toISOString().split('T')[0]; } },
  { label: 'In a year',      emoji: '🌟', getDate: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; } },
];

const SAVING_SOURCES = [
  { id: 'takeout',     label: 'Skip takeout',     emoji: '🍕' },
  { id: 'coffee',      label: 'Coffee budget',    emoji: '☕' },
  { id: 'entertain',   label: 'Entertainment',    emoji: '🎬' },
  { id: 'hustle',      label: 'Side hustle',      emoji: '💼' },
  { id: 'gifts',       label: 'Birthday money',   emoji: '🎁' },
  { id: 'subscriptions', label: 'Subscriptions',  emoji: '📱' },
];

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 80, stroke = 7, color = '#2dd4bf', bg = 'rgba(45,212,191,0.12)', children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct / 100));
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MakeItHappenSheet({ item, onClose, onAddEvent, darkMode = false }) {
  const dm = darkMode;

  // ── Style tokens ─────────────────────────────────────────────────────────────
  const sheetBg   = dm ? '#131c2e' : '#ffffff';
  const pageBg    = dm ? '#0e1520' : '#faf8f3';
  const bw        = dm ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const tp        = dm ? '#f1f5f9' : '#111827';
  const ts        = dm ? '#6b7280' : '#9ca3af';
  const inputBg   = dm ? 'rgba(255,255,255,0.05)' : '#f8f7f2';
  const inputBdr  = dm ? 'rgba(255,255,255,0.08)' : '#e5e0d5';
  const GOLD      = '#C9A84C';
  const GOLD_DARK = '#8A6A1F';
  const GOLD_MUTED = dm ? 'rgba(201,168,76,0.12)' : '#FFFBEB';
  const GOLD_BORDER = 'rgba(201,168,76,0.35)';
  const TEAL      = '#2dd4bf';
  const TEAL_DARK = '#0d9488';

  // ── State ─────────────────────────────────────────────────────────────────────
  const rawPrice    = item?.priceRange || item?.price || '';
  const parsedPrice = parsePrice(rawPrice);

  const [goalName,     setGoalName]     = useState(item?.name || '');
  const [price,        setPrice]        = useState(parsedPrice != null ? String(Math.round(parsedPrice)) : '');
  const [alreadyHave, setAlreadyHave]  = useState('');
  const [weeklyAmount, setWeeklyAmount] = useState('');
  const [targetDate,   setTargetDate]   = useState('');
  const [sources,      setSources]      = useState([]);
  const [calendarAdded, setCalAdded]   = useState(false);
  const [mode,         setMode]         = useState('weekly'); // 'weekly' | 'date'
  const [showSuccess,  setShowSuccess]  = useState(false);

  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Calculations ──────────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const total   = parseFloat(price) || 0;
    const saved   = parseFloat(alreadyHave) || 0;
    const needed  = Math.max(0, total - saved);
    const weekly  = parseFloat(weeklyAmount) || 0;
    const savedPct = total > 0 ? Math.min(100, Math.round((saved / total) * 100)) : 0;

    if (mode === 'weekly') {
      if (!needed || !weekly) return { needed, savedPct, weeks: null, goalDate: null, weeklyNeeded: null };
      const weeks = Math.ceil(needed / weekly);
      const goalDate = addWeeks(new Date(), weeks);
      return { needed, savedPct, weeks, goalDate, weeklyNeeded: null };
    } else {
      if (!needed || !targetDate) return { needed, savedPct, weeks: null, goalDate: null, weeklyNeeded: null };
      const weeks = weeksUntil(targetDate);
      const weeklyNeeded = weeks > 0 ? Math.ceil(needed / weeks) : needed;
      const goalDate = targetDate ? new Date(targetDate + 'T00:00:00') : null;
      return { needed, savedPct, weeks, goalDate, weeklyNeeded };
    }
  }, [price, alreadyHave, weeklyAmount, targetDate, mode]);

  const toggleSource = (id) => setSources(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleAddToCalendar = () => {
    if (!calc.goalDate) return;
    onAddEvent?.({
      title: `🎯 Get my ${goalName || item?.name}`,
      notes: `${item?.brand ? item.brand + ' · ' : ''}Goal: ${formatCurrency(parseFloat(price))} · Saving ${mode === 'weekly' ? formatCurrency(parseFloat(weeklyAmount)) + '/week' : formatCurrency(calc.weeklyNeeded) + '/week needed'} · ${calc.weeks} weeks`,
      date: calc.goalDate.toISOString().split('T')[0],
      category: 'milestone',
      emoji: item?.emoji || '🎯',
    });
    setCalAdded(true);
    setTimeout(() => setShowSuccess(true), 200);
  };

  const hasGoalDate = calc.goalDate != null;
  const progressPct = calc.savedPct;

  const inputStyle = {
    width: '100%',
    background: inputBg,
    border: `1px solid ${inputBdr}`,
    borderRadius: 14,
    padding: '12px 14px',
    fontSize: 16,
    fontFamily: CAVEAT,
    color: tp,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: ts,
    marginBottom: 8,
    display: 'block',
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');`}</style>
      <div
        style={{ width: '100%', maxWidth: 520, background: sheetBg, borderRadius: '28px 28px 0 0', maxHeight: '94vh', display: 'flex', flexDirection: 'column', borderTop: `1px solid ${bw}`, ...sheetStyle }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div {...handleProps} style={{ width: 36, height: 4, borderRadius: 2, background: dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '14px auto 0', flexShrink: 0, ...handleProps.style }} />

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '18px 20px calc(80px + env(safe-area-inset-bottom))' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: dm ? GOLD : GOLD_DARK, marginBottom: 4 }}>
                Make it happen ✨
              </p>
              <h2 style={{ fontFamily: CAVEAT, fontSize: 28, fontWeight: 700, color: tp, margin: 0, lineHeight: 1.1 }}>
                {goalName || item?.name || 'Your dream'}
              </h2>
              {item?.brand && (
                <p style={{ fontSize: 12, color: ts, margin: '3px 0 0' }}>{item.brand}</p>
              )}
            </div>
            <div style={{ fontSize: 44, flexShrink: 0, lineHeight: 1 }}>
              {item?.emoji || '✨'}
            </div>
          </div>

          {/* ── Goal name ── */}
          <div style={{ marginBottom: 16 }}>
            <span style={sectionLabel}>Name this goal</span>
            <input
              type="text"
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
              placeholder={`My ${item?.name || 'dream'} fund`}
              style={inputStyle}
            />
          </div>

          {/* ── Price + Already have ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <span style={sectionLabel}>Price</span>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ts, fontSize: 15, fontFamily: CAVEAT }}>$</span>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="9,000"
                  style={{ ...inputStyle, paddingLeft: 26 }}
                />
              </div>
            </div>
            <div>
              <span style={sectionLabel}>Already saved</span>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ts, fontSize: 15, fontFamily: CAVEAT }}>$</span>
                <input
                  type="number"
                  value={alreadyHave}
                  onChange={e => setAlreadyHave(e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, paddingLeft: 26 }}
                />
              </div>
            </div>
          </div>

          {/* ── Progress ring (shows when price entered) ── */}
          {parseFloat(price) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: dm ? 'rgba(45,212,191,0.06)' : '#f0fdfa', borderRadius: 16, padding: '14px 16px', marginBottom: 16, border: `1px solid ${dm ? 'rgba(45,212,191,0.12)' : '#99f6e4'}` }}>
              <ProgressRing pct={progressPct} size={68} stroke={6} color={TEAL} bg={dm ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.15)'}>
                <span style={{ fontFamily: CAVEAT, fontSize: 15, fontWeight: 700, color: dm ? TEAL : TEAL_DARK }}>{progressPct}%</span>
              </ProgressRing>
              <div>
                <p style={{ margin: 0, fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, color: dm ? TEAL : TEAL_DARK }}>
                  {formatCurrency(calc.needed)} to go
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: ts }}>
                  {parseFloat(alreadyHave) > 0
                    ? `${formatCurrency(parseFloat(alreadyHave))} already saved — nice start`
                    : 'Every little bit counts'}
                </p>
              </div>
            </div>
          )}

          {/* ── Mode toggle ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[['weekly', '💰 Weekly savings'], ['date', '📅 Pick a date']].map(([m, lbl]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '10px 0',
                  borderRadius: 12,
                  border: `1px solid ${mode === m ? GOLD_BORDER : inputBdr}`,
                  background: mode === m ? GOLD_MUTED : 'transparent',
                  color: mode === m ? (dm ? GOLD : GOLD_DARK) : ts,
                  fontFamily: CAVEAT,
                  fontSize: 15,
                  fontWeight: mode === m ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* ── Weekly mode ── */}
          {mode === 'weekly' && (
            <div style={{ marginBottom: 16 }}>
              <span style={sectionLabel}>I can save per week</span>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: ts, fontSize: 15, fontFamily: CAVEAT }}>$</span>
                <input
                  type="number"
                  value={weeklyAmount}
                  onChange={e => setWeeklyAmount(e.target.value)}
                  placeholder="50"
                  style={{ ...inputStyle, paddingLeft: 26, fontSize: 20 }}
                />
              </div>
            </div>
          )}

          {/* ── Date mode ── */}
          {mode === 'date' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <span style={sectionLabel}>I want this by</span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ ...inputStyle, colorScheme: dm ? 'dark' : 'light' }}
                />
              </div>
              {/* Occasion presets */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', margin: '0 -20px 16px', padding: '0 20px 2px' }}>
                {OCCASION_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setTargetDate(preset.getDate())}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: `1px solid ${targetDate === preset.getDate() ? GOLD_BORDER : inputBdr}`,
                      background: targetDate === preset.getDate() ? GOLD_MUTED : 'transparent',
                      color: targetDate === preset.getDate() ? (dm ? GOLD : GOLD_DARK) : ts,
                      fontFamily: CAVEAT,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all .15s',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {preset.emoji} {preset.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Milestone moment ── */}
          {hasGoalDate && (
            <div style={{
              borderRadius: 20,
              background: dm ? 'rgba(201,168,76,0.07)' : '#FFFBEB',
              border: `1.5px solid ${GOLD_BORDER}`,
              padding: '20px 18px',
              marginBottom: 16,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: GOLD, opacity: 0.10, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -15, left: -15, width: 50, height: 50, borderRadius: '50%', background: GOLD, opacity: 0.07, pointerEvents: 'none' }} />

              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: dm ? GOLD : GOLD_DARK }}>
                🎯 Your milestone
              </p>

              {/* The emotional payoff sentence */}
              <p style={{ margin: '0 0 12px', fontFamily: CAVEAT, fontSize: 20, color: tp, lineHeight: 1.4 }}>
                {mode === 'weekly' ? (
                  <>In <span style={{ color: dm ? GOLD : GOLD_DARK, fontWeight: 700 }}>{calc.weeks} {calc.weeks === 1 ? 'week' : 'weeks'}</span>, on <span style={{ color: dm ? GOLD : GOLD_DARK, fontWeight: 700 }}>{formatDateShort(calc.goalDate)}</span>, {goalName || `your ${item?.name || 'dream'}`} goes from your Dream Shelf to your hands.</>
                ) : (
                  <>By <span style={{ color: dm ? GOLD : GOLD_DARK, fontWeight: 700 }}>{formatDateShort(calc.goalDate)}</span> — just <span style={{ color: dm ? GOLD : GOLD_DARK, fontWeight: 700 }}>{formatCurrency(calc.weeklyNeeded)}/week</span> and you're there.</>
                )}
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                {calc.weeks != null && (
                  <div>
                    <p style={{ margin: 0, fontFamily: CAVEAT, fontSize: 22, fontWeight: 700, color: dm ? GOLD : GOLD_DARK, lineHeight: 1 }}>{calc.weeks}</p>
                    <p style={{ margin: 0, fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.08em' }}>weeks</p>
                  </div>
                )}
                {mode === 'weekly' && parseFloat(weeklyAmount) > 0 && (
                  <div>
                    <p style={{ margin: 0, fontFamily: CAVEAT, fontSize: 22, fontWeight: 700, color: dm ? GOLD : GOLD_DARK, lineHeight: 1 }}>{formatCurrency(parseFloat(weeklyAmount))}</p>
                    <p style={{ margin: 0, fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.08em' }}>per week</p>
                  </div>
                )}
                {mode === 'date' && calc.weeklyNeeded != null && (
                  <div>
                    <p style={{ margin: 0, fontFamily: CAVEAT, fontSize: 22, fontWeight: 700, color: dm ? GOLD : GOLD_DARK, lineHeight: 1 }}>{formatCurrency(calc.weeklyNeeded)}</p>
                    <p style={{ margin: 0, fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.08em' }}>per week needed</p>
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontFamily: CAVEAT, fontSize: 22, fontWeight: 700, color: dm ? GOLD : GOLD_DARK, lineHeight: 1 }}>{formatCurrency(calc.needed)}</p>
                  <p style={{ margin: 0, fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.08em' }}>to save</p>
                </div>
              </div>

              {/* Add to calendar button */}
              {!calendarAdded ? (
                <button
                  onClick={handleAddToCalendar}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    borderRadius: 14,
                    border: 'none',
                    background: dm ? GOLD : GOLD_DARK,
                    color: '#fff',
                    fontFamily: CAVEAT,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'opacity .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  📅 Add milestone to my calendar
                </button>
              ) : (
                <div style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: dm ? 'rgba(45,212,191,0.12)' : '#f0fdfa', border: `1px solid ${dm ? 'rgba(45,212,191,0.3)' : '#99f6e4'}`, color: dm ? TEAL : TEAL_DARK, fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, textAlign: 'center' }}>
                  ✓ Added to your calendar!
                </div>
              )}
            </div>
          )}

          {/* ── Where will the money come from? ── */}
          <div style={{ marginBottom: 20 }}>
            <span style={sectionLabel}>Where will it come from?</span>
            <p style={{ fontSize: 12, color: ts, margin: '0 0 10px', fontStyle: 'italic' }}>Pick what resonates — no pressure, just intention.</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {SAVING_SOURCES.map(src => (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: `1px solid ${sources.includes(src.id) ? GOLD_BORDER : inputBdr}`,
                    background: sources.includes(src.id) ? GOLD_MUTED : 'transparent',
                    color: sources.includes(src.id) ? (dm ? GOLD : GOLD_DARK) : ts,
                    fontFamily: CAVEAT,
                    fontSize: 15,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {src.emoji} {src.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Motivational footer ── */}
          {!hasGoalDate && (
            <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
              <p style={{ fontFamily: CAVEAT, fontSize: 16, color: ts, fontStyle: 'italic', margin: 0 }}>
                Fill in the details above to see your path to {goalName || item?.name || 'this'} ✨
              </p>
            </div>
          )}

          {/* ── Success state ── */}
          {showSuccess && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <p style={{ fontFamily: CAVEAT, fontSize: 18, color: dm ? TEAL : TEAL_DARK, margin: 0 }}>
                You've got a plan. Now go make it happen. 🎯
              </p>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
