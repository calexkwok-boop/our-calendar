import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

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

const AddEventModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  PlacesAutocomplete,
  darkMode,
  themeAccentButtonStyle,
  themeAccentHeadingStyle,
  themeAccentBorder,
  themeAccentSoftButtonStyle,
}) => {
  const [errors, setErrors] = useState({});
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const dateSuggestions = (() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: tomorrow },
      { label: 'Next week', date: nextWeek },
    ];
  })();

  const timeSuggestions = (() => {
    const hour = new Date().getHours();
    if (hour < 11) return ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'];
    if (hour < 17) return ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];
    return ['9:00 AM', '10:00 AM', '12:00 PM', '2:00 PM'];
  })();

  const selectedDateObject = useMemo(() => parseDateString(formData.date), [formData.date]);
  const calendarDays = useMemo(() => buildCalendarDays(displayMonth), [displayMonth]);
  const todayKey = formatDateString(new Date());

  if (!isOpen) return null;

  const selectedDateLabel = selectedDateObject
    ? selectedDateObject.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Choose a date';

  const handleDateSuggestionClick = (date) => {
    setFormData((prev) => ({ ...prev, date: formatDateString(date) }));
    setErrors((prev) => ({ ...prev, date: null }));
  };

  const handleTimeSuggestionClick = (time) => {
    setFormData((prev) => ({ ...prev, time }));
    setErrors((prev) => ({ ...prev, time: null }));
  };

  const openDatePicker = () => {
    const anchor = selectedDateObject || new Date();
    setDisplayMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setShowCalendarPanel(true);
  };

  const handleCalendarDayClick = (date) => {
    setFormData((prev) => ({ ...prev, date: formatDateString(date) }));
    setErrors((prev) => ({ ...prev, date: null }));
    setShowCalendarPanel(false);
  };

  const validateAndSubmit = () => {
    const nextErrors = {};

    if (!String(formData.title || '').trim()) nextErrors.title = 'What are you doing?';
    if (!String(formData.date || '').trim()) nextErrors.date = 'Pick a date';
    if (!String(formData.time || '').trim()) nextErrors.time = 'What time?';
    if (!String(formData.location || '').trim()) nextErrors.location = 'Where at?';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit();
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.5rem))] sm:pt-4 pb-0 sm:pb-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />

        <div
          className="relative w-full min-h-[72dvh] sm:min-h-0 sm:w-[26rem] max-h-[calc(100dvh-env(safe-area-inset-top))] sm:max-h-[90vh] rounded-t-[28px] rounded-b-none sm:rounded-[28px] shadow-2xl overflow-hidden border-t border-transparent dark:border-white/10 flex flex-col bg-white dark:bg-slate-950"
          style={{
            borderColor: themeAccentBorder,
          }}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="relative p-6 pb-5 border-b border-gray-200 dark:border-gray-700">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <div className="text-xs uppercase tracking-widest text-purple-600 dark:text-purple-400 font-semibold">
                  Plan ahead
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight" style={themeAccentHeadingStyle}>
                + Add Event
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                When, where, and what you're doing
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

        <div
          className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6 py-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] sm:pb-6 space-y-5"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            touchAction: 'pan-y',
          }}
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">
              What you're doing
            </label>
            <input
              autoFocus
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
                setErrors((prev) => ({ ...prev, title: null }));
              }}
              placeholder="Dinner, workout, meeting, coffee..."
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-base ${
                errors.title
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-400'
                  : 'border-gray-200 dark:border-white/10 focus:ring-purple-400'
              } bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2`}
            />
            {errors.title && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Date
            </label>

            <div className="flex gap-2 mb-2">
              {dateSuggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleDateSuggestionClick(suggestion.date)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    formData.date === formatDateString(suggestion.date)
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {suggestion.label}
                </button>
              ))}
              <button
                type="button"
                onClick={openDatePicker}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
                aria-label="Open calendar"
                title="Open calendar"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={openDatePicker}
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                errors.date
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/40'
              } bg-white dark:bg-white/[0.04]`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${selectedDateObject ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {selectedDateLabel}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.date || 'Open the calendar to choose the right day'}
                  </div>
                </div>
                <span className="shrink-0 rounded-xl bg-purple-100 dark:bg-purple-500/10 p-2 text-purple-600 dark:text-purple-300">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
            </button>

            {showCalendarPanel && (
              <div className="mt-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-orange-500/10">
                  <button
                    type="button"
                    onClick={() => setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    className="rounded-lg p-2 text-gray-500 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/5 transition-all"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                      <div
                        key={day}
                        className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const dateValue = formatDateString(day);
                      const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
                      const isSelected = formData.date === dateValue;
                      const isToday = dateValue === todayKey;

                      return (
                        <button
                          key={dateValue}
                          type="button"
                          onClick={() => handleCalendarDayClick(day)}
                          className={`aspect-square rounded-xl text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-md'
                              : isToday
                                ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-200'
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

            {errors.date && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Time
            </label>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {timeSuggestions.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleTimeSuggestionClick(time)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    formData.time === time
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={formData.time}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, time: e.target.value }));
                setErrors((prev) => ({ ...prev, time: null }));
              }}
              placeholder="3:30 PM or 15:30"
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                errors.time
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-400'
                  : 'border-gray-200 dark:border-white/10 focus:ring-purple-400'
              } bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2`}
            />
            {errors.time && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                {errors.time}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </label>
            <PlacesAutocomplete
              value={formData.location}
              onSelect={(val) => {
                setFormData((prev) => ({ ...prev, location: val || '' }));
                setErrors((prev) => ({ ...prev, location: null }));
              }}
              placeholder="Search for a place..."
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-base ${
                errors.location
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-400'
                  : 'border-gray-200 dark:border-white/10 focus:ring-purple-400'
              } bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2`}
            />
            {errors.location && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                {errors.location}
              </p>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={validateAndSubmit}
              className="flex-1 px-5 py-3.5 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              style={themeAccentButtonStyle}
            >
              + Save Event
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3.5 rounded-xl font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              style={themeAccentSoftButtonStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
};

export default AddEventModal;
