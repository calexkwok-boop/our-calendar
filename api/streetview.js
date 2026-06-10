export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_KEY || process.env.REACT_APP_GOOGLE_MAPS_KEY;
  const lat = Number(req.query?.lat);
  const lng = Number(req.query?.lng);
  const size = String(req.query?.size || "800x800").trim();
  const fov = String(req.query?.fov || "90").trim();
  const pitch = String(req.query?.pitch || "5").trim();

  if (!key) {
    return res.status(500).json({ error: "GOOGLE_PLACES_KEY not configured" });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat and lng required" });
  }

  const url = `https://maps.googleapis.com/maps/api/streetview?size=${encodeURIComponent(size)}&location=${encodeURIComponent(`${lat},${lng}`)}&fov=${encodeURIComponent(fov)}&pitch=${encodeURIComponent(pitch)}&key=${encodeURIComponent(key)}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "KomoStreetView/1.0",
        Accept: "image/*,*/*;q=0.8",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "street view fetch failed" });
    }

    const contentType = String(upstream.headers.get("content-type") || "image/jpeg").trim();
    if (!contentType.toLowerCase().startsWith("image/")) {
      return res.status(415).json({ error: "street view was not an image" });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");

    const bytes = await upstream.arrayBuffer();
    return res.send(Buffer.from(bytes));
  } catch {
    return res.status(500).json({ error: "street view proxy failed" });
  }
}
