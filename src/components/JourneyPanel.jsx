import React from 'react';

const getRenderableText = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return String(value.text || value.label || value.title || '').trim();
  }
  return '';
};

export default function JourneyPanel({
  journeyHomeCtaLabel,
  journeyCoachLabel,
  journeyProgressText,
  journeyQuote,
  journeySupportLabel,
  onClick,
  onCtaClick,
  primaryJourneyGoal,
  primaryJourneyGoalProgress,
  primaryJourneyLoggedToday,
}) {
  const panelClickHandler = primaryJourneyGoal ? onClick : onCtaClick;
  const quoteText = getRenderableText(journeyQuote);
  const quoteSource = journeyQuote && typeof journeyQuote === 'object'
    ? String(journeyQuote.source || '').trim()
    : '';
  const coachText = getRenderableText(journeyCoachLabel);

  return (
    <div className="col-span-full">
      <div
        className="
          relative overflow-hidden
          bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50
          dark:from-purple-950/30 dark:via-pink-950/20 dark:to-orange-950/10
          border-2 border-purple-200/50 dark:border-purple-500/30
          rounded-3xl
          p-6 sm:p-8
          shadow-xl shadow-purple-500/10
          hover:shadow-2xl hover:shadow-purple-500/20
          transition-all duration-500
          cursor-pointer
          group
        "
        onClick={panelClickHandler}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            panelClickHandler();
          }
        }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mb-6">
          <div className="text-xs uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 font-semibold">
            Today&apos;s Inspiration
          </div>
          <blockquote className="text-xl sm:text-2xl font-serif italic text-gray-800 dark:text-gray-100 leading-relaxed">
            &quot;{quoteText}&quot;
          </blockquote>
          {quoteSource ? (
            <div className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {quoteSource}
            </div>
          ) : null}
        </div>

        {primaryJourneyGoal ? (
          <div className="relative z-10 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">
                Your Focus
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                {primaryJourneyGoal.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {journeyProgressText}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <span>{journeySupportLabel}</span>
                <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(primaryJourneyGoalProgress * 100)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200/50 dark:bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${Math.round(primaryJourneyGoalProgress * 100)}%` }}
                >
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
              </div>
            </div>

            {coachText ? (
              <div
                className="
                  bg-white/60 dark:bg-black/20
                  backdrop-blur-sm
                  border border-purple-200/50 dark:border-purple-500/20
                  rounded-2xl
                  p-4
                  flex items-start gap-3
                "
              >
                <span className="text-2xl">💡</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {coachText}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCtaClick();
              }}
              className={`
                rounded-xl px-4 py-2.5 text-sm font-semibold
                transition-all duration-200
                ${primaryJourneyLoggedToday
                  ? 'border-2 text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-white/10 border-purple-200 dark:border-purple-500/30'
                  : 'text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35'
                }
                active:scale-95
              `}
            >
              {journeyHomeCtaLabel}
            </button>
          </div>
        ) : (
          <div className="relative z-10 text-center py-6">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Start Your Journey
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              One small step, can change everything.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCtaClick();
              }}
              className="
                px-6 py-3 rounded-2xl
                bg-gradient-to-r from-purple-600 to-purple-500
                hover:from-purple-700 hover:to-purple-600
                text-white font-semibold
                shadow-lg shadow-purple-500/25
                hover:shadow-xl hover:shadow-purple-500/35
                transition-all duration-200
                active:scale-95
              "
            >
              Set your first goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
