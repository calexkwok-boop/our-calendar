import React, { useState, useMemo } from 'react';
import { X, Trophy, RotateCcw, CheckCircle, Circle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Pure helpers — no React, no side effects
// ---------------------------------------------------------------------------

const generateRoundRobinPairings = (participants) => {
  const pairs = [];
  const list = Array.isArray(participants) ? participants : [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      pairs.push({
        id: `rr-${list[i].id}-${list[j].id}`,
        playerAId: list[i].id,
        playerBId: list[j].id,
        scoreA: '',
        scoreB: '',
        completed: false,
      });
    }
  }
  return pairs;
};

const deriveRoundRobinStandings = (participants, matches) => {
  const list = Array.isArray(participants) ? participants : [];
  const stats = {};
  list.forEach((p) => {
    stats[p.id] = {
      id: p.id,
      displayName: String(p.displayName || p.name || 'Player'),
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      played: 0,
    };
  });
  (Array.isArray(matches) ? matches : [])
    .filter((m) => m.completed)
    .forEach((m) => {
      const a = parseInt(String(m.scoreA || ''), 10);
      const b = parseInt(String(m.scoreB || ''), 10);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0 || a === b) return;
      const rowA = stats[m.playerAId];
      const rowB = stats[m.playerBId];
      if (!rowA || !rowB) return;
      rowA.pointsFor += a; rowA.pointsAgainst += b; rowA.played++;
      rowB.pointsFor += b; rowB.pointsAgainst += a; rowB.played++;
      if (a > b) { rowA.wins++; rowB.losses++; }
      else       { rowB.wins++; rowA.losses++; }
    });
  return Object.values(stats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const aDiff = a.pointsFor - a.pointsAgainst;
    const bDiff = b.pointsFor - b.pointsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.pointsFor - a.pointsFor;
  });
};

const createRoundRobinTournament = ({ eventId, participants }) => {
  const safe = Array.isArray(participants)
    ? participants.filter((p) => String(p?.id || '').trim())
    : [];
  return {
    eventId: String(eventId || ''),
    createdAt: new Date().toISOString(),
    completedAt: null,
    status: 'active',
    participants: safe,
    matches: generateRoundRobinPairings(safe),
  };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RoundRobinPanel({
  // theme
  activeLayerPageTheme,
  darkMode,
  // data
  eligibleRoundRobinEvents,   // [{ eventId, event, signups, signupCount }]
  layerRoundRobins,           // { [eventId]: tournament }
  manualRoundRobinRosterInput,
  useManualRoundRobinRoster,
  selectedRoundRobinEventId,
  roundRobinError,
  // setters / actions
  setSelectedRoundRobinEventId,
  setManualRoundRobinRosterInput,
  setUseManualRoundRobinRoster,
  setRoundRobinError,
  setShowRoundRobinPanel,
  startRoundRobinTournament,
  resetRoundRobinTournament,
  updateRoundRobinMatchScore,
  finalizeRoundRobinMatch,
  // helpers
  formatDateKeyMMDDYYYY,
  formatTime,
  resolveHandleLikeLabel,
}) {
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'standings'

  // Derive accent styles from theme (same pattern as GauntletPanel)
  const accent = activeLayerPageTheme?.accent || '#7c3aed';
  const isLight = (hex) => {
    const h = (hex || '#000').replace('#', '');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return (0.2126*r + 0.7152*g + 0.0722*b)/255 > 0.72;
  };
  const accentButtonStyle = {
    backgroundColor: accent,
    color: isLight(accent) ? '#111' : '#fff',
    boxShadow: `0 4px 14px ${accent}55`,
  };
  const accentBorder = `${accent}44`;
  const accentSoftBg = darkMode
    ? `${accent}28`
    : `${accent}18`;

  // Active tournament
  const activeTournamentId = useManualRoundRobinRoster
    ? '__manual__'
    : String(selectedRoundRobinEventId || '');
  const tournament = activeTournamentId ? layerRoundRobins?.[activeTournamentId] : null;
  const standings = tournament
    ? deriveRoundRobinStandings(tournament.participants, tournament.matches)
    : [];
  const completedCount = (tournament?.matches || []).filter((m) => m.completed).length;
  const totalCount = (tournament?.matches || []).length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  // Participant lookup
  const participantById = useMemo(() => {
    const map = {};
    (tournament?.participants || []).forEach((p) => { map[p.id] = p; });
    return map;
  }, [tournament?.participants]);

  const getDisplayName = (id) => {
    const p = participantById[id];
    if (!p) return 'Player';
    return typeof resolveHandleLikeLabel === 'function'
      ? resolveHandleLikeLabel(p.displayName || p.name || 'Player', p.userId || '')
      : String(p.displayName || p.name || 'Player');
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-6 border" style={{ borderColor: accentBorder }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold" style={{ color: accent }}>
            Round Robin
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Everyone plays everyone. Most wins takes the title.
          </p>
        </div>
        <button
          onClick={() => setShowRoundRobinPanel(false)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shrink-0"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* ── No tournament yet ── */}
      {!tournament && (
        <div className="space-y-4">

          {/* Roster source toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 text-xs font-semibold">
            <button
              onClick={() => setUseManualRoundRobinRoster(true)}
              className="flex-1 px-3 py-2 transition-all"
              style={useManualRoundRobinRoster ? accentButtonStyle : undefined}
            >
              Manual Roster
            </button>
            <button
              onClick={() => setUseManualRoundRobinRoster(false)}
              className={`flex-1 px-3 py-2 transition-all ${!useManualRoundRobinRoster ? '' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              style={!useManualRoundRobinRoster ? accentButtonStyle : undefined}
            >
              From Pop-up Event
            </button>
          </div>

          {/* Manual roster */}
          {useManualRoundRobinRoster && (
            <div className="rounded-xl border p-3 bg-gray-50 dark:bg-gray-900/30" style={{ borderColor: accentBorder }}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Players (one per line or comma-separated)
              </label>
              <textarea
                rows={6}
                value={manualRoundRobinRosterInput}
                onChange={(e) => {
                  setManualRoundRobinRosterInput(e.target.value);
                  setRoundRobinError('');
                }}
                placeholder={'Alex\nJordan\nCasey\nRiley'}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-lg resize-none focus:ring-2 focus:outline-none"
                style={{ fontSize: '16px' }}
              />
              <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                Needs at least 3 players to generate matches.
              </div>
            </div>
          )}

          {/* Pop-up event picker */}
          {!useManualRoundRobinRoster && (
            <div className="space-y-2">
              {(eligibleRoundRobinEvents || []).length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No pop-up events with 3+ signups yet.
                </div>
              ) : (
                (eligibleRoundRobinEvents || []).map((entry) => {
                  const isSelected = String(entry.eventId) === String(selectedRoundRobinEventId);
                  return (
                    <button
                      key={entry.eventId}
                      onClick={() => {
                        setSelectedRoundRobinEventId(entry.eventId);
                        setRoundRobinError('');
                      }}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all text-sm ${isSelected ? 'shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40'}`}
                      style={isSelected ? { ...accentButtonStyle, borderColor: 'transparent' } : undefined}
                    >
                      <div className="font-semibold truncate">{entry.event?.title || 'Event'}</div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {formatDateKeyMMDDYYYY ? formatDateKeyMMDDYYYY(entry.event?.date || entry.event?.dateKey || '') : (entry.event?.date || '')}
                        {entry.event?.time ? ` · ${formatTime ? formatTime(entry.event.time) : entry.event.time}` : ''}
                        {' · '}{entry.signupCount} player{entry.signupCount === 1 ? '' : 's'}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {roundRobinError && (
            <div className="text-xs text-red-500 dark:text-red-400 px-1">{roundRobinError}</div>
          )}

          <button
            onClick={() => startRoundRobinTournament(activeTournamentId)}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
            style={accentButtonStyle}
          >
            Generate Matches
          </button>
        </div>
      )}

      {/* ── Active tournament ── */}
      {tournament && (
        <div className="space-y-4">

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>{completedCount} of {totalCount} matches played</span>
              {allDone && (
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Complete
                </span>
              )}
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%',
                  backgroundColor: accent,
                }}
              />
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('matches')}
              className="flex-1 px-3 py-2 transition-all"
              style={activeTab === 'matches' ? accentButtonStyle : { backgroundColor: 'transparent', color: 'inherit' }}
            >
              Matches ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className="flex-1 px-3 py-2 transition-all"
              style={activeTab === 'standings' ? accentButtonStyle : { backgroundColor: 'transparent', color: 'inherit' }}
            >
              Standings
            </button>
          </div>

          {/* ── Matches tab ── */}
          {activeTab === 'matches' && (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {(tournament.matches || []).map((match) => {
                const nameA = getDisplayName(match.playerAId);
                const nameB = getDisplayName(match.playerBId);
                const aWon = match.completed && parseInt(match.scoreA) > parseInt(match.scoreB);
                const bWon = match.completed && parseInt(match.scoreB) > parseInt(match.scoreA);
                return (
                  <div
                    key={match.id}
                    className="rounded-xl border px-3 py-2.5 transition-all"
                    style={{
                      borderColor: match.completed ? `${accent}55` : 'transparent',
                      backgroundColor: match.completed
                        ? (darkMode ? `${accent}18` : `${accent}0d`)
                        : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Player A */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-semibold truncate ${aWon ? '' : 'text-gray-700 dark:text-gray-200'}`}
                          style={aWon ? { color: accent } : undefined}>
                          {nameA}
                          {aWon && <Trophy className="inline w-3 h-3 ml-1 mb-0.5" />}
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={match.scoreA}
                          onChange={(e) => updateRoundRobinMatchScore(activeTournamentId, match.id, 'scoreA', e.target.value)}
                          disabled={match.completed}
                          placeholder="—"
                          className="w-10 text-center text-sm font-bold border rounded-lg py-1 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-60 disabled:cursor-default focus:ring-2 focus:outline-none"
                          style={{ borderColor: accentBorder, fontSize: '16px' }}
                        />
                        <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">vs</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={match.scoreB}
                          onChange={(e) => updateRoundRobinMatchScore(activeTournamentId, match.id, 'scoreB', e.target.value)}
                          disabled={match.completed}
                          placeholder="—"
                          className="w-10 text-center text-sm font-bold border rounded-lg py-1 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-60 disabled:cursor-default focus:ring-2 focus:outline-none"
                          style={{ borderColor: accentBorder, fontSize: '16px' }}
                        />
                      </div>

                      {/* Player B */}
                      <div className="flex-1 min-w-0 text-right">
                        <div className={`text-xs font-semibold truncate ${bWon ? '' : 'text-gray-700 dark:text-gray-200'}`}
                          style={bWon ? { color: accent } : undefined}>
                          {bWon && <Trophy className="inline w-3 h-3 mr-1 mb-0.5" />}
                          {nameB}
                        </div>
                      </div>

                      {/* Confirm / status */}
                      <button
                        onClick={() => {
                          if (!match.completed) finalizeRoundRobinMatch(activeTournamentId, match.id);
                        }}
                        disabled={match.completed}
                        className="shrink-0 p-1 rounded-lg transition-all disabled:cursor-default"
                        title={match.completed ? 'Confirmed' : 'Confirm result'}
                      >
                        {match.completed
                          ? <CheckCircle className="w-4 h-4" style={{ color: accent }} />
                          : <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 hover:text-gray-500" />
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Standings tab ── */}
          {activeTab === 'standings' && (
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: accentBorder }}>
              {/* Header row */}
              <div
                className="grid grid-cols-[auto_1fr_repeat(4,auto)] gap-x-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                <span>#</span>
                <span>Player</span>
                <span className="text-center">W</span>
                <span className="text-center">L</span>
                <span className="text-center">Pts</span>
                <span className="text-center">+/-</span>
              </div>
              {standings.length === 0 ? (
                <div className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                  No results yet.
                </div>
              ) : (
                standings.map((row, idx) => {
                  const isFirst = idx === 0 && row.wins > 0;
                  const diff = row.pointsFor - row.pointsAgainst;
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[auto_1fr_repeat(4,auto)] gap-x-3 px-3 py-2.5 text-sm border-t border-gray-100 dark:border-gray-700/60 items-center"
                      style={isFirst && allDone ? { backgroundColor: `${accent}14` } : undefined}
                    >
                      <span className="text-xs font-bold w-5 text-center" style={isFirst && allDone ? { color: accent } : { color: 'transparent', borderColor: 'var(--color-text-secondary)' }}>
                        {isFirst && allDone ? '🏆' : `${idx + 1}`}
                      </span>
                      <span className={`font-medium truncate text-xs ${isFirst && allDone ? '' : 'text-gray-800 dark:text-gray-100'}`}
                        style={isFirst && allDone ? { color: accent } : undefined}>
                        {row.displayName}
                      </span>
                      <span className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">{row.wins}</span>
                      <span className="text-center text-xs text-rose-500 dark:text-rose-400">{row.losses}</span>
                      <span className="text-center text-xs text-gray-600 dark:text-gray-300">{row.pointsFor}</span>
                      <span className={`text-center text-xs font-semibold ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : diff < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Reset */}
          <button
            onClick={() => resetRoundRobinTournament(activeTournamentId)}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors mx-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset tournament
          </button>
        </div>
      )}
    </div>
  );
}
