// TripRatingSystem.jsx - Complete rating and review system for trips






import React, { useState, useRef, useEffect } from 'react';
import { Star, Camera, Sparkles, TrendingUp, Award, Flame, Share2 } from 'lucide-react';
import GroupRatingDisplay from './GroupRatingDisplay';

const getViewerGroupRating = (eventId, groupRatingsByEventId = {}, currentUserId = '') => (
  (groupRatingsByEventId[String(eventId || '')] || []).find(
    (rating) => String(rating?.userId || '') === String(currentUserId || '')
  ) || null
);

const getEffectiveViewerRatingValue = (event, groupRatingsByEventId = {}, currentUserId = '') => {
  const localRating = Number(event?.rating || 0);
  if (localRating > 0) return localRating;
  return Number(getViewerGroupRating(event?.id, groupRatingsByEventId, currentUserId)?.rating || 0);
};

const isEventReviewedByViewer = (event, groupRatingsByEventId = {}, currentUserId = '') => (
  getEffectiveViewerRatingValue(event, groupRatingsByEventId, currentUserId) > 0
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TripRatingSystem = ({
  // Trip data
  trip,
  events = [],
  
  // User data
  user,
  
  // Actions
  onRateEvent,
  onAddPhoto,
  onAddVoiceNote,
  onAddTags,
  onAddReview,
  onShareHighlights,
  // Group ratings
  groupRatingsByEventId = {},
  onAddGroupRating,
  onUpdateGroupRating,
  onDeleteGroupRating,
  
  // Stats
  userStats = {},
  leaderboard = [],
  
  // UX
  focusEventId = null,
  
  // Theme
  darkMode = false,
}) => {
  const [activeView, setActiveView] = useState('recap'); // recap, highlights, stats, badges

  // If a focusEventId is provided (coming back from photo flow), auto-switch to Reviews view
  useEffect(() => {
    if (focusEventId) setActiveView('reviews');
  }, [focusEventId]);
  
  return (
    <div className="trip-rating-system">
      {/* Navigation tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton active={activeView === 'recap'} onClick={() => setActiveView('recap')}>
          📝 Daily Recap
        </TabButton>
        <TabButton active={activeView === 'reviews'} onClick={() => setActiveView('reviews')}>
          🗒 Reviews
        </TabButton>
        <TabButton active={activeView === 'highlights'} onClick={() => setActiveView('highlights')}>
          ✨ Highlights
        </TabButton>
        <TabButton active={activeView === 'stats'} onClick={() => setActiveView('stats')}>
          📊 Stats
        </TabButton>
        <TabButton active={activeView === 'badges'} onClick={() => setActiveView('badges')}>
          🏆 Badges
        </TabButton>
      </div>
      
      {/* Views */}
      {activeView === 'recap' && (
        <DailyRecapView 
          events={events} 
          onRateEvent={onRateEvent}
          onAddPhoto={onAddPhoto}
          onAddVoiceNote={onAddVoiceNote}
          onAddTags={onAddTags}
          onAddReview={onAddReview}
          groupRatingsByEventId={groupRatingsByEventId}
          onAddGroupRating={onAddGroupRating}
          onUpdateGroupRating={onUpdateGroupRating}
          onDeleteGroupRating={onDeleteGroupRating}
          currentUserId={user?.id}
          darkMode={darkMode}
          focusEventId={focusEventId}
        />
      )}
      
      {activeView === 'reviews' && (
        <ReviewsListView
          events={events}
          onRateEvent={onRateEvent}
          onAddPhoto={onAddPhoto}
          onAddVoiceNote={onAddVoiceNote}
          onAddTags={onAddTags}
          onAddReview={onAddReview}
          groupRatingsByEventId={groupRatingsByEventId}
          onAddGroupRating={onAddGroupRating}
          onUpdateGroupRating={onUpdateGroupRating}
          onDeleteGroupRating={onDeleteGroupRating}
          currentUserId={user?.id}
          darkMode={darkMode}
          focusEventId={focusEventId}
        />
      )}

      {activeView === 'highlights' && (
        <TripHighlightsView 
          trip={trip}
          events={events}
          groupRatingsByEventId={groupRatingsByEventId}
          currentUserId={user?.id}
          onShare={onShareHighlights}
          darkMode={darkMode}
        />
      )}
      
      {activeView === 'stats' && (
        <TripStatsView 
          trip={trip}
          events={events}
          groupRatingsByEventId={groupRatingsByEventId}
          currentUserId={user?.id}
          userStats={userStats}
          leaderboard={leaderboard}
          darkMode={darkMode}
        />
      )}
      
      {activeView === 'badges' && (
        <BadgesView 
          userStats={userStats}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// ============================================================================
// RATING COMPONENTS
// ============================================================================

const StarRating = ({ rating = 0, onRate, size = 'md', readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          disabled={readonly}
          onClick={() => !readonly && onRate(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`group relative transition-all duration-200 ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}>
          <Star 
            className={`${sizes[size]} transition-all duration-200 ${
              (hoverRating || rating) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            } ${
              rating === star && !readonly ? 'animate-bounce' : ''
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 font-bold text-lg text-gray-900 dark:text-white">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

const QuickTagsSelector = ({ selectedTags = [], onToggleTag, category = 'restaurant' }) => {
  const tagsByCategory = {
    restaurant: [
      { id: 'must_try', emoji: '🔥', label: 'Must-try' },
      { id: 'family_friendly', emoji: '👨‍👩‍👧', label: 'Family-friendly' },
      { id: 'good_value', emoji: '💰', label: 'Good value' },
      { id: 'romantic', emoji: '💕', label: 'Romantic' },
      { id: 'vegetarian', emoji: '🌿', label: 'Vegetarian options' },
      { id: 'wine', emoji: '🍷', label: 'Great wine' },
    ],
    activity: [
      { id: 'instagram', emoji: '📸', label: 'Instagram-worthy' },
      { id: 'kid_friendly', emoji: '👶', label: 'Kid-friendly' },
      { id: 'all_weather', emoji: '🌧️', label: 'All-weather' },
      { id: 'book_ahead', emoji: '🎫', label: 'Book ahead' },
      { id: 'active', emoji: '💪', label: 'Active/Physical' },
      { id: 'relaxing', emoji: '🧘', label: 'Relaxing' },
    ],
    hotel: [
      { id: 'great_location', emoji: '📍', label: 'Great location' },
      { id: 'quiet', emoji: '🤫', label: 'Quiet' },
      { id: 'clean', emoji: '✨', label: 'Very clean' },
      { id: 'helpful_staff', emoji: '💁', label: 'Helpful staff' },
      { id: 'good_breakfast', emoji: '🥐', label: 'Good breakfast' },
      { id: 'pool', emoji: '🏊', label: 'Nice pool' },
    ],
  };
  
  const tags = tagsByCategory[category] || tagsByCategory.restaurant;
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onToggleTag(tag.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isSelected
                ? 'bg-purple-600 text-white shadow-md scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}>
            <span className="mr-1">{tag.emoji}</span>
            {tag.label}
          </button>
        );
      })}
    </div>
  );
};

/* Voice note removed
const VoiceNoteRecorder = ({ onSave, darkMode }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      
      intervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
      clearInterval(intervalRef.current);
    }
  };
  
  const saveRecording = () => {
    if (audioBlob) {
      onSave(audioBlob);
      setAudioBlob(null);
      setDuration(0);
    }
  };
  
  const cancelRecording = () => {
    setAudioBlob(null);
    setDuration(0);
  };
  







































  return null;
};
*/

// ============================================================================
// EVENT RATING CARD
// ============================================================================

const EventRatingCard = ({ event, onRate,   onAddPhoto, onAddVoiceNote,
  onAddTags, onAddReview, darkMode, groupRatings = [], currentUserId, onAddGroupRating, onUpdateGroupRating, onDeleteGroupRating, defaultExpanded = false, deferPersistOnStar = false }) => {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  const [rating, setRating] = useState(event.rating || 0);
  const [selectedTags, setSelectedTags] = useState(event.tags || []);
  const [pendingFormRating, setPendingFormRating] = useState(null);
  const [ratingCommitted, setRatingCommitted] = useState(!deferPersistOnStar && Number(event.rating || 0) > 0);
  const quickSectionRef = useRef(null);
  
  const handleRate = (newRating) => {
    setRating(newRating);
    // If we are deferring persistence (e.g., Unrated from this trip), don't persist yet
    if (!deferPersistOnStar) {
      onRate(event.id, newRating);
      setRatingCommitted(true);
    }
    // Open full rating card (modal) with prefilled stars
    setExpanded(true);
    setPendingFormRating(Number(newRating));
  };
  
  const handleToggleTag = (tagId) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    onAddTags(event.id, newTags);
  };
  

  
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      rating > 0
        ? 'border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      <div className="p-4">
        {/* Event header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-base text-gray-900 dark:text-white mb-1">
              {event.title}
            </h4>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {event.time} {event.location && `• ${event.location}`}
            </div>
          </div>
        </div>
        
        {/* Star rating */}
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
            How was it?
          </div>
          <StarRating rating={rating} onRate={handleRate} size="md" />
        </div>
        
        {/* Expanded content */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Group rating summary */}
            <div>
              <GroupRatingDisplay
                event={event}
                ratings={groupRatings}
                currentUserId={currentUserId}
                onAddRating={(data) => onAddGroupRating && onAddGroupRating(event.id, data)}
                onUpdateRating={(ratingId, updates) => onUpdateGroupRating && onUpdateGroupRating(event.id, ratingId, updates)}
                onDeleteRating={(ratingId) => onDeleteGroupRating && onDeleteGroupRating(event.id, ratingId)}
                openFormRating={pendingFormRating}
                onAfterSubmit={() => {
                  setPendingFormRating(null);
                  // Keep the card open and guide user to Quick notes/photos
                  setExpanded(true);
                  try {
                    setTimeout(() => {
                      if (quickSectionRef?.current && typeof quickSectionRef.current.scrollIntoView === 'function') {
                        quickSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 0);
                  } catch {}
                }}
                darkMode={darkMode}
              />
            </div>

            {/* Quick tags */}
            <div ref={quickSectionRef}>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
                Quick notes (optional)
              </div>
              <QuickTagsSelector
                selectedTags={selectedTags}
                onToggleTag={handleToggleTag}
                category={event.category || 'restaurant'}
              />
            </div>
            
            {/* Photos */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
                Photos
              </div>
              {Array.isArray(event.photos) && event.photos.length > 0 && (
                <div className="mb-3 grid grid-cols-4 gap-2">
                  {event.photos.slice(0, 8).map((url, idx) => (
                    <img key={idx} src={url} alt="" className="w-full h-24 object-contain rounded-lg bg-gray-100 dark:bg-gray-700" />
                  ))}
                </div>
              )}
              <button
                onClick={() => onAddPhoto(event.id)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 
                         text-purple-600 dark:text-purple-400 font-semibold 
                         hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all">
                <Camera className="w-5 h-5 inline mr-2" />
                Add or manage photos for this experience
              </button>
            </div>
            
            {/* Save/collapse */}
            <div className="pt-2">
              <button
                onClick={() => {
                  // If rating wasn't persisted yet (deferred flow), persist now on Save
                  if (!ratingCommitted && typeof onRate === 'function') {
                    onRate(event.id, rating);
                    setRatingCommitted(true);
                  }
                  setExpanded(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-md transition-all">
                Save
              </button>
            </div>
          </div>
        )}
        
        {!expanded && rating > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            + Add photos or quick notes
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// DAILY RECAP VIEW
// ============================================================================

const DailyRecapView = ({ events, onRateEvent,   onAddPhoto, onAddVoiceNote,
  onAddTags, onAddReview, groupRatingsByEventId = {}, onAddGroupRating, onUpdateGroupRating, onDeleteGroupRating, currentUserId, darkMode, focusEventId = null }) => {
  const today = new Date().toDateString();
  const todaysEvents = events.filter(e => new Date(e.date).toDateString() === today);
  const unratedEvents = todaysEvents.filter((event) => !isEventReviewedByViewer(event, groupRatingsByEventId, currentUserId));
  const completionPercent = todaysEvents.length > 0
    ? Math.round(((todaysEvents.length - unratedEvents.length) / todaysEvents.length) * 100)
    : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🌆 How was your day?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You did {todaysEvents.length} thing{todaysEvents.length !== 1 ? 's' : ''} today
        </p>
        
        {/* Completion progress */}
        {todaysEvents.length > 0 && (
          <div className="mt-4 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Documented</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{completionPercent}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Events */}
      {todaysEvents.length > 0 ? (
        <div className="space-y-3">
          {todaysEvents.map(event => (
            <EventRatingCard
              key={event.id}
              event={event}
              onRate={onRateEvent}
              onAddPhoto={onAddPhoto}
              onAddVoiceNote={onAddVoiceNote}
              onAddTags={onAddTags}
              onAddReview={onAddReview}
              groupRatings={groupRatingsByEventId[String(event.id || '')] || []}
              currentUserId={currentUserId}
              onAddGroupRating={onAddGroupRating}
              onUpdateGroupRating={onUpdateGroupRating}
              onDeleteGroupRating={onDeleteGroupRating}
              darkMode={darkMode}
              defaultExpanded={String(event.id || '') === String(focusEventId || '')}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-gray-500 dark:text-gray-400">
              No events today. Enjoy your free time!
            </p>
          </div>
          {events.filter((event) => !isEventReviewedByViewer(event, groupRatingsByEventId, currentUserId) && new Date(event.date).toDateString() !== today).length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
                Unrated from this trip
              </div>
              <div className="space-y-3">
                {events
                  .filter((event) => !isEventReviewedByViewer(event, groupRatingsByEventId, currentUserId) && new Date(event.date).toDateString() !== today)
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(event => (
                    <EventRatingCard deferPersistOnStar
                      key={event.id}
                      event={event}
                      onRate={onRateEvent}
                      onAddPhoto={onAddPhoto}
                      onAddVoiceNote={onAddVoiceNote}
                      onAddTags={onAddTags}
                      onAddReview={onAddReview}
                      groupRatings={groupRatingsByEventId[String(event.id || '')] || []}
                      currentUserId={currentUserId}
                      onAddGroupRating={onAddGroupRating}
                      onUpdateGroupRating={onUpdateGroupRating}
                      onDeleteGroupRating={onDeleteGroupRating}
                      darkMode={darkMode}
                      defaultExpanded={String(event.id || '') === String(focusEventId || '')}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Completion celebration */}
      {completionPercent === 100 && todaysEvents.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 
                      border-2 border-green-200 dark:border-green-800 p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
            Day Complete!
          </h3>
          <p className="text-sm text-green-600 dark:text-green-400">
            You documented everything from today. Amazing!
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// REVIEWS LIST VIEW
// ============================================================================

const ReviewsListView = ({ events, onRateEvent,   onAddPhoto, onAddVoiceNote,
  onAddTags, onAddReview, groupRatingsByEventId = {}, onAddGroupRating, onUpdateGroupRating, onDeleteGroupRating, currentUserId, darkMode, focusEventId = null }) => {
  const ratedEvents = (events || [])
    .filter((event) => event && isEventReviewedByViewer(event, groupRatingsByEventId, currentUserId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <div className="space-y-3">
      {ratedEvents.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-3">🗒️</div>
          <div className="text-gray-600 dark:text-gray-400">No reviews yet. Rate something from Daily Recap and it will appear here.</div>
        </div>
      ) : (
        ratedEvents.map(event => (
                              <EventRatingCard
                      key={event.id}
                      event={event}
                      onRate={onRateEvent}
                      onAddPhoto={onAddPhoto}
                      onAddVoiceNote={onAddVoiceNote}
                      onAddTags={onAddTags}
                      onAddReview={onAddReview}
                      groupRatings={groupRatingsByEventId[String(event.id || '')] || []}
                      currentUserId={currentUserId}
                      onAddGroupRating={onAddGroupRating}
                      onUpdateGroupRating={onUpdateGroupRating}
                      onDeleteGroupRating={onDeleteGroupRating}
                      darkMode={darkMode}
                      defaultExpanded={String(event.id || '') === String(focusEventId || '')}
                    />
        ))
      )}
    </div>
  );
};

// ============================================================================
// TRIP HIGHLIGHTS VIEW
// ============================================================================

const TripHighlightsView = ({ trip, events, groupRatingsByEventId = {}, currentUserId, onShare, darkMode }) => {
  const ratedEvents = (events || [])
    .filter((event) => isEventReviewedByViewer(event, groupRatingsByEventId, currentUserId))
    .map((event) => ({
      ...event,
      rating: getEffectiveViewerRatingValue(event, groupRatingsByEventId, currentUserId),
    }));
  const avgRating = ratedEvents.length > 0
    ? ratedEvents.reduce((sum, e) => sum + e.rating, 0) / ratedEvents.length
    : 0;
  
  const bestRated = [...ratedEvents].sort((a, b) => b.rating - a.rating);
  const bestFood = bestRated.find(e => e.category === 'restaurant');
  const bestActivity = bestRated.find(e => e.category === 'activity');
  const bestOverall = bestRated[0];
  
  return (
    <div className="space-y-6">
      {/* Overall card */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-[2px]">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {trip.name}
          </h2>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">/5.0</span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400">
            {ratedEvents.length} experience{ratedEvents.length !== 1 ? 's' : ''} rated
          </p>
        </div>
      </div>
      
      {/* Best of categories */}
      {bestFood && (
        <BestOfCard
          icon="🍽️"
          title="Best Food"
          event={bestFood}
          darkMode={darkMode}
        />
      )}
      
      {bestActivity && (
        <BestOfCard
          icon="🎯"
          title="Best Activity"
          event={bestActivity}
          darkMode={darkMode}
        />
      )}
      
      {bestOverall && bestOverall !== bestFood && bestOverall !== bestActivity && (
        <BestOfCard
          icon="⭐"
          title="Top Rated"
          event={bestOverall}
          darkMode={darkMode}
        />
      )}
      
      {/* Share button */}
      <button
        onClick={onShare}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 
                 text-white font-bold text-lg hover:shadow-xl transition-all
                 flex items-center justify-center gap-2">
        <Share2 className="w-5 h-5" />
        Create Trip Highlights
      </button>
    </div>
  );
};

const BestOfCard = ({ icon, title, event, darkMode }) => (
  <div className="rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 
                bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 
                overflow-hidden">
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      
      {event.photos && event.photos[0] && (
        <img
          src={event.photos[0]}
          alt={event.title}
          className="w-full h-40 object-cover rounded-xl mb-3"
        />
      )}
      
      <h4 className="font-bold text-gray-900 dark:text-white mb-2">{event.title}</h4>
      
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i <= event.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      
      {event.review && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
          "{event.review}"
        </p>
      )}
    </div>
  </div>
);

// ============================================================================
// STATS VIEW
// ============================================================================

const TripStatsView = ({ trip, events, groupRatingsByEventId = {}, currentUserId, userStats, leaderboard, darkMode }) => {
  const ratedEvents = (events || [])
    .filter((event) => isEventReviewedByViewer(event, groupRatingsByEventId, currentUserId))
    .map((event) => ({
      ...event,
      rating: getEffectiveViewerRatingValue(event, groupRatingsByEventId, currentUserId),
    }));
  const avgRating = ratedEvents.length > 0
    ? ratedEvents.reduce((sum, e) => sum + e.rating, 0) / ratedEvents.length
    : 0;
  
  const photoCount = events.reduce((sum, e) => sum + (e.photos?.length || 0), 0);
  const restaurantCount = events.filter(e => e.category === 'restaurant').length;
  const activityCount = events.filter(e => e.category === 'activity').length;
  
  const completionPercent = events.length > 0
    ? Math.round((ratedEvents.length / events.length) * 100)
    : 0;
  
  return (
    <div className="space-y-6">
      {/* Completion score */}
      <div className="text-center">
        <div className="text-6xl mb-3">
          {completionPercent === 100 ? '🏆' : '📊'}
        </div>
        <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
          {completionPercent}%
        </div>
        <div className="text-gray-600 dark:text-gray-400">Trip documented</div>
      </div>
      
      {/* Progress bars */}
      <div className="space-y-3">
        <ProgressBar
          icon="⭐"
          label="Ratings"
          current={ratedEvents.length}
          total={events.length}
          color="purple"
        />
        <ProgressBar
          icon="📸"
          label="Photos"
          current={photoCount}
          total={events.length}
          color="pink"
        />
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="⭐" value={avgRating.toFixed(1)} label="Avg Rating" />
        <StatCard icon="🍽️" value={restaurantCount} label="Restaurants" />
        <StatCard icon="🎯" value={activityCount} label="Activities" />
        <StatCard icon="📸" value={photoCount} label="Photos" />
      </div>
      
      {/* User stats */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 
                    border border-blue-200 dark:border-blue-800 p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Your Overall Stats
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {userStats.totalTrips || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Trips</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {userStats.totalReviews || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Reviews</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {userStats.streak || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
        </div>
      </div>
      
      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            🏆 Top Reviewers This Month
          </h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((user, idx) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="text-lg font-bold w-6">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.reviewCount} reviews</div>
                </div>
                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {user.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProgressBar = ({ icon, label, current, total, color }) => {
  const percent = total > 0 ? (current / total) * 100 : 0;
  const colors = {
    purple: 'from-purple-500 to-pink-500',
    pink: 'from-pink-500 to-rose-500',
    blue: 'from-blue-500 to-cyan-500',
  };
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <span className="font-bold text-gray-900 dark:text-white">
          {current}/{total}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors[color]} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label }) => (
  <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-center">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
    <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
  </div>
);

// ============================================================================
// BADGES VIEW
// ============================================================================

const BadgesView = ({ userStats, darkMode }) => {
  const badges = [
    {
      id: 'first_review',
      emoji: '🌟',
      title: 'First Review',
      description: 'Rate your first experience',
      unlocked: (userStats.totalReviews || 0) >= 1,
    },
    {
      id: 'foodie',
      emoji: '🍽️',
      title: 'Foodie',
      description: 'Rate 10 restaurants',
      unlocked: (userStats.restaurantReviews || 0) >= 10,
      progress: userStats.restaurantReviews || 0,
      target: 10,
    },
    {
      id: 'adventurer',
      emoji: '🏔️',
      title: 'Adventurer',
      description: 'Rate 10 activities',
      unlocked: (userStats.activityReviews || 0) >= 10,
      progress: userStats.activityReviews || 0,
      target: 10,
    },
    {
      id: 'photographer',
      emoji: '📸',
      title: 'Photographer',
      description: 'Add 50 photos',
      unlocked: (userStats.totalPhotos || 0) >= 50,
      progress: userStats.totalPhotos || 0,
      target: 50,
    },
    {
      id: 'streak_7',
      emoji: '🔥',
      title: '7-Day Streak',
      description: 'Review for 7 days straight',
      unlocked: (userStats.streak || 0) >= 7,
      progress: userStats.streak || 0,
      target: 7,
    },
    {
      id: 'completionist',
      emoji: '💯',
      title: 'Completionist',
      description: 'Document entire trip (100%)',
      unlocked: (userStats.completedTrips || 0) >= 1,
    },
    {
      id: 'globe_trotter',
      emoji: '🌍',
      title: 'Globe Trotter',
      description: 'Complete 5 trips',
      unlocked: (userStats.totalTrips || 0) >= 5,
      progress: userStats.totalTrips || 0,
      target: 5,
    },
    {
      id: 'voice_master',
      emoji: '🎤',
      title: 'Voice Master',
      description: 'Add 10 voice notes',
      unlocked: (userStats.voiceNotes || 0) >= 10,
      progress: userStats.voiceNotes || 0,
      target: 10,
    },
  ];
  
  const unlockedCount = badges.filter(b => b.unlocked).length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Badges
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {unlockedCount} of {badges.length} unlocked
        </p>
      </div>
      
      {/* Progress */}
      <div className="max-w-sm mx-auto">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
            style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Badges grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};

const BadgeCard = ({ badge, darkMode }) => (
  <div className={`rounded-xl border-2 p-4 text-center transition-all ${
    badge.unlocked
      ? 'border-yellow-400 dark:border-yellow-600 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 scale-105'
      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
  }`}>
    <div className={`text-4xl mb-2 ${badge.unlocked ? '' : 'grayscale'}`}>
      {badge.emoji}
    </div>
    <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">
      {badge.title}
    </div>
    <div className="text-xs text-gray-600 dark:text-gray-400">
      {badge.description}
    </div>
    
    {!badge.unlocked && badge.progress !== undefined && (
      <div className="mt-2">
        <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
          {badge.progress}/{badge.target}
        </div>
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-purple-500"
            style={{ width: `${(badge.progress / badge.target) * 100}%` }}
          />
        </div>
      </div>
    )}
  </div>
);

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
      active
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
    }`}>
    {children}
  </button>
);

// ============================================================================
// EXPORT
// ============================================================================

export default TripRatingSystem;
export {
  StarRating,
  QuickTagsSelector,
  EventRatingCard,
  DailyRecapView,
  TripHighlightsView,
  ReviewsListView,
  TripStatsView,
  BadgesView,
};
