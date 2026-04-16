import { useState, useEffect, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const RAPIDAPI_KEY = process.env.REACT_APP_TRAILAPI_KEY; // 🔑 Replace with your TrailAPI key
const RAPIDAPI_HOST = "trailapi-trailapi.p.rapidapi.com";

const DIFFICULTY_MAP = {
  1: { label: "Easy",     style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  2: { label: "Moderate", style: "bg-amber-500/10   text-amber-400   border border-amber-500/20"   },
  3: { label: "Hard",     style: "bg-red-500/10     text-red-400     border border-red-500/20"     },
};

const FILTERS = ["All", "Easy", "Moderate", "Hard", "Dog Friendly", "Kid Friendly", "Views"];

const TRAIL_EMOJIS = ["🌲", "🏔️", "🌄", "🌿", "🌊", "🦅", "🌸", "🍂"];

// ─── Mock community feed (replace with Supabase query) ──────────────────────

const MOCK_FEED = [
  {
    id: 1,
    initials: "JL",
    name: "Jamie L.",
    action: "hiked",
    trail: "Mission Peak Loop",
    time: "2h ago",
    note: "Brutal but worth every step. Go early — we left at 6am and had the summit almost to ourselves.",
    likes: 8,
    comments: 3,
    hasPhoto: true,
  },
  {
    id: 2,
    initials: "SR",
    name: "Sam R.",
    action: "saved",
    trail: "Half Dome via JMT",
    suffix: "to Someday List",
    time: "Yesterday",
    note: "Adding this to the summer bucket list — anyone else in?",
    likes: 5,
    comments: 7,
    hasPhoto: false,
  },
  {
    id: 3,
    initials: "MK",
    name: "Maya K.",
    action: "completed",
    trail: "Muir Woods Loop",
    time: "3 days ago",
    note: "Perfect Sunday morning with the kids. The redwoods are absolutely magical right now.",
    likes: 14,
    comments: 2,
    hasPhoto: false,
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function TrailCard({ trail, onSave, savedIds }) {
  const isSaved = savedIds.has(trail.id);
  const diff = DIFFICULTY_MAP[trail.difficulty] ?? DIFFICULTY_MAP[2];
  const emoji = TRAIL_EMOJIS[trail.id % TRAIL_EMOJIS.length];

  return (
    <div className="bg-[#161f30] border border-white/5 rounded-2xl overflow-hidden hover:border-teal-400/25 hover:-translate-y-0.5 transition-all duration-200">
      {/* Image / placeholder */}
      {trail.thumbnail ? (
        <img
          src={trail.thumbnail}
          alt={trail.name}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-36 flex items-center justify-center text-5xl bg-gradient-to-br from-[#1a2540] to-[#1e3040]">
          {emoji}
        </div>
      )}

      <div className="p-4">
        {/* Difficulty + rating */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-medium ${diff.style}`}>
            {diff.label}
          </span>
          {trail.rating && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="text-amber-400">★</span>
              {Number(trail.rating).toFixed(1)}
              {trail.ratingCount && (
                <span className="text-slate-500">({trail.ratingCount})</span>
              )}
            </span>
          )}
        </div>

        {/* Name + location */}
        <h3 className="font-['Caveat'] text-xl font-semibold text-slate-100 leading-tight mb-0.5">
          {trail.name}
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {trail.city}{trail.state ? `, ${trail.state}` : ""}
        </p>

        {/* Stats chips */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {trail.length && (
            <span className="text-[11px] text-slate-400 bg-white/5 rounded-md px-2 py-0.5">
              {Number(trail.length).toFixed(1)} mi
            </span>
          )}
          {trail.ascent && (
            <span className="text-[11px] text-slate-400 bg-white/5 rounded-md px-2 py-0.5">
              {Math.round(trail.ascent).toLocaleString()} ft gain
            </span>
          )}
          {trail.features?.slice(0, 1).map((f) => (
            <span key={f} className="text-[11px] text-slate-400 bg-white/5 rounded-md px-2 py-0.5">
              {f}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onSave(trail)}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all duration-200 border ${
              isSaved
                ? "bg-teal-400/20 border-teal-400/35 text-teal-300"
                : "bg-teal-400/8 border-teal-400/20 text-teal-400 hover:bg-teal-400/15"
            }`}
          >
            {isSaved ? "✓ Saved" : "+ Someday"}
          </button>
          <button className="flex-1 bg-violet-400/8 border border-violet-400/20 rounded-xl py-2 text-xs font-medium text-violet-400 hover:bg-violet-400/15 transition-all duration-200">
            Plan trip
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedCard({ item }) {
  const [liked, setLiked] = useState(false);
  const likeCount = liked ? item.likes + 1 : item.likes;

  return (
    <div className="bg-[#161f30] border border-white/5 rounded-2xl p-4 flex gap-3">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-violet-500 flex items-center justify-center font-['Caveat'] text-base font-bold text-white flex-shrink-0">
        {item.initials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start flex-wrap gap-x-1.5 gap-y-0.5 mb-1">
          <span className="text-sm font-medium text-slate-200">{item.name}</span>
          <span className="text-sm text-slate-500">{item.action}</span>
          <span className="text-sm text-teal-400">{item.trail}</span>
          {item.suffix && <span className="text-sm text-slate-500">{item.suffix}</span>}
          <span className="text-xs text-slate-600 ml-auto">{item.time}</span>
        </div>

        {/* Note */}
        {item.note && (
          <p className="text-sm text-slate-400 italic leading-relaxed mb-2">
            "{item.note}"
          </p>
        )}

        {/* Photo placeholder */}
        {item.hasPhoto && (
          <div className="w-full h-24 rounded-xl bg-gradient-to-br from-[#1a2540] to-[#1e3040] flex items-center justify-center text-3xl mb-2">
            📸
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLiked((l) => !l)}
            className={`text-xs flex items-center gap-1 transition-colors duration-150 ${
              liked ? "text-pink-400" : "text-slate-500 hover:text-pink-400"
            }`}
          >
            {liked ? "♥" : "♡"} {likeCount} likes
          </button>
          <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-150">
            💬 {item.comments} comments
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HikingPage({ onBack } = {}) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);

  // ── Get user location on mount ──
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setUserLocation({ lat: 37.7749, lon: -122.4194 }) // fallback: SF
    );
  }, []);

  // ── Fetch trails when location is ready ──
  useEffect(() => {
    if (userLocation) fetchTrails(userLocation.lat, userLocation.lon);
  }, [userLocation]);

  // ── TrailAPI fetch ──
  const fetchTrails = useCallback(async (lat, lon, searchQuery = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat,
        lon,
        radius: 30,
        limit: 20,
        ...(searchQuery && { "q[name_cont]": searchQuery }),
      });

      const res = await fetch(
        `https://${RAPIDAPI_HOST}/trails/explore/?${params}`,
        {
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch trails");
      const data = await res.json();

      // Normalize TrailAPI response shape
      const normalized = (data.data || []).map((t, i) => ({
        id: t.unique_id ?? i,
        name: t.name,
        city: t.city,
        state: t.state,
        lat: t.lat,
        lon: t.lon,
        description: t.description,
        directions: t.directions,
        difficulty: parseDifficulty(t.activities),
        length: t.activities?.[0]?.attribs?.length ?? null,
        ascent: t.activities?.[0]?.attribs?.["ele_gain"] ?? null,
        rating: t.activities?.[0]?.rating ?? null,
        ratingCount: t.activities?.[0]?.rating_count ?? null,
        thumbnail: t.activities?.[0]?.thumbnail ?? null,
        url: t.activities?.[0]?.url ?? null,
        features: parseFeatures(t),
      }));

      setTrails(normalized);
    } catch (err) {
      console.error(err);
      setError("Couldn't load trails. Check your API key or try again.");
      // Fall back to mock data so the UI still renders nicely
      setTrails(MOCK_TRAILS);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    if (userLocation) fetchTrails(userLocation.lat, userLocation.lon, query);
  };

  const handleSave = async (trail) => {
    // TODO: wire to your Supabase someday_items table
    // await supabase.from('someday_items').insert({ user_id, type: 'trail', ref_id: trail.id, data: trail })
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(trail.id) ? next.delete(trail.id) : next.add(trail.id);
      return next;
    });
  };

  // ── Filter trails client-side ──
  const filteredTrails = trails.filter((t) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Easy") return t.difficulty === 1;
    if (activeFilter === "Moderate") return t.difficulty === 2;
    if (activeFilter === "Hard") return t.difficulty === 3;
    return t.features?.some((f) =>
      f.toLowerCase().includes(activeFilter.toLowerCase())
    );
  });

  const featuredTrail = filteredTrails[0] ?? null;
  const gridTrails = filteredTrails.slice(1, 7);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0e1520] text-slate-200 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">

        {/* ── Top bar ── */}
        {onBack && (
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-300 active:opacity-70 flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <h1 className="font-['Caveat'] text-3xl font-bold text-slate-100 leading-tight">Hiking & Outdoors</h1>
              <p className="text-[11px] text-slate-500">
                {loading ? "Loading…" : `${trails.length} trail${trails.length !== 1 ? "s" : ""} nearby`}
              </p>
            </div>
          </div>
        )}

        {/* ── Hero ── */}
        <div className="relative bg-gradient-to-br from-[#0f2027] via-[#162b3a] to-[#0e1520] rounded-3xl p-8 mb-6 overflow-hidden border border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(45,212,191,0.08),transparent)]" />
          <div className="absolute right-8 top-6 text-8xl opacity-10 rotate-12 select-none">🏔️</div>

          <p className="text-[10px] uppercase tracking-[0.15em] text-teal-400 mb-2 opacity-80">
            Explore · Hiking
          </p>
          <h1 className="font-['Caveat'] text-5xl font-bold leading-tight mb-2 bg-gradient-to-r from-slate-100 to-teal-300 bg-clip-text text-transparent">
            Hit the trails
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
            Discover trails near you, save hikes to your Someday List, and see where your friends have been adventuring.
          </p>

          <div className="flex gap-6 flex-wrap">
            {[
              { num: `${trails.length || "—"}`, lbl: "Trails nearby" },
              { num: MOCK_FEED.length, lbl: "Friends hiked" },
              { num: savedIds.size, lbl: "Someday saves" },
            ].map(({ num, lbl }) => (
              <div key={lbl} className="flex flex-col">
                <span className="font-['Caveat'] text-3xl font-bold text-teal-400 leading-none">
                  {num}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">
                  {lbl}
                </span>
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
            className="flex-1 bg-[#161f30] border border-white/7 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-teal-400/40 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-teal-400 text-[#0e1520] rounded-2xl px-5 py-3 text-sm font-medium hover:bg-teal-300 transition-colors disabled:opacity-50 whitespace-nowrap"
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
                  ? "bg-teal-400/12 border-teal-400/40 text-teal-400"
                  : "bg-[#161f30] border-white/7 text-slate-500 hover:text-teal-400 hover:border-teal-400/25"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#161f30] rounded-2xl h-64 animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {/* ── Featured trail ── */}
        {!loading && featuredTrail && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">
              Featured trail
            </p>
            <div className="bg-[#161f30] border border-teal-400/15 rounded-3xl overflow-hidden mb-8 hover:border-teal-400/30 transition-colors cursor-pointer">
              <div className="grid grid-cols-2 max-sm:grid-cols-1">
                {featuredTrail.thumbnail ? (
                  <img
                    src={featuredTrail.thumbnail}
                    alt={featuredTrail.name}
                    className="w-full h-52 object-cover"
                  />
                ) : (
                  <div className="h-52 flex items-center justify-center text-7xl bg-gradient-to-br from-[#162b3a] to-[#1a3a4a]">
                    🌲
                  </div>
                )}
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-widest text-teal-400 mb-2">
                    ⭐ Top rated this week
                  </p>
                  <h2 className="font-['Caveat'] text-2xl font-bold text-slate-100 leading-tight mb-2">
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
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-400">
                          {Number(featuredTrail.length).toFixed(1)} mi
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Distance</span>
                      </div>
                    )}
                    {featuredTrail.ascent && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-400">
                          {Math.round(featuredTrail.ascent).toLocaleString()} ft
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Elevation</span>
                      </div>
                    )}
                    {featuredTrail.rating && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-400">
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
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">
              Trails near you
            </p>
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3 mb-8">
              {gridTrails.map((trail) => (
                <TrailCard
                  key={trail.id}
                  trail={trail}
                  onSave={handleSave}
                  savedIds={savedIds}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && filteredTrails.length === 0 && !error && (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="font-['Caveat'] text-2xl text-slate-400 mb-1">No trails found</p>
            <p className="text-sm">Try a different location or filter</p>
          </div>
        )}

        {/* ── Someday banner ── */}
        {savedIds.size > 0 && (
          <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/8 border border-violet-400/20 rounded-3xl p-5 mb-8 flex items-center gap-4">
            <span className="text-3xl flex-shrink-0">📌</span>
            <div>
              <h3 className="font-['Caveat'] text-xl font-bold text-slate-100 leading-tight">
                Your Someday List
              </h3>
              <p className="text-sm text-slate-500">
                You've saved {savedIds.size} trail{savedIds.size !== 1 ? "s" : ""} — ready to pick a date?
              </p>
            </div>
            <button className="ml-auto bg-violet-400/12 border border-violet-400/25 rounded-2xl px-4 py-2.5 text-sm text-violet-400 hover:bg-violet-400/20 transition-all whitespace-nowrap">
              View list →
            </button>
          </div>
        )}

        {/* ── Community feed ── */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">
          Friends' recent hikes
        </p>
        <div className="flex flex-col gap-2.5">
          {MOCK_FEED.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>

      </div>
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
  if (trail.description?.toLowerCase().includes("dog")) features.push("Dog Friendly");
  if (trail.description?.toLowerCase().includes("kid") || trail.description?.toLowerCase().includes("family")) features.push("Kid Friendly");
  if (trail.description?.toLowerCase().includes("view") || trail.description?.toLowerCase().includes("summit")) features.push("Views");
  return features;
}

// ─── Mock data (used when API key not set or request fails) ──────────────────

const MOCK_TRAILS = [
  {
    id: 1,
    name: "Mission Peak Loop",
    city: "Fremont",
    state: "California",
    difficulty: 2,
    length: 6.1,
    ascent: 2100,
    rating: 4.7,
    ratingCount: 312,
    thumbnail: null,
    features: ["Views"],
  },
  {
    id: 2,
    name: "Muir Woods Loop",
    city: "Mill Valley",
    state: "California",
    difficulty: 1,
    length: 2.4,
    ascent: 180,
    rating: 4.5,
    ratingCount: 891,
    thumbnail: null,
    features: ["Dog Friendly"],
  },
  {
    id: 3,
    name: "Mt. Tamalpais East Peak",
    city: "Marin County",
    state: "California",
    difficulty: 3,
    length: 10.5,
    ascent: 3400,
    rating: 4.9,
    ratingCount: 145,
    thumbnail: null,
    features: ["Views"],
  },
  {
    id: 4,
    name: "Lands End Trail",
    city: "San Francisco",
    state: "California",
    difficulty: 1,
    length: 3.5,
    ascent: 320,
    rating: 4.6,
    ratingCount: 527,
    thumbnail: null,
    features: ["Kid Friendly"],
  },
  {
    id: 5,
    name: "Ring Mountain Preserve",
    city: "Tiburon",
    state: "California",
    difficulty: 2,
    length: 4.2,
    ascent: 850,
    rating: 4.4,
    ratingCount: 203,
    thumbnail: null,
    features: ["Views", "Dog Friendly"],
  },
];
