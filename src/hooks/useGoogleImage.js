import { useEffect, useState } from "react";

const _cache = {};
const _inflight = {};
const SUCCESS_TTL_MS = 1000 * 60 * 60 * 6;
const FAILURE_TTL_MS = 1000 * 60 * 3;

function toProxyImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  return `/api/image-proxy?url=${encodeURIComponent(raw)}`;
}

function readCacheEntry(cacheKey) {
  const entry = _cache[cacheKey];
  if (!entry) return null;
  const ttl = entry.url ? SUCCESS_TTL_MS : FAILURE_TTL_MS;
  if ((Date.now() - entry.ts) > ttl) {
    delete _cache[cacheKey];
    return null;
  }
  return entry;
}

function writeCacheEntry(cacheKey, url) {
  _cache[cacheKey] = { url: String(url || ""), ts: Date.now() };
}

export default function useGoogleImage(query, options = {}) {
  const preferProductSearch = Boolean(options.preferProductSearch);
  const cacheKey = query ? `${preferProductSearch ? "product" : "image"}:${query}` : "";
  const [url, setUrl] = useState(() => {
    if (!cacheKey) return "";
    const cached = readCacheEntry(cacheKey);
    return cached ? (cached.url || "") : undefined;
  });

  useEffect(() => {
    if (!query) {
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
      let result = "";

      if (preferProductSearch) {
        try {
          const productResponse = await fetch(`/api/product-search?q=${encodeURIComponent(query)}`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const productItems = Array.isArray(productData)
              ? productData
              : (productData?.items || productData?.results || productData?.products || []);
            const productMatch = productItems.find((item) => (
              item?.image
              || item?.imageUrl
              || item?.thumbnail
              || item?.thumbnailUrl
              || item?.displayUrl
            ));
            result = productMatch?.image
              || productMatch?.imageUrl
              || productMatch?.thumbnail
              || productMatch?.thumbnailUrl
              || productMatch?.displayUrl
              || "";
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

      const proxiedResult = toProxyImageUrl(result);
      writeCacheEntry(cacheKey, proxiedResult);
      delete _inflight[cacheKey];

      if (!cancelled) {
        setUrl((prev) => (prev === proxiedResult ? prev : proxiedResult));
      }

      return proxiedResult;
    }

    if (_inflight[cacheKey]) {
      setUrl((prev) => (prev === undefined ? prev : undefined));
      _inflight[cacheKey]
        .then((result) => {
          if (!cancelled) {
            setUrl((prev) => (prev === result ? prev : result));
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
