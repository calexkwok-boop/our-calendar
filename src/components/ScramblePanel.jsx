import React from 'react';
import { ChevronLeft, ChevronRight, Shuffle, X } from 'lucide-react';

const T = {
  bg: '#0f0d14',
  surface: '#16141e',
  card: '#1c1a27',
  border: 'rgba(255,255,255,0.07)',
  borderGlow: 'rgba(138,92,255,0.25)',
  purple: '#8a5cff',
  purpleText: '#b794ff',
  accent: '#ff6bb5',
  orange: '#ff9b4d',
  muted: 'rgba(255,255,255,0.35)',
  text: 'rgba(255,255,255,0.92)',
  sub: 'rgba(255,255,255,0.55)',
};

const shell = {
  background: `linear-gradient(180deg, ${T.bg} 0%, ${T.surface} 100%)`,
  border: `1px solid ${T.borderGlow}`,
  borderRadius: 20,
  overflow: 'hidden',
  color: T.text,
  boxShadow: '0 22px 48px rgba(0,0,0,0.32)',
  fontFamily: '"DM Sans", sans-serif',
};

const heroStyle = {
  padding: '20px 22px 18px',
  borderBottom: `1px solid ${T.border}`,
  position: 'relative',
  overflow: 'hidden',
};

const heroBg = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background: `
    radial-gradient(ellipse 60% 80% at 10% 50%, rgba(138,92,255,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 40% 70% at 90% 20%, rgba(255,107,181,0.06) 0%, transparent 60%)
  `,
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'rgba(138,92,255,0.12)',
  border: '1px solid rgba(138,92,255,0.28)',
  borderRadius: 999,
  padding: '4px 11px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  color: T.purpleText,
  textTransform: 'uppercase',
  marginBottom: 10,
  fontFamily: '"Syne", sans-serif',
};

const liveDot = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: T.accent,
  animation: 's-pulse 2s infinite',
};

const heroTitle = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#fff',
  lineHeight: 1,
};

const heroSub = {
  fontSize: 13,
  color: T.sub,
  marginTop: 6,
  lineHeight: 1.5,
  maxWidth: 420,
};

const pillBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  border: `1px solid ${T.border}`,
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: T.sub,
  textTransform: 'uppercase',
  fontFamily: '"Syne", sans-serif',
};

const pillLive = {
  ...pillBase,
  border: '1px solid rgba(255,107,181,0.30)',
  color: T.accent,
};

const closeBtn = {
  position: 'absolute',
  top: 18,
  right: 18,
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
};

const infoBar = {
  margin: '14px 14px 0',
  background: 'rgba(138,92,255,0.06)',
  border: '1px solid rgba(138,92,255,0.16)',
  borderRadius: 10,
  padding: '9px 13px',
  fontSize: 11.5,
  color: 'rgba(183,148,255,0.8)',
  lineHeight: 1.5,
};

const segRow = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 4,
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: 4,
  marginBottom: 12,
};

const segBtnBase = {
  fontFamily: '"Syne", sans-serif',
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

const segBtnActive = {
  ...segBtnBase,
  background: `linear-gradient(135deg, ${T.purple} 0%, ${T.accent} 100%)`,
  color: '#fff',
  boxShadow: '0 4px 12px rgba(138,92,255,0.3)',
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 80px 120px',
  gap: 8,
  alignItems: 'start',
};

const fieldLabel = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: T.muted,
  marginBottom: 5,
  display: 'block',
};

const inputBase = {
  width: '100%',
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  color: T.text,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 13.5,
  padding: '10px 12px',
  outline: 'none',
};

const stepper = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  overflow: 'hidden',
};

const stepperTop = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: T.muted,
  padding: '7px 10px 0',
};

const stepBtnStyle = {
  width: 36,
  height: 36,
  border: 'none',
  background: 'transparent',
  color: T.sub,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const stepNum = {
  fontSize: 22,
  fontWeight: 700,
  color: T.text,
  textAlign: 'center',
  padding: '4px 10px',
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
  background: `linear-gradient(135deg, ${T.purple} 0%, ${T.accent} 100%)`,
  color: '#fff',
  boxShadow: '0 4px 12px rgba(138,92,255,0.3)',
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

const rosterCard = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: '12px 14px',
  marginTop: 12,
};

const rosterHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const rosterTitleStyle = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 15,
  fontWeight: 700,
  color: T.text,
};

const rosterCountBadge = {
  ...pillBase,
  background: 'rgba(138,92,255,0.12)',
  border: '1px solid rgba(138,92,255,0.22)',
  color: T.purpleText,
};

const roundBar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: '10px 14px',
  marginBottom: 14,
};

const roundLabel = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: T.purpleText,
};

const byeCardStyle = {
  background: 'rgba(255,107,181,0.06)',
  border: '1px solid rgba(255,107,181,0.16)',
  borderRadius: 12,
  padding: '10px 14px',
  marginBottom: 14,
};

const courtsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 12,
  marginBottom: 14,
};

const courtCard = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: '12px 14px',
  transition: 'all 0.2s',
};

const courtHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
};

const courtNameStyle = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: T.text,
};

const courtStatusBase = {
  ...pillBase,
  fontSize: 9,
  padding: '3px 8px',
};

const courtStatusLocked = {
  ...courtStatusBase,
  background: 'rgba(255,107,181,0.12)',
  border: '1px solid rgba(255,107,181,0.25)',
  color: T.accent,
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
  background: 'rgba(138,92,255,0.08)',
  border: '1px solid rgba(138,92,255,0.22)',
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
  gridTemplateColumns: '50px minmax(0,1fr) 60px 60px 50px 60px',
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
  gridTemplateColumns: '50px minmax(0,1fr) 60px 60px 50px 60px',
  gap: 10,
  padding: '10px 14px',
  alignItems: 'center',
  borderBottom: `1px solid ${T.border}`,
};

const historyCard = {
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  padding: '10px 12px',
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

const CelebrationPodium = ({ rows }) => {
  const podiumStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    background: `linear-gradient(145deg, rgba(138,92,255,0.08) 0%, rgba(255,107,181,0.06) 100%)`,
    border: `1px solid ${T.borderGlow}`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  };

  const slotBase = {
    textAlign: 'center',
  };

  const iconRow = {
    fontSize: 32,
    marginBottom: 6,
  };

  const nameRow = {
    fontSize: 13,
    fontWeight: 700,
    color: T.text,
    marginBottom: 4,
  };

  const statRow = {
    fontSize: 11,
    color: T.sub,
  };

  return (
    <div style={podiumStyle}>
      {rows[1] && (
        <div style={slotBase}>
          <div style={iconRow}>🥈</div>
          <div style={nameRow}>{rows[1].name}</div>
          <div style={statRow}>
            {rows[1].wins}W-{rows[1].losses}L
          </div>
        </div>
      )}
      {rows[0] && (
        <div style={slotBase}>
          <div style={iconRow}>🏆</div>
          <div style={nameRow}>{rows[0].name}</div>
          <div style={statRow}>
            {rows[0].wins}W-{rows[0].losses}L
          </div>
        </div>
      )}
      {rows[2] && (
        <div style={slotBase}>
          <div style={iconRow}>🥉</div>
          <div style={nameRow}>{rows[2].name}</div>
          <div style={statRow}>
            {rows[2].wins}W-{rows[2].losses}L
          </div>
        </div>
      )}
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
          @keyframes s-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.95); }
          }
        `}
      </style>

      <div style={shell}>
        <div style={heroStyle}>
          <div style={heroBg} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={badge}>
              <div style={liveDot} />
              Scramble Mode
            </div>
            <div style={heroTitle}>Random Chaos</div>
            <div style={heroSub}>
              Every round shuffles the deck. No rankings, no seeding—just pure randomized matchups.
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '0 14px 18px' }}>
          <div style={infoBar}>
            💫 Scramble mode pairs players randomly each round—scores don't affect matchups, just bragging rights.
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
              <button onClick={startScrambleTournament} style={{ ...actionPrimary, width: '100%', marginTop: 14 }}>
                <Shuffle size={14} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} />
                Start Scramble
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
                    <button onClick={() => finalizeScrambleRound(tournamentKey)} style={actionPrimary}>
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
                  <div style={{ ...roundLabel, color: T.accent, marginBottom: 4 }}>Bye This Round</div>
                  <div style={{ fontSize: 13, color: T.text }}>
                    {activeRound.byeIds.map((playerId) => participantMap[String(playerId || '')]?.displayName || 'Player').join(', ')}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,107,181,0.7)' }}>
                    Bye rounds are neutral and do not add a win or loss.
                  </div>
                </div>
              )}

              {activeRound && (
                <div style={courtsGrid}>
                  {(activeRound.courts || []).map((court) => {
                    const result = getScrambleCourtResult(court);
                    return (
                      <div key={`scramble-court-${court.courtNumber}`} style={courtCard}>
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
                              <span style={{ ...teamTag, color: T.accent, marginBottom: 0 }}>Winner</span>
                            )}
                          </div>
                          <div style={teamNameText}>{renderTeamName(court.teamA)}</div>
                        </div>

                        <div style={getTeamSlotStyle(result, 'B')}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={teamTag}>Team B</div>
                            {result && result.scoreB > result.scoreA && (
                              <span style={{ ...teamTag, color: T.accent, marginBottom: 0 }}>Winner</span>
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
                {podium.length > 0 && <CelebrationPodium rows={podium} />}
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
                      <div key={`standing-${row.id}`} style={standingRowStyle}>
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
