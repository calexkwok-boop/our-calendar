import { useEffect, useState } from "react";

const placesImageCache = {};
const placesImageInflight = {};

export default function usePlacesImage(query, type = "restaurant") {
  const cacheKey = query ? `${type}:${query}` : "";
  const [url, setUrl] = useState(() => {
    if (!cacheKey) return "";
    if (Object.prototype.hasOwnProperty.call(placesImageCache, cacheKey)) {
      return placesImageCache[cacheKey] || "";
    }
    return undefined;
  });

  useEffect(() => {
    if (!query || !type) {
      setUrl((prev) => (prev ? "" : prev));
      return;
    }
    if (Object.prototype.hasOwnProperty.call(placesImageCache, cacheKey)) {
      const cached = placesImageCache[cacheKey] || "";
      setUrl((prev) => (prev === cached ? prev : cached));
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
        placesImageCache[cacheKey] = nextUrl || "";
        delete placesImageInflight[cacheKey];
        if (!cancelled) {
          const finalUrl = nextUrl || "";
          setUrl((prev) => (prev === finalUrl ? prev : finalUrl));
        }
        return nextUrl || "";
      } catch {
        delete placesImageInflight[cacheKey];
        placesImageCache[cacheKey] = "";
        if (!cancelled) setUrl((prev) => (prev ? "" : prev));
        return "";
      }
    }

    if (placesImageInflight[cacheKey]) {
      setUrl((prev) => (prev === undefined ? prev : undefined));
      placesImageInflight[cacheKey]
        .then((nextUrl) => {
          if (!cancelled) {
            const finalUrl = nextUrl || "";
            setUrl((prev) => (prev === finalUrl ? prev : finalUrl));
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
