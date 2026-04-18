/**
 * /api/google-image-search.js
 *
 * Server-side proxy for Google Custom Search image results.
 *
 * Required Vercel environment variables:
 *   GOOGLE_SEARCH_KEY = Google API key with Custom Search API enabled
 *   GOOGLE_SEARCH_CX  = Programmable Search Engine ID
 */

export default async function handler(req, res) {
  const key = process.env.GOOGLE_SEARCH_KEY || process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  const { query = "", num = "1" } = req.query;
  const term = String(query).trim();
  const resultCount = Math.max(1, Math.min(Number(num) || 1, 5));

  if (!key || !cx) {
    return res.status(500).json({
      error: "Google image search is not configured",
      missing: {
        GOOGLE_SEARCH_KEY: !key,
        GOOGLE_SEARCH_CX: !cx,
      },
    });
  }

  if (!term) {
    return res.status(400).json({ error: "query required" });
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("safe", "active");
  url.searchParams.set("num", String(resultCount));
  url.searchParams.set("imgSize", "large");
  url.searchParams.set("q", term);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Google image search failed",
      });
    }

    const results = (data.items || []).map(item => ({
      url: item.link,
      thumbnail: item.image?.thumbnailLink || "",
      title: item.title || "",
      source: item.displayLink || "",
    }));

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    return res.json({ results });
  } catch (error) {
    return res.status(500).json({ error: "Google image search request failed" });
  }
}
