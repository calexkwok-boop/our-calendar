import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Clock, Lock, Repeat, Settings, User, Users } from 'lucide-react';

const DEFAULT_PARTNER = { name: 'Calendar Partner', avatar: '👤' };

const WE_EVENT_TEMPLATES = [
  {
    id: 'party',
    emoji: '🎉',
    label: 'Party',
    examples: ['Birthday Party', 'House Party', 'Holiday Party', 'Game Night'],
    placeholder: 'Birthday party, game night, celebration...',
    suggestedTimes: ['18:00', '19:00', '20:00'],
  },
  {
    id: 'celebration',
    emoji: '🥳',
    label: 'Celebration',
    examples: ['Wedding', 'Engagement', 'Baby Shower', 'Graduation'],
    placeholder: 'Wedding, baby shower, graduation...',
    suggestedTimes: ['14:00', '15:00', '16:00'],
  },
  {
    id: 'sports',
    emoji: '🏃',
    label: 'Sports',
    examples: ['Pickleball', 'Tennis', 'Basketball', 'Soccer', 'Golf'],
    placeholder: 'Pickleball, tennis, pickup basketball...',
    suggestedTimes: ['09:00', '10:00', '17:00', '18:00'],
  },
  {
    id: 'hangout',
    emoji: '☕',
    label: 'Hangout',
    examples: ['Coffee', 'Drinks', 'Brunch', 'Movie Night', 'BBQ'],
    placeholder: 'Coffee, drinks, brunch, movie night...',
    suggestedTimes: ['10:00', '11:00', '19:00'],
  },
  {
    id: 'kids',
    emoji: '🎈',
    label: 'Kids Event',
    examples: ['Playdate', 'Birthday Party', 'School Event', 'Sports Practice'],
    placeholder: 'Playdate, birthday party, school event...',
    suggestedTimes: ['14:00', '15:00', '16:00'],
  },
  {
    id: 'custom',
    emoji: '✨',
    label: 'Custom',
    examples: [],
    placeholder: 'What are we doing?',
    suggestedTimes: [],
  },
];

const formatDate = (date) => {
  const resolved = date instanceof Date ? date : new Date(date || Date.now());
  return resolved.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const toTimeLabel = (time) => {
  if (!time) return '';
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const parseTimeInput = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  const directMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (directMatch) return normalized;
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toLowerCase();
  if (minutes < 0 || minutes > 59 || hours < 0 || hours > 23) return null;
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  if (!period && hours > 23) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const buildCategoryOverride = (eventType, weEventCategory, title, categories) => {
  if (eventType === 'we') return 'popup_event';
  const available = categories && typeof categories === 'object' ? categories : {};
  const text = [weEventCategory, title].filter(Boolean).join(' ').toLowerCase();
  if (
    available.social
    && /(birthday|party|celebration|shower|graduation|wedding|engagement|playdate|family|friends|gathering)/.test(text)
  ) {
    return 'social';
  }
  return available.other ? 'other' : Object.keys(available)[0] || 'other';
};

const buildWeEventMetadata = (category) => {
  switch (String(category || '').trim()) {
    case 'party':
      return { theme: '', potluckItems: [], musicPlaylist: '', plusOnesAllowed: true };
    case 'celebration':
      return { dressCode: '', registryLink: '', schedule: [] };
    case 'kids':
      return { ageRange: '', activity: '', parentRequired: true, allergenAlerts: [] };
    case 'hangout':
      return { expectedDuration: '', reservationName: '', billSplitting: 'separate' };
    default:
      return {};
  }
};

const getWeEventDisplayBadge = (event, popupMeta) => {
  const normalizedCategory = String(
    popupMeta?.category
    || popupMeta?.popupSubtype
    || event?.popupSubtype
    || event?.event_data?.category
    || event?.event_data?.popupSubtype
    || event?.category
    || ''
  ).trim().toLowerCase();
  const text = `${event?.title || ''} ${event?.description || ''}`.toLowerCase();
  const isWeEventLike = Boolean(popupMeta)
    || normalizedCategory === 'popup_event'
    || ['party', 'celebration', 'hangout', 'kids', 'custom', 'sports'].includes(normalizedCategory)
    || /\b(birthday|party|wedding|shower|celebration|engagement|graduation|hangout|brunch|coffee|drinks|playdate|kids event|game night|sports)\b/.test(text);

  if (!isWeEventLike) return null;
  if (normalizedCategory === 'party' || /\b(party|birthday|holiday|game night)\b/.test(text)) {
    return { icon: '🥳', label: 'We Event', className: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200' };
  }
  if (/\bwedding\b/.test(text)) {
    return { icon: '💍', label: 'We Event', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' };
  }
  if (/\bbaby shower\b/.test(text)) {
    return { icon: '👶', label: 'We Event', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' };
  }
  if (normalizedCategory === 'celebration' || /\b(engagement|shower|graduation|celebration)\b/.test(text)) {
    return { icon: '🎈', label: 'We Event', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' };
  }
  if (normalizedCategory === 'kids' || /\b(playdate|kids|school|family)\b/.test(text)) {
    return { icon: '🎈', label: 'We Event', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200' };
  }
  if (/\bcoffee\b/.test(text)) {
    return { icon: '☕', label: 'We Event', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200' };
  }
  if (normalizedCategory === 'hangout' || /\b(hangout|brunch|drinks|movie)\b/.test(text)) {
    return { icon: '🎉', label: 'We Event', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200' };
  }
  return { icon: '🎉', label: 'We Event', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' };
};

const baseInputClassName = 'w-full min-w-0 rounded-xl border px-4 py-3 text-base transition-all outline-none';

export default function DateDetailsCardEnhanced({
  isOpen = false,
  selectedDate,
  selectedEvents = [],
  popupEventsByEventId = {},
  popupSignupsByEventId = {},
  user,
  onClose,
  onSaveEvent,
  onAddEvent,
  onEventClick,
  handleQuickAdd,
  handleDeleteEvent,
  handleUpdateEventField,
  openRecurringDeletePrompt,
  eventSwipeDrag = { id: null, offset: 0 },
  swipedEventKey = null,
  handleEventSwipeStart,
  handleEventSwipeMove,
  handleEventSwipeEnd,
  startEventSwipeDrag,
  moveEventSwipeDrag,
  endEventSwipeDrag,
  formatTime = (value) => value,
  resolveHandleLikeLabel = (value) => value,
  getLayerForEvent = () => null,
  getEventRelationshipStatus = () => 'none',
  setEventRelationshipStatus,
  canDeleteEventInActiveLayer = () => false,
  getDateKey = (date) => String(date || ''),
  hexToRgba = () => 'rgba(255,255,255,0.2)',
  mixHexColors = (left) => left,
  setIsPopupEventDraft,
  popupEventMaxPeopleDraft,
  setPopupEventMaxPeopleDraft,
  categories = {},
  selectedCategory = 'other',
  setSelectedCategory,
  isPrivate = false,
  setIsPrivate,
  isUrgent = false,
  setIsUrgent,
  recurrence = 'once',
  setRecurrence,
  darkMode = false,
  themeAccentButtonStyle,
  themeAccentHeadingStyle,
  POPUP_NO_MAX_SENTINEL = 999999,
  CATEGORY_GLASS = {},
  editingEvent,
  setEditingEvent,
  setSelectedPopupEventPanelId,
  PlacesAutocomplete,
  handleLocationLinkClick = () => {},
  calendarPartner = DEFAULT_PARTNER,
  leavePopupEvent,
  joinPopupEvent,
}) {
  const [eventTitle, setEventTitle] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState({ lat: null, lng: null });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [invitees, setInvitees] = useState([{ id: 'partner', ...calendarPartner, selected: true }]);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedSelectedTime = parseTimeInput(selectedTime);
  const popupNoMaxDraft = Number(popupEventMaxPeopleDraft || 0) >= POPUP_NO_MAX_SENTINEL;
  const canSaveEvent = Boolean(eventTitle.trim() && normalizedSelectedTime);
  const accent = (themeAccentButtonStyle && themeAccentButtonStyle.backgroundColor) || '#a855f7';
  const selectedDateKey = getDateKey(selectedDate);

  useEffect(() => {
    if (!isOpen) {
      setEventTitle('');
      setLocation('');
      setLocationCoords({ lat: null, lng: null });
      setLocationSuggestions([]);
      setSelectedTime('');
      setShowInvite(false);
      setInvitees([{ id: 'partner', ...calendarPartner, selected: true }]);
      setShowAddPeople(false);
      setShowAdvancedSettings(false);
      setSearchQuery('');
    }
  }, [calendarPartner, isOpen]);

  if (!isOpen) return null;

  const panelSurface = darkMode
    ? 'bg-slate-950 border border-white/10 text-white'
    : 'bg-white border border-black/5 text-gray-900';
  const mutedText = darkMode ? 'text-white/65' : 'text-gray-500';
  const labelText = darkMode ? 'text-white/80' : 'text-gray-700';
  const inputSurface = darkMode
    ? `${baseInputClassName} border-white/10 bg-white/5 text-white placeholder:text-white/35 focus:border-white/20 focus:bg-white/10`
    : `${baseInputClassName} border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white`;
  const softButton = darkMode
    ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100';
  const accentSoftBackground = darkMode ? hexToRgba(accent, 0.16) : hexToRgba(accent, 0.08);
  const accentSurfaceBackground = darkMode ? hexToRgba(accent, 0.12) : hexToRgba(accent, 0.05);
  const accentBorderColor = darkMode ? hexToRgba(accent, 0.42) : hexToRgba(accent, 0.24);
  const accentStrongBorderColor = darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.32);
  const themedWeCardStyle = {
    borderColor: accentBorderColor,
    background: darkMode
      ? `linear-gradient(135deg, ${hexToRgba(accent, 0.18)} 0%, rgba(15,23,42,0.78) 100%)`
      : `linear-gradient(135deg, ${hexToRgba(accent, 0.12)} 0%, rgba(255,255,255,0.96) 100%)`,
  };
  const themedWeTemplateStyle = {
    borderColor: accentBorderColor,
    background: darkMode
      ? `linear-gradient(135deg, ${hexToRgba(accent, 0.14)} 0%, rgba(15,23,42,0.82) 100%)`
      : `linear-gradient(135deg, ${hexToRgba(accent, 0.1)} 0%, rgba(255,255,255,0.98) 100%)`,
  };
  const themedWeChipStyle = {
    backgroundColor: accentSoftBackground,
    color: accent,
  };
  const themedWeSectionStyle = {
    borderColor: accentBorderColor,
    background: darkMode
      ? `linear-gradient(135deg, ${hexToRgba(accent, 0.12)} 0%, rgba(15,23,42,0.82) 100%)`
      : `linear-gradient(135deg, ${hexToRgba(accent, 0.08)} 0%, rgba(255,255,255,0.98) 100%)`,
  };

  const handleLocationSearch = async (query) => {
    setLocation(query);
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    if (window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions({ input: query }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setLocationSuggestions(predictions || []);
        } else {
          setLocationSuggestions([]);
        }
      });
    }
  };

  const selectLocation = async (place) => {
    const nextLocation = String(place?.description || place?.structured_formatting?.main_text || '').trim();
    setLocation(nextLocation);
    setLocationSuggestions([]);
    if (!place?.place_id || !window.google?.maps?.places) {
      setLocationCoords({ lat: null, lng: null });
      return;
    }
    try {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        { placeId: place.place_id, fields: ['geometry', 'formatted_address', 'name'] },
        (details, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && details?.geometry?.location) {
            setLocation(details.formatted_address || details.name || nextLocation);
            setLocationCoords({
              lat: details.geometry.location.lat(),
              lng: details.geometry.location.lng(),
            });
            return;
          }
          setLocationCoords({ lat: null, lng: null });
        }
      );
    } catch {
      setLocationCoords({ lat: null, lng: null });
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation(`Current location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
      setLocationCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLocationSuggestions([]);
    });
  };

  const toggleInvitee = (id) => {
    setInvitees((prev) => prev.map((invitee) => (
      invitee.id === id ? { ...invitee, selected: !invitee.selected } : invitee
    )));
  };

  const searchContacts = (query) => {
    const mockContacts = [
      { id: '1', name: 'Alex Johnson', avatar: '👨' },
      { id: '2', name: 'Maria Garcia', avatar: '👩' },
      { id: '3', name: 'James Lee', avatar: '👨‍💼' },
      { id: '4', name: 'Emma Wilson', avatar: '👩‍🦰' },
      { id: '5', name: 'David Chen', avatar: '👨‍🎓' },
      { id: '6', name: 'Sophie Taylor', avatar: '👩‍💻' },
    ];
    return mockContacts.filter((contact) => (
      String(contact?.name || '').toLowerCase().includes(String(query || '').toLowerCase())
    ));
  };

  const addInvitee = (contact) => {
    setInvitees((prev) => (
      prev.some((invitee) => invitee.id === contact.id)
        ? prev
        : [...prev, { ...contact, selected: true }]
    ));
    setSearchQuery('');
    setShowAddPeople(false);
  };

  const handleClose = () => {
    onClose?.();
  };

  const handleSave = async () => {
    if (!eventTitle.trim() || !normalizedSelectedTime) return;
    const hasInvitees = showInvite && invitees.some((inv) => inv.selected);
    const eventData = {
      title: eventTitle.trim(),
      location: location.trim(),
      locationLat: locationCoords.lat,
      locationLng: locationCoords.lng,
      date: selectedDate,
      time: normalizedSelectedTime,
      invitees: hasInvitees ? invitees.filter((inv) => inv.selected) : [],
    };

    if (typeof onSaveEvent === 'function') {
      await onSaveEvent(eventData);
      handleClose();
      return;
    }

    if (typeof handleQuickAdd === 'function') {
      const categoryOverride = buildCategoryOverride('me', null, eventData.title, categories);
      if (hasInvitees) {
        try { setIsPopupEventDraft?.(true); } catch {}
        if (!String(popupEventMaxPeopleDraft || '').trim()) setPopupEventMaxPeopleDraft?.('10');
      }
      const result = await handleQuickAdd({
        titleOverride: eventData.title,
        time: eventData.time || null,
        directCreate: true,
        isPopupEvent: hasInvitees,
        categoryOverride: selectedCategory || categoryOverride,
        locationOverride: eventData.location || '',
        locationLat: eventData.locationLat,
        locationLng: eventData.locationLng,
      });
      if (result?.ok || result === true) {
        handleClose();
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" onClick={handleClose} />

      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-0 sm:px-6 sm:pb-6">
        <div
          className={`max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] sm:rounded-[32px] shadow-2xl ${panelSurface}`}
          onClick={(event) => event.stopPropagation()}
        >
          <style>{`#date-details-panel, #date-details-panel * { font-family: 'Caveat', cursive !important; }`}</style>
          <div id="date-details-panel" className="space-y-5 p-6 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))]" style={{ fontFamily: "'Caveat', cursive" }}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">+ Add Event</h2>
                <p className={`mt-0.5 text-sm ${mutedText}`}>{formatDate(selectedDate || new Date())}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${darkMode ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(
              <>
                <button
                  type="button"
                  onClick={() => onAddEvent?.()}
                  className="w-full rounded-2xl py-4 text-lg font-bold text-white transition-all shadow-sm"
                  style={themeAccentButtonStyle}
                >
                  + Add Event
                </button>
              </>
            )}

            {false && (
              <>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${labelText}`}>What</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(event) => setEventTitle(event.target.value)}
                    placeholder="Dinner, workout, coffee, movie night..."
                    className={inputSurface}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Where</label>
                  <div className="mb-2.5 flex gap-2">
                    <button type="button" onClick={useCurrentLocation} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${softButton}`}>
                      <span>📍</span>
                      <span>Current</span>
                    </button>
                    <button type="button" onClick={() => { setLocation('Home'); setLocationSuggestions([]); }} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${softButton}`}>
                      <span>🏠</span>
                      <span>Home</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => {
                        setLocationCoords({ lat: null, lng: null });
                        handleLocationSearch(event.target.value);
                      }}
                      placeholder="Search for a place..."
                      className={inputSurface}
                    />
                    {locationSuggestions.length > 0 ? (
                      <div className={`absolute left-0 right-0 top-full z-10 mt-2 max-h-60 overflow-y-auto rounded-xl border shadow-lg ${darkMode ? 'border-white/10 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                        {locationSuggestions.map((place) => (
                          <button
                            key={place.place_id}
                            type="button"
                            onClick={() => selectLocation(place)}
                            className={`w-full border-b px-4 py-3 text-left transition-colors last:border-b-0 ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}
                          >
                            <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{place.structured_formatting.main_text}</div>
                            <div className={`mt-0.5 text-sm ${mutedText}`}>{place.structured_formatting.secondary_text}</div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${labelText}`}>What time?</label>

                  <div className={`rounded-2xl border p-3 ${darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-gray-50/60'}`}>
                    <input
                      type="text"
                      value={selectedTime}
                      onChange={(event) => setSelectedTime(event.target.value)}
                      placeholder="e.g. 6:00 PM"
                      inputMode="text"
                      className={`${inputSurface} min-w-0 max-w-full overflow-hidden py-2.5 pr-3 text-[15px]`}
                      style={{ width: '100%' }}
                    />
                  </div>
                  {!normalizedSelectedTime ? (
                    <p className={`mt-2 text-xs ${mutedText}`}>Add a time to create the event.</p>
                  ) : null}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => { setShowInvite((v) => !v); setShowAddPeople(false); }}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      showInvite
                        ? 'text-white shadow-sm'
                        : (darkMode ? 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')
                    }`}
                    style={showInvite ? themeAccentButtonStyle : undefined}
                  >
                    <Users className="h-4 w-4" />
                    {showInvite ? 'Inviting friends' : '+ Invite friends'}
                  </button>

                  {showInvite ? (
                    <div className={`mt-3 space-y-3 rounded-2xl border p-4 ${darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50/60'}`}>
                      <div className="flex flex-wrap gap-2">
                        {invitees.map((invitee) => (
                          <button
                            key={invitee.id}
                            type="button"
                            onClick={() => toggleInvitee(invitee.id)}
                            className={`flex items-center gap-2 rounded-full px-3 py-2 font-medium transition-all ${
                              invitee.selected
                                ? ''
                                : (darkMode ? 'border-2 border-white/10 bg-white/5 text-white/55' : 'border-2 border-gray-200 bg-white/60 text-gray-500')
                            }`}
                            style={invitee.selected ? { borderColor: accentStrongBorderColor, backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : '#ffffff', color: accent, boxShadow: darkMode ? 'none' : '0 1px 3px rgba(15,23,42,0.08)' } : undefined}
                          >
                            <span className="text-lg">{invitee.avatar}</span>
                            <span className="text-sm">{invitee.name}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowAddPeople(true)}
                          className="rounded-full border-2 border-dashed px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
                          style={{ borderColor: accentStrongBorderColor, color: accent }}
                        >
                          + Add people
                        </button>
                      </div>
                      {showAddPeople ? (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search contacts..."
                            className={inputSurface}
                            autoFocus
                          />
                          {searchQuery ? (
                            <div className="max-h-40 space-y-1.5 overflow-y-auto">
                              {searchContacts(searchQuery).map((contact) => (
                                <button
                                  key={contact.id}
                                  type="button"
                                  onClick={() => addInvitee(contact)}
                                  className="flex w-full items-center gap-3 rounded-xl border p-2.5 transition-colors hover:opacity-95"
                                  style={{ borderColor: accentBorderColor, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff' }}
                                >
                                  <span className="text-xl">{contact.avatar}</span>
                                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contact.name}</span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedSettings((prev) => !prev)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                        darkMode
                          ? 'border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.07]'
                          : 'border-gray-200 bg-gray-50/90 text-gray-700 hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Additional Settings
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {showAdvancedSettings ? (
                      <div
                        className="mt-3 space-y-4 rounded-[22px] border p-4"
                        style={{
                          borderColor: accentBorderColor,
                          background: darkMode
                            ? `linear-gradient(135deg, ${hexToRgba(accent, 0.12)} 0%, rgba(15,23,42,0.82) 100%)`
                            : `linear-gradient(135deg, ${hexToRgba(accent, 0.08)} 0%, rgba(255,255,255,0.98) 100%)`,
                        }}
                      >
                        <div>
                          <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
                            Category
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(categories).filter(([key]) => key !== 'popup_event').map(([key, cat]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedCategory?.(key)}
                                className={`rounded-2xl px-3 py-2 text-xs font-semibold transition-all ${
                                  selectedCategory === key
                                    ? `${cat.color} text-white shadow-sm scale-[1.02]`
                                    : `${cat.lightBg} ${cat.text} hover:shadow-sm hover:scale-[1.01]`
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
                            Event Properties
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setIsPrivate?.(!isPrivate)}
                              className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${
                                isPrivate
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md'
                                  : 'border border-gray-200/90 bg-white/85 text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300'
                              }`}
                            >
                              <Lock className="h-4 w-4" />
                              {isPrivate ? 'Private' : 'Shared'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsUrgent?.(!isUrgent)}
                              className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${
                                isUrgent
                                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md'
                                  : 'border border-gray-200/90 bg-white/85 text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300'
                              }`}
                            >
                              <AlertTriangle className="h-4 w-4" />
                              {isUrgent ? 'Urgent' : 'Normal'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${mutedText}`}>
                            <Repeat className="h-3.5 w-3.5" />
                            Recurrence
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'once', label: 'One-time' },
                              { value: 'weekly', label: 'Weekly' },
                              { value: 'monthly', label: 'Monthly' },
                              { value: 'annual', label: 'Annual' },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setRecurrence?.(option.value)}
                                className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${
                                  recurrence === option.value
                                    ? 'text-white shadow-sm scale-[1.02]'
                                    : 'border border-gray-200/90 bg-white/85 text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300'
                                }`}
                                style={recurrence === option.value ? themeAccentButtonStyle : undefined}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSaveEvent}
                  className="w-full rounded-2xl py-4 text-lg font-bold text-white transition-all shadow-sm disabled:cursor-not-allowed"
                  style={canSaveEvent
                    ? themeAccentButtonStyle
                    : canSaveEvent ? {
                        ...(themeAccentButtonStyle || {}),
                        background: themeAccentButtonStyle?.backgroundColor
                          ? `linear-gradient(90deg, ${themeAccentButtonStyle.backgroundColor} 0%, ${hexToRgba(themeAccentButtonStyle.backgroundColor, 0.78)} 100%)`
                          : undefined,
                      } : {
                        background: darkMode
                          ? `linear-gradient(90deg, ${hexToRgba(accent, 0.26)} 0%, rgba(51,65,85,0.92) 100%)`
                          : `linear-gradient(90deg, ${hexToRgba(accent, 0.18)} 0%, rgba(241,245,249,0.96) 100%)`,
                        color: darkMode ? 'rgba(255,255,255,0.78)' : hexToRgba(accent, 0.72),
                        boxShadow: 'none',
                        border: `1px solid ${hexToRgba(accent, darkMode ? 0.24 : 0.16)}`,
                      }}
                >
                  + Save Event
                </button>
              </>
            )}

            {selectedEvents.length > 0 ? (
              <div className={darkMode ? 'border-t border-white/10' : 'border-t border-gray-200'} />
            ) : null}

            <div className="space-y-3">
              {selectedEvents.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mb-3 text-5xl">📅</div>
                  <p className={`mb-1 font-medium ${mutedText}`}>No events yet</p>
                  <p className={`text-sm ${mutedText}`}>Add your first event above</p>
                </div>
              ) : (
                selectedEvents.map((event) => {
                  const isEditingThisEvent = String(editingEvent || '') === String(event?.id || '');
                  const popupMeta = popupEventsByEventId[String(event.id || '')] || null;
                  const weEventBadge = getWeEventDisplayBadge(event, popupMeta);
                  const effectiveCategoryKey = weEventBadge ? 'popup_event' : (event.category || 'other');
                  const category = categories[effectiveCategoryKey] || categories.popup_event || categories.other || { label: 'Other', color: 'bg-gray-500' };
                  const categoryGlass = CATEGORY_GLASS[effectiveCategoryKey] || CATEGORY_GLASS.other || { from: '#f3f4f6', to: '#fafafa', accent: 'linear-gradient(180deg,#9ca3af,#6b7280)' };
                  const popupSignups = popupMeta ? (popupSignupsByEventId[String(event.id || '')] || []) : [];
                  const popupJoined = popupSignups.some((row) => String(row?.userId || '') === String(user?.id || ''));
                  const popupNoMax = popupMeta ? Number(popupMeta.maxPeople || 0) >= POPUP_NO_MAX_SENTINEL : false;
                  const popupFull = popupMeta ? (!popupNoMax && popupSignups.length >= Number(popupMeta.maxPeople || 1)) : false;
                  const eventLayer = getLayerForEvent(event);
                  const isPublicRegularEvent = Boolean(eventLayer?.is_public) && !popupMeta;
                  const eventRelationshipStatus = getEventRelationshipStatus(event);
                  const canDeleteThisEvent = canDeleteEventInActiveLayer(event);
                  const eventSwipeKey = `${String(event.date || selectedDateKey || '')}:${String(event.id || '')}`;
                  const rowOffset = eventSwipeDrag.id === eventSwipeKey ? eventSwipeDrag.offset : (swipedEventKey === eventSwipeKey ? -88 : 0);
                  const isDeleteRevealed = rowOffset < 0;

                  if (weEventBadge) {
                    return (
                      <div key={event.id} className="relative overflow-hidden rounded-2xl">
                        {canDeleteThisEvent ? (
                          <div className={`absolute inset-y-0 right-0 z-20 flex w-[88px] items-center justify-center transition-colors ${isDeleteRevealed ? 'bg-red-500 pointer-events-auto' : 'bg-transparent pointer-events-none'}`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(selectedDateKey, event.id, false, false, false);
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              className={`h-full w-full text-sm font-semibold transition-opacity ${isDeleteRevealed ? 'pointer-events-auto text-white opacity-100' : 'pointer-events-none text-transparent opacity-0'}`}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}

                        <div
                          className="relative z-10 cursor-pointer rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-rose-700 dark:from-rose-900/20 dark:to-pink-900/10"
                          style={{ transform: `translateX(${rowOffset}px)`, transition: eventSwipeDrag.id === eventSwipeKey ? 'none' : 'transform 180ms ease', touchAction: 'pan-y' }}
                          onClick={() => setSelectedPopupEventPanelId?.(String(event.id || ''))}
                          onTouchStart={(e) => handleEventSwipeStart?.(e, eventSwipeKey, canDeleteThisEvent)}
                          onTouchMove={handleEventSwipeMove}
                          onTouchEnd={handleEventSwipeEnd}
                          onTouchCancel={handleEventSwipeEnd}
                          onPointerDown={(e) => startEventSwipeDrag?.(e, eventSwipeKey, canDeleteThisEvent)}
                          onPointerMove={moveEventSwipeDrag}
                          onPointerUp={endEventSwipeDrag}
                          onPointerCancel={endEventSwipeDrag}
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex-1 pr-4">
                              <div className="mb-1 flex items-center gap-2">
                                <h4 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.title}</h4>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${weEventBadge.className}`}>{weEventBadge.label}</span>
                              </div>
                              <div className={`flex items-center gap-2 text-sm ${mutedText}`}>
                                {event.time ? (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatTime(event.time)}
                                  </span>
                                ) : null}
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  {popupSignups.length}{popupMeta ? (popupNoMax ? ' joined' : `/${popupMeta.maxPeople} spots`) : ' invited'}
                                </span>
                              </div>
                              {event.location ? (
                                <button
                                  type="button"
                                  className="mt-1 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                                  onClick={(e) => { e.stopPropagation(); handleLocationLinkClick(e, event.location); }}
                                >
                                  📍 {event.location}
                                </button>
                              ) : null}
                            </div>

                            {popupJoined ? (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); leavePopupEvent?.(event.id); }}
                                className="whitespace-nowrap rounded-lg border-2 bg-white px-4 py-2 text-sm font-semibold transition-all dark:bg-gray-800"
                                style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35), color: accent }}
                              >
                                ✓ Joined
                              </button>
                            ) : popupFull ? (
                              <button type="button" disabled className="whitespace-nowrap rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 opacity-60 dark:bg-gray-700 dark:text-gray-500">
                                Full
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); joinPopupEvent?.(event.id); }}
                                className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all"
                                style={themeAccentButtonStyle}
                              >
                                Join
                              </button>
                            )}
                          </div>

                          {popupSignups.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5 border-t border-rose-200/50 pt-2 dark:border-rose-700/50">
                              {popupSignups.slice(0, 4).map((signup) => (
                                <span key={signup.userId} className="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 dark:border-rose-600 dark:bg-gray-800 dark:text-rose-300">
                                  {signup.displayName || 'Member'}
                                </span>
                              ))}
                              {popupSignups.length > 4 ? (
                                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">+{popupSignups.length - 4} more</span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  const eventCardStyle = darkMode
                    ? {
                        background: `linear-gradient(135deg, ${hexToRgba(mixHexColors(categoryGlass.from, '#111827', 0.86), 0.96)} 0%, ${hexToRgba(mixHexColors(categoryGlass.to, '#111827', 0.9), 0.98)} 100%)`,
                        backdropFilter: 'blur(18px)',
                        borderColor: event.isVirtualAnnual ? '#7c3aed' : hexToRgba(mixHexColors(categoryGlass.from, '#94a3b8', 0.55), 0.42),
                        boxShadow: `0 14px 34px ${hexToRgba('#020617', 0.34)}`,
                      }
                    : {
                        background: `linear-gradient(130deg, ${categoryGlass.from}e0 0%, ${categoryGlass.to}f0 100%)`,
                        backdropFilter: 'blur(16px)',
                        borderColor: event.isVirtualAnnual ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                      };
                  const eventCardTitleStyle = { color: darkMode ? '#f8fafc' : '#111827' };
                  const eventCardBodyStyle = { color: darkMode ? '#cbd5e1' : '#4b5563' };
                  const eventCardMetaStyle = { color: darkMode ? '#94a3b8' : '#6b7280' };
                  const eventCardIconTone = darkMode ? '#fcd34d' : '#d97706';

                  return (
                    <div key={event.id} className={`relative overflow-hidden rounded-2xl ${event.isVirtualAnnual ? 'border-dashed' : ''}`}>
                      {canDeleteThisEvent ? (
                        <div className={`absolute inset-y-0 right-0 z-20 flex w-[88px] items-center justify-center transition-colors ${isDeleteRevealed ? 'bg-red-500 pointer-events-auto' : 'bg-transparent pointer-events-none'}`}>
                          <button
                            type="button"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              const isRepeating = event.isVirtualAnnual || event.isVirtualRecurrence || (event.recurrence && event.recurrence !== 'once');
                              if (isRepeating) openRecurringDeletePrompt({ dateKey: selectedDateKey, event });
                              else handleDeleteEvent(selectedDateKey, event.id, false, false, false);
                            }}
                            onPointerDown={(clickEvent) => clickEvent.stopPropagation()}
                            onTouchStart={(clickEvent) => clickEvent.stopPropagation()}
                            className={`h-full w-full text-sm font-semibold transition-opacity ${isDeleteRevealed ? 'pointer-events-auto text-white opacity-100' : 'pointer-events-none text-transparent opacity-0'}`}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}

                      <div
                        className={`relative z-10 overflow-hidden rounded-2xl border border-white/50 shadow-lg transition-all hover:-translate-y-0.5 ${event.isVirtualAnnual ? 'border-dashed' : ''}`}
                        style={{ ...eventCardStyle, transform: `translateX(${rowOffset}px)`, transition: eventSwipeDrag.id === eventSwipeKey ? 'none' : 'transform 180ms ease', touchAction: 'pan-y' }}
                        onClick={() => {
                          if (isEditingThisEvent) return;
                          const isPopupLike = Boolean(
                            popupMeta
                            || weEventBadge
                            || event?.isPopup
                            || event?.category === 'popup_event'
                          );
                          if (isPopupLike) {
                            if (typeof onEventClick === 'function') {
                              onEventClick(event);
                            } else {
                              setSelectedPopupEventPanelId?.(String(event?.id || ''));
                            }
                            return;
                          }
                          if (typeof onEventClick === 'function') {
                            onEventClick(event);
                          } else {
                            setEditingEvent?.(String(event?.id || ''));
                          }
                        }}
                        onTouchStart={(touchEvent) => handleEventSwipeStart?.(touchEvent, eventSwipeKey, canDeleteThisEvent)}
                        onTouchMove={handleEventSwipeMove}
                        onTouchEnd={handleEventSwipeEnd}
                        onTouchCancel={handleEventSwipeEnd}
                        onPointerDown={(pointerEvent) => startEventSwipeDrag?.(pointerEvent, eventSwipeKey, canDeleteThisEvent)}
                        onPointerMove={moveEventSwipeDrag}
                        onPointerUp={endEventSwipeDrag}
                        onPointerCancel={endEventSwipeDrag}
                      >
                        <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl" style={{ background: categoryGlass.accent }} />
                        <div className="py-3 pl-4 pr-3">
                          {event.isPrivate ? (
                            <div className="absolute right-2 top-2">
                              <Lock className="h-3 w-3" style={{ color: eventCardIconTone }} />
                            </div>
                          ) : null}

                          {isEditingThisEvent ? (
                            <div
                              className="space-y-3 rounded-[22px] border p-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                              style={{
                                borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.75)',
                                background: darkMode
                                  ? 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.82) 100%)'
                                  : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)',
                                backdropFilter: 'blur(14px)',
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedText}`}>Edit Event</div>
                                </div>
                              </div>
                              <input
                                type="text"
                                defaultValue={event.title}
                                onBlur={(blurEvent) => handleUpdateEventField(event.date, event.id, { title: blurEvent.target.value })}
                                className="w-full rounded-2xl border border-gray-200/90 bg-white/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                                autoFocus
                              />
                              <input
                                type="text"
                                defaultValue={event.time || ''}
                                placeholder="Time"
                                onBlur={(blurEvent) => {
                                  const val = blurEvent.target.value.trim();
                                  if (!val) {
                                    handleUpdateEventField(event.date, event.id, { time: null });
                                    return;
                                  }
                                  const match = val.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
                                  if (!match) return;
                                  let hours = parseInt(match[1], 10);
                                  const minutes = match[2] ? parseInt(match[2], 10) : 0;
                                  const period = match[3]?.toLowerCase();
                                  if (period === 'pm' && hours < 12) hours += 12;
                                  if (period === 'am' && hours === 12) hours = 0;
                                  handleUpdateEventField(event.date, event.id, {
                                    time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
                                  });
                                }}
                                className="w-full rounded-2xl border border-gray-200/90 bg-white/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                              />
                              {PlacesAutocomplete ? (
                                <PlacesAutocomplete
                                  value={event.location || ''}
                                  onSelect={(value) => {
                                    if ((value || '') !== (event.location || '')) {
                                      handleUpdateEventField(event.date, event.id, { location: value || null });
                                    }
                                  }}
                                  placeholder="📍 Add location (optional)"
                                  className="w-full rounded-2xl border border-gray-200/90 bg-white/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                                />
                              ) : null}
                              <textarea
                                defaultValue={event.description || ''}
                                onBlur={(blurEvent) => handleUpdateEventField(event.date, event.id, { description: blurEvent.target.value })}
                                placeholder="Add notes"
                                rows={3}
                                className="w-full resize-none rounded-2xl border border-gray-200/90 bg-white/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                              />
                              <select
                                defaultValue={event.category || 'other'}
                                onChange={(changeEvent) => handleUpdateEventField(event.date, event.id, { category: changeEvent.target.value })}
                                className="w-full rounded-2xl border border-gray-200/90 bg-white/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-200 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                              >
                                {Object.entries(categories).map(([key, cat]) => (
                                  <option key={key} value={key}>{cat.label}</option>
                                ))}
                              </select>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    handleUpdateEventField(event.date, event.id, { isPrivate: !event.isPrivate });
                                  }}
                                  className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-all ${event.isPrivate ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md' : 'border border-gray-200/90 bg-white/85 text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300'}`}
                                >
                                  <Lock className="h-3 w-3" />
                                  {event.isPrivate ? 'Private' : 'Shared'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    handleUpdateEventField(event.date, event.id, { isUrgent: !event.isUrgent });
                                  }}
                                  className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-all ${event.isUrgent ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md' : 'border border-gray-200/90 bg-white/85 text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300'}`}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {event.isUrgent ? 'Urgent' : 'Normal'}
                                </button>
                              </div>
                              <label className={`flex items-center gap-2 rounded-2xl border px-3.5 py-3 text-sm ${darkMode ? 'border-white/10 bg-white/[0.04] text-gray-200' : 'border-gray-200/90 bg-white/80 text-gray-700'}`}>
                                <input
                                  type="checkbox"
                                  defaultChecked={event.isAnnual}
                                  onChange={(changeEvent) => handleUpdateEventField(event.date, event.id, {
                                    isAnnual: changeEvent.target.checked,
                                    annualMonth: changeEvent.target.checked ? (new Date(`${event.date}T00:00:00`).getMonth() + 1) : null,
                                    annualDay: changeEvent.target.checked ? new Date(`${event.date}T00:00:00`).getDate() : null,
                                  })}
                                  className="rounded"
                                />
                                🎂 Annual (repeats every year)
                              </label>
                              <button
                                type="button"
                                onClick={(clickEvent) => {
                                  clickEvent.stopPropagation();
                                  setEditingEvent?.(null);
                                }}
                                className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm"
                                style={themeAccentButtonStyle}
                              >
                                Done
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-6">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${category.color}`}>{weEventBadge ? 'We Event' : category.label}</span>
                                  {event.isUrgent ? (
                                    <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white animate-pulse">
                                      <AlertTriangle className="h-3 w-3" />
                                      Urgent
                                    </span>
                                  ) : null}
                                  {(event.isAnnual || (event.recurrence && event.recurrence !== 'once')) ? (
                                    <span className="flex items-center gap-1 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-medium text-white">
                                      <Repeat className="h-3 w-3" />
                                      {event.recurrence === 'weekly' ? 'Weekly' : event.recurrence === 'monthly' ? 'Monthly' : 'Annual'}
                                    </span>
                                  ) : null}
                                  {event.time ? (
                                    <div className="flex items-center gap-1 text-sm font-medium" style={eventCardBodyStyle}>
                                      <Clock className="h-3 w-3" />
                                      {formatTime(event.time)}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="mb-1 font-medium" style={eventCardTitleStyle}>{event.title}</div>
                                {event.location ? (
                                  <button
                                    type="button"
                                    className="mb-1 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                                    onClick={(clickEvent) => handleLocationLinkClick(clickEvent, event.location)}
                                  >
                                    📍 {event.location}
                                  </button>
                                ) : null}
                                {event.description ? (
                                  <div className="mb-1 whitespace-pre-wrap text-sm" style={eventCardBodyStyle}>
                                    {event.description}
                                  </div>
                                ) : null}
                                {event.createdBy ? (
                                  <div className="flex items-center gap-1 text-xs" style={eventCardMetaStyle}>
                                    <User className="h-3 w-3" />
                                    {resolveHandleLikeLabel(event.createdBy, event.userId)}
                                  </div>
                                ) : null}
                                {isPublicRegularEvent ? (
                                  <div className="mt-2 rounded-lg border p-2" style={{ borderColor: darkMode ? hexToRgba(accent, 0.4) : hexToRgba(accent, 0.25), background: darkMode ? hexToRgba(accent, 0.12) : hexToRgba(accent, 0.06) }}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-xs font-semibold" style={{ color: accent }}>
                                        {eventRelationshipStatus === 'hosting' ? 'Hosting' : eventRelationshipStatus === 'going' ? 'Going' : eventRelationshipStatus === 'interested' ? 'Saved' : 'Public event'}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {eventRelationshipStatus !== 'hosting' && eventRelationshipStatus !== 'going' ? (
                                          <button
                                            type="button"
                                            onClick={(clickEvent) => {
                                              clickEvent.stopPropagation();
                                              setEventRelationshipStatus?.(event, 'going');
                                            }}
                                            className="rounded-md border bg-white px-2 py-1 text-xs dark:bg-gray-800"
                                            style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35), color: accent }}
                                          >
                                            Join
                                          </button>
                                        ) : null}
                                        {eventRelationshipStatus === 'going' ? (
                                          <button
                                            type="button"
                                            onClick={(clickEvent) => {
                                              clickEvent.stopPropagation();
                                              setEventRelationshipStatus?.(event, 'none');
                                            }}
                                            className="rounded-md border bg-white px-2 py-1 text-xs dark:bg-gray-800"
                                            style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35), color: accent }}
                                          >
                                            Leave
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                onClick={(clickEvent) => {
                                  clickEvent.stopPropagation();
                                  setEditingEvent?.(event.id);
                                }}
                                onPointerDown={(clickEvent) => clickEvent.stopPropagation()}
                                onTouchStart={(clickEvent) => clickEvent.stopPropagation()}
                                className="relative z-20 rounded-lg p-1.5 transition-all hover:bg-white/20 dark:hover:bg-black/20"
                                aria-label="Edit event"
                              >
                                <svg className="h-4 w-4" style={{ color: eventCardIconTone }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
