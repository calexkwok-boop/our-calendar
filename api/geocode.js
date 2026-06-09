/**
 * /api/geocode.js — Vercel serverless function
 *
 * Proxies Google Geocoding API requests so the key stays server-side.
 *
 * GET /api/geocode?address=Los+Angeles
 *
 * Returns the raw Geocoding API response:
 *   { status: 'OK', results: [{ geometry: { location: { lat, lng } }, formatted_address }] }
 */

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_KEY || process.env.REACT_APP_GOOGLE_MAPS_KEY;

  if (!key) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_KEY not configured' });
  }

  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'address required' });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=86400'); // cache 24 h — addresses don't change often
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Geocoding failed' });
  }
}
