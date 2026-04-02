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
  const coachText = getRenderableText(journeyCoachLabel);
  const journeyAccent = '#f59e0b';
  const journeyAccentStrong = '#f97316';
  const journeyAccentSoft = '#fcd34d';

  const panelStyle = darkMode
    ? {
        background: `linear-gradient(135deg, ${hexToRgba(journeyAccentStrong, 0.26)} 0%, rgba(17,24,39,0.96) 46%, ${hexToRgba(journeyAccent, 0.16)} 100%)`,
        borderColor: hexToRgba(journeyAccentSoft, 0.34),
        boxShadow: `0 14px 34px ${hexToRgba(journeyAccentStrong, 0.18)}`,
      }
    : {
        background: `linear-gradient(135deg, ${hexToRgba(journeyAccentSoft, 0.3)} 0%, rgba(255,249,235,0.98) 42%, ${hexToRgba(journeyAccentStrong, 0.24)} 100%)`,
        borderColor: hexToRgba(journeyAccent, 0.24),
        boxShadow: `0 14px 34px ${hexToRgba(journeyAccentStrong, 0.12)}`,
      };

  const glowStyle = {
    background: hexToRgba(journeyAccentStrong, darkMode ? 0.18 : 0.24),
  };

  const accentTextStyle = {
    color: darkMode ? hexToRgba(journeyAccentSoft, 0.96) : journeyAccentStrong,
  };

  const progressBarStyle = {
    width: `${Math.round(primaryJourneyGoalProgress * 100)}%`,
    background: `linear-gradient(90deg, ${hexToRgba(journeyAccentStrong, 1)} 0%, ${hexToRgba(journeyAccentSoft, 0.96)} 100%)`,
  };

  const coachCardStyle = {
    borderColor: hexToRgba(journeyAccent, darkMode ? 0.3 : 0.2),
    background: darkMode
      ? hexToRgba(journeyAccentStrong, 0.1)
      : hexToRgba(journeyAccentSoft, 0.16),
  };

  const mutedCtaStyle = {
    borderColor: hexToRgba(journeyAccent, darkMode ? 0.36 : 0.24),
    background: darkMode
      ? hexToRgba(journeyAccentStrong, 0.16)
      : hexToRgba(journeyAccentSoft, 0.18),
    color: darkMode ? '#e5e7eb' : '#374151',
  };

  const primaryCtaStyle = {
    background: `linear-gradient(90deg, ${hexToRgba(journeyAccentStrong, 0.98)} 0%, ${hexToRgba(journeyAccent, 0.92)} 55%, ${hexToRgba(journeyAccentSoft, 0.9)} 100%)`,
    boxShadow: `0 10px 24px ${hexToRgba(journeyAccentStrong, 0.24)}`,
  };

  return (
    <div className="col-span-full">
      <div
        className="
          relative overflow-hidden
          border-2
          rounded-3xl
          p-3 sm:p-3.5
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
        <div
          className="absolute -right-10 -top-10 h-16 w-16 rounded-full blur-3xl pointer-events-none"
          style={glowStyle}
        />

        {primaryJourneyGoal ? (
          <div className="relative z-10 space-y-2">
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-gray-600 dark:text-gray-400">
                Your Focus
              </div>
              <h3 className="mb-0.5 text-base font-bold tracking-tight text-gray-900 dark:text-white">
                {primaryJourneyGoal.title}
              </h3>
              <p className="text-[12px] text-gray-600 dark:text-gray-400">
                {journeyProgressText}
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-gray-600 dark:text-gray-400">
                <span>{journeySupportLabel}</span>
                <span className="text-sm font-bold" style={accentTextStyle}>
                  {Math.round(primaryJourneyGoalProgress * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gray-200/50 dark:bg-black/20">
                <div
                  className="relative h-full overflow-hidden rounded-full transition-all duration-1000 ease-out"
                  style={progressBarStyle}
                >
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
              </div>
            </div>

            {coachText ? (
              <div
                className="
                  rounded-2xl
                  border
                  bg-white/60 dark:bg-black/20
                  p-2
                  backdrop-blur-sm
                "
                style={coachCardStyle}
              >
                <p className="text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">
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
                rounded-xl px-4 py-1.5 text-sm font-semibold
                transition-all duration-200
                ${primaryJourneyLoggedToday ? 'border-2' : 'text-white'}
                active:scale-95
              `}
              style={primaryJourneyLoggedToday ? mutedCtaStyle : primaryCtaStyle}
            >
              {journeyHomeCtaLabel}
            </button>
          </div>
        ) : (
          <div className="relative z-10 py-3 text-center">
            <h3 className="mb-1.5 text-base font-bold text-gray-900 dark:text-white">
              Start Your Journey
            </h3>
            <p className="mx-auto mb-4 max-w-md text-[12px] text-gray-600 dark:text-gray-400">
              One small step, can change everything.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCtaClick();
              }}
              className="
                rounded-2xl
                px-4 py-2
                font-semibold text-white
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
