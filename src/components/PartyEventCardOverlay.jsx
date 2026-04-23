import React, { useCallback, useEffect, useRef, useState } from 'react';
import PartyEventCard from './PartyEventCard';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => UUID_RE.test(String(value || '').trim());

const normalizeEvent = (row = {}, fallback = {}) => {
  const eventData = row?.event_data && typeof row.event_data === 'object' && !Array.isArray(row.event_data)
    ? row.event_data
    : {};

  return {
    ...fallback,
    ...row,
    ...eventData,
    title: String(row?.title || fallback?.title || '').trim() || 'Untitled Party',
    date: String(row?.date || fallback?.date || '').trim() || '',
    time: row?.time || fallback?.time || null,
    location: String(row?.location || fallback?.location || '').trim() || null,
    description: String(row?.description || fallback?.description || '').trim() || '',
    category: 'party',
    event_data: eventData,
  };
};

export default function PartyEventCardOverlay({
  activeLayerPageTheme,
  darkMode,
  supabase,
  user,
  displayName,
  initialEventId,
  eventMetaFallback,
  currentUserProfilePhotoUrl = '',
  resolveHandleLikeLabel,
  onClose,
}) {
  const accent = activeLayerPageTheme?.accent || '#f59e0b';
  const [event, setEvent] = useState(() => normalizeEvent(eventMetaFallback || {}, eventMetaFallback || {}));
  const [members, setMembers] = useState([]);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const fallbackRef = useRef(eventMetaFallback);
  const sheetRef = useRef(null);
  const dragStartYRef = useRef(null);
  const dragCurrentYRef = useRef(0);

  const currentUserId = String(user?.id || '').trim();
  const effectiveDisplayName = String(displayName || '').trim()
    || (typeof resolveHandleLikeLabel === 'function'
      ? resolveHandleLikeLabel(user?.email || user?.phone || 'Guest', user?.id)
      : (user?.email || user?.phone || 'Guest'));

  useEffect(() => {
    fallbackRef.current = eventMetaFallback;
    if (eventMetaFallback) setEvent((prev) => normalizeEvent(prev || eventMetaFallback, eventMetaFallback));
  }, [eventMetaFallback]);

  const memberPhotoUrl = (memberLike = {}) => {
    const memberUserId = String(memberLike?.user_id || memberLike?.userId || '').trim();
    const isCurrentUser = memberUserId && memberUserId === currentUserId;
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
          display_name: String(member?.display_name || '').trim() || 'Guest',
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
          display_name: String(signup?.display_name || '').trim() || 'Guest',
          role: 'guest',
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
  }, [supabase, currentUserId, currentUserProfilePhotoUrl]);

  useEffect(() => {
    if (initialEventId) loadEvent(initialEventId);
  }, [initialEventId, loadEvent]);

  useEffect(() => {
    if (!event?.id || !supabase || !isUuid(event.id)) return undefined;
    const channel = supabase.channel(`party-card-members-${event.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_members', filter: `event_id=eq.${event.id}` }, () => loadEvent(event.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'popup_event_signups', filter: `event_id=eq.${event.id}` }, () => loadEvent(event.id))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [event?.id, supabase, loadEvent]);

  const creatorUserId = String(event?.created_by || event?.created_by_user_id || '').trim();
  const creatorIsCurrentUser = Boolean(creatorUserId && currentUserId && creatorUserId === currentUserId);
  const myMember = members.find((member) => String(member?.user_id || '').trim() === currentUserId);
  const isHost = myMember?.role === 'host' || creatorIsCurrentUser;
  const isMember = Boolean(myMember) || creatorIsCurrentUser;
  const isFull = Boolean(event) && members.length >= (event.max_players || 99);

  const hostInvitee = {
    id: creatorUserId || 'host',
    user_id: creatorUserId,
    display_name: String(event?.created_by_name || eventMetaFallback?.created_by_name || effectiveDisplayName || 'Host').trim(),
    role: 'host',
    photoUrl: creatorIsCurrentUser ? currentUserProfilePhotoUrl : '',
    photo_url: creatorIsCurrentUser ? currentUserProfilePhotoUrl : '',
    avatarUrl: creatorIsCurrentUser ? currentUserProfilePhotoUrl : '',
    avatar_url: creatorIsCurrentUser ? currentUserProfilePhotoUrl : '',
  };
  const hasHostInvitee = members.some((member) => String(member?.user_id || '').trim() === String(hostInvitee.user_id || '').trim());
  const invitees = hasHostInvitee || !hostInvitee.display_name
    ? members
    : [hostInvitee, ...members];

  const routedEvent = {
    ...event,
    category: 'party',
    invitees,
  };

  const updateEventData = async (patch) => {
    if (!event || !isUuid(event?.id) || !patch || typeof patch !== 'object') return false;
    const detailKeys = ['title', 'date', 'time', 'location', 'description', 'max_players', 'is_public', 'status', 'category'];
    const detailPatch = {};
    const metadataPatch = { ...patch };
    detailKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(metadataPatch, key)) {
        detailPatch[key] = metadataPatch[key];
        delete metadataPatch[key];
      }
    });
    const nextEventData = {
      ...((event?.event_data && typeof event.event_data === 'object' && !Array.isArray(event.event_data)) ? event.event_data : {}),
      ...metadataPatch,
    };

    try {
      await supabase.from('popup_event_details').update({ ...detailPatch, event_data: nextEventData }).eq('id', event.id);
      if (Object.keys(detailPatch).length > 0) {
        try {
          await supabase.from('events').update(detailPatch).eq('id', event.id);
        } catch {}
      }
      setEvent((prev) => (prev ? { ...prev, ...detailPatch, ...metadataPatch, event_data: nextEventData } : prev));
      await loadEvent(event.id);
      return true;
    } catch {
      return false;
    }
  };

  const handleJoin = async () => {
    if (!event || isMember || isFull) return;
    if (!currentUserId) {
      setJoinError('Sign in to RSVP to this event.');
      return;
    }
    if (!isUuid(event.id)) {
      setJoinError('This event cannot accept RSVPs yet.');
      return;
    }

    setJoinError('');
    setJoining(true);
    try {
      const { error } = await supabase
        .from('popup_event_members')
        .insert({ event_id: event.id, user_id: currentUserId, display_name: effectiveDisplayName || 'Guest', role: 'guest' });
      if (error && error.code !== '23505') throw error;
      await loadEvent(event.id);
    } catch (error) {
      setJoinError(error?.message || 'Could not RSVP right now.');
    }
    setJoining(false);
  };

  const handlePotluckClaim = async (itemIndex) => {
    if (!event || !isUuid(event?.id) || !currentUserId || !isMember) return false;
    const existingItems = Array.isArray(event?.potluckItems) ? event.potluckItems : [];
    const nextItems = existingItems.map((entry, index) => {
      if (index !== itemIndex) return entry;
      const alreadyMine = String(entry?.claimedByUserId || '').trim() === currentUserId;
      if (alreadyMine) return { ...entry, person: '', claimedByUserId: '' };
      if (String(entry?.claimedByUserId || '').trim()) return entry;
      return { ...entry, person: effectiveDisplayName || 'Guest', claimedByUserId: currentUserId };
    });
    return updateEventData({ potluckItems: nextItems });
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

  return (
    <div
      ref={sheetRef}
      id="party-event-card-root"
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        borderRadius: 20,
        background: darkMode ? '#0f0a1a' : '#fff',
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
          background: darkMode ? '#0f0a1a' : '#fff',
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
        <PartyEventCard
          event={routedEvent}
          darkMode={darkMode}
          accent={accent}
          currentUserId={currentUserId}
          currentUserName={effectiveDisplayName || 'Guest'}
          onUpdateEventData={isHost ? updateEventData : undefined}
          onClaimPotluck={handlePotluckClaim}
          canClaimPotluck={Boolean(currentUserId && isMember)}
          onPrimaryAction={handleJoin}
          primaryActionLabel={joining ? 'Saving RSVP...' : 'RSVP'}
          hidePrimaryAction={isMember || isFull}
        />
        {joinError ? (
          <div style={{ marginTop: 10, color: '#ef4444', fontFamily: "'Caveat', cursive", fontWeight: 800 }}>
            {joinError}
          </div>
        ) : null}
        </div>
    </div>
  );
}
