import { useState, useEffect } from "react";

const _cache = {};
const _inflight = {};

export default function useGoogleImage(query, options = {}) {
  const preferProductSearch = Boolean(options.preferProductSearch);
  const cacheKey = query ? `${preferProductSearch ? "product" : "image"}:${query}` : "";
  const [url, setUrl] = useState(cacheKey ? (_cache[cacheKey] || "") : "");

  useEffect(() => {
    if (!query) {
      setUrl("");
      return;
    }
    if (Object.prototype.hasOwnProperty.call(_cache, cacheKey)) {
      setUrl(_cache[cacheKey] || "");
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
        setUrl(result || "");
      }
      return result || "";
    }

    setUrl("");

    if (_inflight[cacheKey]) {
      _inflight[cacheKey]
        .then((result) => {
          if (!cancelled) setUrl(result || "");
        })
        .catch(() => {
          if (!cancelled) setUrl("");
        });
      return () => {
        cancelled = true;
      };
    }

    _inflight[cacheKey] = resolveImage();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, preferProductSearch, query]);

  return url;
}
