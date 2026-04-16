import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient"; // adjust path as needed

// ─── Config ──────────────────────────────────────────────────────────────────
// Add to your .env:  REACT_APP_RAINFOREST_KEY=your_key_here
// Get a key at:     https://app.rainforestapi.com
const RAINFOREST_KEY = process.env.REACT_APP_RAINFOREST_KEY;
const RAINFOREST_URL = "https://api.rainforestapi.com/request";

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "All",      emoji: "✨", searchTerm: "most popular products 2024" },
  { label: "Tech",     emoji: "🎧", searchTerm: "best tech gadgets"          },
  { label: "Kitchen",  emoji: "🍳", searchTerm: "best kitchen products"      },
  { label: "Outdoors", emoji: "🎒", searchTerm: "best outdoor gear"          },
  { label: "Home",     emoji: "🕯️", searchTerm: "best home products"         },
  { label: "Fitness",  emoji: "💪", searchTerm: "best fitness equipment"     },
  { label: "Travel",   emoji: "✈️", searchTerm: "best travel accessories"    },
  { label: "Books",    emoji: "📚", searchTerm: "best books 2024"            },
];

const TRENDING = [
  { emoji: "☕", label: "Coffee gear",  count: 47 },
  { emoji: "🎒", label: "Travel bags",  count: 31 },
  { emoji: "📚", label: "Books",        count: 28 },
  { emoji: "🧴", label: "Skincare",     count: 22 },
  { emoji: "🎧", label: "Audio",        count: 19 },
  { emoji: "🍳", label: "Kitchen",      count: 15 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeProduct(item) {
  // Rainforest search result shape:
  // { asin, title, link, image, rating, ratings_total, price: { value, raw, symbol }, is_prime }
  return {
    id:           item.asin,
    name:         item.title,
    image:        item.image,
    price:        item.price?.raw ?? null,
    priceValue:   item.price?.value ?? null,
    rating:       item.rating ?? null,
    ratingsTotal: item.ratings_total ?? null,
    isPrime:      item.is_prime ?? false,
    amazonUrl:    item.link,
    category:     item.category ?? "",
  };
}

function getCategoryForProduct(name = "") {
  const n = name.toLowerCase();
  if (n.match(/headphone|earbud|speaker|audio|sony|bose|airpod/)) return "Tech";
  if (n.match(/book|novel|guide|memoir/))                          return "Books";
  if (n.match(/kitchen|cook|pan|pot|coffee|kettle|blender/))      return "Kitchen";
  if (n.match(/bag|backpack|luggage|travel|wallet/))               return "Travel";
  if (n.match(/candle|lamp|pillow|sheet|towel|home/))             return "Home";
  if (n.match(/gym|fitness|yoga|protein|weight|dumbbell/))        return "Fitness";
  if (n.match(/tent|hiking|camp|outdoor|jacket|boot/))            return "Outdoors";
  return "Tech";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCard({ product, onSomeday, savedIds, onPost }) {
  const isWished = savedIds.has(product.id);
  const category = getCategoryForProduct(product.name);

  return (
    <div className="bg-[#161f30] border border-white/5 rounded-2xl overflow-hidden hover:border-violet-400/25 hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Image */}
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-36 object-contain bg-[#1a2540] p-3"
        />
      ) : (
        <div className="w-full h-36 flex items-center justify-center text-5xl bg-gradient-to-br from-[#1a2540] to-[#1e2040]">
          🛍️
        </div>
      )}

      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{category}</p>
        <h3 className="font-['Caveat'] text-lg font-semibold text-slate-100 leading-tight mb-2 flex-1 line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          {product.price ? (
            <span className="font-['Caveat'] text-xl font-bold text-teal-400">{product.price}</span>
          ) : (
            <span className="text-sm text-slate-500">—</span>
          )}
          {product.rating && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="text-amber-400">★</span>
              {Number(product.rating).toFixed(1)}
              {product.ratingsTotal && (
                <span className="text-slate-600">
                  ({product.ratingsTotal > 999
                    ? `${Math.round(product.ratingsTotal / 1000)}k`
                    : product.ratingsTotal})
                </span>
              )}
            </span>
          )}
        </div>

        {product.isPrime && (
          <p className="text-[10px] text-blue-400 mb-2">✓ Prime</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onSomeday(product)}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all duration-200 border ${
              isWished
                ? "bg-teal-400/20 border-teal-400/35 text-teal-300"
                : "bg-teal-400/8 border-teal-400/20 text-teal-400 hover:bg-teal-400/15"
            }`}
          >
            {isWished ? "✓ Someday" : "+ Someday"}
          </button>
          <button
            onClick={() => onPost(product)}
            className="flex-1 bg-teal-400/8 border border-teal-400/20 rounded-xl py-2 text-xs font-medium text-teal-400 hover:bg-teal-400/15 transition-all duration-200"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function CommunityPost({ post, currentUserId, onAddToSomeday }) {
  const [liked, setLiked]   = useState(post.liked_by_me ?? false);
  const [likes, setLikes]   = useState(post.likes_count ?? 0);
  const [wished, setWished] = useState(false);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((n) => newLiked ? n + 1 : n - 1);
    // TODO: persist to Supabase product_post_likes table
    // if (newLiked) {
    //   await supabase.from('product_post_likes').insert({ post_id: post.id, user_id: currentUserId });
    // } else {
    //   await supabase.from('product_post_likes').delete().match({ post_id: post.id, user_id: currentUserId });
    // }
  };

  const initials = (post.profiles?.full_name ?? "??")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-[#161f30] border border-white/5 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center font-['Caveat'] text-base font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 leading-tight">
            {post.profiles?.full_name ?? "Someone"} recommended a product
          </p>
          <p className="text-xs text-slate-500">{post.category} · {formatTime(post.created_at)}</p>
        </div>
      </div>

      {/* Product block */}
      <div className="flex gap-3 mb-3">
        {post.product_image ? (
          <img
            src={post.product_image}
            alt={post.product_name}
            className="w-20 h-20 rounded-xl object-contain bg-[#1a2540] p-1.5 flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1a2540] to-[#1e2040] flex items-center justify-center text-3xl flex-shrink-0">
            🛍️
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-['Caveat'] text-lg font-semibold text-slate-100 leading-tight mb-0.5 line-clamp-2">
            {post.product_name}
          </h3>
          {post.product_brand && (
            <p className="text-xs text-slate-500 mb-1">{post.product_brand}</p>
          )}
          {post.review && (
            <p className="text-sm text-slate-400 italic leading-relaxed line-clamp-2">
              "{post.review}"
            </p>
          )}
          {post.product_price && (
            <p className="font-['Caveat'] text-lg font-bold text-teal-400 mt-1">
              {post.product_price}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-white/5">
        <button
          onClick={handleLike}
          className={`text-xs flex items-center gap-1 transition-colors duration-150 ${
            liked ? "text-pink-400" : "text-slate-500 hover:text-pink-400"
          }`}
        >
          {liked ? "♥" : "♡"} {likes} {likes === 1 ? "like" : "likes"}
        </button>
        <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          💬 {post.comments_count ?? 0} comments
        </button>
        <button
          onClick={() => {
            if (!wished) {
              onAddToSomeday?.({
                title:    post.product_name,
                imageUrl: post.product_image || "",
                emoji:    "🛍️",
                type:     "products",
              });
            }
            setWished((w) => !w);
          }}
          className={`ml-auto text-xs px-3 py-1.5 rounded-xl border transition-all duration-200 ${
            wished
              ? "bg-teal-400/20 border-teal-400/35 text-teal-300"
              : "bg-teal-400/8 border-teal-400/20 text-teal-400 hover:bg-teal-400/15"
          }`}
        >
          {wished ? "✓ Someday" : "+ Someday"}
        </button>
      </div>
    </div>
  );
}

// Post product modal
function PostProductModal({ product, onClose, onSubmit }) {
  const [review, setReview] = useState("");
  const [category, setCategory] = useState(getCategoryForProduct(product?.name));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!review.trim()) return;
    setSubmitting(true);
    await onSubmit({ product, review, category });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#161f30] border border-white/10 rounded-3xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-['Caveat'] text-2xl font-bold text-slate-100">Share this product</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
        </div>

        {/* Product preview */}
        {product && (
          <div className="flex gap-3 bg-[#0e1520] rounded-2xl p-3 mb-4">
            {product.image && (
              <img src={product.image} alt={product.name} className="w-14 h-14 object-contain rounded-xl bg-[#1a2540] p-1 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-['Caveat'] text-lg font-semibold text-slate-100 leading-tight line-clamp-2">{product.name}</p>
              {product.price && <p className="font-['Caveat'] text-base font-bold text-teal-400">{product.price}</p>}
            </div>
          </div>
        )}

        {/* Category */}
        <div className="mb-3">
          <label className="text-xs uppercase tracking-widest text-slate-500 block mb-2">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.filter((c) => c.label !== "All").map((c) => (
              <button
                key={c.label}
                onClick={() => setCategory(c.label)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  category === c.label
                    ? "bg-violet-400/15 border-violet-400/40 text-violet-400"
                    : "bg-white/5 border-white/8 text-slate-400 hover:border-violet-400/25"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest text-slate-500 block mb-2">Why do you love it?</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell your friends what makes this worth it..."
            rows={3}
            className="w-full bg-[#0e1520] border border-white/8 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-violet-400/40 transition-colors resize-none font-['DM_Sans']"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!review.trim() || submitting}
          className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white rounded-2xl py-3 text-sm font-medium transition-colors"
        >
          {submitting ? "Posting…" : "Share with friends"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductsPage({ onBack, onAddToSomeday } = {}) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [products,       setProducts]       = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [featuredPost,   setFeaturedPost]   = useState(null);
  const [wishlistedIds,  setWishlistedIds]  = useState(new Set());
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [postingProduct, setPostingProduct] = useState(null); // product to post modal
  const [currentUserId,  setCurrentUserId]  = useState(null);

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });
  }, []);

  // ── Fetch products from Rainforest on category/search change ──
  const fetchProducts = useCallback(async (term) => {
    if (!RAINFOREST_KEY) {
      console.warn("REACT_APP_RAINFOREST_KEY not set — using mock data");
      setProducts(MOCK_PRODUCTS);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        api_key:      RAINFOREST_KEY,
        type:         "search",
        amazon_domain: "amazon.com",
        search_term:  term,
        sort_by:      "featured",         // or "avg_customer_reviews" for top-rated
        page:         "1",
      });

      const res = await fetch(`${RAINFOREST_URL}?${params}`);
      if (!res.ok) throw new Error(`Rainforest API error: ${res.status}`);
      const data = await res.json();

      const normalized = (data.search_results ?? [])
        .filter((item) => item.asin && item.title)
        .slice(0, 12)
        .map(normalizeProduct);

      setProducts(normalized);
    } catch (err) {
      console.error(err);
      setError("Couldn't load products. Check your Rainforest API key.");
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(activeCategory.searchTerm);
  }, [activeCategory, fetchProducts]);

  const handleSearch = () => {
    if (searchQuery.trim()) fetchProducts(searchQuery.trim());
  };

  // ── Fetch community posts from Supabase ──
  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  const fetchCommunityPosts = async () => {
    // Expects a `product_posts` table with these columns:
    // id, user_id, product_name, product_brand, product_image, product_price,
    // product_asin, amazon_url, review, category, likes_count, comments_count,
    // created_at
    // + joined profiles table: full_name, avatar_url
    const { data, error } = await supabase
      .from("product_posts")
      .select(`
        *,
        profiles ( full_name, avatar_url )
      `)
      .order("likes_count", { ascending: false })
      .limit(20);

    if (!error && data) {
      setCommunityPosts(data);
      setFeaturedPost(data[0] ?? null);
    } else {
      // Fall back to mock feed
      setCommunityPosts(MOCK_FEED);
      setFeaturedPost(MOCK_FEED[0]);
    }
  };

  // ── Wishlist save ──
  const handleSomeday = (product) => {
    const alreadySaved = wishlistedIds.has(product.id);
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) { next.delete(product.id); return next; }
      next.add(product.id);
      return next;
    });
    if (!alreadySaved) {
      onAddToSomeday?.({
        title:    product.name,
        imageUrl: product.image || "",
        emoji:    "🛍️",
        type:     "products",
      });
    }
  };


  // ── Post a product ──
  const handlePostSubmit = async ({ product, review, category }) => {
    const { error } = await supabase.from("product_posts").insert({
      user_id:       currentUserId,
      product_name:  product.name,
      product_image: product.image,
      product_price: product.price,
      product_asin:  product.id,
      amazon_url:    product.amazonUrl,
      review,
      category,
      likes_count:    0,
      comments_count: 0,
    });

    if (!error) {
      fetchCommunityPosts(); // refresh feed
    }
  };

  // ── Featured product = top-liked community post ──
  const featured = featuredPost;
  const gridProducts = products.slice(0, 6);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0e1520] text-slate-200 font-['DM_Sans']">
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">

        {/* ── Hero ── */}
        <div className="relative bg-gradient-to-br from-[#0f1a2e] via-[#1a1535] to-[#0e1520] rounded-3xl p-8 mb-6 overflow-hidden border border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(167,139,250,0.08),transparent)]" />
          <div className="absolute right-8 top-6 text-8xl opacity-10 -rotate-6 select-none">🛍️</div>

          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-4">
              ← Back
            </button>
          )}
          <p className="text-[10px] uppercase tracking-[0.15em] text-violet-400 mb-2 opacity-80">
            Explore · Products
          </p>
          <h1 className="font-['Caveat'] text-5xl font-bold leading-tight mb-2 bg-gradient-to-r from-slate-100 to-violet-300 bg-clip-text text-transparent">
            Find your next favorite thing
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
            Discover products you never knew you needed — recommended by real people, not algorithms.
          </p>

          <div className="flex gap-6 flex-wrap">
            {[
              { num: communityPosts.length || "—", lbl: "Products shared" },
              { num: communityPosts.filter((p) => p.profiles).length || "—", lbl: "Friends posted" },
              { num: wishlistedIds.size, lbl: "Wishlist saves" },
            ].map(({ num, lbl }) => (
              <div key={lbl} className="flex flex-col">
                <span className="font-['Caveat'] text-3xl font-bold text-violet-400 leading-none">{num}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Search ── */}
        <div className="flex gap-2.5 mb-5">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search Amazon products..."
            className="flex-1 bg-[#161f30] border border-white/7 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-400/40 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-violet-500 hover:bg-violet-400 text-white rounded-2xl px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Searching…" : "Discover"}
          </button>
        </div>

        {/* ── Category filters ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs transition-all duration-200 border ${
                activeCategory.label === cat.label
                  ? "bg-violet-400/12 border-violet-400/40 text-violet-400"
                  : "bg-[#161f30] border-white/7 text-slate-500 hover:text-violet-400 hover:border-violet-400/25"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* ── Trending pills ── */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Trending right now</p>
        <div className="flex gap-2.5 mb-7 overflow-x-auto pb-1 scrollbar-hide">
          {TRENDING.map((t) => (
            <button
              key={t.label}
              onClick={() => fetchProducts(t.label)}
              className="bg-[#161f30] border border-white/7 rounded-full px-4 py-2 flex items-center gap-2 whitespace-nowrap hover:border-violet-400/30 hover:bg-violet-400/5 transition-all"
            >
              <span className="text-base leading-none">{t.emoji}</span>
              <span className="text-sm text-slate-200">{t.label}</span>
              <span className="text-xs text-slate-500">{t.count} posts</span>
            </button>
          ))}
        </div>

        {/* ── Featured (most loved community post) ── */}
        {featured && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Most loved this week</p>
            <div className="bg-[#161f30] border border-violet-400/15 rounded-3xl overflow-hidden mb-8 hover:border-violet-400/30 transition-colors">
              <div className="grid grid-cols-2 max-sm:grid-cols-1">
                {featured.product_image ? (
                  <img
                    src={featured.product_image}
                    alt={featured.product_name}
                    className="w-full h-52 object-contain bg-[#1a2540] p-6"
                  />
                ) : (
                  <div className="h-52 flex items-center justify-center text-7xl bg-gradient-to-br from-[#1a1535] to-[#231a40]">
                    🛍️
                  </div>
                )}
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-widest text-violet-400 mb-2">
                    🔥 Top recommended
                  </p>
                  <h2 className="font-['Caveat'] text-2xl font-bold text-slate-100 leading-tight mb-1">
                    {featured.product_name}
                  </h2>
                  {featured.product_brand && (
                    <p className="text-xs text-slate-500 mb-2">{featured.product_brand}</p>
                  )}
                  {featured.review && (
                    <p className="text-sm text-slate-400 italic leading-relaxed mb-4 line-clamp-3">
                      "{featured.review}"
                    </p>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    {featured.product_price && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-400">
                          {featured.product_price}
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Price</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-['Caveat'] text-xl font-semibold text-violet-400">
                        {featured.likes_count ?? 0}
                      </span>
                      <span className="text-[10px] uppercase text-slate-500 tracking-wide">Likes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* ── Product grid ── */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">
          {searchQuery ? `Results for "${searchQuery}"` : `Discover · ${activeCategory.label}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-3 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#161f30] rounded-2xl h-72 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-3 mb-8">
            {gridProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSomeday={handleSomeday}
                savedIds={wishlistedIds}
                onPost={setPostingProduct}
              />
            ))}
          </div>
        )}

        {!loading && gridProducts.length === 0 && (
          <div className="text-center py-16 text-slate-500 mb-8">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-['Caveat'] text-2xl text-slate-400 mb-1">No products found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}

        {/* ── Post CTA ── */}
        <div className="bg-gradient-to-r from-orange-500/8 to-pink-500/6 border border-orange-400/20 rounded-3xl p-5 mb-8 flex items-center gap-4">
          <span className="text-3xl flex-shrink-0">✨</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-['Caveat'] text-xl font-bold text-slate-100 leading-tight">
              Found something amazing?
            </h3>
            <p className="text-sm text-slate-500">Share it with your friends — tell them why you love it.</p>
          </div>
          <button
            onClick={() => setPostingProduct({ name: "", image: null, price: null })}
            className="ml-auto bg-orange-400/12 border border-orange-400/25 rounded-2xl px-4 py-2.5 text-sm text-orange-400 hover:bg-orange-400/20 transition-all whitespace-nowrap"
          >
            Post a product →
          </button>
        </div>

        {/* ── Community feed ── */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">
          What friends are recommending
        </p>
        <div className="flex flex-col gap-2.5">
          {communityPosts.map((post) => (
            <CommunityPost key={post.id} post={post} currentUserId={currentUserId} onAddToSomeday={onAddToSomeday} />
          ))}
        </div>

      </div>

      {/* ── Post modal ── */}
      {postingProduct && (
        <PostProductModal
          product={postingProduct}
          onClose={() => setPostingProduct(null)}
          onSubmit={handlePostSubmit}
        />
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Mock data (used when API key not set or Supabase tables not yet created) ─

const MOCK_PRODUCTS = [
  { id: "B09XS7JWHH", name: "Sony WH-1000XM5 Wireless Headphones",  image: null, price: "$349", priceValue: 349, rating: 4.8, ratingsTotal: 12400, isPrime: true,  amazonUrl: "#" },
  { id: "B07ZPCXD9D", name: "Aer Travel Pack 3 Backpack",           image: null, price: "$245", priceValue: 245, rating: 4.9, ratingsTotal: 3200,  isPrime: false, amazonUrl: "#" },
  { id: "B08N5WRWNW", name: "Fellow Stagg EKG Electric Kettle",     image: null, price: "$165", priceValue: 165, rating: 4.7, ratingsTotal: 8900,  isPrime: true,  amazonUrl: "#" },
  { id: "B09G9HD6PD", name: "Four Thousand Weeks — Oliver Burkeman", image: null, price: "$18",  priceValue: 18,  rating: 4.6, ratingsTotal: 22000, isPrime: true,  amazonUrl: "#" },
  { id: "B01MSWBXK1", name: "CeraVe Moisturizing Cream",            image: null, price: "$19",  priceValue: 19,  rating: 4.9, ratingsTotal: 91000, isPrime: true,  amazonUrl: "#" },
  { id: "B07QMSL3QL", name: "Olight Baton 3 Pro Flashlight",        image: null, price: "$59",  priceValue: 59,  rating: 4.8, ratingsTotal: 4100,  isPrime: true,  amazonUrl: "#" },
];

const MOCK_FEED = [
  { id: 1, profiles: { full_name: "Jamie L." }, product_name: "Sony WH-1000XM5", product_brand: "Sony", product_image: null, product_price: "$349", review: "Game changer for working from home. The noise cancellation is unreal — I forget I'm in a café.", category: "Tech",    likes_count: 12, comments_count: 4, created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 2, profiles: { full_name: "Sam R."   }, product_name: "Aer Travel Pack 3", product_brand: "Aer", product_image: null, product_price: "$245", review: "Took this to 6 countries and it never left my side. Fits under the seat, looks professional, holds everything.", category: "Travel",  likes_count: 9,  comments_count: 6, created_at: new Date(Date.now() - 26 * 3600000).toISOString() },
  { id: 3, profiles: { full_name: "Maya K."  }, product_name: "Fellow Stagg EKG", product_brand: "Fellow", product_image: null, product_price: "$165", review: "I resisted buying this for two years. Do not make my mistake. It is perfect.", category: "Kitchen", likes_count: 21, comments_count: 11, created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
];
