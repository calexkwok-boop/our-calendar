import { useEffect, useState } from "react";

const TMDB_KEY = "b66752afda91b8258d32f4388f049a22";
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const moviePosterCache = {};

export default function useMoviePoster(query) {
  const normalizedQuery = String(query || "").trim();
  const [url, setUrl] = useState(normalizedQuery ? (moviePosterCache[normalizedQuery] || "") : "");

  useEffect(() => {
    if (!normalizedQuery) {
      setUrl("");
      return;
    }
    if (moviePosterCache[normalizedQuery]) {
      setUrl(moviePosterCache[normalizedQuery]);
      return;
    }

    let cancelled = false;

    async function resolvePoster() {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&language=en-US&query=${encodeURIComponent(normalizedQuery)}&page=1`
        );
        const data = response.ok ? await response.json() : null;
        const match = Array.isArray(data?.results) ? data.results.find((item) => item?.poster_path) : null;
        const nextUrl = match?.poster_path ? `${TMDB_IMG}${match.poster_path}` : "";
        if (!cancelled && nextUrl) {
          moviePosterCache[normalizedQuery] = nextUrl;
          setUrl(nextUrl);
        }
      } catch {
        if (!cancelled) setUrl("");
      }
    }

    setUrl("");
    resolvePoster();

    return () => {
      cancelled = true;
    };
  }, [normalizedQuery]);

  return url;
}
