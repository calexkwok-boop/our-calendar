import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Music, Play, Share2, Sparkles, X } from 'lucide-react';

/**
 * TRIP HIGHLIGHT REEL - PERSONAL-FIRST ALGORITHM
 * 
 * This component creates Apple Photos-style highlight reels that prioritize
 * PERSONAL MOMENTS over perfect ratings and tourist attractions.
 * 
 * Scoring Philosophy:
 * 1. People photos (family, friends, kids) = 20-30 pts each (HIGHEST)
 * 2. Candid/spontaneous moments = 15 pts
 * 3. Group experiences = 10 pts  
 * 4. Multiple photos = shows emotional investment
 * 5. Ratings = MINIMAL weight (max 8 pts, only if 4+ stars)
 * 
 * Penalties:
 * - Tourist sites without people: -12 pts
 * - Generic restaurants without people or high ratings: -6 pts
 * 
 * How to maximize your highlight reel:
 * - Tag photos with: 'candid', 'spontaneous', 'funny', 'kids', 'sweet'
 * - Add people to photos (set hasPeople: true in photo metadata)
 * - Upload in-between moments to trip album (not just event photos)
 * - Take voice notes for emotional moments
 * 
 * The algorithm now values:
 * ✅ Group photo at hotel pool > Eiffel Tower alone
 * ✅ Kids eating ice cream > 5-star restaurant without people
 * ✅ Random street selfie > Museum visit without faces
 */

const HIGHLIGHT_REEL_TRACKS = Object.freeze([
  { id: 'cinematic-sunrise', label: 'Cinematic', vibe: 'scenic', file: '/music/highlight-cinematic.mp3' },
  { id: 'city-lights', label: 'Upbeat', vibe: 'nightlife', file: '/music/highlight-upbeat.mp3' },
  { id: 'golden-hour', label: 'Chill', vibe: 'food', file: '/music/highlight-chill.mp3' },
  { id: 'soft-postcard', label: 'Reflective', vibe: 'reflective', file: '/music/highlight-reflective.mp3' },
]);

const PHOTO_TREATMENTS = Object.freeze({
  scenic: {
    layout: 'full',
    shellClassName: 'p-0',
    imageClassName: 'w-full h-full object-cover animate-ken-burns',
    imageStyle: { filter: 'saturate(1.08) contrast(1.06) brightness(0.96)' },
    overlayClassName: 'absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.12)_45%,rgba(15,23,42,0.52)_100%)]',
  },
  food: {
    layout: 'postcard',
    shellClassName: 'px-6 py-10 sm:px-10',
    imageClassName: 'h-full w-full rounded-[2rem] object-cover shadow-[0_30px_80px_rgba(0,0,0,0.28)]',
    imageStyle: { filter: 'sepia(0.08) saturate(1.14) contrast(1.02) brightness(1.02)' },
    overlayClassName: 'absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.20),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.18)_45%,rgba(15,23,42,0.46)_100%)]',
  },
  nightlife: {
    layout: 'editorial',
    shellClassName: 'px-5 py-8 sm:px-8',
    imageClassName: 'h-full w-full rounded-[2.25rem] object-cover shadow-[0_26px_80px_rgba(15,23,42,0.42)]',
    imageStyle: { filter: 'contrast(1.12) saturate(1.18) brightness(0.9) hue-rotate(-6deg)' },
    overlayClassName: 'absolute inset-0 bg-[linear-gradient(135deg,rgba(88,28,135,0.18),rgba(15,23,42,0.58))]',
  },
  reflective: {
    layout: 'polaroid',
    shellClassName: 'px-6 py-10 sm:px-10',
    imageClassName: 'h-full w-full rounded-[1.75rem] object-cover shadow-[0_24px_60px_rgba(0,0,0,0.24)]',
    imageStyle: { filter: 'contrast(0.96) saturate(0.92) brightness(1.03)' },
    overlayClassName: 'absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.42))]',
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
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(HIGHLIGHT_REEL_TRACKS[0].id);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const shareMenuRef = useRef(null);
  const musicMenuRef = useRef(null);

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, safeHighlights.length - 1));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const highlights = useMemo(() => {
    try {
      const normalizedMoments = buildScoredMoments(events, groupRatingsByEventId, currentUserId);
      const slides = buildPremiumSlides(trip, normalizedMoments, events, tripPhotos);
      const fallbackSlides = buildFallbackSlides(trip, events, tripPhotos);
      return Array.isArray(slides) && slides.length > 0
        ? slides
        : (Array.isArray(fallbackSlides) && fallbackSlides.length > 0 ? fallbackSlides : buildEmergencySlides(trip));
    } catch (error) {
      console.error('Trip highlight reel generation failed:', error);
      try {
        const fallbackSlides = buildFallbackSlides(trip, events, tripPhotos);
        return Array.isArray(fallbackSlides) && fallbackSlides.length > 0
          ? fallbackSlides
          : buildEmergencySlides(trip);
      } catch (fallbackError) {
        console.error('Trip highlight fallback generation failed:', fallbackError);
        return buildEmergencySlides(trip);
      }
    }
  }, [events, groupRatingsByEventId, currentUserId, trip, tripPhotos]);

  const safeHighlights = useMemo(() => (
    Array.isArray(highlights) && highlights.length > 0 ? highlights : buildEmergencySlides(trip)
  ), [highlights, trip]);

  useEffect(() => {
    if (safeHighlights.length <= 1) {
      setIsPlaying(false);
      setCurrentSlide(0);
      return;
    }
    setCurrentSlide((prev) => Math.min(prev, safeHighlights.length - 1));
  }, [safeHighlights.length]);

  useEffect(() => {
    const nextTrackId = pickDefaultTrackId(events, groupRatingsByEventId, currentUserId);
    setSelectedTrackId(nextTrackId);
    setAudioAvailable(true);
  }, [events, groupRatingsByEventId, currentUserId]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev >= safeHighlights.length - 1) {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
            return safeHighlights.length - 1;
          }
          return prev + 1;
        });
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, safeHighlights.length]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.load();
    if (isPlaying && musicEnabled && audioAvailable) {
      audioRef.current.play().catch(() => {});
    }
  }, [selectedTrackId, isPlaying, musicEnabled, audioAvailable]);

  useEffect(() => {
    if (!showShareMenu) return undefined;
    const handleClickOutside = (event) => {
      if (!shareMenuRef.current?.contains(event.target)) setShowShareMenu(false);
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
      if (!musicMenuRef.current?.contains(event.target)) setShowMusicMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMusicMenu]);

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

  const handleDownload = () => {
    setShowShareMenu(false);
    setShowMusicMenu(false);
    if (onSave) onSave(safeHighlights);
  };

  const handleShare = () => {
    setShowShareMenu(false);
    setShowMusicMenu(false);
    if (onShare) onShare(safeHighlights);
  };

  const handlePublish = () => {
    setShowShareMenu(false);
    setShowMusicMenu(false);
    if (onPublish) onPublish(safeHighlights);
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

  const currentHighlight = safeHighlights[Math.max(0, Math.min(currentSlide, safeHighlights.length - 1))] || safeHighlights[0];
  const selectedTrack = HIGHLIGHT_REEL_TRACKS.find((track) => track.id === selectedTrackId) || HIGHLIGHT_REEL_TRACKS[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <audio ref={audioRef} loop onError={() => setAudioAvailable(false)}>
        <source src={selectedTrack.file} type="audio/mpeg" />
      </audio>

      <div
        className="absolute top-0 left-0 right-0 z-10 px-4 pb-4 pt-6 bg-gradient-to-b from-black/60 to-transparent"
        style={{ paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top) + 1rem))' }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleToggleMusicEnabled}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
            >
              <Music className={`h-5 w-5 ${musicEnabled ? '' : 'opacity-50'}`} />
            </button>

            <div className="relative" ref={musicMenuRef}>
              <button
                onClick={() => setShowMusicMenu((prev) => !prev)}
                className="flex h-10 min-w-[5.5rem] items-center justify-center rounded-full bg-white/20 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md transition-colors hover:bg-white/30"
              >
                {selectedTrack.label}
              </button>
              {showMusicMenu ? (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/15 bg-black/75 shadow-2xl backdrop-blur-xl">
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
            >
              <Download className="h-5 w-5" />
            </button>

            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
              >
                <Share2 className="h-5 w-5" />
              </button>
              {showShareMenu ? (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/15 bg-black/75 shadow-2xl backdrop-blur-xl">
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

      <div className="relative flex-1 overflow-hidden">
        <button
          type="button"
          aria-label="Previous highlight"
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="absolute inset-y-0 left-0 z-20 w-1/4 bg-transparent disabled:pointer-events-none"
        />
        <button
          type="button"
          aria-label="Next highlight"
          onClick={handleNext}
          disabled={currentSlide >= safeHighlights.length - 1}
          className="absolute inset-y-0 right-0 z-20 w-1/4 bg-transparent disabled:pointer-events-none"
        />
        {currentHighlight.type === 'title' && <TitleSlide highlight={currentHighlight} />}
        {currentHighlight.type === 'chapter' && <ChapterSlide highlight={currentHighlight} />}
        {currentHighlight.type === 'photo' && <PhotoHighlightSlide highlight={currentHighlight} />}
        {currentHighlight.type === 'text' && <TextHighlightSlide highlight={currentHighlight} />}
        {currentHighlight.type === 'spotlight' && <SpotlightSlide highlight={currentHighlight} />}
        {currentHighlight.type === 'stats' && <StatsHighlightSlide highlight={currentHighlight} />}
      </div>

      <div className="absolute bottom-20 left-0 right-0 px-8">
        <div className="h-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / Math.max(1, safeHighlights.length)) * 100}%` }}
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        {!isPlaying ? (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30 disabled:opacity-30"
            >
              {'<'}
            </button>
            <button
              onClick={handlePlayPause}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-purple-600 shadow-lg transition-colors hover:bg-gray-100"
            >
              <Play className="ml-1 h-8 w-8" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentSlide === safeHighlights.length - 1}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30 disabled:opacity-30"
            >
              {'>'}
            </button>
          </div>
        ) : null}

        <div className="mt-3 text-center text-sm text-white/75">
          {Math.max(1, Math.min(currentSlide + 1, safeHighlights.length))} / {safeHighlights.length}
        </div>
      </div>
    </div>
  );
}

function TitleSlide({ highlight }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-sm"
        style={{ backgroundImage: `url(${highlight.background})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.36))]" />
      <div className="relative z-10 px-8 text-center text-white">
        <div className="mb-4 text-6xl animate-pulse">+</div>
        <h1 className="mb-3 text-5xl font-bold animate-fade-in">{highlight.title}</h1>
        <p className="text-2xl opacity-90 animate-fade-in-delay">{highlight.subtitle}</p>
      </div>
    </div>
  );
}

function ChapterSlide({ highlight }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6 py-12"
      style={{ background: highlight.background || 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.42))]" />
      <div className="relative z-10 mx-auto max-w-2xl text-center text-white">
        {highlight.eyebrow ? (
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            {highlight.eyebrow}
          </div>
        ) : null}
        <h2 className="text-5xl font-bold leading-none sm:text-6xl">{highlight.title}</h2>
        {highlight.subtitle ? (
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/84 sm:text-xl">{highlight.subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function PhotoHighlightSlide({ highlight }) {
  const treatment = highlight?.treatment || PHOTO_TREATMENTS.scenic;
  const frameClassName = getPhotoFrameClassName(treatment.layout);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
        style={{ backgroundImage: `url(${highlight.photo})`, filter: 'saturate(1.12) brightness(0.96) contrast(1.02)' }}
      />
      <div className={treatment.overlayClassName} />
      <div className={`relative z-10 flex h-full w-full items-center justify-center ${treatment.shellClassName}`}>
        <div className={frameClassName}>
          <img
            src={highlight.photo}
            alt={highlight.caption}
            className={treatment.imageClassName}
            style={treatment.imageStyle}
          />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 px-7 pb-10 pt-20 text-white">
        <div className="mx-auto max-w-xl">
          {highlight.eyebrow ? (
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
              {highlight.eyebrow}
            </div>
          ) : null}
          {Number(highlight.rating || 0) > 0 ? (
            <div className="mb-3 flex items-center justify-end gap-3">
              <RatingStars rating={highlight.rating} sizeClassName="text-xl" />
            </div>
          ) : null}
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{highlight.caption}</h2>
          {highlight.subcopy ? (
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/82 sm:text-base">{highlight.subcopy}</p>
          ) : null}
          {highlight.location ? (
            <p className="mt-2 text-base text-white/85 sm:text-lg">{highlight.location}</p>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(15,23,42,0.08)_100%)]" />
    </div>
  );
}

function TextHighlightSlide({ highlight }) {
  const treatment = highlight?.treatment || getTextTreatment({});
  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6 py-12"
      style={{ background: treatment.background }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.38))]" />
      <div className="relative z-10 mx-auto max-w-2xl rounded-[2rem] border border-white/15 bg-white/10 px-8 py-10 text-center text-white backdrop-blur-md">
        {highlight.eyebrow ? (
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
            {highlight.eyebrow}
          </div>
        ) : null}
        {Number(highlight.rating || 0) > 0 ? (
          <RatingStars rating={highlight.rating} justifyClassName="justify-center" sizeClassName="text-2xl" />
        ) : null}
        <h2 className={`${Number(highlight.rating || 0) > 0 ? 'mt-5' : ''} text-4xl font-bold leading-tight`}>{highlight.title}</h2>
        {highlight.subcopy ? (
          <p className="mt-4 text-base leading-relaxed text-white/82 sm:text-lg">{highlight.subcopy}</p>
        ) : null}
        {highlight.location ? (
          <p className="mt-4 text-xl text-white/88">{highlight.location}</p>
        ) : null}
        {highlight.review ? (
          <p className="mt-5 line-clamp-4 text-lg italic text-white/88">"{highlight.review}"</p>
        ) : null}
      </div>
    </div>
  );
}

function SpotlightSlide({ highlight }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6 py-12"
      style={{ background: highlight.background || 'linear-gradient(135deg, #be185d 0%, #7c2d12 100%)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0.36))]" />
      <div className="relative z-10 mx-auto max-w-2xl rounded-[2.5rem] border border-white/15 bg-white/10 px-8 py-10 text-center text-white shadow-[0_24px_70px_rgba(15,23,42,0.26)] backdrop-blur-md">
        {highlight.eyebrow ? (
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            {highlight.eyebrow}
          </div>
        ) : null}
        <h2 className="text-4xl font-bold leading-tight sm:text-5xl">{highlight.title}</h2>
        {highlight.caption ? (
          <p className="mt-4 text-lg text-white/88 sm:text-xl">{highlight.caption}</p>
        ) : null}
        {highlight.subcopy ? (
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/78 sm:text-base">
            {highlight.subcopy}
          </p>
        ) : null}
        {highlight.location ? (
          <p className="mt-5 text-sm uppercase tracking-[0.18em] text-white/62">{highlight.location}</p>
        ) : null}
      </div>
    </div>
  );
}

function StatsHighlightSlide({ highlight }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-fuchsia-900 px-8">
      <div className="text-center text-white">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/65">Wrapped</div>
        <h2 className="mb-3 text-4xl font-bold sm:text-5xl">Worth replaying.</h2>
        <p className="mx-auto mb-8 max-w-xl text-base text-white/78 sm:text-lg">
          A few of the moments that made this one memorable.
        </p>
        <div className="grid max-w-lg grid-cols-2 gap-6">
          <StatBubble icon="Days Away" value={highlight.totalDays} label="Days Away" />
          <StatBubble icon="Photos" value={highlight.totalPhotos} label="Photos" />
          <StatBubble icon="Rating" value={highlight.avgRating} label="Avg Rating" />
          <StatBubble icon="Top" value={highlight.topRated} label="Top Moment" small />
        </div>
      </div>
    </div>
  );
}

function StatBubble({ icon, value, label, small = false }) {
  return (
    <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-md">
      <div className="mb-2 text-sm uppercase tracking-[0.18em] text-white/70">{icon}</div>
      <div className={`mb-1 font-bold ${small ? 'truncate text-sm' : 'text-3xl'}`}>{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
}

function RatingStars({ rating, justifyClassName = 'justify-start', sizeClassName = 'text-2xl' }) {
  return (
    <div className={`flex items-center gap-1 ${justifyClassName}`}>
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          className={`${sizeClassName} ${index < rating ? 'opacity-100' : 'opacity-30'}`}
        >
          *
        </span>
      ))}
    </div>
  );
}

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
      
      // PERSONAL-FIRST SCORING
      let score = 0;
      
      // 1. PEOPLE PHOTOS = TOP PRIORITY (20 pts each)
      const peoplePhotos = photos.filter((photo) => photo.hasPeople);
      score += peoplePhotos.length * 20;
      
      // 2. PHOTO QUANTITY (more photos = more memorable, up to 12 pts)
      score += Math.min(photos.length, 8) * 1.5;
      
      // 3. CANDID/SPONTANEOUS TAGS (15 pts)
      const candidTags = ['candid', 'spontaneous', 'funny', 'sweet', 'unexpected', 'kids'];
      if (tags.some((tag) => candidTags.includes(tag))) score += 15;
      
      // 4. SHARED EXPERIENCE (10 pts for group events)
      const groupRatings = groupRatingsByEventId[String(event?.id || '')] || [];
      if (groupRatings.length > 1) score += 10;
      
      // 5. VOICE NOTES (8 pts) - shows emotional investment
      if (event?.voiceNotes && Array.isArray(event.voiceNotes) && event.voiceNotes.length > 0) score += 8;
      
      // 6. RATING - NOW MINIMAL (max 8 pts, only if 4+ stars)
      if (rating >= 4) score += rating * 1.6;
      
      // 7. GOLDEN HOUR / LIGHTING (6 pts)
      const hour = event?.time ? parseInt(String(event.time || '').split(':')[0], 10) : 12;
      if (hour >= 6 && hour < 10) score += 3; // Morning
      if (hour >= 17 && hour < 20) score += 6; // Golden hour
      
      // 8. PERSONAL NOTES (4 pts)
      if (review.length > 50) score += 4;
      
      // 9. SCENIC/EMOTIONAL KEYWORDS (reduced to 3 pts)
      if (/(sunset|sunrise|beach|favorite|best|beautiful)/.test(haystack)) score += 3;
      
      // PENALTIES: Reduce touristy events without people
      const isTouristy = /(museum|monument|landmark|cathedral|palace|tower|statue|attraction)/.test(haystack);
      if (isTouristy && peoplePhotos.length === 0) score -= 12;
      
      // PENALTY: Generic food/restaurant without people or high rating
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
        peopleCount: peoplePhotos.length
      };
    })
    .sort((a, b) => b.score - a.score)
);

const buildPremiumSlides = (trip, moments, events, tripPhotos) => {
  const safeMoments = Array.isArray(moments) ? moments.filter(Boolean) : [];
  const memoryMoments = buildMemoryMoments(tripPhotos);
  const coverPhoto = memoryMoments[0]?.photo?.url
    || safeMoments.find((moment) => moment.photos[0]?.url)?.photos[0]?.url
    || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200';
  const topMoments = safeMoments.slice(0, 6);
  const topMemoryMoments = memoryMoments.slice(0, 4);
  const scenicMoment = topMoments.find((moment) => moment.mood === 'scenic');
  const foodMoment = topMoments.find((moment) => moment.mood === 'food');
  const nightlifeMoment = topMoments.find((moment) => moment.mood === 'nightlife');
  const favoriteMoment = topMoments[0];

  const slides = [
    {
      type: 'title',
      title: trip?.title || 'Trip Highlights',
      subtitle: formatTripDates(trip?.startDate, trip?.endDate),
      background: coverPhoto,
    },
  ];

  if (topMemoryMoments.length > 0) {
    slides.push({
      type: 'chapter',
      eyebrow: 'The Real Story',
      title: 'The moments between the plans',
      subtitle: 'The photos that mattered even when nothing was on the itinerary.',
      background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    });
  } else if (scenicMoment) {
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
      slides.push({
        type: 'photo',
        photo: memory.photo.url,
        caption: memory.title,
        subcopy: memory.subcopy,
        eyebrow: memory.eyebrow,
        location: memory.meta,
        rating: 0,
        treatment: getMemoryPhotoTreatment(index),
      });
      if (index === 1 && topMemoryMoments.length >= 3) {
        slides.push({
          type: 'spotlight',
          eyebrow: 'Little Moments',
          title: 'Some of the best parts were never scheduled',
          caption: 'The reel should remember the in-between moments too.',
          subcopy: 'Family photos, candid stops, and the quiet parts of the trip deserve as much space as the itinerary.',
          background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
        });
      }
      return;
    }

    const { moment, index } = entry;
    const primaryPhoto = moment.photos[0]?.url;
    const copy = buildEventCopy(moment, index);
    if (primaryPhoto) {
      slides.push({
        type: 'photo',
        photo: primaryPhoto,
        caption: copy.title,
        subcopy: copy.subcopy,
        eyebrow: copy.eyebrow,
        location: moment.event?.location || '',
        rating: moment.rating,
        treatment: getPhotoTreatment({ event: moment.event, rating: moment.rating, photoIndex: index }),
      });
    } else {
      slides.push({
        type: 'text',
        title: copy.title,
        subcopy: copy.subcopy,
        eyebrow: copy.eyebrow,
        location: moment.event?.location || '',
        review: moment.review,
        rating: moment.rating,
        treatment: getTextTreatment({ event: moment.event }),
      });
    }

    if (index === 1 && foodMoment) {
      slides.push({
        type: 'spotlight',
        eyebrow: 'Best Meal',
        title: buildSpotlightTitle(foodMoment),
        caption: buildSpotlightCaption(foodMoment),
        subcopy: foodMoment.review || 'The kind of stop you plan the next trip around.',
        location: foodMoment.event?.location || '',
        background: 'linear-gradient(135deg, #f97316 0%, #be185d 100%)',
      });
    }

    if (index === 3 && nightlifeMoment) {
      slides.push({
        type: 'chapter',
        eyebrow: 'After Hours',
        title: buildChapterTitle(nightlifeMoment),
        subtitle: buildChapterCaption(nightlifeMoment),
        background: 'linear-gradient(135deg, #581c87 0%, #0f172a 100%)',
      });
    }
  });

  if (topMemoryMoments[0]) {
    slides.push({
      type: 'spotlight',
      eyebrow: 'Favorite Photo',
      title: topMemoryMoments[0].title,
      caption: 'The kind of memory you keep coming back to.',
      subcopy: topMemoryMoments[0].subcopy,
      location: topMemoryMoments[0].meta,
      background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
    });
  } else if (favoriteMoment) {
    slides.push({
      type: 'spotlight',
      eyebrow: 'Favorite Moment',
      title: buildSpotlightTitle(favoriteMoment),
      caption: 'The one worth replaying first.',
      subcopy: favoriteMoment.review || 'A memory that still holds up after the trip is over.',
      location: favoriteMoment.event?.location || '',
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
  normalizeTripAlbumPhotos(tripPhotos)
    .filter((photo) => !String(photo?.event_id || '').trim())
    .map((photo, index) => {
      // PEOPLE-FIRST SCORING FOR ALBUM PHOTOS
      let score = 0;
      
      // People photos get MASSIVE boost (30 pts vs 5 before)
      if (photo?.hasPeople) score += 30;
      
      // Cover photo bonus (still 3 pts)
      if (photo?.is_cover) score += 3;
      
      // Has timestamp/date (shows it was deliberately captured)
      if (photo?.date) score += 2;
      
      // Recency bonus (newer photos slightly preferred, but minimal)
      score += Math.max(0, 3 - index * 0.05);
      
      // BONUS: Multiple people indicators (if your photo metadata has it)
      if (photo?.peopleCount && photo.peopleCount > 1) score += photo.peopleCount * 2;
      
      // BONUS: Kids/family tags
      const caption = String(photo?.caption || '').toLowerCase();
      if (/(kid|kids|family|children|baby|daughter|son)/.test(caption)) score += 8;
      
      return {
        photo,
        score,
        title: buildMemoryTitle(photo, index),
        subcopy: buildMemorySubcopy(photo, index),
        eyebrow: buildMemoryEyebrow(photo, index),
        meta: formatMemoryMeta(photo),
      };
    })
    .sort((a, b) => b.score - a.score)
);

const buildMemoryTitle = (photo, index) => {
  if (photo?.hasPeople) {
    if (index === 0) return 'Just us';
    if (index === 1) return 'The kind of photo you keep';
    return 'One of the moments that mattered most';
  }
  if (photo?.date) return 'A favorite from the in-between';
  return 'A memory worth keeping in the reel';
};

const buildMemorySubcopy = (photo, index) => {
  if (photo?.hasPeople) {
    return index === 0
      ? 'Not everything important happened at a reservation or on the itinerary.'
      : 'Some of the best parts of a trip are the photos that happen in the middle of everything else.';
  }
  return 'The reel should hold onto the quiet, unscheduled parts too.';
};

const buildMemoryEyebrow = (photo, index) => {
  if (photo?.hasPeople) return index === 0 ? 'Family Moment' : 'Memory Moment';
  return 'In Between';
};

const formatMemoryMeta = (photo) => {
  const dateValue = String(photo?.date || '').trim();
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getMemoryPhotoTreatment = (index = 0) => {
  const variants = [PHOTO_TREATMENTS.reflective, PHOTO_TREATMENTS.scenic, PHOTO_TREATMENTS.food];
  return variants[index % variants.length] || PHOTO_TREATMENTS.reflective;
};

const normalizeTripAlbumPhotos = (photos) => (
  (Array.isArray(photos) ? photos : [])
    .map((photo, index) => {
      if (!photo || typeof photo !== 'object') return null;
      const url = String(photo.url || photo.src || photo.photoUrl || '').trim();
      if (!url) return null;
      return {
        ...photo,
        id: String(photo.id || `trip-photo-${index}`),
        url,
        hasPeople: Boolean(photo.hasPeople),
        date: String(photo.date || photo.created_at || photo.createdAt || '').trim(),
      };
    })
    .filter(Boolean)
);

const buildFallbackSlides = (trip, events, tripPhotos) => {
  const albumPhotos = normalizeTripAlbumPhotos(tripPhotos);
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
  const scores = { scenic: 0, nightlife: 0, food: 0, reflective: 0 };
  (Array.isArray(events) ? events : []).forEach((event) => {
    const title = String(event?.title || '').toLowerCase();
    const location = String(event?.location || '').toLowerCase();
    const review = String(event?.review || '').toLowerCase();
    const tags = Array.isArray(event?.tags) ? event.tags.map((tag) => String(tag || '').toLowerCase()) : [];
    const haystack = [title, location, review, tags.join(' ')].join(' ');
    const rating = getEffectiveRating(event, groupRatingsByEventId, currentUserId);
    if (/(sunset|sunrise|view|beach|coast|mountain|lake|hike|museum|landmark|scenic)/.test(haystack)) scores.scenic += 2 + rating * 0.2;
    if (/(bar|club|cocktail|night|dance|party|dj|late)/.test(haystack)) scores.nightlife += 2 + rating * 0.2;
    if (/(food|restaurant|breakfast|brunch|lunch|dinner|coffee|cafe|dessert|bakery)/.test(haystack)) scores.food += 2 + rating * 0.2;
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
  if (/(food|restaurant|breakfast|brunch|lunch|dinner|coffee|cafe|dessert|bakery)/.test(haystack)) return 'food';
  if (/(spa|quiet|journal|walk|park|morning|reflect|temple|cathedral)/.test(haystack)) return 'reflective';
  return 'scenic';
};

const getPhotoTreatment = ({ event, rating, photoIndex = 0 }) => {
  const mood = inferVisualMood(event);
  const base = PHOTO_TREATMENTS[mood] || PHOTO_TREATMENTS.scenic;
  if (base.layout === 'full' && photoIndex % 2 === 1) {
    return {
      ...base,
      layout: 'editorial',
      shellClassName: 'px-5 py-8 sm:px-8',
    };
  }
  if (mood === 'food' && rating >= 4.5) {
    return {
      ...base,
      imageStyle: { ...base.imageStyle, filter: 'sepia(0.1) saturate(1.2) contrast(1.02) brightness(1.03)' },
    };
  }
  return base;
};

const getTextTreatment = ({ event }) => {
  const mood = inferVisualMood(event);
  if (mood === 'nightlife') {
    return { background: 'linear-gradient(135deg, #581c87 0%, #0f172a 100%)' };
  }
  if (mood === 'food') {
    return { background: 'linear-gradient(135deg, #f97316 0%, #be185d 100%)' };
  }
  if (mood === 'reflective') {
    return { background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' };
  }
  return { background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' };
};

const getPhotoFrameClassName = (layout) => {
  if (layout === 'postcard') return 'w-full max-w-[22rem] sm:max-w-[24rem] aspect-[4/5] rounded-[2.25rem] border border-white/20 bg-white/10 p-3 backdrop-blur-sm';
  if (layout === 'polaroid') return 'w-full max-w-[22rem] sm:max-w-[24rem] aspect-[4/5] rounded-[2.5rem] border border-white/15 bg-white/90 p-3 pb-10 shadow-[0_24px_60px_rgba(15,23,42,0.25)]';
  if (layout === 'editorial') return 'w-full max-w-[32rem] aspect-[4/5] rounded-[2.5rem] border border-white/15 bg-white/10 p-3 backdrop-blur-sm';
  return 'h-full w-full';
};
