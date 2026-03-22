import React from 'react';
import { Shuffle, X, Zap, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const T = {
  bg: '#0a0e1a',
  surface: '#111827',
  card: 'rgba(30,41,59,0.6)',
  neon1: '#00ff88', // bright green
  neon2: '#ff00ff', // magenta
  neon3: '#00d9ff', // cyan
  neon4: '#ffeb3b', // yellow
  orange: '#ff6b35',
  text: '#ffffff',
  sub: 'rgba(255,255,255,0.65)',
  muted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.1)',
};

const shell = {
  background: T.bg,
  border: `2px solid transparent`,
  backgroundImage: `linear-gradient(${T.bg}, ${T.bg}), linear-gradient(135deg, ${T.neon1}, ${T.neon2}, ${T.neon3})`,
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  borderRadius: 24,
  overflow: 'hidden',
  color: T.text,
  boxShadow: `0 0 60px rgba(0,255,136,0.15), 0 20px 40px rgba(0,0,0,0.5)`,
  fontFamily: '"Inter", sans-serif',
};

const heroStyle = {
  padding: '24px',
  borderBottom: `1px solid ${T.border}`,
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(255,0,255,0.08) 50%, rgba(0,217,255,0.08) 100%)`,
};

const heroBg = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  opacity: 0.6,
  background: `
    radial-gradient(circle at 20% 80%, ${T.neon1}20 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, ${T.neon2}20 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, ${T.neon3}15 0%, transparent 50%)
  `,
  animation: 'scramble-pulse 4s ease-in-out infinite',
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(0,0,0,0.5)',
  border: `2px solid ${T.neon1}`,
  borderRadius: 999,
  padding: '6px 14px',
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '0.15em',
  color: T.neon1,
  textTransform: 'uppercase',
  marginBottom: 12,
  boxShadow: `0 0 20px ${T.neon1}60, inset 0 0 20px ${T.neon1}20`,
  animation: 'badge-glow 3s ease-in-out infinite',
};

const liveDot = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: T.neon1,
  boxShadow: `0 0 12px ${T.neon1}, 0 0 4px ${T.neon1}`,
  animation: 'dot-spin 2s linear infinite',
};

const heroTitle = {
  fontSize: 32,
  fontWeight: 900,
  letterSpacing: '-0.03em',
  color: '#fff',
  lineHeight: 1,
  textShadow: `0 0 40px ${T.neon1}60, 0 2px 8px rgba(0,0,0,0.8)`,
};

const heroSub = {
  fontSize: 14,
  color: T.sub,
  marginTop: 8,
  lineHeight: 1.6,
  maxWidth: 440,
};

const closeBtn = {
  position: 'absolute',
  top: 20,
  right: 20,
  zIndex: 3,
  width: 32,
  height: 32,
  borderRadius: 10,
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(10px)',
  border: `2px solid ${T.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: T.sub,
  transition: 'all 0.2s',
};

const infoBar = {
  margin: '14px 14px 0',
  background: `linear-gradient(135deg, ${T.neon1}08 0%, ${T.neon3}05 100%)`,
  border: `2px solid ${T.neon1}30`,
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: T.sub,
  lineHeight: 1.6,
  boxShadow: `0 0 20px ${T.neon1}15`,
};

const segRow = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 6,
  background: 'rgba(255,255,255,0.05)',
  border: `2px solid ${T.border}`,
  borderRadius: 14,
  padding: 6,
  marginBottom: 14,
};

const segBtnBase = {
  padding: '10px 14px',
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s',
  background: 'transparent',
  color: T.sub,
};

const segBtnActive = {
  ...segBtnBase,
  background: `linear-gradient(135deg, ${T.neon1} 0%, ${T.neon3} 100%)`,
  color: '#0a0e1a',
  boxShadow: `0 0 20px ${T.neon1}40`,
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 90px 130px',
  gap: 10,
  alignItems: 'start',
};

const fieldLabel = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: T.muted,
  marginBottom: 6,
  display: 'block',
};

const inputBase = {
  width: '100%',
  background: 'rgba(0,0,0,0.4)',
  border: `2px solid ${T.border}`,
  borderRadius: 12,
  color: T.text,
  fontSize: 13,
  fontWeight: 600,
  padding: '12px 14px',
  outline: 'none',
  transition: 'all 0.2s',
};

const stepper = {
  background: 'rgba(0,0,0,0.4)',
  border: `2px solid ${T.border}`,
  borderRadius: 12,
  overflow: 'hidden',
};

const stepperTop = {
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: T.muted,
  padding: '8px 12px 0',
};

const stepBtnStyle = {
  width: 40,
  height: 40,
  border: 'none',
  background: 'transparent',
  color: T.neon1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const stepNum = {
  fontSize: 24,
  fontWeight: 900,
  color: T.text,
  textAlign: 'center',
  padding: '6px 12px',
};

const actionPrimary = {
  padding: '12px 20px',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  border: 'none',
  background: `linear-gradient(135deg, ${T.neon1} 0%, ${T.neon3} 100%)`,
  color: '#0a0e1a',
  boxShadow: `0 0 30px ${T.neon1}50, 0 4px 16px rgba(0,0,0,0.4)`,
  transition: 'all 0.2s',
  position: 'relative',
  overflow: 'hidden',
};

const actionSecondary = {
  ...actionPrimary,
  background: 'rgba(255,255,255,0.08)',
  color: T.text,
  boxShadow: 'none',
  border: `2px solid ${T.border}`,
};

const emptyState = {
  padding: '50px 24px',
  textAlign: 'center',
  fontSize: 13,
  fontWeight: 600,
  color: T.sub,
  lineHeight: 1.7,
};

const rosterCard = {
  background: T.card,
  backdropFilter: 'blur(20px)',
  border: `2px solid ${T.border}`,
  borderRadius: 14,
  padding: '14px 16px',
  marginTop: 14,
};

const rosterHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const rosterTitleStyle = {
  fontSize: 15,
  fontWeight: 900,
  color: T.text,
};

const rosterCountBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: `linear-gradient(135deg, ${T.neon1}15 0%, ${T.neon3}10 100%)`,
  border: `2px solid ${T.neon1}40`,
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '0.12em',
  color: T.neon1,
  textTransform: 'uppercase',
};

const roundBar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  background: `linear-gradient(135deg, ${T.neon1}08 0%, ${T.neon2}05 100%)`,
  border: `2px solid ${T.neon1}30`,
  borderRadius: 14,
  padding: '12px 16px',
  marginBottom: 16,
  boxShadow: `0 0 20px ${T.neon1}15`,
};

const roundLabel = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: T.neon1,
  textShadow: `0 0 10px ${T.neon1}60`,
};

const byeCardStyle = {
  background: `linear-gradient(135deg, ${T.neon2}10 0%, ${T.neon2}05 100%)`,
  border: `2px solid ${T.neon2}40`,
  borderRadius: 14,
  padding: '12px 16px',
  marginBottom: 16,
  boxShadow: `0 0 20px ${T.neon2}15`,
};

const courtsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16,
  marginBottom: 16,
};

const courtCard = {
  background: T.card,
  backdropFilter: 'blur(20px)',
  border: `2px solid ${T.border}`,
  borderRadius: 16,
  padding: '16px',
  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  position: 'relative',
  overflow: 'hidden',
};

// Add this CSS via inline style or class
const courtCardHoverStyle = `
  .court-card:hover {
    border-color: ${T.neon1}60;
    box-shadow: 0 0 30px ${T.neon1}20;
    transform: translateY(-2px);
  }
`;

const courtHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 14,
  paddingBottom: 10,
  borderBottom: `1px solid ${T.border}`,
};

const courtNameStyle = {
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: T.neon1,
  textShadow: `0 0 12px ${T.neon1}`,
};

const courtStatusBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  border: `2px solid ${T.border}`,
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: '0.12em',
  color: T.muted,
  textTransform: 'uppercase',
  background: 'rgba(0,0,0,0.3)',
};

const courtStatusLocked = {
  ...courtStatusBase,
  background: `linear-gradient(135deg, ${T.neon1}15 0%, ${T.neon3}10 100%)`,
  border: `2px solid ${T.neon1}`,
  color: T.neon1,
  boxShadow: `0 0 15px ${T.neon1}40`,
};

const teamSlotBase = {
  background: 'rgba(255,255,255,0.04)',
  border: `2px solid ${T.border}`,
  borderRadius: 12,
  padding: '12px 14px',
  marginBottom: 10,
  position: 'relative',
  transition: 'all 0.3s',
};

const teamSlotWinner = {
  ...teamSlotBase,
  background: `linear-gradient(135deg, ${T.neon1}15 0%, ${T.neon3}10 100%)`,
  border: `2px solid ${T.neon1}`,
  boxShadow: `0 0 20px ${T.neon1}30, inset 0 0 20px ${T.neon1}10`,
};

const teamTag = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: T.muted,
  marginBottom: 6,
};

const teamNameText = {
  fontSize: 14,
  fontWeight: 700,
  color: T.text,
  lineHeight: 1.3,
};

const scoreRow = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: 12,
  alignItems: 'center',
};

const scoreInput = {
  width: '100%',
  background: 'rgba(0,0,0,0.4)',
  border: `2px solid ${T.border}`,
  borderRadius: 10,
  color: T.text,
  fontSize: 22,
  fontWeight: 900,
  padding: '10px',
  textAlign: 'center',
  outline: 'none',
  transition: 'all 0.2s',
  boxShadow: `0 0 0 0 ${T.neon1}00`,
};

const cardOuter = {
  background: T.card,
  backdropFilter: 'blur(20px)',
  border: `2px solid ${T.border}`,
  borderRadius: 16,
  overflow: 'hidden',
};

const cardHeaderStyle = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: T.neon3,
  padding: '14px 16px',
  borderBottom: `1px solid ${T.border}`,
  background: 'rgba(0,0,0,0.3)',
};

const standingsCols = {
  display: 'grid',
  gridTemplateColumns: '50px minmax(0,1fr) 60px 60px 50px 60px',
  gap: 12,
  padding: '10px 16px',
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: T.muted,
  borderBottom: `1px solid ${T.border}`,
  background: 'rgba(0,0,0,0.2)',
};

const standingRowStyle = {
  display: 'grid',
  gridTemplateColumns: '50px minmax(0,1fr) 60px 60px 50px 60px',
  gap: 12,
  padding: '12px 16px',
  alignItems: 'center',
  borderBottom: `1px solid ${T.border}`,
  transition: 'all 0.2s',
};

const historyCard = {
  background: 'rgba(255,255,255,0.04)',
  border: `2px solid ${T.border}`,
  borderRadius: 12,
  padding: '12px 14px',
};

const RankBadge = ({ index }) => {
  const getRankStyle = () => {
    if (index === 0) return { 
      bg: `linear-gradient(135deg, ${T.neon4} 0%, ${T.orange} 100%)`, 
      color: '#0a0e1a',
      shadow: `0 0 20px ${T.neon4}80`
    };
    if (index === 1) return { 
      bg: `linear-gradient(135deg, ${T.neon3} 0%, #94a3b8 100%)`, 
      color: '#0a0e1a',
      shadow: `0 0 20px ${T.neon3}60`
    };
    if (index === 2) return { 
      bg: `linear-gradient(135deg, ${T.neon2} 0%, #fb7185 100%)`, 
      color: '#fff',
      shadow: `0 0 20px ${T.neon2}60`
    };
    return { 
      bg: 'rgba(255,255,255,0.1)', 
      color: T.sub,
      shadow: 'none'
    };
  };

  const style = getRankStyle();
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: style.bg,
        color: style.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 900,
        boxShadow: style.shadow,
      }}
    >
      {index + 1}
    </div>
  );
};

const StatVal = ({ value, positive, negative, muted }) => {
  let color = T.text;
  if (positive) color = T.neon1;
  if (negative) color = T.neon2;
  if (muted) color = T.muted;

  return (
    <div style={{ fontSize: 13, fontWeight: 900, color, textAlign: 'right', textShadow: positive || negative ? `0 0 8px ${color}60` : 'none' }}>
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
        style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.neon1}55` }}
      />
    );
  }
  return (
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        fontWeight: 900,
        background: `${T.neon1}18`,
        color: T.neon1,
        border: `2px solid ${T.neon1}55`,
        margin: '0 auto',
      }}
    >
      {String(label || '?').trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}

const CelebrationPodium = ({ rows, currentUserId, currentUserAliases, currentUserProfilePhotoUrl }) => {
  const pieces = Array.from({ length: 18 }, (_, idx) => ({
    id: idx,
    left: `${4 + ((idx * 11) % 92)}%`,
    delay: `${(idx % 6) * 0.12}s`,
    duration: `${3 + (idx % 4) * 0.35}s`,
    background: idx % 3 === 0 ? T.neon1 : idx % 3 === 1 ? T.neon2 : T.neon3,
    rotate: `${(idx % 2 === 0 ? 1 : -1) * (16 + idx * 5)}deg`,
  }));
  const podiumStyle = {
    background: `linear-gradient(135deg, ${T.neon1}10 0%, ${T.neon2}08 50%, ${T.neon3}10 100%)`,
    border: `2px solid ${T.neon1}40`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: `0 0 40px ${T.neon1}20`,
  };

  const slotBase = {
    textAlign: 'center',
    position: 'relative',
  };

  const iconRow = {
    fontSize: 40,
    marginBottom: 8,
    filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.6))',
  };

  const nameRow = {
    fontSize: 14,
    fontWeight: 900,
    color: T.text,
    marginBottom: 4,
    textShadow: `0 0 10px ${T.neon1}60`,
  };

  const statRow = {
    fontSize: 11,
    fontWeight: 700,
    color: T.sub,
  };

  return (
    <div style={podiumStyle}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 16 }}>
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
              animation: `scramble-confetti-fall ${piece.duration} ease-in infinite`,
              animationDelay: piece.delay,
              boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
            }}
          />
        ))}
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {rows[1] && (
        <div style={slotBase}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <PodiumAvatar
              participant={rows[1].participant}
              label={rows[1].name}
              fallbackPhotoUrl={currentUserProfilePhotoUrl}
              currentUserId={currentUserId}
              currentUserAliases={currentUserAliases}
            />
          </div>
          <div style={iconRow}>🥈</div>
          <div style={nameRow}>{rows[1].name}</div>
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
              label={rows[0].name}
              fallbackPhotoUrl={currentUserProfilePhotoUrl}
              currentUserId={currentUserId}
              currentUserAliases={currentUserAliases}
            />
          </div>
          <div style={iconRow}>🏆</div>
          <div style={nameRow}>{rows[0].name}</div>
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
              label={rows[2].name}
              fallbackPhotoUrl={currentUserProfilePhotoUrl}
              currentUserId={currentUserId}
              currentUserAliases={currentUserAliases}
            />
          </div>
          <div style={iconRow}>🥉</div>
          <div style={nameRow}>{rows[2].name}</div>
          <div style={statRow}>
            {rows[2].wins}W-{rows[2].losses}L
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

function ScramblePanel({
  onClose,
  eligibleScramblePopupEvents,
  selectedEvent,
  setSelectedEvent,
  formatDateKeyMMDDYYYY,
  formatTime,
  signups,
  useManualScrambleRoster,
  setUseManualScrambleRoster,
  manualScramblePlayerNames,
  setManualScramblePlayerNames,
  scrambleRoundsCount,
  setScrambleRoundsCount,
  scrambleCourtCount,
  setScrambleCourtCount,
  scrambleError,
  startScrambleTournament,
  tournament,
  rounds,
  totalRounds,
  roundNum,
  activeRound,
  activeRoundIndex,
  updateScrambleCourtScore,
  finalizeScrambleRound,
  resetScrambleTournament,
  tournamentStandings,
  getScrambleCourtResult,
  renderTeamName,
  participantMap,
  tournamentKey,
  currentUserId,
  currentUserAliases,
  currentUserProfilePhotoUrl,
}) {
  const signupCount = signups.length;
  const selectedEntry =
    selectedEvent && eligibleScramblePopupEvents
      ? eligibleScramblePopupEvents.find((ev) => ev.id === selectedEvent.id)
      : null;

  const podium = tournamentStandings.slice(0, 3);

  const getTeamSlotStyle = (result, team) => {
    if (!result) return teamSlotBase;
    const isWinner =
      (team === 'A' && result.scoreA > result.scoreB) ||
      (team === 'B' && result.scoreB > result.scoreA);
    return isWinner ? teamSlotWinner : teamSlotBase;
  };

  return (
    <>
      <style>
        {`
          @keyframes scramble-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.9; }
          }
          
          @keyframes badge-glow {
            0%, 100% { 
              border-color: ${T.neon1}; 
              color: ${T.neon1};
              box-shadow: 0 0 20px ${T.neon1}60, inset 0 0 20px ${T.neon1}20;
            }
            33% { 
              border-color: ${T.neon2}; 
              color: ${T.neon2};
              box-shadow: 0 0 20px ${T.neon2}60, inset 0 0 20px ${T.neon2}20;
            }
            66% { 
              border-color: ${T.neon3}; 
              color: ${T.neon3};
              box-shadow: 0 0 20px ${T.neon3}60, inset 0 0 20px ${T.neon3}20;
            }
          }

          @keyframes scramble-confetti-fall {
            0% { transform: translate3d(0,-18px,0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate3d(0,150px,0) rotate(220deg); opacity: 0; }
          }
          
          @keyframes dot-spin {
            0% { 
              background: ${T.neon1}; 
              box-shadow: 0 0 12px ${T.neon1}, 0 0 4px ${T.neon1};
            }
            33% { 
              background: ${T.neon2}; 
              box-shadow: 0 0 12px ${T.neon2}, 0 0 4px ${T.neon2};
            }
            66% { 
              background: ${T.neon3}; 
              box-shadow: 0 0 12px ${T.neon3}, 0 0 4px ${T.neon3};
            }
            100% { 
              background: ${T.neon1}; 
              box-shadow: 0 0 12px ${T.neon1}, 0 0 4px ${T.neon1};
            }
          }
          
          .scramble-input:focus {
            border-color: ${T.neon1} !important;
            box-shadow: 0 0 20px ${T.neon1}60 !important;
          }
          
          .court-card:hover {
            border-color: ${T.neon1}60 !important;
            box-shadow: 0 0 30px ${T.neon1}20 !important;
            transform: translateY(-2px) !important;
          }
          
          .scramble-button:hover {
            box-shadow: 0 0 40px ${T.neon1}60, 0 8px 20px rgba(0,0,0,0.5) !important;
            transform: translateY(-2px) !important;
          }
          
          .scramble-button:active {
            transform: translateY(0) scale(0.98) !important;
          }
          
          @keyframes shell-glow {
            0%, 100% {
              box-shadow: 0 0 60px ${T.neon1}15, 0 20px 40px rgba(0,0,0,0.5);
            }
            50% {
              box-shadow: 0 0 80px ${T.neon3}20, 0 20px 40px rgba(0,0,0,0.5);
            }
          }
          
          .scramble-shell {
            animation: shell-glow 8s ease-in-out infinite;
          }
          
          .standings-row:hover {
            background: ${T.neon1}08 !important;
            border-color: ${T.neon1}40 !important;
          }
        `}
      </style>

      <div className="scramble-shell" style={shell}>
        <div style={heroStyle}>
          <div style={heroBg} />
          <div style={{ position: 'absolute', right: 8, top: '42%', transform: 'translateY(-50%)', opacity: 0.22, pointerEvents: 'none' }}>
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
          <div style={badge}>
            <div style={liveDot} />
            Live
          </div>
          <h3 style={heroTitle}>
            Pickleball <span style={{ color: T.neon1 }}>Scramble</span>
          </h3>
          <div style={heroSub}>
            Pure randomness. Every round reshuffles the deck.
          </div>
          <button
            type="button"
            aria-label="Close scramble panel"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            style={closeBtn}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '0 14px 18px' }}>
          <div style={infoBar}>
            Random pairings every round with the stats tracked. May the odds be ever in your favor!
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={segRow}>
              <button
                onClick={() => setUseManualScrambleRoster(true)}
                style={useManualScrambleRoster ? segBtnActive : segBtnBase}
              >
                Manual Roster
              </button>
              <button
                onClick={() => setUseManualScrambleRoster(false)}
                style={!useManualScrambleRoster ? segBtnActive : segBtnBase}
              >
                From Event
              </button>
            </div>

            {useManualScrambleRoster ? (
              <div>
                <label style={fieldLabel}>Player names (comma-separated)</label>
                <input
                  type="text"
                  value={manualScramblePlayerNames}
                  onChange={(e) => setManualScramblePlayerNames(e.target.value)}
                  placeholder="Alice, Bob, Charlie, Diana"
                  className="scramble-input"
                  style={inputBase}
                />
              </div>
            ) : (
              <div>
                <label style={fieldLabel}>Select event</label>
                <select
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const eventId = e.target.value;
                    const evt = eligibleScramblePopupEvents.find((ev) => ev.id === eventId);
                    setSelectedEvent(evt || null);
                  }}
                  className="scramble-input"
                  style={inputBase}
                >
                  <option value="">-- Choose Event --</option>
                  {(eligibleScramblePopupEvents || []).map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginTop: 12, ...formGrid }}>
              <div>
                <label style={fieldLabel}>Game name</label>
                <input
                  type="text"
                  value={tournamentKey}
                  disabled
                  style={{ ...inputBase, opacity: 0.6 }}
                />
              </div>
              <div>
                <label style={fieldLabel}>Courts</label>
                <div style={stepper}>
                  <div style={stepperTop}>Courts</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => setScrambleCourtCount(Math.max(1, scrambleCourtCount - 1))}
                      style={stepBtnStyle}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div style={stepNum}>{scrambleCourtCount}</div>
                    <button onClick={() => setScrambleCourtCount(scrambleCourtCount + 1)} style={stepBtnStyle}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label style={fieldLabel}>Rounds</label>
                <div style={stepper}>
                  <div style={stepperTop}>Total</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => setScrambleRoundsCount(Math.max(1, scrambleRoundsCount - 1))}
                      style={stepBtnStyle}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div style={stepNum}>{scrambleRoundsCount}</div>
                    <button onClick={() => setScrambleRoundsCount(scrambleRoundsCount + 1)} style={stepBtnStyle}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {!tournament && (
              <button onClick={startScrambleTournament} className="scramble-button" style={{ ...actionPrimary, width: '100%', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Zap size={16} style={{ display: 'inline-block' }} />
                START SCRAMBLE
                <Sparkles size={14} style={{ display: 'inline-block' }} />
              </button>
            )}
          </div>

          {!useManualScrambleRoster && selectedEvent ? (
            <div style={rosterCard}>
              <div style={rosterHeader}>
                <div style={rosterTitleStyle}>{selectedEvent.title}</div>
                <span style={rosterCountBadge}>{signupCount} joined</span>
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
                {formatDateKeyMMDDYYYY(selectedEvent.dateKey || selectedEvent.date)}
                {selectedEvent.time ? ` at ${formatTime(selectedEvent.time)}` : ''}
                {selectedEvent.location ? ` - ${selectedEvent.location}` : ''}
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
                {signupCount} players joined
                {selectedEntry?.eligible
                  ? ` - ${Math.floor(signupCount / 4)} active court${Math.floor(signupCount / 4) === 1 ? '' : 's'}${signupCount % 4 ? ` + ${signupCount % 4} bye${signupCount % 4 === 1 ? '' : 's'}` : ''}`
                  : ' - needs at least 4 players'}
              </div>
              {signups.length > 0 && (
                <div style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.6 }}>
                  {signups.map((row) => row.displayName || 'Member').join(', ')}
                </div>
              )}
            </div>
          ) : null}

          {scrambleError && <p style={{ marginTop: 12, fontSize: 12, color: T.accent }}>{scrambleError}</p>}

          {!tournament ? (
            <div style={emptyState}>
              {useManualScrambleRoster
                ? 'Enter player names above and start the scramble.'
                : eligibleScramblePopupEvents.length === 0
                  ? 'Create a popup event and have players join it first.'
                  : 'Choose an eligible popup event and start the scramble.'}
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div style={roundBar}>
                <div style={roundLabel}>
                  Round {roundNum} of {totalRounds} - {tournament.status === 'completed' ? 'Completed' : 'Shuffling'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(activeRound || tournament?.status !== 'completed') && (
                    <button onClick={() => finalizeScrambleRound(tournamentKey)} className="scramble-button" style={actionPrimary}>
                      {activeRound ? 'Finalize Round' : 'Next Round'}
                    </button>
                  )}
                  <button onClick={() => resetScrambleTournament(tournamentKey)} style={actionSecondary}>
                    Reset
                  </button>
                </div>
              </div>

              {activeRound && Array.isArray(activeRound.byeIds) && activeRound.byeIds.length > 0 && (
                <div style={byeCardStyle}>
                  <div style={{ ...roundLabel, color: T.neon2, textShadow: `0 0 10px ${T.neon2}60`, marginBottom: 6 }}>Bye This Round</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                    {activeRound.byeIds.map((playerId) => participantMap[String(playerId || '')]?.displayName || 'Player').join(', ')}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: T.sub }}>
                    Bye rounds are neutral and do not add a win or loss.
                  </div>
                </div>
              )}

              {activeRound && (
                <div style={courtsGrid}>
                  {(activeRound.courts || []).map((court) => {
                    const result = getScrambleCourtResult(court);
                    return (
                      <div key={`scramble-court-${court.courtNumber}`} className="court-card" style={courtCard}>
                        <div style={courtHeader}>
                          <div style={courtNameStyle}>Court {court.courtNumber}</div>
                          <span style={result ? courtStatusLocked : courtStatusBase}>
                            {result ? 'Result Locked' : 'Match'}
                          </span>
                        </div>

                        <div style={getTeamSlotStyle(result, 'A')}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={teamTag}>Team A</div>
                            {result && result.scoreA > result.scoreB && (
                              <span style={{ ...teamTag, color: T.neon1, marginBottom: 0, textShadow: `0 0 10px ${T.neon1}` }}>Winner</span>
                            )}
                          </div>
                          <div style={teamNameText}>{renderTeamName(court.teamA)}</div>
                        </div>

                        <div style={getTeamSlotStyle(result, 'B')}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={teamTag}>Team B</div>
                            {result && result.scoreB > result.scoreA && (
                              <span style={{ ...teamTag, color: T.neon1, marginBottom: 0, textShadow: `0 0 10px ${T.neon1}` }}>Winner</span>
                            )}
                          </div>
                          <div style={teamNameText}>{renderTeamName(court.teamB)}</div>
                        </div>

                        <div style={scoreRow}>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={court.scoreA}
                            disabled={Boolean(activeRound.finalizedAt)}
                            onChange={(e) =>
                              updateScrambleCourtScore(
                                tournamentKey,
                                activeRoundIndex,
                                court.courtNumber,
                                'scoreA',
                                e.target.value
                              )
                            }
                            className="scramble-input"
                            style={scoreInput}
                            placeholder="0"
                          />
                          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', color: T.neon3, textTransform: 'uppercase', textShadow: `0 0 10px ${T.neon3}` }}>
                            VS
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={court.scoreB}
                            disabled={Boolean(activeRound.finalizedAt)}
                            onChange={(e) =>
                              updateScrambleCourtScore(
                                tournamentKey,
                                activeRoundIndex,
                                court.courtNumber,
                                'scoreB',
                                e.target.value
                              )
                            }
                            className="scramble-input"
                            style={scoreInput}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'grid', gap: 10 }}>
                {podium.length > 0 && (
                  <CelebrationPodium
                    rows={podium}
                    currentUserId={currentUserId}
                    currentUserAliases={currentUserAliases}
                    currentUserProfilePhotoUrl={currentUserProfilePhotoUrl}
                  />
                )}
                <div style={cardOuter}>
                  <div style={cardHeaderStyle}>Standings</div>
                  {tournamentStandings.length > 0 && (
                    <div style={standingsCols}>
                      <div>Place</div>
                      <div>Player</div>
                      <div style={{ textAlign: 'right' }}>Win%</div>
                      <div style={{ textAlign: 'right' }}>W-L</div>
                      <div style={{ textAlign: 'right' }}>Bye</div>
                      <div style={{ textAlign: 'right' }}>Diff</div>
                    </div>
                  )}
                  {tournamentStandings.length === 0 ? (
                    <div style={emptyState}>Finalize a round to generate standings.</div>
                  ) : (
                    tournamentStandings.map((row, index) => (
                      <div key={`standing-${row.id}`} className="standings-row" style={standingRowStyle}>
                        <div>
                          <RankBadge index={index} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.name}
                          </div>
                          <div style={{ fontSize: 10.5, color: T.muted }}>
                            PF {row.pointsFor} - PA {row.pointsAgainst}
                          </div>
                        </div>
                        <StatVal value={(Number(row.winPct || 0) * 100).toFixed(0)} />
                        <StatVal value={`${row.wins}-${row.losses}`} />
                        <StatVal value={row.byes || 0} muted />
                        <StatVal
                          value={row.pointDiff >= 0 ? `+${row.pointDiff}` : row.pointDiff}
                          positive={row.pointDiff > 0}
                          negative={row.pointDiff < 0}
                        />
                      </div>
                    ))
                  )}
                </div>

                <div style={cardOuter}>
                  <div style={cardHeaderStyle}>Round History</div>
                  <div style={{ padding: 10, display: 'grid', gap: 8 }}>
                    {rounds.map((round) => (
                      <div key={`round-history-${round.index}`} style={historyCard}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          Round {round.index} {round.finalizedAt ? '- final' : '- current'}
                        </div>
                        {Array.isArray(round?.byeIds) && round.byeIds.length > 0 && (
                          <div style={{ marginTop: 4, fontSize: 11, color: T.accent }}>
                            Bye: {round.byeIds.map((playerId) => participantMap[String(playerId || '')]?.displayName || 'Player').join(', ')}
                          </div>
                        )}
                        <div style={{ marginTop: 5, display: 'grid', gap: 4 }}>
                          {(round.courts || []).map((court) => (
                            <div key={`round-${round.index}-court-${court.courtNumber}`} style={{ fontSize: 11, color: T.sub }}>
                              Court {court.courtNumber}: {renderTeamName(court.teamA)} {court.scoreA === '' || court.scoreB === '' ? 'vs' : `${court.scoreA}-${court.scoreB}`} {renderTeamName(court.teamB)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ScramblePanel;

