import React, { useState, useMemo } from 'react';
import { X, Trophy, RotateCcw, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';

const buildRoundRobinRounds = (participants, teamsOf = 2) => {
  const list = [...(Array.isArray(participants) ? participants : [])];
  if (list.length < teamsOf * 2) return [];
  const teams = [];
  if (teamsOf === 1) {
    list.forEach((p, i) => teams.push({ id: `team-${i}`, members: [p] }));
  } else {
    for (let i = 0; i + 1 < list.length; i += 2) {
      teams.push({ id: `team-${i}`, members: [list[i], list[i + 1]] });
    }
    if (list.length % 2 !== 0) {
      teams.push({ id: `team-solo`, members: [list[list.length - 1]] });
    }
  }
  const n = teams.length;
  if (n < 2) return [];
  const slots = n % 2 === 0 ? [...teams] : [...teams, { id: 'bye', members: [], isBye: true }];
  const slotCount = slots.length;
  const rounds = [];
  const fixed = slots[0];
  const rotating = slots.slice(1);
  const numRounds = slotCount - 1;
  for (let r = 0; r < numRounds; r++) {
    const current = [fixed, ...rotating];
    const matches = [];
    for (let i = 0; i < slotCount / 2; i++) {
      const teamA = current[i];
      const teamB = current[slotCount - 1 - i];
      if (teamA.isBye || teamB.isBye) continue;
      matches.push({ id: `rr-r${r}-m${i}`, round: r, teamA, teamB, scoreA: '', scoreB: '', completed: false });
    }
    if (matches.length > 0) rounds.push({ index: r, matches, finalizedAt: null });
    rotating.unshift(rotating.pop());
  }
  return rounds;
};

const deriveRoundRobinStandings = (participants, rounds) => {
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
  return Object.values(stats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const aDiff = a.pointsFor - a.pointsAgainst;
    const bDiff = b.pointsFor - b.pointsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    return b.pointsFor - a.pointsFor;
  });
};

const getTeamLabel = (team, resolveHandleLikeLabel) => {
  if (!team || team.isBye) return 'Bye';
  const members = team.members || [];
  if (members.length === 0) return 'Team';
  return members.map((p) =>
    typeof resolveHandleLikeLabel === 'function'
      ? resolveHandleLikeLabel(p.displayName || p.name || 'Player', p.userId || '')
      : String(p.displayName || p.name || 'Player')
  ).join(' & ');
};

export default function RoundRobinPanel({
  activeLayerPageTheme, darkMode, eligibleRoundRobinEvents, layerRoundRobins,
  manualRoundRobinRosterInput, useManualRoundRobinRoster, selectedRoundRobinEventId,
  roundRobinError, setSelectedRoundRobinEventId, setManualRoundRobinRosterInput,
  setUseManualRoundRobinRoster, setRoundRobinError, setShowRoundRobinPanel,
  startRoundRobinTournament, resetRoundRobinTournament, updateRoundRobinMatchScore,
  finalizeRoundRobinMatch, formatDateKeyMMDDYYYY, formatTime, resolveHandleLikeLabel,
}) {
  const [activeTab, setActiveTab] = useState('matches');
  const [teamsOf, setTeamsOf] = useState(2);
  const [expandedRounds, setExpandedRounds] = useState({});

  const accent = activeLayerPageTheme?.accent || '#7c3aed';
  const isLight = (hex) => { const h = (hex || '#000').replace('#', ''); const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16); return (0.2126*r+0.7152*g+0.0722*b)/255 > 0.72; };
  const accentButtonStyle = { backgroundColor: accent, color: isLight(accent) ? '#111' : '#fff', boxShadow: `0 4px 14px ${accent}55` };
  const accentBorder = `${accent}44`;

  const activeTournamentId = useManualRoundRobinRoster ? '__manual__' : String(selectedRoundRobinEventId || '');
  const tournament = activeTournamentId ? layerRoundRobins?.[activeTournamentId] : null;

  const standings = useMemo(() => tournament ? deriveRoundRobinStandings(tournament.participants, tournament.rounds) : [], [tournament]);
  const allMatches = useMemo(() => (tournament?.rounds || []).flatMap((r) => r.matches || []), [tournament]);
  const completedCount = allMatches.filter((m) => m.completed).length;
  const totalCount = allMatches.length;
  const allDone = totalCount > 0 && completedCount === totalCount;
  const firstIncompleteRound = (tournament?.rounds || []).find((r) => (r.matches || []).some((m) => !m.completed));
  const toggleRound = (idx) => setExpandedRounds((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-6 border" style={{ borderColor: accentBorder }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold" style={{ color: accent }}>Round Robin</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Every team plays every other team. Most wins takes the title.</p>
        </div>
        <button onClick={() => setShowRoundRobinPanel(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shrink-0"><X className="w-4 h-4 text-gray-500 dark:text-gray-400" /></button>
      </div>

      {!tournament && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">Format</div>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 text-xs font-semibold">
              <button onClick={() => setTeamsOf(2)} className="flex-1 px-3 py-2 transition-all" style={teamsOf === 2 ? accentButtonStyle : undefined}>Doubles (2v2)</button>
              <button onClick={() => setTeamsOf(1)} className={`flex-1 px-3 py-2 transition-all ${teamsOf === 1 ? '' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`} style={teamsOf === 1 ? accentButtonStyle : undefined}>Singles (1v1)</button>
            </div>
            {teamsOf === 2 && <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">Players are paired into teams in the order they appear on the roster.</p>}
          </div>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 text-xs font-semibold">
            <button onClick={() => setUseManualRoundRobinRoster(true)} className="flex-1 px-3 py-2 transition-all" style={useManualRoundRobinRoster ? accentButtonStyle : undefined}>Manual Roster</button>
            <button onClick={() => setUseManualRoundRobinRoster(false)} className={`flex-1 px-3 py-2 transition-all ${!useManualRoundRobinRoster ? '' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`} style={!useManualRoundRobinRoster ? accentButtonStyle : undefined}>From Pop-up Event</button>
          </div>
          {useManualRoundRobinRoster && (
            <div className="rounded-xl border p-3 bg-gray-50 dark:bg-gray-900/30" style={{ borderColor: accentBorder }}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Players — one per line{teamsOf === 2 && ' (consecutive pairs = teams)'}</label>
              <textarea rows={8} value={manualRoundRobinRosterInput} onChange={(e) => { setManualRoundRobinRosterInput(e.target.value); setRoundRobinError(''); }}
                placeholder={teamsOf === 2 ? 'Alex\nJordan   ← Team 1\nCasey\nRiley    ← Team 2\nTaylor\nMorgan   ← Team 3' : 'Alex\nJordan\nCasey\nRiley'}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-lg resize-none focus:ring-2 focus:outline-none font-mono" style={{ fontSize: '16px' }} />
              <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{teamsOf === 2 ? 'Needs at least 4 players (2 teams).' : 'Needs at least 3 players.'}</div>
            </div>
          )}
          {!useManualRoundRobinRoster && (
            <div className="space-y-2">
              {(eligibleRoundRobinEvents || []).length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">No pop-up events with enough signups yet.</div>
              ) : (
                (eligibleRoundRobinEvents || []).map((entry) => {
                  const isSelected = String(entry.eventId) === String(selectedRoundRobinEventId);
                  return (
                    <button key={entry.eventId} onClick={() => { setSelectedRoundRobinEventId(entry.eventId); setRoundRobinError(''); }}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all text-sm ${isSelected ? 'shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40'}`}
                      style={isSelected ? { ...accentButtonStyle, borderColor: 'transparent' } : undefined}>
                      <div className="font-semibold truncate">{entry.event?.title || 'Event'}</div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {formatDateKeyMMDDYYYY ? formatDateKeyMMDDYYYY(entry.event?.date || entry.event?.dateKey || '') : entry.event?.date || ''}
                        {entry.event?.time ? ` · ${formatTime ? formatTime(entry.event.time) : entry.event.time}` : ''}
                        {' · '}{entry.signupCount} player{entry.signupCount === 1 ? '' : 's'}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
          {roundRobinError && <div className="text-xs text-red-500 dark:text-red-400 px-1">{roundRobinError}</div>}
          <button onClick={() => startRoundRobinTournament(activeTournamentId, false, teamsOf)} className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg" style={accentButtonStyle}>Generate Schedule</button>
        </div>
      )}

      {tournament && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: `${accent}22`, color: accent }}>{tournament.teamsOf === 2 ? 'Doubles' : 'Singles'}</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{tournament.participants.length} players · {Math.floor(tournament.participants.length / (tournament.teamsOf || 2))} teams · {(tournament.rounds || []).length} rounds</span>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>{completedCount} of {totalCount} matches played</span>
              {allDone && <span className="flex items-center gap-1 font-semibold" style={{ color: accent }}><CheckCircle className="w-3.5 h-3.5" /> Complete</span>}
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%', backgroundColor: accent }} />
            </div>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 text-xs font-semibold">
            <button onClick={() => setActiveTab('matches')} className="flex-1 px-3 py-2 transition-all" style={activeTab === 'matches' ? accentButtonStyle : { backgroundColor: 'transparent' }}>Schedule ({(tournament.rounds || []).length} rounds)</button>
            <button onClick={() => setActiveTab('standings')} className="flex-1 px-3 py-2 transition-all" style={activeTab === 'standings' ? accentButtonStyle : { backgroundColor: 'transparent' }}>Standings</button>
          </div>

          {activeTab === 'matches' && (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {(tournament.rounds || []).map((round) => {
                const roundCompleted = round.matches.every((m) => m.completed);
                const roundDoneCount = round.matches.filter((m) => m.completed).length;
                const isCurrentRound = firstIncompleteRound?.index === round.index;
                const isExpanded = expandedRounds[round.index] !== undefined ? expandedRounds[round.index] : isCurrentRound;
                return (
                  <div key={round.index} className="rounded-xl border overflow-hidden" style={{ borderColor: isCurrentRound ? `${accent}66` : accentBorder, backgroundColor: isCurrentRound ? (darkMode ? `${accent}14` : `${accent}08`) : undefined }}>
                    <button onClick={() => toggleRound(round.index)} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Round {round.index + 1}</span>
                        {roundCompleted ? <CheckCircle className="w-3.5 h-3.5" style={{ color: accent }} /> : isCurrentRound ? <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${accent}22`, color: accent }}>Current</span> : null}
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">{roundDoneCount}/{round.matches.length} done</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                        {round.matches.map((match) => {
                          const labelA = getTeamLabel(match.teamA, resolveHandleLikeLabel);
                          const labelB = getTeamLabel(match.teamB, resolveHandleLikeLabel);
                          const aWon = match.completed && parseInt(match.scoreA) > parseInt(match.scoreB);
                          const bWon = match.completed && parseInt(match.scoreB) > parseInt(match.scoreA);
                          return (
                            <div key={match.id} className="rounded-lg border px-3 py-2" style={{ borderColor: match.completed ? `${accent}44` : 'transparent', backgroundColor: match.completed ? (darkMode ? `${accent}14` : `${accent}0a`) : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)') }}>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold truncate" style={aWon ? { color: accent } : { color: 'inherit' }}>
                                    {aWon && <Trophy className="inline w-3 h-3 mr-0.5 mb-0.5" />}{labelA}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <input type="number" min="0" max="99" value={match.scoreA} onChange={(e) => updateRoundRobinMatchScore(activeTournamentId, round.index, match.id, 'scoreA', e.target.value)} disabled={match.completed} placeholder="—" className="w-10 text-center text-sm font-bold border rounded-lg py-1 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-60 disabled:cursor-default focus:ring-2 focus:outline-none" style={{ borderColor: accentBorder, fontSize: '16px' }} />
                                  <span className="text-gray-400 dark:text-gray-500 text-[11px]">vs</span>
                                  <input type="number" min="0" max="99" value={match.scoreB} onChange={(e) => updateRoundRobinMatchScore(activeTournamentId, round.index, match.id, 'scoreB', e.target.value)} disabled={match.completed} placeholder="—" className="w-10 text-center text-sm font-bold border rounded-lg py-1 bg-white dark:bg-gray-800 dark:text-white disabled:opacity-60 disabled:cursor-default focus:ring-2 focus:outline-none" style={{ borderColor: accentBorder, fontSize: '16px' }} />
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                  <div className="text-xs font-semibold truncate" style={bWon ? { color: accent } : { color: 'inherit' }}>
                                    {labelB}{bWon && <Trophy className="inline w-3 h-3 ml-0.5 mb-0.5" />}
                                  </div>
                                </div>
                                <button onClick={() => { if (!match.completed) finalizeRoundRobinMatch(activeTournamentId, round.index, match.id); }} disabled={match.completed} className="shrink-0 p-1 rounded-lg transition-all disabled:cursor-default" title={match.completed ? 'Confirmed' : 'Confirm result'}>
                                  {match.completed ? <CheckCircle className="w-4 h-4" style={{ color: accent }} /> : <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                                </button>
                              </div>
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
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: accentBorder }}>
              <div className="grid grid-cols-[auto_1fr_repeat(4,auto)] gap-x-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide" style={{ backgroundColor: `${accent}22`, color: accent }}>
                <span>#</span><span>Player</span><span className="text-center">W</span><span className="text-center">L</span><span className="text-center">Pts</span><span className="text-center">+/-</span>
              </div>
              {standings.length === 0 ? (
                <div className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">No results yet.</div>
              ) : (
                standings.map((row, idx) => {
                  const isFirst = idx === 0 && row.wins > 0;
                  const diff = row.pointsFor - row.pointsAgainst;
                  return (
                    <div key={row.id} className="grid grid-cols-[auto_1fr_repeat(4,auto)] gap-x-3 px-3 py-2.5 text-sm border-t border-gray-100 dark:border-gray-700/60 items-center" style={isFirst && allDone ? { backgroundColor: `${accent}14` } : undefined}>
                      <span className="text-xs font-bold w-5 text-center" style={isFirst && allDone ? { color: accent } : { color: 'var(--color-text-secondary)' }}>{isFirst && allDone ? '🏆' : `${idx + 1}`}</span>
                      <span className="font-medium truncate text-xs" style={isFirst && allDone ? { color: accent } : undefined}>{row.displayName}</span>
                      <span className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">{row.wins}</span>
                      <span className="text-center text-xs text-rose-500 dark:text-rose-400">{row.losses}</span>
                      <span className="text-center text-xs text-gray-600 dark:text-gray-300">{row.pointsFor}</span>
                      <span className={`text-center text-xs font-semibold ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : diff < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400'}`}>{diff > 0 ? '+' : ''}{diff}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <button onClick={() => resetRoundRobinTournament(activeTournamentId)} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors mx-auto">
            <RotateCcw className="w-3.5 h-3.5" />Reset tournament
          </button>
        </div>
      )}
    </div>
  );
}
