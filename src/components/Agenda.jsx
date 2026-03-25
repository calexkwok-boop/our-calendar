import React from 'react';
import { X, MapPin } from 'lucide-react';

const hexToRgba = (hex, alpha = 1) => {
  try {
    const h = String(hex || '').replace('#', '');
    const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const intv = parseInt(n, 16);
    const r = (intv >> 16) & 255;
    const g = (intv >> 8) & 255;
    const b = intv & 255;
    const a = Math.max(0, Math.min(1, Number(alpha)));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch {
    return 'rgba(168,85,247,1)';
  }
};

export default function Agenda({
  agendaRangeDays,
  setAgendaRangeDays,
  agendaSearchQuery,
  setAgendaSearchQuery,
  agendaItems = [],
  categories = {},
  getDateKey,
  toDateOnlyTs,
  subCalendars = [],
  getSubCalStartRaw = (sc) => sc?.start_date,
  getSubCalEndRaw = (sc) => sc?.end_date,
  onEventClick,
  formatTime,
  activeLayerPageTheme = { accent: '#a855f7' },
  darkMode = false,
}) {
  return (
    <div className="space-y-4">
      {/* Controls - warm gradient container */}
      <div
        className="rounded-3xl p-5 shadow-lg border"
        style={{
          background: darkMode
            ? `linear-gradient(135deg, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.18)} 0%, rgba(15,23,42,0.85) 100%)`
            : `linear-gradient(135deg, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.08)} 0%, rgba(255,255,255,0.96) 100%)`,
          borderColor: darkMode ? 'rgba(255,255,255,0.10)' : hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.15),
        }}
      >
        {/* Range selector - pill buttons */}
        <div className="mb-4">
          <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 tracking-wide uppercase">
            Time Range
          </div>
          <div
            className="inline-flex items-center gap-1 p-1 rounded-2xl shadow-inner"
            style={{ background: darkMode ? hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.18) : hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.12) }}
          >
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setAgendaRangeDays(days)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
                  ${agendaRangeDays === days
                    ? 'bg-white dark:bg-gray-800 shadow-md scale-105 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-500'
                  }
                `}
              >
                {days === 7 ? 'Week' : days === 30 ? 'Month' : '3 Months'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Search input - beautiful design */}
        <div>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 tracking-wide uppercase">
            Search
          </div>
          <div className="relative">
            <input
              type="text"
              value={agendaSearchQuery}
              onChange={(e) => setAgendaSearchQuery(e.target.value)}
              placeholder="Search by title, location, or category..."
              className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              style={{ fontSize: '16px' }}
            />
            {agendaSearchQuery && (
              <button
                onClick={() => setAgendaSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Summary badge */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md">
            <span className="text-lg">📅</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {agendaItems.length} {agendaItems.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          
          {agendaSearchQuery && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          )}
        </div>
      </div>
      
      {/* Events list */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {agendaItems.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-4">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {agendaSearchQuery ? 'No results found' : 'Nothing scheduled'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
              {agendaSearchQuery 
                ? `No events match "${agendaSearchQuery}"`
                : `No events in the next ${agendaRangeDays} days`
              }
            </p>
          </div>
        ) : (
          (() => {
            let lastDateKey = '';
            return agendaItems.map((event, idx) => {
              const dk = String(event?.date || event?.dateKey || '');
              const showHeader = dk !== lastDateKey;
              lastDateKey = dk;
              const category = categories[event.category || 'other'] || categories.other;
              const dateObj = new Date(`${dk}T00:00:00`);
              const isToday = dk === getDateKey(new Date());
              const isTomorrow = (() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return dk === getDateKey(tomorrow);
              })();
              
              // Get trip info if event is during a trip
              const dateTs = toDateOnlyTs(dateObj);
              const eventTrip = subCalendars.find(sc => {
                const startTs = toDateOnlyTs(getSubCalStartRaw(sc));
                const endTs = toDateOnlyTs(getSubCalEndRaw(sc));
                return startTs !== null && endTs !== null && dateTs >= startTs && dateTs <= endTs;
              });
              
              return (
                <div 
                  key={`${event.id}-${dk}-${event.time || 'all-day'}`}
                  style={{
                    animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s both`
                  }}
                >
                  {/* Date header */}
                  {showHeader && (
                    <div className="sticky top-0 z-10 -mx-1 mb-3">
                                                                  <div
                        className="px-4 py-3 rounded-2xl backdrop-blur-sm shadow-md border"
                        style={isToday
                          ? {
                              background: darkMode
                                ? `linear-gradient(90deg, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.22)} 0%, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.08)} 100%)`
                                : `linear-gradient(90deg, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.18)} 0%, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.04)} 100%)`,
                              borderColor: hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.35),
                            }
                          : {
                              background: darkMode ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.96)',
                              borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.12)',
                            }
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-sm font-bold ${
                              isToday 
                                ? 'text-purple-700 dark:text-purple-300' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {isToday ? '☀️ Today' : isTomorrow ? '🌤️ Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          
                          {/* Trip badge if applicable */}
                          {eventTrip && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md">
                              <span className="text-xs">✈️</span>
                              <span className="text-[10px] font-bold truncate max-w-[80px]">
                                {eventTrip.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Event card */}
                  <button
                    onClick={() => onEventClick && onEventClick(event)}
                    className="group w-full text-left rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border" style={{ borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.12)' }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Time badge */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl shrink-0" style={{ background: darkMode ? `linear-gradient(135deg, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.22)} 0%, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.08)} 100%)` : `linear-gradient(135deg, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.14)} 0%, ${hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.05)} 100%)` }}>
                        {event.time ? (
                          <>
                            <span className="text-xs font-bold" style={{ color: (activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7' }}>
                              {formatTime(event.time).split(' ')[0]}
                            </span>
                            <span className="text-[10px]" style={{ color: hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.7) }}>
                              {formatTime(event.time).split(' ')[1]}
                            </span>
                          </>
                        ) : (
                                                      <span className="text-xs font-bold" style={{ color: (activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7' }}>
                            All day
                          </span>
                        )}
                      </div>
                      
                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Category dot */}
                          {!event.isHoliday && (
                            <div className={`w-2.5 h-2.5 rounded-full ${(category && category.color) || ''} shrink-0`} />
                          )}
                          
                          {/* Title */}
                          <span className="font-semibold text-base text-gray-900 dark:text-white truncate">
                            {event.isHoliday && '🎉 '}
                            {event.title}
                          </span>
                          
                          {/* Urgent badge */}
                          {event.isUrgent && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold">
                              URGENT
                            </span>
                          )}
                          
                          {/* Private badge */}
                          {event.isPrivate && (
                            <span className="text-gray-400">🔒</span>
                          )}
                        </div>
                        
                        {/* Location */}
                        {event.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        {/* Category label */}
                        {!event.isHoliday && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(category && (category.label || category.name)) || 'Other'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow */}
                      <div className="text-xl group-hover:translate-x-1 transition-transform shrink-0" style={{ color: hexToRgba((activeLayerPageTheme && activeLayerPageTheme.accent) || '#a855f7', 0.7) }}>
                        →
                      </div>
                    </div>
                  </button>
                </div>
              );
            });
          })()
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}