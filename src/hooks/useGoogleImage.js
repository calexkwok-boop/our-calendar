import { useState, useEffect } from "react";

const _cache = {};

export default function useGoogleImage(query) {
  const [url, setUrl] = useState(query ? (_cache[query] || "") : "");

  useEffect(() => {
    if (!query) return;
    if (_cache[query]) { setUrl(_cache[query]); return; }
    fetch(`/api/google-image-search?query=${encodeURIComponent(query)}&num=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const result = data?.results?.[0]?.displayUrl || data?.results?.[0]?.thumbnail || data?.results?.[0]?.url || "";
        if (result) { _cache[query] = result; setUrl(result); }
      })
      .catch(() => {});
  }, [query]);

  return url;
}
