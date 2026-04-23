import React, { useCallback, useEffect, useRef, useState } from 'react';
import SportsEventCard from './SportsEventCard';
import { ChatRoom, GameModeLauncher, LiveMap, RosterRow } from './PopupEventPanel';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POPUP_NO_MAX_SENTINEL = 1000000;
const isUuid = (value) => UUID_RE.test(String(value || '').trim());

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
}) {
  const accent = activeLayerPageTheme?.accent || '#16a34a';
  const [activeScreen, setActiveScreen] = useState('detail');
  const [event, setEvent] = useState(() => normalizeEvent(eventMetaFallback || {}, eventMetaFallback || {}));
  const [members, setMembers] = useState([]);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  const fallbackRef = useRef(eventMetaFallback);

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

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}${window.location.pathname}?popup=${event?.id || initialEventId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const primaryText = darkMode ? '#f8fafc' : 'var(--color-text-primary)';
  const secondaryText = darkMode ? '#cbd5e1' : 'var(--color-text-secondary)';
  const border = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const softBg = darkMode ? `${accent}18` : `${accent}0d`;
  const btnStyle = { backgroundColor: accent, color: '#fff', border: 'none', cursor: 'pointer' };
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
            {sortedPlayers.map((member) => (
              <RosterRow
                key={member.id || member.user_id || member.display_name}
                member={member}
                isMe={String(member?.user_id || '').trim() === currentUserId}
                isHost={false}
                accent={accent}
                darkMode={darkMode}
                onKick={() => {}}
                onPromote={() => {}}
                onDemote={() => {}}
                attendeeRoleLabel="Player"
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
      return (
        <>
          {renderScreenHeader('Play')}
          <GameModeLauncher
            event={event}
            members={sortedPlayers}
            accent={accent}
            darkMode={darkMode}
            border={border}
            softBg={softBg}
            btnStyle={btnStyle}
            isHost={isHost}
            onLaunchRoundRobin={onLaunchRoundRobin}
            onLaunchGauntlet={onLaunchGauntlet}
            onLaunchScramble={onLaunchScramble}
          />
        </>
      );
    }
    return null;
  };

  return (
    <div
      id="sports-event-card-root"
      style={{
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        borderRadius: 20,
      }}
    >
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
  );
}
