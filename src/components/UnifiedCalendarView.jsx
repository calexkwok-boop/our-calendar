// UnifiedCalendarView.jsx - One beautiful page for everything
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

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
  onAddEvent, // () => void
  onEventClick, // (event) => void
  
  // Helpers
  formatTime, // (time) => string
  getDateKey, // (date) => 'YYYY-MM-DD'
  isSameDay, // (date1, date2) => boolean
  isToday, // (date) => boolean
  getDaysInMonth, // (date) => Date[]
  
  // Theme
  darkMode = false,
  activeLayerPageTheme = { accent: '#a855f7' },
  
  // User
  user,
}) => {
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
  
  return (
    <div className="unified-calendar-view">
      {/* Persistent Header - Always visible */}
      <GreetingHeader
        todayEvents={todayEvents}
        activeTrips={activeTrips}
        openSubCalendar={openSubCalendar}
        darkMode={darkMode}
      />
      
      {/* Active trips banner (if multiple) */}
      {activeTrips.length > 1 && (
        <ActiveTripsBanner
          trips={activeTrips}
          openSubCalendar={openSubCalendar}
          darkMode={darkMode}
        />
      )}
      
      {/* Month navigation & view toggle */}
      <CalendarHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        calendarView={calendarView}
        setCalendarView={setCalendarView}
        darkMode={darkMode}
      />
      
      {/* Day headers */}
      <DayHeaders darkMode={darkMode} />
      
      {/* Calendar Grid */}
      <CalendarGrid
        currentDate={currentDate}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        getDaysInMonth={getDaysInMonth}
        getEventsForDate={getEventsForDate}
        getDateKey={getDateKey}
        isSameDay={isSameDay}
        isToday={isToday}
        weather={weather}
        showWeather={showWeather}
        subCalendars={subCalendars}
        darkMode={darkMode}
      />
      
      {/* Selected date details */}
      {selectedDate && (
        <SelectedDateDetails
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          events={selectedDateEvents}
          isSelectedToday={isSelectedToday}
          onAddEvent={onAddEvent}
          onEventClick={onEventClick}
          formatTime={formatTime}
          categories={categories}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// ============================================================================
// GREETING HEADER
// ============================================================================

const GreetingHeader = ({ todayEvents, activeTrips, openSubCalendar, darkMode }) => {
  const getTimeBasedEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 17) return '🌤️';
    if (hour < 20) return '🌆';
    return '🌙';
  };
  
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    if (hour < 20) return 'Good evening!';
    return 'Good night!';
  };
  
  return (
    <div className="mb-6 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 p-5 shadow-lg border border-white/50 dark:border-purple-800/30">
      <div className="flex items-center justify-between">
        {/* Left: Greeting */}
        <div className="flex items-center gap-3">
          <span className="text-4xl sm:text-5xl">
            {getTimeBasedEmoji()}
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              {getTimeBasedGreeting()}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        
        {/* Right: Summary */}
        <div className="flex flex-col items-end gap-2">
          {/* Event count */}
          {todayEvents.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md">
              <span className="text-lg">📅</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {todayEvents.length} {todayEvents.length === 1 ? 'today' : 'today'}
              </span>
            </div>
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

const CalendarHeader = ({ currentDate, setCurrentDate, calendarView, setCalendarView, darkMode }) => {
  const goToPrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  return (
    <div className="mb-4 flex items-center justify-between">
      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="min-w-[140px] text-center">
          <button
            onClick={goToToday}
            className="text-lg font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      
      {/* View toggle */}
      <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 shadow-inner">
        {['month', 'week', 'agenda'].map(view => (
          <button
            key={view}
            onClick={() => setCalendarView(view)}
            className={`
              px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300
              ${calendarView === view
                ? 'bg-white dark:bg-gray-800 shadow-md scale-105 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-purple-500'
              }
            `}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// DAY HEADERS
// ============================================================================

const DayHeaders = ({ darkMode }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIdx = new Date().getDay();
  
  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-4">
      {days.map((day, idx) => (
        <div 
          key={day}
          className={`text-center text-xs sm:text-sm font-bold py-2 rounded-2xl transition-all ${
            idx === todayIdx
              ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 scale-105'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {day}
        </div>
      ))}
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
}) => {
  const toDateOnlyTs = (date) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
    return d.getTime();
  };
  
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
                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-2xl scale-110 ring-4 ring-purple-200 dark:ring-purple-800 z-20' 
                : isTodayDate
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 ring-2 ring-purple-400 dark:ring-purple-600 shadow-lg'
                  : isInTrip
                    ? 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 hover:shadow-md'
                    : 'bg-white/90 dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-md'
              }
              hover:scale-105 active:scale-95
            `}
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
            <div className={`
              text-sm sm:text-base font-bold mb-1
              ${isSelected ? 'text-white' : isTodayDate ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200'}
            `}>
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
            {eventCount > 0 && !isSelected && (
              <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2">
                <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold shadow-md">
                  {eventCount > 9 ? '9+' : eventCount}
                </div>
              </div>
            )}
            
            {/* Hover glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300 pointer-events-none" />
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
  formatTime,
  categories,
  darkMode,
}) => {
  // Don't show if no events and not today
  if (events.length === 0 && !isSelectedToday) {
    return null;
  }
  
  return (
    <div 
      id="todays-events"
      className="mt-6 rounded-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-5 shadow-xl border border-gray-100 dark:border-gray-700"
      style={{
        animation: 'fadeInUp 0.4s ease-out'
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
            onClick={() => setSelectedDate(null)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            Close
          </button>
        )}
      </div>
      
      {/* Events */}
      {events.length > 0 ? (
        <div className="space-y-3 mb-4">
          {events.map((event, idx) => {
            const category = categories[event.category || 'other'] || categories.other;
            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left border border-gray-200 dark:border-gray-700"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both`
                }}
              >
                {/* Time badge */}
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 shrink-0">
                  {event.time ? (
                    <>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {formatTime(event.time).split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-purple-500">
                        {formatTime(event.time).split(' ')[1]}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      All day
                    </span>
                  )}
                </div>
                
                {/* Event info */}
                <div className="flex-1 min-w-0">
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
                <div className="text-purple-400 text-xl group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </button>
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
        onClick={onAddEvent}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2">
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
