import { useCallback, useMemo } from 'react';

const HOME_DAY_SECTIONS = [
  { key: 'morning', label: 'Morning', emptyTitle: 'Ease into the day', emptyCopy: 'Add breakfast, a workout, or one clear priority.' },
  { key: 'afternoon', label: 'Afternoon', emptyTitle: 'Keep the middle light', emptyCopy: 'Drop in a lunch, meeting, or errand when plans take shape.' },
  { key: 'evening', label: 'Evening', emptyTitle: 'Save space for later', emptyCopy: 'Dinner, downtime, or a night plan can live here.' },
];

export default function useHomeScreenData({
  tabTrips,
  todayTs,
  todayKey,
  userTabEvents,
  popupEventsByEventId,
  popupSignupsByEventId,
  user,
  eventsTabVisibleLayerIds,
  eventsTabHideRecurring,
  events,
  currentUser,
  memories,
  journeyState,
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

    (userTabEvents || []).forEach((event) => {
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
    toDateOnlyTs,
    todayTs,
    user?.id,
    userTabEvents,
  ]);

  const filteredUpcomingUserTabEvents = useMemo(() => (
    upcomingUserTabEvents.filter((event) => {
      const layerId = String(event?.layerId || event?.layer_id || '').trim();
      const eventTs = toDateOnlyTs(event?.date || event?.dateKey || '');
      const upcomingWindowEndTs = todayTs + (13 * 24 * 60 * 60 * 1000);
      if ((eventsTabVisibleLayerIds || []).length > 0 && !eventsTabVisibleLayerIds.includes(layerId)) return false;
      if (eventTs === null || eventTs > upcomingWindowEndTs) return false;
      if (eventsTabHideRecurring && (event?.isAnnual || (event?.recurrence && event.recurrence !== 'once'))) return false;
      return true;
    })
  ), [eventsTabHideRecurring, eventsTabVisibleLayerIds, toDateOnlyTs, todayTs, upcomingUserTabEvents]);

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

  const eligibleMemoryEvents = useMemo(() => (
    Object.values(events || {})
      .flat()
      .filter((event, index, arr) => {
        const eventId = String(event?.id || '').trim();
        if (!eventId) return false;
        return arr.findIndex((candidate) => String(candidate?.id || '').trim() === eventId) === index;
      })
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
    events,
    getHolidayForDate,
    getHolidayNameSet,
    getWeEventDisplayBadge,
    isLikelyHolidayTitle,
    normalizeHolidayLikeTitle,
    popupEventsByEventId,
    popupSignupsByEventId,
    toDateOnlyTs,
    todayTs,
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

  const homeDaySections = useMemo(() => (
    HOME_DAY_SECTIONS.map((section) => ({
      ...section,
      events: overviewTodayEvents.filter((event) => getHomeSectionKeyForEvent(event) === section.key),
    }))
  ), [getHomeSectionKeyForEvent, overviewTodayEvents]);

  const homeTripsPreview = useMemo(() => (
    [...activeTrips, ...upcomingTrips]
      .filter((trip, index, arr) => arr.findIndex((row) => String(row?.id || '') === String(trip?.id || '')) === index)
      .slice(0, 3)
  ), [activeTrips, upcomingTrips]);

  const homeTripsPreviewCards = useMemo(() => (
    homeTripsPreview.map((trip) => ({
      ...trip,
      startDate: String(getSubCalStartRaw(trip) || '').trim(),
      endDate: String(getSubCalEndRaw(trip) || '').trim(),
    }))
  ), [getSubCalEndRaw, getSubCalStartRaw, homeTripsPreview]);

  const homeTodayPlanCount = overviewTodayEvents.length;
  const homeUpcomingEventCount = filteredUpcomingUserTabEvents.length;
  const currentHomeMemoryOwnerId = getPersonalMemoryOwnerId(user?.id);

  const isMemoryOwnedByCurrentUser = useCallback((memory) => {
    const ownerId = String(memory?.ownerUserId || memory?.createdByUserId || '').trim();
    return !ownerId || ownerId === currentHomeMemoryOwnerId;
  }, [currentHomeMemoryOwnerId]);

  const personalMemories = useMemo(() => (
    (Array.isArray(memories) ? memories : []).filter(isMemoryOwnedByCurrentUser)
  ), [isMemoryOwnedByCurrentUser, memories]);

  const homeResolvedMemories = personalMemories;

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

  const homeRecentMemory = useMemo(() => (
    [...homeResolvedMemories]
      .sort((a, b) => Number(new Date(b?.date || b?.createdAt || 0)) - Number(new Date(a?.date || a?.createdAt || 0)))[0] || null
  ), [homeResolvedMemories]);

  const homeMemoryPhotoCount = useMemo(() => (
    homeResolvedMemories.reduce((total, memory) => total + (memory?.photos?.length || 0), 0)
  ), [homeResolvedMemories]);

  const homeMemoryCollagePhotos = useMemo(() => (
    [...homeResolvedMemories]
      .sort((a, b) => Number(new Date(b?.date || b?.createdAt || 0)) - Number(new Date(a?.date || a?.createdAt || 0)))
      .flatMap((memory) => {
        const urls = [];
        const cover = getMemoryPrimaryPhotoUrl(memory);
        if (cover) urls.push(cover);
        (memory?.photos || []).forEach((photo) => {
          const url = String(photo?.url || photo?.photoUrl || '').trim();
          if (url) urls.push(url);
        });
        return urls;
      })
      .filter((url, index, arr) => url && arr.indexOf(url) === index)
      .slice(0, 4)
  ), [getMemoryPrimaryPhotoUrl, homeResolvedMemories]);

  const homeYearStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startOfYearTs = toDateOnlyTs(`${currentYear}-01-01`);
    const endOfYearTs = toDateOnlyTs(`${currentYear}-12-31`);
    const inCurrentYearRange = (value) => {
      const ts = toDateOnlyTs(value);
      return ts !== null && startOfYearTs !== null && endOfYearTs !== null && ts >= startOfYearTs && ts <= endOfYearTs;
    };
    const tripsTakenThisYear = tabTrips.filter((trip) => {
      const startRaw = getSubCalStartRaw(trip);
      const startTs = toDateOnlyTs(startRaw);
      return startTs !== null && startOfYearTs !== null && startTs >= startOfYearTs && startTs <= todayTs;
    });
    const yearEventCount = Object.values(events || {})
      .flat()
      .filter((event, index, arr) => {
        const eventId = String(event?.id || '').trim();
        if (!eventId) return false;
        return arr.findIndex((candidate) => String(candidate?.id || '').trim() === eventId) === index;
      })
      .filter((event) => inCurrentYearRange(event?.date || event?.dateKey || ''))
      .length;
    const yearMemories = homeResolvedMemories.filter((memory) => inCurrentYearRange(memory?.date || memory?.createdAt || ''));
    const yearPhotoCount = yearMemories.reduce((total, memory) => {
      const coverBonus = getMemoryPrimaryPhotoUrl(memory) ? 1 : 0;
      const galleryCount = Array.isArray(memory?.photos) ? memory.photos.filter((photo) => String(photo?.url || photo?.photoUrl || '').trim()).length : 0;
      return total + Math.max(coverBonus, galleryCount);
    }, 0);
    return {
      year: currentYear,
      events: yearEventCount,
      trips: tripsTakenThisYear.length,
      photos: yearPhotoCount,
    };
  }, [events, getMemoryPrimaryPhotoUrl, getSubCalStartRaw, homeResolvedMemories, tabTrips, toDateOnlyTs, todayTs]);

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
        : 'Keep it going today: journal in Journey or add a moment.',
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
    homeRecentMemory,
    homeMemoryPhotoCount,
    homeMemoryCollagePhotos,
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
