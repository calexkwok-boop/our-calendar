import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Mock data — replace with real Supabase queries + TMDB API calls
// ---------------------------------------------------------------------------
const MOCK_POSTS = [
  {
    id: 1,
    type: "friends",
    avatar: "MK",
    name: "Maya K.",
    action: "is going to",
    time: "2h ago",
    text: "Wine & Jazz Night at the SFJAZZ Center this Friday — anyone want to come?",
    tag: "Friends",
    actions: ["Save event", "Join them"],
  },
  {
    id: 2,
    type: "movies",
    icon: "🎬",
    page: "Movies",
    time: "Top pick",
    movieTitle: "Sinners",
    year: "2025",
    rating: "8.2",
    overview: "Ryan Coogler's supernatural thriller set in the 1930s Mississippi Delta. Incredible performances.",
    votes: 247,
    tag: "Movies",
    posterEmoji: "🎬",
  },
  {
    id: 3,
    type: "friends",
    avatar: "JL",
    name: "Jake L.",
    action: "just got back from",
    time: "5h ago",
    text: "Big Sur camping trip — three nights, zero cell service, completely worth it",
    tag: "Friends",
    isTrip: true,
    actions: ["Save to inspiration", "Plan similar"],
  },
  {
    id: 4,
    type: "hiking",
    icon: "🥾",
    page: "Hiking & Outdoors",
    time: "Trending",
    cardTitle: "Lands End Trail",
    location: "San Francisco · 3.4 mi",
    desc: "Stunning coastal views, moderate difficulty. Best visited at golden hour.",
    votes: 183,
    tag: "Hiking",
    actions: ["Add to someday", "Plan it"],
  },
  {
    id: 5,
    type: "friends",
    avatar: "SR",
    name: "Sofia R.",
    action: "added to her someday list",
    time: "Yesterday",
    text: '"Challengers" — said it\'s the perfect Friday night watch',
    tag: "Friends",
    actions: ["Add to my someday", "See more"],
  },
  {
    id: 6,
    type: "games",
    icon: "🎲",
    page: "Board Games",
    time: "Community pick",
    cardTitle: "Wingspan",
    desc: "Elegant engine-builder about birds. Perfect for 2–5 players, around 90 minutes. Great for a cozy weekend.",
    votes: 312,
    tag: "Games",
    actions: ["Add to someday", "Plan game night"],
  },
  {
    id: 7,
    type: "restaurants",
    icon: "🍜",
    page: "Restaurants",
    time: "New addition",
    cardTitle: "Dumpling Time",
    location: "SoMa, San Francisco",
    desc: "Handcrafted dumplings, beautiful space. The XLB are unmissable. Reservations recommended on weekends.",
    votes: 198,
    tag: "Restaurants",
    actions: ["Add to someday", "Plan dinner"],
  },
  {
    id: 8,
    type: "friends",
    avatar: "TN",
    name: "Tom N.",
    action: "is planning",
    time: "2d ago",
    text: "Pickleball at Mission Dolores Park — Saturday morning, all skill levels welcome",
    tag: "Friends",
    actions: ["Join event", "Save"],
  },
];

const SOURCE_CONFIG = {
  friends:     { label: "Friends",          sub: "Events, trips & moments", icon: "👥", bg: "bg-teal-500/10" },
  movies:      { label: "Movies",           sub: "2.4k members",            icon: "🎬", bg: "bg-purple-500/10" },
  hiking:      { label: "Hiking & Outdoors",sub: "1.8k members",            icon: "🥾", bg: "bg-green-500/10" },
  games:       { label: "Board Games",      sub: "892 members",             icon: "🎲", bg: "bg-amber-500/10" },
  restaurants: { label: "Restaurants",      sub: "3.1k members",            icon: "🍜", bg: "bg-pink-500/10" },
};

const TAG_STYLES = {
  Friends:     "bg-teal-500/10 text-teal-400",
  Movies:      "bg-purple-500/10 text-purple-300",
  Hiking:      "bg-green-500/10 text-green-400",
  Games:       "bg-amber-500/10 text-amber-400",
  Restaurants: "bg-pink-500/10 text-pink-400",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SourceTag({ tag }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full tracking-wide ${TAG_STYLES[tag] || "bg-white/10 text-white/50"}`}>
      {tag}
    </span>
  );
}

function CardHeader({ post }) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
      {post.avatar ? (
        <div className="w-9 h-9 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
          {post.avatar}
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl bg-white/5 dark:bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
          {post.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100 dark:text-gray-100 text-gray-800 leading-tight">
          {post.name || post.page}
          {post.action && (
            <span className="font-normal text-gray-500 dark:text-gray-500"> {post.action}</span>
          )}
        </p>
        <p className="text-[11px] text-gray-600 dark:text-gray-600 mt-0.5">{post.time}</p>
      </div>
      <SourceTag tag={post.tag} />
    </div>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-white/[0.04]" />;
}

function ActionButtons({ actions }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-4 pt-2.5">
      {actions.map((a, i) => (
        <button
          key={a}
          className={`text-xs font-medium px-3.5 py-1.5 rounded-xl transition-opacity active:opacity-70 ${
            i === 0
              ? "bg-teal-400 text-gray-900"
              : "bg-white/5 dark:bg-white/5 text-gray-400"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card types
// ---------------------------------------------------------------------------

function FriendCard({ post }) {
  return (
    <div className="rounded-2xl bg-[#161f30] dark:bg-[#161f30] bg-white overflow-hidden">
      <CardHeader post={post} />
      {post.isTrip && (
        <div className="grid grid-cols-2 gap-0.5 border-y border-white/[0.04]">
          {["🏕️", "🌲"].map((e, i) => (
            <div key={i} className="aspect-square flex items-center justify-center text-3xl bg-white/[0.03]">
              {e}
            </div>
          ))}
        </div>
      )}
      {!post.isTrip && <Divider />}
      <div className="px-4 py-2.5">
        <p className="text-sm text-gray-500 leading-relaxed">{post.text}</p>
      </div>
      <ActionButtons actions={post.actions} />
    </div>
  );
}

function MovieCard({ post, onSomeday }) {
  const [inSomeday, setInSomeday] = useState(false);
  const [votes, setVotes] = useState(post.votes);

  function handleSomeday() {
    setInSomeday(v => !v);
    onSomeday?.(post);
  }

  return (
    <div className="rounded-2xl bg-[#161f30] dark:bg-[#161f30] bg-white overflow-hidden">
      <CardHeader post={post} />
      <div className="flex border-t border-white/[0.04]">
        <div className="w-[70px] h-[105px] bg-purple-500/10 flex items-center justify-center text-3xl flex-shrink-0">
          {post.posterEmoji}
        </div>
        <div className="flex-1 px-3.5 py-3 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-100 dark:text-gray-100 text-gray-800">
              {post.movieTitle}
            </p>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {post.year} · ★ {post.rating}
            </p>
            <p className="text-[11px] text-gray-600 leading-snug mt-1.5 line-clamp-3">
              {post.overview}
            </p>
          </div>
          <p className="text-[10px] text-teal-500 mt-2">▲ {votes} votes</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-4 pt-2.5">
        <button
          onClick={handleSomeday}
          className={`text-xs font-medium px-3.5 py-1.5 rounded-xl transition-all active:opacity-70 ${
            inSomeday
              ? "bg-teal-600 text-white"
              : "bg-teal-400 text-gray-900"
          }`}
        >
          {inSomeday ? "✓ In someday list" : "+ Someday list"}
        </button>
        <button className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-white/5 text-gray-400">
          Plan it
        </button>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setVotes(v => v + 1)}
            className="text-gray-600 text-sm px-2 py-1 rounded-lg hover:bg-white/5 hover:text-teal-400 transition-colors"
          >▲</button>
          <button
            onClick={() => setVotes(v => Math.max(0, v - 1))}
            className="text-gray-600 text-sm px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >▼</button>
        </div>
      </div>
    </div>
  );
}

function CommunityCard({ post }) {
  const [votes, setVotes] = useState(post.votes);

  return (
    <div className="rounded-2xl bg-[#161f30] dark:bg-[#161f30] bg-white overflow-hidden">
      <CardHeader post={post} />
      <Divider />
      <div className="px-4 py-2.5">
        <p className="text-sm font-medium text-gray-100 dark:text-gray-100 text-gray-800 mb-0.5">
          {post.cardTitle}
        </p>
        {post.location && (
          <p className="text-[11px] text-gray-600 mb-1.5">{post.location}</p>
        )}
        <p className="text-sm text-gray-500 leading-relaxed">{post.desc}</p>
        <p className="text-[10px] text-teal-500 mt-2">▲ {votes} votes</p>
      </div>
      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        {post.actions.map((a, i) => (
          <button
            key={a}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-xl transition-opacity active:opacity-70 ${
              i === 0
                ? "bg-teal-400 text-gray-900"
                : "bg-white/5 text-gray-400"
            }`}
          >
            {a}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setVotes(v => v + 1)}
            className="text-gray-600 text-sm px-2 py-1 rounded-lg hover:bg-white/5 hover:text-teal-400 transition-colors"
          >▲</button>
          <button
            onClick={() => setVotes(v => Math.max(0, v - 1))}
            className="text-gray-600 text-sm px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >▼</button>
        </div>
      </div>
    </div>
  );
}

function FeedCard({ post, onSomeday }) {
  if (post.type === "movies") return <MovieCard post={post} onSomeday={onSomeday} />;
  if (post.type === "friends") return <FriendCard post={post} />;
  return <CommunityCard post={post} />;
}

// ---------------------------------------------------------------------------
// Filter drawer
// ---------------------------------------------------------------------------

function FilterDrawer({ open, sources, onToggle, onClose }) {
  const drawerRef = useRef(null);

  // close on backdrop tap
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-[#131c2e] dark:bg-[#131c2e] rounded-t-3xl border-t border-white/[0.06] pb-8 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-4" />

        <h2 className="font-['Caveat',cursive] text-2xl font-semibold text-gray-100 px-5 pb-4">
          Feed settings
        </h2>

        {/* Social section */}
        <div className="px-5 mb-5">
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 mb-2.5">
            Social
          </p>
          <ToggleRow
            sourceKey="friends"
            config={SOURCE_CONFIG.friends}
            enabled={sources.friends}
            onToggle={onToggle}
          />
        </div>

        {/* Pages section */}
        <div className="px-5 mb-5">
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 mb-2.5">
            Pages you've joined
          </p>
          {["movies", "hiking", "games", "restaurants"].map(key => (
            <ToggleRow
              key={key}
              sourceKey={key}
              config={SOURCE_CONFIG[key]}
              enabled={sources[key]}
              onToggle={onToggle}
            />
          ))}
        </div>

        <div className="px-5">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-teal-400 text-gray-900 font-medium rounded-2xl text-sm active:opacity-80 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

function ToggleRow({ sourceKey, config, enabled, onToggle }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center text-lg flex-shrink-0`}>
        {config.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-200">{config.label}</p>
        <p className="text-[11px] text-gray-600">{config.sub}</p>
      </div>
      <button
        onClick={() => onToggle(sourceKey)}
        className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
          enabled ? "bg-teal-400" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ExplorePage component
// ---------------------------------------------------------------------------

export default function ExplorePage({ currentUser, onAddToSomeday, onPlanEvent }) {
  const [sources, setSources] = useState({
    friends: true,
    movies: true,
    hiking: true,
    games: true,
    restaurants: true,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const anyOff = Object.values(sources).some(v => !v);

  const visiblePosts = MOCK_POSTS.filter(p => {
    if (!sources[p.type]) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = [p.name, p.page, p.text, p.movieTitle, p.cardTitle, p.desc, p.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    }
    return true;
  });

  function toggleSource(key) {
    setSources(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="min-h-screen bg-[#0e1520] dark:bg-[#0e1520] pb-24">

      {/* Top bar */}
      <div className="bg-[#131c2e] dark:bg-[#131c2e] border-b border-white/[0.05] px-4 pt-4 pb-3 sticky top-0 z-30">
        <h1 className="font-['Caveat',cursive] text-3xl font-semibold text-gray-100 mb-3">
          Explore
        </h1>
        <div className="flex gap-2">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 bg-white/[0.06] rounded-2xl px-3.5 py-2.5">
            <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 14 14">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search people, places, movies..."
              className="bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none flex-1 min-w-0"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-600 text-xs">✕</button>
            )}
          </div>

          {/* Filter button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-colors ${
              anyOff
                ? "bg-teal-500/15 text-teal-400"
                : "bg-white/[0.06] text-gray-400"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 13 13">
              <path d="M1 2.5h11M3 6.5h7M5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Section label */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-gray-600 px-4 pt-5 pb-2">
        {search ? `Results for "${search}"` : "Your feed"}
      </p>

      {/* Feed */}
      <div className="px-3.5 flex flex-col gap-3">
        {visiblePosts.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm">
            {search ? "No results found" : "All sources hidden — open Filter to turn some back on"}
          </div>
        ) : (
          visiblePosts.map(post => (
            <FeedCard
              key={post.id}
              post={post}
              onSomeday={onAddToSomeday}
            />
          ))
        )}
      </div>

      {/* Filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        sources={sources}
        onToggle={toggleSource}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
