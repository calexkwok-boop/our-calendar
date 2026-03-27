import React, { useEffect, useRef, useState } from 'react';
import { Download, Music, Play, Share2, Sparkles, X } from 'lucide-react';

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
    overlayClassName: 'absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/20 to-slate-950/75',
    label: 'Scenic',
  },
  food: {
    layout: 'postcard',
    shellClassName: 'px-6 py-10 sm:px-10',
    imageClassName: 'h-full w-full rounded-[2rem] object-cover shadow-[0_30px_80px_rgba(0,0,0,0.28)]',
    imageStyle: { filter: 'sepia(0.08) saturate(1.14) contrast(1.02) brightness(1.02)' },
    overlayClassName: 'absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.20),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.78))]',
    label: 'Taste',
  },
  nightlife: {
    layout: 'editorial',
    shellClassName: 'px-5 py-8 sm:px-8',
    imageClassName: 'h-full w-full rounded-[2.25rem] object-cover shadow-[0_26px_80px_rgba(15,23,42,0.42)]',
    imageStyle: { filter: 'contrast(1.12) saturate(1.18) brightness(0.9) hue-rotate(-6deg)' },
    overlayClassName: 'absolute inset-0 bg-[linear-gradient(135deg,rgba(88,28,135,0.28),rgba(15,23,42,0.82))]',
    label: 'After Dark',
  },
  reflective: {
    layout: 'polaroid',
    shellClassName: 'px-6 py-10 sm:px-10',
    imageClassName: 'h-full w-full rounded-[1.75rem] object-cover shadow-[0_24px_60px_rgba(0,0,0,0.24)]',
    imageStyle: { filter: 'contrast(0.96) saturate(0.92) brightness(1.03)' },
    overlayClassName: 'absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(15,23,42,0.72))]',
    label: 'Reflect',
  },
});

export default function TripHighlightReel({
  trip,
  events = [],
  groupRatingsByEventId = {},
  currentUserId,
  onClose,
  onShare,
  onPublish,
  onSave,
}) {
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

  useEffect(() => {
    const scored = [];

    events.forEach((event) => {
      const rating = getEffectiveRating(event, groupRatingsByEventId, currentUserId);
      if (rating < 3) return;

      let score = rating * 20;
      const photos = normalizeEventPhotos(event.photos);
      if (photos.length > 0) {
        score += Math.min(photos.length, 5) * 5;
        score += photos.filter((photo) => photo.hasPeople).length * 3;
      }

      const tags = Array.isArray(event.tags) ? event.tags : [];
      if (tags.some((tag) => ['must_try', 'instagram', 'romantic', 'amazing_view', 'unforgettable'].includes(tag))) {
        score += 15;
      }
      if (String(event.review || '').trim().length > 50) score += 10;
      if (Array.isArray(event.voiceNotes) && event.voiceNotes.length > 0) score += 8;
      if ((groupRatingsByEventId[String(event?.id || '')] || []).length > 1) score += 10;

      const hour = event.time ? parseInt(String(event.time).split(':')[0], 10) : 12;
      if (hour >= 6 && hour < 10) score += 3;
      if (hour >= 18 && hour < 22) score += 5;

      scored.push({
        event,
        score,
        rating,
        photos: photos.slice(0, 3),
      });
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = [];
    const selectedCountsByDate = {};

    scored.forEach((item) => {
      if (selected.length >= 15) return;
      const eventDate = String(item?.event?.date || '');
      const countForDate = Number(selectedCountsByDate[eventDate] || 0);
      if (countForDate >= 3) return;
      selected.push(item);
      selectedCountsByDate[eventDate] = countForDate + 1;
    });

    const slides = [
      {
        type: 'title',
        title: String(trip?.name || 'Trip').trim() || 'Trip',
        subtitle: formatTripDates(trip?.startDate || trip?.start_date || trip?.start, trip?.endDate || trip?.end_date || trip?.end),
        background: selected[0]?.photos[0]?.url || '',
      },
    ];

    selected.forEach((item) => {
      if (item.photos.length > 0) {
        item.photos.forEach((photo, photoIndex) => {
          slides.push({
            type: 'photo',
            photo: photo.url,
            caption: item.event.title,
            rating: item.rating,
            date: item.event.date,
            location: item.event.location,
            treatment: getPhotoTreatment({ event: item.event, rating: item.rating, photoIndex }),
          });
        });
      } else {
        slides.push({
          type: 'text',
          title: item.event.title,
          rating: item.rating,
          date: item.event.date,
          location: item.event.location,
          review: item.event.review,
          treatment: getTextTreatment({ event: item.event, rating: item.rating }),
        });
      }
    });

    slides.push({
      type: 'stats',
      totalEvents: events.length,
      topRated: selected[0]?.event?.title || 'Top moment',
      totalPhotos: events.reduce((sum, event) => sum + normalizeEventPhotos(event.photos).length, 0),
      avgRating: scored.length > 0 ? (scored.reduce((sum, item) => sum + item.rating, 0) / scored.length).toFixed(1) : '0.0',
    });

    setHighlights(slides);
  }, [events, groupRatingsByEventId, currentUserId, trip]);

  useEffect(() => {
    const nextTrackId = pickDefaultTrackId(events, groupRatingsByEventId, currentUserId);
    setSelectedTrackId(nextTrackId);
    setAudioAvailable(true);
  }, [events, groupRatingsByEventId, currentUserId]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev >= highlights.length - 1) {
            setIsPlaying(false);
            return 0;
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
  }, [isPlaying, highlights.length]);

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
    setIsPlaying(nextPlaying);
    if (!audioRef.current) return;
    if (nextPlaying && musicEnabled && audioAvailable) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  };

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, highlights.length - 1));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const handleDownload = () => {
    setShowShareMenu(false);
    setShowMusicMenu(false);
    if (onSave) onSave(highlights);
  };

  const handleShare = () => {
    setShowShareMenu(false);
    setShowMusicMenu(false);
    if (onShare) onShare(highlights);
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

  if (highlights.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mb-4 text-6xl animate-spin">+</div>
          <div className="text-xl">Creating your highlight reel...</div>
        </div>
      </div>
    );
  }

  const currentHighlight = highlights[currentSlide];
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
        {currentHighlight.type === 'title' && <TitleSlide highlight={currentHighlight} />}
        {currentHighlight.type === 'photo' && <PhotoHighlightSlide highlight={currentHighlight} />}
        {currentHighlight.type === 'text' && <TextHighlightSlide highlight={currentHighlight} />}
        {currentHighlight.type === 'stats' && <StatsHighlightSlide highlight={currentHighlight} />}
      </div>

      <div className="absolute bottom-20 left-0 right-0 px-8">
        <div className="h-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / highlights.length) * 100}%` }}
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
              disabled={currentSlide === highlights.length - 1}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30 disabled:opacity-30"
            >
              {'>'}
            </button>
          </div>
        ) : null}

        <div className="mt-3 text-center text-sm text-white/75">
          {currentSlide + 1} / {highlights.length}
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
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 px-8 text-center text-white">
        <div className="mb-4 text-6xl animate-pulse">+</div>
        <h1 className="mb-3 text-5xl font-bold animate-fade-in">{highlight.title}</h1>
        <p className="text-2xl opacity-90 animate-fade-in-delay">{highlight.subtitle}</p>
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
        style={{ backgroundImage: `url(${highlight.photo})`, filter: 'saturate(1.05) brightness(0.8)' }}
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md">
              {treatment.label}
            </span>
            <RatingStars rating={highlight.rating} sizeClassName="text-xl" />
          </div>
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{highlight.caption}</h2>
          {highlight.location ? (
            <p className="mt-2 text-base text-white/85 sm:text-lg">{highlight.location}</p>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(0,0,0,0.14)_100%)]" />
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
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            {treatment.label}
          </span>
        </div>
        <RatingStars rating={highlight.rating} justifyClassName="justify-center" sizeClassName="text-2xl" />
        <h2 className="mt-5 text-4xl font-bold leading-tight">{highlight.title}</h2>
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

function StatsHighlightSlide({ highlight }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 px-8">
      <div className="text-center text-white">
        <div className="mb-6 text-6xl">#</div>
        <h2 className="mb-8 text-4xl font-bold">Trip Complete!</h2>
        <div className="grid max-w-lg grid-cols-2 gap-6">
          <StatBubble icon="Events" value={highlight.totalEvents} label="Events" />
          <StatBubble icon="Photos" value={highlight.totalPhotos} label="Photos" />
          <StatBubble icon="Rating" value={highlight.avgRating} label="Avg Rating" />
          <StatBubble icon="Top" value={highlight.topRated} label="Top Rated" small />
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
      label: 'Favorite meal',
      imageStyle: { ...base.imageStyle, filter: 'sepia(0.1) saturate(1.2) contrast(1.02) brightness(1.03)' },
    };
  }
  return base;
};

const getTextTreatment = ({ event }) => {
  const mood = inferVisualMood(event);
  if (mood === 'nightlife') {
    return { label: 'After Dark', background: 'linear-gradient(135deg, #581c87 0%, #0f172a 100%)' };
  }
  if (mood === 'food') {
    return { label: 'Taste', background: 'linear-gradient(135deg, #f97316 0%, #be185d 100%)' };
  }
  if (mood === 'reflective') {
    return { label: 'Reflect', background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' };
  }
  return { label: 'Postcard', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' };
};

const getPhotoFrameClassName = (layout) => {
  if (layout === 'postcard') return 'w-full max-w-[22rem] sm:max-w-[24rem] aspect-[4/5] rounded-[2.25rem] border border-white/20 bg-white/10 p-3 backdrop-blur-sm';
  if (layout === 'polaroid') return 'w-full max-w-[22rem] sm:max-w-[24rem] aspect-[4/5] rounded-[2.5rem] border border-white/15 bg-white/90 p-3 pb-10 shadow-[0_24px_60px_rgba(15,23,42,0.25)]';
  if (layout === 'editorial') return 'w-full max-w-[32rem] aspect-[4/5] rounded-[2.5rem] border border-white/15 bg-white/10 p-3 backdrop-blur-sm';
  return 'h-full w-full';
};
