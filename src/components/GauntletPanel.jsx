import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const T = {
  bg: '#0d0f14',
  surface: '#13161e',
  card: '#181c27',
  border: 'rgba(255,255,255,0.07)',
  borderGlow: 'rgba(255,214,0,0.22)',
  gold: '#ffd600',
  goldText: '#ffe566',
  accent: '#4fffb0',
  red: '#ff4d6d',
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
    radial-gradient(ellipse 60% 80% at 90% 50%, rgba(255,214,0,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 30% 60% at 10% 0%, rgba(79,255,176,0.04) 0%, transparent 60%)
  `,
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'rgba(255,214,0,0.10)',
  border: '1px solid rgba(255,214,0,0.25)',
  borderRadius: 999,
  padding: '4px 11px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  color: T.goldText,
  textTransform: 'uppercase',
  marginBottom: 10,
  fontFamily: '"Syne", sans-serif',
};

const liveDot = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: T.gold,
  animation: 'g-pulse 2s infinite',
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
  border: '1px solid rgba(79,255,176,0.30)',
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
  background: 'rgba(255,214,0,0.05)',
  border: '1px solid rgba(255,214,0,0.13)',
  borderRadius: 10,
  padding: '9px 13px',
  fontSize: 11.5,
  color: 'rgba(255,230,100,0.75)',
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
  background: T.gold,
  color: '#0d0f14',
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

const stepVal = {
  flex: 1,
  textAlign: 'center',
  fontFamily: '"Syne", sans-serif',
  fontSize: 20,
  fontWeight: 800,
  color: '#fff',
};

const startBtnStyle = {
  width: '100%',
  padding: '11px 16px',
  background: T.gold,
  border: 'none',
  borderRadius: 10,
  fontFamily: '"Syne", sans-serif',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#0d0f14',
  cursor: 'pointer',
};

const rosterCard = {
  marginTop: 12,
  background: T.card,
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
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: T.text,
};

const rosterCountBadge = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: T.gold,
  border: '1px solid rgba(255,214,0,0.25)',
  borderRadius: 999,
  padding: '3px 9px',
};

const roundBar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: '11px 14px',
  marginBottom: 12,
};

const roundLabel = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: T.sub,
};

const actionPrimary = {
  fontFamily: '"Syne", sans-serif',
  padding: '7px 13px',
  borderRadius: 8,
  background: T.gold,
  border: 'none',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#0d0f14',
  cursor: 'pointer',
};

const actionSecondary = {
  fontFamily: '"Syne", sans-serif',
  padding: '7px 13px',
  borderRadius: 8,
  background: 'transparent',
  border: `1px solid ${T.border}`,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: T.sub,
  cursor: 'pointer',
};

const byeCardStyle = {
  background: 'rgba(255,77,109,0.07)',
  border: '1px solid rgba(255,77,109,0.2)',
  borderRadius: 12,
  padding: '11px 14px',
  marginBottom: 12,
};

const courtsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 10,
  marginBottom: 14,
};

const courtCard = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  padding: 14,
};

const courtHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 11,
};

const courtNameStyle = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.04em',
  color: '#fff',
};

const courtStatusBase = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  border: `1px solid ${T.border}`,
  borderRadius: 999,
  padding: '3px 9px',
  color: T.sub,
};

const courtStatusLocked = {
  ...courtStatusBase,
  border: '1px solid rgba(79,255,176,0.30)',
  color: T.accent,
};

const teamSlotBase = {
  borderRadius: 9,
  padding: '9px 11px',
  marginBottom: 6,
  border: `1px solid ${T.border}`,
  background: 'rgba(255,255,255,0.03)',
};

const teamSlotWinner = {
  ...teamSlotBase,
  border: '1px solid rgba(79,255,176,0.35)',
  background: 'rgba(79,255,176,0.06)',
};

const teamSlotLoser = {
  ...teamSlotBase,
  opacity: 0.55,
};

const teamTag = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: T.muted,
  marginBottom: 2,
};

const teamNameText = {
  fontFamily: '"Syne", sans-serif',
  fontSize: 13,
  fontWeight: 700,
  color: T.text,
};

const scoreRow = {
  display: 'grid',
  gridTemplateColumns: '60px 1fr 60px',
  gap: 8,
  alignItems: 'center',
  marginTop: 10,
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${T.border}`,
  borderRadius: 9,
  padding: '6px 8px',
};

const scoreInput = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  fontFamily: '"Syne", sans-serif',
  fontSize: 16,
  fontWeight: 800,
  textAlign: 'center',
  color: '#fff',
  outline: 'none',
  padding: '2px 0',
};

const cardOuter = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  overflow: 'hidden',
};

const cardHeaderStyle = {
  padding: '11px 14px',
  borderBottom: `1px solid ${T.border}`,
  fontFamily: '"Syne", sans-serif',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: T.muted,
};

const standingsCols = {
  display: 'grid',
  gridTemplateColumns: '50px 1fr 44px 44px 36px 44px',
  gap: 6,
  padding: '7px 12px',
  fontFamily: '"Syne", sans-serif',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: T.muted,
  borderBottom: `1px solid ${T.border}`,
};

const standingRowStyle = {
  display: 'grid',
  gridTemplateColumns: '50px 1fr 44px 44px 36px 44px',
  gap: 6,
  padding: '9px 12px',
  alignItems: 'center',
  borderBottom: `1px solid ${T.border}`,
};

const emptyState = {
  padding: '32px 20px',
  textAlign: 'center',
  border: '1px dashed rgba(255,255,255,0.10)',
  borderRadius: 12,
  color: T.muted,
  fontSize: 13,
  lineHeight: 1.6,
  marginTop: 12,
};

const historyCard = {
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: '10px 12px',
};

const FONT_STYLE = `
  @keyframes g-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

function RankBadge({ index }) {
  const medals = [
    { emoji: '🥇', color: T.gold },
    { emoji: '🥈', color: '#c0c8d8' },
    { emoji: '🥉', color: '#c47a3a' },
  ];

  if (index < 3) {
    return (
      <span style={{ fontFamily: '"Syne", sans-serif', fontSize: 14, fontWeight: 800, color: medals[index].color }}>
        {medals[index].emoji}
      </span>
    );
  }

  return (
    <span style={{ fontFamily: '"Syne", sans-serif', fontSize: 12, fontWeight: 700, color: T.muted }}>
      #{index + 1}
    </span>
  );
}

function StatVal({ value, positive, negative, muted }) {
  const color = positive ? T.accent : negative ? T.red : muted ? T.sub : T.text;
  return (
    <div style={{ textAlign: 'right', fontFamily: '"Syne", sans-serif', fontSize: 12, fontWeight: 700, color }}>
      {value}
    </div>
  );
}

function GauntletPanel({
  deriveGauntletStandings,
  eligibleGauntletPopupEvents,
  finalizeGauntletRound,
  formatDateKeyMMDDYYYY,
  formatTime,
  gauntletDraftRounds,
  gauntletError,
  getGauntletCourtResult,
  layerGauntlets,
  manualGauntletEligible,
  manualGauntletParticipants,
  manualGauntletRosterInput,
  resetGauntletTournament,
  selectedGauntletEventId,
  setGauntletDraftRounds,
  setGauntletError,
  setManualGauntletRosterInput,
  setSelectedGauntletEventId,
  setShowGauntletPanel,
  setUseManualGauntletRoster,
  startGauntletTournament,
  updateGauntletCourtScore,
  useManualGauntletRoster,
}) {
  const selectedEntry =
    eligibleGauntletPopupEvents.find(
      (entry) => String(entry?.eventId || '') === String(selectedGauntletEventId || '')
    ) || null;
  const selectedEvent = selectedEntry?.event || null;
  const signups = selectedEntry?.signups || [];
  const signupCount = signups.length;
  const tournamentKey = useManualGauntletRoster ? '__manual__' : String(selectedGauntletEventId || '');
  const tournament = layerGauntlets[tournamentKey] || null;
  const tournamentStandings = deriveGauntletStandings(tournament);
  const rounds = tournament?.rounds || [];
  const activeRoundIndex = rounds.findIndex((round) => !round?.finalizedAt);
  const activeRound = activeRoundIndex >= 0 ? rounds[activeRoundIndex] : null;

  const participantMap = (tournament?.participants || []).reduce((acc, participant) => {
    const id = String(participant?.id || '').trim();
    if (!id) return acc;
    acc[id] = participant;
    return acc;
  }, {});

  const roundNum = Math.min(
    activeRoundIndex >= 0 ? activeRoundIndex + 1 : rounds.length,
    Number(tournament?.totalRounds || 1)
  );
  const totalRounds = Number(tournament?.totalRounds || 1);
  const roundsVal = Math.max(1, parseInt(String(gauntletDraftRounds || '1'), 10) || 1);

  const renderTeamName = (playerIds) =>
    (playerIds || [])
      .map((id) => participantMap[String(id || '')]?.displayName || 'Player')
      .join(' + ');

  const getTeamSlotStyle = (result, teamKey) => {
    if (!result) return teamSlotBase;
    const won = teamKey === 'A' ? result.scoreA > result.scoreB : result.scoreB > result.scoreA;
    return won ? teamSlotWinner : teamSlotLoser;
  };

  return (
    <>
      <style>{FONT_STYLE}</style>
      <div style={shell}>
        <div style={heroStyle}>
          <div style={heroBg} />
          <div style={badge}>
            <span style={liveDot} />
            Tournament Suite
          </div>
          <h3 style={heroTitle}>
            Pickleball <span style={{ color: T.gold }}>Gauntlet</span>
          </h3>
          <p style={heroSub}>
            King-of-the-court bracket with rotating byes, court movement, and live standings.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
            {tournament && (
              <>
                <span style={pillBase}>
                  Round <strong style={{ color: '#fff' }}>{roundNum}/{totalRounds}</strong>
                </span>
                <span style={pillBase}>
                  Players <strong style={{ color: '#fff' }}>{tournament?.participants?.length || 0}</strong>
                </span>
                <span
                  style={
                    tournament?.status === 'completed'
                      ? { ...pillLive, border: '1px solid rgba(255,214,0,0.35)', color: T.goldText }
                      : pillLive
                  }
                >
                  {tournament?.status === 'completed' ? 'Final' : 'Live'}
                </span>
              </>
            )}
          </div>
          <button onClick={() => setShowGauntletPanel(false)} style={closeBtn} aria-label="Close">
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={infoBar}>
          Bracket is saved on-device for the active layer. When player count is not divisible by 4,
          byes rotate automatically and do not count as wins or losses.
        </div>

        <div style={{ padding: 14 }}>
          <div style={segRow}>
            <button
              style={useManualGauntletRoster ? segBtnActive : segBtnBase}
              onClick={() => {
                setUseManualGauntletRoster(true);
                setGauntletError('');
              }}
            >
              Manual Names
            </button>
            <button
              style={!useManualGauntletRoster ? segBtnActive : segBtnBase}
              onClick={() => {
                setUseManualGauntletRoster(false);
                setGauntletError('');
              }}
            >
              Popup Signups
            </button>
          </div>

          <div style={formGrid}>
            <div>
              <label style={fieldLabel}>
                {useManualGauntletRoster ? 'Player Names' : 'Popup Event'}
              </label>
              {useManualGauntletRoster ? (
                <textarea
                  value={manualGauntletRosterInput}
                  onChange={(e) => setManualGauntletRosterInput(e.target.value)}
                  placeholder="Enter one player per line"
                  rows={4}
                  style={{ ...inputBase, resize: 'none', minHeight: 104 }}
                />
              ) : (
                <select
                  value={selectedGauntletEventId}
                  onChange={(e) => {
                    setSelectedGauntletEventId(e.target.value);
                    setGauntletError('');
                  }}
                  style={{ ...inputBase, minHeight: 44 }}
                >
                  {eligibleGauntletPopupEvents.length === 0 ? (
                    <option value="">No popup events yet</option>
                  ) : (
                    eligibleGauntletPopupEvents.map((entry) => (
                      <option key={entry.eventId} value={entry.eventId}>
                        {entry.event?.title || 'Popup event'} - {entry.signupCount} joined
                        {entry.eligible ? '' : ' - needs 4+'}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div style={stepper}>
              <div style={stepperTop}>Games</div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '2px 4px 6px' }}>
                <button
                  type="button"
                  onClick={() =>
                    setGauntletDraftRounds((prev) =>
                      String(Math.max(1, (parseInt(String(prev || '1'), 10) || 1) - 1))
                    )
                  }
                  style={stepBtnStyle}
                  aria-label="Decrease games"
                >
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </button>
                <div style={stepVal}>{roundsVal}</div>
                <button
                  type="button"
                  onClick={() =>
                    setGauntletDraftRounds((prev) =>
                      String(Math.min(99, (parseInt(String(prev || '1'), 10) || 1) + 1))
                    )
                  }
                  style={stepBtnStyle}
                  aria-label="Increase games"
                >
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>

            <div>
              <label style={fieldLabel}>Action</label>
              <button
                onClick={() => startGauntletTournament(selectedGauntletEventId, Boolean(tournament))}
                disabled={useManualGauntletRoster ? !manualGauntletEligible : !selectedEntry?.eligible}
                style={{
                  ...startBtnStyle,
                  opacity: useManualGauntletRoster ? (manualGauntletEligible ? 1 : 0.45) : (selectedEntry?.eligible ? 1 : 0.45),
                  cursor: useManualGauntletRoster ? (manualGauntletEligible ? 'pointer' : 'not-allowed') : (selectedEntry?.eligible ? 'pointer' : 'not-allowed'),
                }}
              >
                {tournament ? 'Restart' : 'Start'}
              </button>
            </div>
          </div>

          {useManualGauntletRoster ? (
            <div style={rosterCard}>
              <div style={rosterHeader}>
                <div style={rosterTitleStyle}>Manual Roster</div>
                <span style={rosterCountBadge}>{manualGauntletParticipants.length} entered</span>
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
                {manualGauntletParticipants.length} players entered
                {manualGauntletEligible
                  ? ` - ${Math.floor(manualGauntletParticipants.length / 4)} active court${Math.floor(manualGauntletParticipants.length / 4) === 1 ? '' : 's'}${manualGauntletParticipants.length % 4 ? ` + ${manualGauntletParticipants.length % 4} bye${manualGauntletParticipants.length % 4 === 1 ? '' : 's'}` : ''}`
                  : ' - needs at least 4 names'}
              </div>
              {manualGauntletParticipants.length > 0 && (
                <div style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.6 }}>
                  {manualGauntletParticipants.map((row) => row.displayName).join(', ')}
                </div>
              )}
            </div>
          ) : selectedEvent ? (
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

          {gauntletError && <p style={{ marginTop: 12, fontSize: 12, color: T.red }}>{gauntletError}</p>}

          {!tournament ? (
            <div style={emptyState}>
              {useManualGauntletRoster
                ? 'Enter player names above and start the gauntlet.'
                : eligibleGauntletPopupEvents.length === 0
                  ? 'Create a popup event and have players join it first.'
                  : 'Choose an eligible popup event and start the gauntlet.'}
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <div style={roundBar}>
                <div style={roundLabel}>
                  Round {roundNum} of {totalRounds} - {tournament.status === 'completed' ? 'Completed' : 'In Progress'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {activeRound && (
                    <button onClick={() => finalizeGauntletRound(tournamentKey)} style={actionPrimary}>
                      Finalize Round
                    </button>
                  )}
                  <button onClick={() => resetGauntletTournament(tournamentKey)} style={actionSecondary}>
                    Reset
                  </button>
                </div>
              </div>

              {activeRound && Array.isArray(activeRound.byeIds) && activeRound.byeIds.length > 0 && (
                <div style={byeCardStyle}>
                  <div style={{ ...roundLabel, color: '#ff96aa', marginBottom: 4 }}>Bye This Round</div>
                  <div style={{ fontSize: 13, color: T.text }}>
                    {activeRound.byeIds.map((playerId) => participantMap[String(playerId || '')]?.displayName || 'Player').join(', ')}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,150,170,0.8)' }}>
                    Bye rounds are neutral and do not add a win or loss.
                  </div>
                </div>
              )}

              {activeRound && (
                <div style={courtsGrid}>
                  {(activeRound.courts || []).map((court) => {
                    const result = getGauntletCourtResult(court);
                    return (
                      <div key={`gauntlet-court-${court.courtNumber}`} style={courtCard}>
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
                              updateGauntletCourtScore(
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
                              updateGauntletCourtScore(
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
                          <div style={{ marginTop: 4, fontSize: 11, color: '#ff96aa' }}>
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

export default GauntletPanel;
