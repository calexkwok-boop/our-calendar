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
  people: {
    filter: 'saturate(1.06) contrast(1.00) brightness(1.01)',
    vignette: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.08) 100%)',
    kenBurns: 'zoom-in-slow',
  },
});

export default function TripHighlightReel({
  trip,
  tripPhotos = [],
  events = [],
  groupRatingsByEventId = {},
  currentUserId,
  onClose,
  onShare,
  onPublish,
  onSave,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
    // Your existing buildScoredMoments, buildPremiumSlides, etc. logic here
    // For now, using placeholder
    return buildHighlightSlides(trip, tripPhotos, events, groupRatingsByEventId, currentUserId);
  }, [trip, tripPhotos, events, groupRatingsByEventId, currentUserId]);

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

  // Smooth cross-dissolve transition
  const advanceSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setNextSlide(currentSlide + 1);
    
    setTimeout(() => {
      setCurrentSlide(currentSlide + 1);
      setNextSlide(null);
      setIsTransitioning(false);
    }, 600); // Cross-dissolve duration
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
      setIsTransitioning(true);
      setNextSlide(currentSlide - 1);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setNextSlide(null);
        setIsTransitioning(false);
      }, 600);
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
      <div className="absolute top-0 left-0 right-0 z-30 px-6 pb-6 pt-8 bg-gradient-to-b from-black/70 via-black/40 to-transparent backdrop-blur-sm"
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

      {/* MAIN SLIDE AREA - Cross-dissolve transitions */}
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

        {/* Current Slide */}
        <div className={`absolute inset-0 transition-opacity duration-600 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <SlideRenderer highlight={currentHighlight} />
        </div>

        {/* Next Slide (for cross-dissolve) */}
        {nextSlide !== null && (
          <div className="absolute inset-0 opacity-0 animate-fade-in">
            <SlideRenderer highlight={safeHighlights[nextSlide]} />
          </div>
        )}
      </div>

      {/* PREMIUM PROGRESS BAR - Subtle line */}
      <div className="absolute bottom-28 left-0 right-0 px-12">
        <div className="h-0.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-white shadow-sm shadow-white/50 transition-all duration-300 ease-out"
            style={{ width: `${((currentSlide + 1) / Math.max(1, safeHighlights.length)) * 100}%` }}
          />
        </div>
      </div>

      {/* PREMIUM PLAYBACK CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-6 bg-gradient-to-t from-black/70 via-black/40 to-transparent backdrop-blur-sm"
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
        <div className="mt-6 text-center">
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
          animation: fade-in 600ms ease-out forwards;
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
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      {/* Photo with Ken Burns effect */}
      <div className="absolute inset-0">
        <div 
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${highlight.photo})`,
            filter: treatment.filter,
            animation: `${treatment.kenBurns} 20s ease-out forwards`,
          }}
        />
        {/* Professional vignette */}
        <div 
          className="absolute inset-0"
          style={{ background: treatment.vignette }}
        />
        {/* Bottom gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
      </div>

      {/* Caption - Editorial typography */}
      <div className="absolute bottom-0 left-0 right-0 px-12 pb-40 text-white">
        {highlight.rating && (
          <div className="mb-3 flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-2.5 w-2.5 rounded-full ${i < highlight.rating ? 'bg-white shadow-sm shadow-white/50' : 'bg-white/30'}`} />
            ))}
          </div>
        )}
        <h2 className="mb-3 text-4xl font-bold leading-tight tracking-tight drop-shadow-2xl sm:text-5xl" 
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
          {highlight.caption}
        </h2>
        {highlight.location && (
          <p className="flex items-center gap-2 text-lg font-medium text-white/90">
            <span className="text-xl">📍</span>
            <span>{highlight.location}</span>
          </p>
        )}
      </div>
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

// ============================================================================
// PLACEHOLDER BUILDERS (Replace with your actual logic)
// ============================================================================

function buildHighlightSlides(trip, tripPhotos, events, groupRatingsByEventId, currentUserId) {
  // Your existing buildScoredMoments and buildPremiumSlides logic here
  return [];
}

function buildEmergencySlides(trip) {
  return [
    {
      type: 'title',
      title: trip?.title || 'Trip Highlights',
      subtitle: 'A memory reel',
      background: '',
    },
  ];
}

export { PHOTO_TREATMENTS, HIGHLIGHT_REEL_TRACKS };
