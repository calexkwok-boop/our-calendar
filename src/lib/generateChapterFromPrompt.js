const THEME_KEYWORDS = {
  vietnam: ['vietnam', 'hanoi', 'hoi an', 'ha long', 'halong', 'sapa', 'ha giang', 'da nang', 'saigon', 'ho chi minh'],
  japan: ['japan', 'tokyo', 'kyoto', 'osaka', 'hakone', 'shibuya', 'fushimi'],
  europe: ['europe', 'paris', 'france', 'italy', 'rome', 'barcelona', 'spain', 'amsterdam', 'london'],
  beach: ['beach', 'island', 'coast', 'hawaii', 'bali', 'surf', 'ocean', 'caribbean'],
  outdoors: ['hike', 'hiking', 'trail', 'mountain', 'camp', 'outdoors', 'national park', 'trek'],
  food: ['food', 'foodie', 'restaurant', 'omakase', 'brunch', 'wine', 'coffee', 'ramen', 'sushi'],
};

const VIBE_KEYWORDS = {
  foodie: ['foodie', 'food', 'restaurant', 'brunch', 'wine', 'coffee', 'omakase'],
  romantic: ['romantic', 'honeymoon', 'cozy', 'date', 'anniversary'],
  luxury: ['luxury', 'fancy', 'splurge', 'five star', '5-star'],
  budget: ['budget', 'cheap', 'affordable', 'low cost'],
  adventure: ['adventure', 'hike', 'trek', 'camp', 'outdoors', 'road trip'],
};

const PROMPT_EXAMPLES = [
  'Vietnam with Pearl next spring',
  'Tokyo food trip in October',
  'Cozy Napa birthday weekend',
];

const THEME_TITLES = {
  vietnam: 'Vietnam',
  japan: 'Japan',
  europe: 'Europe',
  beach: 'Beach Escape',
  outdoors: 'Into the Wild',
  food: 'Foodie Dreams',
  generic: 'Someday Chapter',
};

const SEEDS = {
  vietnam: [
    { label: 'Pho bo for breakfast', emoji: '🍜', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=900&q=80', description: 'A Hanoi sidewalk breakfast worth chasing.', mapQuery: 'pho restaurant Hanoi Vietnam' },
    { label: 'Old Quarter street wander, Hanoi', emoji: '🏮', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=900&q=80', description: 'Lose a whole evening in the Old Quarter.', mapQuery: 'Hanoi Old Quarter Vietnam' },
    { label: 'Ha Long Bay cruise', emoji: '⛵', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=900&q=80', description: 'Limestone karsts, sunset deck views, and a couple dreamy days on the water.', mapQuery: 'Ha Long Bay cruise Vietnam' },
    { label: 'Hoi An lantern town at night', emoji: '🏮', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1540261491000-b9b34dd5d7c8?w=900&q=80', description: 'The prettiest post-sunset stroll in Vietnam.', mapQuery: 'Hoi An Ancient Town night Vietnam' },
    { label: 'Egg coffee, Hanoi', emoji: '☕', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80', description: 'Sweet, strange, and very Hanoi.', mapQuery: 'Cafe Giang egg coffee Hanoi' },
    { label: 'Cooking class in Hoi An', emoji: '👨‍🍳', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&q=80', description: 'Market run first, then spring rolls and cao lau by the river.', mapQuery: 'cooking class Hoi An Vietnam' },
  ],
  japan: [
    { label: 'TeamLab Borderless', emoji: '🎨', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=900&q=80', description: 'Immersive art that feels like stepping into a dream.', mapQuery: 'teamLab Borderless Tokyo' },
    { label: 'Shibuya Crossing at night', emoji: '🌃', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80', description: 'Neon, crowds, and instant main-character energy.', mapQuery: 'Shibuya Crossing Tokyo' },
    { label: 'Tsukiji fish market breakfast', emoji: '🐟', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&q=80', description: 'An early Tokyo breakfast worth setting an alarm for.', mapQuery: 'Tsukiji Outer Market Tokyo' },
    { label: 'Ryokan stay in Hakone', emoji: '♨️', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1564501049412-61a17c52b51c?w=900&q=80', description: 'Tatami floors, onsen steam, and a real exhale.', mapQuery: 'Ryokan Hakone Japan' },
    { label: 'Fushimi Inari hike', emoji: '⛩️', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=900&q=80', description: 'The red gate climb that always feels cinematic.', mapQuery: 'Fushimi Inari Kyoto' },
    { label: 'Izakaya bar-hop, Shinjuku', emoji: '🍶', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=900&q=80', description: 'Tiny bars, yakitori smoke, and a perfect late night.', mapQuery: 'Golden Gai Shinjuku Tokyo' },
  ],
  europe: [
    { label: 'Corner bistro cafe au lait', emoji: '☕', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=80', description: 'A slow morning at a zinc bar.', mapQuery: 'best cafe au lait Paris France' },
    { label: 'Louvre morning visit', emoji: '🎨', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=900&q=80', description: 'Big art, small window of calm if you go early.', mapQuery: 'Louvre Paris' },
    { label: 'Gelato in Trastevere', emoji: '🍦', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&q=80', description: 'Cobblestones and gelato after dinner.', mapQuery: 'best gelato Trastevere Rome' },
    { label: 'Sunset from Sacre-Coeur', emoji: '🌇', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=900&q=80', description: 'A hilltop golden-hour classic.', mapQuery: 'Sacre Coeur Paris' },
    { label: 'Canal boat ride, Amsterdam', emoji: '🚤', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=900&q=80', description: 'The city feels totally different from the water.', mapQuery: 'canal boat Amsterdam' },
    { label: 'Tapas bar crawl, Barcelona', emoji: '🥘', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=900&q=80', description: 'A whole night built around one more stop.', mapQuery: 'tapas bars El Born Barcelona' },
  ],
  beach: [
    { label: 'Sunrise surf session', emoji: '🏄', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=900&q=80', description: 'Early water and empty sand.', mapQuery: 'surf lessons beach' },
    { label: 'Beachside fish tacos', emoji: '🌮', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=900&q=80', description: 'Exactly as messy and perfect as it should be.', mapQuery: 'fish tacos beachside' },
    { label: 'Sunset cliffside walk', emoji: '🌅', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80', description: 'The kind of walk that fixes your mood instantly.', mapQuery: 'coastal cliff walk sunset' },
    { label: 'Rent a kayak', emoji: '🛶', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=900&q=80', description: 'Sea caves and a better angle on the coastline.', mapQuery: 'kayak rental beach' },
    { label: 'Frozen cocktail at beach bar', emoji: '🍹', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=900&q=80', description: 'Cold drink, warm air, nothing urgent.', mapQuery: 'beach bar cocktails' },
    { label: 'Whale watching tour', emoji: '🐋', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=900&q=80', description: 'One of those days you talk about forever.', mapQuery: 'whale watching tour' },
  ],
  outdoors: [
    { label: 'Sunrise summit attempt', emoji: '🌄', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80', description: 'Headlamp start, unreal payoff.', mapQuery: 'sunrise summit hike' },
    { label: 'Trailhead coffee stop', emoji: '☕', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80', description: 'The pre-hike ritual.', mapQuery: 'coffee near trailhead' },
    { label: 'Camp under the stars', emoji: '🏕️', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900&q=80', description: 'Real dark skies, real silence.', mapQuery: 'campground camping' },
    { label: 'Wildflower meadow loop', emoji: '🌸', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc10?w=900&q=80', description: 'A short-lived seasonal payoff.', mapQuery: 'wildflower meadow hike' },
    { label: 'Waterfall side trail', emoji: '💦', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1433086966628-d6d9b0560f86?w=900&q=80', description: 'Always worth the extra twenty minutes.', mapQuery: 'waterfall trail hike' },
    { label: 'Post-hike burger', emoji: '🍔', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=80', description: 'A necessary part of the adventure.', mapQuery: 'burger mountain town' },
  ],
  food: [
    { label: 'Omakase splurge dinner', emoji: '🍣', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=900&q=80', description: 'A meal that becomes the whole memory.', mapQuery: 'omakase sushi restaurant' },
    { label: 'Farmers market morning', emoji: '🥦', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=80', description: 'Slow start, local colors, great snacks.', mapQuery: 'farmers market weekend' },
    { label: 'Wine tasting afternoon', emoji: '🍷', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80', description: 'Sunlit glasses and no rush.', mapQuery: 'wine tasting winery' },
    { label: 'Cooking class', emoji: '👨‍🍳', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&q=80', description: 'A way to bring the trip home with you.', mapQuery: 'cooking class food experience' },
    { label: 'Michelin star lunch', emoji: '⭐', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80', description: 'A high-low hack that still feels special.', mapQuery: 'Michelin star lunch' },
    { label: 'Late-night ramen', emoji: '🍜', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=900&q=80', description: 'Exactly the right end to a great day.', mapQuery: 'late night ramen' },
  ],
  generic: [
    { label: 'Best local coffee spot', emoji: '☕', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80', description: 'The place locals actually like.', mapQuery: 'best local coffee cafe' },
    { label: 'Hidden gem restaurant', emoji: '🍽️', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80', description: 'The kind of place you brag about finding.', mapQuery: 'hidden gem local restaurant' },
    { label: 'Rooftop sunset bar', emoji: '🌆', categoryId: 'food', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80', description: 'A default good idea in almost any city.', mapQuery: 'rooftop sunset bar' },
    { label: 'Local market morning', emoji: '🛍️', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=900&q=80', description: 'A faster way to feel the place.', mapQuery: 'local market weekend' },
    { label: 'Walking tour of old town', emoji: '🗺️', categoryId: 'experiences', imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=900&q=80', description: 'The easiest first-day move.', mapQuery: 'walking tour old town' },
    { label: 'Cozy stay option', emoji: '🏨', categoryId: 'places', imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80', description: 'Somewhere that feels like part of the trip.', mapQuery: 'boutique hotel cozy stay' },
  ],
};

const SECTION_TEMPLATES = {
  vietnam: ['Eat', 'See', 'Do'],
  japan: ['Eat', 'See', 'Stay'],
  europe: ['Eat', 'See', 'Sip'],
  beach: ['Swim', 'Eat', 'Do'],
  outdoors: ['Do', 'See', 'Refuel'],
  food: ['Eat', 'Sip', 'Do'],
  generic: ['Eat', 'See', 'Do'],
};

const normalize = (value = '') => String(value || '').trim().toLowerCase();

export const getChapterPromptExamples = () => PROMPT_EXAMPLES.slice();

export function parseChapterPrompt(prompt = '') {
  const raw = String(prompt || '').trim();
  const normalized = normalize(raw);
  const companions = [];
  const withMatch = raw.match(/\bwith\s+([^,]+?)(?:\s+(?:in|next|this)\b|$)/i);
  if (withMatch?.[1]) {
    withMatch[1]
      .split(/\s+(?:and|&)\s+|,/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((name) => companions.push(name));
  }
  const season = ['spring', 'summer', 'fall', 'autumn', 'winter'].find((value) => normalized.includes(value)) || '';
  const month = ['january','february','march','april','may','june','july','august','september','october','november','december'].find((value) => normalized.includes(value)) || '';
  const vibes = Object.entries(VIBE_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([key]) => key);
  const theme = Object.entries(THEME_KEYWORDS).find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))?.[0] || 'generic';
  return { raw, normalized, companions, season, month, vibes, theme };
}

function buildTitle(parsed) {
  const baseTitle = THEME_TITLES[parsed.theme] || THEME_TITLES.generic;
  const firstCompanion = parsed.companions[0] || '';
  if (firstCompanion) return `${baseTitle} with ${firstCompanion}`;
  if (parsed.vibes.includes('romantic')) return `Romantic ${baseTitle}`;
  if (parsed.vibes.includes('foodie')) return `${baseTitle} Food Trip`;
  return baseTitle;
}

function pickSeeds(parsed) {
  const themeSeeds = (SEEDS[parsed.theme] || SEEDS.generic).slice();
  const preferred = parsed.vibes.includes('foodie')
    ? themeSeeds.sort((a, b) => (a.categoryId === 'food' ? -1 : 0) - (b.categoryId === 'food' ? -1 : 0))
    : themeSeeds;
  return preferred.slice(0, 6);
}

function buildLabels(parsed) {
  const labels = SECTION_TEMPLATES[parsed.theme] || SECTION_TEMPLATES.generic;
  return labels.slice(0, 3).map((text, index) => ({
    id: `generated-label-${index}-${text.toLowerCase()}`,
    type: 'label',
    text,
    fontStyle: index === 0 ? 'handwritten' : 'bold',
    fontSize: index === 0 ? 'large' : 'medium',
    textColor: index === 0 ? '#0d9488' : index === 1 ? '#7c3aed' : '#d97706',
    styleVariant: index === 0 ? 'tape' : 'highlight',
    meta: { persistScope: 'chapter', autoGenerated: true },
  }));
}

export function generateChapterFromPrompt(prompt = '') {
  const parsed = parseChapterPrompt(prompt);
  const title = buildTitle(parsed);
  const pins = pickSeeds(parsed).map((seed, index) => ({
    id: `generated-pin-${index}-${normalize(seed.label).replace(/\s+/g, '-')}`,
    type: 'photo',
    label: seed.label,
    emoji: seed.emoji,
    categoryId: seed.categoryId,
    imageUrl: seed.imageUrl,
    photoUrl: seed.imageUrl,
    description: seed.description || '',
    mapQuery: seed.mapQuery || '',
    status: 'dreaming',
    pinColor: seed.categoryId === 'food' ? 'pink' : seed.categoryId === 'places' ? 'teal' : 'purple',
    sourceType: seed.categoryId === 'food' ? 'restaurants' : seed.categoryId === 'places' ? 'destinations' : 'hiking',
    meta: { persistScope: 'chapter', generatedFromPrompt: true },
  }));
  const labels = buildLabels(parsed);
  return {
    chapter: {
      title,
      sourcePrompt: parsed.raw,
      theme: parsed.theme,
      vibes: parsed.vibes,
      season: parsed.season || parsed.month || '',
      companions: parsed.companions,
    },
    pins,
    labels,
    metadata: parsed,
  };
}
