// MemorySystem.jsx - Complete memory/keepsake system for special events
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, Heart, MessageCircle, Share2, X,
  ChevronLeft, ChevronRight, Plus, Check, Eye, Calendar, MapPin, Edit2, Trash2, Star
} from 'lucide-react';

const getLocalDateInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const normalizeMemoryDateInput = (value) => {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  }
  return getLocalDateInputValue();
};

const createEmptyMemoryDraft = (overrides = {}) => ({
  title: '',
  description: '',
  highlights: [''],
  photos: [],
  taggedPeople: [],
  date: getLocalDateInputValue(),
  location: '',
  coverPhoto: '',
  ...overrides,
  date: normalizeMemoryDateInput(overrides?.date),
});

const normalizeMemoryMediaUrl = (url) => String(url || '').trim();

const getMemoryPhotoUrl = (photo, preference = 'display') => {
  if (!photo) return '';
  const thumbnailUrl = String(
    photo?.resolved_thumbnail_url
    || photo?.thumbnail_url
    || photo?.thumb_url
    || photo?.local_thumbnail_preview_url
    || ''
  ).trim();
  const mediumUrl = String(
    photo?.resolved_medium_url
    || photo?.medium_url
    || photo?.resolved_url
    || ''
  ).trim();
  const primaryUrl = String(
    photo?.url
    || photo?.photoUrl
    || photo?.photo_url
    || ''
  ).trim();
  const orderedCandidates = preference === 'thumbnail' || preference === 'preview'
    ? [thumbnailUrl, mediumUrl, primaryUrl]
    : [mediumUrl, primaryUrl, thumbnailUrl];
  return normalizeMemoryMediaUrl(orderedCandidates.find(Boolean) || '');
};

const getMemoryCoverUrl = (memory, preference = 'display') => {
  const coverPhoto = String(memory?.coverPhoto || '').trim();
  const matchingCoverPhoto = (memory?.photos || []).find((photo) => {
    const candidates = [
      photo?.url,
      photo?.photoUrl,
      photo?.photo_url,
      photo?.medium_url,
      photo?.resolved_medium_url,
      photo?.thumbnail_url,
      photo?.resolved_thumbnail_url,
      photo?.thumb_url,
    ].map((value) => String(value || '').trim()).filter(Boolean);
    return coverPhoto && candidates.includes(coverPhoto);
  });
  return normalizeMemoryMediaUrl(String(
    (matchingCoverPhoto && getMemoryPhotoUrl(matchingCoverPhoto, preference))
    || coverPhoto
    || getMemoryPhotoUrl(memory?.photos?.[0], preference)
    || memory?.photoUrl
    || memory?.photo_url
    || ''
  ).trim());
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const original = String(reader.result || '');
    if (!String(file?.type || '').startsWith('image/')) {
      resolve(original);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const maxDimension = 1200;
        const width = Number(img.naturalWidth || img.width || 0);
        const height = Number(img.naturalHeight || img.height || 0);
        if (!width || !height) {
          resolve(original);
          return;
        }

        const scale = Math.min(1, maxDimension / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(original);
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        resolve(original);
      }
    };
    img.onerror = () => resolve(original);
    img.src = original;
  };
  reader.onerror = () => reject(new Error('Could not read file.'));
  reader.readAsDataURL(file);
});

const MEMORY_PHOTO_CROP_FRAME = { width: 240, height: 240, targetW: 900, targetH: 900 };

const getMemoryPhotoCropMetrics = (natural, zoom) => {
  const srcW = Number(natural?.width || 0);
  const srcH = Number(natural?.height || 0);
  if (!srcW || !srcH) {
    return { ...MEMORY_PHOTO_CROP_FRAME, scale: 1, renderedW: MEMORY_PHOTO_CROP_FRAME.width, renderedH: MEMORY_PHOTO_CROP_FRAME.height };
  }
  const baseScale = Math.max(MEMORY_PHOTO_CROP_FRAME.width / srcW, MEMORY_PHOTO_CROP_FRAME.height / srcH);
  const scale = baseScale * Math.max(1, Number(zoom || 1));
  return {
    ...MEMORY_PHOTO_CROP_FRAME,
    scale,
    renderedW: srcW * scale,
    renderedH: srcH * scale,
  };
};

const clampMemoryPhotoCropOffset = (natural, zoom, offset) => {
  const metrics = getMemoryPhotoCropMetrics(natural, zoom);
  const maxX = Math.max(0, (metrics.renderedW - metrics.width) / 2);
  const maxY = Math.max(0, (metrics.renderedH - metrics.height) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, Number(offset?.x || 0))),
    y: Math.max(-maxY, Math.min(maxY, Number(offset?.y || 0))),
  };
};

const getPersonAvatarUrl = (person) => String(
  person?.avatarUrl
  || person?.avatar_url
  || person?.photoUrl
  || person?.photo_url
  || ''
).trim();

const PersonAvatar = ({ person, className = 'w-10 h-10', textClassName = 'text-white font-bold', fallbackClassName = 'bg-gradient-to-br from-rose-400 via-purple-400 to-indigo-400' }) => {
  const avatarUrl = getPersonAvatarUrl(person);
  const initial = String(person?.name || person?.handle || person?.username || 'U').trim().charAt(0).toUpperCase() || 'U';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={String(person?.name || 'Person')}
        className={`${className} rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`${className} rounded-full flex items-center justify-center ${fallbackClassName} ${textClassName}`}>
      {initial}
    </div>
  );
};

const MemoryPlacesAutocomplete = ({ value, onSelect, placeholder, darkMode = false }) => {
  const [input, setInput] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const serviceRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const nextValue = value || '';
    setInput((prev) => (prev === nextValue ? prev : nextValue));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const getService = () => {
    if (serviceRef.current) return serviceRef.current;
    if (!window.google?.maps?.places) return null;
    serviceRef.current = new window.google.maps.places.AutocompleteService();
    return serviceRef.current;
  };

  const search = (query) => {
    clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const service = getService();
      if (!service) return;
      service.getPlacePredictions({ input: query }, (predictions, status) => {
        if (predictions && status === 'OK') {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    }, 200);
  };

  const commitSelection = (nextValue) => {
    const normalized = String(nextValue || '').trim();
    setInput(normalized);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(normalized);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={input}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInput(nextValue);
          search(nextValue);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false);
            const normalized = input.trim();
            if (normalized !== String(value || '').trim()) onSelect(normalized);
          }, 200);
        }}
        placeholder={placeholder || 'Home, Park, Restaurant...'}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#C4848A] dark:text-[#D4A5A5] focus:ring-2 focus:ring-[#D4A5A5] outline-none text-base"
        style={{ fontSize: '16px' }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800" style={{ zIndex: 9999 }}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                commitSelection(suggestion.description);
              }}
              className="w-full border-b border-stone-100 px-3 py-2 text-left text-xs hover:bg-rose-50 dark:border-gray-700 dark:hover:bg-rose-900/20 last:border-0"
            >
              <span className="mr-1 text-gray-400">📍</span>
              <span className="font-medium text-gray-800 dark:text-white">{suggestion.structured_formatting?.main_text}</span>
              {suggestion.structured_formatting?.secondary_text && (
                <span className="ml-1 text-gray-400">{suggestion.structured_formatting.secondary_text}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN MEMORY SYSTEM COMPONENT
// ============================================================================

const MemorySystem = ({
  // Current view mode
  view = 'gallery', // 'gallery' | 'create' | 'viewer'
  
  // Data
  memories = [],
  currentMemory = null,
  createDraft = null,
  
  // Actions
  onCreateMemory,
  onUpdateMemory,
  onDeleteMemory,
  onAddPhoto,
  onRemovePhoto,
  onTagPerson,
  onRemovePerson,
  onReact,
  onComment,
  onShare,
  onCloseSystem,
  closeViewerToSystem = false,
  onViewChange,
  onSetCurrentMemory,
  
  // User
  user,
  
  // Theme
  darkMode = false,
}) => {
  const [activeView, setActiveView] = useState(view);
  const [selectedMemory, setSelectedMemory] = useState(currentMemory);

  useEffect(() => {
    setActiveView((prev) => (prev === view ? prev : view));
  }, [view]);

  useEffect(() => {
    setSelectedMemory((prev) => (prev === currentMemory ? prev : currentMemory));
  }, [currentMemory]);

  useEffect(() => {
    if (!selectedMemory?.id) return;
    const refreshed = (memories || []).find((memory) => String(memory?.id || '') === String(selectedMemory.id || ''));
    if (refreshed) {
      setSelectedMemory((prev) => (prev === refreshed ? prev : refreshed));
    }
  }, [memories, selectedMemory?.id]);
  
  return (
    <div
      className={`memory-system relative ${
        activeView === 'viewer' ? 'h-full overflow-hidden bg-black' : 'w-full'
      }`}
    >
      {activeView === 'gallery' && (
        <MemoriesGallery
          memories={memories}
          onSelectMemory={(memory) => {
            setSelectedMemory(memory);
            onSetCurrentMemory?.(memory);
            setActiveView('viewer');
            onViewChange?.('viewer');
          }}
          onCreateNew={() => {
            setSelectedMemory(null);
            onSetCurrentMemory?.(null);
            setActiveView('create');
            onViewChange?.('create');
          }}
          onClose={onCloseSystem}
          onToggleFavorite={(memory) => {
            if (!memory?.id) return;
            onUpdateMemory?.(memory.id, (current) => ({
              ...current,
              isFavorite: !Boolean(current?.isFavorite),
            }));
          }}
          onDeleteMemory={(memory) => {
            if (!memory?.id) return;
            onDeleteMemory?.(memory.id);
          }}
          darkMode={darkMode}
        />
      )}
      
      {activeView === 'create' && (
        <MemoryCreator
          onCancel={() => {
            setActiveView('gallery');
            onViewChange?.('gallery');
          }}
          onCreate={(memoryData) => {
            onCreateMemory(memoryData);
            setActiveView('gallery');
            onViewChange?.('gallery');
          }}
          onAddPhoto={onAddPhoto}
          onTagPerson={onTagPerson}
          user={user}
          initialData={createDraft}
          darkMode={darkMode}
        />
      )}
      
      {activeView === 'viewer' && selectedMemory && (
        <MemoryViewer
          memory={selectedMemory}
          onClose={() => {
            if (closeViewerToSystem) {
              onCloseSystem?.();
              return;
            }
            setSelectedMemory(null);
            onSetCurrentMemory?.(null);
            setActiveView('gallery');
            onViewChange?.('gallery');
          }}
          onEdit={() => {
            setActiveView('edit');
            onViewChange?.('edit');
          }}
          onDelete={() => {
            onDeleteMemory(selectedMemory.id);
            onSetCurrentMemory?.(null);
            setActiveView('gallery');
            onViewChange?.('gallery');
          }}
          onReact={onReact}
          onComment={onComment}
          onShare={onShare}
          user={user}
          darkMode={darkMode}
        />
      )}

      {activeView === 'edit' && selectedMemory && (
        <MemoryCreator
          onCancel={() => {
            setActiveView('viewer');
            onViewChange?.('viewer');
          }}
          onCreate={(memoryData) => {
            const photos = Array.isArray(memoryData?.photos) ? memoryData.photos : [];
            onUpdateMemory(selectedMemory.id, (memory) => ({
              ...memory,
              ...memoryData,
              title: String(memoryData?.title || memory?.title || 'Untitled memory').trim(),
              description: String(memoryData?.description || '').trim(),
              highlights: Array.isArray(memoryData?.highlights)
                ? memoryData.highlights.filter((highlight) => String(highlight || '').trim())
                : [],
              photos,
              coverPhoto: getMemoryCoverUrl({ ...memoryData, photos }),
              taggedPeople: Array.isArray(memoryData?.taggedPeople) ? memoryData.taggedPeople : [],
              date: normalizeMemoryDateInput(memoryData?.date || memory?.date),
              location: String(memoryData?.location || '').trim(),
            }));
            setSelectedMemory((prev) => ({
              ...(prev || selectedMemory),
              ...memoryData,
              coverPhoto: getMemoryCoverUrl({ ...memoryData, photos }),
              photos,
            }));
            setActiveView('viewer');
            onViewChange?.('viewer');
          }}
          onAddPhoto={onAddPhoto}
          onTagPerson={onTagPerson}
          user={user}
          initialData={selectedMemory}
          darkMode={darkMode}
          submitLabel="Save Memory"
        />
      )}
    </div>
  );
};

// ============================================================================
// MEMORIES GALLERY VIEW
// ============================================================================

const MemoriesGallery = ({ memories, onSelectMemory, onCreateNew, onClose, onToggleFavorite, onDeleteMemory, darkMode }) => {
  const safeMemories = Array.isArray(memories) ? memories : [];
  const [deleteReadyMemoryId, setDeleteReadyMemoryId] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const favoriteMemories = safeMemories.filter((memory) => Boolean(memory?.isFavorite));
  const visibleMemories = activeTab === 'favorites' ? favoriteMemories : safeMemories;
  // Group memories by year
  const memoriesByYear = visibleMemories.reduce((acc, memory) => {
    const year = new Date(memory.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(memory);
    return acc;
  }, {});
  
  const years = Object.keys(memoriesByYear).sort((a, b) => b - a);
  
  return (
    <div className="memories-gallery w-full space-y-6 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4.5rem))]">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">💫</div>
        <h2 className="text-2xl font-bold text-[#C4848A] dark:text-[#D4A5A5] mb-1.5">
          Your Memories
        </h2>
        <p className="text-sm text-[#C4848A]/80 dark:text-[#D4A5A5]/70">
          {safeMemories.length} special moment{safeMemories.length !== 1 ? 's' : ''} preserved
        </p>
      </div>
      
      {/* Create new button */}
      <div className="flex gap-3">
        <button
          onClick={onCreateNew}
          className="flex-1 py-3.5 rounded-2xl bg-[#D4A5A5] dark:bg-[#D4A5A5]
                     text-rose-50 font-bold text-base hover:bg-[#C4848A] dark:hover:bg-[#C4848A] hover:shadow-xl transition-all
                     flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6" />
          Create a Memory
        </button>
        {typeof onClose === 'function' && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl px-5 py-3.5 bg-white/70 text-[#C4848A] font-semibold border border-rose-200 shadow-sm transition-all hover:bg-white dark:bg-slate-900 dark:text-[#D4A5A5] dark:border-rose-400/10 dark:hover:bg-slate-800"
          >
            Close
          </button>
        )}
      </div>

      {safeMemories.length > 0 && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-rose-200/70 bg-white/70 p-1 shadow-sm dark:border-rose-400/10 dark:bg-slate-900/70">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setDeleteReadyMemoryId('');
            }}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#D4A5A5] text-rose-50 shadow-sm'
                : 'text-[#C4848A] hover:bg-rose-50 dark:text-[#D4A5A5] dark:hover:bg-rose-950/30'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            All
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-rose-100 text-[#C4848A] dark:bg-rose-950/40 dark:text-[#D4A5A5]'
            }`}>
              {safeMemories.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('favorites');
              setDeleteReadyMemoryId('');
            }}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
              activeTab === 'favorites'
                ? 'bg-[#D4A5A5] text-rose-50 shadow-sm'
                : 'text-[#C4848A] hover:bg-rose-50 dark:text-[#D4A5A5] dark:hover:bg-rose-950/30'
            }`}
          >
            <Star className="h-4 w-4" fill={activeTab === 'favorites' ? 'currentColor' : 'none'} />
            Favorited
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-rose-100 text-[#C4848A] dark:bg-rose-950/40 dark:text-[#D4A5A5]'
            }`}>
              {favoriteMemories.length}
            </span>
          </button>
        </div>
      )}
      
      {/* Empty state */}
      {safeMemories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-[#C4848A] dark:text-[#D4A5A5] mb-2">
            No memories yet
          </h3>
          <p className="text-[#C4848A]/80 dark:text-[#D4A5A5]/70 mb-6">
            Preserve your special moments with photos, highlights, and more!
          </p>
        </div>
      )}

      {safeMemories.length > 0 && activeTab === 'favorites' && favoriteMemories.length === 0 && (
        <div className="rounded-3xl border border-dashed border-rose-200 bg-white/60 px-5 py-10 text-center dark:border-rose-400/15 dark:bg-slate-900/60">
          <Star className="mx-auto mb-3 h-8 w-8 text-[#D4A5A5]" />
          <h3 className="text-xl font-bold text-[#C4848A] dark:text-[#D4A5A5] mb-2">
            No favorited memories yet
          </h3>
          <p className="text-sm text-[#C4848A]/80 dark:text-[#D4A5A5]/70">
            Tap the star on a memory to keep it in this tab.
          </p>
        </div>
      )}
      
      {/* Timeline */}
      {years.map(year => (
        <div key={year}>
          <h3 className="text-xl font-bold text-[#C4848A] dark:text-[#D4A5A5] mb-4" style={{ fontFamily: "'Caveat', cursive" }}>
            {year}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {memoriesByYear[year].map((memory, index) => (
              <MemoryThumbnail
                key={memory.id}
                memory={memory}
                priority={index < 6}
                onClick={() => onSelectMemory(memory)}
                onToggleFavorite={() => onToggleFavorite?.(memory)}
                onDelete={() => {
                  onDeleteMemory?.(memory);
                  setDeleteReadyMemoryId('');
                }}
                deleteReady={String(deleteReadyMemoryId || '') === String(memory?.id || '')}
                onLongPress={() => setDeleteReadyMemoryId(String(memory?.id || ''))}
                darkMode={darkMode}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MemoryThumbnail = ({ memory, onClick, onToggleFavorite, onDelete, deleteReady = false, onLongPress, darkMode, priority = false }) => {
  const photoCount = memory.photos?.length || 0;
  const peopleCount = memory.taggedPeople?.length || 0;
  const reactionCount = memory.reactionCount || 0;
  const coverPhoto = getMemoryCoverUrl(memory, 'preview');
  const isFavorite = Boolean(memory?.isFavorite);
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const startLongPressTimer = () => {
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      longPressFiredRef.current = true;
      onLongPress?.();
    }, 550);
  };

  const handleCardClick = (event) => {
    if (longPressFiredRef.current) {
      event.preventDefault();
      longPressFiredRef.current = false;
      return;
    }
    onClick?.();
  };

  useEffect(() => clearLongPressTimer, []);
  
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onPointerDown={startLongPressTimer}
      onPointerUp={clearLongPressTimer}
      onPointerLeave={clearLongPressTimer}
      onPointerCancel={clearLongPressTimer}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      className="relative rounded-2xl overflow-hidden aspect-square group cursor-pointer">
      {/* Cover photo */}
      {coverPhoto ? (
        <img 
          src={coverPhoto} 
          alt={memory.title}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-rose-200 via-pink-100 to-rose-100 dark:from-rose-950 dark:via-slate-900 dark:to-stone-950" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {deleteReady && (
        <div className="absolute inset-x-3 top-3 z-30 flex items-center gap-2 rounded-2xl border border-red-200/60 bg-red-500/95 p-2 text-white shadow-xl backdrop-blur">
          <Trash2 className="h-4 w-4 shrink-0" />
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.();
            }}
            className="flex-1 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-red-600 shadow-sm"
          >
            Delete
          </button>
        </div>
      )}
       
      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <h4 className="text-white font-bold text-base mb-1 line-clamp-2">
          {memory.title}
        </h4>
        <p className="text-white/80 text-xs mb-3">
          {new Date(memory.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </p>
        
        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-white/70">
          {photoCount > 0 && <span>📸 {photoCount}</span>}
          {peopleCount > 0 && <span>👥 {peopleCount}</span>}
          {reactionCount > 0 && <span>💜 {reactionCount}</span>}
        </div>
      </div>
      
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite?.();
        }}
        className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-all ${
          isFavorite
            ? 'border-rose-200 bg-rose-400 text-white'
            : 'border-white/40 bg-black/35 text-white hover:bg-black/55'
        }`}
        aria-label={isFavorite ? 'Remove from favorite memories' : 'Favorite this memory'}
        title={isFavorite ? 'Favorited' : 'Favorite'}
      >
        <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      {/* Badge if shared */}
      {memory.isShared && (
        <div className="absolute top-14 right-3 bg-[#C4848A] text-rose-50 px-2 py-1 rounded-full text-xs font-bold">
          Shared
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MEMORY CREATOR
// ============================================================================

export const MemoryCreator = ({ onCancel, onCreate, onAddPhoto, onTagPerson, user, darkMode, initialData, autoCreateOnPhotoAdd = false, submitLabel = 'Create a Memory' }) => {
  const [step, setStep] = useState(1); // 1: photos, 2: details, 3: people, 4: preview
  const [memoryData, setMemoryData] = useState(() => createEmptyMemoryDraft(initialData || {}));
  const autoCreatedRef = useRef(false);
  const [photoOnlyMode, setPhotoOnlyMode] = useState(Boolean(autoCreateOnPhotoAdd));
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    setStep(1);
    setMemoryData(createEmptyMemoryDraft(initialData || {}));
    autoCreatedRef.current = false;
    setPhotoOnlyMode(Boolean(autoCreateOnPhotoAdd));
    setTitleError('');
  }, [initialData, autoCreateOnPhotoAdd]);

  useEffect(() => {
    if (!titleError) return;
    if (!String(memoryData.title || '').trim()) return;
    setTitleError('');
  }, [memoryData.title, titleError]);
  
  const handleNext = () => {
    if (step === 1 && photoOnlyMode) {
      if (!Array.isArray(memoryData.photos) || memoryData.photos.length === 0) return;
      const d = new Date(String(memoryData.date || ''));
      const draftTitle = String(memoryData.title || '').trim()
        || (Number.isNaN(d.getTime())
          ? 'Moment'
          : `Moment · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`);
      onCreate({
        ...memoryData,
        title: draftTitle,
        coverPhoto: getMemoryCoverUrl(memoryData),
        highlights: (memoryData.highlights || []).filter((h) => String(h || '').trim()),
      });
      return;
    }
    if (step === 2 && !String(memoryData.title || '').trim()) {
      setTitleError('Please add a title before continuing to People.');
      return;
    }
    if (step < 4) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  
  const handleCreate = () => {
    if (!memoryData.title.trim()) {
      alert('Please add a title for your memory');
      return;
    }
    onCreate({
      ...memoryData,
      coverPhoto: getMemoryCoverUrl(memoryData),
      highlights: (memoryData.highlights || []).filter((highlight) => String(highlight || '').trim()),
    });
  };

  // Photo-only save now happens on Next, not immediately on upload.
  useEffect(() => {
    return;
    if (typeof onAddPhoto === 'function') return; // parent handles quick save
    if (autoCreatedRef.current) return;
    if (step !== 1) return;
    if (!Array.isArray(memoryData.photos) || memoryData.photos.length === 0) return;

    const formatDefaultTitle = (dateStr) => {
      const d = new Date(String(dateStr || ''));
      if (Number.isNaN(d.getTime())) return 'Moment';
      return `Moment · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    };

    const draftTitle = String(memoryData.title || '').trim() || formatDefaultTitle(memoryData.date);
    const quick = {
      ...memoryData,
      title: draftTitle,
      coverPhoto: getMemoryCoverUrl(memoryData),
      highlights: (memoryData.highlights || []).filter((h) => String(h || '').trim()),
    };
    autoCreatedRef.current = true;
    onCreate(quick);
  }, [photoOnlyMode, step, memoryData.photos, memoryData.coverPhoto, memoryData.title, memoryData.date, memoryData.highlights, onCreate, onAddPhoto]);
  
  return (
    <div className="memory-creator w-full">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                s === step
                  ? 'bg-[#C4848A] text-rose-50 scale-110'
                  : s < step
                    ? 'bg-[#D4A5A5] text-rose-50'
                    : 'bg-stone-100 dark:bg-gray-700 text-stone-400'
              }`}>
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-1 mx-2 ${
                  s < step ? 'bg-rose-500' : 'bg-stone-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Photos</span>
          <span>Details</span>
          <span>People</span>
          <span>Preview</span>
        </div>
      </div>
      
      {/* Steps */}
      {step === 1 && (
        <MemoryPhotosStep
          data={memoryData}
          onChange={setMemoryData}
          onAddPhoto={onAddPhoto}
          darkMode={darkMode}
          quickSaveOnPhotoAdd={photoOnlyMode}
          photoOnlyMode={photoOnlyMode}
          onTogglePhotoOnlyMode={() => setPhotoOnlyMode((prev) => !prev)}
        />
      )}
      
      {step === 2 && (
        <MemoryBasicsStep
          data={memoryData}
          onChange={setMemoryData}
          titleError={titleError}
          darkMode={darkMode}
        />
      )}
      
      {step === 3 && (
        <MemoryPeopleStep
          data={memoryData}
          onChange={setMemoryData}
          onTagPerson={onTagPerson}
          darkMode={darkMode}
        />
      )}
      
      {step === 4 && (
        <MemoryPreviewStep
          data={memoryData}
          darkMode={darkMode}
        />
      )}
      
      {/* Navigation */}
      <div className="mt-8 pt-3">
        <div className={`flex gap-3 ${step === 4 ? 'items-center' : ''}`}>
        {step > 1 && (
          <button
            onClick={handleBack}
            className={`${step === 4 ? 'w-28 shrink-0' : 'flex-1'} py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                     font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all`}
          >
            Back
          </button>
        )}
        
        {step < 4 ? (
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-[#D4A5A5] dark:bg-[#D4A5A5]
                     text-rose-50 font-semibold hover:bg-[#C4848A] dark:hover:bg-[#C4848A] hover:shadow-xl transition-all">
            Next
          </button>
        ) : (
          <button
            onClick={handleCreate}
            className="flex-1 min-w-0 py-3 rounded-xl bg-[#D4A5A5] dark:bg-[#C4848A]
                     text-rose-50 font-bold hover:bg-[#C4848A] dark:hover:bg-[#C4848A] hover:shadow-xl transition-all flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            {submitLabel}
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

// Step 2: Details
const MemoryBasicsStep = ({ data, onChange, titleError, darkMode }) => {
  const addHighlight = () => {
    onChange({ ...data, highlights: [...data.highlights, ''] });
  };
  
  const updateHighlight = (index, value) => {
    const newHighlights = [...data.highlights];
    newHighlights[index] = value;
    onChange({ ...data, highlights: newHighlights });
  };
  
  const removeHighlight = (index) => {
    onChange({ ...data, highlights: data.highlights.filter((_, i) => i !== index) });
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add the details after</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Give this moment a title, location, and the little details that make it worth keeping.
      </p>
      
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="Emma's 1st Birthday Party"
          className={`w-full px-4 py-3 rounded-xl border ${titleError ? 'border-[#D4A5A5] dark:border-[#D4A5A5]' : 'border-gray-300 dark:border-gray-600'} 
                    bg-white dark:bg-gray-800 text-[#C4848A] dark:text-[#D4A5A5]
                    focus:ring-2 focus:ring-[#D4A5A5] outline-none text-base`}
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
        {titleError && (
          <p className="mt-2 text-sm font-medium text-[#C4848A] dark:text-[#D4A5A5]">
            {titleError}
          </p>
        )}
      </div>
      
      {/* Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Date
        </label>
        <div className="w-full min-w-0 overflow-hidden">
          <input
            type="date"
            value={data.date}
            onChange={(e) => onChange({ ...data, date: e.target.value })}
            className="block w-full max-w-full min-w-0 box-border appearance-none px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-800 text-[#C4848A] dark:text-[#D4A5A5]
                      focus:ring-2 focus:ring-[#D4A5A5] outline-none"
            style={{ fontSize: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'block' }}
          />
        </div>
      </div>
      
      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Location (optional)
        </label>
        <div className="mb-3 flex flex-wrap gap-2">
          {['Home', 'Work'].map((preset) => {
            const active = String(data.location || '').trim().toLowerCase() === preset.toLowerCase();
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange({ ...data, location: preset })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#D4A5A5] text-rose-50 shadow-sm'
                    : 'bg-rose-50 text-[#C4848A] hover:bg-rose-100 dark:bg-rose-950/30 dark:text-[#D4A5A5] dark:hover:bg-rose-900/50'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
        <MemoryPlacesAutocomplete
          value={data.location}
          onSelect={(nextLocation) => onChange({ ...data, location: nextLocation })}
          placeholder="Home, Park, Restaurant..."
          darkMode={darkMode}
        />
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Description (optional)
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="What made this day special?"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-[#C4848A] dark:text-[#D4A5A5]
                   focus:ring-2 focus:ring-[#D4A5A5] outline-none resize-none text-base"
          style={{ fontSize: '16px' }}
        />
      </div>
      
      {/* Highlights */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Special Moments (optional)
        </label>
        <div className="space-y-2">
          {data.highlights.map((highlight, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <input
                type="text"
                value={highlight}
                onChange={(e) => updateHighlight(index, e.target.value)}
                placeholder="Emma's first cake bite was hilarious!"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-800 text-[#C4848A] dark:text-[#D4A5A5]
                         focus:ring-2 focus:ring-[#D4A5A5] outline-none text-base"
                style={{ fontSize: '16px' }}
              />
              {data.highlights.length > 1 && (
                <button
                  onClick={() => removeHighlight(index)}
                  className="p-2 text-gray-400 hover:text-red-500">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addHighlight}
          className="mt-3 text-sm text-[#C4848A] dark:text-[#D4A5A5] font-semibold hover:underline">
          + Add another moment
        </button>
      </div>
    </div>
  );
};

// Step 1: Photos
const MemoryPhotosStep = ({
  data,
  onChange,
  onAddPhoto,
  darkMode,
  quickSaveOnPhotoAdd = false,
  photoOnlyMode = false,
  onTogglePhotoOnlyMode,
}) => {
  const fileInputRef = useRef(null);
  const cropDragRef = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const [cropTargetPhotoId, setCropTargetPhotoId] = useState(null);
  const [cropImageUrl, setCropImageUrl] = useState('');
  const [cropNatural, setCropNatural] = useState({ width: 0, height: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });

  const closeCropModal = () => {
    setCropTargetPhotoId(null);
    setCropImageUrl('');
    setCropNatural({ width: 0, height: 0 });
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    cropDragRef.current = { active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 };
  };

  const openCropModalForPhoto = (photoOrId) => {
    const targetPhoto = typeof photoOrId === 'object' && photoOrId
      ? photoOrId
      : (Array.isArray(data.photos) ? data.photos : []).find((photo) => photo.id === photoOrId);
    if (!targetPhoto?.url) return;
    setCropTargetPhotoId(targetPhoto.id);
    setCropImageUrl(String(targetPhoto.url || '').trim());
    setCropNatural({ width: 0, height: 0 });
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    cropDragRef.current = { active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 };
  };

  const startCropDragAt = (clientX, clientY) => {
    const base = clampMemoryPhotoCropOffset(cropNatural, cropZoom, cropOffset);
    cropDragRef.current = {
      active: true,
      startX: clientX,
      startY: clientY,
      baseX: base.x,
      baseY: base.y,
    };
  };

  const moveCropDragAt = (clientX, clientY) => {
    const drag = cropDragRef.current;
    if (!drag.active) return;
    const nextOffset = clampMemoryPhotoCropOffset(cropNatural, cropZoom, {
      x: drag.baseX + (clientX - drag.startX),
      y: drag.baseY + (clientY - drag.startY),
    });
    setCropOffset(nextOffset);
  };

  const endCropDrag = () => {
    cropDragRef.current = {
      ...cropDragRef.current,
      active: false,
    };
  };
  
  const handleAddPhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newPhotos = await Promise.all(
      files.map(async (file) => {
        const url = await readFileAsDataUrl(file);
        return {
          id: Date.now() + Math.random(),
          url,
          caption: '',
          fileName: file.name || 'Photo',
        };
      })
    );
    const updated = { ...data, photos: [...data.photos, ...newPhotos] };
    onChange(updated);
    if (quickSaveOnPhotoAdd && typeof onAddPhoto === 'function') {
      try { onAddPhoto(newPhotos, updated); } catch {}
    }
    if (newPhotos.length === 1) {
      openCropModalForPhoto(newPhotos[0]);
    }
    e.target.value = '';
  };
  
  const removePhoto = (photoId) => {
    onChange({ ...data, photos: data.photos.filter(p => p.id !== photoId) });
  };
  
  const updatePhotoCaption = (photoId, caption) => {
    onChange({
      ...data,
      photos: data.photos.map(p => p.id === photoId ? { ...p, caption } : p)
    });
  };
  
  const setCoverPhoto = (photoId) => {
    const photo = data.photos.find(p => p.id === photoId);
    onChange({ ...data, coverPhoto: photo.url });
  };

  const applyPhotoCrop = async () => {
    if (!cropTargetPhotoId || !cropImageUrl) return;
    const img = await new Promise((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = cropImageUrl;
    });
    if (!img) {
      alert('Could not process image crop.');
      return;
    }

    const natural = {
      width: Number(img?.naturalWidth || cropNatural.width || 0),
      height: Number(img?.naturalHeight || cropNatural.height || 0),
    };
    if (!natural.width || !natural.height) {
      alert('Could not read image dimensions.');
      return;
    }

    const metrics = getMemoryPhotoCropMetrics(natural, cropZoom);
    const safeOffset = clampMemoryPhotoCropOffset(natural, cropZoom, cropOffset);
    const srcCropW = metrics.width / metrics.scale;
    const srcCropH = metrics.height / metrics.scale;
    const srcX = Math.max(0, Math.min(natural.width - srcCropW, ((natural.width - srcCropW) / 2) - (safeOffset.x / metrics.scale)));
    const srcY = Math.max(0, Math.min(natural.height - srcCropH, ((natural.height - srcCropH) / 2) - (safeOffset.y / metrics.scale)));

    const canvas = document.createElement('canvas');
    canvas.width = metrics.targetW;
    canvas.height = metrics.targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Could not process image crop.');
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, srcX, srcY, srcCropW, srcCropH, 0, 0, metrics.targetW, metrics.targetH);
    const croppedUrl = canvas.toDataURL('image/jpeg', 0.86);

    onChange({
      ...data,
      coverPhoto: String(data.coverPhoto || '').trim() === String(cropImageUrl || '').trim() ? croppedUrl : data.coverPhoto,
      photos: data.photos.map((photo) => (
        photo.id === cropTargetPhotoId
          ? { ...photo, url: croppedUrl }
          : photo
      )),
    });
    closeCropModal();
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Start with the photos</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Pick the images first, then add the story and details around them.
      </p>

      <button
        type="button"
        onClick={() => onTogglePhotoOnlyMode?.()}
        className={`w-full flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
          photoOnlyMode
            ? 'border-rose-300 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
            : 'border-stone-200 bg-white/70 dark:border-gray-700 dark:bg-slate-900'
        }`}
      >
        <div className={`mt-0.5 flex h-5 min-h-[1.25rem] w-5 min-w-[1.25rem] items-center justify-center rounded-md border transition-all ${
          photoOnlyMode
            ? 'border-[#C4848A] bg-[#D4A5A5] text-rose-50'
            : 'border-stone-300 bg-white text-transparent dark:border-gray-600 dark:bg-slate-800'
        }`}>
          <Check className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            Photo only
          </div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Save right after adding photos and skip details, people, and preview.
          </div>
        </div>
      </button>
      
      {/* Upload / cover area */}
      {data.photos.length > 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative block w-full overflow-hidden rounded-2xl border border-rose-200 dark:border-rose-700 bg-white dark:bg-slate-900 text-left transition-all hover:shadow-lg"
        >
          <div
            className="h-56 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${getMemoryCoverUrl(data, 'display')})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">
                {data.photos.length} photo{data.photos.length !== 1 ? 's' : ''} added
              </div>
              <div className="mt-1 text-xs text-white/80">
                Tap here to add more photos
              </div>
            </div>
            <div className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm">
              Add more
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-6 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-600
                   bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30
                   transition-all flex flex-col items-center justify-center gap-2">
          <Camera className="w-8 h-8 text-stone-500 dark:text-stone-400" />
          <span className="font-semibold text-[#C4848A] dark:text-[#D4A5A5]">
            Add Photos
          </span>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            Tap to select from your device
          </span>
        </button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddPhotos}
        className="hidden"
      />
      
      {/* Photo grid */}
      {data.photos.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {data.photos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <img
                  src={getMemoryPhotoUrl(photo, 'display')}
                  alt={`Photo ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-square object-cover rounded-xl"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-xl transition-all" />
                
                {/* Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openCropModalForPhoto(photo.id)}
                    className="p-2 bg-white rounded-full hover:bg-rose-50 transition-all"
                    title="Adjust crop">
                    <Edit2 className="w-4 h-4 text-[#C4848A]" />
                  </button>
                  <button
                    onClick={() => setCoverPhoto(photo.id)}
                    className="p-2 bg-white rounded-full hover:bg-rose-50 transition-all"
                    title="Set as cover">
                    <Sparkles className="w-4 h-4 text-[#C4848A]" />
                  </button>
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="p-2 bg-white rounded-full hover:bg-red-50 transition-all"
                    title="Remove">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                
                {/* Cover badge */}
                {data.coverPhoto === photo.url && (
                  <div className="absolute top-2 left-2 bg-[#C4848A] text-rose-50 px-2 py-1 rounded-full text-xs font-bold">
                    Cover
                  </div>
                )}
                
                {/* Caption */}
                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                  placeholder="Add caption (optional)"
                  className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg
                           bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
                           text-sm text-gray-900 dark:text-white border-0 outline-none
                           focus:ring-2 focus:ring-rose-400"
                  style={{ fontSize: '14px' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {cropTargetPhotoId && cropImageUrl && (
        <div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white dark:bg-slate-950 border border-white/10 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">Crop for polaroid</div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Drag to choose what shows in the photo of the day window.
                </div>
              </div>
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-xl p-2 text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="relative mx-auto mt-5 overflow-hidden rounded-[22px] border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 touch-none select-none"
              style={{ width: `${MEMORY_PHOTO_CROP_FRAME.width}px`, height: `${MEMORY_PHOTO_CROP_FRAME.height}px` }}
              onMouseDown={(e) => {
                e.preventDefault();
                startCropDragAt(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => moveCropDragAt(e.clientX, e.clientY)}
              onMouseUp={endCropDrag}
              onMouseLeave={endCropDrag}
              onTouchStart={(e) => {
                const touch = e.touches?.[0];
                if (!touch) return;
                startCropDragAt(touch.clientX, touch.clientY);
              }}
              onTouchMove={(e) => {
                const touch = e.touches?.[0];
                if (!touch) return;
                moveCropDragAt(touch.clientX, touch.clientY);
              }}
              onTouchEnd={endCropDrag}
              onTouchCancel={endCropDrag}
            >
              <img
                src={cropImageUrl}
                alt="Crop preview"
                className="absolute max-w-none pointer-events-none"
                onLoad={(e) => {
                  const natural = {
                    width: Number(e.currentTarget.naturalWidth || 0),
                    height: Number(e.currentTarget.naturalHeight || 0),
                  };
                  setCropNatural(natural);
                  setCropOffset({ x: 0, y: 0 });
                }}
                style={{
                  width: `${getMemoryPhotoCropMetrics(cropNatural, cropZoom).renderedW}px`,
                  height: `${getMemoryPhotoCropMetrics(cropNatural, cropZoom).renderedH}px`,
                  left: `calc(50% + ${clampMemoryPhotoCropOffset(cropNatural, cropZoom, cropOffset).x}px)`,
                  top: `calc(50% + ${clampMemoryPhotoCropOffset(cropNatural, cropZoom, cropOffset).y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                <span>Zoom</span>
                <span>{cropZoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={cropZoom}
                onChange={(e) => {
                  const nextZoom = Number(e.target.value || 1);
                  setCropZoom(nextZoom);
                  setCropOffset((prev) => clampMemoryPhotoCropOffset(cropNatural, nextZoom, prev));
                }}
                className="mt-3 w-full accent-rose-400"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeCropModal}
                className="flex-1 rounded-2xl bg-gray-100 dark:bg-white/[0.06] px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Keep original
              </button>
              <button
                type="button"
                onClick={applyPhotoCrop}
                className="flex-1 rounded-2xl bg-[#D4A5A5] px-4 py-3 text-sm font-semibold text-rose-50 hover:bg-[#C4848A] transition-colors"
              >
                Save crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Step 3: People
const MemoryPeopleStep = ({ data, onChange, onTagPerson, darkMode }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  
  const addPerson = () => {
    if (!newPersonName.trim()) return;
    
    const newPerson = {
      id: Date.now(),
      name: newPersonName.trim(),
      avatar: null, // Could generate initials avatar
    };
    
    onChange({ ...data, taggedPeople: [...data.taggedPeople, newPerson] });
    setNewPersonName('');
    setShowAddForm(false);
  };
  
  const removePerson = (personId) => {
    onChange({ ...data, taggedPeople: data.taggedPeople.filter(p => p.id !== personId) });
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Who was there?</h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Tag people to share this memory with them and let them add photos too!
      </p>
      
      {/* Add person button */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-gray-600
                   hover:border-rose-500 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20
                   transition-all flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Add Person</span>
        </button>
      ) : (
        <div className="space-y-3">
          <input
            autoFocus
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addPerson()}
            placeholder="Enter name..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-rose-400 outline-none text-base"
            style={{ fontSize: '16px' }}
          />
          <div className="flex gap-2">
            <button
              onClick={addPerson}
              className="flex-1 py-2 rounded-xl bg-[#D4A5A5] text-rose-50 font-semibold hover:bg-[#C4848A]">
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewPersonName('');
              }}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Tagged people */}
      {data.taggedPeople.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {data.taggedPeople.length} person{data.taggedPeople.length !== 1 ? 's' : ''} tagged
          </p>
          
          <div className="space-y-2">
            {data.taggedPeople.map(person => (
              <div
                key={person.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 
                         border border-gray-200 dark:border-gray-700">
                <PersonAvatar person={person} />
                <span className="flex-1 font-medium text-gray-900 dark:text-white">
                  {person.name}
                </span>
                <button
                  onClick={() => removePerson(person.id)}
                  className="p-2 text-gray-400 hover:text-red-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Step 4: Preview
const MemoryPreviewStep = ({ data, darkMode }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Preview your memory</h3>
      
      <div className="rounded-2xl overflow-hidden border-2 border-rose-200 dark:border-rose-700">
        {/* Cover */}
        <div className="relative h-48">
          {getMemoryCoverUrl(data) ? (
            <img src={getMemoryCoverUrl(data, 'preview')} alt={data.title} className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-200 via-pink-100 to-rose-100 dark:from-rose-950 dark:via-slate-900 dark:to-stone-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
            <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(data.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
              {data.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {data.location}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4 bg-rose-50 dark:bg-rose-950/20">
          {/* Description */}
          {data.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                About
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {data.description}
              </p>
            </div>
          )}
          
          {/* Highlights */}
          {data.highlights.filter(h => h.trim()).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Special Moments
              </h4>
              <div className="space-y-2">
                {data.highlights.filter(h => h.trim()).map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-lg">✨</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Photos */}
          {data.photos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Photos ({data.photos.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {data.photos.slice(0, 6).map((photo, idx) => (
                  <img
                    key={photo.id}
                    src={getMemoryPhotoUrl(photo, 'preview')}
                    alt={`Photo ${idx + 1}`}
                    loading={idx < 3 ? "eager" : "lazy"}
                    fetchPriority={idx < 3 ? "high" : "auto"}
                    decoding="async"
                    className="aspect-square object-cover rounded-lg"
                  />
                ))}
                {data.photos.length > 6 && (
                <div className="aspect-square rounded-lg bg-rose-100 dark:bg-rose-900/30 
                                flex items-center justify-center">
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-200">
                      +{data.photos.length - 6}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* People */}
          {data.taggedPeople.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Who Was There
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.taggedPeople.map(person => (
                  <div key={person.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full
                                                  bg-rose-50 dark:bg-rose-950/30">
                    <PersonAvatar
                      person={person}
                      className="w-6 h-6"
                      textClassName="text-white text-xs font-bold"
                    />
                    <span className="text-sm font-medium text-rose-700 dark:text-rose-200">
                      {person.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MEMORY VIEWER
// ============================================================================

const MemoryViewer = ({ memory, onClose, onEdit, onDelete, onReact, onComment, onShare, user, darkMode }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userReaction, setUserReaction] = useState(memory.userReaction || null);
  
  const slides = [
    { type: 'cover', data: memory },
    ...memory.photos.map(photo => ({ type: 'photo', data: photo })),
    ...(memory.highlights?.filter(h => h.trim()).length > 0 ? [{ type: 'highlights', data: memory.highlights }] : []),
    ...(memory.taggedPeople?.length > 0 ? [{ type: 'people', data: memory.taggedPeople }] : []),
  ];
  const slideCount = slides.length;
  const currentSlideData = slides[currentSlide] || slides[0] || null;
  
  const nextSlide = () => {
    if (slideCount <= 1) return;
    setCurrentSlide((prev) => (prev + 1 >= slideCount ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    if (slideCount <= 1) return;
    setCurrentSlide((prev) => (prev - 1 < 0 ? slideCount - 1 : prev - 1));
  };

  useEffect(() => {
    setCurrentSlide((prev) => {
      if (!slideCount) return 0;
      return Math.min(prev, slideCount - 1);
    });
  }, [slideCount]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [memory?.id]);

  useEffect(() => {
    if (!slideCount) return;
    const preloadIndexes = [currentSlide, currentSlide + 1, currentSlide + 2]
      .map((index) => (index + slideCount) % slideCount);
    const seen = new Set();
    preloadIndexes.forEach((index) => {
      const slide = slides[index];
      if (!slide) return;
      const url = slide.type === 'cover'
        ? getMemoryCoverUrl(slide.data, 'display')
        : slide.type === 'photo'
          ? getMemoryPhotoUrl(slide.data, 'display')
          : '';
      if (!url || seen.has(url)) return;
      seen.add(url);
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
    });
  }, [currentSlide, slideCount, slides]);
  
  const handleReact = async (reactionType) => {
    setUserReaction(reactionType);
    await onReact(memory.id, reactionType);
  };
  
  const handleComment = async () => {
    if (!newComment.trim()) return;
    await onComment(memory.id, newComment.trim());
    setNewComment('');
  };
  
  return (
    <div className="memory-viewer absolute inset-0 z-50 overflow-hidden bg-black">
      {/* Header */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-50 px-4 pt-[max(0.5rem,calc(env(safe-area-inset-top)+0.1rem))] pb-3 bg-gradient-to-b from-black/85 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all">
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShare(memory)}
              className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all">
              <Share2 className="w-5 h-5 text-white" />
            </button>
            
            {memory.canEdit && (
              <button
                onClick={onEdit}
                className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all">
                <Edit2 className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Slideshow */}
      <div className="pointer-events-none relative w-full h-full flex items-center justify-center">
        {currentSlideData && (
          <div className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-200 opacity-100">
            {currentSlideData.type === 'cover' && <CoverSlide memory={currentSlideData.data} />}
            {currentSlideData.type === 'photo' && <PhotoSlide photo={currentSlideData.data} />}
            {currentSlideData.type === 'highlights' && <HighlightsSlide highlights={currentSlideData.data} memory={memory} />}
            {currentSlideData.type === 'people' && <PeopleSlide people={currentSlideData.data} memory={memory} />}
          </div>
        )}
        
        {/* Navigation */}
        {slideCount > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={prevSlide}
              className="pointer-events-auto absolute left-4 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 transition-all hover:bg-white/30 active:scale-95 sm:left-6"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            
            <button
              type="button"
              aria-label="Next slide"
              onClick={nextSlide}
              className="pointer-events-auto absolute right-4 top-1/2 z-40 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 transition-all hover:bg-white/30 active:scale-95 sm:right-6"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
            
            {/* Dots */}
            <div className="pointer-events-auto absolute bottom-[max(4.2rem,calc(env(safe-area-inset-bottom)+3.1rem))] left-1/2 z-40 flex -translate-x-1/2 gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Bottom actions */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pt-6 pb-[max(0.5rem,calc(env(safe-area-inset-bottom)+0.35rem))] bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="mx-auto flex w-full max-w-[14rem] items-center justify-between">
          <ReactionButton
            icon={<Heart className="w-6 h-6" />}
            count={memory.reactionCount || 0}
            active={userReaction === 'love'}
            onClick={() => handleReact('love')}
          />
          
          <ReactionButton
            icon={<MessageCircle className="w-6 h-6" />}
            count={memory.commentCount || 0}
            onClick={() => setShowComments(true)}
          />
        </div>
      </div>
      
      {/* Comments sheet */}
      {showComments && (
        <CommentsSheet
          memory={memory}
          onClose={() => setShowComments(false)}
          newComment={newComment}
          setNewComment={setNewComment}
          onSubmit={handleComment}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

const CoverSlide = ({ memory }) => (
  <div className="w-full h-full relative pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] pb-[max(3.25rem,calc(env(safe-area-inset-bottom)+2.5rem))] px-2">
    <div className="absolute inset-x-2 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] bottom-[max(3.25rem,calc(env(safe-area-inset-bottom)+2.5rem))] rounded-[28px] bg-gradient-to-b from-rose-950 via-slate-900 to-stone-950" />
    <div className="absolute inset-x-2 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] bottom-[max(3.25rem,calc(env(safe-area-inset-bottom)+2.5rem))] rounded-[28px] bg-gradient-to-t from-black/28 via-transparent to-white/5" />

    <div className="absolute inset-x-2 top-[max(5rem,calc(env(safe-area-inset-top)+4rem))] bottom-[max(6.25rem,calc(env(safe-area-inset-bottom)+5rem))] flex flex-col items-center justify-center text-center text-white px-6 py-10 sm:px-8">
      <div className="max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">{memory.title}</h1>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm sm:text-base mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          {new Date(memory.date).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
        {memory.location && (
          <>
            <span>•</span>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              {memory.location}
            </div>
          </>
        )}
      </div>
      {memory.taggedPeople?.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {memory.taggedPeople.slice(0, 5).map((person, idx) => (
            <div key={person.id} className="border-2 border-white rounded-full overflow-hidden">
              <PersonAvatar person={person} className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
          ))}
          {memory.taggedPeople.length > 5 && (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center 
                          text-white font-bold border-2 border-white">
              +{memory.taggedPeople.length - 5}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  </div>
);

const PhotoSlide = ({ photo }) => (
  <div className="w-full h-full relative flex items-center justify-center bg-black px-2 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] pb-[max(3.25rem,calc(env(safe-area-inset-bottom)+2.5rem))]">
    <img src={getMemoryPhotoUrl(photo, 'display')} alt={photo.caption} loading="eager" fetchPriority="high" decoding="async" className="max-w-full max-h-full rounded-[28px] object-contain" />
    <div className="pointer-events-none absolute inset-x-2 top-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] h-20 rounded-t-[28px] bg-gradient-to-b from-black/50 via-black/18 to-transparent" />
    <div className="pointer-events-none absolute inset-x-2 bottom-[max(3.25rem,calc(env(safe-area-inset-bottom)+2.5rem))] h-24 rounded-b-[28px] bg-gradient-to-t from-black/70 via-black/24 to-transparent" />
    {photo.caption && (
      <div className="absolute left-2 right-2 bottom-[max(6.25rem,calc(env(safe-area-inset-bottom)+5rem))] rounded-b-[28px] p-6 bg-gradient-to-t from-black/90 to-transparent">
        <p className="text-white text-center">{photo.caption}</p>
      </div>
    )}
  </div>
);

const HighlightsSlide = ({ highlights, memory }) => (
  <div className="w-full h-full flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-950 to-rose-950">
    <div className="max-w-2xl w-full">
      <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-6 sm:mb-8">Special Moments</h2>
      <div className="space-y-4 sm:space-y-6">
        {highlights.filter(h => h.trim()).map((highlight, idx) => (
          <div key={idx} className="flex items-start gap-3 sm:gap-4 bg-rose-500/12 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-rose-300/10">
            <span className="text-2xl sm:text-3xl">✨</span>
            <p className="text-base sm:text-xl text-white flex-1">{highlight}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PeopleSlide = ({ people, memory }) => (
  <div className="w-full h-full flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-950 to-rose-950">
    <div className="max-w-2xl w-full">
      <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-6 sm:mb-8">Who Was There</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {people.map(person => (
          <div key={person.id} className="text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border-4 border-white/30 overflow-hidden">
              <PersonAvatar person={person} className="w-16 h-16 sm:w-24 sm:h-24" textClassName="text-white text-2xl sm:text-3xl font-bold" fallbackClassName="bg-white/20 backdrop-blur-sm" />
            </div>
            <p className="text-sm sm:text-base text-white font-semibold">{person.name}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ReactionButton = ({ icon, count, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center gap-1 transition-all ${
      disabled ? 'opacity-50 cursor-default' : active ? 'text-pink-500' : 'text-white hover:scale-110'
    }`}>
    {icon}
    {count > 0 && (
      <span className="text-xs font-bold">{count > 999 ? '999+' : count}</span>
    )}
  </button>
);

const CommentsSheet = ({ memory, onClose, newComment, setNewComment, onSubmit, darkMode }) => (
  <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
    <div
      className="w-full max-h-[80vh] bg-rose-50 dark:bg-rose-950/20 rounded-t-3xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="p-4 border-b border-rose-200 dark:border-rose-700/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-[#C4848A] dark:text-[#D4A5A5]">
            Comments ({memory.comments?.length || 0})
          </h3>
          <button onClick={onClose} className="p-2 text-[#D4A5A5] hover:text-[#C4848A] dark:hover:text-[#D4A5A5]">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Comments list */}
      <div className="overflow-y-auto max-h-[50vh] p-4 space-y-4">
        {memory.comments?.map(comment => (
          <div key={comment.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4A5A5] flex items-center justify-center
                          text-rose-50 font-bold shrink-0">
              {comment.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="bg-rose-100/80 dark:bg-rose-900/25 rounded-2xl px-4 py-2 border border-rose-200 dark:border-rose-700/25">
                <p className="font-semibold text-sm text-[#C4848A] dark:text-[#D4A5A5]">
                  {comment.userName}
                </p>
                <p className="text-[#C4848A]/90 dark:text-[#D4A5A5]/80">{comment.text}</p>
              </div>
              <p className="text-xs text-[#C4848A]/70 mt-1 ml-4">
                {new Date(comment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        
        {(!memory.comments || memory.comments.length === 0) && (
          <div className="text-center py-8 text-rose-700/70 dark:text-[#D4A5A5]/70">
            No comments yet. Be the first!
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-rose-200 dark:border-rose-700/30 bg-rose-50 dark:bg-rose-950/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2 rounded-full border border-rose-200 dark:border-rose-700/30 
                     bg-white dark:bg-rose-950/20 text-[#C4848A] dark:text-[#D4A5A5] outline-none text-base"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={onSubmit}
            disabled={!newComment.trim()}
            className="px-6 py-2 rounded-full bg-[#D4A5A5] text-rose-50 font-semibold
                     hover:bg-[#C4848A] disabled:opacity-50 disabled:cursor-not-allowed">
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

// Prompt to create memory after event
const CreateMemoryPrompt = ({ event, onCreateMemory, onDismiss }) => (
  <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-slate-950/30
                border border-rose-200 dark:border-rose-700/30 p-4 mb-4">
    <div className="flex items-start gap-3 mb-3">
      <Sparkles className="w-6 h-6 text-[#C4848A] dark:text-[#D4A5A5] shrink-0 mt-1" />
      <div className="flex-1">
        <h4 className="font-bold text-[#C4848A] dark:text-[#D4A5A5] mb-1">
          Turn this into a Memory?
        </h4>
        <p className="text-sm text-[#C4848A]/80 dark:text-[#D4A5A5]/70">
          Preserve "{event.title}" forever with photos, highlights, and more!
        </p>
      </div>
    </div>

    <div className="flex gap-2">
      <button
        onClick={onCreateMemory}
        className="flex-1 py-2 rounded-xl bg-[#D4A5A5] dark:bg-[#D4A5A5]
                 text-rose-50 font-semibold hover:bg-[#C4848A] hover:shadow-lg transition-all">
        ✨ Create a Memory
      </button>
      <button
        onClick={onDismiss}
        className="px-4 py-2 rounded-xl bg-white/70 dark:bg-gray-800
                 text-rose-700 dark:text-rose-200 hover:bg-white dark:hover:bg-gray-700">
        Later
      </button>
    </div>
  </div>
);

// ============================================================================
// EXPORT
// ============================================================================

export default MemorySystem;
export {
  MemoriesGallery,
  MemoryViewer,
  CreateMemoryPrompt,
  MemoryThumbnail,
};
