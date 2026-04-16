import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Camera } from "lucide-react";
import { supabase } from "../supabaseClient"; // adjust path as needed

// ─── Config ──────────────────────────────────────────────────────────────────
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

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ product, isSaved, onSomeday, onPost, onClose, darkMode }) {
  const dm = darkMode;
  const category = getCategoryForProduct(product.name);
  const [saved, setSaved] = useState(isSaved);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSomeday = () => {
    if (!saved) onSomeday(product);
    setSaved((s) => !s);
  };

  const ratingsLabel = product.ratingsTotal
    ? product.ratingsTotal > 999
      ? `${Math.round(product.ratingsTotal / 1000)}k`
      : String(product.ratingsTotal)
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border ${dm ? 'bg-[#0e1520] border-white/10' : 'bg-white border-slate-200'}`}>
        {/* Image header */}
        <div className="relative flex-shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.name} className={`w-full h-56 object-contain p-6 ${dm ? 'bg-[#1a2540]' : 'bg-slate-100'}`} />
          ) : (
            <div className={`w-full h-56 flex items-center justify-center text-8xl bg-gradient-to-br ${dm ? 'from-[#1a2540] to-[#1e2040]' : 'from-slate-100 to-slate-200'}`}>🛍️</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-slate-300 hover:text-white flex items-center justify-center text-sm transition-colors"
          >✕</button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 pb-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{category}</p>
          <h2 className={`font-['Caveat'] text-3xl font-bold leading-tight mb-1 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>{product.name}</h2>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {product.price && (
              <span className="font-['Caveat'] text-2xl font-bold text-teal-500">{product.price}</span>
            )}
            {product.isPrime && (
              <span className="text-[11px] text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">✓ Prime</span>
            )}
            {product.rating && (
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <span className="text-amber-500">★</span>
                {Number(product.rating).toFixed(1)}
                {ratingsLabel && <span className="text-slate-400">({ratingsLabel})</span>}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            {product.description || `Highly rated ${category.toLowerCase()} product loved by the community. Check Amazon for full specs and reviews.`}
          </p>
        </div>

        {/* Actions */}
        <div className={`flex-shrink-0 p-6 pt-3 border-t flex flex-col gap-2.5 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] ${dm ? 'border-white/5' : 'border-slate-200'}`}>
          <button
            onClick={handleSomeday}
            className={`w-full rounded-2xl py-3 text-sm font-handwritten font-bold border transition-all duration-200 ${
              saved
                ? "bg-teal-500/20 border-teal-500/35 text-teal-600"
                : dm
                  ? "bg-teal-400/10 border-teal-400/25 text-teal-400 hover:bg-teal-400/20"
                  : "bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100"
            }`}
          >
            {saved ? "✓ In someday list" : "+ Someday list"}
          </button>
          <div className="flex gap-2.5">
            {product.amazonUrl && product.amazonUrl !== "#" && (
              <a
                href={product.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 rounded-2xl py-3 text-sm font-medium transition-all text-center border ${dm ? 'bg-amber-400/10 border-amber-400/25 text-amber-400 hover:bg-amber-400/20' : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'}`}
              >
                View on Amazon →
              </a>
            )}
            <button
              onClick={() => { onPost(product); onClose(); }}
              className={`flex-1 rounded-2xl py-3 text-sm font-handwritten font-bold transition-all border ${dm ? 'bg-[#C9A15D]/15 border-[#C9A15D]/35 text-[#C9A15D] hover:bg-[#C9A15D]/25' : 'bg-[#FFF8EA] border-[#D8B36A] text-[#8A5A1F] hover:bg-[#FFF3D4]'}`}
            >
              Share with friends
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const ProductCard = React.memo(function ProductCard({ product, onSomeday, savedIds, onPost, onOpen, darkMode }) {
  const dm = darkMode;
  const isWished = savedIds.has(product.id);
  const category = getCategoryForProduct(product.name);

  return (
    <div
      onClick={() => onOpen(product)}
      className={`border rounded-2xl overflow-hidden hover:border-violet-400/25 hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer ${dm ? 'bg-[#161f30] border-white/5' : 'bg-white border-slate-200'}`}
    >
      {/* Image */}
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-36 object-contain p-3 ${dm ? 'bg-[#1a2540]' : 'bg-slate-100'}`}
        />
      ) : (
        <div className={`w-full h-36 flex items-center justify-center text-5xl bg-gradient-to-br ${dm ? 'from-[#1a2540] to-[#1e2040]' : 'from-slate-100 to-slate-200'}`}>
          🛍️
        </div>
      )}

      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{category}</p>
        <h3 className={`font-['Caveat'] text-lg font-semibold leading-tight mb-2 flex-1 line-clamp-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          {product.price ? (
            <span className="font-['Caveat'] text-xl font-bold text-teal-500">{product.price}</span>
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
          {product.rating && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span className="text-amber-500">★</span>
              {Number(product.rating).toFixed(1)}
              {product.ratingsTotal && (
                <span className="text-slate-400">
                  ({product.ratingsTotal > 999
                    ? `${Math.round(product.ratingsTotal / 1000)}k`
                    : product.ratingsTotal})
                </span>
              )}
            </span>
          )}
        </div>

        {product.isPrime && (
          <p className="text-[10px] text-blue-500 mb-2">✓ Prime</p>
        )}

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSomeday(product)}
            className={`flex-1 rounded-xl py-2 text-xs font-handwritten font-bold transition-all duration-200 border ${
              isWished
                ? "bg-teal-500/20 border-teal-500/30 text-teal-600"
                : dm
                  ? "bg-teal-400/8 border-teal-400/20 text-teal-400 hover:bg-teal-400/15"
                  : "bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100"
            }`}
          >
            {isWished ? "✓ In someday list" : "+ Someday list"}
          </button>
          <button
            onClick={() => onPost(product)}
            className={`flex-1 rounded-xl py-2 text-xs font-handwritten font-bold transition-all duration-200 border ${dm ? 'bg-[#C9A15D]/15 border-[#C9A15D]/35 text-[#C9A15D] hover:bg-[#C9A15D]/25' : 'bg-[#FFF8EA] border-[#D8B36A] text-[#8A5A1F] hover:bg-[#FFF3D4]'}`}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
});

const CommunityPost = React.memo(function CommunityPost({ post, currentUserId, onAddToSomeday, darkMode }) {
  const dm = darkMode;
  const [liked, setLiked]   = useState(post.liked_by_me ?? false);
  const [likes, setLikes]   = useState(post.likes_count ?? 0);
  const [wished, setWished] = useState(false);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((n) => newLiked ? n + 1 : n - 1);
  };

  const displayName = post.profiles?.full_name ?? (post.user_id === currentUserId ? "You" : "Someone");
  const initials = String(displayName || "??")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={`border rounded-2xl p-4 ${dm ? 'bg-[#161f30] border-white/5' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center font-['Caveat'] text-base font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${dm ? 'text-slate-200' : 'text-slate-800'}`}>
            {displayName} recommended a product
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
            className={`w-20 h-20 rounded-xl object-contain p-1.5 flex-shrink-0 ${dm ? 'bg-[#1a2540]' : 'bg-slate-100'}`}
          />
        ) : (
          <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 bg-gradient-to-br ${dm ? 'from-[#1a2540] to-[#1e2040]' : 'from-slate-100 to-slate-200'}`}>
            🛍️
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-['Caveat'] text-lg font-semibold leading-tight mb-0.5 line-clamp-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
            {post.product_name}
          </h3>
          {post.product_brand && (
            <p className="text-xs text-slate-500 mb-1">{post.product_brand}</p>
          )}
          {post.product_description && (
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-1">
              {post.product_description}
            </p>
          )}
          {post.review && (
            <p className="text-sm text-slate-500 italic leading-relaxed line-clamp-2">
              "{post.review}"
            </p>
          )}
          {post.product_price && (
            <p className="font-['Caveat'] text-lg font-bold text-teal-500 mt-1">
              {post.product_price}
            </p>
          )}
          {post.product_rating && (
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-amber-500">★</span> {Number(post.product_rating).toFixed(1)}
            </p>
          )}
          {(post.amazon_url || post.target_url || post.walmart_url) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { label: "Amazon", href: post.amazon_url },
                { label: "Target", href: post.target_url },
                { label: "Walmart", href: post.walmart_url },
              ].map((store) => {
                const href = String(store.href || "").trim();
                if (!href) return null;
                return (
                  <a
                    key={store.label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-400/20 bg-violet-50 dark:bg-violet-400/10 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-400/15 transition-colors"
                  >
                    {store.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-4 pt-3 border-t ${dm ? 'border-white/5' : 'border-slate-200'}`}>
        <button
          onClick={handleLike}
          className={`text-xs flex items-center gap-1 transition-colors duration-150 ${
            liked ? "text-pink-500" : "text-slate-400 hover:text-pink-500"
          }`}
        >
          {liked ? "♥" : "♡"} {likes} {likes === 1 ? "like" : "likes"}
        </button>
        <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
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
          className={`ml-auto text-xs px-3 py-1.5 rounded-xl border font-['Caveat'] font-bold transition-all duration-200 ${
            wished
              ? "bg-teal-500/20 border-teal-500/30 text-teal-600"
              : dm
                ? "bg-teal-400/8 border-teal-400/20 text-teal-400 hover:bg-teal-400/15"
                : "bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100"
          }`}
        >
          {wished ? "✓ In someday list" : "+ Someday list"}
        </button>
      </div>
    </div>
  );
});

// Post product modal
function PostProductModal({ product, onClose, onSubmit, darkMode }) {
  const dm = darkMode;
  const photoInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [draft, setDraft] = useState(() => ({
    name: product?.name || "",
    image: product?.image || "",
    price: product?.price || "",
    rating: product?.rating ?? "",
    category: getCategoryForProduct(product?.name),
    url: product?.amazonUrl || product?.targetUrl || product?.walmartUrl || "",
    review: "",
  }));

  const updateField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const readFilesAsDataUrls = (files) => Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  })));

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const buildCollageDataUrl = async (sources) => {
    const urls = sources.slice(0, 4);
    if (urls.length === 0) return "";
    if (urls.length === 1) return urls[0];

    const canvas = document.createElement("canvas");
    const size = 800;
    const gap = 18;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return urls[0];

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size, size);

    const imgs = await Promise.all(urls.map(loadImage));
    const slots = [
      [gap, gap, (size - gap * 3) / 2, (size - gap * 3) / 2],
      [(size + gap) / 2, gap, (size - gap * 3) / 2, (size - gap * 3) / 2],
      [gap, (size + gap) / 2, (size - gap * 3) / 2, (size - gap * 3) / 2],
      [(size + gap) / 2, (size + gap) / 2, (size - gap * 3) / 2, (size - gap * 3) / 2],
    ];

    const drawCover = (img, x, y, w, h) => {
      const scale = Math.max(w / img.width, h / img.height);
      const sw = w / scale;
      const sh = h / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.save();
      ctx.beginPath();
      const r = 32;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      ctx.restore();
    };

    imgs.forEach((img, index) => {
      const slot = slots[index];
      if (slot) drawCover(img, ...slot);
    });

    return canvas.toDataURL("image/jpeg", 0.78);
  };

  const handleImagePick = async (event) => {
    const files = Array.from(event.target.files?.length ? event.target.files : []);
    if (!files.length) return;
    try {
      const urls = await readFilesAsDataUrls(files);
      const collage = await buildCollageDataUrl(urls);
      setDraft((prev) => ({
        ...prev,
        image: collage,
      }));
      setPhotoError("");
    } catch {
      setPhotoError("Could not read that image.");
    }
    event.target.value = "";
  };

  const handleSubmit = async () => {
    if (!draft.review.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    const ok = await onSubmit({
      product: {
        ...product,
        name: draft.name.trim() || product?.name || "",
        image: draft.image.trim() || "",
        price: draft.price || product?.price || "",
        rating: draft.rating === "" ? (product?.rating ?? null) : Number(draft.rating),
        category: draft.category,
        amazonUrl: draft.url.trim(),
        targetUrl: draft.url.trim(),
        walmartUrl: draft.url.trim(),
      },
      review: draft.review,
      category: draft.category,
    });
    setSubmitting(false);
    if (ok) {
      onClose();
    } else {
      setSubmitError("Could not save this product recommendation right now.");
    }
  };

  const storeLinks = [
    {
      label: "Amazon",
      url: draft.url || product?.amazonUrl || "",
      badge: "#111827",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 14.5c2.6 2 9 2 12 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.2 13.2l1.6 1.3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 7.5c-1.7 0-3 .9-3 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Target",
      url: draft.url || product?.targetUrl || "",
      badge: "#dc2626",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" stroke="white" strokeWidth="2" />
          <circle cx="12" cy="12" r="2.4" fill="white" />
        </svg>
      ),
    },
    {
      label: "Walmart",
      url: draft.url || product?.walmartUrl || "",
      badge: "#2563eb",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4v5M12 15v5M4 12h5M15 12h5M6.6 6.6l3.5 3.5M13.9 13.9l3.5 3.5M17.4 6.6l-3.5 3.5M10.1 13.9l-3.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.7" fill="white" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[11010] flex items-end sm:items-center justify-center p-4 overflow-hidden overscroll-contain">
      <div className={`border rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col ${dm ? 'bg-[#161f30] border-white/10' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className={`font-handwritten text-2xl font-bold ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Share something you love ✨</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="px-6 pt-4 grid gap-5 overflow-y-auto flex-1">
          <div className={`overflow-hidden rounded-3xl border ${dm ? 'border-white/10 bg-[#0e1520]' : 'border-slate-200 bg-slate-50'}`}>
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
              <div className={`min-h-[240px] ${dm ? 'bg-[#1a2540]' : 'bg-slate-100'} relative`}>
                {draft.image ? (
                  <img
                    src={draft.image}
                    alt={draft.name || "Selected product"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">🛍️</div>
                )}
                <div className="absolute top-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white">
                  Product preview
                </div>
              </div>

              <div className="p-5 flex flex-col justify-center gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-violet-500 mb-2">From your shelf</p>
                  <h3 className={`font-['Caveat'] text-3xl font-bold leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
                    {draft.name || product?.name}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {draft.price && (
                    <span className="font-['Caveat'] text-xl font-bold text-teal-500">{draft.price}</span>
                  )}
                  {draft.rating !== "" && (
                    <span className="font-['Caveat'] text-xl font-bold text-violet-500">
                      {Number(draft.rating).toFixed(1)} ★
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter((c) => c.label !== "All").map((c) => (
                    <button
                      key={c.label}
                      onClick={() => updateField("category", c.label)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        draft.category === c.label
                          ? "bg-violet-400/15 border-violet-400/40 text-violet-600"
                          : dm
                            ? "bg-white/5 border-white/8 text-slate-400 hover:border-violet-400/25"
                            : "bg-slate-100 border-slate-200 text-slate-500 hover:border-violet-300"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <span className="text-xs uppercase tracking-widest text-slate-500">Photo</span>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full py-6 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-600 bg-amber-50/60 dark:bg-stone-900/20 hover:bg-amber-50 dark:hover:bg-stone-900/30 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Camera className="w-8 h-8 text-stone-500 dark:text-stone-400" />
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                {draft.image ? "Change photo" : "Add Photos"}
              </span>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                Tap to select from your device
              </span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagePick}
              className="hidden"
            />
            {photoError && (
              <div className="text-xs text-red-500">{photoError}</div>
            )}
          </div>

          <div className="grid gap-3">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">URL link</span>
              <input
                type="url"
                value={draft.url}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="https://example.com/your-product"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${dm ? 'bg-[#0e1520] border-white/8 text-slate-200 focus:border-violet-400/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-violet-400'}`}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">Price</span>
              <input
                type="text"
                value={draft.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="$349"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${dm ? 'bg-[#0e1520] border-white/8 text-slate-200 focus:border-violet-400/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-violet-400'}`}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">Rating</span>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={draft.rating}
                onChange={(e) => updateField("rating", e.target.value)}
                placeholder="4.8"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${dm ? 'bg-[#0e1520] border-white/8 text-slate-200 focus:border-violet-400/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-violet-400'}`}
              />
            </label>
          </div>

          <div className="grid gap-3">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">Why do you love it?</span>
              <textarea
                value={draft.review}
                onChange={(e) => updateField("review", e.target.value)}
                placeholder="Tell your friends what makes this worth it..."
                rows={4}
                className={`w-full border rounded-xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-colors resize-none font-['DM_Sans'] ${dm ? 'bg-[#0e1520] border-white/8 text-slate-200 focus:border-violet-400/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-violet-400'}`}
              />
            </label>
          </div>

          {submitError && (
            <div className="text-sm text-red-500">{submitError}</div>
          )}

          {String(draft.url || "").trim() && (
            <div className="grid gap-3">
              <div className="text-xs uppercase tracking-widest text-slate-500">Store links</div>
              <div className="flex flex-wrap gap-2">
                {storeLinks.map((store) => {
                  const href = String(store.url || "").trim();
                  if (!href) return null;
                  return (
                    <a
                      key={store.label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-16 h-16 rounded-2xl border transition-all flex items-center justify-center hover:-translate-y-0.5 hover:shadow-sm"
                      style={{
                        background: store.badge,
                        borderColor: store.badge,
                      }}
                      title={store.label}
                      aria-label={store.label}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 text-white">
                        {store.icon}
                        <span className="text-[9px] font-semibold leading-none">{store.label}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        <div className={`px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t ${dm ? 'border-white/10 bg-[#161f30]' : 'border-slate-200 bg-white'}`}>
          <button
            onClick={handleSubmit}
            disabled={!draft.review.trim() || submitting}
            className="w-full bg-[#C9A15D] hover:bg-[#B88A3A] disabled:opacity-40 text-white rounded-2xl py-3 text-sm font-handwritten font-bold transition-colors"
          >
            {submitting ? "Posting…" : "Share with friends"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedSomedayButton({ featured, onAddToSomeday, darkMode }) {
  const dm = darkMode;
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => {
        if (saved) return;
        setSaved(true);
        onAddToSomeday?.({
          title:    featured.product_name,
          imageUrl: featured.product_image || "",
          emoji:    "🛍️",
          type:     "products",
        });
      }}
      className={`text-xs px-4 py-2 rounded-xl border font-handwritten font-bold transition-all duration-200 ${
        saved
          ? "bg-teal-500/20 border-teal-500/30 text-teal-600"
          : dm
            ? "bg-teal-400/8 border-teal-400/20 text-teal-400 hover:bg-teal-400/15"
            : "bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100"
      }`}
    >
      {saved ? "✓ In someday list" : "+ Someday list"}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductsPage({ onBack, onAddToSomeday, darkMode = false } = {}) {
  const dm = darkMode;
  const communityFeedRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [products,       setProducts]       = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [featuredPost,   setFeaturedPost]   = useState(null);
  const [wishlistedIds,  setWishlistedIds]  = useState(new Set());
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [postingProduct, setPostingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
        sort_by:      "featured",
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
    const { data, error } = await supabase
      .from("product_posts")
      .select("id, user_id, product_name, product_brand, product_image, product_price, product_description, product_rating, amazon_url, target_url, walmart_url, review, category, likes_count, created_at")
      .order("likes_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data && data.length > 0) {
      setCommunityPosts(data);
      setFeaturedPost(data[0] ?? null);
    } else {
      setCommunityPosts(MOCK_FEED);
      setFeaturedPost(MOCK_FEED[0]);
    }
  };

  // ── Wishlist save ──
  const handleSomeday = useCallback((product) => {
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
  }, [onAddToSomeday, wishlistedIds]);

  // ── Post a product ──
  const handlePostSubmit = async ({ product, review, category }) => {
    const payload = {
      user_id: currentUserId,
      product_name: product.name,
      product_description: product.description || null,
      product_image: product.image,
      product_price: product.price,
      product_rating: product.rating ?? null,
      product_asin: product.id,
      amazon_url: product.amazonUrl,
      target_url: product.targetUrl || null,
      walmart_url: product.walmartUrl || null,
      review,
      category,
      likes_count: 0,
    };

    const { data, error } = await supabase
      .from("product_posts")
      .insert(payload)
      .select("id, user_id, product_name, product_brand, product_image, product_price, product_description, product_rating, amazon_url, target_url, walmart_url, review, category, likes_count, created_at")
      .single();

    if (error) {
      console.error(error);
      return false;
    }

    if (data) {
      setCommunityPosts((prev) => [data, ...prev.filter((post) => String(post.id) !== String(data.id))]);
      setFeaturedPost(data);
      window.setTimeout(() => {
        communityFeedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }

    return true;
  };

  const handleOpenProduct = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const friendsPostedCount = useMemo(
    () => communityPosts.filter((p) => p.profiles).length,
    [communityPosts]
  );

  const featured = featuredPost;
  const gridProducts = useMemo(() => products.slice(0, 6), [products]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen font-['DM_Sans'] ${dm ? 'bg-[#0e1520] text-slate-200' : 'bg-[#faf8f3] text-slate-800'}`}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap'); .font-handwritten { font-family: 'Caveat', cursive; }`}</style>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">

        {/* ── Hero ── */}
        <div className={`relative bg-gradient-to-br rounded-3xl p-8 mb-6 overflow-hidden border ${dm ? 'from-[#0f1a2e] via-[#1a1535] to-[#0e1520] border-white/5' : 'from-slate-50 via-violet-50 to-slate-50 border-violet-100'}`}>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(167,139,250,0.08),transparent)]" />
          <div className="absolute right-8 top-6 text-8xl opacity-10 -rotate-6 select-none">🛍️</div>

          <div className="relative z-10">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 active:opacity-70 flex-shrink-0 mb-4"
              aria-label="Back"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <h1 className={`font-handwritten text-5xl font-bold leading-tight mb-2 bg-gradient-to-r bg-clip-text text-transparent ${dm ? 'from-slate-100 to-violet-300' : 'from-slate-800 to-violet-600'}`}>
            Find your next favorite thing
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
            Discover products you never knew you needed.
          </p>

          <div className="flex gap-6 flex-wrap">
            {[
              { num: communityPosts.length || "—", lbl: "Products shared" },
              { num: friendsPostedCount || "—", lbl: "Friends posted" },
              { num: wishlistedIds.size, lbl: "Wishlist saves" },
            ].map(({ num, lbl }) => (
              <div key={lbl} className="flex flex-col">
                <span className="font-['Caveat'] text-3xl font-bold text-violet-500 leading-none">{num}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{lbl}</span>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="flex gap-2.5 mb-5">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search Amazon products..."
            className={`flex-1 border rounded-2xl px-4 py-3 text-sm outline-none transition-colors ${dm ? 'bg-[#161f30] border-white/7 text-slate-200 placeholder-slate-500 focus:border-violet-400/40' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400'}`}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-violet-500 hover:bg-violet-600 text-white rounded-2xl px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
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
                  ? "bg-violet-400/12 border-violet-400/40 text-violet-600"
                  : dm
                    ? "bg-[#161f30] border-white/7 text-slate-500 hover:text-violet-400 hover:border-violet-400/25"
                    : "bg-white border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300"
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
              className={`border rounded-full px-4 py-2 flex items-center gap-2 whitespace-nowrap hover:border-violet-400/30 hover:bg-violet-400/5 transition-all ${dm ? 'bg-[#161f30] border-white/7' : 'bg-white border-slate-200'}`}
            >
              <span className="text-base leading-none">{t.emoji}</span>
              <span className={`text-sm ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{t.label}</span>
              <span className="text-xs text-slate-400">{t.count} posts</span>
            </button>
          ))}
        </div>

        {/* ── Featured (most loved community post) ── */}
        {featured && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Most loved this week</p>
            <div className={`border border-violet-400/15 rounded-3xl overflow-hidden mb-8 hover:border-violet-400/30 transition-colors ${dm ? 'bg-[#161f30]' : 'bg-white'}`}>
              <div className="grid grid-cols-2 max-sm:grid-cols-1">
                {featured.product_image ? (
                  <img
                    src={featured.product_image}
                    alt={featured.product_name}
                    className={`w-full h-52 object-contain p-6 ${dm ? 'bg-[#1a2540]' : 'bg-slate-100'}`}
                  />
                ) : (
                  <div className={`h-52 flex items-center justify-center text-7xl bg-gradient-to-br ${dm ? 'from-[#1a1535] to-[#231a40]' : 'from-violet-50 to-purple-100'}`}>
                    🛍️
                  </div>
                )}
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-widest text-violet-500 mb-2">
                    🔥 Top recommended
                  </p>
                  <h2 className={`font-['Caveat'] text-2xl font-bold leading-tight mb-1 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
                    {featured.product_name}
                  </h2>
                  {featured.product_brand && (
                    <p className="text-xs text-slate-500 mb-2">{featured.product_brand}</p>
                  )}
                  {featured.review && (
                    <p className="text-sm text-slate-500 italic leading-relaxed mb-4 line-clamp-3">
                      "{featured.review}"
                    </p>
                  )}
                  <div className="flex gap-3 flex-wrap mb-4">
                    {featured.product_price && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-500">
                          {featured.product_price}
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Price</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-['Caveat'] text-xl font-semibold text-violet-500">
                        {featured.likes_count ?? 0}
                      </span>
                      <span className="text-[10px] uppercase text-slate-500 tracking-wide">Likes</span>
                    </div>
                  </div>
                  <FeaturedSomedayButton featured={featured} onAddToSomeday={onAddToSomeday} darkMode={dm} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-500 mb-6">
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
              <div key={i} className={`rounded-2xl h-72 animate-pulse border ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-200 border-slate-200'}`} />
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
                onOpen={handleOpenProduct}
                darkMode={dm}
              />
            ))}
          </div>
        )}

        {!loading && gridProducts.length === 0 && (
          <div className="text-center py-16 text-slate-400 mb-8">
            <div className="text-5xl mb-4">🔍</div>
            <p className={`font-['Caveat'] text-2xl mb-1 ${dm ? 'text-slate-400' : 'text-slate-600'}`}>No products found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}

        {/* ── Post CTA ── */}
        <div style={{
          borderRadius: '20px',
          background: '#FFF8EA',
          border: '1.5px solid #D8B36A',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '100px', height: '100px', borderRadius: '50%',
            background: '#D8B36A', opacity: 0.18, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20px', left: '-20px',
            width: '70px', height: '70px', borderRadius: '50%',
            background: '#B88A3A', opacity: 0.10, pointerEvents: 'none',
          }} />

          <div style={{ fontSize: '28px', marginBottom: '2px' }}>🛍️</div>

          <p style={{
            fontSize: '18px', fontWeight: 500, color: '#7C3313',
            fontFamily: "'Caveat', cursive", margin: 0,
          }}>
            Found something amazing?
          </p>

          <p style={{ fontSize: '13px', color: '#8A5A1F', margin: '0 0 10px', fontFamily: "'Caveat', cursive" }}>
            Share it with your friends — tell them why you love it.
          </p>

          <button
            onClick={() => setPostingProduct({ name: "", image: null, price: null })}
            style={{
              background: '#C9A15D', color: 'white', border: 'none',
              borderRadius: '50px', padding: '11px 28px',
              fontSize: '18px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: "'Caveat', cursive",
              letterSpacing: '0.01em',
            }}
          >
            <span style={{
              background: '#7C3313', borderRadius: '50%',
              width: '20px', height: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5H8M8 5L5.5 2.5M8 5L5.5 7.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Share something you love ✨
          </button>
        </div>

        {/* ── Community feed ── */}
        <p ref={communityFeedRef} className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">
          What friends are recommending
        </p>
        <div className="flex flex-col gap-2.5">
          {communityPosts.map((post) => (
            <CommunityPost key={post.id} post={post} currentUserId={currentUserId} onAddToSomeday={onAddToSomeday} darkMode={dm} />
          ))}
        </div>

      </div>

      {/* ── Post modal ── */}
      {postingProduct && (
        <PostProductModal
          product={postingProduct}
          onClose={() => setPostingProduct(null)}
          onSubmit={handlePostSubmit}
          darkMode={dm}
        />
      )}

      {/* ── Product detail modal ── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isSaved={wishlistedIds.has(selectedProduct.id)}
          onSomeday={handleSomeday}
          onPost={setPostingProduct}
          onClose={() => setSelectedProduct(null)}
          darkMode={dm}
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
