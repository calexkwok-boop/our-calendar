import React, { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, Sparkles, ChevronLeft, ChevronRight, Users, Copy, Check, Settings, Lock, AlertTriangle, Repeat, Home, Compass } from 'lucide-react';

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

const extractHexColor = (...values) => {
  for (const value of values) {
    const match = String(value || '').match(/#[0-9a-fA-F]{3,8}/);
    if (match) return match[0];
  }
  return '#8b5cf6';
};

const hexToRgba = (hex, alpha = 1) => {
  const raw = String(hex || '').replace('#', '').trim();
  const normalized = raw.length === 3
    ? raw.split('').map((ch) => `${ch}${ch}`).join('')
    : raw.slice(0, 6);
  const int = Number.parseInt(normalized || '8b5cf6', 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  shareLink,
  PlacesAutocomplete,
  darkMode,
  themeAccentButtonStyle,
  themeAccentHeadingStyle,
  themeAccentBorder,
  themeAccentSoftButtonStyle,
  categories,
}) => {
  const [errors, setErrors] = useState({});
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select a temp textarea
      const el = document.createElement('textarea');
      el.value = shareLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareLink]);
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

  const activeAccent = extractHexColor(
    themeAccentButtonStyle?.backgroundColor,
    themeAccentButtonStyle?.background,
    themeAccentHeadingStyle?.color,
    themeAccentBorder,
  );
  const themedGradient = `linear-gradient(90deg, ${activeAccent}, ${hexToRgba(activeAccent, 0.68)})`;
  const themedSoftSurface = darkMode ? hexToRgba(activeAccent, 0.14) : hexToRgba(activeAccent, 0.08);
  const themedSoftSurfaceStrong = darkMode ? hexToRgba(activeAccent, 0.22) : hexToRgba(activeAccent, 0.14);
  const themedBorder = darkMode ? hexToRgba(activeAccent, 0.36) : hexToRgba(activeAccent, 0.24);
  const inactiveChipStyle = {
    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : themedBorder,
    background: darkMode ? 'rgba(255,255,255,0.04)' : '#fff',
    color: darkMode ? '#d1d5db' : '#4b5563',
  };
  const activeChipStyle = {
    ...themeAccentButtonStyle,
    borderColor: 'transparent',
    color: '#fff',
    boxShadow: `0 8px 22px ${hexToRgba(activeAccent, 0.24)}`,
  };

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

  const handleLocationPresetClick = (value) => {
    setFormData((prev) => ({ ...prev, location: value }));
    setErrors((prev) => ({ ...prev, location: null }));
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation || locatingCurrent) return;
    setLocatingCurrent(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);
        const nextLocation = Number.isFinite(lat) && Number.isFinite(lng)
          ? `Current location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          : 'Current location';
        handleLocationPresetClick(nextLocation);
        setLocatingCurrent(false);
      },
      () => {
        handleLocationPresetClick('Current location');
        setLocatingCurrent(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
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
      className={`${darkMode ? 'dark' : ''} fixed inset-0 z-[11010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm`}
    >
      <div className="absolute inset-0" onClick={onClose} />

        <div
          id="add-event-modal-panel"
          className="relative w-full max-w-lg max-h-[min(88dvh,44rem)] rounded-[28px] shadow-2xl border border-white/40 dark:border-white/10 flex flex-col bg-white dark:bg-slate-950"
          style={{
            borderColor: themeAccentBorder,
            boxShadow: `0 24px 70px ${hexToRgba(activeAccent, 0.22)}`,
            fontFamily: "'Caveat', cursive",
          }}
          onClick={(e) => e.stopPropagation()}
        >
        <style>{`#add-event-modal-panel, #add-event-modal-panel * { font-family: 'Caveat', cursive !important; } #add-event-modal-panel .sans-override, #add-event-modal-panel .sans-override * { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important; }`}</style>
        <div className="relative p-6 pb-5 border-b border-gray-200 dark:border-gray-700 rounded-t-[28px] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: themedGradient }} />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5" style={{ color: activeAccent }} />
                <div className="sans-override text-sm uppercase tracking-widest font-semibold" style={{ color: activeAccent }}>
                  {shareLink ? 'Event created' : 'Plan ahead'}
                </div>
              </div>
              <h2 className="text-4xl font-bold tracking-tight" style={themeAccentHeadingStyle}>
                {shareLink ? '🎉 Invite friends' : '+ Add Event'}
              </h2>
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
          {shareLink ? (
            <div className="space-y-5" style={{ fontFamily: "'Caveat', cursive" }}>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Your event was saved. Share this link so friends can join.
              </p>
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] px-4 py-3 flex items-center gap-3">
                <span className="flex-1 text-base text-gray-800 dark:text-gray-200 break-all select-all" style={{ fontFamily: 'monospace' }}>{shareLink}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-lg font-bold transition-all text-white"
                  style={{ ...themeAccentButtonStyle, fontFamily: "'Caveat', cursive" }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-xl text-xl font-bold transition-all text-white"
                style={{ ...themeAccentButtonStyle, fontFamily: "'Caveat', cursive" }}
              >
                Done
              </button>
            </div>
          ) : (
          <>
          <div className="sans-override">
            <label className="block text-sm font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">
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
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-xl ${
                errors.title
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-400'
                  : 'border-gray-200 dark:border-white/10 focus:ring-0'
              } bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2`}
              style={!errors.title ? { borderColor: themedBorder } : undefined}
            />
            {errors.title && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                {errors.title}
              </p>
            )}
          </div>

          <div className="sans-override">
            <label className="block text-sm font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Date
            </label>

            <div className="flex gap-2 mb-2">
              {dateSuggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleDateSuggestionClick(suggestion.date)}
                  className="px-3 py-1.5 rounded-lg border text-base font-medium transition-all"
                  style={
                    formData.date === formatDateString(suggestion.date)
                      ? activeChipStyle
                      : { ...inactiveChipStyle, background: themedSoftSurface }
                  }
                >
                  {suggestion.label}
                </button>
              ))}
              <button
                type="button"
                onClick={openDatePicker}
                className="px-3 py-1.5 rounded-lg border text-base font-medium transition-all flex items-center justify-center"
                style={{ ...inactiveChipStyle, background: themedSoftSurface }}
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
                  : 'border-gray-200 dark:border-white/10'
              } bg-white dark:bg-white/[0.04]`}
              style={!errors.date ? { borderColor: themedBorder } : undefined}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-xl font-medium ${selectedDateObject ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {selectedDateLabel}
                  </div>
                  <div className="text-base text-gray-500 dark:text-gray-400 mt-1">
                    {formData.date || 'Open the calendar to choose the right day'}
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-xl p-2"
                  style={{ background: themedSoftSurfaceStrong, color: activeAccent }}
                >
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
            </button>

            {showCalendarPanel && (
              <div
                className="mt-3 rounded-2xl border bg-white dark:bg-[#0f172a] shadow-xl overflow-hidden"
                style={{ borderColor: themedBorder }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10"
                  style={{
                    background: darkMode
                      ? themedSoftSurface
                      : `linear-gradient(90deg, ${hexToRgba(activeAccent, 0.12)}, ${hexToRgba(activeAccent, 0.04)})`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    className="rounded-lg p-2 text-gray-500 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/5 transition-all"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
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
                          className="px-1 py-2 text-center text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
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
                          className={`aspect-square rounded-xl text-base font-medium transition-all ${
                            isSelected
                              ? 'text-white'
                              : isToday
                                ? ''
                                : isCurrentMonth
                                  ? 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                                  : 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                          }`}
                          style={
                            isSelected
                              ? activeChipStyle
                              : isToday
                                ? { border: `1px solid ${themedBorder}`, background: themedSoftSurfaceStrong, color: activeAccent }
                                : undefined
                          }
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
              <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                {errors.date}
              </p>
            )}
          </div>

          <div className="sans-override">
            <label className="block text-sm font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Time
            </label>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {timeSuggestions.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleTimeSuggestionClick(time)}
                  className="px-3 py-1.5 rounded-lg border text-base font-medium transition-all"
                  style={formData.time === time ? activeChipStyle : { ...inactiveChipStyle, background: themedSoftSurface }}
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
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-xl ${
                errors.time
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-400'
                  : 'border-gray-200 dark:border-white/10 focus:ring-0'
              } bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2`}
              style={!errors.time ? { borderColor: themedBorder } : undefined}
            />
            {errors.time && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                {errors.time}
              </p>
            )}
          </div>

          <div className="sans-override">
            <label className="block text-sm font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleLocationPresetClick('Home')}
                className="px-3 py-1.5 rounded-lg border text-base font-medium transition-all inline-flex items-center gap-1.5"
                style={String(formData.location || '').trim().toLowerCase() === 'home' ? activeChipStyle : { ...inactiveChipStyle, background: themedSoftSurface }}
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locatingCurrent}
                className="px-3 py-1.5 rounded-lg border text-base font-medium transition-all inline-flex items-center gap-1.5 disabled:opacity-70"
                style={String(formData.location || '').trim().toLowerCase().startsWith('current location') ? activeChipStyle : { ...inactiveChipStyle, background: themedSoftSurface }}
              >
                <Compass className="w-3.5 h-3.5" />
                {locatingCurrent ? 'Locating...' : 'Current location'}
              </button>
            </div>
            <PlacesAutocomplete
              value={formData.location}
              onSelect={(val) => {
                setFormData((prev) => ({ ...prev, location: val || '' }));
                setErrors((prev) => ({ ...prev, location: null }));
              }}
              placeholder="Search for a place..."
              className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all text-xl ${
                errors.location
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-400'
                  : 'border-gray-200 dark:border-white/10 focus:ring-0'
              } bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2`}
              inputStyle={!errors.location ? { borderColor: themedBorder } : undefined}
            />
            {errors.location && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                {errors.location}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const next = !showInvite;
                  setShowInvite(next);
                  setFormData((prev) => ({ ...prev, inviteFriends: next }));
                }}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-lg font-semibold transition-all ${
                  showInvite
                    ? 'text-white shadow-sm'
                    : 'hover:bg-gray-50 dark:hover:bg-white/[0.07]'
                }`}
                style={showInvite ? activeChipStyle : inactiveChipStyle}
              >
                <Users className="w-4 h-4" />
                {showInvite ? 'Inviting friends' : '+ Invite friends'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedSettings((v) => !v)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-lg font-semibold transition-all ${
                  showAdvancedSettings
                    ? 'text-white shadow-sm'
                    : 'hover:bg-gray-50 dark:hover:bg-white/[0.07]'
                }`}
                style={showAdvancedSettings ? activeChipStyle : inactiveChipStyle}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
            {showInvite && (
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 pl-1">What kind of event?</p>
                <div className="flex gap-2">
                  {[
                    { id: 'party', emoji: '🎉', label: 'Party' },
                    { id: 'sports', emoji: '🏃', label: 'Sports' },
                    { id: 'hangout', emoji: '☕', label: 'Hangout' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, weEventType: t.id }))}
                      className="flex-1 flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-lg font-semibold transition-all"
                      style={
                        formData.weEventType === t.id
                          ? activeChipStyle
                          : inactiveChipStyle
                      }
                    >
                      <span className="text-2xl">{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 pl-1">A share link will be generated after saving.</p>
              </div>
            )}
            {showAdvancedSettings && (
              <div
                className="rounded-2xl border p-4 space-y-4"
                style={{ borderColor: themedBorder, background: darkMode ? 'rgba(255,255,255,0.03)' : themedSoftSurface }}
              >
                {categories && Object.keys(categories).filter(k => k !== 'popup_event').length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(categories).filter(([k]) => k !== 'popup_event').map(([key, cat]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, category: key }))}
                          className={`rounded-2xl px-3 py-2 text-base font-semibold transition-all ${
                            formData.category === key
                              ? `${cat.color} text-white shadow-sm scale-[1.02]`
                              : `${cat.lightBg} ${cat.text} hover:shadow-sm`
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Event Properties</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isPrivate: !prev.isPrivate }))}
                      className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-base font-semibold transition-all ${
                        formData.isPrivate
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md'
                          : ''
                      }`}
                      style={!formData.isPrivate ? inactiveChipStyle : undefined}
                    >
                      <Lock className="w-4 h-4" />
                      {formData.isPrivate ? 'Private' : 'Shared'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isUrgent: !prev.isUrgent }))}
                      className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-base font-semibold transition-all ${
                        formData.isUrgent
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md'
                          : ''
                      }`}
                      style={!formData.isUrgent ? inactiveChipStyle : undefined}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {formData.isUrgent ? 'Urgent' : 'Normal'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                    <Repeat className="w-3.5 h-3.5" />
                    Recurrence
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'once', label: 'One-time' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'annual', label: 'Annual' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, recurrence: opt.value }))}
                        className={`rounded-2xl border px-3 py-2.5 text-base font-semibold transition-all ${
                          (formData.recurrence || 'once') === opt.value
                            ? 'text-white shadow-sm scale-[1.02]'
                            : ''
                        }`}
                        style={(formData.recurrence || 'once') === opt.value ? activeChipStyle : inactiveChipStyle}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={validateAndSubmit}
              className="flex-1 px-5 py-3.5 rounded-xl text-xl text-white font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-0"
              style={themeAccentButtonStyle}
            >
              + Save Event
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3.5 rounded-xl text-xl font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              style={themeAccentSoftButtonStyle}
            >
              Cancel
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
};

export default AddEventModal;
