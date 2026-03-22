import React, { useEffect, useState, useMemo } from 'react';
import { X, Trophy, RotateCcw, ChevronDown, ChevronUp, Users, Target } from 'lucide-react';

// ---------------------------------------------------------------------------
// Theme - Blue/Teal accent to differentiate from Gauntlet (gold) and Scramble (neon green)
// ---------------------------------------------------------------------------

const T = {
  bg: '#0c0f16',
  surface: '#12151d',
  card: '#181c27',
  border: 'rgba(255,255,255,0.08)',
  borderGlow: 'rgba(59,130,246,0.25)',
  blue: '#3b82f6',
  blueText: '#60a5fa',
  teal: '#14b8a6',
  accent: '#0ea5e9',
  red: '#ef4444',
  muted: 'rgba(255,255,255,0.35)',
  text: 'rgba(255,255,255,0.92)',
  sub: 'rgba(255,255,255,0.55)',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildRoundRobinRounds = (participants, teamsOf = 2) => {
  const list = [...(Array.isArray(participants) ? participants : [])];
  if (list.length < teamsOf * 2) return [];
  const teams = [];
  if (teamsOf === 1) {
    list.forEach((p, i) => teams.push({ id: `team-${i}`, members: [p] }));
  } else {
    for (let i = 0; i + 1 < list.length; i += 2)
      teams.push({ id: `team-${i}`, members: [list[i], list[i + 1]] });
    if (list.length % 2 !== 0)
      teams.push({ id: `team-solo`, members: [list[list.length - 1]] });
  }
  const n = teams.length;
  if (n < 2) return [];
  const slots = n % 2 === 0 ? [...teams] : [...teams, { id: 'bye', members: [], isBye: true }];
  const slotCount = slots.length;
  const rounds = [];
  const fixed = slots[0];
  const rotating = slots.slice(1);
  for (let r = 0; r < slotCount - 1; r++) {
    const current = [fixed, ...rotating];
    const matches = [];
    for (let i = 0; i < slotCount / 2; i++) {
      const teamA = current[i];
      const teamB = current[slotCount - 1 - i];
      if (teamA.isBye || teamB.isBye) continue;
      matches.push({ id: `rr-r${r}-m${i}`, round: r, teamA, teamB, scoreA: '', scoreB: '', completed: false });
    }
    if (matches.length > 0) rounds.push({ index: r, matches });
    rotating.unshift(rotating.pop());
  }
  return rounds;
};

const deriveStandings = (participants, rounds) => {
  const stats = {};
  (Array.isArray(participants) ? participants : []).forEach((p) => {
    stats[p.id] = { id: p.id, displayName: String(p.displayName || p.name || 'Player'), wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, played: 0 };
  });
  (Array.isArray(rounds) ? rounds : []).forEach((round) => {
    (round.matches || []).filter((m) => m.completed).forEach((m) => {
      const a = parseInt(String(m.scoreA || ''), 10);
      const b = parseInt(String(m.scoreB || ''), 10);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0 || a === b) return;
      const aWon = a > b;
      [...(m.teamA?.members || [])].forEach((p) => {
        if (!stats[p.id]) return;
        stats[p.id].pointsFor += a; stats[p.id].pointsAgainst += b; stats[p.id].played++;
        if (aWon) stats[p.id].wins++; else stats[p.id].losses++;
      });
      [...(m.teamB?.members || [])].forEach((p) => {
        if (!stats[p.id]) return;
        stats[p.id].pointsFor += b; stats[p.id].pointsAgainst += a; stats[p.id].played++;
        if (!aWon) stats[p.id].wins++; else stats[p.id].losses++;
      });
    });
  });
  return Object.values(stats).map((row) => ({
    ...row,
    participant: (Array.isArray(participants) ? participants : []).find((p) => String(p?.id || '') === String(row.id || '')) || null,
  })).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diff = (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
    return diff !== 0 ? diff : b.pointsFor - a.pointsFor;
  });
};

const initials = (name) => {
  const parts = String(name || '?').trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : String(name || '?')[0].toUpperCase();
};

const getNames = (team) => {
  if (!team || team.isBye) return ['Bye'];
  return (team.members || []).map((p) => String(p.displayName || p.name || 'Player'));
};

// ---------------------------------------------------------------------------
// Styled Components
// ---------------------------------------------------------------------------

const shell = {
  background: `linear-gradient(180deg, ${T.bg} 0%, ${T.surface} 100%)`,
  border: `1px solid ${T.borderGlow}`,
  borderRadius: 20,
  overflow: 'hidden',
  color: T.text,
  boxShadow: '0 22px 48px rgba(0,0,0,0.32)',
  fontFamily: '"DM Sans", sans-serif',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '100%',
  minHeight: 0,
};

const heroStyle = {
  padding: '20px 22px 28px',
  borderBottom: `1px solid ${T.border}`,
  position: 'relative',
  overflow: 'hidden',
  minHeight: 248,
};

const heroBg = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background: `
    radial-gradient(ellipse 60% 80% at 90% 50%, rgba(59,130,246,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 30% 60% at 10% 0%, rgba(20,184,166,0.04) 0%, transparent 60%)
  `,
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'rgba(59,130,246,0.10)',
  border: '1px solid rgba(59,130,246,0.25)',
  borderRadius: 999,
  padding: '4px 11px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  color: T.blueText,
  textTransform: 'uppercase',
  marginBottom: 10,
  fontFamily: '"Syne", sans-serif',
};

const liveDot = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: T.blue,
  animation: 'rr-pulse 2s infinite',
};

const heroTitle = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#fff',
  lineHeight: 1,
  margin: 0,
};

const heroSub = {
  fontSize: 13,
  color: T.sub,
  margin: '6px 0 0',
  lineHeight: 1.5,
  maxWidth: 'none',
};

const closeBtn = {
  position: 'absolute',
  top: 18,
  right: 18,
  zIndex: 3,
  width: 30,
  height: 30,
  borderRadius: 8,
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${T.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: T.sub,
  transition: 'all 0.2s',
};

const infoBar = {
  margin: '14px 14px 0',
  background: 'rgba(59,130,246,0.05)',
  border: '1px solid rgba(59,130,246,0.13)',
  borderRadius: 10,
  padding: '9px 13px',
  fontSize: 11.5,
  color: 'rgba(96,165,250,0.75)',
  lineHeight: 1.5,
};

const tabRow = {
  display: 'flex',
  gap: 4,
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: 4,
  margin: '14px 14px 0',
};

const tabBtnBase = {
  fontFamily: '"Syne", sans-serif',
  flex: 1,
  padding: '9px 12px',
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.18s',
  background: 'transparent',
  color: T.sub,
};

const tabBtnActive = {
  ...tabBtnBase,
  background: T.blue,
  color: '#fff',
};

const actionPrimary = {
  fontFamily: '"Syne", sans-serif',
  padding: '9px 16px',
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  border: 'none',
  background: T.blue,
  color: '#fff',
  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
  transition: 'all 0.18s',
};

const actionSecondary = {
  ...actionPrimary,
  background: 'rgba(255,255,255,0.06)',
  color: T.sub,
  boxShadow: 'none',
  border: `1px solid ${T.border}`,
};

const emptyState = {
  padding: '40px 20px',
  textAlign: 'center',
  fontSize: 13,
  color: T.muted,
  lineHeight: 1.6,
};

const segRow = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  marginTop: 14,
};

const segBtnBase = {
  ...tabBtnBase,
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${T.border}`,
  color: T.sub,
};

const segBtnActive = {
  ...segBtnBase,
  background: 'rgba(59,130,246,0.14)',
  border: `1px solid rgba(59,130,246,0.28)`,
  color: '#fff',
};

const fieldLabel = {
  display: 'block',
  fontFamily: '"Syne", sans-serif',
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: T.muted,
  marginBottom: 6,
};

const inputBase = {
  width: '100%',
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  color: T.text,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 13,
  padding: '12px 13px',
  outline: 'none',
};

const rosterCard = {
  marginTop: 12,
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: '12px 14px',
};

const rosterHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
};

const rosterTitleStyle = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 12,
  fontWeight: 700,
  color: T.text,
};

const rosterCountBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'rgba(59,130,246,0.12)',
  border: '1px solid rgba(59,130,246,0.22)',
  borderRadius: 999,
  padding: '3px 8px',
  fontSize: 10,
  fontWeight: 700,
  color: T.blueText,
};

const matchCard = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: '12px 14px',
  marginBottom: 10,
};

const matchHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
};

const matchNum = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: T.muted,
};

const completeBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'rgba(59,130,246,0.12)',
  border: '1px solid rgba(59,130,246,0.22)',
  borderRadius: 999,
  padding: '3px 8px',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: T.blueText,
  textTransform: 'uppercase',
};

const teamSlotBase = {
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: '10px 12px',
  marginBottom: 8,
};

const teamSlotWinner = {
  ...teamSlotBase,
  background: 'rgba(59,130,246,0.08)',
  border: '1px solid rgba(59,130,246,0.22)',
};

const teamTag = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: T.muted,
  marginBottom: 5,
};

const teamNameText = {
  fontSize: 13,
  fontWeight: 600,
  color: T.text,
  lineHeight: 1.3,
};

const scoreRow = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: 10,
  alignItems: 'center',
};

const scoreInput = {
  width: '100%',
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  color: T.text,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 18,
  fontWeight: 700,
  padding: '8px',
  textAlign: 'center',
  outline: 'none',
};

const cardOuter = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  overflow: 'hidden',
  marginTop: 10,
};

const cardHeaderStyle = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: T.muted,
  padding: '12px 14px',
  borderBottom: `1px solid ${T.border}`,
};

const standingsCols = {
  display: 'grid',
  gridTemplateColumns: '50px minmax(0,1fr) 60px 60px 60px',
  gap: 10,
  padding: '8px 14px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: T.muted,
  borderBottom: `1px solid ${T.border}`,
};

const standingRowStyle = {
  display: 'grid',
  gridTemplateColumns: '50px minmax(0,1fr) 60px 60px 60px',
  gap: 10,
  padding: '10px 14px',
  alignItems: 'center',
  borderBottom: `1px solid ${T.border}`,
};

const footerStyle = {
  padding: '12px 14px',
  borderTop: `1px solid ${T.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const RankBadge = ({ index }) => {
  const getRankStyle = () => {
    if (index === 0) return { bg: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', color: '#1a1a1a' };
    if (index === 1) return { bg: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)', color: '#1a1a1a' };
    if (index === 2) return { bg: 'linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%)', color: '#1a1a1a' };
    return { bg: 'rgba(255,255,255,0.08)', color: T.sub };
  };

  const style = getRankStyle();
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: style.bg,
        color: style.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 800,
        fontFamily: '"Syne", sans-serif',
      }}
    >
      {index + 1}
    </div>
  );
};

const StatVal = ({ value, positive, negative, muted }) => {
  let color = T.text;
  if (positive) color = '#4fffb0';
  if (negative) color = '#ff6b9d';
  if (muted) color = T.muted;

  return (
    <div style={{ fontSize: 13, fontWeight: 700, color, textAlign: 'right' }}>
      {value}
    </div>
  );
};

const getParticipantPhotoUrl = (participant) => String(
  participant?.photoUrl
  || participant?.photo_url
  || participant?.avatarUrl
  || participant?.avatar_url
  || ''
).trim();

function PodiumAvatar({ participant, label, fallbackPhotoUrl = '', currentUserId = '', currentUserAliases = [] }) {
  const normalizedLabel = String(label || '').trim().toLowerCase();
  const normalizedAliases = (Array.isArray(currentUserAliases) ? currentUserAliases : [])
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
  const matchesCurrentUser =
    (String(participant?.userId || '').trim() && String(participant?.userId || '').trim() === String(currentUserId || '').trim())
    || (normalizedLabel && normalizedAliases.includes(normalizedLabel));
  const photoUrl = getParticipantPhotoUrl(participant) || (matchesCurrentUser ? String(fallbackPhotoUrl || '').trim() : '');
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={label}
        style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.borderGlow}` }}
      />
    );
  }
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 900,
        background: 'rgba(59,130,246,0.12)',
        color: T.blueText,
        border: `2px solid ${T.borderGlow}`,
        margin: '0 auto',
      }}
    >
      {String(label || '?').trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}

const CelebrationPodium = ({ rows }) => {
  const pieces = Array.from({ length: 18 }, (_, idx) => ({
    id: idx,
    left: `${4 + ((idx * 11) % 92)}%`,
    delay: `${(idx % 6) * 0.12}s`,
    duration: `${3 + (idx % 4) * 0.35}s`,
    background: idx % 3 === 0 ? '#60a5fa' : idx % 3 === 1 ? '#2dd4bf' : '#f472b6',
    rotate: `${(idx % 2 === 0 ? 1 : -1) * (16 + idx * 5)}deg`,
  }));
  const visualRows = [rows[1], rows[0], rows[2]];
  const podiumStyle = {
    background: `linear-gradient(145deg, rgba(59,130,246,0.08) 0%, rgba(20,184,166,0.06) 100%)`,
    border: `1px solid ${T.borderGlow}`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    margin: '0 0 10px',
    boxShadow: '0 0 40px rgba(59,130,246,0.16)',
    position: 'relative',
    overflow: 'hidden',
  };

  const slotBase = {
    textAlign: 'center',
  };

  const iconRow = {
    fontSize: 32,
    marginBottom: 6,
    filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.45))',
  };

  const nameRow = {
    fontSize: 13,
    fontWeight: 700,
    color: T.text,
    marginBottom: 4,
    textShadow: '0 0 10px rgba(59,130,246,0.35)',
  };

  const statRow = {
    fontSize: 11,
    color: T.sub,
  };

  return (
    <div style={podiumStyle}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 12 }}>
        {pieces.map((piece) => (
          <span
            key={piece.id}
            style={{
              position: 'absolute',
              top: -6,
              left: piece.left,
              width: 8,
              height: 14,
              borderRadius: 999,
              background: piece.background,
              opacity: 0,
              transform: `rotate(${piece.rotate})`,
              animation: `rr-confetti-fall ${piece.duration} ease-in infinite`,
              animationDelay: piece.delay,
              boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
            }}
          />
        ))}
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, width: '100%' }}>
      {rows[1] && (
        <div style={slotBase}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <PodiumAvatar
              participant={rows[1].participant}
              label={rows[1].displayName}
              fallbackPhotoUrl={currentUserProfilePhotoUrl}
              currentUserId={currentUserId}
              currentUserAliases={currentUserAliases}
            />
          </div>
          <div style={iconRow}>🥈</div>
          <div style={nameRow}>{rows[1].displayName}</div>
          <div style={statRow}>
            {rows[1].wins}W-{rows[1].losses}L
          </div>
        </div>
      )}
      {rows[0] && (
        <div style={slotBase}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <PodiumAvatar
              participant={rows[0].participant}
              label={rows[0].displayName}
              fallbackPhotoUrl={currentUserProfilePhotoUrl}
              currentUserId={currentUserId}
              currentUserAliases={currentUserAliases}
            />
          </div>
          <div style={iconRow}>🏆</div>
          <div style={nameRow}>{rows[0].displayName}</div>
          <div style={statRow}>
            {rows[0].wins}W-{rows[0].losses}L
          </div>
        </div>
      )}
      {rows[2] && (
        <div style={slotBase}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <PodiumAvatar
              participant={rows[2].participant}
              label={rows[2].displayName}
              fallbackPhotoUrl={currentUserProfilePhotoUrl}
              currentUserId={currentUserId}
              currentUserAliases={currentUserAliases}
            />
          </div>
          <div style={iconRow}>🥉</div>
          <div style={nameRow}>{rows[2].displayName}</div>
          <div style={statRow}>
            {rows[2].wins}W-{rows[2].losses}L
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function RoundRobinPanel({
  onClose,
  participants,
  eligibleRoundRobinEvents,
  selectedRoundRobinEventId,
  setSelectedRoundRobinEventId,
  useManualRoundRobinRoster,
  setUseManualRoundRobinRoster,
  manualRoundRobinRosterInput,
  setManualRoundRobinRosterInput,
  selectedRoundRobinEntry,
  currentUserId,
  currentUserAliases,
  currentUserProfilePhotoUrl,
  teamsOf,
  setTeamsOf,
  startRoundRobinTournament,
  rounds,
  activeRound,
  updateRoundRobinMatchScore,
  completeRoundRobinMatch,
  standings,
  resetRoundRobinTournament,
  roundRobinError,
  tid,
}) {
  const [activeTab, setActiveTab] = useState('matches');
  const [expandedRounds, setExpandedRounds] = useState(new Set([0]));

  const allDone = useMemo(() => {
    if (!Array.isArray(rounds) || rounds.length === 0) return false;
    return rounds.every((r) => (r.matches || []).every((m) => m.completed));
  }, [rounds]);

  const podium = useMemo(() => standings.slice(0, 3), [standings]);
  const hasEnoughPlayers = teamsOf === 1 ? participants.length >= 2 : participants.length >= 4;

  useEffect(() => {
    if (!Array.isArray(rounds) || rounds.length === 0) {
      setExpandedRounds(new Set([0]));
      return;
    }
    const firstIncompleteRoundIdx = rounds.findIndex((round) => (round.matches || []).some((match) => !match.completed));
    if (firstIncompleteRoundIdx >= 0) {
      setExpandedRounds(new Set([firstIncompleteRoundIdx]));
      return;
    }
    setExpandedRounds(new Set());
  }, [rounds]);

  useEffect(() => {
    if (allDone) setActiveTab('standings');
  }, [allDone]);

  const toggleRound = (idx) => {
    const round = Array.isArray(rounds) ? rounds[idx] : null;
    const isLocked = Boolean(round?.finalizedAt) || Boolean((round?.matches || []).length && (round.matches || []).every((match) => match.completed));
    if (isLocked) return;
    const newSet = new Set(expandedRounds);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setExpandedRounds(newSet);
  };

  const getTeamSlotStyle = (match, team) => {
    if (!match.completed) return teamSlotBase;
    const a = parseInt(String(match.scoreA || ''), 10);
    const b = parseInt(String(match.scoreB || ''), 10);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return teamSlotBase;
    const isWinner = (team === 'A' && a > b) || (team === 'B' && b > a);
    return isWinner ? teamSlotWinner : teamSlotBase;
  };

  return (
    <>
      <style>
        {`
          @keyframes rr-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.95); }
          }
          @keyframes rr-confetti-fall {
            0% { transform: translate3d(0,-18px,0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate3d(0,150px,0) rotate(220deg); opacity: 0; }
          }
        `}
      </style>

      <div style={shell}>
        <div style={heroStyle}>
          <div style={heroBg} />
          <div style={{ position: 'absolute', right: 58, top: '46%', transform: 'translateY(-50%)', opacity: 0.16, pointerEvents: 'none' }}>
            <svg width="90" height="58" viewBox="0 0 90 58" fill="none">
              <rect x="1" y="1" width="88" height="56" rx="3" stroke="white" strokeWidth="2"/>
              <rect x="1" y="1" width="26" height="56" fill="white" fillOpacity="0.16"/>
              <rect x="63" y="1" width="26" height="56" fill="white" fillOpacity="0.16"/>
              <line x1="27" y1="1" x2="27" y2="57" stroke="white" strokeWidth="1.5"/>
              <line x1="63" y1="1" x2="63" y2="57" stroke="white" strokeWidth="1.5"/>
              <line x1="45" y1="1" x2="45" y2="57" stroke="white" strokeWidth="2.5"/>
              <line x1="27" y1="29" x2="63" y2="29" stroke="white" strokeWidth="1"/>
            </svg>
          </div>
          <div style={{ position: 'relative', zIndex: 1, paddingRight: 96, maxWidth: '100%' }}>
            <div style={badge}>
              <div style={liveDot} />
              Live
            </div>
            <h3 style={heroTitle}>
              Pickleball <span style={{ color: T.blue }}>Round Robin</span>
            </h3>
            <p style={heroSub}>
              Single Elimination. May the best team or player win!
            </p>
          </div>
          <button
            type="button"
            aria-label="Close round robin panel"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            style={{ ...closeBtn, zIndex: 2 }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={infoBar}>
            🎯 Round robin ensures every team faces each other once. Perfect for balanced competition.
          </div>

          {!rounds || rounds.length === 0 ? (
            <div style={{ padding: '14px 14px 0' }}>
              <div style={segRow}>
                <button
                  onClick={() => setUseManualRoundRobinRoster(true)}
                  style={useManualRoundRobinRoster ? segBtnActive : segBtnBase}
                >
                  Manual Roster
                </button>
                <button
                  onClick={() => setUseManualRoundRobinRoster(false)}
                  style={!useManualRoundRobinRoster ? segBtnActive : segBtnBase}
                >
                  Popup Event
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={fieldLabel}>
                  {useManualRoundRobinRoster ? 'Player Names' : 'Select Event'}
                </label>
                {useManualRoundRobinRoster ? (
                  <textarea
                    value={manualRoundRobinRosterInput}
                    onChange={(e) => setManualRoundRobinRosterInput(e.target.value)}
                    placeholder="Enter one player per line"
                    rows={4}
                    style={{ ...inputBase, resize: 'none', minHeight: 104 }}
                  />
                ) : (
                  <select
                    value={selectedRoundRobinEventId}
                    onChange={(e) => setSelectedRoundRobinEventId(e.target.value)}
                    style={{ ...inputBase, minHeight: 44 }}
                  >
                    <option value="">-- Choose Event --</option>
                    {(eligibleRoundRobinEvents || []).map((entry) => (
                      <option key={entry.eventId} value={entry.eventId}>
                        {(entry.event?.title || 'Popup event')} - {entry.signupCount} joined
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ fontFamily: '"Syne", sans-serif', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 5, display: 'block' }}>
                  Team Size
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    onClick={() => setTeamsOf(1)}
                    style={teamsOf === 1 ? { ...tabBtnBase, background: T.blue, color: '#fff' } : tabBtnBase}
                  >
                    Singles (1v1)
                  </button>
                  <button
                    onClick={() => setTeamsOf(2)}
                    style={teamsOf === 2 ? { ...tabBtnBase, background: T.blue, color: '#fff' } : tabBtnBase}
                  >
                    Doubles (2v2)
                  </button>
                </div>
              </div>

              {useManualRoundRobinRoster ? (
                <div style={rosterCard}>
                  <div style={rosterHeader}>
                    <div style={rosterTitleStyle}>Manual Roster</div>
                    <span style={rosterCountBadge}>{participants.length} entered</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
                    {participants.length} players entered
                    {hasEnoughPlayers ? '' : ` - needs at least ${teamsOf === 1 ? 2 : 4} players`}
                  </div>
                  {participants.length > 0 && (
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.6 }}>
                      {participants.map((row) => row.displayName).join(', ')}
                    </div>
                  )}
                </div>
              ) : selectedRoundRobinEntry ? (
                <div style={rosterCard}>
                  <div style={rosterHeader}>
                    <div style={rosterTitleStyle}>{selectedRoundRobinEntry.event?.title || 'Popup Event'}</div>
                    <span style={rosterCountBadge}>{selectedRoundRobinEntry.signupCount} joined</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
                    {selectedRoundRobinEntry.signupCount} players on the roster
                    {hasEnoughPlayers ? '' : ` - needs at least ${teamsOf === 1 ? 2 : 4} players`}
                  </div>
                  {(selectedRoundRobinEntry.signups || []).length > 0 && (
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.6 }}>
                      {(selectedRoundRobinEntry.signups || []).map((row) => row.displayName || 'Member').join(', ')}
                    </div>
                  )}
                </div>
              ) : null}

              <button
                type="button"
                onClick={startRoundRobinTournament}
                style={{
                  ...actionPrimary,
                  width: '100%',
                  marginTop: 14,
                  opacity: useManualRoundRobinRoster
                    ? (participants.length > 0 ? 1 : 0.7)
                    : (selectedRoundRobinEventId ? 1 : 0.7),
                  cursor: 'pointer',
                }}
              >
                <Target size={14} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} />
                Start Tournament
              </button>

              <div style={emptyState}>
                Add at least {teamsOf === 1 ? '2 players' : '4 players'} to start a round robin tournament.
              </div>
            </div>
          ) : (
            <>
              <div style={tabRow}>
                <button onClick={() => setActiveTab('matches')} style={activeTab === 'matches' ? tabBtnActive : tabBtnBase}>
                  Matches
                </button>
                <button onClick={() => setActiveTab('standings')} style={activeTab === 'standings' ? tabBtnActive : tabBtnBase}>
                  Standings
                </button>
              </div>

              {activeTab === 'matches' && (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px' }}>
                  {rounds.map((round, roundIdx) => {
                    const isExpanded = expandedRounds.has(roundIdx);
                    const allCompleted = (round.matches || []).every((m) => m.completed);
                    return (
                      <div key={`round-${roundIdx}`} style={{ marginBottom: 10 }}>
                        <button
                          onClick={() => toggleRound(roundIdx)}
                          style={{
                            width: '100%',
                            background: T.card,
                            border: `1px solid ${T.border}`,
                            borderRadius: 12,
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            marginBottom: isExpanded ? 10 : 0,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: 13, fontWeight: 700, color: T.text }}>
                              Round {roundIdx + 1}
                            </div>
                            {allCompleted && (
                              <div style={{ ...completeBadge, marginBottom: 0 }}>
                                Complete
                              </div>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp size={16} color={T.sub} /> : <ChevronDown size={16} color={T.sub} />}
                        </button>

                        {isExpanded && (
                          <div>
                            {(round.matches || []).map((match) => {
                              const namesA = getNames(match.teamA);
                              const namesB = getNames(match.teamB);
                              const a = parseInt(String(match.scoreA || ''), 10);
                              const b = parseInt(String(match.scoreB || ''), 10);
                              const aWon = match.completed && Number.isFinite(a) && Number.isFinite(b) && a > b;
                              const bWon = match.completed && Number.isFinite(a) && Number.isFinite(b) && b > a;

                              return (
                                <div key={match.id} style={matchCard}>
                                  <div style={matchHeader}>
                                    <div style={matchNum}>Match {roundIdx + 1}.{((round.matches || []).findIndex((m) => m.id === match.id) + 1)}</div>
                                    {match.completed && (
                                      <div style={completeBadge}>Completed</div>
                                    )}
                                  </div>

                                  <div style={getTeamSlotStyle(match, 'A')}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                      <div style={teamTag}>Team A</div>
                                      {aWon && <span style={{ ...teamTag, color: T.blue, marginBottom: 0 }}>Winner</span>}
                                    </div>
                                    <div style={teamNameText}>{namesA.join(' & ')}</div>
                                  </div>

                                  <div style={getTeamSlotStyle(match, 'B')}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                      <div style={teamTag}>Team B</div>
                                      {bWon && <span style={{ ...teamTag, color: T.blue, marginBottom: 0 }}>Winner</span>}
                                    </div>
                                    <div style={teamNameText}>{namesB.join(' & ')}</div>
                                  </div>

                                  <div style={scoreRow}>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={match.scoreA}
                                      disabled={match.completed}
                                      onChange={(e) => updateRoundRobinMatchScore(tid, roundIdx, match.id, 'scoreA', e.target.value)}
                                      style={scoreInput}
                                      placeholder="0"
                                    />
                                    <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: T.muted, textTransform: 'uppercase' }}>
                                      vs
                                    </div>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={match.scoreB}
                                      disabled={match.completed}
                                      onChange={(e) => updateRoundRobinMatchScore(tid, roundIdx, match.id, 'scoreB', e.target.value)}
                                      style={scoreInput}
                                      placeholder="0"
                                    />
                                  </div>

                                  {!match.completed && (
                                    <button
                                      onClick={() => completeRoundRobinMatch(tid, roundIdx, match.id)}
                                      style={{ ...actionPrimary, width: '100%', marginTop: 10 }}
                                    >
                                      Complete Match
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'standings' && (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  {allDone && podium.length > 0 && <CelebrationPodium rows={podium} />}
                  
                  <div style={cardOuter}>
                    <div style={cardHeaderStyle}>Standings</div>
                    {standings.length > 0 && (
                      <div style={standingsCols}>
                        <div>Place</div>
                        <div>Player</div>
                        <div style={{ textAlign: 'right' }}>W-L</div>
                        <div style={{ textAlign: 'right' }}>Played</div>
                        <div style={{ textAlign: 'right' }}>+/-</div>
                      </div>
                    )}
                    {standings.length === 0 ? (
                      <div style={emptyState}>Complete some matches to see standings.</div>
                    ) : (
                      standings.map((row, index) => {
                        const diff = row.pointsFor - row.pointsAgainst;
                        return (
                          <div key={row.id} style={standingRowStyle}>
                            <div>
                              <RankBadge index={index} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {row.displayName}
                              </div>
                              <div style={{ fontSize: 10.5, color: T.muted }}>
                                PF {row.pointsFor} - PA {row.pointsAgainst}
                              </div>
                            </div>
                            <StatVal value={`${row.wins}-${row.losses}`} />
                            <StatVal value={row.played} muted />
                            <StatVal
                              value={diff >= 0 ? `+${diff}` : diff}
                              positive={diff > 0}
                              negative={diff < 0}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={footerStyle}>
          <button onClick={() => resetRoundRobinTournament(tid)} style={actionSecondary}>
            <RotateCcw size={14} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} />
            Reset
          </button>
          {roundRobinError && <span style={{ fontSize: 11, fontWeight: 600, color: T.red }}>{roundRobinError}</span>}
        </div>
      </div>
    </>
  );
}

export default RoundRobinPanel;
