// UnifiedCalendarView.jsx - One beautiful page for everything
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import Agenda from './Agenda';
import JourneyPanel from './JourneyPanel';

// simple color helper
const hexToRgba = (hex, alpha = 1) => {
  try {
    const h = String(hex || '').replace('#', '');
    const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const intv = parseInt(n, 16);
    const r = (intv >> 16) & 255;
    const g = (intv >> 8) & 255;
    const b = intv & 255;
    const a = Math.max(0, Math.min(1, Number(alpha)));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch {
    return 'rgba(168,85,247,1)';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UnifiedCalendarView = ({
  // Current date state
  currentDate,
  setCurrentDate,
  selectedDate,
  setSelectedDate,
  
  // Events
  events = {}, // { 'YYYY-MM-DD': [events] }
  getEventsForDate, // (date) => Event[]
  popupEventsByEventId = {},
  
  // Trips/Sub-calendars
  subCalendars = [], // Active trips
  openSubCalendar, // (trip) => void
  
  // Weather
  weather = {}, // { 'YYYY-MM-DD': { icon, high, low } }
  showWeather = true,
  
  // Categories
  categories = {},
  
  // View control
  calendarView = 'month', // 'month' | 'week' | 'agenda'
  setCalendarView,
  
  // Actions
  onAddEvent, // (date?: Date) => void
  onEventClick, // (event) => void
  onStartTrip, // () => void
  handleDeleteEvent, // (dateKey, eventId, ...) => void
  openRecurringDeletePrompt, // ({ dateKey, event }) => void
  
  // Helpers
  formatTime, // (time) => string
  getDateKey, // (date) => 'YYYY-MM-DD'
  isSameDay, // (date1, date2) => boolean
  isToday, // (date) => boolean
  getDaysInMonth, // (date) => Date[]
  canDeleteEventInActiveLayer, // (event) => boolean
  eventSwipeDrag, // { id, offset }
  swipedEventKey, // string | null
  handleEventSwipeStart, // (e, eventKey, canSwipeAction) => void
  handleEventSwipeMove, // (e) => void
  handleEventSwipeEnd, // () => void
  startEventSwipeDrag, // (e, eventKey, canSwipeAction) => void
  moveEventSwipeDrag, // (e) => void
  endEventSwipeDrag, // () => void
  
  // Theme
  darkMode = false,
  activeLayerPageTheme = { accent: '#a855f7' },
  
  // User
  user,
  userName: externalUserName,
  primaryJourneyGoal = null,
  primaryJourneyGoalProgress = 0,
  primaryJourneyProgressText = '',
  journeySupportLabel = '',
  journeyCoachLabel = '',
  journeyQuote = '',
  journeyHomeCtaLabel = 'Open Journey',
  primaryJourneyLoggedToday = false,
  onOpenJourney,
  onJourneyCtaClick,
}) => {
  const scrollToSelectedDateDetails = () => {
    window.requestAnimationFrame(() => {
      const details = document.getElementById('todays-events');
      details?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    scrollToSelectedDateDetails();
  };

  // Auto-select today on mount
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, []);
  
  // Get today's events
  const todayKey = getDateKey(new Date());
  const todayEvents = events[todayKey] || [];
  
  // Get active trips for today
  const today = getDateKey(new Date());
  const activeTrips = subCalendars.filter(sc => today >= sc.start_date && today <= sc.end_date);
  
  // Selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const isSelectedToday = selectedDate && isSameDay(selectedDate, new Date());
  // Local view state for header toggle (UI only on Home)
  const [localCalendarView, setLocalCalendarView] = useState('month');

  // Agenda view local state
  const [agendaRangeDays, setAgendaRangeDays] = useState(30);
  const [agendaSearchQuery, setAgendaSearchQuery] = useState('');

  // Helpers used by Agenda component
  const toDateOnlyTs = (date) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const getSubCalStartRaw = (sc) => sc?.start_date;
  const getSubCalEndRaw = (sc) => sc?.end_date;

  // Build agenda items for the selected range and apply search filter
  const agendaItems = (() => {
    const days = Math.max(1, Math.min(365, Number(agendaRangeDays || 30)));
    const query = String(agendaSearchQuery || '').trim().toLowerCase();
    const out = [];
    const base = new Date(currentDate);
    base.setHours(0,0,0,0);
    for (let i = 0; i < days; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const evts = getEventsForDate ? (getEventsForDate(d) || []) : [];
      evts.forEach((e) => {
        if (!query) {
          out.push({ ...e, date: getDateKey(d) });
        } else {
          const title = String(e?.title || '').toLowerCase();
          const location = String(e?.location || '').toLowerCase();
          const catKey = String(e?.category || 'other');
          const cat = categories[catKey] || {};
          const catLabel = String(cat.label || cat.name || '').toLowerCase();
          const hay = `${title} ${location} ${catLabel}`;
          if (hay.includes(query)) out.push({ ...e, date: getDateKey(d) });
        }
      });
    }
    // sort by date, then time
    out.sort((a, b) => {
      const aTs = toDateOnlyTs(a?.date || a?.dateKey || '') || 0;
      const bTs = toDateOnlyTs(b?.date || b?.dateKey || '') || 0;
      if (aTs !== bTs) return aTs - bTs;
      if (!a?.time) return 1;
      if (!b?.time) return -1;
      return String(a.time).localeCompare(String(b.time));
    });
    return out;
  })();
  
  const accent = activeLayerPageTheme?.accent || '#a855f7';

  return (
    <div className="unified-calendar-view">
      {/* Persistent Header - Always visible */}
      <GreetingHeader
        todayEvents={todayEvents}
        activeTrips={activeTrips}
        openSubCalendar={openSubCalendar}
        onScrollToTodaySchedule={scrollToSelectedDateDetails}
        darkMode={darkMode}
        user={user}
        userName={externalUserName}
        accent={accent}
      />
      
      {/* Active trips banner (if multiple) */}
      {activeTrips.length > 1 && (
        <ActiveTripsBanner
          trips={activeTrips}
          openSubCalendar={openSubCalendar}
          darkMode={darkMode}
        />
      )}
      
      {/* Header with navigation + view toggle */}
      <CalendarHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        calendarView={localCalendarView}
        setCalendarView={setLocalCalendarView}
        darkMode={darkMode}
        accent={accent}
      />
      
      {/* Calendar content by view */}
      {localCalendarView === 'month' && (
        <>
          <DayHeaders darkMode={darkMode} accent={accent} />
        <CalendarGrid
        currentDate={currentDate}
        selectedDate={selectedDate}
        setSelectedDate={handleSelectDate}
        getDaysInMonth={getDaysInMonth}
        getEventsForDate={getEventsForDate}
        getDateKey={getDateKey}
        isSameDay={isSameDay}
        isToday={isToday}
        weather={weather}
        showWeather={showWeather}
        subCalendars={subCalendars}
        darkMode={darkMode}
        accent={accent}
      />
        </>
      )}

      {localCalendarView === 'week' && (
        <>
          <WeekHeaders currentDate={currentDate} darkMode={darkMode} accent={accent} />
          <WeekGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            setSelectedDate={handleSelectDate}
            getEventsForDate={getEventsForDate}
            getDateKey={getDateKey}
            isSameDay={isSameDay}
            isToday={isToday}
            subCalendars={subCalendars}
            darkMode={darkMode}
            accent={accent}
          />
        </>
      )}

      {localCalendarView === 'agenda' && (
        <Agenda
          agendaRangeDays={agendaRangeDays}
          setAgendaRangeDays={setAgendaRangeDays}
          agendaSearchQuery={agendaSearchQuery}
          setAgendaSearchQuery={setAgendaSearchQuery}
          agendaItems={agendaItems}
          categories={categories}
          popupEventsByEventId={popupEventsByEventId}
          getDateKey={getDateKey}
          toDateOnlyTs={toDateOnlyTs}
          subCalendars={subCalendars}
          getSubCalStartRaw={getSubCalStartRaw}
          getSubCalEndRaw={getSubCalEndRaw}
          onEventClick={onEventClick}
          formatTime={formatTime}
          activeLayerPageTheme={activeLayerPageTheme}
          darkMode={darkMode}
        />
      )}
      
      {/* Selected date details */}
      {selectedDate && (
        <SelectedDateDetails
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          events={selectedDateEvents}
          isSelectedToday={isSelectedToday}
          onAddEvent={() => onAddEvent?.(selectedDate)}
          onEventClick={onEventClick}
          popupEventsByEventId={popupEventsByEventId}
          handleDeleteEvent={handleDeleteEvent}
          openRecurringDeletePrompt={openRecurringDeletePrompt}
          formatTime={formatTime}
          getDateKey={getDateKey}
          categories={categories}
          canDeleteEventInActiveLayer={canDeleteEventInActiveLayer}
          eventSwipeDrag={eventSwipeDrag}
          swipedEventKey={swipedEventKey}
          handleEventSwipeStart={handleEventSwipeStart}
          handleEventSwipeMove={handleEventSwipeMove}
          handleEventSwipeEnd={handleEventSwipeEnd}
          startEventSwipeDrag={startEventSwipeDrag}
          moveEventSwipeDrag={moveEventSwipeDrag}
          endEventSwipeDrag={endEventSwipeDrag}
          darkMode={darkMode}
          accent={accent}
        />
      )}

      <div className="mt-4">
        <JourneyPanel
          journeyHomeCtaLabel={journeyHomeCtaLabel}
          journeyCoachLabel={journeyCoachLabel}
          journeyProgressText={primaryJourneyProgressText}
          journeyQuote={journeyQuote}
          journeySupportLabel={journeySupportLabel}
          onClick={onOpenJourney}
          onCtaClick={onJourneyCtaClick}
          primaryJourneyGoal={primaryJourneyGoal}
          primaryJourneyGoalProgress={primaryJourneyGoalProgress}
          primaryJourneyLoggedToday={primaryJourneyLoggedToday}
          accent={accent}
          darkMode={darkMode}
        />
      </div>

      {/* Trips starter (under Today's schedule) */}
      {typeof onStartTrip === 'function' && (
        <div className="mt-4 rounded-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-5 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trips</h3>
            <button
              onClick={onStartTrip}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
            >
              + Start Trip
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Plan a new trip from your selected dates.</div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// GREETING HEADER
// ============================================================================

const GreetingHeader = ({ todayEvents, activeTrips, openSubCalendar, onScrollToTodaySchedule, darkMode, user, userName, accent }) => {
  const getTimeBasedEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 17) return '🌤️';
    if (hour < 20) return '🌆';
    return '🌙';
  };
  
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 20) return 'Good evening';
    return 'Good night';
  };
  
  const getDisplayName = () => {
    const rawFirst = userName || '';
    const meta = user?.user_metadata || {};
    const rawFallback = meta.handle || meta.username || user?.display_name || user?.full_name || user?.name || user?.email || '';
    const raw = String(rawFirst || rawFallback).trim();
    if (!raw) return 'there';
    if (raw.includes('@')) return raw.split('@')[0];
    return raw;
  };
  
  return (
    <div
      className="mb-6 rounded-3xl p-5 shadow-lg border"
      style={{
        background: darkMode
          ? `linear-gradient(135deg, ${hexToRgba(accent, 0.18)} 0%, rgba(15,23,42,0.85) 100%)`
          : `linear-gradient(135deg, ${hexToRgba(accent, 0.08)} 0%, rgba(255,255,255,0.96) 100%)`,
        borderColor: darkMode ? 'rgba(255,255,255,0.10)' : hexToRgba(accent, 0.15),
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: Greeting */}
        <div className="flex items-center gap-3">
          <span className="text-4xl sm:text-5xl">
            {getTimeBasedEmoji()}
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${hexToRgba(accent, 1)} 0%, ${hexToRgba(accent, 0.66)} 100%)` }}>
              {`${getTimeBasedGreeting()} ${getDisplayName()}!`}
            </h2>
            <button
              type="button"
              onClick={() => onScrollToTodaySchedule?.()}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </button>
          </div>
        </div>
        
        {/* Right: Summary */}
        <div className="flex flex-col items-end gap-2">
          {/* Event count */}
          {todayEvents.length > 0 && (
            <button
              type="button"
              onClick={() => onScrollToTodaySchedule?.()}
              className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-md backdrop-blur-sm transition-all hover:shadow-lg dark:bg-gray-800/80"
            >
              <span className="text-lg">📅</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {todayEvents.length} {todayEvents.length === 1 ? 'today' : 'today'}
              </span>
            </button>
          )}
          
          {/* Active trip (first one) */}
          {activeTrips.length === 1 && (
            <button
              onClick={() => openSubCalendar(activeTrips[0])}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all">
              <span className="text-sm">✈️</span>
              <span className="text-xs font-semibold truncate max-w-[120px]">
                {activeTrips[0].name}
              </span>
            </button>
          )}
          
          {/* Multiple trips indicator */}
          {activeTrips.length > 1 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md">
              <span className="text-sm">✈️</span>
              <span className="text-xs font-semibold">
                {activeTrips.length} trips
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ACTIVE TRIPS BANNER (when multiple)
// ============================================================================

const ActiveTripsBanner = ({ trips, openSubCalendar, darkMode }) => (
  <div className="mb-6 space-y-3">
    {trips.map(trip => (
      <button
        key={trip.id}
        onClick={() => openSubCalendar(trip)}
        className="group w-full relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 dark:from-blue-600 dark:via-cyan-600 dark:to-teal-600" />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="relative z-10 flex items-center gap-4 p-5 text-left">
          {/* Trip icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <span className="text-3xl">✈️</span>
          </div>
          
          {/* Trip info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="px-2 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/90 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                HAPPENING NOW
              </div>
            </div>
            <div className="font-bold text-lg text-white mb-1">
              {trip.name}
            </div>
            <div className="text-sm text-white/90">
              {new Date(trip.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          
          {/* Arrow */}
          <div className="text-white text-2xl group-hover:translate-x-2 transition-transform">
            →
          </div>
        </div>
      </button>
    ))}
  </div>
);

// ============================================================================
// CALENDAR HEADER (navigation + view toggle)
// ============================================================================

const CalendarHeader = ({ currentDate, setCurrentDate, calendarView, setCalendarView, darkMode, accent }) => {
  const goToPrev = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  return (
    <div className="mb-4 flex items-center justify-between">
      {/* Month/Week navigation */}
      <div className="flex items-center justify-center">
        <div className="min-w-[140px] text-center">
          <button
            onClick={goToToday}
            className="text-lg font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </button>
        </div>
      </div>
      
      {/* View toggle */}
      <div className="inline-flex items-center gap-1 p-1 rounded-2xl shadow-inner" style={{ background: darkMode ? hexToRgba(accent, 0.18) : hexToRgba(accent, 0.12) }}>
        {['month', 'week', 'agenda'].map(view => (
          <button
            key={view}
            onClick={() => setCalendarView(view)}
            className={`
              px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300
              ${calendarView === view
                ? 'bg-white dark:bg-gray-800 shadow-md scale-105'
                : 'text-gray-600 dark:text-gray-400'
              }
            `}
                      style={calendarView === view ? { color: accent } : { color: darkMode ? '#9ca3af' : '#4b5563' }}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// DAY HEADERS (Month view)
// ============================================================================

const DayHeaders = ({ darkMode, accent }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIdx = new Date().getDay();
  
  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-4">
      {days.map((day, idx) => (
        <div 
          key={day}
          className="text-center text-xs sm:text-sm font-bold py-2 rounded-2xl transition-all"
          style={idx === todayIdx ? { background: darkMode ? hexToRgba(accent, 0.18) : hexToRgba(accent, 0.12), color: darkMode ? hexToRgba(accent, 0.9) : accent, transform: 'scale(1.05)' } : { color: darkMode ? '#9ca3af' : '#6b7280' }}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// WEEK HEADERS (Week view)
// ============================================================================

const WeekHeaders = ({ currentDate, darkMode, accent }) => {
  const startOfWeek = (() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });
  const todayStr = new Date().toDateString();
  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-4">
      {days.map((d, idx) => {
        const isToday = d.toDateString() === todayStr;
        return (
          <div
            key={idx}
            className="text-center text-xs sm:text-sm font-bold py-2 rounded-2xl transition-all"
            style={isToday ? { background: darkMode ? hexToRgba(accent, 0.18) : hexToRgba(accent, 0.12), color: darkMode ? hexToRgba(accent, 0.9) : accent, transform: 'scale(1.05)' } : { color: darkMode ? '#9ca3af' : '#6b7280' }}
          >
            {d.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// WEEK GRID (Week view)
// ============================================================================

const WeekGrid = ({
  currentDate,
  selectedDate,
  setSelectedDate,
  getEventsForDate,
  getDateKey,
  isSameDay,
  isToday,
  subCalendars,
  darkMode,
  accent,
}) => {
  const startOfWeek = (() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-6">
      {days.map((date, index) => {
        const dateEvents = getEventsForDate(date) || [];
        const isSelected = isSameDay(date, selectedDate);
        const isTodayDate = isToday(date);
        const eventCount = dateEvents.length;
        const dateKey = getDateKey(date);
        const todayMid = new Date(); todayMid.setHours(0,0,0,0);
        const dateMid = new Date(date); dateMid.setHours(0,0,0,0);
        const showBadge = eventCount > 0 && !isSelected && dateMid.getTime() >= todayMid.getTime();

        return (
          <button
            key={index}
            onClick={() => setSelectedDate(date)}
            className={`
              group relative w-full aspect-square rounded-3xl p-2 transition-all duration-300 select-none
              ${isSelected 
                ? 'text-white z-20' 
                : isTodayDate
                  ? ''
                  : 'bg-white/90 dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-md'
              }
              hover:scale-105 active:scale-95
            `}
          style={{
            background: isSelected
              ? `linear-gradient(135deg, ${hexToRgba(accent, 0.95)} 0%, ${hexToRgba(accent, 0.75)} 100%)`
              : isTodayDate
                ? (darkMode ? hexToRgba(accent, 0.18) : hexToRgba(accent, 0.12))
                : (darkMode ? 'rgba(31,41,55,0.9)' : 'rgba(255,255,255,0.9)'),
            boxShadow: isSelected
              ? `0 12px 28px rgba(0,0,0,0.25), 0 0 0 4px ${hexToRgba(accent, darkMode ? 0.4 : 0.3)}`
              : isTodayDate
                ? `0 0 0 2px ${hexToRgba(accent, darkMode ? 0.5 : 0.35)}`
                : undefined,
          }}
          >
            <div className="text-sm sm:text-base font-bold mb-1" style={{ color: isSelected ? '#fff' : isTodayDate ? (darkMode ? hexToRgba(accent, 0.9) : accent) : (darkMode ? '#e5e7eb' : '#374151') }}>
              {date.getDate()}
            </div>
            {showBadge && (
              <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="px-1 sm:px-1.5 py-0.5 rounded-full text-white text-[7px] sm:text-[9px] font-bold shadow-md" style={{ background: `linear-gradient(90deg, ${hexToRgba(accent, 0.95)} 0%, ${hexToRgba(accent, 0.75)} 100%)` }}>
                  {eventCount > 9 ? '9+' : eventCount}
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// AGENDA LIST (Agenda view)
// ============================================================================

const AgendaList = ({ startDate, days = 30, getEventsForDate, getDateKey, onEventClick, formatTime, darkMode }) => {
  const list = [];
  const base = new Date(startDate);
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const ev = getEventsForDate(d) || [];
    list.push({ date: d, events: ev });
  }

  let lastHeader = '';
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
      {list.every(row => row.events.length === 0) ? (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">No agenda items in this range.</div>
      ) : (
        list.map((row, idx) => {
          const dk = getDateKey(row.date);
          const showHeader = dk !== lastHeader;
          lastHeader = dk;
          return (
            <div key={dk + ':' + idx}>
              {showHeader && (
                <div className="sticky top-0 z-10 -mx-1 px-2 py-1 rounded-lg bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur border text-xs font-semibold mb-1">
                  {row.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
              {row.events.map((event) => (
                <button
                  key={String(event.id) + ':' + dk}
                  onClick={() => onEventClick && onEventClick(event)}
                  className="w-full text-left rounded-xl border p-2.5 mb-1 transition-all hover:shadow bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-purple-500" />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{event.title}</span>
                      </div>
                      {event.location && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">Location: {event.location}</div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {event.time ? formatTime(event.time) : 'All day'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};

// ============================================================================
// CALENDAR GRID
// ============================================================================

const CalendarGrid = ({
  currentDate,
  selectedDate,
  setSelectedDate,
  getDaysInMonth,
  getEventsForDate,
  getDateKey,
  isSameDay,
  isToday,
  weather,
  showWeather,
  subCalendars,
  darkMode,
  accent,
}) => {
  const toDateOnlyTs = (date) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
    return d.getTime();
  };
  const todayTs = toDateOnlyTs(new Date());
  
  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-6">
      {getDaysInMonth(currentDate).map((date, index) => {
        if (!date) {
          return <div key={index} className="invisible" />;
        }
        
        const dateKey = getDateKey(date);
        const dateEvents = getEventsForDate(date);
        const isSelected = isSameDay(date, selectedDate);
        const isTodayDate = isToday(date);
        const eventCount = dateEvents.length;
        const weatherData = showWeather && weather[dateKey];
        const dateTs = toDateOnlyTs(date);
        const showBadge = eventCount > 0 && !isSelected && dateTs >= todayTs;
        
        // Check if date is in any trip
        const tripsOnDate = subCalendars.filter(sc => {
          const startTs = toDateOnlyTs(sc.start_date);
          const endTs = toDateOnlyTs(sc.end_date);
          return startTs !== null && endTs !== null && dateTs >= startTs && dateTs <= endTs;
        });
        const isInTrip = tripsOnDate.length > 0;
        
        return (
          <button
            key={index}
            onClick={() => setSelectedDate(date)}
            className={`
              group relative w-full aspect-square rounded-3xl p-2 transition-all duration-300 select-none
              ${isSelected 
                ? 'text-white shadow-2xl scale-110 z-20'
                : isTodayDate
                  ? 'shadow-lg'
                  : isInTrip
                    ? 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 hover:shadow-md'
                    : 'bg-white/90 dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-md'
              }
              hover:scale-105 active:scale-95
            `}
          style={{
            background: isSelected
              ? `linear-gradient(135deg, ${hexToRgba(accent, 0.95)} 0%, ${hexToRgba(accent, 0.75)} 100%)`
              : isTodayDate
                ? (darkMode ? hexToRgba(accent, 0.18) : hexToRgba(accent, 0.12))
                : isInTrip
                  ? (darkMode ? 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(29,78,216,0.12) 100%)' : 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)')
                  : (darkMode ? 'rgba(31,41,55,0.9)' : 'rgba(255,255,255,0.9)'),
            outline: !isSelected && isTodayDate ? `2px solid ${hexToRgba(accent, 0.5)}` : undefined,
            outlineOffset: 0,
          }}
          >
            {/* Trip badge */}
            {isInTrip && !isSelected && (
              <div className="absolute -top-1.5 -left-1.5 z-10">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-xs">✈️</span>
                  </div>
                  {tripsOnDate.length > 1 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[8px] font-bold text-white">
                      {tripsOnDate.length}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Date number */}
            <div className="text-sm sm:text-base font-bold mb-1" style={{ color: isSelected ? '#fff' : isTodayDate ? (darkMode ? hexToRgba(accent, 0.9) : accent) : (darkMode ? '#e5e7eb' : '#374151') }}>
              {date.getDate()}
            </div>
            
            {/* Weather */}
            {weatherData && !isSelected && (
              <div className="flex flex-col items-center mb-1">
                <span className="text-xl">{weatherData.icon}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  {weatherData.high}°
                </span>
              </div>
            )}
            
            {/* Event count badge */}
            {showBadge && (
              <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="px-1 sm:px-1.5 py-0.5 rounded-full text-white text-[7px] sm:text-[9px] font-bold shadow-md" style={{ background: `linear-gradient(90deg, ${hexToRgba(accent, 0.95)} 0%, ${hexToRgba(accent, 0.75)} 100%)` }}>
                  {eventCount > 9 ? '9+' : eventCount}
                </div>
              </div>
            )}
            
            {/* Hover glow removed; accent theming handled by backgrounds */}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// SELECTED DATE DETAILS
// ============================================================================

const SelectedDateDetails = ({
  selectedDate,
  setSelectedDate,
  events,
  isSelectedToday,
  onAddEvent,
  onEventClick,
  popupEventsByEventId,
  handleDeleteEvent,
  openRecurringDeletePrompt,
  formatTime,
  getDateKey,
  categories,
  canDeleteEventInActiveLayer,
  eventSwipeDrag,
  swipedEventKey,
  handleEventSwipeStart,
  handleEventSwipeMove,
  handleEventSwipeEnd,
  startEventSwipeDrag,
  moveEventSwipeDrag,
  endEventSwipeDrag,
  darkMode,
  accent,
}) => {
  const selectedDateKey = getDateKey(selectedDate);
  return (
    <div 
      id="todays-events"
      className="mt-6 rounded-3xl backdrop-blur-sm p-5 shadow-xl border"
      style={{
        animation: 'fadeInUp 0.4s ease-out',
        background: darkMode ? 'rgba(31,41,55,0.9)' : 'rgba(255,255,255,0.92)',
        borderColor: darkMode ? 'rgba(255,255,255,0.12)' : hexToRgba(accent, 0.2)
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {isSelectedToday 
            ? "Today's Schedule" 
            : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          }
        </h3>
        {!isSelectedToday && (
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            Close
          </button>
        )}
      </div>
      
      {/* Events */}
      {events.length > 0 ? (
        <div className="space-y-3 mb-4">
          {events.map((event, idx) => {
            const popupMeta = popupEventsByEventId[String(event.id || '')] || null;
            const effectiveCategoryKey = popupMeta ? 'popup_event' : (event.category || 'other');
            const category = categories[effectiveCategoryKey] || categories.popup_event || categories.other;
            const categoryLabel = popupMeta ? 'We Event' : (category?.label || 'Other');
            const isWeEvent = Boolean(popupMeta);
            const canDeleteThisEvent = canDeleteEventInActiveLayer?.(event);
            const eventSwipeKey = `${String(event.date || selectedDateKey || '')}:${String(event.id || '')}`;
            const rowOffset = eventSwipeDrag?.id === eventSwipeKey ? eventSwipeDrag.offset : (swipedEventKey === eventSwipeKey ? -88 : 0);
            const isDeleteRevealed = rowOffset < 0;
            const isRepeating = event.isVirtualAnnual || event.isVirtualRecurrence || (event.recurrence && event.recurrence !== 'once');
            return (
              <div
                key={event.id}
                className="relative overflow-hidden rounded-2xl"
                style={{ animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both` }}
              >
                {canDeleteThisEvent && (
                  <div className={`absolute inset-y-0 right-0 w-[88px] flex items-center justify-center transition-colors ${isDeleteRevealed ? 'bg-red-500' : 'bg-transparent'}`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isRepeating) {
                          openRecurringDeletePrompt?.({ dateKey: selectedDateKey, event });
                        } else {
                          handleDeleteEvent?.(selectedDateKey, event.id, false, false, false);
                        }
                      }}
                      className={`w-full h-full flex items-center justify-center gap-1 text-sm font-semibold transition-opacity ${isDeleteRevealed ? 'text-white opacity-100' : 'text-transparent opacity-0 pointer-events-none'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              <button
                type="button"
                onClick={() => onEventClick(event)}
                className={`group relative z-10 w-full flex items-center gap-4 p-4 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left border ${isWeEvent ? '' : 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border-gray-200 dark:border-gray-700'}`}
                style={{
                  ...(isWeEvent ? {
                    borderColor: darkMode ? 'rgba(251,113,133,0.7)' : 'rgba(244,63,94,0.38)',
                    background: darkMode
                      ? 'linear-gradient(135deg, rgba(127,29,29,0.26) 0%, rgba(69,10,10,0.14) 100%)'
                      : 'linear-gradient(135deg, rgba(255,241,242,0.96) 0%, rgba(255,228,230,0.90) 100%)',
                    boxShadow: darkMode
                      ? '0 12px 28px rgba(127,29,29,0.22)'
                      : '0 12px 30px rgba(244,63,94,0.10)',
                  } : {}),
                  transform: `translateX(${rowOffset}px)`,
                  transition: eventSwipeDrag?.id === eventSwipeKey ? 'none' : 'transform 180ms ease',
                  touchAction: 'pan-y'
                }}
                onTouchStart={(e) => handleEventSwipeStart?.(e, eventSwipeKey, canDeleteThisEvent)}
                onTouchMove={handleEventSwipeMove}
                onTouchEnd={handleEventSwipeEnd}
                onTouchCancel={handleEventSwipeEnd}
                onPointerDown={(e) => startEventSwipeDrag?.(e, eventSwipeKey, canDeleteThisEvent)}
                onPointerMove={moveEventSwipeDrag}
                onPointerUp={endEventSwipeDrag}
                onPointerCancel={endEventSwipeDrag}
              >
                {/* Time badge */}
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl shrink-0" style={{ background: darkMode ? `linear-gradient(135deg, ${hexToRgba(accent, 0.22)} 0%, ${hexToRgba(accent, 0.08)} 100%)` : `linear-gradient(135deg, ${hexToRgba(accent, 0.14)} 0%, ${hexToRgba(accent, 0.05)} 100%)` }}>
                  {event.time ? (
                    <>
                                                  <span className="text-xs font-bold" style={{ color: accent }}>
                        {formatTime(event.time).split(' ')[0]}
                      </span>
                                                  <span className="text-[10px]" style={{ color: hexToRgba(accent, 0.7) }}>
                        {formatTime(event.time).split(' ')[1]}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold" style={{ color: accent }}>
                      All day
                    </span>
                  )}
                </div>
                
                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category?.color || 'bg-gray-500'} text-white`}>
                      {categoryLabel}
                    </span>
                  </div>
                  <div className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                    {event.title}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
                
                {/* Arrow */}
                <div className="text-xl group-hover:translate-x-1 transition-transform" style={{ color: hexToRgba(accent, 0.7) }}>
                  →
                </div>
              </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          No events on this day
        </div>
      )}
      
      {/* Add event button */}
      <button
        onClick={() => onAddEvent?.(selectedDate)}
        className="w-full py-3 rounded-2xl text-white font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(90deg, ${hexToRgba(accent, 0.95)} 0%, ${hexToRgba(accent, 0.75)} 100%)` }}>
        <Plus className="w-5 h-5" />
        <span>Add Event</span>
      </button>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default UnifiedCalendarView;
