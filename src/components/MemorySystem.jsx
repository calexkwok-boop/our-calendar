// MemorySystem.jsx - Complete memory/keepsake system for special events
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, Heart, MessageCircle, Share2, X,
  ChevronLeft, ChevronRight, Plus, Check, Eye, Calendar, MapPin, Edit2, Trash2, Star
} from 'lucide-react';

const createEmptyMemoryDraft = (overrides = {}) => ({
  title: '',
  description: '',
  highlights: [''],
  photos: [],
  taggedPeople: [],
  date: new Date().toISOString().split('T')[0],
  location: '',
  coverPhoto: '',
  ...overrides,
});

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

const getPersonAvatarUrl = (person) => String(
  person?.avatarUrl
  || person?.avatar_url
  || person?.photoUrl
  || person?.photo_url
  || ''
).trim();

const PersonAvatar = ({ person, className = 'w-10 h-10', textClassName = 'text-white font-bold', fallbackClassName = 'bg-purple-500' }) => {
  const avatarUrl = getPersonAvatarUrl(person);
  const initial = String(person?.name || '?').trim().charAt(0).toUpperCase() || '?';
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
    setInput(value || '');
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
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none text-base"
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
              className="w-full border-b border-gray-100 px-3 py-2 text-left text-xs hover:bg-purple-50 dark:border-gray-700 dark:hover:bg-purple-900/30 last:border-0"
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
    setActiveView(view);
  }, [view]);

  useEffect(() => {
    setSelectedMemory(currentMemory);
  }, [currentMemory]);

  useEffect(() => {
    if (!selectedMemory?.id) return;
    const refreshed = (memories || []).find((memory) => String(memory?.id || '') === String(selectedMemory.id || ''));
    if (refreshed) setSelectedMemory(refreshed);
  }, [memories, selectedMemory]);
  
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
              coverPhoto: String(memoryData?.coverPhoto || photos?.[0]?.url || '').trim(),
              taggedPeople: Array.isArray(memoryData?.taggedPeople) ? memoryData.taggedPeople : [],
              date: String(memoryData?.date || memory?.date || new Date().toISOString().split('T')[0]).trim(),
              location: String(memoryData?.location || '').trim(),
            }));
            setSelectedMemory((prev) => ({
              ...(prev || selectedMemory),
              ...memoryData,
              coverPhoto: String(memoryData?.coverPhoto || photos?.[0]?.url || '').trim(),
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
  // Group memories by year
  const memoriesByYear = safeMemories.reduce((acc, memory) => {
    const year = new Date(memory.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(memory);
    return acc;
  }, {});
  
  const years = Object.keys(memoriesByYear).sort((a, b) => b - a);
  
  return (
    <div className="memories-gallery w-full space-y-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">💫</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">
          Your Memories
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {safeMemories.length} special moment{safeMemories.length !== 1 ? 's' : ''} preserved
        </p>
      </div>
      
      {/* Create new button */}
      <div className="flex gap-3">
        <button
          onClick={onCreateNew}
          className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 
                     text-white font-bold text-base hover:shadow-xl transition-all
                     flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6" />
          Create a Memory
        </button>
        {typeof onClose === 'function' && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl px-5 py-3.5 bg-white text-gray-700 font-semibold border border-gray-200 shadow-sm transition-all hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-100 dark:border-white/10 dark:hover:bg-slate-800"
          >
            Close
          </button>
        )}
      </div>
      
      {/* Empty state */}
      {safeMemories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No memories yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Preserve your special moments with photos, highlights, and more!
          </p>
        </div>
      )}
      
      {/* Timeline */}
      {years.map(year => (
        <div key={year}>
          <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4">
            {year}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {memoriesByYear[year].map(memory => (
              <MemoryThumbnail
                key={memory.id}
                memory={memory}
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

const MemoryThumbnail = ({ memory, onClick, onToggleFavorite, onDelete, deleteReady = false, onLongPress, darkMode }) => {
  const photoCount = memory.photos?.length || 0;
  const peopleCount = memory.taggedPeople?.length || 0;
  const reactionCount = memory.reactionCount || 0;
  const coverPhoto = String(memory?.coverPhoto || memory?.photos?.[0]?.url || '').trim();
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
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

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
            ? 'border-amber-200 bg-amber-400 text-white'
            : 'border-white/40 bg-black/35 text-white hover:bg-black/55'
        }`}
        aria-label={isFavorite ? 'Remove from favorite memories' : 'Favorite this memory'}
        title={isFavorite ? 'Favorited' : 'Favorite'}
      >
        <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      {/* Badge if shared */}
      {memory.isShared && (
        <div className="absolute top-14 right-3 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
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

  useEffect(() => {
    setStep(1);
    setMemoryData(createEmptyMemoryDraft(initialData || {}));
    autoCreatedRef.current = false;
    setPhotoOnlyMode(Boolean(autoCreateOnPhotoAdd));
  }, [initialData, autoCreateOnPhotoAdd]);
  
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
        coverPhoto: memoryData.coverPhoto || memoryData.photos?.[0]?.url || '',
        highlights: (memoryData.highlights || []).filter((h) => String(h || '').trim()),
      });
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
      coverPhoto: memoryData.coverPhoto || memoryData.photos?.[0]?.url || '',
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
      coverPhoto: memoryData.coverPhoto || memoryData.photos?.[0]?.url || '',
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
                  ? 'bg-purple-600 text-white scale-110'
                  : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-1 mx-2 ${
                  s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
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
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
                     text-white font-semibold hover:shadow-xl transition-all">
            Next
          </button>
        ) : (
          <button
            onClick={handleCreate}
            className="flex-1 min-w-0 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 
                     text-white font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2">
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
const MemoryBasicsStep = ({ data, onChange, darkMode }) => {
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
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-purple-500 outline-none text-base"
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
      </div>
      
      {/* Date */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Date
        </label>
        <input
          type="date"
          value={data.date}
          onChange={(e) => onChange({ ...data, date: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-purple-500 outline-none"
        />
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
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/25 dark:text-purple-200 dark:hover:bg-purple-900/35'
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
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-purple-500 outline-none resize-none text-base"
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
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-purple-500 outline-none text-base"
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
          className="mt-3 text-sm text-purple-600 dark:text-purple-400 font-semibold hover:underline">
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
            ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20'
            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-900'
        }`}
      >
        <div className={`mt-0.5 flex h-5 min-h-[1.25rem] w-5 min-w-[1.25rem] items-center justify-center rounded-md border transition-all ${
          photoOnlyMode
            ? 'border-purple-600 bg-purple-600 text-white'
            : 'border-gray-300 bg-white text-transparent dark:border-gray-600 dark:bg-slate-800'
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
          className="relative block w-full overflow-hidden rounded-2xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-left transition-all hover:shadow-lg"
        >
          <div
            className="h-56 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${data.coverPhoto || data.photos?.[0]?.url || ''})` }}
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
            <div className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm">
              Add more
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-6 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 
                   bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 
                   transition-all flex flex-col items-center justify-center gap-2">
          <Camera className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-purple-700 dark:text-purple-300">
            Add Photos
          </span>
          <span className="text-sm text-purple-600 dark:text-purple-400">
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
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-xl"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-xl transition-all" />
                
                {/* Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setCoverPhoto(photo.id)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-all"
                    title="Set as cover">
                    <Sparkles className="w-4 h-4 text-purple-600" />
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
                  <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
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
                           focus:ring-2 focus:ring-purple-500"
                  style={{ fontSize: '14px' }}
                />
              </div>
            ))}
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
          className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 
                   hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20
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
                     focus:ring-2 focus:ring-purple-500 outline-none text-base"
            style={{ fontSize: '16px' }}
          />
          <div className="flex gap-2">
            <button
              onClick={addPerson}
              className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700">
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
      
      <div className="rounded-2xl overflow-hidden border-2 border-purple-200 dark:border-purple-800">
        {/* Cover */}
        <div className="relative h-48">
          {data.coverPhoto ? (
            <img src={data.coverPhoto} alt={data.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
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
        <div className="p-6 space-y-4 bg-white dark:bg-gray-800">
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
                    src={photo.url}
                    alt={`Photo ${idx + 1}`}
                    className="aspect-square object-cover rounded-lg"
                  />
                ))}
                {data.photos.length > 6 && (
                  <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 
                                flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
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
                                                  bg-purple-100 dark:bg-purple-900/30">
                    <PersonAvatar
                      person={person}
                      className="w-6 h-6"
                      textClassName="text-white text-xs font-bold"
                    />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
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
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  
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
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-[max(0.5rem,calc(env(safe-area-inset-top)+0.1rem))] pb-3 bg-gradient-to-b from-black/85 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all">
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShare(memory)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all">
              <Share2 className="w-5 h-5 text-white" />
            </button>
            
            {memory.canEdit && (
              <button
                onClick={onEdit}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all">
                <Edit2 className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Slideshow */}
      <div className="relative w-full h-full flex items-center justify-center">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500 ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
            {slide.type === 'cover' && <CoverSlide memory={slide.data} />}
            {slide.type === 'photo' && <PhotoSlide photo={slide.data} />}
            {slide.type === 'highlights' && <HighlightsSlide highlights={slide.data} memory={memory} />}
            {slide.type === 'people' && <PeopleSlide people={slide.data} memory={memory} />}
          </div>
        ))}
        
        {/* Navigation */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full 
                       bg-white/20 hover:bg-white/30 transition-all z-10">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full 
                       bg-white/20 hover:bg-white/30 transition-all z-10">
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-[max(4.2rem,calc(env(safe-area-inset-bottom)+3.1rem))] left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {slides.map((_, idx) => (
                <button
                  key={idx}
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
    {memory.coverPhoto ? (
      <img src={memory.coverPhoto} alt={memory.title} className="w-full h-full object-cover rounded-[28px]" />
    ) : (
      <div className="w-full h-full rounded-[28px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
    )}
    <div className="absolute inset-x-2 top-[max(5rem,calc(env(safe-area-inset-top)+4rem))] bottom-[max(6.25rem,calc(env(safe-area-inset-bottom)+5rem))] rounded-[28px] bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
    
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
    <img src={photo.url} alt={photo.caption} className="max-w-full max-h-full rounded-[28px] object-contain" />
    {photo.caption && (
      <div className="absolute left-2 right-2 bottom-[max(6.25rem,calc(env(safe-area-inset-bottom)+5rem))] rounded-b-[28px] p-6 bg-gradient-to-t from-black/90 to-transparent">
        <p className="text-white text-center">{photo.caption}</p>
      </div>
    )}
  </div>
);

const HighlightsSlide = ({ highlights, memory }) => (
  <div className="w-full h-full flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-purple-900 to-pink-900">
    <div className="max-w-2xl w-full">
      <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-6 sm:mb-8">Special Moments</h2>
      <div className="space-y-4 sm:space-y-6">
        {highlights.filter(h => h.trim()).map((highlight, idx) => (
          <div key={idx} className="flex items-start gap-3 sm:gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
            <span className="text-2xl sm:text-3xl">✨</span>
            <p className="text-base sm:text-xl text-white flex-1">{highlight}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PeopleSlide = ({ people, memory }) => (
  <div className="w-full h-full flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-blue-900 to-cyan-900">
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
      className="w-full max-h-[80vh] bg-white dark:bg-gray-900 rounded-t-3xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Comments ({memory.comments?.length || 0})
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Comments list */}
      <div className="overflow-y-auto max-h-[50vh] p-4 space-y-4">
        {memory.comments?.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center 
                          text-white font-bold shrink-0">
              {comment.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {comment.userName}
                </p>
                <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-4">
                {new Date(comment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        
        {(!memory.comments || memory.comments.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first!
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none text-base"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={onSubmit}
            disabled={!newComment.trim()}
            className="px-6 py-2 rounded-full bg-purple-600 text-white font-semibold 
                     hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
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
  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 
                border-2 border-purple-200 dark:border-purple-800 p-4 mb-4">
    <div className="flex items-start gap-3 mb-3">
      <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0 mt-1" />
      <div className="flex-1">
        <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-1">
          Turn this into a Memory?
        </h4>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Preserve "{event.title}" forever with photos, highlights, and more!
        </p>
      </div>
    </div>
    
    <div className="flex gap-2">
      <button
        onClick={onCreateMemory}
        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
                 text-white font-semibold hover:shadow-lg transition-all">
        ✨ Create a Memory
      </button>
      <button
        onClick={onDismiss}
        className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 
                 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
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
