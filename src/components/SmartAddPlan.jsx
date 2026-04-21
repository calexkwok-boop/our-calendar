// SmartAddPlan.jsx - Category-aware trip planning with smart defaults
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, X, Clock } from 'lucide-react';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SmartAddPlan = ({
  // Current time slot (9, 14, 19, etc - hour of day)
  timeSlot = 9,
  
  // Callback when user selects a category
  onAddPlan, // (category, defaults) => void
  
  // Theme
  darkMode = false,
  
  // Optional: override suggestions
  customSuggestions = null,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);
  
  // Determine time of day from slot
  const timeOfDay = getTimeOfDay(timeSlot);
  
  // Get contextual suggestions
  const suggestions = customSuggestions || getDefaultSuggestions(timeOfDay);
  
  const handleSelectCategory = (category) => {
    const defaults = getSmartDefaults(category, timeOfDay, timeSlot);
    onAddPlan(category, defaults);
    setShowMenu(false);
  };
  
  return (
    <div className="smart-add-plan relative" ref={menuRef} style={{ overflow: 'visible' }}>
      {/* Main button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="group rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 
                 px-5 py-2.5 shadow-lg hover:shadow-xl active:shadow-md
                 transition-all duration-200
                 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-200" />
        <span className="font-bold text-white text-sm" style={{ fontFamily: "'Caveat', cursive" }}>
          Add Plan
        </span>
        <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${
          showMenu ? 'rotate-180' : ''
        }`} />
      </button>
      
      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute top-full mt-2 right-0 left-auto min-w-[280px] max-w-[min(92vw,420px)] z-50
                      bg-white dark:bg-gray-800 rounded-2xl shadow-2xl 
                      border border-gray-200 dark:border-gray-700 
                      overflow-hidden animate-fadeIn">
          <div className="p-2 space-y-1">
            {/* Contextual suggestions */}
            {suggestions.map(suggestion => (
              <SuggestionButton
                key={suggestion.category}
                icon={suggestion.icon}
                label={suggestion.label}
                description={suggestion.description}
                gradient={suggestion.gradient}
                onClick={() => handleSelectCategory(suggestion.category)}
                darkMode={darkMode}
              />
            ))}
            
            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            
            {/* Custom/Other option */}
            <SuggestionButton
              icon="✏️"
              label="Custom Plan"
              description="Add something unique"
              gradient="from-gray-500 to-slate-500"
              onClick={() => handleSelectCategory('other')}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUGGESTION BUTTON
// ============================================================================

const SuggestionButton = ({ icon, label, description, gradient, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
             hover:bg-gray-100 dark:hover:bg-gray-700/50 
             active:scale-[0.98]
             transition-all duration-150
             text-left group">
    {/* Icon with gradient background */}
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} 
                   flex items-center justify-center shrink-0
                   group-hover:scale-110 transition-transform duration-200`}>
      <span className="text-xl">{icon}</span>
    </div>
    
    {/* Text */}
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-gray-900 dark:text-white text-sm" style={{ fontFamily: "'Caveat', cursive" }}>
        {label}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {description}
      </div>
    </div>
  </button>
);

// ============================================================================
// COMPACT VERSION (for section headers)
// ============================================================================

const SmartAddPlanCompact = ({
  timeSlot = 9,
  onAddPlan,
  darkMode = false,
}) => {
  const timeOfDay = getTimeOfDay(timeSlot);
  const suggestions = getDefaultSuggestions(timeOfDay);
  
  // Show just the top 2 suggestions as buttons
  const topSuggestions = suggestions.slice(0, 2);
  
  const handleSelectCategory = (category) => {
    const defaults = getSmartDefaults(category, timeOfDay, timeSlot);
    onAddPlan(category, defaults);
  };
  
  return (
    <div className="flex gap-2 flex-wrap">
      {topSuggestions.map(suggestion => (
        <button
          key={suggestion.category}
          onClick={() => handleSelectCategory(suggestion.category)}
          style={{ fontFamily: "'Caveat', cursive" }}
          className={`rounded-full px-4 py-2 text-white text-sm font-semibold
                   bg-gradient-to-r ${suggestion.gradient}
                   hover:shadow-lg hover:scale-105 active:scale-95
                   transition-all duration-200
                   flex items-center gap-2`}>
          <span className="text-base leading-none">{suggestion.icon}</span>
          <span>{suggestion.label}</span>
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine time of day from hour slot
 */
const getTimeOfDay = (timeSlot) => {
  const hour = parseInt(timeSlot) || 9;
  
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 24) return 'evening';
  return 'night';
};

/**
 * Get contextual suggestions based on time of day
 */
const getDefaultSuggestions = (timeOfDay) => {
  const suggestions = {
    morning: [
      {
        category: 'restaurant',
        icon: '☕',
        label: 'Breakfast',
        description: 'Quick add with smart defaults',
        gradient: 'from-orange-500 to-amber-500',
      },
      {
        category: 'activity',
        icon: '🏃',
        label: 'Morning Activity',
        description: 'Sightseeing, tour, or exercise',
        gradient: 'from-blue-500 to-cyan-500',
      },
    ],
    afternoon: [
      {
        category: 'restaurant',
        icon: '🍝',
        label: 'Lunch',
        description: 'Quick add with smart defaults',
        gradient: 'from-orange-500 to-red-500',
      },
      {
        category: 'activity',
        icon: '🏛️',
        label: 'Sightseeing',
        description: 'Museums, landmarks, or tours',
        gradient: 'from-blue-500 to-purple-500',
      },
    ],
    evening: [
      {
        category: 'restaurant',
        icon: '🍷',
        label: 'Dinner',
        description: 'Quick add with smart defaults',
        gradient: 'from-orange-500 to-red-600',
      },
      {
        category: 'activity',
        icon: '🎭',
        label: 'Evening Activity',
        description: 'Shows, bars, or nightlife',
        gradient: 'from-purple-500 to-pink-500',
      },
    ],
    night: [
      {
        category: 'restaurant',
        icon: '🌙',
        label: 'Late Night Bite',
        description: 'Quick add with smart defaults',
        gradient: 'from-indigo-500 to-purple-600',
      },
      {
        category: 'activity',
        icon: '🎵',
        label: 'Nightlife',
        description: 'Bars, clubs, or live music',
        gradient: 'from-purple-500 to-pink-500',
      },
    ],
  };
  
  return suggestions[timeOfDay] || suggestions.afternoon;
};

/**
 * Get smart defaults for a category and time
 */
const getSmartDefaults = (category, timeOfDay, timeSlot) => {
  const hour = parseInt(timeSlot) || 9;
  
  // Category-specific defaults
  const categoryDefaults = {
    restaurant: {
      duration: 90, // 1.5 hours
      titles: {
        morning: 'Breakfast at',
        afternoon: 'Lunch at',
        evening: 'Dinner at',
        night: 'Late night at',
      },
      times: {
        morning: 9,
        afternoon: 14,
        evening: 19,
        night: 22,
      },
    },
    activity: {
      duration: 120, // 2 hours
      titles: {
        morning: 'Morning activity:',
        afternoon: 'Afternoon activity:',
        evening: 'Evening activity:',
        night: 'Night activity:',
      },
      times: {
        morning: 10,
        afternoon: 15,
        evening: 18,
        night: 21,
      },
    },
    hotel: {
      duration: 0, // All day
      titles: {
        morning: 'Check-in at',
        afternoon: 'Check-in at',
        evening: 'Check-out from',
        night: 'Check-out from',
      },
      times: {
        morning: 15, // 3pm check-in
        afternoon: 15,
        evening: 11, // 11am check-out
        night: 11,
      },
    },
    transport: {
      duration: 60, // 1 hour
      titles: {
        morning: 'Travel to',
        afternoon: 'Travel to',
        evening: 'Return trip',
        night: 'Travel to',
      },
      times: {
        morning: 8,
        afternoon: 14,
        evening: 17,
        night: 20,
      },
    },
    shopping: {
      duration: 90, // 1.5 hours
      titles: {
        morning: 'Morning shopping:',
        afternoon: 'Shopping:',
        evening: 'Evening shopping:',
        night: 'Night market:',
      },
      times: {
        morning: 10,
        afternoon: 14,
        evening: 18,
        night: 20,
      },
    },
    other: {
      duration: 60, // 1 hour
      titles: {
        morning: '',
        afternoon: '',
        evening: '',
        night: '',
      },
      times: {
        morning: hour,
        afternoon: hour,
        evening: hour,
        night: hour,
      },
    },
  };
  
  const config = categoryDefaults[category] || categoryDefaults.other;
  const title = config.titles[timeOfDay] || '';
  const startHour = config.times[timeOfDay] || hour;
  const startTime = `${String(startHour).padStart(2, '0')}:00`;
  
  // Calculate end time
  const endHour = startHour + Math.floor(config.duration / 60);
  const endMinutes = config.duration % 60;
  const endTime = config.duration > 0 
    ? `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
    : '';
  
  return {
    title,
    startTime,
    endTime,
    category,
    duration: config.duration,
  };
};

/**
 * Get category icon
 */
const getCategoryIcon = (category) => {
  const icons = {
    restaurant: '🍽️',
    activity: '🎯',
    hotel: '🏨',
    transport: '🚗',
    shopping: '🛍️',
    other: '✨',
  };
  return icons[category] || '✨';
};

/**
 * Get category theme for styling event cards
 */
const getCategoryTheme = (category) => {
  const themes = {
    restaurant: {
      icon: '🍽️',
      gradient: 'from-orange-500 to-red-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
      timeBg: 'bg-orange-100 dark:bg-orange-900/40',
      timeText: 'text-orange-700 dark:text-orange-300',
    },
    activity: {
      icon: '🎯',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      timeBg: 'bg-blue-100 dark:bg-blue-900/40',
      timeText: 'text-blue-700 dark:text-blue-300',
    },
    hotel: {
      icon: '🏨',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
      timeBg: 'bg-green-100 dark:bg-green-900/40',
      timeText: 'text-green-700 dark:text-green-300',
    },
    transport: {
      icon: '🚗',
      gradient: 'from-purple-500 to-indigo-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-500',
      timeBg: 'bg-purple-100 dark:bg-purple-900/40',
      timeText: 'text-purple-700 dark:text-purple-300',
    },
    shopping: {
      icon: '🛍️',
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      border: 'border-pink-200 dark:border-pink-800',
      iconBg: 'bg-gradient-to-br from-pink-500 to-rose-500',
      timeBg: 'bg-pink-100 dark:bg-pink-900/40',
      timeText: 'text-pink-700 dark:text-pink-300',
    },
    other: {
      icon: '✨',
      gradient: 'from-gray-500 to-slate-500',
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-700',
      iconBg: 'bg-gradient-to-br from-gray-500 to-slate-500',
      timeBg: 'bg-gray-100 dark:bg-gray-900/40',
      timeText: 'text-gray-700 dark:text-gray-300',
    },
  };
  return themes[category] || themes.other;
};

// ============================================================================
// EXAMPLE EVENT CARD COMPONENT (for reference)
// ============================================================================

const CategoryEventCard = ({ event, darkMode, onClick }) => {
  const theme = getCategoryTheme(event.category);
  
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 ${theme.bg} ${theme.border}
                 hover:shadow-lg transition-all duration-200 text-left`}>
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className={`w-11 h-11 rounded-xl ${theme.iconBg} 
                       flex items-center justify-center shrink-0 shadow-md`}>
          <span className="text-xl">{theme.icon}</span>
        </div>
        
        {/* Event details */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-gray-900 dark:text-white mb-1">
            {event.title}
          </div>
          
          {event.location && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
              📍 {event.location}
            </div>
          )}
          
          {event.time && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                           ${theme.timeBg} ${theme.timeText} text-xs font-semibold`}>
              <Clock className="w-3.5 h-3.5" />
              {event.time}
              {event.endTime && ` - ${event.endTime}`}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// CSS for animations (add to your global CSS or use inline styles)
// ============================================================================

const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
`;

// ============================================================================
// EXPORT
// ============================================================================

export default SmartAddPlan;
export {
  SmartAddPlanCompact,
  getCategoryIcon,
  getCategoryTheme,
  getSmartDefaults,
  CategoryEventCard,
};
