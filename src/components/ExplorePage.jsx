import { useState, useEffect, useRef, useMemo } from "react";
import useGoogleImage from "../hooks/useGoogleImage";
import { createPortal } from "react-dom";
import MoviesPage from "./MoviesPage";
import BoardGamePage from "./BoardGamePage";
import RestaurantPage from "./RestaurantPage";
import HikingPage from "./HikingPage";
import DreamShelfPage from "./DreamShelfPage";
import DestinationsPage from "./DestinationsPage";
import { getDestinationImageOverride } from "../data/destinationImageOverrides";
import { supabase } from "../supabaseClient";

const TMDB_KEY = "b66752afda91b8258d32f4388f049a22";
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";


const FRIEND_POSTS = [];

const COMMUNITY_POOL = {
  hiking: [
    { id: "h1", type: "hiking", icon: "🥾", page: "Hiking & Outdoors", time: "Trending", cardTitle: "Lands End Trail", location: "San Francisco · 3.4 mi", desc: "Stunning coastal views, moderate difficulty. Best visited at golden hour.", votes: 183, tag: "Hiking", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan it"] },
    { id: "h2", type: "hiking", icon: "🥾", page: "Hiking & Outdoors", time: "Community pick", cardTitle: "Angels Landing", location: "Zion National Park · 4.3 mi", desc: "One of the most dramatic hikes in the US. Chain-assisted scramble to an insane summit view.", votes: 412, tag: "Hiking", imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan it"] },
    { id: "h3", type: "hiking", icon: "🥾", page: "Hiking & Outdoors", time: "Hidden gem", cardTitle: "Emerald Lake Trail", location: "Rocky Mountain NP · 3.2 mi", desc: "A string of alpine lakes through classic Rocky Mountain scenery. Easy enough to linger.", votes: 229, tag: "Hiking", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan it"] },
    { id: "h4", type: "hiking", icon: "🥾", page: "Hiking & Outdoors", time: "Bucket list", cardTitle: "The Narrows", location: "Zion National Park · 8.9 mi", desc: "Hike through the Virgin River between towering slot canyon walls. Wet feet, zero regrets.", votes: 374, tag: "Hiking", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan it"] },
    { id: "h5", type: "hiking", icon: "🥾", page: "Hiking & Outdoors", time: "Trending", cardTitle: "Skyline Trail Loop", location: "Mt. Rainier NP · 5.6 mi", desc: "Wildflowers, glaciers, and Rainier dominating the skyline. A Pacific Northwest classic.", votes: 301, tag: "Hiking", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan it"] },
  ],
  games: [
    { id: "g1", type: "games", icon: "🎲", page: "Board Games", time: "Community pick", cardTitle: "Wingspan",       desc: "Elegant engine-builder about birds. Perfect for 2–5 players, around 90 minutes.",              actions: ["Add to someday", "Plan game night"], imageQuery: "Wingspan board game box" },
    { id: "g2", type: "games", icon: "🎲", page: "Board Games", time: "Trending",       cardTitle: "Catan",          desc: "The gateway game that started it all. Trade, build, settle — and ruin a friendship or two.", actions: ["Add to someday", "Plan game night"], imageQuery: "Catan board game box" },
    { id: "g3", type: "games", icon: "🎲", page: "Board Games", time: "Community pick", cardTitle: "Ticket to Ride", desc: "Collect cards, claim routes, connect cities. Easy to learn, impossible to put down.",          actions: ["Add to someday", "Plan game night"], imageQuery: "Ticket to Ride board game box" },
    { id: "g4", type: "games", icon: "🎲", page: "Board Games", time: "Trending",       cardTitle: "Codenames",      desc: "The perfect party game. One word clues, big laughs, competitive enough to keep score.",       actions: ["Add to someday", "Plan game night"], imageQuery: "Codenames board game box" },
  ],
  restaurants: [
    { id: "r1", type: "restaurants", icon: "🍜", page: "Restaurants", time: "New addition", cardTitle: "Dumpling Time", location: "SoMa, San Francisco", desc: "Handcrafted dumplings, beautiful space. The XLB are unmissable.", votes: 198, tag: "Restaurants", imageUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan dinner"] },
    { id: "r2", type: "restaurants", icon: "🍜", page: "Restaurants", time: "Trending", cardTitle: "Nobu Los Angeles", location: "West Hollywood, LA", desc: "World-famous black cod miso in a room full of people having a great night.", votes: 341, tag: "Restaurants", imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan dinner"] },
    { id: "r3", type: "restaurants", icon: "🍜", page: "Restaurants", time: "Hidden gem", cardTitle: "Mariscos Jalisco", location: "East LA, Los Angeles", desc: "Legendary shrimp tacos with a cult following. Worth any detour, any day.", votes: 287, tag: "Restaurants", imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan dinner"] },
    { id: "r4", type: "restaurants", icon: "🍜", page: "Restaurants", time: "Bucket list", cardTitle: "The French Laundry", location: "Yountville, Napa Valley", desc: "The American bucket-list tasting menu. Three hours, twenty courses, one unforgettable night.", votes: 412, tag: "Restaurants", imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan dinner"] },
    { id: "r5", type: "restaurants", icon: "🍜", page: "Restaurants", time: "Community pick", cardTitle: "Bestia", location: "Downtown LA", desc: "House-made pastas and whole-animal roasts in a buzzy Arts District space. A dinner you talk about.", votes: 253, tag: "Restaurants", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan dinner"] },
  ],
  products: [
    { id: "p1",  type: "products", icon: "✨", page: "Someday", time: "Most dreamed about", cardTitle: "Rolex Submariner",         desc: "A forever watch with quiet presence — the kind of piece people save for and keep for life.",                              actions: ["Add to someday", "Open Someday"], imageUrl: "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1200/v1/a677b2c664f6/catalogue/2026/upright-c/m124060-0001" },
    { id: "p2",  type: "products", icon: "✨", page: "Someday", time: "Trending",           cardTitle: "Porsche Taycan Turbo S",     desc: "Electric, impossibly quick, and still unmistakably Porsche. The daily-drive dream with launch-control energy.",        actions: ["Add to someday", "Open Someday"], imageUrl: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/car8-porsche-taycan-turbo-s.avif" },
    { id: "p3",  type: "products", icon: "✨", page: "Someday", time: "Community pick",     cardTitle: "Le Creuset Dutch Oven",      desc: "The heirloom kitchen piece. Once you cook in it you understand why people pass these down.",                          actions: ["Add to someday", "Open Someday"], imageUrl: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/h9-le-creuset-dutch-oven.jpg" },
    { id: "p4",  type: "products", icon: "✨", page: "Someday", time: "Hidden gem",         cardTitle: "Breville Espresso Machine",  desc: "The morning ritual upgrade. Café energy at home, minus the line and the second errand.",                              actions: ["Add to someday", "Open Someday"], imageUrl: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/h10-breville-espresso-machine.png" },
    { id: "p5",  type: "products", icon: "✨", page: "Someday", time: "Most dreamed about", cardTitle: "Hermès Birkin 30",           desc: "The bag that started a waiting list. Quiet, rare, and somehow still the most recognized in any room.",                  actions: ["Add to someday", "Open Someday"], imageUrl: "https://assets.hermes.com/is/image/hermesedito/P_11_Birkin_2018?fit=wrap%2C0&wid=1920&resMode=sharp2&op_usm=1%2C1%2C6%2C0" },
    { id: "p6",  type: "products", icon: "✨", page: "Someday", time: "Trending",           cardTitle: "Whoop 4.0 Membership",       desc: "Recovery, sleep, and strain in one quiet habit. A little data ritual for taking care of yourself.",                   actions: ["Add to someday", "Open Someday"], imageUrl: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wl6-whoop-4-0-membership.webp" },
    { id: "p7",  type: "products", icon: "✨", page: "Someday", time: "Community pick",     cardTitle: "Cartier Love Bracelet",      desc: "The jewelry-box classic. Simple, recognizable, and somehow still deeply personal.",                                  actions: ["Add to someday", "Open Someday"], imageUrl: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/j1-cartier-love-bracelet.jpg" },
    { id: "p8",  type: "products", icon: "✨", page: "Someday", time: "Hidden gem",         cardTitle: "Vitamix Ascent A3500",       desc: "The blender that handles anything. Smoothies, soups, nut butters — it changes what you cook.",                       actions: ["Add to someday", "Open Someday"], imageUrl: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/h12-vitamix-ascent-a3500.avif" },
    { id: "p9",  type: "products", icon: "✨", page: "Someday", time: "Most dreamed about", cardTitle: "Cartier Santos",             desc: "A square-case icon with real history. Dressy enough for dinner, relaxed enough for every day.",                      actions: ["Add to someday", "Open Someday"], imageUrl: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/w6-cartier-santos.avif" },
    { id: "p10", type: "products", icon: "✨", page: "Someday", time: "Trending",           cardTitle: "Acaia Pearl Scale",          desc: "A tiny coffee ritual object for mornings that feel measured, calm, and a little more intentional.",                   actions: ["Add to someday", "Open Someday"], imageUrl: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/cf7-acaia-pearl-scale.webp" },
  ],
  destinations: [
    { id: "d1", type: "destinations", icon: "✈️", page: "Destinations", time: "Dream trip", cardTitle: "Kyoto in Cherry Blossom Season", location: "Japan", desc: "Temples, lantern-lit alleys, and a city transformed by spring. Save this one for the kind of trip you plan around.", votes: 276, tag: "Destinations", imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan trip"] },
    { id: "d2", type: "destinations", icon: "✈️", page: "Destinations", time: "Bucket list", cardTitle: "Amalfi Coast", location: "Italy", desc: "Clifftop villages, turquoise water, and pasta on terraces overlooking the sea. A trip that earns its reputation.", votes: 389, tag: "Destinations", imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan trip"] },
    { id: "d3", type: "destinations", icon: "✈️", page: "Destinations", time: "Hidden gem", cardTitle: "Oaxaca, Mexico", location: "Mexico", desc: "Mezcal, mole, markets, and one of the most vibrant food and art scenes in the world.", votes: 231, tag: "Destinations", imageUrl: "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan trip"] },
    { id: "d4", type: "destinations", icon: "✈️", page: "Destinations", time: "Trending", cardTitle: "Patagonia", location: "Chile & Argentina", desc: "The end of the world, in the best way. Glaciers, peaks, and trails that feel genuinely wild.", votes: 318, tag: "Destinations", imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan trip"] },
    { id: "d5", type: "destinations", icon: "✈️", page: "Destinations", time: "Dream trip", cardTitle: "Santorini", location: "Greece", desc: "Blue domes, white walls, and sunsets that actually live up to the photos. Worth every cliché.", votes: 344, tag: "Destinations", imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=80", actions: ["Add to someday", "Plan trip"] },
  ],
};

function pickCommunityPosts() {
  const out = [];
  for (const pool of Object.values(COMMUNITY_POOL)) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    out.push(...shuffled.slice(0, Math.min(3, shuffled.length)));
  }
  return out.sort(() => Math.random() - 0.5);
}

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
  products: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/w9-hublot-big-bang.jpg",
  destinations: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80",
};

function getExploreImageUrl(post = {}) {
  if (post.type === "destinations") {
    const overrideUrl = getDestinationImageOverride(post);
    if (overrideUrl) return overrideUrl;
  }
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

function getExploreCardImageUrl(post = {}, googleImgUrl = "") {
  if (post.type === "destinations") {
    return getDestinationImageOverride(post) || googleImgUrl || getExploreImageUrl(post);
  }
  return googleImgUrl || getExploreImageUrl(post);
}

function isUuidLike(value = "") {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

function getPublishedChapterCreatorLabel(chapter = {}) {
  const handle = String(chapter?.creatorHandle || "").trim();
  const displayName = String(chapter?.creatorDisplayName || "").trim();
  const ownerId = String(chapter?.owner_id || "").trim();
  if (handle) return `@${handle}`;
  if (displayName) return displayName;
  if (ownerId && !isUuidLike(ownerId)) return ownerId.startsWith("@") ? ownerId : `@${ownerId}`;
  return "Community";
}

const SOURCE_CONFIG = {
  friends:     { label: "Friends",           sub: "Events, trips & moments", icon: "👥", bg: "bg-teal-500/10" },
  movies:      { label: "Movies",            sub: "2.4k members",            icon: "🎬", bg: "bg-purple-500/10" },
  hiking:      { label: "Hiking & Outdoors", sub: "1.8k members",            icon: "🥾", bg: "bg-green-500/10" },
  games:       { label: "Board Games",       sub: "892 members",             icon: "🎲", bg: "bg-amber-500/10" },
  restaurants: { label: "Restaurants",       sub: "3.1k members",            icon: "🍜", bg: "bg-pink-500/10" },
  products:    { label: "Someday",            sub: "Someday-worthy finds", icon: "✨", bg: "bg-violet-500/10" },
  destinations:{ label: "Destinations",       sub: "Trips worth dreaming about", icon: "✈️", bg: "bg-indigo-500/10" },
};

const TAG_STYLES = {
  Friends:     "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Movies:      "bg-purple-500/10 text-purple-600 dark:text-purple-300",
  Hiking:      "bg-green-500/10 text-green-600 dark:text-green-400",
  Games:       "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Restaurants: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  Someday: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
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

function MovieCard({ movie, onAddToSomeday, onRemoveFromSomeday, onPageTap, onPlanEvent, onCardTap }) {
  const [inSomeday, setInSomeday] = useState(false);
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
  const year   = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";

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
      <div className="flex border-t border-stone-100 dark:border-white/[0.04] cursor-pointer" onClick={() => onCardTap?.(movie)}>
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
            <p className="text-[11px] text-gray-500 leading-snug mt-1.5 line-clamp-3">{movie.overview}</p>
          </div>
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
      </div>
    </div>
  );
}

const TYPE_EMOJI = { hiking: "🥾", games: "🎲", restaurants: "🍜", products: "✨", destinations: "✈️" };

function CommunityCard({ post, onPageTap, onPlanEvent, onAddToSomeday, onRemoveFromSomeday, onCardTap, onMakeItHappen }) {
  const [inSomeday, setInSomeday] = useState(false);
  const googleImgUrl = useGoogleImage(post.imageQuery || (post.type === 'games' ? `${post.cardTitle} board game box` : null));
  const imageUrl = getExploreCardImageUrl(post, googleImgUrl);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#161f30] border border-stone-100 dark:border-transparent shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader post={post} onPageTap={onPageTap} />
      <Divider />
      <>
        {imageUrl && (
          <div
            className={`mx-4 mt-3 rounded-2xl overflow-hidden cursor-pointer active:opacity-80 ${post.type === "products" ? "bg-stone-50 dark:bg-white/[0.03]" : "bg-stone-100 dark:bg-white/[0.04]"}`}
            onClick={() => onCardTap?.(post)}
          >
            <img src={imageUrl} alt={post.cardTitle} className="w-full h-48 object-cover" loading="lazy" />
          </div>
        )}
        <div className="px-4 py-2.5 cursor-pointer active:opacity-80" onClick={() => onCardTap?.(post)}>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">{post.cardTitle}</p>
          {post.location && <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-1.5">{post.location}</p>}
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{post.desc}</p>
        </div>
      </>
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
                  onMakeItHappen?.({
                    id: post.id,
                    label: post.cardTitle,
                    text: post.cardTitle,
                    emoji: TYPE_EMOJI[post.type] || "✨",
                    type: post.type,
                    imageUrl,
                    categoryId: "buy",
                    notes: post?.desc || '',
                    brand: post?.brand || post?.product_brand || '',
                    priceRange: post?.priceRange || post?.price || post?.product_price || '',
                  });
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
                : (post.type === "products" ? "✨ Make it happen" : "+ Plan")}
            </button>
          );
        })}
      </div>
    </div>
  );
}


function PostDetailSheet({ post, onClose, onAddToSomeday, onRemoveFromSomeday, onPlanEvent, onMakeItHappen, darkMode }) {
  const dm = darkMode;
  const [inSomeday, setInSomeday] = useState(false);
  const isMovie = post.type === 'movies';
  const imageUrl = isMovie
    ? (post.poster_path ? `${TMDB_IMG}${post.poster_path}` : null)
    : getExploreImageUrl(post);
  const title = isMovie ? post.title : post.cardTitle;
  const desc  = isMovie ? post.overview : post.desc;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSomeday = () => {
    if (!inSomeday) {
      if (isMovie) {
        onAddToSomeday?.(post);
      } else {
        onAddToSomeday?.({ title: post.cardTitle, emoji: TYPE_EMOJI[post.type] || '✨', type: post.type, imageUrl, categoryId: post.type === 'products' ? 'buy' : undefined });
      }
    } else {
      if (isMovie) {
        onRemoveFromSomeday?.({ title: post.title, emoji: '🎬', type: 'movies' });
      } else {
        onRemoveFromSomeday?.({ title: post.cardTitle, emoji: TYPE_EMOJI[post.type] || '✨', type: post.type });
      }
    }
    setInSomeday(v => !v);
  };

  const handlePlan = () => {
    if (isMovie) {
      onPlanEvent?.({ title: `Movie night: ${post.title}` });
    } else if (post.type === 'games') {
      onPlanEvent?.({ title: `Game night: ${post.cardTitle}` });
    } else if (post.type === 'hiking') {
      onPlanEvent?.({ title: `Hike: ${post.cardTitle}`, notes: post.location || '', category: 'outdoors' });
    } else if (post.type === 'restaurants') {
      onPlanEvent?.({ title: `Dinner at ${post.cardTitle}`, notes: post.location || '', category: 'dinner', location: post.location || post.cardTitle });
    } else if (post.type === 'destinations') {
      onPlanEvent?.({ title: `Trip to ${post.cardTitle}`, notes: post.location || '', category: 'trip', location: post.location || post.cardTitle });
    } else if (post.type === 'products') {
      onMakeItHappen?.({
        id: post.id,
        label: post.cardTitle,
        text: post.cardTitle,
        emoji: TYPE_EMOJI[post.type] || '✨',
        type: post.type,
        imageUrl,
        categoryId: 'buy',
        notes: post?.desc || '',
        brand: post?.brand || post?.product_brand || '',
        priceRange: post?.priceRange || post?.price || post?.product_price || '',
      });
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>
      <div className={`w-full max-w-lg rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden ${dm ? 'bg-[#0e1520]' : 'bg-white'}`}>
        {/* Image header */}
        {imageUrl ? (
          <div className="relative flex-shrink-0">
            <img
              src={imageUrl}
              alt={title}
              className={`w-full ${isMovie ? 'h-64 object-cover' : post.type === 'products' ? 'h-56 object-contain p-8 bg-stone-50 dark:bg-white/5' : 'h-56 object-cover'}`}
            />
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-sm">✕</button>
            {post.location && (
              <div className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-xs" style={{ fontFamily: "'Caveat', cursive" }}>{post.location}</div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0">
            <span className="text-4xl">{post.icon || TYPE_EMOJI[post.type] || '✨'}</span>
            <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${dm ? 'bg-white/5 text-slate-400' : 'bg-stone-100 text-stone-500'}`}>✕</button>
          </div>
        )}
        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {isMovie && <p className="text-xs text-stone-400 mb-1">{post.release_date?.slice(0, 4)} · ★ {post.vote_average?.toFixed(1)}</p>}
          <h2 className={`text-2xl font-bold leading-tight mb-3 ${dm ? 'text-slate-100' : 'text-slate-900'}`} style={{ fontFamily: "'Caveat', cursive" }}>{title}</h2>
          <p className={`text-sm leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
        </div>
        {/* Actions */}
        <div className={`flex-shrink-0 px-6 pt-3 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] border-t flex gap-3 ${dm ? 'border-white/5' : 'border-stone-100'}`}>
          <button
            onClick={handleSomeday}
            className="flex-1 py-3 rounded-2xl text-base transition-colors"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, background: inSomeday ? '#0d9488' : '#2dd4bf', color: inSomeday ? '#fff' : '#111827' }}
          >
            {inSomeday ? '✓ Someday' : '+ Someday'}
          </button>
          <button
            onClick={handlePlan}
            className="flex-1 py-3 rounded-2xl text-base border transition-colors"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, background: dm ? 'rgba(139,92,246,0.1)' : '#f5f3ff', border: '1px solid rgba(139,92,246,0.25)', color: dm ? '#c4b5fd' : '#6d28d9' }}
          >
            {post.type === 'products' ? '✨ Make it happen' : '+ Plan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
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

function WeekendCard({ post, onAddToSomeday, onRemoveFromSomeday, onPlanEvent, onPageTap, onCardTap }) {
  const [inSomeday, setInSomeday] = useState(false);
  const isMovie = post.type === 'movies';
  const isGame = post.type === 'games';
  const googleImgUrl = useGoogleImage(!isMovie ? (post.imageQuery || (isGame ? `${post.cardTitle} board game box` : null)) : null);
  const imageUrl = isMovie
    ? (post.poster_path ? `${TMDB_IMG}${post.poster_path}` : null)
    : getExploreCardImageUrl(post, googleImgUrl);
  const title = isMovie ? post.title : post.cardTitle;

  function handleSomeday(e) {
    e.stopPropagation();
    if (!inSomeday) {
      isMovie
        ? onAddToSomeday?.(post)
        : onAddToSomeday?.({ title: post.cardTitle, emoji: TYPE_EMOJI[post.type] || '✨', type: post.type, imageUrl });
    } else {
      isMovie
        ? onRemoveFromSomeday?.({ title: post.title, emoji: '🎬', type: 'movies' })
        : onRemoveFromSomeday?.({ title: post.cardTitle, emoji: TYPE_EMOJI[post.type] || '✨', type: post.type });
    }
    setInSomeday(v => !v);
  }

  function handlePlan(e) {
    e.stopPropagation();
    if (isMovie) onPlanEvent?.({ title: `Movie night: ${post.title}` });
    else onPlanEvent?.({ title: `Game night: ${post.cardTitle}`, category: 'hangout' });
  }

  return (
    <div
      className="flex-shrink-0 w-64 rounded-2xl bg-white dark:bg-[#161f30] border border-stone-100 dark:border-transparent shadow-sm overflow-hidden cursor-pointer active:opacity-80"
      onClick={() => onCardTap?.(post)}
    >
      <div className="relative h-40 bg-stone-100 dark:bg-white/[0.04]">
        {imageUrl
          ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">{isMovie ? '🎬' : '🎲'}</div>
        }
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium">
          {isMovie ? '🎬 Movie' : '🎲 Board Game'}
        </div>
      </div>
      <div className="px-3 pt-2.5 pb-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight line-clamp-1">{title}</p>
        {isMovie && post.vote_average && (
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">★ {post.vote_average.toFixed(1)}</p>
        )}
      </div>
      <div className="flex gap-2 px-3 pb-3 pt-1">
        <button
          onClick={handleSomeday}
          className={`flex-1 text-xs font-handwritten font-bold py-1.5 rounded-xl transition-all active:opacity-70 ${inSomeday ? 'bg-teal-600 text-white' : 'bg-teal-400 text-gray-900'}`}
        >
          {inSomeday ? '✓ Saved' : '+ Someday'}
        </button>
        <button
          onClick={handlePlan}
          className="flex-1 text-xs font-handwritten font-bold py-1.5 rounded-xl bg-violet-500/10 dark:bg-violet-400/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 dark:border-violet-400/25 active:opacity-70"
        >
          + Plan
        </button>
      </div>
    </div>
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

function PublishedChapterCard({ chapter, onOpen, darkMode }) {
  const coverUrl = String(chapter?.coverImageUrl || "").trim();
  const creatorLabel = getPublishedChapterCreatorLabel(chapter);
  const previewCount = Array.isArray(chapter?.previewPins) ? chapter.previewPins.length : 0;
  return (
    <button
      onClick={() => onOpen?.(chapter)}
      className={`flex-shrink-0 w-72 rounded-[26px] overflow-hidden text-left border shadow-sm active:opacity-80 ${darkMode ? "bg-[#161f30] border-transparent shadow-none" : "bg-white border-stone-100"}`}
    >
      <div className={`relative h-40 ${coverUrl ? "" : darkMode ? "bg-gradient-to-br from-violet-900/60 via-fuchsia-900/40 to-slate-900" : "bg-gradient-to-br from-fuchsia-100 via-violet-50 to-amber-50"}`}>
        {coverUrl ? (
          <img src={coverUrl} alt={chapter.public_title || chapter.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/85 text-[10px] font-semibold tracking-wide text-violet-700">
          Published chapter
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-white font-handwritten text-[28px] font-bold leading-tight line-clamp-2">
            {chapter.public_title || chapter.title}
          </div>
          <div className="text-white/85 text-xs mt-1">{creatorLabel}</div>
        </div>
      </div>
      <div className="px-4 pt-3.5 pb-4">
        <p className={`text-sm leading-relaxed line-clamp-2 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
          {chapter.public_description || "A community-made chapter you can browse for trip inspiration."}
        </p>
        {Array.isArray(chapter?.public_tags) && chapter.public_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {chapter.public_tags.slice(0, 3).map((tag) => (
              <span
                key={`${chapter.id}-${tag}`}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${darkMode ? "bg-white/5 text-violet-200" : "bg-violet-50 text-violet-700"}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className={`flex items-center justify-between mt-3 text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          <span>{previewCount} saved spot{previewCount === 1 ? "" : "s"}</span>
          <span>{Number(chapter.copy_count || 0)} copies</span>
        </div>
      </div>
    </button>
  );
}

function PublishedChapterPreviewSheet({ chapter, onClose, darkMode }) {
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose, true);
  const coverUrl = String(chapter?.coverImageUrl || "").trim();
  const creatorLabel = getPublishedChapterCreatorLabel(chapter);
  const previewPins = Array.isArray(chapter?.previewPins) ? chapter.previewPins : [];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[10110] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`w-full max-w-lg rounded-t-[28px] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden ${darkMode ? "bg-[#0e1520]" : "bg-white"}`} style={sheetStyle}>
        <div {...handleProps} className="pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full mx-auto ${darkMode ? "bg-white/10" : "bg-stone-200"}`} />
        </div>
        <div className="overflow-y-auto flex-1">
          <div className={`relative h-56 ${coverUrl ? "" : darkMode ? "bg-gradient-to-br from-violet-900/60 via-fuchsia-900/40 to-slate-900" : "bg-gradient-to-br from-fuchsia-100 via-violet-50 to-amber-50"}`}>
            {coverUrl ? (
              <img src={coverUrl} alt={chapter.public_title || chapter.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📖</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center text-sm">✕</button>
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <div className="font-handwritten text-[34px] font-bold leading-tight">{chapter.public_title || chapter.title}</div>
              <div className="text-sm text-white/85 mt-1">By {creatorLabel}</div>
            </div>
          </div>
          <div className="px-5 py-5">
            {Array.isArray(chapter?.public_tags) && chapter.public_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {chapter.public_tags.map((tag) => (
                  <span
                    key={`${chapter.id}-preview-${tag}`}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium ${darkMode ? "bg-violet-500/10 text-violet-200" : "bg-violet-50 text-violet-700"}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              {chapter.public_description || "A published Komo Book chapter from the community."}
            </p>
            {previewPins.length > 0 && (
              <>
                <div className={`mt-5 text-[10px] font-semibold tracking-[0.18em] uppercase ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                  Saved Polaroids
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {previewPins.slice(0, 4).map((pin) => (
                    <div key={pin.id} className={`rounded-2xl overflow-hidden border ${darkMode ? "bg-[#161f30] border-white/5" : "bg-stone-50 border-stone-100"}`}>
                      <div className={`h-28 ${pin.imageUrl ? "" : darkMode ? "bg-white/5" : "bg-white"} flex items-center justify-center`}>
                        {pin.imageUrl ? (
                          <img src={pin.imageUrl} alt={pin.label || pin.description || "Chapter pin"} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-4xl">{pin.emoji || "✨"}</span>
                        )}
                      </div>
                      <div className="px-3 py-2.5">
                        <p className={`text-sm font-medium leading-tight line-clamp-2 ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                          {pin.label || pin.description || "Saved idea"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className={`mt-5 rounded-2xl border px-4 py-3 ${darkMode ? "border-violet-400/15 bg-violet-400/5 text-violet-100" : "border-violet-200 bg-violet-50 text-violet-800"}`}>
              <div className="font-handwritten text-xl font-bold">Copy to Komo Book next</div>
              <div className="text-xs leading-relaxed mt-1 opacity-80">
                This first pass is read-only so we can get public discovery working cleanly before adding duplication.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  const tone =
    label === "For this weekend"
      ? "text-amber-700 dark:text-amber-300"
      : label === "Dreaming of"
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
    { key: 'movies',       icon: '🎬', label: 'Movies',             sub: 'Find your next watch',    page: 'movies' },
    { key: 'games',        icon: '🎲', label: 'Board Games',        sub: 'Plan a game night',       page: 'games' },
    { key: 'hiking',       icon: '🥾', label: 'Hiking & Outdoors',  sub: 'Get outside',             page: 'hiking' },
    { key: 'restaurants',  icon: '🍜', label: 'Restaurants',        sub: 'Spots worth the trip',      page: 'restaurants' },
    { key: 'products',     icon: '✨', label: 'Someday',             sub: 'Build your wishlist',  page: 'products' },
    { key: 'destinations', icon: '✈️', label: 'Destinations',       sub: 'Trip inspiration',        page: 'destinations' },
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
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">{c.sub}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function ExplorePage({ onAddToSomeday, onRemoveFromSomeday, onPlanEvent = () => {}, onMakeItHappen, darkMode = false }) {
  const [sources, setSources]             = useState({ friends: true, movies: true, hiking: true, games: true, restaurants: true, products: true, destinations: true });
  const [communityPosts]                  = useState(pickCommunityPosts);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [search, setSearch]               = useState("");
  const [movies, setMovies]               = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError]     = useState(false);
  const [moviesRetry, setMoviesRetry]     = useState(0);
  const [activePage, setActivePage]             = useState(null);
  const [selectedPost, setSelectedPost]         = useState(null);
  const [publishedChapters, setPublishedChapters] = useState([]);
  const [publishedChaptersLoading, setPublishedChaptersLoading] = useState(true);
  const [selectedPublishedChapter, setSelectedPublishedChapter] = useState(null);

  const moviePosts = useMemo(() => shuffle(movies.slice(0, 20)).slice(0, 6).map(m => ({ ...m, type: "movies" })), [movies]);
  const activeCom  = useMemo(() => shuffle(communityPosts.filter(p => sources[p.type])), [communityPosts, sources]);

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

  useEffect(() => {
    let cancelled = false;
    async function loadPublishedChapters() {
      setPublishedChaptersLoading(true);
      try {
        const { data: chapterRows, error: chapterErr } = await supabase
          .from("chapters")
          .select("id, title, owner_id, cover_pin_id, is_public, public_title, public_description, public_tags, public_cover_pin_id, published_at, copy_count")
          .eq("is_public", true)
          .order("published_at", { ascending: false })
          .limit(12);
        if (chapterErr) throw chapterErr;
        const rows = Array.isArray(chapterRows) ? chapterRows : [];
        const chapterIds = rows.map((row) => String(row?.id || "").trim()).filter(Boolean);
        const ownerIds = Array.from(new Set(rows.map((row) => String(row?.owner_id || "").trim()).filter((value) => isUuidLike(value))));
        const [{ data: pinRows }, { data: handleRows }] = await Promise.all([
          chapterIds.length > 0
            ? supabase
                .from("chapter_pins")
                .select("id, chapter_id, label, description, image_url, emoji, category_id, status, pin_color, note_color, type, position")
                .in("chapter_id", chapterIds)
                .order("position", { ascending: true })
            : Promise.resolve({ data: [] }),
          ownerIds.length > 0
            ? supabase
                .from("user_handles")
                .select("user_id, handle, display_name")
                .in("user_id", ownerIds)
            : Promise.resolve({ data: [] }),
        ]);
        if (cancelled) return;
        const pinsByChapterId = new Map();
        (pinRows || []).forEach((row) => {
          const chapterId = String(row?.chapter_id || "").trim();
          if (!chapterId) return;
          if (!pinsByChapterId.has(chapterId)) pinsByChapterId.set(chapterId, []);
          pinsByChapterId.get(chapterId).push({
            id: row.id,
            label: row.label || "",
            description: row.description || "",
            imageUrl: row.image_url || "",
            emoji: row.emoji || "",
            type: row.type || "note",
          });
        });
        const handleByUserId = new Map((handleRows || []).map((row) => [String(row?.user_id || "").trim(), row]));
        const normalized = rows.map((row) => {
          const chapterId = String(row?.id || "").trim();
          const previewPins = pinsByChapterId.get(chapterId) || [];
          const publicCoverPinId = String(row?.public_cover_pin_id || "").trim();
          const coverPinId = String(row?.cover_pin_id || "").trim();
          const coverPin = previewPins.find((pin) => String(pin?.id || "") === publicCoverPinId)
            || previewPins.find((pin) => String(pin?.id || "") === coverPinId)
            || previewPins.find((pin) => String(pin?.imageUrl || "").trim())
            || previewPins[0]
            || null;
          const ownerId = String(row?.owner_id || "").trim();
          const creator = handleByUserId.get(ownerId) || null;
          return {
            ...row,
            public_tags: Array.isArray(row?.public_tags) ? row.public_tags.filter(Boolean) : [],
            previewPins,
            coverImageUrl: String(coverPin?.imageUrl || "").trim(),
            creatorHandle: creator?.handle || "",
            creatorDisplayName: creator?.display_name || "",
          };
        });
        setPublishedChapters(normalized);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load published chapters:", err);
          setPublishedChapters([]);
        }
      } finally {
        if (!cancelled) setPublishedChaptersLoading(false);
      }
    }
    loadPublishedChapters();
    return () => { cancelled = true; };
  }, []);

  if (activePage === "movies") {
    return <MoviesPage onBack={() => setActivePage(null)} onAddToSomeday={onAddToSomeday} onPlanEvent={onPlanEvent} />;
  }
  if (activePage === "hiking") {
    return <HikingPage onBack={() => setActivePage(null)} onPlanEvent={onPlanEvent} darkMode={darkMode} />;
  }
  if (activePage === "products") {
    return <DreamShelfPage onBack={() => setActivePage(null)} onAddToSomeday={onAddToSomeday} onAddEvent={onPlanEvent} onMakeItHappen={onMakeItHappen} darkMode={darkMode} />;
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
  const activeFriends = sources.friends ? FRIEND_POSTS : [];
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
    const used = new Set();
    function take(items, limit) {
      const out = [];
      for (const item of items) {
        if (out.length >= limit) break;
        if (!used.has(String(item.id))) { used.add(String(item.id)); out.push(item); }
      }
      return out;
    }
    // "For this weekend" — interleave movies + board games so both appear
    const weekend = take(moviesByRating, 5);
    // "From your friends" — friend activity posts (omit if empty)
    const friends  = activeFriends.length > 0 ? take(activeFriends, 4) : [];
    // "Dreaming of" — products + hiking + restaurants + destinations
    const dreaming = take([...activeCom.filter(p => ['products', 'hiking', 'restaurants', 'destinations'].includes(p.type))], 8);
    return { weekend, friends, dreaming };
  })();

  function renderCard(post) {
    if (post.type === 'movies') return <MovieCard key={`movie-${post.id}`} movie={post} onAddToSomeday={onAddToSomeday} onRemoveFromSomeday={onRemoveFromSomeday} onPageTap={setActivePage} onPlanEvent={onPlanEvent} onCardTap={setSelectedPost} />;
    if (post.type === 'friends') return <FriendCard key={post.id} post={post} />;
    return <CommunityCard key={post.id} post={post} onPageTap={setActivePage} onPlanEvent={onPlanEvent} onAddToSomeday={onAddToSomeday} onRemoveFromSomeday={onRemoveFromSomeday} onCardTap={setSelectedPost} onMakeItHappen={onMakeItHappen} />;
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
              <SectionHeader label="For this weekend" />
              <div className="flex gap-3 overflow-x-auto px-3.5 pb-1" style={{ scrollbarWidth: 'none' }}>
                {sectionData.weekend.map(post => (
                  <WeekendCard
                    key={post.type === 'movies' ? `movie-${post.id}` : post.id}
                    post={post}
                    onAddToSomeday={onAddToSomeday}
                    onRemoveFromSomeday={onRemoveFromSomeday}
                    onPlanEvent={onPlanEvent}
                    onPageTap={setActivePage}
                    onCardTap={setSelectedPost}
                  />
                ))}
                <div className="flex-shrink-0 w-4" />
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

          <SectionHeader label="Browse by interest" />
          <CategoryGrid onPageTap={setActivePage} />

          {(publishedChaptersLoading || publishedChapters.length > 0) && (
            <>
              <SectionHeader label="Published chapters" />
              <div className="flex gap-3 overflow-x-auto px-3.5 pb-1" style={{ scrollbarWidth: 'none' }}>
                {publishedChaptersLoading
                  ? (
                    <>
                      <div className={`flex-shrink-0 w-72 h-[268px] rounded-[26px] animate-pulse ${darkMode ? 'bg-[#161f30]' : 'bg-white border border-stone-100'}`} />
                      <div className={`flex-shrink-0 w-72 h-[268px] rounded-[26px] animate-pulse ${darkMode ? 'bg-[#161f30]' : 'bg-white border border-stone-100'}`} />
                    </>
                  )
                  : publishedChapters.map((chapter) => (
                    <PublishedChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      onOpen={setSelectedPublishedChapter}
                      darkMode={darkMode}
                    />
                  ))
                }
                <div className="flex-shrink-0 w-4" />
              </div>
            </>
          )}

          {sectionData.dreaming.length > 0 && (
            <>
              <SectionHeader label="Dreaming of" />
              <div className="px-3.5 flex flex-col gap-3">
                {sectionData.dreaming.map(post => renderCard(post))}
              </div>
            </>
          )}

          {!moviesLoading && sectionData.weekend.length === 0 && sectionData.dreaming.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-600 text-sm">
              All sources hidden — open Filter to turn some back on
            </div>
          )}
        </>
      )}

      <FilterDrawer open={drawerOpen} sources={sources} onToggle={toggleSource} onClose={() => setDrawerOpen(false)} />

      {selectedPost && (
        <PostDetailSheet
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onAddToSomeday={onAddToSomeday}
          onRemoveFromSomeday={onRemoveFromSomeday}
          onPlanEvent={onPlanEvent}
          onMakeItHappen={onMakeItHappen}
          darkMode={darkMode}
        />
      )}

      {selectedPublishedChapter && (
        <PublishedChapterPreviewSheet
          chapter={selectedPublishedChapter}
          onClose={() => setSelectedPublishedChapter(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
