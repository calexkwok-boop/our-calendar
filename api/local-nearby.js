const AMENITY_BY_TYPE = {
  cafe: ['cafe', 'coffee_shop'],
  restaurant: ['restaurant', 'fast_food'],
  bar: ['bar', 'pub'],
  bakery: ['bakery'],
  store: ['marketplace', 'mall'],
};

const LOCAL_NEARBY_CACHE_TTL_MS = 1000 * 60 * 30;
const localNearbyCache = new Map();

function sanitizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildAddress(tags = {}) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:country'],
  ].filter(Boolean);
  return parts.join(' ').trim();
}

function normalizeElement(element = {}) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  return {
    place_id: `osm-${element.type || 'node'}-${element.id || Math.random().toString(36).slice(2)}`,
    name: tags.name || tags.brand || tags.operator || '',
    vicinity: buildAddress(tags),
    formatted_address: buildAddress(tags),
    geometry: Number.isFinite(lat) && Number.isFinite(lng)
      ? { location: { lat, lng } }
      : null,
    amenity: tags.amenity || '',
    photos: [],
  };
}

export default async function handler(req, res) {
  const lat = sanitizeNumber(req.query?.lat, NaN);
  const lng = sanitizeNumber(req.query?.lng, NaN);
  const radius = Math.max(500, Math.min(20000, sanitizeNumber(req.query?.radius, 6000)));
  const type = String(req.query?.type || '').trim().toLowerCase();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const cacheKey = JSON.stringify({
    lat: Number(lat.toFixed(3)),
    lng: Number(lng.toFixed(3)),
    radius,
    type,
  });
  const cached = localNearbyCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < LOCAL_NEARBY_CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=1800');
    return res.json(cached.payload);
  }

  const amenities = AMENITY_BY_TYPE[type] || [type || 'cafe'];
  const ql = [
    '[out:json][timeout:25];',
    '(',
    ...amenities.flatMap((amenity) => ([
      `node(around:${radius},${lat},${lng})["amenity"="${amenity}"];`,
      `way(around:${radius},${lat},${lng})["amenity"="${amenity}"];`,
      `relation(around:${radius},${lat},${lng})["amenity"="${amenity}"];`,
    ])),
    ');',
    'out center tags 30;',
  ].join('\n');

  try {
    const upstream = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'User-Agent': 'KomoNearbyFallback/1.0',
      },
      body: ql,
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'overpass failed' });
    }

    const data = await upstream.json();
    const rawResults = Array.isArray(data?.elements)
      ? data.elements
          .map(normalizeElement)
          .filter((item) => String(item?.name || '').trim())
      : [];
    const results = rawResults;
    const payload = { results };

    localNearbyCache.set(cacheKey, {
      ts: Date.now(),
      payload,
    });

    res.setHeader('Cache-Control', 's-maxage=1800');
    return res.json(payload);
  } catch {
    return res.status(500).json({ error: 'local nearby lookup failed' });
  }
}
