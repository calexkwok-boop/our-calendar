import { supabase } from '../supabaseClient';

const dedupeById = (rows) =>
  [...new Map((rows || []).filter((row) => row?.user_id).map((row) => [row.user_id, row])).values()];

export async function loadFriendsList({
  userId,
  userEmail,
  knownHandlesByEmail = {},
  includeSharedEvents = false,
}) {
  if (!userId && !userEmail) return [];
  const friendMap = new Map();

  const [ownedTripsRes, memberTripIdsRes, myLayerAccessRes, ownedLayersRes, myEventMembershipsRes, myEventSignupsRes, ownedChaptersRes, memberChapterIdsRes] = await Promise.all([
    userId ? supabase.from('sub_calendars').select('id, name').eq('owner_id', userId) : Promise.resolve({ data: [] }),
    userEmail ? supabase.from('sub_calendar_members').select('sub_calendar_id').eq('email', userEmail) : Promise.resolve({ data: [] }),
    (userId || userEmail)
      ? (() => {
          let query = supabase.from('shared_access').select('layer_id, owner_id');
          if (userId && userEmail) return query.or(`shared_with_id.eq.${String(userId).trim()},shared_with_email.eq.${userEmail}`);
          if (userId) return query.eq('shared_with_id', String(userId).trim());
          return query.eq('shared_with_email', userEmail);
        })()
      : Promise.resolve({ data: [] }),
    userId ? supabase.from('categories').select('id').eq('owner_id', userId) : Promise.resolve({ data: [] }),
    includeSharedEvents && userId
      ? supabase.from('popup_event_members').select('event_id').eq('user_id', userId)
      : Promise.resolve({ data: [] }),
    includeSharedEvents && userId
      ? supabase.from('popup_event_signups').select('event_id').eq('user_id', userId)
      : Promise.resolve({ data: [] }),
    userId ? supabase.from('chapters').select('id').eq('owner_id', userId) : Promise.resolve({ data: [] }),
    userEmail
      ? supabase.from('chapter_collaborators').select('chapter_id').eq('email', userEmail).eq('status', 'accepted')
      : Promise.resolve({ data: [] }),
  ]);

  const ownedTripNameById = {};
  for (const trip of (ownedTripsRes.data || [])) ownedTripNameById[trip.id] = trip.name || 'Trip';
  const memberTripIds = (memberTripIdsRes.data || []).map((row) => row.sub_calendar_id).filter((id) => id && !ownedTripNameById[id]);
  const allTripIds = [...Object.keys(ownedTripNameById), ...memberTripIds];
  const receivedLayerIds = (myLayerAccessRes.data || []).map((row) => row.layer_id).filter(Boolean);
  const calendarOwnerIds = [...new Set((myLayerAccessRes.data || []).map((row) => row.owner_id).filter((id) => id && id !== userId))];
  const calendarOwnerIdSet = new Set(calendarOwnerIds);
  const ownedLayerIds = (ownedLayersRes.data || []).map((row) => row.id).filter(Boolean);
  const uniqueLayerIds = [...new Set([...receivedLayerIds, ...ownedLayerIds])];
  const ownedChapterIds = (ownedChaptersRes.data || []).map((row) => row.id).filter(Boolean);
  const memberChapterIds = (memberChapterIdsRes.data || []).map((row) => row.chapter_id).filter(Boolean);
  const allChapterIds = [...new Set([...ownedChapterIds, ...memberChapterIds])];
  const myEventIds = [...new Set([
    ...(myEventMembershipsRes.data || []).map((row) => row.event_id),
    ...(myEventSignupsRes.data || []).map((row) => row.event_id),
  ].filter(Boolean))];

  const [memberTripDataRes, coMembersRes, coCalMembersRes, calOwnerHandlesRes, calOwnerHandlesFbRes, eventCoMembersRes, eventCoSignupsRes, chapterRowsRes, chapterCollaboratorsRes] = await Promise.all([
    memberTripIds.length > 0 ? supabase.from('sub_calendars').select('id, owner_id, name').in('id', memberTripIds) : Promise.resolve({ data: [] }),
    allTripIds.length > 0 ? supabase.from('sub_calendar_members').select('email, sub_calendar_id').in('sub_calendar_id', allTripIds).neq('email', userEmail || '') : Promise.resolve({ data: [] }),
    uniqueLayerIds.length > 0 ? supabase.from('shared_access').select('shared_with_email, shared_with_id').in('layer_id', uniqueLayerIds).neq('shared_with_email', userEmail || '') : Promise.resolve({ data: [] }),
    calendarOwnerIds.length > 0 ? supabase.from('user_handles').select('email, user_id, handle').in('user_id', calendarOwnerIds) : Promise.resolve({ data: [] }),
    calendarOwnerIds.length > 0 ? supabase.from('handles').select('email, user_id, handle').in('user_id', calendarOwnerIds) : Promise.resolve({ data: [] }),
    includeSharedEvents && myEventIds.length > 0
      ? supabase.from('popup_event_members').select('event_id, user_id').in('event_id', myEventIds).neq('user_id', userId || '')
      : Promise.resolve({ data: [] }),
    includeSharedEvents && myEventIds.length > 0
      ? supabase.from('popup_event_signups').select('event_id, user_id').in('event_id', myEventIds).neq('user_id', userId || '')
      : Promise.resolve({ data: [] }),
    allChapterIds.length > 0
      ? supabase.from('chapters').select('id, owner_id').in('id', allChapterIds)
      : Promise.resolve({ data: [] }),
    allChapterIds.length > 0
      ? supabase.from('chapter_collaborators').select('chapter_id, email, status').in('chapter_id', allChapterIds).eq('status', 'accepted')
      : Promise.resolve({ data: [] }),
  ]);

  const tripNameById = { ...ownedTripNameById };
  const tripOwnerIdToName = {};
  for (const trip of (memberTripDataRes.data || [])) {
    if (!trip.id) continue;
    tripNameById[trip.id] = trip.name || 'Trip';
    if (trip.owner_id && trip.owner_id !== userId) tripOwnerIdToName[trip.owner_id] = trip.name || 'Shared trip';
  }
  const tripOwnerIds = Object.keys(tripOwnerIdToName);

  for (const member of (coMembersRes.data || [])) {
    const email = String(member.email || '').toLowerCase().trim();
    if (!email) continue;
    const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null };
    const tripName = tripNameById[member.sub_calendar_id] || 'Shared trip';
    if (!entry.trips.includes(tripName)) entry.trips.push(tripName);
    friendMap.set(email, entry);
  }
  for (const member of (coCalMembersRes.data || [])) {
    const email = String(member.shared_with_email || '').toLowerCase().trim();
    if (!email) continue;
    const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedEvents: 0, userId: null };
    entry.sharedCalendars += 1;
    if (!entry.userId && member.shared_with_id) entry.userId = member.shared_with_id;
    friendMap.set(email, entry);
  }
  for (const handleRow of dedupeById([...(calOwnerHandlesRes.data || []), ...(calOwnerHandlesFbRes.data || [])])) {
    const email = String(handleRow.email || '').toLowerCase().trim();
    const mapKey = email || (handleRow.user_id ? `user:${String(handleRow.user_id).trim()}` : '');
    if (!mapKey || email === userEmail) continue;
    const entry = friendMap.get(mapKey) || { trips: [], sharedCalendars: 0, sharedChapters: 0, sharedEvents: 0, userId: null, email: email || '', handle: String(handleRow.handle || '').trim() };
    if (!entry.userId) entry.userId = handleRow.user_id;
    if (!entry.email && email) entry.email = email;
    if (!entry.handle && handleRow.handle) entry.handle = String(handleRow.handle || '').trim();
    if (calendarOwnerIdSet.has(handleRow.user_id)) entry.sharedCalendars += 1;
    friendMap.set(mapKey, entry);
  }
  const chapterOwnerIds = [...new Set((chapterRowsRes.data || []).map((row) => row.owner_id).filter((id) => id && id !== userId))];
  const chapterOwnerIdSet = new Set(chapterOwnerIds);
  for (const collaborator of (chapterCollaboratorsRes.data || [])) {
    const email = String(collaborator?.email || '').toLowerCase().trim();
    if (!email || email === userEmail) continue;
    const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedChapters: 0, sharedEvents: 0, userId: null };
    entry.sharedChapters += 1;
    friendMap.set(email, entry);
  }

  const sharedEventsByUserId = {};
  let eventCoRows = [];
  if (includeSharedEvents) {
    eventCoRows = Array.from(new Map(
      [...(eventCoMembersRes.data || []), ...(eventCoSignupsRes.data || [])]
        .map((row) => [`${String(row?.event_id || '')}|${String(row?.user_id || '')}`, row])
    ).values());
    for (const row of eventCoRows) {
      if (!row.user_id || !row.event_id) continue;
      if (!sharedEventsByUserId[row.user_id]) sharedEventsByUserId[row.user_id] = new Set();
      sharedEventsByUserId[row.user_id].add(row.event_id);
    }
    for (const context of friendMap.values()) {
      if (context.userId && sharedEventsByUserId[context.userId]) context.sharedEvents = sharedEventsByUserId[context.userId].size;
    }
  }
  const knownUserIds = new Set([...friendMap.values()].map((context) => context.userId).filter(Boolean));
  const newEventFriendIds = includeSharedEvents
    ? [...new Set(eventCoRows.map((row) => row.user_id).filter((uid) => uid && !knownUserIds.has(uid)))]
    : [];

  const emailsMissingId = [...friendMap.entries()].filter(([, context]) => !context.userId).map(([email]) => email);
  const [tripOwnerHandlesRes, tripOwnerHandlesFbRes, handleRowsRes, handleRowsFbRes, newHandlesRes, newHandlesFbRes, chapterOwnerHandlesRes, chapterOwnerHandlesFbRes] = await Promise.all([
    tripOwnerIds.length > 0 ? supabase.from('user_handles').select('email, user_id').in('user_id', tripOwnerIds) : Promise.resolve({ data: [] }),
    tripOwnerIds.length > 0 ? supabase.from('handles').select('email, user_id').in('user_id', tripOwnerIds) : Promise.resolve({ data: [] }),
    emailsMissingId.length > 0 ? supabase.from('user_handles').select('email, user_id').in('email', emailsMissingId) : Promise.resolve({ data: [] }),
    emailsMissingId.length > 0 ? supabase.from('handles').select('email, user_id').in('email', emailsMissingId) : Promise.resolve({ data: [] }),
    newEventFriendIds.length > 0 ? supabase.from('user_handles').select('email, user_id').in('user_id', newEventFriendIds) : Promise.resolve({ data: [] }),
    newEventFriendIds.length > 0 ? supabase.from('handles').select('email, user_id').in('user_id', newEventFriendIds) : Promise.resolve({ data: [] }),
    chapterOwnerIds.length > 0 ? supabase.from('user_handles').select('email, user_id, handle').in('user_id', chapterOwnerIds) : Promise.resolve({ data: [] }),
    chapterOwnerIds.length > 0 ? supabase.from('handles').select('email, user_id, handle').in('user_id', chapterOwnerIds) : Promise.resolve({ data: [] }),
  ]);

  for (const handleRow of dedupeById([...(tripOwnerHandlesRes.data || []), ...(tripOwnerHandlesFbRes.data || [])])) {
    const email = String(handleRow.email || '').toLowerCase().trim();
    if (!email || email === userEmail) continue;
    const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedChapters: 0, sharedEvents: 0, userId: null };
    if (!entry.userId) entry.userId = handleRow.user_id;
    if (handleRow.user_id && tripOwnerIdToName[handleRow.user_id]) {
      const tripName = tripOwnerIdToName[handleRow.user_id];
      if (!entry.trips.includes(tripName)) entry.trips.push(tripName);
    }
    friendMap.set(email, entry);
  }
  for (const row of [...(handleRowsRes.data || []), ...(handleRowsFbRes.data || [])]) {
    const email = String(row.email || '').toLowerCase().trim();
    if (row.user_id && friendMap.has(email) && !friendMap.get(email).userId) friendMap.get(email).userId = row.user_id;
  }
  for (const handleRow of dedupeById([...(newHandlesRes.data || []), ...(newHandlesFbRes.data || [])])) {
    const email = String(handleRow.email || '').toLowerCase().trim();
    if (!email || email === userEmail) continue;
    const entry = friendMap.get(email) || { trips: [], sharedCalendars: 0, sharedChapters: 0, sharedEvents: 0, userId: handleRow.user_id };
    if (!entry.userId) entry.userId = handleRow.user_id;
    if (sharedEventsByUserId[handleRow.user_id]) entry.sharedEvents = sharedEventsByUserId[handleRow.user_id].size;
    friendMap.set(email, entry);
  }
  for (const handleRow of dedupeById([...(chapterOwnerHandlesRes.data || []), ...(chapterOwnerHandlesFbRes.data || [])])) {
    const email = String(handleRow.email || '').toLowerCase().trim();
    const mapKey = email || (handleRow.user_id ? `user:${String(handleRow.user_id).trim()}` : '');
    if (!mapKey || email === userEmail) continue;
    const entry = friendMap.get(mapKey) || { trips: [], sharedCalendars: 0, sharedChapters: 0, sharedEvents: 0, userId: null, email: email || '', handle: String(handleRow.handle || '').trim() };
    if (!entry.userId) entry.userId = handleRow.user_id;
    if (!entry.email && email) entry.email = email;
    if (!entry.handle && handleRow.handle) entry.handle = String(handleRow.handle || '').trim();
    if (chapterOwnerIdSet.has(handleRow.user_id)) entry.sharedChapters += 1;
    friendMap.set(mapKey, entry);
  }

  const friends = [];
  for (const [key, context] of friendMap.entries()) {
    const actualEmail = String(context?.email || '').toLowerCase().trim();
    const handle = String(context?.handle || '').trim()
      || (actualEmail ? ((knownHandlesByEmail || {})[actualEmail] || actualEmail.split('@')[0]) : 'Friend');
    const parts = [];
    if (context.trips.length === 1) parts.push(context.trips[0]);
    else if (context.trips.length > 1) parts.push(`${context.trips.length} trips`);
    if (context.sharedCalendars > 0) parts.push('shared calendar');
    if (context.sharedChapters > 0) parts.push(context.sharedChapters > 1 ? `${context.sharedChapters} shared chapters` : 'shared chapter');
    if (context.sharedEvents > 0) parts.push(`${context.sharedEvents} event${context.sharedEvents === 1 ? '' : 's'}`);
    friends.push({
      email: actualEmail,
      userId: context.userId || null,
      handle,
      displayName: handle,
      avatarUrl: context.userId ? `${supabase.supabaseUrl}/storage/v1/object/public/avatars/${context.userId}/avatar` : '',
      connectionSummary: parts.join(' · ') || 'Connected',
    });
  }
  return friends;
}
