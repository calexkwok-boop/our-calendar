import { useState, useEffect } from "react";

const _cache = {};

export default function useGoogleImage(query) {
  const [url, setUrl] = useState(query ? (_cache[query] || "") : "");

  useEffect(() => {
    if (!query) return;
    if (_cache[query]) { setUrl(_cache[query]); return; }
    let cancelled = false;

    async function resolveImage() {
      let result = "";
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
            item?.displayUrl ||
            item?.url
          ));
          result = productMatch?.image ||
            productMatch?.imageUrl ||
            productMatch?.thumbnail ||
            productMatch?.thumbnailUrl ||
            productMatch?.displayUrl ||
            productMatch?.url ||
            "";
        }
      } catch {
        result = "";
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

      if (result && !cancelled) {
        _cache[query] = result;
        setUrl(result);
      }
    }

    setUrl("");
    resolveImage();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return url;
}
