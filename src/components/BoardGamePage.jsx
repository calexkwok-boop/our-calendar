import React, { useState, useEffect, useRef } from 'react';

// ─── static cover images ──────────────────────────────────────────────────────
const GAME_COVERS = {
  'Gloomhaven':            'https://upload.wikimedia.org/wikipedia/en/4/43/Gloomhaven_cover.jpg',
  'Pandemic Legacy S1':    'https://upload.wikimedia.org/wikipedia/en/3/3e/Pandemic_Legacy_Season_1.jpg',
  'Terraforming Mars':     'https://upload.wikimedia.org/wikipedia/en/f/fc/Terraforming_Mars_box_cover.jpg',
  'Brass: Birmingham':     'https://upload.wikimedia.org/wikipedia/en/7/7f/Brass_Birmingham.jpg',
  'Twilight Imperium 4':   'https://upload.wikimedia.org/wikipedia/en/a/a5/Twilight_Imperium_Fourth_Edition_box.jpg',
  'Ark Nova':              'https://upload.wikimedia.org/wikipedia/en/b/b2/Ark_Nova_game.jpg',
  'Dune: Imperium':        'https://upload.wikimedia.org/wikipedia/en/4/4e/Dune_Imperium_cover.jpg',
  'Star Wars: Rebellion':  'https://upload.wikimedia.org/wikipedia/en/1/1e/Star_Wars_Rebellion_board_game.jpg',
  'Twilight Struggle':     'https://upload.wikimedia.org/wikipedia/en/b/b7/Twilight_Struggle_cover.jpg',
  'Ticket to Ride':        'https://upload.wikimedia.org/wikipedia/en/9/92/Ticket_to_Ride_board_game_box_EN.jpg',
  'Catan':                 'https://upload.wikimedia.org/wikipedia/en/a/a3/Catan-2015box.jpg',
  'Carcassonne':           'https://upload.wikimedia.org/wikipedia/en/4/4c/Carcassonne_Cover.jpg',
  'Pandemic':              'https://upload.wikimedia.org/wikipedia/en/e/e5/Pandemic_board_game_box.jpg',
  '7 Wonders':             'https://upload.wikimedia.org/wikipedia/en/7/7e/7_Wonders_board_game_cover.jpg',
  'Codenames':             'https://upload.wikimedia.org/wikipedia/en/3/3d/Codenames_board_game_cover.jpg',
  'Wingspan':              'https://upload.wikimedia.org/wikipedia/en/a/a1/Wingspan-board-game.jpg',
  'Azul':                  'https://upload.wikimedia.org/wikipedia/en/3/32/Azul_board_game.jpg',
  'Gaia Project':          'https://upload.wikimedia.org/wikipedia/en/5/5e/Gaia_Project_box.jpg',
  'Vindication':           'https://upload.wikimedia.org/wikipedia/en/v/va/Vindication_board_game.jpg',
  'Dominion':              'https://upload.wikimedia.org/wikipedia/en/7/7e/DominionGameBox.png',
  'Viticulture EE':        'https://upload.wikimedia.org/wikipedia/en/4/44/Viticulture_board_game.jpg',
  'Gloomhaven: Jaws':      'https://upload.wikimedia.org/wikipedia/en/c/c5/Gloomhaven_Jaws_of_the_Lion.jpg',
  'War of the Ring 2e':    'https://upload.wikimedia.org/wikipedia/en/7/74/War_of_the_Ring_2nd_edition.jpg',
  "Tzolk'in":              'https://upload.wikimedia.org/wikipedia/en/0/05/Tzolkin_The_Mayan_Calendar.jpg',
  'The Crew':              'https://upload.wikimedia.org/wikipedia/en/0/0e/The_Crew_board_game.jpg',
  'Lost Ruins of Arnak':   'https://upload.wikimedia.org/wikipedia/en/4/41/Lost_Ruins_of_Arnak.jpg',
  'Dixit':                 'https://upload.wikimedia.org/wikipedia/en/1/1b/Dixit_board_game.jpg',
  'Pandemic: Iberia':      'https://upload.wikimedia.org/wikipedia/en/2/28/Pandemic_Iberia.jpg',
  'Heat: Pedal to Metal':  'https://upload.wikimedia.org/wikipedia/en/0/0e/Heat_Pedal_to_Metal.jpg',
  'Cascadia':              'https://upload.wikimedia.org/wikipedia/en/a/a8/Cascadia_board_game.jpg',
};

// ─── fallback data ────────────────────────────────────────────────────────────
const FALLBACK_GAMES = [
  { id: '174430', name: 'Gloomhaven',          year: 2017, rating: 8.6, minPlayers: 1, maxPlayers: 4, minTime: 60,  maxTime: 120, age: 14, category: 'strategy',     description: 'A game of tactical combat in an ever-changing dungeon. Players control mercenaries with unique abilities.' },
  { id: '161936', name: 'Pandemic Legacy S1',  year: 2015, rating: 8.6, minPlayers: 2, maxPlayers: 4, minTime: 60,  maxTime: 75,  age: 13, category: 'cooperative',  description: 'A fully cooperative, legacy-style game where your decisions carry over from session to session.' },
  { id: '167791', name: 'Terraforming Mars',   year: 2016, rating: 8.4, minPlayers: 1, maxPlayers: 5, minTime: 90,  maxTime: 120, age: 12, category: 'strategy',     description: 'Compete to transform Mars into a habitable planet by raising temperature, oxygen, and ocean coverage.' },
  { id: '224517', name: 'Brass: Birmingham',   year: 2018, rating: 8.7, minPlayers: 2, maxPlayers: 4, minTime: 60,  maxTime: 120, age: 14, category: 'strategy',     description: 'An economic strategy game about building networks in the industrial revolution.' },
  { id: '233078', name: 'Twilight Imperium 4', year: 2017, rating: 8.7, minPlayers: 3, maxPlayers: 6, minTime: 240, maxTime: 480, age: 14, category: 'strategy',     description: 'Epic space opera of galactic conquest, politics, and trade spanning an entire day of play.' },
  { id: '342942', name: 'Ark Nova',            year: 2021, rating: 8.6, minPlayers: 1, maxPlayers: 4, minTime: 90,  maxTime: 150, age: 14, category: 'strategy',     description: 'Build a modern zoo and support conservation projects in this card-driven tableau builder.' },
  { id: '316554', name: 'Dune: Imperium',      year: 2020, rating: 8.4, minPlayers: 1, maxPlayers: 4, minTime: 60,  maxTime: 120, age: 14, category: 'strategy',     description: "A deck-building worker placement game set in the world of Frank Herbert's Dune." },
  { id: '187645', name: 'Star Wars: Rebellion', year: 2016, rating: 8.4, minPlayers: 2, maxPlayers: 4, minTime: 180, maxTime: 240, age: 14, category: 'strategy',   description: 'Wage galactic war as the Empire or Rebel Alliance in this asymmetric game of epic scope.' },
  { id: '12333',  name: 'Twilight Struggle',   year: 2005, rating: 8.3, minPlayers: 2, maxPlayers: 2, minTime: 120, maxTime: 180, age: 13, category: 'strategy',     description: 'A tense two-player game simulating the Cold War from 1945 to 1989.' },
  { id: '9209',   name: 'Ticket to Ride',      year: 2004, rating: 7.4, minPlayers: 2, maxPlayers: 5, minTime: 45,  maxTime: 90,  age: 8,  category: 'family',       description: 'Collect cards to claim railway routes across the country and connect cities.' },
  { id: '13',     name: 'Catan',               year: 1995, rating: 7.1, minPlayers: 3, maxPlayers: 4, minTime: 60,  maxTime: 120, age: 10, category: 'family',       description: 'Trade, build, and settle the island of Catan in this classic resource management game.' },
  { id: '822',    name: 'Carcassonne',         year: 2000, rating: 7.4, minPlayers: 2, maxPlayers: 5, minTime: 30,  maxTime: 45,  age: 7,  category: 'family',       description: 'Place tiles to build the medieval landscape of Carcassonne and score points with your followers.' },
  { id: '30549',  name: 'Pandemic',            year: 2008, rating: 7.6, minPlayers: 2, maxPlayers: 4, minTime: 45,  maxTime: 75,  age: 8,  category: 'cooperative',  description: "Work together to contain deadly diseases spreading across the globe before it's too late." },
  { id: '68448',  name: '7 Wonders',           year: 2010, rating: 7.7, minPlayers: 2, maxPlayers: 7, minTime: 30,  maxTime: 45,  age: 10, category: 'family',       description: 'Draft cards to build one of the seven wonders of the ancient world.' },
  { id: '178900', name: 'Codenames',           year: 2015, rating: 7.7, minPlayers: 2, maxPlayers: 8, minTime: 15,  maxTime: 30,  age: 14, category: 'party',        description: 'Two rival spymasters give one-word clues to help their teams identify secret agents.' },
  { id: '266192', name: 'Wingspan',            year: 2019, rating: 8.1, minPlayers: 1, maxPlayers: 5, minTime: 40,  maxTime: 70,  age: 10, category: 'family',       description: 'Attract birds to your wildlife preserve with eggs, food, and nest types in this engine-builder.' },
  { id: '198928', name: 'Azul',                year: 2017, rating: 7.9, minPlayers: 2, maxPlayers: 4, minTime: 30,  maxTime: 45,  age: 8,  category: 'family',       description: 'Draft colorful tiles to decorate the walls of the Royal Palace of Evora.' },
  { id: '220308', name: 'Gaia Project',        year: 2017, rating: 8.5, minPlayers: 1, maxPlayers: 4, minTime: 60,  maxTime: 150, age: 12, category: 'strategy',     description: 'Expand across the galaxy as one of 14 unique factions in this deep civilization game.' },
  { id: '251247', name: 'Vindication',         year: 2018, rating: 7.9, minPlayers: 1, maxPlayers: 5, minTime: 60,  maxTime: 100, age: 14, category: 'strategy',     description: 'Redeem a wretched soul through acts of honor, courage, and compassion on an unforgiving island.' },
  { id: '36218',  name: 'Dominion',            year: 2008, rating: 7.6, minPlayers: 2, maxPlayers: 4, minTime: 30,  maxTime: 60,  age: 13, category: 'strategy',     description: 'The original deck-building game — build a deck to acquire the most victory points.' },
  { id: '173346', name: 'Viticulture EE',      year: 2015, rating: 8.1, minPlayers: 1, maxPlayers: 6, minTime: 45,  maxTime: 90,  age: 13, category: 'strategy',     description: 'Build a wine empire in Tuscany by growing grapes, making wine, and fulfilling orders.' },
  { id: '291457', name: 'Gloomhaven: Jaws',    year: 2020, rating: 8.3, minPlayers: 1, maxPlayers: 4, minTime: 30,  maxTime: 60,  age: 14, category: 'cooperative',  description: 'A standalone and expansion to Gloomhaven — shorter dungeon crawls in a box you can actually carry.' },
  { id: '115746', name: 'War of the Ring 2e',  year: 2011, rating: 8.6, minPlayers: 2, maxPlayers: 4, minTime: 120, maxTime: 180, age: 13, category: 'strategy',     description: "The Free Peoples and Shadow Armies clash in an epic recreation of Tolkien's Middle-earth." },
  { id: '126163', name: "Tzolk'in",            year: 2012, rating: 8.0, minPlayers: 2, maxPlayers: 4, minTime: 60,  maxTime: 90,  age: 13, category: 'strategy',     description: 'A worker placement game with interlocking gears representing the Mayan calendar.' },
  { id: '285967', name: 'The Crew',            year: 2019, rating: 7.8, minPlayers: 2, maxPlayers: 5, minTime: 20,  maxTime: 30,  age: 10, category: 'cooperative',  description: 'A cooperative trick-taking card game — complete missions by silently coordinating your plays.' },
  { id: '271320', name: 'Lost Ruins of Arnak', year: 2020, rating: 8.1, minPlayers: 1, maxPlayers: 4, minTime: 30,  maxTime: 120, age: 12, category: 'strategy',     description: 'Explore an uncharted island, fight guardians, and research ancient secrets in this deck-building adventure.' },
  { id: '39856',  name: 'Dixit',               year: 2008, rating: 7.3, minPlayers: 3, maxPlayers: 8, minTime: 30,  maxTime: 45,  age: 8,  category: 'party',        description: 'Describe dreamy illustrated cards with a word or phrase — score points when some (not all) guess correctly.' },
  { id: '163412', name: 'Pandemic: Iberia',    year: 2016, rating: 7.5, minPlayers: 2, maxPlayers: 5, minTime: 45,  maxTime: 75,  age: 8,  category: 'cooperative',  description: 'A historical reimagining of Pandemic set in the Iberian Peninsula of the 1840s.' },
  { id: '396790', name: 'Heat: Pedal to Metal', year: 2022, rating: 8.1, minPlayers: 1, maxPlayers: 6, minTime: 30,  maxTime: 60,  age: 10, category: 'family',      description: 'A blazing fast race game where managing your engine is as important as your driving line.' },
  { id: '356123', name: 'Cascadia',            year: 2021, rating: 7.9, minPlayers: 1, maxPlayers: 4, minTime: 30,  maxTime: 45,  age: 10, category: 'family',       description: 'Build a Pacific Northwest ecosystem by placing terrain tiles and wildlife tokens.' },
];

// ─── config ───────────────────────────────────────────────────────────────────
const GAME_TABS = [
  { key: 'all',         label: 'All',      emoji: '🎲' },
  { key: 'strategy',    label: 'Strategy', emoji: '♟️' },
  { key: 'family',      label: 'Family',   emoji: '👨‍👩‍👧' },
  { key: 'party',       label: 'Party',    emoji: '🎉' },
  { key: 'cooperative', label: 'Coop',     emoji: '🤝' },
];

const PLAYER_FILTERS = [
  { id: 'all', label: 'Any' },
  { id: '1',   label: 'Solo' },
  { id: '2',   label: '2' },
  { id: '3-4', label: '3–4' },
  { id: '5+',  label: '5+' },
];

const TIME_FILTERS = [
  { id: 'all',    label: 'Any time' },
  { id: 'quick',  label: '≤ 30 min' },
  { id: 'medium', label: '30–90 min' },
  { id: 'long',   label: '90+ min' },
];

const CAT_EMOJI = { strategy: '♟️', family: '👨‍👩‍👧', party: '🎉', cooperative: '🤝' };

// ─── BGG API helpers ──────────────────────────────────────────────────────────
const BGG_IDS = FALLBACK_GAMES.map(g => g.id);

const retailLinks = (name) => ({
  amazon:  `https://www.amazon.com/s?k=${encodeURIComponent(name + ' board game')}`,
  target:  `https://www.target.com/s?searchTerm=${encodeURIComponent(name + ' board game')}`,
  walmart: `https://www.walmart.com/search?q=${encodeURIComponent(name + ' board game')}`,
});

const parseBGGXML = (xmlText) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const items = doc.querySelectorAll('item');
    const games = [];
    items.forEach(item => {
      const id = item.getAttribute('id');
      const nameEl = item.querySelector('name[type="primary"]');
      const name = nameEl ? nameEl.getAttribute('value') : '';
      const year = parseInt(item.querySelector('yearpublished')?.getAttribute('value') || '0');
      const rating = parseFloat(item.querySelector('statistics ratings average')?.getAttribute('value') || '0');
      const minPlayers = parseInt(item.querySelector('minplayers')?.getAttribute('value') || '1');
      const maxPlayers = parseInt(item.querySelector('maxplayers')?.getAttribute('value') || '4');
      const minTime = parseInt(item.querySelector('minplaytime')?.getAttribute('value') || '30');
      const maxTime = parseInt(item.querySelector('maxplaytime')?.getAttribute('value') || '60');
      const age = parseInt(item.querySelector('minage')?.getAttribute('value') || '8');
      const description = item.querySelector('description')?.textContent?.trim().slice(0, 200) + '...' || '';
      const links = item.querySelectorAll('link[type="boardgamecategory"]');
      const cats = Array.from(links).map(l => l.getAttribute('value')?.toLowerCase() || '');
      let category = 'strategy';
      if (cats.some(c => c.includes('party') || c.includes('trivia'))) category = 'party';
      else if (cats.some(c => c.includes('children') || c.includes('family'))) category = 'family';
      else if (cats.some(c => c.includes('cooperative'))) category = 'cooperative';
      if (name) games.push({ id, name, year, rating: Math.round(rating * 10) / 10, minPlayers, maxPlayers, minTime, maxTime, age, description, category });
    });
    return games;
  } catch {
    return [];
  }
};

// ─── FeaturedBanner ───────────────────────────────────────────────────────────
function FeaturedBanner({ game, onTap, onAddToSomeday, somedays }) {
  const [inSomeday, setInSomeday] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (game) setInSomeday(somedays.has(game.id));
  }, [game, somedays]);

  if (!game) return (
    <div className="mx-3.5 h-52 rounded-2xl bg-stone-100 dark:bg-[#161f30] animate-pulse mb-3" />
  );

  const coverUrl = GAME_COVERS[game.name];
  const catEmoji = CAT_EMOJI[game.category] || '🎲';
  const timeLabel = game.maxTime >= 90 ? `${game.minTime}–${game.maxTime} min` : `${game.maxTime} min`;

  function handleSomeday(e) {
    e.stopPropagation();
    setInSomeday(v => !v);
    onAddToSomeday?.(game);
  }

  return (
    <div
      className="mx-3.5 rounded-2xl overflow-hidden relative cursor-pointer mb-3"
      style={{ height: '210px' }}
      onClick={() => onTap(game)}
    >
      {coverUrl && !imgError
        ? <img src={`https://images.weserv.nl/?url=${encodeURIComponent(coverUrl)}&w=600`} alt={game.name} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgError(true)} />
        : <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-[#0e1520] flex items-center justify-center text-7xl opacity-30">{catEmoji}</div>
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-widest uppercase text-purple-400 mb-1">Featured</p>
            <h2 className="text-lg font-semibold text-white leading-tight truncate">{game.name}</h2>
            <p className="text-xs text-white/50 mt-0.5">
              {game.year} · ★ {game.rating.toFixed(1)} · {timeLabel}
            </p>
          </div>
          <button
            onClick={handleSomeday}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-xl transition-all active:opacity-70 ${inSomeday ? 'bg-teal-600 text-white' : 'bg-teal-400 text-gray-900'}`}
          >
            {inSomeday ? '✓ Saved' : '+ Someday'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PosterGrid ───────────────────────────────────────────────────────────────
function PosterGrid({ games, loading, somedays, onTap }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5 px-3.5">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-stone-100 dark:bg-[#161f30] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 px-3.5">
      {games.slice(1).map(game => (
        <GamePosterCard key={game.id} game={game} somedays={somedays} onTap={onTap} />
      ))}
    </div>
  );
}

function GamePosterCard({ game, somedays, onTap }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = GAME_COVERS[game.name];
  const catEmoji = CAT_EMOJI[game.category] || '🎲';
  const inSomeday = somedays.has(game.id);

  return (
    <div
      className="aspect-[2/3] rounded-xl overflow-hidden relative cursor-pointer bg-stone-100 dark:bg-[#161f30]"
      onClick={() => onTap(game)}
    >
      {coverUrl && !imgError
        ? <img src={`https://images.weserv.nl/?url=${encodeURIComponent(coverUrl)}&w=300`} alt={game.name} className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
        : <div className="w-full h-full flex items-center justify-center text-3xl bg-purple-500/10">{catEmoji}</div>
      }
      {/* Rating badge */}
      <div className="absolute bottom-1.5 left-1.5 bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-0.5">
        <span className="text-[9px] text-amber-400">★</span>
        <span className="text-[9px] text-white/70">{game.rating.toFixed(1)}</span>
      </div>
      {/* Someday indicator */}
      {inSomeday && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── GameDetailSheet ──────────────────────────────────────────────────────────
function GameDetailSheet({ game, open, onClose, onAddEvent, onAddToSomeday, somedays }) {
  const [inSomeday, setInSomeday] = useState(false);
  const [addedToNight, setAddedToNight] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (game) setInSomeday(somedays.has(game.id));
  }, [game, somedays]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!game) return null;

  const coverUrl = GAME_COVERS[game.name];
  const catEmoji = CAT_EMOJI[game.category] || '🎲';
  const timeLabel = game.maxTime >= 90 ? `${game.minTime}–${game.maxTime} min` : `${game.maxTime} min`;
  const playerLabel = game.minPlayers === game.maxPlayers ? `${game.minPlayers} players` : `${game.minPlayers}–${game.maxPlayers} players`;
  const links = retailLinks(game.name);

  function handleSomeday() {
    setInSomeday(v => !v);
    onAddToSomeday?.({ ...game, type: 'games', cardTitle: game.name, poster_path: '' });
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[10002] bg-black/60 transition-opacity duration-250 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <div
        style={{ WebkitOverflowScrolling: 'touch' }}
        className={`fixed bottom-0 left-0 right-0 z-[10002] max-w-lg mx-auto bg-white dark:bg-[#131c2e] rounded-t-3xl border-t border-stone-200 dark:border-white/[0.06] transition-transform duration-300 ease-out max-h-[88vh] overflow-y-auto overscroll-contain ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-stone-200 dark:bg-white/10 rounded-full mx-auto mt-3 sticky top-3" />

        {/* Hero image */}
        {coverUrl && !imgError ? (
          <img src={`https://images.weserv.nl/?url=${encodeURIComponent(coverUrl)}&w=600`} alt={game.name} className="w-full h-48 object-cover mt-4" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-48 mt-4 bg-purple-500/10 flex items-center justify-center text-5xl">{catEmoji}</div>
        )}

        {/* Content */}
        <div className="px-5 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
          {/* Thumbnail + title row */}
          <div className="flex gap-3 -mt-10 mb-4">
            <div className="flex-shrink-0 w-20 h-[120px] rounded-xl overflow-hidden border-2 border-white dark:border-[#131c2e] shadow-xl bg-purple-500/10 flex items-center justify-center text-2xl">
              {coverUrl && !imgError
                ? <img src={`https://images.weserv.nl/?url=${encodeURIComponent(coverUrl)}&w=300`} alt={game.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
                : catEmoji
              }
            </div>
            <div className="flex-1 pt-12 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">{game.name}</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
                {game.year} · ★ {game.rating.toFixed(1)} · {game.category}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">{game.description || 'No description available.'}</p>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="text-xs bg-stone-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-full px-3 py-1.5">👥 {playerLabel}</span>
            <span className="text-xs bg-stone-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-full px-3 py-1.5">⏱ {timeLabel}</span>
            <span className="text-xs bg-stone-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-full px-3 py-1.5">🎂 {game.age}+</span>
          </div>

          {/* Buy links */}
          <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 dark:text-gray-600 mb-2">Buy this game</p>
          <div className="flex gap-2 mb-5">
            {[
              { href: links.amazon,  label: 'Amazon',  bg: 'bg-[#FF9900]', text: 'text-gray-900' },
              { href: links.target,  label: 'Target',  bg: 'bg-[#CC0000]', text: 'text-white' },
              { href: links.walmart, label: 'Walmart', bg: 'bg-[#0071CE]', text: 'text-white' },
            ].map(({ href, label, bg, text }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-center ${bg} ${text} active:opacity-70`}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSomeday}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all active:opacity-70 ${inSomeday ? 'bg-teal-600 text-white' : 'bg-teal-400 text-gray-900'}`}
            >
              {inSomeday ? '✓ In someday list' : '+ Someday list'}
            </button>
            <button
              onClick={() => {
                setAddedToNight(true);
                onClose();
                onAddEvent?.({
                  title: `🎲 Game Night — ${game.name}`,
                  notes: `Playing ${game.name} (${playerLabel}, ${timeLabel}). Category: ${game.category}.`,
                  category: 'hangout',
                });
              }}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium active:opacity-70 ${addedToNight ? 'bg-stone-200 dark:bg-white/10 text-gray-500 dark:text-gray-400' : 'bg-stone-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'}`}
            >
              {addedToNight ? '✓ Added!' : 'Plan game night →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const BoardGamePage = ({ onAddEvent, onAddToSomeday, onBack }) => {
  const [games, setGames]           = useState(FALLBACK_GAMES);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState('all');
  const [players, setPlayers]       = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedGame, setSelectedGame] = useState(null);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [somedays, setSomedays]     = useState(new Set());
  const hasFetchedRef               = useRef(false);

  // ── fetch from BGG ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const ids = BGG_IDS.slice(0, 30).join(',');
    const bggUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(bggUrl)}`;
    const timeout = setTimeout(() => setLoading(false), 6000);

    fetch(proxyUrl)
      .then(r => r.json())
      .then(data => {
        clearTimeout(timeout);
        const parsed = parseBGGXML(data.contents);
        if (parsed.length > 0) {
          const merged = FALLBACK_GAMES.map(fb => {
            const live = parsed.find(p => p.id === fb.id);
            return live ? { ...fb, ...live, category: fb.category } : fb;
          });
          setGames(merged);
        }
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }, []);

  // ── filtering + sorting ─────────────────────────────────────────────────────
  const filtered = games.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab !== 'all' && g.category !== activeTab) return false;
    if (players !== 'all') {
      if (players === '1'   && g.minPlayers !== 1) return false;
      if (players === '2'   && !(g.minPlayers <= 2 && g.maxPlayers >= 2)) return false;
      if (players === '3-4' && !(g.minPlayers <= 3 && g.maxPlayers >= 3)) return false;
      if (players === '5+'  && g.maxPlayers < 5) return false;
    }
    if (timeFilter !== 'all') {
      if (timeFilter === 'quick'  && g.maxTime > 30) return false;
      if (timeFilter === 'medium' && (g.maxTime <= 30 || g.minTime > 90)) return false;
      if (timeFilter === 'long'   && g.minTime < 90) return false;
    }
    return true;
  }).sort((a, b) => b.rating - a.rating);

  // ── someday handler ─────────────────────────────────────────────────────────
  function handleAddToSomeday(game) {
    setSomedays(prev => {
      const next = new Set(prev);
      if (next.has(game.id)) next.delete(game.id);
      else next.add(game.id);
      return next;
    });
    if (!somedays.has(game.id)) {
      onAddToSomeday?.({ ...game, type: 'games', cardTitle: game.name, poster_path: '' });
    }
  }

  function handleTap(game) {
    setSelectedGame(game);
    setSheetOpen(true);
  }

  const activeTabLabel = GAME_TABS.find(t => t.key === activeTab)?.label || 'All';

  return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-[#0e1520] pb-28">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap'); .font-handwritten { font-family: 'Caveat', cursive; } @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>

      {/* Top bar */}
      <div className="bg-white dark:bg-[#131c2e] border-b border-stone-200 dark:border-white/[0.05] px-4 pt-5 pb-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 active:opacity-70 flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="font-handwritten text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Board Games</h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-600">
              {loading ? 'Loading from BoardGameGeek…' : `${filtered.length} game${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="ml-auto text-xs font-medium px-3.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 active:opacity-70">
            Joined ✓
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-white/5 rounded-xl px-3 py-2 mb-3">
          <span className="text-gray-400 dark:text-gray-600 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search games…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 text-xs">✕</button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {GAME_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === t.key ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300' : 'bg-stone-100 dark:bg-white/5 text-gray-500'}`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-filters */}
      <div className="flex gap-4 px-4 py-2.5 overflow-x-auto border-b border-stone-100 dark:border-white/[0.05]" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Players</span>
          {PLAYER_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setPlayers(f.id)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${players === f.id ? 'bg-stone-200 dark:bg-white/10 text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-600'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Time</span>
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${timeFilter === f.id ? 'bg-stone-200 dark:bg-white/10 text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-600'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section label */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 dark:text-gray-600 px-4 pt-5 pb-3">
        {activeTabLabel}
      </p>

      {/* Featured banner — top game */}
      <FeaturedBanner
        game={loading ? null : filtered[0]}
        onTap={handleTap}
        onAddToSomeday={handleAddToSomeday}
        somedays={somedays}
      />

      {/* Poster grid */}
      <PosterGrid
        games={filtered}
        loading={loading}
        somedays={somedays}
        onTap={handleTap}
      />

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 px-6">
          <div className="text-5xl mb-3">🎲</div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">No games match your filters</p>
          <button
            onClick={() => { setActiveTab('all'); setPlayers('all'); setTimeFilter('all'); setSearch(''); }}
            className="text-xs text-teal-500 dark:text-teal-400"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Detail sheet */}
      <GameDetailSheet
        game={selectedGame}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAddEvent={onAddEvent}
        onAddToSomeday={handleAddToSomeday}
        somedays={somedays}
      />
    </div>
  );
};

export default BoardGamePage;
