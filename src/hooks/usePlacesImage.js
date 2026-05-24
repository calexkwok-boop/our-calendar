import { useEffect, useState } from "react";

const placesImageCache = {};

export default function usePlacesImage(query, type = "restaurant") {
  const cacheKey = query ? `${type}:${query}` : "";
  const [url, setUrl] = useState(cacheKey ? (placesImageCache[cacheKey] || "") : "");

  useEffect(() => {
    if (!query || !type) {
      setUrl("");
      return;
    }
    if (placesImageCache[cacheKey]) {
      setUrl(placesImageCache[cacheKey]);
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
        if (!cancelled && nextUrl) {
          placesImageCache[cacheKey] = nextUrl;
          setUrl(nextUrl);
        }
      } catch {
        if (!cancelled) setUrl("");
      }
    }

    setUrl("");
    resolveImage();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, query, type]);

  return url;
}
