import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── constants ────────────────────────────────────────────────────────────────
const CUISINE_FILTERS = [
  { id: 'all',           label: 'All',           emoji: '🍽️' },
  { id: 'italian',       label: 'Italian',       emoji: '🍝' },
  { id: 'japanese',      label: 'Japanese',      emoji: '🍣' },
  { id: 'mexican',       label: 'Mexican',       emoji: '🌮' },
  { id: 'american',      label: 'American',      emoji: '🍔' },
  { id: 'chinese',       label: 'Chinese',       emoji: '🥡' },
  { id: 'thai',          label: 'Thai',          emoji: '🍛' },
  { id: 'indian',        label: 'Indian',        emoji: '🫕' },
  { id: 'mediterranean', label: 'Med',           emoji: '🫒' },
  { id: 'korean',        label: 'Korean',        emoji: '🥩' },
  { id: 'french',        label: 'French',        emoji: '🥐' },
  { id: 'seafood',       label: 'Seafood',       emoji: '🦞' },
];

const SORT_OPTIONS = [
  { id: 'prominence', label: 'Best match' },
  { id: 'rating',     label: 'Top rated' },
  { id: 'distance',   label: 'Nearest' },
];

// ─── fallback data ────────────────────────────────────────────────────────────
const FALLBACK_RESTAURANTS = [
  { id: 'f1',  name: 'Nobu Los Angeles',      cuisine: 'japanese',      rating: 4.6, priceLevel: 4, address: '903 N La Cienega Blvd, West Hollywood', distance: '0.8 mi', isOpen: true,  photo: '', phone: '(310) 657-5711', website: 'https://noburestaurants.com', description: 'Celebrity hotspot serving world-famous black cod miso and contemporary Japanese dishes.' },
  { id: 'f2',  name: 'Bestia',                cuisine: 'italian',       rating: 4.7, priceLevel: 3, address: '2121 E 7th Pl, Los Angeles',            distance: '2.1 mi', isOpen: true,  photo: '', phone: '(213) 514-5724', website: 'https://bestiala.com',         description: 'Rustic Italian spot in the Arts District, known for house-made pastas and whole-animal roasts.' },
  { id: 'f3',  name: 'Mariscos Jalisco',       cuisine: 'mexican',       rating: 4.8, priceLevel: 1, address: '3040 E Olympic Blvd, Los Angeles',      distance: '3.4 mi', isOpen: true,  photo: '', phone: '(323) 528-6701', website: '',                             description: 'Legendary street food truck turned institution. The fried tacos de camarón are unmissable.' },
  { id: 'f4',  name: 'Providence',             cuisine: 'seafood',       rating: 4.8, priceLevel: 4, address: '5955 Melrose Ave, Los Angeles',          distance: '4.2 mi', isOpen: false, photo: '', phone: '(323) 460-4170', website: 'https://providencela.com',     description: 'Two-Michelin-star seafood temple. Chef Michael Cimarusti sources directly from sustainable fisheries.' },
  { id: 'f5',  name: 'Jitlada',                cuisine: 'thai',          rating: 4.5, priceLevel: 2, address: '5233 W Sunset Blvd, Los Angeles',        distance: '1.9 mi', isOpen: true,  photo: '', phone: '(323) 667-9809', website: '',                             description: 'The most authentic Southern Thai cooking in the city. Regulars swear by the crab curry.' },
  { id: 'f6',  name: 'République',             cuisine: 'french',        rating: 4.6, priceLevel: 3, address: '624 S La Brea Ave, Los Angeles',         distance: '2.7 mi', isOpen: true,  photo: '', phone: '(310) 362-6115', website: 'https://republiquela.com',     description: 'Grand Parisian brasserie in a stunning Charlie Chaplin-era building. Brunch is legendary.' },
  { id: 'f7',  name: 'Kogi BBQ',               cuisine: 'korean',        rating: 4.7, priceLevel: 1, address: 'Multiple LA locations (check Twitter)',   distance: '1.5 mi', isOpen: true,  photo: '', phone: '',              website: 'https://kogibbq.com',          description: 'The Korean BBQ taco truck that started the food truck revolution. Find the daily location online.' },
  { id: 'f8',  name: 'Majordomo',              cuisine: 'american',      rating: 4.5, priceLevel: 3, address: '1725 Naud St, Los Angeles',              distance: '2.3 mi', isOpen: false, photo: '', phone: '(323) 545-4880', website: 'https://majordomo.la',         description: "David Chang's LA flagship. The large-format dishes like pork shoulder for two are the move." },
  { id: 'f9',  name: 'Shin Beijing',           cuisine: 'chinese',       rating: 4.4, priceLevel: 2, address: '500 W Main St, Alhambra',                distance: '8.1 mi', isOpen: true,  photo: '', phone: '(626) 281-0088', website: '',                             description: 'Best Peking duck outside of Beijing. Book the private room for the full ceremonial experience.' },
  { id: 'f10', name: "Howlin' Ray's",          cuisine: 'american',      rating: 4.6, priceLevel: 2, address: '727 N Broadway #128, Los Angeles',       distance: '2.8 mi', isOpen: true,  photo: '', phone: '(323) 488-5905', website: 'https://howlinrays.com',       description: "Nashville hot chicken that'll make your eyes water. The line is always worth it." },
  { id: 'f11', name: 'Spago Beverly Hills',    cuisine: 'american',      rating: 4.5, priceLevel: 4, address: '176 N Canon Dr, Beverly Hills',          distance: '5.6 mi', isOpen: true,  photo: '', phone: '(310) 385-0880', website: 'https://wolfgangpuck.com',     description: "Wolfgang Puck's iconic flagship. The smoked salmon pizza started a revolution in 1982." },
  { id: 'f12', name: 'Momed',                  cuisine: 'mediterranean', rating: 4.4, priceLevel: 2, address: '233 S Beverly Dr, Beverly Hills',        distance: '5.1 mi', isOpen: true,  photo: '', phone: '(310) 270-4444', website: 'https://momedrestaurant.com',  description: 'Casual Mediterranean spot with sharable plates. The lamb chops and hummus are must-orders.' },
  { id: 'f13', name: 'Dosa by Dosa',           cuisine: 'indian',        rating: 4.6, priceLevel: 2, address: '1011 S Fairfax Ave, Los Angeles',        distance: '3.3 mi', isOpen: true,  photo: '', phone: '(323) 938-3672', website: '',                             description: "South Indian dosas so crispy and perfectly spiced they've earned a cult following." },
  { id: 'f14', name: 'Sushi Park',             cuisine: 'japanese',      rating: 4.8, priceLevel: 4, address: '8539 W Sunset Blvd #1, Los Angeles',    distance: '4.4 mi', isOpen: false, photo: '', phone: '(310) 652-0523', website: '',                             description: 'Omakase-only hideaway above the Sunset Strip. Reserve months in advance. Worth every penny.' },
  { id: 'f15', name: 'Guisados',               cuisine: 'mexican',       rating: 4.7, priceLevel: 1, address: '1261 W Sunset Blvd, Los Angeles',        distance: '1.2 mi', isOpen: true,  photo: '', phone: '(213) 908-4851', website: 'https://guisados.co',          description: "Braised taco specialists. Get the sampler of six — you can't go wrong with any of them." },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const CUISINE_EMOJI = { japanese: '🍣', italian: '🍝', mexican: '🌮', american: '🍔', chinese: '🥡', thai: '🍛', indian: '🫕', mediterranean: '🫒', korean: '🥩', french: '🥐', seafood: '🦞', default: '🍽️' };
const getCuisineEmoji = (c) => CUISINE_EMOJI[c?.toLowerCase()] || CUISINE_EMOJI.default;
const priceStr = (level) => level ? '$'.repeat(level) : '–';

// ─── FeaturedBanner ───────────────────────────────────────────────────────────
function FeaturedBanner({ restaurant, onTap, onSaveToSomeday, savedIds }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (restaurant) setSaved(savedIds.has(restaurant.id));
  }, [restaurant, savedIds]);

  if (!restaurant) return (
    <div className="mx-3.5 h-52 rounded-2xl bg-stone-100 dark:bg-[#161f30] animate-pulse mb-3" />
  );

  const emoji = getCuisineEmoji(restaurant.cuisine);

  function handleSave(e) {
    e.stopPropagation();
    setSaved(v => !v);
    if (!saved) onSaveToSomeday?.(restaurant);
  }

  return (
    <div
      className="mx-3.5 rounded-2xl overflow-hidden relative cursor-pointer mb-3"
      style={{ height: '210px' }}
      onClick={() => onTap(restaurant)}
    >
      {restaurant.photo
        ? <img src={restaurant.photo} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
        : <div className="absolute inset-0 bg-gradient-to-br from-orange-900/50 to-[#0e1520] flex items-center justify-center text-8xl opacity-20">{emoji}</div>
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-widest uppercase text-orange-400 mb-1">Featured</p>
            <h2 className="text-lg font-semibold text-white leading-tight truncate">{restaurant.name}</h2>
            <p className="text-xs text-white/50 mt-0.5">
              {restaurant.cuisine}{restaurant.rating ? ` · ★ ${restaurant.rating.toFixed(1)}` : ''}{restaurant.priceLevel ? ` · ${priceStr(restaurant.priceLevel)}` : ''}
            </p>
          </div>
          <button
            onClick={handleSave}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-xl transition-all active:opacity-70 ${saved ? 'bg-teal-600 text-white' : 'bg-teal-400 text-gray-900'}`}
          >
            {saved ? '✓ Saved' : '+ Someday'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RestaurantGrid ───────────────────────────────────────────────────────────
function RestaurantGrid({ restaurants, loading, savedIds, onTap }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5 px-3.5">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-stone-100 dark:bg-[#161f30] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 px-3.5">
      {restaurants.slice(1).map(r => {
        const emoji = getCuisineEmoji(r.cuisine);
        const saved = savedIds.has(r.id);

        return (
          <div
            key={r.id}
            className="aspect-[2/3] rounded-xl overflow-hidden relative cursor-pointer bg-stone-100 dark:bg-[#161f30]"
            onClick={() => onTap(r)}
          >
            {r.photo
              ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />
              : <div className="w-full h-full flex items-center justify-center text-3xl bg-orange-500/10">{emoji}</div>
            }
            {/* Open/closed dot */}
            {r.isOpen !== null && (
              <div className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${r.isOpen ? 'bg-teal-400' : 'bg-red-400'}`} />
            )}
            {/* Price badge */}
            <div className="absolute bottom-1.5 left-1.5 bg-black/60 rounded-full px-2 py-0.5">
              <span className="text-[9px] text-white/70">{priceStr(r.priceLevel)}</span>
            </div>
            {/* Rating badge */}
            {r.rating > 0 && (
              <div className="absolute bottom-1.5 right-1.5 bg-black/60 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                <span className="text-[9px] text-amber-400">★</span>
                <span className="text-[9px] text-white/70">{r.rating.toFixed(1)}</span>
              </div>
            )}
            {/* Saved indicator */}
            {saved && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── RestaurantDetailSheet ────────────────────────────────────────────────────
function RestaurantDetailSheet({ restaurant, open, onClose, onAddEvent, onSaveToSomeday, savedIds }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (restaurant) setSaved(savedIds.has(restaurant.id));
  }, [restaurant, savedIds]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!restaurant) return null;

  const emoji = getCuisineEmoji(restaurant.cuisine);

  function handleSave() {
    setSaved(v => !v);
    if (!saved) onSaveToSomeday?.(restaurant);
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[10002] bg-black/60 transition-opacity duration-250 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <div
        style={{ WebkitOverflowScrolling: 'touch' }}
        className={`fixed bottom-0 left-0 right-0 z-[10002] max-w-lg mx-auto bg-white dark:bg-[#131c2e] rounded-t-3xl border-t border-stone-200 dark:border-white/[0.06] transition-transform duration-300 ease-out max-h-[88vh] overflow-y-auto overscroll-contain ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-stone-200 dark:bg-white/10 rounded-full mx-auto mt-3 mb-0 sticky top-3" />

        {/* Hero image */}
        <div className="w-full h-48 mt-4 relative bg-orange-500/10 flex items-center justify-center text-6xl overflow-hidden">
          {restaurant.photo
            ? <img src={restaurant.photo} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
            : emoji
          }
          {restaurant.isOpen !== null && (
            <div className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full ${restaurant.isOpen ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'bg-red-500/20 text-red-500 dark:text-red-400'}`}>
              {restaurant.isOpen ? '● Open now' : '● Closed'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
          {/* Thumbnail + title row */}
          <div className="flex gap-3 -mt-10 mb-4">
            <div className="flex-shrink-0 w-20 h-[120px] rounded-xl overflow-hidden border-2 border-white dark:border-[#131c2e] shadow-xl bg-orange-500/10 flex items-center justify-center text-3xl">
              {restaurant.photo
                ? <img src={restaurant.photo} alt={restaurant.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                : emoji
              }
            </div>
            <div className="flex-1 pt-12 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">{restaurant.name}</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
                {restaurant.cuisine}{restaurant.rating ? ` · ★ ${restaurant.rating.toFixed(1)}` : ''}{restaurant.priceLevel ? ` · ${priceStr(restaurant.priceLevel)}` : ''}{restaurant.distance ? ` · ${restaurant.distance}` : ''}
              </p>
            </div>
          </div>

          {/* Description */}
          {restaurant.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">{restaurant.description}</p>
          )}

          {/* Info block */}
          {(restaurant.address || restaurant.phone || restaurant.website) && (
            <div className="bg-stone-50 dark:bg-white/[0.04] rounded-2xl p-4 mb-5 space-y-2.5 border border-stone-100 dark:border-white/[0.06]">
              {restaurant.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-base leading-none mt-0.5">📍</span>
                  <span>{restaurant.address}</span>
                </div>
              )}
              {restaurant.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-base leading-none">📞</span>
                  <a href={`tel:${restaurant.phone}`} className="text-teal-600 dark:text-teal-400">{restaurant.phone}</a>
                </div>
              )}
              {restaurant.website && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-base leading-none">🔗</span>
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 truncate">
                    {restaurant.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all active:opacity-70 ${saved ? 'bg-teal-600 text-white' : 'bg-teal-400 text-gray-900'}`}
            >
              {saved ? '✓ In someday list' : '+ Someday list'}
            </button>
            <button
              onClick={() => {
                onClose();
                onAddEvent?.({
                  title: `🍽️ Dinner at ${restaurant.name}`,
                  notes: `${restaurant.address || ''} · ${priceStr(restaurant.priceLevel)} · ${restaurant.cuisine}`,
                  category: 'hangout',
                  location: restaurant.address || restaurant.name,
                });
              }}
              className="flex-1 py-3 rounded-2xl text-sm font-medium bg-stone-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 active:opacity-70"
            >
              Plan dinner →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const RestaurantPage = ({
  apiKey,
  userLocation = null,
  onAddEvent,
  onSaveToSomeday,
  onBack,
}) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [cuisine, setCuisine]         = useState('all');
  const [sortBy, setSortBy]           = useState('prominence');
  const [selected, setSelected]       = useState(null);
  const [sheetOpen, setSheetOpen]     = useState(false);
  const [savedIds, setSavedIds]       = useState(new Set());
  const [location, setLocation]       = useState(userLocation || { lat: 34.0522, lng: -118.2437 });
  const fetchedRef                    = useRef(false);

  // ── fetch ───────────────────────────────────────────────────────────────────
  const fetchRestaurants = useCallback(async (loc, query = '') => {
    setLoading(true);
    setError('');
    try {
      let data;
      const proxyUrl  = `/api/places?lat=${loc.lat}&lng=${loc.lng}&query=${encodeURIComponent(query)}&type=restaurant`;
      const directUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${loc.lat},${loc.lng}&radius=5000&type=restaurant&keyword=${encodeURIComponent(query)}&rankby=prominence&key=${apiKey || process.env.REACT_APP_GOOGLE_PLACES_KEY || ''}`;

      let res;
      try {
        res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('proxy unavailable');
        data = await res.json();
      } catch {
        if (apiKey || process.env.REACT_APP_GOOGLE_PLACES_KEY) {
          res = await fetch(directUrl);
          data = await res.json();
        } else {
          throw new Error('no_key');
        }
      }

      if (data?.status === 'OK' && data.results?.length > 0) {
        const mapped = data.results.map(r => ({
          id: r.place_id,
          name: r.name,
          cuisine: inferCuisine(r.types || [], r.name),
          rating: r.rating || 0,
          priceLevel: r.price_level || 0,
          address: r.vicinity || '',
          distance: '',
          isOpen: r.opening_hours?.open_now ?? null,
          photo: r.photos?.[0]?.photo_reference
            ? `/api/places?action=photo&ref=${encodeURIComponent(r.photos[0].photo_reference)}&maxwidth=400`
            : '',
          phone: '', website: '', description: '',
          googlePlaceId: r.place_id,
        }));
        setRestaurants(mapped);
      } else {
        throw new Error('no_results');
      }
    } catch (err) {
      setRestaurants(FALLBACK_RESTAURANTS);
      if (err.message !== 'no_key' && err.message !== 'no_results') {
        setError('Showing curated picks — connect your Google Places API for live results near you.');
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          fetchRestaurants(loc);
        },
        () => fetchRestaurants(location),
        { timeout: 5000 }
      );
    } else {
      fetchRestaurants(userLocation || location);
    }
  }, []);

  // ── filtering ───────────────────────────────────────────────────────────────
  const filtered = restaurants.filter(r => {
    if (cuisine !== 'all' && r.cuisine !== cuisine) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'rating')   return b.rating - a.rating;
    if (sortBy === 'distance') return (parseFloat(a.distance) || 99) - (parseFloat(b.distance) || 99);
    return 0;
  });

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleSaveToSomeday = (restaurant) => {
    setSavedIds(prev => new Set([...prev, restaurant.id]));
    onSaveToSomeday?.({
      id: Date.now().toString(),
      text: restaurant.name,
      categoryId: 'food',
      status: 'dreaming',
      tab: 'ours',
      emoji: getCuisineEmoji(restaurant.cuisine),
      imageUrl: restaurant.photo || '',
      notes: `${restaurant.address || ''} · ${priceStr(restaurant.priceLevel)} · ${restaurant.cuisine}`,
      comments: [],
      partnerHearted: false,
      myHearted: false,
      createdAt: new Date().toISOString(),
    });
  };

  function handleTap(r) {
    setSelected(r);
    setSheetOpen(true);
  }

  const activeLabel = cuisine !== 'all'
    ? CUISINE_FILTERS.find(c => c.id === cuisine)?.label
    : 'Near you';

  return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-[#0e1520] pb-28">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap'); .font-handwritten { font-family: 'Caveat', cursive; }`}</style>

      {/* Top bar */}
      <div className="bg-white dark:bg-[#131c2e] border-b border-stone-200 dark:border-white/[0.05] px-4 pt-5 pb-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 active:opacity-70 flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="font-handwritten text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Restaurants</h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-600">
              {loading ? 'Finding nearby…' : `${filtered.length} spot${filtered.length !== 1 ? 's' : ''} nearby`}
            </p>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="ml-auto text-xs font-medium px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-0 cursor-pointer outline-none"
          >
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>

        {/* Cuisine tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {CUISINE_FILTERS.map(c => (
            <button
              key={c.id}
              onClick={() => setCuisine(c.id)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${cuisine === c.id ? 'bg-orange-500/20 text-orange-600 dark:text-orange-300' : 'bg-stone-100 dark:bg-white/5 text-gray-500'}`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-3.5 mt-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl text-xs text-amber-700 dark:text-amber-400">
          ℹ️ {error}
        </div>
      )}

      {/* Section label */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 dark:text-gray-600 px-4 pt-5 pb-3">
        {activeLabel}
      </p>

      {/* Featured banner — first restaurant */}
      <FeaturedBanner
        restaurant={loading ? null : filtered[0]}
        onTap={handleTap}
        onSaveToSomeday={handleSaveToSomeday}
        savedIds={savedIds}
      />

      {/* Poster grid */}
      <RestaurantGrid
        restaurants={filtered}
        loading={loading}
        savedIds={savedIds}
        onTap={handleTap}
      />

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 px-6">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">No restaurants match your filters</p>
          <button onClick={() => setCuisine('all')} className="text-xs text-teal-500 dark:text-teal-400">Clear filters</button>
        </div>
      )}

      {/* Detail sheet */}
      <RestaurantDetailSheet
        restaurant={selected}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAddEvent={onAddEvent}
        onSaveToSomeday={handleSaveToSomeday}
        savedIds={savedIds}
      />
    </div>
  );
};

// ─── helper: infer cuisine from Google Places types ───────────────────────────
function inferCuisine(types = [], name = '') {
  const t = types.join(' ').toLowerCase();
  const n = name.toLowerCase();
  if (t.includes('japanese') || n.match(/sushi|ramen|izakaya|japanese/)) return 'japanese';
  if (t.includes('italian')  || n.match(/italian|pizza|pasta|trattoria/)) return 'italian';
  if (t.includes('mexican')  || n.match(/mexican|taco|burrito|cantina/))  return 'mexican';
  if (t.includes('chinese')  || n.match(/chinese|dim sum|wok|peking/))    return 'chinese';
  if (t.includes('thai')     || n.match(/thai/))                           return 'thai';
  if (t.includes('indian')   || n.match(/indian|curry|tandoor|masala/))   return 'indian';
  if (t.includes('korean')   || n.match(/korean|bbq|bibimbap/))           return 'korean';
  if (t.includes('french')   || n.match(/french|bistro|brasserie|café/))  return 'french';
  if (t.includes('seafood')  || n.match(/seafood|fish|oyster|lobster|crab/)) return 'seafood';
  if (t.includes('mediterranean') || n.match(/mediterranean|greek|lebanese|falafel|hummus/)) return 'mediterranean';
  return 'american';
}

export default RestaurantPage;
