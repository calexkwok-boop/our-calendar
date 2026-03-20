import React, { useEffect, useState, useMemo } from 'react';
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

// Pickleball court SVG as a tiny decorative element
const CourtDot = ({ accent }) => (
  <svg width="18" height="12" viewBox="0 0 18 12" fill="none" style={{ opacity: 0.7 }}>
    <rect x="1" y="1" width="16" height="10" rx="1" stroke={accent} strokeWidth="1"/>
    <line x1="9" y1="1" x2="9" y2="11" stroke={accent} strokeWidth="0.8"/>
    <line x1="1" y1="6" x2="17" y2="6" stroke={accent} strokeWidth="0.8"/>
    <line x1="3" y1="1" x2="3" y2="11" stroke={accent} strokeWidth="0.5" strokeDasharray="1.5 1"/>
    <line x1="15" y1="1" x2="15" y2="11" stroke={accent} strokeWidth="0.5" strokeDasharray="1.5 1"/>
  </svg>
);

const getParticipantPhotoUrl = (participant) => String(
  participant?.photoUrl
  || participant?.photo_url
  || participant?.avatarUrl
  || participant?.avatar_url
  || ''
).trim();

const CelebrationConfetti = ({ accent }) => {
  const pieces = Array.from({ length: 18 }, (_, idx) => ({
    id: idx,
    left: `${4 + ((idx * 11) % 92)}%`,
    delay: `${(idx % 6) * 0.12}s`,
    duration: `${3 + (idx % 4) * 0.35}s`,
    background: idx % 3 === 0 ? accent : idx % 3 === 1 ? '#f59e0b' : '#fb7185',
    rotate: `${(idx % 2 === 0 ? 1 : -1) * (16 + idx * 5)}deg`,
  }));
  return (
    <>
      <style>{`
        @keyframes rr-confetti-fall {
          0% { transform: translate3d(0,-18px,0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(0,150px,0) rotate(220deg); opacity: 0; }
        }
        @keyframes rr-podium-pop {
          0% { transform: translateY(12px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
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
              boxShadow: '0 4px 10px rgba(15,23,42,0.12)',
            }}
          />
        ))}
      </div>
    </>
  );
};

const PodiumAvatar = ({ participant, label, accent }) => {
  const photoUrl = getParticipantPhotoUrl(participant);
  if (photoUrl) {
    return <img src={photoUrl} alt={label} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}33` }} />;
  }
  return (
    <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, background: `${accent}20`, color: accent, border: `2px solid ${accent}33` }}>
      {initials(label)}
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

  const accent = activeLayerPageTheme?.accent || '#16a34a';
  const isLight = (hex) => {
    const h = (hex || '#000').replace('#', '');
    return (0.2126 * parseInt(h.slice(0,2),16) + 0.7152 * parseInt(h.slice(2,4),16) + 0.0722 * parseInt(h.slice(4,6),16)) / 255 > 0.72;
  };
  const btnFg = isLight(accent) ? '#111827' : '#fff';
  const btnStyle = { backgroundColor: accent, color: btnFg };
  const softBg = darkMode ? `${accent}18` : `${accent}0d`;
  const cardBg = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border = darkMode ? `${accent}30` : 'rgba(15,23,42,0.09)';
  const shellBg = darkMode ? undefined : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)';
  const shellShadow = darkMode ? undefined : '0 24px 60px rgba(15,23,42,0.12)';
  const mutedBg = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.035)';
  const mutedChipBg = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
  const primaryText = darkMode ? '#f8fafc' : '#0f172a';
  const secondaryText = darkMode ? '#cbd5e1' : '#64748b';
  const buildSourceSignature = (participants) => (
    (Array.isArray(participants) ? participants : [])
      .map((participant, idx) => {
        const id = String(participant?.id || '').trim();
        const name = String(participant?.displayName || participant?.name || '').trim().toLowerCase();
        return `${idx}:${id}:${name}`;
      })
      .join('|')
  );

  const tid = useManualRoundRobinRoster ? '__manual__' : String(selectedRoundRobinEventId || '');
  const selectedEntry = !useManualRoundRobinRoster
    ? (eligibleRoundRobinEvents || []).find((item) => String(item?.eventId || '') === tid) || null
    : null;
  const tournamentRecord = tid ? layerRoundRobins?.[tid] : null;
  const liveSourceSignature = selectedEntry
    ? buildSourceSignature((selectedEntry.signups || []).map((signup, idx) => ({
        id: String(
          signup?.memberId
          || signup?.signupId
          || (signup?.userId && !signup?.manual ? signup.userId : '')
          || `guest-${idx + 1}-${String(signup?.displayName || 'player').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        ),
        displayName: String(signup?.displayName || `Player ${idx + 1}`),
      })))
    : '';
  const tournamentSignature = String(
    tournamentRecord?.sourceSignature
    || buildSourceSignature(tournamentRecord?.participants || [])
  ).trim();
  const tournamentIsStale = Boolean(
    !useManualRoundRobinRoster
    && tournamentRecord
    && liveSourceSignature
    && tournamentSignature
    && tournamentSignature !== liveSourceSignature
  );
  const tournament = tournamentIsStale ? null : tournamentRecord;
  const standings = useMemo(() => tournament ? deriveStandings(tournament.participants, tournament.rounds) : [], [tournament]);
  const allMatches = useMemo(() => (tournament?.rounds || []).flatMap((r) => r.matches || []), [tournament]);
  const doneCount = allMatches.filter((m) => m.completed).length;
  const totalCount = allMatches.length;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const podium = allDone ? standings.slice(0, 3) : [];
  const firstIncomplete = (tournament?.rounds || []).find((r) => r.matches.some((m) => !m.completed));
  const isExpanded = (round) => expandedRounds[round.index] === undefined ? firstIncomplete?.index === round.index : expandedRounds[round.index];
  const toggleRound = (idx) => setExpandedRounds((p) => ({ ...p, [idx]: p[idx] === undefined ? false : !p[idx] }));
  useEffect(() => {
    if (allDone) setActiveTab('standings');
  }, [allDone]);

  // ── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (!tournament) return (
    <div className="h-full max-h-full rounded-2xl sm:rounded-2xl mb-0 sm:mb-6 overflow-hidden glass-panel flex flex-col" style={{ border: `1.5px solid ${border}`, background: shellBg, boxShadow: shellShadow }}>

      {/* Court-stripe header */}
      <div className="relative px-5 pt-5 pb-4 overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)` }}>
        {/* Decorative court lines */}
        <div style={{ position: 'absolute', right: 22, top: '42%', transform: 'translateY(-50%)', opacity: 0.18, pointerEvents: 'none' }}>
          <svg width="90" height="58" viewBox="0 0 90 58" fill="none">
            <rect x="1" y="1" width="88" height="56" rx="3" stroke={accent} strokeWidth="2"/>
            <rect x="1" y="1" width="26" height="56" fill={accent} fillOpacity="0.16"/>
            <rect x="63" y="1" width="26" height="56" fill={accent} fillOpacity="0.16"/>
            <line x1="27" y1="1" x2="27" y2="57" stroke={accent} strokeWidth="1.5"/>
            <line x1="63" y1="1" x2="63" y2="57" stroke={accent} strokeWidth="1.5"/>
            <line x1="45" y1="1" x2="45" y2="57" stroke={accent} strokeWidth="2.5"/>
            <line x1="27" y1="29" x2="63" y2="29" stroke={accent} strokeWidth="1"/>
          </svg>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ fontSize: 22 }}>🥒</span>
              <h3 className="text-xl font-black tracking-tight" style={{ color: primaryText }}>Round Robin</h3>
            </div>
            <p className="text-xs font-medium" style={{ color: secondaryText }}>Every team plays every other team · most wins wins</p>
          </div>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRoundRobinPanel(false); }} className="relative z-10 p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" style={{ color: secondaryText }} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
        {/* Format cards */}
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.12em] mb-2" style={{ color: secondaryText }}>Game Format</div>
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
                  <div style={{ fontSize: 14, fontWeight: 800, color: sel ? btnFg : primaryText, letterSpacing: '-0.02em' }}>{label}</div>
                  <div style={{ fontSize: 11, color: sel ? (isLight(accent) ? '#33333388' : 'rgba(255,255,255,0.7)') : secondaryText, marginTop: 1 }}>{sub}</div>
                  {sel && <div style={{ marginTop: 6, display: 'inline-block', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '1px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.25)', color: btnFg }}>{hint}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Roster source */}
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.12em] mb-2" style={{ color: secondaryText }}>Roster Source</div>
          <div className="flex rounded-2xl overflow-hidden p-0.5" style={{ background: mutedBg }}>
            {[{ v: true, label: '✏️  Manual' }, { v: false, label: '📋  From Event' }].map(({ v, label }) => (
              <button key={String(v)} onClick={() => { setUseManualRoundRobinRoster(v); setRoundRobinError(''); }}
                className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
                style={useManualRoundRobinRoster === v
                  ? { background: cardBg, color: accent, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                  : { background: 'transparent', color: secondaryText }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Manual roster */}
        {useManualRoundRobinRoster && (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${border}` }}>
            <div className="px-4 pt-3 pb-2" style={{ background: cardBg }}>
              <div className="text-[10px] font-black uppercase tracking-[0.12em] mb-2" style={{ color: secondaryText }}>
                {teamsOf === 2 ? 'Players — pairs of lines become teams' : 'Players — one per line'}
              </div>
              <textarea rows={teamsOf === 2 ? 8 : 5} value={manualRoundRobinRosterInput}
                onChange={(e) => { setManualRoundRobinRosterInput(e.target.value); setRoundRobinError(''); }}
                placeholder={teamsOf === 2 ? 'Alex\nJordan\nCasey\nRiley\nTaylor\nMorgan' : 'Alex\nJordan\nCasey\nRiley'}
                className="w-full bg-transparent text-sm dark:text-white resize-none focus:outline-none"
                style={{ fontSize: '16px', lineHeight: 1.8, fontFamily: '"DM Sans", sans-serif' }} />
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
                <div className="text-sm font-bold" style={{ color: primaryText }}>No eligible events yet</div>
                <div className="text-xs mt-1" style={{ color: secondaryText }}>Need at least {teamsOf * 2} players signed up</div>
              </div>
            ) : (
              (eligibleRoundRobinEvents || []).map((entry) => {
                const sel = String(entry.eventId) === String(selectedRoundRobinEventId);
                return (
                  <button key={entry.eventId} onClick={() => { setSelectedRoundRobinEventId(entry.eventId); setRoundRobinError(''); }}
                    className="w-full text-left rounded-2xl px-4 py-3 transition-all active:scale-[0.98]"
                    style={sel ? { ...btnStyle, boxShadow: `0 4px 16px ${accent}35` } : { background: cardBg, border: `1.5px solid ${border}` }}>
                    <div className="font-bold text-sm truncate" style={{ color: sel ? btnFg : primaryText }}>{entry.event?.title || 'Event'}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: sel ? (isLight(accent) ? '#33333388' : 'rgba(255,255,255,0.7)') : secondaryText }}>
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
        {tournamentIsStale && (
          <div className="px-3 py-2 rounded-xl text-xs font-semibold border" style={{ borderColor: `${accent}33`, background: softBg, color: secondaryText }}>
            Roster changed. Generate a new schedule to match the current event players.
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
    <div className="h-full max-h-full rounded-2xl sm:rounded-2xl mb-0 sm:mb-6 overflow-hidden glass-panel flex flex-col" style={{ border: `1.5px solid ${border}`, background: shellBg, boxShadow: shellShadow }}>

      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` }}>
        {/* Court decoration */}
        <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', opacity: 0.22, pointerEvents: 'none' }}>
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
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRoundRobinPanel(false); }} className="relative z-10 p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors">
            <X className="w-4 h-4 text-white" />
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
            style={{ color: activeTab === id ? accent : secondaryText }}>
            {label}
            {activeTab === id && <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: accent }} />}
          </button>
        ))}
      </div>

      {/* Schedule */}
      {activeTab === 'schedule' && (
        <div className="p-3 space-y-2 flex-1 min-h-0 overflow-y-auto">
          {(tournament.rounds || []).map((round) => {
            const roundDone = round.matches.every((m) => m.completed);
            const doneInRound = round.matches.filter((m) => m.completed).length;
            const isCurrent = firstIncomplete?.index === round.index;
            const expanded = isExpanded(round);

            return (
              <div key={round.index} className="rounded-2xl overflow-hidden transition-all"
                style={{ border: `1.5px solid ${isCurrent ? accent + '66' : border}`, background: isCurrent ? softBg : mutedBg }}>

                <button onClick={() => toggleRound(round.index)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  {/* Round badge */}
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: roundDone ? `${accent}22` : isCurrent ? accent : mutedChipBg }}>
                    {roundDone
                      ? <CheckCircle style={{ width: 16, height: 16, color: accent }} />
                      : <span style={{ fontSize: 13, fontWeight: 900, color: isCurrent ? btnFg : secondaryText }}>{round.index + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black" style={{ color: primaryText }}>Round {round.index + 1}</span>
                      {isCurrent && !roundDone && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase"
                          style={{ background: accent, color: btnFg }}>Now Playing</span>
                      )}
                      {roundDone && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase"
                          style={{ background: `${accent}18`, color: accent }}>Done</span>
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5 font-medium" style={{ color: secondaryText }}>
                      {doneInRound}/{round.matches.length} matches · {round.matches.length} court{round.matches.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <CourtDot accent={isCurrent ? accent : secondaryText} />
                  {expanded ? <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: secondaryText }} /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: secondaryText }} />}
                </button>

                {/* Match cards */}
                {expanded && (
                  <div className="px-3 pb-3 space-y-2 border-t pt-3" style={{ borderColor: border }}>
                    {round.matches.map((match, mi) => {
                      const namesA = getNames(match.teamA);
                      const namesB = getNames(match.teamB);
                      const aWon = match.completed && parseInt(match.scoreA) > parseInt(match.scoreB);
                      const bWon = match.completed && parseInt(match.scoreB) > parseInt(match.scoreA);

                      return (
                        <div key={match.id} className="rounded-xl overflow-hidden transition-all"
                           style={{ border: `1.5px solid ${match.completed ? accent + '44' : border}`, background: match.completed ? (darkMode ? `${accent}18` : `${accent}08`) : cardBg }}>

                          {/* Court label */}
                          <div className="flex items-center justify-between px-3 pt-2 pb-1">
                            <div className="flex items-center gap-1.5">
                              <CourtDot accent={match.completed ? accent : secondaryText} />
                              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: match.completed ? accent : secondaryText }}>
                                Court {mi + 1}
                              </span>
                            </div>
                            <button onClick={() => { if (!match.completed) finalizeRoundRobinMatch(tid, round.index, match.id); }}
                              disabled={match.completed}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all disabled:cursor-default"
                              style={match.completed
                                ? { background: `${accent}20`, color: accent }
                                 : { background: mutedChipBg, color: secondaryText }}>
                              {match.completed ? <><CheckCircle className="w-3 h-3" /> Confirmed</> : <>Confirm</>}
                            </button>
                          </div>

                          {/* Teams + scores */}
                          <div className="px-3 pb-3 flex items-center gap-2">
                            {/* Team A */}
                            <div className="flex-1 min-w-0">
                              {namesA.map((name, i) => (
                                <div key={i} className="text-xs font-bold truncate flex items-center gap-1"
                                  style={{ color: aWon ? accent : primaryText }}>
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
                              <span className="font-black text-sm" style={{ color: secondaryText }}>—</span>
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
                                  style={{ color: bWon ? accent : primaryText }}>
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
        <div className="p-3 space-y-2 flex-1 min-h-0 overflow-y-auto">
          {allDone && podium.length > 0 && (
            <div
              className="relative overflow-hidden rounded-[24px] px-4 py-5 mb-2"
              style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`, border: `1.5px solid ${accent}33` }}
            >
              <CelebrationConfetti accent={accent} />
              <div className="relative z-10">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: accent }}>Final podium</div>
                <div className="text-lg font-black tracking-tight" style={{ color: primaryText }}>Top 3 finishers</div>
                <div className="mt-4 grid grid-cols-3 gap-2 items-end">
                  {[podium[1], podium[0], podium[2]].filter(Boolean).map((row, visualIndex) => {
                    const place = row === podium[0] ? 1 : row === podium[1] ? 2 : 3;
                    const trophyTone = place === 1 ? '#f59e0b' : place === 2 ? '#94a3b8' : '#fb7185';
                    const height = place === 1 ? 124 : place === 2 ? 108 : 96;
                    return (
                      <div
                        key={`podium-${row.id}`}
                        className="rounded-[20px] px-2 py-3 text-center"
                        style={{
                          minHeight: height,
                          background: place === 1 ? `${accent}14` : mutedBg,
                          border: `1.5px solid ${place === 1 ? `${accent}44` : border}`,
                          animation: `rr-podium-pop 420ms ease ${visualIndex * 90}ms both`,
                        }}
                      >
                        <div className="flex justify-center mb-2">
                          <PodiumAvatar participant={row.participant} label={row.displayName} accent={accent} />
                        </div>
                        <div className="flex justify-center mb-1">
                          <Trophy className="w-4 h-4" style={{ color: trophyTone }} />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: trophyTone }}>
                          {place === 1 ? '1st place' : place === 2 ? '2nd place' : '3rd place'}
                        </div>
                        <div className="mt-1 text-sm font-black truncate" style={{ color: primaryText }}>{row.displayName}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {standings.length === 0 ? (
            <div className="py-10 text-center">
              <div style={{ fontSize: 36, marginBottom: 8 }}>🥒</div>
              <div className="text-sm font-bold" style={{ color: secondaryText }}>Play some matches to see standings</div>
            </div>
          ) : (
            standings.map((row, idx) => {
              const isWinner = allDone && idx === 0 && row.wins > 0;
              const diff = row.pointsFor - row.pointsAgainst;
              return (
                <div key={row.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all"
                  style={{
                    border: `1.5px solid ${isWinner ? accent + '55' : border}`,
                  background: isWinner ? `linear-gradient(135deg, ${accent}18, ${accent}08)` : mutedBg,
                  }}>
                  {/* Rank */}
                  <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isWinner ? accent : mutedChipBg }}>
                    {isWinner
                      ? <span style={{ fontSize: 14 }}>🏆</span>
                      : <span style={{ fontSize: 12, fontWeight: 900, color: secondaryText }}>{idx + 1}</span>}
                  </div>
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 900, background: isWinner ? `${accent}25` : mutedChipBg,
                    color: isWinner ? accent : secondaryText, border: `1.5px solid ${isWinner ? accent + '44' : 'transparent'}` }}>
                    {initials(row.displayName)}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black truncate" style={{ color: isWinner ? accent : primaryText }}>{row.displayName}</div>
                    <div className="text-[10px] font-semibold" style={{ color: secondaryText }}>{row.played} played</div>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div className="text-sm font-black text-emerald-500">{row.wins}</div>
                      <div className="text-[9px] font-bold uppercase" style={{ color: secondaryText }}>W</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-black text-rose-400">{row.losses}</div>
                      <div className="text-[9px] font-bold uppercase" style={{ color: secondaryText }}>L</div>
                    </div>
                    <div className="text-center min-w-[32px]">
                      <div className={`text-sm font-black ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-400' : ''}`} style={diff === 0 ? { color: secondaryText } : undefined}>{diff > 0 ? '+' : ''}{diff}</div>
                      <div className="text-[9px] font-bold uppercase" style={{ color: secondaryText }}>+/-</div>
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
          className="flex items-center gap-1.5 text-xs font-bold hover:text-red-500 transition-colors" style={{ color: secondaryText }}>
          <RotateCcw className="w-3.5 h-3.5" /> New Tournament
        </button>
        {roundRobinError && <span className="text-[11px] font-semibold text-red-500">{roundRobinError}</span>}
      </div>
    </div>
  );
}
