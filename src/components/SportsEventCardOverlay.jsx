import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import SportsEventCard from './SportsEventCard';
import { ChatRoom, LiveMap, RosterRow } from './PopupEventPanel';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POPUP_NO_MAX_SENTINEL = 1000000;
const isUuid = (value) => UUID_RE.test(String(value || '').trim());
const getManualPlayersStorageKey = (eventId) => `popup-manual-players:${String(eventId || '').trim()}`;
const readManualPlayers = (eventId) => {
  if (typeof window === 'undefined') return [];
  const key = getManualPlayersStorageKey(eventId);
  if (!key) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const writeManualPlayers = (eventId, players) => {
  if (typeof window === 'undefined') return;
  const key = getManualPlayersStorageKey(eventId);
  if (!key) return;
  try {
    if (!Array.isArray(players) || players.length === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(players));
  } catch {}
};

const normalizeEvent = (row = {}, fallback = {}) => {
  const eventData = row?.event_data && typeof row.event_data === 'object' && !Array.isArray(row.event_data)
    ? row.event_data
    : {};

  return {
    ...fallback,
    ...row,
    ...eventData,
    title: String(row?.title || fallback?.title || '').trim() || 'Untitled Event',
    date: String(row?.date || fallback?.date || '').trim() || '',
    time: row?.time || fallback?.time || null,
    location: String(row?.location || fallback?.location || '').trim() || null,
    description: String(row?.description || fallback?.description || '').trim() || '',
    category: 'sports',
    event_data: eventData,
  };
};

export default function SportsEventCardOverlay({
  activeLayerPageTheme,
  darkMode,
  supabase,
  user,
  displayName,
  initialEventId,
  eventMetaFallback,
  currentUserProfilePhotoUrl = '',
  resolveHandleLikeLabel,
  onLaunchRoundRobin,
  onLaunchGauntlet,
  onLaunchScramble,
  onClose,
}) {
  const accent = activeLayerPageTheme?.accent || '#16a34a';
  const [activeScreen, setActiveScreen] = useState('detail');
  const [event, setEvent] = useState(() => normalizeEvent(eventMetaFallback || {}, eventMetaFallback || {}));
  const [members, setMembers] = useState([]);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  const [manualPlayerName, setManualPlayerName] = useState('');
  const [manualAddBusy, setManualAddBusy] = useState(false);
  const [manualAddError, setManualAddError] = useState('');
  const fallbackRef = useRef(eventMetaFallback);
  const sheetRef = useRef(null);
  const dragStartYRef = useRef(null);
  const dragCurrentYRef = useRef(0);

  const effectiveDisplayName = String(displayName || '').trim()
    || (typeof resolveHandleLikeLabel === 'function'
      ? resolveHandleLikeLabel(user?.email || user?.phone || 'Player', user?.id)
      : (user?.email || user?.phone || 'Player'));

  useEffect(() => {
    fallbackRef.current = eventMetaFallback;
    if (eventMetaFallback) setEvent((prev) => normalizeEvent(prev || eventMetaFallback, eventMetaFallback));
  }, [eventMetaFallback]);

  const memberPhotoUrl = (memberLike = {}) => {
    const memberUserId = String(memberLike?.user_id || memberLike?.userId || '').trim();
    const isCurrentUser = memberUserId && memberUserId === String(user?.id || '').trim();
    return String(
      memberLike?.photoUrl
      || memberLike?.photo_url
      || memberLike?.avatarUrl
      || memberLike?.avatar_url
      || (isCurrentUser ? currentUserProfilePhotoUrl : '')
      || ''
    ).trim();
  };

  const loadEvent = useCallback(async (id) => {
    if (!id || !supabase) return;
    if (!isUuid(id)) {
      if (fallbackRef.current) setEvent(normalizeEvent(fallbackRef.current, fallbackRef.current));
      return;
    }

    try {
      const [{ data: ev }, { data: mems }, { data: signups }] = await Promise.all([
        supabase.from('popup_event_details').select('*').eq('id', id).single(),
        supabase.from('popup_event_members').select('*').eq('event_id', id).order('joined_at'),
        supabase.from('popup_event_signups').select('*').eq('event_id', id).order('created_at'),
      ]);

      if (ev) setEvent(normalizeEvent(ev, fallbackRef.current || {}));

      const list = [];
      const seenUserIds = new Set();
      (mems || []).forEach((member) => {
        const userId = String(member?.user_id || '').trim();
        if (userId) seenUserIds.add(userId);
        list.push({
          ...member,
          display_name: String(member?.display_name || '').trim() || 'Player',
          photoUrl: memberPhotoUrl(member),
          photo_url: memberPhotoUrl(member),
          avatarUrl: memberPhotoUrl(member),
          avatar_url: memberPhotoUrl(member),
        });
      });

      (signups || []).forEach((signup) => {
        const userId = String(signup?.user_id || '').trim();
        if (!userId || seenUserIds.has(userId)) return;
        seenUserIds.add(userId);
        list.push({
          id: `signup-${userId}`,
          event_id: id,
          user_id: userId,
          display_name: String(signup?.display_name || '').trim() || 'Player',
          role: 'player',
          joined_at: signup?.created_at,
          photoUrl: memberPhotoUrl(signup),
          photo_url: memberPhotoUrl(signup),
          avatarUrl: memberPhotoUrl(signup),
          avatar_url: memberPhotoUrl(signup),
        });
      });

      readManualPlayers(id).forEach((player) => {
        const manualName = String(player?.display_name || '').trim();
        if (!manualName) return;
        const duplicate = list.some((entry) => String(entry?.display_name || '').trim().toLowerCase() === manualName.toLowerCase());
        if (duplicate) return;
        list.push({
          id: String(player?.id || `manual-${manualName.toLowerCase()}`),
          event_id: id,
          user_id: '',
          display_name: manualName,
          role: 'player',
          joined_at: player?.joined_at || new Date().toISOString(),
          is_manual: true,
        });
      });

      setMembers(list);
    } catch {
      if (fallbackRef.current) setEvent(normalizeEvent(fallbackRef.current, fallbackRef.current));
    }
  }, [supabase, user?.id, currentUserProfilePhotoUrl]);

  useEffect(() => {
    if (initialEventId) loadEvent(initialEventId);
  }, [initialEventId, loadEvent]);

  useEffect(() => {
    if (!event?.id || !supabase || !isUuid(event.id)) return undefined;
    const channel = supabase.channel(`sports-card-members-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_members', filter: `event_id=eq.${event.id}` }, () => loadEvent(event.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_signups', filter: `event_id=eq.${event.id}` }, () => loadEvent(event.id))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [event?.id, supabase, loadEvent]);

  const creatorUserId = String(event?.created_by || event?.created_by_user_id || '').trim();
  const currentUserId = String(user?.id || '').trim();
  const creatorIsCurrentUser = Boolean(creatorUserId && currentUserId && creatorUserId === currentUserId);
  const myMember = members.find((member) => String(member?.user_id || '').trim() === currentUserId);
  const isHost = myMember?.role === 'host' || creatorIsCurrentUser;
  const isMember = Boolean(myMember) || creatorIsCurrentUser;
  const noMax = Number(event?.max_players || 0) >= POPUP_NO_MAX_SENTINEL;
  const memberCount = Math.max(members.length, creatorIsCurrentUser && members.length === 0 ? 1 : 0);
  const isFull = Boolean(event) && !noMax && memberCount >= (event.max_players || 99);

  const invitees = members.length > 0
    ? members
    : creatorIsCurrentUser
      ? [{
        id: currentUserId || 'host',
        user_id: currentUserId,
        display_name: effectiveDisplayName || 'Player',
        role: 'host',
        photoUrl: currentUserProfilePhotoUrl,
        photo_url: currentUserProfilePhotoUrl,
        avatarUrl: currentUserProfilePhotoUrl,
        avatar_url: currentUserProfilePhotoUrl,
      }]
      : [];

  const routedEvent = {
    ...event,
    category: 'sports',
    invitees,
  };
  const sortedPlayers = [...invitees].sort((a, b) => {
    const rank = (role) => (role === 'host' ? 0 : role === 'cohost' ? 1 : 2);
    const rankDelta = rank(a?.role) - rank(b?.role);
    if (rankDelta !== 0) return rankDelta;
    return String(a?.display_name || '').localeCompare(String(b?.display_name || ''));
  });

  const handleJoin = async () => {
    if (!event || isMember || isFull) return;
    if (!currentUserId) {
      setJoinError('Sign in to join this event.');
      return;
    }
    if (!isUuid(event.id)) {
      setJoinError('This event cannot accept joins yet.');
      return;
    }

    setJoinError('');
    setJoining(true);
    try {
      const { error } = await supabase
        .from('popup_event_members')
        .insert({ event_id: event.id, user_id: currentUserId, display_name: effectiveDisplayName || 'Player', role: 'player' });
      if (error && error.code !== '23505') throw error;
      await loadEvent(event.id);
    } catch (error) {
      setJoinError(error?.message || 'Could not join right now.');
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!myMember || isHost || !isUuid(event?.id)) return;
    setJoinError('');
    try {
      const { error } = await supabase.from('popup_event_members').delete().eq('id', myMember.id);
      if (error) throw error;
      await loadEvent(event.id);
    } catch (error) {
      setJoinError(error?.message || 'Could not update your RSVP.');
    }
  };

  const handleAddManualPlayer = async () => {
    const nextName = String(manualPlayerName || '').trim();
    if (!isHost || !isUuid(event?.id)) return;
    if (!nextName) {
      setManualAddError('Enter a player name.');
      return;
    }
    if (isFull) {
      setManualAddError('This event is already full.');
      return;
    }
    const alreadyExists = sortedPlayers.some((player) => String(player?.display_name || '').trim().toLowerCase() === nextName.toLowerCase());
    if (alreadyExists) {
      setManualAddError('That player is already on the roster.');
      return;
    }

    setManualAddBusy(true);
    setManualAddError('');
    try {
      const currentManualPlayers = readManualPlayers(event.id);
      currentManualPlayers.push({
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        display_name: nextName,
        joined_at: new Date().toISOString(),
      });
      writeManualPlayers(event.id, currentManualPlayers);
      setManualPlayerName('');
      await loadEvent(event.id);
    } catch (error) {
      setManualAddError(error?.message || 'Could not add player.');
    }
    setManualAddBusy(false);
  };

  const handleRemoveManualPlayer = async (member) => {
    if (!isHost || !isUuid(event?.id) || !member?.is_manual) return;
    const nextManualPlayers = readManualPlayers(event.id).filter((player) => String(player?.id || '') !== String(member?.id || ''));
    writeManualPlayers(event.id, nextManualPlayers);
    await loadEvent(event.id);
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}${window.location.pathname}?popup=${event?.id || initialEventId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const handleDragStart = (eventLike) => {
    dragStartYRef.current = eventLike.clientY;
    dragCurrentYRef.current = 0;
  };
  const handleDragMove = (eventLike) => {
    if (dragStartYRef.current === null) return;
    const deltaY = eventLike.clientY - dragStartYRef.current;
    if (deltaY < 0) return;
    dragCurrentYRef.current = deltaY;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${deltaY}px)`;
  };
  const handleDragEnd = () => {
    if (dragStartYRef.current === null) return;
    dragStartYRef.current = null;
    if (dragCurrentYRef.current > 80) {
      onClose?.();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    dragCurrentYRef.current = 0;
  };

  const primaryText = darkMode ? '#f8fafc' : 'var(--color-text-primary)';
  const secondaryText = darkMode ? '#cbd5e1' : 'var(--color-text-secondary)';
  const border = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const softBg = darkMode ? `${accent}18` : `${accent}0d`;
  const currentNoMax = Number(event?.max_players || 0) >= POPUP_NO_MAX_SENTINEL;
  const tabs = [
    { id: 'detail', label: 'Info' },
    { id: 'roster', label: 'People' },
    { id: 'chat', label: 'Chat' },
    { id: 'map', label: 'Map' },
    { id: 'game', label: 'Play' },
  ];

  const renderScreenHeader = (title) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '12px 14px',
        background: darkMode ? '#0f172a' : '#fff',
        borderBottom: `1px solid ${border}`,
      }}
    >
      <button
        type="button"
        onClick={() => setActiveScreen('detail')}
        style={{
          border: `1px solid ${border}`,
          background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc',
          color: secondaryText,
          borderRadius: 999,
          padding: '7px 12px',
          cursor: 'pointer',
          fontFamily: "'Caveat', cursive",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        Info
      </button>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 900, color: primaryText }}>
        {title}
      </div>
      <div style={{ width: 54 }} />
    </div>
  );

  const renderTabs = () => (
    <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, background: darkMode ? '#0f172a' : '#fff' }}>
      {tabs.map((tab) => {
        const active = activeScreen === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveScreen(tab.id)}
            style={{
              flex: 1,
              padding: '11px 0',
              border: 'none',
              borderTop: `2px solid ${active ? accent : 'transparent'}`,
              background: active ? (darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc') : 'transparent',
              color: active ? primaryText : secondaryText,
              cursor: 'pointer',
              fontFamily: "'Caveat', cursive",
              fontSize: 12,
              fontWeight: active ? 800 : 600,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const renderActiveScreen = () => {
    if (activeScreen === 'roster') {
      return (
        <>
          {renderScreenHeader('People')}
          <div style={{ paddingBottom: 24 }}>
            <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: accent, fontFamily: "'Caveat', cursive" }}>
                {currentNoMax ? `${memberCount} players` : `${memberCount} / ${event.max_players} players`}
              </div>
              <div style={{ flex: 1, height: 4, borderRadius: 999, background: border, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: currentNoMax ? '100%' : `${Math.min(100, (memberCount / (event.max_players || 1)) * 100)}%`, background: accent }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: secondaryText, fontFamily: "'Caveat', cursive" }}>
                {currentNoMax ? 'Unlimited' : isFull ? 'Full' : `${Math.max(0, (event.max_players || 0) - memberCount)} left`}
              </div>
            </div>
            {isHost && isUuid(event?.id) && (
              <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    value={manualPlayerName}
                    onChange={(e) => { setManualPlayerName(e.target.value); if (manualAddError) setManualAddError(''); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualPlayer();
                      }
                    }}
                    placeholder="Add player name"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '9px 12px',
                      borderRadius: 999,
                      border: `1.5px solid ${border}`,
                      background: darkMode ? 'rgba(255,255,255,0.06)' : '#fff',
                      color: primaryText,
                      outline: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "'Caveat', cursive",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddManualPlayer}
                    disabled={manualAddBusy || isFull || !String(manualPlayerName || '').trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '9px 12px',
                      borderRadius: 999,
                      border: 'none',
                      background: accent,
                      color: '#fff',
                      cursor: manualAddBusy || isFull || !String(manualPlayerName || '').trim() ? 'default' : 'pointer',
                      opacity: manualAddBusy || isFull || !String(manualPlayerName || '').trim() ? 0.65 : 1,
                      fontSize: 12,
                      fontWeight: 900,
                      fontFamily: "'Caveat', cursive",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Plus style={{ width: 14, height: 14 }} />
                    {manualAddBusy ? 'Adding...' : 'Add'}
                  </button>
                </div>
                {manualAddError && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', fontFamily: "'Caveat', cursive" }}>
                    {manualAddError}
                  </div>
                )}
              </div>
            )}
            {sortedPlayers.map((member) => (
              <RosterRow
                key={member.id || member.user_id || member.display_name}
                member={member}
                isMe={String(member?.user_id || '').trim() === currentUserId}
                isHost={Boolean(isHost && member?.is_manual)}
                accent={accent}
                darkMode={darkMode}
                onKick={handleRemoveManualPlayer}
                onPromote={() => {}}
                onDemote={() => {}}
                attendeeRoleLabel="Player"
                canManageRoles={false}
              />
            ))}
            {sortedPlayers.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', fontFamily: "'Caveat', cursive", color: secondaryText, fontWeight: 800 }}>
                No players yet
              </div>
            )}
          </div>
        </>
      );
    }
    if (activeScreen === 'chat') {
      return (
        <>
          {renderScreenHeader('Chat')}
          <ChatRoom
            eventId={event.id}
            supabase={supabase}
            user={user}
            displayName={effectiveDisplayName}
            accent={accent}
            darkMode={darkMode}
            border={border}
            softBg={softBg}
            members={sortedPlayers}
          />
        </>
      );
    }
    if (activeScreen === 'map') {
      return (
        <>
          {renderScreenHeader('Map')}
          <LiveMap
            event={event}
            supabase={supabase}
            user={user}
            displayName={effectiveDisplayName}
            accent={accent}
            darkMode={darkMode}
            border={border}
            softBg={softBg}
            members={sortedPlayers}
          />
        </>
      );
    }
    if (activeScreen === 'game') {
      const modeOptions = [
        {
          id: 'round-robin',
          title: 'Round Robin',
          description: 'Build a rotating schedule so everyone gets matched through the group.',
          action: () => onLaunchRoundRobin?.(event, sortedPlayers),
          minPlayers: 3,
        },
        {
          id: 'gauntlet',
          title: 'Gauntlet',
          description: 'Run ladder-style rounds where winners climb and pairings keep moving.',
          action: () => onLaunchGauntlet?.(event, sortedPlayers),
          minPlayers: 4,
        },
        {
          id: 'scramble',
          title: 'Scramble',
          description: 'Shuffle fresh teams each round for a more casual rotating format.',
          action: () => onLaunchScramble?.(event, sortedPlayers),
          minPlayers: 4,
        },
      ];
      return (
        <>
          {renderScreenHeader('Play')}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px 14px', borderRadius: 14, background: softBg, border: `1px solid ${border}` }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, marginBottom: 4, fontFamily: "'Caveat', cursive" }}>
                Choose a format
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: secondaryText, lineHeight: 1.45, fontFamily: "'Caveat', cursive" }}>
                Pick how you want to organize play for {sortedPlayers.length} player{sortedPlayers.length === 1 ? '' : 's'}.
              </div>
            </div>
            {!isHost && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', fontSize: 12, color: secondaryText, fontWeight: 700, textAlign: 'center', fontFamily: "'Caveat', cursive" }}>
                Only the host can launch a play mode.
              </div>
            )}
            {modeOptions.map((mode) => {
              const disabled = !isHost || sortedPlayers.length < mode.minPlayers;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={disabled ? undefined : mode.action}
                  disabled={disabled}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 16,
                    border: `1px solid ${disabled ? border : `${accent}55`}`,
                    background: disabled ? (darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc') : (darkMode ? `${accent}18` : '#fff'),
                    color: disabled ? secondaryText : primaryText,
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.68 : 1,
                    textAlign: 'left',
                    fontFamily: "'Caveat', cursive",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 17, fontWeight: 900, color: disabled ? secondaryText : accent }}>
                      {mode.title}
                    </span>
                    <span style={{ display: 'block', marginTop: 3, fontSize: 13, fontWeight: 700, lineHeight: 1.35, color: secondaryText }}>
                      {mode.description}
                    </span>
                    {sortedPlayers.length < mode.minPlayers && (
                      <span style={{ display: 'block', marginTop: 6, fontSize: 11, fontWeight: 800, color: '#d97706' }}>
                        Needs at least {mode.minPlayers} players
                      </span>
                    )}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: 18, fontWeight: 900, color: disabled ? secondaryText : accent }}>
                    {disabled ? '' : '>'}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div
      ref={sheetRef}
      id="sports-event-card-root"
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        borderRadius: 20,
        background: darkMode ? '#0f172a' : '#fff',
        transition: 'transform 0.2s',
      }}
    >
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerLeave={handleDragEnd}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 0 8px',
          cursor: 'grab',
          touchAction: 'none',
          background: darkMode ? '#0f172a' : '#fff',
        }}
      >
        <div
          style={{
            width: 42,
            height: 5,
            borderRadius: 999,
            background: darkMode ? 'rgba(255,255,255,0.24)' : 'rgba(15,23,42,0.18)',
          }}
        />
      </div>
      <div style={{ height: 'calc(100% - 25px)', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
        {activeScreen === 'detail' ? (
          <SportsEventCard
            event={routedEvent}
            darkMode={darkMode}
            accent={accent}
            activeTab="info"
            onPrimaryAction={handleJoin}
            primaryActionLabel={joining ? 'Joining...' : 'Join Event'}
            onLeave={handleLeave}
            isHost={isHost}
            isMember={isMember}
            isFull={isFull}
            joining={joining}
            joinError={joinError}
            copied={copied}
            onCopyLink={handleCopyLink}
            onViewRoster={() => setActiveScreen('roster')}
            onOpenChat={() => setActiveScreen('chat')}
            onOpenMap={() => setActiveScreen('map')}
            onStartPlay={() => setActiveScreen('game')}
            memberCount={memberCount}
            isLegacyInvalidEvent={!isUuid(event?.id)}
          />
        ) : (
          <>
            {renderTabs()}
            {renderActiveScreen()}
          </>
        )}
      </div>
    </div>
  );
}
