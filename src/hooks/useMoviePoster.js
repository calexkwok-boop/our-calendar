import { useEffect, useState } from "react";

const TMDB_KEY = "b66752afda91b8258d32f4388f049a22";
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const moviePosterCache = {};
const moviePosterInflight = {};

export default function useMoviePoster(query) {
  const normalizedQuery = String(query || "").trim();
  const [url, setUrl] = useState(() => {
    if (!normalizedQuery) return "";
    if (Object.prototype.hasOwnProperty.call(moviePosterCache, normalizedQuery)) {
      return moviePosterCache[normalizedQuery] || "";
    }
    return undefined;
  });

  useEffect(() => {
    if (!normalizedQuery) {
      setUrl((prev) => (prev ? "" : prev));
      return;
    }
    if (Object.prototype.hasOwnProperty.call(moviePosterCache, normalizedQuery)) {
      const cached = moviePosterCache[normalizedQuery] || "";
      setUrl((prev) => (prev === cached ? prev : cached));
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
        moviePosterCache[normalizedQuery] = nextUrl || "";
        delete moviePosterInflight[normalizedQuery];
        if (!cancelled) {
          const finalUrl = nextUrl || "";
          setUrl((prev) => (prev === finalUrl ? prev : finalUrl));
        }
        return nextUrl || "";
      } catch {
        delete moviePosterInflight[normalizedQuery];
        moviePosterCache[normalizedQuery] = "";
        if (!cancelled) setUrl((prev) => (prev ? "" : prev));
        return "";
      }
    }

    if (moviePosterInflight[normalizedQuery]) {
      setUrl((prev) => (prev === undefined ? prev : undefined));
      moviePosterInflight[normalizedQuery]
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
    moviePosterInflight[normalizedQuery] = resolvePoster();

    return () => {
      cancelled = true;
    };
  }, [normalizedQuery]);

  return url;
}
