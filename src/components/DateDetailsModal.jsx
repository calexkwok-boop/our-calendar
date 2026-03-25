// DateDetailsModal.jsx - Redesigned with improved UX
import React, { useState } from 'react';
import { X, Lock, AlertTriangle, Repeat, Settings, ChevronDown, Clock, User } from 'lucide-react';

const DateDetailsModal = ({
  // Visibility
  isOpen,
  onClose,
  
  // Date info
  selectedDate,
  selectedDates = [],
  
  // Events
  selectedEvents = [],
  popupEventsByEventId = {},
  popupSignupsByEventId = {},
  
  // User
  user,
  
  // Categories
  categories,
  selectedCategory,
  setSelectedCategory,
  
  // Event creation
  quickEntry,
  setQuickEntry,
  handleQuickAdd,
  
  // Pop-up event settings
  popupEventMaxPeopleDraft,
  setPopupEventMaxPeopleDraft,
  setIsPopupEventDraft,
  
  // Settings
  isPrivate,
  setIsPrivate,
  isUrgent,
  setIsUrgent,
  recurrence,
  setRecurrence,
  
  // Actions
  joinPopupEvent,
  leavePopupEvent,
  setSelectedPopupEventPanelId,
  handleDeleteEvent,
  handleUpdateEventField,
  openRecurringDeletePrompt,
  
  // Swipe handlers
  eventSwipeDrag,
  swipedEventKey,
  handleEventSwipeStart,
  handleEventSwipeMove,
  handleEventSwipeEnd,
  startEventSwipeDrag,
  moveEventSwipeDrag,
  endEventSwipeDrag,
  
  // Utilities
  formatTime,
  resolveHandleLikeLabel,
  getLayerForEvent,
  getEventRelationshipStatus,
  setEventRelationshipStatus,
  canDeleteEventInActiveLayer,
  getDateKey,
  hexToRgba,
  mixHexColors,
  
  // Theme
  darkMode,
  themeAccentButtonStyle,
  themeAccentHeadingStyle,
  
  // Constants
  POPUP_NO_MAX_SENTINEL = 999999,
  CATEGORY_GLASS = {},
  
  // Editing
  editingEvent,
  setEditingEvent,
  
  // PlacesAutocomplete component
  PlacesAutocomplete,
  
  // Location handler
  handleLocationLinkClick,
}) => {
  const [eventCreationMode, setEventCreationMode] = useState('quick'); // 'quick' | 'popup'
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [quickLocation, setQuickLocation] = useState('');
  const accent = (themeAccentButtonStyle && themeAccentButtonStyle.backgroundColor) || '#a855f7';
  
  if (!isOpen) return null;
  
  const selectedDateKey = getDateKey(selectedDate);
  
  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 p-4 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Date Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedDates.length > 1 ? (
                <>
                  {selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' '}-{' '}
                  {selectedDates[selectedDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' '}({selectedDates.length} days)
                </>
              ) : (
                selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6"
             style={{
               WebkitOverflowScrolling: 'touch',
               overscrollBehaviorY: 'contain',
               touchAction: 'pan-y',
             }}>
          
          {/* Event Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setEventCreationMode('quick')}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
              style={eventCreationMode === 'quick' ? (themeAccentButtonStyle || { backgroundColor: accent, color: '#fff' }) : undefined}
            >
              Quick Event
            </button>
            <button
              onClick={() => setEventCreationMode('popup')}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
              style={eventCreationMode === 'popup' ? (themeAccentButtonStyle || { backgroundColor: accent, color: '#fff' }) : undefined}
            >
              🎉 Pop-up Event
            </button>
          </div>
          
          {/* Quick Event Form */}
          {eventCreationMode === 'quick' && (
            <div className="space-y-3">
              <input
                type="text"
                value={quickEntry}
                onChange={(e) => setQuickEntry(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const base = String(quickEntry || '').trim();
                    const loc = String(quickLocation || '').trim();
                    const combined = loc ? `${base} @ ${loc}` : base;
                    setQuickEntry(combined);
                    setTimeout(() => {
                      handleQuickAdd();
                      setQuickEntry('');
                      setQuickLocation('');
                      setEventCreationMode('quick');
                    }, 0);
                  }
                }}
                placeholder={selectedDates.length > 1 ? "Vacation in Mexico" : "Team lunch 12:30pm"}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 
                           dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-base
                           focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                autoFocus
              />
              <input
                type="text"
                value={quickLocation}
                onChange={(e) => setQuickLocation(e.target.value)}
                placeholder="Location (optional)"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 
                           mt-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-base
                           focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
              <button
                onClick={() => {
                  const base = String(quickEntry || '').trim();
                  const loc = String(quickLocation || '').trim();
                  const combined = loc ? `${base} @ ${loc}` : base;
                  setQuickEntry(combined);
                  setTimeout(() => {
                    handleQuickAdd();
                    setQuickEntry('');
                    setQuickLocation('');
                  }, 0);
                }}
                className="w-full py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                style={themeAccentButtonStyle}
              >
                Add Event
              </button>
            </div>
          )}
          
          {/* Pop-up Event Form */}
          {eventCreationMode === 'popup' && (
            <div className="space-y-3 p-4 rounded-xl border-2" style={{ background: darkMode ? hexToRgba(accent, 0.12) : hexToRgba(accent, 0.06), borderColor: darkMode ? hexToRgba(accent, 0.4) : hexToRgba(accent, 0.3) }}>
              <input
                type="text"
                value={quickEntry}
                onChange={(e) => setQuickEntry(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickAdd({ isPopupEvent: true });
                      setQuickEntry('');
                    }
                  }}
                placeholder="Friday night run club"
                className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 dark:text-white text-base focus:ring-2 focus:border-transparent transition-all"
                style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35) }}
                autoFocus
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1.5 block">
                    Max people
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={popupEventMaxPeopleDraft}
                    onChange={(e) => setPopupEventMaxPeopleDraft(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-2"
                               style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35) }}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1.5 block">
                    Time (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="6:00 PM"
                    className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-2"
                               style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35) }}
                    onBlur={(e) => {
                      // You can handle time parsing here if needed
                      const val = e.target.value.trim();
                      if (val) {
                        // Append time to quickEntry if there's a value
                        const currentEntry = quickEntry.trim();
                        if (!currentEntry.includes(val)) {
                          setQuickEntry(currentEntry + (currentEntry ? ' ' : '') + val);
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  try { setIsPopupEventDraft?.(true); } catch {}
                  handleQuickAdd({ isPopupEvent: true });
                  setQuickEntry('');
                  setEventCreationMode('quick'); // Reset after creating popup
                }}
                className="w-full py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                style={themeAccentButtonStyle}
              >
                Create Pop-up Event
              </button>
              
              <p className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <span className="font-semibold">✓</span>
                First-come, first-served signups enabled
              </p>
            </div>
          )}
          
          {/* Settings & Features (moved before today's events) */}
          <div>
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 
                         text-gray-700 dark:text-gray-300 text-sm font-semibold
                         flex items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-600
                         transition-all"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings & Filters
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                showAdvancedSettings ? 'rotate-180' : ''
              }`} />
            </button>
            {showAdvancedSettings && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-4 border border-gray-200 dark:border-gray-700">
                {/* Default Category */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block uppercase tracking-wider">
                    Default Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(categories).filter(([key]) => key !== 'popup_event').map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
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
                {/* Private & Urgent */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block uppercase tracking-wider">
                    Event Properties
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        isPrivate
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      {isPrivate ? 'Private' : 'Shared'}
                    </button>
                    <button
                      onClick={() => setIsUrgent(!isUrgent)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        isUrgent
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {isUrgent ? 'Urgent' : 'Normal'}
                    </button>
                  </div>
                </div>
                {/* Recurrence */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block uppercase tracking-wider flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5" />
                    Default Recurrence
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'once', label: 'One-time' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'annual', label: 'Annual' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setRecurrence(opt.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          recurrence === opt.value
                            ? 'bg-purple-600 text-white shadow-sm scale-[1.02]'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-[1.01]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          {selectedEvents.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700" />
          )}
          
          {/* Event List */}
          <div className="space-y-3">
            {selectedEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📅</div>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No events yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Add your first event above
                </p>
              </div>
            ) : (
              selectedEvents.map(event => {
                const popupMeta = popupEventsByEventId[String(event.id || '')] || null;
                const effectiveCategoryKey = popupMeta ? 'popup_event' : (event.category || 'other');
                const category = categories[effectiveCategoryKey] || categories.popup_event || categories.other;
                const categoryGlass = CATEGORY_GLASS[effectiveCategoryKey] || CATEGORY_GLASS.other;
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
                
                // Holiday events
                if (event.isHoliday) {
                  return (
                    <div key={event.id} className="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 border-2 border-red-200 dark:border-red-700 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎉</span>
                          <div>
                            <div className="text-gray-800 dark:text-gray-200 font-medium">{event.title}</div>
                            {event.fullName !== event.title && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{event.fullName}</div>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">US Holiday</span>
                      </div>
                    </div>
                  );
                }
                
                // Pop-up Event Card (Redesigned)
                if (popupMeta) {
                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border-2 border-rose-200 dark:border-rose-700 
                                 bg-gradient-to-br from-rose-50 to-pink-50 
                                 dark:from-rose-900/20 dark:to-pink-900/10 p-4
                                 hover:shadow-lg transition-all duration-200 cursor-pointer
                                 hover:-translate-y-0.5"
                      onClick={() => setSelectedPopupEventPanelId(String(event.id || ''))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">🎉</span>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                              {event.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            {event.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(event.time)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {popupSignups.length}{popupNoMax ? ' joined' : `/${popupMeta.maxPeople} spots`}
                            </span>
                          </div>
                          {event.location && (
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLocationLinkClick(e, event.location);
                              }}
                            >
                              📍 {event.location}
                            </button>
                          )}
                        </div>
                        
                        {popupJoined ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              leavePopupEvent(event.id);
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap bg-white dark:bg-gray-800 border-2"
                            style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35), color: accent }}
                          >
                            ✓ Joined
                          </button>
                        ) : popupFull ? (
                          <button
                            disabled
                            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700
                                       text-gray-500 dark:text-gray-500 text-sm font-semibold
                                       whitespace-nowrap opacity-60"
                          >
                            Full
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinPopupEvent(event.id, { dateKey: event.date });
                            }}
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-sm hover:shadow transition-all whitespace-nowrap active:scale-95"
                            style={themeAccentButtonStyle}
                          >
                            Join
                          </button>
                        )}
                      </div>
                      
                      {popupSignups.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-rose-200/50 dark:border-rose-700/50">
                          {popupSignups.slice(0, 4).map((signup) => (
                            <span
                              key={signup.userId}
                              className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 
                                         border border-rose-200 dark:border-rose-600 
                                         text-xs font-medium text-rose-700 dark:text-rose-300"
                            >
                              {signup.displayName || 'Member'}
                            </span>
                          ))}
                          {popupSignups.length > 4 && (
                            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                              +{popupSignups.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Regular Event Card (Keep existing design with swipe)
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
                  <div key={event.id} className={`relative rounded-2xl overflow-hidden ${event.isVirtualAnnual ? 'border-dashed' : ''}`}>
                    {canDeleteThisEvent && (
                      <div className={`absolute inset-y-0 right-0 w-[88px] flex items-center justify-center transition-colors z-20 ${isDeleteRevealed ? 'bg-red-500' : 'bg-transparent'}`}>
                        <button
                          onClick={(e) => { e.stopPropagation();
                            const isRepeating = event.isVirtualAnnual || event.isVirtualRecurrence || (event.recurrence && event.recurrence !== 'once');
                            if (isRepeating) {
                              openRecurringDeletePrompt({ dateKey: selectedDateKey, event });
                            } else {
                              handleDeleteEvent(selectedDateKey, event.id, false, false, false);
                            }
                          }}
                          className={`w-full h-full text-sm font-semibold transition-opacity ${isDeleteRevealed ? 'text-white opacity-100' : 'text-transparent opacity-0 pointer-events-none'}`}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    <div
                      className={`relative z-10 rounded-2xl overflow-hidden border border-white/50 shadow-lg transition-all hover:-translate-y-0.5 ${event.isVirtualAnnual ? 'border-dashed' : ''}`}
                      style={{ ...eventCardStyle, transform: `translateX(${rowOffset}px)`, transition: eventSwipeDrag.id === eventSwipeKey ? 'none' : 'transform 180ms ease', touchAction: 'pan-y' }}
                      onTouchStart={(e) => handleEventSwipeStart(e, eventSwipeKey, canDeleteThisEvent)}
                      onTouchMove={handleEventSwipeMove}
                      onTouchEnd={handleEventSwipeEnd}
                      onTouchCancel={handleEventSwipeEnd}
                      onPointerDown={(e) => startEventSwipeDrag(e, eventSwipeKey, canDeleteThisEvent)}
                      onPointerMove={moveEventSwipeDrag}
                      onPointerUp={endEventSwipeDrag}
                      onPointerCancel={endEventSwipeDrag}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: categoryGlass.accent }} />
                      <div className="pl-4 pr-3 py-3">
                        {event.isPrivate && (
                          <div className="absolute top-2 right-2">
                            <Lock className="w-3 h-3" style={{ color: eventCardIconTone }} />
                          </div>
                        )}
                        
                        {editingEvent === event.id ? (
                          // Edit mode (keep your existing edit form)
                          <div className="space-y-2">
                            <input
                              type="text"
                              defaultValue={event.title}
                              onBlur={(e) => handleUpdateEventField(event.date, event.id, { title: e.target.value })}
                              className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                              autoFocus
                            />
                            {/* Add rest of your edit form fields */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(null);
                              }}
                              className="w-full px-3 py-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-6">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.color} text-white`}>
                                  {category.label}
                                </span>
                                {event.isUrgent && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white animate-pulse flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Urgent
                                  </span>
                                )}
                                {(event.isAnnual || (event.recurrence && event.recurrence !== 'once')) && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500 text-white flex items-center gap-1">
                                    <Repeat className="w-3 h-3" />
                                    {event.recurrence === 'weekly' ? 'Weekly' : event.recurrence === 'monthly' ? 'Monthly' : 'Annual'}
                                  </span>
                                )}
                                {event.time && (
                                  <div className="flex items-center gap-1 text-sm font-medium" style={eventCardBodyStyle}>
                                    <Clock className="w-3 h-3" />
                                    {formatTime(event.time)}
                                  </div>
                                )}
                              </div>
                              <div className="font-medium mb-1" style={eventCardTitleStyle}>{event.title}</div>
                              {event.location && (
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 mb-1"
                                  onClick={(e) => handleLocationLinkClick(e, event.location)}
                                >
                                  📍 {event.location}
                                </button>
                              )}
                              {event.description && (
                                <div className="text-sm whitespace-pre-wrap mb-1" style={eventCardBodyStyle}>
                                  {event.description}
                                </div>
                              )}
                              {event.createdBy && (
                                <div className="flex items-center gap-1 text-xs" style={eventCardMetaStyle}>
                                  <User className="w-3 h-3" />
                                  {resolveHandleLikeLabel(event.createdBy, event.userId)}
                                </div>
                              )}
                              
                              {/* Public event actions */}
                              {isPublicRegularEvent && (
                                <div className="mt-2 p-2 rounded-lg border" style={{ borderColor: darkMode ? hexToRgba(accent, 0.4) : hexToRgba(accent, 0.25), background: darkMode ? hexToRgba(accent, 0.12) : hexToRgba(accent, 0.06) }}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs font-semibold" style={{ color: accent }}>
                                      {eventRelationshipStatus === 'hosting' ? 'Hosting' : 
                                       eventRelationshipStatus === 'going' ? 'Going' : 
                                       eventRelationshipStatus === 'interested' ? 'Saved' : 'Public event'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {eventRelationshipStatus !== 'hosting' && eventRelationshipStatus !== 'going' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEventRelationshipStatus(event, 'going');
                                          }}
                                          className="px-2 py-1 text-xs rounded-md border bg-white dark:bg-gray-800"
                                          style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35), color: accent }}
                                        >
                                          Join
                                        </button>
                                      )}
                                      {eventRelationshipStatus === 'going' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEventRelationshipStatus(event, 'none');
                                          }}
                                          className="px-2 py-1 text-xs rounded-md border bg-white dark:bg-gray-800"
                                          style={{ borderColor: darkMode ? hexToRgba(accent, 0.5) : hexToRgba(accent, 0.35), color: accent }}
                                        >
                                          Leave
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(event.id);
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-all"
                              aria-label="Edit event"
                            >
                              <svg className="w-4 h-4" style={{ color: eventCardIconTone }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  );
};

export default DateDetailsModal;
