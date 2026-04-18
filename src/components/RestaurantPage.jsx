/**
 * RestaurantPage.jsx — Aspirational edition
 *
 * Same API wiring, Supabase logic, and detail sheet as before.
 * UI shifted from Yelp-style search/filter → occasion-based discovery.
 *
 * NEW: Vercel /api/places.js needs a textsearch action:
 *   if (action === 'textsearch') {
 *     const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(req.query.query)}&type=restaurant&key=${process.env.GOOGLE_PLACES_KEY}`;
 *     const r = await fetch(url); return res.json(await r.json());
 *   }
 *
 * Props:
 *   apiKey          – string   your Google Places API key
 *   userLocation    – { lat, lng } | null
 *   onAddEvent      – (eventData) => void
 *   onSaveToSomeday – (restaurant) => void
 *   onRemoveFromSomeday – (payload) => void
 *   onBack          – () => void
 *   darkMode        – boolean
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, Phone, ExternalLink, Plus, Search, X, Camera } from 'lucide-react';
import { supabase } from '../supabaseClient';

// ─── constants ────────────────────────────────────────────────────────────────
const handwritten = '"Caveat", cursive';

// Occasion-based browsing replaces cuisine/price/radius filters
const OCCASIONS = [
  { id: 'bucket_list', label: 'Bucket list',      emoji: '📋', query: 'bucket list restaurants' },
  { id: 'date_night',  label: 'Date night',       emoji: '🕯️', query: 'date night restaurants' },
  { id: 'most_added',  label: 'Most added',       emoji: '🔥', query: '' },
  { id: 'worth_trip',  label: 'Worth the trip',   emoji: '🗺️', query: 'destination restaurants worth the trip' },
  { id: 'hidden_gem',  label: 'Hidden gem',       emoji: '💎', query: 'hidden gem restaurants' },
  { id: 'food_challenge', label: 'Food challenge', emoji: '🔥', query: 'restaurant food challenges' },
  { id: 'all',         label: 'Nearby',           emoji: '✨', query: '' },
];

// Edit these names to curate the Bucket list chip.
const CURATED_RESTAURANT_SEARCHES = {
  bucket_list: [
    { name: 'Maido', locationHint: 'Lima Peru', note: 'A world-stage Nikkei tasting menu and the kind of trip-defining dinner people plan around.' },
    { name: 'Asador Etxebarri', locationHint: 'Atxondo Spain', note: 'Smoke, fire, and Basque countryside magic. A true pilgrimage restaurant.' },
    { name: 'Quintonil', locationHint: 'Mexico City Mexico', note: 'Modern Mexican cooking with a sense of place, celebration, and occasion.' },
    { name: 'Alchemist', locationHint: 'Copenhagen Denmark', note: 'Immersive, theatrical, and wildly ambitious. Dinner as a full-on experience.' },
    { name: 'Gaggan', locationHint: 'Bangkok Thailand', note: 'Playful, high-energy, and unforgettable. A bucket-list night with personality.' },
    { name: 'Sezanne', locationHint: 'Tokyo Japan', note: 'Elegant French technique in Tokyo, polished enough to anchor a dream itinerary.' },
    { name: 'Atomix', locationHint: 'New York NY', note: 'A deeply personal Korean tasting menu that feels intimate, precise, and memorable.' },
    { name: 'The French Laundry', locationHint: 'Yountville CA', note: 'A classic American bucket-list dinner in Napa Valley.' },
    { name: 'SingleThread', locationHint: 'Healdsburg CA', note: 'A full evening built around seasonality, place, and celebration.' },
    { name: 'Smyth', locationHint: 'Chicago IL', note: 'A luxurious Chicago tasting menu with enough craft and warmth to justify the trip.' },
  ],
  date_night: [
    { name: 'One if by Land, Two if by Sea', locationHint: 'New York NY', note: 'Candlelit, historic, and unapologetically romantic. The classic date-night fantasy.' },
    { name: 'The River Cafe', locationHint: 'Brooklyn NY', note: 'Skyline views, flowers, and old-school polish. Save this for a night that needs a little magic.' },
    { name: 'Restaurant Gary Danko', locationHint: 'San Francisco CA', note: 'Intimate, polished, and quietly theatrical. Perfect when you want the whole evening to feel cared for.' },
    { name: 'Canlis', locationHint: 'Seattle WA', note: 'Mountain views, tableside grace, and occasion-level service without losing warmth.' },
    { name: "Bern's Steak House", locationHint: 'Tampa FL', note: 'A legendary steakhouse with a dessert room made for lingering after dinner.' },
    { name: "Commander’s Palace", locationHint: 'New Orleans LA', note: 'A joyful, dressed-up New Orleans classic with the kind of energy that makes dinner feel like an event.' },
    { name: 'Canoe', locationHint: 'Atlanta GA', note: 'Riverside, graceful, and easy to love. A softer special-night pick with real atmosphere.' },
    { name: 'Tidepools', locationHint: 'Poipu Kauai HI', note: 'Thatched bungalows, koi lagoons, waterfalls, and vacation-date-night energy.' },
    { name: 'The Olde Pink House', locationHint: 'Savannah GA', note: 'Historic, charming, and a little dreamy. A date night that feels like stepping into a story.' },
    { name: "Dakota's Steakhouse", locationHint: 'Dallas TX', note: 'A dramatic underground steakhouse with a courtyard that feels made for a slow dinner.' },
  ],
  food_challenge: [
    { name: 'The Big Texan Steak Ranch', locationHint: 'Amarillo TX', note: 'Home of the legendary 72-ounce steak dinner challenge. Pure roadside Americana.' },
    { name: "Denny's Beer Barrel Pub", locationHint: 'Clearfield PA', note: 'A burger-challenge institution known for truly gigantic burgers and advance-notice attempts.' },
    { name: 'San Francisco Creamery Co.', locationHint: 'Walnut Creek CA', note: 'The Kitchen Sink ice cream challenge is messy, sweet, ridiculous, and perfect for a dare.' },
    { name: "Humpy's Great Alaskan Alehouse", locationHint: 'Anchorage AK', note: 'The Kodiak Arrest challenge turns Alaskan seafood into a full-blown eating spectacle.' },
    { name: 'Smoke Eaters', locationHint: 'San Jose CA', note: 'The Hellfire wing challenge is more pain cave than dinner reservation.' },
    { name: "Munchies 420 Cafe", locationHint: 'Sarasota FL', note: 'The Fire in Your Hole wing challenge is infamous for heat, waiver energy, and bad decisions.' },
    { name: 'Nitally’s ThaiMex Cuisine', locationHint: 'St. Petersburg FL', note: 'Inferno Soup combines volume and serious spice into one chaotic bowl.' },
    { name: 'Stadium Grill', locationHint: 'Columbia MO', note: 'The Hail Mary burger challenge is an over-the-top tower of beef, fries, and spectacle.' },
    { name: "Crown Candy Kitchen", locationHint: 'St. Louis MO', note: 'The malt challenge is old-school, nostalgic, and deceptively brutal.' },
    { name: 'Beth’s Cafe', locationHint: 'Seattle WA', note: 'Known for massive omelets and diner-sized ambition. A novelty-food classic.' },
  ],
};

// Kept internally for API calls — not shown as UI filters
const CUISINE_FILTERS = [
  { id: 'all',            label: 'All'           },
  { id: 'italian',        label: 'Italian'       },
  { id: 'japanese',       label: 'Japanese'      },
  { id: 'mexican',        label: 'Mexican'       },
  { id: 'american',       label: 'American'      },
  { id: 'chinese',        label: 'Chinese'       },
  { id: 'thai',           label: 'Thai'          },
  { id: 'indian',         label: 'Indian'        },
  { id: 'mediterranean',  label: 'Mediterranean' },
  { id: 'korean',         label: 'Korean'        },
  { id: 'french',         label: 'French'        },
  { id: 'seafood',        label: 'Seafood'       },
];

const normalizeCuisineId = (value = '') => {
  const v = value.trim().toLowerCase();
  if (!v) return '';
  const match = CUISINE_FILTERS.find(c => c.id === v || c.label.toLowerCase() === v);
  return match?.id || '';
};

// ─── fallback data ────────────────────────────────────────────────────────────
const FALLBACK_RESTAURANTS = [
  { id: 'f1',  name: 'Nobu Los Angeles',       cuisine: 'japanese',     rating: 4.6, priceLevel: 4, address: '903 N La Cienega Blvd, West Hollywood', photo: '', phone: '(310) 657-5711', website: 'https://noburestaurants.com', description: 'The kind of place you dress up for. World-famous black cod miso in a room full of people having a great night.' },
  { id: 'f2',  name: 'Bestia',                 cuisine: 'italian',      rating: 4.7, priceLevel: 3, address: '2121 E 7th Pl, Los Angeles',            photo: '', phone: '(213) 514-5724', website: 'https://bestiala.com',         description: 'House-made pastas and whole-animal roasts. The kind of dinner that becomes a story you tell.' },
  { id: 'f3',  name: 'Mariscos Jalisco',        cuisine: 'mexican',      rating: 4.8, priceLevel: 1, address: '3040 E Olympic Blvd, Los Angeles',      photo: '', phone: '(323) 528-6701', website: '',                             description: 'Legendary shrimp tacos that have earned a cult following. Worth any detour.' },
  { id: 'f4',  name: 'Providence',              cuisine: 'seafood',      rating: 4.8, priceLevel: 4, address: '5955 Melrose Ave, Los Angeles',          photo: '', phone: '(323) 460-4170', website: 'https://providencela.com',     description: 'Two Michelin stars. The tasting menu takes three hours and feels like twenty minutes.' },
  { id: 'f5',  name: 'Jitlada',                 cuisine: 'thai',         rating: 4.5, priceLevel: 2, address: '5233 W Sunset Blvd, Los Angeles',        photo: '', phone: '(323) 667-9809', website: '',                             description: 'The most authentic Southern Thai in the city. Regulars swear by the crab curry.' },
  { id: 'f6',  name: 'République',              cuisine: 'french',       rating: 4.6, priceLevel: 3, address: '624 S La Brea Ave, Los Angeles',         photo: '', phone: '(310) 362-6115', website: 'https://republiquela.com',     description: 'A grand Parisian brasserie in a stunning Charlie Chaplin-era building. Brunch is legendary.' },
  { id: 'f7',  name: 'Kogi BBQ',                cuisine: 'korean',       rating: 4.7, priceLevel: 1, address: 'Multiple LA locations',                  photo: '', phone: '',              website: 'https://kogibbq.com',          description: 'The Korean BBQ taco truck that started the food truck revolution. Still worth chasing.' },
  { id: 'f8',  name: 'Majordomo',               cuisine: 'american',     rating: 4.5, priceLevel: 3, address: '1725 Naud St, Los Angeles',              photo: '', phone: '(323) 545-4880', website: 'https://majordomo.la',         description: "David Chang's LA flagship. Order the large-format pork shoulder and make a night of it." },
  { id: 'f9',  name: 'Shin Beijing',            cuisine: 'chinese',      rating: 4.4, priceLevel: 2, address: '500 W Main St, Alhambra',                photo: '', phone: '(626) 281-0088', website: '',                             description: 'Best Peking duck outside of Beijing. Book the private room for the full ceremonial experience.' },
  { id: 'f10', name: "Howlin' Ray's",           cuisine: 'american',     rating: 4.6, priceLevel: 2, address: '727 N Broadway #128, Los Angeles',       photo: '', phone: '(323) 488-5905', website: 'https://howlinrays.com',       description: "Nashville hot chicken that'll make your eyes water. The line is always worth it." },
  { id: 'f11', name: 'Spago Beverly Hills',     cuisine: 'american',     rating: 4.5, priceLevel: 4, address: '176 N Canon Dr, Beverly Hills',          photo: '', phone: '(310) 385-0880', website: 'https://wolfgangpuck.com',     description: "Wolfgang Puck's iconic flagship. The smoked salmon pizza started a revolution in 1982." },
  { id: 'f12', name: 'Sushi Park',              cuisine: 'japanese',     rating: 4.8, priceLevel: 4, address: '8539 W Sunset Blvd #1, Los Angeles',    photo: '', phone: '(310) 652-0523', website: '',                             description: 'Omakase-only hideaway above the Sunset Strip. Reserve months in advance. Worth every penny.' },
  { id: 'f13', name: 'Guisados',                cuisine: 'mexican',      rating: 4.7, priceLevel: 1, address: '1261 W Sunset Blvd, Los Angeles',        photo: '', phone: '(213) 908-4851', website: 'https://guisados.co',          description: 'Braised taco specialists. Get the sampler of six — you cannot go wrong with any of them.' },
  { id: 'f14', name: 'République Brunch',       cuisine: 'french',       rating: 4.6, priceLevel: 3, address: '624 S La Brea Ave, Los Angeles',         photo: '', phone: '(310) 362-6115', website: 'https://republiquela.com',     description: 'Saturday brunch here feels like being in Paris. One of those mornings you remember.' },
  { id: 'f15', name: 'Dosa by Dosa',            cuisine: 'indian',       rating: 4.6, priceLevel: 2, address: '1011 S Fairfax Ave, Los Angeles',        photo: '', phone: '(323) 938-3672', website: '',                             description: 'South Indian dosas so crispy and perfectly spiced they have earned a cult following.' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const CUISINE_EMOJI = {
  japanese: '🍣', italian: '🍝', mexican: '🌮', american: '🍔',
  chinese: '🥡', thai: '🍛', indian: '🫕', mediterranean: '🫒',
  korean: '🥩', french: '🥐', seafood: '🦞', default: '🍽️',
};
const getCuisineEmoji = (cuisine) => CUISINE_EMOJI[cuisine?.toLowerCase()] || CUISINE_EMOJI.default;
const priceStr = (level) => level ? '$'.repeat(level) : '';
const truncateText = (text, max = 120) => {
  if (!text) return '';
  const clean = String(text).trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
};
const restaurantAddKey = (restaurant = {}) => (
  restaurant.googlePlaceId
  || restaurant.google_place_id
  || restaurant.id
  || `${restaurant.name || restaurant.restaurant_name || ''}-${restaurant.address || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
);
const restaurantSomedayPayload = (post) => ({
  title: post.restaurant_name,
  imageUrl: post.restaurant_image || '',
  emoji: '🍽️',
  type: 'restaurants',
  notes: [post.review, post.address, post.best_for, post.cuisine]
    .filter(Boolean).join(' · '),
});

// ─── Swipe-down sheet hook ────────────────────────────────────────────────────
function useSwipeDownSheet(onClose) {
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(null);
  const dragDistanceRef = useRef(0);

  const handleStart = (clientY) => { dragStartYRef.current = clientY; dragDistanceRef.current = 0; setDragY(0); };
  const handleMove  = (clientY) => {
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
    sheetStyle: { transform: `translateY(${dragY}px)`, transition: dragStartYRef.current ? 'none' : 'transform 180ms ease' },
    handleProps: {
      onTouchStart: (e) => handleStart(e.touches[0].clientY),
      onTouchMove:  (e) => handleMove(e.touches[0].clientY),
      onTouchEnd: handleEnd,
      onMouseDown: (e) => handleStart(e.clientY),
      onMouseMove: (e) => { if (dragStartYRef.current == null) return; handleMove(e.clientY); },
      onMouseUp: handleEnd,
      onMouseLeave: () => { if (dragStartYRef.current != null) handleEnd(); },
      style: { touchAction: 'none', cursor: 'grab' },
    },
  };
}

// ─── Restaurant Detail Sheet ──────────────────────────────────────────────────
const RestaurantDetailSheet = ({ restaurant, onAddEvent, onSaveToSomeday, onClose, savedIds, darkMode }) => {
  const [saved, setSaved] = useState(savedIds.has(restaurant.id));
  const pbg = darkMode ? '#131c2e' : '#fff';
  const tp  = darkMode ? '#f1f5f9' : '#111827';
  const ts  = darkMode ? '#6b7280' : '#9ca3af';
  const bw  = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);

  const photoBg = darkMode
    ? 'linear-gradient(135deg, rgba(201,161,93,0.10), rgba(201,161,93,0.04))'
    : 'linear-gradient(135deg, #fff7eb, #fff1e6)';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 480, background: pbg, borderRadius: '24px 24px 0 0', maxHeight: '88vh', overflowY: 'auto', borderTop: `1px solid ${bw}`, paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', ...sheetStyle }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div {...handleProps} style={{ width: 36, height: 4, background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: 3, margin: '12px auto 0', ...handleProps.style }} />

        {/* Photo hero */}
        <div style={{ width: '100%', height: 220, background: photoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, position: 'relative', overflow: 'hidden' }}>
          {restaurant.photo
            ? <img src={restaurant.photo} alt={restaurant.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
            : getCuisineEmoji(restaurant.cuisine)
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)' }} />
        </div>

        <div style={{ padding: '20px 22px 36px' }}>
          {/* Title */}
          <h2 style={{ fontFamily: handwritten, fontSize: 30, fontWeight: 700, color: tp, margin: '0 0 6px', lineHeight: 1.1 }}>
            {getCuisineEmoji(restaurant.cuisine)} {restaurant.name}
          </h2>

          {/* Evocative description — the hero detail */}
          {restaurant.description && (
            <p style={{ fontSize: 14, color: ts, lineHeight: 1.7, margin: '0 0 14px', fontStyle: 'italic' }}>
              {restaurant.description}
            </p>
          )}

          {restaurant.rating > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: 8, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: ts, fontSize: 12, fontWeight: 600, border: `1px solid ${bw}` }}>
                {'★'.repeat(Math.round(restaurant.rating))} {restaurant.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Contact info — compact */}
          {(restaurant.address || restaurant.phone || restaurant.website) && (
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius: 14, padding: '12px 14px', marginBottom: 18, border: `1px solid ${bw}` }}>
              {restaurant.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: restaurant.phone || restaurant.website ? 10 : 0, marginBottom: restaurant.phone || restaurant.website ? 10 : 0, borderBottom: restaurant.phone || restaurant.website ? `0.5px solid ${bw}` : 'none' }}>
                  <MapPin style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: tp, lineHeight: 1.4 }}>{restaurant.address}</span>
                </div>
              )}
              {restaurant.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: restaurant.website ? 10 : 0, marginBottom: restaurant.website ? 10 : 0, borderBottom: restaurant.website ? `0.5px solid ${bw}` : 'none' }}>
                  <Phone style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0 }} />
                  <a href={`tel:${restaurant.phone}`} style={{ fontSize: 13, color: darkMode ? '#818cf8' : '#4f46e5', textDecoration: 'none' }}>{restaurant.phone}</a>
                </div>
              )}
              {restaurant.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ExternalLink style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0 }} />
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: darkMode ? '#818cf8' : '#4f46e5', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {restaurant.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Google Maps link */}
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + ' ' + (restaurant.address || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: darkMode ? '#818cf8' : '#4f46e5', textDecoration: 'none', marginBottom: 18 }}
          >
            <MapPin style={{ width: 13, height: 13 }} />
            Open in Google Maps
          </a>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                onAddEvent?.({
                  title: `🍽️ Dinner at ${restaurant.name}`,
                  notes: `${restaurant.address || ''} · ${restaurant.cuisine}`,
                  category: 'hangout',
                  location: restaurant.address || restaurant.name,
                });
                onClose();
              }}
              style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: `1px solid ${darkMode ? 'rgba(168,85,247,0.25)' : '#d8b4fe'}`, background: darkMode ? 'rgba(168,85,247,0.12)' : '#f5f3ff', color: darkMode ? '#c4b5fd' : '#6d28d9', fontFamily: handwritten, fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              + Plan a date
            </button>
            <button
              onClick={() => {
                if (!saved) { setSaved(true); onSaveToSomeday?.(restaurant); }
              }}
              style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: saved ? '#0d9488' : '#2dd4bf', color: saved ? '#fff' : '#111827', fontFamily: handwritten, fontSize: 18, fontWeight: 700, cursor: saved ? 'default' : 'pointer', transition: 'all .2s' }}
            >
              {saved ? '✓ Someday' : '+ Someday'}
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
  const tp  = darkMode ? '#f1f5f9' : '#111827';
  const ts  = darkMode ? '#6b7280' : '#9ca3af';
  const bw  = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const saved = savedIds.has(restaurant.id);
  const photoBg = darkMode ? 'rgba(201,161,93,0.08)' : '#fff7eb';

  return (
    <div
      onClick={() => onTap(restaurant)}
      style={{
        background: bg, borderRadius: 20, border: `1px solid ${bw}`,
        overflow: 'hidden', cursor: 'pointer',
        animation: 'fadeUp .35s ease both',
        animationDelay: `${stagger * 0.055}s`,
        transition: 'transform .18s, box-shadow .18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = darkMode ? '0 10px 28px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Photo */}
      <div style={{ width: '100%', height: 140, background: photoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, position: 'relative', overflow: 'hidden' }}>
        {restaurant.photo
          ? <img src={restaurant.photo} alt={restaurant.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : getCuisineEmoji(restaurant.cuisine)
        }
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)' }} />
        {saved && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: '#0d9488', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>
            ✓ Someday
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 13px 14px' }}>
        <div style={{ fontFamily: handwritten, fontSize: 18, fontWeight: 700, color: tp, lineHeight: 1.2, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {restaurant.name}
        </div>

        {/* Evocative one-liner instead of address/distance */}
        {restaurant.description && (
          <p style={{ fontSize: 12, color: ts, lineHeight: 1.5, margin: '0 0 10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontStyle: 'italic' }}>
            {truncateText(restaurant.description, 80)}
          </p>
        )}

        {restaurant.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, color: ts, fontFamily: handwritten, fontWeight: 600 }}>
              ★ {restaurant.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ darkMode }) => (
  <div style={{ background: darkMode ? '#161f30' : '#ffffff', borderRadius: 20, border: `1px solid ${darkMode ? 'transparent' : '#e5e7eb'}`, overflow: 'hidden' }}>
    <div style={{ height: 140, background: darkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6', animation: 'pulse 1.5s ease infinite' }} />
    <div style={{ padding: 13 }}>
      {[80, 55, 40].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? 16 : 10, width: `${w}%`, borderRadius: 6, marginBottom: 8, background: darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb', animation: 'pulse 1.5s ease infinite', animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  </div>
);

// ─── Featured community recommendation ───────────────────────────────────────
const FeaturedRestaurantRecommendation = React.memo(({ post, photoUrl, currentUserId, onSomeday, onRemoveFromSomeday, onDelete, darkMode }) => {
  const bg = darkMode ? '#161f30' : '#ffffff';
  const bw = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const tp = darkMode ? '#f1f5f9' : '#111827';
  const ts = darkMode ? '#6b7280' : '#9ca3af';
  const [saved, setSaved] = useState(false);
  const isMine = Boolean(currentUserId && post?.user_id && String(currentUserId) === String(post.user_id));

  useEffect(() => { setSaved(false); }, [post?.id]);

  return (
    <div style={{ background: bg, borderRadius: 24, border: `1px solid ${bw}`, overflow: 'hidden', position: 'relative' }}>
      {isMine && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(post)}
          aria-label="Delete recommendation"
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 28, height: 28, borderRadius: 999, border: `1px solid ${darkMode ? 'rgba(251,191,36,0.35)' : '#d8b36a'}`, background: darkMode ? 'rgba(17,24,39,0.85)' : 'rgba(255,248,234,0.95)', color: darkMode ? '#fbbf24' : '#8a5a1f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 700 }}>×</span>
        </button>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr' }} className="max-sm:block">
        <div style={{ minHeight: 220, background: darkMode ? 'rgba(201,161,93,0.08)' : '#fff7eb', position: 'relative' }}>
          {(photoUrl || post.restaurant_image) ? (
            <img src={photoUrl || post.restaurant_image} alt={post.restaurant_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🍽️</div>
          )}
          <div style={{ position: 'absolute', top: 12, left: 12, padding: '5px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
            Most loved this week
          </div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: darkMode ? '#f5c842' : '#92621a' }}>
            From your community
          </p>
          <h2 style={{ fontFamily: handwritten, fontSize: 28, fontWeight: 700, lineHeight: 1.05, margin: 0, color: tp }}>
            {post.restaurant_name}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {post.best_for && (
              <span style={{ padding: '4px 9px', borderRadius: 8, background: darkMode ? 'rgba(201,161,93,0.15)' : 'rgba(201,161,93,0.12)', color: darkMode ? '#f5c842' : '#92621a', fontSize: 11, fontWeight: 600 }}>
                {post.best_for}
              </span>
            )}
            <span style={{ padding: '4px 9px', borderRadius: 8, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: ts, fontSize: 11, fontWeight: 600 }}>
              {post.likes_count ?? 0} saves
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
              if (saved) { onRemoveFromSomeday?.(payload); setSaved(false); return; }
              setSaved(true);
              onSomeday?.(post);
            }}
            style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(45,212,191,0.22)' : '#99f6e4'}`, background: saved ? '#0d9488' : (darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfa'), color: saved ? '#fff' : (darkMode ? '#5eead4' : '#0f766e'), fontSize: 15, fontWeight: 700, fontFamily: handwritten, cursor: 'pointer' }}
          >
            {saved ? '✓ Someday' : '+ Someday'}
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Community recommendation card ───────────────────────────────────────────
const RestaurantRecommendationCard = React.memo(({ post, photoUrl, currentUserId, onSomeday, onVote, onDelete, darkMode }) => {
  const bg = darkMode ? '#161f30' : '#ffffff';
  const bw = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const tp = darkMode ? '#f1f5f9' : '#111827';
  const ts = darkMode ? '#6b7280' : '#9ca3af';
  const [likes, setLikes] = useState(post.likes_count ?? 0);
  const [saved, setSaved] = useState(false);
  const isMine = Boolean(currentUserId && post.user_id && currentUserId === post.user_id);

  useEffect(() => { setLikes(post.likes_count ?? 0); }, [post.id, post.likes_count]);

  return (
    <div style={{ background: bg, borderRadius: 20, border: `1px solid ${bw}`, overflow: 'hidden', position: 'relative' }}>
      {isMine && onDelete && (
        <button type="button" onClick={() => onDelete(post)} aria-label="Delete recommendation" style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 26, height: 26, borderRadius: 999, border: `1px solid ${darkMode ? 'rgba(251,191,36,0.35)' : '#d8b36a'}`, background: darkMode ? 'rgba(17,24,39,0.85)' : 'rgba(255,248,234,0.95)', color: darkMode ? '#fbbf24' : '#8a5a1f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 700 }}>×</span>
        </button>
      )}
      {(photoUrl || post.restaurant_image) ? (
        <img src={photoUrl || post.restaurant_image} alt={post.restaurant_name} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <div style={{ width: '100%', height: 120, background: darkMode ? 'rgba(201,161,93,0.08)' : '#fff7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>🍽️</div>
      )}
      <div style={{ padding: 14 }}>
        <h3 style={{ fontFamily: handwritten, fontSize: 22, fontWeight: 700, lineHeight: 1.1, margin: '0 0 6px', color: tp }}>{post.restaurant_name}</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {post.best_for && (
            <span style={{ padding: '3px 8px', borderRadius: 8, background: darkMode ? 'rgba(201,161,93,0.15)' : 'rgba(201,161,93,0.12)', color: darkMode ? '#f5c842' : '#92621a', fontSize: 11, fontWeight: 600 }}>{post.best_for}</span>
          )}
        </div>
        {post.review && (
          <p style={{ margin: '0 0 10px', fontSize: 13, color: ts, lineHeight: 1.6, fontStyle: 'italic' }}>"{truncateText(post.review, 130)}"</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: ts }}>❤️ {likes} saves</span>
          <button
            onClick={() => { if (saved) return; setSaved(true); onSomeday?.(post); }}
            style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(45,212,191,0.22)' : '#99f6e4'}`, background: saved ? '#0d9488' : (darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfa'), color: saved ? '#fff' : (darkMode ? '#5eead4' : '#0f766e'), fontSize: 14, fontWeight: 700, fontFamily: handwritten, cursor: saved ? 'default' : 'pointer' }}
          >
            {saved ? '✓ Someday' : '+ Someday'}
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Post Restaurant Modal ────────────────────────────────────────────────────
const PostRestaurantModal = ({ onClose, onSubmit, darkMode, apiKey }) => {
  const pbg = darkMode ? '#131c2e' : '#fff';
  const tp  = darkMode ? '#f1f5f9' : '#111827';
  const ts  = darkMode ? '#6b7280' : '#9ca3af';
  const bw  = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const photoInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSuggesting, setAddressSuggesting] = useState(false);
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  const [form, setForm] = useState({ restaurant_name: '', restaurant_image: '', address: '', cuisine: '', price_level: '', rating: '', review: '', best_for: '' });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const bestForChips = [
    'Date night', 'Celebration', 'Worth the trip', 'Hidden gem', 'Special occasion', 'Bucket list', 'Brunch', 'Group dinner',
  ];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const query = form.address.trim();
    if (query.length < 2) { setAddressSuggestions([]); setAddressSuggesting(false); return; }
    let active = true;
    setAddressSuggesting(true);
    const timer = window.setTimeout(async () => {
      try {
        const key = apiKey || process.env.REACT_APP_GOOGLE_PLACES_KEY || '';
        let data;
        try {
          const res = await fetch(`/api/places?action=autocomplete&input=${encodeURIComponent(query)}`);
          if (!res.ok) throw new Error('proxy_unavailable');
          data = await res.json();
        } catch {
          if (!key) throw new Error('proxy_unavailable');
          const direct = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${key}`);
          data = await direct.json();
        }
        if (!active) return;
        if (data.status === 'OK' && Array.isArray(data.predictions)) {
          setAddressSuggestions(data.predictions.slice(0, 5).map(p => ({ place_id: p.place_id, description: p.description, main_text: p.structured_formatting?.main_text || p.description, secondary_text: p.structured_formatting?.secondary_text || '' })));
        } else { setAddressSuggestions([]); }
      } catch { if (active) setAddressSuggestions([]); }
      finally { if (active) setAddressSuggesting(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [form.address]);

  const readFilesAsDataUrls = (files) => Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that image.'));
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
    if (urls.length === 0) return '';
    if (urls.length === 1) return urls[0];
    const canvas = document.createElement('canvas');
    const size = 800; const gap = 18;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return urls[0];
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);
    const imgs = await Promise.all(urls.map(loadImage));
    const slots = [[gap,gap,(size-gap*3)/2,(size-gap*3)/2],[(size+gap)/2,gap,(size-gap*3)/2,(size-gap*3)/2],[gap,(size+gap)/2,(size-gap*3)/2,(size-gap*3)/2],[(size+gap)/2,(size+gap)/2,(size-gap*3)/2,(size-gap*3)/2]];
    const drawCover = (img, x, y, w, h) => {
      const scale = Math.max(w/img.width, h/img.height); const sw = w/scale; const sh = h/scale; const sx = (img.width-sw)/2; const sy = (img.height-sh)/2;
      ctx.save(); ctx.beginPath(); const r = 32;
      ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.clip();
      ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h); ctx.restore();
    };
    imgs.forEach((img, i) => { if (slots[i]) drawCover(img, ...slots[i]); });
    return canvas.toDataURL('image/jpeg', 0.78);
  };

  const handleImagePick = async (event) => {
    const files = Array.from(event.target.files?.length ? event.target.files : []);
    if (!files.length) return;
    try {
      const urls = await readFilesAsDataUrls(files);
      const collage = await buildCollageDataUrl(urls);
      setForm(prev => ({ ...prev, restaurant_image: collage }));
    } catch { setSubmitError('Could not read that image.'); }
    event.target.value = '';
  };

  const handleSubmit = async () => {
    if (!form.restaurant_name.trim() || !form.review.trim()) {
      setSubmitError('Please add a restaurant name and tell us why you love it.');
      return;
    }
    setSubmitting(true); setSubmitError('');
    const ok = await onSubmit?.(form);
    setSubmitting(false);
    if (ok) onClose();
    else setSubmitError('Could not save this recommendation right now.');
  };

  const inputStyle = { width: '100%', borderRadius: 12, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: tp, padding: '11px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 560, background: pbg, borderRadius: '24px 24px 0 0', maxHeight: '88vh', overflowY: 'auto', borderTop: `1px solid ${bw}`, paddingBottom: 'calc(28px + env(safe-area-inset-bottom))', ...sheetStyle }} onClick={e => e.stopPropagation()}>
        <div {...handleProps} style={{ width: 36, height: 4, background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: 3, margin: '12px auto 0', ...handleProps.style }} />
        <div style={{ padding: '18px 20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: darkMode ? '#f5c842' : '#92621a' }}>
                Recommend a place ✨
              </p>
              <h2 style={{ fontFamily: handwritten, fontSize: 28, fontWeight: 700, color: tp, margin: '4px 0 0' }}>
                Share a spot worth planning for
              </h2>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: tp, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: ts, lineHeight: 1.6, margin: '0 0 18px' }}>
            Add a place you love so others can discover it and add it to their Someday List.
          </p>

          {submitError && (
            <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(251,191,36,0.2)' : '#fde68a'}`, background: darkMode ? 'rgba(251,191,36,0.08)' : '#fffbeb', color: darkMode ? '#fbbf24' : '#92400e', fontSize: 12 }}>{submitError}</div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {/* Name */}
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Restaurant name *</span>
              <input type="text" value={form.restaurant_name} placeholder="Bestia" onChange={e => updateField('restaurant_name', e.target.value)} style={inputStyle} />
            </label>

            {/* Address with autocomplete */}
            <label style={{ display: 'grid', gap: 6, position: 'relative' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Address</span>
              <input type="text" value={form.address} placeholder="Start typing an address…" onChange={e => updateField('address', e.target.value)} style={inputStyle} />
              {(addressSuggesting || addressSuggestions.length > 0) && form.address.trim().length >= 2 && (
                <div style={{ border: `1px solid ${bw}`, borderRadius: 14, overflow: 'hidden', background: darkMode ? '#111827' : '#ffffff', boxShadow: darkMode ? '0 12px 28px rgba(0,0,0,0.28)' : '0 12px 28px rgba(15,23,42,0.08)' }}>
                  {addressSuggesting && addressSuggestions.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: 13, color: ts }}>Looking up addresses…</div>
                  ) : addressSuggestions.map((s, idx) => (
                    <button key={s.place_id} type="button" onClick={() => { updateField('address', s.description); setAddressSuggestions([]); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderBottom: idx === addressSuggestions.length - 1 ? 'none' : `1px solid ${bw}`, background: 'transparent', cursor: 'pointer', color: tp }}>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>{s.main_text}</div>
                      {s.secondary_text && <div style={{ fontSize: 11, color: ts, marginTop: 2 }}>{s.secondary_text}</div>}
                    </button>
                  ))}
                </div>
              )}
            </label>

            {/* Best for — occasion chips */}
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Best for</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {bestForChips.map(chip => (
                  <button key={chip} type="button" onClick={() => updateField('best_for', form.best_for === chip ? '' : chip)}
                    style={{ padding: '5px 12px', borderRadius: 20, fontSize: 13, fontFamily: handwritten, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', background: form.best_for === chip ? (darkMode ? 'rgba(201,161,93,0.2)' : 'rgba(201,161,93,0.15)') : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'), color: form.best_for === chip ? (darkMode ? '#f5c842' : '#92621a') : ts, border: form.best_for === chip ? `1px solid ${darkMode ? 'rgba(201,161,93,0.4)' : 'rgba(201,161,93,0.4)'}` : `1px solid ${bw}` }}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Photo</span>
              {form.restaurant_image ? (
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 180 }}>
                  <img src={form.restaurant_image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                  <button type="button" onClick={() => updateField('restaurant_image', '')} style={{ position: 'absolute', bottom: 10, right: 10, padding: '6px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.9)', color: '#111', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                  <button type="button" onClick={() => photoInputRef.current?.click()} style={{ position: 'absolute', bottom: 10, left: 10, padding: '6px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.9)', color: '#111', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <button type="button" onClick={() => photoInputRef.current?.click()} style={{ padding: '24px 0', borderRadius: 16, border: `2px dashed ${darkMode ? 'rgba(255,255,255,0.15)' : '#d1d5db'}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#fafafa', color: ts, fontSize: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Camera style={{ width: 24, height: 24 }} />
                  <span style={{ fontWeight: 600, color: tp }}>Add a photo</span>
                  <span style={{ fontSize: 12 }}>Tap to select from your device</span>
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handleImagePick} style={{ display: 'none' }} />
            </div>

            {/* Why do you love it */}
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Why is it worth planning for? *</span>
              <textarea value={form.review} onChange={e => updateField('review', e.target.value)} rows={4} placeholder="Tell people what makes this place special — the dish, the vibe, the memory it creates…" style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: `1px solid ${bw}`, background: 'transparent', color: ts, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: darkMode ? '1px solid rgba(245,200,66,0.24)' : 'none', background: submitting ? 'rgba(201,161,93,0.45)' : (darkMode ? 'linear-gradient(135deg, #C9A15D, #92621a)' : '#C9A15D'), color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: handwritten, cursor: submitting ? 'default' : 'pointer', boxShadow: darkMode && !submitting ? '0 10px 22px rgba(0,0,0,0.24)' : 'none' }}>
              {submitting ? 'Sharing…' : 'Share this place'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Helper: infer cuisine from Google Places types ───────────────────────────
function inferCuisine(types = [], name = '') {
  const t = types.join(' ').toLowerCase();
  const n = name.toLowerCase();
  if (t.includes('japanese') || n.match(/sushi|ramen|izakaya|japanese/)) return 'japanese';
  if (t.includes('italian')  || n.match(/italian|pizza|pasta|trattoria/))  return 'italian';
  if (t.includes('mexican')  || n.match(/mexican|taco|burrito|cantina/))   return 'mexican';
  if (t.includes('chinese')  || n.match(/chinese|dim sum|wok|peking/))     return 'chinese';
  if (t.includes('thai')     || n.match(/thai/))                           return 'thai';
  if (t.includes('indian')   || n.match(/indian|curry|tandoor|masala/))    return 'indian';
  if (t.includes('korean')   || n.match(/korean|bbq|bibimbap/))            return 'korean';
  if (t.includes('french')   || n.match(/french|bistro|brasserie|café/))   return 'french';
  if (t.includes('seafood')  || n.match(/seafood|fish|oyster|lobster|crab/)) return 'seafood';
  if (t.includes('mediterranean') || n.match(/mediterranean|greek|lebanese|falafel/)) return 'mediterranean';
  return 'american';
}

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
  const [restaurants, setRestaurants]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [occasion, setOccasion]         = useState('');   // no pill selected until the user chooses one
  const [selected, setSelected]         = useState(null);
  const [savedIds, setSavedIds]         = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [recommendedPosts, setRecommendedPosts]           = useState([]);
  const [featuredRestaurantPost, setFeaturedRestaurantPost] = useState(null);
  const [highlightedRestaurantId, setHighlightedRestaurantId] = useState(null);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [recommendedPostPhotos, setRecommendedPostPhotos] = useState({});
  const [location, setLocation]         = useState(userLocation || { lat: 34.0522, lng: -118.2437 });
  const [locationSearch, setLocationSearch]   = useState('');
  const [locationLabel, setLocationLabel]     = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSuggesting, setLocationSuggesting]   = useState(false);
  const [locSearching, setLocSearching] = useState(false);
  const [radius] = useState(10000); // fixed radius — no UI toggle needed
  const communityFeedRef = useRef(null);
  const fetchedRef       = useRef(false);
  const recommendationPhotoFetchedRef = useRef(new Set());

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id ?? null));
  }, []);

  // ── Community posts ─────────────────────────────────────────────────────────
  const fetchRecommendedPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('restaurant_posts')
      .select('id, user_id, restaurant_name, restaurant_image, address, google_place_id, website, phone, cuisine, price_level, rating, review, best_for, vibe_tags, likes_count, created_at')
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data && data.length > 0) {
      setRecommendedPosts(data);
      setFeaturedRestaurantPost(data[0] ?? null);
    } else {
      const MOCK = [
        { id: 'rp-1', user_id: null, restaurant_name: 'Bestia', restaurant_image: '', address: '2121 E 7th Pl, Los Angeles, CA', cuisine: 'Italian', price_level: '3', rating: 4.8, review: 'The pastas are the move, but the whole room feels like the perfect night-out spot. Always my first answer for a dinner recommendation.', best_for: 'Date night', likes_count: 18, comments_count: 4, created_at: new Date(Date.now() - 3*3600000).toISOString() },
        { id: 'rp-2', user_id: null, restaurant_name: 'Mariscos Jalisco', restaurant_image: '', address: '3040 E Olympic Blvd, Los Angeles, CA', cuisine: 'Mexican', price_level: '1', rating: 4.9, review: 'If you want something fast, fun, and unforgettable — this is the answer. The shrimp tacos are always worth the detour.', best_for: 'Worth the trip', likes_count: 25, comments_count: 8, created_at: new Date(Date.now() - 26*3600000).toISOString() },
        { id: 'rp-3', user_id: null, restaurant_name: 'République', restaurant_image: '', address: '624 S La Brea Ave, Los Angeles, CA', cuisine: 'French', price_level: '3', rating: 4.7, review: 'The brunch energy is fantastic, but it also works beautifully for a long lingering dinner. Feels special every time.', best_for: 'Special occasion', likes_count: 14, comments_count: 3, created_at: new Date(Date.now() - 48*3600000).toISOString() },
      ];
      setRecommendedPosts(MOCK);
      setFeaturedRestaurantPost(MOCK[0] ?? null);
    }
  }, []);

  useEffect(() => { fetchRecommendedPosts(); }, [fetchRecommendedPosts]);

  const fetchRecommendationPhoto = useCallback(async (post) => {
    const postId = String(post?.id || '');
    const restaurantName = post?.restaurant_name || post?.name || '';
    const existingPhoto = post?.restaurant_image || post?.photo || '';
    if (!postId || !restaurantName || existingPhoto || recommendationPhotoFetchedRef.current.has(postId)) return;
    recommendationPhotoFetchedRef.current.add(postId);

    try {
      const query = `${restaurantName} ${post.address || ''}`.trim();
      const res = await fetch(`/api/places?action=textsearch&query=${encodeURIComponent(query)}&type=restaurant`);
      const data = await res.json();
      const place = Array.isArray(data.results) ? data.results[0] : null;
      const photoRef = place?.photos?.[0]?.photo_reference;
      if (!photoRef) return;

      const url = `/api/places?action=photo&ref=${encodeURIComponent(photoRef)}&maxwidth=600`;
      setRecommendedPostPhotos((prev) => (
        prev[post.id] ? prev : { ...prev, [post.id]: url }
      ));
    } catch {
      // Recommendation photos are progressive enhancement; keep emoji cards if unavailable.
    }
  }, []);

  useEffect(() => {
    const postsToHydrate = [
      featuredRestaurantPost,
      ...recommendedPosts.slice(0, 8),
    ].filter(Boolean);
    postsToHydrate.forEach((post) => fetchRecommendationPhoto(post));
  }, [featuredRestaurantPost, recommendedPosts, fetchRecommendationPhoto]);

  // ── Vote hydration ──────────────────────────────────────────────────────────
  const hydrateRestaurantVotes = useCallback(async (items) => {
    const placeIds = items.map(item => item.googlePlaceId || item.id).filter(Boolean);
    if (placeIds.length === 0) return items;
    const { data: voteRows, error } = await supabase.from('google_restaurant_votes').select('google_place_id, user_id, vote').in('google_place_id', placeIds);
    if (error || !Array.isArray(voteRows)) return items;
    const byPlace = new Map();
    for (const row of voteRows) {
      const key = row.google_place_id;
      const current = byPlace.get(key) || { vote_count: 0, my_vote: 0 };
      current.vote_count += row.vote || 0;
      if (currentUserId && row.user_id && String(row.user_id) === String(currentUserId)) current.my_vote = row.vote || 0;
      byPlace.set(key, current);
    }
    return items.map(item => {
      const stats = byPlace.get(item.googlePlaceId || item.id) || { vote_count: 0, my_vote: 0 };
      return { ...item, vote_count: stats.vote_count, my_vote: stats.my_vote };
    });
  }, [currentUserId]);

  useEffect(() => {
    if (!restaurants.length) return;
    let active = true;
    (async () => { const updated = await hydrateRestaurantVotes(restaurants); if (active) setRestaurants(updated); })();
    return () => { active = false; };
  }, [currentUserId, hydrateRestaurantVotes]);

  // ── Location suggestions ────────────────────────────────────────────────────
  useEffect(() => {
    const query = locationSearch.trim();
    if (query.length < 2) { setLocationSuggestions([]); setLocationSuggesting(false); return; }
    let active = true;
    setLocationSuggesting(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?action=autocomplete&input=${encodeURIComponent(query)}&types=establishment`);
        const data = await res.json();
        if (!active) return;
        if (data.status === 'OK' && Array.isArray(data.predictions)) {
          setLocationSuggestions(data.predictions.slice(0, 5).map(p => ({ place_id: p.place_id, description: p.description, main_text: p.structured_formatting?.main_text || p.description, secondary_text: p.structured_formatting?.secondary_text || '' })));
        } else { setLocationSuggestions([]); }
      } catch { if (active) setLocationSuggestions([]); }
      finally { if (active) setLocationSuggesting(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [locationSearch]);

  // ── Fetch restaurants ───────────────────────────────────────────────────────
  const fetchRestaurants = useCallback(async (loc, query = '', rad = 10000) => {
    setLoading(true); setError('');
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
        if (KEY) { const res = await fetch(directUrl); data = await res.json(); }
        else throw new Error('no_key');
      }

      if (data?.status === 'OK' && data.results?.length > 0) {
        const queryCuisine = normalizeCuisineId(query);
        const mapped = data.results.map(r => ({
          id: r.place_id, googlePlaceId: r.place_id, name: r.name,
          cuisine: queryCuisine || inferCuisine(r.types || [], r.name),
          rating: r.rating || 0, priceLevel: r.price_level || 0,
          address: r.vicinity || '', isOpen: r.opening_hours?.open_now ?? null,
          photo: r.photos?.[0]?.photo_reference ? `/api/places?action=photo&ref=${encodeURIComponent(r.photos[0].photo_reference)}&maxwidth=400` : '',
          phone: '', website: '', description: '', vote_count: 0, my_vote: 0,
        }));
        const hydrated = await hydrateRestaurantVotes(mapped);
        setRestaurants(hydrated);
      } else throw new Error('no_results');
    } catch (err) {
      setRestaurants(FALLBACK_RESTAURANTS);
      if (err.message !== 'no_key' && err.message !== 'no_results') {
        setError('Showing curated picks — connect your Google Places API for live results near you.');
      }
    } finally { setLoading(false); }
  }, [apiKey, hydrateRestaurantVotes]);

  const fetchCuratedRestaurants = useCallback(async (occasionItem) => {
    const curatedItems = CURATED_RESTAURANT_SEARCHES[occasionItem.id] || [];
    if (!curatedItems.length) return false;

    setLoading(true);
    setError('');
    setLocationLabel(occasionItem.label);
    setLocationSearch('');
    setSearch('');
    setLocationSuggestions([]);

    try {
      const KEY = apiKey || process.env.REACT_APP_GOOGLE_PLACES_KEY || '';
      const mapped = await Promise.all(curatedItems.map(async (item, index) => {
        const searchText = `${item.name} ${item.locationHint || ''}`.trim();
        let data;

        try {
          const res = await fetch(`/api/places?action=textsearch&query=${encodeURIComponent(searchText)}&type=restaurant`);
          if (!res.ok) throw new Error('proxy_unavailable');
          data = await res.json();
        } catch {
          if (KEY) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchText)}&type=restaurant&key=${KEY}`);
            data = await res.json();
          }
        }

        const place = data?.results?.[0];
        if (!place) {
          return {
            id: `curated-${occasionItem.id}-${index}`,
            name: item.name,
            cuisine: 'american',
            rating: 0,
            priceLevel: 0,
            address: item.locationHint || '',
            photo: '',
            phone: '',
            website: '',
            description: item.note || '',
            curatedLabel: occasionItem.label,
            vote_count: 0,
            my_vote: 0,
          };
        }

        return {
          id: place.place_id || `curated-${occasionItem.id}-${index}`,
          googlePlaceId: place.place_id,
          name: place.name || item.name,
          cuisine: inferCuisine(place.types || [], place.name || item.name),
          rating: place.rating || 0,
          priceLevel: place.price_level || 0,
          address: place.formatted_address || place.vicinity || item.locationHint || '',
          photo: place.photos?.[0]?.photo_reference
            ? `/api/places?action=photo&ref=${encodeURIComponent(place.photos[0].photo_reference)}&maxwidth=400`
            : '',
          phone: '',
          website: '',
          description: item.note || '',
          curatedLabel: occasionItem.label,
          vote_count: 0,
          my_vote: 0,
        };
      }));

      const hydrated = await hydrateRestaurantVotes(mapped.filter(Boolean));
      setRestaurants(hydrated);
      return true;
    } catch {
      setRestaurants(FALLBACK_RESTAURANTS);
      setError('Showing saved curated picks for now.');
      return true;
    } finally {
      setLoading(false);
    }
  }, [apiKey, hydrateRestaurantVotes]);

  const fetchMostAddedRestaurants = useCallback(async () => {
    setLoading(true);
    setError('');
    setLocationLabel('Most added');
    setLocationSearch('');
    setSearch('');
    setLocationSuggestions([]);

    try {
      const { data, error } = await supabase.rpc('get_most_added_restaurants', { p_limit: 10 });
      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((row) => ({
          id: row.google_place_id || row.restaurant_key,
          googlePlaceId: row.google_place_id || '',
          name: row.restaurant_name,
          cuisine: normalizeCuisineId(row.cuisine || '') || inferCuisine([], row.restaurant_name),
          rating: Number(row.rating || 0),
          priceLevel: Number(row.price_level || 0),
          address: row.address || '',
          photo: row.photo || '',
          phone: '',
          website: '',
          description: row.description || `Added to ${Number(row.add_count || 0).toLocaleString()} Someday board${Number(row.add_count || 0) === 1 ? '' : 's'}.`,
          add_count: Number(row.add_count || 0),
          vote_count: 0,
          my_vote: 0,
        }));
        const hydrated = await hydrateRestaurantVotes(mapped);
        setRestaurants(hydrated);
        return true;
      }
    } catch {
      // Fall back below until the aggregate migration has been applied.
    }

    const fallbackPosts = [...recommendedPosts]
      .sort((a, b) => Number(b.likes_count || 0) - Number(a.likes_count || 0))
      .slice(0, 10);

    if (fallbackPosts.length > 0) {
      setRestaurants(fallbackPosts.map((post) => ({
        id: post.google_place_id || `post-${post.id}`,
        googlePlaceId: post.google_place_id || '',
        name: post.restaurant_name,
        cuisine: normalizeCuisineId(post.cuisine || '') || inferCuisine([], post.restaurant_name),
        rating: Number(post.rating || 0),
        priceLevel: Number(post.price_level || 0),
        address: post.address || '',
        photo: post.restaurant_image || '',
        phone: post.phone || '',
        website: post.website || '',
        description: post.review || `Recommended by the community with ${Number(post.likes_count || 0).toLocaleString()} like${Number(post.likes_count || 0) === 1 ? '' : 's'}.`,
        add_count: Number(post.likes_count || 0),
        vote_count: 0,
        my_vote: 0,
      })));
      setError('Most added will use real Someday saves after the restaurant add-count migration is applied. Showing most-liked recommendations for now.');
      return true;
    }

    setRestaurants(FALLBACK_RESTAURANTS);
    setError('Most added will appear after people start saving restaurants.');
    return true;
  }, [hydrateRestaurantVotes, recommendedPosts]);

  const fetchHiddenGemRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    setLocationLabel('Hidden gem');
    setLocationSearch('');
    setSearch('');
    setLocationSuggestions([]);

    let posts = recommendedPosts;

    try {
      const { data, error } = await supabase
        .from('restaurant_posts')
        .select('id, user_id, restaurant_name, restaurant_image, address, google_place_id, website, phone, cuisine, price_level, rating, review, best_for, vibe_tags, likes_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && Array.isArray(data) && data.length > 0) {
        posts = data;
      }
    } catch {
      // Use already loaded recommendations if Supabase is unavailable.
    }

    const mapped = [...posts]
      .sort((a, b) => {
        const hiddenA = /hidden|gem/i.test(`${a.best_for || ''} ${a.vibe_tags || ''} ${a.review || ''}`) ? 1 : 0;
        const hiddenB = /hidden|gem/i.test(`${b.best_for || ''} ${b.vibe_tags || ''} ${b.review || ''}`) ? 1 : 0;
        if (hiddenA !== hiddenB) return hiddenB - hiddenA;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      })
      .slice(0, 10)
      .map((post) => ({
        id: post.google_place_id || `post-${post.id}`,
        googlePlaceId: post.google_place_id || '',
        name: post.restaurant_name,
        cuisine: normalizeCuisineId(post.cuisine || '') || inferCuisine([], post.restaurant_name),
        rating: Number(post.rating || 0),
        priceLevel: Number(post.price_level || 0),
        address: post.address || '',
        photo: post.restaurant_image || '',
        phone: post.phone || '',
        website: post.website || '',
        description: post.review || 'A community-recommended spot worth saving.',
        curatedLabel: 'Hidden gem',
        vote_count: Number(post.likes_count || 0),
        my_vote: 0,
      }));

    if (mapped.length > 0) {
      setRestaurants(mapped);
    } else {
      setRestaurants(FALLBACK_RESTAURANTS);
      setError('Hidden gems will show up here after people recommend restaurants.');
    }

    setLoading(false);
    return true;
  }, [recommendedPosts]);

  // Initial load
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setRestaurants([]);
  }, []);

  // ── Unified smart search ─────────────────────────────────────────────────────
  // Tries restaurant text search first (e.g. "The French Laundry"),
  // falls back to geocode + nearby search (e.g. "San Francisco").
  const handleUnifiedSearch = useCallback(async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLocSearching(true); setLoading(true); setError('');
    const KEY = apiKey || process.env.REACT_APP_GOOGLE_PLACES_KEY || '';

    try {
      // Step 1: Text search — catches specific restaurant names
      let textData;
      try {
        const res = await fetch(`/api/places?action=textsearch&query=${encodeURIComponent(trimmed)}&type=restaurant`);
        if (!res.ok) throw new Error('proxy_unavailable');
        textData = await res.json();
      } catch {
        if (KEY) {
          const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(trimmed)}&type=restaurant&key=${KEY}`);
          textData = await res.json();
        }
      }

      if (textData?.status === 'OK' && textData.results?.length > 0) {
        const mapped = textData.results.map(r => ({
          id: r.place_id, googlePlaceId: r.place_id,
          name: r.name,
          cuisine: inferCuisine(r.types || [], r.name),
          rating: r.rating || 0, priceLevel: r.price_level || 0,
          address: r.formatted_address || r.vicinity || '',
          photo: r.photos?.[0]?.photo_reference
            ? `/api/places?action=photo&ref=${encodeURIComponent(r.photos[0].photo_reference)}&maxwidth=400`
            : '',
          phone: '', website: '', description: '', vote_count: 0, my_vote: 0,
        }));
        const hydrated = await hydrateRestaurantVotes(mapped);
        setRestaurants(hydrated);
        setLocationLabel(trimmed);
        setLocationSearch(trimmed);
        setLocationSuggestions([]);
        setLoading(false);
        setLocSearching(false);
        return;
      }

      // Step 2: Geocode — treat as city or address
      let geocodeData;
      try {
        const r = await fetch(`/api/geocode?address=${encodeURIComponent(trimmed)}`);
        if (!r.ok) throw new Error('proxy_unavailable');
        geocodeData = await r.json();
      } catch {
        if (KEY) {
          const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${KEY}`);
          geocodeData = await r.json();
        }
      }

      if (geocodeData?.status === 'OK' && geocodeData.results?.[0]) {
        const { lat, lng } = geocodeData.results[0].geometry.location;
        const loc = { lat, lng };
        const label = geocodeData.results[0].formatted_address || trimmed;
        setLocation(loc); setLocationLabel(label);
        setLocationSearch(label); setLocationSuggestions([]);
        await fetchRestaurants(loc, '', radius);
        return;
      }

      setError('No results found — try a restaurant name, city, or address.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLocSearching(false);
      setLoading(false);
    }
  }, [apiKey, fetchRestaurants, hydrateRestaurantVotes, radius]);

  // resolveLocationSearch used by autocomplete suggestion taps
  const resolveLocationSearch = useCallback(async (query) => {
    await handleUnifiedSearch(query);
  }, [handleUnifiedSearch]);

  const handleOccasionSearch = useCallback(async (occasionItem) => {
    if (occasion === occasionItem.id) {
      setOccasion('');
      setLocationLabel('');
      setLocationSearch('');
      setSearch('');
      setLocationSuggestions([]);
      setError('');
      setRestaurants([]);
      setLoading(false);
      return;
    }

    setOccasion(occasionItem.id);

    if (occasionItem.id === 'all') {
      setLocationLabel('');
      setLocationSearch('');
      setSearch('');
      setLocationSuggestions([]);
      await fetchRestaurants(location, '', radius);
      return;
    }

    if (occasionItem.id === 'most_added') {
      await fetchMostAddedRestaurants();
      return;
    }

    if (occasionItem.id === 'hidden_gem') {
      await fetchHiddenGemRecommendations();
      return;
    }

    const usedCuratedList = await fetchCuratedRestaurants(occasionItem);
    if (usedCuratedList) return;

    const locationContext = locationLabel && locationLabel !== 'Current location'
      ? ` near ${locationLabel}`
      : '';
    await handleUnifiedSearch(`${occasionItem.query || occasionItem.label}${locationContext}`);
  }, [fetchCuratedRestaurants, fetchHiddenGemRecommendations, fetchMostAddedRestaurants, fetchRestaurants, handleUnifiedSearch, location, locationLabel, occasion, radius]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setOccasion('');
    setLocSearching(true); setError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc); setLocationLabel('Current location');
        setLocationSearch(''); setLocationSuggestions([]);
        fetchRestaurants(loc, '', radius);
        setLocSearching(false);
      },
      () => { setError('Could not get your location.'); setLocSearching(false); },
      { timeout: 8000 }
    );
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const recordRestaurantAdd = useCallback(async (restaurant = {}) => {
    const restaurantName = restaurant.name || restaurant.restaurant_name || restaurant.title || restaurant.text || '';
    const key = restaurantAddKey({ ...restaurant, name: restaurantName });
    if (!key || !restaurantName) return;

    try {
      await supabase.rpc('record_restaurant_add', {
        p_restaurant_key: key,
        p_google_place_id: restaurant.googlePlaceId || restaurant.google_place_id || null,
        p_restaurant_name: restaurantName,
        p_address: restaurant.address || null,
        p_photo: restaurant.photo || restaurant.restaurant_image || restaurant.imageUrl || null,
        p_cuisine: restaurant.cuisine || null,
        p_rating: restaurant.rating ? Number(restaurant.rating) : null,
        p_price_level: restaurant.priceLevel || restaurant.price_level ? Number(restaurant.priceLevel || restaurant.price_level) : null,
        p_description: restaurant.description || restaurant.review || null,
      });
    } catch {
      // The Most added chip gracefully falls back until this migration exists in Supabase.
    }
  }, []);

  const handleSaveToSomeday = (restaurant) => {
    setSavedIds(prev => new Set([...prev, restaurant.id]));
    recordRestaurantAdd(restaurant);
    onSaveToSomeday?.({ id: Date.now().toString(), text: restaurant.name, categoryId: 'food', status: 'dreaming', tab: 'ours', emoji: getCuisineEmoji(restaurant.cuisine), imageUrl: restaurant.photo || '', notes: `${restaurant.address || ''} · ${restaurant.cuisine}`, comments: [], partnerHearted: false, myHearted: false, createdAt: new Date().toISOString() });
  };

  const handleRecommendSubmit = async (form) => {
    const payload = { user_id: currentUserId, restaurant_name: form.restaurant_name.trim(), restaurant_image: form.restaurant_image.trim() || null, address: form.address.trim() || null, cuisine: form.cuisine.trim() || null, price_level: form.price_level || null, rating: form.rating ? Number(form.rating) : null, review: form.review.trim(), best_for: form.best_for.trim() || null, likes_count: 0 };
    let { error } = await supabase.from('restaurant_posts').insert(payload);
    if (error && payload.restaurant_image) {
      const fallbackPayload = { ...payload, restaurant_image: null };
      ({ error } = await supabase.from('restaurant_posts').insert(fallbackPayload));
      if (!error) payload.restaurant_image = null;
    }
    if (error) { console.error(error); return false; }
    const savedPost = { ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
    setRecommendedPosts(prev => [savedPost, ...prev.filter(p => String(p.restaurant_name) !== String(savedPost.restaurant_name))]);
    setFeaturedRestaurantPost(savedPost);
    setHighlightedRestaurantId(String(savedPost.id));
    window.setTimeout(() => communityFeedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return true;
  };

  const handleVoteRecommendation = useCallback(async (post, delta) => {
    if (!post?.id || !delta) return;
    try { const { error } = await supabase.rpc('vote_on_restaurant_post', { post_id: post.id, vote_delta: delta }); if (error) throw error; }
    catch (error) { console.error(error); }
    finally {
      setRecommendedPosts(prev => prev.map(item => item.id === post.id ? { ...item, likes_count: Math.max(0, (item.likes_count ?? 0) + delta) } : item));
      setFeaturedRestaurantPost(prev => prev && prev.id === post.id ? { ...prev, likes_count: Math.max(0, (prev.likes_count ?? 0) + delta) } : prev);
    }
  }, []);

  const handleDeleteRecommendation = useCallback(async (post) => {
    if (!post?.id) return;
    if (!window.confirm('Delete this recommendation?')) return;
    const { error } = await supabase.from('restaurant_posts').delete().eq('id', post.id);
    if (error) { console.error(error); setError('Could not delete this recommendation right now.'); return; }
    const nextPosts = recommendedPosts.filter(item => String(item.id) !== String(post.id));
    setRecommendedPosts(nextPosts);
    setHighlightedRestaurantId(current => String(current) === String(post.id) ? null : current);
    setFeaturedRestaurantPost(current => { if (current && String(current.id) === String(post.id)) return nextPosts[0] ?? null; return current; });
  }, [recommendedPosts]);

  const handleSomedayFromRecommendation = useCallback((post) => {
    recordRestaurantAdd(post);
    onSaveToSomeday?.({ ...restaurantSomedayPayload(post), cuisine: post.cuisine || '', address: post.address || '', review: post.review || '', best_for: post.best_for || '', price_level: post.price_level || null });
  }, [onSaveToSomeday, recordRestaurantAdd]);

  // ── Style tokens ─────────────────────────────────────────────────────────────
  const pageBg = darkMode ? '#0e1520' : '#faf8f3';
  const hBg    = darkMode ? 'rgba(19,28,46,0.98)' : 'rgba(255,255,255,0.98)';
  const bw     = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const tp     = darkMode ? '#f1f5f9' : '#111827';
  const ts     = darkMode ? '#6b7280' : '#9ca3af';
  const heroBg = darkMode
    ? 'linear-gradient(135deg, #121a28 0%, #1a2a1a 54%, #101722 100%)'
    : 'linear-gradient(135deg, #fff7eb 0%, #fff1f5 55%, #f4f8ff 100%)';

  // ── Filtered results (occasion is a UI label only for now; extend with best_for matching if desired) ──
  const filtered = useMemo(() => [...restaurants], [restaurants]);
  const activeOccasionLabel = OCCASIONS.find(o => o.id === occasion)?.label || '';
  const resultHeading = activeOccasionLabel && occasion !== 'all'
    ? activeOccasionLabel
    : (locationLabel ? `Places near ${locationLabel}` : 'Places worth planning for');

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: 'var(--font-sans, system-ui, sans-serif)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ margin: '0 16px 16px', borderRadius: 28, padding: '32px 28px 28px', minHeight: 220, position: 'relative', overflow: 'hidden', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(201,161,93,0.2)'}`, background: heroBg }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(201,161,93,0.10), transparent)' }} />
        {onBack && (
          <button onClick={onBack} aria-label="Back" style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(201,161,93,0.28)'}`, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)', color: tp, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
        <div style={{ position: 'absolute', right: 18, top: 10, fontSize: 88, opacity: darkMode ? 0.07 : 0.09, transform: 'rotate(10deg)', pointerEvents: 'none', userSelect: 'none' }}>🍽️</div>
        <h1 style={{ fontFamily: handwritten, fontSize: 52, fontWeight: 700, lineHeight: 1.02, margin: '42px 0 10px', maxWidth: 360, backgroundImage: darkMode ? 'linear-gradient(90deg, #f8fafc 0%, #fcd97a 100%)' : 'linear-gradient(90deg, #1f2937 0%, #92621a 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
          Turn meals into memories
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: ts, maxWidth: 340 }}>
          Find places worth planning for. Save them to your Komo Book and make a night of it.
        </p>
      </div>

      {/* ── Single unified search bar ── */}
      <div style={{ margin: '0 16px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: `1px solid ${bw}`, borderRadius: 14, padding: '10px 14px' }}>
            <Search style={{ width: 14, height: 14, color: ts, flexShrink: 0, opacity: .6 }} />
            <input
              type="text"
              value={locationSearch || search}
              onChange={e => {
                const val = e.target.value;
                setLocationSearch(val);
                setSearch(val);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleUnifiedSearch(locationSearch || search);
              }}
              placeholder={locationLabel || 'Search a city, address, or restaurant…'}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: tp }}
            />
            {(locationSearch || search) && (
              <button onClick={() => { setOccasion(''); setSearch(''); setLocationSearch(''); setLocationSuggestions([]); fetchRestaurants(location); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: ts, padding: 0 }}>✕</button>
            )}
          </div>
          {(locationSuggesting || locationSuggestions.length > 0) && locationSearch.trim().length >= 2 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, border: `1px solid ${bw}`, borderRadius: 14, overflow: 'hidden', background: darkMode ? '#111827' : '#ffffff', boxShadow: darkMode ? '0 12px 28px rgba(0,0,0,0.28)' : '0 12px 28px rgba(15,23,42,0.08)', zIndex: 20 }}>
              {locationSuggesting && locationSuggestions.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: 13, color: ts }}>Looking up places…</div>
              ) : locationSuggestions.map((s) => (
                <button key={s.place_id} type="button" onClick={() => { setLocationSearch(s.description); setLocationLabel(s.description); setLocationSuggestions([]); resolveLocationSearch(s.description); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderBottom: `1px solid ${bw}`, background: 'transparent', cursor: 'pointer', color: tp }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>{s.main_text}</div>
                  {s.secondary_text && <div style={{ fontSize: 11, color: ts, marginTop: 2 }}>{s.secondary_text}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={useMyLocation} disabled={locSearching} style={{ padding: '10px 14px', borderRadius: 14, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: locSearching ? ts : tp, fontSize: 13, fontWeight: 500, cursor: locSearching ? 'default' : 'pointer', opacity: locSearching ? .6 : 1, whiteSpace: 'nowrap' }}>
          {locSearching ? '…' : '📍 Me'}
        </button>
      </div>

      {/* ── Occasion strip (replaces cuisine/price/radius filters) ── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {OCCASIONS.map(o => (
          <button
            key={o.id}
            onClick={() => handleOccasionSearch(o)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20,
              fontSize: 13, fontFamily: handwritten,
              fontWeight: occasion === o.id ? 700 : 500,
              cursor: 'pointer', transition: 'all .15s',
              background: occasion === o.id
                ? (darkMode ? 'rgba(201,161,93,0.2)' : 'rgba(201,161,93,0.15)')
                : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
              color: occasion === o.id
                ? (darkMode ? '#f5c842' : '#92621a')
                : ts,
              border: occasion === o.id
                ? `1px solid ${darkMode ? 'rgba(201,161,93,0.4)' : 'rgba(201,161,93,0.4)'}`
                : `1px solid ${bw}`,
            }}
          >
            {o.emoji} {o.label}
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ margin: '0 16px 10px', padding: '8px 14px', background: darkMode ? 'rgba(251,191,36,0.08)' : '#fffbeb', borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(251,191,36,0.2)' : '#fde68a'}`, fontSize: 12, color: darkMode ? '#fbbf24' : '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>ℹ️</span>{error}
        </div>
      )}

      {/* ── Featured community recommendation ── */}
      {(featuredRestaurantPost || recommendedPosts[0]) && (
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ts, margin: '4px 2px 10px' }}>
            {currentUserId && String((featuredRestaurantPost || recommendedPosts[0])?.user_id || '') === String(currentUserId) ? 'From your community' : 'Most loved this week'}
          </p>
          <FeaturedRestaurantRecommendation
            post={featuredRestaurantPost || recommendedPosts[0]}
            photoUrl={recommendedPostPhotos[(featuredRestaurantPost || recommendedPosts[0])?.id] || ''}
            currentUserId={currentUserId}
            onSomeday={handleSomedayFromRecommendation}
            onRemoveFromSomeday={onRemoveFromSomeday}
            onDelete={handleDeleteRecommendation}
            darkMode={darkMode}
          />
        </div>
      )}

      {/* ── "Found a great spot?" CTA card ── */}
      <div style={{
        margin: '0 16px 20px',
        borderRadius: 20,
        background: darkMode
          ? 'linear-gradient(135deg, rgba(22,31,48,0.98), rgba(45,33,24,0.92))'
          : '#FFF3E8',
        border: darkMode ? '1.5px solid rgba(201,161,93,0.24)' : '1.5px solid #F5C496',
        boxShadow: darkMode ? '0 18px 42px rgba(0,0,0,0.28)' : 'none',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: darkMode ? '#C9A15D' : '#FBBF7C', opacity: darkMode ? 0.12 : 0.18, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 70, height: 70, borderRadius: '50%', background: darkMode ? '#F5C842' : '#F97316', opacity: darkMode ? 0.08 : 0.10, pointerEvents: 'none' }} />
        <div style={{ fontSize: 28, marginBottom: 2 }}>📍</div>
        <p style={{ fontSize: 18, fontWeight: 500, color: darkMode ? '#F8E7C2' : '#7C3313', fontFamily: handwritten, margin: 0 }}>Found a great spot?</p>
        <p style={{ fontSize: 13, color: darkMode ? 'rgba(248,231,194,0.68)' : '#A04B20', margin: '0 0 10px' }}>Share it with the community</p>
        <button
          onClick={() => setIsRecommendOpen(true)}
          style={{
            background: darkMode ? 'linear-gradient(135deg, #C9A15D, #92621a)' : '#EA6C25',
            color: 'white',
            border: darkMode ? '1px solid rgba(245,200,66,0.28)' : 'none',
            borderRadius: 50,
            padding: '11px 28px',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: handwritten,
            boxShadow: darkMode ? '0 10px 22px rgba(0,0,0,0.28)' : 'none'
          }}
        >
          <span style={{ background: darkMode ? 'rgba(15,23,42,0.45)' : '#7C3313', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5H8M8 5L5.5 2.5M8 5L5.5 7.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          Recommend a place
        </button>
      </div>

      {/* ── Section label ── */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: ts, padding: '0 18px 10px', margin: 0 }}>
        {resultHeading}
      </p>

      {/* ── Restaurant grid ── */}
      <div style={{ padding: '0 14px 100px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} darkMode={darkMode} />)
          : filtered.length === 0
            ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 24px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
                <p style={{ fontFamily: handwritten, fontSize: 22, color: ts, fontStyle: 'italic', margin: '0 0 16px' }}>No restaurants found</p>
                <button onClick={() => fetchRestaurants(location, '', radius)} style={{ padding: '9px 22px', borderRadius: 14, border: 'none', background: '#C9A15D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Try again
                </button>
              </div>
            )
            : filtered.map((r, i) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                onTap={setSelected}
                savedIds={savedIds}
                darkMode={darkMode}
                stagger={i}
              />
            ))
        }
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

      {/* ── Recommend modal ── */}
      {isRecommendOpen && (
        <PostRestaurantModal
          onClose={() => setIsRecommendOpen(false)}
          onSubmit={handleRecommendSubmit}
          darkMode={darkMode}
          apiKey={apiKey}
        />
      )}
    </div>
  );
};

export default RestaurantPage;
