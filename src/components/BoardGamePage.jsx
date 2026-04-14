/**
 * BoardGamePage.jsx
 *
 * Drop into your components folder and wire up in App.js.
 *
 * Props:
 *   onAddEvent   – (eventData) => void   called when user taps "Plan game night"
 *                  receives { title, notes, category: 'hangout' }
 *   darkMode     – boolean
 *
 * Data:
 *   Pulls from BoardGameGeek XML API (proxied through allorigins.win to avoid CORS).
 *   Falls back to FALLBACK_GAMES if the API is slow/unavailable.
 *
 * Retail links:
 *   Dynamically constructs Amazon / Target / Walmart search URLs — no API key needed.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

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

// ─── fallback data (shown while API loads or on error) ────────────────────────
const FALLBACK_GAMES = [
  { id: '174430', name: 'Gloomhaven',         year: 2017, rating: 8.6, minPlayers: 1, maxPlayers: 4, minTime: 60,  maxTime: 120, age: 14, category: 'strategy',     description: 'A game of tactical combat in an ever-changing dungeon. Players control mercenaries with unique abilities.',                          thumbnail: '' },
  { id: '161936', name: 'Pandemic Legacy S1',  year: 2015, rating: 8.6, minPlayers: 2, maxPlayers: 4, minTime: 60,  maxTime: 75,  age: 13, category: 'cooperative',  description: 'A fully cooperative, legacy-style game where your decisions carry over from session to session.',                                    thumbnail: '' },
  { id: '167791', name: 'Terraforming Mars',   year: 2016, rating: 8.4, minPlayers: 1, maxPlayers: 5, minTime: 90,  maxTime: 120, age: 12, category: 'strategy',     description: 'Compete to transform Mars into a habitable planet by raising temperature, oxygen, and ocean coverage.',                           thumbnail: '' },
  { id: '224517', name: 'Brass: Birmingham',   year: 2018, rating: 8.7, minPlayers: 2, maxPlayers: 4, minTime: 60,  maxTime: 120, age: 14, category: 'strategy',     description: 'An economic strategy game about building networks in the industrial revolution.',                                                    thumbnail: '' },
  { id: '233078', name: 'Twilight Imperium 4', year: 2017, rating: 8.7, minPlayers: 3, maxPlayers: 6, minTime: 240, maxTime: 480, age: 14, category: 'strategy',     description: 'Epic space opera of galactic conquest, politics, and trade spanning an entire day of play.',                                         thumbnail: '' },
  { id: '342942', name: 'Ark Nova',            year: 2021, rating: 8.6, minPlayers: 1, maxPlayers: 4, minTime: 90,  maxTime: 150, age: 14, category: 'strategy',     description: 'Build a modern zoo and support conservation projects in this card-driven tableau builder.',                                          thumbnail: '' },
  { id: '316554', name: 'Dune: Imperium',      year: 2020, rating: 8.4, minPlayers: 1, maxPlayers: 4, minTime: 60,  maxTime: 120, age: 14, category: 'strategy',     description: 'A deck-building worker placement game set in the world of Frank Herbert\'s Dune.',                                                  thumbnail: '' },
  { id: '187645', name: 'Star Wars: Rebellion', year: 2016, rating: 8.4, minPlayers: 2, maxPlayers: 4, minTime: 180, maxTime: 240, age: 14, category: 'strategy',    description: 'Wage galactic war as the Empire or Rebel Alliance in this asymmetric game of epic scope.',                                          thumbnail: '' },
  { id: '12333',  name: 'Twilight Struggle',   year: 2005, rating: 8.3, minPlayers: 2, maxPlayers: 2, minTime: 120, maxTime: 180, age: 13, category: 'strategy',     description: 'A tense two-player game simulating the Cold War from 1945 to 1989.',                                                                 thumbnail: '' },
  { id: '9209',   name: 'Ticket to Ride',      year: 2004, rating: 7.4, minPlayers: 2, maxPlayers: 5, minTime: 45,  maxTime: 90,  age: 8,  category: 'family',       description: 'Collect cards to claim railway routes across the country and connect cities.',                                                           thumbnail: '' },
  { id: '13',     name: 'Catan',               year: 1995, rating: 7.1, minPlayers: 3, maxPlayers: 4, minTime: 60,  maxTime: 120, age: 10, category: 'family',       description: 'Trade, build, and settle the island of Catan in this classic resource management game.',                                               thumbnail: '' },
  { id: '822',    name: 'Carcassonne',         year: 2000, rating: 7.4, minPlayers: 2, maxPlayers: 5, minTime: 30,  maxTime: 45,  age: 7,  category: 'family',       description: 'Place tiles to build the medieval landscape of Carcassonne and score points with your followers.',                                      thumbnail: '' },
  { id: '30549',  name: 'Pandemic',            year: 2008, rating: 7.6, minPlayers: 2, maxPlayers: 4, minTime: 45,  maxTime: 75,  age: 8,  category: 'cooperative',  description: 'Work together to contain deadly diseases spreading across the globe before it\'s too late.',                                           thumbnail: '' },
  { id: '68448',  name: '7 Wonders',           year: 2010, rating: 7.7, minPlayers: 2, maxPlayers: 7, minTime: 30,  maxTime: 45,  age: 10, category: 'family',       description: 'Draft cards to build one of the seven wonders of the ancient world.',                                                                    thumbnail: '' },
  { id: '178900', name: 'Codenames',           year: 2015, rating: 7.7, minPlayers: 2, maxPlayers: 8, minTime: 15,  maxTime: 30,  age: 14, category: 'party',        description: 'Two rival spymasters give one-word clues to help their teams identify secret agents.',                                                  thumbnail: '' },
  { id: '266192', name: 'Wingspan',            year: 2019, rating: 8.1, minPlayers: 1, maxPlayers: 5, minTime: 40,  maxTime: 70,  age: 10, category: 'family',       description: 'Attract birds to your wildlife preserve with eggs, food, and nest types in this engine-builder.',                                       thumbnail: '' },
  { id: '198928', name: 'Azul',                year: 2017, rating: 7.9, minPlayers: 2, maxPlayers: 4, minTime: 30,  maxTime: 45,  age: 8,  category: 'family',       description: 'Draft colorful tiles to decorate the walls of the Royal Palace of Evora.',                                                             thumbnail: '' },
  { id: '220308', name: 'Gaia Project',        year: 2017, rating: 8.5, minPlayers: 1, maxPlayers: 4, minTime: 60,  maxTime: 150, age: 12, category: 'strategy',     description: 'Expand across the galaxy as one of 14 unique factions in this deep civilization game.',                                               thumbnail: '' },
  { id: '251247', name: 'Vindication',         year: 2018, rating: 7.9, minPlayers: 1, maxPlayers: 5, minTime: 60,  maxTime: 100, age: 14, category: 'strategy',     description: 'Redeem a wretched soul through acts of honor, courage, and compassion on an unforgiving island.',                                    thumbnail: '' },
  { id: '36218',  name: 'Dominion',            year: 2008, rating: 7.6, minPlayers: 2, maxPlayers: 4, minTime: 30,  maxTime: 60,  age: 13, category: 'strategy',     description: 'The original deck-building game — build a deck to acquire the most victory points.',                                                  thumbnail: '' },
  { id: '173346', name: 'Viticulture EE',      year: 2015, rating: 8.1, minPlayers: 1, maxPlayers: 6, minTime: 45,  maxTime: 90,  age: 13, category: 'strategy',     description: 'Build a wine empire in Tuscany by growing grapes, making wine, and fulfilling orders.',                                              thumbnail: '' },
  { id: '291457', name: 'Gloomhaven: Jaws',    year: 2020, rating: 8.3, minPlayers: 1, maxPlayers: 4, minTime: 30,  maxTime: 60,  age: 14, category: 'cooperative',  description: 'A standalone and expansion to Gloomhaven — shorter dungeon crawls in a box you can actually carry.',                                  thumbnail: '' },
  { id: '115746', name: 'War of the Ring 2e',  year: 2011, rating: 8.6, minPlayers: 2, maxPlayers: 4, minTime: 120, maxTime: 180, age: 13, category: 'strategy',     description: 'The Free Peoples and Shadow Armies clash in an epic recreation of Tolkien\'s Middle-earth.',                                         thumbnail: '' },
  { id: '126163', name: 'Tzolk\'in',           year: 2012, rating: 8.0, minPlayers: 2, maxPlayers: 4, minTime: 60,  maxTime: 90,  age: 13, category: 'strategy',     description: 'A worker placement game with interlocking gears representing the Mayan calendar.',                                                    thumbnail: '' },
  { id: '285967', name: 'The Crew',            year: 2019, rating: 7.8, minPlayers: 2, maxPlayers: 5, minTime: 20,  maxTime: 30,  age: 10, category: 'cooperative',  description: 'A cooperative trick-taking card game — complete missions by silently coordinating your plays.',                                        thumbnail: '' },
  { id: '271320', name: 'Lost Ruins of Arnak', year: 2020, rating: 8.1, minPlayers: 1, maxPlayers: 4, minTime: 30,  maxTime: 120, age: 12, category: 'strategy',     description: 'Explore an uncharted island, fight guardians, and research ancient secrets in this deck-building adventure.',                         thumbnail: '' },
  { id: '39856',  name: 'Dixit',               year: 2008, rating: 7.3, minPlayers: 3, maxPlayers: 8, minTime: 30,  maxTime: 45,  age: 8,  category: 'party',        description: 'Describe dreamy illustrated cards with a word or phrase — score points when some (not all) guess correctly.',                         thumbnail: '' },
  { id: '163412', name: 'Pandemic: Iberia',    year: 2016, rating: 7.5, minPlayers: 2, maxPlayers: 5, minTime: 45,  maxTime: 75,  age: 8,  category: 'cooperative',  description: 'A historical reimagining of Pandemic set in the Iberian Peninsula of the 1840s.',                                                      thumbnail: '' },
  { id: '396790', name: 'Heat: Pedal to Metal',year: 2022, rating: 8.1, minPlayers: 1, maxPlayers: 6, minTime: 30,  maxTime: 60,  age: 10, category: 'family',       description: 'A blazing fast race game where managing your engine is as important as your driving line.',                                          thumbnail: '' },
  { id: '356123', name: 'Cascadia',            year: 2021, rating: 7.9, minPlayers: 1, maxPlayers: 4, minTime: 30,  maxTime: 45,  age: 10, category: 'family',       description: 'Build a Pacific Northwest ecosystem by placing terrain tiles and wildlife tokens.',                                                    thumbnail: '' },
];

// ─── category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',         label: 'All',         emoji: '🎲' },
  { id: 'strategy',    label: 'Strategy',    emoji: '♟️' },
  { id: 'family',      label: 'Family',      emoji: '👨‍👩‍👧' },
  { id: 'party',       label: 'Party',       emoji: '🎉' },
  { id: 'cooperative', label: 'Coop',        emoji: '🤝' },
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

// ─── retail link builders ─────────────────────────────────────────────────────
const retailLinks = (name) => ({
  amazon:  `https://www.amazon.com/s?k=${encodeURIComponent(name + ' board game')}`,
  target:  `https://www.target.com/s?searchTerm=${encodeURIComponent(name + ' board game')}`,
  walmart: `https://www.walmart.com/search?q=${encodeURIComponent(name + ' board game')}`,
});

// ─── BGG API helpers ──────────────────────────────────────────────────────────
const BGG_IDS = FALLBACK_GAMES.map(g => g.id);

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
      // infer category from BGG link tags
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

// ─── colour palette for category badges ──────────────────────────────────────
const CAT_STYLES = {
  strategy:    { bg: '#EEEDFE', color: '#3C3489', border: '#AFA9EC' },
  family:      { bg: '#EAF3DE', color: '#27500A', border: '#97C459' },
  party:       { bg: '#FAEEDA', color: '#633806', border: '#EF9F27' },
  cooperative: { bg: '#E1F5EE', color: '#085041', border: '#5DCAA5' },
};

// ─── star rating display ──────────────────────────────────────────────────────
const StarRating = ({ rating }) => {
  const pct = Math.round((rating / 10) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ position: 'relative', fontSize: 13, lineHeight: 1, letterSpacing: 1 }}>
        <span style={{ color: '#e2e8f0' }}>★★★★★</span>
        <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: `${pct}%`, color: '#f59e0b' }}>★★★★★</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>{rating.toFixed(1)}</span>
    </div>
  );
};

// ─── retail button ────────────────────────────────────────────────────────────
const RetailBtn = ({ href, label, color, textColor }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '8px 6px', borderRadius: 10,
      background: color, color: textColor,
      fontSize: 12, fontWeight: 600, textDecoration: 'none',
      border: 'none', cursor: 'pointer', transition: 'opacity .15s',
      minWidth: 0,
    }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
  >
    {label}
  </a>
);

// ─── game card ────────────────────────────────────────────────────────────────
const GameCard = ({ game, onAddEvent, darkMode, stagger }) => {
  const [expanded, setExpanded] = useState(false);
  const [addedToNight, setAddedToNight] = useState(false);
  const [imgError, setImgError] = useState(false);
  const catStyle = CAT_STYLES[game.category] || CAT_STYLES.strategy;
  const links = retailLinks(game.name);

  const cardBg = darkMode
    ? 'rgba(30,27,20,0.95)'
    : 'rgba(255,252,242,0.97)';
  const borderCol = darkMode
    ? 'rgba(255,220,150,0.12)'
    : 'rgba(180,150,100,0.22)';

  const timeLabel = game.maxTime >= 90 ? `${game.minTime}–${game.maxTime} min` : `${game.maxTime} min`;
  const playerLabel = game.minPlayers === game.maxPlayers
    ? `${game.minPlayers} players`
    : `${game.minPlayers}–${game.maxPlayers} players`;

  return (
    <div
      style={{
        background: cardBg,
        borderRadius: 20,
        border: `0.5px solid ${expanded ? (darkMode ? 'rgba(255,220,150,0.25)' : 'rgba(180,150,100,0.4)') : borderCol}`,
        overflow: 'hidden',
        transition: 'transform .2s, box-shadow .2s',
        animation: `fadeUp .4s ease both`,
        animationDelay: `${stagger * 0.06}s`,
        boxShadow: expanded
          ? (darkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 8px 28px rgba(120,90,50,0.18)')
          : 'none',
        backgroundImage: darkMode
          ? 'none'
          : 'repeating-linear-gradient(0deg,rgba(0,0,0,0.012) 0px,transparent 1px,transparent 2px,rgba(0,0,0,0.012) 3px)',
      }}
      onMouseEnter={e => { if (!expanded) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { if (!expanded) e.currentTarget.style.transform = 'none'; }}
    >
      {/* Cover image / colour swatch */}
      <div
        style={{
          width: '100%', height: 130,
          background: `linear-gradient(135deg, ${catStyle.bg}, ${catStyle.border}30)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, cursor: 'pointer', position: 'relative',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {GAME_COVERS[game.name] && !imgError ? (
          <img
            src={`https://images.weserv.nl/?url=${encodeURIComponent(GAME_COVERS[game.name])}&w=300`}
            alt={game.name}
            onError={() => setImgError(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ opacity: .7 }}>
            {game.category === 'strategy' ? '♟️' : game.category === 'party' ? '🎉' : game.category === 'cooperative' ? '🤝' : '👨‍👩‍👧'}
          </span>
        )}
        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '3px 9px', borderRadius: 8,
          background: catStyle.bg, color: catStyle.color,
          fontSize: 10, fontWeight: 700, letterSpacing: '.03em',
          border: `1px solid ${catStyle.border}`,
        }}>
          {game.category}
        </div>
        {/* Expand chevron */}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 24, height: 24, borderRadius: 8,
          background: 'rgba(0,0,0,0.35)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, transition: 'transform .2s',
          transform: expanded ? 'rotate(180deg)' : 'none',
        }}>
          ▾
        </div>
      </div>

      {/* Core info */}
      <div style={{ padding: '12px 14px 0' }} onClick={() => setExpanded(e => !e)}>
        <div style={{
          fontFamily: '"Caveat", "Comic Sans MS", cursive',
          fontSize: 19, fontWeight: 700, lineHeight: 1.2,
          color: darkMode ? '#e8dcc8' : '#3a2e1e', marginBottom: 4,
          cursor: 'pointer',
        }}>
          {game.name}
          {game.year > 0 && (
            <span style={{ fontSize: 12, fontWeight: 400, color: darkMode ? '#a89070' : '#a08060', marginLeft: 6 }}>
              {game.year}
            </span>
          )}
        </div>

        <StarRating rating={game.rating} />

        <div style={{
          display: 'flex', gap: 10, marginTop: 7, flexWrap: 'wrap',
          fontSize: 11, color: darkMode ? '#a89070' : '#8a7a60',
        }}>
          <span>👥 {playerLabel}</span>
          <span>⏱ {timeLabel}</span>
          <span>🎂 {game.age}+</span>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: '12px 14px 14px' }}>
          <p style={{
            fontSize: 13, lineHeight: 1.55,
            color: darkMode ? '#c4a882' : '#6b5a45',
            margin: '0 0 14px',
          }}>
            {game.description}
          </p>

          {/* Buy links */}
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              color: darkMode ? '#a89070' : '#a08060', marginBottom: 7,
            }}>
              Buy this game
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <RetailBtn href={links.amazon}  label="Amazon"  color="#FF9900" textColor="#111" />
              <RetailBtn href={links.target}  label="Target"  color="#CC0000" textColor="#fff" />
              <RetailBtn href={links.walmart} label="Walmart" color="#0071CE" textColor="#fff" />
            </div>
          </div>

          {/* Plan game night */}
          <button
            onClick={() => {
              setAddedToNight(true);
              onAddEvent?.({
                title: `🎲 Game Night — ${game.name}`,
                notes: `Playing ${game.name} (${playerLabel}, ${timeLabel}). Category: ${game.category}.`,
                category: 'hangout',
              });
            }}
            style={{
              width: '100%', padding: '10px 0',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              fontFamily: '"Caveat", "Comic Sans MS", cursive',
              fontSize: 16, fontWeight: 700, letterSpacing: '.01em',
              background: addedToNight
                ? (darkMode ? 'rgba(99,153,34,0.25)' : '#EAF3DE')
                : 'linear-gradient(90deg, #c4a882 0%, #a08060 100%)',
              color: addedToNight
                ? (darkMode ? '#a3d96a' : '#27500A')
                : '#fff',
              transition: 'all .2s',
            }}
          >
            {addedToNight ? '✓ Added to calendar!' : '📅 Plan a game night'}
          </button>
        </div>
      )}

      {/* Bottom padding when collapsed */}
      {!expanded && <div style={{ height: 12 }} />}
    </div>
  );
};

// ─── filter pill ──────────────────────────────────────────────────────────────
const FilterPill = ({ label, active, onClick, darkMode }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 14px', borderRadius: 20, border: 'none',
      fontFamily: '"Caveat", "Comic Sans MS", cursive',
      fontSize: 15, fontWeight: active ? 700 : 400,
      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
      background: active
        ? (darkMode ? 'rgba(196,168,130,0.3)' : '#c4a882')
        : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(245,235,215,0.7)'),
      color: active
        ? (darkMode ? '#e8dcc8' : '#fff')
        : (darkMode ? '#a89070' : '#8a7a60'),
      border: active
        ? `1.5px solid ${darkMode ? 'rgba(196,168,130,0.5)' : '#a08060'}`
        : `0.5px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(180,150,100,0.25)'}`,
    }}
  >
    {label}
  </button>
);

// ─── skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ darkMode }) => (
  <div style={{
    background: darkMode ? 'rgba(30,27,20,0.95)' : 'rgba(255,252,242,0.97)',
    borderRadius: 20,
    border: `0.5px solid ${darkMode ? 'rgba(255,220,150,0.1)' : 'rgba(180,150,100,0.2)'}`,
    overflow: 'hidden',
  }}>
    <div style={{ height: 130, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(180,150,100,0.1)', animation: 'pulse 1.5s ease infinite' }} />
    <div style={{ padding: 14 }}>
      {[80, 60, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 18 : 11, width: `${w}%`,
          borderRadius: 6, marginBottom: 8,
          background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(180,150,100,0.12)',
          animation: 'pulse 1.5s ease infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const BoardGamePage = ({ onAddEvent, onBack, darkMode = false }) => {
  const [games, setGames]           = useState(FALLBACK_GAMES);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('all');
  const [players, setPlayers]       = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy]         = useState('rating');
  const hasFetchedRef               = useRef(false);

  // ── fetch from BGG ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const ids = BGG_IDS.slice(0, 30).join(',');
    const bggUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(bggUrl)}`;

    const timeout = setTimeout(() => setLoading(false), 6000); // give up after 6s

    fetch(proxyUrl)
      .then(r => r.json())
      .then(data => {
        clearTimeout(timeout);
        const parsed = parseBGGXML(data.contents);
        if (parsed.length > 0) {
          // merge parsed data (with thumbnails) into fallback (preserving category)
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
    if (category !== 'all' && g.category !== category) return false;
    if (players !== 'all') {
      if (players === '1'   && !(g.minPlayers === 1)) return false;
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
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'name')   return a.name.localeCompare(b.name);
    if (sortBy === 'time')   return a.maxTime - b.maxTime;
    return 0;
  });

  // ── style tokens ────────────────────────────────────────────────────────────
  const pageBg    = darkMode ? '#1a1712' : '#faf8f3';
  const headerBg  = darkMode ? 'rgba(30,27,20,0.95)' : 'rgba(255,252,242,0.97)';
  const borderWarm = darkMode ? 'rgba(255,220,150,0.12)' : 'rgba(180,150,100,0.22)';
  const textPrimary   = darkMode ? '#e8dcc8' : '#3a2e1e';
  const textSecondary = darkMode ? '#a89070' : '#8a7a60';
  const handwritten   = '"Caveat", "Comic Sans MS", "Bradley Hand", cursive';

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBg,
      backgroundImage: darkMode
        ? 'repeating-linear-gradient(0deg,rgba(255,255,255,0.015) 0px,transparent 1px,transparent 2px,rgba(255,255,255,0.015) 3px)'
        : 'repeating-linear-gradient(0deg,rgba(0,0,0,0.018) 0px,transparent 1px,transparent 2px,rgba(0,0,0,0.018) 3px)',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100% { opacity:1 } 50% { opacity:.5 } }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: '18px 18px 0',
        background: headerBg,
        borderBottom: `0.5px solid ${borderWarm}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: `0.5px solid ${borderWarm}`,
                  background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(245,235,215,0.7)',
                  color: textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <div>
              <h1 style={{
                fontFamily: handwritten, fontSize: 30, fontWeight: 700,
                color: textPrimary, margin: 0, lineHeight: 1,
              }}>
                🎲 Board Games
              </h1>
              <p style={{ fontSize: 12, color: textSecondary, marginTop: 3 }}>
                Discover, plan, and buy — all in one place
              </p>
            </div>
          </div>
          {/* Sort control */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              fontFamily: handwritten, fontSize: 14,
              padding: '5px 10px', borderRadius: 10,
              border: `0.5px solid ${borderWarm}`,
              background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(245,235,215,0.7)',
              color: textPrimary, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="rating">Top rated</option>
            <option value="name">A–Z</option>
            <option value="time">Quickest</option>
          </select>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(245,235,215,0.5)',
          border: `0.5px solid ${borderWarm}`,
          borderRadius: 14, padding: '8px 14px', marginBottom: 12,
        }}>
          <span style={{ fontSize: 16, opacity: .6 }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search games…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: handwritten, fontSize: 16,
              color: textPrimary,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: textSecondary }}>✕</button>
          )}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <FilterPill
              key={cat.id}
              label={`${cat.emoji} ${cat.label}`}
              active={category === cat.id}
              onClick={() => setCategory(cat.id)}
              darkMode={darkMode}
            />
          ))}
        </div>
      </div>

      {/* ── Sub-filters ── */}
      <div style={{
        padding: '10px 16px',
        borderBottom: `0.5px solid ${borderWarm}`,
        background: headerBg,
        display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {/* Players */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: textSecondary, letterSpacing: '.04em', textTransform: 'uppercase' }}>Players</span>
          {PLAYER_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setPlayers(f.id)}
              style={{
                padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: handwritten, fontSize: 14,
                background: players === f.id
                  ? (darkMode ? 'rgba(196,168,130,0.3)' : '#c4a882')
                  : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(245,235,215,0.6)'),
                color: players === f.id ? (darkMode ? '#e8dcc8' : '#fff') : textSecondary,
                border: players === f.id ? `1px solid ${darkMode ? 'rgba(196,168,130,0.4)' : '#a08060'}` : `0.5px solid ${borderWarm}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: textSecondary, letterSpacing: '.04em', textTransform: 'uppercase' }}>Time</span>
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              style={{
                padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: handwritten, fontSize: 14,
                background: timeFilter === f.id
                  ? (darkMode ? 'rgba(196,168,130,0.3)' : '#c4a882')
                  : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(245,235,215,0.6)'),
                color: timeFilter === f.id ? (darkMode ? '#e8dcc8' : '#fff') : textSecondary,
                border: timeFilter === f.id ? `1px solid ${darkMode ? 'rgba(196,168,130,0.4)' : '#a08060'}` : `0.5px solid ${borderWarm}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ── */}
      <div style={{ padding: '10px 18px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: handwritten, fontSize: 15, color: textSecondary }}>
          {loading ? 'Loading from BoardGameGeek…' : `${filtered.length} game${filtered.length !== 1 ? 's' : ''}`}
        </span>
        {(category !== 'all' || players !== 'all' || timeFilter !== 'all' || search) && (
          <button
            onClick={() => { setCategory('all'); setPlayers('all'); setTimeFilter('all'); setSearch(''); }}
            style={{ fontSize: 12, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Game grid ── */}
      <div style={{
        padding: '8px 14px 100px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} darkMode={darkMode} />)
          : filtered.length === 0
            ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontFamily: handwritten, fontSize: 22, color: textSecondary, fontStyle: 'italic' }}>
                  No games match your filters
                </div>
                <button
                  onClick={() => { setCategory('all'); setPlayers('all'); setTimeFilter('all'); setSearch(''); }}
                  style={{ marginTop: 12, fontFamily: handwritten, fontSize: 16, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear all filters
                </button>
              </div>
            )
            : filtered.map((game, i) => (
              <GameCard
                key={game.id}
                game={game}
                onAddEvent={onAddEvent}
                darkMode={darkMode}
                stagger={i}
              />
            ))
        }
      </div>
    </div>
  );
};

export default BoardGamePage;
