import React from 'react';
import JourneyQuoteDisplay from './JourneyQuoteDisplay';

export default function JourneyPanel({
  activeLayerPageTheme,
  darkMode,
  hexToRgba,
  journeyHomeCtaLabel,
  journeyCoachLabel,
  journeyProgressText,
  journeyQuickPrompt,
  journeyQuote,
  journeySupportLabel,
  onClick,
  onCtaClick,
  primaryJourneyGoal,
  primaryJourneyGoalProgress,
  primaryJourneyLoggedToday,
  themeAccentButtonStyle,
}) {
  const panelClickHandler = primaryJourneyGoal ? onClick : onCtaClick;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={panelClickHandler}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          panelClickHandler();
        }
      }}
      className="w-full overflow-hidden rounded-[26px] border p-4 text-left transition-all hover:shadow-lg cursor-pointer"
      style={{
        borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
        background: darkMode
          ? `linear-gradient(145deg, ${hexToRgba('#0f172a', 0.96)} 0%, ${hexToRgba(activeLayerPageTheme.accent, 0.18)} 100%)`
          : `linear-gradient(145deg, rgba(255,255,255,0.98) 0%, ${hexToRgba(activeLayerPageTheme.accent, 0.12)} 100%)`,
        boxShadow: darkMode ? '0 20px 44px rgba(2,6,23,0.34)' : '0 20px 44px rgba(15,23,42,0.08)',
      }}
    >
      <JourneyQuoteDisplay
        quote={journeyQuote}
        darkMode={darkMode}
        compact
        className="mb-3 max-w-[18rem]"
      />

      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">Journey</div>
        <div className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2">
          {journeyQuickPrompt ? (primaryJourneyGoal ? `Pro tip: ${journeyQuickPrompt}` : journeyQuickPrompt) : ''}
        </div>
        {primaryJourneyGoal ? (
          <>
            <div className="mt-2.5 text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{primaryJourneyGoal.title}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{journeyProgressText}</div>
          </>
        ) : null}
      </div>

      {primaryJourneyGoal ? (
        <>
          <div className="mt-3.5">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              <span>{journeySupportLabel}</span>
              <span>{Math.round(primaryJourneyGoalProgress * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${primaryJourneyGoalProgress > 0 ? Math.max(6, Math.round(primaryJourneyGoalProgress * 100)) : 0}%`,
                  background: `linear-gradient(90deg, ${activeLayerPageTheme.accent} 0%, ${hexToRgba(activeLayerPageTheme.accent, 0.72)} 100%)`,
                }}
              />
            </div>
          </div>

          {journeyCoachLabel ? (
            <div className="mt-3 rounded-2xl border px-3 py-2 text-[11px] font-medium text-gray-600 dark:text-gray-300" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.08)' : hexToRgba(activeLayerPageTheme.accent, 0.12), backgroundColor: darkMode ? 'rgba(255,255,255,0.04)' : hexToRgba(activeLayerPageTheme.accent, 0.08) }}>
              {journeyCoachLabel}
            </div>
          ) : null}

          <div className="mt-3.5 flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCtaClick();
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${primaryJourneyLoggedToday ? 'border text-gray-700 dark:text-gray-200' : 'text-white'}`}
              style={primaryJourneyLoggedToday
                ? {
                    borderColor: darkMode ? 'rgba(255,255,255,0.12)' : hexToRgba(activeLayerPageTheme.accent, 0.16),
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.04)' : hexToRgba(activeLayerPageTheme.accent, 0.08),
                  }
                : themeAccentButtonStyle}
            >
              {journeyHomeCtaLabel}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-3.5 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCtaClick();
            }}
            className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white"
            style={themeAccentButtonStyle}
          >
            Set your first goal
          </button>
        </div>
      )}
    </div>
  );
}
