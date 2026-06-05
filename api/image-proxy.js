export default async function handler(req, res) {
  const rawUrl = String(req.query?.url || "").trim();
  if (!rawUrl) {
    return res.status(400).json({ error: "url required" });
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: "invalid url" });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "unsupported protocol" });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "KomoImageProxy/1.0",
        Accept: "image/*,*/*;q=0.8",
        Referer: parsed.origin,
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "upstream fetch failed" });
    }

    const contentType = String(upstream.headers.get("content-type") || "image/jpeg").trim();
    if (!contentType.toLowerCase().startsWith("image/")) {
      return res.status(415).json({ error: "upstream was not an image" });
    }

    const cacheControl = String(upstream.headers.get("cache-control") || "").trim();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl || "s-maxage=86400, stale-while-revalidate=604800");

    const bytes = await upstream.arrayBuffer();
    return res.send(Buffer.from(bytes));
  } catch {
    return res.status(500).json({ error: "image proxy failed" });
  }
}
