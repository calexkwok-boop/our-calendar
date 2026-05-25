import { useCallback, useEffect, useMemo, useRef } from 'react';

const HOME_DAY_SECTIONS = [
  { key: 'morning', label: 'Morning', emptyTitle: 'Ease into the day', emptyCopy: 'Add breakfast, a workout, or one clear priority.' },
  { key: 'afternoon', label: 'Afternoon', emptyTitle: 'Keep the middle light', emptyCopy: 'Drop in a lunch, meeting, or errand when plans take shape.' },
  { key: 'evening', label: 'Evening', emptyTitle: 'Save space for later', emptyCopy: 'Dinner, downtime, or a night plan can live here.' },
];

const hashHomeMemoryRotationKey = (value) => {
  const text = String(value || '');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export default function useHomeScreenData({
  tabTrips,
  todayTs,
  todayKey,
  userTabEvents,
  upcomingPopupEvents,
  popupEventsByEventId,
  popupSignupsByEventId,
  user,
  eventsTabVisibleLayerIds,
  eventsTabHideRecurring,
  events,
  currentUser,
  memories,
  journeyState,
  tripKomoState,
  komoChapters,
  bucketList,
  quickThoughts,
  getSubCalStartRaw,
  getSubCalEndRaw,
  toDateOnlyTs,
  getDateKey,
  getHolidayForDate,
  normalizeHolidayLikeTitle,
  getHolidayNameSet,
  isLikelyHolidayTitle,
  shouldIncludeEventInPersonalOverview,
  getPersonalMemoryOwnerId,
  getMemoryPrimaryPhotoUrl,
  getJourneyGoalType,
}) {
  const upcomingTrips = useMemo(() => (
    [...tabTrips]
      .filter((trip) => {
        const startTs = toDateOnlyTs(getSubCalStartRaw(trip));
        return startTs !== null && startTs > todayTs;
      })
      .sort((a, b) => toDateOnlyTs(getSubCalStartRaw(a)) - toDateOnlyTs(getSubCalStartRaw(b)))
  ), [getSubCalStartRaw, tabTrips, toDateOnlyTs, todayTs]);

  // When userTabEvents hasn't been loaded yet (home tab), derive a flat array
  // from the events state. We include today + 14 days of direct events AND any
  // recurring events from past dates so their virtual occurrences can be generated.
  const eventsHomeFallback = useMemo(() => {
    if (userTabEvents && userTabEvents.length > 0) return null;
    if (!events || Object.keys(events).length === 0) return null;
    const result = [];
    const now = new Date();
    const upcomingKeys = new Set();
    for (let i = 0; i <= 14; i += 1) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(now.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      upcomingKeys.add(key);
      if (events[key]) result.push(...events[key]);
    }
    // Include recurring events from past dates so virtual occurrences for today/future are generated
    for (const [dateKey, dayEvents] of Object.entries(events)) {
      if (upcomingKeys.has(dateKey)) continue;
      for (const ev of dayEvents) {
        const rec = String(ev?.recurrence || (ev?.isAnnual ? 'annual' : 'once')).trim().toLowerCase();
        if (rec !== 'once') result.push(ev);
      }
    }
    return result;
  }, [events, userTabEvents]);

  const upcomingUserTabEvents = useMemo(() => {
    // Home only consumes today's events plus a short upcoming window.
    const horizonDays = 14;
    const isAllDayLike = (event) => {
      const time = String(event?.time || '').trim();
      return !time || time === '00:00' || time === '00:00:00';
    };
    const seenHolidayKeys = new Set();
    const seenEventKeys = new Set();
    const upcomingCandidates = [];
    const addUpcomingEvent = (event) => {
      const dateKey = String(event?.date || event?.dateKey || '').trim();
      const eventId = String(event?.id || '').trim();
      if (!dateKey || !eventId) return;
      const dedupeKey = `${eventId}:${dateKey}`;
      if (seenEventKeys.has(dedupeKey)) return;
      seenEventKeys.add(dedupeKey);
      upcomingCandidates.push({ ...event, date: dateKey });
    };

    const baseEvents = userTabEvents && userTabEvents.length > 0
      ? userTabEvents
      : (eventsHomeFallback || []);

    baseEvents.forEach((event) => {
      const baseDateKey = String(event?.date || event?.dateKey || '').trim();
      const baseTs = toDateOnlyTs(baseDateKey);
      if (baseTs !== null && baseTs >= todayTs) addUpcomingEvent(event);
      const recurrence = String(event?.recurrence || (event?.isAnnual ? 'annual' : 'once')).trim().toLowerCase();
      if (recurrence === 'once' || !baseDateKey || baseTs === null) return;
      const exceptions = Array.isArray(event?.exceptions) ? event.exceptions.map((value) => String(value || '').trim()) : [];
      for (let offset = 0; offset <= horizonDays; offset += 1) {
        const candidate = new Date();
        candidate.setHours(0, 0, 0, 0);
        candidate.setDate(candidate.getDate() + offset);
        const candidateKey = getDateKey(candidate);
        if (candidateKey === baseDateKey || exceptions.includes(candidateKey)) continue;
        if (recurrence === 'annual' || event?.isAnnual) {
          if (Number(event?.annualMonth || 0) === candidate.getMonth() + 1 && Number(event?.annualDay || 0) === candidate.getDate()) {
            addUpcomingEvent({ ...event, date: candidateKey, isVirtualAnnual: true });
          }
          continue;
        }
        const baseDate = new Date(`${baseDateKey}T00:00:00`);
        if (Number.isNaN(baseDate.getTime()) || candidate <= baseDate) continue;
        if (recurrence === 'weekly' && baseDate.getDay() === candidate.getDay()) {
          addUpcomingEvent({ ...event, date: candidateKey, isVirtualRecurrence: true });
        } else if (recurrence === 'monthly' && baseDate.getDate() === candidate.getDate()) {
          addUpcomingEvent({ ...event, date: candidateKey, isVirtualRecurrence: true });
        }
      }
    });

    // Merge in popup events (from popup_event_details) that aren't already present.
    (upcomingPopupEvents || []).forEach((event) => {
      addUpcomingEvent({ ...event, recurrence: 'once', isAnnual: false, isPopup: true });
    });

    return upcomingCandidates
      .filter((event) => {
        const dateKey = String(event?.date || event?.dateKey || '').trim();
        const eventTs = toDateOnlyTs(dateKey);
        if (eventTs === null || eventTs < todayTs) return false;
        const popupEventId = String(event?.id || '').trim();
        const popupMeta = popupEventsByEventId[popupEventId] || null;
        if (popupMeta) {
          const joined = (popupSignupsByEventId[popupEventId] || []).some((row) => (
            String(row?.userId || '').trim() === String(user?.id || '').trim()
          ));
          const createdByMe = String(popupMeta?.createdByUserId || '').trim() === String(user?.id || '').trim();
          if (!joined && !createdByMe) return false;
        }
        const holiday = getHolidayForDate(dateKey);
        const normalizedTitle = normalizeHolidayLikeTitle(event?.title);
        const holidayNames = getHolidayNameSet(holiday);
        const categoryKey = String(event?.category || '').trim().toLowerCase();
        const isHolidayLike = isAllDayLike(event) && (
          Boolean(event?.isHoliday)
          || categoryKey === 'holiday'
          || (normalizedTitle && holidayNames.has(normalizedTitle))
          || (normalizedTitle && isLikelyHolidayTitle(normalizedTitle))
        );
        if (isHolidayLike) {
          const holidayKey = `holiday:${dateKey}`;
          if (seenHolidayKeys.has(holidayKey)) return false;
          seenHolidayKeys.add(holidayKey);
        }
        return true;
      })
      .sort((a, b) => {
        const aTs = toDateOnlyTs(a?.date || a?.dateKey || '') || 0;
        const bTs = toDateOnlyTs(b?.date || b?.dateKey || '') || 0;
        if (aTs !== bTs) return aTs - bTs;
        if (!a?.time) return 1;
        if (!b?.time) return -1;
        return String(a.time).localeCompare(String(b.time));
      });
  }, [
    getDateKey,
    getHolidayForDate,
    getHolidayNameSet,
    isLikelyHolidayTitle,
    normalizeHolidayLikeTitle,
    popupEventsByEventId,
    popupSignupsByEventId,
    eventsHomeFallback,
    toDateOnlyTs,
    todayTs,
    upcomingPopupEvents,
    user?.id,
    userTabEvents,
  ]);

  const visibleLayerIdSet = useMemo(() => (
    new Set((eventsTabVisibleLayerIds || []).map((value) => String(value || '').trim()).filter(Boolean))
  ), [eventsTabVisibleLayerIds]);

  const filteredUpcomingUserTabEvents = useMemo(() => (
    upcomingUserTabEvents.filter((event) => {
      const layerId = String(event?.layerId || event?.layer_id || '').trim();
      const eventTs = toDateOnlyTs(event?.date || event?.dateKey || '');
      const upcomingWindowEndTs = todayTs + (13 * 24 * 60 * 60 * 1000);
      if (visibleLayerIdSet.size > 0 && layerId && !visibleLayerIdSet.has(layerId)) return false;
      if (eventTs === null || eventTs > upcomingWindowEndTs) return false;
      if (eventsTabHideRecurring && (event?.isAnnual || (event?.recurrence && event.recurrence !== 'once'))) return false;
      return true;
    })
  ), [eventsTabHideRecurring, toDateOnlyTs, todayTs, upcomingUserTabEvents, visibleLayerIdSet]);

  const getWeEventDisplayBadge = useCallback((event, popupMeta) => {
    const normalizedCategory = String(event?.category || '').trim().toLowerCase();
    const normalizedSubtype = String(
      event?.popupSubtype
      || event?.popup_subtype
      || event?.event_data?.popupSubtype
      || event?.event_data?.popup_subtype
      || ''
    ).trim().toLowerCase();
    const isWeEventLike = Boolean(popupMeta)
      || normalizedCategory === 'popup_event'
      || ['party', 'celebration', 'hangout', 'kids', 'custom', 'sports'].includes(normalizedCategory)
      || ['party', 'celebration', 'hangout', 'kids', 'custom', 'sports'].includes(normalizedSubtype);
    if (!isWeEventLike) return null;
    const text = [event?.title, event?.description]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
      .join(' ');

    if (/(birthday|holiday|party|potluck|game night|house party|dance)/.test(text)) {
      return { icon: '🥳', label: 'We Event', className: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200' };
    }
    if (/\bwedding\b/.test(text)) {
      return { icon: '💍', label: 'We Event', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' };
    }
    if (/\bbaby shower\b/.test(text)) {
      return { icon: '👶', label: 'We Event', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' };
    }
    if (/(engagement|bridal|graduation|anniversary|celebration)/.test(text)) {
      return { icon: '🎈', label: 'We Event', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' };
    }
    if (/(playdate|kids|child|children|school|family)/.test(text)) {
      return { icon: '🎈', label: 'We Event', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200' };
    }
    if (/\bcoffee\b/.test(text)) {
      return { icon: '☕', label: 'We Event', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200' };
    }
    if (/(brunch|dinner|drinks|movie|hangout|lunch|bbq)/.test(text)) {
      return { icon: '🎉', label: 'We Event', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200' };
    }
    return { icon: '🎉', label: 'We Event', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' };
  }, []);

  const uniqueEvents = useMemo(() => {
    const seenEventIds = new Set();
    const base = (userTabEvents && userTabEvents.length > 0)
      ? userTabEvents
      : Object.values(events || {}).flat();
    return base.filter((event) => {
      const eventId = String(event?.id || '').trim();
      if (!eventId || seenEventIds.has(eventId)) return false;
      seenEventIds.add(eventId);
      return true;
    });
  }, [events, userTabEvents]);

  const eligibleMemoryEvents = useMemo(() => (
    uniqueEvents
      .filter((event) => {
        const dateKey = String(event?.date || event?.dateKey || '').trim();
        const eventTs = toDateOnlyTs(dateKey);
        if (eventTs === null || eventTs >= todayTs) return false;
        const eventId = String(event?.id || '').trim();
        const popupMeta = popupEventsByEventId[eventId] || null;
        const isWeEvent = Boolean(getWeEventDisplayBadge(event, popupMeta));
        const isMeEvent = !popupMeta && !event?.sub_calendar_id && !event?.subCalendarId;
        if (!isWeEvent && !isMeEvent) return false;
        if (popupMeta) {
          const joined = (popupSignupsByEventId[eventId] || []).some((row) => (
            String(row?.userId || '').trim() === String(user?.id || '').trim()
          ));
          const createdByMe = String(popupMeta?.createdByUserId || '').trim() === String(user?.id || '').trim();
          if (!joined && !createdByMe) return false;
        }
        return true;
      })
      .filter((event, index, arr) => {
        const dateKey = String(event?.date || event?.dateKey || '').trim();
        const normalizedTitle = normalizeHolidayLikeTitle(event?.title);
        const holiday = getHolidayForDate(dateKey);
        const holidayNames = getHolidayNameSet(holiday);
        const isHolidayLike = normalizedTitle && (
          holidayNames.has(normalizedTitle)
          || isLikelyHolidayTitle(normalizedTitle)
        );
        if (!isHolidayLike) return true;
        return arr.findIndex((candidate) => {
          const candidateDateKey = String(candidate?.date || candidate?.dateKey || '').trim();
          const candidateTitle = normalizeHolidayLikeTitle(candidate?.title);
          return candidateDateKey === dateKey && candidateTitle === normalizedTitle;
        }) === index;
      })
      .sort((a, b) => {
        const aTs = toDateOnlyTs(a?.date || a?.dateKey || '') || 0;
        const bTs = toDateOnlyTs(b?.date || b?.dateKey || '') || 0;
        if (aTs !== bTs) return bTs - aTs;
        return String(a?.title || '').localeCompare(String(b?.title || ''));
      })
  ), [
    getHolidayForDate,
    getHolidayNameSet,
    getWeEventDisplayBadge,
    isLikelyHolidayTitle,
    normalizeHolidayLikeTitle,
    popupEventsByEventId,
    popupSignupsByEventId,
    toDateOnlyTs,
    todayTs,
    uniqueEvents,
    user?.id,
  ]);

  const activeTrips = useMemo(() => (
    [...tabTrips]
      .filter((trip) => {
        const startTs = toDateOnlyTs(getSubCalStartRaw(trip));
        const endTs = toDateOnlyTs(getSubCalEndRaw(trip));
        return startTs !== null && endTs !== null && todayTs >= startTs && todayTs <= endTs;
      })
      .sort((a, b) => toDateOnlyTs(getSubCalStartRaw(a)) - toDateOnlyTs(getSubCalStartRaw(b)))
  ), [getSubCalEndRaw, getSubCalStartRaw, tabTrips, toDateOnlyTs, todayTs]);

  const archivedTrips = useMemo(() => (
    [...tabTrips]
      .filter((trip) => {
        const endTs = toDateOnlyTs(getSubCalEndRaw(trip));
        return endTs !== null && endTs < todayTs;
      })
      .sort((a, b) => toDateOnlyTs(getSubCalEndRaw(b)) - toDateOnlyTs(getSubCalEndRaw(a)))
  ), [getSubCalEndRaw, tabTrips, toDateOnlyTs, todayTs]);

  const eligibleMemoryTrips = archivedTrips;
  const greetingHour = new Date().getHours();
  const homeGreeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';
  const homeGreetingEmoji = greetingHour < 18 ? '☀️' : '🌙';
  const homeGreetingName = String(currentUser || user?.user_metadata?.handle || user?.user_metadata?.username || user?.email || 'there')
    .trim()
    .split('@')[0];

  const getHomeSectionKeyForEvent = useCallback((event) => {
    const hour = Number(String(event?.time || '').split(':')[0]);
    if (!Number.isFinite(hour)) return 'morning';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }, []);

  const overviewTodayEvents = useMemo(() => (
    upcomingUserTabEvents.filter((event) => {
      const dateKey = String(event?.date || event?.dateKey || '').trim();
      return dateKey === todayKey && !event?.isHoliday && shouldIncludeEventInPersonalOverview(event);
    })
  ), [shouldIncludeEventInPersonalOverview, todayKey, upcomingUserTabEvents]);

  const homeDaySections = useMemo(() => {
    const sectionEvents = { morning: [], afternoon: [], evening: [] };
    overviewTodayEvents.forEach((event) => {
      const key = getHomeSectionKeyForEvent(event);
      if (sectionEvents[key]) sectionEvents[key].push(event);
    });
    return HOME_DAY_SECTIONS.map((section) => ({
      ...section,
      events: sectionEvents[section.key] || [],
    }));
  }, [getHomeSectionKeyForEvent, overviewTodayEvents]);

  const homeTripsPreview = useMemo(() => {
    const seenTripIds = new Set();
    return [...activeTrips, ...upcomingTrips]
      .filter((trip) => {
        const tripId = String(trip?.id || '').trim();
        if (!tripId || seenTripIds.has(tripId)) return false;
        seenTripIds.add(tripId);
        return true;
      })
      .slice(0, 3);
  }, [activeTrips, upcomingTrips]);

  const komoChapterById = useMemo(() => (
    Object.fromEntries((komoChapters || []).map((chapter) => [String(chapter?.id || '').trim(), chapter]))
  ), [komoChapters]);

  const komoBookItemById = useMemo(() => {
    const entries = [
      ...(Array.isArray(bucketList) ? bucketList : []),
      ...(Array.isArray(quickThoughts) ? quickThoughts : []),
    ];
    const itemMap = {};
    entries.forEach((item) => {
      const itemId = String(item?.id || '').trim();
      if (!itemId || itemMap[itemId]) return;
      itemMap[itemId] = {
        id: item?.id,
        photoUrl: item?.photoUrl,
        imageUrl: item?.imageUrl,
      };
    });
    return itemMap;
  }, [bucketList, quickThoughts]);

  const homeTripsPreviewCards = useMemo(() => (
    homeTripsPreview.map((trip) => {
      const tripId = String(trip?.id || '').trim();
      const linkedChapterId = String(tripKomoState?.[tripId]?.chapterId || '').trim();
      const linkedChapter = linkedChapterId ? (komoChapterById[linkedChapterId] || null) : null;
      const chapterItemIds = new Set((linkedChapter?.itemIds || []).map((id) => String(id || '').trim()).filter(Boolean));
      const coverPinId = String(linkedChapter?.cover_pin_id || '').trim();
      const chapterCoverUrl = linkedChapter
        ? (() => {
            if (coverPinId) {
              const coverItem = komoBookItemById[coverPinId] || null;
              const url = String(coverItem?.photoUrl || coverItem?.imageUrl || '').trim();
              if (url) return url;
            }
            for (const itemId of chapterItemIds) {
              const item = komoBookItemById[itemId] || null;
              const url = String(item?.photoUrl || item?.imageUrl || '').trim();
              if (url) return url;
            }
            return '';
          })()
        : '';
      return {
        ...trip,
        startDate: String(getSubCalStartRaw(trip) || '').trim(),
        endDate: String(getSubCalEndRaw(trip) || '').trim(),
        chapterCoverUrl,
      };
    })
  ), [getSubCalEndRaw, getSubCalStartRaw, homeTripsPreview, komoBookItemById, komoChapterById, tripKomoState]);

  const homeTodayPlanCount = overviewTodayEvents.length;
  const homeUpcomingEventCount = filteredUpcomingUserTabEvents.length;
  const currentHomeMemoryOwnerId = getPersonalMemoryOwnerId(user?.id);
  const currentHomeMemoryIdentitySet = useMemo(() => {
    const values = [currentHomeMemoryOwnerId, user?.id, user?.email, currentUser];
    return new Set(values.map((v) => String(v || '').trim().toLowerCase()).filter(Boolean));
  }, [currentHomeMemoryOwnerId, currentUser, user?.email, user?.id]);

  const isMemoryOwnedByCurrentUser = useCallback((memory) => {
    const ownerCandidates = [
      memory?.ownerUserId,
      memory?.createdByUserId,
      memory?.ownerEmail,
      memory?.createdByEmail,
    ].map((v) => String(v || '').trim().toLowerCase()).filter(Boolean);
    if (ownerCandidates.length === 0) return true;
    return ownerCandidates.some((c) => currentHomeMemoryIdentitySet.has(c));
  }, [currentHomeMemoryIdentitySet]);

  const personalMemories = useMemo(() => (
    (Array.isArray(memories) ? memories : []).filter(isMemoryOwnedByCurrentUser)
  ), [isMemoryOwnedByCurrentUser, memories]);

  const homeResolvedMemories = personalMemories;

  const homeMemoryPhotosByMemoryId = useMemo(() => {
    const toDisplayUrl = (url) => {
      const raw = String(url || '').trim();
      if (!raw) return '';
      try {
        const parsed = new URL(raw);
        const renderMarker = '/storage/v1/render/image/public/';
        if (parsed.pathname.startsWith(renderMarker)) {
          return `${parsed.origin}/storage/v1/object/public/${parsed.pathname.slice(renderMarker.length)}`;
        }
      } catch {}
      return raw;
    };

    return Object.fromEntries(homeResolvedMemories.map((memory) => {
      const urls = [];
      const cover = getMemoryPrimaryPhotoUrl(memory);
      if (cover) urls.push(toDisplayUrl(cover));
      (memory?.photos || []).forEach((photo) => {
        const url = String(photo?.url || photo?.photoUrl || '').trim();
        if (url) urls.push(toDisplayUrl(url));
      });
      const uniqueUrls = urls.filter((url, index, arr) => url && arr.indexOf(url) === index);
      return [String(memory?.id || memory?.date || memory?.createdAt || ''), uniqueUrls];
    }));
  }, [getMemoryPrimaryPhotoUrl, homeResolvedMemories]);

  const homeTodaySpotlightEvent = useMemo(() => (
    [...overviewTodayEvents]
      .sort((a, b) => {
        const aTime = String(a?.time || '').trim();
        const bTime = String(b?.time || '').trim();
        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;
        return aTime.localeCompare(bTime);
      })[0] || null
  ), [overviewTodayEvents]);

  const homeUpcomingPreviewEvents = filteredUpcomingUserTabEvents.slice(0, 3);

  const homeTripSpotlight = useMemo(() => (
    [...homeTripsPreviewCards]
      .sort((a, b) => {
        const aStart = String(a?.startDate || '').trim();
        const bStart = String(b?.startDate || '').trim();
        if (!aStart && !bStart) return 0;
        if (!aStart) return 1;
        if (!bStart) return -1;
        return aStart.localeCompare(bStart);
      })[0] || null
  ), [homeTripsPreviewCards]);

  const homeUpcomingTripCountdown = useMemo(() => {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const THRESHOLD_DAYS = 30;
    // Use upcomingTrips (all future trips, not limited to 3) — already sorted by start date
    const nextTrip = upcomingTrips[0] || null;
    if (!nextTrip) return null;
    const startRaw = String(getSubCalStartRaw(nextTrip) || '').trim();
    const startTs = toDateOnlyTs(startRaw);
    const daysUntil = startTs !== null ? Math.round((startTs - todayTs) / MS_PER_DAY) : null;
    if (startTs === null) return null;
    if (daysUntil > THRESHOLD_DAYS || daysUntil < 0) return null;
    // Get cover from homeTripsPreviewCards if this trip is in there
    const previewCard = homeTripsPreviewCards.find((c) => String(c?.id || '') === String(nextTrip?.id || ''));
    const coverUrl = String(previewCard?.chapterCoverUrl || '').trim();
    return {
      trip: nextTrip,
      daysUntil,
      name: String(nextTrip?.name || nextTrip?.title || nextTrip?.tripName || 'Upcoming trip').trim(),
      startDate: startRaw,
      coverUrl,
    };
  }, [upcomingTrips, homeTripsPreviewCards, getSubCalStartRaw, todayTs, toDateOnlyTs]);

  const homeRecentMemory = useMemo(() => (
    [...homeResolvedMemories]
      .sort((left, right) => {
        const leftKey = `${todayKey}:${String(user?.id || 'guest').trim() || 'guest'}:${String(left?.id || left?.date || left?.createdAt || '')}`;
        const rightKey = `${todayKey}:${String(user?.id || 'guest').trim() || 'guest'}:${String(right?.id || right?.date || right?.createdAt || '')}`;
        return hashHomeMemoryRotationKey(leftKey) - hashHomeMemoryRotationKey(rightKey);
      })[0] || null
  ), [homeResolvedMemories, todayKey, user?.id]);

  const homeMemoryPhotoCount = useMemo(() => (
    homeResolvedMemories.reduce((total, memory) => {
      const memoryKey = String(memory?.id || memory?.date || memory?.createdAt || '');
      return total + (homeMemoryPhotosByMemoryId[memoryKey]?.length || 0);
    }, 0)
  ), [homeMemoryPhotosByMemoryId, homeResolvedMemories]);

  const frozenCollageRef = useRef(null);

  const _rawCollagePhotos = useMemo(() => {
    return [...homeResolvedMemories]
      .flatMap((memory) => homeMemoryPhotosByMemoryId[String(memory?.id || memory?.date || memory?.createdAt || '')] || [])
      .filter((url, index, arr) => url && arr.indexOf(url) === index)
      .sort((left, right) => {
        const leftKey = `${todayKey}:${String(user?.id || 'guest').trim() || 'guest'}:${left}`;
        const rightKey = `${todayKey}:${String(user?.id || 'guest').trim() || 'guest'}:${right}`;
        return hashHomeMemoryRotationKey(leftKey) - hashHomeMemoryRotationKey(rightKey);
      })
      .slice(0, 4);
  }, [homeMemoryPhotosByMemoryId, homeResolvedMemories, todayKey, user?.id]);

  // Lock in the first non-empty selection per day+user so later memory updates
  // (trip sync, remote hydration) don't reshuffle the collage mid-render.
  const collageDayKey = `${todayKey}:${String(user?.id || 'guest').trim()}`;
  if (_rawCollagePhotos.length > 0 && frozenCollageRef.current?.dayKey !== collageDayKey) {
    frozenCollageRef.current = { dayKey: collageDayKey, photos: _rawCollagePhotos };
  }

  useEffect(() => {
    if (_rawCollagePhotos.length === 0) return;
    if (frozenCollageRef.current?.dayKey !== collageDayKey) return;
    // Persist so the next visit can preload before Supabase data arrives.
    try { localStorage.setItem(`collage-v1:${collageDayKey}`, JSON.stringify(_rawCollagePhotos)); } catch {}
  }, [_rawCollagePhotos, collageDayKey]);

  // On mount (and whenever auth/day changes), kick off image preloads for yesterday's cached URLs
  // so they're already in the browser cache by the time the collage renders.
  useEffect(() => {
    const uid = String(user?.id || '').trim();
    if (!uid) return;
    try {
      const cached = JSON.parse(localStorage.getItem(`collage-v1:${todayKey}:${uid}`) || '[]');
      if (!Array.isArray(cached) || cached.length === 0) return;
      cached.forEach((url) => {
        if (!url) return;
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      });
    } catch {}
  }, [user?.id, todayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const homeMemoryCollagePhotos =
    frozenCollageRef.current?.dayKey === collageDayKey && frozenCollageRef.current.photos.length > 0
      ? frozenCollageRef.current.photos
      : _rawCollagePhotos;

  const homeCollageMemories = useMemo(() => (
    homeMemoryCollagePhotos.map((url) => {
      if (!url) return null;
      return homeResolvedMemories.find((memory) => {
        const memKey = String(memory?.id || memory?.date || memory?.createdAt || '');
        return (homeMemoryPhotosByMemoryId[memKey] || []).includes(url);
      }) || null;
    })
  ), [homeMemoryCollagePhotos, homeMemoryPhotosByMemoryId, homeResolvedMemories]);

  const homeYearStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startOfYearTs = toDateOnlyTs(`${currentYear}-01-01`);
    const endOfYearTs = toDateOnlyTs(`${currentYear}-12-31`);
    const inCurrentYearRange = (value) => {
      const ts = toDateOnlyTs(value);
      return ts !== null && startOfYearTs !== null && endOfYearTs !== null && ts >= startOfYearTs && ts <= endOfYearTs;
    };
    const countedYearEventKeys = new Set();
    const baseYearEvents = Array.isArray(userTabEvents) && userTabEvents.length > 0
      ? userTabEvents
      : (
        events && Object.keys(events).length > 0
          ? Object.entries(events || {}).flatMap(([dateKey, dayEvents]) => (
              (Array.isArray(dayEvents) ? dayEvents : []).map((event) => ({
                ...event,
                date: String(event?.date || event?.dateKey || dateKey || '').trim(),
              }))
            ))
          : (eventsHomeFallback || [])
      );
    const yearEventCount = [
      ...baseYearEvents,
      ...(Array.isArray(upcomingPopupEvents) ? upcomingPopupEvents : []),
    ].reduce((total, event) => {
      const dateKey = String(event?.date || event?.dateKey || '').trim();
      if (!inCurrentYearRange(dateKey)) return total;
      const eventId = String(event?.id || '').trim();
      const dedupeKey = `${eventId || 'event'}:${dateKey}`;
      if (countedYearEventKeys.has(dedupeKey)) return total;
      countedYearEventKeys.add(dedupeKey);
      return total + 1;
    }, 0);
    const tripsTakenThisYear = tabTrips.filter((trip) => {
      const startRaw = getSubCalStartRaw(trip);
      const startTs = toDateOnlyTs(startRaw);
      return startTs !== null && startOfYearTs !== null && startTs >= startOfYearTs && startTs <= todayTs;
    });
    const yearMemories = homeResolvedMemories.filter((memory) => inCurrentYearRange(memory?.date || memory?.createdAt || ''));
    const yearPhotoCount = yearMemories.reduce((total, memory) => {
      const memoryKey = String(memory?.id || memory?.date || memory?.createdAt || '');
      return total + (homeMemoryPhotosByMemoryId[memoryKey]?.length || 0);
    }, 0);
    return {
      year: currentYear,
      events: yearEventCount,
      trips: tripsTakenThisYear.length,
      photos: yearPhotoCount,
    };
  }, [events, eventsHomeFallback, getSubCalStartRaw, homeMemoryPhotosByMemoryId, homeResolvedMemories, tabTrips, toDateOnlyTs, todayTs, upcomingPopupEvents, userTabEvents]);

  const homeMemoryReadyCount = eligibleMemoryEvents.length;
  const homeMemoryOpportunities = eligibleMemoryEvents.slice(0, 2);

  const homeMomentsThisWeek = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    const dayOfWeek = monday.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(monday.getDate() - daysFromMonday);
    const visibleDateKeys = Array.from({ length: 7 }, (_, index) => {
      const slotDate = new Date(monday);
      slotDate.setDate(monday.getDate() + index);
      return getDateKey(slotDate);
    });
    const visibleDateKeySet = new Set(visibleDateKeys);
    return [...homeResolvedMemories]
      .filter((memory) => {
        const rawDate = String(memory?.date || memory?.createdAt || '').trim();
        const memoryDateKey = rawDate.slice(0, 10);
        return Boolean(memoryDateKey) && visibleDateKeySet.has(memoryDateKey);
      })
      .sort((a, b) => {
        const aIndex = visibleDateKeys.indexOf(String(a?.date || a?.createdAt || '').trim().slice(0, 10));
        const bIndex = visibleDateKeys.indexOf(String(b?.date || b?.createdAt || '').trim().slice(0, 10));
        if (aIndex !== bIndex) return aIndex - bIndex;
        return Number(new Date(a?.createdAt || a?.date || 0)) - Number(new Date(b?.createdAt || b?.date || 0));
      })
      .map((memory) => ({
        ...memory,
        id: String(memory?.id || ''),
        title: String(memory?.title || 'Untitled memory').trim(),
        date: String(memory?.date || memory?.createdAt || '').trim().slice(0, 10),
        photoUrl: getMemoryPrimaryPhotoUrl(memory),
      }))
      .filter((memory) => memory.id && memory.photoUrl);
  }, [getDateKey, getMemoryPrimaryPhotoUrl, homeResolvedMemories]);

  const homeOnThisDayMemory = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();
    const currentYear = today.getFullYear();
    const match = [...homeResolvedMemories]
      .filter((memory) => {
        const rawDate = String(memory?.date || '').trim();
        if (!rawDate) return false;
        const date = new Date(rawDate);
        return !Number.isNaN(date.getTime())
          && date.getMonth() === month
          && date.getDate() === day
          && date.getFullYear() < currentYear
          && getMemoryPrimaryPhotoUrl(memory);
      })
      .sort((a, b) => Number(new Date(b?.date || 0)) - Number(new Date(a?.date || 0)))[0];
    if (!match) return null;
    const matchDate = new Date(match.date);
    const yearsAgo = Math.max(1, currentYear - matchDate.getFullYear());
    return {
      id: String(match?.id || ''),
      title: String(match?.title || 'Untitled memory').trim(),
      date: String(match?.date || '').trim(),
      photoUrl: getMemoryPrimaryPhotoUrl(match),
      yearsAgo,
      label: 'On This Day',
    };
  }, [getMemoryPrimaryPhotoUrl, homeResolvedMemories]);

  const sortedJourneyGoals = useMemo(() => (
    [...(journeyState?.goals || [])].sort((a, b) => {
      const aPinned = a?.pinned ? 0 : 1;
      const bPinned = b?.pinned ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      return Number(new Date(b?.updatedAt || b?.createdAt || 0)) - Number(new Date(a?.updatedAt || a?.createdAt || 0));
    })
  ), [journeyState?.goals]);

  const journeyGoalById = useMemo(() => (
    Object.fromEntries(sortedJourneyGoals.map((goal) => [String(goal?.id || ''), goal]))
  ), [sortedJourneyGoals]);

  const homeReflectionStats = useMemo(() => {
    const reflectedDateKeys = new Set([
      ...(journeyState?.entries || [])
        .filter((entry) => {
          const goal = journeyGoalById[String(entry?.goalId || '')] || null;
          return getJourneyGoalType(goal) === 'journal';
        })
        .map((entry) => String(entry?.entryDate || String(entry?.createdAt || '').slice(0, 10)).trim())
        .filter(Boolean),
      ...homeResolvedMemories
        .map((memory) => String(memory?.date || memory?.createdAt || '').trim().slice(0, 10))
        .filter(Boolean),
    ]);
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (true) {
      const key = getDateKey(cursor);
      if (!reflectedDateKeys.has(key)) {
        if (streak === 0) {
          cursor.setDate(cursor.getDate() - 1);
          const yesterdayKey = getDateKey(cursor);
          if (reflectedDateKeys.has(yesterdayKey)) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
            continue;
          }
        }
        break;
      }
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const completedToday = reflectedDateKeys.has(getDateKey(new Date()));
      return {
        streak,
        completedToday,
        helpText: completedToday
          ? 'Streak counted today. Come back tomorrow to keep it going.'
          : '',
      };
  }, [getDateKey, getJourneyGoalType, homeResolvedMemories, journeyGoalById, journeyState?.entries]);

  return {
    upcomingTrips,
    upcomingUserTabEvents,
    filteredUpcomingUserTabEvents,
    getWeEventDisplayBadge,
    eligibleMemoryEvents,
    activeTrips,
    archivedTrips,
    eligibleMemoryTrips,
    overviewTodayEvents,
    homeDaySections,
    homeGreeting,
    homeGreetingEmoji,
    homeGreetingName,
    homeTripsPreviewCards,
    homeTodayPlanCount,
    homeUpcomingEventCount,
    personalMemories,
    homeResolvedMemories,
    homeTodaySpotlightEvent,
    homeUpcomingPreviewEvents,
    homeTripSpotlight,
    homeUpcomingTripCountdown,
    homeRecentMemory,
    homeMemoryPhotoCount,
    homeMemoryCollagePhotos,
    homeCollageMemories,
    homeYearStats,
    homeMemoryReadyCount,
    homeMemoryOpportunities,
    homeMomentsThisWeek,
    homeOnThisDayMemory,
    sortedJourneyGoals,
    journeyGoalById,
    homeReflectionStats,
  };
}
