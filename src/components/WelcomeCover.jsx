// WelcomeCover.jsx - Hero cover with inspiring welcome message
import React from 'react';

export const WelcomeCover = ({ userName = null, darkMode = false }) => {
  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const emoji = hour < 12 ? '☀️' : hour < 18 ? '👋' : '🌙';
  
  // Smart contextual messages based on actual calendar state
  const getContextualMessage = () => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Weekend messages
    if (dayOfWeek === 0) return "Happy Sunday. Recharge and reset.";
    if (dayOfWeek === 6) return "It's Saturday. Enjoy your weekend.";
    
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
  
  return (
    <div className="relative h-56 sm:h-64 -mx-6 -mt-6 mb-6 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-orange-950/10">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-200/40 dark:bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-pink-200/35 dark:bg-pink-500/15 rounded-full blur-3xl" />
      </div>
      
      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 dark:from-black/20 dark:to-black/40" />
      
      {/* Welcome Message */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
        {/* Date */}
        <div className="text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 font-semibold">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        
        {/* Greeting */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
          {userName ? `${greeting}, ${userName} ${emoji}` : 'Welcome back'}
        </h1>
        
        {/* Tagline */}
        <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-md font-medium">
          {tagline}
        </p>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
    </div>
  );
};

// Alternative: Minimal version (smaller, cleaner)
export const WelcomeCoverMinimal = ({ userName = null }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const emoji = hour < 12 ? '☀️' : hour < 18 ? '👋' : '🌙';
  
  return (
    <div className="relative h-48 -mx-6 -mt-6 mb-8 overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-purple-950/20">
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1 font-semibold">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
          {userName ? `${greeting}, ${userName} ${emoji}` : 'What matters today?'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          One small step, can change everything.
        </p>
      </div>
      
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
    </div>
  );
};

export default WelcomeCover;
