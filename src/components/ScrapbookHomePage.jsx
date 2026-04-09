import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  Clock,
  Compass,
  Heart,
  Plane,
  Plus,
  Sparkles,
  Trophy,
} from 'lucide-react';

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

const getMemoryCover = (memory) => String(
  memory?.coverPhoto
  || memory?.photos?.[0]?.url
  || ''
).trim();

const getVisualPreviewUrl = (item) => String(
  item?.coverPhoto
  || item?.photoUrl
  || item?.photo_url
  || item?.imageUrl
  || item?.image_url
  || item?.thumbnailUrl
  || item?.thumbnail_url
  || item?.photos?.[0]?.url
  || item?.photos?.[0]?.photoUrl
  || ''
).trim();

const getDaysOfWeek = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(today.getDate() - 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    const todayKey = today.toISOString().slice(0, 10);
    return {
      label: days[date.getDay()],
      isToday: dateKey === todayKey,
      dayIndex: date.getDay(),
      dateKey,
    };
  });
};

const ScrapbookHomePage = ({
  darkMode = false,
  greeting = 'Good day',
  greetingName = 'there',
  greetingEmoji = '',
  todayLabel = '',
  tripsPreview = [],
  activeTripIds = [],
  recentMemory = null,
  memoryCount = 0,
  memoryPhotoCount = 0,
  memoryReadyCount = 0,
  memoryOpportunities = [],
  primaryJourneyGoal = null,
  primaryJourneyProgressText = '',
  primaryJourneyStreak = 0,
  primaryJourneyLoggedToday = false,
  upcomingEventCount = 0,
  momentsThisWeek = [], // Array of { date, photoUrl, title, id }
  onThisDayMemory = null, // { date, photoUrl, title, id, yearsAgo, label }
  todaySpotlightEvent = null,
  upcomingPreviewEvents = [],
  tripSpotlight = null,
  memoryCollagePhotos = [],
  onShowCalendarView,
  onAddEvent,
  onOpenUpcoming,
  onOpenTrip,
  onOpenTripsTab,
  onStartTrip,
  onOpenMemories,
  onOpenMemory,
  onCreateMemoryFromEvent,
  onOpenJourney,
  onOpenExplore,
  onCaptureQuickMoment,
  themeAccentHeadingStyle,
  themeAccentEllieChipButtonStyle,
  themeAccentTextStyle,
  themeAccentBorder,
}) => {
  const activeTripIdSet = new Set((activeTripIds || []).map((value) => String(value || '')));
  const hasAnythingToShow = tripsPreview.length > 0 || memoryCount > 0;
  const memoryCover = getMemoryCover(recentMemory);
  const todaySpotlightPhoto = getVisualPreviewUrl(todaySpotlightEvent);

  return (
    <>
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="space-y-4 mb-4">
      {!hasAnythingToShow && (
        <div className="glass-panel rounded-[24px] border border-white/50 dark:border-white/10 p-5">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">Start your scrapbook</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Add one event, start one trip, or save one memory and the page will begin to feel like your story.
          </div>
        </div>
      )}

      <div className="rounded-[30px] border border-white/50 dark:border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,247,237,0.94),rgba(240,249,255,0.94))] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94),rgba(23,37,84,0.92))] p-4 sm:p-5 shadow-xl">
        <div className="max-w-2xl">
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold leading-tight" style={themeAccentHeadingStyle}>
            {greeting}, {greetingName} {greetingEmoji}
          </h2>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">{todayLabel}</div>
          <p className="mt-3 max-w-xl text-sm sm:text-[15px] text-gray-600 dark:text-gray-300">
            Your plans, trips, milestones, and memories all live here like chapters in the same story.
          </p>
        </div>

        {/* Moments This Week - Polaroid film strip */}
        <div className="mt-6 rounded-[28px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-white/95 via-amber-50/40 to-white/90 dark:from-slate-900/80 dark:via-amber-900/10 dark:to-slate-900/75 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-700 dark:text-gray-300">Moments This Week</h3>
            </div>
            {momentsThisWeek.length > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{momentsThisWeek.length} captured</div>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {getDaysOfWeek().map((day) => {
              const momentForDay = momentsThisWeek.find(m => {
                const momentDate = String(m?.date || '').trim().slice(0, 10);
                return momentDate === day.dateKey;
              });
              const handleMomentSlotPress = (event) => {
                if (event?.stopPropagation) event.stopPropagation();
                if (momentForDay) {
                  onOpenMemory?.(momentForDay);
                  return;
                }
                onCaptureQuickMoment?.(day.dateKey);
              };

              return (
                <div
                  key={day.label}
                  className="flex-shrink-0 w-28 group"
                >
                  <div
                    className={`relative block w-full rounded-lg overflow-hidden transition-all ${
                      momentForDay
                        ? 'bg-white dark:bg-white/10 shadow-md hover:shadow-xl hover:-translate-y-1'
                        : 'bg-white/60 dark:bg-white/5 border-2 border-dashed border-gray-300/50 dark:border-gray-600/30'
                    }`}
                  >
                    <div className="aspect-square relative">
                      {momentForDay ? (
                        <button
                          type="button"
                          onClick={handleMomentSlotPress}
                          onMouseUp={handleMomentSlotPress}
                          onTouchEnd={handleMomentSlotPress}
                          onPointerUp={handleMomentSlotPress}
                          className="block w-full h-full cursor-pointer"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${momentForDay.photoUrl})` }}
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleMomentSlotPress}
                          onMouseUp={handleMomentSlotPress}
                          onTouchEnd={handleMomentSlotPress}
                          onPointerUp={handleMomentSlotPress}
                          className="flex w-full h-full items-center justify-center text-gray-400 transition-colors hover:bg-white/50 dark:text-gray-600 dark:hover:bg-white/5 cursor-pointer"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      )}
                    </div>

                    <div className={`px-2 py-1.5 text-center ${
                      momentForDay ? 'bg-white dark:bg-white/10' : 'bg-white/40 dark:bg-white/5'
                    }`}>
                      <div className={`text-[11px] font-semibold ${
                        day.isToday 
                          ? 'text-amber-600 dark:text-amber-400' 
                          : momentForDay
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {day.isToday ? 'Today' : day.label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {momentsThisWeek.length === 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                A blank week is an invitation ✨
              </p>
              <button
                onClick={onCaptureQuickMoment}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={themeAccentEllieChipButtonStyle}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Capture something today
                </span>
              </button>
            </div>
          )}
        </div>

        {/* On This Day - Throwback section */}
        {onThisDayMemory && (
          <div className="mt-5 rounded-[28px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-violet-50/60 via-white/90 to-fuchsia-50/50 dark:from-violet-950/30 dark:via-slate-900/80 dark:to-fuchsia-950/20 p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-700 dark:text-gray-300">
                {onThisDayMemory.label || 'On This Day'}
              </h3>
            </div>

            <button
              onClick={() => onOpenMemory?.(onThisDayMemory)}
              className="w-full overflow-hidden rounded-[20px] border border-white/50 dark:border-white/10 bg-white/90 dark:bg-white/5 text-left transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="h-40 w-full bg-cover bg-center relative" style={{ backgroundImage: `url(${onThisDayMemory.photoUrl})` }}>
                {onThisDayMemory.yearsAgo && (
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                    <span className="text-xs font-bold text-white">
                      {onThisDayMemory.yearsAgo} {onThisDayMemory.yearsAgo === 1 ? 'year' : 'years'} ago
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {onThisDayMemory.title}
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatDisplayDate(onThisDayMemory.date)}
                </div>
              </div>
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onAddEvent}
            className="group rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">☀️ WHAT'S NEXT TODAY?</div>
            <div className="mt-3 overflow-hidden rounded-[18px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-white/[0.05]">
              {todaySpotlightEvent ? (
                <>
                  <div
                    className="h-28 w-full bg-gradient-to-br from-amber-100 via-rose-50 to-sky-100 dark:from-amber-900/30 dark:via-slate-900 dark:to-sky-900/30 bg-cover bg-center"
                    style={todaySpotlightPhoto ? { backgroundImage: `url(${todaySpotlightPhoto})` } : undefined}
                  />
                  <div className="p-3">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {todaySpotlightEvent.title}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      {formatDisplayTime(todaySpotlightEvent.time)}{todaySpotlightEvent.location ? ` · ${todaySpotlightEvent.location}` : ''}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[152px] flex-col items-start justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Your day is wide open ✨</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Nothing is lined up yet, so you can shape the day however you want.
                    </div>
                  </div>
                  <div
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                    style={themeAccentEllieChipButtonStyle}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add something
                  </div>
                </div>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenUpcoming}
            className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">📅 COMING UP THIS WEEK</div>
            {upcomingPreviewEvents.length > 0 ? (
              <div className="mt-3 space-y-2">
                {upcomingPreviewEvents.map((event, index) => (
                  <div
                    key={event?.id || `upcoming-${index}`}
                    className="rounded-[16px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] px-3 py-2.5"
                  >
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {`• ${event?.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long' }) : ''}`}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                      {event?.title || 'Untitled event'}
                      {event?.time ? ` · ${formatDisplayTime(event.time)}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex min-h-[152px] flex-col items-start justify-between rounded-[18px] border border-white/50 dark:border-white/10 bg-white/80 p-4 dark:bg-white/[0.05]">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Nothing planned yet</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your week is open. Add something to look forward to.
                  </div>
                </div>
                <div
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                  style={themeAccentEllieChipButtonStyle}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add event
                </div>
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenTripsTab}
            className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">✈️ YOUR NEXT ADVENTURE</div>
            {tripSpotlight ? (
              <div className="mt-3 overflow-hidden rounded-[18px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-white/[0.05]">
                <div className="relative h-[152px] w-full bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100 dark:from-sky-900/40 dark:via-slate-900 dark:to-emerald-900/30">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.45),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.22),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
                  <div className="absolute inset-x-0 bottom-0 px-4 py-4">
                    <div className="text-lg text-gray-900 dark:text-white truncate" style={{ fontFamily: '"Comic Sans MS", "Bradley Hand", cursive' }}>
                      {tripSpotlight?.weather_location || tripSpotlight?.name || 'Your next destination'}
                    </div>
                    <div className="mt-1 text-xs text-gray-700/80 dark:text-gray-300 truncate">
                      {formatDisplayDate(tripSpotlight.startDateLabel || tripSpotlight.startDate || tripSpotlight.start)} - {formatDisplayDate(tripSpotlight.endDateLabel || tripSpotlight.endDate || tripSpotlight.end)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex min-h-[152px] flex-col items-start justify-between rounded-[18px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-4 dark:from-sky-900/30 dark:via-slate-900 dark:to-emerald-900/20">
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
          <button
            type="button"
            onClick={onOpenMemories}
            className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
            style={{ borderColor: themeAccentBorder, background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.82)' }}
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">💭 LATEST MEMORIES</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(memoryCollagePhotos.length > 0 ? memoryCollagePhotos : ['', '', '', '']).slice(0, 4).map((url, index) => (
                <div
                  key={`memory-collage-${index}`}
                  className="h-14 rounded-[14px] border border-white/40 dark:border-white/10 bg-gradient-to-br from-violet-100 via-rose-50 to-amber-100 dark:from-violet-900/30 dark:via-slate-900 dark:to-amber-900/20 bg-cover bg-center"
                  style={url ? { backgroundImage: `url(${url})` } : undefined}
                />
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {memoryCollagePhotos.length > 0 ? 'A little collage from your gallery' : 'Your saved moments will gather here'}
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-4">
          <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(254,242,242,0.94),rgba(255,251,235,0.96))] dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.94),rgba(55,48,163,0.18),rgba(15,23,42,0.94))] p-4 sm:p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Journey</div>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">The chapter you are building right now</h3>
              </div>
              <button
                onClick={onOpenJourney}
                className="rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-100 transition-all"
              >
                Open
              </button>
            </div>
            {primaryJourneyGoal ? (
              <div className="mt-4 rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Sparkles className="w-4 h-4" />
                  {primaryJourneyGoal.title}
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {primaryJourneyProgressText || 'Keep going. Progress adds up.'}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full bg-white/80 dark:bg-white/[0.08] px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                    {primaryJourneyStreak} day streak
                  </div>
                  <div className="rounded-full bg-white/80 dark:bg-white/[0.08] px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                    {primaryJourneyLoggedToday ? 'Logged today' : 'Not logged yet'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[24px] border border-dashed border-white/30 dark:border-white/10 px-4 py-5 text-sm text-gray-600 dark:text-gray-300">
                Start one goal and Home can track the part of your story that is about growth, not just scheduling.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-[linear-gradient(135deg,rgba(240,249,255,0.98),rgba(236,254,255,0.95),rgba(236,253,245,0.96))] dark:bg-[linear-gradient(135deg,rgba(12,74,110,0.2),rgba(15,23,42,0.95),rgba(6,78,59,0.18))] p-4 sm:p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Trips</div>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Places shaping your year</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenTripsTab}
                  className="rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-100 transition-all"
                >
                  View all
                </button>
                <button
                  onClick={onStartTrip}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition-all"
                >
                  + Start Trip
                </button>
              </div>
            </div>
            {tripsPreview.length === 0 ? (
              <div className="mt-4 rounded-[24px] border border-dashed border-white/30 dark:border-white/10 px-4 py-5 text-sm text-gray-600 dark:text-gray-300">
                No trips on deck yet. Add one and it can become part of your timeline and your memory gallery later.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {tripsPreview.map((trip, index) => (
                  <button
                    key={trip.id || index}
                    onClick={() => onOpenTrip?.(trip)}
                    className="w-full rounded-[24px] border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] px-4 py-4 text-left transition-all hover:bg-white/95 dark:hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                          <Plane className="w-4 h-4 shrink-0" />
                          <span className="truncate">{trip.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDisplayDate(trip.startDateLabel || trip.startDate || trip.start)} - {formatDisplayDate(trip.endDateLabel || trip.endDate || trip.end)}
                        </div>
                      </div>
                      <span className="text-xs font-semibold shrink-0" style={themeAccentTextStyle}>
                        {activeTripIdSet.has(String(trip?.id || '')) ? 'Now' : 'Soon'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-[linear-gradient(135deg,rgba(250,245,255,0.98),rgba(253,242,248,0.96),rgba(255,255,255,0.95))] dark:bg-[linear-gradient(135deg,rgba(88,28,135,0.2),rgba(15,23,42,0.95),rgba(76,29,149,0.14))] p-4 sm:p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Worth keeping</div>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Memories make the calendar feel lived in</h3>
              </div>
              <button
                onClick={onOpenMemories}
                className="rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-100 transition-all"
              >
                Open gallery
              </button>
            </div>

            {recentMemory ? (
              <button
                onClick={() => onOpenMemory?.(recentMemory)}
                className="mt-4 w-full overflow-hidden rounded-[24px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-left transition-all hover:bg-white/95 dark:hover:bg-white/[0.08]"
              >
                {memoryCover ? (
                  <div className="h-36 w-full bg-cover bg-center" style={{ backgroundImage: `url(${memoryCover})` }} />
                ) : (
                  <div className="h-36 w-full flex items-center justify-center bg-white/80 dark:bg-white/[0.05] text-gray-400">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    <Heart className="w-3.5 h-3.5" />
                    Latest memory
                  </div>
                  <div className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{recentMemory.title || 'Untitled memory'}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {formatDisplayDate(recentMemory.date)}
                  </div>
                </div>
              </button>
            ) : (
              <div className="mt-4 rounded-[24px] border border-dashed border-white/30 dark:border-white/10 px-4 py-5 text-sm text-gray-600 dark:text-gray-300">
                No saved memories yet. The best moments from events and trips can start filling this in.
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{memoryReadyCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">moments ready to save</div>
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
                        <div className="truncate text-sm font-medium text-gray-900 dark:text-white">{event.title}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDisplayDate(event.date)}</div>
                      </div>
                      <button
                        onClick={() => onCreateMemoryFromEvent?.(event)}
                        className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
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

          <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 p-4 sm:p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Next chapter</div>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Keep the story moving</h3>
              </div>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={onShowCalendarView}
                className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] px-4 py-4 text-left transition-all hover:bg-white/95 dark:hover:bg-white/[0.08]"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Open calendar view</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Zoom back out to see the whole timeline.</div>
              </button>
              <button
                onClick={onOpenExplore}
                className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] px-4 py-4 text-left transition-all hover:bg-white/95 dark:hover:bg-white/[0.08]"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Find something new</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pull in the next idea, event, or outing.</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScrapbookHomePage;
