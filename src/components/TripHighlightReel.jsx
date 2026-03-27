import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Share2, Sparkles, Music, X } from 'lucide-react';

const HIGHLIGHT_REEL_TRACKS = Object.freeze([
  {
    id: 'cinematic-sunrise',
    label: 'Cinematic',
    vibe: 'scenic',
    file: '/music/highlight-cinematic.mp3',
  },
  {
    id: 'city-lights',
    label: 'Upbeat',
    vibe: 'nightlife',
    file: '/music/highlight-upbeat.mp3',
  },
  {
    id: 'golden-hour',
    label: 'Chill',
    vibe: 'food',
    file: '/music/highlight-chill.mp3',
  },
  {
    id: 'soft-postcard',
    label: 'Reflective',
    vibe: 'reflective',
    file: '/music/highlight-reflective.mp3',
  },
]);

// ============================================================================
// SMART HIGHLIGHT REEL GENERATOR
// ============================================================================

const TripHighlightReel = ({
  trip,
  events = [],
  groupRatingsByEventId = {},
  currentUserId,
  onClose,
  onShare,
  onPublish,
  onSave,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [highlights, setHighlights] = useState([]);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(HIGHLIGHT_REEL_TRACKS[0].id);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const shareMenuRef = useRef(null);
  const musicMenuRef = useRef(null);

  // ============================================================================
  // SMART CONTENT SELECTION ALGORITHM
  // ============================================================================
  
  useEffect(() => {
    const generateHighlights = () => {
      const scored = [];
      
      events.forEach(event => {
        // Get effective rating (local or group)
        const rating = getEffectiveRating(event, groupRatingsByEventId, currentUserId);
        
        // Skip unrated/low-rated events
        if (rating < 3) return;
        
        // Calculate highlight score
        let score = 0;
        
        // 1. Rating weight (highest priority)
        score += rating * 20;
        
        // 2. Photo quality weight
        const photos = normalizeEventPhotos(event.photos);
        const photoCount = photos.length;
        if (photoCount > 0) {
          score += Math.min(photoCount, 5) * 5; // Up to 25 points for photos
          
          // Bonus for photos with faces/people (mock detection - in real app use ML)
          // You could integrate with a face detection API here
          const photosWithPeople = photos.filter((p) => p.hasPeople);
          score += photosWithPeople.length * 3;
        }
        
        // 3. Tags/emotional markers
        const tags = event.tags || [];
        const emotionalTags = ['must_try', 'instagram', 'romantic', 'amazing_view', 'unforgettable'];
        const hasEmotionalTag = tags.some(t => emotionalTags.includes(t));
        if (hasEmotionalTag) score += 15;
        
        // 4. Written review weight
        if (event.review && event.review.length > 50) score += 10;
        
        // 5. Voice notes (shows emotional investment)
        if (event.voiceNotes && event.voiceNotes.length > 0) score += 8;
        
        // 6. Shared experience bonus (group event)
        const groupRatings = groupRatingsByEventId[event.id] || [];
        if (groupRatings.length > 1) score += 10;
        
        // 7. Time of day variety (prefer mix of morning/afternoon/evening)
        const hour = event.time ? parseInt(event.time.split(':')[0]) : 12;
        if (hour >= 6 && hour < 10) score += 3; // Morning
        if (hour >= 18 && hour < 22) score += 5; // Golden hour/evening
        
        // Add to scored list
        scored.push({
          event,
          score,
          rating,
          photos: photos.slice(0, 3), // Max 3 photos per event
        });
      });
      
      // Sort by score and select top highlights
      scored.sort((a, b) => b.score - a.score);
      
      // Smart selection: ensure variety
      const selected = [];
      const maxHighlights = 15;
      const seenDates = new Set();
      
      for (const item of scored) {
        if (selected.length >= maxHighlights) break;
        
        const eventDate = new Date(item.event.date).toDateString();
        
        // Ensure we don't over-represent one day (max 3 per day)
        const dateCount = Array.from(seenDates).filter(d => d === eventDate).length;
        if (dateCount >= 3) continue;
        
        selected.push(item);
        seenDates.add(eventDate);
      }
      
      // Create slide deck with photos
      const slides = [];
      
      // Opening slide
      slides.push({
        type: 'title',
        title: String(trip?.name || 'Trip').trim() || 'Trip',
        subtitle: formatTripDates(
          trip?.startDate || trip?.start_date || trip?.start,
          trip?.endDate || trip?.end_date || trip?.end
        ),
        background: selected[0]?.photos[0]?.url || '',
      });
      
      // Event slides
      selected.forEach(item => {
        // If event has photos, create photo slides
        if (item.photos.length > 0) {
          item.photos.forEach(photo => {
            slides.push({
              type: 'photo',
              photo: photo.url,
              caption: item.event.title,
              rating: item.rating,
              date: item.event.date,
              location: item.event.location,
            });
          });
        } else {
          // Text-only slide for events without photos
          slides.push({
            type: 'text',
            title: item.event.title,
            rating: item.rating,
            date: item.event.date,
            location: item.event.location,
            review: item.event.review,
          });
        }
      });
      
      // Stats/closing slide
      slides.push({
        type: 'stats',
        totalEvents: events.length,
        topRated: selected[0]?.event.title,
        totalPhotos: events.reduce((sum, e) => sum + (e.photos?.length || 0), 0),
        avgRating: (scored.reduce((sum, s) => sum + s.rating, 0) / scored.length).toFixed(1),
      });
      
      setHighlights(slides);
    };
    
    generateHighlights();
  }, [events, groupRatingsByEventId, currentUserId, trip]);

  useEffect(() => {
    const nextTrackId = pickDefaultTrackId(events, groupRatingsByEventId, currentUserId);
    setSelectedTrackId(nextTrackId);
    setAudioAvailable(true);
  }, [events, groupRatingsByEventId, currentUserId]);

  // ============================================================================
  // PLAYBACK CONTROLS
  // ============================================================================
  
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev >= highlights.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 3000); // 3 seconds per slide
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, highlights.length]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.load();
    if (isPlaying && musicEnabled && audioAvailable) {
      audioRef.current.play().catch(() => {});
    }
  }, [selectedTrackId, isPlaying, musicEnabled, audioAvailable]);
  
  const handlePlayPause = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (!audioRef.current) return;
    if (nextPlaying && musicEnabled && audioAvailable) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  };
  
  const handleNext = () => {
    setCurrentSlide(prev => Math.min(prev + 1, highlights.length - 1));
  };
  
  const handlePrev = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };
  
  const handleDownload = () => {
    setShowShareMenu(false);
    setShowMusicMenu(false);
    if (onSave) {
      onSave(highlights);
      return;
    }
    alert('Save feature is not available right now.');
  };
  
  const handleShare = () => {
    setShowShareMenu(false);
    setShowMusicMenu(false);
    if (onShare) {
      onShare(highlights);
    }
  };

  const handlePublish = () => {
    setShowShareMenu(false);
    setShowMusicMenu(false);
    if (onPublish) onPublish(highlights);
  };

  const handleToggleMusicEnabled = () => {
    const nextEnabled = !musicEnabled;
    setMusicEnabled(nextEnabled);
    if (!audioRef.current) return;
    if (!nextEnabled) {
      audioRef.current.pause();
      return;
    }
    if (isPlaying && audioAvailable) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleSelectTrack = (trackId) => {
    setSelectedTrackId(trackId);
    setAudioAvailable(true);
    setShowMusicMenu(false);
  };

  useEffect(() => {
    if (!showShareMenu) return undefined;
    const handleClickOutside = (event) => {
      if (!shareMenuRef.current?.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showShareMenu]);

  useEffect(() => {
    if (!showMusicMenu) return undefined;
    const handleClickOutside = (event) => {
      if (!musicMenuRef.current?.contains(event.target)) {
        setShowMusicMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMusicMenu]);

  if (highlights.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin text-6xl mb-4">✨</div>
          <div className="text-xl">Creating your highlight reel...</div>
        </div>
      </div>
    );
  }

  const currentHighlight = highlights[currentSlide];
  const selectedTrack = HIGHLIGHT_REEL_TRACKS.find((track) => track.id === selectedTrackId) || HIGHLIGHT_REEL_TRACKS[0];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Hidden audio element for background music */}
      <audio
        ref={audioRef}
        loop
        onError={() => setAudioAvailable(false)}
      >
        {/* In production, load from music library */}
        <source src={selectedTrack.file} type="audio/mpeg" />
      </audio>
      
      {/* Top controls */}
      <div
        className="absolute top-0 left-0 right-0 z-10 px-4 pb-4 pt-6 bg-gradient-to-b from-black/60 to-transparent"
        style={{ paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top) + 1rem))' }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex gap-2">
          <button
              onClick={handleToggleMusicEnabled}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <Music className={`w-5 h-5 ${musicEnabled ? '' : 'opacity-50'}`} />
            </button>

            <div className="relative" ref={musicMenuRef}>
              <button
                onClick={() => setShowMusicMenu((prev) => !prev)}
                className="min-w-[5.5rem] h-10 rounded-full bg-white/20 px-3 backdrop-blur-md flex items-center justify-center text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-white/30 transition-colors"
              >
                {selectedTrack.label}
              </button>
              {showMusicMenu ? (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/15 bg-black/75 backdrop-blur-xl shadow-2xl">
                  <div className="border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Soundtrack
                  </div>
                  {HIGHLIGHT_REEL_TRACKS.map((track) => {
                    const active = track.id === selectedTrackId;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handleSelectTrack(track.id)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${active ? 'bg-white/12 text-white' : 'text-white hover:bg-white/10'}`}
                      >
                        <span>{track.label}</span>
                        <span className="text-[11px] uppercase tracking-[0.16em] text-white/55">{track.vibe}</span>
                      </button>
                    );
                  })}
                  {!audioAvailable ? (
                    <div className="border-t border-white/10 px-4 py-3 text-xs text-white/65">
                      Add the matching mp3 files in `public/music` to enable playback.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
             
            <button
              onClick={handleDownload}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {showShareMenu ? (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/15 bg-black/75 backdrop-blur-xl shadow-2xl">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <span>Share with Friends</span>
                    <Share2 className="h-4 w-4 opacity-80" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <span>Publish to Explore</span>
                    <Sparkles className="h-4 w-4 opacity-80" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-white/60">
          {musicEnabled
            ? (audioAvailable ? `Soundtrack: ${selectedTrack.label}` : `Soundtrack ready: ${selectedTrack.label}`)
            : 'Soundtrack muted'}
        </div>
      </div>
      
      {/* Main slide area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Title Slide */}
        {currentHighlight.type === 'title' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
              style={{ backgroundImage: `url(${currentHighlight.background})` }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 text-center text-white px-8">
              <div className="text-6xl mb-4 animate-pulse">✨</div>
              <h1 className="text-5xl font-bold mb-3 animate-fade-in">
                {currentHighlight.title}
              </h1>
              <p className="text-2xl opacity-90 animate-fade-in-delay">
                {currentHighlight.subtitle}
              </p>
            </div>
          </div>
        )}
        
        {/* Photo Slide */}
        {currentHighlight.type === 'photo' && (
          <div className="absolute inset-0">
            <img
              src={currentHighlight.photo}
              alt={currentHighlight.caption}
              className="w-full h-full object-contain animate-ken-burns"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`text-2xl ${i < currentHighlight.rating ? 'opacity-100' : 'opacity-30'}`}
                  >
                    ⭐
                  </div>
                ))}
              </div>
              <h2 className="text-3xl font-bold mb-2">{currentHighlight.caption}</h2>
              {currentHighlight.location && (
                <p className="text-lg opacity-90">📍 {currentHighlight.location}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Text Slide */}
        {currentHighlight.type === 'text' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
            <div className="text-center text-white px-8 max-w-2xl">
              <div className="flex items-center justify-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`text-3xl ${i < currentHighlight.rating ? 'opacity-100' : 'opacity-30'}`}
                  >
                    ⭐
                  </div>
                ))}
              </div>
              <h2 className="text-4xl font-bold mb-4">{currentHighlight.title}</h2>
              {currentHighlight.location && (
                <p className="text-xl mb-4 opacity-90">📍 {currentHighlight.location}</p>
              )}
              {currentHighlight.review && (
                <p className="text-lg italic opacity-90 line-clamp-3">
                  "{currentHighlight.review}"
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Stats Slide */}
        {currentHighlight.type === 'stats' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
            <div className="text-center text-white px-8">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-4xl font-bold mb-8">Trip Complete!</h2>
              <div className="grid grid-cols-2 gap-6 max-w-lg">
                <StatBubble icon="📅" value={currentHighlight.totalEvents} label="Events" />
                <StatBubble icon="📸" value={currentHighlight.totalPhotos} label="Photos" />
                <StatBubble icon="⭐" value={currentHighlight.avgRating} label="Avg Rating" />
                <StatBubble icon="🏆" value={currentHighlight.topRated} label="Top Rated" small />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-20 left-0 right-0 px-8">
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / highlights.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        {isPlaying ? null : (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-30"
            >
              ◀
            </button>
            
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-purple-600 hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Play className="w-8 h-8 ml-1" />
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentSlide === highlights.length - 1}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-30"
            >
              ▶
            </button>
          </div>
        )}
        
        <div className="text-center text-white text-sm mt-3 opacity-75">
          {currentSlide + 1} / {highlights.length}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const StatBubble = ({ icon, value, label, small = false }) => (
  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4">
    <div className="text-3xl mb-2">{icon}</div>
    <div className={`font-bold mb-1 ${small ? 'text-sm truncate' : 'text-3xl'}`}>
      {value}
    </div>
    <div className="text-sm opacity-90">{label}</div>
  </div>
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getEffectiveRating = (event, groupRatingsByEventId, currentUserId) => {
  const localRating = Number(event?.rating || 0);
  if (localRating > 0) return localRating;
  
  const groupRatings = groupRatingsByEventId[String(event?.id || '')] || [];
  const userRating = groupRatings.find(r => String(r?.userId || '') === String(currentUserId || ''));
  return Number(userRating?.rating || 0);
};

const normalizeEventPhotos = (photos) => (
  (Array.isArray(photos) ? photos : [])
    .map((photo, index) => {
      if (typeof photo === 'string') {
        const url = String(photo || '').trim();
        return url ? { id: `photo-${index}`, url, hasPeople: false } : null;
      }
      if (photo && typeof photo === 'object') {
        const url = String(photo.url || photo.src || '').trim();
        return url ? { ...photo, url, hasPeople: Boolean(photo.hasPeople) } : null;
      }
      return null;
    })
    .filter(Boolean)
);

const pickDefaultTrackId = (events, groupRatingsByEventId, currentUserId) => {
  const safeEvents = Array.isArray(events) ? events : [];
  const scores = {
    scenic: 0,
    nightlife: 0,
    food: 0,
    reflective: 0,
  };

  safeEvents.forEach((event) => {
    const title = String(event?.title || '').toLowerCase();
    const location = String(event?.location || '').toLowerCase();
    const review = String(event?.review || '').toLowerCase();
    const tags = Array.isArray(event?.tags) ? event.tags.map((tag) => String(tag || '').toLowerCase()) : [];
    const haystack = [title, location, review, tags.join(' ')].join(' ');
    const rating = getEffectiveRating(event, groupRatingsByEventId, currentUserId);

    if (/(sunset|sunrise|view|beach|coast|mountain|lake|hike|museum|landmark|scenic)/.test(haystack)) {
      scores.scenic += 2 + rating * 0.2;
    }
    if (/(bar|club|cocktail|night|dance|party|dj|late)/.test(haystack)) {
      scores.nightlife += 2 + rating * 0.2;
    }
    if (/(food|restaurant|breakfast|brunch|lunch|dinner|coffee|cafe|dessert|bakery)/.test(haystack)) {
      scores.food += 2 + rating * 0.2;
    }
    if (/(spa|quiet|journal|walk|park|morning|reflect|temple|cathedral)/.test(haystack)) {
      scores.reflective += 2 + rating * 0.2;
    }
  });

  const topVibe = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'scenic';
  return HIGHLIGHT_REEL_TRACKS.find((track) => track.vibe === topVibe)?.id || HIGHLIGHT_REEL_TRACKS[0].id;
};

const formatTripDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-US', options);
  }
  
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
};

// ============================================================================
// EXPORT
// ============================================================================

export default TripHighlightReel;

// ============================================================================
// CSS ANIMATIONS (add to your global CSS)
// ============================================================================

/*
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-delay {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ken-burns {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in-delay 0.8s ease-out 0.3s both;
}

.animate-ken-burns {
  animation: ken-burns 20s ease-out infinite alternate;
}
*/
