import React from 'react';

export default function JourneyQuoteDisplay({
  quote,
  darkMode,
  compact = false,
  className = '',
}) {
  const [showSource, setShowSource] = React.useState(false);
  const quoteText = String(quote?.text || '').trim();
  const quoteSource = String(quote?.source || '').trim();

  React.useEffect(() => {
    // Reset the reveal when the daily quote changes.
    setShowSource(false);
  }, [quoteText, quoteSource]);

  if (!quoteText) return null;

  return (
    <button
      type="button"
      aria-expanded={showSource}
      aria-label={showSource ? 'Hide quote source' : 'Show quote source'}
      onClick={(e) => {
        e.stopPropagation();
        setShowSource((prev) => !prev);
      }}
      className={`text-left ${className}`.trim()}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className={compact ? 'text-xs text-gray-500 dark:text-gray-400 leading-5' : 'text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight'}>
        {quoteText}
      </div>
      <div
        className={`${compact ? 'text-[11px]' : 'text-sm'} mt-1 text-gray-500 dark:text-gray-400 transition-all duration-200`}
        style={{
          opacity: showSource ? 0.82 : 0,
          maxHeight: showSource ? 48 : 0,
          overflow: 'hidden',
          transform: showSource ? 'translateY(0)' : 'translateY(-4px)',
        }}
      >
        {quoteSource ? `- ${quoteSource}` : ''}
      </div>
    </button>
  );
}
