import React from 'react';

const hexToRgba = (hex, alpha = 1) => {
  try {
    const h = String(hex || '').replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const intv = parseInt(n, 16);
    const r = (intv >> 16) & 255;
    const g = (intv >> 8) & 255;
    const b = intv & 255;
    const a = Math.max(0, Math.min(1, Number(alpha)));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch {
    return `rgba(168, 85, 247, ${alpha})`;
  }
};

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
  accent = '#a855f7',
  darkMode = false,
}) {
  const panelClickHandler = primaryJourneyGoal ? onClick : onCtaClick;
  const quoteText = getRenderableText(journeyQuote);
  const quoteSource = journeyQuote && typeof journeyQuote === 'object'
    ? String(journeyQuote.source || '').trim()
    : '';
  const coachText = getRenderableText(journeyCoachLabel);
  const panelStyle = darkMode
    ? {
        background: `linear-gradient(135deg, ${hexToRgba(accent, 0.16)} 0%, rgba(17,24,39,0.96) 55%, ${hexToRgba(accent, 0.08)} 100%)`,
        borderColor: hexToRgba(accent, 0.34),
        boxShadow: `0 18px 42px ${hexToRgba(accent, 0.18)}`,
      }
    : {
        background: `linear-gradient(135deg, ${hexToRgba(accent, 0.12)} 0%, rgba(255,255,255,0.96) 45%, ${hexToRgba(accent, 0.2)} 100%)`,
        borderColor: hexToRgba(accent, 0.24),
        boxShadow: `0 18px 42px ${hexToRgba(accent, 0.12)}`,
      };
  const glowStyle = {
    background: hexToRgba(accent, darkMode ? 0.16 : 0.22),
  };
  const accentTextStyle = { color: darkMode ? hexToRgba(accent, 0.92) : accent };
  const progressBarStyle = {
    width: `${Math.round(primaryJourneyGoalProgress * 100)}%`,
    background: `linear-gradient(90deg, ${hexToRgba(accent, 1)} 0%, ${hexToRgba(accent, 0.72)} 100%)`,
  };
  const coachCardStyle = {
    borderColor: hexToRgba(accent, darkMode ? 0.26 : 0.2),
    background: darkMode ? hexToRgba(accent, 0.08) : hexToRgba(accent, 0.08),
  };
  const mutedCtaStyle = {
    borderColor: hexToRgba(accent, darkMode ? 0.34 : 0.2),
    background: darkMode ? hexToRgba(accent, 0.12) : hexToRgba(accent, 0.08),
    color: darkMode ? '#e5e7eb' : '#374151',
  };
  const primaryCtaStyle = {
    background: `linear-gradient(90deg, ${hexToRgba(accent, 0.98)} 0%, ${hexToRgba(accent, 0.74)} 100%)`,
    boxShadow: `0 10px 24px ${hexToRgba(accent, 0.24)}`,
  };

  return (
    <div className="col-span-full">
      <div
        className="
          relative overflow-hidden
          border-2
          rounded-3xl
          p-6 sm:p-8
          transition-all duration-500
          cursor-pointer
          group
        "
        style={panelStyle}
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
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={glowStyle} />

        <div className="relative z-10 mb-6">
          <div className="text-xs uppercase tracking-widest mb-3 font-semibold" style={accentTextStyle}>
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
                <span className="text-base font-bold" style={accentTextStyle}>
                  {Math.round(primaryJourneyGoalProgress * 100)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200/50 dark:bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={progressBarStyle}
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
                  border
                  rounded-2xl
                  p-4
                  flex items-start gap-3
                "
                style={coachCardStyle}
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
                  ? 'border-2'
                  : 'text-white'
                }
                active:scale-95
              `}
              style={primaryJourneyLoggedToday ? mutedCtaStyle : primaryCtaStyle}
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
                text-white font-semibold
                transition-all duration-200
                active:scale-95
              "
              style={primaryCtaStyle}
            >
              Set your first goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
