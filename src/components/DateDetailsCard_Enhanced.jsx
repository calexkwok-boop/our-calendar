import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Lock, Repeat, User } from 'lucide-react';

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
  darkMode = false,
  themeAccentButtonStyle,
  themeAccentHeadingStyle,
  POPUP_NO_MAX_SENTINEL = 999999,
  CATEGORY_GLASS = {},
  editingEvent,
  setEditingEvent,
  PlacesAutocomplete,
  handleLocationLinkClick = () => {},
  calendarPartner = DEFAULT_PARTNER,
}) {
  const [eventType, setEventType] = useState(null);
  const [weEventCategory, setWeEventCategory] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [invitees, setInvitees] = useState([{ id: 'partner', ...calendarPartner, selected: true }]);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentTemplate = useMemo(
    () => WE_EVENT_TEMPLATES.find((template) => template.id === weEventCategory) || null,
    [weEventCategory]
  );
  const accent = (themeAccentButtonStyle && themeAccentButtonStyle.backgroundColor) || '#a855f7';
  const selectedDateKey = getDateKey(selectedDate);

  useEffect(() => {
    if (!isOpen) {
      setEventType(null);
      setWeEventCategory(null);
      setEventTitle('');
      setLocation('');
      setLocationSuggestions([]);
      setSelectedTime('');
      setInvitees([{ id: 'partner', ...calendarPartner, selected: true }]);
      setShowAddPeople(false);
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

  const selectLocation = (place) => {
    setLocation(String(place?.description || '').trim());
    setLocationSuggestions([]);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation(`Current location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
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
    const normalizedTime = parseTimeInput(selectedTime);
    if (!eventTitle.trim() || !normalizedTime) return;
    const eventData = {
      type: eventType,
      category: weEventCategory,
      title: eventTitle.trim(),
      location: location.trim(),
      date: selectedDate,
      time: normalizedTime,
      invitees: eventType === 'we' ? invitees.filter((invitee) => invitee.selected) : [],
    };

    if (typeof onSaveEvent === 'function') {
      await onSaveEvent(eventData);
      handleClose();
      return;
    }

    if (typeof handleQuickAdd === 'function') {
      const combinedTitle = eventData.location ? `${eventData.title} @ ${eventData.location}` : eventData.title;
      const categoryOverride = buildCategoryOverride(eventType, weEventCategory, eventData.title, categories);
      if (eventType === 'we') {
        try { setIsPopupEventDraft?.(true); } catch {}
        if (!String(popupEventMaxPeopleDraft || '').trim()) {
          setPopupEventMaxPeopleDraft?.('10');
        }
      }
      const result = await handleQuickAdd({
        titleOverride: combinedTitle,
        time: eventData.time || null,
        directCreate: true,
        isPopupEvent: eventType === 'we',
        categoryOverride,
        popupSubtype: eventType === 'we' ? (eventData.category || null) : null,
        locationOverride: eventData.location || '',
        description: eventType === 'we' && currentTemplate ? `${currentTemplate.label} We Event` : '',
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
          <div className="space-y-5 p-6 pb-8">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {eventType === null && 'Add Event'}
                  {eventType === 'me' && 'Me Event'}
                  {eventType === 'we' && weEventCategory === null && 'We Event'}
                  {eventType === 'we' && weEventCategory && currentTemplate?.label}
                </h2>
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

            {eventType === null && (
              <div className="space-y-3">
                <p className={`mb-3 text-sm font-semibold ${labelText}`}>What kind of event?</p>

                <button
                  type="button"
                  onClick={() => setEventType('me')}
                  className={`w-full rounded-2xl border p-5 text-left transition-all hover:shadow-md ${darkMode ? 'border-blue-400/25 bg-gradient-to-br from-blue-500/10 to-indigo-500/10' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm ${darkMode ? 'bg-white/10' : 'bg-white'}`}>📅</div>
                    <div className="flex-1">
                      <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Me Event</div>
                      <div className={`mt-0.5 text-sm ${mutedText}`}>Just for you</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEventType('we')}
                  className={`w-full rounded-2xl border p-5 text-left transition-all hover:shadow-md ${darkMode ? 'border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm ${darkMode ? 'bg-white/10' : 'bg-white'}`}>👥</div>
                    <div className="flex-1">
                      <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>We Event</div>
                      <div className={`mt-0.5 text-sm ${mutedText}`}>Invite people to join</div>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {eventType === 'we' && weEventCategory === null && (
              <>
                <button
                  type="button"
                  onClick={() => setEventType(null)}
                  className={`-ml-1 mb-1 flex items-center gap-1.5 text-sm ${mutedText}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <div className="space-y-3">
                  <p className={`mb-3 text-sm font-semibold ${labelText}`}>What type of gathering?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {WE_EVENT_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setWeEventCategory(template.id)}
                        className={`rounded-xl border p-4 text-center transition-all hover:shadow-md ${darkMode ? 'border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'}`}
                      >
                        <div className="mb-2 text-3xl">{template.emoji}</div>
                        <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{template.label}</div>
                        {template.examples.length > 0 ? (
                          <div className={`mt-1 line-clamp-1 text-xs ${mutedText}`}>{template.examples[0]}</div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(eventType === 'me' || (eventType === 'we' && weEventCategory !== null)) && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (eventType === 'we' && weEventCategory) setWeEventCategory(null);
                    else setEventType(null);
                  }}
                  className={`-ml-1 mb-1 flex items-center gap-1.5 text-sm ${mutedText}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                {eventType === 'we' && currentTemplate?.examples?.length > 0 ? (
                  <div>
                    <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Quick ideas</label>
                    <div className="flex flex-wrap gap-2">
                      {currentTemplate.examples.map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setEventTitle(example)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${darkMode ? 'bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${labelText}`}>What</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(event) => setEventTitle(event.target.value)}
                    placeholder={
                      eventType === 'we' && currentTemplate
                        ? currentTemplate.placeholder
                        : eventType === 'we'
                          ? 'What are we doing?'
                          : 'What are you doing?'
                    }
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
                      onChange={(event) => handleLocationSearch(event.target.value)}
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

                  {eventType === 'we' && currentTemplate?.suggestedTimes?.length > 0 ? (
                    <div className="mb-2.5 flex flex-wrap gap-2">
                      {currentTemplate.suggestedTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                            onClick={() => setSelectedTime(toTimeLabel(time))}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                            selectedTime === time
                              ? (darkMode ? 'border-fuchsia-300/40 bg-fuchsia-500/20 text-fuchsia-100' : 'border-purple-300 bg-purple-200 text-purple-700')
                              : softButton
                          }`}
                        >
                          {toTimeLabel(time)}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className={`rounded-2xl border p-3 ${eventType === 'me'
                    ? (darkMode ? 'border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50')
                    : (darkMode ? 'border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50')
                  }`}>
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
                </div>

                {eventType === 'we' ? (
                  <div>
                    <label className={`mb-2 block text-sm font-semibold ${labelText}`}>Who's invited?</label>
                    <div className={`space-y-3 rounded-2xl border p-4 ${darkMode ? 'border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'}`}>
                      <div className="flex flex-wrap gap-2">
                        {invitees.map((invitee) => (
                          <button
                            key={invitee.id}
                            type="button"
                            onClick={() => toggleInvitee(invitee.id)}
                            className={`flex items-center gap-2 rounded-full px-3 py-2 font-medium transition-all ${
                              invitee.selected
                                ? (darkMode ? 'border-2 border-fuchsia-300/50 bg-white/10 text-white' : 'border-2 border-purple-400 bg-white text-purple-700 shadow-sm')
                                : (darkMode ? 'border-2 border-white/10 bg-white/5 text-white/55' : 'border-2 border-gray-200 bg-white/60 text-gray-500')
                            }`}
                          >
                            <span className="text-lg">{invitee.avatar}</span>
                            <span className="text-sm">{invitee.name}</span>
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setShowAddPeople(true)}
                          className={`rounded-full border-2 border-dashed px-4 py-2 text-sm font-medium transition-all ${darkMode ? 'border-fuchsia-300/35 text-fuchsia-100 hover:bg-white/5' : 'border-purple-300 text-purple-600 hover:bg-purple-50'}`}
                        >
                          + Add people
                        </button>
                      </div>

                      {showAddPeople ? (
                        <div className="space-y-2 pt-2">
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
                                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 transition-colors ${darkMode ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-transparent bg-white hover:border-purple-200 hover:bg-purple-50'}`}
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
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!eventTitle.trim() || !parseTimeInput(selectedTime)}
                  className={`w-full rounded-2xl py-4 text-lg font-bold text-white transition-all shadow-sm disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none ${
                    eventType === 'me'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                  }`}
                  style={eventType === 'me' ? themeAccentButtonStyle : undefined}
                >
                  Create {eventType === 'we' ? 'We' : 'Me'} Event
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
                  const popupMeta = popupEventsByEventId[String(event.id || '')] || null;
                  const effectiveCategoryKey = popupMeta ? 'popup_event' : (event.category || 'other');
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

                  if (popupMeta) {
                    return (
                      <div
                        key={event.id}
                        className="cursor-pointer rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-rose-700 dark:from-rose-900/20 dark:to-pink-900/10"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-xl">🎉</span>
                              <h4 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.title}</h4>
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
                                {popupSignups.length}{popupNoMax ? ' joined' : `/${popupMeta.maxPeople} spots`}
                              </span>
                            </div>
                            {event.location ? (
                              <button
                                type="button"
                                className="mt-1 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                                onClick={(clickEvent) => {
                                  clickEvent.stopPropagation();
                                  handleLocationLinkClick(clickEvent, event.location);
                                }}
                              >
                                📍 {event.location}
                              </button>
                            ) : null}
                          </div>

                          {popupJoined ? (
                            <button
                              type="button"
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
                            <button type="button" className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all" style={themeAccentButtonStyle}>
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

                          {editingEvent === event.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                defaultValue={event.title}
                                onBlur={(blurEvent) => handleUpdateEventField(event.date, event.id, { title: blurEvent.target.value })}
                                className="w-full rounded-lg border-2 border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                autoFocus
                              />
                              <input
                                type="text"
                                defaultValue={event.time || ''}
                                placeholder="e.g. 3:00 PM"
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
                                className="w-full rounded-lg border-2 border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                  className="w-full rounded-lg border-2 border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                              ) : null}
                              <textarea
                                defaultValue={event.description || ''}
                                onBlur={(blurEvent) => handleUpdateEventField(event.date, event.id, { description: blurEvent.target.value })}
                                placeholder="Add description"
                                rows={3}
                                className="w-full resize-none rounded-lg border-2 border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                              <select
                                defaultValue={event.category || 'other'}
                                onChange={(changeEvent) => handleUpdateEventField(event.date, event.id, { category: changeEvent.target.value })}
                                className="w-full rounded-lg border-2 border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              >
                                {Object.entries(categories).map(([key, cat]) => (
                                  <option key={key} value={key}>{cat.label}</option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    handleUpdateEventField(event.date, event.id, { isPrivate: !event.isPrivate });
                                  }}
                                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${event.isPrivate ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}
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
                                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${event.isUrgent ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {event.isUrgent ? 'Urgent' : 'Normal'}
                                </button>
                              </div>
                              <label className="flex items-center gap-2 text-sm dark:text-gray-300">
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
                                className="w-full rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 px-3 py-2 text-sm font-medium text-white"
                              >
                                Done
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-6">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${category.color}`}>{effectiveCategoryKey === 'popup_event' ? 'We Event' : category.label}</span>
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
