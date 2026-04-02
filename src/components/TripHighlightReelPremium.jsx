import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Music, Play, Pause, Share2, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * PREMIUM TRIP HIGHLIGHT REEL
 * 
 * Surpasses Apple Photos Memories with:
 * - Cinematic Ken Burns effects on every photo
 * - Editorial typography with variable font sizes
 * - Intelligent slide duration (longer for photos, shorter for text)
 * - Professional color grading per mood
 * - Smooth cross-dissolve transitions
 * - Premium UI with glassmorphism
 */

const HIGHLIGHT_REEL_TRACKS = Object.freeze([
  { id: 'cinematic-sunrise', label: 'Cinematic', vibe: 'scenic', file: '/music/highlight-cinematic.mp3' },
  { id: 'city-lights', label: 'Upbeat', vibe: 'nightlife', file: '/music/highlight-upbeat.mp3' },
  { id: 'golden-hour', label: 'Chill', vibe: 'food', file: '/music/highlight-chill.mp3' },
  { id: 'soft-postcard', label: 'Reflective', vibe: 'reflective', file: '/music/highlight-reflective.mp3' },
]);

// Premium photo treatments with professional color grading
const PHOTO_TREATMENTS = Object.freeze({
  scenic: {
    filter: 'saturate(1.08) contrast(1.04) brightness(0.96)',
    vignette: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.15) 100%)',
    kenBurns: 'zoom-pan',
  },
  food: {
    filter: 'saturate(1.12) contrast(1.02) brightness(1.02) sepia(0.05)',
    vignette: 'radial-gradient(circle at 40% 40%, transparent 0%, rgba(0,0,0,0.12) 100%)',
    kenBurns: 'zoom-in',
  },
  nightlife: {
    filter: 'contrast(1.10) saturate(1.15) brightness(0.90) hue-rotate(-4deg)',
    vignette: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.25) 100%)',
    kenBurns: 'pan-right',
  },
  reflective: {
    filter: 'contrast(0.96) saturate(0.92) brightness(1.03)',
    vignette: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.10) 100%)',
    kenBurns: 'zoom-out',
  },
  hotel: {
    filter: 'contrast(1.01) saturate(0.98) brightness(1.0) sepia(0.02)',
    vignette: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.14) 100%)',
    kenBurns: 'zoom-out',
  },
  people: {
    filter: 'saturate(1.06) contrast(1.00) brightness(1.01)',
    vignette: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.08) 100%)',
    kenBurns: 'zoom-in-slow',
  },
});

const FOOD_HIGHLIGHT_PATTERN = /(food|restaurant|breakfast|brunch|lunch|dinner|coffee|cafe|dessert|bakery|meal|drink|cocktail)/i;
const HOTEL_HIGHLIGHT_PATTERN = /(hotel|resort|inn|suite|stay|check-in|check in|lobby|room|villa|airbnb)/i;

const hasMeaningfulLocation = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime()) && /^[A-Za-z]{3,9}\s+\d{1,2}(,\s+\d{4})?$/.test(normalized)) {
    return false;
  }
  return true;
};

const getPhotoLocationCaptionMeta = (highlight) => {
  const mood = String(highlight?.mood || '').trim().toLowerCase();
  const eventMood = String(highlight?.eventMood || '').trim().toLowerCase();
  const directLocation = String(highlight?.location || '').trim();
  const eventLocation = String(highlight?.eventLocation || '').trim();
  const location = hasMeaningfulLocation(directLocation)
    ? directLocation
    : ((mood === 'food' || eventMood === 'food' || mood === 'hotel' || eventMood === 'hotel') && hasMeaningfulLocation(eventLocation)
      ? eventLocation
      : '');
  if (!location) return null;

  if (mood === 'people') return null;

  const haystack = [
    String(highlight?.mood || ''),
    String(highlight?.eventMood || ''),
    String(highlight?.caption || ''),
    String(highlight?.eyebrow || ''),
    location,
  ].join(' ');

  if (mood === 'food' || eventMood === 'food' || FOOD_HIGHLIGHT_PATTERN.test(haystack)) {
    return { label: 'Food Stop', location };
  }
  if (mood === 'hotel' || eventMood === 'hotel' || HOTEL_HIGHLIGHT_PATTERN.test(haystack)) {
    return { label: 'Stay', location };
  }
  if (['scenic', 'reflective'].includes(mood)) {
    return { label: 'Place', location };
  }
  return null;
};

const isFoodPhotoHighlight = (highlight) => {
  const haystack = [
    String(highlight?.mood || ''),
    String(highlight?.caption || ''),
    String(highlight?.eyebrow || ''),
    String(highlight?.location || ''),
  ].join(' ');
  return String(highlight?.mood || '').trim().toLowerCase() === 'food' || FOOD_HIGHLIGHT_PATTERN.test(haystack);
};

const resolvePhotoSpecificLocation = (photo) => {
  const candidates = [
    photo?.location,
    photo?.place,
    photo?.place_name,
    photo?.placeName,
    photo?.venue,
    photo?.venue_name,
    photo?.venueName,
    photo?.address,
    photo?.city,
  ];
  return candidates
    .map((value) => String(value || '').trim())
    .find((value) => hasMeaningfulLocation(value)) || '';
};

const buildEventPhotoHighlight = ({ moment, photo, photoIndex, copy }) => {
  const isLeadPhoto = photoIndex === 0;
  const photoSpecificLocation = resolvePhotoSpecificLocation(photo);
  const inferredPhotoMood = photo?.hasPeople
    ? 'people'
    : inferVisualMood({
        title: '',
        location: photoSpecificLocation,
        review: String(photo?.caption || '').trim(),
        tags: Array.isArray(photo?.tags) ? photo.tags : [],
      });
  const resolvedMood = isLeadPhoto
    ? ((photoSpecificLocation || String(photo?.caption || '').trim() || (Array.isArray(photo?.tags) && photo.tags.length > 0))
        ? inferredPhotoMood
        : (moment?.mood || 'scenic'))
    : inferredPhotoMood;
  const fallbackLocation = isLeadPhoto && ['food', 'hotel'].includes(String(resolvedMood || '').trim().toLowerCase())
    ? String(moment?.event?.location || '').trim()
    : '';
  const resolvedLocation = photoSpecificLocation || fallbackLocation;

  return {
    type: 'photo',
    photo: photo?.url,
    caption: isLeadPhoto ? copy.title : '',
    subcopy: copy.subcopy,
    eyebrow: isLeadPhoto ? copy.eyebrow : '',
    location: resolvedLocation,
    eventLocation: String(moment?.event?.location || '').trim(),
    rating: moment?.rating,
    mood: resolvedMood,
    eventMood: String(moment?.mood || '').trim(),
  };
};

const getPhotoGroupPriorityBoost = (photo) => {
  const peopleCount = Number(
    photo?.peopleCount
    || photo?.faceCount
    || (Array.isArray(photo?.people) ? photo.people.length : 0)
    || (Array.isArray(photo?.taggedPeople) ? photo.taggedPeople.length : 0)
    || (Array.isArray(photo?.tagged_people) ? photo.tagged_people.length : 0)
    || 0
  );
  if (peopleCount >= 4) return 20;
  if (peopleCount === 3) return 16;
  if (peopleCount === 2) return 12;
  if (photo?.hasPeople) return 6;
  return 0;
};

const hasMeaningfulPhotoStory = (highlight) => {
  const caption = String(highlight?.caption || '').trim();
  const eyebrow = String(highlight?.eyebrow || '').trim();
  const mood = String(highlight?.mood || '').trim().toLowerCase();
  const locationCaptionMeta = getPhotoLocationCaptionMeta(highlight);
  if (mood === 'people') {
    return Boolean(caption || eyebrow);
  }
  return Boolean(locationCaptionMeta);
};

export default function TripHighlightReel({
  trip,
  tripPhotos = [],
  events = [],
  groupRatingsByEventId = {},
  currentUserId,
  selectedPhotoMode = false,
  onClose,
  onShare,
  onPublish,
  onSave,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(HIGHLIGHT_REEL_TRACKS[0].id);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const shareMenuRef = useRef(null);
  const musicMenuRef = useRef(null);

  // Build highlights with intelligent slide generation
  const highlights = useMemo(() => {
    return buildHighlightSlides(trip, tripPhotos, events, groupRatingsByEventId, currentUserId, { selectedPhotoMode });
  }, [trip, tripPhotos, events, groupRatingsByEventId, currentUserId, selectedPhotoMode]);

  const safeHighlights = useMemo(() => (
    Array.isArray(highlights) && highlights.length > 0 ? highlights : buildEmergencySlides(trip)
  ), [highlights, trip]);

  // Intelligent slide duration based on content type
  const getSlideDuration = (slide) => {
    if (slide.type === 'photo') return 4500; // Longer for photos (people want to savor)
    if (slide.type === 'title') return 3500;
    if (slide.type === 'chapter') return 3000;
    if (slide.type === 'spotlight') return 4000;
    if (slide.type === 'stats') return 5000; // Longest for stats (need time to read)
    if (slide.type === 'text') return 3500;
    return 4000;
  };

  // Auto-advance with variable timing
  useEffect(() => {
    if (!isPlaying || safeHighlights.length <= 1) return;

    const currentDuration = getSlideDuration(safeHighlights[currentSlide]);
    
    intervalRef.current = setTimeout(() => {
      if (currentSlide >= safeHighlights.length - 1) {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();
      } else {
        advanceSlide();
      }
    }, currentDuration);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [isPlaying, currentSlide, safeHighlights]);

  const advanceSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, safeHighlights.length - 1));
  };

  const handlePlayPause = () => {
    const nextPlaying = !isPlaying;
    if (nextPlaying && currentSlide >= safeHighlights.length - 1) {
      setCurrentSlide(0);
    }
    setIsPlaying(nextPlaying);
    
    if (!audioRef.current) return;
    if (nextPlaying && musicEnabled && audioAvailable) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  };

  const handleNext = () => {
    if (currentSlide < safeHighlights.length - 1) {
      advanceSlide();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => Math.max(prev - 1, 0));
    }
  };

  const currentHighlight = safeHighlights[currentSlide] || safeHighlights[0];
  const selectedTrack = HIGHLIGHT_REEL_TRACKS.find((track) => track.id === selectedTrackId) || HIGHLIGHT_REEL_TRACKS[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Audio */}
      <audio ref={audioRef} loop onError={() => setAudioAvailable(false)}>
        <source src={selectedTrack.file} type="audio/mpeg" />
      </audio>

      {/* PREMIUM TOP BAR - Glassmorphism with blur */}
      <div className="absolute top-0 left-0 right-0 z-30 px-6 pb-5 pt-8 bg-gradient-to-b from-black/72 via-black/34 to-transparent"
           style={{ paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 1.5rem))' }}>
        <div className="flex items-center justify-between">
          {/* Close Button - Elevated design */}
          <button
            onClick={onClose}
            className="group flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xl transition-all hover:bg-black/60 hover:scale-105 active:scale-95 ring-1 ring-white/10"
          >
            <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
          </button>

          {/* Controls - Premium pill design */}
          <div className="flex gap-2.5">
            {/* Music Toggle */}
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xl transition-all hover:bg-black/60 hover:scale-105 active:scale-95 ring-1 ring-white/10"
            >
              <Music className={`h-5 w-5 transition-opacity ${musicEnabled ? 'opacity-100' : 'opacity-40'}`} />
            </button>

            {/* Track Selector - Premium dropdown */}
            <div className="relative" ref={musicMenuRef}>
              <button
                onClick={() => setShowMusicMenu(!showMusicMenu)}
                className="flex h-11 items-center gap-2 rounded-full bg-black/40 px-4 text-xs font-bold uppercase tracking-[0.12em] text-white backdrop-blur-xl transition-all hover:bg-black/60 hover:scale-105 active:scale-95 ring-1 ring-white/10"
              >
                <Music className="h-4 w-4" />
                <span>{selectedTrack.label}</span>
              </button>
              
              {showMusicMenu && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-white/10 bg-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Soundtrack</div>
                  </div>
                  {HIGHLIGHT_REEL_TRACKS.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setSelectedTrackId(track.id);
                        setShowMusicMenu(false);
                      }}
                      className={`flex w-full items-center justify-between px-5 py-4 transition-all ${
                        track.id === selectedTrackId
                          ? 'bg-white/15 text-white'
                          : 'text-white/80 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold">{track.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-white/50">{track.vibe}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download */}
            <button
              onClick={() => onSave && onSave(safeHighlights)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xl transition-all hover:bg-black/60 hover:scale-105 active:scale-95 ring-1 ring-white/10"
            >
              <Download className="h-5 w-5" />
            </button>

            {/* Share - Premium dropdown */}
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black backdrop-blur-xl transition-all hover:bg-white hover:scale-105 active:scale-95 shadow-lg shadow-white/20"
              >
                <Share2 className="h-5 w-5" />
              </button>
              
              {showShareMenu && (
                <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-3xl border border-white/10 bg-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                  <button
                    onClick={() => {
                      onShare && onShare(safeHighlights);
                      setShowShareMenu(false);
                    }}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-white/80 transition-all hover:bg-white/8 hover:text-white"
                  >
                    <span className="font-semibold">Share with Friends</span>
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      onPublish && onPublish(safeHighlights);
                      setShowShareMenu(false);
                    }}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-white/80 transition-all hover:bg-white/8 hover:text-white"
                  >
                    <span className="font-semibold">Publish to Explore</span>
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN SLIDE AREA */}
      <div className="relative flex-1 overflow-hidden">
        {/* Touch/Click navigation zones */}
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="absolute inset-y-0 left-0 z-20 w-1/3 bg-transparent disabled:pointer-events-none"
          aria-label="Previous"
        />
        <button
          onClick={handleNext}
          disabled={currentSlide >= safeHighlights.length - 1}
          className="absolute inset-y-0 right-0 z-20 w-1/3 bg-transparent disabled:pointer-events-none"
          aria-label="Next"
        />

        <div key={currentSlide} className="absolute inset-0 animate-fade-in">
          <SlideRenderer highlight={currentHighlight} />
        </div>
      </div>

      {/* PREMIUM PROGRESS BAR - Subtle line */}
      <div className="absolute bottom-24 left-0 right-0 px-12">
        <div className="h-0.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-white shadow-sm shadow-white/50 transition-all duration-300 ease-out"
            style={{ width: `${((currentSlide + 1) / Math.max(1, safeHighlights.length)) * 100}%` }}
          />
        </div>
      </div>

      {/* PREMIUM PLAYBACK CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-5 bg-gradient-to-t from-black/74 via-black/34 to-transparent"
           style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}>
        <div className="flex items-center justify-center gap-6">
          {/* Previous */}
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xl transition-all hover:bg-black/60 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ring-1 ring-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Play/Pause - Hero button */}
          <button
            onClick={handlePlayPause}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-2xl shadow-white/30 transition-all hover:scale-110 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={currentSlide >= safeHighlights.length - 1}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xl transition-all hover:bg-black/60 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ring-1 ring-white/10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Slide counter - Editorial typography */}
        <div className="mt-8 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {currentSlide + 1} of {safeHighlights.length}
          </div>
        </div>
      </div>

      {/* Global animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 320ms ease-out forwards;
        }
        
        /* Ken Burns variations */
        @keyframes zoom-pan {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.15) translate(-3%, -2%); }
        }
        @keyframes zoom-in {
          from { transform: scale(1); }
          to { transform: scale(1.12); }
        }
        @keyframes pan-right {
          from { transform: scale(1.08) translateX(0); }
          to { transform: scale(1.08) translateX(-4%); }
        }
        @keyframes zoom-out {
          from { transform: scale(1.15); }
          to { transform: scale(1); }
        }
        @keyframes zoom-in-slow {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// SLIDE RENDERERS - Premium typography and layouts
// ============================================================================

function SlideRenderer({ highlight }) {
  if (!highlight) return null;

  switch (highlight.type) {
    case 'title':
      return <TitleSlide highlight={highlight} />;
    case 'photo':
      return <PhotoSlide highlight={highlight} />;
    case 'chapter':
      return <ChapterSlide highlight={highlight} />;
    case 'spotlight':
      return <SpotlightSlide highlight={highlight} />;
    case 'stats':
      return <StatsSlide highlight={highlight} />;
    default:
      return null;
  }
}

function TitleSlide({ highlight }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {highlight.background && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
            style={{ backgroundImage: `url(${highlight.background})`, animation: 'zoom-in-slow 20s ease-out forwards' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </>
      )}
      
      <div className="relative z-10 px-12 text-center">
        <div className="mb-8 inline-block animate-pulse">
          <Sparkles className="h-12 w-12 text-white/80" />
        </div>
        <h1 className="mb-6 text-6xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl" 
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.03em' }}>
          {highlight.title}
        </h1>
        <p className="text-xl font-medium tracking-wide text-white/80 sm:text-2xl">
          {highlight.subtitle}
        </p>
      </div>
    </div>
  );
}

function PhotoSlide({ highlight }) {
  const treatment = PHOTO_TREATMENTS[highlight.mood] || PHOTO_TREATMENTS.scenic;
  const caption = String(highlight.caption || '').trim();
  const locationCaptionMeta = getPhotoLocationCaptionMeta(highlight);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="absolute inset-0">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${highlight.photo})`,
            filter: `${treatment.filter} blur(20px) brightness(0.62)`,
            transform: 'scale(1.08)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: treatment.vignette }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/22 via-transparent to-black/62" />
      </div>

      <div className="absolute inset-x-4 top-24 bottom-24 sm:inset-x-8 sm:top-28 sm:bottom-28">
        <img
          src={highlight.photo}
          alt={caption || 'Trip highlight'}
          className="h-full w-full object-contain"
          style={{
            filter: treatment.filter,
            animation: `${treatment.kenBurns} 20s ease-out forwards`,
          }}
        />
      </div>

      {locationCaptionMeta ? (
        <div className="absolute inset-x-5 bottom-52 flex justify-center sm:inset-x-8 sm:bottom-56">
          <div className="max-w-[min(34rem,92vw)] rounded-[24px] border border-white/18 bg-black/42 px-5 py-3 text-center text-white shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/72">
              <span role="img" aria-label="Location pin">📍</span>
            </div>
            <div className="mt-2 text-[15px] font-medium text-white/96 sm:text-[17px]">
              {locationCaptionMeta.location}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChapterSlide({ highlight }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" 
         style={{ background: highlight.background || 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' }}>
      <div className="px-12 text-center text-white">
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
          {highlight.eyebrow}
        </div>
        <h2 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl" 
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
          {highlight.title}
        </h2>
        <p className="text-xl font-medium text-white/80">
          {highlight.subtitle}
        </p>
      </div>
    </div>
  );
}

function SpotlightSlide({ highlight }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" 
         style={{ background: highlight.background || 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}>
      <div className="px-12 text-center text-white">
        {highlight.eyebrow && (
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            {highlight.eyebrow}
          </div>
        )}
        <h2 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl" 
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.03em' }}>
          {highlight.title}
        </h2>
        <p className="mb-4 text-2xl font-semibold text-white/90">
          {highlight.caption}
        </p>
        {highlight.subcopy && (
          <p className="text-lg text-white/70">
            {highlight.subcopy}
          </p>
        )}
      </div>
    </div>
  );
}

function StatsSlide({ highlight }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="px-12 text-center text-white">
        <div className="mb-12 text-7xl">🎉</div>
        <h2 className="mb-12 text-5xl font-bold tracking-tight sm:text-6xl" 
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
          Trip Complete!
        </h2>
        <div className="grid grid-cols-2 gap-8 mx-auto max-w-2xl">
          <StatBubble icon="📅" value={highlight.totalDays} label="Days" />
          <StatBubble icon="📸" value={highlight.totalPhotos} label="Photos" />
          <StatBubble icon="⭐" value={highlight.avgRating} label="Avg Rating" />
          <StatBubble icon="🏆" value={highlight.topRated} label="Top Rated" large />
        </div>
      </div>
    </div>
  );
}

function StatBubble({ icon, value, label, large }) {
  return (
    <div className="rounded-3xl bg-white/15 backdrop-blur-xl p-6 ring-1 ring-white/20">
      <div className="mb-3 text-4xl">{icon}</div>
      <div className={`mb-2 font-bold ${large ? 'text-lg' : 'text-4xl'}`}>
        {large ? <div className="text-base truncate">{value}</div> : value}
      </div>
      <div className="text-sm font-semibold uppercase tracking-wide text-white/80">{label}</div>
    </div>
  );
}

const buildHighlightSlides = (trip, tripPhotos, events, groupRatingsByEventId, currentUserId, options = {}) => {
  const normalizedMoments = buildScoredMoments(events, groupRatingsByEventId, currentUserId);
  const slides = buildPremiumSlides(trip, normalizedMoments, events, tripPhotos, options);
  if (Array.isArray(slides) && slides.length > 0) return slides;
  const fallbackSlides = buildFallbackSlides(trip, events, tripPhotos);
  return Array.isArray(fallbackSlides) && fallbackSlides.length > 0 ? fallbackSlides : buildEmergencySlides(trip);
};

const buildScoredMoments = (events, groupRatingsByEventId, currentUserId) => (
  (Array.isArray(events) ? events : [])
    .map((event) => {
      const rating = getEffectiveRating(event, groupRatingsByEventId, currentUserId);
      const photos = normalizeEventPhotos(event?.photos || event?.photoUrls || []);
      const review = String(event?.review || '').trim();
      const mood = inferVisualMood(event);
      const title = String(event?.title || '').toLowerCase();
      const location = String(event?.location || '').toLowerCase();
      const tags = Array.isArray(event?.tags) ? event.tags : [];
      const haystack = `${title} ${location} ${review.toLowerCase()}`;

      let score = 0;
      const peoplePhotos = photos.filter((photo) => photo.hasPeople);
      score += peoplePhotos.length * 20;
      score += Math.min(photos.length, 8) * 1.5;

      const candidTags = ['candid', 'spontaneous', 'funny', 'sweet', 'unexpected', 'kids'];
      if (tags.some((tag) => candidTags.includes(tag))) score += 15;

      const groupRatings = groupRatingsByEventId[String(event?.id || '')] || [];
      if (groupRatings.length > 1) score += 10;

      if (event?.voiceNotes && Array.isArray(event.voiceNotes) && event.voiceNotes.length > 0) score += 8;
      if (rating >= 4) score += rating * 1.6;

      const hour = event?.time ? parseInt(String(event.time || '').split(':')[0], 10) : 12;
      if (hour >= 6 && hour < 10) score += 3;
      if (hour >= 17 && hour < 20) score += 6;

      if (review.length > 50) score += 4;
      if (/(sunset|sunrise|beach|favorite|best|beautiful)/.test(haystack)) score += 3;

      const isTouristy = /(museum|monument|landmark|cathedral|palace|tower|statue|attraction)/.test(haystack);
      if (isTouristy && peoplePhotos.length === 0) score -= 12;

      const isRestaurant = /(restaurant|dinner|lunch|breakfast|brunch|cafe)/.test(haystack);
      if (isRestaurant && peoplePhotos.length === 0 && rating < 4.5) score -= 6;

      return {
        event,
        rating,
        photos,
        review,
        mood,
        score,
        hasPeople: peoplePhotos.length > 0,
        peopleCount: peoplePhotos.length,
      };
    })
    .sort((a, b) => b.score - a.score)
);

const buildPremiumSlides = (trip, moments, events, tripPhotos, options = {}) => {
  const safeMoments = Array.isArray(moments) ? moments.filter(Boolean) : [];
  const memoryMoments = buildMemoryMoments(tripPhotos);
  const isSelectedPhotoMode = Boolean(options?.selectedPhotoMode);
  const targetPhotoSlideCount = 25;
  const maxFoodSlides = isSelectedPhotoMode ? 6 : 4;
  const coverPhoto = memoryMoments[0]?.photo?.url
    || safeMoments.find((moment) => moment.photos[0]?.url)?.photos[0]?.url
    || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200';
  const topMoments = safeMoments.slice(0, 14);
  const topMemoryMoments = memoryMoments.slice(0, 14);
  const scenicMoment = topMoments.find((moment) => moment.mood === 'scenic');
  const favoriteMoment = topMoments[0];
  const candidateByUrl = new Map();
  const getFoodPhotoPenalty = (moment, photoIndex = 0) => {
    if (moment?.mood !== 'food') return 0;
    return moment?.hasPeople
      ? 2 + photoIndex * 1.5
      : 8 + photoIndex * 3;
  };
  const getChronologicalSortValue = (dateValue, timeValue = '', fallbackIndex = 0) => {
    const rawDate = String(dateValue || '').trim();
    if (!rawDate) return Number.MAX_SAFE_INTEGER - 100000 + fallbackIndex;
    const rawTime = String(timeValue || '').trim();
    const normalizedDateTime = rawDate.includes('T')
      ? rawDate
      : `${rawDate}T${rawTime || '00:00:00'}`;
    const parsed = new Date(normalizedDateTime);
    if (Number.isNaN(parsed.getTime())) return Number.MAX_SAFE_INTEGER - 100000 + fallbackIndex;
    return parsed.getTime();
  };
  const pushPhotoCandidate = (slide, options = {}) => {
    const photoUrl = String(slide?.photo || '').trim();
    if (!photoUrl) return;
    const nextCandidate = {
      slide,
      score: Number(options.score || 0),
      sortValue: getChronologicalSortValue(options.date, options.time, Number(options.fallbackIndex || 0)),
      fallbackIndex: Number(options.fallbackIndex || 0),
    };
    const existing = candidateByUrl.get(photoUrl);
    if (!existing || nextCandidate.score > existing.score || (nextCandidate.score === existing.score && nextCandidate.sortValue < existing.sortValue)) {
      candidateByUrl.set(photoUrl, nextCandidate);
    }
  };

  const slides = isSelectedPhotoMode ? [] : [
    {
      type: 'title',
      title: trip?.title || 'Trip Highlights',
      subtitle: formatTripDates(trip?.startDate, trip?.endDate),
      background: coverPhoto,
    },
  ];

  if (topMemoryMoments.length > 0) {
    const leadMemory = topMemoryMoments[0];
    pushPhotoCandidate({
      type: 'photo',
      photo: leadMemory.photo.url,
      caption: leadMemory.title,
      subcopy: leadMemory.subcopy,
      eyebrow: leadMemory.eyebrow,
      location: leadMemory.meta,
      rating: 0,
      mood: leadMemory.photo?.hasPeople ? 'people' : 'reflective',
    }, {
      score: Number(leadMemory.score || 0) + 12 + getPhotoGroupPriorityBoost(leadMemory.photo),
      date: leadMemory.photo?.date,
      fallbackIndex: 0,
    });
  } else if (scenicMoment && !isSelectedPhotoMode) {
    slides.push({
      type: 'chapter',
      eyebrow: 'Opening Scene',
      title: buildChapterTitle(scenicMoment),
      subtitle: buildChapterCaption(scenicMoment),
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    });
  }

  const eventSlides = topMoments.map((moment, index) => ({ kind: 'event', moment, index }));
  const memorySlides = topMemoryMoments.map((memory, index) => ({ kind: 'memory', memory, index }));
  const mixedSlides = [];
  const maxCount = Math.max(eventSlides.length, memorySlides.length);
  for (let index = 0; index < maxCount; index += 1) {
    if (memorySlides[index]) mixedSlides.push(memorySlides[index]);
    if (eventSlides[index]) mixedSlides.push(eventSlides[index]);
  }

  mixedSlides.forEach((entry) => {
    if (entry.kind === 'memory') {
      const { memory, index } = entry;
      pushPhotoCandidate({
        type: 'photo',
        photo: memory.photo.url,
        caption: memory.title,
        subcopy: memory.subcopy,
        eyebrow: memory.eyebrow,
        location: memory.meta,
        rating: 0,
        mood: memory.photo?.hasPeople ? 'people' : (index % 2 === 0 ? 'reflective' : 'scenic'),
      }, {
        score: Number(memory.score || 0) + getPhotoGroupPriorityBoost(memory.photo),
        date: memory.photo?.date,
        fallbackIndex: index + 1,
      });
      const extraMemory = topMemoryMoments[index + 1];
      if (extraMemory) {
        pushPhotoCandidate({
          type: 'photo',
          photo: extraMemory.photo.url,
          caption: extraMemory.title,
          subcopy: extraMemory.subcopy,
          eyebrow: extraMemory.eyebrow,
          location: extraMemory.meta,
          rating: 0,
          mood: extraMemory.photo?.hasPeople ? 'people' : 'scenic',
        }, {
          score: Number(extraMemory.score || 0) - 1 + getPhotoGroupPriorityBoost(extraMemory.photo),
          date: extraMemory.photo?.date,
          fallbackIndex: index + 20,
        });
      }
      return;
    }

    const { moment, index } = entry;
    const primaryPhoto = moment.photos[0]?.url;
    const copy = buildEventCopy(moment, index);
    if (primaryPhoto) {
      pushPhotoCandidate(buildEventPhotoHighlight({
        moment,
        photo: moment.photos[0],
        photoIndex: 0,
        copy,
      }), {
        score: Number(moment.score || 0) + 6 - getFoodPhotoPenalty(moment, 0) + getPhotoGroupPriorityBoost(moment.photos[0]),
        date: moment.event?.date || moment.photos[0]?.date || moment.photos[0]?.created_at || moment.photos[0]?.createdAt,
        time: moment.event?.time,
        fallbackIndex: index + 40,
      });
      moment.photos.slice(1, 4).forEach((photo, photoIndex) => {
        pushPhotoCandidate(buildEventPhotoHighlight({
          moment,
          photo,
          photoIndex: photoIndex + 1,
          copy,
        }), {
          score: Number(moment.score || 0) - (photoIndex + 1) * 1.5 - getFoodPhotoPenalty(moment, photoIndex + 1) + getPhotoGroupPriorityBoost(photo),
          date: photo?.date || photo?.created_at || photo?.createdAt || moment.event?.date,
          time: moment.event?.time,
          fallbackIndex: index + 60 + photoIndex,
        });
      });
    } else {
      slides.push({
        type: 'spotlight',
        eyebrow: copy.eyebrow,
        title: copy.title,
        caption: moment.event?.location || '',
        subcopy: copy.subcopy,
        background: getTextTreatment({ event: moment.event }).background,
      });
    }
  });

  topMemoryMoments.forEach((memory, index) => {
    pushPhotoCandidate({
      type: 'photo',
      photo: memory.photo.url,
      caption: index % 3 === 0 ? memory.title : '',
      subcopy: memory.subcopy,
      eyebrow: index % 3 === 0 ? memory.eyebrow : '',
      location: memory.meta,
      rating: 0,
      mood: memory.photo?.hasPeople ? 'people' : 'scenic',
    }, {
      score: Number(memory.score || 0) - 2 + getPhotoGroupPriorityBoost(memory.photo),
      date: memory.photo?.date,
      fallbackIndex: index + 100,
    });
  });

  topMoments.forEach((moment, index) => {
    const copy = buildEventCopy(moment, index);
    moment.photos.forEach((photo, photoIndex) => {
      pushPhotoCandidate(buildEventPhotoHighlight({
        moment,
        photo,
        photoIndex,
        copy,
      }), {
        score: Number(moment.score || 0) - photoIndex - getFoodPhotoPenalty(moment, photoIndex) + getPhotoGroupPriorityBoost(photo),
        date: photo?.date || photo?.created_at || photo?.createdAt || moment.event?.date,
        time: moment.event?.time,
        fallbackIndex: index + 140 + photoIndex,
      });
    });
  });

  const rankedPhotoCandidates = Array.from(candidateByUrl.values())
    .sort((a, b) => b.score - a.score || a.sortValue - b.sortValue || a.fallbackIndex - b.fallbackIndex);
  const selectedEntries = [];
  const selectedPhotoUrls = new Set();
  let foodSlideCount = 0;
  const trySelectEntry = (entry, options = {}) => {
    if (!entry?.slide?.photo) return false;
    if (selectedEntries.length >= targetPhotoSlideCount) return false;
    if (selectedPhotoUrls.has(entry.slide.photo)) return false;

    const isFoodSlide = isFoodPhotoHighlight(entry.slide);
    const slideMood = String(entry.slide?.mood || '').trim().toLowerCase();
    if (options.requireVisibleStory && !hasMeaningfulPhotoStory(entry.slide)) return false;
    if (options.peopleOnly && slideMood !== 'people') return false;
    if (!options.allowUncaptionedNonPeople && slideMood !== 'people' && !getPhotoLocationCaptionMeta(entry.slide)) return false;
    if (isFoodSlide && options.requireFoodCaption && !getPhotoLocationCaptionMeta(entry.slide)) return false;
    if (isFoodSlide && foodSlideCount >= maxFoodSlides) return false;

    selectedEntries.push(entry);
    selectedPhotoUrls.add(entry.slide.photo);
    if (isFoodSlide) foodSlideCount += 1;
    return true;
  };

  rankedPhotoCandidates.forEach((entry) => {
    trySelectEntry(entry, { requireVisibleStory: true, requireFoodCaption: true, allowUncaptionedNonPeople: false });
  });

  rankedPhotoCandidates.forEach((entry) => {
    if (selectedEntries.length >= targetPhotoSlideCount) return;
    trySelectEntry(entry, { requireVisibleStory: false, requireFoodCaption: true, peopleOnly: true, allowUncaptionedNonPeople: true });
  });

  rankedPhotoCandidates.forEach((entry) => {
    if (selectedEntries.length >= targetPhotoSlideCount) return;
    if (isFoodPhotoHighlight(entry.slide)) return;
    trySelectEntry(entry, {
      requireVisibleStory: !isSelectedPhotoMode,
      requireFoodCaption: false,
      allowUncaptionedNonPeople: isSelectedPhotoMode,
    });
  });

  rankedPhotoCandidates.forEach((entry) => {
    if (selectedEntries.length >= targetPhotoSlideCount) return;
    trySelectEntry(entry, {
      requireVisibleStory: false,
      requireFoodCaption: !isSelectedPhotoMode,
      peopleOnly: !isSelectedPhotoMode,
      allowUncaptionedNonPeople: isSelectedPhotoMode,
    });
  });

  const selectedPhotoSlides = selectedEntries
    .sort((a, b) => a.sortValue - b.sortValue || b.score - a.score || a.fallbackIndex - b.fallbackIndex)
    .map((entry) => entry.slide);

  if (selectedPhotoSlides.length > 0) {
    slides.push(...selectedPhotoSlides);
  }

  if (isSelectedPhotoMode) {
    return slides;
  }

  if (favoriteMoment) {
    slides.push({
      type: 'spotlight',
      eyebrow: 'Favorite Moment',
      title: buildSpotlightTitle(favoriteMoment),
      caption: 'The one worth replaying first.',
      subcopy: favoriteMoment.review || 'A memory that still holds up after the trip is over.',
      background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
    });
  }

  const totalPhotos = Array.isArray(tripPhotos) && tripPhotos.length > 0
    ? tripPhotos.length
    : safeMoments.reduce((sum, moment) => sum + moment.photos.length, 0);
  const ratings = safeMoments.map((moment) => Number(moment.rating || 0)).filter((rating) => rating > 0);
  const avgRating = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : '4.8';
  const topRated = topMemoryMoments[0]?.title || favoriteMoment?.event?.title || 'Best memory';

  slides.push({
    type: 'stats',
    totalDays: estimateTripDays(trip, events),
    totalPhotos,
    avgRating,
    topRated,
  });

  return slides;
};

const buildMemoryMoments = (tripPhotos) => (
  (Array.isArray(tripPhotos) ? tripPhotos : [])
    .map((photo, index) => {
      if (!photo || typeof photo !== 'object') return null;
      const url = String(photo.url || photo.src || photo.photoUrl || '').trim();
      if (!url) return null;
      const normalizedPhoto = {
        ...photo,
        id: String(photo.id || `trip-photo-${index}`),
        url,
        hasPeople: Boolean(photo.hasPeople),
        date: String(photo.date || photo.created_at || photo.createdAt || '').trim(),
      };
      if (String(normalizedPhoto?.event_id || '').trim()) return null;

      let score = 0;
      if (normalizedPhoto.hasPeople) score += 30;
      if (normalizedPhoto.is_cover) score += 3;
      if (normalizedPhoto.date) score += 2;
      score += Math.max(0, 3 - index * 0.05);
      if (normalizedPhoto.peopleCount && normalizedPhoto.peopleCount > 1) score += normalizedPhoto.peopleCount * 2;
      const caption = String(normalizedPhoto.caption || '').toLowerCase();
      if (/(kid|kids|family|children|baby|daughter|son)/.test(caption)) score += 8;

      return {
        photo: normalizedPhoto,
        score,
        title: buildMemoryTitle(normalizedPhoto, index),
        subcopy: buildMemorySubcopy(normalizedPhoto, index),
        eyebrow: buildMemoryEyebrow(normalizedPhoto, index),
        meta: formatMemoryMeta(normalizedPhoto),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
);

const buildMemoryTitle = (photo, index) => {
  if (photo?.hasPeople) {
    if (index === 0) return 'Just us';
    if (index === 1) return 'The kind of photo you keep';
    return 'One of the moments that mattered most';
  }
  return '';
};

const buildMemorySubcopy = (photo, index) => {
  if (photo?.hasPeople) {
    return index === 0
      ? 'Not everything important happened at a reservation or on the itinerary.'
      : 'Some of the best parts of a trip are the photos that happen in the middle of everything else.';
  }
  return '';
};

const buildMemoryEyebrow = (photo, index) => {
  if (photo?.hasPeople) return index === 0 ? 'Family Moment' : 'Memory Moment';
  return '';
};

const formatMemoryMeta = (photo) => {
  const dateValue = String(photo?.date || '').trim();
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const buildFallbackSlides = (trip, events, tripPhotos) => {
  const albumPhotos = (Array.isArray(tripPhotos) ? tripPhotos : []).filter((photo) => String(photo?.url || '').trim());
  const firstAlbumPhoto = albumPhotos[0]?.url || '';
  const firstEventPhoto = (Array.isArray(events) ? events : [])
    .flatMap((event) => normalizeEventPhotos(event?.photos || event?.photoUrls || []))
    .find((photo) => photo?.url)?.url || '';
  const coverPhoto = firstAlbumPhoto || firstEventPhoto || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200';
  const totalPhotos = albumPhotos.length > 0
    ? albumPhotos.length
    : (Array.isArray(events) ? events : []).reduce((sum, event) => (
      sum + normalizeEventPhotos(event?.photos || event?.photoUrls || []).length
    ), 0);
  return [
    {
      type: 'title',
      title: trip?.title || 'Trip Highlights',
      subtitle: formatTripDates(trip?.startDate, trip?.endDate),
      background: coverPhoto,
    },
    {
      type: 'spotlight',
      eyebrow: 'Memory Reel',
      title: 'A few moments worth keeping',
      caption: 'The memories, not just the itinerary.',
      subcopy: 'This trip reel is using a simplified fallback so it can still open cleanly.',
      background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
    },
    {
      type: 'stats',
      totalDays: estimateTripDays(trip, events),
      totalPhotos,
      avgRating: '4.8',
      topRated: String(trip?.title || 'Best memory'),
    },
  ];
};

const buildEmergencySlides = (trip) => ([
  {
    type: 'title',
    title: trip?.name || trip?.title || 'Trip Highlights',
    subtitle: formatTripDates(trip?.startDate, trip?.endDate) || 'A memory reel for this trip',
    background: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
  },
  {
    type: 'spotlight',
    eyebrow: 'Memory Reel',
    title: 'Your highlights are ready',
    caption: 'We opened a simplified reel so the trip still shows up cleanly.',
    subcopy: 'The trip can still be shared, saved, and published even when richer slides are unavailable.',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
  },
  {
    type: 'stats',
    totalDays: 1,
    totalPhotos: 0,
    avgRating: '4.8',
    topRated: String(trip?.name || trip?.title || 'Best memory'),
  },
]);

const buildEventCopy = (moment, index) => {
  const eventTitle = String(moment?.event?.title || 'A standout stop').trim();
  if (moment.mood === 'food') {
    return {
      eyebrow: index === 0 ? 'Best Of The Trip' : 'Worth Ordering Again',
      title: eventTitle,
      subcopy: moment.review || 'One of those meals that becomes part of the trip story.',
    };
  }
  if (moment.mood === 'nightlife') {
    return {
      eyebrow: 'After Dark',
      title: eventTitle,
      subcopy: moment.review || 'The night that kept the trip going a little longer.',
    };
  }
  if (moment.mood === 'reflective') {
    return {
      eyebrow: 'Quiet Favorite',
      title: eventTitle,
      subcopy: moment.review || 'A slower moment that still made the reel.',
    };
  }
  return {
    eyebrow: index === 0 ? 'Core Memory' : 'Postcard Moment',
    title: eventTitle,
    subcopy: moment.review || 'A frame that deserved its own spot in the recap.',
  };
};

const buildChapterTitle = (moment) => {
  if (moment.mood === 'nightlife') return 'When the city woke up';
  if (moment.mood === 'food') return 'The stops we kept talking about';
  if (moment.mood === 'reflective') return 'The quieter side of the trip';
  return 'The views that set the tone';
};

const buildChapterCaption = (moment) => (
  moment?.event?.location
    ? `Centered around ${moment.event.location}.`
    : 'The scenes that made the trip feel bigger than the itinerary.'
);

const buildSpotlightTitle = (moment) => String(moment?.event?.title || 'Favorite Moment').trim();

const buildSpotlightCaption = (moment) => {
  if (moment.mood === 'food') return 'The reservation we would make again immediately.';
  if (moment.mood === 'nightlife') return 'The night that earned a replay.';
  if (moment.mood === 'reflective') return 'A slower moment that still stole the spotlight.';
  return 'One of the moments that defined the whole trip.';
};

const estimateTripDays = (trip, events) => {
  const start = new Date(trip?.startDate);
  const end = new Date(trip?.endDate);
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  }
  const uniqueDates = new Set(
    (Array.isArray(events) ? events : [])
      .map((event) => String(event?.date || '').trim())
      .filter(Boolean)
  );
  return Math.max(1, uniqueDates.size || 1);
};

const getEffectiveRating = (event, groupRatingsByEventId, currentUserId) => {
  const localRating = Number(event?.rating || 0);
  if (localRating > 0) return localRating;
  const groupRatings = groupRatingsByEventId[String(event?.id || '')] || [];
  const userRating = groupRatings.find((rating) => String(rating?.userId || '') === String(currentUserId || ''));
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
  const scores = { scenic: 0, nightlife: 0, food: 0, reflective: 0, hotel: 0 };
  (Array.isArray(events) ? events : []).forEach((event) => {
    const title = String(event?.title || '').toLowerCase();
    const location = String(event?.location || '').toLowerCase();
    const review = String(event?.review || '').toLowerCase();
    const tags = Array.isArray(event?.tags) ? event.tags.map((tag) => String(tag || '').toLowerCase()) : [];
    const haystack = [title, location, review, tags.join(' ')].join(' ');
    const rating = getEffectiveRating(event, groupRatingsByEventId, currentUserId);
    if (/(sunset|sunrise|view|beach|coast|mountain|lake|hike|museum|landmark|scenic)/.test(haystack)) scores.scenic += 2 + rating * 0.2;
    if (/(bar|club|cocktail|night|dance|party|dj|late)/.test(haystack)) scores.nightlife += 2 + rating * 0.2;
    if (FOOD_HIGHLIGHT_PATTERN.test(haystack)) scores.food += 2 + rating * 0.2;
    if (HOTEL_HIGHLIGHT_PATTERN.test(haystack)) scores.hotel += 2 + rating * 0.2;
    if (/(spa|quiet|journal|walk|park|morning|reflect|temple|cathedral)/.test(haystack)) scores.reflective += 2 + rating * 0.2;
  });
  const topVibe = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'scenic';
  return HIGHLIGHT_REEL_TRACKS.find((track) => track.vibe === topVibe)?.id || HIGHLIGHT_REEL_TRACKS[0].id;
};

const formatTripDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-US', options);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
};

const inferVisualMood = (event) => {
  const haystack = [
    String(event?.title || ''),
    String(event?.location || ''),
    String(event?.review || ''),
    ...(Array.isArray(event?.tags) ? event.tags : []),
  ].join(' ').toLowerCase();
  if (/(bar|club|cocktail|night|dance|party|dj|late)/.test(haystack)) return 'nightlife';
  if (FOOD_HIGHLIGHT_PATTERN.test(haystack)) return 'food';
  if (HOTEL_HIGHLIGHT_PATTERN.test(haystack)) return 'hotel';
  if (/(spa|quiet|journal|walk|park|morning|reflect|temple|cathedral)/.test(haystack)) return 'reflective';
  return 'scenic';
};

const getTextTreatment = ({ event }) => {
  const mood = inferVisualMood(event);
  if (mood === 'nightlife') return { background: 'linear-gradient(135deg, #581c87 0%, #0f172a 100%)' };
  if (mood === 'food') return { background: 'linear-gradient(135deg, #f97316 0%, #be185d 100%)' };
  if (mood === 'hotel') return { background: 'linear-gradient(135deg, #0f766e 0%, #1e3a8a 100%)' };
  if (mood === 'reflective') return { background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' };
  return { background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' };
};

export { PHOTO_TREATMENTS, HIGHLIGHT_REEL_TRACKS };
