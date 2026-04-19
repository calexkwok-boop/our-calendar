import { useState, useEffect, useRef } from "react";
import MoviesPage from "./MoviesPage";
import BoardGamePage from "./BoardGamePage";
import RestaurantPage from "./RestaurantPage";
import HikingPage from "./HikingPage";
import DreamShelfPage from "./DreamShelfPage";
import DestinationsPage from "./DestinationsPage";

const TMDB_KEY = "b66752afda91b8258d32f4388f049a22";
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

const FRIEND_POSTS = [];

const COMMUNITY_POSTS = [
  { id: "c1", type: "hiking", icon: "🥾", page: "Hiking & Outdoors", time: "Trending", cardTitle: "Lands End Trail", location: "San Francisco · 3.4 mi", desc: "Stunning coastal views, moderate difficulty. Best visited at golden hour.", votes: 183, tag: "Hiking", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan it"] },
  { id: "c2", type: "games", icon: "🎲", page: "Board Games", time: "Community pick", cardTitle: "Wingspan", desc: "Elegant engine-builder about birds. Perfect for 2–5 players, around 90 minutes.", votes: 312, tag: "Games", actions: ["Add to someday", "Plan game night"] },
  { id: "c3", type: "restaurants", icon: "🍜", page: "Restaurants", time: "New addition", cardTitle: "Dumpling Time", location: "SoMa, San Francisco", desc: "Handcrafted dumplings, beautiful space. The XLB are unmissable.", votes: 198, tag: "Restaurants", imageUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan dinner"] },
  { id: "c4", type: "products", icon: "✨", page: "Dream Shelf", time: "Most dreamed about", cardTitle: "Rolex Submariner", desc: "A forever watch with quiet presence — the kind of piece people save for and keep for life.", votes: 247, tag: "Dream Shelf", imageUrl: "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1200/v1/a677b2c664f6/catalogue/2026/upright-c/m124060-0001", actions: ["Add to someday", "Open Dream Shelf"] },
  { id: "c5", type: "destinations", icon: "✈️", page: "Destinations", time: "Dream trip", cardTitle: "Kyoto in Cherry Blossom Season", location: "Japan", desc: "Temples, lantern-lit alleys, and a city transformed by spring. Save this one for the kind of trip you plan around.", votes: 276, tag: "Destinations", imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan trip"] },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const EXPLORE_IMAGE_FALLBACKS = {
  hiking: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  restaurants: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=900&q=80",
  products: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
  destinations: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80",
};

function getExploreImageUrl(post = {}) {
  if (post.imageUrl) return post.imageUrl;
  if (!["destinations", "hiking", "products", "restaurants"].includes(post.type)) return "";

  const text = `${post.cardTitle || ""} ${post.location || ""}`.toLowerCase();
  if (post.type === "hiking") {
    if (text.includes("coast") || text.includes("lands end") || text.includes("beach")) return EXPLORE_IMAGE_FALLBACKS.hiking;
    if (text.includes("waterfall") || text.includes("falls")) return "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=80";
    if (text.includes("forest") || text.includes("woods")) return "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80";
    return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80";
  }
  if (post.type === "restaurants") {
    if (text.includes("dumpling") || text.includes("noodle") || text.includes("ramen")) return EXPLORE_IMAGE_FALLBACKS.restaurants;
    if (text.includes("sushi")) return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80";
    if (text.includes("pizza") || text.includes("italian")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80";
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
  }
  if (post.type === "destinations") {
    if (text.includes("kyoto") || text.includes("japan")) return EXPLORE_IMAGE_FALLBACKS.destinations;
    if (text.includes("beach") || text.includes("island") || text.includes("santorini")) return "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=80";
    if (text.includes("paris")) return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80";
    return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80";
  }
  return EXPLORE_IMAGE_FALLBACKS.products;
}

const SOURCE_CONFIG = {
  friends:     { label: "Friends",           sub: "Events, trips & moments", icon: "👥", bg: "bg-teal-500/10" },
  movies:      { label: "Movies",            sub: "2.4k members",            icon: "🎬", bg: "bg-purple-500/10" },
  hiking:      { label: "Hiking & Outdoors", sub: "1.8k members",            icon: "🥾", bg: "bg-green-500/10" },
  games:       { label: "Board Games",       sub: "892 members",             icon: "🎲", bg: "bg-amber-500/10" },
  restaurants: { label: "Restaurants",       sub: "3.1k members",            icon: "🍜", bg: "bg-pink-500/10" },
  products:    { label: "Dream Shelf",        sub: "Someday-worthy finds", icon: "✨", bg: "bg-violet-500/10" },
  destinations:{ label: "Destinations",       sub: "Trips worth dreaming about", icon: "✈️", bg: "bg-indigo-500/10" },
};

const TAG_STYLES = {
  Friends:     "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Movies:      "bg-purple-500/10 text-purple-600 dark:text-purple-300",
  Hiking:      "bg-green-500/10 text-green-600 dark:text-green-400",
  Games:       "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Restaurants: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Dream Shelf": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Destinations:"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

function useSwipeDownSheet(onClose, open) {
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(null);
  const dragDistanceRef = useRef(0);

  const handleStart = (clientY) => {
    dragStartYRef.current = clientY;
    dragDistanceRef.current = 0;
    setDragY(0);
  };

  const handleMove = (clientY) => {
    if (dragStartYRef.current == null) return;
    const delta = Math.max(0, clientY - dragStartYRef.current);
    dragDistanceRef.current = delta;
    setDragY(delta);
  };

  const handleEnd = () => {
    const shouldClose = dragDistanceRef.current > 90;
    dragStartYRef.current = null;
    dragDistanceRef.current = 0;
    setDragY(0);
    if (shouldClose) onClose?.();
  };

  return {
    sheetStyle: {
      transform: open ? `translateY(${dragY}px)` : undefined,
      transition: dragStartYRef.current ? "none" : "transform 180ms ease",
    },
    handleProps: {
      onTouchStart: (e) => handleStart(e.touches[0].clientY),
      onTouchMove: (e) => handleMove(e.touches[0].clientY),
      onTouchEnd: handleEnd,
      onMouseDown: (e) => handleStart(e.clientY),
      onMouseMove: (e) => {
        if (dragStartYRef.current == null) return;
        handleMove(e.clientY);
      },
      onMouseUp: handleEnd,
      onMouseLeave: () => {
        if (dragStartYRef.current != null) handleEnd();
      },
      style: { touchAction: "none", cursor: "grab" },
    },
  };
}

function interleavePosts(friends, movies, community) {
  const result = [];
  let fi = 0, mi = 0, ci = 0;
  while (fi < friends.length || mi < movies.length || ci < community.length) {
    if (fi < friends.length)   result.push(friends[fi++]);
    if (mi < movies.length)    result.push(movies[mi++]);
    if (fi < friends.length)   result.push(friends[fi++]);
    if (ci < community.length) result.push(community[ci++]);
  }
  return result;
}

function CardHeader({ post, onPageTap }) {
  const tappable = !!onPageTap && !post.avatar;
  return (
    <div
      className={`flex items-center gap-2.5 px-4 pt-4 pb-2.5${tappable ? ' cursor-pointer active:opacity-70' : ''}`}
      onClick={tappable ? () => onPageTap(post.type) : undefined}
    >
      {post.avatar ? (
        <div className="w-9 h-9 rounded-full bg-teal-500/15 text-teal-500 dark:text-teal-400 flex items-center justify-center text-sm font-medium flex-shrink-0">{post.avatar}</div>
      ) : (
        <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center text-lg flex-shrink-0">{post.icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight truncate">
          {post.name || post.page}
          {post.action && <span className="font-normal text-gray-500"> {post.action}</span>}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">{post.time}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-stone-100 dark:bg-white/[0.04]" />;
}

function VoteButtons({ initialVotes }) {
  const [votes, setVotes] = useState(initialVotes);
  return (
    <div className="ml-auto flex items-center gap-0.5">
      <button onClick={() => setVotes(v => v + 1)} className="text-gray-400 dark:text-gray-600 text-sm px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">▲</button>
      <span className="text-[11px] text-gray-400 dark:text-gray-600 min-w-[28px] text-center">{votes}</span>
      <button onClick={() => setVotes(v => Math.max(0, v - 1))} className="text-gray-400 dark:text-gray-600 text-sm px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">▼</button>
    </div>
  );
}

function FriendCard({ post }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#161f30] border border-stone-100 dark:border-transparent shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader post={post} />
      {post.isTrip ? (
        <div className="grid grid-cols-2 gap-0.5 border-y border-stone-100 dark:border-white/[0.04]">
          {["🏕️", "🌲"].map((e, i) => (
            <div key={i} className="aspect-square flex items-center justify-center text-3xl bg-stone-50 dark:bg-white/[0.03]">{e}</div>
          ))}
        </div>
      ) : <Divider />}
      <div className="px-4 py-2.5">
        <p className="text-sm text-gray-500 leading-relaxed">{post.text}</p>
      </div>
      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        {post.actions.map((a, i) => (
          <button key={a} className={`text-xs font-handwritten font-bold px-3.5 py-1.5 rounded-xl transition-opacity active:opacity-70 ${i === 0 ? "bg-teal-400 text-gray-900" : "bg-stone-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"}`}>{a}</button>
        ))}
      </div>
    </div>
  );
}

function MovieCard({ movie, onAddToSomeday, onRemoveFromSomeday, onPageTap, onPlanEvent }) {
  const [inSomeday, setInSomeday] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const year   = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const votes  = Math.max(10, Math.floor((movie.vote_count || 100) / 10));

  function handleSomeday(e) {
    e.stopPropagation();
    if (!inSomeday) {
      onAddToSomeday?.(movie);
    } else {
      onRemoveFromSomeday?.({ title: movie.title, emoji: '🎬', type: 'movies' });
    }
    setInSomeday(v => !v);
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-[#161f30] border border-stone-100 dark:border-transparent shadow-sm dark:shadow-none overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg flex-shrink-0 cursor-pointer active:opacity-70" onClick={() => onPageTap?.("movies")}>🎬</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors" onClick={() => onPageTap?.("movies")}>Movies</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Community pick</p>
        </div>
      </div>
      <div className="flex border-t border-stone-100 dark:border-white/[0.04] cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="w-[72px] flex-shrink-0 bg-purple-500/10">
          {posterUrl
            ? <img src={posterUrl} alt={movie.title} className="w-full h-[108px] object-cover" loading="lazy" />
            : <div className="w-full h-[108px] flex items-center justify-center text-2xl">🎬</div>
          }
        </div>
        <div className="flex-1 px-3.5 py-3 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{movie.title}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">{year} · ★ {rating}</p>
            <p className={`text-[11px] text-gray-500 leading-snug mt-1.5 ${expanded ? "" : "line-clamp-3"}`}>{movie.overview}</p>
            {(movie.overview?.length > 120) && (
              <p className="text-[11px] text-teal-500 mt-1">{expanded ? "Show less" : "More"}</p>
            )}
          </div>
          <p className="text-[10px] text-teal-500 mt-2">▲ {votes} votes</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-4 pt-2.5">
        <button onClick={handleSomeday} className={`flex-1 text-xs font-handwritten font-bold px-3 py-1.5 rounded-xl transition-all active:opacity-70 ${inSomeday ? "bg-teal-600 text-white" : "bg-teal-400 text-gray-900"}`}>
          {inSomeday ? "✓ Someday" : "+ Someday"}
        </button>
        <button
          onClick={() => onPlanEvent?.({ title: `Movie night: ${movie.title}` })}
          className="flex-1 text-xs font-handwritten font-bold px-3 py-1.5 rounded-xl bg-violet-500/10 dark:bg-violet-400/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 dark:border-violet-400/25 active:opacity-70"
        >
          + Plan
        </button>
        <VoteButtons initialVotes={votes} />
      </div>
    </div>
  );
}

const TYPE_EMOJI = { hiking: "🥾", games: "🎲", restaurants: "🍜", products: "✨", destinations: "✈️" };

function CommunityCard({ post, onPageTap, onPlanEvent, onAddToSomeday, onRemoveFromSomeday }) {
  const [inSomeday, setInSomeday] = useState(false);
  const imageUrl = getExploreImageUrl(post);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#161f30] border border-stone-100 dark:border-transparent shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader post={post} onPageTap={onPageTap} />
      <Divider />
      {imageUrl && post.type === "hiking" ? (
        <div className="flex mx-4 mt-3 rounded-2xl overflow-hidden bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.04]">
          <div className="w-[82px] h-[112px] flex-shrink-0 bg-green-500/10">
            <img
              src={imageUrl}
              alt={post.cardTitle}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0 px-3.5 py-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">{post.cardTitle}</p>
            {post.location && <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-1.5">{post.location}</p>}
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{post.desc}</p>
          </div>
        </div>
      ) : imageUrl && (
        <div
          className={`mx-4 mt-3 rounded-2xl overflow-hidden ${post.type === "products" ? "bg-stone-50 dark:bg-white/[0.03]" : "bg-stone-100 dark:bg-white/[0.04]"}`}
          onClick={() => onPageTap?.(post.type)}
        >
          <img
            src={imageUrl}
            alt={post.cardTitle}
            className={`w-full h-48 ${post.type === "products" ? "object-contain p-5" : "object-cover"}`}
            loading="lazy"
          />
        </div>
      )}
      {post.type !== "hiking" && (
        <div className="px-4 py-2.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">{post.cardTitle}</p>
          {post.location && <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-1.5">{post.location}</p>}
          <p className="text-sm text-gray-500 leading-relaxed">{post.desc}</p>
        </div>
      )}
      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        {post.actions.map((a, i) => {
          const isAmazonLink = post.type === "products" && i === 1 && post.amazonUrl;
          const actionClassName = `flex-1 text-xs font-bold px-3 py-1.5 rounded-xl active:opacity-70 ${
            i === 0
              ? `font-handwritten ${inSomeday ? "bg-teal-600 text-white" : "bg-teal-400 text-gray-900"}`
              : "font-handwritten bg-violet-500/10 dark:bg-violet-400/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 dark:border-violet-400/25"
          }`;

          if (isAmazonLink) {
            return (
              <a
                key={a}
                href={post.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${actionClassName} text-center`}
              >
                View on Amazon
              </a>
            );
          }

          return (
            <button
              key={a}
              onClick={() => {
              if (i === 0) {
                if (!inSomeday) {
                  onAddToSomeday?.({
                    title:    post.cardTitle,
                    emoji:    TYPE_EMOJI[post.type] || "✨",
                    type:     post.type,
                    imageUrl,
                    categoryId: post.type === "products" ? "buy" : undefined,
                  });
                } else {
                  onRemoveFromSomeday?.({
                    title: post.cardTitle,
                    emoji: TYPE_EMOJI[post.type] || "✨",
                    type:  post.type,
                  });
                }
                setInSomeday(v => !v);
              } else {
                if (post.type === "games") {
                  onPlanEvent?.({ title: `Game night: ${post.cardTitle}` });
                } else if (post.type === "hiking") {
                  onPlanEvent?.({
                    title: `Hike: ${post.cardTitle}`,
                    notes: post.location ? `Near ${post.location}` : '',
                    category: 'outdoors',
                  });
                } else if (post.type === "restaurants") {
                  onPlanEvent?.({
                    title: `Dinner at ${post.cardTitle}`,
                    notes: post.location ? post.location : '',
                    category: 'dinner',
                    location: post.location || post.cardTitle,
                  });
                } else if (post.type === "products") {
                  onPageTap?.("products");
                } else if (post.type === "destinations") {
                  onPlanEvent?.({
                    title: `Trip to ${post.cardTitle}`,
                    notes: post.location ? post.location : '',
                    category: 'trip',
                    location: post.location || post.cardTitle,
                  });
                }
              }
              }}
              className={actionClassName}
            >
              {i === 0
                ? (inSomeday ? "✓ Someday" : "+ Someday")
                : (post.type === "products" ? a : "+ Plan")}
            </button>
          );
        })}
        <VoteButtons initialVotes={post.votes} />
      </div>
    </div>
  );
}


function ToggleRow({ sourceKey, config, enabled, onToggle }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-stone-100 dark:border-white/[0.04] last:border-0">
      <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center text-lg flex-shrink-0`}>{config.icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-200">{config.label}</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-600">{config.sub}</p>
      </div>
      <button onClick={() => onToggle(sourceKey)} className={`w-11 h-6 rounded-full relative overflow-hidden transition-colors duration-200 flex-shrink-0 ${enabled ? "bg-teal-400" : "bg-stone-200 dark:bg-white/10"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function FilterDrawer({ open, sources, onToggle, onClose }) {
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose, open);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-[10002] bg-black/50 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} />
      <div className={`fixed bottom-0 left-0 right-0 z-[10002] max-w-lg mx-auto bg-white dark:bg-[#131c2e] rounded-t-3xl border-t border-stone-200 dark:border-white/[0.06] pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2.5rem))] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`} style={{ ...sheetStyle }}>
        <div {...handleProps} className="w-9 h-1 bg-stone-200 dark:bg-white/10 rounded-full mx-auto mt-3 mb-4" style={handleProps.style} />
        <h2 className="font-['Caveat',cursive] text-2xl font-semibold text-gray-900 dark:text-gray-100 px-5 pb-4">Feed settings</h2>
        <div className="px-5 mb-5">
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 dark:text-gray-600 mb-2.5">Social</p>
          <ToggleRow sourceKey="friends" config={SOURCE_CONFIG.friends} enabled={sources.friends} onToggle={onToggle} />
        </div>
        <div className="px-5 mb-6">
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 dark:text-gray-600 mb-2.5">Pages you've joined</p>
          {["movies", "hiking", "games", "restaurants", "products", "destinations"].map(key => (
            <ToggleRow key={key} sourceKey={key} config={SOURCE_CONFIG[key]} enabled={sources[key]} onToggle={onToggle} />
          ))}
        </div>
        <div className="px-5">
          <button onClick={onClose} className="w-full py-3.5 bg-teal-400 text-gray-900 font-medium rounded-2xl text-sm active:opacity-80">Done</button>
        </div>
      </div>
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-stone-50 dark:bg-[#161f30] border border-stone-100 dark:border-transparent overflow-hidden animate-pulse">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
        <div className="w-9 h-9 rounded-xl bg-stone-200 dark:bg-white/5 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-stone-200 dark:bg-white/5 rounded w-2/3" />
          <div className="h-2.5 bg-stone-200 dark:bg-white/5 rounded w-1/3" />
        </div>
      </div>
      <div className="flex border-t border-stone-100 dark:border-white/[0.04]">
        <div className="w-[72px] h-[108px] bg-stone-200 dark:bg-white/5 flex-shrink-0" />
        <div className="flex-1 px-3.5 py-3 space-y-2">
          <div className="h-3 bg-stone-200 dark:bg-white/5 rounded w-3/4" />
          <div className="h-2.5 bg-stone-200 dark:bg-white/5 rounded w-1/4" />
          <div className="h-2.5 bg-stone-200 dark:bg-white/5 rounded w-full" />
          <div className="h-2.5 bg-stone-200 dark:bg-white/5 rounded w-2/3" />
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-4 pt-2.5">
        <div className="h-7 bg-stone-200 dark:bg-white/5 rounded-xl w-28" />
        <div className="h-7 bg-stone-200 dark:bg-white/5 rounded-xl w-16" />
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  const tone =
    label === "Good for this weekend"
      ? "text-amber-700 dark:text-amber-300"
      : label === "Hidden gems"
        ? "text-violet-700 dark:text-violet-300"
        : label === "Trending"
          ? "text-rose-700 dark:text-rose-300"
          : label === "From your friends"
            ? "text-teal-700 dark:text-teal-300"
            : "text-gray-600 dark:text-gray-300";

  return (
    <div className="px-4 pt-5 pb-2">
      <p className={`font-handwritten text-[20px] font-bold leading-none ${tone}`}>
        {label}
      </p>
    </div>
  );
}

// ─── Browse by interest grid ──────────────────────────────────────────────────
function CategoryGrid({ onPageTap }) {
  const cats = [
    { key: 'movies',      icon: '🎬', label: 'Movies',            page: 'movies' },
    { key: 'games',       icon: '🎲', label: 'Board Games',       page: 'games' },
    { key: 'hiking',      icon: '🥾', label: 'Hiking & Outdoors', page: 'hiking' },
    { key: 'restaurants', icon: '🍜', label: 'Restaurants',       page: 'restaurants' },
    { key: 'products',    icon: '✨', label: 'Dream Shelf',        page: 'products' },
    { key: 'destinations',icon: '✈️', label: 'Destinations',      page: 'destinations' },
  ];
  return (
    <div className="px-3.5 grid grid-cols-2 gap-2.5">
      {cats.map(c => (
        <button
          key={c.key}
          onClick={() => c.page && onPageTap(c.page)}
          className={`flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#161f30] border border-stone-100 dark:border-transparent shadow-sm text-left active:opacity-70 transition-opacity ${c.page ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
        >
          <span className="text-2xl">{c.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{c.label}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">{SOURCE_CONFIG[c.key]?.sub || ''}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function ExplorePage({ onAddToSomeday, onRemoveFromSomeday, onPlanEvent = () => {}, darkMode = false }) {
  const [sources, setSources]             = useState({ friends: true, movies: true, hiking: true, games: true, restaurants: true, products: true, destinations: true });
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [search, setSearch]               = useState("");
  const [movies, setMovies]               = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError]     = useState(false);
  const [moviesRetry, setMoviesRetry]     = useState(0);
  const [activePage, setActivePage]       = useState(null);

  useEffect(() => {
    if (!sources.movies) return;
    let cancelled = false;
    setMoviesLoading(true);
    setMoviesError(false);
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=en-US&page=1`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setMovies(data.results || []); setMoviesLoading(false); } })
      .catch(() => { if (!cancelled) { setMoviesError(true); setMoviesLoading(false); } });
    return () => { cancelled = true; };
  }, [sources.movies, moviesRetry]);

  if (activePage === "movies") {
    return <MoviesPage onBack={() => setActivePage(null)} onAddToSomeday={onAddToSomeday} onPlanEvent={onPlanEvent} />;
  }
  if (activePage === "hiking") {
    return <HikingPage onBack={() => setActivePage(null)} onPlanEvent={onPlanEvent} darkMode={darkMode} />;
  }
  if (activePage === "products") {
    return <DreamShelfPage onBack={() => setActivePage(null)} onAddToSomeday={onAddToSomeday} onAddEvent={onPlanEvent} darkMode={darkMode} />;
  }
  if (activePage === "games") {
    return <BoardGamePage onBack={() => setActivePage(null)} onAddEvent={onPlanEvent} onAddToSomeday={onAddToSomeday} darkMode={darkMode} />;
  }
  if (activePage === "restaurants") {
    return <RestaurantPage onBack={() => setActivePage(null)} onAddEvent={onPlanEvent} onSaveToSomeday={onAddToSomeday} onRemoveFromSomeday={onRemoveFromSomeday} darkMode={darkMode} />;
  }
  if (activePage === "destinations") {
    return <DestinationsPage onBack={() => setActivePage(null)} onAddEvent={onPlanEvent} onSaveToSomeday={onAddToSomeday} onRemoveFromSomeday={onRemoveFromSomeday} darkMode={darkMode} />;
  }

  const anyOff        = Object.values(sources).some(v => !v);
  const moviePosts    = shuffle(movies.slice(0, 20)).slice(0, 6).map(m => ({ ...m, type: "movies" }));
  const activeFriends = sources.friends ? FRIEND_POSTS : [];
  const activeCom     = shuffle(COMMUNITY_POSTS.filter(p => sources[p.type]));
  const activeMovies  = sources.movies && !moviesLoading ? moviePosts : [];
  const allPosts      = interleavePosts(activeFriends, activeMovies, activeCom);
  const visiblePosts  = search.trim()
    ? allPosts.filter(p => {
        const q   = search.toLowerCase();
        const hay = [p.name, p.page, p.text, p.title, p.cardTitle, p.desc, p.location, p.overview].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      })
    : allPosts;

  // ─── Discovery sections (non-search, deduplication via Set) ───────────────
  const sectionData = (() => {
    const moviesByRating = [...activeMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    const comByVotesDesc = [...activeCom].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const used = new Set();
    function take(items, limit) {
      const out = [];
      for (const item of items) {
        if (out.length >= limit) break;
        if (!used.has(String(item.id))) { used.add(String(item.id)); out.push(item); }
      }
      return out;
    }
    // "Good for this weekend" — casual/quick community items + top-rated movies
    const weekend  = take([...activeCom.filter(p => ['hiking', 'restaurants', 'destinations'].includes(p.type)), ...moviesByRating], 5);
    // "From your friends" — friend activity posts (omit if empty)
    const friends  = activeFriends.length > 0 ? take(activeFriends, 4) : [];
    // "Hidden gems" — lower-voted community + lower-popularity movies
    const gems     = take([...[...comByVotesDesc].reverse(), ...[...moviesByRating].reverse()], 4);
    // "Trending" — highest-voted community + top movies by rating
    const trending = take([...comByVotesDesc, ...moviesByRating], 6);
    return { weekend, friends, gems, trending };
  })();

  function renderCard(post) {
    if (post.type === 'movies') return <MovieCard key={`movie-${post.id}`} movie={post} onAddToSomeday={onAddToSomeday} onRemoveFromSomeday={onRemoveFromSomeday} onPageTap={setActivePage} onPlanEvent={onPlanEvent} />;
    if (post.type === 'friends') return <FriendCard key={post.id} post={post} />;
    return <CommunityCard key={post.id} post={post} onPageTap={setActivePage} onPlanEvent={onPlanEvent} onAddToSomeday={onAddToSomeday} onRemoveFromSomeday={onRemoveFromSomeday} />;
  }

  function toggleSource(key) { setSources(prev => ({ ...prev, [key]: !prev[key] })); }

  return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-[#0e1520] pb-28">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap'); .font-handwritten { font-family: 'Caveat', cursive; }`}</style>
      <div className="bg-white dark:bg-[#131c2e] border-b border-stone-200 dark:border-white/[0.05] px-4 pt-5 pb-3 sticky top-0 z-30">
        <h1 className="font-handwritten text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">Explore</h1>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-stone-100 dark:bg-white/[0.06] rounded-2xl px-3.5 py-2.5">
            <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 14 14">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search movies, friends, places, trips..."
              className="bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none flex-1 min-w-0"
            />
            {search && <button onClick={() => setSearch("")} className="text-gray-400 dark:text-gray-600 text-xs leading-none">✕</button>}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-colors ${anyOff ? "bg-teal-500/15 text-teal-600 dark:text-teal-400" : "bg-stone-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300"}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 13 13">
              <path d="M1 2.5h11M3 6.5h7M5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* ── Search results ─────────────────────────────────────────────────── */}
      {search.trim() && (
        <>
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 dark:text-gray-600 px-4 pt-5 pb-3">
            Results for "{search}"
          </p>
          <div className="px-3.5 flex flex-col gap-3">
            {visiblePosts.length === 0
              ? <div className="text-center py-16 text-gray-400 dark:text-gray-600 text-sm">No results found</div>
              : visiblePosts.map(post => renderCard(post))
            }
          </div>
        </>
      )}

      {/* ── Discovery feed ─────────────────────────────────────────────────── */}
      {!search.trim() && (
        <>
          {moviesLoading && sources.movies && (
            <div className="px-3.5 flex flex-col gap-3 pt-3"><SkeletonCard /><SkeletonCard /></div>
          )}
          {moviesError && sources.movies && (
            <div className="px-3.5 pt-3">
              <div className="rounded-2xl bg-white dark:bg-[#161f30] border border-stone-100 dark:border-transparent px-4 py-5 text-center shadow-sm dark:shadow-none">
                <p className="text-sm text-gray-500">Couldn't load movies</p>
                <button onClick={() => setMoviesRetry(n => n + 1)} className="text-xs text-teal-500 mt-1">Try again</button>
              </div>
            </div>
          )}

          {sectionData.weekend.length > 0 && (
            <>
              <SectionHeader label="Good for this weekend" />
              <div className="px-3.5 flex flex-col gap-3">
                {sectionData.weekend.map(post => renderCard(post))}
              </div>
            </>
          )}

          {sectionData.friends.length > 0 && (
            <>
              <SectionHeader label="From your friends" />
              <div className="px-3.5 flex flex-col gap-3">
                {sectionData.friends.map(post => renderCard(post))}
              </div>
            </>
          )}

          {sectionData.gems.length > 0 && (
            <>
              <SectionHeader label="Hidden gems" />
              <div className="px-3.5 flex flex-col gap-3">
                {sectionData.gems.map(post => renderCard(post))}
              </div>
            </>
          )}

          {sectionData.trending.length > 0 && (
            <>
              <SectionHeader label="Trending" />
              <div className="px-3.5 flex flex-col gap-3">
                {sectionData.trending.map(post => renderCard(post))}
              </div>
            </>
          )}

          {!moviesLoading && sectionData.weekend.length === 0 && sectionData.trending.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-600 text-sm">
              All sources hidden — open Filter to turn some back on
            </div>
          )}

          <SectionHeader label="Browse by interest" />
          <CategoryGrid onPageTap={setActivePage} />
        </>
      )}

      <FilterDrawer open={drawerOpen} sources={sources} onToggle={toggleSource} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
