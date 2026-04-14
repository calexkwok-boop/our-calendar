import { useState, useEffect } from "react";

const TMDB_KEY = "b66752afda91b8258d32f4388f049a22";
const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w780";

const MOVIE_TABS = [
  { key: "popular",     label: "Popular" },
  { key: "top_rated",   label: "Top rated" },
  { key: "now_playing", label: "In theatres" },
  { key: "upcoming",    label: "Upcoming" },
];

// ---------------------------------------------------------------------------
// Detail sheet — slides up when a poster is tapped
// ---------------------------------------------------------------------------
function MovieDetailSheet({ movie, open, onClose, onAddToSomeday, onPlanEvent, somedays }) {
  const [inSomeday, setInSomeday] = useState(false);

  useEffect(() => {
    if (movie) setInSomeday(somedays.has(movie.id));
  }, [movie, somedays]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!movie) return null;

  const posterUrl  = movie.poster_path   ? `${TMDB_IMG}${movie.poster_path}`       : null;
  const backdropUrl = movie.backdrop_path ? `${TMDB_BACKDROP}${movie.backdrop_path}` : null;
  const year    = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const rating  = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const votes   = Math.max(10, Math.floor((movie.vote_count || 100) / 10));

  function handleSomeday() {
    setInSomeday(v => !v);
    onAddToSomeday?.(movie);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[10002] bg-black/60 transition-opacity duration-250 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Sheet */}
      <div style={{ WebkitOverflowScrolling: 'touch' }} className={`fixed bottom-0 left-0 right-0 z-[10002] max-w-lg mx-auto bg-white dark:bg-[#131c2e] rounded-t-3xl border-t border-stone-200 dark:border-white/[0.06] transition-transform duration-300 ease-out max-h-[88vh] overflow-y-auto overscroll-contain ${open ? "translate-y-0" : "translate-y-full"}`}>
        {/* Handle */}
        <div className="w-9 h-1 bg-stone-200 dark:bg-white/10 rounded-full mx-auto mt-3 mb-0 sticky top-3" />

        {/* Backdrop image */}
        {backdropUrl ? (
          <img src={backdropUrl} alt={movie.title} className="w-full h-48 object-cover mt-4" />
        ) : (
          <div className="w-full h-48 mt-4 bg-purple-500/10 flex items-center justify-center text-5xl">🎬</div>
        )}

        {/* Content */}
        <div className="px-5 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
          {/* Poster + title row */}
          <div className="flex gap-3 -mt-10 mb-4">
            <div className="flex-shrink-0 w-20 h-[120px] rounded-xl overflow-hidden border-2 border-white dark:border-[#131c2e] shadow-xl">
              {posterUrl
                ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-purple-500/10 flex items-center justify-center text-2xl">🎬</div>
              }
            </div>
            <div className="flex-1 pt-12 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">{movie.title}</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">{year} · ★ {rating} · {votes} community votes</p>
            </div>
          </div>

          {/* Overview */}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">{movie.overview || "No description available."}</p>

          {/* Vote row */}
          <div className="flex items-center gap-3 mb-5">
            <VoteChip initialVotes={votes} />
            <span className="text-[11px] text-gray-400 dark:text-gray-600">community votes</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSomeday}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all active:opacity-70 ${inSomeday ? "bg-teal-600 text-white" : "bg-teal-400 text-gray-900"}`}
            >
              {inSomeday ? "✓ In someday list" : "+ Someday list"}
            </button>
            <button
              onClick={() => { onClose(); onPlanEvent?.({ title: movie.title }); }}
              className="flex-1 py-3 rounded-2xl text-sm font-medium bg-stone-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 active:opacity-70"
            >
              Plan it →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function VoteChip({ initialVotes }) {
  const [votes, setVotes] = useState(initialVotes);
  return (
    <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/5 rounded-full px-2 py-1">
      <button onClick={() => setVotes(v => v + 1)} className="text-gray-400 dark:text-gray-500 text-xs hover:text-teal-500 dark:hover:text-teal-400 transition-colors px-1">▲</button>
      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[24px] text-center">{votes}</span>
      <button onClick={() => setVotes(v => Math.max(0, v - 1))} className="text-gray-400 dark:text-gray-500 text-xs hover:text-gray-500 dark:hover:text-gray-300 transition-colors px-1">▼</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Featured banner — top movie with backdrop
// ---------------------------------------------------------------------------
function FeaturedBanner({ movie, onTap, onAddToSomeday, somedays }) {
  const [inSomeday, setInSomeday] = useState(false);

  useEffect(() => {
    if (movie) setInSomeday(somedays.has(movie.id));
  }, [movie, somedays]);

  if (!movie) return (
    <div className="mx-3.5 h-52 rounded-2xl bg-stone-100 dark:bg-[#161f30] animate-pulse mb-3" />
  );

  const backdropUrl = movie.backdrop_path ? `${TMDB_BACKDROP}${movie.backdrop_path}` : null;
  const year   = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "";

  function handleSomeday(e) {
    e.stopPropagation();
    setInSomeday(v => !v);
    onAddToSomeday?.(movie);
  }

  return (
    <div
      className="mx-3.5 rounded-2xl overflow-hidden relative cursor-pointer mb-3"
      style={{ height: "210px" }}
      onClick={() => onTap(movie)}
    >
      {/* Backdrop */}
      {backdropUrl
        ? <img src={backdropUrl} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-[#0e1520]" />
      }
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-widest uppercase text-teal-400 mb-1">Featured</p>
            <h2 className="text-lg font-semibold text-white leading-tight truncate">{movie.title}</h2>
            <p className="text-xs text-white/50 mt-0.5">{year}{rating ? ` · ★ ${rating}` : ""}</p>
          </div>
          <button
            onClick={handleSomeday}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-xl transition-all active:opacity-70 ${inSomeday ? "bg-teal-600 text-white" : "bg-teal-400 text-gray-900"}`}
          >
            {inSomeday ? "✓ Saved" : "+ Someday"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Poster grid
// ---------------------------------------------------------------------------
function PosterGrid({ movies, loading, somedays, onTap }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5 px-3.5">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-stone-100 dark:bg-[#161f30] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 px-3.5">
      {movies.slice(1).map(movie => {
        const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;
        const votes = Math.max(10, Math.floor((movie.vote_count || 100) / 10));
        const inSomeday = somedays.has(movie.id);

        return (
          <div
            key={movie.id}
            className="aspect-[2/3] rounded-xl overflow-hidden relative cursor-pointer bg-stone-100 dark:bg-[#161f30]"
            onClick={() => onTap(movie)}
          >
            {posterUrl
              ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full flex items-center justify-center text-2xl bg-purple-500/10">🎬</div>
            }
            {/* Vote badge */}
            <div className="absolute bottom-1.5 left-1.5 bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1">
              <span className="text-[9px] text-teal-400">▲</span>
              <span className="text-[9px] text-white/70">{votes}</span>
            </div>
            {/* Someday indicator */}
            {inSomeday && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main MoviesPage
// ---------------------------------------------------------------------------
export default function MoviesPage({ onBack, onAddToSomeday, onPlanEvent }) {
  const [activeTab, setActiveTab] = useState("popular");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [somedays, setSomedays] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`https://api.themoviedb.org/3/movie/${activeTab}?api_key=${TMDB_KEY}&language=en-US&page=1`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) { setMovies(data.results || []); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [activeTab]);

  function handleTap(movie) {
    setSelectedMovie(movie);
    setSheetOpen(true);
  }

  function handleAddToSomeday(movie) {
    setSomedays(prev => {
      const next = new Set(prev);
      if (next.has(movie.id)) next.delete(movie.id);
      else next.add(movie.id);
      return next;
    });
    if (!somedays.has(movie.id)) {
      onAddToSomeday?.({ ...movie, type: "movies" });
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] dark:bg-[#0e1520] pb-28">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap'); .font-handwritten { font-family: 'Caveat', cursive; }`}</style>

      {/* Top bar */}
      <div className="bg-white dark:bg-[#131c2e] border-b border-stone-200 dark:border-white/[0.05] px-4 pt-5 pb-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 active:opacity-70 flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="font-handwritten text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Movies</h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-600">2.4k members</p>
          </div>
          <button className="ml-auto text-xs font-medium px-3.5 py-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 active:opacity-70">
            Joined ✓
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          {MOVIE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === t.key ? "bg-purple-500/20 text-purple-600 dark:text-purple-300" : "bg-stone-100 dark:bg-white/5 text-gray-500"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section label */}
      <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 dark:text-gray-600 px-4 pt-5 pb-3">
        {MOVIE_TABS.find(t => t.key === activeTab)?.label}
      </p>

      {error ? (
        <div className="mx-3.5 rounded-2xl bg-white dark:bg-[#161f30] border border-stone-100 dark:border-transparent shadow-sm dark:shadow-none px-4 py-8 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Couldn't load movies</p>
          <button onClick={() => setActiveTab(t => t)} className="text-xs text-teal-500 dark:text-teal-400">Try again</button>
        </div>
      ) : (
        <>
          {/* Featured banner — first movie */}
          <FeaturedBanner
            movie={loading ? null : movies[0]}
            onTap={handleTap}
            onAddToSomeday={handleAddToSomeday}
            somedays={somedays}
          />

          {/* Poster grid — rest of movies */}
          <PosterGrid
            movies={movies}
            loading={loading}
            somedays={somedays}
            onTap={handleTap}
          />
        </>
      )}

      {/* Detail sheet */}
      <MovieDetailSheet
        movie={selectedMovie}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAddToSomeday={handleAddToSomeday}
        onPlanEvent={onPlanEvent}
        somedays={somedays}
      />
    </div>
  );
}
