/**
 * ExplorePage.jsx
 *
 * Props:
 *   currentUser        – { id, name, avatarUrl? }
 *   feedItems          – array of feed item objects (see FEED ITEM SHAPE below)
 *   onAddEvent         – (item) => void
 *   onSaveToSomeday    – (item) => void
 *   onCopyTrip         – (item) => void
 *   onJoinPublicEvent  – (item) => void
 *   onStartGoal        – (item) => void
 *   onReact            – (itemId, reacted) => void
 *   darkMode           – boolean
 */

import React, { useState, useCallback, useRef, createContext, useContext } from 'react';

// ─── dark mode context ────────────────────────────────────────────────────────

const DarkCtx = createContext(false);
const useDark = () => useContext(DarkCtx);
const dm = (dark, light, isDark) => (isDark ? dark : light);

// ─── design tokens ────────────────────────────────────────────────────────────

const T = {
  pageBg:      (d) => dm('#0d0d11', '#f4f3f0', d),
  cardBg:      (d) => dm('#1a1a1f', '#ffffff', d),
  cardBorder:  (d) => dm('rgba(255,255,255,0.07)', 'rgba(15,23,42,0.08)', d),
  surfaceBg:   (d) => dm('#242429', '#f5f3ee', d),
  headerBg:    (d) => dm('#111115', '#ffffff', d),
  divider:     (d) => dm('rgba(255,255,255,0.07)', 'rgba(15,23,42,0.07)', d),
  textPrimary: (d) => dm('#f0f0f5', '#1a1a2e', d),
  textSecond:  (d) => dm('#888896', '#666680', d),
  textThird:   (d) => dm('#55555f', '#99999f', d),
  btnPrimaryBg:(d) => dm('#2e2e38', '#1a1a2e', d),
  btnPrimaryFg:(d) => dm('#f0f0f5', '#ffffff', d),
  btnSecondBg: (d) => dm('#1e1e24', '#f5f3ee', d),
  btnSecondFg: (d) => dm('#aaaabc', '#444455', d),
  btnSecondBdr:(d) => dm('rgba(255,255,255,0.1)', 'rgba(15,23,42,0.12)', d),
  btnGhostFg:  (d) => dm('#55555f', '#999999', d),
  btnGhostBdr: (d) => dm('rgba(255,255,255,0.07)', 'rgba(15,23,42,0.1)', d),
};

// ─── constants ────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'moment',  label: 'Moments' },
  { id: 'trip',    label: 'Trips' },
  { id: 'event',   label: 'Events' },
  { id: 'public',  label: 'Public' },
];

const TYPE_META = {
  moment:  { label: 'Moment',  light: { bg: '#EEEDFE', color: '#3C3489' }, dark: { bg: 'rgba(127,119,221,0.18)', color: '#a5b4fc' } },
  trip:    { label: 'Trip',    light: { bg: '#FAEEDA', color: '#633806' }, dark: { bg: 'rgba(186,117,23,0.18)',  color: '#fbbf24' } },
  public:  { label: 'Public',  light: { bg: '#EAF3DE', color: '#27500A' }, dark: { bg: 'rgba(99,153,34,0.18)',   color: '#86efac' } },
  journey: { label: 'Journey', light: { bg: '#FAECE7', color: '#712B13' }, dark: { bg: 'rgba(216,90,48,0.18)',   color: '#fb923c' } },
};

// ─── sample data ──────────────────────────────────────────────────────────────

export const SAMPLE_FEED = [
  {
    id: '1',
    type: 'moment',
    author: { name: 'Sarah R.', initials: 'SR', avatarColor: '#EEEDFE', avatarTextColor: '#3C3489' },
    title: 'Ice skating at Pershing Square',
    subtitle: '"Best winter date night we\'ve had in years 🥰"',
    imageEmoji: '⛸️',
    imageBg: 'linear-gradient(135deg,#E1F5EE,#FAEEDA)',
    location: 'Los Angeles, CA',
    date: 'Last Saturday',
    reactions: 3,
    userReacted: false,
  },
  {
    id: '2',
    type: 'trip',
    author: { name: 'James & Kim', initials: 'JK', avatarColor: '#FAEEDA', avatarTextColor: '#633806' },
    title: '10 days in Japan — Kyoto + Tokyo',
    subtitle: '"Honestly the trip of a lifetime. Go."',
    imageEmoji: '🗾',
    imageBg: 'linear-gradient(135deg,#E6F1FB,#FBEAF0)',
    itinerary: [
      { day: 'Day 1–3 · Kyoto', stops: ['Fushimi Inari shrine (morning)', 'Nishiki Market food walk', 'Gion district at dusk'] },
    ],
    totalStops: 17,
    reactions: 11,
    userReacted: false,
  },
  {
    id: '3',
    type: 'public',
    author: { name: 'Grand Park LA', initials: 'GP', avatarColor: '#EAF3DE', avatarTextColor: '#27500A', isPublic: true },
    title: 'Winter Night Market',
    subtitle: 'Street food, live music, and holiday lights.',
    imageEmoji: '🎪',
    imageBg: 'linear-gradient(135deg,#FBEAF0,#EEEDFE)',
    eventDate: 'Sat Dec 14',
    eventTime: '5–10 pm',
    location: 'Downtown LA',
    attendees: [
      { initials: 'SR', color: '#EEEDFE', textColor: '#3C3489' },
      { initials: 'JK', color: '#FAEEDA', textColor: '#633806' },
      { initials: 'MP', color: '#FBEAF0', textColor: '#72243E' },
    ],
    friendsGoing: 'Sarah, James + 24 others going',
    reactions: 27,
    userReacted: false,
  },
  {
    id: '4',
    type: 'journey',
    author: { name: 'Maya P.', initials: 'MP', avatarColor: '#FAECE7', avatarTextColor: '#712B13' },
    title: '30-day running streak 🔥',
    subtitle: '"Finally hit 30 days. Ran every single morning. If I can do it, anyone can."',
    imageEmoji: '🏃',
    imageBg: 'linear-gradient(135deg,#EAF3DE,#FAEEDA)',
    streakCurrent: 30,
    streakTotal: 30,
    reactions: 8,
    userReacted: false,
  },
  {
    id: '5',
    type: 'moment',
    author: { name: 'Tom & Lena', initials: 'TL', avatarColor: '#FBEAF0', avatarTextColor: '#72243E' },
    title: 'Hiked to the Hollywood Sign',
    subtitle: '"Harder than it looks on the map, worth every step."',
    imageEmoji: '🥾',
    imageBg: 'linear-gradient(135deg,#EAF3DE,#E6F1FB)',
    location: 'Griffith Park, LA',
    date: '2 days ago',
    reactions: 6,
    userReacted: false,
  },
  {
    id: '6',
    type: 'trip',
    author: { name: 'Priya K.', initials: 'PK', avatarColor: '#E1F5EE', avatarTextColor: '#085041' },
    title: 'Long weekend in Palm Springs',
    subtitle: '"Pools, mid-century architecture, and way too much food."',
    imageEmoji: '🌴',
    imageBg: 'linear-gradient(135deg,#FAEEDA,#FAECE7)',
    itinerary: [
      { day: 'Day 1', stops: ['Check in at The Saguaro', 'Tram up San Jacinto Peak', 'Dinner at Workshop Kitchen'] },
    ],
    totalStops: 9,
    reactions: 14,
    userReacted: true,
  },
];

// ─── shared small components ──────────────────────────────────────────────────

const Avatar = ({ initials, color, textColor, size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: color || '#EEEDFE', color: textColor || '#3C3489',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size < 24 ? 9 : 11, fontWeight: 600, flexShrink: 0,
  }}>
    {initials}
  </div>
);

const TypeBadge = ({ type }) => {
  const dark = useDark();
  const meta = TYPE_META[type] || TYPE_META.moment;
  const palette = dark ? meta.dark : meta.light;
  return (
    <span style={{
      marginLeft: 'auto', padding: '3px 8px', borderRadius: 8,
      fontSize: 10, fontWeight: 700, letterSpacing: '.03em',
      background: palette.bg, color: palette.color,
    }}>
      {meta.label}
    </span>
  );
};

const ActionBtn = ({ onClick, variant = 'primary', children }) => {
  const dark = useDark();
  const variants = {
    primary:   { background: T.btnPrimaryBg(dark), color: T.btnPrimaryFg(dark), border: 'none' },
    secondary: { background: T.btnSecondBg(dark),  color: T.btnSecondFg(dark),  border: `1px solid ${T.btnSecondBdr(dark)}` },
    ghost:     { background: 'transparent',         color: T.btnGhostFg(dark),   border: `1px solid ${T.btnGhostBdr(dark)}` },
  };
  return (
    <button style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '8px 13px', borderRadius: 12,
      fontSize: 12, fontWeight: 500, cursor: 'pointer',
      transition: 'all .15s', fontFamily: 'inherit', whiteSpace: 'nowrap',
      ...variants[variant],
    }} onClick={onClick}>
      {children}
    </button>
  );
};

// ─── icons ────────────────────────────────────────────────────────────────────

const CalIcon = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 6h11M4 1v2M9 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const PinIcon = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5C4.3 1.5 2.5 3.3 2.5 5.5c0 3.3 4 7 4 7s4-3.7 4-7c0-2.2-1.8-4-4-4z" stroke="currentColor" strokeWidth="1.3"/></svg>;
const CopyIcon = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 8V2h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const SaveIcon = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2h9v9l-4.5-2L2 11V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
const CheckIcon = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const GoalIcon = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 6.5l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ClockIcon = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3.5v3l1.5 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>;

// ─── toast ────────────────────────────────────────────────────────────────────

const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a1a', color: '#fff', padding: '10px 20px',
      borderRadius: 24, fontSize: 13, fontWeight: 500,
      whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none',
      animation: 'toastIn .22s ease',
    }}>
      {message}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
};

// ─── card building blocks ─────────────────────────────────────────────────────

const CardShell = ({ children }) => {
  const dark = useDark();
  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      border: `1px solid ${T.cardBorder(dark)}`,
      background: T.cardBg(dark),
    }}>
      {children}
    </div>
  );
};

const CardImage = ({ emoji, url, bg }) => (
  <div style={{
    width: '100%', height: 160, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: bg || '#e8e6e0',
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: 'cover', backgroundPosition: 'center',
    fontSize: 56, userSelect: 'none',
  }}>
    {!url && emoji}
  </div>
);

const CardMeta = ({ author, type }) => {
  const dark = useDark();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <Avatar initials={author.initials} color={author.avatarColor} textColor={author.avatarTextColor} />
      <span style={{ fontSize: 12, color: T.textSecond(dark) }}>
        <strong style={{ color: T.textPrimary(dark), fontWeight: 500 }}>{author.name}</strong>
        {' '}{type === 'moment' ? 'had a moment' : type === 'trip' ? 'shared a trip' : type === 'journey' ? 'shared a milestone' : '· Public event'}
      </span>
      <TypeBadge type={type} />
    </div>
  );
};

const ReactRow = ({ reactions, reacted, onReact }) => {
  const dark = useDark();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      paddingTop: 10, marginTop: 10,
      borderTop: `1px solid ${T.divider(dark)}`,
    }}>
      <button
        onClick={onReact}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: reacted ? '#e24b4a' : T.textSecond(dark),
          display: 'flex', alignItems: 'center', gap: 4,
          padding: 0, fontFamily: 'inherit', transition: 'transform .1s',
          fontWeight: reacted ? 600 : 400,
        }}
      >
        ❤️ {reactions}
      </button>
    </div>
  );
};

// ─── MOMENT CARD ──────────────────────────────────────────────────────────────

const MomentCard = ({ item, onAddEvent, onSaveToSomeday, onReact, showToast }) => {
  const dark = useDark();
  const [reacted, setReacted] = useState(item.userReacted || false);
  const [reactions, setReactions] = useState(item.reactions || 0);

  const handleReact = () => {
    const next = !reacted;
    setReacted(next);
    setReactions(r => r + (next ? 1 : -1));
    onReact?.(item.id, next);
  };

  return (
    <CardShell>
      <CardImage emoji={item.imageEmoji} url={item.imageUrl} bg={item.imageBg} />
      <div style={{ padding: 14 }}>
        <CardMeta author={item.author} type="moment" />
        {(item.date || item.location) && (
          <div style={{ fontSize: 11, color: T.textThird(dark), marginBottom: 6, display: 'flex', gap: 8 }}>
            {item.date && <span>{item.date}</span>}
            {item.location && <span>· {item.location}</span>}
          </div>
        )}
        <div className="explore-heading" style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary(dark), marginBottom: 4, lineHeight: 1.25 }}>{item.title}</div>
        {item.subtitle && <div style={{ fontSize: 13, color: T.textSecond(dark), marginBottom: 12, lineHeight: 1.4 }}>{item.subtitle}</div>}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <ActionBtn variant="primary" onClick={() => { onAddEvent?.(item); showToast('Added to your calendar! 📅'); }}>
            <CalIcon /> Add event
          </ActionBtn>
          <ActionBtn variant="secondary" onClick={() => { onSaveToSomeday?.(item); showToast('Saved to someday list ✨'); }}>
            <PinIcon /> Someday list
          </ActionBtn>
        </div>
        <ReactRow reactions={reactions} reacted={reacted} onReact={handleReact} />
      </div>
    </CardShell>
  );
};

// ─── TRIP CARD ────────────────────────────────────────────────────────────────

const TripCard = ({ item, onSaveToSomeday, onCopyTrip, onReact, showToast }) => {
  const dark = useDark();
  const [reacted, setReacted] = useState(item.userReacted || false);
  const [reactions, setReactions] = useState(item.reactions || 0);
  const [expanded, setExpanded] = useState(false);

  const handleReact = () => {
    const next = !reacted;
    setReacted(next);
    setReactions(r => r + (next ? 1 : -1));
    onReact?.(item.id, next);
  };

  const firstDay = item.itinerary?.[0];

  return (
    <CardShell>
      <CardImage emoji={item.imageEmoji} url={item.imageUrl} bg={item.imageBg} />
      <div style={{ padding: 14 }}>
        <CardMeta author={item.author} type="trip" />
        <div className="explore-heading" style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary(dark), marginBottom: 4, lineHeight: 1.25 }}>{item.title}</div>
        {item.subtitle && <div style={{ fontSize: 13, color: T.textSecond(dark), marginBottom: 10, lineHeight: 1.4 }}>{item.subtitle}</div>}

        {firstDay && (
          <div style={{ background: T.surfaceBg(dark), borderRadius: 12, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textThird(dark), marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>
              {firstDay.day}
            </div>
            {(expanded ? firstDay.stops : firstDay.stops.slice(0, 3)).map((stop, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12, color: T.textSecond(dark) }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7F77DD', flexShrink: 0 }} />
                {stop}
              </div>
            ))}
            {item.totalStops > 3 && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{ fontSize: 11, color: T.textThird(dark), background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0 14px', fontFamily: 'inherit' }}
              >
                {expanded ? '↑ Show less' : `+ ${item.totalStops - 3} more stops across the trip`}
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <ActionBtn variant="primary" onClick={() => { onSaveToSomeday?.(item); showToast('Itinerary saved to someday list ✨'); }}>
            <SaveIcon /> Save itinerary
          </ActionBtn>
          <ActionBtn variant="secondary" onClick={() => { onCopyTrip?.(item); showToast('Trip copied to your trips! ✈️'); }}>
            <CopyIcon /> Copy trip
          </ActionBtn>
        </div>
        <ReactRow reactions={reactions} reacted={reacted} onReact={handleReact} />
      </div>
    </CardShell>
  );
};

// ─── PUBLIC EVENT CARD ────────────────────────────────────────────────────────

const PublicEventCard = ({ item, onJoinPublicEvent, onSaveToSomeday, onReact, showToast }) => {
  const dark = useDark();
  const [reacted, setReacted] = useState(item.userReacted || false);
  const [reactions, setReactions] = useState(item.reactions || 0);
  const [joined, setJoined] = useState(false);

  const handleReact = () => {
    const next = !reacted;
    setReacted(next);
    setReactions(r => r + (next ? 1 : -1));
    onReact?.(item.id, next);
  };

  const handleJoin = () => {
    if (!joined) {
      setJoined(true);
      onJoinPublicEvent?.(item);
      showToast('Joined! Added to your calendar 📅');
    }
  };

  return (
    <CardShell>
      <CardImage emoji={item.imageEmoji} url={item.imageUrl} bg={item.imageBg} />
      <div style={{ padding: 14 }}>
        <CardMeta author={item.author} type="public" />
        <div className="explore-heading" style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary(dark), marginBottom: 8, lineHeight: 1.25 }}>{item.title}</div>

        {(item.eventDate || item.eventTime) && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 8, marginBottom: 8,
            background: dark ? 'rgba(99,153,34,0.18)' : '#EAF3DE',
            color: dark ? '#86efac' : '#27500A',
            fontSize: 11, fontWeight: 600,
          }}>
            <ClockIcon />
            {[item.eventDate, item.eventTime, item.location].filter(Boolean).join(' · ')}
          </div>
        )}

        {item.friendsGoing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ display: 'flex' }}>
              {(item.attendees || []).slice(0, 3).map((a, i) => (
                <div key={i} style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: a.color, color: a.textColor,
                  fontSize: 8, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: i === 0 ? 0 : -6,
                  border: `1.5px solid ${T.cardBg(dark)}`,
                }}>
                  {a.initials}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: T.textSecond(dark) }}>{item.friendsGoing}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <ActionBtn variant={joined ? 'secondary' : 'primary'} onClick={handleJoin}>
            <CheckIcon /> {joined ? 'Joined ✓' : 'Join event'}
          </ActionBtn>
          <ActionBtn variant="ghost" onClick={() => { onSaveToSomeday?.(item); showToast('Saved to someday list ✨'); }}>
            Maybe someday
          </ActionBtn>
        </div>
        <ReactRow reactions={reactions} reacted={reacted} onReact={handleReact} />
      </div>
    </CardShell>
  );
};

// ─── JOURNEY CARD ─────────────────────────────────────────────────────────────

const JourneyCard = ({ item, onStartGoal, onReact, showToast }) => {
  const dark = useDark();
  const [reacted, setReacted] = useState(item.userReacted || false);
  const [reactions, setReactions] = useState(item.reactions || 0);
  const [started, setStarted] = useState(false);

  const handleReact = () => {
    const next = !reacted;
    setReacted(next);
    setReactions(r => r + (next ? 1 : -1));
    onReact?.(item.id, next);
  };

  const pct = item.streakTotal > 0 ? Math.round((item.streakCurrent / item.streakTotal) * 100) : 100;

  return (
    <CardShell>
      <div style={{ padding: 16 }}>
        <CardMeta author={item.author} type="journey" />
        <div className="explore-heading" style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary(dark), marginBottom: 4, lineHeight: 1.25 }}>{item.title}</div>
        {item.subtitle && (
          <div style={{ fontSize: 13, color: T.textSecond(dark), marginBottom: 10, lineHeight: 1.4, fontStyle: 'italic' }}>
            {item.subtitle}
          </div>
        )}

        {item.streakTotal > 0 && (
          <div style={{ background: T.surfaceBg(dark), borderRadius: 12, padding: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: T.textThird(dark), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: dark ? '#86efac' : '#639922' }}>{item.streakCurrent} / {item.streakTotal} days</span>
            </div>
            <div style={{ height: 6, background: T.divider(dark), borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: dark ? '#4ade80' : '#639922', borderRadius: 3, transition: 'width .6s ease' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <ActionBtn
            variant={started ? 'secondary' : 'primary'}
            onClick={() => { if (!started) { setStarted(true); onStartGoal?.(item); showToast('Goal added to your Journey! 🎯'); } }}
          >
            <GoalIcon /> {started ? 'Goal added ✓' : 'Start this goal'}
          </ActionBtn>
        </div>
        <ReactRow reactions={reactions} reacted={reacted} onReact={handleReact} />
      </div>
    </CardShell>
  );
};

// ─── font loader ─────────────────────────────────────────────────────────────

const CaveatLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
    .explore-heading { font-family: 'Caveat', cursive; }
  `}</style>
);

// ─── MAIN EXPLORE PAGE ────────────────────────────────────────────────────────

const ExplorePage = ({
  currentUser = { id: 'me', name: 'You' },
  feedItems = SAMPLE_FEED,
  onAddEvent,
  onSaveToSomeday,
  onCopyTrip,
  onJoinPublicEvent,
  onStartGoal,
  onReact,
  darkMode = false,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2300);
  }, []);

  const filtered = activeFilter === 'all'
    ? feedItems
    : feedItems.filter(item => {
        if (activeFilter === 'event') return item.type === 'moment' || item.type === 'public';
        return item.type === activeFilter;
      });

  const renderCard = (item) => {
    const shared = { key: item.id, item, onReact, showToast };
    switch (item.type) {
      case 'moment':  return <MomentCard {...shared} onAddEvent={onAddEvent} onSaveToSomeday={onSaveToSomeday} />;
      case 'trip':    return <TripCard {...shared} onSaveToSomeday={onSaveToSomeday} onCopyTrip={onCopyTrip} />;
      case 'public':  return <PublicEventCard {...shared} onJoinPublicEvent={onJoinPublicEvent} onSaveToSomeday={onSaveToSomeday} />;
      case 'journey': return <JourneyCard {...shared} onStartGoal={onStartGoal} />;
      default: return null;
    }
  };

  return (
    <DarkCtx.Provider value={darkMode}>
      <CaveatLoader />
      <div style={{ minHeight: '100vh', background: T.pageBg(darkMode), fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

        {/* Header */}
        <div style={{
          padding: '16px 18px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: T.headerBg(darkMode),
          borderBottom: `1px solid ${T.divider(darkMode)}`,
        }}>
          <span className="explore-heading" style={{ fontSize: 32, fontWeight: 700, color: T.textPrimary(darkMode) }}>Explore ✦</span>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 16 }}>
            {['Friends', 'Nearby'].map(label => (
              <button key={label} style={{
                padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                background: T.surfaceBg(darkMode), color: T.textSecond(darkMode),
                border: `1px solid ${T.btnSecondBdr(darkMode)}`,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div style={{
          display: 'flex', gap: 7, padding: '12px 16px',
          overflowX: 'auto', background: T.headerBg(darkMode),
          borderBottom: `1px solid ${T.divider(darkMode)}`,
          scrollbarWidth: 'none',
        }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '7px 16px', borderRadius: 20,
                fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                ...(activeFilter === f.id
                  ? { background: T.textPrimary(darkMode), color: T.pageBg(darkMode), border: '1px solid transparent' }
                  : { background: T.surfaceBg(darkMode), color: T.textSecond(darkMode), border: `1px solid ${T.btnSecondBdr(darkMode)}` }
                ),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div style={{ padding: '14px 14px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: T.textThird(darkMode), fontSize: 14 }}>
              Nothing here yet — invite friends to get the feed going.
            </div>
          ) : (
            filtered.map(renderCard)
          )}
        </div>

        <Toast message={toastMsg} />
      </div>
    </DarkCtx.Provider>
  );
};

export default ExplorePage;
