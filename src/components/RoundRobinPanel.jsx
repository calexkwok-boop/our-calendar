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
  return Object.values(stats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diff = (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
    return diff !== 0 ? diff : b.pointsFor - a.pointsFor;
  });
};

const initials = (name) => {
  const parts = String(name || '?').trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : String(name || '?')[0].toUpperCase();
};

const getNames = (team, fn) => {
  if (!team || team.isBye) return ['Bye'];
  return (team.members || []).map((p) =>
    typeof fn === 'function' ? fn(p.displayName || p.name || 'Player', p.userId || '') : String(p.displayName || p.name || 'Player')
  );
};

// Pickleball court SVG as a tiny decorative element
const CourtDot = ({ accent }) => (
  <svg width="22" height="14" viewBox="0 0 22 14" fill="none" style={{ opacity: 0.85 }}>
    {/* Court outline */}
    <rect x="0.75" y="0.75" width="20.5" height="12.5" rx="1" stroke={accent} strokeWidth="1"/>
    {/* Kitchen zones (NVZ) — shaded */}
    <rect x="0.75" y="0.75" width="6.5" height="12.5" fill={accent} fillOpacity="0.18"/>
    <rect x="14.75" y="0.75" width="6.5" height="12.5" fill={accent} fillOpacity="0.18"/>
    {/* Kitchen lines */}
    <line x1="7.25" y1="0.75" x2="7.25" y2="13.25" stroke={accent} strokeWidth="0.9"/>
    <line x1="14.75" y1="0.75" x2="14.75" y2="13.25" stroke={accent} strokeWidth="0.9"/>
    {/* Net (center) */}
    <line x1="11" y1="0.75" x2="11" y2="13.25" stroke={accent} strokeWidth="1.4"/>
    {/* Center line on each side */}
    <line x1="7.25" y1="7" x2="14.75" y2="7" stroke={accent} strokeWidth="0.7"/>
  </svg>
);

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

  const accent = activeLayerPageTheme?.accent || '#16a34a';
  const isLight = (hex) => {
    const h = (hex || '#000').replace('#', '');
    return (0.2126 * parseInt(h.slice(0,2),16) + 0.7152 * parseInt(h.slice(2,4),16) + 0.0722 * parseInt(h.slice(4,6),16)) / 255 > 0.72;
  };
  const btnFg = isLight(accent) ? '#111827' : '#fff';
  const btnStyle = { backgroundColor: accent, color: btnFg };
  const softBg = darkMode ? `${accent}18` : `${accent}0d`;
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#fff';
  const border = `${accent}30`;

  const tid = useManualRoundRobinRoster ? '__manual__' : String(selectedRoundRobinEventId || '');
  const tournament = tid ? layerRoundRobins?.[tid] : null;
  const standings = useMemo(() => tournament ? deriveStandings(tournament.participants, tournament.rounds) : [], [tournament]);
  const allMatches = useMemo(() => (tournament?.rounds || []).flatMap((r) => r.matches || []), [tournament]);
  const doneCount = allMatches.filter((m) => m.completed).length;
  const totalCount = allMatches.length;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const firstIncomplete = (tournament?.rounds || []).find((r) => r.matches.some((m) => !m.completed));
  const isExpanded = (round) => expandedRounds[round.index] === undefined ? firstIncomplete?.index === round.index : expandedRounds[round.index];
  const toggleRound = (idx) => setExpandedRounds((p) => ({ ...p, [idx]: p[idx] === undefined ? false : !p[idx] }));

  // ── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (!tournament) return (
    <div className="rounded-2xl mb-6 overflow-hidden glass-panel" style={{ border: `1.5px solid ${border}` }}>

      {/* Court-stripe header */}
      <div className="relative px-5 pt-5 pb-4 overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)` }}>
        {/* Decorative court lines */}
        <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.12 }}>
         <svg width="80" height="52" viewBox="0 0 80 52" fill="none">
  <rect x="1" y="1" width="78" height="50" rx="3" stroke={accent} strokeWidth="2"/>
  <rect x="1" y="1" width="23" height="50" fill={accent} fillOpacity="0.2"/>
  <rect x="56" y="1" width="23" height="50" fill={accent} fillOpacity="0.2"/>
  <line x1="24" y1="1" x2="24" y2="51" stroke={accent} strokeWidth="1.5"/>
  <line x1="56" y1="1" x2="56" y2="51" stroke={accent} strokeWidth="1.5"/>
  <line x1="40" y1="1" x2="40" y2="51" stroke={accent} strokeWidth="2"/>
  <line x1="24" y1="26" x2="56" y2="26" stroke={accent} strokeWidth="1"/>
</svg>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ fontSize: 22 }}>🥒</span>
              <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-50">Round Robin</h3>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Every team plays every other team · most wins wins</p>
          </div>
         <button
  onClick={(e) => { e.stopPropagation(); setShowRoundRobinPanel(false); }}
  style={{ position: 'absolute', top: 18, right: 16, zIndex: 10, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}
>
  <X className="w-4 h-4 text-gray-800 dark:text-gray-100" />
</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Format cards */}
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2">Game Format</div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { v: 2, emoji: '👥', label: 'Doubles', sub: '2 vs 2', hint: 'Most popular' },
              { v: 1, emoji: '🏃', label: 'Singles', sub: '1 vs 1', hint: 'Head to head' },
            ].map(({ v, emoji, label, sub, hint }) => {
              const sel = teamsOf === v;
              return (
                <button key={v} onClick={() => setTeamsOf(v)}
                  className="relative rounded-2xl p-3.5 text-left transition-all active:scale-[0.97] overflow-hidden"
                  style={sel
                    ? { ...btnStyle, boxShadow: `0 6px 20px ${accent}40` }
                    : { background: cardBg, border: `1.5px solid ${border}` }}>
                  {sel && <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />}
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: sel ? btnFg : 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{label}</div>
                  <div style={{ fontSize: 11, color: sel ? (isLight(accent) ? '#33333388' : 'rgba(255,255,255,0.7)') : 'var(--color-text-secondary)', marginTop: 1 }}>{sub}</div>
                  {sel && <div style={{ marginTop: 6, display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '1px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.25)', color: btnFg }}>{hint}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Roster source */}
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2">Roster Source</div>
          <div className="flex rounded-2xl overflow-hidden p-0.5" style={{ background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
            {[{ v: true, label: '✏️  Manual' }, { v: false, label: '📋  From Event' }].map(({ v, label }) => (
              <button key={String(v)} onClick={() => { setUseManualRoundRobinRoster(v); setRoundRobinError(''); }}
                className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
                style={useManualRoundRobinRoster === v
                  ? { background: cardBg, color: accent, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                  : { background: 'transparent', color: 'var(--color-text-secondary)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Manual roster */}
        {useManualRoundRobinRoster && (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${border}` }}>
            <div className="px-4 pt-3 pb-2" style={{ background: cardBg }}>
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500 mb-2">
                {teamsOf === 2 ? 'Players — pairs of lines become teams' : 'Players — one per line'}
              </div>
              <textarea rows={teamsOf === 2 ? 8 : 5} value={manualRoundRobinRosterInput}
                onChange={(e) => { setManualRoundRobinRosterInput(e.target.value); setRoundRobinError(''); }}
                placeholder={teamsOf === 2 ? 'Alex\nJordan\nCasey\nRiley\nTaylor\nMorgan' : 'Alex\nJordan\nCasey\nRiley'}
                className="w-full bg-transparent text-sm dark:text-white resize-none focus:outline-none"
                style={{ fontSize: '16px', lineHeight: 1.8, fontFamily: 'ui-monospace, monospace' }} />
            </div>
            {/* Live team preview */}
            {teamsOf === 2 && (() => {
              const names = manualRoundRobinRosterInput.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
              const teams = [];
              for (let i = 0; i + 1 < names.length; i += 2) teams.push([names[i], names[i+1]]);
              if (teams.length === 0) return null;
              return (
                <div className="px-4 py-2.5 border-t" style={{ borderColor: border, background: softBg }}>
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] mb-2" style={{ color: accent }}>
                    {teams.length} team{teams.length !== 1 ? 's' : ''} · {teams.length * (teams.length - 1) / 2} match{teams.length * (teams.length - 1) / 2 !== 1 ? 'es' : ''}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {teams.map((team, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold"
                        style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}>
                        <span style={{ opacity: 0.7 }}>{initials(team[0])}</span>
                        <span style={{ opacity: 0.4 }}>+</span>
                        <span style={{ opacity: 0.7 }}>{initials(team[1])}</span>
                        <span className="font-medium" style={{ opacity: 0.8 }}>{team[0]} & {team[1]}</span>
                      </span>
                    ))}
                    {names.length % 2 !== 0 && (
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        ⚠️ {names[names.length - 1]} needs a partner
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Event picker */}
        {!useManualRoundRobinRoster && (
          <div className="space-y-2">
            {(eligibleRoundRobinEvents || []).length === 0 ? (
              <div className="rounded-2xl border px-4 py-8 text-center" style={{ borderColor: border, background: softBg }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏓</div>
                <div className="text-sm font-bold text-gray-500 dark:text-gray-400">No eligible events yet</div>
                <div className="text-xs text-gray-400 mt-1">Need at least {teamsOf * 2} players signed up</div>
              </div>
            ) : (
              (eligibleRoundRobinEvents || []).map((entry) => {
                const sel = String(entry.eventId) === String(selectedRoundRobinEventId);
                return (
                  <button key={entry.eventId} onClick={() => { setSelectedRoundRobinEventId(entry.eventId); setRoundRobinError(''); }}
                    className="w-full text-left rounded-2xl px-4 py-3 transition-all active:scale-[0.98]"
                    style={sel ? { ...btnStyle, boxShadow: `0 4px 16px ${accent}35` } : { background: cardBg, border: `1.5px solid ${border}` }}>
                    <div className="font-bold text-sm truncate" style={{ color: sel ? btnFg : 'var(--color-text-primary)' }}>{entry.event?.title || 'Event'}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: sel ? (isLight(accent) ? '#33333388' : 'rgba(255,255,255,0.7)') : 'var(--color-text-secondary)' }}>
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
          <div className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50">
            {roundRobinError}
          </div>
        )}

        <button onClick={() => startRoundRobinTournament(tid, false, teamsOf)}
          className="w-full py-3.5 rounded-2xl text-sm font-black tracking-wide transition-all active:scale-[0.98]"
          style={{ ...btnStyle, boxShadow: `0 6px 20px ${accent}40`, letterSpacing: '0.04em' }}>
          🎾 Generate Schedule
        </button>
      </div>
    </div>
  );

  // ── ACTIVE TOURNAMENT ──────────────────────────────────────────────────────
  const teamCount = Math.floor(tournament.participants.length / (tournament.teamsOf || 2));
  const roundCount = (tournament.rounds || []).length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-2xl mb-6 overflow-hidden glass-panel" style={{ border: `1.5px solid ${border}` }}>

      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` }}>
        {/* Court decoration */}
        <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', opacity: 0.15 }}>
         <svg width="100" height="65" viewBox="0 0 100 65" fill="none">
  {/* Court outline */}
  <rect x="1" y="1" width="98" height="63" rx="3" stroke="white" strokeWidth="2"/>
  {/* Kitchen zones shaded */}
  <rect x="1" y="1" width="29" height="63" fill="white" fillOpacity="0.12"/>
  <rect x="70" y="1" width="29" height="63" fill="white" fillOpacity="0.12"/>
  {/* Kitchen lines */}
  <line x1="30" y1="1" x2="30" y2="64" stroke="white" strokeWidth="1.5"/>
  <line x1="70" y1="1" x2="70" y2="64" stroke="white" strokeWidth="1.5"/>
  {/* Net */}
  <line x1="50" y1="1" x2="50" y2="64" stroke="white" strokeWidth="2.5"/>
  {/* Center line between kitchen and net */}
  <line x1="30" y1="32" x2="70" y2="32" stroke="white" strokeWidth="1.2"/>
</svg>
        </div>

        <div className="px-5 pt-4 pb-3 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 20 }}>🥒</span>
              <span className="text-lg font-black text-white tracking-tight">Round Robin</span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wide bg-white/25 text-white">
                {tournament.teamsOf === 2 ? 'DOUBLES' : 'SINGLES'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-white/75 text-[11px] font-semibold">
              <span>{teamCount} teams</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{roundCount} rounds</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{doneCount}/{totalCount} played</span>
            </div>
          </div>
         <button
  onClick={(e) => { e.stopPropagation(); setShowRoundRobinPanel(false); }}
  style={{ position: 'absolute', top: 18, right: 16, zIndex: 10, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}
>
  <X className="w-4 h-4 text-gray-800 dark:text-gray-100" />
</button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-4">
          <div className="h-2 rounded-full overflow-hidden bg-white/20">
            <div className="h-full rounded-full transition-all duration-700 bg-white" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] font-bold text-white/60">{pct}% complete</span>
            {allDone && <span className="text-[10px] font-black text-white flex items-center gap-1"><CheckCircle className="w-3 h-3" /> FINISHED</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: border, background: softBg }}>
        {[{ id: 'schedule', label: '📅 Schedule' }, { id: 'standings', label: '🏆 Standings' }].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex-1 py-3 text-xs font-black transition-all relative"
            style={{ color: activeTab === id ? accent : 'var(--color-text-secondary)' }}>
            {label}
            {activeTab === id && <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: accent }} />}
          </button>
        ))}
      </div>

      {/* Schedule */}
      {activeTab === 'schedule' && (
        <div className="p-3 space-y-2 max-h-[65vh] overflow-y-auto">
          {(tournament.rounds || []).map((round) => {
            const roundDone = round.matches.every((m) => m.completed);
            const doneInRound = round.matches.filter((m) => m.completed).length;
            const isCurrent = firstIncomplete?.index === round.index;
            const expanded = isExpanded(round);

            return (
              <div key={round.index} className="rounded-2xl overflow-hidden transition-all"
                style={{ border: `1.5px solid ${isCurrent ? accent + '66' : border}`, background: isCurrent ? softBg : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)') }}>

                <button onClick={() => toggleRound(round.index)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  {/* Round badge */}
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: roundDone ? `${accent}22` : isCurrent ? accent : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }}>
                    {roundDone
                      ? <CheckCircle style={{ width: 16, height: 16, color: accent }} />
                      : <span style={{ fontSize: 13, fontWeight: 900, color: isCurrent ? btnFg : '#9ca3af' }}>{round.index + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-gray-800 dark:text-gray-100">Round {round.index + 1}</span>
                      {isCurrent && !roundDone && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase"
                          style={{ background: accent, color: btnFg }}>Now Playing</span>
                      )}
                      {roundDone && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase"
                          style={{ background: `${accent}18`, color: accent }}>Done</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                      {doneInRound}/{round.matches.length} matches · {round.matches.length} court{round.matches.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <CourtDot accent={isCurrent ? accent : '#9ca3af'} />
                  {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                </button>

                {/* Match cards */}
                {expanded && (
                  <div className="px-3 pb-3 space-y-2 border-t pt-3" style={{ borderColor: border }}>
                    {round.matches.map((match, mi) => {
                      const namesA = getNames(match.teamA, resolveHandleLikeLabel);
                      const namesB = getNames(match.teamB, resolveHandleLikeLabel);
                      const aWon = match.completed && parseInt(match.scoreA) > parseInt(match.scoreB);
                      const bWon = match.completed && parseInt(match.scoreB) > parseInt(match.scoreA);

                      return (
                        <div key={match.id} className="rounded-xl overflow-hidden transition-all"
                          style={{ border: `1.5px solid ${match.completed ? accent + '44' : border}`, background: match.completed ? (darkMode ? `${accent}18` : `${accent}08`) : cardBg }}>

                          {/* Court label */}
                          <div className="flex items-center justify-between px-3 pt-2 pb-1">
                            <div className="flex items-center gap-1.5">
                              <CourtDot accent={match.completed ? accent : '#9ca3af'} />
                              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: match.completed ? accent : '#9ca3af' }}>
                                Court {mi + 1}
                              </span>
                            </div>
                            <button onClick={() => { if (!match.completed) finalizeRoundRobinMatch(tid, round.index, match.id); }}
                              disabled={match.completed}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all disabled:cursor-default"
                              style={match.completed
                                ? { background: `${accent}20`, color: accent }
                                : { background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: 'var(--color-text-secondary)' }}>
                              {match.completed ? <><CheckCircle className="w-3 h-3" /> Confirmed</> : <>Confirm</>}
                            </button>
                          </div>

                          {/* Teams + scores */}
                          <div className="px-3 pb-3 flex items-center gap-2">
                            {/* Team A */}
                            <div className="flex-1 min-w-0">
                              {namesA.map((name, i) => (
                                <div key={i} className="text-xs font-bold truncate flex items-center gap-1"
                                  style={{ color: aWon ? accent : 'var(--color-text-primary)' }}>
                                  {aWon && i === 0 && <Trophy className="w-3 h-3 shrink-0" />}
                                  {name}
                                </div>
                              ))}
                            </div>

                            {/* Score inputs */}
                            <div className="flex items-center gap-2 shrink-0">
                              <input type="number" min="0" max="99" value={match.scoreA}
                                onChange={(e) => updateRoundRobinMatchScore(tid, round.index, match.id, 'scoreA', e.target.value)}
                                disabled={match.completed}
                                className="w-12 h-10 text-center font-black text-base rounded-xl border bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-default focus:outline-none focus:ring-2"
                                style={{ borderColor: aWon ? accent : border, color: aWon ? accent : 'inherit', fontSize: '18px', fontVariantNumeric: 'tabular-nums',
                                  boxShadow: aWon ? `0 0 0 2px ${accent}33` : 'none' }} />
                              <span className="text-gray-300 dark:text-gray-600 font-black text-sm">—</span>
                              <input type="number" min="0" max="99" value={match.scoreB}
                                onChange={(e) => updateRoundRobinMatchScore(tid, round.index, match.id, 'scoreB', e.target.value)}
                                disabled={match.completed}
                                className="w-12 h-10 text-center font-black text-base rounded-xl border bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-default focus:outline-none focus:ring-2"
                                style={{ borderColor: bWon ? accent : border, color: bWon ? accent : 'inherit', fontSize: '18px', fontVariantNumeric: 'tabular-nums',
                                  boxShadow: bWon ? `0 0 0 2px ${accent}33` : 'none' }} />
                            </div>

                            {/* Team B */}
                            <div className="flex-1 min-w-0 text-right">
                              {namesB.map((name, i) => (
                                <div key={i} className="text-xs font-bold truncate flex items-center justify-end gap-1"
                                  style={{ color: bWon ? accent : 'var(--color-text-primary)' }}>
                                  {name}
                                  {bWon && i === 0 && <Trophy className="w-3 h-3 shrink-0" />}
                                </div>
                              ))}
                            </div>
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

      {/* Standings */}
      {activeTab === 'standings' && (
        <div className="p-3 space-y-2">
          {standings.length === 0 ? (
            <div className="py-10 text-center">
              <div style={{ fontSize: 36, marginBottom: 8 }}>🥒</div>
              <div className="text-sm font-bold text-gray-400">Play some matches to see standings</div>
            </div>
          ) : (
            standings.map((row, idx) => {
              const isWinner = allDone && idx === 0 && row.wins > 0;
              const diff = row.pointsFor - row.pointsAgainst;
              return (
                <div key={row.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all"
                  style={{
                    border: `1.5px solid ${isWinner ? accent + '55' : border}`,
                    background: isWinner ? `linear-gradient(135deg, ${accent}18, ${accent}08)` : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'),
                  }}>
                  {/* Rank */}
                  <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isWinner ? accent : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') }}>
                    {isWinner
                      ? <span style={{ fontSize: 14 }}>🏆</span>
                      : <span style={{ fontSize: 12, fontWeight: 900, color: '#9ca3af' }}>{idx + 1}</span>}
                  </div>
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 900, background: isWinner ? `${accent}25` : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    color: isWinner ? accent : '#9ca3af', border: `1.5px solid ${isWinner ? accent + '44' : 'transparent'}` }}>
                    {initials(row.displayName)}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black truncate" style={{ color: isWinner ? accent : 'var(--color-text-primary)' }}>{row.displayName}</div>
                    <div className="text-[10px] font-semibold text-gray-400">{row.played} played</div>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div className="text-sm font-black text-emerald-500">{row.wins}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">W</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-black text-rose-400">{row.losses}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">L</div>
                    </div>
                    <div className="text-center min-w-[32px]">
                      <div className={`text-sm font-black ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-400' : 'text-gray-400'}`}>{diff > 0 ? '+' : ''}{diff}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">+/-</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: border, background: softBg }}>
        <button onClick={() => resetRoundRobinTournament(tid)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> New Tournament
        </button>
        {roundRobinError && <span className="text-[11px] font-semibold text-red-500">{roundRobinError}</span>}
      </div>
    </div>
  );
}
