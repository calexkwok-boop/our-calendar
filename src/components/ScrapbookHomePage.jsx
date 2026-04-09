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

const ScrapbookHomePage = ({
  darkMode = false,
  greeting = 'Good day',
  greetingName = 'there',
  greetingEmoji = '',
  todayLabel = '',
  todaySections = [],
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
  todayPlanCount = 0,
  upcomingEventCount = 0,
  onShowCalendarView,
  onAddEvent,
  onAddPlan,
  onOpenEvent,
  onOpenUpcoming,
  onOpenTrip,
  onOpenTripsTab,
  onStartTrip,
  onOpenMemories,
  onOpenMemory,
  onCreateMemoryFromEvent,
  onOpenJourney,
  onOpenExplore,
  themeAccentHeadingStyle,
  themeAccentEllieChipButtonStyle,
  themeAccentTextStyle,
  themeAccentBorder,
}) => {
  const activeTripIdSet = new Set((activeTripIds || []).map((value) => String(value || '')));
  const hasAnythingToShow = todayPlanCount > 0 || tripsPreview.length > 0 || memoryCount > 0;
  const memoryCover = getMemoryCover(recentMemory);

  return (
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold leading-tight" style={themeAccentHeadingStyle}>
              {greeting}, {greetingName} {greetingEmoji}
            </h2>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">{todayLabel}</div>
            <p className="mt-3 max-w-xl text-sm sm:text-[15px] text-gray-600 dark:text-gray-300">
              Your plans, trips, milestones, and memories all live here like chapters in the same story.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <button
              onClick={onAddEvent}
              className="px-3 py-2 rounded-2xl text-sm font-semibold transition-all"
              style={themeAccentEllieChipButtonStyle}
            >
              <span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add event</span>
            </button>
            <button
              onClick={onOpenMemories}
              className="px-3 py-2 rounded-2xl text-sm font-semibold transition-all border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] text-gray-800 dark:text-gray-100"
            >
              <span className="inline-flex items-center gap-2"><BookOpen className="w-4 h-4" />Memories</span>
            </button>
            <button
              onClick={onOpenJourney}
              className="px-3 py-2 rounded-2xl text-sm font-semibold transition-all border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] text-gray-800 dark:text-gray-100"
            >
              <span className="inline-flex items-center gap-2"><Trophy className="w-4 h-4" />Journey</span>
            </button>
            <button
              onClick={onOpenExplore}
              className="px-3 py-2 rounded-2xl text-sm font-semibold transition-all border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] text-gray-800 dark:text-gray-100"
            >
              <span className="inline-flex items-center gap-2"><Compass className="w-4 h-4" />Explore</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof document !== 'undefined') {
                document.getElementById('home-today-chapters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Today</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{todayPlanCount}</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">plans across your day</div>
          </button>
          <button
            type="button"
            onClick={onOpenUpcoming}
            className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Upcoming</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{upcomingEventCount}</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">events on deck</div>
          </button>
          <button
            type="button"
            onClick={onOpenTripsTab}
            className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Trips</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{tripsPreview.length}</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">adventures in motion</div>
          </button>
          <button
            type="button"
            onClick={onOpenMemories}
            className="rounded-[24px] border p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
            style={{ borderColor: themeAccentBorder, background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.82)' }}
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Memories</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{memoryCount}</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{memoryPhotoCount} photos preserved</div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div id="home-today-chapters" className="rounded-[28px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/65 p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Today, told in chapters</div>
              <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Morning, afternoon, and evening</h3>
            </div>
            <button
              onClick={onAddEvent}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={themeAccentEllieChipButtonStyle}
            >
              + Add event
            </button>
          </div>
          <div className="space-y-3">
            {todaySections.map((section, index) => (
              <div
                key={section.key}
                className={`rounded-[24px] border border-white/40 dark:border-white/10 p-4 ${index === 1 ? 'rotate-[-0.35deg]' : index === 2 ? 'rotate-[0.35deg]' : ''}`}
                style={{ background: darkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(15,23,42,0.78))' : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))' }}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {section.events.length > 0 ? `${section.events.length} item${section.events.length === 1 ? '' : 's'}` : section.emptyTitle}
                    </div>
                  </div>
                  <button
                    onClick={() => onAddPlan?.(index)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={themeAccentEllieChipButtonStyle}
                  >
                    + Add plan
                  </button>
                </div>
                {section.events.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/20 dark:border-white/10 px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {section.emptyCopy}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.events.slice(0, 3).map((event) => (
                      <button
                        key={`${section.key}-${event.id}-${event.date}`}
                        onClick={() => onOpenEvent?.(event)}
                        className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] px-3 py-3 text-left transition-all hover:bg-white/95 dark:hover:bg-white/[0.08]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.title}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatDisplayTime(event.time)}</span>
                              {event.location ? <span className="truncate">{event.location}</span> : null}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 shrink-0 text-gray-400" />
                        </div>
                      </button>
                    ))}
                    {section.events.length > 3 && (
                      <div className="px-1 text-xs text-gray-500 dark:text-gray-400">
                        +{section.events.length - 3} more waiting in today
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
    </div>
  );
};

export default ScrapbookHomePage;
