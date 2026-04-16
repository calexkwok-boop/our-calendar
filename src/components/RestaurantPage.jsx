/**
 * RestaurantPage.jsx
 *
 * Drop into your components folder. Matches the warm scrapbook aesthetic
 * of the rest of the app (Caveat font, parchment backgrounds, paper texture,
 * caramel accents).
 *
 * Props:
 *   apiKey          – string   your Google Places API key
 *                              OR set REACT_APP_GOOGLE_PLACES_KEY env var
 *   userLocation    – { lat, lng } | null   pass in from geolocation or default city
 *   onAddEvent      – (eventData) => void   fires when "Plan a dinner" is tapped
 *   onSaveToSomeday – (restaurant) => void  fires when "Someday" is tapped
 *   darkMode        – boolean
 *
 * ARCHITECTURE NOTE:
 *   Google Places nearbysearch cannot be called directly from the browser
 *   without exposing your key in network requests. Two options:
 *
 *   Option A (recommended): Vercel serverless function
 *     Create /api/places.js in your repo:
 *
 *     export default async function handler(req, res) {
 *       const { lat, lng, query, type } = req.query;
 *       const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
 *         `?location=${lat},${lng}&radius=5000&type=restaurant` +
 *         `&keyword=${encodeURIComponent(query||'')}&key=${process.env.GOOGLE_PLACES_KEY}`;
 *       const r = await fetch(url);
 *       const data = await r.json();
 *       res.json(data);
 *     }
 *
 *     Then set GOOGLE_PLACES_KEY in Vercel environment variables (not prefixed with REACT_APP_).
 *     The component will call /api/places automatically.
 *
 *   Option B (quick start): pass apiKey prop directly (key exposed in browser — OK for dev)
 *     The component falls back to calling Google directly if no /api/places route exists.
 *
 * FALLBACK:
 *   If the API is unavailable, FALLBACK_RESTAURANTS provides a rich demo dataset.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, Clock, Phone, ExternalLink, Plus, Search, Star, X, ChevronRight, Navigation, Camera } from 'lucide-react';
import { supabase } from '../supabaseClient';

// ─── constants ────────────────────────────────────────────────────────────────
const handwritten = '"Caveat", "Comic Sans MS", "Bradley Hand", cursive';

const CUISINE_FILTERS = [
  { id: 'all',        label: 'All',          emoji: '🍽️' },
  { id: 'italian',    label: 'Italian',      emoji: '🍝' },
  { id: 'japanese',   label: 'Japanese',     emoji: '🍣' },
  { id: 'mexican',    label: 'Mexican',      emoji: '🌮' },
  { id: 'american',   label: 'American',     emoji: '🍔' },
  { id: 'chinese',    label: 'Chinese',      emoji: '🥡' },
  { id: 'thai',       label: 'Thai',         emoji: '🍛' },
  { id: 'indian',     label: 'Indian',       emoji: '🫕' },
  { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { id: 'korean',     label: 'Korean',       emoji: '🥩' },
  { id: 'french',     label: 'French',       emoji: '🥐' },
  { id: 'seafood',    label: 'Seafood',      emoji: '🦞' },
];

const PRICE_FILTERS = [
  { id: 'all', label: 'Any price' },
  { id: '1',   label: '$' },
  { id: '2',   label: '$$' },
  { id: '3',   label: '$$$' },
  { id: '4',   label: '$$$$' },
];

const SORT_OPTIONS = [
  { id: 'prominence', label: 'Best match' },
  { id: 'rating',     label: 'Top rated' },
  { id: 'distance',   label: 'Nearest' },
];

const RADIUS_OPTIONS = [
  { id: 2000,  label: 'Nearby',  sub: '2 km' },
  { id: 5000,  label: 'Walking', sub: '5 km' },
  { id: 10000, label: 'City',    sub: '10 km' },
  { id: 25000, label: 'Wide',    sub: '25 km' },
];

// ─── fallback data ────────────────────────────────────────────────────────────
const FALLBACK_RESTAURANTS = [
  { id: 'f1',  name: 'Nobu Los Angeles',         cuisine: 'japanese',      rating: 4.6, priceLevel: 4, address: '903 N La Cienega Blvd, West Hollywood', distance: '0.8 mi', isOpen: true,  photo: '', phone: '(310) 657-5711', website: 'https://noburestaurants.com', description: 'Celebrity hotspot serving world-famous black cod miso and contemporary Japanese dishes.' },
  { id: 'f2',  name: 'Bestia',                   cuisine: 'italian',       rating: 4.7, priceLevel: 3, address: '2121 E 7th Pl, Los Angeles',            distance: '2.1 mi', isOpen: true,  photo: '', phone: '(213) 514-5724', website: 'https://bestiala.com',         description: 'Rustic Italian spot in the Arts District, known for house-made pastas and whole-animal roasts.' },
  { id: 'f3',  name: 'Mariscos Jalisco',          cuisine: 'mexican',       rating: 4.8, priceLevel: 1, address: '3040 E Olympic Blvd, Los Angeles',      distance: '3.4 mi', isOpen: true,  photo: '', phone: '(323) 528-6701', website: '',                             description: 'Legendary street food truck turned institution. The fried tacos de camarón are unmissable.' },
  { id: 'f4',  name: 'Providence',                cuisine: 'seafood',       rating: 4.8, priceLevel: 4, address: '5955 Melrose Ave, Los Angeles',          distance: '4.2 mi', isOpen: false, photo: '', phone: '(323) 460-4170', website: 'https://providencela.com',     description: 'Two-Michelin-star seafood temple. Chef Michael Cimarusti sources directly from sustainable fisheries.' },
  { id: 'f5',  name: 'Jitlada',                   cuisine: 'thai',          rating: 4.5, priceLevel: 2, address: '5233 W Sunset Blvd, Los Angeles',        distance: '1.9 mi', isOpen: true,  photo: '', phone: '(323) 667-9809', website: '',                             description: 'The most authentic Southern Thai cooking in the city. Regulars swear by the crab curry.' },
  { id: 'f6',  name: 'République',                cuisine: 'french',        rating: 4.6, priceLevel: 3, address: '624 S La Brea Ave, Los Angeles',         distance: '2.7 mi', isOpen: true,  photo: '', phone: '(310) 362-6115', website: 'https://republiquela.com',     description: 'Grand Parisian brasserie in a stunning Charlie Chaplin-era building. Brunch is legendary.' },
  { id: 'f7',  name: 'Kogi BBQ',                  cuisine: 'korean',        rating: 4.7, priceLevel: 1, address: 'Multiple LA locations (check Twitter)',   distance: '1.5 mi', isOpen: true,  photo: '', phone: '',              website: 'https://kogibbq.com',          description: 'The Korean BBQ taco truck that started the food truck revolution. Find the daily location online.' },
  { id: 'f8',  name: 'Majordomo',                 cuisine: 'american',      rating: 4.5, priceLevel: 3, address: '1725 Naud St, Los Angeles',              distance: '2.3 mi', isOpen: false, photo: '', phone: '(323) 545-4880', website: 'https://majordomo.la',         description: 'David Chang\'s LA flagship. The large-format dishes like pork shoulder for two are the move.' },
  { id: 'f9',  name: 'Shin Beijing',              cuisine: 'chinese',       rating: 4.4, priceLevel: 2, address: '500 W Main St, Alhambra',                distance: '8.1 mi', isOpen: true,  photo: '', phone: '(626) 281-0088', website: '',                             description: 'Best Peking duck outside of Beijing. Book the private room for the full ceremonial experience.' },
  { id: 'f10', name: 'Howlin\' Ray\'s',           cuisine: 'american',      rating: 4.6, priceLevel: 2, address: '727 N Broadway #128, Los Angeles',       distance: '2.8 mi', isOpen: true,  photo: '', phone: '(323) 488-5905', website: 'https://howlinrays.com',       description: 'Nashville hot chicken that\'ll make your eyes water. The line is always worth it.' },
  { id: 'f11', name: 'Spago Beverly Hills',       cuisine: 'american',      rating: 4.5, priceLevel: 4, address: '176 N Canon Dr, Beverly Hills',          distance: '5.6 mi', isOpen: true,  photo: '', phone: '(310) 385-0880', website: 'https://wolfgangpuck.com',     description: 'Wolfgang Puck\'s iconic flagship. The smoked salmon pizza started a revolution in 1982.' },
  { id: 'f12', name: 'Momed',                     cuisine: 'mediterranean', rating: 4.4, priceLevel: 2, address: '233 S Beverly Dr, Beverly Hills',        distance: '5.1 mi', isOpen: true,  photo: '', phone: '(310) 270-4444', website: 'https://momedrestaurant.com',  description: 'Casual Mediterranean spot with sharable plates. The lamb chops and hummus are must-orders.' },
  { id: 'f13', name: 'Dosa by Dosa',              cuisine: 'indian',        rating: 4.6, priceLevel: 2, address: '1011 S Fairfax Ave, Los Angeles',        distance: '3.3 mi', isOpen: true,  photo: '', phone: '(323) 938-3672', website: '',                             description: 'South Indian dosas so crispy and perfectly spiced they\'ve earned a cult following.' },
  { id: 'f14', name: 'Sushi Park',                cuisine: 'japanese',      rating: 4.8, priceLevel: 4, address: '8539 W Sunset Blvd #1, Los Angeles',    distance: '4.4 mi', isOpen: false, photo: '', phone: '(310) 652-0523', website: '',                             description: 'Omakase-only hideaway above the Sunset Strip. Reserve months in advance. Worth every penny.' },
  { id: 'f15', name: 'Guisados',                  cuisine: 'mexican',       rating: 4.7, priceLevel: 1, address: '1261 W Sunset Blvd, Los Angeles',        distance: '1.2 mi', isOpen: true,  photo: '', phone: '(213) 908-4851', website: 'https://guisados.co',          description: 'Braised taco specialists. Get the sampler of six — you can\'t go wrong with any of them.' },
];

// ─── cuisine emoji fallback ───────────────────────────────────────────────────
const CUISINE_EMOJI = { japanese: '🍣', italian: '🍝', mexican: '🌮', american: '🍔', chinese: '🥡', thai: '🍛', indian: '🫕', mediterranean: '🫒', korean: '🥩', french: '🥐', seafood: '🦞', default: '🍽️' };

const getCuisineEmoji = (cuisine) => CUISINE_EMOJI[cuisine?.toLowerCase()] || CUISINE_EMOJI.default;

// ─── price display ────────────────────────────────────────────────────────────
const priceStr = (level) => level ? '$'.repeat(level) : '–';

const truncateText = (text, max = 120) => {
  if (!text) return '';
  const clean = String(text).trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
};

const restaurantSomedayPayload = (post) => ({
  title: post.restaurant_name,
  imageUrl: post.restaurant_image || '',
  emoji: '🍽️',
  type: 'restaurants',
  notes: [post.review, post.address, post.best_for, post.cuisine, post.price_level ? priceStr(post.price_level) : '']
    .filter(Boolean)
    .join(' · '),
});

// ─── (paper texture removed — matches MoviesPage clean aesthetic) ─────────────

// ─── star display ─────────────────────────────────────────────────────────────
const Stars = ({ rating, size = 12 }) => {
  const pct = Math.round((rating / 5) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', fontSize: size, lineHeight: 1, letterSpacing: 1 }}>
        <span style={{ color: '#e2e8f0' }}>★★★★★</span>
        <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: `${pct}%`, color: '#f59e0b' }}>★★★★★</span>
      </div>
      <span style={{ fontSize: size - 1, fontWeight: 600, color: '#f59e0b' }}>{rating.toFixed(1)}</span>
    </div>
  );
};

// ─── Restaurant Detail Sheet ──────────────────────────────────────────────────
const RestaurantDetailSheet = ({ restaurant, onAddEvent, onSaveToSomeday, onClose, savedIds, darkMode }) => {
  const [saved, setSaved] = useState(savedIds.has(restaurant.id));
  const pbg = darkMode ? '#131c2e' : '#fff';
  const tp  = darkMode ? '#f1f5f9' : '#111827';
  const ts  = darkMode ? '#6b7280' : '#9ca3af';
  const bw  = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';

  const bgGradient = darkMode
    ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))'
    : 'linear-gradient(135deg, #f0f4ff, rgba(165,180,252,0.15))';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 480, background: pbg, borderRadius: '24px 24px 0 0', maxHeight: '88vh', overflowY: 'auto', borderTop: `1px solid ${bw}`, paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: 3, margin: '12px auto 0' }} />

        {/* Hero */}
        <div style={{ width: '100%', height: 200, background: bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, position: 'relative' }}>
          {restaurant.photo
            ? <img src={restaurant.photo} alt={restaurant.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
            : getCuisineEmoji(restaurant.cuisine)
          }
          {/* Open/closed badge */}
          <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 20, background: restaurant.isOpen ? 'rgba(20,184,166,0.15)' : 'rgba(239,68,68,0.15)', color: restaurant.isOpen ? '#0f766e' : '#b91c1c', fontSize: 11, fontWeight: 700 }}>
            {restaurant.isOpen ? '● Open now' : '● Closed'}
          </div>
        </div>

        <div style={{ padding: '18px 22px 36px' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontFamily: handwritten, fontSize: 28, fontWeight: 700, color: tp, margin: 0, lineHeight: 1.1, flex: 1 }}>
              {getCuisineEmoji(restaurant.cuisine)} {restaurant.name}
            </h2>
            <span style={{ fontFamily: handwritten, fontSize: 18, color: ts, flexShrink: 0 }}>{priceStr(restaurant.priceLevel)}</span>
          </div>

          <Stars rating={restaurant.rating} size={14} />

          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 9px', borderRadius: 8, background: darkMode ? 'rgba(168,85,247,0.15)' : 'rgba(243,232,255,1)', color: darkMode ? '#c4b5fd' : '#6d28d9', fontSize: 11, fontWeight: 600 }}>
              {restaurant.cuisine}
            </span>
            {restaurant.distance && (
              <span style={{ padding: '3px 9px', borderRadius: 8, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: ts, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Navigation style={{ width: 10, height: 10 }} />{restaurant.distance}
              </span>
            )}
          </div>

          {restaurant.description && (
            <p style={{ fontSize: 13, color: ts, lineHeight: 1.6, margin: '12px 0', fontStyle: 'italic' }}>{restaurant.description}</p>
          )}

          {/* Info rows */}
          <div style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius: 14, padding: '12px 14px', marginBottom: 18, border: `1px solid ${bw}` }}>
            {restaurant.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: `0.5px solid ${bw}` }}>
                <MapPin style={{ width: 15, height: 15, color: '#9ca3af', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: tp, lineHeight: 1.4 }}>{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: restaurant.website ? 10 : 0, borderBottom: restaurant.website ? `0.5px solid ${bw}` : 'none' }}>
                <Phone style={{ width: 15, height: 15, color: '#9ca3af', flexShrink: 0 }} />
                <a href={`tel:${restaurant.phone}`} style={{ fontSize: 13, color: darkMode ? '#818cf8' : '#4f46e5', textDecoration: 'none' }}>{restaurant.phone}</a>
              </div>
            )}
            {restaurant.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ExternalLink style={{ width: 15, height: 15, color: '#9ca3af', flexShrink: 0 }} />
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: darkMode ? '#818cf8' : '#4f46e5', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {restaurant.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          {/* Google Maps link */}
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + ' ' + (restaurant.address || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '10px 0', borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: `1px solid ${bw}`, color: ts, fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 12 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <MapPin style={{ width: 14, height: 14 }} /> Open in Google Maps
          </a>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                onAddEvent?.({
                  title: `🍽️ Dinner at ${restaurant.name}`,
                  notes: `${restaurant.address || ''} · ${priceStr(restaurant.priceLevel)} · ${restaurant.cuisine}`,
                  category: 'hangout',
                  location: restaurant.address || restaurant.name,
                });
                onClose();
              }}
              style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: darkMode ? 'rgba(255,255,255,0.07)' : '#f3f4f6', color: darkMode ? '#d1d5db' : '#374151', fontFamily: handwritten, fontSize: 17, fontWeight: 700, cursor: 'pointer', transition: 'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.88'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              📅 Plan a dinner
            </button>
            <button
              onClick={() => {
                if (!saved) {
                  setSaved(true);
                  onSaveToSomeday?.(restaurant);
                }
              }}
              style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: saved ? '#0d9488' : '#2dd4bf', color: saved ? '#fff' : '#111827', fontFamily: handwritten, fontSize: 17, fontWeight: 700, cursor: saved ? 'default' : 'pointer', transition: 'all .2s' }}
            >
              {saved ? '✓ Saved' : '✦ Someday list'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Restaurant Card ──────────────────────────────────────────────────────────
const RestaurantCard = ({ restaurant, onTap, savedIds, darkMode, stagger }) => {
  const bg  = darkMode ? '#161f30' : '#ffffff';
  const bdr = darkMode ? 'transparent' : '#e5e7eb';
  const tp  = darkMode ? '#f1f5f9' : '#111827';
  const ts  = darkMode ? '#6b7280' : '#9ca3af';
  const saved = savedIds.has(restaurant.id);

  const photoBg = darkMode ? 'rgba(99,102,241,0.08)' : '#f5f3ff';

  return (
    <div
      onClick={() => onTap(restaurant)}
      style={{ background: bg, borderRadius: 20, border: `1px solid ${bdr}`, overflow: 'hidden', cursor: 'pointer', animation: 'fadeUp .35s ease both', animationDelay: `${stagger * 0.055}s`, transition: 'transform .18s, box-shadow .18s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = darkMode ? '0 10px 28px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Photo */}
      <div style={{ width: '100%', height: 130, background: photoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, position: 'relative' }}>
        {restaurant.photo
          ? <img src={restaurant.photo} alt={restaurant.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : getCuisineEmoji(restaurant.cuisine)
        }
        {/* Open/closed dot */}
        <div style={{ position: 'absolute', top: 8, left: 8, width: 8, height: 8, borderRadius: '50%', background: restaurant.isOpen ? '#14b8a6' : '#ef4444', boxShadow: '0 0 0 2px rgba(255,255,255,0.3)' }} />
        {/* Saved badge */}
        {saved && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: '#0d9488', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>✓ Saved</div>
        )}
        {/* Price */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
          {priceStr(restaurant.priceLevel)}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '11px 13px 13px' }}>
        <div style={{ fontFamily: handwritten, fontSize: 17, fontWeight: 700, color: tp, lineHeight: 1.2, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {restaurant.name}
        </div>

        <Stars rating={restaurant.rating} size={11} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 7, background: darkMode ? 'rgba(168,85,247,0.15)' : 'rgba(243,232,255,1)', color: darkMode ? '#c4b5fd' : '#6d28d9' }}>
            {restaurant.cuisine}
          </span>
          {restaurant.distance && (
            <span style={{ fontSize: 10, color: ts, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Navigation style={{ width: 9, height: 9 }} />{restaurant.distance}
            </span>
          )}
        </div>

        {restaurant.address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 7 }}>
            <MapPin style={{ width: 10, height: 10, color: '#9ca3af', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 11, color: ts, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', marginTop: 1 }}>{restaurant.address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── skeleton card ────────────────────────────────────────────────────────────
const FeaturedRestaurantRecommendation = React.memo(({ post, onSomeday, onRemoveFromSomeday, darkMode }) => {
  const bg = darkMode ? '#161f30' : '#ffffff';
  const bw = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const tp = darkMode ? '#f1f5f9' : '#111827';
  const ts = darkMode ? '#6b7280' : '#9ca3af';
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [post?.id]);

  return (
    <div style={{ background: bg, borderRadius: 24, border: `1px solid ${bw}`, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr' }} className="max-sm:block">
        <div style={{ minHeight: 220, background: darkMode ? 'rgba(99,102,241,0.08)' : '#f5f3ff', position: 'relative' }}>
          {post.restaurant_image ? (
            <img
              src={post.restaurant_image}
              alt={post.restaurant_name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              🍽️
            </div>
          )}
          <div style={{ position: 'absolute', top: 12, left: 12, padding: '5px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
            Most loved this week
          </div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8b5cf6' }}>
            From your community
          </p>
          <h2 style={{ fontFamily: handwritten, fontSize: 30, fontWeight: 700, lineHeight: 1.05, margin: 0, color: tp }}>
            {post.restaurant_name}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {post.cuisine && (
              <span style={{ padding: '4px 9px', borderRadius: 8, background: darkMode ? 'rgba(168,85,247,0.15)' : 'rgba(243,232,255,1)', color: darkMode ? '#c4b5fd' : '#6d28d9', fontSize: 11, fontWeight: 600 }}>
                {post.cuisine}
              </span>
            )}
            {post.best_for && (
              <span style={{ padding: '4px 9px', borderRadius: 8, background: darkMode ? 'rgba(20,184,166,0.12)' : 'rgba(204,251,241,0.8)', color: darkMode ? '#5eead4' : '#0f766e', fontSize: 11, fontWeight: 600 }}>
                {post.best_for}
              </span>
            )}
            <span style={{ padding: '4px 9px', borderRadius: 8, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: ts, fontSize: 11, fontWeight: 600 }}>
              {post.likes_count ?? 0} likes
            </span>
          </div>
          {post.review && (
            <p style={{ margin: 0, color: ts, fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>
              "{truncateText(post.review, 160)}"
            </p>
          )}
          <button
            onClick={() => {
              const payload = restaurantSomedayPayload(post);
              if (saved) {
                onRemoveFromSomeday?.(payload);
                setSaved(false);
                return;
              }
              setSaved(true);
              onSomeday?.(post);
            }}
            style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`, background: saved ? '#0d9488' : (darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfa'), color: saved ? '#fff' : (darkMode ? '#5eead4' : '#0f766e'), fontSize: 13, fontWeight: 700, fontFamily: handwritten, cursor: 'pointer' }}
          >
            {saved ? '✓ Saved' : '+ Add to Someday'}
          </button>
        </div>
      </div>
    </div>
  );
});

const RestaurantRecommendationCard = React.memo(({ post, currentUserId, onSomeday, darkMode }) => {
  const bg = darkMode ? '#161f30' : '#ffffff';
  const bw = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const tp = darkMode ? '#f1f5f9' : '#111827';
  const ts = darkMode ? '#6b7280' : '#9ca3af';
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const isMine = Boolean(currentUserId && post.user_id && currentUserId === post.user_id);

  return (
    <div style={{ background: bg, borderRadius: 20, border: `1px solid ${bw}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 12, padding: 14 }}>
        <div style={{ width: 54, height: 54, borderRadius: 18, background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(20,184,166,0.18))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: handwritten, fontSize: 18, fontWeight: 700, color: tp, flexShrink: 0 }}>
          {isMine ? 'You' : '★'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <p style={{ margin: 0, color: tp, fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>
              {isMine ? 'You recommended a place' : 'Someone recommended a place'}
            </p>
            <span style={{ fontSize: 11, color: ts, flexShrink: 0 }}>
              {post.likes_count ?? 0} likes
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: ts }}>
            {post.address || 'Community recommendation'}
          </p>
        </div>
      </div>

      {post.restaurant_image ? (
        <img
          src={post.restaurant_image}
          alt={post.restaurant_name}
          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div style={{ width: '100%', height: 180, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
          🍽️
        </div>
      )}

      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontFamily: handwritten, fontSize: 22, fontWeight: 700, lineHeight: 1.1, margin: 0, color: tp }}>
              {post.restaurant_name}
            </h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
              {post.cuisine && (
                <span style={{ padding: '3px 8px', borderRadius: 8, background: darkMode ? 'rgba(168,85,247,0.15)' : 'rgba(243,232,255,1)', color: darkMode ? '#c4b5fd' : '#6d28d9', fontSize: 11, fontWeight: 600 }}>
                  {post.cuisine}
                </span>
              )}
              {post.best_for && (
                <span style={{ padding: '3px 8px', borderRadius: 8, background: darkMode ? 'rgba(20,184,166,0.12)' : 'rgba(204,251,241,0.8)', color: darkMode ? '#5eead4' : '#0f766e', fontSize: 11, fontWeight: 600 }}>
                  {post.best_for}
                </span>
              )}
            </div>
          </div>
          {post.price_level && (
            <span style={{ fontFamily: handwritten, fontSize: 18, color: ts, flexShrink: 0 }}>
              {priceStr(post.price_level)}
            </span>
          )}
        </div>

        {post.review && (
          <p style={{ margin: '10px 0 0', fontSize: 13, color: ts, lineHeight: 1.6, fontStyle: 'italic' }}>
            "{truncateText(post.review, 130)}"
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setLiked(v => !v)}
            style={{ padding: '7px 10px', borderRadius: 10, border: `1px solid ${bw}`, background: liked ? 'rgba(244,114,182,0.12)' : 'transparent', color: liked ? '#ec4899' : ts, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            {liked ? '♥' : '♡'} {post.likes_count ?? 0}
          </button>
          <span style={{ fontSize: 12, color: ts }}>
            💬 {post.comments_count ?? 0}
          </span>
          <button
            onClick={() => {
              if (saved) return;
              setSaved(true);
              onSomeday?.(post);
            }}
            style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(45,212,191,0.22)' : '#99f6e4'}`, background: saved ? '#0d9488' : (darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfa'), color: saved ? '#fff' : (darkMode ? '#5eead4' : '#0f766e'), fontSize: 12, fontWeight: 700, fontFamily: handwritten, cursor: saved ? 'default' : 'pointer' }}
          >
            {saved ? '✓ Someday' : '+ Someday'}
          </button>
        </div>
      </div>
    </div>
  );
});

const PostRestaurantModal = ({ onClose, onSubmit, darkMode }) => {
  const pbg = darkMode ? '#131c2e' : '#fff';
  const tp = darkMode ? '#f1f5f9' : '#111827';
  const ts = darkMode ? '#6b7280' : '#9ca3af';
  const bw = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    restaurant_name: '',
    restaurant_image: '',
    address: '',
    cuisine: '',
    price_level: '',
    rating: '',
    review: '',
    best_for: '',
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const readImageFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, restaurant_image: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleImagePick = (event) => {
    const file = event.target.files?.[0];
    readImageFile(file);
    event.target.value = '';
  };

  const openPhotoPicker = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!form.restaurant_name.trim() || !form.review.trim()) {
      setSubmitError('Please add a restaurant name and a short review.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    const ok = await onSubmit?.(form);
    setSubmitting(false);

    if (ok) {
      onClose();
    } else {
      setSubmitError('Could not save this recommendation right now.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div
        style={{ width: '100%', maxWidth: 560, background: pbg, borderRadius: '24px 24px 0 0', maxHeight: '88vh', overflowY: 'auto', borderTop: `1px solid ${bw}`, paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: 3, margin: '12px auto 0' }} />
        <div style={{ padding: '18px 20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8b5cf6' }}>
                Recommend a place ✨
              </p>
              <h2 style={{ fontFamily: handwritten, fontSize: 28, fontWeight: 700, color: tp, margin: '4px 0 0' }}>
                Share a favorite spot
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: tp, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 0 }}
            >
              <X style={{ width: 16, height: 16, display: 'block' }} />
            </button>
          </div>

          <p style={{ fontSize: 13, color: ts, lineHeight: 1.6, margin: '0 0 18px' }}>
            Add a place you love so it can show up alongside the Google results.
          </p>

          {submitError && (
            <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(251,191,36,0.2)' : '#fde68a'}`, background: darkMode ? 'rgba(251,191,36,0.08)' : '#fffbeb', color: darkMode ? '#fbbf24' : '#92400e', fontSize: 12 }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {[ 
              { key: 'restaurant_name', label: 'Restaurant name', required: true, placeholder: 'Bestia' },
              { key: 'address', label: 'Address', placeholder: '2121 E 7th Pl, Los Angeles' },
              { key: 'cuisine', label: 'Cuisine', placeholder: 'Italian' },
              { key: 'best_for', label: 'Best for', placeholder: 'Date night, brunch, family...' },
            ].map(field => (
              <label key={field.key} style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>{field.label}{field.required ? ' *' : ''}</span>
                <input
                  type="text"
                  value={form[field.key]}
                  placeholder={field.placeholder}
                  onChange={e => updateField(field.key, e.target.value)}
                  style={{ width: '100%', borderRadius: 12, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: tp, padding: '11px 12px', fontSize: 14, outline: 'none' }}
                />
              </label>
            ))}

            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Photo</span>
              {form.restaurant_image ? (
                <button
                  onClick={openPhotoPicker}
                  type="button"
                  className="relative block w-full overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 text-left transition-all hover:shadow-lg"
                >
                  <div
                    className="h-56 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${form.restaurant_image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">
                        Photo added
                      </div>
                      <div className="mt-1 text-xs text-white/80">
                        Tap here to change the photo
                      </div>
                    </div>
                    <div className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm">
                      Change
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={openPhotoPicker}
                  type="button"
                  className="w-full py-6 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-600 bg-amber-50/60 dark:bg-stone-900/20 hover:bg-amber-50 dark:hover:bg-stone-900/30 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="w-8 h-8 text-stone-500 dark:text-stone-400" />
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
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
                capture="environment"
                onChange={handleImagePick}
                className="hidden"
              />

              {form.restaurant_image && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => updateField('restaurant_image', '')}
                    style={{ padding: '8px 10px', borderRadius: 12, border: `1px solid ${bw}`, background: 'transparent', color: ts, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Remove photo
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="max-sm:grid-cols-1">
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Price level</span>
                <select
                  value={form.price_level}
                  onChange={e => updateField('price_level', e.target.value)}
                  style={{ width: '100%', borderRadius: 12, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: tp, padding: '11px 12px', fontSize: 14, outline: 'none' }}
                >
                  <option value="">Select</option>
                  <option value="1">$</option>
                  <option value="2">$$</option>
                  <option value="3">$$$</option>
                  <option value="4">$$$$</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Rating</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  placeholder="4.8"
                  onChange={e => updateField('rating', e.target.value)}
                  style={{ width: '100%', borderRadius: 12, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: tp, padding: '11px 12px', fontSize: 14, outline: 'none' }}
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Why do you love it? *</span>
              <textarea
                value={form.review}
                onChange={e => updateField('review', e.target.value)}
                rows={4}
                placeholder="Tell people what makes it worth going..."
                style={{ width: '100%', borderRadius: 12, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: tp, padding: '11px 12px', fontSize: 14, outline: 'none', resize: 'vertical' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: `1px solid ${bw}`, background: 'transparent', color: ts, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: 'none', background: submitting ? 'rgba(20,184,166,0.45)' : '#14b8a6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer' }}
            >
              {submitting ? 'Posting…' : 'Recommend a place'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = ({ darkMode }) => (
  <div style={{ background: darkMode ? '#161f30' : '#ffffff', borderRadius: 20, border: `1px solid ${darkMode ? 'transparent' : '#e5e7eb'}`, overflow: 'hidden' }}>
    <div style={{ height: 130, background: darkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6', animation: 'pulse 1.5s ease infinite' }} />
    <div style={{ padding: 13 }}>
      {[80, 55, 40].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? 16 : 10, width: `${w}%`, borderRadius: 6, marginBottom: 8, background: darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb', animation: 'pulse 1.5s ease infinite', animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const RestaurantPage = ({
  apiKey,
  userLocation = null,
  onAddEvent,
  onSaveToSomeday,
  onRemoveFromSomeday,
  onBack,
  darkMode = false,
}) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [cuisine, setCuisine]         = useState('all');
  const [price, setPrice]             = useState('all');
  const [sortBy, setSortBy]           = useState('prominence');
  const [openOnly, setOpenOnly]       = useState(false);
  const [radius, setRadius]           = useState(10000);
  const [selected, setSelected]       = useState(null);
  const [savedIds, setSavedIds]       = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [location, setLocation]       = useState(userLocation || { lat: 34.0522, lng: -118.2437 }); // default LA
  const [locationSearch, setLocationSearch] = useState('');
  const [locationLabel, setLocationLabel]   = useState('');
  const [locSearching, setLocSearching]     = useState(false);
  const fetchedRef                    = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });
  }, []);

  const fetchRecommendedPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('restaurant_posts')
      .select('id, user_id, restaurant_name, restaurant_image, address, google_place_id, website, phone, cuisine, price_level, rating, review, best_for, vibe_tags, likes_count, comments_count, created_at')
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data && data.length > 0) {
      setRecommendedPosts(data);
    } else {
      setRecommendedPosts(MOCK_RESTAURANT_POSTS);
    }
  }, []);

  useEffect(() => {
    fetchRecommendedPosts();
  }, [fetchRecommendedPosts]);

  // ── fetch restaurants ───────────────────────────────────────────────────────
  // The /api/places proxy already paginates up to 60 results server-side.
  const fetchRestaurants = useCallback(async (loc, query = '', rad = 10000) => {
    setLoading(true);
    setError('');
    try {
      const proxyUrl = `/api/places?lat=${loc.lat}&lng=${loc.lng}&query=${encodeURIComponent(query)}&type=restaurant&radius=${rad}`;
      const KEY = apiKey || process.env.REACT_APP_GOOGLE_PLACES_KEY || '';
      const directUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${loc.lat},${loc.lng}&radius=${rad}&type=restaurant&keyword=${encodeURIComponent(query)}&key=${KEY}`;

      let data;
      try {
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('proxy unavailable');
        data = await res.json();
      } catch {
        if (KEY) {
          const res = await fetch(directUrl);
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
          phone: '',
          website: '',
          description: '',
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

  // Initial load
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          fetchRestaurants(loc, '', radius);
        },
        () => fetchRestaurants(location, '', radius),
        { timeout: 5000 }
      );
    } else {
      fetchRestaurants(userLocation || location, '', radius);
    }
  }, []);

  // Search submit
  const handleSearchSubmit = () => {
    fetchRestaurants(location, search, radius);
  };

  // Geocode a typed city/address and re-fetch
  const geocodeLocation = async (query) => {
    if (!query.trim()) return;
    setLocSearching(true);
    setError('');
    try {
      const r = await fetch(`/api/geocode?address=${encodeURIComponent(query)}`);
      const data = await r.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        const loc = { lat, lng };
        setLocation(loc);
        setLocationLabel(data.results[0].formatted_address);
        setLocationSearch('');
        fetchRestaurants(loc, search, radius);
      } else {
        setError('Location not found — try a different city or address.');
      }
    } catch {
      setError('Could not look up that location.');
    } finally {
      setLocSearching(false);
    }
  };

  // Re-trigger device geolocation
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocSearching(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setLocationLabel('');
        setLocationSearch('');
        fetchRestaurants(loc, search, radius);
        setLocSearching(false);
      },
      () => {
        setError('Could not get your location.');
        setLocSearching(false);
      },
      { timeout: 8000 }
    );
  };

  // ── filtering ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return restaurants.filter(r => {
      if (cuisine !== 'all' && r.cuisine !== cuisine) return false;
      if (price !== 'all' && String(r.priceLevel) !== price) return false;
      if (openOnly && r.isOpen === false) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating')   return b.rating - a.rating;
      if (sortBy === 'distance') return (parseFloat(a.distance) || 99) - (parseFloat(b.distance) || 99);
      return 0; // prominence = API order
    });
  }, [restaurants, cuisine, price, openOnly, sortBy]);

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

  // ── style tokens ────────────────────────────────────────────────────────────
  const handleRecommendSubmit = async (form) => {
    const payload = {
      user_id: currentUserId,
      restaurant_name: form.restaurant_name.trim(),
      restaurant_image: form.restaurant_image.trim() || null,
      address: form.address.trim() || null,
      cuisine: form.cuisine.trim() || null,
      price_level: form.price_level || null,
      rating: form.rating ? Number(form.rating) : null,
      review: form.review.trim(),
      best_for: form.best_for.trim() || null,
      likes_count: 0,
      comments_count: 0,
    };

    const { error } = await supabase.from('restaurant_posts').insert(payload);
    if (error) {
      console.error(error);
      return false;
    }

    await fetchRecommendedPosts();
    return true;
  };

  const handleSomedayFromRecommendation = useCallback((post) => {
    onSaveToSomeday?.({
      ...restaurantSomedayPayload(post),
      cuisine: post.cuisine || '',
      address: post.address || '',
      review: post.review || '',
      best_for: post.best_for || '',
      price_level: post.price_level || null,
    });
  }, [onSaveToSomeday]);

  const pageBg = darkMode ? '#0e1520' : '#faf8f3';
  const hBg    = darkMode ? 'rgba(19,28,46,0.98)' : 'rgba(255,255,255,0.98)';
  const bw     = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const tp     = darkMode ? '#f1f5f9' : '#111827';
  const ts     = darkMode ? '#6b7280' : '#9ca3af';

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: 'var(--font-sans, system-ui, sans-serif)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      {/* ── Sticky header ── */}
      <div style={{ background: hBg, borderBottom: `1px solid ${bw}`, position: 'sticky', top: 0, zIndex: 100 }}>

        {/* Title + sort */}
        <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {onBack && (
              <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: tp, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
            <div>
            <h1 style={{ fontFamily: handwritten, fontSize: 30, fontWeight: 700, color: tp, margin: 0, lineHeight: 1 }}>
              🍽️ Restaurants
            </h1>
            <p style={{ fontSize: 11, color: ts, margin: '3px 0 0' }}>
              {loading ? 'Finding restaurants near you…' : `${filtered.length} spot${filtered.length !== 1 ? 's' : ''} found`}
            </p>
            </div>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ fontSize: 12, padding: '5px 10px', borderRadius: 10, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: tp, cursor: 'pointer', outline: 'none' }}
          >
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>

        {/* Search */}
        <div style={{ margin: '0 16px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: `1px solid ${bw}`, borderRadius: 14, padding: '8px 14px' }}>
            <Search style={{ width: 14, height: 14, color: ts, flexShrink: 0, opacity: .6 }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Search cuisine, dish, or vibe…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: tp }}
            />
            {search && <button onClick={() => { setSearch(''); fetchRestaurants(location); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: ts, padding: 0 }}>✕</button>}
          </div>
          <button
            onClick={handleSearchSubmit}
            style={{ padding: '8px 16px', borderRadius: 14, border: 'none', background: '#14b8a6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Search
          </button>
        </div>

        {/* Location search */}
        <div style={{ margin: '0 16px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: `1px solid ${bw}`, borderRadius: 14, padding: '8px 14px' }}>
            <MapPin style={{ width: 14, height: 14, color: ts, flexShrink: 0, opacity: .6 }} />
            <input
              type="text"
              value={locationSearch}
              onChange={e => setLocationSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && geocodeLocation(locationSearch)}
              placeholder={locationLabel || 'Search a city or address…'}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: tp }}
            />
            {locationSearch && (
              <button onClick={() => setLocationSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: ts, padding: 0 }}>✕</button>
            )}
          </div>
          <button
            onClick={useMyLocation}
            disabled={locSearching}
            style={{ padding: '8px 14px', borderRadius: 14, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: locSearching ? ts : tp, fontSize: 13, fontWeight: 500, cursor: locSearching ? 'default' : 'pointer', whiteSpace: 'nowrap', opacity: locSearching ? .6 : 1 }}
          >
            {locSearching ? '…' : '📍 Me'}
          </button>
        </div>

        {/* Cuisine chips */}
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CUISINE_FILTERS.map(c => (
            <button
              key={c.id}
              onClick={() => setCuisine(c.id === cuisine ? 'all' : c.id)}
              style={{ flexShrink: 0, padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', background: cuisine === c.id ? (darkMode ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.12)') : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'), color: cuisine === c.id ? (darkMode ? '#c4b5fd' : '#7c3aed') : ts, border: cuisine === c.id ? `1px solid ${darkMode ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.3)'}` : `1px solid ${bw}` }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Sub-filters row */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {/* Price */}
          {PRICE_FILTERS.map(p => (
            <button
              key={p.id}
              onClick={() => setPrice(p.id === price ? 'all' : p.id)}
              style={{ flexShrink: 0, padding: '4px 11px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', background: price === p.id ? (darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb') : 'transparent', color: price === p.id ? tp : ts, border: `1px solid ${price === p.id ? (darkMode ? 'rgba(255,255,255,0.15)' : '#d1d5db') : bw}` }}
            >
              {p.label}
            </button>
          ))}

          {/* Open now toggle */}
          <button
            onClick={() => setOpenOnly(o => !o)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: openOnly ? (darkMode ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.1)') : 'transparent', color: openOnly ? (darkMode ? '#2dd4bf' : '#0f766e') : ts, border: `1px solid ${openOnly ? '#14b8a6' : bw}`, transition: 'all .15s' }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: openOnly ? '#1D9E75' : ts }} />
            Open now
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 16, background: bw, flexShrink: 0, marginLeft: 2 }} />

          {/* Radius */}
          {RADIUS_OPTIONS.map(r => (
            <button
              key={r.id}
              onClick={() => { setRadius(r.id); fetchRestaurants(location, search, r.id); }}
              style={{ flexShrink: 0, padding: '4px 11px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', background: radius === r.id ? (darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') : 'transparent', color: radius === r.id ? (darkMode ? '#a5b4fc' : '#4f46e5') : ts, border: `1px solid ${radius === r.id ? (darkMode ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)') : bw}` }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ margin: '0 16px 10px', padding: '8px 14px', background: darkMode ? 'rgba(251,191,36,0.08)' : '#fffbeb', borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(251,191,36,0.2)' : '#fde68a'}`, fontSize: 12, color: darkMode ? '#fbbf24' : '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flexShrink: 0 }}>ℹ️</span>{error}
          </div>
        )}

        {/* ── Featured recommendation ── */}
        {recommendedPosts.length > 0 && (
          <div style={{ padding: '0 16px 14px' }}>
            <FeaturedRestaurantRecommendation
              post={recommendedPosts[0]}
              onSomeday={handleSomedayFromRecommendation}
              onRemoveFromSomeday={onRemoveFromSomeday}
              darkMode={darkMode}
            />
          </div>
        )}

      </div>

      {/* ── Grid ── */}
      <div style={{ padding: '14px 14px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} darkMode={darkMode} />)
          : filtered.length === 0
            ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
                <p style={{ fontFamily: handwritten, fontSize: 22, color: ts, fontStyle: 'italic', margin: '0 0 16px' }}>No restaurants match your filters</p>
                <button
                  onClick={() => { setCuisine('all'); setPrice('all'); setOpenOnly(false); }}
                  style={{ padding: '9px 22px', borderRadius: 14, border: 'none', background: '#14b8a6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear filters
                </button>
              </div>
            )
            : (() => {
              const topRestaurants = filtered.slice(0, 4);
              const remainingRestaurants = filtered.slice(4);
              return (
                <>
                  {topRestaurants.map((r, i) => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      onTap={setSelected}
                      savedIds={savedIds}
                      darkMode={darkMode}
                      stagger={i}
                    />
                  ))}

                  {filtered.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', margin: '2px 0 2px' }}>
                      <div style={{ background: darkMode ? 'rgba(245,158,11,0.08)' : 'linear-gradient(135deg, rgba(255,247,237,0.96), rgba(255,237,213,0.88))', border: `1px solid ${darkMode ? 'rgba(245,158,11,0.18)' : '#fdba74'}`, borderRadius: 24, padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center' }}>
                        <span style={{ fontSize: 32, flexShrink: 0 }}>✨</span>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ fontFamily: handwritten, fontSize: 24, fontWeight: 700, lineHeight: 1.1, margin: 0, color: tp, textAlign: 'center' }}>
                            Found a great spot?
                          </h3>
                        </div>
                        <button
                          onClick={() => setIsRecommendOpen(true)}
                          style={{ background: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 16, padding: '11px 16px', fontSize: 14, color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Recommend a place →
                        </button>
                      </div>
                    </div>
                  )}

                  {remainingRestaurants.map((r, i) => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      onTap={setSelected}
                      savedIds={savedIds}
                      darkMode={darkMode}
                      stagger={i + topRestaurants.length}
                    />
                  ))}
                </>
              );
            })()
        }
      </div>

      {/* ── Community recommendations feed ── */}
      <div style={{ padding: '0 14px 100px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ts, margin: '4px 2px 10px' }}>
          What people are recommending
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recommendedPosts.map((post) => (
            <RestaurantRecommendationCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onSomeday={handleSomedayFromRecommendation}
              darkMode={darkMode}
            />
          ))}
        </div>
      </div>

      {/* ── Detail sheet ── */}
      {selected && (
        <RestaurantDetailSheet
          restaurant={selected}
          onAddEvent={onAddEvent}
          onSaveToSomeday={handleSaveToSomeday}
          onClose={() => setSelected(null)}
          savedIds={savedIds}
          darkMode={darkMode}
        />
      )}

      {/* ── Recommendation modal ── */}
      {isRecommendOpen && (
        <PostRestaurantModal
          onClose={() => setIsRecommendOpen(false)}
          onSubmit={handleRecommendSubmit}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// ─── helper: infer cuisine from Google Places types ───────────────────────────
function inferCuisine(types = [], name = '') {
  const t = types.join(' ').toLowerCase();
  const n = name.toLowerCase();
  if (t.includes('japanese') || n.match(/sushi|ramen|izakaya|japanese/)) return 'japanese';
  if (t.includes('italian') || n.match(/italian|pizza|pasta|trattoria/)) return 'italian';
  if (t.includes('mexican') || n.match(/mexican|taco|burrito|cantina/)) return 'mexican';
  if (t.includes('chinese') || n.match(/chinese|dim sum|wok|peking/)) return 'chinese';
  if (t.includes('thai') || n.match(/thai/)) return 'thai';
  if (t.includes('indian') || n.match(/indian|curry|tandoor|masala/)) return 'indian';
  if (t.includes('korean') || n.match(/korean|bbq|bibimbap/)) return 'korean';
  if (t.includes('french') || n.match(/french|bistro|brasserie|café/)) return 'french';
  if (t.includes('seafood') || n.match(/seafood|fish|oyster|lobster|crab/)) return 'seafood';
  if (t.includes('mediterranean') || n.match(/mediterranean|greek|lebanese|falafel|hummus/)) return 'mediterranean';
  if (t.includes('american') || t.includes('burger') || n.match(/burger|bbq|grill|diner/)) return 'american';
  return 'american';
}

const MOCK_RESTAURANT_POSTS = [
  {
    id: 'rp-1',
    user_id: null,
    restaurant_name: 'Bestia',
    restaurant_image: '',
    address: '2121 E 7th Pl, Los Angeles, CA',
    cuisine: 'Italian',
    price_level: '3',
    rating: 4.8,
    review: 'The pastas are the move, but the whole room feels like the perfect night-out spot. Always my first answer for a dinner recommendation.',
    best_for: 'Date night',
    likes_count: 18,
    comments_count: 4,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'rp-2',
    user_id: null,
    restaurant_name: 'Mariscos Jalisco',
    restaurant_image: '',
    address: '3040 E Olympic Blvd, Los Angeles, CA',
    cuisine: 'Mexican',
    price_level: '1',
    rating: 4.9,
    review: 'If someone wants something fast, fun, and unforgettable, this is the answer. The shrimp tacos are always worth the detour.',
    best_for: 'Casual lunch',
    likes_count: 25,
    comments_count: 8,
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: 'rp-3',
    user_id: null,
    restaurant_name: 'République',
    restaurant_image: '',
    address: '624 S La Brea Ave, Los Angeles, CA',
    cuisine: 'French',
    price_level: '3',
    rating: 4.7,
    review: 'The brunch energy is fantastic, but it also works beautifully for a long lingering dinner. Feels special every time.',
    best_for: 'Brunch',
    likes_count: 14,
    comments_count: 3,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

export default RestaurantPage;
