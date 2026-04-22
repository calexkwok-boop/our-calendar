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
import useGoogleImage from '../hooks/useGoogleImage';

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
  strategy:    { bg: 'rgba(168,85,247,0.1)',  color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
  family:      { bg: 'rgba(20,184,166,0.1)',  color: '#0d9488', border: 'rgba(20,184,166,0.3)' },
  party:       { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', border: 'rgba(245,158,11,0.3)' },
  cooperative: { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1', border: 'rgba(99,102,241,0.3)' },
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
const GameCard = ({ game, onAddEvent, onAddToSomeday, darkMode, stagger, initInSomeday }) => {
  const [expanded, setExpanded] = useState(false);
  const [addedToNight, setAddedToNight] = useState(false);
  const [inSomeday, setInSomeday] = useState(initInSomeday || false);
  const [imageFailed, setImageFailed] = useState(false);
  const imgUrl = useGoogleImage(`${game.name} board game box`, { preferProductSearch: true });
  const catStyle = CAT_STYLES[game.category] || CAT_STYLES.strategy;
  const links = retailLinks(game.name);

  useEffect(() => { setInSomeday(initInSomeday || false); }, [initInSomeday]);
  useEffect(() => { setImageFailed(false); }, [imgUrl]);

  const cardBg = darkMode ? '#131c2e' : '#ffffff';
  const borderCol = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';

  const timeLabel = game.maxTime >= 90 ? `${game.minTime}–${game.maxTime} min` : `${game.maxTime} min`;
  const playerLabel = game.minPlayers === game.maxPlayers
    ? `${game.minPlayers} players`
    : `${game.minPlayers}–${game.maxPlayers} players`;

  return (
    <div
      style={{
        background: cardBg,
        borderRadius: 20,
        border: `0.5px solid ${expanded ? (darkMode ? 'rgba(168,85,247,0.3)' : 'rgba(168,85,247,0.2)') : borderCol}`,
        overflow: 'hidden',
        transition: 'transform .2s, box-shadow .2s',
        animation: `fadeUp .4s ease both`,
        animationDelay: `${stagger * 0.06}s`,
        boxShadow: expanded
          ? (darkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 8px 28px rgba(0,0,0,0.1)')
          : 'none',
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
        {imgUrl && !imageFailed ? (
          <img
            src={imgUrl}
            alt={game.name}
            onError={() => setImageFailed(true)}
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
          color: darkMode ? '#f1f5f9' : '#111827', marginBottom: 4,
          cursor: 'pointer',
        }}>
          {game.name}
          {game.year > 0 && (
            <span style={{ fontSize: 12, fontWeight: 400, color: darkMode ? '#6b7280' : '#9ca3af', marginLeft: 6 }}>
              {game.year}
            </span>
          )}
        </div>

        <StarRating rating={game.rating} />

        <div style={{
          display: 'flex', gap: 10, marginTop: 7, flexWrap: 'wrap',
          fontSize: 11, color: darkMode ? '#6b7280' : '#9ca3af',
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
            color: darkMode ? '#94a3b8' : '#4b5563',
            margin: '0 0 14px',
          }}>
            {game.description}
          </p>

          {/* Buy links */}
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              color: darkMode ? '#6b7280' : '#9ca3af', marginBottom: 7,
            }}>
              Buy this game
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <RetailBtn href={links.amazon}  label="Amazon"  color="#FF9900" textColor="#111" />
              <RetailBtn href={links.target}  label="Target"  color="#CC0000" textColor="#fff" />
              <RetailBtn href={links.walmart} label="Walmart" color="#0071CE" textColor="#fff" />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setInSomeday(v => !v);
                onAddToSomeday?.({ ...game, type: 'games', cardTitle: game.name, poster_path: imgUrl || '', imageUrl: imgUrl || '' });
              }}
              className="font-handwritten"
              style={{
                flex: 1, padding: '10px 0',
                borderRadius: 12, cursor: 'pointer',
                fontSize: 18, fontWeight: 700,
                background: inSomeday
                  ? (darkMode ? 'rgba(13,148,136,0.15)' : 'rgba(13,148,136,0.08)')
                  : (darkMode ? '#0d9488' : '#14b8a6'),
                color: inSomeday
                  ? (darkMode ? '#2dd4bf' : '#0d9488')
                  : '#fff',
                border: inSomeday
                  ? `1px solid ${darkMode ? 'rgba(45,212,191,0.3)' : 'rgba(13,148,136,0.25)'}`
                  : 'none',
                transition: 'all .2s',
              }}
            >
              {inSomeday ? '✓ Someday' : '+ Someday'}
            </button>
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
                flex: 1, padding: '10px 0',
                borderRadius: 12, border: 'none', cursor: 'pointer',
                fontFamily: "'Caveat', cursive",
                fontSize: 16, fontWeight: 700, letterSpacing: '.01em',
                background: darkMode ? 'rgba(168,85,247,0.12)' : '#f5f3ff',
                color: addedToNight
                  ? (darkMode ? '#6b7280' : '#9ca3af')
                  : (darkMode ? '#c4b5fd' : '#6d28d9'),
                border: '1px solid ' + (darkMode ? 'rgba(168,85,247,0.25)' : '#d8b4fe'),
                transition: 'all .2s',
              }}
            >
              {addedToNight ? '✓ Added!' : '+ Plan'}
            </button>
          </div>
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
        ? (darkMode ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.1)')
        : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
      color: active
        ? (darkMode ? '#c084fc' : '#7c3aed')
        : (darkMode ? '#6b7280' : '#9ca3af'),
      border: active
        ? `1.5px solid ${darkMode ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.3)'}`
        : `0.5px solid ${darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb'}`,
    }}
  >
    {label}
  </button>
);

// ─── skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ darkMode }) => (
  <div style={{
    background: darkMode ? '#131c2e' : '#ffffff',
    borderRadius: 20,
    border: `0.5px solid ${darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb'}`,
    overflow: 'hidden',
  }}>
    <div style={{ height: 130, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', animation: 'pulse 1.5s ease infinite' }} />
    <div style={{ padding: 14 }}>
      {[80, 60, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 18 : 11, width: `${w}%`,
          borderRadius: 6, marginBottom: 8,
          background: darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
          animation: 'pulse 1.5s ease infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const BoardGameHero = ({ darkMode, onBack }) => (
  <div style={{
    position: 'relative',
    margin: '16px 16px 0',
    borderRadius: 24,
    padding: '54px 24px 36px',
    minHeight: 236,
    overflow: 'hidden',
    background: darkMode
      ? 'linear-gradient(135deg, #1a1035 0%, #2d1b69 50%, #0e1520 100%)'
      : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #faf8f3 100%)',
    border: darkMode ? '1px solid rgba(168,85,247,0.12)' : '1px solid rgba(168,85,247,0.15)',
    boxShadow: darkMode ? 'none' : '0 18px 40px rgba(109,40,217,0.08)',
  }}>
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(168,85,247,0.10), transparent)',
    }} />

    <div style={{
      position: 'absolute', right: 24, top: 16,
      fontSize: 96, opacity: 0.08, transform: 'rotate(12deg)', userSelect: 'none', pointerEvents: 'none',
    }}>
      🎲
    </div>

    {onBack && (
      <button
        onClick={onBack}
        aria-label="Go back"
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          width: 38,
          height: 38,
          borderRadius: 12,
          border: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(168,85,247,0.18)',
          background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
          color: darkMode ? '#f8fafc' : '#1e1b4b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          boxShadow: darkMode ? 'none' : '0 8px 18px rgba(109,40,217,0.08)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    )}


    <h1 style={{
      fontFamily: "'Caveat', cursive",
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 1.05,
      margin: '42px 0 6px',
      background: darkMode
        ? 'linear-gradient(to right, #f1f5f9, #c084fc)'
        : 'linear-gradient(to right, #1e1b4b, #7c3aed)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      position: 'relative',
      zIndex: 1,
    }}>
      Roll the dice
    </h1>

    <p style={{
      fontSize: 14,
      lineHeight: 1.6,
      margin: 0,
      color: darkMode ? 'rgba(203,213,225,0.7)' : 'rgba(107,114,128,0.9)',
      maxWidth: 280,
    }}>
      Discover top-rated games, save ones you want to try, and plan your next game night.
    </p>

  </div>
);

const BoardGamePage = ({ onAddEvent, onAddToSomeday, onBack, darkMode = false }) => {
  const [games, setGames]           = useState(FALLBACK_GAMES);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('all');
  const [players, setPlayers]       = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy]         = useState('rating');
  const [somedays, setSomedays]     = useState(new Set());
  const hasFetchedRef               = useRef(false);

  function handleAddToSomeday(game) {
    setSomedays(prev => {
      const next = new Set(prev);
      if (next.has(game.id)) next.delete(game.id);
      else next.add(game.id);
      return next;
    });
    if (!somedays.has(game.id)) {
      onAddToSomeday?.({ ...game, type: 'games', cardTitle: game.name, poster_path: game.poster_path || game.imageUrl || '', imageUrl: game.imageUrl || game.poster_path || '' });
    }
  }

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
  const pageBg    = darkMode ? '#0e1520' : '#faf8f3';
  const headerBg  = darkMode ? 'rgba(19,28,46,0.98)' : 'rgba(255,255,255,0.98)';
  const borderWarm = darkMode ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const textPrimary   = darkMode ? '#f1f5f9' : '#111827';
  const textSecondary = darkMode ? '#6b7280' : '#9ca3af';
  const handwritten   = '"Caveat", "Comic Sans MS", "Bradley Hand", cursive';

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBg,
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');
        .font-handwritten { font-family: 'Caveat', cursive; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100% { opacity:1 } 50% { opacity:.5 } }
      `}</style>

      <BoardGameHero darkMode={darkMode} onBack={onBack} />

      <div style={{
        padding: '18px 18px 0',
        background: headerBg,
        borderBottom: `0.5px solid ${borderWarm}`,
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
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
                  ? (darkMode ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.1)')
                  : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                color: players === f.id ? (darkMode ? '#c084fc' : '#7c3aed') : textSecondary,
                border: players === f.id ? `1px solid ${darkMode ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.3)'}` : `0.5px solid ${borderWarm}`,
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
                  ? (darkMode ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.1)')
                  : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                color: timeFilter === f.id ? (darkMode ? '#c084fc' : '#7c3aed') : textSecondary,
                border: timeFilter === f.id ? `1px solid ${darkMode ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.3)'}` : `0.5px solid ${borderWarm}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ── */}
      <div style={{ padding: '10px 18px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: handwritten, fontSize: 15, color: textSecondary }}>
          {loading ? 'Loading from BoardGameGeek…' : `${filtered.length} game${filtered.length !== 1 ? 's' : ''}`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              fontFamily: handwritten, fontSize: 14,
              padding: '5px 10px', borderRadius: 10,
              border: `0.5px solid ${borderWarm}` ,
              background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
              color: textPrimary, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="rating">Top rated</option>
            <option value="name">A–Z</option>
            <option value="time">Quickest</option>
          </select>
          {(category !== 'all' || players !== 'all' || timeFilter !== 'all' || search) && (
            <button
              onClick={() => { setCategory('all'); setPlayers('all'); setTimeFilter('all'); setSearch(''); }}
              style={{ fontSize: 12, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Clear filters
            </button>
          )}
        </div>
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
                onAddToSomeday={handleAddToSomeday}
                darkMode={darkMode}
                stagger={i}
                initInSomeday={somedays.has(game.id)}
              />
            ))
        }
      </div>
    </div>
  );
};

export default BoardGamePage;
