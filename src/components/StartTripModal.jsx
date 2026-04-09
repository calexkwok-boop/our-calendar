import React, { useMemo, useState } from 'react';
import { X, Calendar, MapPin, Plane, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const buildDateRange = (start, end) => {
  if (!start || !end) return [];
  const safeStart = normalizeDate(start);
  const safeEnd = normalizeDate(end);
  const from = safeStart <= safeEnd ? safeStart : safeEnd;
  const to = safeStart <= safeEnd ? safeEnd : safeStart;
  const dates = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const buildCalendarDays = (monthDate) => {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

const formatDisplayDate = (date) => (
  date
    ? date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Choose a date'
);

const StartTripModal = ({
  isOpen,
  onClose,
  selectedDates = [],
  setSelectedDates,
  tripName,
  setTripName,
  onCreateTrip,
  onCreateTripAndInvite,
  darkMode,
  themeAccentButtonStyle,
  themeAccentHeadingStyle,
  themeAccentBorder,
}) => {
  const [error, setError] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const sortedDates = useMemo(
    () => [...selectedDates].map((date) => normalizeDate(new Date(date))).sort((a, b) => a - b),
    [selectedDates]
  );

  const startDate = sortedDates[0] || null;
  const endDate = sortedDates[sortedDates.length - 1] || null;
  const hasEnoughDates = sortedDates.length >= 2;
  const calendarDays = useMemo(() => buildCalendarDays(displayMonth), [displayMonth]);
  const todayKey = formatDateString(new Date());

  if (!isOpen) return null;

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'No dates selected';
    if (formatDateString(startDate) === formatDateString(endDate)) {
      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    const startLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const nights = Math.max(sortedDates.length - 1, 0);
    return `${startLabel} - ${endLabel} (${sortedDates.length} days, ${nights} night${nights === 1 ? '' : 's'})`;
  };

  const getTripSuggestions = () => {
    if (!startDate) return [];
    const month = startDate.getMonth();
    const year = startDate.getFullYear();
    const suggestions = [];

    if (month >= 2 && month <= 4) {
      suggestions.push({ emoji: 'Spring', name: 'Spring Getaway' });
    } else if (month >= 5 && month <= 7) {
      suggestions.push({ emoji: 'Summer', name: 'Summer Trip' });
    } else if (month >= 8 && month <= 10) {
      suggestions.push({ emoji: 'Fall', name: 'Fall Adventure' });
    } else {
      suggestions.push({ emoji: 'Winter', name: 'Winter Escape' });
    }

    if (month === 11) suggestions.push({ emoji: 'Holiday', name: 'Holiday Trip' });
    if (month === 6 || month === 7) suggestions.push({ emoji: 'Beach', name: 'Beach Vacation' });
    suggestions.push({ emoji: 'Trip', name: `Trip ${year}` });
    return suggestions.slice(0, 3);
  };

  const suggestions = getTripSuggestions();

  const handleSuggestionClick = (suggestion) => {
    setTripName(suggestion.name);
    setError('');
  };

  const openPicker = (picker) => {
    const anchor = picker === 'end' ? (endDate || startDate || new Date()) : (startDate || new Date());
    setDisplayMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setActivePicker(picker);
  };

  const updateSelectedRange = (nextStart, nextEnd) => {
    if (!setSelectedDates) return;
    setSelectedDates(buildDateRange(nextStart, nextEnd));
    setError('');
  };

  const handleCalendarDayClick = (date) => {
    const picked = normalizeDate(date);
    if (activePicker === 'start') {
      const nextEnd = endDate && endDate >= picked ? endDate : new Date(picked.getFullYear(), picked.getMonth(), picked.getDate() + 1);
      updateSelectedRange(picked, nextEnd);
    } else if (activePicker === 'end') {
      const baseStart = startDate || new Date(picked.getFullYear(), picked.getMonth(), picked.getDate() - 1);
      const nextStart = baseStart <= picked ? baseStart : new Date(picked.getFullYear(), picked.getMonth(), picked.getDate() - 1);
      updateSelectedRange(nextStart, picked);
    }
    setActivePicker(null);
  };

  const validateAndSubmit = (mode = 'create') => {
    if (!hasEnoughDates) {
      setError('Pick a start date and end date for the trip');
      return;
    }
    if (!String(tripName || '').trim()) {
      setError('Give your trip a name');
      return;
    }
    if (mode === 'invite' && typeof onCreateTripAndInvite === 'function') {
      onCreateTripAndInvite();
      return;
    }
    onCreateTrip();
  };

  const activePickerLabel = activePicker === 'start' ? 'Choose start date' : 'Choose end date';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md max-h-[min(88dvh,44rem)] rounded-[28px] shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 flex flex-col"
        style={{
          borderColor: themeAccentBorder,
          background: darkMode ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 pb-5 border-b border-gray-200 dark:border-gray-700">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Plane className="w-5 h-5 text-blue-500" />
                <div className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400 font-semibold">
                  New Trip
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight" style={themeAccentHeadingStyle}>
                Start a Trip
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Keep all your travel plans in one place
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 p-6 space-y-5 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', touchAction: 'pan-y' }}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Dates
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openPicker('start')}
                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-4 text-left transition-all hover:border-blue-300 dark:hover:border-blue-400/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Start date</div>
                    <div className={`mt-1 text-sm font-medium ${startDate ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {formatDisplayDate(startDate)}
                    </div>
                  </div>
                  <span className="rounded-lg bg-blue-100 dark:bg-blue-500/10 p-2 text-blue-600 dark:text-blue-300">
                    <Calendar className="w-4 h-4" />
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openPicker('end')}
                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-4 text-left transition-all hover:border-blue-300 dark:hover:border-blue-400/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">End date</div>
                    <div className={`mt-1 text-sm font-medium ${endDate ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {formatDisplayDate(endDate)}
                    </div>
                  </div>
                  <span className="rounded-lg bg-blue-100 dark:bg-blue-500/10 p-2 text-blue-600 dark:text-blue-300">
                    <Calendar className="w-4 h-4" />
                  </span>
                </div>
              </button>
            </div>

            {activePicker && (
              <div className="mt-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-500/10 dark:via-cyan-500/10 dark:to-teal-500/10">
                  <button
                    type="button"
                    onClick={() => setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    className="rounded-lg p-2 text-gray-500 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/5 transition-all"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400 mt-1">
                      {activePickerLabel}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                    className="rounded-lg p-2 text-gray-500 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/5 transition-all"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-3 pt-3 pb-2">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {WEEKDAY_LABELS.map((day) => (
                      <div key={day} className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const dateValue = formatDateString(day);
                      const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
                      const isSelected = sortedDates.some((item) => formatDateString(item) === dateValue);
                      const isBoundary = (startDate && formatDateString(startDate) === dateValue) || (endDate && formatDateString(endDate) === dateValue);
                      const isToday = dateValue === todayKey;
                      return (
                        <button
                          key={dateValue}
                          type="button"
                          onClick={() => handleCalendarDayClick(day)}
                          className={`aspect-square rounded-xl text-sm font-medium transition-all ${
                            isBoundary
                              ? 'bg-blue-600 text-white shadow-md'
                              : isSelected
                                ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-200'
                                : isToday
                                  ? 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-200'
                                  : isCurrentMonth
                                    ? 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                                    : 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className={`mt-3 px-4 py-3.5 rounded-xl border-2 transition-all ${
              hasEnoughDates
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className={`text-sm font-medium ${
                hasEnoughDates ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {formatDateRange()}
              </div>
              {!hasEnoughDates && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Pick a start date and an end date for the trip
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Trip Name
            </label>

            {suggestions.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={`${suggestion.name}-${idx}`}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      tripName === suggestion.name
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {suggestion.name}
                  </button>
                ))}
              </div>
            )}

            <input
              autoFocus
              type="text"
              value={tripName}
              onChange={(e) => {
                setTripName(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  validateAndSubmit();
                }
              }}
              placeholder="SF Trip, Cabo 2026, Europe Adventure..."
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-base ${
                error
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-400'
                  : 'border-gray-200 dark:border-white/10 focus:ring-blue-400'
              } bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2`}
            />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                {error}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => validateAndSubmit('invite')}
            disabled={!hasEnoughDates}
            className={`w-full rounded-2xl px-5 py-4 text-left transition-all duration-200 border ${
              hasEnoughDates
                ? 'border-cyan-200 dark:border-cyan-700 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 active:scale-[0.99]'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.04] text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">
                  + Create & Invite Friends
                </div>
                <div className={`mt-1 text-[11px] italic ${hasEnoughDates ? 'text-white/75' : 'text-gray-400 dark:text-gray-500'}`}>
                  The best way to predict the future, is to create it together.
                </div>
              </div>
              <div className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${hasEnoughDates ? 'bg-white/15 text-white' : 'bg-gray-200 dark:bg-white/[0.04] text-gray-400 dark:text-gray-500'}`}>
                Collaborate
              </div>
            </div>
          </button>
        </div>

        <div className="p-6 pt-4 flex gap-3 bg-transparent">
          <button
            onClick={() => validateAndSubmit('create')}
            disabled={!hasEnoughDates}
            className={`flex-1 px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
              hasEnoughDates ? 'text-white hover:shadow-lg active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
            }`}
            style={hasEnoughDates ? themeAccentButtonStyle : { backgroundColor: '#9ca3af', color: 'white' }}
          >
            + Create Trip
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-xl font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartTripModal;
