import React, { useEffect, useMemo, useState } from 'react';

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

const baseInputClassName = 'w-full rounded-xl border px-4 py-3.5 text-base transition-all outline-none';

export default function DateDetailsCardEnhanced({
  isOpen = false,
  selectedDate,
  onClose,
  onSaveEvent,
  handleQuickAdd,
  setIsPopupEventDraft,
  popupEventMaxPeopleDraft,
  setPopupEventMaxPeopleDraft,
  categories = {},
  darkMode = false,
  themeAccentButtonStyle,
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
    if (!eventTitle.trim() || !selectedTime) return;
    const eventData = {
      type: eventType,
      category: weEventCategory,
      title: eventTitle.trim(),
      location: location.trim(),
      date: selectedDate,
      time: selectedTime,
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
                          onClick={() => setSelectedTime(time)}
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

                  <div className={`rounded-2xl border p-4 ${eventType === 'me'
                    ? (darkMode ? 'border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50')
                    : (darkMode ? 'border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50')
                  }`}>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(event) => setSelectedTime(event.target.value)}
                      className={inputSurface}
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
                  disabled={!eventTitle.trim() || !selectedTime}
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
          </div>
        </div>
      </div>
    </>
  );
}
