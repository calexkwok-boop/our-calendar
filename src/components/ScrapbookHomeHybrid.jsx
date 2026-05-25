import React, { useEffect, useState } from 'react';
import {
  Camera,
  Clock,
  Heart,
  Plus,
  Sparkles,
  Trash2,
  BookOpen,
  SlidersHorizontal,
  Eye,
  EyeOff,
  GripVertical,
  X,
} from 'lucide-react';
import QuickThoughtsSection from './QuickThoughtsSection';
import useHomeSectionLayout from '../hooks/useHomeSectionLayout';
import useGoogleImage from '../hooks/useGoogleImage';
import useMoviePoster from '../hooks/useMoviePoster';
import usePlacesImage from '../hooks/usePlacesImage';
import { getDreamImageSearchQuery, getDreamPlacePhotoQuery, isMovieDream, resolveDreamImage, resolveDreamImageCandidates } from '../lib/resolveDreamImage';

const TODAY_MOMENT_CACHE_KEY = 'home-today-moment-v1';
const readCachedTodayMoment = (todayKey) => {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(TODAY_MOMENT_CACHE_KEY) : null;
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return cached?.date === todayKey && cached?.url ? cached : null;
  } catch { return null; }
};

const areShallowArraysEqual = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const areShallowObjectsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
};

const areHomePropsEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of nextKeys) {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    if (typeof prevValue === 'function' && typeof nextValue === 'function') continue;
    if (Array.isArray(prevValue) || Array.isArray(nextValue)) {
      if (!areShallowArraysEqual(prevValue, nextValue)) return false;
      continue;
    }
    if (
      prevValue && nextValue
      && typeof prevValue === 'object'
      && typeof nextValue === 'object'
    ) {
      if (!areShallowObjectsEqual(prevValue, nextValue)) return false;
      continue;
    }
    if (prevValue !== nextValue) return false;
  }

  return true;
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDisplayTime = (value) => {
  if (!value) return 'Anytime';
  const parts = String(value).split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return String(value);
  const displayHours = ((hours + 11) % 12) + 1;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const hashHomeShuffleKey = (value) => {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getVisualPreviewUrl = (item) => String(
  item?.photo || item?.image || item?.image_url || item?.imageUrl || item?.destination_image || item?.photo_url || item?.photoUrl || item?.cover_photo || item?.coverPhoto || item?.attachment_url || item?.attachmentUrl || item?.photos?.[0]?.url || ''
).trim();

const getOnYourMindImageUrl = (dream) => resolveDreamImage(dream);

function OnYourMindPolaroid({ dream, idx, isFlipped, flippedCardId, setFlippedCardId, cardNotes, saveCardNote, cardAttachments, saveCardAttachment }) {
  const candidateImageUrls = resolveDreamImageCandidates(dream);
  const [imageIndex, setImageIndex] = useState(0);
  const [moviePosterFailed, setMoviePosterFailed] = useState(false);
  const [placeImageFailed, setPlaceImageFailed] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [debugDelayElapsed, setDebugDelayElapsed] = useState(false);
  const [stableImageUrl, setStableImageUrl] = useState('');
  const resolvedImageUrl = candidateImageUrls[imageIndex] || '';
  const moviePosterQuery = !resolvedImageUrl && isMovieDream(dream) ? String(dream?.text || dream?.label || '').trim() : null;
  const placePhotoQuery = !resolvedImageUrl ? getDreamPlacePhotoQuery(dream) : null;
  const moviePosterUrl = useMoviePoster(moviePosterQuery);
  const placeImageUrl = usePlacesImage(placePhotoQuery);
  const googleImageQuery = !resolvedImageUrl ? getDreamImageSearchQuery(dream) : null;
  const searchedImageUrl = useGoogleImage(googleImageQuery);
  const asyncImageUrl = (
    (!moviePosterFailed && moviePosterUrl)
    || (!placeImageFailed && placeImageUrl)
    || (!searchFailed && searchedImageUrl)
    || ''
  );
  const dreamImageUrl = resolvedImageUrl || asyncImageUrl;
  const displayImageUrl = dreamImageUrl || stableImageUrl;
  const dreamTitle = String(dream?.text || dream?.label || '').trim();
  const exhaustedCandidates = imageIndex >= candidateImageUrls.length;
  const imageFailed = exhaustedCandidates && !displayImageUrl && (
    (!moviePosterQuery || moviePosterFailed || !moviePosterUrl)
    && (!placePhotoQuery || placeImageFailed || !placeImageUrl)
    && (!googleImageQuery || searchFailed || !searchedImageUrl)
  );
  const isLookupPending = !resolvedImageUrl && !imageFailed && Boolean(
    (moviePosterQuery && !moviePosterFailed && !moviePosterUrl)
    || (placePhotoQuery && !placeImageFailed && !placeImageUrl)
    || (googleImageQuery && !searchFailed && !searchedImageUrl)
  );
  const showDebugFallback = debugDelayElapsed && (!dreamImageUrl || imageFailed) && !isLookupPending;
  useEffect(() => {
    setImageIndex(0);
    setMoviePosterFailed(false);
    setPlaceImageFailed(false);
    setSearchFailed(false);
    setDebugDelayElapsed(false);
    setStableImageUrl('');
  }, [dream?.id, dream?.text, dream?.label, dream?.imageUrl, dream?.photoUrl]);
  useEffect(() => {
    if (dreamImageUrl) setStableImageUrl(dreamImageUrl);
  }, [dreamImageUrl]);
  useEffect(() => {
    if (displayImageUrl || isLookupPending) {
      setDebugDelayElapsed(false);
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setDebugDelayElapsed(true);
    }, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [displayImageUrl, isLookupPending, imageFailed]);
  const debugLines = [
    `title: ${dreamTitle || '(blank)'}`,
    `type: ${String(dream?.type || '').trim() || '(blank)'}`,
    `sourceType: ${String(dream?.sourceType || '').trim() || '(blank)'}`,
    `category: ${String(dream?.category || '').trim() || '(blank)'}`,
    `categoryId: ${String(dream?.categoryId || '').trim() || '(blank)'}`,
    `resolved: ${resolvedImageUrl ? 'yes' : 'no'}`,
    `search: ${(moviePosterUrl || placeImageUrl || searchedImageUrl) ? 'yes' : 'no'}`,
    `imageUrl: ${displayImageUrl ? 'yes' : 'no'}`,
    `failed: ${imageFailed ? 'yes' : 'no'}`,
    `candidate: ${candidateImageUrls.length ? `${Math.min(imageIndex + 1, candidateImageUrls.length)}/${candidateImageUrls.length}` : '0/0'}`,
  ];

  return (
    <div
      className="group flex-shrink-0 snap-start w-40 sm:w-48"
      style={{ rotate: `${idx % 2 === 0 ? '-1.4deg' : '1.1deg'}`, perspective: '800px' }}
    >
      <div
        className="relative transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: isFlipped ? 'default' : 'pointer',
        }}
        onClick={(e) => {
          if (isFlipped) return;
          e.stopPropagation();
          setFlippedCardId(dream.id || idx);
        }}
      >
        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          {displayImageUrl ? (
            <div className="bg-white dark:bg-slate-100 rounded-sm shadow-lg p-2 pb-0">
              <div className="aspect-square w-full overflow-hidden rounded-[3px]">
                <img
                  src={displayImageUrl}
                  alt={dream.text}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => {
                    if (resolvedImageUrl && imageIndex < candidateImageUrls.length - 1) {
                      setImageIndex((current) => current + 1);
                      return;
                    }
                    if (resolvedImageUrl && imageIndex === candidateImageUrls.length - 1) {
                      setImageIndex(candidateImageUrls.length);
                      return;
                    }
                    if (!moviePosterFailed && displayImageUrl && displayImageUrl === moviePosterUrl) {
                      setMoviePosterFailed(true);
                      return;
                    }
                    if (!placeImageFailed && displayImageUrl && displayImageUrl === placeImageUrl) {
                      setPlaceImageFailed(true);
                      return;
                    }
                    setSearchFailed(true);
                  }}
                />
              </div>
              <div className="px-1 py-3 text-center">
                <div className="font-handwritten text-base leading-tight text-gray-600 line-clamp-2">
                  {dream.emoji} {dream.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[216px] flex-col justify-between rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 text-left shadow-lg dark:border-white/10 dark:bg-black/20">
              <span className="text-4xl">{dream.emoji}</span>
              {showDebugFallback ? (
                <div className="rounded-xl bg-white/85 px-2 py-2 text-[10px] leading-tight text-gray-700 shadow-sm dark:bg-white dark:text-gray-700">
                  {debugLines.map((line) => (
                    <div key={line} className="break-words">{line}</div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-white/75 px-2 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-gray-400 shadow-sm dark:bg-white/80 dark:text-gray-500">
                  Loading photo
                </div>
              )}
              <span className="font-handwritten text-2xl leading-tight text-gray-900 dark:text-white line-clamp-4">
                {dream.text}
              </span>
            </div>
          )}
        </div>
        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-sm bg-amber-50 p-3 shadow-lg dark:bg-slate-200"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFlippedCardId(null); }}
            className="absolute right-2 top-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-[14px] text-gray-500 shadow-sm"
          >
            â†©
          </button>
          <textarea
            value={cardNotes[dream.id] || ''}
            onChange={(e) => saveCardNote(dream.id, e.target.value, dream.chapterId)}
            onClick={(e) => e.stopPropagation()}
            placeholder="notes..."
            className="mt-1 flex-1 w-full resize-none bg-transparent text-gray-700 placeholder-gray-400/60 outline-none dark:text-gray-800"
            style={{ fontFamily: "'Caveat', cursive", fontSize: '14px', lineHeight: '1.45' }}
            maxLength={500}
          />
          <div className="flex items-center justify-between pt-2">
            {cardAttachments[dream.id] ? (
              <a href={cardAttachments[dream.id]} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="block h-6 w-6 overflow-hidden rounded shadow-sm ring-1 ring-gray-200/60">
                <img src={cardAttachments[dream.id]} alt="attachment" className="h-full w-full object-cover" />
              </a>
            ) : <span />}
            <label className="cursor-pointer rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-gray-500 shadow-sm" title="Attach photo" onClick={(e) => e.stopPropagation()}>
              ðŸ“Ž
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => saveCardAttachment(dream.id, String(reader.result || ''), dream.chapterId);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysOfWeek = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  const dayOfWeek = monday.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(monday.getDate() - daysFromMonday);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateKey = toLocalDateKey(date);
    const todayKey = toLocalDateKey(today);
    return {
      label: days[date.getDay()],
      isToday: dateKey === todayKey,
      dayIndex: date.getDay(),
      dateKey,
    };
  });
};

const ScrapbookHomeHybrid = ({
  darkMode = false,
  greeting = 'Good day',
  greetingName = 'there',
  greetingEmoji = '',
  todayLabel = '',

  // Year stats for header
  yearStats = { year: new Date().getFullYear(), events: 0, trips: 0, photos: 0, streak: 0, streakHelpText: '' },

  // Moments / Photo of the Day
  momentsThisWeek = [],
  onCaptureQuickMoment,
  onAddMomentForDate,
  onOpenMemory,
  onDeleteMoment,
  onConfirmAction,

  // What's Next Today (current)
  todaySpotlightEvent = null,
  onOpenTodayEvent = () => {},

  // Coming Up This Week (current)
  upcomingPreviewEvents = [],
  onAddEvent = () => {},
  onOpenUpcoming,
  tripSpotlight = null,
  upcomingTripCountdown = null,
  onOpenTripsTab,
  onStartTrip,
  onOpenTrip,

  // Quick Thoughts (NEW - scrapbook enhanced)
  quickThoughts = [],
  onAddThought,
  onDeleteThought,

  // Memories
  recentMemory = null,
  memoryCollagePhotos = [],
  collageMemories = [],
  memoryReadyCount = 0,
  memoryPhotoCount = 0,
  memoryOpportunities = [],
  onOpenMemories,
  onCreateMemoryFromEvent,

  // Journey (mini card)
  primaryJourneyGoal = null,
  primaryJourneyProgressText = '',
  primaryJourneyStreak = 0,
  primaryJourneyLoggedToday = false,
  onOpenJourney,
  onOpenExplore,

  // Someday List (NEW - scrapbook enhanced)
  bucketList = [],
  onAddDream,
  onPlanFromDream,
  onDeleteDream,
  onOpenSomeday,
  onPinDataChange,

  // Theme
  themeAccentHeadingStyle,
  themeAccentEllieChipButtonStyle,
  themeAccentTextStyle,

  // Friends' daily photos strip
  friendsDailyPhotos = [],
  onOpenFriendPhoto,
  onOpenFriendProfile,

  // Account / avatar
  profilePhotoUrl = '',
  profileBadgeCount = 0,
  onOpenAccountMenu,
  onEditProfilePhoto,
}) => {
  const momentTapRef = React.useRef(null);
  const todaySpotlightPhoto = getVisualPreviewUrl(todaySpotlightEvent);
  const tripSpotlightTitle = String(
    tripSpotlight?.name || tripSpotlight?.title || tripSpotlight?.tripName || ''
  ).trim();
  const tripSpotlightLocation = String(
    tripSpotlight?.weather_location || tripSpotlight?.location || tripSpotlight?.destination || ''
  ).trim();
  const tripSpotlightHeading = tripSpotlightTitle || tripSpotlightLocation || 'Your next destination';
  const tripSpotlightLocationLine = (
    tripSpotlightLocation
    && tripSpotlightLocation.toLowerCase() !== tripSpotlightHeading.toLowerCase()
  ) ? tripSpotlightLocation : '';
  const tripSpotlightImage = String(tripSpotlight?.chapterCoverUrl || '').trim();

  const [avatarImgError, setAvatarImgError] = useState(false);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [cardNotes, setCardNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('komo-home-notes') || '{}'); } catch { return {}; }
  });
  const saveCardNote = (id, note, chapterId) => {
    const next = { ...cardNotes, [id]: note };
    setCardNotes(next);
    try { localStorage.setItem('komo-home-notes', JSON.stringify(next)); } catch {}
    onPinDataChange?.(chapterId, id, { notes: note });
  };
  const [cardAttachments, setCardAttachments] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('komo-home-attachments') || '{}'); } catch { return {}; }
  });
  const saveCardAttachment = (id, dataUrl, chapterId) => {
    const next = { ...cardAttachments, [id]: dataUrl };
    setCardAttachments(next);
    try { localStorage.setItem('komo-home-attachments', JSON.stringify(next)); } catch {}
    onPinDataChange?.(chapterId, id, { attachmentUrl: dataUrl });
  };
  const [loadedMemoryCollageUrls, setLoadedMemoryCollageUrls] = useState(() => new Set());
  const loadedMemoryCollageUrlsRef = React.useRef(new Set());
  const [isLayoutEditOpen, setIsLayoutEditOpen] = useState(false);
  const { sections: homeSections, toggleVisible: toggleSectionVisible, reorder: reorderSections } = useHomeSectionLayout();
  const sectionVisible = (id) => homeSections.find((s) => s.id === id)?.visible !== false;
  const sectionOrder = (id) => homeSections.findIndex((s) => s.id === id);
  const [draggingId, setDraggingId] = useState(null);
  const [insertBefore, setInsertBefore] = useState(null);
  const layoutListRef = React.useRef(null);

  const todayKey = toLocalDateKey(new Date());
  const komoShuffleSeedRef = React.useRef(`komo-home-${Date.now()}-${Math.random()}`);
  const todayMoment = momentsThisWeek.find(
    (m) => String(m?.date || '').trim().slice(0, 10) === todayKey
  ) || null;

  const [cachedMoment] = useState(() => readCachedTodayMoment(todayKey));
  const displayMoment = todayMoment || cachedMoment;
  const [readyMomentPhotoUrl, setReadyMomentPhotoUrl] = useState(() => String(cachedMoment?.url || todayMoment?.photoUrl || '').trim());
  const [isMomentPhotoReady, setIsMomentPhotoReady] = useState(() => Boolean(String(cachedMoment?.url || todayMoment?.photoUrl || '').trim()));
  const shuffledBucketList = React.useMemo(() => (
    [...bucketList].sort((left, right) => {
      const leftKey = `${komoShuffleSeedRef.current}:${String(left?.id || left?.text || '')}`;
      const rightKey = `${komoShuffleSeedRef.current}:${String(right?.id || right?.text || '')}`;
      return hashHomeShuffleKey(leftKey) - hashHomeShuffleKey(rightKey);
    })
  ), [bucketList]);

  const memoryCollageTiles = React.useMemo(() => (
    (memoryCollagePhotos.length > 0 ? memoryCollagePhotos : ['', '', '', '']).slice(0, 4)
  ), [memoryCollagePhotos]);
  const [openMemoryCollagePhoto, setOpenMemoryCollagePhoto] = useState(null);

  const openMemoryCollageLightbox = React.useCallback((url, memory = null) => {
    const normalizedUrl = String(url || '').trim();
    if (!normalizedUrl) {
      onOpenMemory?.(memory || null);
      return;
    }
    setOpenMemoryCollagePhoto({
      url: normalizedUrl,
      title: String(memory?.title || '').trim(),
      date: String(memory?.date || '').trim(),
    });
  }, [onOpenMemory]);

  React.useEffect(() => {
    loadedMemoryCollageUrlsRef.current = loadedMemoryCollageUrls;
  }, [loadedMemoryCollageUrls]);

  React.useEffect(() => {
    if (!todayMoment?.photoUrl) return;
    try {
      window.localStorage.setItem(TODAY_MOMENT_CACHE_KEY, JSON.stringify({
        date: todayKey, url: todayMoment.photoUrl, title: todayMoment.title || '',
      }));
    } catch {}
  }, [todayKey, todayMoment?.photoUrl, todayMoment?.title]);

  React.useEffect(() => {
    const nextUrl = String(displayMoment?.photoUrl || cachedMoment?.url || '').trim();
    if (!nextUrl) {
      setReadyMomentPhotoUrl((prev) => (prev ? '' : prev));
      setIsMomentPhotoReady(false);
      return;
    }
    setIsMomentPhotoReady(false);
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cancelled) return;
      setReadyMomentPhotoUrl((prev) => (prev === nextUrl ? prev : nextUrl));
      setIsMomentPhotoReady(true);
    };
    img.onerror = () => {
      if (cancelled) return;
      setReadyMomentPhotoUrl((prev) => (prev === nextUrl ? prev : nextUrl));
      setIsMomentPhotoReady(true);
    };
    img.src = nextUrl;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [cachedMoment?.url, displayMoment?.photoUrl]);

  React.useEffect(() => {
    const activeUrls = memoryCollageTiles.filter(Boolean);
    setLoadedMemoryCollageUrls((prev) => {
      const next = new Set(activeUrls.filter((url) => prev.has(url)));
      if (next.size === prev.size && Array.from(next).every((url) => prev.has(url))) return prev;
      loadedMemoryCollageUrlsRef.current = next;
      return next;
    });
  }, [memoryCollageTiles]);

  React.useEffect(() => {
    if (!openMemoryCollagePhoto) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpenMemoryCollagePhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openMemoryCollagePhoto]);

  return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-slate-950 p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');

        .font-handwritten { font-family: 'Caveat', cursive; }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .paper-texture {
          background-image:
            repeating-linear-gradient(0deg, rgba(0,0,0,.02) 0px, transparent 1px, transparent 2px, rgba(0,0,0,.02) 3px),
            repeating-linear-gradient(90deg, rgba(0,0,0,.02) 0px, transparent 1px, transparent 2px, rgba(0,0,0,.02) 3px);
        }
        .dark .paper-texture {
          background-image:
            linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0)),
            repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.035) 3px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.03) 3px);
          background-blend-mode: screen, normal, normal;
        }

        .sticky-note {
          box-shadow:
            0 4px 6px rgba(0,0,0,0.1),
            inset 0 -2px 4px rgba(0,0,0,0.05);
          transform: rotate(-2deg);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sticky-note:nth-child(even) {
          transform: rotate(1.5deg);
        }
        .sticky-note:hover {
          transform: rotate(0deg) translateY(-4px) !important;
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          z-index: 10;
        }
      `}</style>

      <div className="mx-auto max-w-5xl flex flex-col gap-6 rounded-[36px] border border-black/5 dark:border-white/8 bg-white/35 dark:bg-white/[0.03] p-3 sm:p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">

        {/* SCRAPBOOK HEADER — always pinned first */}
        <div style={{ order: -1 }} className="relative overflow-hidden rounded-[32px] border-2 border-amber-900/20 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-5 pb-5 pt-9 sm:px-10 sm:pb-8 sm:pt-10 shadow-2xl paper-texture">
          {/* Profile avatar button */}
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10">
            <button
              type="button"
              onClick={() => setIsLayoutEditOpen(true)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/[0.08] text-amber-900/60 dark:text-amber-100/60 hover:bg-white/50 dark:hover:bg-white/[0.14] transition-colors"
              title="Customize home"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {typeof onOpenAccountMenu === 'function' && (
            <div className="absolute left-3 top-3 sm:left-4 sm:top-4 z-10">
              <div className="relative">
                <button
                  type="button"
                  onClick={onOpenAccountMenu}
                  title="Account"
                >
                  {profilePhotoUrl && !avatarImgError ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-white/40 dark:border-white/10"
                      onError={() => setAvatarImgError(true)}
                      fetchpriority="high"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/40 dark:border-white/10 bg-gradient-to-br from-violet-400 via-purple-400 to-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                      {String(greetingName || '?').trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                {profileBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-md dark:border-gray-900">
                    {profileBadgeCount > 99 ? '99+' : profileBadgeCount}
                  </span>
                )}
                {typeof onEditProfilePhoto === 'function' && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditProfilePhoto();
                    }}
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white shadow dark:border-gray-600 dark:bg-gray-800"
                    title="Change profile photo"
                  >
                    <Camera className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="relative">
            <h1 className="font-handwritten text-4xl sm:text-6xl text-gray-900 dark:text-white mb-2 leading-tight pl-8 sm:pl-0">
              {greeting}, {greetingName}
            </h1>
            {todayLabel ? (
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-900/55 dark:text-amber-100/55">
                {todayLabel} {greetingEmoji}
              </div>
            ) : (
              greetingEmoji ? (
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-900/55 dark:text-amber-100/55">
                  {greetingEmoji}
                </div>
              ) : null
            )}
          </div>
        </div>

        {sectionVisible('whatsNext') && (
        <div style={{ order: sectionOrder('whatsNext') }}>
        {/* WHAT'S NEXT TODAY */}
        <div
          className="w-full rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
        >
          <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400 mb-3">
            ☀️ WHAT'S NEXT TODAY
          </div>
          {todaySpotlightEvent ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => onOpenTodayEvent?.(todaySpotlightEvent)}
                className="w-full flex gap-4 rounded-2xl px-1 py-1 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              >
                {todaySpotlightPhoto && (
                  <div
                    className="w-24 h-24 rounded-2xl bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${todaySpotlightPhoto})` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {todaySpotlightEvent.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {formatDisplayTime(todaySpotlightEvent.time)}
                    {todaySpotlightEvent.location && ` · ${todaySpotlightEvent.location}`}
                  </div>
                </div>
              </button>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onAddEvent}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold font-handwritten text-white shadow-[0_10px_24px_rgba(139,92,246,0.24)] transition-transform hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 52%, #f97316 100%)' }}
                >
                  <Plus className="w-4 h-4" />
                  Add something
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Your day is wide open ✨
              </p>
              <button
                type="button"
                onClick={onAddEvent}
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold font-handwritten text-white shadow-[0_10px_24px_rgba(139,92,246,0.24)] transition-transform hover:scale-[1.01]"
                style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 52%, #f97316 100%)' }}
              >
                <Plus className="w-4 h-4" />
                Add something
              </button>
            </div>
          )}
        </div>
        </div>
        )}

        {sectionVisible('photoOfDay') && (
        <div style={{ order: sectionOrder('photoOfDay') }}>
        {/* PHOTO OF THE DAY */}
        <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-purple-50/60 via-white/90 to-pink-50/60 dark:from-purple-950/30 dark:via-slate-900/80 dark:to-pink-950/20 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-pink-500 dark:text-pink-300" />
              <h3 className="font-handwritten text-2xl text-gray-700 dark:text-gray-300">
                Photo of the Day
              </h3>
            </div>
            {yearStats.streak > 0 && (
              <div className="text-xs text-pink-500 dark:text-pink-300 font-medium">
                🔥 {yearStats.streak} day streak
              </div>
            )}
          </div>

          {displayMoment ? (
            <div className="flex justify-center">
              <div
                className="bg-white dark:bg-slate-100 rounded-sm shadow-xl p-3 pb-0 w-full max-w-sm relative"
                style={{ transform: 'rotate(-0.8deg)' }}
              >
                <button
                  onClick={() => onOpenMemory?.(todayMoment || displayMoment)}
                  className="w-full"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px]">
                    {readyMomentPhotoUrl ? (
                      <>
                        <img
                          src={readyMomentPhotoUrl}
                          alt="Today's moment"
                          className={`h-full w-full object-cover transition-opacity duration-300 ${isMomentPhotoReady ? 'opacity-100' : 'opacity-95'}`}
                          fetchpriority="high"
                          loading="eager"
                        />
                        {!isMomentPhotoReady && (
                          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-100/70 via-rose-50/80 to-amber-100/70 dark:from-violet-900/30 dark:via-slate-900/80 dark:to-amber-900/20" />
                        )}
                      </>
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-violet-100 via-rose-50 to-amber-100 dark:from-violet-900/30 dark:via-slate-900 dark:to-amber-900/20 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-pink-400/60" />
                      </div>
                    )}
                  </div>
                  <div className="py-4 px-2 text-center">
                    <p className="font-handwritten text-xl text-gray-700" style={{ fontFamily: "'Caveat', cursive" }}>
                      {displayMoment.title || displayMoment.note || formatDisplayDate(displayMoment.date)}
                    </p>
                  </div>
                </button>
                {onDeleteMoment && todayMoment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMoment?.(todayMoment);
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 rounded-full bg-white/90 p-1 shadow-sm hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (typeof onAddMomentForDate === 'function') {
                  onAddMomentForDate(todayKey);
                } else {
                  onCaptureQuickMoment?.();
                }
              }}
              className="w-full flex flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-pink-200 dark:border-pink-700/40 py-14 bg-gradient-to-br from-violet-100/70 via-rose-50/80 to-amber-100/60 dark:from-violet-900/20 dark:via-slate-900/70 dark:to-pink-950/20 hover:from-violet-100 hover:via-rose-50 hover:to-pink-100 dark:hover:from-violet-900/30 dark:hover:via-slate-900/80 dark:hover:to-pink-950/30 transition-colors"
            >
              <div className="rounded-full bg-white/80 dark:bg-white/[0.06] p-4 shadow-sm">
                <Camera className="w-8 h-8 text-pink-500 dark:text-pink-300" />
              </div>
              <p className="font-handwritten text-2xl text-gray-700 dark:text-gray-200">
                Capture today's moment
              </p>
              <p className="text-xs text-pink-500/80 dark:text-pink-300/70">
                Add a photo that captures your day
              </p>
            </button>
          )}

          {/* Friends' daily photos strip */}
          {friendsDailyPhotos.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-2 px-1">
                Friends today
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {friendsDailyPhotos.map((friend) => (
                  <button
                    key={friend.userId}
                    type="button"
                    onClick={() => onOpenFriendPhoto ? onOpenFriendPhoto(friend) : onOpenFriendProfile?.({ userId: friend.userId })}
                    className="flex-shrink-0 flex flex-col items-center gap-1 active:opacity-70 transition-opacity"
                  >
                    <div
                      className="bg-white dark:bg-slate-100 rounded-sm shadow-md p-1.5 pb-0"
                      style={{ transform: `rotate(${friend.userId.charCodeAt(0) % 2 === 0 ? '-1.5deg' : '1.5deg'})` }}
                    >
                      <div className="w-16 h-16 overflow-hidden rounded-[2px]">
                        <img
                          src={friend.photoUrl}
                          alt={friend.handle}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <p
                        className="text-[9px] text-gray-500 text-center py-1.5 px-0.5 truncate w-16"
                        style={{ fontFamily: "'Caveat', cursive" }}
                      >
                        {friend.handle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
        )}

        {sectionVisible('comingUpThisWeek') && (
        <div style={{ order: sectionOrder('comingUpThisWeek') }}>
        {/* COMING UP THIS WEEK */}
        <div className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onOpenUpcoming}
              className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400 active:opacity-70 transition-opacity text-left"
            >
              📅 COMING UP THIS WEEK
            </button>
            {upcomingPreviewEvents.length > 3 && (
              <button
                onClick={onOpenUpcoming}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                See all
              </button>
            )}
          </div>

          {upcomingPreviewEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingPreviewEvents.slice(0, 3).map((event, idx) => (
                <div
                  key={idx}
                  onClick={onOpenUpcoming}
                  className="flex items-center gap-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-3 cursor-pointer active:opacity-70 transition-opacity"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDisplayDate(event.date)} · {formatDisplayTime(event.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-600 dark:text-gray-400 italic">
              Nothing planned yet
            </div>
          )}
        </div>
        </div>
        )}

        {sectionVisible('tripSpotlight') && (
        <div style={{ order: sectionOrder('tripSpotlight') }}>
        {/* YOUR NEXT ADVENTURE — replaced by countdown when a trip is within 30 days */}
        {upcomingTripCountdown ? (
          <button
            type="button"
            onClick={() => onOpenTrip?.(upcomingTripCountdown.trip)}
            className="w-full rounded-[24px] overflow-hidden relative text-left active:opacity-90 transition-opacity"
            style={{ minHeight: 96 }}
          >
            {/* Background: cover photo or gradient */}
            <div className="absolute inset-0">
              {upcomingTripCountdown.coverUrl ? (
                <img
                  src={upcomingTripCountdown.coverUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/20" />
            </div>

            {/* Content */}
            <div className="relative flex items-center gap-4 px-5 py-4">
              {/* Days badge */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <span className="text-2xl font-bold text-white leading-none">{upcomingTripCountdown.daysUntil}</span>
                <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wide mt-0.5">
                  {upcomingTripCountdown.daysUntil === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 mb-0.5">
                  ✈️ Coming up
                </div>
                <div className="font-handwritten text-2xl text-white drop-shadow truncate">
                  {upcomingTripCountdown.name}
                </div>
                <div className="text-xs text-white/75 mt-0.5">
                  {upcomingTripCountdown.daysUntil === 0
                    ? "It's today!"
                    : upcomingTripCountdown.daysUntil === 1
                    ? 'Tomorrow!'
                    : `${formatDisplayDate(upcomingTripCountdown.startDate)}`}
                </div>
              </div>
              <div className="flex-shrink-0 text-2xl">🗺️</div>
            </div>
          </button>
        ) : (
        <button
          type="button"
          onClick={onOpenTripsTab}
          className="w-full rounded-[24px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-4 text-left transition-all hover:bg-white/90 dark:hover:bg-white/[0.08]"
        >
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
            Your Next Adventure
          </div>
          {tripSpotlight ? (
            <div className="overflow-hidden rounded-[18px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-white/[0.05]">
              <div className="relative h-[152px] w-full bg-gradient-to-br from-sky-200 via-cyan-100 to-emerald-100 dark:from-sky-900/40 dark:via-slate-900 dark:to-emerald-900/30">
                {tripSpotlightImage && (
                  <img
                    src={tripSpotlightImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.45),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.22),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
                {tripSpotlightImage && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/5" />
                )}
                <div className="absolute inset-x-0 bottom-0 px-4 py-4">
                  <div className={`font-handwritten truncate text-2xl font-bold ${tripSpotlightImage ? 'text-white drop-shadow' : 'text-gray-900 dark:text-white'}`}>
                    {tripSpotlightHeading}
                  </div>
                  {tripSpotlightLocationLine && (
                    <div className={`mt-0.5 truncate text-xs font-medium ${tripSpotlightImage ? 'text-white/90 drop-shadow' : 'text-gray-800/85 dark:text-gray-200/85'}`}>
                      {tripSpotlightLocationLine}
                    </div>
                  )}
                  <div className={`mt-1 truncate text-xs ${tripSpotlightImage ? 'text-white/85 drop-shadow' : 'text-gray-700/80 dark:text-gray-300'}`}>
                    {formatDisplayDate(tripSpotlight.startDateLabel || tripSpotlight.startDate || tripSpotlight.start)} - {formatDisplayDate(tripSpotlight.endDateLabel || tripSpotlight.endDate || tripSpotlight.end)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[152px] flex-col items-start justify-between rounded-[18px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-4 dark:from-sky-900/30 dark:via-slate-900 dark:to-emerald-900/20">
              <div>
                <div className="font-handwritten text-xl font-bold text-gray-900 dark:text-white">Where do you want to go?</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Plan a trip and it will show up here as your next adventure.
                </div>
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                style={themeAccentEllieChipButtonStyle}
              >
                <Plus className="h-3.5 w-3.5" />
                Plan trip
              </div>
            </div>
          )}
        </button>
        )}
        </div>
        )}

        {sectionVisible('onYourMind') && (
        <div style={{ order: sectionOrder('onYourMind') }}>
        {/* ON YOUR MIND (formerly Your Komo Book) */}
        <div className="rounded-[28px] border-2 border-emerald-900/20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-cyan-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onOpenSomeday}
              className="flex items-center gap-2 text-left active:opacity-70 transition-opacity"
            >
              <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-handwritten text-3xl text-gray-950 dark:text-white">
                On your mind
              </h3>
            </button>
            <button
              onClick={onAddDream}
              className="rounded-full p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {shuffledBucketList.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pl-0.5 pr-5 scrollbar-hide snap-x snap-mandatory [touch-action:pan-x]">
              {shuffledBucketList.slice(0, 4).map((dream, idx) => {
                  return (
                    <OnYourMindPolaroid
                      key={dream.id || idx}
                      dream={dream}
                      idx={idx}
                      isFlipped={flippedCardId === (dream.id || idx)}
                      flippedCardId={flippedCardId}
                      setFlippedCardId={setFlippedCardId}
                      cardNotes={cardNotes}
                      saveCardNote={saveCardNote}
                      cardAttachments={cardAttachments}
                      saveCardAttachment={saveCardAttachment}
                    />
                  );
                  const dreamImageUrl = getOnYourMindImageUrl(dream);
                  const isFlipped = flippedCardId === (dream.id || idx);
                  return (
                <div
                  key={dream.id || idx}
                  className="group flex-shrink-0 snap-start w-40 sm:w-48"
                  style={{ rotate: `${idx % 2 === 0 ? '-1.4deg' : '1.1deg'}`, perspective: '800px' }}
                >
                  <div
                    className="relative transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      cursor: isFlipped ? 'default' : 'pointer',
                    }}
                    onClick={(e) => {
                      if (isFlipped) return;
                      e.stopPropagation();
                      setFlippedCardId(dream.id || idx);
                    }}
                  >
                    {/* Front */}
                    <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                      {dreamImageUrl ? (
                        <div className="bg-white dark:bg-slate-100 rounded-sm shadow-lg p-2 pb-0">
                          <div className="aspect-square w-full overflow-hidden rounded-[3px]">
                            <img src={dreamImageUrl} alt={dream.text} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                          <div className="px-1 py-3 text-center">
                            <div className="font-handwritten text-base leading-tight text-gray-600 line-clamp-2">
                              {dream.emoji} {dream.text}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-[216px] flex-col justify-between rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 text-left shadow-lg dark:border-white/10 dark:bg-black/20">
                          <span className="text-4xl">{dream.emoji}</span>
                          <span className="font-handwritten text-2xl leading-tight text-gray-900 dark:text-white line-clamp-4">
                            {dream.text}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Back */}
                    <div
                      className="absolute inset-0 flex flex-col overflow-hidden rounded-sm bg-amber-50 p-3 shadow-lg dark:bg-slate-200"
                      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFlippedCardId(null); }}
                        className="absolute right-2 top-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-[14px] text-gray-500 shadow-sm"
                      >
                        ↩
                      </button>
                      <textarea
                        value={cardNotes[dream.id] || ''}
                        onChange={(e) => saveCardNote(dream.id, e.target.value, dream.chapterId)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="notes..."
                        className="mt-1 flex-1 w-full resize-none bg-transparent text-gray-700 placeholder-gray-400/60 outline-none dark:text-gray-800"
                        style={{ fontFamily: "'Caveat', cursive", fontSize: '14px', lineHeight: '1.45' }}
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between pt-2">
                        {cardAttachments[dream.id] ? (
                          <a href={cardAttachments[dream.id]} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="block h-6 w-6 overflow-hidden rounded shadow-sm ring-1 ring-gray-200/60">
                            <img src={cardAttachments[dream.id]} alt="attachment" className="h-full w-full object-cover" />
                          </a>
                        ) : <span />}
                        <label className="cursor-pointer rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-gray-500 shadow-sm" title="Attach photo" onClick={(e) => e.stopPropagation()}>
                          📎
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => saveCardAttachment(dream.id, ev.target.result, dream.chapterId);
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                  );
              })}
              {/* Discover more polaroid */}
              <div
                className="flex-shrink-0 snap-start w-40 sm:w-48 cursor-pointer"
                style={{ rotate: '1.2deg' }}
                onClick={onOpenExplore}
              >
                <div className="flex min-h-[216px] flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-emerald-300 dark:border-emerald-700/50 bg-white/60 dark:bg-black/20 p-4 transition-all hover:-translate-y-0.5 hover:bg-white/90 dark:hover:bg-black/40">
                  <span className="text-3xl">✨</span>
                  <span className="font-handwritten text-xl leading-tight text-center text-emerald-700 dark:text-emerald-400">
                    Discover more
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="font-handwritten text-2xl text-gray-600 dark:text-gray-400 italic mb-4">
                Not sure where to start?
              </p>
              <button
                onClick={onOpenExplore}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-handwritten text-xl bg-emerald-200 dark:bg-emerald-900/50 text-gray-900 dark:text-white hover:bg-emerald-300 dark:hover:bg-emerald-900/70 transition-colors"
              >
                Explore ideas
              </button>
            </div>
          )}
        </div>
        </div>
        )}

        {sectionVisible('yearSoFar') && (
        <div style={{ order: sectionOrder('yearSoFar') }}>
        {/* 2026 SO FAR */}
        <div className="rounded-[24px] border border-amber-900/10 bg-white/70 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-black/20 sm:px-6 sm:py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900/55 dark:text-amber-100/55">
            {(yearStats.year || new Date().getFullYear())} so far
          </div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-200 sm:text-base">
            {yearStats.events} events · {yearStats.trips} trips · {yearStats.photos} photos
          </div>
          {yearStats.streakHelpText ? (
            <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {yearStats.streakHelpText}
            </div>
          ) : null}
        </div>
        </div>
        )}

        {sectionVisible('memories') && (
        <div style={{ order: sectionOrder('memories') }}>
        {/* MEMORIES - Daily rotating collage 2x2 */}
        <div className="rounded-[28px] border border-white/50 dark:border-white/10 bg-gradient-to-br from-purple-50/60 via-white/90 to-pink-50/60 dark:from-purple-950/30 dark:via-slate-900/80 dark:to-pink-950/20 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
              Memories
            </div>
            <button
              onClick={onOpenMemories}
              className="font-handwritten rounded-xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.05] px-3 py-1.5 text-lg font-bold leading-none text-gray-700 dark:text-gray-100"
            >
              Open gallery
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {memoryCollageTiles.map((url, index) => (
              <button
                key={`memory-collage-${index}`}
                onClick={() => openMemoryCollageLightbox(url, collageMemories[index] || null)}
                className="relative h-36 sm:h-44 overflow-hidden rounded-[14px] border border-white/40 dark:border-white/10 bg-gradient-to-br from-violet-100 via-rose-50 to-amber-100 dark:from-violet-900/30 dark:via-slate-900 dark:to-amber-900/20 active:opacity-80"
              >
                {url ? (
                  <img
                    src={url}
                    alt=""
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                    onLoad={() => {
                      setLoadedMemoryCollageUrls((prev) => {
                        if (prev.has(url)) return prev;
                        const next = new Set(prev);
                        next.add(url);
                        return next;
                      });
                    }}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                      loadedMemoryCollageUrls.has(url) ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{memoryReadyCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">moments</div>
            </div>
            <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-3">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{memoryPhotoCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">photos living in memories</div>
            </div>
          </div>

          {memoryOpportunities.length > 0 && (
            <div className="mt-4 space-y-2">
              {memoryOpportunities.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatDisplayDate(event.date)}
                      </div>
                    </div>
                    <button
                      onClick={() => onCreateMemoryFromEvent?.(event)}
                      className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold"
                      style={themeAccentEllieChipButtonStyle}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        )}

        {sectionVisible('quickThoughts') && (
        <div style={{ order: sectionOrder('quickThoughts') }}>
        <QuickThoughtsSection
          quickThoughts={quickThoughts}
          onAddThought={onAddThought}
          onDeleteThought={onDeleteThought}
          onOpenSomeday={onOpenSomeday}
          darkMode={darkMode}
        />
        </div>
        )}

      </div>

      {/* CUSTOMIZE HOME SHEET */}
      {isLayoutEditOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsLayoutEditOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-t-[28px] bg-white dark:bg-slate-900 shadow-2xl max-h-[80vh] overflow-y-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-black/10 dark:bg-white/10" />
            </div>
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
              <h2 className="font-handwritten text-2xl text-gray-900 dark:text-white">Customize Home</h2>
              <button
                type="button"
                onClick={() => setIsLayoutEditOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="px-5 pb-3 text-sm text-gray-500 dark:text-gray-400">
              Show, hide, or reorder your home screen cards.
            </p>
            <div className="pb-10" ref={layoutListRef}>
              {homeSections.map((section, idx) => (
                <React.Fragment key={section.id}>
                  {/* Drop indicator line */}
                  {draggingId && draggingId !== section.id && insertBefore === idx && (
                    <div className="mx-5 h-0.5 rounded-full bg-violet-400 dark:bg-violet-500" />
                  )}
                  <div
                    data-layout-row
                    className={`flex items-center gap-3 px-5 py-3.5 border-t border-black/[0.06] dark:border-white/[0.06] transition-opacity duration-100 ${
                      section.id === draggingId ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    {/* Grip handle */}
                    <button
                      type="button"
                      className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setDraggingId(section.id);
                        setInsertBefore(idx);
                      }}
                      onPointerMove={(e) => {
                        if (!draggingId || !layoutListRef.current) return;
                        const rows = layoutListRef.current.querySelectorAll('[data-layout-row]');
                        let newInsert = rows.length;
                        for (let i = 0; i < rows.length; i++) {
                          const rect = rows[i].getBoundingClientRect();
                          if (e.clientY < rect.top + rect.height / 2) { newInsert = i; break; }
                        }
                        setInsertBefore(newInsert);
                      }}
                      onPointerUp={() => {
                        if (draggingId !== null && insertBefore !== null) {
                          const fromIndex = homeSections.findIndex((s) => s.id === draggingId);
                          const toIndex = insertBefore > fromIndex ? insertBefore - 1 : insertBefore;
                          if (fromIndex !== toIndex) reorderSections(fromIndex, toIndex);
                        }
                        setDraggingId(null);
                        setInsertBefore(null);
                      }}
                      onPointerCancel={() => { setDraggingId(null); setInsertBefore(null); }}
                    >
                      <GripVertical className="w-5 h-5" />
                    </button>
                    {/* Visibility toggle */}
                    <button
                      type="button"
                      onClick={() => toggleSectionVisible(section.id)}
                      className={`flex-shrink-0 transition-colors ${section.visible ? 'text-violet-500 dark:text-violet-400' : 'text-gray-300 dark:text-gray-600'}`}
                    >
                      {section.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <span className={`flex-1 text-sm font-medium transition-colors select-none ${section.visible ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                      {section.label}
                    </span>
                  </div>
                </React.Fragment>
              ))}
              {/* Drop indicator at the very end */}
              {draggingId && insertBefore === homeSections.length && (
                <div className="mx-5 h-0.5 rounded-full bg-violet-400 dark:bg-violet-500" />
              )}
            </div>
          </div>
        </div>
      )}
      {openMemoryCollagePhoto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenMemoryCollagePhoto(null)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpenMemoryCollagePhoto(null);
            }}
            className="absolute right-4 top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] rounded-full bg-black/45 p-2 text-white transition-colors hover:bg-black/65"
            aria-label="Close memory photo"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={openMemoryCollagePhoto.url}
              alt={openMemoryCollagePhoto.title || 'Memory photo'}
              className="max-h-[82vh] w-full rounded-[28px] object-contain"
            />
            {(openMemoryCollagePhoto.title || openMemoryCollagePhoto.date) && (
              <div className="mt-3 text-center text-white">
                {openMemoryCollagePhoto.title ? (
                  <div className="text-base font-semibold">{openMemoryCollagePhoto.title}</div>
                ) : null}
                {openMemoryCollagePhoto.date ? (
                  <div className="mt-1 text-sm text-white/70">{formatDisplayDate(openMemoryCollagePhoto.date)}</div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ScrapbookHomeHybrid, areHomePropsEqual);
