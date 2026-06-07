/**
 * SomedayPage.jsx — Komo Book with chapters
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import InvitePicker from './InvitePicker';
import useGoogleImage from '../hooks/useGoogleImage';
import useMoviePoster from '../hooks/useMoviePoster';
import usePlacesImage from '../hooks/usePlacesImage';
import { getDreamImageSearchQuery, getDreamPlacePhotoQuery, isFallbackRestaurantDreamImage, isMovieDream, resolveDreamImage, resolveDreamImageCandidates } from '../lib/resolveDreamImage';
import { generateChapterFromPrompt, getChapterPromptExamples } from '../lib/generateChapterFromPrompt';

const CAVEAT = '"Caveat", cursive';
const SANS = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const SAMPLE_PINS = [
  { id: '1', type: 'photo', x: 18,  y: 70,  rot: -2.5, label: 'Trek in Patagonia',      emoji: '🏔️', imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80', pinColor: 'teal',   categoryId: 'places',      status: 'dreaming' },
  { id: '2', type: 'photo', x: 175, y: 52,  rot:  2.1, label: 'A week in Japan',         emoji: '🗾', imageUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&q=80', pinColor: 'purple', categoryId: 'places',      status: 'planning' },
  { id: '3', type: 'note',  x: 318, y: 64,  rot: -1.2, text: 'Cherry blossom April 2026 — book flights NOW!!', noteColor: 'yellow', pinColor: 'amber', categoryId: 'places', status: 'planning' },
  { id: '4', type: 'photo', x: 18,  y: 272, rot:  1.8, label: 'See the Northern Lights', emoji: '🌌', imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80', pinColor: 'purple', categoryId: 'places',      status: 'dreaming' },
  { id: '5', type: 'photo', x: 188, y: 260, rot: -1.5, label: 'Try omakase in LA',        emoji: '🍣', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80', pinColor: 'teal',   categoryId: 'food',        status: 'dreaming' },
  { id: '6', type: 'note',  x: 18,  y: 472, rot:  2.2, text: 'Learn to surf this summer — Santa Cruz?', noteColor: 'pink', pinColor: 'pink', categoryId: 'experiences', status: 'dreaming' },
  { id: '7', type: 'photo', x: 185, y: 462, rot: -2.0, label: 'Road trip down PCH',       emoji: '🚗', imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80', pinColor: 'teal',   categoryId: 'places',      status: 'planning' },
  { id: '8', type: 'note',  x: 328, y: 300, rot: -0.8, text: 'Get a Vitamix — wait for Black Friday sale', noteColor: 'blue', pinColor: 'purple', categoryId: 'buy', status: 'dreaming' },
  { id: '9',  type: 'photo',   x: 325, y: 460, rot: 1.5, label: 'Redecorate living room', emoji: '🛋️', imageUrl: '', pinColor: 'amber', categoryId: 'home', status: 'planning' },
  { id: '10', type: 'label',   x: 318, y: 62,  rot: -1.8, text: 'MOVIES',      fontStyle: 'bold',        fontSize: 'large',  textColor: '#7c3aed', styleVariant: 'highlight' },
  { id: '11', type: 'label',   x: 18,  y: 390, rot:  1.4, text: 'My Wishlist', fontStyle: 'handwritten', fontSize: 'medium', textColor: '#0d9488', styleVariant: 'tape' },
  { id: '12', type: 'sticker', x: 290, y: 192, rot: 11,   sticker: '⭐', size: 'medium' },
  { id: '13', type: 'sticker', x: 150, y: 370, rot: -7,   sticker: '🌸', size: 'large' },
];

const NOTE_COLORS = {
  yellow: { light: { bg: '#fef9c3', fold: '#fde047', text: '#713f12' }, dark: { bg: '#2d2a0a', fold: '#854d0e', text: '#fef08a' } },
  pink:   { light: { bg: '#fce7f3', fold: '#f9a8d4', text: '#831843' }, dark: { bg: '#2d0a1e', fold: '#9d174d', text: '#fbcfe8' } },
  blue:   { light: { bg: '#dbeafe', fold: '#93c5fd', text: '#1e3a8a' }, dark: { bg: '#0a1628', fold: '#1d4ed8', text: '#bfdbfe' } },
  green:  { light: { bg: '#dcfce7', fold: '#86efac', text: '#14532d' }, dark: { bg: '#0a2010', fold: '#15803d', text: '#bbf7d0' } },
};

function useSwipeDownSheet(onClose) {
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(null);
  const dragDistanceRef = useRef(0);
  // Keep onClose in a ref so the stable effect closure always calls the latest prop
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleMove = React.useCallback((clientY) => {
    if (dragStartYRef.current == null) return;
    const delta = Math.max(0, clientY - dragStartYRef.current);
    dragDistanceRef.current = delta;
    setDragY(delta);
  }, []); // stable — only uses refs and the stable setDragY setter

  const handleEnd = React.useCallback(() => {
    const shouldClose = dragDistanceRef.current > 90;
    dragStartYRef.current = null; dragDistanceRef.current = 0; setDragY(0);
    if (shouldClose) onCloseRef.current?.();
  }, []); // stable — only uses refs

  // Register global mouse listeners once per mount instead of after every setDragY
  React.useEffect(() => {
    const onMove = (e) => handleMove(e.clientY);
    const onUp = () => { if (dragStartYRef.current != null) handleEnd(); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [handleMove, handleEnd]);

  const handleStart = (clientY) => { dragStartYRef.current = clientY; dragDistanceRef.current = 0; setDragY(0); };
  return {
    sheetStyle: { transform: `translateY(${dragY}px)`, transition: dragStartYRef.current ? 'none' : 'transform 180ms ease' },
    handleProps: {
      onTouchStart: (e) => { e.stopPropagation(); handleStart(e.touches[0].clientY); },
      onTouchMove: (e) => { e.stopPropagation(); handleMove(e.touches[0].clientY); },
      onTouchEnd: (e) => { e.stopPropagation(); handleEnd(); },
      onMouseDown: (e) => handleStart(e.clientY),
      style: { touchAction: 'none', cursor: 'grab', padding: '8px 0 6px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    },
  };
}

const PIN_COLORS = {
  teal:   { light: '#0d9488', dark: '#2dd4bf' },
  purple: { light: '#7c3aed', dark: '#c084fc' },
  pink:   { light: '#db2777', dark: '#f472b6' },
  amber:  { light: '#d97706', dark: '#fbbf24' },
  red:    { light: '#dc2626', dark: '#f87171' },
};

const CATEGORY_FILTERS = [
  { id: 'all',         label: 'All',           emoji: '✦' },
  { id: 'places',      label: 'Places',        emoji: '🌍' },
  { id: 'food',        label: 'Food',          emoji: '🍜' },
  { id: 'experiences', label: 'Experiences',   emoji: '✨' },
  { id: 'home',        label: 'Home',          emoji: '🏡' },
  { id: 'buy',         label: 'Things to buy', emoji: '🛍️' },
  { id: 'notes',       label: 'Notes',         emoji: '📝' },
  { id: 'done',        label: 'Completed',     emoji: '✓'  },
];

const NOTE_COLOR_OPTIONS = ['yellow', 'pink', 'blue', 'green'];
const PIN_COLOR_OPTIONS   = ['teal', 'purple', 'pink', 'amber', 'red'];
const STICKERS = ['✈️','🍣','🎬','🎲','❤️','⭐','🌸','🏔️','🏡','🛍️','🍜','🚗','🍕','🎵','📚','🌊','🏄','🌮','☕','🍷','🎪','🌙','🌈','🎭'];
const LABEL_COLORS = ['#1a1a2e','#ffffff','#0d9488','#7c3aed','#d97706','#db2777','#2563eb','#065f46'];

// ─── Group detection (for suggestion prompt) ──────────────────────────────────
const THEME_KEYWORDS = {
  japan:    ['japan', 'tokyo', 'kyoto', 'osaka', 'sushi', 'ramen', 'sakura', 'blossom', 'jiro'],
  europe:   ['paris', 'france', 'italy', 'rome', 'barcelona', 'spain', 'london', 'amsterdam'],
  beach:    ['beach', 'surf', 'ocean', 'coast', 'hawaii', 'bali', 'caribbean', 'island', 'santa cruz'],
  food:     ['omakase', 'restaurant', 'dining', 'chef', 'tasting', 'cuisine', 'vitamix', 'brunch'],
  outdoors: ['hike', 'trail', 'camp', 'mountain', 'patagonia', 'northern lights', 'national park', 'trek'],
  road:     ['road trip', 'drive', 'pch', 'route', 'road', 'coast highway'],
  home:     ['redecorate', 'living room', 'kitchen', 'bedroom', 'renovate', 'decor'],
  fitness:  ['yoga', 'climb', 'run', 'gym', 'fitness', 'wellness', 'learn to surf'],
};

const THEME_TITLE_SUGGESTIONS = {
  japan:    'Japan Someday ✈️',
  europe:   'European Adventure 🗺️',
  beach:    'Beach Escape 🌊',
  food:     'Foodie Dreams 🍜',
  outdoors: 'Into the Wild 🏔️',
  road:     'Road Trip 🚗',
  home:     'Home Goals 🏡',
  fitness:  'Get Active 🏄',
};

function detectGroups(pins) {
  const content = pins.filter(p => p.type !== 'label' && p.type !== 'sticker' && p.status !== 'done' && !p.chapterId);
  const groups = [];
  const assigned = new Set();
  Object.entries(THEME_KEYWORDS).forEach(([theme, keywords]) => {
    const matches = content.filter(p => {
      if (assigned.has(p.id)) return false;
      const haystack = `${p.label || ''} ${p.text || ''} ${p.emoji || ''}`.toLowerCase();
      return keywords.some(kw => haystack.includes(kw));
    });
    if (matches.length < 2) return;
    const subset = matches.slice(0, 4);
    subset.forEach(p => assigned.add(p.id));
    groups.push({ id: `group-${theme}`, theme, pinIds: subset.map(p => p.id), suggestedTitle: THEME_TITLE_SUGGESTIONS[theme] || 'New Chapter' });
  });
  return groups;
}

// ─── Round-out suggestions ───────────────────────────────────────────────────
const SUGGESTION_POOL = {
  japan:    [
    { label: 'TeamLab Borderless', emoji: '🎨', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=200&q=70', description: 'Immersive digital art museum where boundaries between art and viewer dissolve. Multiple themed rooms with flowing light and sound.', tip: 'Book tickets weeks in advance — it sells out fast. Wear comfortable shoes and expect to stay 2–3 hrs.', mapQuery: 'teamLab Borderless Tokyo' },
    { label: 'Shibuya Crossing at night', emoji: '🌃', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&q=70', description: 'The world\'s busiest pedestrian crossing, surrounded by giant screens and neon. Electric at night when up to 3,000 people cross at once.', tip: 'Head to the Starbucks or Mag\'s Park rooftop for an overhead view. Best right after rush hour.', mapQuery: 'Shibuya Crossing Tokyo' },
    { label: 'Tsukiji fish market breakfast', emoji: '🐟', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&q=70', description: 'The outer market is still alive with sushi stalls, tamagoyaki, and fresh seafood breakfast bites. A quintessential Tokyo morning.', tip: 'Arrive before 8am for the freshest cuts. Try Sushi Dai or Daiwa Sushi — the line is worth it.', mapQuery: 'Tsukiji Outer Market Tokyo' },
    { label: 'Ryokan stay in Hakone', emoji: '♨️', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1564501049412-61a17c52b51c?w=200&q=70', description: 'Traditional Japanese inn with tatami rooms, yukata robes, kaiseki dinner, and private or communal onsen hot springs. Mt. Fuji views on clear days.', tip: 'Stay at least one night. Book a room with private rotenburo (outdoor bath) for the full experience.', mapQuery: 'Ryokan Hakone Japan' },
    { label: 'Fushimi Inari hike', emoji: '⛩️', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&q=70', description: 'Thousands of vermillion torii gates winding up a forested mountain south of Kyoto. The full hike to the summit takes about 2–3 hours.', tip: 'Go at dawn or after 6pm — the lower gates get crowded midday. The upper trails stay quiet.', mapQuery: 'Fushimi Inari Taisha Kyoto' },
    { label: 'Izakaya bar-hop, Shinjuku', emoji: '🍶', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&q=70', description: 'Duck into the tiny lantern-lit alleys of Omoide Yokocho or Golden Gai — rows of cramped, atmospheric bars serving yakitori, sake, and shochu.', tip: 'Golden Gai has 200+ bars, each with 5–8 seats. Just walk in anywhere that feels right. Cover charge is usually ¥500.', mapQuery: 'Golden Gai Shinjuku Tokyo' },
    { label: 'Bullet train to Kyoto', emoji: '🚄', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=200&q=70', description: 'The Shinkansen from Tokyo to Kyoto takes just 2h 15min. On a clear day, Mt. Fuji is visible from the right side heading west.', tip: 'Sit on the right (E seats) heading to Kyoto for the Fuji view. Reserve seats on the Nozomi for the fastest ride.', mapQuery: 'Kyoto Station Japan' },
    { label: 'Konbini breakfast run', emoji: '🥟', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=200&q=70', description: 'Japanese convenience stores (7-Eleven, FamilyMart, Lawson) are a food experience in themselves — onigiri, egg sandwiches, hot nikuman, and canned coffee.', tip: '7-Eleven is widely considered the best. The tuna mayo onigiri and coffee are legendary. Open 24/7 everywhere.', mapQuery: '7-Eleven FamilyMart Tokyo' },
  ],
  europe:   [
    { label: 'Corner bistro café au lait', emoji: '☕', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200&q=70', description: 'Standing at a zinc bar with a café crème and a croissant is the quintessential Paris morning. Unhurried, cheap, and deeply local.', tip: 'Always cheaper to stand at the bar (comptoir) than sit at a table. Avoid tourist-trap cafés near major sights.', mapQuery: 'best cafe au lait Paris France' },
    { label: 'Louvre morning visit', emoji: '🎨', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=200&q=70', description: 'The world\'s largest art museum. Home to the Mona Lisa, Venus de Milo, and tens of thousands of works across 60,000 sq meters.', tip: 'Enter via the Richelieu wing to skip main pyramid crowds. Book timed entry online. Wednesday & Friday open until 9:45pm.', mapQuery: 'Musée du Louvre Paris' },
    { label: 'Gelato in Trastevere', emoji: '🍦', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&q=70', description: 'Wandering Rome\'s cobblestoned Trastevere neighborhood after dinner with a gelato is a rite of passage. The neighborhood stays lively late.', tip: 'Look for gelaterias with covered or metal tubs — mounded gelato in fluorescent colors is usually a tourist trap.', mapQuery: 'best gelato Trastevere Rome' },
    { label: 'Sunset from Sacré-Cœur', emoji: '🌅', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=200&q=70', description: 'The white-domed basilica sits atop Montmartre, Paris\'s highest hill. The steps facing the city are a gathering spot at golden hour with buskers and wine.', tip: 'Bring a bottle of wine from a nearby cave à vins. Arrive 30 min before sunset for a good spot on the steps.', mapQuery: 'Sacré-Cœur Basilica Paris' },
    { label: 'Aperitivo hour, Milan', emoji: '🍷', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&q=70', description: 'Milan\'s pre-dinner ritual: order a Campari Spritz or Negroni and the bar lays out a spread of free snacks — sometimes a full buffet.', tip: 'Navigli and Brera districts are the best areas. Goes from about 6–9pm. Budget €8–12 per drink including snacks.', mapQuery: 'aperitivo Navigli Milan Italy' },
    { label: 'Canal boat ride, Amsterdam', emoji: '🚤', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=200&q=70', description: 'Amsterdam\'s 165 canals are a UNESCO World Heritage Site. A boat tour or rented pedal boat gives a completely different perspective of the city.', tip: 'Rent a small open boat yourself (no license needed) from Boaty or Mokumboot for a self-guided experience.', mapQuery: 'canal boat tour Amsterdam Netherlands' },
    { label: 'Tapas bar crawl, Barcelona', emoji: '🥘', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=200&q=70', description: 'Barcelona\'s El Born and Barceloneta neighborhoods are packed with tapas bars. Patatas bravas, pan con tomate, jamón, and croquetas.', tip: 'Catalans eat late — don\'t show up before 9pm for dinner. El Xampanyet in El Born is a classic old-school spot.', mapQuery: 'tapas bars El Born Barcelona Spain' },
    { label: 'Day trip to Cinque Terre', emoji: '🏘️', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=200&q=70', description: 'Five colorful clifftop fishing villages connected by trails and a train along the Italian Riviera. Vernazza and Monterosso are fan favorites.', tip: 'Buy the Cinque Terre Card for trail access and train hops. Go mid-week in shoulder season to dodge the crowds.', mapQuery: 'Cinque Terre Italy' },
  ],
  beach:    [
    { label: 'Sunrise surf session', emoji: '🏄', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=200&q=70', description: 'Paddling out at dawn when the water is glassy and the beach is empty. Beginner-friendly beach breaks are a good start for first-timers.', tip: 'Rent a foam longboard if you\'re learning — much more forgiving. Take a lesson first for safety and faster progress.', mapQuery: 'surf lessons beach' },
    { label: 'Beachside fish tacos', emoji: '🌮', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=70', description: 'Battered or grilled fresh fish, slaw, crema, and salsa in a warm corn tortilla eaten steps from the water. A beach town staple.', tip: 'Look for the spot with the longest line of locals. Fresh-caught fish changes daily — ask what\'s in season.', mapQuery: 'fish tacos beachside' },
    { label: 'Sunset cliffside walk', emoji: '🌅', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=70', description: 'Coastal cliff paths at golden hour, with waves crashing below and the horizon on fire. One of those simple things that stays with you.', tip: 'Check tide charts — some cliff path sections can be slippery or inaccessible at high tide.', mapQuery: 'coastal cliff walk sunset' },
    { label: 'Rent a kayak', emoji: '🛶', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=200&q=70', description: 'Paddling sea caves, coves, and kelp beds from a sit-on-top kayak. A great way to see the coastline from a totally different angle.', tip: 'Morning is calmer — winds pick up in the afternoon. Wear a rash guard even in warm weather; you will get wet.', mapQuery: 'kayak rental beach' },
    { label: 'Frozen cocktail at beach bar', emoji: '🍹', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&q=70', description: 'Sandy feet, a frozen piña colada or mango daiquiri, and the sound of waves. Not sophisticated, completely perfect.', tip: 'The ones made with fresh fruit are worth the extra dollar. Beachfront bars often have happy hour 3–5pm.', mapQuery: 'beach bar cocktails' },
    { label: 'Whale watching tour', emoji: '🐋', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=200&q=70', description: 'Boat tours to spot humpbacks, blue whales, orcas, or dolphins depending on season and location. One of the most awe-inspiring wildlife encounters.', tip: 'Book with a naturalist-led tour for more educational context. Take Dramamine if you\'re prone to seasickness.', mapQuery: 'whale watching tour' },
  ],
  road:     [
    { label: 'Route 1 coastal stop', emoji: '🌊', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&q=70', description: 'California\'s Pacific Coast Highway hugs dramatic cliffs with pull-offs above the ocean. Big Sur is the crown jewel stretch.', tip: 'Pull over often — the best views are from the small turnouts, not the famous overlooks. Gas up in Carmel before heading south.', mapQuery: 'Pacific Coast Highway Route 1 Big Sur' },
    { label: 'Classic American diner', emoji: '🥞', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=70', description: 'Vinyl booths, bottomless coffee, egg platters, and pie under fluorescent lights. An American road trip institution.', tip: 'The best diners are in small towns, not highway exits. Look for ones that\'ve been open since the 50s or 60s.', mapQuery: 'classic American diner' },
    { label: 'Roadside fruit stand', emoji: '🍑', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&q=70', description: 'Farm-fresh peaches, cherries, or strawberries sold from a wooden stand on the side of a country road. Peak-season fruit is incomparable.', tip: 'Central Valley, CA and rural Georgia are legendary for roadside peaches in summer. Cash only is common.', mapQuery: 'roadside farm stand fruit' },
    { label: 'Scenic overlook photo', emoji: '🏔️', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&q=70', description: 'Pullouts with sweeping valley, canyon, or mountain views that put the scale of the landscape in perspective.', tip: 'The "famous" overlooks are always crowded. Drive a mile past them and look for unsigned turnouts for the same view with no people.', mapQuery: 'scenic overlook viewpoint' },
    { label: 'Night at a quirky motel', emoji: '🏨', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=200&q=70', description: 'Vintage neon signs, outdoor pools, and rooms that haven\'t changed since 1978. Part of the road trip character.', tip: 'Search "retro motel" or "vintage motor inn" on Google Maps. Many have been lovingly restored and are cheaper than chains.', mapQuery: 'vintage retro motel road trip' },
    { label: 'State park pit stop', emoji: '🌲', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=70', description: 'A quick detour into a state park for a short hike, a picnic, or just stretching your legs in a forest or meadow.', tip: 'America the Beautiful pass ($80/year) covers entrance to all national parks and many federal recreation areas.', mapQuery: 'state park day hike' },
    { label: 'Drive-in movie night', emoji: '🎬', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&q=70', description: 'One of America\'s last great retro experiences — pull in, tune your radio, and watch a double feature from your car under the stars.', tip: 'Only ~300 drive-ins remain in the US. Check DriveInMovie.com for locations. Bring blankets and arrive early for a good spot.', mapQuery: 'drive-in movie theater near me' },
  ],
  outdoors: [
    { label: 'Sunrise summit attempt', emoji: '🌄', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=70', description: 'Starting a hike at 3am by headlamp to reach the summit at first light. The solitude, the colors, and the sense of scale are worth every step.', tip: 'Check the AllTrails forecast the night before. Layers are essential — summit temps can be 20–30°F colder than the trailhead.', mapQuery: 'sunrise hike summit trail' },
    { label: 'Trailhead coffee stop', emoji: '☕', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=70', description: 'The tiny mountain town café or general store near the trailhead that fuels the first miles with fresh coffee and a breakfast sandwich.', tip: 'Many close early on weekdays. Check hours the night before or bring a good travel mug and make your own.', mapQuery: 'coffee cafe near trailhead' },
    { label: 'Camp under the stars', emoji: '🏕️', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&q=70', description: 'Waking up inside nature, cooking over a camp stove, and spending a night away from any light pollution. The sky at 2am is worth it.', tip: 'Recreation.gov books up fast for popular campgrounds. Search for dispersed camping on national forest land for a free, uncrowded alternative.', mapQuery: 'campground camping near me' },
    { label: 'Wildflower meadow loop', emoji: '🌸', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=200&q=70', description: 'A meadow in peak bloom — lupine, poppies, columbine — is a short-lived seasonal spectacle that feels genuinely magical.', tip: 'Bloom timing varies by 2–4 weeks year to year. Follow @TheWildflowerReport or local ranger station social feeds for real-time updates.', mapQuery: 'wildflower meadow hike' },
    { label: 'Waterfall side trail', emoji: '💦', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1433086966628-d6d9b0560f86?w=200&q=70', description: 'A short detour off the main trail to a falls — sometimes a trickle, sometimes a roaring curtain of water. Always worth the extra 20 minutes.', tip: 'Waterfalls are most impressive in spring snowmelt. Slippery rocks at the base — keep a safe distance and watch your step.', mapQuery: 'waterfall hike trail' },
    { label: 'Post-hike burger', emoji: '🍔', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70', description: 'After 10+ miles, a thick, greasy burger and cold beer at the nearest mountain town pub is one of life\'s great pleasures.', tip: 'Small mountain towns often have surprisingly great local burger joints. Ask the ranger station staff where they eat.', mapQuery: 'burger restaurant mountain town' },
  ],
  food:     [
    { label: 'Omakase splurge dinner', emoji: '🍣', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=200&q=70', description: 'A chef-led tasting menu where you eat whatever they decide to serve. Intimate counter seating, meticulous technique, and fish you\'ve never seen before.', tip: 'Book 1–2 months out for well-known spots. Mention any dietary restrictions when booking — omakase can accommodate more than you\'d expect.', mapQuery: 'omakase sushi restaurant' },
    { label: 'Farmers market morning', emoji: '🥦', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&q=70', description: 'Rows of seasonal produce, small-batch preserves, fresh bread, and local makers. A slow, sensory Saturday morning ritual.', tip: 'Arrive in the first hour for the best selection, last hour for the best deals. Bring cash and a tote bag.', mapQuery: 'farmers market weekend' },
    { label: 'Wine tasting afternoon', emoji: '🍷', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&q=70', description: 'Spending an afternoon moving between small tasting rooms, learning what you like, and eating cheese in a sunny vineyard.', tip: 'Smaller, family-owned wineries are friendlier and often cheaper than famous ones. Spit if you\'re driving between tastings.', mapQuery: 'wine tasting winery' },
    { label: 'Cooking class', emoji: '👨‍🍳', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&q=70', description: 'Learning a dish in someone\'s kitchen — a local chef\'s home, a culinary school, or a market cooking class. You eat what you make.', tip: 'Market-to-table classes in foreign cities are a great combined experience. Look for classes taught by locals, not hotel tour desks.', mapQuery: 'cooking class food experience' },
    { label: 'Michelin star lunch', emoji: '⭐', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=70', description: 'Michelin-starred restaurants often offer a significantly cheaper lunch set menu — the same kitchen and technique, more accessible price.', tip: 'The lunch tasting menu is typically 30–50% cheaper than dinner. Book at least 3–4 weeks out for starred spots.', mapQuery: 'Michelin star restaurant lunch menu' },
    { label: 'Late-night ramen', emoji: '🍜', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&q=70', description: 'Slurping a bowl of rich tonkotsu or shoyu ramen at a counter at midnight. The line is part of the experience.', tip: 'In Japan, Ippudo, Ichiran, and local spots in Fukuoka are institutions. In the US, find spots that make their broth in-house daily.', mapQuery: 'best ramen restaurant late night' },
  ],
  vietnam:  [
    { label: 'Pho bo for breakfast', emoji: '🍜', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200&q=70', description: 'A bowl of slow-simmered beef broth, rice noodles, and thin slices of beef eaten at a plastic stool on the sidewalk before 8am. The definitive Hanoi breakfast.', tip: 'Locals eat pho in the morning, not as a dinner. Ask your hotel for the nearest "pho ga" (chicken) or "pho bo" (beef) spot — avoid tourist street food strips.', mapQuery: 'pho restaurant Hanoi Vietnam' },
    { label: 'Banh mi from a street cart', emoji: '🥖', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1600628421060-049e5a3d3b68?w=200&q=70', description: 'A crispy French baguette stuffed with pâté, pickled daikon and carrot, cucumber, fresh herbs, and chili. The best sandwich in the world for $1.', tip: 'Banh Mi Phuong in Hoi An is legendary. In Saigon, look for carts near Ben Thanh market. Eat it immediately — it goes soggy fast.', mapQuery: 'banh mi street food Vietnam' },
    { label: 'Ha Long Bay cruise', emoji: '⛵', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=200&q=70', description: 'Thousands of limestone karsts rising from emerald water, explored by junk boat over 2–3 days. Kayaking into sea caves, floating villages, and sunsets from the deck.', tip: 'Book a mid-range or high-end cruise — cheap boats are overcrowded. Bhaya and Paradise Cruises are well-regarded. Go Nov–Mar for calmer weather.', mapQuery: 'Ha Long Bay cruise Vietnam' },
    { label: 'Old Quarter street wander, Hanoi', emoji: '🏮', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=200&q=70', description: 'Hanoi\'s 36-street Old Quarter is a dense, chaotic, beautiful maze of merchant streets each historically selling one trade. Silk Street, Silver Street, Paper Street.', tip: 'Rent a bicycle or just walk — motorbikes own the roads. Best explored in the evening when street food stalls set up and the lanterns come out.', mapQuery: 'Hanoi Old Quarter Vietnam' },
    { label: 'Hoi An lantern town at night', emoji: '🏮', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1540261491000-b9b34dd5d7c8?w=200&q=70', description: 'Hoi An\'s ancient town glows with hundreds of silk lanterns after dark. The Thu Bon riverside and silk streets become something truly magical.', tip: 'The 14th of each lunar month is Full Moon Festival — no motor vehicles in the old town, lanterns on the river. Worth timing your visit around it.', mapQuery: 'Hoi An Ancient Town night Vietnam' },
    { label: 'Motorbike through rice terraces', emoji: '🛵', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=70', description: 'Renting a semi-automatic Honda Win and riding the mountain loops around Sapa or Ha Giang. Terraced rice fields cascade down valley walls with almost no traffic.', tip: 'Ha Giang loop is harder and more rewarding than Sapa. Hire a local "Easy Rider" guide if you\'re not an experienced rider. September–October = golden rice season.', mapQuery: 'Ha Giang loop motorbike Vietnam' },
    { label: 'Cooking class in Hoi An', emoji: '👨‍🍳', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&q=70', description: 'Start at the market picking herbs and vegetables, then learn to make fresh spring rolls, cao lau noodles, and white rose dumplings at a riverside kitchen.', tip: 'Morning market + cooking combo classes are best. Red Bridge and The Field Restaurant both have excellent setups. Book a day ahead.', mapQuery: 'cooking class Hoi An Vietnam' },
    { label: 'Egg coffee, Hanoi', emoji: '☕', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=70', description: 'Ca phe trung: strong Vietnamese robusta espresso topped with a thick, sweet foam whipped from egg yolks, sugar, and condensed milk. Strange and addictive.', tip: 'Café Giang in Hanoi\'s Old Quarter invented it in 1946 and is still the best. Drink it sitting on a tiny stool upstairs by the window.', mapQuery: 'Cafe Giang egg coffee Hanoi' },
  ],
  generic:  [
    { label: 'Best local coffee spot', emoji: '☕', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=70', description: 'Every city has that one independent café that regulars swear by — great espresso, good vibes, and a window seat worth lingering in.', tip: 'Ask hotel staff or locals (not Google) for the non-chain, non-tourist spot. Often in residential neighborhoods.', mapQuery: 'best local independent coffee cafe' },
    { label: 'Hidden gem restaurant', emoji: '🍽️', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=70', description: 'The place with no sign, no website, and a line down the block at noon. Usually family-run, cash only, and absolutely worth it.', tip: 'Ask your Airbnb host or a local barista. The best recommendations are always word of mouth.', mapQuery: 'hidden gem local restaurant' },
    { label: 'Rooftop sunset bar', emoji: '🌆', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&q=70', description: 'A rooftop with a view, a cocktail menu, and a golden hour skyline. The perfect way to end a day of exploring.', tip: 'Most rooftop bars have a dress code and require reservations after 5pm. Book in advance on weekends.', mapQuery: 'rooftop bar sunset view' },
    { label: 'Local market morning', emoji: '🛍️', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&q=70', description: 'Flea markets, antique halls, and weekend bazaars offer a window into local culture that no museum can replicate.', tip: 'Bring cash and be ready to negotiate on bigger items. Arrive early for best finds; late for price drops.', mapQuery: 'local market flea market weekend' },
    { label: 'Walking tour of old town', emoji: '🗺️', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=200&q=70', description: 'A free walking tour through the historic center with a knowledgeable local guide who knows the stories behind every street.', tip: 'Free walking tours run on tips — give generously for a great guide. Check Freetour.com or SANDEMANs for reputable options.', mapQuery: 'free walking tour old town historic center' },
    { label: 'Photography walk', emoji: '📸', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=200&q=70', description: 'Slowing down to notice light, texture, and composition changes how you experience a place. Even a phone camera is enough.', tip: 'The hour after sunrise and before sunset (golden hour) transforms ordinary streets into something cinematic.', mapQuery: 'photography walk neighborhood' },
    { label: 'Cozy stay option', emoji: '🏨', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=200&q=70', description: 'A boutique hotel, converted farmhouse, or design-led guesthouse where the accommodation itself is part of the experience.', tip: 'Search "boutique hotel" + destination on Google Maps and read recent reviews. Small properties care more about your experience.', mapQuery: 'boutique hotel cozy stay' },
    { label: 'Bookshop browse', emoji: '📚', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=70', description: 'Independent bookshops with strong local curation, reading nooks, and staff picks are disappearing — worth seeking out wherever you go.', tip: 'Great ones: Shakespeare & Company (Paris), Powell\'s (Portland), Daunt Books (London), City Lights (SF). Ask locals for their favorite.', mapQuery: 'independent bookshop bookstore' },
  ],
};

const SUGGESTION_THEME_KEYS = {
  japan:    ['japan', 'tokyo', 'kyoto', 'osaka', 'sushi', 'ramen', 'sakura', 'onsen', 'teamlab'],
  vietnam:  ['vietnam', 'hanoi', 'saigon', 'ho chi minh', 'hoi an', 'da nang', 'pho', 'banh mi', 'halong', 'ha long', 'mekong', 'hue', 'sapa', 'ha giang'],
  europe:   ['paris', 'france', 'italy', 'rome', 'barcelona', 'spain', 'london', 'amsterdam', 'europe', 'gelato'],
  beach:    ['beach', 'surf', 'ocean', 'coast', 'hawaii', 'bali', 'caribbean', 'island'],
  road:     ['road trip', 'drive', 'pch', 'highway', 'roadtrip', 'coast highway'],
  outdoors: ['hike', 'trail', 'camp', 'mountain', 'patagonia', 'trek', 'national park', 'summit'],
  food:     ['omakase', 'restaurant', 'dining', 'foodie', 'michelin', 'tasting', 'brunch'],
};

const SUGGESTION_PILLS = [
  { key: 'coffee',   emoji: '☕',  label: 'Coffee',     type: 'cafe',               categoryId: 'food',        queries: ['best coffee shop', 'local coffee roaster', 'specialty coffee', 'best café'] },
  { key: 'food',     emoji: '🍽',  label: 'Food',       type: 'restaurant',         categoryId: 'food',        queries: ['best local restaurant', 'top rated restaurant', 'hidden gem restaurant', 'popular local dining'] },
  { key: 'drinks',   emoji: '🍸',  label: 'Drinks',     type: 'bar',                categoryId: 'food',        queries: ['best cocktail bar', 'craft beer bar', 'best wine bar', 'rooftop drinks'] },
  { key: 'dessert',  emoji: '🍰',  label: 'Dessert',    type: 'restaurant',         categoryId: 'food',        queries: ['best dessert place', 'best ice cream', 'best patisserie', 'best gelato'] },
  { key: 'bakery',   emoji: '🥐',  label: 'Bakery',     type: 'bakery',             categoryId: 'food',        queries: ['best bakery', 'artisan bakery', 'best sourdough bread', 'pastry shop'] },
  { key: 'shopping', emoji: '🛍',  label: 'Shopping',   type: 'store',              categoryId: 'places',      queries: ['best boutique shops', 'local independent stores', 'vintage shops', 'best shopping street'] },
  { key: 'sights',   emoji: '🏛',  label: 'Sights',     type: 'tourist_attraction', categoryId: 'places',      queries: ['must see landmark', 'best local attraction', 'historic site', 'popular museum'] },
  { key: 'outdoors', emoji: '🌿',  label: 'Outdoors',   type: 'park',               categoryId: 'experiences', queries: ['best park', 'nature walk trail', 'best garden', 'scenic outdoor space'] },
  { key: 'photo',    emoji: '📸',  label: 'Photo spot', type: 'tourist_attraction', categoryId: 'places',      queries: ['best photo spot', 'best scenic viewpoint', 'best street art mural', 'most scenic location'] },
  { key: 'market',   emoji: '🛒',  label: 'Market',     type: 'store',              categoryId: 'places',      queries: ['local farmers market', 'best food market', 'artisan market', 'best food hall'] },
];

const LIVE_SUGGESTION_CATEGORIES = {
  generic: [
    { key: 'coffee', label: 'Coffee nearby', query: 'best coffee', type: 'cafe', emoji: '☕', categoryId: 'food' },
    { key: 'breakfast', label: 'Breakfast nearby', query: 'best breakfast', type: 'restaurant', emoji: '🥐', categoryId: 'food' },
    { key: 'dessert', label: 'Dessert nearby', query: 'best dessert', type: 'restaurant', emoji: '🍨', categoryId: 'food' },
    { key: 'photo', label: 'Photo spot nearby', query: 'best scenic viewpoint', type: 'tourist_attraction', emoji: '📸', categoryId: 'places' },
    { key: 'walk', label: 'Easy walk nearby', query: 'best easy walk', type: 'tourist_attraction', emoji: '🌿', categoryId: 'experiences' },
  ],
  japan: [
    { key: 'coffee', label: 'Coffee nearby', query: 'best coffee', type: 'cafe', emoji: '☕', categoryId: 'food' },
    { key: 'ramen', label: 'Ramen nearby', query: 'best ramen', type: 'restaurant', emoji: '🍜', categoryId: 'food' },
    { key: 'dessert', label: 'Dessert nearby', query: 'best matcha dessert', type: 'restaurant', emoji: '🍡', categoryId: 'food' },
    { key: 'temple', label: 'Temple stop nearby', query: 'best temple', type: 'tourist_attraction', emoji: '⛩️', categoryId: 'places' },
    { key: 'view', label: 'Viewpoint nearby', query: 'best viewpoint', type: 'tourist_attraction', emoji: '🌆', categoryId: 'places' },
  ],
  beach: [
    { key: 'coffee', label: 'Coffee nearby', query: 'best coffee', type: 'cafe', emoji: '☕', categoryId: 'food' },
    { key: 'fish', label: 'Seafood nearby', query: 'best seafood', type: 'restaurant', emoji: '🐟', categoryId: 'food' },
    { key: 'dessert', label: 'Sweet stop nearby', query: 'best ice cream', type: 'restaurant', emoji: '🍦', categoryId: 'food' },
    { key: 'view', label: 'Sunset spot nearby', query: 'best sunset viewpoint', type: 'tourist_attraction', emoji: '🌅', categoryId: 'places' },
    { key: 'walk', label: 'Beach walk nearby', query: 'best beach walk', type: 'tourist_attraction', emoji: '🏖️', categoryId: 'experiences' },
  ],
  road: [
    { key: 'coffee', label: 'Coffee nearby', query: 'best coffee', type: 'cafe', emoji: '☕', categoryId: 'food' },
    { key: 'diner', label: 'Classic stop nearby', query: 'best diner', type: 'restaurant', emoji: '🥞', categoryId: 'food' },
    { key: 'view', label: 'Scenic stop nearby', query: 'best scenic overlook', type: 'tourist_attraction', emoji: '🏞️', categoryId: 'places' },
    { key: 'dessert', label: 'Treat nearby', query: 'best bakery', type: 'bakery', emoji: '🍪', categoryId: 'food' },
    { key: 'walk', label: 'Stretch-your-legs stop', query: 'best park', type: 'park', emoji: '🌲', categoryId: 'experiences' },
  ],
  outdoors: [
    { key: 'coffee', label: 'Trail coffee nearby', query: 'best coffee', type: 'cafe', emoji: '☕', categoryId: 'food' },
    { key: 'breakfast', label: 'Breakfast nearby', query: 'best breakfast', type: 'restaurant', emoji: '🥯', categoryId: 'food' },
    { key: 'view', label: 'Viewpoint nearby', query: 'best viewpoint', type: 'tourist_attraction', emoji: '🏔️', categoryId: 'places' },
    { key: 'walk', label: 'Short hike nearby', query: 'best short hike', type: 'tourist_attraction', emoji: '🥾', categoryId: 'experiences' },
    { key: 'water', label: 'Waterfall nearby', query: 'best waterfall', type: 'tourist_attraction', emoji: '💦', categoryId: 'places' },
  ],
  food: [
    { key: 'coffee', label: 'Coffee nearby', query: 'best coffee', type: 'cafe', emoji: '☕', categoryId: 'food' },
    { key: 'bakery', label: 'Bakery nearby', query: 'best bakery', type: 'bakery', emoji: '🥐', categoryId: 'food' },
    { key: 'cocktail', label: 'Cocktail nearby', query: 'best cocktail bar', type: 'bar', emoji: '🍸', categoryId: 'food' },
    { key: 'dessert', label: 'Dessert nearby', query: 'best dessert', type: 'restaurant', emoji: '🍰', categoryId: 'food' },
    { key: 'market', label: 'Market nearby', query: 'best food market', type: 'tourist_attraction', emoji: '🛍️', categoryId: 'places' },
  ],
};

function detectSuggestionTheme(chapter, chapterPins) {
  const haystack = [chapter.title, ...chapterPins.map(p => `${p.label || ''} ${p.text || ''}`)].join(' ').toLowerCase();
  for (const [theme, kws] of Object.entries(SUGGESTION_THEME_KEYS)) {
    if (kws.some(kw => haystack.includes(kw))) return theme;
  }
  return 'generic';
}

function normalizeSuggestionText(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const WEAK_ANCHOR_TERMS = [
  'trip',
  'vacation',
  'holiday',
  'weekend',
  'spring',
  'summer',
  'fall',
  'autumn',
  'winter',
  'plan',
  'planning',
  'someday',
];

function getSuggestionSearchText(chapter, chapterPins) {
  return [
    chapter?.title,
    chapter?.public_title,
    Array.isArray(chapter?.public_tags) ? chapter.public_tags.join(' ') : '',
    ...chapterPins.flatMap((pin) => [
      pin?.mapQuery,
      pin?.label,
      pin?.text,
      pin?.description,
    ]),
  ].join(' ').toLowerCase();
}

function inferDisneyDestinationContext(chapter, chapterPins) {
  const haystack = getSuggestionSearchText(chapter, chapterPins);
  const hasAnaheimSignals = ['anaheim', 'disneyland', 'california adventure', 'dca', 'orange county', 'southern california'].some((term) => haystack.includes(term));
  const hasOrlandoSignals = ['orlando', 'florida', 'disney world', 'magic kingdom', 'epcot', 'hollywood studios', 'animal kingdom', 'lake buena vista'].some((term) => haystack.includes(term));

  if (hasAnaheimSignals && !hasOrlandoSignals) {
    return {
      mode: 'anaheim',
      forcedAnchors: ['Disneyland Anaheim California', 'Anaheim California'],
    };
  }
  if (hasOrlandoSignals && !hasAnaheimSignals) {
    return {
      mode: 'orlando',
      forcedAnchors: ['Walt Disney World Orlando Florida', 'Orlando Florida'],
    };
  }
  return { mode: null, forcedAnchors: [] };
}

function scoreAnchorCandidate(value, disneyContext) {
  const raw = String(value || '').trim();
  const normalized = normalizeSuggestionText(raw);
  if (!normalized || normalized.length < 4) return -Infinity;

  const words = normalized.split(' ').filter(Boolean);
  let score = 0;

  if (words.length >= 2) score += 4;
  if (/[,-]/.test(raw)) score += 2;
  if (/\b(in|at|near)\b/i.test(raw)) score += 1;
  if (words.length > 8) score -= 10;
  if (words.length > 12) score -= 20;
  if (WEAK_ANCHOR_TERMS.some((term) => normalized.includes(term))) score -= 6;
  if (/\b(best|hidden gem|walking tour|cooking class|lantern town|egg coffee|breakfast|brunch|coffee|bar|restaurant|bakery|dessert|market)\b/i.test(raw)) score -= 8;

  const hasDisney = normalized.includes('disney');
  const hasAnaheim = ['anaheim', 'disneyland', 'california adventure', 'orange county'].some((term) => normalized.includes(term));
  const hasOrlando = ['orlando', 'florida', 'disney world', 'magic kingdom', 'epcot', 'lake buena vista'].some((term) => normalized.includes(term));

  if (hasAnaheim) score += 14;
  if (hasOrlando) score += 14;
  if (hasDisney && !hasAnaheim && !hasOrlando) score -= 10;

  if (disneyContext?.mode === 'anaheim') {
    if (hasAnaheim) score += 24;
    if (hasOrlando) score -= 40;
    if (normalized === 'disney' || normalized.endsWith(' disney trip')) score -= 20;
  } else if (disneyContext?.mode === 'orlando') {
    if (hasOrlando) score += 24;
    if (hasAnaheim) score -= 40;
    if (normalized === 'disney' || normalized.endsWith(' disney trip')) score -= 20;
  }

  return score;
}

function getLiveSuggestionCategories(chapter, chapterPins, refreshCount = 0) {
  const theme = detectSuggestionTheme(chapter, chapterPins);
  const pool = LIVE_SUGGESTION_CATEGORIES[theme] || LIVE_SUGGESTION_CATEGORIES.generic;
  const offset = refreshCount % pool.length;
  return [...pool.slice(offset), ...pool.slice(0, offset)];
}

function inferChapterAnchorCandidates(chapter, chapterPins) {
  const disneyContext = inferDisneyDestinationContext(chapter, chapterPins);
  const values = [
    ...disneyContext.forcedAnchors.map((value) => ({ value, bonus: 60 })),
    { value: chapter?.title, bonus: 35 },
    { value: chapter?.public_title, bonus: 35 },
    ...(Array.isArray(chapter?.public_tags) ? chapter.public_tags.map((value) => ({ value, bonus: 28 })) : []),
    ...chapterPins.flatMap((pin) => ([
      { value: pin?.mapQuery, bonus: 55 },
      { value: pin?.address, bonus: 45 },
      { value: pin?.location, bonus: 40 },
      { value: pin?.label, bonus: 12 },
      { value: pin?.text, bonus: 8 },
    ])),
  ]
    .map(({ value, bonus = 0 }) => ({
      value: String(value || '').trim(),
      bonus,
    }))
    .filter(({ value }) => Boolean(value));

  const seen = new Set();
  return values
    .map(({ value, bonus }) => ({
      value,
      normalized: normalizeSuggestionText(value),
      score: scoreAnchorCandidate(value, disneyContext) + Number(bonus || 0),
    }))
    .filter(({ normalized, score }) => {
      if (!normalized || score === -Infinity) return false;
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return score > -12;
    })
    .sort((a, b) => b.score - a.score || b.value.length - a.value.length)
    .map(({ value }) => value)
    .filter((value) => {
      const normalized = normalizeSuggestionText(value);
      if (!normalized || normalized.length < 4) return false;
      return true;
    })
    .slice(0, 6);
}

function buildPlaceSuggestionTip(result, anchor, category) {
  const rating = Number(result?.rating || 0);
  const reviewCount = Number(result?.user_ratings_total || 0);
  if (rating > 0 && reviewCount > 0) {
    return `Google-rated ${rating.toFixed(1)} with ${reviewCount.toLocaleString()} reviews near ${anchor}.`;
  }
  return `${category.label} near ${anchor}.`;
}

function buildPlaceSuggestionWhy(result, anchor, category) {
  const area = result?.formatted_address || result?.vicinity || anchor;
  const rating = Number(result?.rating || 0);
  if (rating >= 4.5) {
    return `A standout ${category.label.toLowerCase()} option around ${area} with especially strong ratings.`;
  }
  return `An easy ${category.label.toLowerCase()} option that keeps you close to ${area}.`;
}

function buildLiveSuggestionQueryVariants(category, anchor) {
  const safeAnchor = String(anchor || '').trim();
  const safeQuery = String(category?.query || '').trim();
  const variants = [
    `${safeQuery} near ${safeAnchor}`.trim(),
    `${safeAnchor} ${safeQuery}`.trim(),
    `${safeQuery} ${safeAnchor}`.trim(),
    safeAnchor,
  ].filter(Boolean);

  const seen = new Set();
  return variants.filter((value) => {
    const normalized = normalizeSuggestionText(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function buildNearbySearchKeywords(category) {
  const key = String(category?.key || '').trim().toLowerCase();
  const type = String(category?.type || '').trim().toLowerCase();
  const query = String(category?.query || '').trim().toLowerCase();

  const byKey = {
    coffee: ['coffee', 'cafe'],
    breakfast: ['breakfast', 'brunch'],
    dessert: ['dessert', 'ice cream', 'gelato', 'bakery'],
    bakery: ['bakery', 'pastry'],
    food: ['restaurant', 'food'],
    drinks: ['bar', 'cocktail bar', 'wine bar'],
    cocktail: ['cocktail bar', 'bar'],
    ramen: ['ramen', 'noodles'],
    fish: ['seafood', 'restaurant'],
    diner: ['diner', 'restaurant'],
    market: ['market', 'food hall'],
    temple: ['temple', 'shrine'],
    view: ['viewpoint', 'scenic'],
    photo: ['photo spot', 'viewpoint', 'landmark'],
    walk: ['park', 'walk', 'garden'],
    water: ['waterfall', 'park'],
    outdoors: ['park', 'garden'],
    sights: ['landmark', 'museum', 'attraction'],
    shopping: ['shopping', 'boutique', 'store'],
  };

  const candidates = [
    ...(byKey[key] || []),
    type === 'cafe' ? 'coffee' : '',
    type === 'bar' ? 'bar' : '',
    type === 'bakery' ? 'bakery' : '',
    type === 'park' ? 'park' : '',
    type === 'store' ? 'store' : '',
    type === 'restaurant' ? 'restaurant' : '',
    type === 'tourist_attraction' ? 'attraction' : '',
    query,
  ].filter(Boolean);

  const seen = new Set();
  return candidates.filter((value) => {
    const normalized = normalizeSuggestionText(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

const LOCAL_BUSINESS_FALLBACK_TYPES = [
  { key: 'coffee-fallback', label: 'Coffee nearby', query: 'coffee', type: 'cafe', emoji: '☕', categoryId: 'food' },
  { key: 'food-fallback', label: 'Restaurant nearby', query: 'restaurant', type: 'restaurant', emoji: '🍽️', categoryId: 'food' },
  { key: 'drinks-fallback', label: 'Bar nearby', query: 'bar', type: 'bar', emoji: '🍸', categoryId: 'food' },
  { key: 'bakery-fallback', label: 'Bakery nearby', query: 'bakery', type: 'bakery', emoji: '🥐', categoryId: 'food' },
];

const DEFAULT_LOCAL_SUGGESTION_CATEGORIES = [
  { key: 'coffee', label: 'Coffee nearby', query: 'coffee', type: 'cafe', emoji: '☕', categoryId: 'food' },
  { key: 'food', label: 'Restaurant nearby', query: 'restaurant', type: 'restaurant', emoji: '🍽️', categoryId: 'food' },
  { key: 'drinks', label: 'Bar nearby', query: 'bar', type: 'bar', emoji: '🍸', categoryId: 'food' },
  { key: 'bakery', label: 'Bakery nearby', query: 'bakery', type: 'bakery', emoji: '🥐', categoryId: 'food' },
  { key: 'dessert', label: 'Dessert nearby', query: 'dessert', type: 'restaurant', emoji: '🍨', categoryId: 'food' },
];

async function resolveSuggestionAnchorLocations(anchors = [], limit = 4) {
  const resolved = [];
  const seenAddresses = new Set();
  for (const anchor of anchors) {
    if (resolved.length >= limit) break;
    const trimmed = String(anchor || '').trim();
    if (!trimmed) continue;
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(trimmed)}`);
      if (!res.ok) continue;
      const data = await res.json();
      const result = Array.isArray(data?.results) ? data.results[0] : null;
      const lat = Number(result?.geometry?.location?.lat);
      const lng = Number(result?.geometry?.location?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const formattedAddress = String(result?.formatted_address || trimmed).trim();
      const normalizedAddress = normalizeSuggestionText(formattedAddress);
      if (!normalizedAddress || seenAddresses.has(normalizedAddress)) continue;
      seenAddresses.add(normalizedAddress);
      resolved.push({
        anchor: trimmed,
        lat,
        lng,
        formattedAddress,
      });
    } catch {
      // try next anchor
    }
  }
  return resolved;
}

function generateSuggestions(chapter, chapterPins, seed = 0) {
  const theme = detectSuggestionTheme(chapter, chapterPins);
  const pool = theme === 'generic'
    ? [...SUGGESTION_POOL.generic]
    : [...(SUGGESTION_POOL[theme] || []), ...SUGGESTION_POOL.generic];
  const existingLabels = new Set(chapterPins.map(p => (p.label || p.text || '').toLowerCase()));
  const available = pool.filter(s => !existingLabels.has(s.label.toLowerCase()));
  // deterministic shuffle with seed so rotation changes on reopen
  const shuffled = [...available].sort((a, b) => {
    const ha = ((seed * 31 + 7) ^ (a.label.charCodeAt(0) || 0)) % 97;
    const hb = ((seed * 31 + 7) ^ (b.label.charCodeAt(0) || 0)) % 97;
    return ha - hb;
  });
  return shuffled.slice(0, 3).map((s, i) => ({
    ...s,
    id: `sug-${s.label.replace(/\s+/g, '-').toLowerCase()}`,
    rot: (((seed + i * 7) % 11) - 5) * 0.55,
  }));
}

// ─── Suggestion Strip ─────────────────────────────────────────────────────────
function SuggestionCardInner({ s, darkMode, shadow }) {
  const cardBg = darkMode ? '#e2e8f0' : '#ffffff';
  return (
    <div style={{ background: cardBg, padding: '6px 6px 0', width: 120, borderRadius: 2, boxShadow: shadow, position: 'relative' }}>
      <Pushpin colorKey="teal" darkMode={false} />
      <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 1, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>
        {s.imageUrl
          ? <img src={s.imageUrl} alt={s.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} draggable={false} />
          : s.emoji}
      </div>
      <div style={{ padding: '5px 3px 7px', textAlign: 'center', fontFamily: CAVEAT, fontSize: 13, color: '#1a1a2e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.label}</div>
    </div>
  );
}

function SuggestionPreviewSheet({ suggestion, onClose, onAdd, darkMode }) {
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  const sheetBg = darkMode ? '#131c2e' : '#ffffff';
  const tp = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts = darkMode ? '#64748b' : '#9ca3af';
  const divider = darkMode ? 'rgba(255,255,255,0.07)' : '#f0ece4';
  const mapsUrl = suggestion?.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion.mapQuery)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suggestion?.label || '')}`;

  if (!suggestion) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10045, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', maxHeight: '88dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', ...sheetStyle }}>
        <div {...handleProps} style={{ padding: '14px 0 0', display: 'flex', justifyContent: 'center', ...handleProps.style }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        </div>

        {suggestion.imageUrl && (
          <div style={{ width: '100%', height: 210, overflow: 'hidden', position: 'relative' }}>
            <img src={suggestion.imageUrl} alt={suggestion.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.48))' }} />
          </div>
        )}

        <div style={{ padding: '18px 18px max(32px, calc(env(safe-area-inset-bottom) + 32px))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, color: '#5eadce', textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 4px', fontWeight: 700 }}>
                {suggestion.categoryId || 'experience'}
              </p>
              <h2 style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: 0, lineHeight: 1.1 }}>
                {suggestion.emoji ? `${suggestion.emoji} ${suggestion.label}` : suggestion.label}
              </h2>
            </div>
            <button onClick={onClose} style={{ flexShrink: 0, background: darkMode ? 'rgba(255,255,255,0.06)' : '#f5f3ee', border: 'none', borderRadius: '50%', width: 32, height: 32, color: ts, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <p style={{ fontSize: 10, color: '#5eadce', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 6px' }}>Why go</p>
              <p style={{ fontSize: 14, color: tp, lineHeight: 1.6, margin: 0 }}>{suggestion.whyItFits || suggestion.tip || 'A nice nearby pick to round out the trip.'}</p>
            </div>

            {suggestion.description && (
              <div style={{ borderTop: `1px solid ${divider}`, paddingTop: 14 }}>
                <p style={{ fontSize: 10, color: '#5eadce', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 6px' }}>What it is</p>
                <p style={{ fontSize: 14, color: tp, lineHeight: 1.6, margin: 0 }}>{suggestion.description}</p>
              </div>
            )}

            {suggestion.tip && suggestion.tip !== suggestion.whyItFits && (
              <div style={{ background: darkMode ? 'rgba(45,212,191,0.08)' : '#f0fdfb', border: `1px solid ${darkMode ? 'rgba(45,212,191,0.2)' : 'rgba(45,212,191,0.3)'}`, borderRadius: 12, padding: '10px 14px' }}>
                <p style={{ fontSize: 10, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 4px' }}>Good to know</p>
                <p style={{ fontSize: 13, color: tp, lineHeight: 1.55, margin: 0 }}>{suggestion.tip}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            <button
              onClick={() => { onAdd?.(suggestion); onClose(); }}
              style={{ padding: '13px', borderRadius: 14, background: '#2dd4bf', color: '#0a1020', border: 'none', fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
            >
              Add to chapter
            </button>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px', borderRadius: 14, background: '#5eadce', color: '#fff', textDecoration: 'none', fontFamily: CAVEAT, fontSize: 17, fontWeight: 700 }}>
              🗺️ Find on Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ s, onAdd, onOpenDetails, darkMode }) {
  return (
    <div
      draggable
      style={{ flexShrink: 0, position: 'relative', cursor: 'pointer', userSelect: 'none' }}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(s));
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <button
        type="button"
        onClick={() => onOpenDetails?.(s)}
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <div style={{ transform: `rotate(${s.rot}deg)` }}>
          <SuggestionCardInner s={s} darkMode={darkMode} shadow="2px 3px 10px rgba(0,0,0,0.14)" />
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAdd(s); }}
        style={{ position: 'absolute', bottom: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#2dd4bf', border: '2px solid white', color: '#0a1020', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, zIndex: 5, boxShadow: '0 2px 6px rgba(45,212,191,0.4)' }}
      >
        +
      </button>
    </div>
  );
}

function SuggestionStrip({ chapter, chapterPins, initialSeed, onAdd, darkMode }) {
  const [addedIds, setAddedIds] = useState(new Set());
  const [refreshCount, setRefreshCount] = useState(0);
  const [activePillKey, setActivePillKey] = useState(null);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [loadingLiveSuggestions, setLoadingLiveSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const pinLabelKey = chapterPins.map(p => (p.label || p.text || '').toLowerCase()).join('\x00');
  const suggestions = liveSuggestions;
  const visible = suggestions.filter(s => !addedIds.has(s.id)).slice(0, 3);
  const ts = darkMode ? '#64748b' : '#9ca3af';

  function handlePillClick(pillKey) {
    const next = activePillKey === pillKey ? null : pillKey;
    setActivePillKey(next);
    setLiveSuggestions([]);
    setAddedIds(new Set());
    setRefreshCount(0);
  }

  useEffect(() => {
    let cancelled = false;
    const existingLabels = new Set(chapterPins.map((pin) => normalizeSuggestionText(pin.label || pin.text || '')));
    const anchorCandidates = inferChapterAnchorCandidates(chapter, chapterPins);

    // Extend anchors with pin labels for variety; cycle starting point on refresh
    const pinLabelAnchors = chapterPins.map(p => (p.label || p.text || '').trim()).filter(a => a.length > 3);
    const extendedAnchors = [...anchorCandidates, ...pinLabelAnchors];
    const anchorOffset = extendedAnchors.length > 1 ? (refreshCount % extendedAnchors.length) : 0;
    const orderedAnchors = extendedAnchors.length > 0
      ? [...extendedAnchors.slice(anchorOffset), ...extendedAnchors.slice(0, anchorOffset)]
      : [];

    if (orderedAnchors.length === 0) {
      setLiveSuggestions([]);
      setLoadingLiveSuggestions(false);
      return undefined;
    }

    // Build category list: pill-specific (3 query variations) or theme-based rotation
    const activePill = SUGGESTION_PILLS.find(p => p.key === activePillKey);
    const categoriesToUse = activePill
      ? [0, 1, 2].map(slot => ({
          key: `${activePill.key}-${slot}`,
          label: `${activePill.label} nearby`,
          query: activePill.queries[(refreshCount + slot) % activePill.queries.length],
          type: activePill.type,
          emoji: activePill.emoji,
          categoryId: activePill.categoryId,
        }))
      : (() => {
          const offset = refreshCount % DEFAULT_LOCAL_SUGGESTION_CATEGORIES.length;
          return [
            ...DEFAULT_LOCAL_SUGGESTION_CATEGORIES.slice(offset),
            ...DEFAULT_LOCAL_SUGGESTION_CATEGORIES.slice(0, offset),
          ];
        })();

    const loadNearbySuggestions = async () => {
      setLoadingLiveSuggestions(true);
      try {
        const found = [];
        const seenPlaces = new Set();
        const resolvedAnchorLocations = await resolveSuggestionAnchorLocations(orderedAnchors);
        const buildSuggestionFromPlace = (result, category, resolvedAnchorLocation, indexOffset = 0) => {
          const placeName = normalizeSuggestionText(result?.name || '');
          const placeKey = String(result?.place_id || placeName);
          if (!placeName || existingLabels.has(placeName) || seenPlaces.has(placeKey)) return null;
          seenPlaces.add(placeKey);
          const photoRef = result?.photos?.[0]?.photo_reference;
          return {
            id: `live-${category.key}-${placeKey}`,
            label: result.name,
            emoji: category.emoji,
            categoryId: category.categoryId,
            imageUrl: photoRef ? `/api/places?action=photo&ref=${encodeURIComponent(photoRef)}&maxwidth=800` : '',
            description: `${result.formatted_address || result.vicinity || ''}`.trim() || `${category.label} near ${resolvedAnchorLocation?.formattedAddress || resolvedAnchorLocation?.anchor || ''}.`,
            tip: buildPlaceSuggestionTip(result, resolvedAnchorLocation?.anchor || '', category),
            whyItFits: buildPlaceSuggestionWhy(result, resolvedAnchorLocation?.anchor || '', category),
            mapQuery: `${result.name} ${result.formatted_address || result.vicinity || resolvedAnchorLocation?.formattedAddress || resolvedAnchorLocation?.anchor || ''}`.trim(),
            rot: (((initialSeed + (found.length + indexOffset) * 7 + refreshCount) % 11) - 5) * 0.55,
          };
        };

        for (const category of categoriesToUse) {
          if (found.length >= 3) break;
          let matched = null;

          if (resolvedAnchorLocations.length > 0) {
            for (const resolvedAnchorLocation of resolvedAnchorLocations) {
              try {
                const nearbyKeywords = buildNearbySearchKeywords(category);
                for (const keyword of nearbyKeywords) {
                  const nearbyRes = await fetch(
                    `/api/places?lat=${encodeURIComponent(resolvedAnchorLocation.lat)}&lng=${encodeURIComponent(resolvedAnchorLocation.lng)}&query=${encodeURIComponent(keyword)}&type=${encodeURIComponent(category.type)}&radius=12000`
                  );
                  if (!nearbyRes.ok) continue;
                  const nearbyData = await nearbyRes.json();
                  const nearbyResult = (nearbyData.results || []).find((item) => {
                    const placeName = normalizeSuggestionText(item?.name || '');
                    const placeKey = String(item?.place_id || placeName);
                    return placeName && !existingLabels.has(placeName) && !seenPlaces.has(placeKey);
                  });
                  if (!nearbyResult) continue;

                  const placeName = normalizeSuggestionText(nearbyResult?.name || '');
                  const placeKey = String(nearbyResult?.place_id || placeName);
                  seenPlaces.add(placeKey);
                  const photoRef = nearbyResult?.photos?.[0]?.photo_reference;
                  matched = {
                    id: `live-${category.key}-${placeKey}`,
                    label: nearbyResult.name,
                    emoji: category.emoji,
                    categoryId: category.categoryId,
                    imageUrl: photoRef ? `/api/places?action=photo&ref=${encodeURIComponent(photoRef)}&maxwidth=800` : '',
                    description: `${nearbyResult.formatted_address || nearbyResult.vicinity || ''}`.trim() || `${category.label} near ${resolvedAnchorLocation.formattedAddress}.`,
                    tip: buildPlaceSuggestionTip(nearbyResult, resolvedAnchorLocation.anchor, category),
                    whyItFits: buildPlaceSuggestionWhy(nearbyResult, resolvedAnchorLocation.anchor, category),
                    mapQuery: `${nearbyResult.name} ${nearbyResult.formatted_address || nearbyResult.vicinity || resolvedAnchorLocation.formattedAddress}`.trim(),
                    rot: (((initialSeed + found.length * 7 + refreshCount) % 11) - 5) * 0.55,
                  };
                  break;
                }
                if (matched) break;
              } catch {
                // try next resolved anchor
              }
            }
            if (matched) {
              found.push(matched);
              continue;
            }
          }

          if (!matched) {
            for (const anchor of orderedAnchors) {
              try {
                const queryVariants = buildLiveSuggestionQueryVariants(category, anchor);
                for (const q of queryVariants) {
                  const res = await fetch(`/api/places?action=textsearch&query=${encodeURIComponent(q)}&type=${encodeURIComponent(category.type)}`);
                  if (!res.ok) continue;
                  const data = await res.json();
                  const result = (data.results || []).find((item) => {
                    const placeName = normalizeSuggestionText(item?.name || '');
                    const placeKey = String(item?.place_id || placeName);
                    return placeName && !existingLabels.has(placeName) && !seenPlaces.has(placeKey);
                  });

                  if (!result) continue;

                  const placeName = normalizeSuggestionText(result?.name || '');
                  const placeKey = String(result?.place_id || placeName);
                  seenPlaces.add(placeKey);
                  const photoRef = result?.photos?.[0]?.photo_reference;
                  matched = {
                    id: `live-${category.key}-${placeKey}`,
                    label: result.name,
                    emoji: category.emoji,
                    categoryId: category.categoryId,
                    imageUrl: photoRef ? `/api/places?action=photo&ref=${encodeURIComponent(photoRef)}&maxwidth=800` : '',
                    description: `${result.formatted_address || result.vicinity || ''}`.trim() || `${category.label} near ${anchor}.`,
                    tip: buildPlaceSuggestionTip(result, anchor, category),
                    whyItFits: buildPlaceSuggestionWhy(result, anchor, category),
                    mapQuery: `${result.name} ${result.formatted_address || result.vicinity || anchor}`.trim(),
                    rot: (((initialSeed + found.length * 7 + refreshCount) % 11) - 5) * 0.55,
                  };
                  break;
                }
                if (matched) break;
              } catch {
                // try next anchor
              }
            }
          }

          if (matched) found.push(matched);
        }

        if (found.length === 0 && resolvedAnchorLocations.length > 0) {
          for (const resolvedAnchorLocation of resolvedAnchorLocations) {
            if (found.length >= 3) break;
            for (const category of LOCAL_BUSINESS_FALLBACK_TYPES) {
              if (found.length >= 3) break;
              try {
                const res = await fetch(
                  `/api/places?lat=${encodeURIComponent(resolvedAnchorLocation.lat)}&lng=${encodeURIComponent(resolvedAnchorLocation.lng)}&query=${encodeURIComponent(category.query)}&type=${encodeURIComponent(category.type)}&radius=10000`
                );
                if (!res.ok) continue;
                const data = await res.json();
                const candidates = Array.isArray(data?.results) ? data.results : [];
                const result = candidates.find((item) => {
                  const suggestion = buildSuggestionFromPlace(item, category, resolvedAnchorLocation, found.length);
                  if (!suggestion) return false;
                  found.push(suggestion);
                  return true;
                });
                if (result && found.length >= 3) break;
              } catch {
                // continue local business fallback
              }
            }
          }
        }

        if (!cancelled) setLiveSuggestions(found);
      } finally {
        if (!cancelled) setLoadingLiveSuggestions(false);
      }
    };

    loadNearbySuggestions();
    return () => { cancelled = true; };
  }, [chapter.id, chapter.title, chapterPins, initialSeed, pinLabelKey, refreshCount, activePillKey]);

  function handleAdd(s) {
    setAddedIds(prev => new Set([...prev, s.id]));
    onAdd(s);
  }

  return (
    <div style={{ padding: '0 16px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0, fontWeight: 600 }}>Round out your trip</p>
        <button
          onClick={() => setRefreshCount(c => c + 1)}
          style={{ background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5'}`, borderRadius: 20, padding: '3px 10px', fontSize: 10, color: ts, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >↻ refresh</button>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 10, paddingBottom: 2 }}>
        {SUGGESTION_PILLS.map(pill => {
          const isActive = activePillKey === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => handlePillClick(pill.key)}
              style={{
                flexShrink: 0,
                padding: '4px 10px',
                borderRadius: 20,
                border: `1px solid ${isActive ? '#2dd4bf' : (darkMode ? 'rgba(255,255,255,0.12)' : '#e5e0d5')}`,
                background: isActive ? '#2dd4bf' : 'transparent',
                color: isActive ? '#0a1020' : ts,
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {pill.emoji} {pill.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p style={{ fontFamily: CAVEAT, fontSize: 14, color: ts, fontStyle: 'italic', margin: '0 0 8px' }}>
          {loadingLiveSuggestions ? 'Finding nearby spots...' : 'No nearby spots found. Try refreshing or pick a pill.'}
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 18, paddingTop: 14 }}>
          {visible.map((s) => (
            <SuggestionCard key={s.id} s={s} onAdd={handleAdd} onOpenDetails={setSelectedSuggestion} darkMode={darkMode} />
          ))}
        </div>
      )}
      {selectedSuggestion && (
        <SuggestionPreviewSheet
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onAdd={handleAdd}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// ─── Chapter cluster layout helper ───────────────────────────────────────────
const CLUSTER_LABEL_H = 64;
const CLUSTER_PHOTO_ROW_H = 224;
const CLUSTER_NOTE_ROW_H  = 168;
const CLUSTER_GAP = 40;

function getChapterPinsForLayout(chapter, pins) {
  const chapterId = String(chapter?.id || '').trim();
  const chapterItemIds = new Set((chapter?.itemIds || []).map((id) => String(id || '')));
  return (Array.isArray(pins) ? pins : []).filter((pin) => (
    (String(pin?.chapterId || '').trim() === chapterId || chapterItemIds.has(String(pin?.id || '')))
    && pin?.type !== 'label'
    && pin?.type !== 'sticker'
  ));
}

function getChapterLayoutMetrics(chapter, pins, fallbackY = 20) {
  const chPins = getChapterPinsForLayout(chapter, pins);
  const rows = Math.ceil(Math.max(chPins.length, 1) / 2);
  const rowH = chPins.some((pin) => pin.type === 'photo') ? CLUSTER_PHOTO_ROW_H : CLUSTER_NOTE_ROW_H;
  const fallbackBottom = fallbackY + CLUSTER_LABEL_H + rows * rowH;
  if (chPins.length === 0) {
    return { labelY: fallbackY, nextY: fallbackBottom + CLUSTER_GAP };
  }

  const numericTops = chPins
    .map((pin) => Number(pin?.y))
    .filter((value) => Number.isFinite(value));
  const numericBottoms = chPins
    .map((pin) => {
      const y = Number(pin?.y);
      return Number.isFinite(y) ? y + estimatedPinHeight(pin) : null;
    })
    .filter((value) => Number.isFinite(value));

  if (numericTops.length === 0 || numericBottoms.length === 0) {
    return { labelY: fallbackY, nextY: fallbackBottom + CLUSTER_GAP };
  }

  const pinnedTop = Math.min(...numericTops);
  const inferredLabelY = Math.min(
    fallbackY + 12,
    Math.max(fallbackY, pinnedTop - CLUSTER_LABEL_H - 8)
  );
  const nextY = fallbackBottom + CLUSTER_GAP;
  return { labelY: inferredLabelY, nextY };
}

function getChapterClusterY(chapters, targetChapterId, pins) {
  let y = 20;
  for (const ch of chapters) {
    const metrics = getChapterLayoutMetrics(ch, pins, y);
    if (ch.id === targetChapterId) return metrics.labelY;
    y = metrics.nextY;
  }
  return y;
}

function computeChapterLayout(chapters, pins) {
  const layout = {};
  let y = 20;
  chapters.forEach(ch => {
    const metrics = getChapterLayoutMetrics(ch, pins, y);
    layout[ch.id] = { labelY: metrics.labelY };
    y = metrics.nextY;
  });
  return { layout, totalHeight: y };
}

// ─── Pushpin ─────────────────────────────────────────────────────────────────
function Pushpin({ colorKey, darkMode }) {
  const col = (PIN_COLORS[colorKey] || PIN_COLORS.teal)[darkMode ? 'dark' : 'light'];
  return (
    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: col, boxShadow: `0 2px 6px ${col}55, inset 0 -1px 2px rgba(0,0,0,0.2)`, border: darkMode ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.6)' }} />
      <div style={{ width: 2.5, height: 9, background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', borderRadius: '0 0 2px 2px', marginTop: -1 }} />
    </div>
  );
}

// ─── SharpieX ────────────────────────────────────────────────────────────────
function SharpieX({ size = 138 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ position: 'absolute', top: 6, left: 6, pointerEvents: 'none', zIndex: 4 }}>
      <line x1={s*.08} y1={s*.08} x2={s*.92} y2={s*.92} stroke="#c0392b" strokeWidth="7" strokeLinecap="round" opacity="0.88"/>
      <line x1={s*.92} y1={s*.08} x2={s*.08} y2={s*.92} stroke="#c0392b" strokeWidth="6.5" strokeLinecap="round" opacity="0.82"/>
      <line x1={s*.09} y1={s*.06} x2={s*.93} y2={s*.91} stroke="#a93226" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
      <line x1={s*.91} y1={s*.07} x2={s*.07} y2={s*.93} stroke="#a93226" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
    </svg>
  );
}

// ─── PhotoPin ────────────────────────────────────────────────────────────────
function PhotoPin({ pin, isDragging, onDelete, onTap, darkMode, chapterTitle }) {
  const candidateImageUrls = resolveDreamImageCandidates(pin);
  const [imageIndex, setImageIndex] = useState(0);
  const [moviePosterFailed, setMoviePosterFailed] = useState(false);
  const [placeImageFailed, setPlaceImageFailed] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [debugDelayElapsed, setDebugDelayElapsed] = useState(false);
  const [stableImageUrl, setStableImageUrl] = useState('');
  const resolvedImageUrl = candidateImageUrls[imageIndex] || '';
  const pinTitle = String(pin?.label || pin?.text || '').trim();
  const shouldPreferLiveRestaurantPhoto = isFallbackRestaurantDreamImage(pin, resolvedImageUrl);
  const moviePosterQuery = (!resolvedImageUrl || shouldPreferLiveRestaurantPhoto) && isMovieDream(pin) ? pinTitle : null;
  const placePhotoQuery = (!resolvedImageUrl || shouldPreferLiveRestaurantPhoto) ? getDreamPlacePhotoQuery(pin) : null;
  const moviePosterUrl = useMoviePoster(moviePosterQuery);
  const placeImageUrl = usePlacesImage(placePhotoQuery);
  const googleImageQuery = (!resolvedImageUrl || shouldPreferLiveRestaurantPhoto) ? getDreamImageSearchQuery(pin) : null;
  const searchedImageUrl = useGoogleImage(googleImageQuery);
  const moviePosterPending = Boolean(moviePosterQuery) && moviePosterUrl === undefined;
  const placeImagePending = Boolean(placePhotoQuery) && placeImageUrl === undefined;
  const searchImagePending = Boolean(googleImageQuery) && searchedImageUrl === undefined;
  const asyncImageUrl = (
    (!moviePosterFailed && moviePosterUrl)
    || (!placeImageFailed && placeImageUrl)
    || (!searchFailed && searchedImageUrl)
    || ''
  );
  const imageUrl = shouldPreferLiveRestaurantPhoto
    ? (asyncImageUrl || '')
    : (resolvedImageUrl || asyncImageUrl);
  const restaurantFallbackImageUrl = shouldPreferLiveRestaurantPhoto ? resolvedImageUrl : '';
  const exhaustedCandidates = imageIndex >= candidateImageUrls.length;
  const provisionalImageUrl = imageUrl || stableImageUrl;
  const imageFailed = exhaustedCandidates && !provisionalImageUrl && (
    (!moviePosterQuery || moviePosterFailed || (!moviePosterPending && !moviePosterUrl))
    && (!placePhotoQuery || placeImageFailed || (!placeImagePending && !placeImageUrl))
    && (!googleImageQuery || searchFailed || (!searchImagePending && !searchedImageUrl))
  );
  const isLookupPending = (!resolvedImageUrl || shouldPreferLiveRestaurantPhoto) && !imageFailed && (
    moviePosterPending
    || placeImagePending
    || searchImagePending
  );
  const displayImageUrl = imageUrl
    || stableImageUrl
    || restaurantFallbackImageUrl;
  const showDebugFallback = debugDelayElapsed && (!imageUrl || imageFailed) && !isLookupPending;
  const cardBg  = darkMode ? '#e2e8f0' : '#ffffff';
  const labelCol = pin.status === 'done' ? '#9ca3af' : '#374151';
  const shadow  = isDragging ? '0 20px 50px rgba(0,0,0,0.5)' : '3px 5px 16px rgba(0,0,0,0.22)';
  useEffect(() => {
    setImageIndex(0);
    setMoviePosterFailed(false);
    setPlaceImageFailed(false);
    setSearchFailed(false);
    setDebugDelayElapsed(false);
    setStableImageUrl('');
  }, [pin?.id, pin?.label, pin?.text, pin?.imageUrl, pin?.photoUrl]);
  useEffect(() => {
    if (!imageUrl) return;
    if (shouldPreferLiveRestaurantPhoto && imageUrl === restaurantFallbackImageUrl) return;
    setStableImageUrl(imageUrl);
  }, [imageUrl, shouldPreferLiveRestaurantPhoto, restaurantFallbackImageUrl]);
  useEffect(() => {
    if (displayImageUrl || isLookupPending) {
      setDebugDelayElapsed(false);
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setDebugDelayElapsed(true);
    }, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [displayImageUrl, isLookupPending, imageFailed]);
  const debugLines = [
    `title: ${pinTitle || '(blank)'}`,
    `type: ${String(pin?.type || '').trim() || '(blank)'}`,
    `sourceType: ${String(pin?.sourceType || '').trim() || '(blank)'}`,
    `category: ${String(pin?.category || '').trim() || '(blank)'}`,
    `categoryId: ${String(pin?.categoryId || '').trim() || '(blank)'}`,
    `resolved: ${resolvedImageUrl ? 'yes' : 'no'}`,
    `search: ${(moviePosterUrl || placeImageUrl || searchedImageUrl) ? 'yes' : 'no'}`,
    `imageUrl: ${displayImageUrl ? 'yes' : 'no'}`,
    `failed: ${imageFailed ? 'yes' : 'no'}`,
    `candidate: ${candidateImageUrls.length ? `${Math.min(imageIndex + 1, candidateImageUrls.length)}/${candidateImageUrls.length}` : '0/0'}`,
  ];
  return (
    <div
      style={{ background: cardBg, padding: '6px 6px 0', boxShadow: shadow, width: 150, borderRadius: 2, cursor: isDragging ? 'grabbing' : 'grab', position: 'relative', transition: isDragging ? 'none' : 'box-shadow 0.2s' }}
      onClick={() => onTap?.({ ...pin, resolvedImageUrl: displayImageUrl })}
    >
      <Pushpin colorKey={pin.pinColor} darkMode={darkMode} />
      <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 2, position: 'relative' }}>
        {displayImageUrl
          ? <img
              src={displayImageUrl}
              alt={pin.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: pin.status === 'done' ? 'grayscale(40%) brightness(0.85)' : 'none' }}
              draggable={false}
              onError={() => {
                if (resolvedImageUrl && imageIndex < candidateImageUrls.length - 1) {
                  setImageIndex((current) => current + 1);
                  return;
                }
                if (resolvedImageUrl && imageIndex === candidateImageUrls.length - 1) {
                  setImageIndex(candidateImageUrls.length);
                  return;
                }
                if (!moviePosterFailed && displayImageUrl && displayImageUrl === moviePosterUrl) {
                  setMoviePosterFailed(true);
                  return;
                }
                if (!placeImageFailed && displayImageUrl && displayImageUrl === placeImageUrl) {
                  setPlaceImageFailed(true);
                  return;
                }
                setSearchFailed(true);
              }}
            />
          : <div style={{ width: '100%', height: '100%', background: '#f5f3ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 6, fontSize: 36, filter: pin.status === 'done' ? 'grayscale(40%)' : 'none' }}><div>{pin.emoji || '?'}</div>{showDebugFallback ? <div style={{ width: '100%', maxHeight: '100%', overflow: 'hidden', borderRadius: 6, background: 'rgba(255,255,255,0.9)', padding: '6px 7px', fontSize: 9, lineHeight: 1.2, color: '#374151', textAlign: 'left' }}>{debugLines.map((line) => (<div key={line} style={{ wordBreak: 'break-word' }}>{line}</div>))}</div> : <div style={{ width: '100%', borderRadius: 6, background: 'rgba(255,255,255,0.82)', padding: '8px 7px', fontSize: 8, lineHeight: 1.2, color: '#9ca3af', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Loading photo</div>}</div>
        }
        {pin.status === 'done' && <SharpieX size={138} />}
      </div>
      <div style={{ padding: '6px 2px 7px', textAlign: 'center', minHeight: 44 }}>
        <div style={{ minHeight: 31, fontFamily: CAVEAT, fontSize: 12, color: labelCol, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textDecoration: pin.status === 'done' ? 'line-through' : 'none' }}>
          {pin.emoji ? `${pin.emoji} ${pin.label}` : pin.label}
        </div>
      </div>
      {pin.status === 'planning' && !pin.chapterId && (
        <div style={{ position: 'absolute', top: 5, right: 5, background: '#fef3c7', color: '#92400e', fontSize: 8, fontWeight: 700, padding: '2px 4px', borderRadius: 4, letterSpacing: '0.05em' }}>PLANNING</div>
      )}
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.10)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#6b7280', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── NotePin ─────────────────────────────────────────────────────────────────
function NotePin({ pin, isDragging, onDelete, onTap, darkMode }) {
  const scheme = (NOTE_COLORS[pin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'];
  const shadow = isDragging ? '0 20px 50px rgba(0,0,0,0.5)' : darkMode ? '3px 4px 16px rgba(0,0,0,0.5)' : '3px 4px 12px rgba(0,0,0,0.15)';
  return (
    <div style={{ background: scheme.bg, padding: '13px 13px 14px', boxShadow: shadow, width: 148, minHeight: 108, position: 'relative', cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'box-shadow 0.2s' }} onClick={onTap}>
      <div style={{ position: 'absolute', top: 0, right: 0, borderWidth: '0 20px 20px 0', borderStyle: 'solid', borderColor: `transparent ${scheme.fold} transparent transparent` }} />
      <Pushpin colorKey={pin.pinColor} darkMode={darkMode} />
      <p style={{ fontFamily: CAVEAT, fontSize: 15, color: scheme.text, lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>{pin.text}</p>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', bottom: 5, right: 7, background: 'none', border: 'none', fontSize: 10, color: scheme.fold, cursor: 'pointer', padding: 0 }}>✕</button>
    </div>
  );
}

// ─── LabelPin ────────────────────────────────────────────────────────────────
function LabelPin({ pin, isDragging, onDelete, darkMode }) {
  const sizes = { small: 17, medium: 24, large: 32 };
  const fs    = sizes[pin.fontSize] || 24;
  const ff    = pin.fontStyle === 'clean' ? 'system-ui, sans-serif' : CAVEAT;
  const fw    = pin.fontStyle === 'bold' ? 700 : 400;
  const color = pin.textColor || (darkMode ? '#e8eaf0' : '#1a1a2e');
  let wrapStyle = { position: 'relative', display: 'inline-block', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', whiteSpace: 'nowrap', padding: '4px 10px', transition: isDragging ? 'none' : 'box-shadow 0.2s' };
  if (pin.styleVariant === 'highlight') wrapStyle = { ...wrapStyle, borderBottom: `3px solid ${color}`, background: `${color}22`, borderRadius: '4px 4px 0 0', padding: '5px 10px 3px' };
  else if (pin.styleVariant === 'tape') wrapStyle = { ...wrapStyle, background: darkMode ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.84)', boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.14)', borderRadius: 3, padding: '6px 16px' };
  return (
    <div style={wrapStyle}>
      <span style={{ fontFamily: ff, fontWeight: fw, fontSize: fs, color, lineHeight: 1.2, display: 'block' }}>{pin.text}</span>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(0,0,0,0.22)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── ChecklistPin ─────────────────────────────────────────────────────────────
function ChecklistPin({ pin, isDragging, onDelete, onTap, darkMode }) {
  const shadow = isDragging ? '0 20px 50px rgba(0,0,0,0.5)' : '3px 5px 16px rgba(0,0,0,0.22)';
  const bg = darkMode ? '#1e2535' : '#faf9f5';
  const tp = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts = darkMode ? '#4a5568' : '#9ca3af';
  const border = darkMode ? 'rgba(255,255,255,0.07)' : '#ede8df';
  const items = pin.meta?.items || [];
  const doneCount = items.filter(i => i.checked).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
  const preview = items.slice(0, 4);
  return (
    <div onClick={onTap} style={{ background: bg, boxShadow: shadow, width: 148, borderRadius: 4, cursor: isDragging ? 'grabbing' : 'grab', position: 'relative', border: `1px solid ${border}`, padding: '10px 10px 8px', transition: isDragging ? 'none' : 'box-shadow 0.2s' }}>
      <Pushpin colorKey={pin.pinColor || 'teal'} darkMode={darkMode} />
      <p style={{ fontFamily: CAVEAT, fontSize: 14, fontWeight: 700, color: tp, margin: '4px 0 6px', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{pin.label || 'Checklist'}</p>
      {items.length > 0 && (
        <div style={{ height: 2, borderRadius: 99, background: darkMode ? 'rgba(255,255,255,0.08)' : '#e8e3da', marginBottom: 7, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: '#2dd4bf' }} />
        </div>
      )}
      {preview.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ flexShrink: 0, width: 12, height: 12, borderRadius: '50%', border: item.checked ? 'none' : '1.5px solid #2dd4bf', background: item.checked ? '#2dd4bf' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.checked && <span style={{ color: '#0a1020', fontSize: 8, fontWeight: 700, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{ fontFamily: CAVEAT, fontSize: 13, color: item.checked ? ts : tp, textDecoration: item.checked ? 'line-through' : 'none', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{item.text}</span>
        </div>
      ))}
      {items.length > 4 && <p style={{ fontFamily: SANS, fontSize: 9, color: ts, margin: '4px 0 0', letterSpacing: '0.04em' }}>+{items.length - 4} more</p>}
      {items.length === 0 && <p style={{ fontFamily: CAVEAT, fontSize: 13, color: ts, margin: 0, fontStyle: 'italic' }}>Empty list</p>}
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.10)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#6b7280', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── CountdownPin ────────────────────────────────────────────────────────────
function CountdownPin({ pin, isDragging, onDelete, onTap }) {
  const targetDate = pin.meta?.targetDate || '';
  const days = React.useMemo(() => {
    if (!targetDate) return null;
    const [y, m, d] = targetDate.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }, [targetDate]);

  const shadow = isDragging ? '0 20px 50px rgba(0,0,0,0.5)' : '3px 5px 16px rgba(0,0,0,0.22)';

  let bg, accent, textCol, numCol, label;
  if (days === null)       { bg = '#f3f4f6'; accent = '#9ca3af'; textCol = '#6b7280'; numCol = '#9ca3af'; label = '—'; }
  else if (days < 0)       { bg = '#f3f4f6'; accent = '#d1d5db'; textCol = '#9ca3af'; numCol = '#d1d5db'; label = 'passed'; }
  else if (days === 0)     { bg = '#fffbeb'; accent = '#f59e0b'; textCol = '#92400e'; numCol = '#f59e0b'; label = 'TODAY! 🎉'; }
  else if (days <= 7)      { bg = '#fff0f5'; accent = '#f472b6'; textCol = '#831843'; numCol = '#ec4899'; label = days === 1 ? 'day to go!' : 'days to go!'; }
  else if (days <= 30)     { bg = '#fffbeb'; accent = '#fbbf24'; textCol = '#78350f'; numCol = '#f59e0b'; label = 'days away'; }
  else                     { bg = '#f0fdf9'; accent = '#2dd4bf'; textCol = '#134e4a'; numCol = '#0d9488'; label = 'days away'; }

  return (
    <div onClick={onTap} style={{ background: bg, boxShadow: shadow, width: 148, borderRadius: 4, cursor: isDragging ? 'grabbing' : 'grab', position: 'relative', padding: '10px 10px 10px', transition: isDragging ? 'none' : 'box-shadow 0.2s', textAlign: 'center' }}>
      <Pushpin colorKey="teal" darkMode={false} />
      <div style={{ fontSize: 30, marginBottom: 2, marginTop: 4 }}>{pin.emoji || '⏳'}</div>
      {days === 0 ? (
        <div style={{ fontFamily: CAVEAT, fontSize: 22, fontWeight: 700, color: numCol, lineHeight: 1 }}>{label}</div>
      ) : (
        <>
          <div style={{ fontFamily: CAVEAT, fontSize: 48, fontWeight: 700, color: numCol, lineHeight: 1 }}>{days < 0 ? Math.abs(days) : days}</div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: textCol, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
        </>
      )}
      <div style={{ fontFamily: CAVEAT, fontSize: 13, color: textCol, marginTop: 4, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{pin.label}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 4px 4px', background: accent, opacity: 0.5 }} />
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.10)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#6b7280', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── StickerPin ───────────────────────────────────────────────────────────────
function StickerPin({ pin, isDragging, onDelete }) {
  const sizes = { small: 32, medium: 46, large: 62 };
  const fs = sizes[pin.size] || 46;
  return (
    <div style={{ position: 'relative', display: 'inline-block', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}>
      <span style={{ fontSize: fs, display: 'block', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.22))' }}>{pin.sticker}</span>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── Create Chapter Sheet ─────────────────────────────────────────────────────
function CreateChapterSheet({ onClose, onCreate, suggestedTitle = '', darkMode }) {
  const [title, setTitle] = useState(suggestedTitle);
  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#4a5568' : '#9ca3af';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';

  function submit() {
    const t = title.trim();
    if (!t) return;
    onCreate(t);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '24px 18px max(48px, calc(env(safe-area-inset-bottom) + 48px))', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 22px' }} />
        <p style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: '0 0 4px' }}>New Chapter</p>
        <p style={{ fontSize: 12, color: ts, margin: '0 0 18px' }}>Give it a name — you can always change it later</p>
        <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>Chapter title</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder='e.g. "Japan Someday" or "Road Trip"'
          autoFocus
          style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2', border: `1px solid ${inputBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 18, color: tp, outline: 'none', width: '100%', marginBottom: 20, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'transparent', border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()} style={{ flex: 2, padding: '12px', borderRadius: 14, background: title.trim() ? '#5eadce' : (darkMode ? 'rgba(94,173,206,0.3)' : '#bde0f0'), color: '#fff', border: 'none', fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, cursor: title.trim() ? 'pointer' : 'not-allowed' }}>
            Create Chapter 📖
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Suggestion Prompt (auto-detected groups) ────────────────────────
function ChapterSuggestionPrompt({ group, pins, onConfirm, onDismiss, darkMode }) {
  const [title, setTitle] = useState(group.suggestedTitle || 'New Chapter');
  const groupPins = pins.filter(p => group.pinIds.includes(p.id));
  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#4a5568' : '#9ca3af';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'flex-end' }} onClick={onDismiss}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '24px 18px max(48px, calc(env(safe-area-inset-bottom) + 48px))', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 22px' }} />
        <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 4px' }}>These seem connected</p>
        <p style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: '0 0 18px', lineHeight: 1.1 }}>Create a chapter?</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {groupPins.map(p => (
            <div key={p.id} style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 10, overflow: 'hidden', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              {getPinImageUrl(p) ? <img src={getPinImageUrl(p)} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>{p.emoji || (p.type === 'note' ? '📝' : '📌')}</span>}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>Chapter title — make it yours</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2', border: `1px solid ${inputBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 18, color: tp, outline: 'none', width: '100%', marginBottom: 20, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDismiss} style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'transparent', border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>Not now</button>
          <button onClick={() => onConfirm(title.trim() || group.suggestedTitle)} style={{ flex: 2, padding: '12px', borderRadius: 14, background: '#5eadce', color: '#fff', border: 'none', fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>Create Chapter 📖</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Sheet ────────────────────────────────────────────────────────────────
function AddSheet({ onClose, onAdd, darkMode, chapterOnly = false }) {
  const [type, setType]               = useState('photo');
  const [label, setLabel]             = useState('');
  const [emoji, setEmoji]             = useState('✨');
  const [imageUrl, setUrl]            = useState('');
  const [text, setText]               = useState('');
  const [noteColor, setNoteColor]     = useState('yellow');
  const [pinColor, setPinColor]       = useState('teal');
  const [catId, setCatId]             = useState('experiences');
  const [labelText, setLabelText]     = useState('');
  const [fontStyle, setFontStyle]     = useState('handwritten');
  const [fontSize, setFontSize]       = useState('medium');
  const [textColor, setTextColor]     = useState(darkMode ? '#e8eaf0' : '#1a1a2e');
  const [styleVariant, setStyleVar]   = useState('plain');
  const [sticker, setSticker]         = useState('⭐');
  const [stickerSize, setStickerSize] = useState('medium');
  const [checklistTitle, setChecklistTitle] = useState('');
  const [checklistItems, setChecklistItems] = useState([{ id: '1', text: '' }]);
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownEmoji, setCountdownEmoji] = useState('✈️');
  const labelPresets = ['MOVIES', 'My Wishlist', 'Date Night', 'Trips'];
  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const inputBg  = darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';
  const tp = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts = darkMode ? '#4a5568' : '#9ca3af';
  const divider = darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4';
  const inputStyle = { background: inputBg, border: `1px solid ${inputBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: SANS, fontSize: 15, color: tp, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const sectionLabel = { fontSize: 11, fontFamily: SANS, fontWeight: 600, color: ts, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' };
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  function pillStyle(active) {
    return { flex: 1, padding: '7px 4px', borderRadius: 12, border: `1px solid ${active ? '#2dd4bf' : inputBdr}`, background: active ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', color: active ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, fontFamily: SANS, fontSize: 13, cursor: 'pointer' };
  }
  function submit() {
    if (type === 'photo' && !label.trim()) return;
    if (type === 'note' && !text.trim()) return;
    if (type === 'label' && !labelText.trim()) return;
    if (type === 'checklist' && !checklistTitle.trim() && !checklistItems.some(i => i.text.trim())) return;
    if (type === 'countdown' && !countdownDate) return;
    let data = { type, status: 'dreaming' };
    if (type === 'photo')     data = { ...data, label: label.trim(), emoji, pinColor, categoryId: catId, imageUrl };
    if (type === 'note')      data = { ...data, text: text.trim(), noteColor, pinColor, categoryId: catId };
    if (type === 'label')     data = { ...data, text: labelText.trim(), fontStyle, fontSize, textColor, styleVariant };
    if (type === 'sticker')   data = { ...data, sticker, size: stickerSize };
    if (type === 'checklist') data = { ...data, label: checklistTitle.trim() || 'Checklist', meta: { items: checklistItems.filter(i => i.text.trim()).map(i => ({ id: i.id, text: i.text.trim(), checked: false })) } };
    if (type === 'countdown') data = { ...data, label: label.trim() || 'Countdown', emoji: countdownEmoji, meta: { targetDate: countdownDate } };
    onAdd(data); onClose();
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', padding: '12px 12px max(12px, env(safe-area-inset-bottom))' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '0 18px max(32px, calc(env(safe-area-inset-bottom) + 32px))', width: '100%', maxWidth: 480, margin: '0 auto', borderTop: `1px solid ${divider}`, maxHeight: 'min(85dvh, calc(100dvh - env(safe-area-inset-top) - 24px))', overflowY: 'auto', WebkitOverflowScrolling: 'touch', ...sheetStyle }}>
        <div {...handleProps}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        </div>
        <div style={{ padding: '4px 0 18px' }}><p style={{ fontFamily: CAVEAT, fontSize: 24, fontWeight: 700, color: tp, margin: 0 }}>Pin something new</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[['photo','📸','Photo'],['note','📝','Note'],['checklist','✅','Checklist'],['countdown','⏳','Countdown'],['label','🏷️','Label'],['sticker','✦','Sticker']].map(([t, ic, lbl]) => (
            <button key={t} onClick={() => setType(t)} style={{ padding: '9px 6px', borderRadius: 14, border: `1px solid ${type === t ? '#2dd4bf' : inputBdr}`, background: type === t ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : 'transparent', color: type === t ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, fontFamily: SANS, fontSize: 13, cursor: 'pointer', fontWeight: type === t ? 600 : 400 }}>{ic} {lbl}</button>
          ))}
        </div>
        {type === 'photo' && (<>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Visit Boston)" style={{ ...inputStyle, marginBottom: 10 }} />
          <p style={sectionLabel}>Photo</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setUrl(ev.target.result);r.readAsDataURL(f);}; i.click(); }} style={{ flex: 1, padding: '9px 6px', borderRadius: 12, border: `1px solid ${inputBdr}`, background: 'transparent', color: ts, fontFamily: SANS, fontSize: 13, cursor: 'pointer' }}>📁 Upload photo</button>
            <button onClick={() => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.capture='environment'; i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setUrl(ev.target.result);r.readAsDataURL(f);}; i.click(); }} style={{ flex: 1, padding: '9px 6px', borderRadius: 12, border: `1px solid ${inputBdr}`, background: 'transparent', color: ts, fontFamily: SANS, fontSize: 13, cursor: 'pointer' }}>📷 Take photo</button>
          </div>
          {imageUrl && imageUrl.startsWith('data:') && (<div style={{ position: 'relative', marginBottom: 10 }}><img src={imageUrl} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }} /><button onClick={() => setUrl('')} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>)}
          <input value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={e => setUrl(e.target.value)} placeholder="or paste image URL (optional)" style={{ ...inputStyle, marginBottom: 12 }} />
          <p style={sectionLabel}>Emoji</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {['✨','🌍','🍜','🏔️','🚗','🏡','🎬','🎲','🛍️','🌊','🏄','🎵','📚','🍣','🌸','✈️','🍕','🎪','🌮','☕','🍷','🌙','🌈','🎭'].map(e => (<button key={e} onClick={() => setEmoji(e)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${emoji===e?'#2dd4bf':inputBdr}`, background: emoji===e?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', fontSize: 18, cursor: 'pointer' }}>{e}</button>))}
          </div>
        </>)}
        {type === 'note' && (<>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your mind?" rows={3} style={{ ...inputStyle, resize: 'none', marginBottom: 12 }} />
          <p style={sectionLabel}>Note colour</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {NOTE_COLOR_OPTIONS.map(k => { const c=NOTE_COLORS[k][darkMode?'dark':'light']; return <button key={k} onClick={() => setNoteColor(k)} style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, border: noteColor===k?'2px solid #2dd4bf':`1px solid ${c.fold}33`, cursor: 'pointer' }} />; })}
          </div>
        </>)}
        {type === 'checklist' && (<>
          <input value={checklistTitle} onChange={e => setChecklistTitle(e.target.value)} placeholder="List title (e.g. Packing List)" style={{ ...inputStyle, marginBottom: 14 }} />
          <p style={sectionLabel}>Items</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {checklistItems.map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>☐</span>
                <input
                  value={item.text}
                  onChange={e => setChecklistItems(prev => prev.map(i => i.id === item.id ? { ...i, text: e.target.value } : i))}
                  placeholder={`Item ${idx + 1}`}
                  style={{ ...inputStyle, flex: 1, width: 'auto' }}
                />
                {checklistItems.length > 1 && (
                  <button onClick={() => setChecklistItems(prev => prev.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', color: ts, fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setChecklistItems(prev => [...prev, { id: Date.now().toString(), text: '' }])} style={{ width: '100%', padding: '9px', borderRadius: 12, border: `1px dashed ${inputBdr}`, background: 'transparent', color: ts, fontFamily: SANS, fontSize: 13, cursor: 'pointer', marginBottom: 14 }}>+ Add item</button>
        </>)}
        {type === 'countdown' && (<>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="What are you counting down to?" style={{ ...inputStyle, marginBottom: 12 }} />
          <p style={sectionLabel}>Date</p>
          <input type="date" value={countdownDate} onChange={e => setCountdownDate(e.target.value)} style={{ ...inputStyle, marginBottom: 14, colorScheme: darkMode ? 'dark' : 'light', display: 'block' }} />
          <p style={sectionLabel}>Emoji</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {['✈️','🏖️','🎉','🏔️','🎂','🎵','🏰','🌸','🚀','🍣','🎬','🏄','🎪','🌮','🍕','🥂','🎠','🌍','⛷️','🛳️','🎡','🌅','🎆','🦋'].map(e => (
              <button key={e} onClick={() => setCountdownEmoji(e)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${countdownEmoji===e?'#2dd4bf':inputBdr}`, background: countdownEmoji===e?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', fontSize: 18, cursor: 'pointer' }}>{e}</button>
            ))}
          </div>
        </>)}
        {type === 'label' && (<>
          <input value={labelText} onChange={e => setLabelText(e.target.value)} placeholder="MOVIES · My Wishlist · Date Night" style={{ ...inputStyle, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {labelPresets.map(preset => { const active=labelText.trim().toLowerCase()===preset.toLowerCase(); return <button key={preset} type="button" onClick={() => setLabelText(preset)} style={{ padding: '6px 10px', borderRadius: 999, border: `1px solid ${active?'#2dd4bf':inputBdr}`, background: active?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', color: active?(darkMode?'#2dd4bf':'#0d9488'):ts, fontFamily: SANS, fontSize: 13, cursor: 'pointer' }}>{preset}</button>; })}
          </div>
          <p style={sectionLabel}>Style</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[['plain','Plain'],['highlight','Highlight'],['tape','Tape']].map(([v,lbl]) => <button key={v} onClick={() => setStyleVar(v)} style={pillStyle(styleVariant===v)}>{lbl}</button>)}</div>
          <p style={sectionLabel}>Font</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[['handwritten','Caveat'],['clean','Clean'],['bold','Bold']].map(([v,lbl]) => <button key={v} onClick={() => setFontStyle(v)} style={{ ...pillStyle(fontStyle===v), fontFamily: v==='handwritten'?CAVEAT:'system-ui', fontWeight: v==='bold'?700:400 }}>{lbl}</button>)}</div>
          <p style={sectionLabel}>Size</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[['small','Small'],['medium','Medium'],['large','Large']].map(([v,lbl]) => <button key={v} onClick={() => setFontSize(v)} style={pillStyle(fontSize===v)}>{lbl}</button>)}</div>
          <p style={sectionLabel}>Colour</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>{LABEL_COLORS.map(c => <button key={c} onClick={() => setTextColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: textColor===c?'2px solid #2dd4bf':c==='#ffffff'?`1px solid ${inputBdr}`:'2px solid transparent', outline: textColor===c?`2px solid ${c}55`:'none', cursor: 'pointer' }} />)}</div>
        </>)}
        {type === 'sticker' && (<>
          <p style={sectionLabel}>Pick a sticker</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>{STICKERS.map(s => <button key={s} onClick={() => setSticker(s)} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${sticker===s?'#2dd4bf':inputBdr}`, background: sticker===s?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', fontSize: 22, cursor: 'pointer' }}>{s}</button>)}</div>
          <p style={sectionLabel}>Size</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[['small','Small'],['medium','Medium'],['large','Large']].map(([v,lbl]) => <button key={v} onClick={() => setStickerSize(v)} style={pillStyle(stickerSize===v)}>{lbl}</button>)}</div>
        </>)}
        {(type === 'photo' || type === 'note') && (<>
          <p style={sectionLabel}>Category</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {CATEGORY_FILTERS.filter(c => c.id !== 'all').map(c => <button key={c.id} onClick={() => setCatId(c.id)} style={{ padding: '5px 11px', borderRadius: 20, border: `1px solid ${catId===c.id?'#2dd4bf':inputBdr}`, background: catId===c.id?(darkMode?'rgba(45,212,191,0.1)':'#f0fdfb'):'transparent', fontFamily: SANS, fontSize: 13, color: catId===c.id?(darkMode?'#2dd4bf':'#0d9488'):ts, cursor: 'pointer' }}>{c.emoji} {c.label}</button>)}
          </div>
          <p style={sectionLabel}>Pin colour</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {PIN_COLOR_OPTIONS.map(k => { const col=PIN_COLORS[k][darkMode?'dark':'light']; return <button key={k} onClick={() => setPinColor(k)} style={{ width: 24, height: 24, borderRadius: '50%', background: col, border: pinColor===k?'2px solid white':'2px solid transparent', outline: pinColor===k?`2px solid ${col}`:'none', cursor: 'pointer' }} />; })}
          </div>
        </>)}
        <button onClick={submit} style={{ width: '100%', padding: '13px', borderRadius: 16, background: '#2dd4bf', color: '#0a1020', border: 'none', fontFamily: CAVEAT, fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>Pin it 📌</button>
      </div>
    </div>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────
function DetailSheet({ pin, chapters, onClose, onConvertToEvent, onConvertToTrip, onMarkDone, onSetHero, onSetFocusStatus, heroId, onAddToChapter, onRemoveFromChapter, darkMode }) {
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const sheetBg = darkMode ? '#131c2e' : '#ffffff';
  const tp      = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts      = darkMode ? '#4a5568' : '#9ca3af';
  const divider = darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4';
  const secBg   = darkMode ? 'rgba(255,255,255,0.04)' : '#f8f7f2';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.12)' : '#e5e0d5';
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  const currentChapter = chapters.find(c => c.itemIds.includes(pin.id));

  const handleTurnIntoPlan = () => {
    const tripLike = ['places', 'travel', 'adventure'].includes(String(pin.categoryId || '').toLowerCase());
    const planHandler = tripLike ? (onConvertToTrip || onConvertToEvent) : (onConvertToEvent || onConvertToTrip);
    planHandler?.(pin); onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '20px 18px max(48px, calc(env(safe-area-inset-bottom) + 48px))', width: '100%', maxWidth: 480, margin: '0 auto', borderTop: `1px solid ${divider}`, maxHeight: '90dvh', overflowY: 'auto', ...sheetStyle }}>
        <div {...handleProps}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        </div>

        {pin.type === 'photo' && getPinImageUrl(pin) && (
          <img src={getPinImageUrl(pin)} alt={pin.label} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 16, marginBottom: 14 }} />
        )}
        <p style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, marginBottom: 4, lineHeight: 1.2 }}>
          {!getPinImageUrl(pin) && pin.emoji ? `${pin.emoji} ` : ''}{pin.label || pin.text}
        </p>
        {pin.type === 'note' && (
          <div style={{ background: (NOTE_COLORS[pin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'].bg, borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontFamily: CAVEAT, fontSize: 16, color: (NOTE_COLORS[pin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'].text, margin: 0, lineHeight: 1.5 }}>{pin.text}</p>
          </div>
        )}

        {/* Chapter picker */}
        <div style={{ marginBottom: 12 }}>
          {currentChapter ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{ flex: 1, background: darkMode ? 'rgba(94,173,206,0.12)' : '#eef8fd', border: '1px solid rgba(94,173,206,0.35)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: '#5eadce', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Chapter</div>
                <div style={{ fontFamily: CAVEAT, fontSize: 16, color: darkMode ? '#5eadce' : '#0e7490' }}>📖 {currentChapter.title}</div>
              </div>
              <button onClick={() => setShowChapterPicker(v => !v)} style={{ padding: '0 14px', borderRadius: 12, background: secBg, border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>
                {showChapterPicker ? 'Done' : 'Change'}
              </button>
            </div>
          ) : (
            <button onClick={() => setShowChapterPicker(v => !v)} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: secBg, border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>
              📖 Add to a chapter…
            </button>
          )}

          {showChapterPicker && (
            <div style={{ marginTop: 8, background: secBg, borderRadius: 14, overflow: 'hidden', border: `1px solid ${inputBdr}` }}>
              {chapters.length === 0 && (
                <div style={{ padding: '14px 16px', fontFamily: CAVEAT, fontSize: 15, color: ts, fontStyle: 'italic' }}>No chapters yet — create one from the tab bar</div>
              )}
              {chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => { onAddToChapter(pin.id, ch.id); setShowChapterPicker(false); onClose(); }}
                  style={{ width: '100%', padding: '12px 16px', background: currentChapter?.id === ch.id ? (darkMode ? 'rgba(94,173,206,0.15)' : '#eef8fd') : 'transparent', border: 'none', borderBottom: i < chapters.length - 1 ? `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4'}` : 'none', fontFamily: CAVEAT, fontSize: 16, color: currentChapter?.id === ch.id ? (darkMode ? '#5eadce' : '#0e7490') : tp, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {currentChapter?.id === ch.id ? '✓ ' : ''}📖 {ch.title}
                </button>
              ))}
              {currentChapter && (
                <button onClick={() => { onRemoveFromChapter(pin.id); setShowChapterPicker(false); }} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4'}`, fontFamily: CAVEAT, fontSize: 15, color: '#ef4444', cursor: 'pointer', textAlign: 'left' }}>
                  Remove from chapter
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pin.status !== 'done' && (
            <button onClick={handleTurnIntoPlan} style={{ flex: '1 1 100%', minWidth: 120, padding: '12px', borderRadius: 14, background: darkMode ? 'rgba(139,92,246,0.12)' : '#f5f3ff', color: darkMode ? '#c4b5fd' : '#6d28d9', border: `1px solid ${darkMode ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.28)'}`, fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>Make it happen</button>
          )}
          {pin.status === 'planning' && (
            <button onClick={() => { onSetFocusStatus?.(pin, 'dreaming'); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: darkMode ? 'rgba(139,92,246,0.08)' : '#faf5ff', color: darkMode ? '#d8b4fe' : '#7c3aed', border: `1px solid ${darkMode ? 'rgba(139,92,246,0.22)' : 'rgba(139,92,246,0.24)'}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
              Remove focus
            </button>
          )}
          <button onClick={() => { onMarkDone?.(pin); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: pin.status === 'done' ? (darkMode ? 'rgba(45,212,191,0.1)' : '#f0fdfb') : secBg, color: pin.status === 'done' ? (darkMode ? '#2dd4bf' : '#0d9488') : (darkMode ? '#cbd5e1' : ts), border: `1px solid ${inputBdr}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
            {pin.status === 'done' ? '✓ Done!' : 'Mark done'}
          </button>
          <button onClick={() => { onSetHero?.(pin.id === heroId ? null : pin.id); onClose(); }} style={{ flex: 1, minWidth: 120, padding: '11px', borderRadius: 14, background: pin.id === heroId ? (darkMode ? 'rgba(251,191,36,0.12)' : '#fffbeb') : secBg, color: pin.id === heroId ? (darkMode ? '#fbbf24' : '#92400e') : (darkMode ? '#cbd5e1' : ts), border: `1px solid ${pin.id === heroId ? (darkMode ? 'rgba(251,191,36,0.3)' : '#fde68a') : inputBdr}`, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>
            {pin.id === heroId ? '★ Remove focus' : '☆ Set as focus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Pin Sheet ────────────────────────────────────────────────────────
function ChapterPinSheet({ pin, onClose, onRemove, darkMode, hasLinkedTrip = false }) {
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#64748b' : '#9ca3af';
  const divider  = darkMode ? 'rgba(255,255,255,0.07)' : '#f0ece4';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';
  const mapsUrl  = pin.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.mapQuery)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.label)}`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10040, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', maxHeight: '88dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', ...sheetStyle }}>
        {/* Drag handle */}
        <div {...handleProps} style={{ padding: '14px 0 0', display: 'flex', justifyContent: 'center', ...handleProps.style }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        </div>

        {/* Cover image */}
        {getPinImageUrl(pin) && (
          <div style={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative' }}>
            <img src={getPinImageUrl(pin)} alt={pin.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }} />
          </div>
        )}

        <div style={{ padding: '18px 18px max(32px, calc(env(safe-area-inset-bottom) + 32px))' }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, color: '#5eadce', textTransform: 'uppercase', letterSpacing: '0.16em', margin: '0 0 4px', fontWeight: 700 }}>
                {pin.categoryId || 'experience'}
              </p>
              <h2 style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: 0, lineHeight: 1.1 }}>
                {pin.emoji ? `${pin.emoji} ${pin.label}` : pin.label}
              </h2>
            </div>
            <button onClick={onClose} style={{ flexShrink: 0, background: darkMode ? 'rgba(255,255,255,0.06)' : '#f5f3ee', border: 'none', borderRadius: '50%', width: 32, height: 32, color: ts, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Description */}
          {pin.description ? (
            <p style={{ fontSize: 14, color: tp, lineHeight: 1.6, margin: '0 0 14px' }}>{pin.description}</p>
          ) : (
            <p style={{ fontSize: 14, color: ts, fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 14px' }}>No description yet — tap "Find on Maps" to explore.</p>
          )}

          {/* Tip */}
          {pin.tip && (
            <div style={{ background: darkMode ? 'rgba(45,212,191,0.08)' : '#f0fdfb', border: `1px solid ${darkMode ? 'rgba(45,212,191,0.2)' : 'rgba(45,212,191,0.3)'}`, borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 4px' }}>Tip</p>
              <p style={{ fontSize: 13, color: tp, lineHeight: 1.55, margin: 0 }}>{pin.tip}</p>
            </div>
          )}

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, borderTop: `1px solid ${divider}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: ts }}>Status:</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: pin.status === 'done' ? '#0d9488' : (pin.status === 'planning' && hasLinkedTrip) ? '#7c3aed' : '#d97706', background: pin.status === 'done' ? (darkMode ? 'rgba(13,148,136,0.12)' : '#f0fdfb') : (pin.status === 'planning' && hasLinkedTrip) ? (darkMode ? 'rgba(124,58,237,0.12)' : '#f5f3ff') : (darkMode ? 'rgba(217,119,6,0.12)' : '#fffbeb'), padding: '2px 10px', borderRadius: 20 }}>
              {pin.status === 'done' ? '✓ Done' : (pin.status === 'planning' && hasLinkedTrip) ? 'Planning' : 'Dreaming'}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px', borderRadius: 14, background: '#5eadce', color: '#fff', textDecoration: 'none', fontFamily: CAVEAT, fontSize: 17, fontWeight: 700 }}>
              🗺️ Find on Maps
            </a>
            <button onClick={() => { onRemove?.(pin.id); onClose(); }} style={{ padding: '11px', borderRadius: 14, background: 'transparent', border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 15, cursor: 'pointer' }}>
              Remove from chapter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



// ─── Chapter Page ─────────────────────────────────────────────────────────────
function formatTripDateRange(start, end) {
  if (!start) return null;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [sy, sm, sd] = start.split('-').map(Number);
  if (!end || end === start) return `${months[sm-1]} ${sd}, ${sy}`;
  const [ey, em, ed] = end.split('-').map(Number);
  if (sy === ey && sm === em) return `${months[sm-1]} ${sd}–${ed}, ${sy}`;
  if (sy === ey) return `${months[sm-1]} ${sd} – ${months[em-1]} ${ed}, ${sy}`;
  return `${months[sm-1]} ${sd}, ${sy} – ${months[em-1]} ${ed}, ${ey}`;
}

function toDateOnlyTimestamp(value) {
  if (!value) return null;
  let date = null;
  if (value instanceof Date) {
    date = new Date(value);
  } else {
    const raw = String(value || '').trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      date = new Date(`${raw.slice(0, 10)}T00:00:00`);
    } else {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function PromptCreateChapterSheet({ onClose, onCreateBlank, onCreateFromPrompt, darkMode }) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const examples = useMemo(() => getChapterPromptExamples(), []);
  const sheetBg  = darkMode ? '#131c2e' : '#ffffff';
  const tp       = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts       = darkMode ? '#4a5568' : '#9ca3af';
  const inputBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';

  function submitBlank() {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onCreateBlank?.(nextTitle);
    onClose?.();
  }

  function submitPrompt() {
    const nextPrompt = prompt.trim();
    if (!nextPrompt) return;
    onCreateFromPrompt?.(nextPrompt);
    onClose?.();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(0,0,0,0.52)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: sheetBg, borderRadius: '24px 24px 0 0', padding: '24px 18px max(48px, calc(env(safe-area-inset-bottom) + 48px))', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 22px' }} />
        <p style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: '0 0 4px' }}>New Chapter</p>
        <p style={{ fontSize: 12, color: ts, margin: '0 0 18px' }}>Start with one trip idea and I&apos;ll build the first page for you</p>
        <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>Trip idea</p>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitPrompt(); }}
          placeholder='Vietnam with Pearl next spring'
          autoFocus
          rows={3}
          style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2', border: `1px solid ${inputBdr}`, borderRadius: 14, padding: '12px 13px', fontFamily: CAVEAT, fontSize: 20, lineHeight: 1.2, color: tp, outline: 'none', width: '100%', marginBottom: 10, boxSizing: 'border-box', resize: 'none' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              style={{ border: `1px solid ${inputBdr}`, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8f7f2', color: ts, borderRadius: 999, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}
            >
              {example}
            </button>
          ))}
        </div>
        <button onClick={submitPrompt} disabled={!prompt.trim()} style={{ width: '100%', padding: '12px', borderRadius: 14, background: prompt.trim() ? '#5eadce' : (darkMode ? 'rgba(94,173,206,0.3)' : '#bde0f0'), color: '#fff', border: 'none', fontFamily: CAVEAT, fontSize: 20, fontWeight: 700, cursor: prompt.trim() ? 'pointer' : 'not-allowed', marginBottom: 18 }}>
          Build my chapter ✨
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: inputBdr }} />
          <span style={{ fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.14em' }}>or start blank</span>
          <div style={{ flex: 1, height: 1, background: inputBdr }} />
        </div>
        <p style={{ fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>Chapter title</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitBlank()}
          placeholder='e.g. "Japan Someday" or "Road Trip"'
          style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : '#f8f7f2', border: `1px solid ${inputBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 18, color: tp, outline: 'none', width: '100%', marginBottom: 20, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'transparent', border: `1px solid ${inputBdr}`, color: ts, fontFamily: CAVEAT, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submitBlank} disabled={!title.trim()} style={{ flex: 2, padding: '12px', borderRadius: 14, background: title.trim() ? '#5eadce' : (darkMode ? 'rgba(94,173,206,0.3)' : '#bde0f0'), color: '#fff', border: 'none', fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, cursor: title.trim() ? 'pointer' : 'not-allowed' }}>
            Create Blank Chapter
          </button>
        </div>
      </div>
    </div>
  );
}

function ChecklistEditSheet({ pin, onClose, onSave, darkMode }) {
  const tp  = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts  = darkMode ? '#4a5568' : '#9ca3af';
  const lineBdr = darkMode ? 'rgba(255,255,255,0.09)' : '#e8e3da';
  const [title, setTitle] = useState(pin.label || '');
  const [items, setItems] = useState(() => (pin.meta?.items || []).length > 0 ? [...pin.meta.items] : [{ id: crypto.randomUUID(), text: '', checked: false }]);
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  const newItemRef = useRef(null);

  function addItem() {
    setItems(prev => [...prev, { id: crypto.randomUUID(), text: '', checked: false }]);
    setTimeout(() => newItemRef.current?.focus(), 50);
  }
  function removeItem(id) { setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev); }
  function updateItem(id, text) { setItems(prev => prev.map(i => i.id === id ? { ...i, text } : i)); }
  function toggleItem(id) { setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i)); }

  function save() {
    const validItems = items.filter(i => i.text.trim()).map(i => ({ ...i, text: i.text.trim() }));
    onSave(pin.id, { label: title.trim() || 'Checklist', meta: { ...(pin.meta || {}), items: validItems } });
    onClose();
  }

  const unchecked = items.filter(i => !i.checked);
  const checked   = items.filter(i => i.checked);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div onClick={e => e.stopPropagation()} style={{ ...sheetStyle, position: 'relative', background: darkMode ? '#1a1f2e' : '#faf9f5', borderRadius: '22px 22px 0 0', maxHeight: '88vh', overflowY: 'auto', paddingBottom: 'max(36px, calc(env(safe-area-inset-bottom) + 80px))' }}>
        {/* drag handle */}
        <div {...handleProps}><div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.15)' : '#d1c9bc' }} /></div>

        {/* header */}
        <div style={{ padding: '4px 20px 18px', borderBottom: `1px solid ${lineBdr}` }}>
          <p style={{ fontFamily: SANS, fontSize: 11, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 6px' }}>✅ Checklist</p>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give it a name…"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: CAVEAT, fontSize: 28, fontWeight: 700, color: tp, width: '100%', padding: 0 }}
          />
        </div>

        {/* unchecked items */}
        <div style={{ padding: '10px 20px 0' }}>
          {unchecked.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${lineBdr}`, padding: '4px 0' }}>
              <button onClick={() => toggleItem(item.id)} style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: `2px solid #2dd4bf`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              <input
                ref={idx === unchecked.length - 1 ? newItemRef : null}
                value={item.text}
                onChange={e => updateItem(item.id, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } if (e.key === 'Backspace' && !item.text && items.length > 1) { e.preventDefault(); removeItem(item.id); } }}
                placeholder="Add something…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: CAVEAT, fontSize: 20, color: tp, padding: '6px 0' }}
              />
              {items.length > 1 && <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: ts, fontSize: 15, cursor: 'pointer', padding: '0 2px', opacity: 0.5 }}>✕</button>}
            </div>
          ))}

          {/* add row */}
          <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px dashed ${ts}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: ts, fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span>
            </div>
            <span style={{ fontFamily: CAVEAT, fontSize: 20, color: ts }}>Add an item</span>
          </button>

          {/* checked items */}
          {checked.length > 0 && (
            <>
              <p style={{ fontFamily: SANS, fontSize: 11, color: ts, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, margin: '14px 0 4px' }}>Done {checked.length}</p>
              {checked.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${lineBdr}`, padding: '4px 0', opacity: 0.5 }}>
                  <button onClick={() => toggleItem(item.id)} style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#2dd4bf', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#0a1020' }}>✓</button>
                  <span style={{ fontFamily: CAVEAT, fontSize: 20, color: ts, textDecoration: 'line-through', flex: 1 }}>{item.text}</span>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: ts, fontSize: 15, cursor: 'pointer', padding: '0 2px' }}>✕</button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* save */}
        <div style={{ padding: '24px 20px 0' }}>
          <button onClick={save} style={{ width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: '#2dd4bf', color: '#0a1020', fontFamily: SANS, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em' }}>Save list</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CountdownEditSheet({ pin, onClose, onSave, darkMode }) {
  const tp = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts = darkMode ? '#4a5568' : '#9ca3af';
  const lineBdr = darkMode ? 'rgba(255,255,255,0.09)' : '#e8e3da';
  const inputBg = darkMode ? 'rgba(255,255,255,0.06)' : '#f0ece4';
  const [label, setLabel] = useState(pin.label || '');
  const [targetDate, setTargetDate] = useState(pin.meta?.targetDate || '');
  const [emoji, setEmoji] = useState(pin.emoji || '⏳');
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);

  function save() {
    onSave(pin.id, { label: label.trim() || 'Countdown', emoji, meta: { ...(pin.meta || {}), targetDate } });
    onClose();
  }

  const EMOJIS = ['✈️','🏖️','🎉','🏔️','🎂','🎵','🏰','🌸','🚀','🍣','🎬','🏄','🎪','🌮','🍕','🥂','🎠','🌍','⛷️','🛳️','🎡','🌅','🎆','🦋'];

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div onClick={e => e.stopPropagation()} style={{ ...sheetStyle, position: 'relative', background: darkMode ? '#1a1f2e' : '#faf9f5', borderRadius: '22px 22px 0 0', maxHeight: '88vh', overflowY: 'auto', paddingBottom: 'max(36px, calc(env(safe-area-inset-bottom) + 80px))' }}>
        <div {...handleProps}><div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.15)' : '#d1c9bc' }} /></div>

        <div style={{ padding: '4px 20px 18px', borderBottom: `1px solid ${lineBdr}` }}>
          <p style={{ fontFamily: SANS, fontSize: 11, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 6px' }}>⏳ Countdown</p>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="What are you counting down to?"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: CAVEAT, fontSize: 28, fontWeight: 700, color: tp, width: '100%', padding: 0 }}
          />
        </div>

        <div style={{ padding: '18px 20px 0' }}>
          <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: ts, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Date</p>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: inputBg, border: `1px solid ${lineBdr}`, borderRadius: 12, padding: '10px 13px', fontFamily: SANS, fontSize: 15, color: tp, outline: 'none', marginBottom: 20, colorScheme: darkMode ? 'dark' : 'light' }}
          />

          <p style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: ts, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Emoji</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 24 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${emoji === e ? '#f59e0b' : lineBdr}`, background: emoji === e ? (darkMode ? 'rgba(245,158,11,0.15)' : '#fffbeb') : 'transparent', fontSize: 20, cursor: 'pointer' }}>{e}</button>
            ))}
          </div>

          <button onClick={save} style={{ width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: '#f59e0b', color: '#0a1020', fontFamily: SANS, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em' }}>Save countdown</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ChapterPage({ chapter, pins, onBack, onAddMemory, onDeleteMemory, onAddSuggestion, onRemovePin, onDeleteChapter, onCreateTrip, onOpenLinkedTrip, darkMode, hasLinkedTrip = false, linkedTripDates = null, onInvite, onCoverChange, onPublishChange, onAddPin, onUpdatePin, onMovePin, onPinDataChange, onAutoSortPins, onCompletionChange }) {
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [memoryText, setMemoryText] = useState('');
  const [flippedPinId, setFlippedPinId] = useState(null);
  const [pinNotes, setPinNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('komo-chapter-notes') || '{}'); } catch { return {}; }
  });
  const savePinNote = (id, note) => {
    const next = { ...pinNotes, [id]: note };
    setPinNotes(next);
    try { localStorage.setItem('komo-chapter-notes', JSON.stringify(next)); } catch {}
    onPinDataChange?.(chapter.id, id, { notes: note });
  };
  const [pinAttachments, setPinAttachments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('komo-chapter-attachments') || '{}'); } catch { return {}; }
  });
  const savePinAttachment = (id, dataUrl) => {
    const next = { ...pinAttachments, [id]: dataUrl };
    setPinAttachments(next);
    try { localStorage.setItem('komo-chapter-attachments', JSON.stringify(next)); } catch {}
    onPinDataChange?.(chapter.id, id, { attachmentUrl: dataUrl });
  };
  const [tripAlbumPhotos, setTripAlbumPhotos] = useState([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCompletionTurn, setShowCompletionTurn] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeAdding, setPlaceAdding] = useState(null); // place_id being added
  const searchInputRef = useRef(null);

  useEffect(() => {
    const q = placeSearch.trim();
    if (q.length < 2) { setPlaceResults([]); return; }
    const t = setTimeout(async () => {
      setPlaceLoading(true);
      try {
        const res = await fetch(`/api/places?action=autocomplete&input=${encodeURIComponent(q)}&types=establishment`);
        const data = await res.json();
        setPlaceResults(Array.isArray(data.predictions) ? data.predictions.slice(0, 6) : []);
      } catch { setPlaceResults([]); }
      finally { setPlaceLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [placeSearch]);

  const PLACE_TYPE_EMOJI = {
    lodging: '🏨', hotel: '🏨',
    restaurant: '🍽️', food: '🍽️', meal_takeaway: '🍽️', cafe: '☕',
    bar: '🍸', night_club: '🎶',
    amusement_park: '🎢', tourist_attraction: '⭐', point_of_interest: '📍',
    park: '🌿', natural_feature: '🌿',
    shopping_mall: '🛍️', store: '🛍️', clothing_store: '🛍️',
    museum: '🏛️', art_gallery: '🖼️', church: '⛪', place_of_worship: '🕌',
    spa: '💆', gym: '💪',
    movie_theater: '🎬', stadium: '🏟️',
    airport: '✈️', train_station: '🚂', transit_station: '🚉',
    beach: '🏖️', campground: '⛺',
  };

  const handleSelectPlace = async (prediction) => {
    if (!onAddPin) return;
    setPlaceAdding(prediction.place_id);
    setPlaceSearch('');
    setPlaceResults([]);
    const types = prediction.types || [];
    const emoji = types.map(t => PLACE_TYPE_EMOJI[t]).find(Boolean) || '📍';
    const label = prediction.structured_formatting?.main_text || prediction.description;
    let imageUrl = '';
    try {
      const detailRes = await fetch(`/api/places?action=details&place_id=${prediction.place_id}`);
      const detail = await detailRes.json();
      const ref = detail.result?.photos?.[0]?.photo_reference;
      if (ref) imageUrl = `/api/places?action=photo&ref=${encodeURIComponent(ref)}&maxwidth=400`;
    } catch {}
    onAddPin({ type: 'photo', label, emoji, imageUrl, status: 'dreaming', categoryId: 'places', pinColor: 'teal', mapQuery: label });
    setPlaceAdding(null);
  };

  const [editingChecklist, setEditingChecklist] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showPublishSheet, setShowPublishSheet] = useState(false);
  const [publishTitle, setPublishTitle] = useState(chapter.public_title || chapter.title || '');
  const [publishDescription, setPublishDescription] = useState(chapter.public_description || '');
  const [publishTagsInput, setPublishTagsInput] = useState(Array.isArray(chapter.public_tags) ? chapter.public_tags.join(', ') : '');
  const [publishSaving, setPublishSaving] = useState(false);
  const [coverPinId, setCoverPinId] = useState(chapter.coverPinId || chapter.cover_pin_id || null);
  const [draggingPinId, setDraggingPinId] = useState(null);
  const [dragPreviewById, setDragPreviewById] = useState({});
  const menuRef = useRef(null);
  const chapterBoardRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggingTypeRef = useRef('');
  const didDragRef = useRef(false);
  const dragLatestPositionRef = useRef({});
  const draggingPinRef = useRef(null);
  // seed rotates each time the page mounts (chapter reopened)
  const [suggestionSeed] = useState(() => Math.floor(Math.random() * 997));
  // Prefer the live pins state so newly added suggestions appear in Pinned immediately.
  const chapterPins = useMemo(() => {
    const chapterItemIds = Array.isArray(chapter.itemIds) ? chapter.itemIds.map((id) => String(id || '')) : [];
    const livePins = Array.isArray(pins)
      ? pins.filter((pin) => (
          String(pin?.chapterId || '') === String(chapter.id || '')
          || chapterItemIds.includes(String(pin?.id || ''))
        ))
      : [];

    if (!Array.isArray(chapter.pins) || chapter.pins.length === 0) return livePins;

    const mergedById = new Map();
    livePins.forEach((pin) => {
      mergedById.set(String(pin?.id || ''), pin);
    });
    chapter.pins.forEach((pin) => {
      const key = String(pin?.id || '');
      mergedById.set(key, { ...(mergedById.get(key) || {}), ...pin });
    });

    const ordered = chapterItemIds
      .map((id) => mergedById.get(id))
      .filter(Boolean);

    const extras = Array.from(mergedById.values()).filter((pin) => !chapterItemIds.includes(String(pin?.id || '')));
    return [...ordered, ...extras];
  }, [chapter.id, chapter.itemIds, chapter.pins, pins]);
  const imagePins = chapterPins.filter(p => getPinImageUrl(p));
  const coverPin = (coverPinId ? imagePins.find(p => String(p.id) === String(coverPinId)) : null) || imagePins[0] || null;
  const canPublish = Boolean(onDeleteChapter);
  const chapterBoardPins = useMemo(
    () => chapterPins.map((pin, index) => {
      const normalized = normalizeBoardPin(pin, index, String(chapter.id || ''));
      const preview = dragPreviewById[String(pin.id || '')];
      return preview ? { ...normalized, ...preview } : normalized;
    }),
    [chapter.id, chapterPins, dragPreviewById],
  );
  const chapterBoardHeight = useMemo(() => {
    if (chapterBoardPins.length === 0) return 640;
    return Math.max(
      640,
      Math.ceil(chapterBoardPins.length / 2) * 240 + 260,
      ...chapterBoardPins.map((pin) => (Number(pin.y) || 0) + estimatedPinHeight(pin) + 180),
    );
  }, [chapterBoardPins]);

  function estimateChapterPinWidth(pin) {
    if (pin.type === 'sticker') return 72;
    if (pin.type === 'label') return 220;
    if (pin.type === 'note' || pin.type === 'checklist' || pin.type === 'countdown') return 156;
    return 156;
  }

  function handleChapterPinTap(pin) {
    if (didDragRef.current) return;
    if (pin.type === 'label' || pin.type === 'sticker') return;
    setSelectedPin(pin);
  }

  function startChapterPinDrag(e, pin) {
    if (e.target?.closest?.('button, textarea, input, label, a')) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches?.[0] ?? e;
    didDragRef.current = false;
    draggingTypeRef.current = pin.type;
    draggingPinRef.current = pin;
    dragOffsetRef.current = { x: touch.clientX - (Number(pin.x) || 0), y: touch.clientY - (Number(pin.y) || 0) };
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    dragLatestPositionRef.current[String(pin.id)] = { x: Number(pin.x) || 0, y: Number(pin.y) || 0, rot: pin.rot ?? 0 };
    setDraggingPinId(pin.id);
  }

  const onChapterPinMove = useCallback((e) => {
    if (!draggingPinId) return;
    if (typeof e.preventDefault === 'function' && e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches?.[0] ?? e;
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    if (!didDragRef.current && Math.hypot(dx, dy) < 6) return;
    didDragRef.current = true;
    const board = chapterBoardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const pinType = draggingTypeRef.current;
    const pinWidth = pinType === 'sticker' ? 72 : pinType === 'label' ? 220 : 156;
    const isDecor = pinType === 'label' || pinType === 'sticker';
    const isSticker = pinType === 'sticker';
    const maxX = Math.max(0, rect.width - (isSticker ? 24 : pinWidth));
    const maxY = Math.max(isDecor ? -320 : 0, chapterBoardHeight - 240);
    const nextX = Math.max(0, Math.min(maxX, touch.clientX - dragOffsetRef.current.x));
    const nextY = Math.max(isDecor ? -320 : 0, Math.min(maxY, touch.clientY - dragOffsetRef.current.y));
    const rot = dragLatestPositionRef.current[String(draggingPinId)]?.rot ?? 0;
    dragLatestPositionRef.current[String(draggingPinId)] = { x: nextX, y: nextY, rot };
    setDragPreviewById(prev => ({ ...prev, [String(draggingPinId)]: { x: nextX, y: nextY, rot } }));
  }, [chapterBoardHeight, draggingPinId]);

  const stopChapterPinDrag = useCallback(() => {
    if (!draggingPinId) return;
    const pin = draggingPinRef.current;
    const wasDragged = didDragRef.current;
    const latest = dragLatestPositionRef.current[String(draggingPinId)];
    if (wasDragged && latest) {
      onUpdatePin?.(draggingPinId, latest);
    } else if (!wasDragged && pin) {
      handleChapterPinTap(pin);
    }
    delete dragLatestPositionRef.current[String(draggingPinId)];
    didDragRef.current = false;
    draggingPinRef.current = null;
    setDraggingPinId(null);
    setDragPreviewById(prev => {
      if (!Object.prototype.hasOwnProperty.call(prev, String(draggingPinId))) return prev;
      const next = { ...prev };
      delete next[String(draggingPinId)];
      return next;
    });
  }, [draggingPinId, onUpdatePin]);

  useEffect(() => {
    if (!draggingPinId) return undefined;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousDocTouchAction = document.documentElement.style.touchAction;
    document.body.style.touchAction = 'none';
    document.documentElement.style.touchAction = 'none';
    const handleMove = (event) => onChapterPinMove(event);
    const handleEnd = () => stopChapterPinDrag();
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);
    return () => {
      document.body.style.touchAction = previousBodyTouchAction;
      document.documentElement.style.touchAction = previousDocTouchAction;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [draggingPinId, onChapterPinMove, stopChapterPinDrag]);

  useEffect(() => {
    setCoverPinId(chapter.coverPinId || chapter.cover_pin_id || null);
    setPublishTitle(chapter.public_title || chapter.title || '');
    setPublishDescription(chapter.public_description || '');
    setPublishTagsInput(Array.isArray(chapter.public_tags) ? chapter.public_tags.join(', ') : '');
  }, [chapter.coverPinId, chapter.cover_pin_id, chapter.public_description, chapter.public_tags, chapter.public_title, chapter.title]);

  useEffect(() => {
    const tripId = linkedTripDates?.trip_id;
    if (!tripId) { setTripAlbumPhotos([]); return; }
    supabase
      .from('trip_photos')
      .select('id, url, thumbnail_url, medium_url, caption, date, uploaded_by')
      .eq('sub_calendar_id', tripId)
      .order('date', { ascending: true })
      .then(({ data }) => setTripAlbumPhotos(data || []));
  }, [linkedTripDates?.trip_id]);

  async function pickCover(pin) {
    setCoverPinId(pin.id);
    setShowCoverPicker(false);
    const { error } = await supabase.from('chapters').update({ cover_pin_id: pin.id }).eq('id', chapter.id);
    if (error) {
      console.error('Cover save failed:', error);
      setCoverPinId(chapter.cover_pin_id || chapter.coverPinId || null);
      window.alert(`Could not save chapter cover right now: ${error.message || 'permission denied'}`);
      return;
    }
    onCoverChange?.({ chapterId: chapter.id, coverPinId: pin.id });
  }

  async function savePublishSettings(nextPublicValue) {
    if (!canPublish || publishSaving) return;
    const normalizedTitle = (publishTitle || chapter.title || '').trim();
    const normalizedDescription = publishDescription.trim();
    const normalizedTags = publishTagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);
    if (nextPublicValue && !normalizedTitle) {
      window.alert('Add a public title before publishing this chapter.');
      return;
    }
    setPublishSaving(true);
    const payload = {
      is_public: nextPublicValue,
      public_title: normalizedTitle || null,
      public_description: normalizedDescription || null,
      public_tags: normalizedTags,
      public_cover_pin_id: coverPinId || chapter.cover_pin_id || null,
      published_at: nextPublicValue ? new Date().toISOString() : null,
    };
    const { data, error } = await supabase
      .from('chapters')
      .update(payload)
      .eq('id', chapter.id)
      .select('id, is_public, public_title, public_description, public_tags, public_cover_pin_id, published_at')
      .single();
    setPublishSaving(false);
    if (error) {
      window.alert('Could not update publish settings right now.');
      return;
    }
    onPublishChange?.(chapter.id, data || payload);
    if (nextPublicValue) setShowPublishSheet(false);
  }
  const pageBg = darkMode ? '#0e1520' : '#faf8f3';
  const tp     = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts     = darkMode ? '#4a5568' : '#9ca3af';
  const cardBg = darkMode ? '#131c2e' : '#ffffff';
  const divider = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const tripDateRange = linkedTripDates ? formatTripDateRange(linkedTripDates.start_date, linkedTripDates.end_date) : null;
  const isCompleted = Boolean(chapter?.completedAt);
  const completedLabel = chapter?.completedAt
    ? new Date(chapter.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  useEffect(() => {
    if (!isCompleted || chapter?.completionAnimationSeenAt) {
      setShowCompletionTurn(false);
      return undefined;
    }
    setShowCompletionTurn(true);
    const timeoutId = window.setTimeout(() => {
      setShowCompletionTurn(false);
      onCompletionChange?.(chapter.id, { completionAnimationSeenAt: new Date().toISOString() });
    }, 1400);
    return () => window.clearTimeout(timeoutId);
  }, [chapter?.completionAnimationSeenAt, chapter?.id, isCompleted, onCompletionChange]);

  function submitMemory() {
    if (!memoryText.trim()) return;
    onAddMemory?.({ id: Date.now().toString(), type: 'note', text: memoryText.trim(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
    setMemoryText(''); setShowAddMemory(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
        @keyframes komo-page-turn {
          0% { transform: perspective(1400px) rotateY(0deg) scaleX(1); opacity: 1; }
          55% { transform: perspective(1400px) rotateY(-72deg) scaleX(0.95); opacity: 0.98; }
          100% { transform: perspective(1400px) rotateY(-90deg) translateX(-18%); opacity: 0; }
        }
      `}</style>
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: darkMode ? '#131c2e' : '#fff', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : '#e5e0d5'}`, padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ts, fontSize: 26, lineHeight: 1, padding: '0 4px', display: 'flex', alignItems: 'center' }}>‹</button>
            <div>
              <p style={{ fontSize: 10, color: '#5eadce', textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0, fontWeight: 700 }}>Chapter</p>
              <h1 style={{ fontFamily: CAVEAT, fontSize: 26, fontWeight: 700, color: tp, margin: 0, lineHeight: 1.1 }}>{chapter.title}</h1>
              {tripDateRange && (
                <p style={{ fontSize: 10, color: ts, margin: '2px 0 0', fontWeight: 600, letterSpacing: '0.06em' }}>{tripDateRange}</p>
              )}
              {isCompleted && (
                <p style={{ fontSize: 11, color: darkMode ? '#fde68a' : '#92400e', margin: '4px 0 0', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Completed {completedLabel ? `· ${completedLabel}` : ''}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isCompleted && (
              <button
                onClick={() => onCompletionChange?.(chapter.id, { completedAt: null, completionSource: null, completionAnimationSeenAt: null, reopenedAt: new Date().toISOString() })}
                style={{ background: darkMode ? 'rgba(250,204,21,0.12)' : '#fffbeb', border: `1px solid ${darkMode ? 'rgba(250,204,21,0.28)' : '#fde68a'}`, borderRadius: 20, padding: '6px 14px', fontSize: 15, color: darkMode ? '#fde68a' : '#92400e', cursor: 'pointer', flexShrink: 0, fontWeight: 700, fontFamily: CAVEAT }}
              >Reopen</button>
            )}
            {onInvite && (
              <button
                onClick={() => setShowInvite(true)}
                style={{ background: darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfb', border: `1px solid ${darkMode ? 'rgba(45,212,191,0.28)' : '#99f6e4'}`, borderRadius: 20, padding: '6px 14px', fontSize: 15, color: darkMode ? '#2dd4bf' : '#0d9488', cursor: 'pointer', flexShrink: 0, fontWeight: 700, fontFamily: CAVEAT }}
              >Invite</button>
            )}
            {hasLinkedTrip && linkedTripDates?.trip_id ? (
              <button
                onClick={() => onOpenLinkedTrip?.(linkedTripDates.trip_id)}
                style={{ background: darkMode ? 'rgba(125,211,252,0.14)' : '#ecfeff', border: `1px solid ${darkMode ? 'rgba(125,211,252,0.28)' : '#a5f3fc'}`, borderRadius: 20, padding: '6px 14px', fontSize: 15, color: darkMode ? '#7dd3fc' : '#0e7490', cursor: 'pointer', flexShrink: 0, fontWeight: 700, fontFamily: CAVEAT }}
              >Open trip</button>
            ) : onCreateTrip && (
              <button
                onClick={() => onCreateTrip(chapter)}
                style={{ background: darkMode ? 'rgba(125,211,252,0.14)' : '#ecfeff', border: `1px solid ${darkMode ? 'rgba(125,211,252,0.28)' : '#a5f3fc'}`, borderRadius: 20, padding: '6px 14px', fontSize: 15, color: darkMode ? '#7dd3fc' : '#0e7490', cursor: 'pointer', flexShrink: 0, fontWeight: 700, fontFamily: CAVEAT }}
              >Create trip</button>
            )}
            {onDeleteChapter && (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMenu(v => !v)}
                  style={{ background: 'none', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : '#e5e0d5'}`, borderRadius: 20, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: ts, cursor: 'pointer', flexShrink: 0 }}
                >⋯</button>
                {showMenu && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowMenu(false)} />
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, background: darkMode ? '#1e2d42' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5'}`, borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', minWidth: 160, overflow: 'hidden' }}>
                      {canPublish && (
                        <button
                          onClick={() => { setShowMenu(false); setShowPublishSheet(true); }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '13px 16px', fontSize: 17, fontWeight: 700, color: chapter.is_public ? (darkMode ? '#c4b5fd' : '#7c3aed') : tp, cursor: 'pointer', fontFamily: CAVEAT, borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#f0ece4'}` }}
                        >
                          {chapter.is_public ? '✦ Edit publish' : '✦ Publish'}
                        </button>
                      )}
                      <button
                        onClick={() => { setShowMenu(false); if (window.confirm(`Remove "${chapter.title}"? Pins will stay on your board.`)) onDeleteChapter(); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '13px 16px', fontSize: 17, fontWeight: 700, color: '#ef4444', cursor: 'pointer', fontFamily: CAVEAT }}
                      >✕ Remove chapter</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {chapter.is_public && (
        <div style={{ padding: '12px 16px 12px' }}>
          <div style={{ background: darkMode ? 'rgba(124,58,237,0.12)' : '#faf5ff', border: `1px solid ${darkMode ? 'rgba(196,181,253,0.18)' : '#e9d5ff'}`, borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: darkMode ? '#c4b5fd' : '#7c3aed' }}>Published template</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.45, color: darkMode ? '#d6d3f7' : '#5b21b6' }}>
              Other users will be able to discover this chapter and copy it into their own Komo Book.
            </p>
          </div>
        </div>
      )}

      {showCompletionTurn && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10080, pointerEvents: 'none', background: 'rgba(8,15,30,0.16)' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: darkMode ? 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))' : 'linear-gradient(135deg, rgba(255,251,235,0.98), rgba(255,255,255,0.96))',
              transformOrigin: 'left center',
              animation: 'komo-page-turn 1.35s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
              boxShadow: darkMode ? '0 0 80px rgba(0,0,0,0.45) inset' : '0 0 90px rgba(146,64,14,0.14) inset',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ transform: 'rotate(-4deg)', borderRadius: 20, padding: '16px 26px', background: darkMode ? 'rgba(250,204,21,0.16)' : 'rgba(255,251,235,0.94)', border: `1px solid ${darkMode ? 'rgba(250,204,21,0.32)' : '#fcd34d'}`, boxShadow: '0 16px 42px rgba(0,0,0,0.18)' }}>
              <div style={{ fontFamily: CAVEAT, fontSize: 34, fontWeight: 700, color: darkMode ? '#fde68a' : '#92400e', letterSpacing: '0.04em' }}>Completed</div>
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: darkMode ? '#fef3c7' : '#a16207', textAlign: 'center' }}>Turn the page</div>
            </div>
          </div>
        </div>
      )}

      {getPinImageUrl(coverPin) && (
        <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden' }}>
          <img src={getPinImageUrl(coverPin)} alt={chapter.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.55))' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
            <span style={{ fontFamily: CAVEAT, fontSize: 30, color: '#fff', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.6)', display: 'block' }}>{chapter.title}</span>
            {tripDateRange && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: '0.08em', textShadow: '0 1px 6px rgba(0,0,0,0.6)', display: 'block', marginTop: 3 }}>{tripDateRange}</span>
            )}
          </div>
          {(tripDateRange ? null : chapter.createdAt) && <div style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>{chapter.createdAt}</div>}
          {imagePins.length > 1 && (
            <button
              onClick={() => setShowCoverPicker(true)}
              style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '5px 11px', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >Change cover</button>
          )}
        </div>
      )}

      {showCoverPicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowCoverPicker(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: darkMode ? '#131c2e' : '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', padding: '20px 20px max(32px, calc(env(safe-area-inset-bottom) + 20px))' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 18px' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: darkMode ? '#e8eaf0' : '#1a1a2e', margin: '0 0 14px' }}>Choose cover photo</p>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {imagePins.map(pin => (
                <div
                  key={pin.id}
                  onClick={() => pickCover(pin)}
                  style={{ flexShrink: 0, width: 110, height: 110, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: String(pin.id) === String(coverPinId) || (!coverPinId && pin === imagePins[0]) ? '3px solid #2dd4bf' : '3px solid transparent', boxSizing: 'border-box' }}
                >
                  <img src={getPinImageUrl(pin)} alt={pin.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {onAddSuggestion && (
        <div style={{ paddingTop: 22 }}>
          <SuggestionStrip chapter={chapter} chapterPins={chapterPins} initialSeed={suggestionSeed} onAdd={onAddSuggestion} darkMode={darkMode} />
          <div style={{ margin: '16px 16px 0', borderTop: `1px dashed ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
        </div>
      )}

      <div
        data-chapter-dropzone="true"
        onDragOver={(event) => {
          if (!onAddSuggestion) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(event) => {
          if (!onAddSuggestion) return;
          event.preventDefault();
          try {
            const suggestion = JSON.parse(event.dataTransfer.getData('application/json') || '{}');
            if (suggestion?.label) onAddSuggestion(suggestion);
          } catch {}
        }}
        style={{ padding: '22px 16px 0' }}
      >
        {/* Place search */}
        {onAddPin && (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(255,255,255,0.06)' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5'}`, borderRadius: 14, padding: '9px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 15, opacity: 0.5, flexShrink: 0 }}>🔍</span>
              <input
                ref={searchInputRef}
                value={placeSearch}
                onChange={e => setPlaceSearch(e.target.value)}
                placeholder="Search places to add…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: CAVEAT, fontSize: 16, color: tp, minWidth: 0 }}
              />
              {placeLoading && <span style={{ fontSize: 12, color: ts, flexShrink: 0 }}>…</span>}
              {placeSearch && !placeLoading && (
                <button onClick={() => { setPlaceSearch(''); setPlaceResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: ts, padding: 0, flexShrink: 0 }}>✕</button>
              )}
            </div>
            {placeResults.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: darkMode ? '#1e2535' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5'}`, borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden' }}>
                {placeResults.map((p, i) => (
                  <button
                    key={p.place_id}
                    disabled={placeAdding === p.place_id}
                    onClick={() => handleSelectPlace(p)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: placeAdding === p.place_id ? 'default' : 'pointer', borderTop: i > 0 ? `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#f0ebe3'}` : 'none', textAlign: 'left', opacity: placeAdding && placeAdding !== p.place_id ? 0.4 : 1 }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{(p.types || []).map(t => PLACE_TYPE_EMOJI[t]).find(Boolean) || '📍'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: CAVEAT, fontSize: 16, color: tp, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {placeAdding === p.place_id ? 'Adding…' : (p.structured_formatting?.main_text || p.description)}
                      </div>
                      {p.structured_formatting?.secondary_text && (
                        <div style={{ fontSize: 11, color: ts, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 1 }}>{p.structured_formatting.secondary_text}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p style={{ fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 14px', fontWeight: 600 }}>Pinned · {chapterPins.length} item{chapterPins.length !== 1 ? 's' : ''}</p>
        <div
          ref={chapterBoardRef}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: chapterBoardHeight,
            borderRadius: 18,
            background: darkMode ? 'linear-gradient(180deg, rgba(18,27,42,0.92), rgba(10,16,26,0.96))' : 'linear-gradient(180deg, #fffdf8, #f7f1e7)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#ece5d8'}`,
            boxShadow: darkMode ? 'inset 0 1px 0 rgba(255,255,255,0.03), 0 14px 30px rgba(0,0,0,0.22)' : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 14px 28px rgba(161,140,108,0.12)',
            overflow: 'hidden',
            touchAction: draggingPinId ? 'none' : 'pan-y',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundImage: darkMode ? 'radial-gradient(circle at 20% 18%, rgba(94,173,206,0.08), transparent 30%), radial-gradient(circle at 82% 24%, rgba(45,212,191,0.08), transparent 26%)' : 'radial-gradient(circle at 18% 16%, rgba(251,207,232,0.24), transparent 28%), radial-gradient(circle at 82% 18%, rgba(191,219,254,0.2), transparent 24%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: darkMode ? 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)' : 'linear-gradient(rgba(160,140,110,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(160,140,110,0.06) 1px, transparent 1px)', backgroundSize: '34px 34px', opacity: darkMode ? 0.4 : 0.75, pointerEvents: 'none' }} />
          {chapterBoardPins.map((pin) => (
            <div
              key={pin.id}
              style={{
                position: 'absolute',
                left: pin.x,
                top: pin.y,
                transform: `rotate(${pin.rot}deg)${draggingPinId === pin.id ? ' scale(1.04)' : ''}`,
                zIndex: draggingPinId === pin.id ? 40 : (pin.type === 'label' || pin.type === 'sticker') ? 12 : 4,
                userSelect: 'none',
                transition: draggingPinId === pin.id ? 'none' : 'transform 0.16s ease',
                touchAction: 'none',
                filter: draggingPinId === pin.id
                  ? (darkMode ? 'drop-shadow(0 18px 34px rgba(0,0,0,0.68))' : 'drop-shadow(0 18px 34px rgba(0,0,0,0.24))')
                  : 'none',
              }}
              onMouseDown={(e) => { if (flippedPinId === pin.id) return; startChapterPinDrag(e, pin); }}
              onTouchStart={(e) => { if (flippedPinId === pin.id) return; startChapterPinDrag(e, pin); }}
            >
              {pin.type === 'note'
                ? <NotePin pin={pin} isDragging={draggingPinId === pin.id} onDelete={() => onRemovePin?.(pin.id)} onTap={() => handleChapterPinTap(pin)} darkMode={darkMode} />
                : pin.type === 'label'
                ? <LabelPin pin={pin} isDragging={draggingPinId === pin.id} onDelete={() => onRemovePin?.(pin.id)} darkMode={darkMode} />
                : pin.type === 'sticker'
                ? <StickerPin pin={pin} isDragging={draggingPinId === pin.id} onDelete={() => onRemovePin?.(pin.id)} />
                : pin.type === 'checklist'
                ? <ChecklistPin pin={pin} isDragging={draggingPinId === pin.id} onDelete={() => onRemovePin?.(pin.id)} onTap={() => setEditingChecklist(pin)} darkMode={darkMode} />
                : pin.type === 'countdown'
                ? <CountdownPin pin={pin} isDragging={draggingPinId === pin.id} onDelete={() => onRemovePin?.(pin.id)} onTap={() => handleChapterPinTap(pin)} />
                : (
                  <div style={{ position: 'relative', width: 162, minHeight: 185, perspective: '1200px' }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        minHeight: 185,
                        transformStyle: 'preserve-3d',
                        transition: draggingPinId === pin.id ? 'none' : 'transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                        transform: flippedPinId === pin.id ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        <div style={{ position: 'relative', width: 162, minHeight: 185 }}>
                          <PhotoPin pin={pin} isDragging={draggingPinId === pin.id} onDelete={() => onRemovePin?.(pin.id)} onTap={handleChapterPinTap} darkMode={darkMode} />
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setFlippedPinId(pin.id); }}
                            style={{ position: 'absolute', bottom: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.88)', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', zIndex: 10, color: '#9ca3af' }}
                            title="Write notes"
                          >✏️</button>
                        </div>
                      </div>
                      <div
                        style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ width: 162, minHeight: 185, background: '#fefce8', borderRadius: 2, boxShadow: '3px 5px 16px rgba(0,0,0,0.22)', padding: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                          <button onClick={(e) => { e.stopPropagation(); setFlippedPinId(null); }} style={{ position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 1 }}>↩</button>
                          <textarea
                            value={pin.notes || pinNotes[pin.id] || ''}
                            onChange={(e) => savePinNote(pin.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="notes..."
                            style={{ marginTop: 4, flex: 1, width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: CAVEAT, fontSize: 13, color: '#374151', lineHeight: 1.45, padding: 0 }}
                            maxLength={500}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                            {(pin.attachmentUrl || pinAttachments[pin.id]) ? (
                              <a href={pin.attachmentUrl || pinAttachments[pin.id]} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'block', width: 24, height: 24, borderRadius: 4, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                                <img src={pin.attachmentUrl || pinAttachments[pin.id]} alt="attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </a>
                            ) : <span />}
                            <label style={{ cursor: 'pointer', borderRadius: 999, background: 'rgba(255,255,255,0.7)', border: 'none', padding: '2px 6px', fontSize: 11, color: '#6b7280', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }} title="Attach photo" onClick={(e) => e.stopPropagation()}>
                              📎
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => savePinAttachment(pin.id, ev.target.result);
                                reader.readAsDataURL(file);
                                e.target.value = '';
                              }} />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ))}
          {chapterPins.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <p style={{ fontFamily: CAVEAT, fontSize: 22, color: ts, fontStyle: 'italic', margin: 0 }}>No pins yet — tap + to add your first pin</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ margin: '32px 16px 0', borderTop: `2px dashed ${divider}`, paddingTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0, fontWeight: 600 }}>Memories</p>
            <p style={{ fontFamily: CAVEAT, fontSize: 22, color: tp, margin: '2px 0 0', lineHeight: 1 }}>As it happens…</p>
          </div>
          <button onClick={() => setShowAddMemory(v => !v)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fbcfe8', border: 'none', color: '#831843', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>+</button>
        </div>
        {showAddMemory && (
          <div style={{ marginBottom: 16 }}>
            <textarea value={memoryText} onChange={e => setMemoryText(e.target.value)} placeholder="Write a memory, note, or moment…" rows={3} autoFocus style={{ width: '100%', background: cardBg, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5'}`, borderRadius: 12, padding: '10px 13px', fontFamily: CAVEAT, fontSize: 16, color: tp, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => { setShowAddMemory(false); setMemoryText(''); }} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5'}`, color: ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitMemory} disabled={!memoryText.trim()} style={{ flex: 2, padding: '10px', borderRadius: 12, background: '#fbcfe8', border: 'none', color: '#831843', fontFamily: CAVEAT, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: memoryText.trim() ? 1 : 0.5 }}>Save memory</button>
            </div>
          </div>
        )}
        {tripAlbumPhotos.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, color: ts, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, margin: '0 0 10px' }}>Trip photos · {tripAlbumPhotos.length}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {tripAlbumPhotos.map(photo => {
                const src = photo.thumbnail_url || photo.medium_url || photo.url;
                return (
                  <div key={photo.id} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: darkMode ? 'rgba(255,255,255,0.05)' : '#f0ece4' }}>
                    <img src={src} alt={photo.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {chapter.memories?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chapter.memories.map(mem => (
              <div key={mem.id} style={{ background: cardBg, borderRadius: 14, padding: '12px 14px', boxShadow: `0 1px 4px ${darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'}` }}>
                <p style={{ fontFamily: CAVEAT, fontSize: 16, color: tp, margin: 0, lineHeight: 1.5 }}>{mem.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: ts }}>{mem.date}</span>
                  <button onClick={() => onDeleteMemory?.(mem.id)} style={{ background: 'none', border: 'none', fontSize: 11, color: ts, cursor: 'pointer', padding: 0 }}>remove</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          tripAlbumPhotos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <p style={{ fontFamily: CAVEAT, fontSize: 19, color: ts, fontStyle: 'italic', margin: 0 }}>No memories yet — they'll live here</p>
              <p style={{ fontSize: 12, color: ts, margin: '6px 0 0', opacity: 0.7 }}>Add notes and moments as this chapter unfolds</p>
            </div>
          )
        )}
      </div>

      {showInvite && (
        <InvitePicker
          targetType="chapter"
          targetId={chapter.id}
          targetTitle={chapter.title}
          ownerId={chapter.owner_id || ''}
          collaborators={chapter.collaborators || []}
          onInvite={onInvite}
          onClose={() => setShowInvite(false)}
          darkMode={darkMode}
        />
      )}

      {showPublishSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10060, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }} onClick={() => { if (!publishSaving) setShowPublishSheet(false); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: darkMode ? '#131c2e' : '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', padding: '20px 20px max(32px, calc(env(safe-area-inset-bottom) + 20px))' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 auto 18px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: tp, margin: 0, fontFamily: CAVEAT }}>Publish chapter</p>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: ts, margin: '6px 0 18px' }}>This makes your chapter discoverable as a read-only template that other people can copy.</p>
            <div style={{ display: 'grid', gap: 12, fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ts, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>Public title</span>
                <input value={publishTitle} onChange={e => setPublishTitle(e.target.value)} placeholder={chapter.title || 'Chapter title'} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5'}`, background: cardBg, color: tp, padding: '11px 13px', fontSize: 15, outline: 'none', fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ts, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>Description</span>
                <textarea value={publishDescription} onChange={e => setPublishDescription(e.target.value)} placeholder="What makes this chapter useful?" rows={3} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5'}`, background: cardBg, color: tp, padding: '11px 13px', fontSize: 15, outline: 'none', resize: 'none', fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ts, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>Tags</span>
                <input value={publishTagsInput} onChange={e => setPublishTagsInput(e.target.value)} placeholder="family, food, weekend, disneyland" style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5'}`, background: cardBg, color: tp, padding: '11px 13px', fontSize: 15, outline: 'none', fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {chapter.is_public && (
                <button onClick={() => savePublishSettings(false)} disabled={publishSaving} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: `1px solid ${darkMode ? 'rgba(248,113,113,0.35)' : '#fecaca'}`, background: darkMode ? 'rgba(127,29,29,0.16)' : '#fef2f2', color: '#dc2626', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: publishSaving ? 0.6 : 1 }}>Unpublish</button>
              )}
              <button onClick={() => setShowPublishSheet(false)} disabled={publishSaving} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5'}`, background: 'transparent', color: ts, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: publishSaving ? 0.6 : 1 }}>Cancel</button>
              <button onClick={() => savePublishSettings(true)} disabled={publishSaving} style={{ flex: 1.2, padding: '12px 14px', borderRadius: 14, border: 'none', background: darkMode ? '#7c3aed' : '#8b5cf6', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: publishSaving ? 0.6 : 1, fontFamily: CAVEAT }}>{publishSaving ? 'Saving…' : (chapter.is_public ? 'Save changes' : 'Publish')}</button>
            </div>
          </div>
        </div>
      )}

      {selectedPin && (
        <ChapterPinSheet
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onRemove={id => { onRemovePin?.(id); setSelectedPin(null); }}
          darkMode={darkMode}
          hasLinkedTrip={hasLinkedTrip}
        />
      )}

      {(onAddPin || onAutoSortPins) && (
        <div style={{ position: 'fixed', bottom: 'calc(88px + env(safe-area-inset-bottom))', right: 20, zIndex: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
          {onAutoSortPins && (
            <button
              onClick={() => onAutoSortPins(chapter.id)}
              title="Auto-sort chapter pins"
              style={{ width: 52, height: 52, borderRadius: '50%', background: darkMode ? 'rgba(139,92,246,0.15)' : '#f5f3ff', border: `1px solid ${darkMode ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.25)'}`, color: darkMode ? '#c4b5fd' : '#6d28d9', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: darkMode ? '0 6px 18px rgba(0,0,0,0.35)' : '0 3px 10px rgba(139,92,246,0.18)', fontWeight: 700, lineHeight: 1 }}
            >✦</button>
          )}
          {onAddPin && (
            <button
              onClick={() => setShowAddSheet(true)}
              style={{ width: 52, height: 52, borderRadius: '50%', background: '#2dd4bf', color: '#0a1020', border: 'none', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(45,212,191,0.4)', fontWeight: 700, lineHeight: 1 }}
            >+</button>
          )}
        </div>
      )}

      {showAddSheet && (
        <AddSheet
          onClose={() => setShowAddSheet(false)}
          onAdd={(data) => { onAddPin?.(data); setShowAddSheet(false); }}
          darkMode={darkMode}
          chapterOnly
        />
      )}
      {editingChecklist && (
        <ChecklistEditSheet
          pin={editingChecklist}
          onClose={() => setEditingChecklist(null)}
          onSave={(pinId, updates) => {
            onUpdatePin?.(pinId, updates);
            setEditingChecklist(null);
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// ─── Auto-sort helpers ────────────────────────────────────────────────────────
const SORT_CATEGORY_META = {
  places:      { text: 'Places ✈️',       textColor: '#0d9488', styleVariant: 'tape' },
  food:        { text: 'Food & Dining 🍜', textColor: '#d97706', styleVariant: 'tape' },
  experiences: { text: 'Experiences ✨',   textColor: '#7c3aed', styleVariant: 'tape' },
  home:        { text: 'Home 🏡',          textColor: '#db2777', styleVariant: 'tape' },
  buy:         { text: 'Wishlist 🛍️',      textColor: '#2563eb', styleVariant: 'tape' },
  notes:       { text: 'Notes 📝',         textColor: '#92400e', styleVariant: 'tape' },
};

function normalizeSortCategory(categoryId = '') {
  const normalized = String(categoryId || '').trim().toLowerCase();
  if (normalized === 'travel' || normalized === 'adventure') return 'places';
  return normalized;
}

function buildAutoSortedPins(pins, onAddDream, onDeleteDream, onUpdateDream, startY = 20, chapters = []) {
  const LEFT_X = 16, RIGHT_X = 208, LABEL_H = 54, PHOTO_ROW_H = 224, NOTE_ROW_H = 168, GROUP_GAP = 36;
  const autoOldLabels = pins.filter(p => p.autoGenerated);
  autoOldLabels.forEach(p => onDeleteDream?.(p.id));
  const chapterIdByPinId = new Map();
  (chapters || []).forEach(ch => {
    (ch.itemIds || []).forEach(id => {
      const pinId = String(id || '').trim();
      if (pinId) chapterIdByPinId.set(pinId, ch.id);
    });
  });
  const getSortChapterId = (pin) => String(pin?.chapterId || chapterIdByPinId.get(String(pin?.id || '').trim()) || '').trim();
  const isDonePin = (pin) => String(pin?.status || '').trim().toLowerCase() === 'done';
  // Chapter pins take precedence over regular categories and are moved back into their chapter clusters.
  const chapterPins = [];
  const seenChapterPinIds = new Set();
  (chapters || []).forEach(ch => {
    const chId = String(ch?.id || '').trim();
    if (!chId) return;
    const chapterItemIds = new Set((ch.itemIds || []).map(id => String(id || '').trim()).filter(Boolean));
    const chPins = pins.filter(p => (
      p.type !== 'label'
      && p.type !== 'sticker'
      && !p.autoGenerated
      && !seenChapterPinIds.has(String(p?.id || '').trim())
      && (String(p?.chapterId || '').trim() === chId || chapterItemIds.has(String(p?.id || '').trim()))
    ));
    const clusterY = getChapterClusterY(chapters, chId, pins);
    chPins.forEach((pin, i) => {
      const pinId = String(pin?.id || '').trim();
      if (pinId) seenChapterPinIds.add(pinId);
      const col = i % 2;
      const row = Math.floor(i / 2);
      const rowH = pin.type === 'note' ? CLUSTER_NOTE_ROW_H : CLUSTER_PHOTO_ROW_H;
      const updated = {
        ...pin,
        chapterId: chId,
        x: (col === 0 ? LEFT_X : RIGHT_X) + (Math.random() - 0.5) * 10,
        y: clusterY + CLUSTER_LABEL_H + row * rowH + (Math.random() - 0.5) * 8,
        rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8),
      };
      chapterPins.push(updated);
      onUpdateDream?.(updated);
    });
  });
  const contentPins = pins.filter(p => p.type !== 'label' && p.type !== 'sticker' && !p.autoGenerated && !isDonePin(p) && !getSortChapterId(p));
  const donePins    = pins.filter(p => p.type !== 'label' && p.type !== 'sticker' && !p.autoGenerated && isDonePin(p) && !getSortChapterId(p));
  const stickers    = pins.filter(p => p.type === 'sticker');
  const orderedCats = Object.keys(SORT_CATEGORY_META);
  const grouped = {};
  contentPins.forEach(p => {
    let cat;
    if (p.type === 'note') cat = 'notes';
    else if (p.sourceType === 'dreamshelf' || p.sourceType === 'products' || normalizeSortCategory(p.categoryId) === 'buy') cat = 'buy';
    else {
      const normalizedCategoryId = normalizeSortCategory(p.categoryId);
      cat = orderedCats.includes(normalizedCategoryId) ? normalizedCategoryId : 'experiences';
    }
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });
  const result = [...stickers, ...chapterPins];
  const newLabelPins = [];
  let yOffset = startY;
  orderedCats.forEach(catId => {
    const catPins = grouped[catId];
    if (!catPins || catPins.length === 0) return;
    const meta = SORT_CATEGORY_META[catId];
    const labelPin = { id: `auto-label-${catId}-${Date.now()}`, type: 'label', autoGenerated: true, text: meta.text, fontStyle: 'handwritten', fontSize: 'medium', textColor: meta.textColor, styleVariant: meta.styleVariant, x: LEFT_X, y: yOffset, rot: (Math.random() - 0.5) * 1.5 };
    result.push(labelPin); newLabelPins.push(labelPin); yOffset += LABEL_H;
    catPins.forEach((pin, i) => {
      const col = i % 2, row = Math.floor(i / 2), rowH = pin.type === 'note' ? NOTE_ROW_H : PHOTO_ROW_H;
      const updated = { ...pin, x: (col === 0 ? LEFT_X : RIGHT_X) + (Math.random() - 0.5) * 10, y: yOffset + row * rowH + (Math.random() - 0.5) * 8, rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8) };
      result.push(updated); onUpdateDream?.(updated);
    });
    yOffset += Math.ceil(catPins.length / 2) * (catPins.some(p => p.type === 'photo') ? PHOTO_ROW_H : NOTE_ROW_H) + GROUP_GAP;
  });
  if (donePins.length > 0) {
    const doneLabelPin = { id: `auto-label-done-${Date.now()}`, type: 'label', autoGenerated: true, text: 'Completed ✓', fontStyle: 'handwritten', fontSize: 'medium', textColor: '#c0392b', styleVariant: 'tape', x: LEFT_X, y: yOffset, rot: (Math.random() - 0.5) * 1.5 };
    result.push(doneLabelPin); newLabelPins.push(doneLabelPin); yOffset += LABEL_H;
    donePins.forEach((pin, i) => {
      const col = i % 2, row = Math.floor(i / 2), rowH = pin.type === 'note' ? NOTE_ROW_H : PHOTO_ROW_H;
      const updated = { ...pin, status: 'done', x: (col === 0 ? LEFT_X : RIGHT_X) + (Math.random() - 0.5) * 10, y: yOffset + row * rowH + (Math.random() - 0.5) * 8, rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8) };
      result.push(updated); onUpdateDream?.(updated);
    });
  }
  newLabelPins.forEach(lp => onAddDream?.(lp));
  return result;
}

function isAutoGeneratedSortLabel(pin = {}) {
  return Boolean(
    pin?.autoGenerated
    || pin?.meta?.autoGenerated
    || String(pin?.id || '').startsWith('auto-label-')
  );
}

function buildAutoSortedChapterPins(chapterPins, startY = 24) {
  const LEFT_X = 16, RIGHT_X = 208, LABEL_H = 54, PHOTO_ROW_H = 224, NOTE_ROW_H = 168, GROUP_GAP = 36;
  const basePins = Array.isArray(chapterPins) ? chapterPins : [];
  const stickers = basePins.filter((pin) => pin.type === 'sticker' && !isAutoGeneratedSortLabel(pin));
  const manualLabels = basePins.filter((pin) => pin.type === 'label' && !isAutoGeneratedSortLabel(pin));
  const contentPins = basePins.filter((pin) => pin.type !== 'label' && pin.type !== 'sticker' && !isAutoGeneratedSortLabel(pin) && String(pin?.status || '').trim().toLowerCase() !== 'done');
  const donePins = basePins.filter((pin) => pin.type !== 'label' && pin.type !== 'sticker' && !isAutoGeneratedSortLabel(pin) && String(pin?.status || '').trim().toLowerCase() === 'done');
  const orderedCats = Object.keys(SORT_CATEGORY_META);
  const grouped = {};

  contentPins.forEach((pin) => {
    let cat;
    if (pin.type === 'note') cat = 'notes';
    else if (pin.sourceType === 'dreamshelf' || pin.sourceType === 'products' || normalizeSortCategory(pin.categoryId) === 'buy') cat = 'buy';
    else {
      const normalizedCategoryId = normalizeSortCategory(pin.categoryId);
      cat = orderedCats.includes(normalizedCategoryId) ? normalizedCategoryId : 'experiences';
    }
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(pin);
  });

  const sortedPins = [...stickers, ...manualLabels];
  let yOffset = startY;
  orderedCats.forEach((catId) => {
    const catPins = grouped[catId];
    if (!catPins || catPins.length === 0) return;
    const meta = SORT_CATEGORY_META[catId];
    sortedPins.push({
      id: `auto-label-${catId}-${Date.now()}-${sortedPins.length}`,
      type: 'label',
      autoGenerated: true,
      text: meta.text,
      fontStyle: 'handwritten',
      fontSize: 'medium',
      textColor: meta.textColor,
      styleVariant: meta.styleVariant,
      x: LEFT_X,
      y: yOffset,
      rot: (Math.random() - 0.5) * 1.5,
      meta: { persistScope: 'chapter', autoGenerated: true },
    });
    yOffset += LABEL_H;
    catPins.forEach((pin, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const rowH = pin.type === 'note' ? NOTE_ROW_H : PHOTO_ROW_H;
      sortedPins.push({
        ...pin,
        x: (col === 0 ? LEFT_X : RIGHT_X) + (Math.random() - 0.5) * 10,
        y: yOffset + row * rowH + (Math.random() - 0.5) * 8,
        rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8),
      });
    });
    yOffset += Math.ceil(catPins.length / 2) * (catPins.some((pin) => pin.type === 'photo') ? PHOTO_ROW_H : NOTE_ROW_H) + GROUP_GAP;
  });

  if (donePins.length > 0) {
    sortedPins.push({
      id: `auto-label-done-${Date.now()}-${sortedPins.length}`,
      type: 'label',
      autoGenerated: true,
      text: 'Completed ✓',
      fontStyle: 'handwritten',
      fontSize: 'medium',
      textColor: '#c0392b',
      styleVariant: 'tape',
      x: LEFT_X,
      y: yOffset,
      rot: (Math.random() - 0.5) * 1.5,
      meta: { persistScope: 'chapter', autoGenerated: true },
    });
    yOffset += LABEL_H;
    donePins.forEach((pin, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const rowH = pin.type === 'note' ? NOTE_ROW_H : PHOTO_ROW_H;
      sortedPins.push({
        ...pin,
        status: 'done',
        x: (col === 0 ? LEFT_X : RIGHT_X) + (Math.random() - 0.5) * 10,
        y: yOffset + row * rowH + (Math.random() - 0.5) * 8,
        rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8),
      });
    });
  }

  return sortedPins;
}

function gridPosition(index) {
  const col = index % 2, row = Math.floor(index / 2);
  return { x: (col === 0 ? 16 : 208) + (Math.random() - 0.5) * 14, y: 64 + row * 240 + (Math.random() - 0.5) * 14, rot: (col === 0 ? -1 : 1) * (0.4 + Math.random() * 2.2) };
}

function estimatedPinHeight(pin = {}) {
  if (pin.type === 'label' || pin.type === 'sticker') return 80;
  if (pin.type === 'note') return 150;
  return 210;
}

function getPinImageUrl(pin = {}) {
  return String(
    pin?.resolvedImageUrl
    || resolveDreamImage(pin)
    || pin?.imageUrl
    || pin?.photoUrl
    || pin?.coverPhoto
    || pin?.photos?.[0]?.url
    || ''
  ).trim();
}

function normalizeBoardPin(pin, index = 0, forcedChapterId = '', pinPositionOverrides = {}) {
  const pos = (pin?.x == null || pin?.y == null)
    ? gridPosition(index)
    : { x: pin.x, y: pin.y, rot: pin.rot };
  const normalizedChapterId = String(forcedChapterId || pin?.chapterId || '').trim();
  const override = normalizedChapterId ? {} : (pinPositionOverrides?.[pin?.id] || {});
  return {
    ...pin,
    ...pos,
    ...override,
    rot: override.rot ?? pos.rot ?? pin?.rot ?? (Math.random() * 6 - 3),
    chapterId: normalizedChapterId || undefined,
    pinColor: pin?.pinColor ?? PIN_COLOR_OPTIONS[Math.floor(Math.random() * PIN_COLOR_OPTIONS.length)],
    noteColor: pin?.noteColor ?? 'yellow',
    imageUrl: getPinImageUrl(pin),
    photoUrl: getPinImageUrl(pin),
    type: pin?.type ?? (getPinImageUrl(pin) || pin?.emoji ? 'photo' : 'note'),
  };
}

function mergeBoardPinsWithChapterPins(basePins = [], sourceChapters = [], pinPositionOverrides = {}) {
  const byId = new Map();
  (Array.isArray(basePins) ? basePins : []).forEach((pin, index) => {
    const normalized = normalizeBoardPin(pin, index, '', pinPositionOverrides);
    const pinId = String(normalized?.id || '').trim();
    if (pinId) byId.set(pinId, normalized);
  });
  (Array.isArray(sourceChapters) ? sourceChapters : []).forEach((chapter, chapterIndex) => {
    const chapterId = String(chapter?.id || '').trim();
    (Array.isArray(chapter?.pins) ? chapter.pins : []).forEach((pin, pinIndex) => {
      const normalized = normalizeBoardPin(pin, chapterIndex + pinIndex, chapterId, pinPositionOverrides);
      const pinId = String(normalized?.id || '').trim();
      if (!pinId) return;
      const existing = byId.get(pinId);
      byId.set(pinId, existing
        ? {
            ...existing,
            ...normalized,
            notes: existing.notes ?? normalized.notes,
            attachmentUrl: existing.attachmentUrl ?? normalized.attachmentUrl,
            sourceType: existing.sourceType || normalized.sourceType,
            category: existing.category || normalized.category,
            chapterId: normalized.chapterId || existing.chapterId,
          }
        : normalized);
    });
  });
  return Array.from(byId.values()).filter((pin) => String(pin?.id || '').trim());
}

function positionBelowLowestPin(existingPins = [], addIndex = 0) {
  const pinned = (Array.isArray(existingPins) ? existingPins : []).filter(pin => pin && pin.type !== 'label' && pin.type !== 'sticker');
  if (!pinned.length) return gridPosition(addIndex);
  const lowestBottom = Math.max(...pinned.map(pin => (Number(pin.y) || 0) + estimatedPinHeight(pin)));
  const col = addIndex % 2, row = Math.floor(addIndex / 2);
  return { x: (col === 0 ? 16 : 208) + (Math.random() - 0.5) * 14, y: lowestBottom + 28 + row * 240 + (Math.random() - 0.5) * 10, rot: (col === 0 ? -1 : 1) * (0.4 + Math.random() * 2.2) };
}

// Module-level cache: remember which select clause worked so retries are skipped
let _chaptersWorkingSelect = null;
let _pinsWorkingSelect = null;

// ─── Main SomedayPage ─────────────────────────────────────────────────────────
const SomedayPage = ({
  dreams = SAMPLE_PINS,
  onAddDream,
  onUpdateDream,
  onDeleteDream,
  onConvertToEvent,
  onConvertToTrip,
  onBack,
  currentUser,
  authUserId = '',
  ownerName,
  onChaptersChange,
  onPersistPinLayout,
  pinPositionOverrides = {},
  onCreateTripFromChapter,
  onOpenTripById,
  darkMode = false,
  chaptersWithLinkedTrips = new Set(),
  userEmail = '',
  inviteRefreshToken = 0,
  initialChapters = [],
  onPinDataChange,
  requestedChapterId = '',
  onRequestedChapterHandled,
}) => {
  const [pins, setPins] = useState(() => mergeBoardPinsWithChapterPins(
    dreams.map((d, idx) => {
      const pos = (d.x == null || d.y == null) ? gridPosition(idx) : { x: d.x, y: d.y, rot: d.rot };
        return {
          ...d,
          ...pos,
          rot: pos.rot ?? d.rot ?? (Math.random() * 6 - 3),
          pinColor: d.status === 'planning'
            ? 'purple'
            : (d.pinColor ?? PIN_COLOR_OPTIONS[Math.floor(Math.random() * PIN_COLOR_OPTIONS.length)]),
          noteColor: d.noteColor ?? 'yellow',
          imageUrl: getPinImageUrl(d),
          photoUrl: getPinImageUrl(d),
          type: d.type ?? (getPinImageUrl(d) || d.emoji ? 'photo' : 'note'),
        };
    }),
    initialChapters,
    pinPositionOverrides
  ));
  const [filter, setFilter]               = useState('all');
  const [showAdd, setShowAdd]             = useState(false);
  const [detailPin, setDetailPin]         = useState(null);
  const [editingCountdown, setEditingCountdown] = useState(null);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [dragging, setDragging]           = useState(null);
  const [heroId, setHeroId]               = useState(() => { try { return localStorage.getItem('someday-hero-id') || null; } catch { return null; } });
  const [chapters, setChapters]           = useState(() => Array.isArray(initialChapters) && initialChapters.length > 0 ? initialChapters : []);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [chapterPromptGroup, setChapterPromptGroup] = useState(null);
  const [dismissedGroups, setDismissedGroups] = useState(new Set());
  const [pendingInvites, setPendingInvites] = useState([]);
  const [flippedBoardPinId, setFlippedBoardPinId] = useState(null);
  const [boardPinNotes, setBoardPinNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('komo-board-notes') || '{}'); } catch { return {}; }
  });
  const saveBoardPinNote = useCallback((id, note) => {
    setBoardPinNotes((prev) => {
      const next = { ...prev, [id]: note };
      try { localStorage.setItem('komo-board-notes', JSON.stringify(next)); } catch {}
      return next;
    });
    const linkedChapterId = String((Array.isArray(chapters) ? chapters : []).find((chapter) => (
      Array.isArray(chapter?.pins) && chapter.pins.some((pin) => String(pin?.id || '') === String(id || ''))
    ))?.id || '').trim();
    onPinDataChange?.(linkedChapterId || undefined, id, { notes: note });
  }, [chapters, onPinDataChange]);
  const [boardPinAttachments, setBoardPinAttachments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('komo-board-attachments') || '{}'); } catch { return {}; }
  });
  const saveBoardPinAttachment = useCallback((id, dataUrl) => {
    setBoardPinAttachments((prev) => {
      const next = { ...prev, [id]: dataUrl };
      try { localStorage.setItem('komo-board-attachments', JSON.stringify(next)); } catch {}
      return next;
    });
    const linkedChapterId = String((Array.isArray(chapters) ? chapters : []).find((chapter) => (
      Array.isArray(chapter?.pins) && chapter.pins.some((pin) => String(pin?.id || '') === String(id || ''))
    ))?.id || '').trim();
    onPinDataChange?.(linkedChapterId || undefined, id, { attachmentUrl: dataUrl });
  }, [chapters, onPinDataChange]);
  const normalizedAuthUserId = String(authUserId || '').trim();
  const normalizedCurrentUser = String(currentUser || '').trim();
  const chapterOwnerIdentity = normalizedAuthUserId || normalizedCurrentUser;

  const dragOffset      = useRef({ x: 0, y: 0 });
  const dragStartPoint  = useRef({ x: 0, y: 0 });
  const canvasRef       = useRef();
  const didDrag         = useRef(false);
  const draggingTypeRef = useRef(null);
  const dreamsSyncedRef = useRef(false);
  const autoSortPendingRef = useRef(false);
  const deletedChapterPinIds = useRef((() => {
    try {
      const raw = localStorage.getItem('chapter-pins-deleted');
      const parsed = JSON.parse(raw || '[]');
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch { return new Set(); }
  })());
  const markPinDeleted = useCallback((pinId) => {
    const id = String(pinId);
    deletedChapterPinIds.current.add(id);
    try {
      // Cap at 500 to prevent unbounded growth
      const arr = [...deletedChapterPinIds.current].slice(-500);
      localStorage.setItem('chapter-pins-deleted', JSON.stringify(arr));
    } catch {}
  }, []);

  const groups = useMemo(() => detectGroups(pins), [pins]);
  const activeChaptersForLayout = useMemo(
    () => (Array.isArray(chapters) ? chapters.filter((chapter) => !chapter?.completedAt) : []),
    [chapters]
  );

  // Chapter cluster layout (computed, not stored in pins)
  const { layout: chapterLayout, totalHeight: chapterTotalHeight } = useMemo(
    () => computeChapterLayout(activeChaptersForLayout, pins),
    [activeChaptersForLayout, pins]
  );

  useEffect(() => {
    try { if (heroId) localStorage.setItem('someday-hero-id', heroId); else localStorage.removeItem('someday-hero-id'); } catch {}
  }, [heroId]);

  // One-time sync: if pins initialised empty (dreams was empty at mount due to async
  // bucket-list hydration) repopulate from dreams once they arrive.
  // Also syncs status-only changes (e.g. 'done') for already-present pins.
  useEffect(() => {
    if (dreamsSyncedRef.current || dreams.length === 0) return;
    dreamsSyncedRef.current = true;
    setPins(ps => {
      if (ps.length === 0) {
        // Full repopulation — async hydration arrived after mount
        return dreams.map((d, idx) => {
          const pos = (d.x == null || d.y == null) ? gridPosition(idx) : { x: d.x, y: d.y, rot: d.rot };
          return { ...d, ...pos, rot: pos.rot ?? d.rot ?? (Math.random() * 6 - 3), pinColor: d.pinColor ?? PIN_COLOR_OPTIONS[Math.floor(Math.random() * PIN_COLOR_OPTIONS.length)], noteColor: d.noteColor ?? 'yellow', imageUrl: getPinImageUrl(d), photoUrl: getPinImageUrl(d), type: d.type ?? (getPinImageUrl(d) || d.emoji ? 'photo' : 'note') };
        });
      }
      // Keep lightweight source fields in sync when parent dream data changes.
      const sourceById = new Map(dreams.map(d => [String(d.id), d]));
      let changed = false;
      const next = ps.map(p => {
        const source = sourceById.get(String(p.id));
        const s = source?.status;
        const nextNotes = source?.notes;
        const nextAttachmentUrl = source?.attachmentUrl;
        const nextImageUrl = getPinImageUrl(source);
        const nextLabel = source?.label ?? source?.text;
        const nextEmoji = source?.emoji;
        if (
          source
          && (
            s !== undefined && (s !== p.status || (s === 'planning' && p.pinColor !== 'purple') || (s !== 'planning' && p.pinColor === 'purple' && !p.chapterId))
            || nextNotes !== undefined && nextNotes !== p.notes
            || nextAttachmentUrl !== undefined && nextAttachmentUrl !== p.attachmentUrl
            || nextImageUrl !== getPinImageUrl(p)
            || nextLabel !== undefined && nextLabel !== p.label
            || nextEmoji !== undefined && nextEmoji !== p.emoji
          )
        ) {
          changed = true;
          return {
            ...p,
            ...(s !== undefined ? { status: s, pinColor: s === 'planning' ? 'purple' : (p.chapterId ? 'purple' : (p.pinColor === 'purple' ? 'teal' : p.pinColor)) } : {}),
            ...(nextNotes !== undefined ? { notes: nextNotes } : {}),
            ...(nextAttachmentUrl !== undefined ? { attachmentUrl: nextAttachmentUrl } : {}),
            ...(nextImageUrl !== undefined ? { imageUrl: nextImageUrl, photoUrl: nextImageUrl } : {}),
            ...(nextLabel !== undefined ? { label: nextLabel, text: source?.text ?? nextLabel } : {}),
            ...(nextEmoji !== undefined ? { emoji: nextEmoji } : {}),
          };
        }
        return p;
      });
      return changed ? next : ps;
    });
  }, [dreams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onChaptersChange?.(chapters);
  }, [chapters, onChaptersChange]);

  useEffect(() => {
    if (!Array.isArray(initialChapters) || initialChapters.length === 0) return;
    setPins((prev) => mergeBoardPinsWithChapterPins(prev, initialChapters, pinPositionOverrides));
  }, [initialChapters, pinPositionOverrides]);

  // Auto-sort board whenever a new chapter is created so all items land in the
  // right zones without requiring the user to manually press the wand.
  useEffect(() => {
    if (!autoSortPendingRef.current) return;
    autoSortPendingRef.current = false;
    const startY = chapterTotalHeight > 20 ? chapterTotalHeight + 32 : 20;
    const nextPinsSnapshot = buildAutoSortedPins(pins, onAddDream, onDeleteDream, onUpdateDream, startY, activeChaptersForLayout);
    setPins(nextPinsSnapshot);
    if (nextPinsSnapshot.length > 0) onPersistPinLayout?.(nextPinsSnapshot);
  }, [activeChaptersForLayout, chapterTotalHeight, onAddDream, onDeleteDream, onPersistPinLayout, onUpdateDream, pins]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Supabase helpers ────────────────────────────────────────────────────────
  const pinToRow = (pin, chapterId, position = 0) => ({
    id: pin.id,
    chapter_id: chapterId,
    label: pin.label || '',
    description: pin.description || pin.text || '',
    image_url: getPinImageUrl(pin),
    emoji: pin.emoji || '',
    category_id: pin.categoryId || '',
    status: pin.status || 'dreaming',
    tip: pin.tip || '',
    map_query: pin.mapQuery || '',
    pin_color: pin.pinColor || '',
    note_color: pin.noteColor || 'yellow',
    type: pin.type || 'note',
    x: pin.x || 0,
    y: pin.y || 0,
    rot: pin.rot || 0,
    meta: {
      ...(pin.meta || {}),
      notes: pin.notes ?? '',
      attachmentUrl: pin.attachmentUrl ?? '',
      text: pin.text ?? '',
      fontStyle: pin.fontStyle,
      fontSize: pin.fontSize,
      textColor: pin.textColor,
      styleVariant: pin.styleVariant,
      sticker: pin.sticker,
      size: pin.size,
    },
    position,
  });

  const rowToPin = (row) => {
    const isChapterRow = Boolean(String(row?.chapter_id || '').trim());
    const override = isChapterRow ? {} : (pinPositionOverrides?.[row?.id] || {});
    return ({
      id: row.id,
      label: row.label || '',
      description: row.description || '',
      text: row.meta?.text ?? row.description ?? '',
      notes: row.meta?.notes ?? '',
      attachmentUrl: row.meta?.attachmentUrl ?? '',
      imageUrl: row.image_url || '',
      photoUrl: row.image_url || '',
      emoji: row.emoji || '',
      categoryId: row.category_id || '',
      status: row.status || 'dreaming',
      tip: row.tip || '',
      mapQuery: row.map_query || '',
      pinColor: row.pin_color || 'teal',
      noteColor: row.note_color || 'yellow',
      type: row.type || 'note',
      meta: row.meta || null,
      fontStyle: row.meta?.fontStyle,
      fontSize: row.meta?.fontSize,
      textColor: row.meta?.textColor,
      styleVariant: row.meta?.styleVariant,
      sticker: row.meta?.sticker,
      size: row.meta?.size,
      x: override.x ?? row.x ?? 0,
      y: override.y ?? row.y ?? 0,
      rot: override.rot ?? row.rot ?? 0,
    });
  };

  useEffect(() => {
    if (!currentUser || currentUser === 'guest') return;
    loadChapters();
    loadPendingInvites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authUserId, userEmail, inviteRefreshToken]);

  useEffect(() => {
    const targetChapterId = String(requestedChapterId || '').trim();
    if (!targetChapterId) return;
    const chapterExists = chapters.some((chapter) => String(chapter?.id || '').trim() === targetChapterId);
    if (!chapterExists) return;
    setActiveChapterId(targetChapterId);
    const chapter = chapters.find((entry) => String(entry?.id || '').trim() === targetChapterId);
    if (chapter && !chapter.loaded) loadChapterContent(targetChapterId);
    onRequestedChapterHandled?.(targetChapterId);
  }, [chapters, onRequestedChapterHandled, requestedChapterId]);

  async function loadPendingInvites() {
    if (!userEmail) return;
    const { data: rows } = await supabase
      .from('chapter_collaborators')
      .select('chapter_id, invited_by, created_at')
      .eq('email', userEmail)
      .eq('status', 'pending');
    if (!rows || rows.length === 0) { setPendingInvites([]); return; }
    const chapterIds = rows.map(r => r.chapter_id);
    const { data: chapterRows } = await supabase.from('chapters').select('id, title').in('id', chapterIds);
    const chapterMap = new Map((chapterRows || []).map(c => [c.id, c]));
    setPendingInvites(rows.map(r => ({ ...r, chapterTitle: chapterMap.get(r.chapter_id)?.title || 'A Chapter' })));
  }

  async function fetchChaptersWithFallback(matchMode, value) {
    const allSelects = [
      'id, title, created_at, owner_id, cover_pin_id, is_public, public_title, public_description, public_tags, public_cover_pin_id, published_at, copy_count',
      'id, title, created_at, owner_id, cover_pin_id, is_public, public_title, public_description, public_tags, published_at',
      'id, title, created_at, owner_id, cover_pin_id',
    ];
    const selectAttempts = _chaptersWorkingSelect
      ? [_chaptersWorkingSelect, ...allSelects.filter(s => s !== _chaptersWorkingSelect)]
      : allSelects;
    for (const selectClause of selectAttempts) {
      let query = supabase.from('chapters').select(selectClause);
      if (matchMode === 'eq') query = query.eq('owner_id', value);
      if (matchMode === 'in') query = query.in('id', value);
      const { data, error } = await query;
      if (!error) { _chaptersWorkingSelect = selectClause; return data || []; }
    }
    return [];
  }

  async function fetchChapterPinRows(chapterIds = []) {
    if (!Array.isArray(chapterIds) || chapterIds.length === 0) return [];
    const allSelects = [
      'id, chapter_id, label, description, image_url, emoji, category_id, status, tip, map_query, pin_color, note_color, type, meta, x, y, rot, position',
      'id, chapter_id, label, description, image_url, emoji, category_id, status, tip, map_query, pin_color, note_color, type, x, y, rot, position',
      'id, chapter_id, label, description, image_url, emoji, category_id, status, tip, map_query, pin_color, note_color, type, x, y, rot',
    ];
    const selectAttempts = _pinsWorkingSelect
      ? [_pinsWorkingSelect, ...allSelects.filter(s => s !== _pinsWorkingSelect)]
      : allSelects;
    for (const selectClause of selectAttempts) {
      const { data, error } = await supabase
        .from('chapter_pins')
        .select(selectClause)
        .in('chapter_id', chapterIds);
      if (!error) { _pinsWorkingSelect = selectClause; return data || []; }
    }
    return [];
  }

  async function loadChapters() {
    const ownerIdsToLoad = [...new Set([normalizedCurrentUser, normalizedAuthUserId].filter(Boolean))];
    const [ownedResults, memberResult] = await Promise.all([
      Promise.all(ownerIdsToLoad.map((ownerId) => fetchChaptersWithFallback('eq', ownerId))),
      userEmail
        ? supabase.from('chapter_collaborators').select('chapter_id').eq('email', userEmail).eq('status', 'accepted')
        : Promise.resolve({ data: [] }),
    ]);

    const owned = Array.from(
      new Map(
        (ownedResults || [])
          .flat()
          .map((chapter) => [String(chapter?.id || ''), chapter])
      ).values()
    ).filter((chapter) => String(chapter?.id || '').trim());
    const collabIds = (memberResult.data || []).map(r => r.chapter_id).filter(id => !owned.some(c => c.id === id));

    // All chapter IDs are known now — fetch everything in parallel
    const allKnownIds = [...owned.map(c => c.id), ...collabIds].filter(Boolean);
    const [collabResult, remotePinRows, memoriesResult, collabsResult] = await Promise.all([
      collabIds.length > 0 ? fetchChaptersWithFallback('in', collabIds) : Promise.resolve([]),
      fetchChapterPinRows(allKnownIds),
      allKnownIds.length > 0
        ? supabase.from('chapter_memories').select('id, chapter_id, type, text, date_label').in('chapter_id', allKnownIds)
        : Promise.resolve({ data: [] }),
      allKnownIds.length > 0
        ? supabase.from('chapter_collaborators').select('chapter_id, email, invited_by, created_at').in('chapter_id', allKnownIds)
        : Promise.resolve({ data: [] }),
    ]);
    const collab = Array.isArray(collabResult) ? collabResult : [];

    const remote = [...owned, ...collab];
    const remotePinsByChapterId = new Map();
    (remotePinRows || []).forEach((row) => {
      const chapterId = String(row.chapter_id || '').trim();
      if (!chapterId) return;
      const mappedPin = { ...rowToPin(row), chapterId, position: Number(row.position || 0) };
      if (!remotePinsByChapterId.has(chapterId)) remotePinsByChapterId.set(chapterId, []);
      remotePinsByChapterId.get(chapterId).push(mappedPin);
    });

    const memoriesByChapterId = new Map();
    (memoriesResult.data || []).forEach((row) => {
      const cid = String(row.chapter_id || '').trim();
      if (!cid) return;
      if (!memoriesByChapterId.has(cid)) memoriesByChapterId.set(cid, []);
      memoriesByChapterId.get(cid).push({ id: row.id, type: row.type, text: row.text, date: row.date_label });
    });

    const collaboratorsByChapterId = new Map();
    (collabsResult.data || []).forEach((row) => {
      const cid = String(row.chapter_id || '').trim();
      if (!cid) return;
      if (!collaboratorsByChapterId.has(cid)) collaboratorsByChapterId.set(cid, []);
      collaboratorsByChapterId.get(cid).push({ email: row.email, invited_by: row.invited_by, created_at: row.created_at });
    });

    // One-time migration from localStorage
    if (remote.length === 0) {
      const localKey = `someday-chapters-${currentUser}`;
      let local = [];
      try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch {}
      if (local.length > 0) {
        await migrateLocalChapters(local);
        const afterMigrateResults = await Promise.all(ownerIdsToLoad.map((ownerId) => fetchChaptersWithFallback('eq', ownerId)));
        const afterMigrate = Array.from(
          new Map(
            (afterMigrateResults || [])
              .flat()
              .map((chapter) => [String(chapter?.id || ''), chapter])
          ).values()
        ).filter((chapter) => String(chapter?.id || '').trim());
        const migratedPinRows = await fetchChapterPinRows(afterMigrate.map((chapter) => chapter.id).filter(Boolean));
        const migratedPinsByChapterId = new Map();
        (migratedPinRows || []).forEach((row) => {
          const chapterId = String(row.chapter_id || '').trim();
          if (!chapterId) return;
          const mappedPin = { ...rowToPin(row), chapterId, position: Number(row.position || 0) };
          if (!migratedPinsByChapterId.has(chapterId)) migratedPinsByChapterId.set(chapterId, []);
          migratedPinsByChapterId.get(chapterId).push(mappedPin);
        });
        const migrated = (afterMigrate || []).map((chapter) => {
          const chapterPins = (migratedPinsByChapterId.get(String(chapter.id || '').trim()) || []).sort((a, b) => (a.position || 0) - (b.position || 0));
          return { ...chapter, itemIds: chapterPins.map((pin) => pin.id), pins: chapterPins, memories: [], collaborators: [], loaded: false };
        });
        setChapters(migrated);
        setPins((prev) => {
          const byId = new Map((Array.isArray(prev) ? prev : []).map((pin) => [String(pin?.id || ''), pin]));
          migrated.forEach((chapter) => {
            (chapter.pins || []).forEach((pin) => {
              const pinId = String(pin?.id || '').trim();
              if (!pinId) return;
              byId.set(pinId, { ...byId.get(pinId), ...pin, chapterId: String(pin?.chapterId || '').trim() || String(chapter?.id || '').trim() });
            });
          });
          return Array.from(byId.values()).filter((pin) => String(pin?.id || '').trim());
        });
        return;
      }
    }

    const hydratedChapters = remote.map((chapter) => {
      const cid = String(chapter.id || '').trim();
      const chapterPins = (remotePinsByChapterId.get(cid) || []).sort((a, b) => (a.position || 0) - (b.position || 0));
      return {
        ...chapter,
        pins: chapterPins,
        itemIds: chapterPins.map((pin) => pin.id),
        memories: memoriesByChapterId.get(cid) || [],
        collaborators: collaboratorsByChapterId.get(cid) || [],
        loaded: true,
      };
    });

    setChapters(prev => {
      const remoteIds = new Set(remote.map(c => c.id));
      const localOnly = prev.filter(c => !remoteIds.has(c.id));
      return [
        ...hydratedChapters.map(c => {
          const ex = prev.find(p => p.id === c.id);
          const itemIds = (c.itemIds || []).filter(id => !deletedChapterPinIds.current.has(String(id)));
          // Merge DB pins with local edits for matching current rows only.
          const dbPins = (c.pins || []).filter(dbPin => !deletedChapterPinIds.current.has(String(dbPin.id)));
          const localPins = (ex?.pins || []).filter(lp => !deletedChapterPinIds.current.has(String(lp.id)));
          const mergedPins = dbPins.map(dbPin => {
            const local = localPins.find(p => p.id === dbPin.id);
            return local ? { ...dbPin, ...local } : dbPin;
          });
          return {
            ...c,
            completedAt: ex?.completedAt ?? c.completedAt ?? null,
            completionSource: ex?.completionSource ?? c.completionSource ?? null,
            completionAnimationSeenAt: ex?.completionAnimationSeenAt ?? c.completionAnimationSeenAt ?? null,
            reopenedAt: ex?.reopenedAt ?? c.reopenedAt ?? null,
            itemIds,
            pins: mergedPins,
            loaded: true,
          };
        }),
        ...localOnly,
      ];
    });

    setPins((prev) => {
      const byId = new Map((Array.isArray(prev) ? prev : []).map((pin) => [String(pin?.id || ''), pin]));
      hydratedChapters.forEach((chapter) => {
        (chapter.pins || []).forEach((pin) => {
          const pinId = String(pin?.id || '').trim();
          if (!pinId) return;
          if (deletedChapterPinIds.current.has(pinId)) return;
          const chapterId = String(pin?.chapterId || '').trim() || String(chapter?.id || '').trim();
          // Local state wins over DB — preserves edits made since last fetch
          byId.set(pinId, { ...pin, ...(byId.get(pinId) || {}), chapterId });
        });
      });
      return Array.from(byId.values()).filter((pin) => {
        const id = String(pin?.id || '').trim();
        return id && !deletedChapterPinIds.current.has(id);
      });
    });
  }

  async function migrateLocalChapters(localChapters) {
    for (const ch of localChapters) {
      const { data: inserted } = await supabase
        .from('chapters')
        .insert({ owner_id: chapterOwnerIdentity || currentUser, title: ch.title })
        .select('id')
        .single();
      if (!inserted) continue;

      const pinsToMigrate = (ch.itemIds || []).map((pinId, idx) => {
        const pin = dreams.find(d => d.id === pinId);
        return pin ? pinToRow(pin, inserted.id, idx) : null;
      }).filter(Boolean);
      if (pinsToMigrate.length > 0) await supabase.from('chapter_pins').insert(pinsToMigrate);

      const mems = (ch.memories || []).map(m => ({ id: m.id, chapter_id: inserted.id, type: m.type || 'note', text: m.text || '', date_label: m.date || '' }));
      if (mems.length > 0) await supabase.from('chapter_memories').insert(mems);
    }
    try { localStorage.removeItem(`someday-chapters-${currentUser}`); } catch {}
  }

  async function loadChapterContent(chapterId) {
    const { data } = await supabase
      .from('chapters')
      .select('id, chapter_pins(*), chapter_collaborators(email, invited_by, created_at), chapter_memories(id, type, text, date_label)')
      .eq('id', chapterId)
      .single();
    if (!data) return;

    const loadedPins = (data.chapter_pins || []).sort((a, b) => (a.position || 0) - (b.position || 0)).map(rowToPin);
    const loadedMemories = (data.chapter_memories || []).map(m => ({ id: m.id, type: m.type, text: m.text, date: m.date_label }));

    setChapters(prev => prev.map(c => c.id === chapterId ? {
      ...c,
      completedAt: c.completedAt ?? null,
      completionSource: c.completionSource ?? null,
      completionAnimationSeenAt: c.completionAnimationSeenAt ?? null,
      reopenedAt: c.reopenedAt ?? null,
      pins: (() => {
        const filteredDb = loadedPins.filter(p => !deletedChapterPinIds.current.has(String(p.id)));
        const localPins = (c.pins || []).filter(p => !deletedChapterPinIds.current.has(String(p.id)));
        return filteredDb.map(dbPin => {
          const local = localPins.find(p => p.id === dbPin.id);
          return local ? { ...dbPin, ...local } : dbPin;
        });
      })(),
      itemIds: loadedPins.filter(p => !deletedChapterPinIds.current.has(String(p.id))).map(p => p.id),
      memories: loadedMemories,
      collaborators: data.chapter_collaborators || [],
      loaded: true,
    } : c));
  }

  function openChapter(chapterId) {
    setActiveChapterId(chapterId);
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch?.loaded) loadChapterContent(chapterId);
  }

  async function inviteToChapter(chapterId, email) {
    if (!email.trim()) return;
    const normalized = email.trim().toLowerCase();
    const nowIso = new Date().toISOString();
    const { error: insertErr } = await supabase
      .from('chapter_collaborators')
      .insert({ chapter_id: chapterId, email: normalized, invited_by: currentUser, status: 'pending', invited_at: nowIso, accepted_at: null });
    if (insertErr) {
      // Row exists — only re-invite if they haven't already accepted
      await supabase
        .from('chapter_collaborators')
        .update({ invited_by: currentUser, status: 'pending', invited_at: nowIso, accepted_at: null })
        .eq('chapter_id', chapterId)
        .eq('email', normalized)
        .neq('status', 'accepted');
    }
    setChapters(prev => prev.map(c => c.id === chapterId ? {
      ...c,
      collaborators: [...(c.collaborators || []).filter(x => x.email !== normalized), { email: normalized, invited_by: currentUser }],
    } : c));
  }

  async function acceptInvite(chapterId) {
    if (!userEmail) return;
    await supabase
      .from('chapter_collaborators')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('chapter_id', chapterId)
      .eq('email', userEmail);
    setPendingInvites(prev => prev.filter(i => i.chapter_id !== chapterId));
    loadChapters();
  }

  async function declineInvite(chapterId) {
    if (!userEmail) return;
    await supabase
      .from('chapter_collaborators')
      .delete()
      .eq('chapter_id', chapterId)
      .eq('email', userEmail);
    setPendingInvites(prev => prev.filter(i => i.chapter_id !== chapterId));
  }

  function updateChapterPublishState(chapterId, patch) {
    setChapters(prev => prev.map(chapter => (
      String(chapter.id) === String(chapterId)
        ? { ...chapter, ...patch }
        : chapter
    )));
  }

  function updateChapterCompletionState(chapterId, patch = {}) {
    const normalizedChapterId = String(chapterId || '').trim();
    if (!normalizedChapterId || !patch || typeof patch !== 'object') return;
    setChapters((prev) => prev.map((chapter) => (
      String(chapter?.id || '').trim() === normalizedChapterId
        ? { ...chapter, ...patch }
        : chapter
    )));
  }

  useEffect(() => {
    setPins(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const toAdd = (Array.isArray(dreams) ? dreams : []).filter(d => !existingIds.has(d.id));
      if (!toAdd.length) return prev;
      const newPins = toAdd.reduce((acc, d) => {
        const pos = (d.x == null || d.y == null) ? positionBelowLowestPin([...prev, ...acc], acc.length) : { x: d.x, y: d.y, rot: d.rot };
        acc.push({ ...d, ...pos, rot: pos.rot ?? d.rot ?? (Math.random() * 6 - 3), pinColor: d.pinColor ?? PIN_COLOR_OPTIONS[Math.floor(Math.random() * PIN_COLOR_OPTIONS.length)], noteColor: d.noteColor ?? 'yellow', imageUrl: getPinImageUrl(d), photoUrl: getPinImageUrl(d), type: d.type ?? (getPinImageUrl(d) || d.emoji ? 'photo' : 'note') });
        return acc;
      }, []);
      return [...prev, ...newPins];
    });
  }, [dreams]);

  useEffect(() => {
    const chapterIdByPinId = new Map();
    (chapters || []).forEach((chapter) => {
      const chapterId = String(chapter?.id || '').trim();
      if (!chapterId) return;
      (chapter.itemIds || []).forEach((pinId) => {
        const normalizedPinId = String(pinId || '').trim();
        if (normalizedPinId) chapterIdByPinId.set(normalizedPinId, chapterId);
      });
      (chapter.pins || []).forEach((pin) => {
        const normalizedPinId = String(pin?.id || '').trim();
        if (normalizedPinId) chapterIdByPinId.set(normalizedPinId, chapterId);
      });
    });
    if (chapterIdByPinId.size === 0) return;
    setPins((prev) => {
      let changed = false;
      const next = prev.map((pin) => {
        const pinId = String(pin?.id || '').trim();
        if (!pinId) return pin;
        const chapterId = String(chapterIdByPinId.get(pinId) || '').trim();
        if (!chapterId || String(pin?.chapterId || '').trim() === chapterId) return pin;
        changed = true;
        return { ...pin, chapterId };
      });
      return changed ? next : prev;
    });
  }, [chapters]);

  useEffect(() => {
    const todayTs = toDateOnlyTimestamp(new Date());
    if (!chaptersWithLinkedTrips || chaptersWithLinkedTrips.size === 0 || todayTs === null) return;
    setChapters((prev) => {
      let changed = false;
      const next = prev.map((chapter) => {
        const chapterId = String(chapter?.id || '').trim();
        const linkedTrip = chaptersWithLinkedTrips.get(chapterId);
        if (!linkedTrip) return chapter;
        const tripEndTs = toDateOnlyTimestamp(linkedTrip?.end_date || linkedTrip?.start_date);
        if (tripEndTs === null || tripEndTs > todayTs || chapter?.completedAt || chapter?.reopenedAt) return chapter;
        changed = true;
        return {
          ...chapter,
          completedAt: new Date().toISOString(),
          completionSource: 'trip_end',
          completionAnimationSeenAt: null,
        };
      });
      return changed ? next : prev;
    });
  }, [chaptersWithLinkedTrips]);

  const pageBg      = darkMode ? '#0e1520' : '#faf8f3';
  const topbarBg    = darkMode ? '#131c2e' : '#ffffff';
  const topBdr      = darkMode ? 'rgba(255,255,255,0.05)' : '#e5e0d5';
  const tp          = darkMode ? '#e8eaf0' : '#1a1a2e';
  const ts          = darkMode ? '#4a5568' : '#9ca3af';
  const pillAct     = darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfb';
  const pillActBdr  = darkMode ? 'rgba(45,212,191,0.3)' : '#2dd4bf';
  const pillActTxt  = darkMode ? '#2dd4bf' : '#0d9488';
  const pillIdle    = darkMode ? 'rgba(255,255,255,0.04)' : '#f5f3ee';
  const pillIdleBdr = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e0d5';
  const boardBg = darkMode
    ? { backgroundColor: '#0e1520', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }
    : { backgroundColor: '#f5f2eb', backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' };

  const completedCount = pins.filter(p => p.status === 'done' && p.type !== 'label' && p.type !== 'sticker').length;
  const getPinChapterId = (pin) => {
    const directChapterId = String(pin?.chapterId || '').trim();
    if (directChapterId) return directChapterId;
    const pinId = String(pin?.id || '').trim();
    if (!pinId) return '';
    const matchedChapter = chapters.find(ch => (ch.itemIds || []).some(id => String(id || '') === pinId));
    return String(matchedChapter?.id || '').trim();
  };
  const isPinInChapter = (pin) => Boolean(getPinChapterId(pin));
  const linkedTripByChapterId = chaptersWithLinkedTrips instanceof Map ? chaptersWithLinkedTrips : new Map();
  const activeChapters = chapters.filter((chapter) => !chapter?.completedAt);
  const completedChapters = chapters.filter((chapter) => Boolean(chapter?.completedAt));
  const completedChapterIdSet = new Set(completedChapters.map((chapter) => String(chapter?.id || '').trim()).filter(Boolean));
  const isPinInCompletedChapter = (pin) => {
    const chapterId = getPinChapterId(pin);
    return Boolean(chapterId && completedChapterIdSet.has(chapterId));
  };
  const getChapterArchivePreview = (chapter) => {
    const chapterId = String(chapter?.id || '').trim();
    const chapterItemIds = new Set((chapter?.itemIds || []).map((id) => String(id || '').trim()).filter(Boolean));
    const chapterPins = pins.filter((pin) => {
      const pinChapterId = String(pin?.chapterId || '').trim();
      const pinId = String(pin?.id || '').trim();
      return pinChapterId === chapterId || chapterItemIds.has(pinId);
    });
    const imagePins = chapterPins.filter((pin) => getPinImageUrl(pin));
    const coverPinId = String(chapter?.cover_pin_id || chapter?.coverPinId || '').trim();
    const coverPin = (coverPinId ? imagePins.find((pin) => String(pin?.id || '') === coverPinId) : null) || imagePins[0] || null;
    return {
      imageUrl: getPinImageUrl(coverPin),
      pinCount: chapterPins.filter((pin) => pin?.type !== 'label' && pin?.type !== 'sticker').length,
      linkedTrip: linkedTripByChapterId.get(chapterId) || null,
    };
  };

  // Chapter pins excluded from category filter pills; only show in 'all'
  // Countdown pins are lifted into their own dedicated section above the board
  const visiblePins = (
    filter === 'all'  ? pins.filter(p => p.type !== 'countdown' && !isPinInCompletedChapter(p)) :
    filter === 'done' ? pins.filter(p => p.status === 'done' && !isPinInChapter(p)) :
                        pins.filter(p => p.categoryId === filter && p.status !== 'done' && !isPinInChapter(p))
  ).filter((pin) => (
    pin.id !== heroId
    && !(isPinInChapter(pin) && isAutoGeneratedSortLabel(pin))
  ));

  const displayedPins = filter === 'all' ? visiblePins : [...visiblePins].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const nudgedPins = filter === 'all'
    ? displayedPins
    : displayedPins.map((pin, index) => {
        const row = Math.floor(index / 2), col = index % 2;
        return { ...pin, x: Math.min(220 + col * 170, pin.x), y: 24 + row * 210 };
      });

  const activeBoardPins = pins.filter((pin) => !isPinInCompletedChapter(pin));
  const lowestPinBottom = activeBoardPins.filter(p => !isPinInChapter(p)).reduce((max, pin) => Math.max(max, (Number(pin.y) || 0) + estimatedPinHeight(pin)), 0);
  const BOARD_HEIGHT = Math.max(600, chapterTotalHeight + Math.ceil(activeBoardPins.length / 2) * 240 + 240, chapterTotalHeight + lowestPinBottom + 120);
  const focusPins = pins.filter((pin) => pin.type !== 'label' && pin.type !== 'sticker' && pin.status === 'planning' && !isPinInChapter(pin)).slice(0, 3);

  // ─── Drag ──────────────────────────────────────────────────────────────────
  function startDrag(e, id) {
    if (e.target?.closest?.('button')) return;
    e.preventDefault(); e.stopPropagation();
    didDrag.current = false;
    const touch = e.touches?.[0] ?? e;
    const pin = pins.find(p => p.id === id);
    if (!pin) return;
    draggingTypeRef.current = pin.type;
    dragOffset.current = { x: touch.clientX - pin.x, y: touch.clientY - pin.y };
    dragStartPoint.current = { x: touch.clientX, y: touch.clientY };
    setDragging(id);
    setPins(ps => { const idx = ps.findIndex(p => p.id === id); const arr = [...ps]; const [item] = arr.splice(idx, 1); arr.push(item); return arr; });
  }

  const onMove = useCallback((e) => {
    if (!dragging) return;
    if (typeof e.preventDefault === 'function' && e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches?.[0] ?? e;
    const dx = touch.clientX - dragStartPoint.current.x, dy = touch.clientY - dragStartPoint.current.y;
    if (!didDrag.current && Math.hypot(dx, dy) < 6) return;
    didDrag.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let nx = touch.clientX - dragOffset.current.x, ny = touch.clientY - dragOffset.current.y;
    const isDecor = draggingTypeRef.current === 'label' || draggingTypeRef.current === 'sticker';
    const isSticker = draggingTypeRef.current === 'sticker';
    nx = Math.max(0, Math.min(isSticker ? rect.width - 24 : rect.width - 170, nx));
    ny = Math.max(isDecor ? -320 : 0, Math.min(BOARD_HEIGHT - 240, ny));
    setPins(ps => ps.map(p => p.id === dragging ? { ...p, x: nx, y: ny } : p));
  }, [dragging, BOARD_HEIGHT]);

  const stopDrag = useCallback(() => {
    if (dragging) {
      const pin = pins.find(p => p.id === dragging);
      if (pin && didDrag.current) {
        onUpdateDream?.({ ...pin });
        onPersistPinLayout?.([pin]);
      }
      else if (pin && pin.type !== 'label' && pin.type !== 'sticker') handlePinClick(pin);
    }
    setDragging(null);
  }, [dragging, pins, onPersistPinLayout, onUpdateDream]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dragging) return undefined;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousDocTouchAction = document.documentElement.style.touchAction;
    document.body.style.touchAction = 'none';
    document.documentElement.style.touchAction = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchcancel', stopDrag);
    return () => {
      document.body.style.touchAction = previousBodyTouchAction;
      document.documentElement.style.touchAction = previousDocTouchAction;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', stopDrag);
      window.removeEventListener('touchcancel', stopDrag);
    };
  }, [dragging, onMove, stopDrag]);

  function handlePinClick(pin) {
    if (didDrag.current) return;
    if (pin.type === 'label' || pin.type === 'sticker') return;
    // Suggest chapter creation for auto-detected groups (once per group)
    if (!pin.chapterId) {
      const pinGroup = groups.find(g => g.pinIds.includes(pin.id) && !dismissedGroups.has(g.id) && !chapters.some(c => g.pinIds.every(id => c.itemIds.includes(id))));
      if (pinGroup) { setChapterPromptGroup(pinGroup); return; }
    }
    setDetailPin(pin);
  }

  async function createChapter(title, itemIds = [], options = {}) {
    const generatedPins = Array.isArray(options?.generatedPins) ? options.generatedPins : [];
    const { data: inserted } = await supabase
      .from('chapters')
      .insert({ owner_id: chapterOwnerIdentity || currentUser, title })
      .select('id, title, created_at, owner_id')
      .single();

    const chapterId = inserted?.id || `chapter-${Date.now()}`;
    const newChapter = {
      ...(inserted || {}),
      id: chapterId,
      title,
      itemIds: [...itemIds],
      memories: [],
      collaborators: [],
      loaded: true,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    if (inserted && itemIds.length > 0) {
      const rows = itemIds.map((pinId, idx) => {
        const pin = pins.find(p => p.id === pinId);
        return pin ? pinToRow(pin, inserted.id, idx) : null;
      }).filter(Boolean);
      if (rows.length > 0) supabase.from('chapter_pins').insert(rows).then(() => {});
    }

    const normalizedGeneratedPins = generatedPins.map((pin, index) => ({
      ...pin,
      id: pin.id || crypto.randomUUID(),
      chapterId,
      x: pin.x ?? gridPosition(index).x,
      y: pin.y ?? gridPosition(index).y,
      rot: pin.rot ?? gridPosition(index).rot,
    }));

    if (inserted && normalizedGeneratedPins.length > 0) {
      const generatedRows = normalizedGeneratedPins.map((pin, idx) => pinToRow(pin, inserted.id, idx));
      if (generatedRows.length > 0) supabase.from('chapter_pins').upsert(generatedRows).then(() => {});
    }

    setChapters(prev => {
      const updated = [...prev, {
        ...newChapter,
        itemIds: [...itemIds, ...normalizedGeneratedPins.map((pin) => pin.id)],
        pins: normalizedGeneratedPins,
      }];
      if (itemIds.length > 0) {
        const clusterY = getChapterClusterY(updated, chapterId, pins);
        setPins(ps => ps.map(p => {
          if (!itemIds.includes(p.id)) return p;
          const idx = itemIds.indexOf(p.id);
          const col = idx % 2, row = Math.floor(idx / 2);
          const rowH = p.type === 'note' ? CLUSTER_NOTE_ROW_H : CLUSTER_PHOTO_ROW_H;
          const updated2 = { ...p, chapterId, x: (col === 0 ? 16 : 208) + (Math.random() - 0.5) * 10, y: clusterY + CLUSTER_LABEL_H + row * rowH + (Math.random() - 0.5) * 8, rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8) };
          onUpdateDream?.(updated2);
          return updated2;
        }));
      }
      if (normalizedGeneratedPins.length > 0) {
        setPins(ps => [...ps, ...normalizedGeneratedPins]);
        window.setTimeout(() => { autoSortChapterPins(chapterId); }, 0);
      }
      return updated;
    });
    setChapterPromptGroup(null);
    setShowCreateChapter(false);
    autoSortPendingRef.current = true;
  }

  async function createChapterFromPrompt(prompt) {
    const generated = generateChapterFromPrompt(prompt);
    const generatedPins = [...(generated?.labels || []), ...(generated?.pins || [])];
    const chapterTitle = String(generated?.chapter?.title || '').trim() || 'New Chapter';
    await createChapter(chapterTitle, [], { generatedPins });
  }

  function addPinToChapter(pinId, chapterId) {
    setChapters(prev => prev.map(c => {
      if (c.id === chapterId) return { ...c, itemIds: [...new Set([...c.itemIds, pinId])] };
      return { ...c, itemIds: c.itemIds.filter(id => id !== pinId) };
    }));
    setPins(prev => {
      const chapterPinsCount = prev.filter(p => p.chapterId === chapterId).length;
      return prev.map(p => {
        if (p.id !== pinId) return p;
        const clusterY = getChapterClusterY(chapters, chapterId, prev);
        const col = chapterPinsCount % 2, row = Math.floor(chapterPinsCount / 2);
        const rowH = p.type === 'note' ? CLUSTER_NOTE_ROW_H : CLUSTER_PHOTO_ROW_H;
        const updated = { ...p, chapterId, x: (col === 0 ? 16 : 208) + (Math.random() - 0.5) * 10, y: clusterY + CLUSTER_LABEL_H + row * rowH + (Math.random() - 0.5) * 8, rot: (col === 0 ? -1 : 1) * (0.5 + Math.random() * 1.8) };
        onUpdateDream?.(updated);
        const position = chapterPinsCount;
        supabase.from('chapter_pins').upsert(pinToRow(updated, chapterId, position)).then(() => {});
        return updated;
      });
    });
  }

  function removePinFromChapter(pinId) {
    const pin = pins.find(p => p.id === pinId);
    const isChapterOnlyPin = pin?.meta?.persistScope === 'chapter';
    markPinDeleted(pinId);
    setChapters(prev => prev.map(c => ({
      ...c,
      itemIds: (c.itemIds || []).filter(id => id !== pinId),
      pins: (c.pins || []).filter(p => p.id !== pinId),
    })));
    setPins(prev => prev.flatMap((p) => {
      if (p.id !== pinId) return [p];
      if (isChapterOnlyPin) return [];
      return [{ ...p, chapterId: undefined }];
    }));
    supabase.from('chapter_pins').delete().eq('id', pinId).then(({ error }) => { if (error) console.error('chapter_pins delete failed:', error); });
  }

  function addSuggestionToChapter(suggestion, chapterId) {
    const position = chapters.find(c => c.id === chapterId)?.itemIds?.length || 0;
    const defaultPos = gridPosition(position);
    const newPin = {
      id: `pin-sug-${Date.now()}`,
      type: 'photo',
      label: suggestion.label,
      emoji: suggestion.emoji,
      imageUrl: suggestion.imageUrl || '',
      pinColor: 'teal',
      categoryId: suggestion.categoryId,
      status: 'planning',
      description: suggestion.description || '',
      tip: suggestion.tip || '',
      mapQuery: suggestion.mapQuery || '',
      meta: { persistScope: 'chapter' },
      chapterId,
      x: defaultPos.x,
      y: defaultPos.y,
      rot: defaultPos.rot,
    };
    setPins(prev => [...prev, newPin]);
    setChapters(prev => prev.map(c =>
      c.id === chapterId
        ? {
            ...c,
            itemIds: [...new Set([...(c.itemIds || []), newPin.id])],
            pins: [...(c.pins || []), newPin],
          }
        : c
    ));
    // Also write directly to chapter_pins so collaborators see it
    supabase.from('chapter_pins').upsert(pinToRow({ ...newPin, chapterId }, chapterId, position)).then(() => {});
  }

  function updateChapterPin(pinId, updates) {
    setPins(prev => prev.map(p => p.id === pinId ? { ...p, ...updates } : p));
    setChapters(prev => prev.map(c => ({ ...c, pins: (c.pins || []).map(p => p.id === pinId ? { ...p, ...updates } : p) })));
    const dbUpdates = {};
    if (updates.meta !== undefined) dbUpdates.meta = updates.meta;
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.text !== undefined) dbUpdates.description = updates.text;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.pinColor !== undefined) dbUpdates.pin_color = updates.pinColor;
    if (updates.noteColor !== undefined) dbUpdates.note_color = updates.noteColor;
    if (updates.x !== undefined) dbUpdates.x = updates.x;
    if (updates.y !== undefined) dbUpdates.y = updates.y;
    if (updates.rot !== undefined) dbUpdates.rot = updates.rot;
    if (Object.keys(dbUpdates).length > 0) {
      supabase.from('chapter_pins').update(dbUpdates).eq('id', pinId).then(({ error }) => {
        if (error) console.error('chapter_pins update failed:', pinId, error);
      });
    }
  }

  function moveChapterPinLocally(pinId, updates) {
    setPins(prev => prev.map(p => p.id === pinId ? { ...p, ...updates } : p));
    setChapters(prev => prev.map(c => ({ ...c, pins: (c.pins || []).map(p => p.id === pinId ? { ...p, ...updates } : p) })));
  }

  async function autoSortChapterPins(chapterId) {
    const normalizedChapterId = String(chapterId || '').trim();
    if (!normalizedChapterId) return;
    const chapter = chapters.find((entry) => String(entry?.id || '').trim() === normalizedChapterId);
    if (!chapter) return;

    const chapterItemIds = new Set((chapter.itemIds || []).map((id) => String(id || '').trim()).filter(Boolean));
    const currentChapterPins = pins.filter((pin) => (
      String(pin?.chapterId || '').trim() === normalizedChapterId
      || chapterItemIds.has(String(pin?.id || '').trim())
    ));
    const removedAutoLabelIds = currentChapterPins
      .filter((pin) => isAutoGeneratedSortLabel(pin))
      .map((pin) => String(pin.id || '').trim())
      .filter(Boolean);
    const nextChapterPins = buildAutoSortedChapterPins(currentChapterPins, 24).map((pin) => ({
      ...pin,
      chapterId: normalizedChapterId,
      meta: {
        ...(pin.meta || {}),
        persistScope: 'chapter',
        ...(isAutoGeneratedSortLabel(pin) ? { autoGenerated: true } : {}),
      },
    }));
    const nextChapterPinIds = new Set(nextChapterPins.map((pin) => String(pin.id || '').trim()).filter(Boolean));

    removedAutoLabelIds.forEach((pinId) => markPinDeleted(pinId));

    setPins((prev) => {
      const remaining = prev.filter((pin) => {
        const pinId = String(pin?.id || '').trim();
        if (!pinId) return false;
        if (removedAutoLabelIds.includes(pinId)) return false;
        if (String(pin?.chapterId || '').trim() !== normalizedChapterId && !chapterItemIds.has(pinId)) return true;
        return nextChapterPinIds.has(pinId);
      });
      const byId = new Map(remaining.map((pin) => [String(pin?.id || '').trim(), pin]));
      nextChapterPins.forEach((pin) => {
        const pinId = String(pin?.id || '').trim();
        if (!pinId) return;
        byId.set(pinId, { ...(byId.get(pinId) || {}), ...pin, chapterId: normalizedChapterId });
      });
      return Array.from(byId.values()).filter((pin) => String(pin?.id || '').trim());
    });

    setChapters((prev) => prev.map((entry) => (
      String(entry?.id || '').trim() === normalizedChapterId
        ? {
            ...entry,
            itemIds: nextChapterPins.map((pin) => pin.id),
            pins: nextChapterPins,
          }
        : entry
    )));
    if (nextChapterPins.length > 0) {
      window.setTimeout(() => {
        onPersistPinLayout?.(nextChapterPins);
      }, 0);
    }

    if (removedAutoLabelIds.length > 0) {
      await supabase.from('chapter_pins').delete().in('id', removedAutoLabelIds);
    }
    if (nextChapterPins.length > 0) {
      await supabase
        .from('chapter_pins')
        .upsert(nextChapterPins.map((pin, index) => pinToRow(pin, normalizedChapterId, index)));
    }
  }

  function addDirectPinToChapter(chapterId, pinData) {
    const position = (chapters.find(c => c.id === chapterId)?.itemIds || []).length;
    const defaultPos = gridPosition(position);
    const normalizedCategoryId = normalizeSortCategory(pinData.categoryId || '');
    const newPin = {
      id: crypto.randomUUID(),
      ...pinData,
      meta: { ...(pinData.meta || {}), persistScope: 'chapter' },
      chapterId,
      status: pinData.status || 'dreaming',
      categoryId: normalizedCategoryId || pinData.categoryId || '',
      pinColor: pinData.pinColor || (normalizedCategoryId === 'places' ? 'teal' : undefined),
      x: pinData.x ?? defaultPos.x,
      y: pinData.y ?? defaultPos.y,
      rot: pinData.rot ?? defaultPos.rot,
    };
    setPins(prev => [...prev, newPin]);
    setChapters(prev => prev.map(c =>
      c.id === chapterId
        ? {
            ...c,
            itemIds: [...new Set([...(c.itemIds || []), newPin.id])],
            pins: [...(c.pins || []), newPin],
          }
        : c
    ));
    supabase.from('chapter_pins').upsert(pinToRow({ ...newPin, chapterId }, chapterId, position)).then(({ error }) => { if (error) console.error('chapter_pins upsert failed:', error); });
  }

  function deleteChapter(chapterId) {
    setPins(prev => prev.map(p => {
      if (p.chapterId !== chapterId) return p;
      const updated = { ...p, chapterId: undefined };
      onUpdateDream?.(updated);
      return updated;
    }));
    setChapters(prev => prev.filter(c => c.id !== chapterId));
    if (activeChapterId === chapterId) setActiveChapterId(null);
    supabase.from('chapters').delete().eq('id', chapterId).then(() => {});
  }

  function addMemoryToChapter(chapterId, memory) {
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, memories: [...(c.memories || []), memory] } : c));
    supabase.from('chapter_memories').insert({ id: memory.id, chapter_id: chapterId, type: memory.type || 'note', text: memory.text || '', date_label: memory.date || '' }).then(() => {});
  }

  function deleteMemoryFromChapter(chapterId, memoryId) {
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, memories: (c.memories || []).filter(m => m.id !== memoryId) } : c));
    supabase.from('chapter_memories').delete().eq('id', memoryId).then(() => {});
  }

  function autoSort() {
    const startY = chapterTotalHeight > 20 ? chapterTotalHeight + 32 : 20;
    const nextPinsSnapshot = buildAutoSortedPins(pins, onAddDream, onDeleteDream, onUpdateDream, startY, activeChaptersForLayout);
    setPins(nextPinsSnapshot);
    if (nextPinsSnapshot.length > 0) onPersistPinLayout?.(nextPinsSnapshot);
  }

  function addPin(data) {
    const pos = positionBelowLowestPin(pins.filter(p => !p.chapterId));
    const newPin = { id: Date.now().toString(), ...pos, ...data };
    setPins(ps => [...ps, newPin]);
    onAddDream?.(newPin);
  }

  function deletePin(id) {
    const pin = pins.find(p => p.id === id);
    const pinType = pin?.type;
    const isChapterPin = Boolean(pin?.chapterId);
    if (isChapterPin && (pinType === 'checklist' || pinType === 'countdown')) {
      markPinDeleted(id);
    }
    setPins(ps => ps.filter(p => p.id !== id));
    setChapters(prev => prev.map(c => ({
      ...c,
      itemIds: (c.itemIds || []).filter(i => i !== id),
      pins: (c.pins || []).filter(p => p.id !== id),
    })));
    if (isChapterPin && (pinType === 'checklist' || pinType === 'countdown')) {
      supabase.from('chapter_pins').delete().eq('id', id).then(({ error }) => { if (error) console.error('chapter_pins delete failed:', error); });
    } else {
      onDeleteDream?.(id);
    }
  }

  function markDone(pin) {
    const updated = { ...pin, status: pin.status === 'done' ? 'dreaming' : 'done' };
    setPins(ps => ps.map(p => p.id === pin.id ? updated : p));
    onUpdateDream?.(updated);
  }

  function setPinFocusStatus(pin, status) {
    const nextStatus = status || 'dreaming';
    const updated = { ...pin, status: nextStatus, pinColor: nextStatus === 'planning' ? 'purple' : (pin.chapterId ? 'purple' : 'teal') };
    setPins((prev) => prev.map((entry) => (entry.id === pin.id ? updated : entry)));
    if (nextStatus !== 'planning' && String(heroId || '') === String(pin.id || '')) {
      setHeroId(null);
    }
    onUpdateDream?.(updated);
  }

  // ─── Chapter page view ────────────────────────────────────────────────────
  if (activeChapterId) {
    const chapter = chapters.find(c => c.id === activeChapterId);
    if (chapter) {
      return (
        <>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>
          <ChapterPage chapter={chapter} pins={pins} onBack={() => setActiveChapterId(null)} onAddMemory={mem => addMemoryToChapter(activeChapterId, mem)} onDeleteMemory={memId => deleteMemoryFromChapter(activeChapterId, memId)} onAddSuggestion={s => addSuggestionToChapter(s, activeChapterId)} onRemovePin={removePinFromChapter} onDeleteChapter={chapter.owner_id === currentUser ? () => deleteChapter(activeChapterId) : undefined} onCreateTrip={chapter.owner_id === currentUser ? onCreateTripFromChapter : undefined} onOpenLinkedTrip={onOpenTripById} darkMode={darkMode} hasLinkedTrip={chaptersWithLinkedTrips.has(String(chapter.id))} linkedTripDates={chaptersWithLinkedTrips.get(String(chapter.id)) || null} onInvite={email => inviteToChapter(activeChapterId, email)} onCoverChange={({ chapterId, coverPinId }) => setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, cover_pin_id: coverPinId } : c))} onPublishChange={updateChapterPublishState} onAddPin={(data) => addDirectPinToChapter(activeChapterId, data)} onUpdatePin={updateChapterPin} onMovePin={moveChapterPinLocally} onPinDataChange={onPinDataChange} onAutoSortPins={autoSortChapterPins} onCompletionChange={updateChapterCompletionState} />
        </>
      );
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 'max(100px, calc(env(safe-area-inset-bottom) + 100px))' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>

      {/* Sticky top bar */}
      <div style={{ background: topbarBg, borderBottom: `1px solid ${topBdr}`, position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ padding: '18px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ts, fontSize: 26, lineHeight: 1, padding: '0 4px', display: 'flex', alignItems: 'center' }}>‹</button>}
              <div>
                <h1 style={{ fontFamily: CAVEAT, fontSize: 34, fontWeight: 700, color: tp, margin: 0, lineHeight: 1 }}>
                  {(!ownerName || ownerName === currentUser)
                    ? <>✦ Your <span style={{ background: 'linear-gradient(90deg, #5eada0, #a89bc2, #c4867a, #c9a15d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Komo Book</span></>
                    : <>{ownerName}'s <span style={{ background: 'linear-gradient(90deg, #5eada0, #a89bc2, #c4867a, #c9a15d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Komo Book</span></>}
                </h1>
                <p style={{ fontSize: 11, color: ts, margin: '3px 0 0', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500 }}>
                  {pins.filter(p => p.type !== 'label' && p.type !== 'sticker').length} things pinned
                  {completedCount > 0 && <span style={{ color: '#c0392b', marginLeft: 6 }}>· {completedCount} dream{completedCount !== 1 ? 's' : ''} completed</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={autoSort} title="Auto-sort by category" style={{ width: 42, height: 42, borderRadius: '50%', background: darkMode ? 'rgba(139,92,246,0.15)' : '#f5f3ff', border: `1px solid ${darkMode ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.25)'}`, color: darkMode ? '#c4b5fd' : '#6d28d9', fontSize: 19, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✦</button>
              <button onClick={() => setShowAdd(true)} style={{ width: 42, height: 42, borderRadius: '50%', background: '#2dd4bf', border: 'none', color: '#0a1020', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(45,212,191,0.4)', fontWeight: 700 }}>+</button>
            </div>
          </div>

          {/* Book page tabs — always visible */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', borderBottom: `1px solid ${topBdr}` }}>
            <button onClick={() => setActiveChapterId(null)} style={{ flexShrink: 0, padding: '8px 14px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeChapterId === null ? '#2dd4bf' : 'transparent'}`, fontFamily: CAVEAT, fontSize: 15, color: activeChapterId === null ? (darkMode ? '#2dd4bf' : '#0d9488') : ts, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
              📌 Someday
            </button>
            {activeChapters.map(ch => (
              <button key={ch.id} onClick={() => openChapter(ch.id)} style={{ flexShrink: 0, padding: '8px 14px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeChapterId === ch.id ? '#5eadce' : 'transparent'}`, fontFamily: CAVEAT, fontSize: 15, color: activeChapterId === ch.id ? (darkMode ? '#5eadce' : '#0e7490') : ts, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
                📖 {ch.title}
              </button>
            ))}
            <button onClick={() => setShowCreateChapter(true)} style={{ flexShrink: 0, padding: '8px 14px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', fontFamily: CAVEAT, fontSize: 15, color: ts, cursor: 'pointer', whiteSpace: 'nowrap', opacity: 0.7 }}>
              + Chapter
            </button>
          </div>

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '10px 0 10px' }}>
            {CATEGORY_FILTERS.map(c => (
              <button key={c.id} onClick={() => setFilter(c.id)} style={{ flexShrink: 0, padding: '5px 13px', borderRadius: 20, background: filter === c.id ? pillAct : pillIdle, border: `1px solid ${filter === c.id ? pillActBdr : pillIdleBdr}`, color: filter === c.id ? pillActTxt : ts, fontFamily: CAVEAT, fontSize: 14, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pending chapter invitations */}
      {pendingInvites.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <p style={{ fontSize: 10, color: darkMode ? '#fbbf24' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 10px', fontWeight: 700 }}>
            📬 Chapter Invitations
          </p>
          {pendingInvites.map(invite => (
            <div key={invite.chapter_id} style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e0d5'}`, borderRadius: 16, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: CAVEAT, fontSize: 18, fontWeight: 700, color: tp, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📖 {invite.chapterTitle}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: ts }}>You were invited to join this chapter</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => declineInvite(invite.chapter_id)}
                  style={{ padding: '6px 12px', borderRadius: 20, background: 'transparent', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.15)' : '#e5e0d5'}`, color: ts, fontSize: 13, cursor: 'pointer', fontFamily: CAVEAT, fontSize: 14 }}
                >
                  Decline
                </button>
                <button
                  onClick={() => acceptInvite(invite.chapter_id)}
                  style={{ padding: '6px 16px', borderRadius: 20, background: '#2dd4bf', border: 'none', color: '#0a1020', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: CAVEAT }}
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Focus pins */}
      {(() => {
        const heroPin = heroId ? pins.find(p => p.id === heroId) : null;
        if (focusPins.length === 0 && !heroPin) return null;
        const visibleFocusPins = focusPins.length > 0 ? focusPins : [heroPin];
        return (
          <div style={{ padding: '20px 16px 12px' }}>
            <p style={{ fontSize: 10, color: darkMode ? '#fbbf24' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 12px', fontWeight: 700, textAlign: visibleFocusPins.length === 1 ? 'center' : 'left' }}>★ Focus</p>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', justifyContent: visibleFocusPins.length === 1 ? 'center' : 'flex-start', paddingBottom: 4 }}>
              {visibleFocusPins.map((focusPin) => {
                if (!focusPin) return null;
                const isNote = focusPin.type === 'note';
                const noteScheme = isNote ? (NOTE_COLORS[focusPin.noteColor] || NOTE_COLORS.yellow)[darkMode ? 'dark' : 'light'] : null;
                return (
                  <div key={`focus-${focusPin.id}`} onClick={() => setDetailPin({ ...focusPin, resolvedImageUrl: getPinImageUrl(focusPin) })} style={{ cursor: 'pointer', transform: `rotate(${(focusPin.rot ?? 0) * 0.3}deg)`, transition: 'transform 0.2s', flexShrink: 0 }}>
                    {isNote ? (
                      <div style={{ background: noteScheme.bg, padding: '18px 18px 20px', boxShadow: '0 10px 36px rgba(0,0,0,0.18)', width: 220, minHeight: 120, position: 'relative', borderRadius: 2 }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, borderWidth: '0 26px 26px 0', borderStyle: 'solid', borderColor: `transparent ${noteScheme.fold} transparent transparent` }} />
                        <Pushpin colorKey="purple" darkMode={darkMode} />
                        <p style={{ fontFamily: CAVEAT, fontSize: 19, color: noteScheme.text, lineHeight: 1.45, margin: 0, wordBreak: 'break-word' }}>{focusPin.text}</p>
                      </div>
                    ) : (
                      <div style={{ background: darkMode ? '#e2e8f0' : '#ffffff', padding: '8px 8px 0', borderRadius: 3, boxShadow: '0 10px 36px rgba(0,0,0,0.18)', width: 180, position: 'relative' }}>
                        <Pushpin colorKey="purple" darkMode={darkMode} />
                        <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 2 }}>
                          {getPinImageUrl(focusPin) ? <img src={getPinImageUrl(focusPin)} alt={focusPin.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>{focusPin.emoji || '📌'}</div>}
                        </div>
                        <div style={{ padding: '8px 4px 10px', textAlign: 'center' }}>
                          <div style={{ fontFamily: CAVEAT, fontSize: 16, color: '#374151', lineHeight: 1.3 }}>{focusPin.emoji ? `${focusPin.emoji} ${focusPin.label || focusPin.text}` : (focusPin.label || focusPin.text)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Countdowns */}
      {(() => {
        const countdownPins = pins.filter(p => p.type === 'countdown' && !p.chapterId);
        if (countdownPins.length === 0) return null;
        return (
          <div style={{ padding: '20px 16px 0' }}>
            <p style={{ fontSize: 10, color: darkMode ? '#fbbf24' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 12px', fontWeight: 700 }}>⏳ Countdowns</p>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {countdownPins.map(pin => {
                const targetDate = pin.meta?.targetDate || '';
                let days = null;
                if (targetDate) {
                  const [y, m, d] = targetDate.split('-').map(Number);
                  const target = new Date(y, m - 1, d);
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  days = Math.round((target - today) / 86400000);
                }
                let bg, accent, textCol, numCol, urgencyLabel;
                if (days === null)   { bg = '#f3f4f6'; accent = '#9ca3af'; textCol = '#6b7280'; numCol = '#9ca3af'; urgencyLabel = '—'; }
                else if (days < 0)   { bg = '#f3f4f6'; accent = '#d1d5db'; textCol = '#9ca3af'; numCol = '#d1d5db'; urgencyLabel = 'passed'; }
                else if (days === 0) { bg = '#fffbeb'; accent = '#f59e0b'; textCol = '#92400e'; numCol = '#f59e0b'; urgencyLabel = 'TODAY! 🎉'; }
                else if (days <= 7)  { bg = '#fff0f5'; accent = '#f472b6'; textCol = '#831843'; numCol = '#ec4899'; urgencyLabel = days === 1 ? 'day to go! 🔥' : 'days to go! 🔥'; }
                else if (days <= 30) { bg = '#fffbeb'; accent = '#fbbf24'; textCol = '#78350f'; numCol = '#f59e0b'; urgencyLabel = 'days away'; }
                else                 { bg = '#f0fdf9'; accent = '#2dd4bf'; textCol = '#134e4a'; numCol = '#0d9488'; urgencyLabel = 'days away'; }
                if (darkMode) { bg = '#1e2535'; textCol = darkMode && days === null ? '#6b7280' : textCol; }
                return (
                  <div key={pin.id} onClick={() => setEditingCountdown(pin)} style={{ flexShrink: 0, background: bg, borderRadius: 20, padding: '16px 16px 20px', minWidth: 130, position: 'relative', boxShadow: '0 4px 18px rgba(0,0,0,0.10)', border: `2px solid ${accent}44`, textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 30, marginBottom: 4 }}>{pin.emoji || '⏳'}</div>
                    {days === 0 ? (
                      <div style={{ fontFamily: CAVEAT, fontSize: 20, fontWeight: 700, color: numCol, lineHeight: 1 }}>{urgencyLabel}</div>
                    ) : (
                      <>
                        <div style={{ fontFamily: CAVEAT, fontSize: 46, fontWeight: 700, color: numCol, lineHeight: 1 }}>{days === null || days < 0 ? Math.abs(days ?? 0) : days}</div>
                        <div style={{ fontFamily: SANS, fontSize: 9, color: textCol, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{urgencyLabel}</div>
                      </>
                    )}
                    <div style={{ fontFamily: CAVEAT, fontSize: 14, color: textCol, marginTop: 8, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{pin.label}</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, borderRadius: '0 0 18px 18px', background: accent }} />
                    <button onClick={e => { e.stopPropagation(); deletePin(pin.id); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.10)', border: 'none', borderRadius: '50%', width: 18, height: 18, color: '#6b7280', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Pin board */}
      <div ref={canvasRef} style={{ ...boardBg, position: 'relative', zIndex: 1, width: '100%', height: BOARD_HEIGHT, overflowX: 'hidden', touchAction: dragging ? 'none' : 'pan-y' }}>

        {/* Chapter cluster labels — rendered as virtual elements (not in pins state) */}
        {filter === 'all' && activeChapters.map(chapter => {
          const cl = chapterLayout[chapter.id];
          if (!cl) return null;
          const chapterItemIds = new Set((chapter.itemIds || []).map(id => String(id || '')));
          const chPinCount = pins.filter(p => p.chapterId === chapter.id || chapterItemIds.has(String(p.id || ''))).length;
          return (
            <div
              key={`cluster-label-${chapter.id}`}
              onClick={() => openChapter(chapter.id)}
              style={{ position: 'absolute', left: 16, top: cl.labelY, zIndex: 11, cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(94,173,206,0.14)' : 'rgba(94,173,206,0.1)', border: '1px solid rgba(94,173,206,0.35)', borderRadius: 8, padding: '7px 16px 7px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <span style={{ fontFamily: CAVEAT, fontSize: 20, color: darkMode ? '#5eadce' : '#0e7490', fontWeight: 700 }}>📖 {chapter.title}</span>
                <span style={{ fontSize: 10, color: '#5eadce', opacity: 0.8 }}>{chPinCount} item{chPinCount !== 1 ? 's' : ''} · open →</span>
              </div>
            </div>
          );
        })}

        {nudgedPins.map(pin => (
          <div
            key={pin.id}
            style={{ position: 'absolute', left: pin.x, top: pin.y, transform: `rotate(${pin.rot}deg)${dragging === pin.id ? ' scale(1.06)' : ''}`, zIndex: dragging === pin.id ? 50 : (pin.type === 'label' || pin.type === 'sticker') ? 10 : 2, userSelect: 'none', transition: dragging === pin.id ? 'none' : 'transform 0.15s', touchAction: 'none', filter: dragging === pin.id ? (darkMode ? 'drop-shadow(0 16px 32px rgba(0,0,0,0.7))' : 'drop-shadow(0 16px 32px rgba(0,0,0,0.3))') : 'none' }}
            onMouseDown={e => { if (flippedBoardPinId === pin.id) return; startDrag(e, pin.id); }}
            onTouchStart={e => { if (flippedBoardPinId === pin.id) return; startDrag(e, pin.id); }}
          >
            {pin.type === 'note'
              ? <NotePin       pin={isPinInChapter(pin) ? { ...pin, pinColor: 'purple', chapterId: getPinChapterId(pin) } : pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} onTap={() => handlePinClick(pin)} darkMode={darkMode} />
              : pin.type === 'label'
              ? <LabelPin      pin={pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} darkMode={darkMode} />
              : pin.type === 'sticker'
              ? <StickerPin    pin={pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} />
              : pin.type === 'checklist'
              ? <ChecklistPin  pin={pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} onTap={() => handlePinClick(pin)} darkMode={darkMode} />
              : pin.type === 'countdown'
              ? <CountdownPin  pin={pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} onTap={() => handlePinClick(pin)} />
              : (
                <div style={{ position: 'relative', width: 162, minHeight: 185, perspective: '1200px' }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      minHeight: 185,
                      transformStyle: 'preserve-3d',
                      transition: dragging === pin.id ? 'none' : 'transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                      transform: flippedBoardPinId === pin.id ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                    >
                      <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        <div style={{ position: 'relative', width: 162, minHeight: 185 }}>
                        <PhotoPin pin={isPinInChapter(pin) ? { ...pin, pinColor: 'purple', chapterId: getPinChapterId(pin) } : pin} isDragging={dragging === pin.id} onDelete={() => deletePin(pin.id)} onTap={handlePinClick} darkMode={darkMode} />
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); setFlippedBoardPinId(pin.id); }}
                          style={{ position: 'absolute', bottom: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.88)', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', zIndex: 10, color: '#9ca3af' }}
                          title="Write notes"
                        >✏️</button>
                      </div>
                    </div>
                    <div
                      style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ width: 162, minHeight: 185, background: '#fefce8', borderRadius: 2, boxShadow: '3px 5px 16px rgba(0,0,0,0.22)', padding: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                        <button onClick={(e) => { e.stopPropagation(); setFlippedBoardPinId(null); }} style={{ position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 1 }}>↩</button>
                        <textarea
                            value={pin.notes || boardPinNotes[pin.id] || ''}
                          onChange={(e) => saveBoardPinNote(pin.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="notes..."
                          style={{ marginTop: 4, flex: 1, width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontFamily: CAVEAT, fontSize: 13, color: '#374151', lineHeight: 1.45, padding: 0 }}
                          maxLength={500}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                          {(pin.attachmentUrl || boardPinAttachments[pin.id]) ? (
                            <a href={pin.attachmentUrl || boardPinAttachments[pin.id]} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'block', width: 24, height: 24, borderRadius: 4, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                              <img src={pin.attachmentUrl || boardPinAttachments[pin.id]} alt="attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </a>
                          ) : <span />}
                          <label style={{ cursor: 'pointer', borderRadius: 999, background: 'rgba(255,255,255,0.7)', border: 'none', padding: '2px 6px', fontSize: 11, color: '#6b7280', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }} title="Attach photo" onClick={(e) => e.stopPropagation()}>
                            📎
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => saveBoardPinAttachment(pin.id, ev.target.result);
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          </div>
        ))}

      {displayedPins.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <p style={{ fontFamily: CAVEAT, fontSize: 22, color: ts, fontStyle: 'italic' }}>Nothing pinned here yet</p>
            <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', borderRadius: 16, border: `2px dashed ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: ts, fontFamily: CAVEAT, fontSize: 18, cursor: 'pointer' }}>+ Pin something</button>
          </div>
        )}
      </div>

      {filter === 'all' && completedChapters.length > 0 && (
        <div style={{ padding: '20px 16px 8px' }}>
          <p style={{ fontSize: 10, color: darkMode ? '#fbbf24' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 12px', fontWeight: 700 }}>
            Completed Chapters
          </p>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6 }}>
            {completedChapters
              .slice()
              .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
              .map((chapter) => {
                const preview = getChapterArchivePreview(chapter);
                const completedLabel = chapter?.completedAt
                  ? new Date(chapter.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '';
                const tripDateRange = preview.linkedTrip
                  ? formatTripDateRange(preview.linkedTrip.start_date, preview.linkedTrip.end_date)
                  : '';
                return (
                  <div
                    key={`completed-chapter-${chapter.id}`}
                    onClick={() => openChapter(chapter.id)}
                    style={{ flexShrink: 0, width: 216, cursor: 'pointer' }}
                  >
                    <div style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#fffdf8', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e8dcc8'}`, borderRadius: 20, overflow: 'hidden', boxShadow: darkMode ? '0 8px 26px rgba(0,0,0,0.28)' : '0 8px 24px rgba(120,90,40,0.10)' }}>
                      <div style={{ position: 'relative', width: '100%', height: 148, background: darkMode ? '#182132' : '#f3ede3' }}>
                        {preview.imageUrl ? (
                          <img src={preview.imageUrl} alt={chapter.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, color: darkMode ? '#fde68a' : '#b45309' }}>
                            Chapter
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: 10, left: 10, background: darkMode ? 'rgba(146,64,14,0.88)' : 'rgba(146,64,14,0.92)', color: '#fff7ed', borderRadius: 999, padding: '5px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Completed
                        </div>
                      </div>
                      <div style={{ padding: '12px 14px 14px' }}>
                        <div style={{ fontFamily: CAVEAT, fontSize: 24, lineHeight: 1.05, color: tp, marginBottom: 6 }}>{chapter.title}</div>
                        <div style={{ fontSize: 12, color: ts, lineHeight: 1.45 }}>
                          {completedLabel ? `Finished ${completedLabel}` : 'Completed chapter'}
                        </div>
                        {tripDateRange && (
                          <div style={{ fontSize: 12, color: darkMode ? '#cbd5e1' : '#6b7280', marginTop: 4 }}>
                            {tripDateRange}
                          </div>
                        )}
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <span style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#8b7b67', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {preview.pinCount} item{preview.pinCount !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              updateChapterCompletionState(chapter.id, {
                                completedAt: null,
                                completionSource: null,
                                completionAnimationSeenAt: null,
                                reopenedAt: new Date().toISOString(),
                              });
                            }}
                            style={{ border: 'none', background: 'transparent', color: darkMode ? '#5eadce' : '#0e7490', fontFamily: CAVEAT, fontSize: 18, cursor: 'pointer', padding: 0 }}
                          >
                            Reopen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {showAdd && <AddSheet onClose={() => setShowAdd(false)} onAdd={addPin} darkMode={darkMode} />}
      {editingCountdown && (
        <CountdownEditSheet
          pin={editingCountdown}
          onClose={() => setEditingCountdown(null)}
          onSave={(pinId, updates) => {
            const pin = pins.find(p => p.id === pinId);
            if (pin?.chapterId) {
              updateChapterPin(pinId, updates);
            } else {
              setPins(prev => prev.map(p => p.id === pinId ? { ...p, ...updates } : p));
              onUpdateDream?.({ ...pin, ...updates });
            }
            setEditingCountdown(null);
          }}
          darkMode={darkMode}
        />)}
      {editingChecklist && (
        <ChecklistEditSheet
          pin={editingChecklist}
          onClose={() => setEditingChecklist(null)}
          onSave={(pinId, updates) => {
            const pin = pins.find(p => p.id === pinId);
            if (pin?.chapterId) {
              updateChapterPin(pinId, updates);
            } else {
              setPins(prev => prev.map(p => p.id === pinId ? { ...p, ...updates } : p));
              onUpdateDream?.({ ...pin, ...updates });
            }
            setEditingChecklist(null);
          }}
          darkMode={darkMode}
        />)}
      {detailPin && (
        <DetailSheet
          pin={detailPin}
          chapters={chapters}
          onClose={() => setDetailPin(null)}
          onConvertToEvent={onConvertToEvent}
          onConvertToTrip={onConvertToTrip}
          onMarkDone={markDone}
          heroId={heroId}
          onSetHero={setHeroId}
          onSetFocusStatus={setPinFocusStatus}
          onAddToChapter={addPinToChapter}
          onRemoveFromChapter={removePinFromChapter}
          darkMode={darkMode}
        />
      )}
      {showCreateChapter && (
        <PromptCreateChapterSheet
          onClose={() => setShowCreateChapter(false)}
          onCreateBlank={(title) => createChapter(title, [])}
          onCreateFromPrompt={createChapterFromPrompt}
          darkMode={darkMode}
        />
      )}
      {chapterPromptGroup && (
        <ChapterSuggestionPrompt
          group={chapterPromptGroup}
          pins={pins}
          onConfirm={(title) => createChapter(title, chapterPromptGroup.pinIds)}
          onDismiss={() => { setDismissedGroups(prev => new Set([...prev, chapterPromptGroup.id])); setChapterPromptGroup(null); }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default SomedayPage;
