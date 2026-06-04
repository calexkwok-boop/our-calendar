import { useState, useEffect } from "react";

const _cache = {};
const _inflight = {};

export default function useGoogleImage(query, options = {}) {
  const preferProductSearch = Boolean(options.preferProductSearch);
  const cacheKey = query ? `${preferProductSearch ? "product" : "image"}:${query}` : "";
  const [url, setUrl] = useState(() => {
    if (!cacheKey) return "";
    if (Object.prototype.hasOwnProperty.call(_cache, cacheKey)) {
      return _cache[cacheKey] || "";
    }
    return undefined;
  });

  useEffect(() => {
    if (!query) {
      setUrl((prev) => (prev ? "" : prev));
      return;
    }
    if (Object.prototype.hasOwnProperty.call(_cache, cacheKey)) {
      const cached = _cache[cacheKey] || "";
      setUrl((prev) => (prev === cached ? prev : cached));
      return;
    }
    let cancelled = false;

    async function resolveImage() {
      let result = "";
      if (preferProductSearch) {
        try {
          const productResponse = await fetch(`/api/product-search?q=${encodeURIComponent(query)}`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const productItems = Array.isArray(productData)
              ? productData
              : (productData?.items || productData?.results || productData?.products || []);
            const productMatch = productItems.find(item => (
              item?.image ||
              item?.imageUrl ||
              item?.thumbnail ||
              item?.thumbnailUrl ||
              item?.displayUrl
            ));
            result = productMatch?.image ||
              productMatch?.imageUrl ||
              productMatch?.thumbnail ||
              productMatch?.thumbnailUrl ||
              productMatch?.displayUrl ||
              "";
          }
        } catch {
          result = "";
        }
      }

      if (!result) {
        try {
          const response = await fetch(`/api/google-image-search?query=${encodeURIComponent(query)}&num=1`);
          const data = response.ok ? await response.json() : null;
          result = data?.results?.[0]?.displayUrl || data?.results?.[0]?.thumbnail || data?.results?.[0]?.url || "";
        } catch {
          result = "";
        }
      }

      _cache[cacheKey] = result || "";
      delete _inflight[cacheKey];
      if (!cancelled) {
        const nextUrl = result || "";
        setUrl((prev) => (prev === nextUrl ? prev : nextUrl));
      }
      return result || "";
    }

    if (_inflight[cacheKey]) {
      setUrl((prev) => (prev === undefined ? prev : undefined));
      _inflight[cacheKey]
        .then((result) => {
          if (!cancelled) {
            const nextUrl = result || "";
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
    _inflight[cacheKey] = resolveImage();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, preferProductSearch, query]);

  return url;
}
