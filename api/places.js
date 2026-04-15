/**
 * /api/places.js  — Vercel serverless function
 *
 * Proxies Google Places API requests so your key never
 * appears in browser network requests.
 *
 * Setup:
 *   1. Create this file at the root of your repo: api/places.js
 *   2. In Vercel dashboard → Settings → Environment Variables, add:
 *        GOOGLE_PLACES_KEY = your-key-here
 *      (do NOT prefix with REACT_APP_ — this stays server-side only)
 *   3. Deploy. The component calls /api/places automatically.
 *
 * Endpoints used:
 *   GET /api/places?lat=34.05&lng=-118.24&query=sushi&type=restaurant
 *   GET /api/places/details?place_id=ChIJ...
 */

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_KEY;

  if (!key) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_KEY not configured' });
  }

  const { lat, lng, query = '', type = 'restaurant', place_id, action, ref, maxwidth = '400' } = req.query;

  // ── Photo proxy ───────────────────────────────────────────────────────────
  if (action === 'photo') {
    if (!ref) return res.status(400).json({ error: 'ref required' });
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${encodeURIComponent(ref)}&key=${key}`;
    try {
      const r = await fetch(url);
      if (!r.ok) return res.status(r.status).end();
      const contentType = r.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 's-maxage=86400'); // cache 24 h
      const buf = await r.arrayBuffer();
      return res.send(Buffer.from(buf));
    } catch (err) {
      return res.status(500).json({ error: 'Photo fetch failed' });
    }
  }

  // ── Place Details ─────────────────────────────────────────────────────────
  if (action === 'details' || place_id) {
    if (!place_id) return res.status(400).json({ error: 'place_id required' });

    const fields = 'name,rating,price_level,formatted_address,formatted_phone_number,website,opening_hours,photos,place_id,types,editorial_summary';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${key}`;

    try {
      const r = await fetch(url);
      const data = await r.json();
      res.setHeader('Cache-Control', 's-maxage=3600');
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Places details fetch failed' });
    }
  }

  // ── Nearby Search ─────────────────────────────────────────────────────────
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const url = [
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    `?location=${lat},${lng}`,
    `&radius=5000`,
    `&type=${encodeURIComponent(type)}`,
    query ? `&keyword=${encodeURIComponent(query)}` : '',
    `&key=${key}`,
  ].join('');

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=300'); // cache 5 min
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Places fetch failed' });
  }
}
