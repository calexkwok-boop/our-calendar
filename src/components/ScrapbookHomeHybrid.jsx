import React, { useState } from 'react';
import {
  Camera,
  Clock,
  Heart,
  Plus,
  Sparkles,
  Trash2,
  BookOpen,
} from 'lucide-react';
import QuickThoughtsSection from './QuickThoughtsSection';
import { getDestinationImageOverride } from '../data/destinationImageOverrides';

const areShallowArraysEqual = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const areShallowObjectsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
};

const areHomePropsEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of nextKeys) {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    if (typeof prevValue === 'function' && typeof nextValue === 'function') continue;
    if (Array.isArray(prevValue) || Array.isArray(nextValue)) {
      if (!areShallowArraysEqual(prevValue, nextValue)) return false;
      continue;
    }
    if (
      prevValue && nextValue
      && typeof prevValue === 'object'
      && typeof nextValue === 'object'
    ) {
      if (!areShallowObjectsEqual(prevValue, nextValue)) return false;
      continue;
    }
    if (prevValue !== nextValue) return false;
  }

  return true;
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDisplayTime = (value) => {
  if (!value) return 'Anytime';
  const parts = String(value).split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return String(value);
  const displayHours = ((hours + 11) % 12) + 1;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const hashHomeShuffleKey = (value) => {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getVisualPreviewUrl = (item) => String(
  item?.coverPhoto || item?.photoUrl || item?.photos?.[0]?.url || ''
).trim();

const getOnYourMindImageUrl = (dream) => {
  const sourceType = String(dream?.type || dream?.sourceType || '').trim().toLowerCase();
  const category = String(dream?.category || dream?.categoryId || '').trim().toLowerCase();
  const isDestinationDream = sourceType === 'destinations' || category === 'travel';
  if (!isDestinationDream) return String(dream?.photoUrl || dream?.imageUrl || '').trim();
  return getDestinationImageOverride({
    id: dream?.id,
    name: dream?.text,
    destination_name: dream?.text,
    title: dream?.text,
    cardTitle: dream?.text,
  }) || String(dream?.photoUrl || dream?.imageUrl || '').trim();
};

const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysOfWeek = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  const dayOfWeek = monday.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(monday.getDate() - daysFromMonday);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateKey = toLocalDateKey(date);
    const todayKey = toLocalDateKey(today);
    return {
      label: days[date.getDay()],
      isToday: dateKey === todayKey,
      dayIndex: date.getDay(),
      dateKey,
    };
  });
};

const ScrapbookHomeHybrid = ({
  darkMode = false,
  greeting = 'Good day',
  greetingName = 'there',
  greetingEmoji = '',
  todayLabel = '',

  // Year stats for header
  yearStats = { year: new Date().getFullYear(), events: 0, trips: 0, photos: 0, streak: 0, streakHelpText: '' },

  // Moments / Photo of the Day
  momentsThisWeek = [],
  onCaptureQuickMoment,
  onAddMomentForDate,
  onOpenMemory,
  onDeleteMoment,
  onConfirmAction,

  // What's Next Today (current)
  todaySpotlightEvent = null,
  onOpenTodayEvent = () => {},

  // Coming Up This Week (current)
  upcomingPreviewEvents = [],
  onAddEvent = () => {},
  onOpenUpcoming,
  tripSpotlight = null,
  onOpenTripsTab,
  onStartTrip,

  // Quick Thoughts (NEW - scrapbook enhanced)
  quickThoughts = [],
  onAddThought,
  onDeleteThought,

  // Memories
  recentMemory = null,
  memoryCollagePhotos = [],
  memoryReadyCount = 0,
  memoryPhotoCount = 0,
  memoryOpportunities = [],
  onOpenMemories,
  onCreateMemoryFromEvent,

  // Journey (mini card)
  primaryJourneyGoal = null,
  primaryJourneyProgressText = '',
  primaryJourneyStreak = 0,
  primaryJourneyLoggedToday = false,
  onOpenJourney,
  onOpenExplore,

  // Someday List (NEW - scrapbook enhanced)
  bucketList = [],
  onAddDream,
  onPlanFromDream,
  onDeleteDream,
  onOpenSomeday,

  // Theme
  themeAccentHeadingStyle,
  themeAccentEllieChipButtonStyle,
  themeAccentTextStyle,

  // Friends' daily photos strip
  friendsDailyPhotos = [],
  onOpenFriendPhoto,
  onOpenFriendProfile,

  // Account / avatar
  profilePhotoUrl = '',
  profileBadgeCount = 0,
  onOpenAccountMenu,
  onEditProfilePhoto,
}) => {
  const momentTapRef = React.useRef(null);
  const todaySpotlightPhoto = getVisualPreviewUrl(todaySpotlightEvent);
  const tripSpotlightTitle = String(
    tripSpotlight?.name || tripSpotlight?.title || tripSpotlight?.tripName || ''
  ).trim();
  const tripSpotlightLocation = String(
    tripSpotlight?.weather_location || tripSpotlight?.location || tripSpotlight?.destination || ''
  ).trim();
  const tripSpotlightHeading = tripSpotlightTitle || tripSpotlightLocation || 'Your next destination';
  const tripSpotlightLocationLine = (
    tripSpotlightLocation
    && tripSpotlightLocation.toLowerCase() !== tripSpotlightHeading.toLowerCase()
  ) ? tripSpotlightLocation : '';
  const tripSpotlightImage = String(tripSpotlight?.chapterCoverUrl || '').trim();

  const [avatarImgError, setAvatarImgError] = useState(false);

  const todayKey = toLocalDateKey(new Date());
  const komoShuffleSeedRef = React.useRef(`komo-home-${Date.now()}-${Math.random()}`);
  const todayMoment = momentsThisWeek.find(
    (m) => String(m?.date || '').trim().slice(0, 10) === todayKey
  ) || null;
  const shuffledBucketList = React.useMemo(() => (
    [...bucketList].sort((left, right) => {
      const leftKey = `${komoShuffleSeedRef.current}:${String(left?.id || left?.text || '')}`;
      const rightKey = `${komoShuffleSeedRef.current}:${String(right?.id || right?.text || '')}`;
      return hashHomeShuffleKey(leftKey) - hashHomeShuffleKey(rightKey);
    })
  ), [bucketList]);

  return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-slate-950 p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');

        .font-handwritten { font-family: 'Caveat', cursive; }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .paper-texture {
          background-image:
            repeating-linear-gradient(0deg, rgba(0,0,0,.02) 0px, transparent 1px, transparent 2px, rgba(0,0,0,.02) 3px),
            repeating-linear-gradient(90deg, rgba(0,0,0,.02) 0px, transparent 1px, transparent 2px, rgba(0,0,0,.02) 3px);
        }
        .dark .paper-texture {
          background-image:
            linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0)),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.035) 3px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.03) 3px);
          background-blend-mode: screen, normal, normal;
        }

        .sticky-note {
          box-shadow:
            0 4px 6px rgba(0,0,0,0.1),
            inset 0 -2px 4px rgba(0,0,0,0.05);
          transform: rotate(-2deg);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sticky-note:nth-child(even) {
          transform: rotate(1.5deg);
        }
        .sticky-note:hover {
          transform: rotate(0deg) translateY(-4px) !important;
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          z-index: 10;
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-6 rounded-[36px] border border-black/5 dark:border-white/8 bg-white/35 dark:bg-white/[0.03] p-3 sm:p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">

        {/* SCRAPBOOK HEADER */}
        <div className="relative overflow-hidden rounded-[32px] border-2 border-amber-900/20 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-5 pb-5 pt-9 sm:px-10 sm:pb-8 sm:pt-10 shadow-2xl paper-texture">
          {/* Profile avatar button */}
          {typeof onOpenAccountMenu === 'function' && (
            <div className="absolute left-3 top-3 sm:left-4 sm:top-4 z-10">
              <div className="relative">
                <button
                  type="button"
                  onClick={onOpenAccountMenu}
                  title="Account"
                >
                  {profilePhotoUrl && !avatarImgError ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-white/40 dark:border-white/10"
                      onError={() => setAvatarImgError(true)}
                      fetchpriority="high"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/40 dark:border-white/10 bg-gradient-to-br from-violet-400 via-purple-400 to-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                      {String(greetingName || '?').trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                {profileBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-md dark:border-gray-900">
                    {profileBadgeCount > 99 ? '99+' : profileBadgeCount}
                  </span>
                )}
                {typeof onEditProfilePhoto === 'function' && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditProfilePhoto();
                    }}
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white shadow dark:border-gray-600 dark:bg-gray-800"
                    title="Change profile photo"
                  >
                    <Camera className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="relative">
            <h1 className="font-handwritten text-4xl sm:text-6xl text-gray-900 dark:text-white mb-2 leading-tight pl-8 sm:pl-0">
              {greeting}, {greetingName} {greetingEmoji}
            </h1>
            {todayLabel ? (
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-900/55 dark:text-amber-100/55">
                {todayLabel}
              </div>
            ) : null}
          </div>
        </div>

        {/* WHAT'S NEXT TODAY */}
        <div
          className="w-full rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
        >
          <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400 mb-3">
            ☀️ WHAT'S NEXT TODAY
          </div>
          {todaySpotlightEvent ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => onOpenTodayEvent?.(todaySpotlightEvent)}
                className="w-full flex gap-4 rounded-2xl px-1 py-1 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              >
                {todaySpotlightPhoto && (
                  <div
                    className="w-24 h-24 rounded-2xl bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${todaySpotlightPhoto})` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {todaySpotlightEvent.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {formatDisplayTime(todaySpotlightEvent.time)}
                    {todaySpotlightEvent.location && ` · ${todaySpotlightEvent.location}`}
                  </div>
                </div>
              </button>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onAddEvent}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold font-handwritten text-white shadow-[0_10px_24px_rgba(139,92,246,0.24)] transition-transform hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 52%, #f97316 100%)' }}
                >
                  <Plus className="w-4 h-4" />
                  Add something
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Your day is wide open ✨
              </p>
              <button
                type="button"
                onClick={onAddEvent}
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold font-handwritten text-white shadow-[0_10px_24px_rgba(139,92,246,0.24)] transition-transform hover:scale-[1.01]"
                style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 52%, #f97316 100%)' }}
              >
                <Plus className="w-4 h-4" />
                Add something
              </button>
            </div>
          )}
        </div>

        {/* PHOTO OF THE DAY */}
        <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-purple-50/60 via-white/90 to-pink-50/60 dark:from-purple-950/30 dark:via-slate-900/80 dark:to-pink-950/20 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-pink-500 dark:text-pink-300" />
              <h3 className="font-handwritten text-2xl text-gray-700 dark:text-gray-300">
                Photo of the Day
              </h3>
            </div>
            {yearStats.streak > 0 && (
              <div className="text-xs text-pink-500 dark:text-pink-300 font-medium">
                🔥 {yearStats.streak} day streak
              </div>
            )}
          </div>

          {todayMoment ? (
            <div className="flex justify-center">
              <div
                className="bg-white dark:bg-slate-100 rounded-sm shadow-xl p-3 pb-0 w-full max-w-sm relative"
                style={{ transform: 'rotate(-0.8deg)' }}
              >
                <button
                  onClick={() => onOpenMemory?.(todayMoment)}
                  className="w-full"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-[2px]">
                    {todayMoment.photoUrl ? (
                      <img
                        src={todayMoment.photoUrl}
                        alt="Today's moment"
                        className="h-full w-full object-cover"
                        fetchpriority="high"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-violet-100 via-rose-50 to-amber-100 dark:from-violet-900/30 dark:via-slate-900 dark:to-amber-900/20 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-pink-400/60" />
                      </div>
                    )}
                  </div>
                  <div className="py-4 px-2 text-center">
                    <p className="font-handwritten text-xl text-gray-700" style={{ fontFamily: "'Caveat', cursive" }}>
                      {todayMoment.title || todayMoment.note || formatDisplayDate(todayMoment.date)}
                    </p>
                  </div>
                </button>
                {onDeleteMoment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMoment?.(todayMoment);
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 rounded-full bg-white/90 p-1 shadow-sm hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (typeof onAddMomentForDate === 'function') {
                  onAddMomentForDate(todayKey);
                } else {
                  onCaptureQuickMoment?.();
                }
              }}
              className="w-full flex flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-pink-200 dark:border-pink-700/40 py-14 bg-gradient-to-br from-violet-100/70 via-rose-50/80 to-amber-100/60 dark:from-violet-900/20 dark:via-slate-900/70 dark:to-pink-950/20 hover:from-violet-100 hover:via-rose-50 hover:to-pink-100 dark:hover:from-violet-900/30 dark:hover:via-slate-900/80 dark:hover:to-pink-950/30 transition-colors"
            >
              <div className="rounded-full bg-white/80 dark:bg-white/[0.06] p-4 shadow-sm">
                <Camera className="w-8 h-8 text-pink-500 dark:text-pink-300" />
              </div>
              <p className="font-handwritten text-2xl text-gray-700 dark:text-gray-200">
                Capture today's moment
              </p>
              <p className="text-xs text-pink-500/80 dark:text-pink-300/70">
                Add a photo that captures your day
              </p>
            </button>
          )}

          {/* Friends' daily photos strip */}
          {friendsDailyPhotos.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-2 px-1">
                Friends today
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {friendsDailyPhotos.map((friend) => (
                  <button
                    key={friend.userId}
                    type="button"
                    onClick={() => onOpenFriendPhoto ? onOpenFriendPhoto(friend) : onOpenFriendProfile?.({ userId: friend.userId })}
                    className="flex-shrink-0 flex flex-col items-center gap-1 active:opacity-70 transition-opacity"
                  >
                    <div
                      className="bg-white dark:bg-slate-100 rounded-sm shadow-md p-1.5 pb-0"
                      style={{ transform: `rotate(${friend.userId.charCodeAt(0) % 2 === 0 ? '-1.5deg' : '1.5deg'})` }}
                    >
                      <div className="w-16 h-16 overflow-hidden rounded-[2px]">
                        <img
                          src={friend.photoUrl}
                          alt={friend.handle}
                          className="w-full h-full object-cover"
                          decoding="async"
                        />
                      </div>
                      <p
                        className="text-[9px] text-gray-500 text-center py-1.5 px-0.5 truncate w-16"
                        style={{ fontFamily: "'Caveat', cursive" }}
                      >
                        {friend.handle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COMING UP THIS WEEK */}
        <div className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onOpenUpcoming}
              className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400 active:opacity-70 transition-opacity text-left"
            >
              📅 COMING UP THIS WEEK
            </button>
            {upcomingPreviewEvents.length > 3 && (
              <button
                onClick={onOpenUpcoming}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                See all
              </button>
            )}
          </div>

          {upcomingPreviewEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingPreviewEvents.slice(0, 3).map((event, idx) => (
                <div
                  key={idx}
                  onClick={onOpenUpcoming}
                  className="flex items-center gap-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-3 cursor-pointer active:opacity-70 transition-opacity"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDisplayDate(event.date)} · {formatDisplayTime(event.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-600 dark:text-gray-400 italic">
              Nothing planned yet
            </div>
          )}
        </div>

        {/* YOUR NEXT ADVENTURE */}
        <button
          type="button"
          onClick={tripSpotlight ? onOpenTripsTab : onStartTrip}
          className="w-full rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
        >
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
            Your Next Adventure
          </div>
          {tripSpotlight ? (
            <div className="overflow-hidden rounded-[18px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-white/[0.05]">
              <div className="relative h-[152px] w-full bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100 dark:from-sky-900/40 dark:via-slate-900 dark:to-emerald-900/30">
                {tripSpotlightImage && (
                  <img
                    src={tripSpotlightImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.45),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.22),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
                {tripSpotlightImage && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/5" />
                )}
                <div className="absolute inset-x-0 bottom-0 px-4 py-4">
                  <div className={`font-handwritten truncate text-2xl font-bold ${tripSpotlightImage ? 'text-white drop-shadow' : 'text-gray-900 dark:text-white'}`}>
                    {tripSpotlightHeading}
                  </div>
                  {tripSpotlightLocationLine && (
                    <div className={`mt-0.5 truncate text-xs font-medium ${tripSpotlightImage ? 'text-white/90 drop-shadow' : 'text-gray-800/85 dark:text-gray-200/85'}`}>
                      {tripSpotlightLocationLine}
                    </div>
                  )}
                  <div className={`mt-1 truncate text-xs ${tripSpotlightImage ? 'text-white/85 drop-shadow' : 'text-gray-700/80 dark:text-gray-300'}`}>
                    {formatDisplayDate(tripSpotlight.startDateLabel || tripSpotlight.startDate || tripSpotlight.start)} - {formatDisplayDate(tripSpotlight.endDateLabel || tripSpotlight.endDate || tripSpotlight.end)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[152px] flex-col items-start justify-between rounded-[18px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-4 dark:from-sky-900/30 dark:via-slate-900 dark:to-emerald-900/20">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Where do you want to go?</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Plan a trip and it will show up here as your next adventure.
                </div>
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                style={themeAccentEllieChipButtonStyle}
              >
                <Plus className="h-3.5 w-3.5" />
                Plan trip
              </div>
            </div>
          )}
        </button>

        {/* ON YOUR MIND (formerly Your Komo Book) */}
        <div className="rounded-[28px] border-2 border-emerald-900/20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-cyan-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onOpenSomeday}
              className="flex items-center gap-2 text-left active:opacity-70 transition-opacity"
            >
              <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-handwritten text-3xl text-gray-950 dark:text-white">
                On your mind
              </h3>
            </button>
            <button
              onClick={onAddDream}
              className="rounded-full p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {shuffledBucketList.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pl-0.5 pr-5 scrollbar-hide snap-x snap-mandatory [touch-action:pan-x]">
              {shuffledBucketList.slice(0, 4).map((dream, idx) => (
                (() => {
                  const dreamImageUrl = getOnYourMindImageUrl(dream);
                  return (
                <div
                  key={dream.id || idx}
                  className="group flex-shrink-0 snap-start w-40 sm:w-48 cursor-pointer"
                  style={{ rotate: `${idx % 2 === 0 ? '-1.4deg' : '1.1deg'}` }}
                  onClick={onOpenSomeday}
                >
                  {dreamImageUrl ? (
                    <div className="bg-white dark:bg-slate-100 rounded-sm shadow-lg p-2 pb-0 transition-all group-hover:shadow-xl group-hover:-translate-y-0.5">
                      <div className="aspect-square w-full overflow-hidden rounded-[3px]">
                        <img
                          src={dreamImageUrl}
                          alt={dream.text}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="px-1 py-3 text-center">
                        <div className="font-handwritten text-base leading-tight text-gray-600 line-clamp-2">
                          {dream.emoji} {dream.text}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[216px] flex-col justify-between rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 text-left shadow-lg transition-all group-hover:-translate-y-0.5 group-hover:bg-white/90 group-hover:shadow-xl dark:border-white/10 dark:bg-black/20 dark:group-hover:bg-black/40">
                      <span className="text-4xl">{dream.emoji}</span>
                      <span className="font-handwritten text-2xl leading-tight text-gray-900 dark:text-white line-clamp-4">
                        {dream.text}
                      </span>
                    </div>
                  )}
                  {onDeleteDream && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDream(dream);
                      }}
                      className="mx-auto mt-2 flex rounded-full bg-white/80 p-1 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100 dark:bg-black/40 dark:hover:bg-red-900/50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      </button>
                    )}
                </div>
                  );
                })()
              ))}
              {/* Discover more polaroid */}
              <div
                className="flex-shrink-0 snap-start w-40 sm:w-48 cursor-pointer"
                style={{ rotate: '1.2deg' }}
                onClick={onOpenExplore}
              >
                <div className="flex min-h-[216px] flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 bg-white/60 dark:bg-black/20 p-4 transition-all hover:-translate-y-0.5 hover:bg-white/90 dark:hover:bg-black/40">
                  <span className="text-3xl">✨</span>
                  <span className="font-handwritten text-xl leading-tight text-center text-emerald-700 dark:text-emerald-400">
                    Discover more
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="font-handwritten text-2xl text-gray-600 dark:text-gray-400 italic mb-4">
                Not sure where to start?
              </p>
              <button
                onClick={onOpenExplore}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-handwritten text-xl bg-emerald-200 dark:bg-emerald-900/50 text-gray-900 dark:text-white hover:bg-emerald-300 dark:hover:bg-emerald-900/70 transition-colors"
              >
                Explore ideas
              </button>
            </div>
          )}
        </div>

        {/* 2026 SO FAR */}
        <div className="rounded-[24px] border border-amber-900/10 bg-white/70 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-black/20 sm:px-6 sm:py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900/55 dark:text-amber-100/55">
            {(yearStats.year || new Date().getFullYear())} so far
          </div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-200 sm:text-base">
            {yearStats.events} events · {yearStats.trips} trips · {yearStats.photos} photos
          </div>
          {yearStats.streakHelpText ? (
            <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {yearStats.streakHelpText}
            </div>
          ) : null}
        </div>

        {/* MEMORIES - Daily rotating collage 2x2 */}
        <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-purple-50/60 via-white/90 to-pink-50/60 dark:from-purple-950/30 dark:via-slate-900/80 dark:to-pink-950/20 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
              Memories
            </div>
            <button
              onClick={onOpenMemories}
              className="font-handwritten rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-3 py-1.5 text-lg font-bold leading-none text-gray-700 dark:text-gray-100"
            >
              Open gallery
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(memoryCollagePhotos.length > 0 ? memoryCollagePhotos : ['', '', '', '']).slice(0, 4).map((url, index) => (
              <div
                key={`memory-collage-${index}`}
                className="h-36 sm:h-44 rounded-[14px] border border-white/40 dark:border-white/10 bg-gradient-to-br from-violet-100 via-rose-50 to-amber-100 dark:from-violet-900/30 dark:via-slate-900 dark:to-amber-900/20 bg-cover bg-center"
                style={url ? { backgroundImage: `url(${url})` } : undefined}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{memoryReadyCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">moments</div>
            </div>
            <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{memoryPhotoCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">photos living in memories</div>
            </div>
          </div>

          {memoryOpportunities.length > 0 && (
            <div className="mt-4 space-y-2">
              {memoryOpportunities.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatDisplayDate(event.date)}
                      </div>
                    </div>
                    <button
                      onClick={() => onCreateMemoryFromEvent?.(event)}
                      className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold"
                      style={themeAccentEllieChipButtonStyle}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <QuickThoughtsSection
          quickThoughts={quickThoughts}
          onAddThought={onAddThought}
          onDeleteThought={onDeleteThought}
          onOpenSomeday={onOpenSomeday}
          darkMode={darkMode}
        />

      </div>
    </div>
  );
};

export default React.memo(ScrapbookHomeHybrid, areHomePropsEqual);
