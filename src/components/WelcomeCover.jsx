// WelcomeCover.jsx - Hero cover with inspiring welcome message
import React from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const hexToRgba = (hex, alpha) => {
  const safeHex = String(hex || '').replace('#', '').trim();
  const normalized = safeHex.length === 3
    ? safeHex.split('').map((char) => char + char).join('')
    : safeHex;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(124, 58, 237, ${clamp(alpha, 0, 1)})`;
  }

  const intValue = Number.parseInt(normalized, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
};

export const WelcomeCover = ({
  userName = null,
  darkMode = false,
  accentColor = '#7c3aed',
  backgroundFrom = '#fdf2f8',
  backgroundVia = '#f5f3ff',
  backgroundTo = '#eef2ff',
}) => {
  // Smart contextual messages based on actual calendar state
  const getContextualMessage = () => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Weekend messages
    if (dayOfWeek === 0) return "Happy Sunday. Recharge and reset.";
    if (dayOfWeek === 6) return "It's Saturday. Enjoy your weekend!";
    
    // Weekday time-based messages
    if (hour < 12) {
      return "What's on deck today?";
    } else if (hour < 18) {
      return "How's your day going?";
    } else {
      return "Time to wind down.";
    }
  };
  
  const tagline = getContextualMessage();
  
  const backgroundStyle = {
    backgroundImage: darkMode
      ? `linear-gradient(135deg, ${hexToRgba(backgroundFrom, 0.18)} 0%, ${hexToRgba(backgroundVia, 0.12)} 52%, ${hexToRgba(backgroundTo, 0.1)} 100%)`
      : `linear-gradient(135deg, ${backgroundFrom} 0%, ${backgroundVia} 52%, ${backgroundTo} 100%)`,
  };

  return (
    <div className="relative h-56 sm:h-64 -mx-6 -mt-6 mb-6 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0" style={backgroundStyle}>
        {/* Decorative orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-3xl"
          style={{ backgroundColor: hexToRgba(accentColor, darkMode ? 0.18 : 0.2) }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-3xl"
          style={{ backgroundColor: hexToRgba(backgroundTo, darkMode ? 0.16 : 0.22) }}
        />
      </div>
      
      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 dark:from-black/20 dark:to-black/40" />
      
      {/* Welcome Message */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
        {/* Date */}
        <div
          className="text-xs uppercase tracking-wider mb-2 font-semibold"
          style={{ color: darkMode ? hexToRgba(accentColor, 0.92) : accentColor }}
        >
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        
        {/* Context headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
          {tagline}
        </h1>
        

      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
    </div>
  );
};

// Alternative: Minimal version (smaller, cleaner)
export const WelcomeCoverMinimal = ({ userName = null }) => {
  const dayOfWeek = new Date().getDay();
  const headline = dayOfWeek === 0
    ? 'Happy Sunday. Recharge and reset.'
    : dayOfWeek === 6
      ? "It's Saturday. Enjoy your weekend."
      : 'What matters today?';
  
  return (
    <div className="relative h-48 -mx-6 -mt-6 mb-8 overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-purple-950/20">
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1 font-semibold">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
          {headline}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {userName ? `${userName}, one clear step can change the tone of the day.` : 'One clear step can change the tone of the day.'}
        </p>
      </div>
      
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
    </div>
  );
};

export default WelcomeCover;
