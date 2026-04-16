import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

// ─── Constants ───────────────────────────────────────────────────────────────

const RAPIDAPI_KEY  = process.env.REACT_APP_TRAILAPI_KEY;
const RAPIDAPI_HOST = "trailapi-trailapi.p.rapidapi.com";
const GOOGLE_KEY    = process.env.REACT_APP_GOOGLE_MAPS_KEY;

const DIFFICULTY_MAP = {
  1: { label: "Easy",     style: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" },
  2: { label: "Moderate", style: "bg-amber-500/10   text-amber-600   border border-amber-500/20"   },
  3: { label: "Hard",     style: "bg-red-500/10     text-red-600     border border-red-500/20"     },
};

const FILTERS    = ["All", "Easy", "Moderate", "Hard", "Dog Friendly", "Kid Friendly", "Views"];
const TRAIL_EMOJIS = ["🌲", "🏔️", "🌄", "🌿", "🌊", "🦅", "🌸", "🍂"];

// ─── Mock community feed ─────────────────────────────────────────────────────

const MOCK_FEED = [
  { id: 1, initials: "JL", name: "Jamie L.",  action: "hiked",     trail: "Mission Peak Loop",    time: "2h ago",    note: "Brutal but worth every step. Go early — we left at 6am and had the summit almost to ourselves.", likes: 8,  comments: 3, hasPhoto: true  },
  { id: 2, initials: "SR", name: "Sam R.",    action: "saved",     trail: "Half Dome via JMT",    suffix: "to Someday List", time: "Yesterday", note: "Adding this to the summer bucket list — anyone else in?", likes: 5, comments: 7, hasPhoto: false },
  { id: 3, initials: "MK", name: "Maya K.",   action: "completed", trail: "Muir Woods Loop",      time: "3 days ago", note: "Perfect Sunday morning with the kids. The redwoods are absolutely magical right now.", likes: 14, comments: 2, hasPhoto: false },
];

// ─── TrailModal ──────────────────────────────────────────────────────────────

function TrailModal({ trail, photoUrl, isSaved, onSave, onPlanTrip, onClose, darkMode }) {
  const dm   = darkMode;
  const diff  = DIFFICULTY_MAP[trail.difficulty] ?? DIFFICULTY_MAP[2];
  const emoji = TRAIL_EMOJIS[trail.id % TRAIL_EMOJIS.length];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border max-h-[92vh] flex flex-col ${dm ? 'bg-[#0e1520] border-white/8' : 'bg-white border-slate-200'}`}>

        {/* ── Photo header ── */}
        <div className="relative flex-shrink-0">
          {photoUrl || trail.thumbnail ? (
            <img src={photoUrl || trail.thumbnail} alt={trail.name} className="w-full h-56 object-cover" />
          ) : (
            <div className={`w-full h-56 flex items-center justify-center text-8xl bg-gradient-to-br ${dm ? 'from-[#162b3a] to-[#1a3a4a]' : 'from-teal-50 to-teal-100'}`}>
              {emoji}
            </div>
          )}
          <div className={`absolute inset-0 bg-gradient-to-t ${dm ? 'from-[#0e1520]' : 'from-white/60'} via-transparent to-black/20`} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-4">
            <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-medium ${diff.style}`}>
              {diff.label}
            </span>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pt-4 pb-6">
            <h2 className={`font-['Caveat'] text-3xl font-bold leading-tight mb-0.5 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
              {trail.name}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {trail.city}{trail.state ? `, ${trail.state}` : ""}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {trail.length && (
                <div className={`border rounded-2xl p-3 text-center ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-['Caveat'] text-xl font-bold text-teal-500 block leading-none">
                    {Number(trail.length).toFixed(1)} mi
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wide mt-1 block">Distance</span>
                </div>
              )}
              {trail.ascent && (
                <div className={`border rounded-2xl p-3 text-center ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-['Caveat'] text-xl font-bold text-teal-500 block leading-none">
                    {Math.round(trail.ascent).toLocaleString()} ft
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wide mt-1 block">Elevation</span>
                </div>
              )}
              {trail.rating && (
                <div className={`border rounded-2xl p-3 text-center ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-['Caveat'] text-xl font-bold text-amber-500 block leading-none">
                    {Number(trail.rating).toFixed(1)} ★
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wide mt-1 block">
                    {trail.ratingCount ? `${trail.ratingCount} reviews` : "Rating"}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            {trail.features?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-5">
                {trail.features.map((f) => (
                  <span key={f} className="text-[11px] text-teal-600 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1">
                    {f}
                  </span>
                ))}
              </div>
            )}

            {trail.description && (
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">About</p>
                <p className="text-sm text-slate-500 leading-relaxed">{trail.description}</p>
              </div>
            )}

            {trail.directions && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Getting there</p>
                <p className="text-sm text-slate-500 leading-relaxed">{trail.directions}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => onSave(trail)}
                className={`flex-1 rounded-2xl py-3 text-sm font-['Caveat'] font-bold transition-all duration-200 border ${
                  isSaved
                    ? "bg-teal-500/20 border-teal-500/30 text-teal-600"
                    : dm
                      ? "bg-teal-400 border-transparent text-[#0e1520] hover:bg-teal-300"
                      : "bg-teal-500 border-transparent text-white hover:bg-teal-600"
                }`}
              >
                {isSaved ? "✓ In someday list" : "+ Someday list"}
              </button>
              <button
                onClick={onPlanTrip}
                className={`flex-1 rounded-2xl py-3 text-sm font-medium transition-all duration-200 border ${dm ? 'bg-violet-400/10 border-violet-400/25 text-violet-400 hover:bg-violet-400/20' : 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100'}`}
              >
                Plan Trip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── TrailCard ───────────────────────────────────────────────────────────────

function TrailCard({ trail, photoUrl, onSave, savedIds, onOpen, darkMode }) {
  const dm     = darkMode;
  const isSaved = savedIds.has(trail.id);
  const diff    = DIFFICULTY_MAP[trail.difficulty] ?? DIFFICULTY_MAP[2];
  const emoji   = TRAIL_EMOJIS[trail.id % TRAIL_EMOJIS.length];
  const imgSrc  = photoUrl || trail.thumbnail;

  return (
    <div
      onClick={onOpen}
      className={`border rounded-2xl overflow-hidden hover:border-teal-400/25 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${dm ? 'bg-[#161f30] border-white/5' : 'bg-white border-slate-200'}`}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={trail.name} className="w-full h-36 object-cover" />
      ) : (
        <div className={`w-full h-36 flex items-center justify-center text-5xl bg-gradient-to-br ${dm ? 'from-[#1a2540] to-[#1e3040]' : 'from-teal-50 to-teal-100'}`}>
          {emoji}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-medium ${diff.style}`}>
            {diff.label}
          </span>
          {trail.rating && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span className="text-amber-500">★</span>
              {Number(trail.rating).toFixed(1)}
              {trail.ratingCount && <span className="text-slate-400">({trail.ratingCount})</span>}
            </span>
          )}
        </div>

        <h3 className={`font-['Caveat'] text-xl font-semibold leading-tight mb-0.5 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
          {trail.name}
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {trail.city}{trail.state ? `, ${trail.state}` : ""}
        </p>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {trail.length && (
            <span className={`text-[11px] text-slate-500 rounded-md px-2 py-0.5 ${dm ? 'bg-white/5' : 'bg-slate-100'}`}>
              {Number(trail.length).toFixed(1)} mi
            </span>
          )}
          {trail.ascent && (
            <span className={`text-[11px] text-slate-500 rounded-md px-2 py-0.5 ${dm ? 'bg-white/5' : 'bg-slate-100'}`}>
              {Math.round(trail.ascent).toLocaleString()} ft gain
            </span>
          )}
          {trail.features?.slice(0, 1).map((f) => (
            <span key={f} className={`text-[11px] text-slate-500 rounded-md px-2 py-0.5 ${dm ? 'bg-white/5' : 'bg-slate-100'}`}>{f}</span>
          ))}
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSave(trail)}
            className={`flex-1 rounded-xl py-2 text-xs font-['Caveat'] font-bold transition-all duration-200 border ${
              isSaved
                ? "bg-teal-500/20 border-teal-500/30 text-teal-600"
                : dm
                  ? "bg-teal-400/8 border-teal-400/20 text-teal-400 hover:bg-teal-400/15"
                  : "bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100"
            }`}
          >
            {isSaved ? "✓ In someday list" : "+ Someday list"}
          </button>
          <button
            onClick={onOpen}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all duration-200 border ${dm ? 'bg-violet-400/8 border-violet-400/20 text-violet-400 hover:bg-violet-400/15' : 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100'}`}
          >
            View trail
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FeedCard ─────────────────────────────────────────────────────────────────

function FeedCard({ item, darkMode }) {
  const dm = darkMode;
  const [liked, setLiked] = useState(false);
  const likeCount = liked ? item.likes + 1 : item.likes;

  return (
    <div className={`border rounded-2xl p-4 flex gap-3 ${dm ? 'bg-[#161f30] border-white/5' : 'bg-white border-slate-200'}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-violet-500 flex items-center justify-center font-['Caveat'] text-base font-bold text-white flex-shrink-0">
        {item.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start flex-wrap gap-x-1.5 gap-y-0.5 mb-1">
          <span className={`text-sm font-medium ${dm ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</span>
          <span className="text-sm text-slate-500">{item.action}</span>
          <span className="text-sm text-teal-500">{item.trail}</span>
          {item.suffix && <span className="text-sm text-slate-500">{item.suffix}</span>}
          <span className="text-xs text-slate-400 ml-auto">{item.time}</span>
        </div>
        {item.note && (
          <p className="text-sm text-slate-500 italic leading-relaxed mb-2">"{item.note}"</p>
        )}
        {item.hasPhoto && (
          <div className={`w-full h-24 rounded-xl flex items-center justify-center text-3xl mb-2 bg-gradient-to-br ${dm ? 'from-[#1a2540] to-[#1e3040]' : 'from-teal-50 to-teal-100'}`}>
            📸
          </div>
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLiked((l) => !l)}
            className={`text-xs flex items-center gap-1 transition-colors duration-150 ${liked ? "text-pink-500" : "text-slate-400 hover:text-pink-500"}`}
          >
            {liked ? "♥" : "♡"} {likeCount} likes
          </button>
          <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-150">
            💬 {item.comments} comments
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HikingPage({ onBack, onAddToSomeday, onPlanEvent, darkMode = false } = {}) {
  const dm = darkMode;
  const [query, setQuery]               = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [trails, setTrails]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [savedIds, setSavedIds]         = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [placePhotos, setPlacePhotos]   = useState({});
  const [selectedTrail, setSelectedTrail] = useState(null);
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      ()    => setUserLocation({ lat: 37.7749, lon: -122.4194 })
    );
  }, []);

  useEffect(() => {
    if (userLocation) fetchTrails(userLocation.lat, userLocation.lon);
  }, [userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTrails = useCallback(async (lat, lon, searchQuery = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat, lon, radius: 30, limit: 20,
        ...(searchQuery && { "q[name_cont]": searchQuery }),
      });
      const res = await fetch(`https://${RAPIDAPI_HOST}/trails/explore/?${params}`, {
        headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST },
      });
      if (!res.ok) throw new Error("Failed to fetch trails");
      const data = await res.json();
      const normalized = (data.data || []).map((t, i) => ({
        id:          t.unique_id ?? i,
        name:        t.name,
        city:        t.city,
        state:       t.state,
        lat:         t.lat,
        lon:         t.lon,
        description: t.description,
        directions:  t.directions,
        difficulty:  parseDifficulty(t.activities),
        length:      t.activities?.[0]?.attribs?.length ?? null,
        ascent:      t.activities?.[0]?.attribs?.["ele_gain"] ?? null,
        rating:      t.activities?.[0]?.rating ?? null,
        ratingCount: t.activities?.[0]?.rating_count ?? null,
        thumbnail:   t.activities?.[0]?.thumbnail ?? null,
        url:         t.activities?.[0]?.url ?? null,
        features:    parseFeatures(t),
      }));
      setTrails(normalized);
    } catch (err) {
      console.error(err);
      setError("Couldn't load trails. Check your API key or try again.");
      setTrails(MOCK_TRAILS);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrailPhoto = useCallback(async (trail) => {
    if (!GOOGLE_KEY || fetchedRef.current.has(String(trail.id))) return;
    fetchedRef.current.add(String(trail.id));
    try {
      const q = encodeURIComponent(`${trail.name} trail ${trail.city || ""} ${trail.state || ""}`);
      const res  = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${GOOGLE_KEY}`);
      const data = await res.json();
      const photoRef = data.results?.[0]?.photos?.[0]?.photo_reference;
      if (photoRef) {
        const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${encodeURIComponent(photoRef)}&key=${GOOGLE_KEY}`;
        setPlacePhotos((prev) => ({ ...prev, [trail.id]: url }));
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!trails.length) return;
    trails.forEach((t) => fetchTrailPhoto(t));
  }, [trails, fetchTrailPhoto]);

  const handleSearch = () => {
    if (userLocation) fetchTrails(userLocation.lat, userLocation.lon, query);
  };

  const handleSave = (trail) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(trail.id) ? next.delete(trail.id) : next.add(trail.id);
      return next;
    });
    onAddToSomeday?.(trail);
  };

  const handlePlanTrip = (trail) => {
    setSelectedTrail(null);
    onPlanEvent?.({ title: `Hike: ${trail.name}` });
  };

  const filteredTrails = trails.filter((t) => {
    if (activeFilter === "All")      return true;
    if (activeFilter === "Easy")     return t.difficulty === 1;
    if (activeFilter === "Moderate") return t.difficulty === 2;
    if (activeFilter === "Hard")     return t.difficulty === 3;
    return t.features?.some((f) => f.toLowerCase().includes(activeFilter.toLowerCase()));
  });

  const featuredTrail = filteredTrails[0] ?? null;
  const gridTrails    = filteredTrails.slice(1, 7);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen font-sans ${dm ? 'bg-[#0e1520] text-slate-200' : 'bg-[#faf8f3] text-slate-800'}`}>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-28">

        {/* ── Top bar ── */}
        {onBack && (
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={onBack}
              className={`w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 flex-shrink-0 ${dm ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <h1 className={`font-['Caveat'] text-3xl font-bold leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Hiking & Outdoors</h1>
              <p className="text-[11px] text-slate-500">
                {loading ? "Loading…" : `${trails.length} trail${trails.length !== 1 ? "s" : ""} nearby`}
              </p>
            </div>
          </div>
        )}

        {/* ── Hero ── */}
        <div className={`relative bg-gradient-to-br rounded-3xl p-8 mb-6 overflow-hidden border ${dm ? 'from-[#0f2027] via-[#162b3a] to-[#0e1520] border-white/5' : 'from-slate-50 via-teal-50 to-slate-50 border-teal-100'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(45,212,191,0.08),transparent)]" />
          <div className="absolute right-8 top-6 text-8xl opacity-10 rotate-12 select-none">🏔️</div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-teal-500 mb-2 opacity-80">Explore · Hiking</p>
          <h1 className={`font-['Caveat'] text-5xl font-bold leading-tight mb-2 bg-gradient-to-r bg-clip-text text-transparent ${dm ? 'from-slate-100 to-teal-300' : 'from-slate-800 to-teal-600'}`}>
            Hit the trails
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
            Discover trails near you, save hikes to your Someday List, and see where your friends have been adventuring.
          </p>
          <div className="flex gap-6 flex-wrap">
            {[
              { num: trails.length || "—", lbl: "Trails nearby" },
              { num: MOCK_FEED.length,     lbl: "Friends hiked" },
              { num: savedIds.size,        lbl: "Someday saves" },
            ].map(({ num, lbl }) => (
              <div key={lbl} className="flex flex-col">
                <span className="font-['Caveat'] text-3xl font-bold text-teal-500 leading-none">{num}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search ── */}
        <div className="flex gap-2.5 mb-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search trails, parks, or cities..."
            className={`flex-1 min-w-0 border rounded-2xl px-4 py-3 text-sm outline-none transition-colors ${dm ? 'bg-[#161f30] border-white/7 text-slate-200 placeholder-slate-500 focus:border-teal-400/40' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-400'}`}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`rounded-2xl px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap ${dm ? 'bg-teal-400 text-[#0e1520] hover:bg-teal-300' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
          >
            {loading ? "Searching…" : "Find Trails"}
          </button>
        </div>

        {/* ── Filter chips ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs transition-all duration-200 border ${
                activeFilter === f
                  ? "bg-teal-400/12 border-teal-400/40 text-teal-600"
                  : dm
                    ? "bg-[#161f30] border-white/7 text-slate-500 hover:text-teal-400 hover:border-teal-400/25"
                    : "bg-white border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-500 mb-6">
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`rounded-2xl h-64 animate-pulse border ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-200 border-slate-200'}`} />
            ))}
          </div>
        )}

        {/* ── Featured trail ── */}
        {!loading && featuredTrail && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Featured trail</p>
            <div
              onClick={() => setSelectedTrail(featuredTrail)}
              className={`border border-teal-400/15 rounded-3xl overflow-hidden mb-8 hover:border-teal-400/30 transition-colors cursor-pointer ${dm ? 'bg-[#161f30]' : 'bg-white'}`}
            >
              <div className="grid grid-cols-2 max-sm:grid-cols-1">
                {(placePhotos[featuredTrail.id] || featuredTrail.thumbnail) ? (
                  <img
                    src={placePhotos[featuredTrail.id] || featuredTrail.thumbnail}
                    alt={featuredTrail.name}
                    className="w-full h-52 object-cover"
                  />
                ) : (
                  <div className={`h-52 flex items-center justify-center text-7xl bg-gradient-to-br ${dm ? 'from-[#162b3a] to-[#1a3a4a]' : 'from-teal-50 to-teal-100'}`}>
                    🌲
                  </div>
                )}
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-widest text-teal-500 mb-2">⭐ Top rated this week</p>
                  <h2 className={`font-['Caveat'] text-2xl font-bold leading-tight mb-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
                    {featuredTrail.name}
                  </h2>
                  {featuredTrail.description && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {featuredTrail.description}
                    </p>
                  )}
                  <div className="flex gap-4 flex-wrap">
                    {featuredTrail.length && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-500">
                          {Number(featuredTrail.length).toFixed(1)} mi
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Distance</span>
                      </div>
                    )}
                    {featuredTrail.ascent && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-500">
                          {Math.round(featuredTrail.ascent).toLocaleString()} ft
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Elevation</span>
                      </div>
                    )}
                    {featuredTrail.rating && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-500">
                          {Number(featuredTrail.rating).toFixed(1)} ★
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Rating</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Trail grid ── */}
        {!loading && gridTrails.length > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Trails near you</p>
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3 mb-8">
              {gridTrails.map((trail) => (
                <TrailCard
                  key={trail.id}
                  trail={trail}
                  photoUrl={placePhotos[trail.id] ?? null}
                  onSave={handleSave}
                  savedIds={savedIds}
                  onOpen={() => setSelectedTrail(trail)}
                  darkMode={dm}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && filteredTrails.length === 0 && !error && (
          <div className="text-center py-16 text-slate-400 mb-8">
            <div className="text-5xl mb-4">🗺️</div>
            <p className={`font-['Caveat'] text-2xl mb-1 ${dm ? 'text-slate-400' : 'text-slate-600'}`}>No trails found</p>
            <p className="text-sm">Try a different location or filter</p>
          </div>
        )}

        {/* ── Someday banner ── */}
        {savedIds.size > 0 && (
          <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/8 border border-violet-400/20 rounded-3xl p-5 mb-8 flex items-center gap-4">
            <span className="text-3xl flex-shrink-0">📌</span>
            <div>
              <h3 className={`font-['Caveat'] text-xl font-bold leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Your Someday List</h3>
              <p className="text-sm text-slate-500">
                You've saved {savedIds.size} trail{savedIds.size !== 1 ? "s" : ""} — ready to pick a date?
              </p>
            </div>
            <button className="ml-auto bg-violet-400/12 border border-violet-400/25 rounded-2xl px-4 py-2.5 text-sm text-violet-600 hover:bg-violet-400/20 transition-all whitespace-nowrap">
              View list →
            </button>
          </div>
        )}

        {/* ── Community feed ── */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Friends' recent hikes</p>
        <div className="flex flex-col gap-2.5">
          {MOCK_FEED.map((item) => <FeedCard key={item.id} item={item} darkMode={dm} />)}
        </div>

      </div>

      {/* ── Modal ── */}
      {selectedTrail && (
        <TrailModal
          trail={selectedTrail}
          photoUrl={placePhotos[selectedTrail.id] ?? null}
          isSaved={savedIds.has(selectedTrail.id)}
          onSave={handleSave}
          onPlanTrip={() => handlePlanTrip(selectedTrail)}
          onClose={() => setSelectedTrail(null)}
          darkMode={dm}
        />
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDifficulty(activities) {
  if (!activities?.length) return 2;
  const desc = (activities[0]?.difficulty ?? "").toLowerCase();
  if (desc.includes("easy") || desc === "green") return 1;
  if (desc.includes("hard") || desc.includes("black") || desc.includes("expert")) return 3;
  return 2;
}

function parseFeatures(trail) {
  const features = [];
  const desc = trail.description?.toLowerCase() ?? "";
  if (desc.includes("dog"))                             features.push("Dog Friendly");
  if (desc.includes("kid") || desc.includes("family")) features.push("Kid Friendly");
  if (desc.includes("view") || desc.includes("summit")) features.push("Views");
  return features;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRAILS = [
  { id: 1, name: "Mission Peak Loop",       city: "Fremont",       state: "California", difficulty: 2, length: 6.1,  ascent: 2100, rating: 4.7, ratingCount: 312, thumbnail: null, features: ["Views"],                   description: "A challenging loop to the summit of Mission Peak with panoramic views of the Bay Area. The final push to the pole is steep but rewarding.", directions: "Take Mission Boulevard to Stanford Avenue. Parking at the Hidden Valley trailhead." },
  { id: 2, name: "Muir Woods Loop",         city: "Mill Valley",   state: "California", difficulty: 1, length: 2.4,  ascent: 180,  rating: 4.5, ratingCount: 891, thumbnail: null, features: ["Dog Friendly"],            description: "A gentle stroll through ancient coast redwoods. The Cathedral Grove section features trees over 1,000 years old.", directions: "Take US-101 to the Muir Woods Road exit. Parking reservations required." },
  { id: 3, name: "Mt. Tamalpais East Peak", city: "Marin County",  state: "California", difficulty: 3, length: 10.5, ascent: 3400, rating: 4.9, ratingCount: 145, thumbnail: null, features: ["Views"],                   description: "An epic summit hike with sweeping views of the Golden Gate and San Francisco Bay on clear days.", directions: "Access via Pantoll Station on Panoramic Highway. Take the Steep Ravine trail to the summit." },
  { id: 4, name: "Lands End Trail",         city: "San Francisco", state: "California", difficulty: 1, length: 3.5,  ascent: 320,  rating: 4.6, ratingCount: 527, thumbnail: null, features: ["Kid Friendly"],            description: "A scenic coastal trail along the western edge of San Francisco with views of the Marin Headlands and shipwrecks below.", directions: "Start at the Lands End Lookout visitor center off Point Lobos Avenue." },
  { id: 5, name: "Ring Mountain Preserve",  city: "Tiburon",       state: "California", difficulty: 2, length: 4.2,  ascent: 850,  rating: 4.4, ratingCount: 203, thumbnail: null, features: ["Views", "Dog Friendly"],   description: "A hidden gem in Marin with wildflowers in spring and stunning bay views. Look for the ancient Native American rock carvings.", directions: "Take Paradise Drive north from Corte Madera. Trailhead parking on Paradise Drive." },
];
