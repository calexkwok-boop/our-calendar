/**
 * DestinationsPage.jsx — Aspirational travel edition
 *
 * Matches the RestaurantPage aesthetic exactly:
 * same hero card, same occasion strip, same detail sheet,
 * same "Found a great spot?" CTA card, same Supabase community layer.
 *
 * Props:
 *   onAddEvent      – (eventData) => void   fires when "Plan this trip" is tapped
 *   onSaveToSomeday – (destination) => void fires when "+ Someday" is tapped
 *   onRemoveFromSomeday – (payload) => void
 *   onBack          – () => void
 *   darkMode        – boolean
 *
 * Supabase table needed: destination_posts
 *   id, user_id, destination_name, destination_image, location,
 *   vibe, review, best_for, likes_count, created_at
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, ExternalLink, Search, X, Camera, Globe } from 'lucide-react';
import { supabase } from '../supabaseClient';
import JourneyQuoteDisplay from './JourneyQuoteDisplay';
import TRAVEL_QUOTES from '../data/travelQuotes';
import { getDestinationImageOverride } from '../data/destinationImageOverrides';

// ─── constants ────────────────────────────────────────────────────────────────
const handwritten = '"Caveat", cursive';

const VIBES = [
  { id: 'bucket_list',  label: 'Bucket list',    emoji: '📋' },
  { id: 'beach',        label: 'Beach & sun',     emoji: '🏖️' },
  { id: 'adventure',    label: 'Adventure',       emoji: '🧗' },
  { id: 'kid_friendly', label: 'Kid friendly',    emoji: '🎠' },
  { id: 'views',        label: 'Views',           emoji: '🏔️' },
  { id: 'romantic',     label: 'Romantic',        emoji: '🌹' },
  { id: 'city_break',   label: 'City break',      emoji: '🏙️' },
  { id: 'off_beaten',   label: 'Off the beaten path', emoji: '🗺️' },
  { id: 'road_trip',    label: 'Road trip',       emoji: '🚗' },
  { id: 'all',          label: 'All',             emoji: '✨' },
];

// ─── curated destination lists ────────────────────────────────────────────────
export const CURATED_DESTINATIONS = {
  bucket_list: [
    { id: 'bl-1',  name: 'Machu Picchu',          location: 'Peru',             vibe: 'bucket_list', description: 'The lost city of the Incas, perched in the clouds. One of those places you have to see once in your life.', emoji: '🏛️', website: 'https://www.peru.travel/en/attractions/machu-picchu' },
    { id: 'bl-2',  name: 'Santorini',             location: 'Greece',           vibe: 'bucket_list', description: 'White-washed cliffs, infinite blue, and sunsets that feel almost unfair. The poster child of dream travel.', emoji: '🌅', website: '' },
    { id: 'bl-3',  name: 'Kyoto in Cherry Blossom Season', location: 'Japan',  vibe: 'bucket_list', description: 'Ancient temples draped in pink. A trip timed right becomes one of the most beautiful weeks of your life.', emoji: '🌸', website: '' },
    { id: 'bl-4',  name: 'Amalfi Coast',          location: 'Italy',            vibe: 'bucket_list', description: 'Cliffside villages, impossibly blue water, and the kind of beauty that makes you want to stay forever.', emoji: '🍋', website: '' },
    { id: 'bl-5',  name: 'Patagonia',             location: 'Argentina & Chile',vibe: 'bucket_list', description: 'The end of the world, and somehow one of the most spectacular places on it. Raw, wild, and unforgettable.', emoji: '🏔️', website: '' },
    { id: 'bl-6',  name: 'Serengeti',             location: 'Tanzania',         vibe: 'bucket_list', description: 'A million wildebeest, endless plains, and sunrises you will never stop talking about.', emoji: '🦁', website: '' },
    { id: 'bl-7',  name: 'The Maldives',          location: 'Indian Ocean',     vibe: 'bucket_list', description: 'Overwater bungalows, crystal water, and the feeling that time has stopped. A once-in-a-lifetime indulgence.', emoji: '🐠', website: '' },
    { id: 'bl-8',  name: 'Iceland',               location: 'Iceland',          vibe: 'bucket_list', description: 'Northern lights, hot springs, and waterfalls falling off the edge of lava fields. Nothing else looks like this.', emoji: '🌌', website: '' },
    { id: 'bl-9',  name: 'Angkor Wat',            location: 'Cambodia',         vibe: 'bucket_list', description: 'The largest religious monument on earth, swallowed by jungle and glowing at sunrise.', emoji: '🛕', website: '' },
    { id: 'bl-10', name: 'The Galápagos Islands', location: 'Ecuador',          vibe: 'bucket_list', description: 'Sea lions that pose for photos, iguanas that ignore you, and a world that Darwin found hard to believe.', emoji: '🦎', website: '' },
  ],
  beach: [
    { id: 'be-1',  name: 'Bora Bora',             location: 'French Polynesia', vibe: 'beach', description: 'The turquoise lagoon that launched a thousand screensavers. Worth every mile to get here.', emoji: '🌺', website: '' },
    { id: 'be-2',  name: 'Whitehaven Beach',      location: 'Australia',        vibe: 'beach', description: 'Pure white silica sand and water so clear it looks painted. Only accessible by boat or seaplane.', emoji: '🏝️', website: '' },
    { id: 'be-3',  name: 'Tulum',                 location: 'Mexico',           vibe: 'beach', description: 'Mayan ruins above a turquoise sea, cenotes, and a beach town that rewards slow mornings.', emoji: '🌴', website: '' },
    { id: 'be-4',  name: 'Cinque Terre',          location: 'Italy',            vibe: 'beach', description: 'Five pastel villages clinging to cliffs above the Ligurian Sea. Best explored on foot, slowly.', emoji: '⛵', website: '' },
    { id: 'be-5',  name: 'Kauai',                 location: 'Hawaii, USA',      vibe: 'beach', description: "The Garden Isle — quieter, wilder, and greener than the rest. Napali Coast alone is worth the trip.", emoji: '🌿', website: '' },
    { id: 'be-6',  name: 'Phi Phi Islands',       location: 'Thailand',         vibe: 'beach', description: 'Dramatic limestone cliffs, crystal water, and the kind of beach that looks like a movie set.', emoji: '🦈', website: '' },
    { id: 'be-7',  name: 'Algarve',               location: 'Portugal',         vibe: 'beach', description: 'Golden cliffs, hidden grottos, and some of the best seafood in Europe. Wildly underrated.', emoji: '🐚', website: '' },
    { id: 'be-8',  name: 'Anse Source d\'Argent', location: 'Seychelles',       vibe: 'beach', description: "Often called the world's most photographed beach. Giant granite boulders and pink sand.", emoji: '🪸', website: '' },
  ],
  adventure: [
    { id: 'ad-1',  name: 'Queenstown',            location: 'New Zealand',      vibe: 'adventure', description: 'The adventure capital of the world. Bungee jumping, skydiving, and scenery that makes everything feel cinematic.', emoji: '🎿', website: '' },
    { id: 'ad-2',  name: 'Everest Base Camp',     location: 'Nepal',            vibe: 'adventure', description: 'A 12-day trek through the Himalayas that tests your limits and rewards you with the roof of the world.', emoji: '🏔️', website: '' },
    { id: 'ad-3',  name: 'Moab',                  location: 'Utah, USA',        vibe: 'adventure', description: 'Red rock canyons, world-class mountain biking, and arches that look like they defy gravity.', emoji: '🪨', website: '' },
    { id: 'ad-4',  name: 'Costa Rica',            location: 'Costa Rica',       vibe: 'adventure', description: 'Zip-lining through cloud forests, surfing Pacific swells, and wildlife around every corner.', emoji: '🦜', website: '' },
    { id: 'ad-5',  name: 'The Amazon',            location: 'Brazil',           vibe: 'adventure', description: 'The largest rainforest on earth. Nights on the river, pink dolphins, and a scale that humbles you.', emoji: '🐊', website: '' },
    { id: 'ad-6',  name: 'Norwegian Fjords',      location: 'Norway',           vibe: 'adventure', description: 'Kayak between walls of rock that drop straight into the sea. Nature at its most dramatic.', emoji: '🛶', website: '' },
    { id: 'ad-7',  name: 'Banff National Park',   location: 'Canada',           vibe: 'adventure', description: 'Turquoise glacial lakes, bears in the meadows, and hiking that makes you feel genuinely far from everything.', emoji: '🦌', website: '' },
    { id: 'ad-8',  name: 'Kilimanjaro',           location: 'Tanzania',         vibe: 'adventure', description: 'Africa\'s highest peak. A multi-day trek through five climate zones to the roof of the continent.', emoji: '🗻', website: '' },
  ],
  kid_friendly: [
    { id: 'kf-1',  name: 'Tokyo Disneyland',      location: 'Japan',            vibe: 'kid_friendly', description: 'The most immaculate theme park on earth. Kids and adults both lose their minds here — in the best way.', emoji: '🎠', website: '' },
    { id: 'kf-2',  name: 'San Diego',             location: 'California, USA',  vibe: 'kid_friendly', description: 'The zoo, the beaches, Legoland, and enough sunshine to make every day feel like a vacation within a vacation.', emoji: '🐘', website: '' },
    { id: 'kf-3',  name: 'Amsterdam',             location: 'Netherlands',      vibe: 'kid_friendly', description: 'Bikes, canals, and a pancake house on every corner. The city is genuinely made for wandering with kids.', emoji: '🚲', website: '' },
    { id: 'kf-4',  name: 'Orlando',               location: 'Florida, USA',     vibe: 'kid_friendly', description: 'The theme park capital of the world. A week here barely scratches the surface of what there is to do.', emoji: '🎢', website: '' },
    { id: 'kf-5',  name: 'Bruges',                location: 'Belgium',          vibe: 'kid_friendly', description: 'A medieval fairy-tale city with canals, chocolate shops, and horse-drawn carriages that kids immediately love.', emoji: '🍫', website: '' },
    { id: 'kf-6',  name: 'Washington D.C.',       location: 'USA',              vibe: 'kid_friendly', description: 'Every Smithsonian museum is free. A week of history, science, and space exploration that never gets boring.', emoji: '🚀', website: '' },
    { id: 'kf-7',  name: 'Vancouver',             location: 'Canada',           vibe: 'kid_friendly', description: 'Stanley Park, the aquarium, whale watching, and mountains with ski hills. The great outdoors, city-style.', emoji: '🐋', website: '' },
    { id: 'kf-8',  name: 'Reykjavik',             location: 'Iceland',          vibe: 'kid_friendly', description: 'Northern lights, whale watching, geysers, and geothermal pools. Kids find Iceland genuinely magical.', emoji: '🐳', website: '' },
    { id: 'kf-9',  name: 'Kowloon Bay',           location: 'Hong Kong',        vibe: 'kid_friendly', description: 'A unique city where East meets West and Old meets New.', emoji: '🌆', website: '' },
  ],
  views: [
    { id: 'v-1',  name: 'Trolltunga',             location: 'Norway',           vibe: 'views', description: 'A rock ledge jutting over a glacier lake 700 meters below. The hike is long. The view is forever.', emoji: '🌬️', website: '' },
    { id: 'v-2',  name: 'Grand Canyon South Rim', location: 'Arizona, USA',     vibe: 'views', description: 'No photo captures it. The scale only hits when you\'re standing at the edge, looking down a mile.', emoji: '🏜️', website: '' },
    { id: 'v-3',  name: 'Ha Long Bay',            location: 'Vietnam',          vibe: 'views', description: 'Three thousand limestone islands rising from still water. Best seen from the deck of an overnight junk.', emoji: '⛰️', website: '' },
    { id: 'v-4',  name: 'Zhangjiajie',            location: 'China',            vibe: 'views', description: 'The floating mountains that inspired Avatar. A surreal landscape that looks like it was designed by a dream.', emoji: '☁️', website: '' },
    { id: 'v-5',  name: 'Paro Taktsang',          location: 'Bhutan',           vibe: 'views', description: 'The Tiger\'s Nest monastery clings to a cliff 900 meters above the valley floor. Worth every step.', emoji: '🕌', website: '' },
    { id: 'v-6',  name: 'Dolomites',              location: 'Italy',            vibe: 'views', description: 'Jagged pink peaks, meadows of wildflowers, and cable cars to places that feel inaccessible to ordinary life.', emoji: '🌄', website: '' },
    { id: 'v-7',  name: 'Cape Town',              location: 'South Africa',     vibe: 'views', description: 'Table Mountain above, two oceans below, and a city that feels like the edge of the known world.', emoji: '🌍', website: '' },
    { id: 'v-8',  name: 'Fly Geyser',            location: 'Nevada, USA',      vibe: 'views', description: 'A man-made accident that became an alien landscape. Thermophilic algae paint it green and red.', emoji: '🌋', website: '' },
  ],
  romantic: [
    { id: 'r-1',  name: 'Paris',                  location: 'France',           vibe: 'romantic', description: 'Still the most romantic city on earth. Croissants in bed, walks along the Seine, and the Eiffel Tower at night.', emoji: '🗼', website: '' },
    { id: 'r-2',  name: 'Venice',                 location: 'Italy',            vibe: 'romantic', description: 'No cars. Just gondolas, candlelit restaurants, and a city slowly sinking into the sea — which somehow makes it more beautiful.', emoji: '🛶', website: '' },
    { id: 'r-3',  name: 'Positano',               location: 'Italy',            vibe: 'romantic', description: 'A hillside village tumbling into the sea. The drive down is harrowing. The dinner by the water is worth it.', emoji: '🌊', website: '' },
    { id: 'r-4',  name: 'Kyoto',                  location: 'Japan',            vibe: 'romantic', description: 'Bamboo forests, geisha districts, and ryokan stays with private onsen. A deeply intimate kind of travel.', emoji: '🏯', website: '' },
    { id: 'r-5',  name: 'Maldives',               location: 'Indian Ocean',     vibe: 'romantic', description: 'Your own overwater bungalow, breakfast on a private deck, and nothing to do but float and not answer emails.', emoji: '🌺', website: '' },
    { id: 'r-6',  name: 'Prague',                 location: 'Czech Republic',   vibe: 'romantic', description: 'Medieval squares, candlelit wine bars, and the most beautiful old town in Europe. Best in winter.', emoji: '🏰', website: '' },
    { id: 'r-7',  name: 'Tuscany',                location: 'Italy',            vibe: 'romantic', description: 'Rolling hills, vineyard lunches, and truffle dinners. A slow week here resets something in your brain.', emoji: '🍷', website: '' },
    { id: 'r-8',  name: 'Ubud, Bali',             location: 'Indonesia',        vibe: 'romantic', description: 'Rice terraces, temple ceremonies, and jungle villa stays with private pools. Romance, elevated.', emoji: '🌿', website: '' },
  ],
  city_break: [
    { id: 'cb-1', name: 'New York City',          location: 'USA',              vibe: 'city_break', description: 'Four days, a hundred neighborhoods, and the feeling that everything is possible. No city moves like this.', emoji: '🗽', website: '' },
    { id: 'cb-2', name: 'Tokyo',                  location: 'Japan',            vibe: 'city_break', description: 'The world\'s most efficient city and its most surprising. Every neighborhood is a completely different world.', emoji: '🏙️', website: '' },
    { id: 'cb-3', name: 'London',                 location: 'UK',               vibe: 'city_break', description: 'Museums, pubs, markets, and parks. A city so layered that every visit reveals something new.', emoji: '🎡', website: '' },
    { id: 'cb-4', name: 'Barcelona',              location: 'Spain',            vibe: 'city_break', description: 'Gaudí around every corner, perfect pintxos, and a beach at the end of the Ramblas. Europe at its most alive.', emoji: '🌀', website: '' },
    { id: 'cb-5', name: 'Mexico City',            location: 'Mexico',           vibe: 'city_break', description: 'World-class museums, tacos at midnight, and a food scene that rivals anywhere on earth.', emoji: '🌮', website: '' },
    { id: 'cb-6', name: 'Copenhagen',             location: 'Denmark',          vibe: 'city_break', description: 'Hygge in real life. The best restaurant in the world is here, and so is a bike-riding culture that makes everything feel effortless.', emoji: '🚲', website: '' },
    { id: 'cb-7', name: 'Istanbul',               location: 'Turkey',           vibe: 'city_break', description: 'Two continents, one city. The Grand Bazaar, the Bosphorus, and a breakfast spread that never ends.', emoji: '🕌', website: '' },
    { id: 'cb-8', name: 'Nashville',              location: 'Tennessee, USA',   vibe: 'city_break', description: 'Live music on every block, hot chicken, and a city that knows how to have a good time without trying too hard.', emoji: '🎸', website: '' },
  ],
  off_beaten: [
    { id: 'ob-1', name: 'Faroe Islands',          location: 'Denmark',          vibe: 'off_beaten', description: 'Eighteen islands between Norway and Iceland, where waterfalls fall into the ocean and puffins outnumber people.', emoji: '🐦', website: '' },
    { id: 'ob-2', name: 'Socotra',                location: 'Yemen',            vibe: 'off_beaten', description: 'Dragon blood trees and white sand dunes on an island so alien-looking it feels like another planet.', emoji: '🌵', website: '' },
    { id: 'ob-3', name: 'Svalbard',               location: 'Norway',           vibe: 'off_beaten', description: 'Polar bears outnumber humans. Midnight sun in summer, total darkness in winter. The true edge of the world.', emoji: '🐻', website: '' },
    { id: 'ob-4', name: 'Lofoten Islands',        location: 'Norway',           vibe: 'off_beaten', description: 'Red fishing huts on stilts, dramatic peaks, and the northern lights reflecting off still fjords.', emoji: '🎣', website: '' },
    { id: 'ob-5', name: 'Cappadocia',             location: 'Turkey',           vibe: 'off_beaten', description: 'Cave hotels, hot air balloons at dawn, and a landscape carved by wind into something from a fairy tale.', emoji: '🎈', website: '' },
    { id: 'ob-6', name: 'Bhutan',                 location: 'Bhutan',           vibe: 'off_beaten', description: 'The country that measures Gross National Happiness. Monasteries, mountains, and almost no mass tourism.', emoji: '🏔️', website: '' },
    { id: 'ob-7', name: 'Namibia',                location: 'Namibia',          vibe: 'off_beaten', description: 'The oldest desert on earth meets the Atlantic Ocean. Dead Vlei\'s fossilized trees may be the most surreal place on earth.', emoji: '🏜️', website: '' },
    { id: 'ob-8', name: 'Raja Ampat',             location: 'Indonesia',        vibe: 'off_beaten', description: 'The most biodiverse marine habitat on earth. Seventy-five percent of the world\'s known coral species live here.', emoji: '🐟', website: '' },
  ],
  road_trip: [
    { id: 'rt-1', name: 'Pacific Coast Highway', location: 'California, USA',   vibe: 'road_trip', description: 'Big Sur cliffs, Hearst Castle, and pulling over every twenty minutes because the view demands it.', emoji: '🌊', website: '' },
    { id: 'rt-2', name: 'Route 66',              location: 'USA',               vibe: 'road_trip', description: 'The Mother Road from Chicago to Santa Monica. Diners, desert, and four thousand kilometres of Americana.', emoji: '🛣️', website: '' },
    { id: 'rt-3', name: 'Ring Road',             location: 'Iceland',           vibe: 'road_trip', description: 'The entire country in a loop. Glaciers, geysers, waterfalls, and lava fields — one after the other, endlessly.', emoji: '🌋', website: '' },
    { id: 'rt-4', name: 'The Garden Route',      location: 'South Africa',      vibe: 'road_trip', description: 'Coastal cliffs, forests, and lagoons from Cape Town to Port Elizabeth. Wildlife at every stop.', emoji: '🐘', website: '' },
    { id: 'rt-5', name: 'Amalfi Coast Drive',    location: 'Italy',             vibe: 'road_trip', description: 'The most beautiful — and terrifying — coastal road in Europe. Narrow, winding, and worth every white knuckle.', emoji: '🍋', website: '' },
    { id: 'rt-6', name: 'The Icefields Parkway', location: 'Canada',            vibe: 'road_trip', description: 'Two hundred kilometres of glaciers, turquoise lakes, and the most consistently dramatic mountain scenery on earth.', emoji: '🏔️', website: '' },
    { id: 'rt-7', name: 'Tuscany Road Trip',     location: 'Italy',             vibe: 'road_trip', description: 'Vineyard to vineyard, hill town to hill town. A week of getting pleasantly lost in cypress-lined roads.', emoji: '🍷', website: '' },
    { id: 'rt-8', name: 'New Zealand South Island', location: 'New Zealand',   vibe: 'road_trip', description: 'Fjords, glaciers, sheep, and the kind of scenery that made the Lord of the Rings look real.', emoji: '🐑', website: '' },
  ],
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const truncateText = (text, max = 120) => {
  if (!text) return '';
  const clean = String(text).trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
};

const getDestinationResolvedImage = (destination = {}, fetchedPhotoUrl = '') => (
  getDestinationImageOverride(destination)
  || String(destination?.photo || destination?.imageUrl || destination?.destination_image || '').trim()
  || String(fetchedPhotoUrl || '').trim()
);

const destinationSomedayPayload = (post, photoUrl = '') => ({
  title: post.destination_name,
  imageUrl: photoUrl || post.destination_image || '',
  emoji: '✈️',
  type: 'destinations',
  notes: [post.review, post.location, post.best_for, post.vibe]
    .filter(Boolean).join(' · '),
});

const destinationTrackingKey = (destination = {}) => (
  destination.id
  || destination.destination_key
  || `${destination.name || destination.destination_name || ''}-${destination.location || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
);

const normalizeDestinationMatchKey = (destination = {}) => (
  `${destination.name || destination.destination_name || ''} ${destination.location || ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
);

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

// ─── Destination Detail Sheet ─────────────────────────────────────────────────
const DestinationDetailSheet = ({ destination, photoUrl, photoAttribution, onAddEvent, onSaveToSomeday, onClose, savedIds, darkMode }) => {
  const [saved, setSaved] = useState(savedIds.has(destination.id));
  const pbg = darkMode ? '#131c2e' : '#fff';
  const tp  = darkMode ? '#f1f5f9' : '#111827';
  const ts  = darkMode ? '#6b7280' : '#9ca3af';
  const bw  = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const vibeConfig = VIBES.find(v => v.id === destination.vibe) || VIBES[0];
  const photoBg = darkMode
    ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(45,212,191,0.06))'
    : 'linear-gradient(135deg, #eef2ff, #f0fdfa)';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 480, background: pbg, borderRadius: '24px 24px 0 0', maxHeight: '92vh', overflowY: 'auto', borderTop: `1px solid ${bw}`, paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', ...sheetStyle }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div {...handleProps} style={{ width: 36, height: 4, background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb', borderRadius: 3, margin: '12px auto 0', ...handleProps.style }} />

        {/* Photo hero */}
        <div style={{ width: '100%', height: 240, background: photoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, position: 'relative', overflow: 'hidden' }}>
          {photoUrl || destination.photo
            ? <img src={photoUrl || destination.photo} alt={destination.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <span style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>{destination.emoji || vibeConfig.emoji}</span>
          }
          {photoAttribution && (
            <div
              style={{ position: 'absolute', right: 12, bottom: 54, maxWidth: '70%', borderRadius: 999, background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.82)', fontSize: 10, padding: '4px 8px', backdropFilter: 'blur(6px)' }}
              dangerouslySetInnerHTML={{ __html: photoAttribution }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent 60%)' }} />
          {/* Location badge */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '5px 12px' }}>
            <MapPin style={{ width: 12, height: 12, color: '#fff' }} />
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{destination.location}</span>
          </div>
        </div>

        <div style={{ padding: '20px 22px 36px' }}>
          {/* Title */}
          <h2 style={{ fontFamily: handwritten, fontSize: 32, fontWeight: 700, color: tp, margin: '0 0 8px', lineHeight: 1.1 }}>
            {destination.name}
          </h2>

          {/* Evocative description */}
          {destination.description && (
            <p style={{ fontSize: 14, color: ts, lineHeight: 1.75, margin: '0 0 16px', fontStyle: 'italic' }}>
              {destination.description}
            </p>
          )}

          {/* Vibe tags */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 10px', borderRadius: 8, background: darkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff', color: darkMode ? '#a5b4fc' : '#4338ca', fontSize: 12, fontWeight: 600 }}>
              {vibeConfig.emoji} {vibeConfig.label}
            </span>
            {destination.best_for && (
              <span style={{ padding: '4px 10px', borderRadius: 8, background: darkMode ? 'rgba(45,212,191,0.12)' : '#f0fdfa', color: darkMode ? '#5eead4' : '#0f766e', fontSize: 12, fontWeight: 600 }}>
                {destination.best_for}
              </span>
            )}
          </div>

          {/* Info row */}
          <div style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius: 14, padding: '12px 14px', marginBottom: 18, border: `1px solid ${bw}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: destination.website ? 10 : 0, marginBottom: destination.website ? 10 : 0, borderBottom: destination.website ? `0.5px solid ${bw}` : 'none' }}>
              <Globe style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: tp }}>{destination.location}</span>
            </div>
            {destination.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ExternalLink style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0 }} />
                <a href={destination.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: darkMode ? '#818cf8' : '#4f46e5', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {destination.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          {/* Google Maps link */}
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(destination.name + ' ' + (destination.location || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: darkMode ? '#818cf8' : '#4f46e5', textDecoration: 'none', marginBottom: 20 }}
          >
            <MapPin style={{ width: 13, height: 13 }} />
            Open in Google Maps
          </a>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                onAddEvent?.({
                  title: `✈️ Trip to ${destination.name}`,
                  notes: `${destination.location} · ${vibeConfig.label}`,
                  category: 'trip',
                  location: destination.location,
                });
                onClose();
              }}
              style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: `1px solid ${darkMode ? 'rgba(168,85,247,0.25)' : '#d8b4fe'}`, background: darkMode ? 'rgba(168,85,247,0.12)' : '#f5f3ff', color: darkMode ? '#c4b5fd' : '#6d28d9', fontFamily: handwritten, fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              + Plan this trip
            </button>
            <button
              onClick={() => {
                if (!saved) { setSaved(true); onSaveToSomeday?.(destination); }
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

// ─── Destination Card ─────────────────────────────────────────────────────────
const DestinationCard = ({ destination, photoUrl, photoAttribution, onTap, savedIds, darkMode, stagger }) => {
  const bg  = darkMode ? '#161f30' : '#ffffff';
  const tp  = darkMode ? '#f1f5f9' : '#111827';
  const ts  = darkMode ? '#6b7280' : '#9ca3af';
  const bw  = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const saved = savedIds.has(destination.id);
  const vibeConfig = VIBES.find(v => v.id === destination.vibe) || VIBES[0];

  const photoBg = darkMode
    ? 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(45,212,191,0.05))'
    : 'linear-gradient(135deg, #eef2ff, #f0fdfa)';

  return (
    <div
      onClick={() => onTap(destination)}
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
      {/* Photo / emoji area */}
      <div style={{ width: '100%', height: 140, background: photoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative', overflow: 'hidden' }}>
        {photoUrl || destination.photo
          ? <img src={photoUrl || destination.photo} alt={destination.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : <span style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}>{destination.emoji || vibeConfig.emoji}</span>
        }
        {photoAttribution && (
          <div
            style={{ position: 'absolute', right: 7, bottom: 32, maxWidth: '70%', borderRadius: 999, background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.82)', fontSize: 9, padding: '2px 6px', backdropFilter: 'blur(6px)' }}
            dangerouslySetInnerHTML={{ __html: photoAttribution }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.28), transparent)' }} />
        {saved && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: '#0d9488', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>
            ✓ Someday
          </div>
        )}
        {/* Location pill */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,0.45)', borderRadius: 10, padding: '3px 7px' }}>
          <MapPin style={{ width: 9, height: 9, color: '#fff' }} />
          <span style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>{destination.location}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 13px 14px' }}>
        <div style={{ fontFamily: handwritten, fontSize: 18, fontWeight: 700, color: tp, lineHeight: 1.2, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {destination.name}
        </div>

        {/* Evocative one-liner */}
        {destination.description && (
          <p style={{ fontSize: 12, color: ts, lineHeight: 1.5, margin: '0 0 10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontStyle: 'italic' }}>
            {truncateText(destination.description, 80)}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 7, background: darkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff', color: darkMode ? '#a5b4fc' : '#4338ca' }}>
            {vibeConfig.emoji} {vibeConfig.label}
          </span>
        </div>
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

// ─── Featured community post ──────────────────────────────────────────────────
const FeaturedDestinationPost = React.memo(({ post, photoUrl, currentUserId, onSomeday, onRemoveFromSomeday, onDelete, darkMode }) => {
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
        <button type="button" onClick={() => onDelete(post)} aria-label="Delete" style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 28, height: 28, borderRadius: 999, border: `1px solid ${darkMode ? 'rgba(99,102,241,0.35)' : '#c7d2fe'}`, background: darkMode ? 'rgba(17,24,39,0.85)' : '#eef2ff', color: darkMode ? '#a5b4fc' : '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 700 }}>×</span>
        </button>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr' }} className="max-sm:block">
        <div style={{ minHeight: 220, background: darkMode ? 'rgba(99,102,241,0.08)' : '#eef2ff', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>
          {(photoUrl || post.destination_image) ? (
            <img src={photoUrl || post.destination_image} alt={post.destination_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : '✈️'}
          <div style={{ position: 'absolute', top: 12, left: 12, padding: '5px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
            Most saved this week
          </div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: darkMode ? '#a5b4fc' : '#4338ca' }}>
            From your community
          </p>
          <h2 style={{ fontFamily: handwritten, fontSize: 26, fontWeight: 700, lineHeight: 1.05, margin: 0, color: tp }}>
            {post.destination_name}
          </h2>
          {post.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin style={{ width: 12, height: 12, color: ts }} />
              <span style={{ fontSize: 12, color: ts }}>{post.location}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {post.best_for && (
              <span style={{ padding: '4px 9px', borderRadius: 8, background: darkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff', color: darkMode ? '#a5b4fc' : '#4338ca', fontSize: 11, fontWeight: 600 }}>
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
              const payload = destinationSomedayPayload(post);
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

// ─── Post Destination Modal ───────────────────────────────────────────────────
const PostDestinationModal = ({ onClose, onSubmit, darkMode }) => {
  const pbg = darkMode ? '#131c2e' : '#fff';
  const tp  = darkMode ? '#f1f5f9' : '#111827';
  const ts  = darkMode ? '#6b7280' : '#9ca3af';
  const bw  = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const photoInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { sheetStyle, handleProps } = useSwipeDownSheet(onClose);
  const [form, setForm] = useState({ destination_name: '', destination_image: '', location: '', vibe: '', review: '', best_for: '' });

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const bestForChips = ['Bucket list', 'Honeymoon', 'Family trip', 'Solo adventure', 'Girls trip', 'Anniversary', 'Weekend getaway', 'Once in a lifetime'];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const readFilesAsDataUrls = (files) => Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  })));

  const handleImagePick = async (event) => {
    const files = Array.from(event.target.files?.length ? event.target.files : []);
    if (!files.length) return;
    try {
      const urls = await readFilesAsDataUrls(files);
      setForm(prev => ({ ...prev, destination_image: urls[0] }));
    } catch { setSubmitError('Could not read that image.'); }
    event.target.value = '';
  };

  const handleSubmit = async () => {
    if (!form.destination_name.trim() || !form.review.trim()) {
      setSubmitError('Please add a destination name and tell us why it\'s worth going.');
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
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: darkMode ? '#a5b4fc' : '#4338ca' }}>
                Share a destination ✈️
              </p>
              <h2 style={{ fontFamily: handwritten, fontSize: 28, fontWeight: 700, color: tp, margin: '4px 0 0' }}>
                A place worth planning for
              </h2>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${bw}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: tp, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: ts, lineHeight: 1.6, margin: '0 0 18px' }}>
            Share a destination you love so others can add it to their Someday List.
          </p>

          {submitError && (
            <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 12, border: `1px solid ${darkMode ? 'rgba(99,102,241,0.2)' : '#c7d2fe'}`, background: darkMode ? 'rgba(99,102,241,0.08)' : '#eef2ff', color: darkMode ? '#a5b4fc' : '#4338ca', fontSize: 12 }}>{submitError}</div>
          )}

          <div style={{ display: 'grid', gap: 12 }}>
            {/* Destination name */}
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Destination *</span>
              <input type="text" value={form.destination_name} placeholder="Santorini, Iceland, Machu Picchu…" onChange={e => updateField('destination_name', e.target.value)} style={inputStyle} />
            </label>

            {/* Location */}
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Country / region</span>
              <input type="text" value={form.location} placeholder="Greece, Japan, Peru…" onChange={e => updateField('location', e.target.value)} style={inputStyle} />
            </label>

            {/* Vibe */}
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Vibe</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {VIBES.filter(v => v.id !== 'all').map(v => (
                  <button key={v.id} type="button" onClick={() => updateField('vibe', form.vibe === v.id ? '' : v.id)}
                    style={{ padding: '5px 12px', borderRadius: 20, fontSize: 13, fontFamily: handwritten, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', background: form.vibe === v.id ? (darkMode ? 'rgba(99,102,241,0.2)' : '#eef2ff') : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'), color: form.vibe === v.id ? (darkMode ? '#a5b4fc' : '#4338ca') : ts, border: form.vibe === v.id ? `1px solid ${darkMode ? 'rgba(99,102,241,0.4)' : '#c7d2fe'}` : `1px solid ${bw}` }}>
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Best for chips */}
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Best for</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {bestForChips.map(chip => (
                  <button key={chip} type="button" onClick={() => updateField('best_for', form.best_for === chip ? '' : chip)}
                    style={{ padding: '5px 12px', borderRadius: 20, fontSize: 13, fontFamily: handwritten, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', background: form.best_for === chip ? (darkMode ? 'rgba(45,212,191,0.15)' : '#f0fdfa') : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'), color: form.best_for === chip ? (darkMode ? '#5eead4' : '#0f766e') : ts, border: form.best_for === chip ? `1px solid ${darkMode ? 'rgba(45,212,191,0.3)' : '#99f6e4'}` : `1px solid ${bw}` }}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Photo</span>
              {form.destination_image ? (
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 180 }}>
                  <img src={form.destination_image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                  <button type="button" onClick={() => updateField('destination_image', '')} style={{ position: 'absolute', bottom: 10, right: 10, padding: '6px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.9)', color: '#111', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                  <button type="button" onClick={() => photoInputRef.current?.click()} style={{ position: 'absolute', bottom: 10, left: 10, padding: '6px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.9)', color: '#111', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <button type="button" onClick={() => photoInputRef.current?.click()} style={{ padding: '24px 0', borderRadius: 16, border: `2px dashed ${darkMode ? 'rgba(255,255,255,0.15)' : '#d1d5db'}`, background: darkMode ? 'rgba(255,255,255,0.02)' : '#fafafa', color: ts, fontSize: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Camera style={{ width: 24, height: 24 }} />
                  <span style={{ fontWeight: 600, color: tp }}>Add a photo</span>
                  <span style={{ fontSize: 12 }}>Tap to select from your device</span>
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />
            </div>

            {/* Why go */}
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tp }}>Why is it worth going? *</span>
              <textarea value={form.review} onChange={e => updateField('review', e.target.value)} rows={4} placeholder="Tell people what makes this place special — the feeling, the view, the memory it creates…" style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: `1px solid ${bw}`, background: 'transparent', color: ts, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: 'none', background: submitting ? 'rgba(99,102,241,0.4)' : '#6366f1', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: handwritten, cursor: submitting ? 'default' : 'pointer' }}>
              {submitting ? 'Sharing…' : 'Share this place'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const DestinationsPage = ({
  onAddEvent,
  onSaveToSomeday,
  onRemoveFromSomeday,
  onBack,
  darkMode = false,
}) => {
  const [destinations, setDestinations]   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [vibe, setVibe]                   = useState('');
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState(null);
  const [savedIds, setSavedIds]           = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);
  const [communityPosts, setCommunityPosts]       = useState([]);
  const [featuredPost, setFeaturedPost]           = useState(null);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [isShareOpen, setIsShareOpen]     = useState(false);
  const [googleSearchResults, setGoogleSearchResults] = useState([]);
  const [googleSearchLoading, setGoogleSearchLoading] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [placePhotos, setPlacePhotos]     = useState({});
  const [photoAttributions, setPhotoAttributions] = useState({});
  const communityFeedRef = useRef(null);
  const searchBoxRef     = useRef(null);
  const fetchedRef       = useRef(false);
  const photoFetchedRef  = useRef(new Set());
  const lastSheetCloseAtRef = useRef(0);
  const travelToday = new Date();
  const travelDailyQuoteSeed = (
    travelToday.getFullYear() * 10000 + (travelToday.getMonth() + 1) * 100 + travelToday.getDate()
  );
  const destinationsQuote = TRAVEL_QUOTES[
    ((travelDailyQuoteSeed % TRAVEL_QUOTES.length) + TRAVEL_QUOTES.length) % TRAVEL_QUOTES.length
  ] || null;

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id ?? null));
  }, []);

  // ── Community posts ──────────────────────────────────────────────────────────
  const fetchCommunityPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('destination_posts')
      .select('id, user_id, destination_name, destination_image, location, vibe, review, best_for, likes_count, created_at')
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data && data.length > 0) {
      setCommunityPosts(data);
      setFeaturedPost(data[0] ?? null);
    } else {
      // Mock fallback
      const MOCK = [
        { id: 'dp-1', user_id: null, destination_name: 'Santorini', destination_image: '', location: 'Greece', vibe: 'romantic', review: "We went for our anniversary and I cried at sunset. I don't cry. Book the caldera view room and don't think twice.", best_for: 'Anniversary', likes_count: 34, created_at: new Date(Date.now() - 2*3600000).toISOString() },
        { id: 'dp-2', user_id: null, destination_name: 'Queenstown', destination_image: '', location: 'New Zealand', vibe: 'adventure', review: "If you've ever wanted to feel genuinely alive and terrified at the same time, this is your place. The scenery alone justifies the flight.", best_for: 'Adventure trip', likes_count: 28, created_at: new Date(Date.now() - 18*3600000).toISOString() },
        { id: 'dp-3', user_id: null, destination_name: 'Kyoto in April', destination_image: '', location: 'Japan', vibe: 'bucket_list', review: 'Cherry blossoms in Maruyama Park at dusk. People bring bento boxes and sake and sit under the trees. I had no idea travel could feel like that.', best_for: 'Bucket list', likes_count: 41, created_at: new Date(Date.now() - 36*3600000).toISOString() },
      ];
      setCommunityPosts(MOCK);
      setFeaturedPost(MOCK[0] ?? null);
    }
  }, []);

  useEffect(() => { fetchCommunityPosts(); }, [fetchCommunityPosts]);

  // ── Load curated list for active vibe ───────────────────────────────────────
  const loadVibe = useCallback((vibeId) => {
    setLoading(true);
    setError('');
    const list = CURATED_DESTINATIONS[vibeId] || [];
    if (list.length > 0) {
      // Simulate a small load delay for the animation to feel natural
      setTimeout(() => {
        setDestinations(list);
        setLoading(false);
      }, 300);
    } else {
      // Show all curated destinations for "All" tab
      const all = Object.values(CURATED_DESTINATIONS).flat();
      setTimeout(() => {
        setDestinations(all);
        setLoading(false);
      }, 300);
    }
  }, []);

  // Initial load intentionally starts empty; users pick a vibe or search.
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setDestinations([]);
  }, []);

  // ── Search filter ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const searchBase = search.trim() && !vibe ? Object.values(CURATED_DESTINATIONS).flat() : destinations;
    if (!search.trim()) return searchBase;
    const q = search.trim().toLowerCase();
    return searchBase.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q)
    );
  }, [destinations, search, vibe]);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setGoogleSearchResults([]);
      setGoogleSearchLoading(false);
      return undefined;
    }

    let isActive = true;
    const timer = window.setTimeout(async () => {
      setGoogleSearchLoading(true);
      try {
        const q = encodeURIComponent(`${query} travel destination`);
        const res = await fetch(`/api/places?action=textsearch&query=${q}&type=tourist_attraction`);
        const data = await res.json();
        if (!isActive) return;

        const curatedKeys = new Set(filtered.map(normalizeDestinationMatchKey));
        const nextResults = (data.results || [])
          .slice(0, 6)
          .map((result, index) => {
            const photo = result?.photos?.[0];
            const photoRef = photo?.photo_reference;
            const id = `google-${result.place_id || index}-${query.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            const location = result.formatted_address || result.vicinity || '';
            const mapped = {
              id,
              place_id: result.place_id || null,
              destination_key: result.place_id || id,
              name: result.name || query,
              location,
              vibe: vibe && vibe !== 'all' ? vibe : 'bucket_list',
              description: result.editorial_summary?.overview || `Found on Google for "${query}".`,
              emoji: '📍',
              website: '',
              photo: photoRef ? `/api/places?action=photo&ref=${encodeURIComponent(photoRef)}&maxwidth=800` : '',
            };

            if (photo?.html_attributions?.[0]) {
              setPhotoAttributions((prev) => (
                prev[id] ? prev : { ...prev, [id]: photo.html_attributions[0] }
              ));
            }

            return mapped;
          })
          .filter((destination) => !curatedKeys.has(normalizeDestinationMatchKey(destination)));

        setGoogleSearchResults(nextResults.slice(0, 3));
      } catch {
        if (isActive) setGoogleSearchResults([]);
      } finally {
        if (isActive) setGoogleSearchLoading(false);
      }
    }, 260);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [filtered, search, vibe]);

  const fetchDestinationPhoto = useCallback(async (destination) => {
    const destinationId = String(destination?.id || '');
    const destinationName = destination?.name || destination?.destination_name || '';
    const destinationPhoto = getDestinationResolvedImage(destination, '');
    if (!destinationId || !destinationName || destinationPhoto || photoFetchedRef.current.has(destinationId)) return;
    photoFetchedRef.current.add(destinationId);

    try {
      const q = encodeURIComponent(`${destinationName} ${destination.location || ''} travel destination`);
      const res = await fetch(`/api/places?action=textsearch&query=${q}&type=tourist_attraction`);
      const data = await res.json();
      const photo = data.results?.[0]?.photos?.[0];
      const photoRef = photo?.photo_reference;
      if (!photoRef) return;

      const url = `/api/places?action=photo&ref=${encodeURIComponent(photoRef)}&maxwidth=800`;
      setPlacePhotos((prev) => (
        prev[destination.id] ? prev : { ...prev, [destination.id]: url }
      ));

      const attribution = photo.html_attributions?.[0] || '';
      if (attribution) {
        setPhotoAttributions((prev) => (
          prev[destination.id] ? prev : { ...prev, [destination.id]: attribution }
        ));
      }
    } catch {
      // Google photos are a progressive enhancement; keep emoji cards if unavailable.
    }
  }, []);

  useEffect(() => {
    if (!filtered.length) return;
    filtered.slice(0, 24).forEach((destination) => fetchDestinationPhoto(destination));
  }, [filtered, fetchDestinationPhoto]);

  useEffect(() => {
    if (!featuredPost) return;
    fetchDestinationPhoto(featuredPost);
  }, [featuredPost, fetchDestinationPhoto]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleVibeChange = (vibeId) => {
    if (vibe === vibeId) {
      setVibe('');
      setSearch('');
      setError('');
      setDestinations([]);
      setLoading(false);
      return;
    }

    setVibe(vibeId);
    setSearch('');
    loadVibe(vibeId === 'all' ? null : vibeId);
  };

  const recordDestinationInteraction = useCallback(async (destination, eventType) => {
    const key = destinationTrackingKey(destination);
    const name = destination.name || destination.destination_name || destination.text || '';
    if (!key || !name) return;

    try {
      await supabase.rpc('record_destination_interaction', {
        p_destination_key: String(key),
        p_destination_name: name,
        p_location: destination.location || null,
        p_vibe: destination.vibe || null,
        p_photo: destination.photo || destination.destination_image || destination.imageUrl || null,
        p_event_type: eventType,
      });
    } catch {
      // Tracking should never block the discovery flow.
    }
  }, []);

  const handleDestinationTap = useCallback((destination) => {
    if (Date.now() - lastSheetCloseAtRef.current < 350) return;
    recordDestinationInteraction(destination, 'click');
    setSelected(destination);
  }, [recordDestinationInteraction]);

  const handleDestinationSheetClose = useCallback(() => {
    lastSheetCloseAtRef.current = Date.now();
    setSelected(null);
  }, []);

  const handleSaveToSomeday = (destination) => {
    const imageUrl = getDestinationResolvedImage(destination, placePhotos[destination.id] || '');

    setSavedIds(prev => new Set([...prev, destination.id]));
    recordDestinationInteraction({ ...destination, photo: imageUrl }, 'save');
    onSaveToSomeday?.({
      id: Date.now().toString(),
      text: destination.name,
      categoryId: 'travel',
      type: 'destinations',
      status: 'dreaming',
      tab: 'ours',
      emoji: destination.emoji || '✈️',
      imageUrl,
      notes: `${destination.location} · ${VIBES.find(v => v.id === destination.vibe)?.label || ''}`,
      comments: [],
      partnerHearted: false,
      myHearted: false,
      createdAt: new Date().toISOString(),
    });
  };

  const handleShareSubmit = async (form) => {
    const payload = {
      user_id: currentUserId,
      destination_name: form.destination_name.trim(),
      destination_image: form.destination_image || null,
      location: form.location.trim() || null,
      vibe: form.vibe || null,
      review: form.review.trim(),
      best_for: form.best_for.trim() || null,
      likes_count: 0,
    };

    const { error } = await supabase.from('destination_posts').insert(payload);
    if (error) {
      // Try without image
      if (payload.destination_image) {
        const { error: e2 } = await supabase.from('destination_posts').insert({ ...payload, destination_image: null });
        if (e2) { console.error(e2); return false; }
        payload.destination_image = null;
      } else {
        console.error(error); return false;
      }
    }

    const savedPost = { ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
    setCommunityPosts(prev => [savedPost, ...prev.filter(p => String(p.destination_name) !== String(savedPost.destination_name))]);
    setFeaturedPost(savedPost);
    setHighlightedPostId(String(savedPost.id));
    window.setTimeout(() => communityFeedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return true;
  };

  const handleDeletePost = useCallback(async (post) => {
    if (!post?.id) return;
    if (!window.confirm('Delete this recommendation?')) return;
    const { error } = await supabase.from('destination_posts').delete().eq('id', post.id);
    if (error) { console.error(error); return; }
    const nextPosts = communityPosts.filter(item => String(item.id) !== String(post.id));
    setCommunityPosts(nextPosts);
    setHighlightedPostId(current => String(current) === String(post.id) ? null : current);
    setFeaturedPost(current => current && String(current.id) === String(post.id) ? nextPosts[0] ?? null : current);
  }, [communityPosts]);

  const handleSomedayFromPost = useCallback((post) => {
    const imageUrl = getDestinationResolvedImage(post, placePhotos[post.id] || '');
    recordDestinationInteraction({ ...post, destination_image: imageUrl }, 'save');
    onSaveToSomeday?.({ ...destinationSomedayPayload(post, imageUrl), location: post.location || '', review: post.review || '', best_for: post.best_for || '' });
  }, [onSaveToSomeday, placePhotos, recordDestinationInteraction]);

  // ── Style tokens ─────────────────────────────────────────────────────────────
  const pageBg = darkMode ? '#0e1520' : '#faf8f3';
  const bw     = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const tp     = darkMode ? '#f1f5f9' : '#111827';
  const ts     = darkMode ? '#6b7280' : '#9ca3af';
  const heroBg = darkMode
    ? 'linear-gradient(135deg, #0f1628 0%, #1a1550 54%, #0e1520 100%)'
    : 'linear-gradient(135deg, #eef2ff 0%, #f0fdfa 55%, #faf8f3 100%)';

  const activeVibeLabel = VIBES.find(v => v.id === vibe)?.label || '';
  const displayedDestinations = useMemo(() => (
    search.trim()
      ? [...filtered, ...googleSearchResults]
      : filtered
  ), [filtered, googleSearchResults, search]);
  const searchSuggestions = useMemo(() => {
    const seen = new Set();
    return displayedDestinations
      .filter((destination) => {
        const key = normalizeDestinationMatchKey(destination);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [displayedDestinations]);
  const showGoogleSearchState = Boolean(search.trim());
  const resultHeading = search.trim()
    ? `Results for "${search}"`
    : activeVibeLabel && vibe !== 'all'
      ? activeVibeLabel
      : 'Destinations worth dreaming about';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: 'var(--font-sans, system-ui, sans-serif)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <div style={{ maxWidth: 768, margin: '0 auto', paddingTop: 24 }}>
      {/* ── Hero ── */}
      <div style={{ margin: '0 16px 16px', borderRadius: 28, padding: '32px 28px 28px', minHeight: 220, position: 'relative', overflow: 'hidden', border: `1px solid ${darkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.18)'}`, background: heroBg }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(99,102,241,0.12), transparent)' }} />
        {onBack && (
          <button onClick={onBack} aria-label="Back" style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.2)'}`, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)', color: tp, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
        <div style={{ position: 'absolute', right: 18, top: 10, fontSize: 88, opacity: darkMode ? 0.07 : 0.09, transform: 'rotate(10deg)', pointerEvents: 'none', userSelect: 'none' }}>✈️</div>
        <h1 style={{ fontFamily: handwritten, fontSize: 52, fontWeight: 700, lineHeight: 1.02, margin: '42px 0 10px', maxWidth: 360, backgroundImage: darkMode ? 'linear-gradient(90deg, #f8fafc 0%, #a5b4fc 100%)' : 'linear-gradient(90deg, #1e1b4b 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
          The world is waiting
        </h1>
        <JourneyQuoteDisplay
          quote={destinationsQuote}
          darkMode={darkMode}
          compact
          className="max-w-[340px]"
        />
      </div>

      {/* ── Search bar ── */}
      <div ref={searchBoxRef} style={{ margin: '0 16px 14px', display: 'flex', gap: 8, position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: `1px solid ${bw}`, borderRadius: 14, padding: '10px 14px' }}>
          <Search style={{ width: 14, height: 14, color: ts, flexShrink: 0, opacity: .6 }} />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setShowSearchSuggestions(Boolean(e.target.value.trim()));
            }}
            onFocus={() => {
              if (search.trim() && searchSuggestions.length > 0) setShowSearchSuggestions(true);
            }}
            placeholder="Search a destination or country…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: tp }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setShowSearchSuggestions(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: ts, padding: 0 }}>✕</button>
          )}
        </div>
        {showSearchSuggestions && searchSuggestions.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 30, background: darkMode ? '#131c2e' : '#fff', border: `1px solid ${bw}`, borderRadius: 16, overflow: 'hidden', boxShadow: darkMode ? '0 18px 40px rgba(0,0,0,0.42)' : '0 18px 40px rgba(15,23,42,0.14)' }}>
            {searchSuggestions.map((destination) => (
              <button
                key={`suggestion-${destination.id}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearch(destination.name || destination.destination_name || '');
                  setShowSearchSuggestions(false);
                }}
                style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', borderBottom: `1px solid ${bw}`, background: 'transparent', cursor: 'pointer', color: tp }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>{destination.name || destination.destination_name}</div>
                <div style={{ fontSize: 12, color: ts, marginTop: 2 }}>{destination.location || 'Google result'}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Vibe strip ── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {VIBES.map(v => (
          <button
            key={v.id}
            onClick={(e) => {
              e.currentTarget.blur();
              handleVibeChange(v.id);
            }}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20,
              fontSize: 13, fontFamily: handwritten,
              fontWeight: vibe === v.id ? 700 : 500,
              cursor: 'pointer', transition: 'all .15s', outline: 'none',
              background: vibe === v.id
                ? (darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)')
                : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
              color: vibe === v.id
                ? (darkMode ? '#a5b4fc' : '#4338ca')
                : ts,
              border: vibe === v.id
                ? `1px solid ${darkMode ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}`
                : `1px solid ${bw}`,
            }}
          >
            {v.emoji} {v.label}
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ margin: '0 16px 10px', padding: '8px 14px', background: darkMode ? 'rgba(99,102,241,0.08)' : '#eef2ff', borderRadius: 10, border: `1px solid ${darkMode ? 'rgba(99,102,241,0.2)' : '#c7d2fe'}`, fontSize: 12, color: darkMode ? '#a5b4fc' : '#4338ca', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>ℹ️</span>{error}
        </div>
      )}

      {/* ── Featured community post ── */}
      {featuredPost && (
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ts, margin: '4px 2px 10px' }}>
            {currentUserId && String(featuredPost?.user_id || '') === String(currentUserId) ? 'From your community' : 'Most saved this week'}
          </p>
          <FeaturedDestinationPost
            post={featuredPost}
            photoUrl={getDestinationResolvedImage(featuredPost, placePhotos[featuredPost.id] || '')}
            currentUserId={currentUserId}
            onSomeday={handleSomedayFromPost}
            onRemoveFromSomeday={onRemoveFromSomeday}
            onDelete={handleDeletePost}
            darkMode={darkMode}
          />
        </div>
      )}

      {/* ── "Been somewhere amazing?" CTA card ── */}
      <div style={{ margin: '0 16px 20px', borderRadius: 20, background: darkMode ? 'rgba(99,102,241,0.08)' : '#eef2ff', border: `1.5px solid ${darkMode ? 'rgba(99,102,241,0.2)' : '#c7d2fe'}`, padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: '#818cf8', opacity: 0.12, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 70, height: 70, borderRadius: '50%', background: '#6366f1', opacity: 0.08, pointerEvents: 'none' }} />
        <div style={{ fontSize: 28, marginBottom: 2 }}>🌍</div>
        <p style={{ fontSize: 18, fontWeight: 500, color: darkMode ? '#a5b4fc' : '#3730a3', fontFamily: handwritten, margin: 0 }}>Been somewhere amazing?</p>
        <p style={{ fontSize: 13, color: darkMode ? '#6b7280' : '#6366f1', margin: '0 0 10px', opacity: 0.85 }}>Share it with the community</p>
        <button
          onClick={() => setIsShareOpen(true)}
          style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: 50, padding: '11px 28px', fontSize: 18, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: handwritten }}
        >
          <span style={{ background: '#3730a3', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5H8M8 5L5.5 2.5M8 5L5.5 7.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          Recommend a destination
        </button>
      </div>

      {/* ── Section label ── */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: ts, padding: '0 18px 10px', margin: 0 }}>
        {resultHeading}
      </p>
      {showGoogleSearchState && (
        <p style={{ fontSize: 12, color: ts, padding: '0 18px 12px', margin: 0 }}>
          {googleSearchLoading ? 'Searching Google places...' : googleSearchResults.length ? `Including up to ${googleSearchResults.length} Google matches` : 'No extra Google matches found'}
        </p>
      )}

      {/* ── Destination grid ── */}
      <div style={{ padding: '0 14px 100px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {loading && !showGoogleSearchState
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} darkMode={darkMode} />)
          : displayedDestinations.length === 0
            ? (
              (search || vibe) ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 24px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
                  <p style={{ fontFamily: handwritten, fontSize: 22, color: ts, fontStyle: 'italic', margin: '0 0 16px' }}>
                    {search ? `No destinations match "${search}"` : 'No destinations here yet'}
                  </p>
                  {search && (
                    <button onClick={() => setSearch('')} style={{ padding: '9px 22px', borderRadius: 14, border: 'none', background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Clear search
                    </button>
                  )}
                </div>
              ) : null
            )
            : displayedDestinations.map((d, i) => (
              <DestinationCard
                key={d.id}
                destination={d}
                photoUrl={getDestinationResolvedImage(d, placePhotos[d.id] || '')}
                photoAttribution={photoAttributions[d.id] || ''}
                onTap={(destination) => handleDestinationTap({ ...destination, photo: getDestinationResolvedImage(destination, placePhotos[d.id] || '') })}
                savedIds={savedIds}
                darkMode={darkMode}
                stagger={i}
              />
            ))
        }
      </div>
      </div>

      {/* ── Detail sheet ── */}
      {selected && (
        <DestinationDetailSheet
          destination={selected}
          photoUrl={getDestinationResolvedImage(selected, placePhotos[selected.id] || '')}
          photoAttribution={photoAttributions[selected.id] || ''}
          onAddEvent={onAddEvent}
          onSaveToSomeday={handleSaveToSomeday}
          onClose={handleDestinationSheetClose}
          savedIds={savedIds}
          darkMode={darkMode}
        />
      )}

      {/* ── Share modal ── */}
      {isShareOpen && (
        <PostDestinationModal
          onClose={() => setIsShareOpen(false)}
          onSubmit={handleShareSubmit}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default DestinationsPage;
