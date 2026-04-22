/**
 * /api/product-search.js
 *
 * Product discovery proxy for Dream Shelf.
 *
 * Optional Vercel environment variables, in priority order:
 *   SERPAPI_KEY       = SerpAPI key for Google Shopping results
 *   SEARCHAPI_KEY     = SearchAPI.io key for Google Shopping results
 *   GOOGLE_SEARCH_KEY = Google Custom Search API key
 *   GOOGLE_SEARCH_CX  = Programmable Search Engine ID
 *
 * The client can still render a manual fallback if none of these are configured.
 */

const clean = value => String(value || "").trim();

function guessBrand(title = "") {
  const known = [
    "Rolex", "Omega", "Cartier", "Patek", "Audemars Piguet", "Hermes", "Hermès",
    "Chanel", "Prada", "Celine", "Bottega Veneta", "Louis Vuitton", "Gucci",
    "Nike", "Jordan", "Adidas", "New Balance", "Common Projects", "Leica",
    "Tiffany", "Van Cleef", "IWC", "TAG Heuer",
  ];
  const match = known.find(brand => title.toLowerCase().includes(brand.toLowerCase()));
  return match || "";
}

function normalizeShoppingItem(item = {}, index = 0, query = "") {
  const title = clean(item.title || item.name || item.product_title || query);
  const sourceName = clean(item.source || item.seller || item.store || item.merchant || item.displayed_link);
  const price = clean(item.price || item.extracted_price || item.product_price);
  return {
    id: clean(item.product_id || item.position || item.link || title || `${query}-${index}`),
    name: title,
    brand: clean(item.brand) || guessBrand(title),
    priceRange: price,
    image: clean(item.thumbnail || item.image || item.serpapi_thumbnail || item.product_image),
    sourceUrl: clean(item.link || item.product_link || item.url),
    sourceName,
    description: sourceName
      ? `Found from ${sourceName}. Save it now and refine the details later.`
      : "Found from product search. Save it now and refine the details later.",
    external: true,
  };
}

function normalizeImageItem(item = {}, index = 0, query = "") {
  const title = clean(item.title || query);
  return {
    id: clean(item.link || title || `${query}-${index}`),
    name: title.replace(/\s+\|.*$/, "").replace(/\s+-\s+.*$/, "") || query,
    brand: guessBrand(title),
    priceRange: "",
    image: clean(item.link || item.image?.thumbnailLink || item.thumbnail),
    sourceUrl: clean(item.image?.contextLink || item.contextLink || ""),
    sourceName: clean(item.displayLink || ""),
    description: "Image result from Google Custom Search. Add your own photo if this is not the right one.",
    external: true,
  };
}

function getGoogleImageConfig() {
  return {
    key: process.env.GOOGLE_SEARCH_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_CUSTOM_SEARCH_KEY || process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
    cx: process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CSE_ID || process.env.GOOGLE_CUSTOM_SEARCH_CX || process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
  };
}

async function fetchSerpApi(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", key);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "SerpAPI request failed");
  return (data.shopping_results || []).map((item, index) => normalizeShoppingItem(item, index, query));
}

async function fetchSearchApi(query) {
  const key = process.env.SEARCHAPI_KEY;
  if (!key) return null;
  const url = new URL("https://www.searchapi.io/api/v1/search");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", key);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "SearchAPI request failed");
  return (data.shopping_results || data.products || []).map((item, index) => normalizeShoppingItem(item, index, query));
}

async function fetchGoogleImages(query) {
  const { key, cx } = getGoogleImageConfig();
  if (!key || !cx) return null;

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("safe", "active");
  url.searchParams.set("num", "5");
  url.searchParams.set("imgSize", "large");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Google Custom Search request failed");
  return (data.items || []).map((item, index) => normalizeImageItem(item, index, query));
}

export default async function handler(req, res) {
  const query = clean(req.query.q || req.query.query);
  if (!query) return res.status(400).json({ error: "q required" });

  const sources = [
    ["serpapi", fetchSerpApi],
    ["searchapi", fetchSearchApi],
    ["google_custom_search", fetchGoogleImages],
  ];

  for (const [source, fetcher] of sources) {
    try {
      const items = await fetcher(query);
      if (items && items.length) {
        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
        return res.json({ source, items: items.slice(0, 8) });
      }
    } catch (error) {
      // Try the next provider so one API hiccup does not break Dream Shelf search.
    }
  }

  return res.status(501).json({
    error: "Product search is not configured",
    missingAnyOf: ["SERPAPI_KEY", "SEARCHAPI_KEY", "GOOGLE_SEARCH_KEY + GOOGLE_SEARCH_CX"],
  });
}
