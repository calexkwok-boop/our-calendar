import React from 'react';
import {
  Camera,
  Clock,
  Heart,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
  BookOpen,
} from 'lucide-react';

/**
 * HYBRID SCRAPBOOK HOME PAGE
 * 
 * Mix of:
 * - Handwritten header (scrapbook enhanced)
 * - Moments This Week (current clean style)
 * - What's Next Today (current)
 * - Coming Up This Week (current)
 * - Quick Thoughts (scrapbook enhanced - NEW)
 * - Latest Memories (current)
 * - Someday List (scrapbook enhanced - NEW)
 * 
 * Philosophy: Warm handwritten header sets the tone, 
 * then clean functional sections for planning,
 * sprinkled with playful sticky notes and dream lists
 */

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
  memory?.coverPhoto || memory?.photos?.[0]?.url || ''
).trim();

const getVisualPreviewUrl = (item) => String(
  item?.coverPhoto || item?.photoUrl || item?.photos?.[0]?.url || ''
).trim();

const getDaysOfWeek = (pastDaysCount = 6, futureDaysCount = 0) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(today.getDate() - Math.max(0, Number(pastDaysCount || 0)));
  const total = Math.max(1, Number(pastDaysCount || 0) + Number(futureDaysCount || 0) + 1);
  return Array.from({ length: total }, (_, index) => {
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

const ScrapbookHomeHybrid = ({
  darkMode = false,
  greeting = 'Good day',
  greetingName = 'there',
  greetingEmoji = '',
  todayLabel = '',
  
  // Year stats for header
  yearStats = { events: 52, trips: 8, photos: 247, places: 12 },
  
  // Moments This Week (current)
  momentsThisWeek = [],
  onCaptureQuickMoment,
  onOpenMemory,
  onDeleteMoment,
  onConfirmAction,
  weekPastDaysCount = 6,
  weekFutureDaysCount = 0,
  
  // What's Next Today (current)
  todaySpotlightEvent = null,
  
  // Coming Up This Week (current)
  upcomingPreviewEvents = [],
  onOpenUpcoming,
  
  // Quick Thoughts (NEW - scrapbook enhanced)
  quickThoughts = [],
  onAddThought,
  onDeleteThought,
  
  // Latest Memories (current)
  recentMemory = null,
  memoryReadyCount = 0,
  memoryPhotoCount = 0,
  memoryOpportunities = [],
  onOpenMemories,
  onCreateMemoryFromEvent,
  
  // Someday List (NEW - scrapbook enhanced)
  bucketList = [],
  onAddDream,
  onPlanFromDream,
  onDeleteDream,
  
  // Theme
  themeAccentHeadingStyle,
  themeAccentEllieChipButtonStyle,
  themeAccentTextStyle,
}) => {
  const momentTapRef = React.useRef(null);
  const todaySpotlightPhoto = getVisualPreviewUrl(todaySpotlightEvent);
  const memoryCover = getMemoryCover(recentMemory);

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

      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* SCRAPBOOK HEADER with Year Stats */}
        <div className="relative overflow-hidden rounded-[32px] border-2 border-amber-900/20 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 shadow-2xl paper-texture">
          {/* Decorative corner doodles */}
          <div className="pointer-events-none absolute left-6 top-6 text-4xl opacity-15 select-none">✦</div>
          <div className="pointer-events-none absolute right-6 top-6 text-4xl opacity-15 select-none">❋</div>
          
          <div className="relative">
            <h1 className="font-handwritten text-5xl sm:text-6xl text-gray-900 dark:text-white mb-2 leading-tight">
              {greeting}, {greetingName} {greetingEmoji}
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300 mb-6">{todayLabel}</p>
            
            {/* Year in Numbers */}
            <div className="inline-flex flex-wrap items-center gap-3 rounded-2xl border border-amber-900/10 bg-white/60 dark:bg-black/20 px-6 py-3 backdrop-blur-sm">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">2026 SO FAR:</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {yearStats.events} events · {yearStats.trips} trips · {yearStats.photos} photos · {yearStats.places} new places
              </span>
            </div>
          </div>
        </div>

        {/* MOMENTS THIS WEEK - Current clean style with polaroids */}
        <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-white/95 via-amber-50/40 to-white/90 dark:from-slate-900/80 dark:via-amber-900/10 dark:to-slate-900/75 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-700 dark:text-gray-300">
                Moments This Week
              </h3>
            </div>
            {momentsThisWeek.length > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {momentsThisWeek.length} captured
              </div>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {getDaysOfWeek(weekPastDaysCount, weekFutureDaysCount).map((day) => {
              const momentForDay = momentsThisWeek.find(m => 
                String(m?.date || '').trim().slice(0, 10) === day.dateKey
              );

              return (
                <div key={day.dateKey} className="flex-shrink-0 w-32">
                  <div className={`rounded-lg overflow-hidden ${
                    momentForDay 
                      ? 'bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all' 
                      : 'bg-white/60 dark:bg-slate-800/30 border-2 border-dashed border-gray-300 dark:border-gray-600'
                  }`}>
                    <div className="aspect-square relative">
                      {momentForDay ? (
                        <button
                          onClick={() => onOpenMemory?.(momentForDay)}
                          className="w-full h-full"
                        >
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${momentForDay.photoUrl})` }}
                          />
                          {onDeleteMoment && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMoment?.(momentForDay);
                              }}
                              className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </button>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {day.isToday ? (
                            <button
                              onClick={onCaptureQuickMoment}
                              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Plus className="w-6 h-6" />
                              <span className="text-[10px] font-medium">Add</span>
                            </button>
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`px-2 py-1.5 text-center ${
                      momentForDay ? 'bg-white dark:bg-slate-800' : 'bg-white/40 dark:bg-slate-800/20'
                    }`}>
                      <p className={`text-[11px] font-semibold ${
                        day.isToday ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {day.isToday ? 'Today' : day.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {momentsThisWeek.length === 0 && (
            <div className="mt-4 text-center">
              <p className="font-handwritten text-xl text-gray-600 dark:text-gray-400 italic">
                A blank week is an invitation ✨
              </p>
            </div>
          )}
        </div>

        {/* WHAT'S NEXT TODAY - Current style */}
        <button
          type="button"
          onClick={() => todaySpotlightEvent && onOpenMemory?.(todaySpotlightEvent)}
          className="w-full rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
        >
          <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400 mb-3">
            ☀️ WHAT'S NEXT TODAY
          </div>
          {todaySpotlightEvent ? (
            <div className="flex gap-4">
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
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Your day is wide open ✨
              </p>
              <button
                onClick={onCaptureQuickMoment}
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
                style={themeAccentEllieChipButtonStyle}
              >
                <Plus className="w-3.5 h-3.5" />
                Add something
              </button>
            </div>
          )}
        </button>

        {/* COMING UP THIS WEEK - Current style */}
        <div className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
              📅 COMING UP THIS WEEK
            </div>
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
                  className="flex items-center gap-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-3"
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

        {/* QUICK THOUGHTS - NEW scrapbook enhanced with sticky notes */}
        <div className="rounded-[28px] border-2 border-yellow-900/20 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/30 dark:via-slate-900 dark:to-orange-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
              <h3 className="font-handwritten text-3xl text-gray-900 dark:text-white">
                Quick Thoughts
              </h3>
            </div>
            <button
              onClick={onAddThought}
              className="rounded-full p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {quickThoughts.length > 0 ? (
            <div className="space-y-3">
              {quickThoughts.map((thought, idx) => (
                <div
                  key={thought.id || idx}
                  className={`sticky-note relative p-4 rounded-lg ${
                    thought.color === 'yellow' ? 'bg-yellow-200 dark:bg-yellow-900/50' :
                    thought.color === 'pink' ? 'bg-pink-200 dark:bg-pink-900/50' :
                    thought.color === 'blue' ? 'bg-blue-200 dark:bg-blue-900/50' :
                    'bg-green-200 dark:bg-green-900/50'
                  }`}
                >
                  <p className="font-handwritten text-lg text-gray-900 dark:text-white pr-8">
                    {thought.text}
                  </p>
                  {onDeleteThought && (
                    <button
                      onClick={() => onDeleteThought(thought)}
                      className="absolute top-2 right-2 rounded-full bg-white/60 dark:bg-black/20 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="font-handwritten text-2xl text-gray-600 dark:text-gray-400 italic mb-4">
                Jot down ideas, reminders, random thoughts...
              </p>
              <button
                onClick={onAddThought}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white hover:bg-yellow-300 dark:hover:bg-yellow-900/70 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add your first thought
              </button>
            </div>
          )}
        </div>

        {/* LATEST MEMORIES - Current style */}
        <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-purple-50/60 via-white/90 to-pink-50/60 dark:from-purple-950/30 dark:via-slate-900/80 dark:to-pink-950/20 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                Worth keeping
              </div>
              <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                Memories make the calendar feel lived in
              </h3>
            </div>
            <button
              onClick={onOpenMemories}
              className="rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-100"
            >
              Open gallery
            </button>
          </div>

          {recentMemory ? (
            <button
              onClick={() => onOpenMemory?.(recentMemory)}
              className="w-full overflow-hidden rounded-[20px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-left transition-all hover:bg-white/95 dark:hover:bg-white/[0.08]"
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
                <div className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                  {recentMemory.title || 'Untitled memory'}
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatDisplayDate(recentMemory.date)}
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-[20px] border border-dashed border-white/30 dark:border-white/10 px-4 py-5 text-sm text-gray-600 dark:text-gray-300 text-center">
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

        {/* SOMEDAY LIST - NEW scrapbook enhanced */}
        <div className="rounded-[28px] border-2 border-emerald-900/20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-cyan-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-handwritten text-3xl text-gray-900 dark:text-white">
                Someday List
              </h3>
            </div>
            <button
              onClick={onAddDream}
              className="rounded-full p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {bucketList.length > 0 ? (
            <div className="space-y-2">
              {bucketList.map((dream, idx) => (
                <button
                  key={dream.id || idx}
                  onClick={() => onPlanFromDream?.(dream)}
                  className="group w-full flex items-center gap-3 rounded-xl border border-emerald-900/10 bg-white/60 dark:bg-black/20 p-3 text-left transition-all hover:bg-white/90 dark:hover:bg-black/40 hover:border-emerald-500/30"
                >
                  <span className="text-2xl flex-shrink-0">{dream.emoji}</span>
                  <span className="text-sm text-gray-900 dark:text-white flex-1">
                    {dream.text}
                  </span>
                  {onDeleteDream && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDream(dream);
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded-full bg-white/60 dark:bg-black/20 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="font-handwritten text-2xl text-gray-600 dark:text-gray-400 italic mb-4">
                Places to go, things to try, adventures to have...
              </p>
              <button
                onClick={onAddDream}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-200 dark:bg-emerald-900/50 text-gray-900 dark:text-white hover:bg-emerald-300 dark:hover:bg-emerald-900/70 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add your first dream
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ScrapbookHomeHybrid;
