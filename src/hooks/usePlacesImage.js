import { useEffect, useState } from "react";

const placesImageCache = {};
const placesImageInflight = {};
const SUCCESS_TTL_MS = 1000 * 60 * 60 * 6;
const FAILURE_TTL_MS = 1000 * 60 * 3;

function readCacheEntry(cacheKey) {
  const entry = placesImageCache[cacheKey];
  if (!entry) return null;
  const ttl = entry.url ? SUCCESS_TTL_MS : FAILURE_TTL_MS;
  if ((Date.now() - entry.ts) > ttl) {
    delete placesImageCache[cacheKey];
    return null;
  }
  return entry;
}

function writeCacheEntry(cacheKey, url) {
  placesImageCache[cacheKey] = { url: String(url || ""), ts: Date.now() };
}

export default function usePlacesImage(query, type = "restaurant") {
  const cacheKey = query ? `${type}:${query}` : "";
  const [url, setUrl] = useState(() => {
    if (!cacheKey) return "";
    const cached = readCacheEntry(cacheKey);
    return cached ? (cached.url || "") : undefined;
  });

  useEffect(() => {
    if (!query || !type) {
      setUrl((prev) => (prev ? "" : prev));
      return;
    }

    const cached = readCacheEntry(cacheKey);
    if (cached) {
      setUrl((prev) => (prev === cached.url ? prev : cached.url));
      return;
    }

    let cancelled = false;

    async function resolveImage() {
      try {
        const response = await fetch(
          `/api/places?action=textsearch&query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`
        );
        const data = response.ok ? await response.json() : null;
        const place = Array.isArray(data?.results) ? data.results[0] : null;
        const photoRef = place?.photos?.[0]?.photo_reference;
        const nextUrl = photoRef
          ? `/api/places?action=photo&ref=${encodeURIComponent(photoRef)}&maxwidth=800`
          : "";

        writeCacheEntry(cacheKey, nextUrl);
        delete placesImageInflight[cacheKey];

        if (!cancelled) {
          setUrl((prev) => (prev === nextUrl ? prev : nextUrl));
        }

        return nextUrl;
      } catch {
        delete placesImageInflight[cacheKey];
        writeCacheEntry(cacheKey, "");
        if (!cancelled) setUrl((prev) => (prev ? "" : prev));
        return "";
      }
    }

    if (placesImageInflight[cacheKey]) {
      setUrl((prev) => (prev === undefined ? prev : undefined));
      placesImageInflight[cacheKey]
        .then((nextUrl) => {
          if (!cancelled) {
            setUrl((prev) => (prev === nextUrl ? prev : nextUrl));
          }
        })
        .catch(() => {
          if (!cancelled) setUrl((prev) => (prev ? "" : prev));
        });
      return () => {
        cancelled = true;
      };
    }

    setUrl((prev) => (prev === undefined ? prev : undefined));
    placesImageInflight[cacheKey] = resolveImage();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, query, type]);

  return url;
}
