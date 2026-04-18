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
  const quoteColor = compact
    ? (darkMode ? '#cbd5e1' : '#374151')
    : (darkMode ? '#f3f4f6' : '#111827');
  const sourceColor = darkMode ? '#94a3b8' : '#6b7280';

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
      <div
        className={compact ? 'text-sm leading-5' : 'text-xl sm:text-2xl leading-tight'}
        style={{
          color: quoteColor,
          fontFamily: "'Lora', Georgia, serif",
          fontStyle: 'italic',
          letterSpacing: compact ? '-0.01em' : '-0.025em',
          fontWeight: compact ? 500 : 600,
        }}
      >
        {quoteText}
      </div>
      <div
        className={`${compact ? 'text-[11px]' : 'text-sm'} mt-1 transition-all duration-200`}
        style={{
          color: sourceColor,
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
