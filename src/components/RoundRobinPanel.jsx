import React, { useState, useMemo } from 'react';
import { X, Trophy, RotateCcw, CheckCircle, ChevronDown, ChevronUp, Users } from 'lucide-react';

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
    if (matches.length > 0) rounds.push({ index: r, matches, finalizedAt: null });
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
  return Object.values(stats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diff = (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
    if (diff !== 0) return diff;
    return b.pointsFor - a.pointsFor;
  });
};

const getTeamLabel = (team, fn) => {
  if (!team || team.isBye) return 'Bye';
  return (team.members || []).map((p) =>
    typeof fn === 'function' ? fn(p.displayName || p.name || 'Player', p.userId || '') : String(p.displayName || p.name || 'Player')
  ).join(' & ');
};

const initials = (name) => {
  const parts = String(name || '?').trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : String(name || '?')[0].toUpperCase();
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const Avatar = ({ name, size = 28, accent, style = {} }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: `${accent}28`, border: `1.5px solid ${accent}55`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.38, fontWeight: 700, color: accent,
    letterSpacing: '-0.02em', ...style,
  }}>
    {initials(name)}
  </div>
);

const TeamPill = ({ team, accent, resolveHandleLikeLabel, won }) => {
  if (!team || team.isBye) return <span style={{ fontSize: 11, color: '#9ca3af' }}>Bye</span>;
  const members = team.members || [];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', marginRight: 2 }}>
        {members.map((p, i) => (
          <Avatar key={p.id} name={p.displayName || p.name || 'P'} size={24} accent={won ? accent : '#9ca3af'}
            style={{ marginLeft: i > 0 ? -6 : 0, border: `1.5px solid ${won ? accent + '88' : '#e5e7eb'}` }} />
        ))}
      </div>
      <span style={{ fontSize: 12, fontWeight: won ? 700 : 500, color: won ? accent : 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
        {members.map((p) => typeof resolveHandleLikeLabel === 'function' ? resolveHandleLikeLabel(p.displayName || p.name || 'Player', p.userId || '') : String(p.displayName || p.name || 'Player')).join(' & ')}
        {won && <Trophy style={{ display: 'inline', width: 11, height: 11, marginLeft: 4, verticalAlign: 'middle', color: accent }} />}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RoundRobinPanel({
  activeLayerPageTheme, darkMode,
  eligibleRoundRobinEvents, layerRoundRobins,
  manualRoundRobinRosterInput, useManualRoundRobinRoster, selectedRoundRobinEventId,
  roundRobinError,
  setSelectedRoundRobinEventId, setManualRoundRobinRosterInput,
  setUseManualRoundRobinRoster, setRoundRobinError, setShowRoundRobinPanel,
  startRoundRobinTournament, resetRoundRobinTournament,
  updateRoundRobinMatchScore, finalizeRoundRobinMatch,
  formatDateKeyMMDDYYYY, formatTime, resolveHandleLikeLabel,
}) {
  const [activeTab, setActiveTab] = useState('schedule');
  const [teamsOf, setTeamsOf] = useState(2);
  const [expandedRounds, setExpandedRounds] = useState({});

  const accent = activeLayerPageTheme?.accent || '#7c3aed';
  const isLightColor = (hex) => {
    const h = (hex || '#000').replace('#', '');
    return (0.2126 * parseInt(h.slice(0,2),16) + 0.7152 * parseInt(h.slice(2,4),16) + 0.0722 * parseInt(h.slice(4,6),16)) / 255 > 0.72;
  };
  const btnStyle = { backgroundColor: accent, color: isLightColor(accent) ? '#111' : '#fff', boxShadow: `0 4px 14px ${accent}40` };
  const softBg = darkMode ? `${accent}1a` : `${accent}0f`;
  const border = `${accent}33`;

  const tid = useManualRoundRobinRoster ? '__manual__' : String(selectedRoundRobinEventId || '');
  const tournament = tid ? layerRoundRobins?.[tid] : null;
  const standings = useMemo(() => tournament ? deriveStandings(tournament.participants, tournament.rounds) : [], [tournament]);
  const allMatches = useMemo(() => (tournament?.rounds || []).flatMap((r) => r.matches || []), [tournament]);
  const doneCount = allMatches.filter((m) => m.completed).length;
  const totalCount = allMatches.length;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const firstIncomplete = (tournament?.rounds || []).find((r) => r.matches.some((m) => !m.completed));
  const toggleRound = (idx) => setExpandedRounds((p) => ({ ...p, [idx]: p[idx] === undefined ? false : !p[idx] }));
  const isExpanded = (round) => expandedRounds[round.index] === undefined ? firstIncomplete?.index === round.index : expandedRounds[round.index];

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (!tournament) return (
    <div className="glass-panel rounded-2xl p-5 mb-6" style={{ borderColor: border, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div style={{ width: 32, height: 32, borderRadius: 10, background: softBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏓</div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Round Robin</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-10">Every team plays every other team</p>
        </div>
        <button onClick={() => setShowRoundRobinPanel(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Format */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-0.5">Format</div>
        <div className="grid grid-cols-2 gap-2">
          {[{ v: 2, label: 'Doubles', sub: '2 vs 2', icon: '👥' }, { v: 1, label: 'Singles', sub: '1 vs 1', icon: '🧍' }].map(({ v, label, sub, icon }) => (
            <button key={v} onClick={() => setTeamsOf(v)}
              className="rounded-xl p-3 text-left transition-all border"
              style={teamsOf === v ? { ...btnStyle, borderColor: 'transparent', boxShadow: `0 4px 16px ${accent}35` } : { background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: border }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: teamsOf === v ? (isLightColor(accent) ? '#111' : '#fff') : 'var(--color-text-primary)' }}>{label}</div>
              <div style={{ fontSize: 11, color: teamsOf === v ? (isLightColor(accent) ? '#33333399' : '#ffffff99') : 'var(--color-text-secondary)' }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Roster source */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-0.5">Roster</div>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: border }}>
          {[{ v: true, label: 'Manual' }, { v: false, label: 'From Event' }].map(({ v, label }) => (
            <button key={String(v)} onClick={() => { setUseManualRoundRobinRoster(v); setRoundRobinError(''); }}
              className="flex-1 px-3 py-2 text-xs font-semibold transition-all"
              style={useManualRoundRobinRoster === v ? btnStyle : { background: 'transparent', color: 'var(--color-text-secondary)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Manual roster */}
      {useManualRoundRobinRoster && (
        <div className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: border }}>
          <div className="px-3 pt-3 pb-1">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
              {teamsOf === 2 ? 'Players — consecutive pairs become teams' : 'Players — one per line'}
            </div>
            <textarea rows={teamsOf === 2 ? 8 : 6} value={manualRoundRobinRosterInput}
              onChange={(e) => { setManualRoundRobinRosterInput(e.target.value); setRoundRobinError(''); }}
              placeholder={teamsOf === 2 ? 'Alex\nJordan\nCasey\nRiley\nTaylor\nMorgan' : 'Alex\nJordan\nCasey\nRiley'}
              className="w-full bg-transparent text-sm dark:text-white resize-none focus:outline-none font-mono"
              style={{ fontSize: '16px', lineHeight: 1.7 }} />
          </div>
          {teamsOf === 2 && (
            <div className="px-3 py-2 border-t" style={{ borderColor: border, background: softBg }}>
              {(() => {
                const names = manualRoundRobinRosterInput.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                const teams = [];
                for (let i = 0; i + 1 < names.length; i += 2) teams.push([names[i], names[i+1]]);
                if (teams.length === 0) return <span className="text-[11px] text-gray-400">Enter names above to preview teams</span>;
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {teams.map((team, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: `${accent}20`, color: accent }}>
                        {team[0]} & {team[1]}
                      </span>
                    ))}
                    {names.length % 2 !== 0 && <span className="text-[11px] text-amber-500">{names[names.length-1]} needs a partner</span>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Event picker */}
      {!useManualRoundRobinRoster && (
        <div className="mb-4 space-y-2">
          {(eligibleRoundRobinEvents || []).length === 0 ? (
            <div className="rounded-xl border px-4 py-6 text-center" style={{ borderColor: border, background: softBg }}>
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">No pop-up events with enough signups</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Need at least {teamsOf * 2} players signed up</div>
            </div>
          ) : (
            (eligibleRoundRobinEvents || []).map((entry) => {
              const sel = String(entry.eventId) === String(selectedRoundRobinEventId);
              return (
                <button key={entry.eventId} onClick={() => { setSelectedRoundRobinEventId(entry.eventId); setRoundRobinError(''); }}
                  className="w-full text-left rounded-xl border px-4 py-3 transition-all"
                  style={sel ? { ...btnStyle, borderColor: 'transparent' } : { borderColor: border, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                  <div className="font-semibold text-sm truncate" style={{ color: sel ? (isLightColor(accent) ? '#111' : '#fff') : 'var(--color-text-primary)' }}>{entry.event?.title || 'Event'}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: sel ? (isLightColor(accent) ? '#33333388' : '#ffffff88') : 'var(--color-text-secondary)' }}>
                    {formatDateKeyMMDDYYYY?.(entry.event?.date || '') || entry.event?.date || ''}
                    {entry.event?.time ? ` · ${formatTime?.(entry.event.time) || entry.event.time}` : ''}
                    {` · ${entry.signupCount} players`}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {roundRobinError && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          {roundRobinError}
        </div>
      )}

      <button onClick={() => startRoundRobinTournament(tid, false, teamsOf)}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
        style={btnStyle}>
        Generate Schedule
      </button>
    </div>
  );

  // ── Active tournament ──────────────────────────────────────────────────────
  const teamCount = Math.floor(tournament.participants.length / (tournament.teamsOf || 2));

  return (
    <div className="glass-panel rounded-2xl mb-6 overflow-hidden" style={{ border: `1px solid ${border}` }}>

      {/* Header band */}
      <div className="px-5 pt-5 pb-4" style={{ background: softBg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: `0 4px 12px ${accent}50` }}>🏓</div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">Round Robin</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${accent}22`, color: accent }}>
                  {tournament.teamsOf === 2 ? 'Doubles' : 'Singles'}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {teamCount} teams · {(tournament.rounds || []).length} rounds
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowRoundRobinPanel(false)} className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-gray-500 dark:text-gray-400">{doneCount} of {totalCount} matches complete</span>
            {allDone && <span className="font-bold flex items-center gap-1" style={{ color: accent }}><CheckCircle className="w-3 h-3" /> Finished</span>}
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${accent}25` }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%', background: accent }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: border }}>
        {[{ id: 'schedule', label: 'Schedule' }, { id: 'standings', label: 'Standings' }].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 py-3 text-xs font-bold transition-all relative"
            style={{ color: activeTab === id ? accent : 'var(--color-text-secondary)' }}>
            {label}
            {activeTab === id && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: accent }} />}
          </button>
        ))}
      </div>

      {/* Schedule tab */}
      {activeTab === 'schedule' && (
        <div className="p-3 space-y-2 max-h-[65vh] overflow-y-auto">
          {(tournament.rounds || []).map((round) => {
            const roundDone = round.matches.every((m) => m.completed);
            const roundDoneCount = round.matches.filter((m) => m.completed).length;
            const isCurrent = firstIncomplete?.index === round.index;
            const expanded = isExpanded(round);

            return (
              <div key={round.index} className="rounded-xl overflow-hidden border transition-all"
                style={{ borderColor: isCurrent ? `${accent}55` : border, background: isCurrent ? softBg : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') }}>

                {/* Round header */}
                <button onClick={() => toggleRound(round.index)}
                  className="w-full flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: roundDone ? `${accent}22` : (isCurrent ? `${accent}30` : 'rgba(0,0,0,0.06)'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {roundDone
                        ? <CheckCircle style={{ width: 14, height: 14, color: accent }} />
                        : <span style={{ fontSize: 11, fontWeight: 800, color: isCurrent ? accent : '#9ca3af' }}>{round.index + 1}</span>}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-100">Round {round.index + 1}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{roundDoneCount}/{round.matches.length} matches</div>
                    </div>
                    {isCurrent && !roundDone && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${accent}22`, color: accent }}>Now playing</span>
                    )}
                  </div>
                  {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>

                {/* Match cards */}
                {expanded && (
                  <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: border }}>
                    <div className="pt-2" />
                    {round.matches.map((match) => {
                      const aWon = match.completed && parseInt(match.scoreA) > parseInt(match.scoreB);
                      const bWon = match.completed && parseInt(match.scoreB) > parseInt(match.scoreA);
                      return (
                        <div key={match.id} className="rounded-xl border overflow-hidden transition-all"
                          style={{ borderColor: match.completed ? `${accent}33` : border, background: match.completed ? (darkMode ? `${accent}14` : `${accent}08`) : (darkMode ? 'rgba(255,255,255,0.04)' : '#fff') }}>
                          <div className="px-3 py-2.5 flex items-center gap-2">
                            {/* Team A */}
                            <div className="flex-1 min-w-0">
                              <TeamPill team={match.teamA} accent={accent} resolveHandleLikeLabel={resolveHandleLikeLabel} won={aWon} />
                            </div>

                            {/* Score */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input type="number" min="0" max="99" value={match.scoreA}
                                onChange={(e) => updateRoundRobinMatchScore(tid, round.index, match.id, 'scoreA', e.target.value)}
                                disabled={match.completed}
                                className="w-11 h-9 text-center text-base font-bold rounded-lg border bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-default focus:outline-none focus:ring-2"
                                style={{ borderColor: border, fontSize: '16px', fontVariantNumeric: 'tabular-nums' }} />
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                              </div>
                              <input type="number" min="0" max="99" value={match.scoreB}
                                onChange={(e) => updateRoundRobinMatchScore(tid, round.index, match.id, 'scoreB', e.target.value)}
                                disabled={match.completed}
                                className="w-11 h-9 text-center text-base font-bold rounded-lg border bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-default focus:outline-none focus:ring-2"
                                style={{ borderColor: border, fontSize: '16px', fontVariantNumeric: 'tabular-nums' }} />
                            </div>

                            {/* Team B */}
                            <div className="flex-1 min-w-0 flex justify-end">
                              <TeamPill team={match.teamB} accent={accent} resolveHandleLikeLabel={resolveHandleLikeLabel} won={bWon} />
                            </div>

                            {/* Confirm */}
                            <button onClick={() => { if (!match.completed) finalizeRoundRobinMatch(tid, round.index, match.id); }}
                              disabled={match.completed}
                              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:cursor-default"
                              style={match.completed ? { background: `${accent}20` } : { background: 'rgba(0,0,0,0.05)' }}
                              title={match.completed ? 'Confirmed' : 'Confirm result'}>
                              {match.completed
                                ? <CheckCircle style={{ width: 16, height: 16, color: accent }} />
                                : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #d1d5db' }} />}
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

      {/* Standings tab */}
      {activeTab === 'standings' && (
        <div className="p-3">
          {standings.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">Play some matches to see standings</div>
          ) : (
            <div className="space-y-1.5">
              {standings.map((row, idx) => {
                const isWinner = allDone && idx === 0 && row.wins > 0;
                const diff = row.pointsFor - row.pointsAgainst;
                return (
                  <div key={row.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
                    style={{ borderColor: isWinner ? `${accent}44` : border, background: isWinner ? softBg : 'transparent' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: isWinner ? accent : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isWinner
                        ? <span style={{ fontSize: 13 }}>🏆</span>
                        : <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af' }}>{idx + 1}</span>}
                    </div>
                    <Avatar name={row.displayName} size={28} accent={isWinner ? accent : '#9ca3af'} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: isWinner ? accent : 'var(--color-text-primary)' }}>{row.displayName}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{row.played} played</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px] font-bold">
                      <span style={{ color: '#10b981' }}>{row.wins}W</span>
                      <span style={{ color: '#f43f5e' }}>{row.losses}L</span>
                      <span style={{ color: diff > 0 ? '#10b981' : diff < 0 ? '#f43f5e' : '#9ca3af', minWidth: 28, textAlign: 'right' }}>{diff > 0 ? '+' : ''}{diff}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: border }}>
        <button onClick={() => resetRoundRobinTournament(tid)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        {roundRobinError && <span className="text-[11px] text-red-500">{roundRobinError}</span>}
      </div>
    </div>
  );
}
