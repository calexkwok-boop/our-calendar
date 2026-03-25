// ExploreTab.jsx - Redesigned Explore Tab with visual cards
import React, { useState } from 'react';
import { Search, Users, Heart, Calendar, Sparkles, TrendingUp, Clock } from 'lucide-react';

const ExploreTab = ({
  // Data
  publicCalendars = [],
  user,
  layers = [],
  
  // Search & Filter
  exploreSearch,
  setExploreSearch,
  exploreSortBy,
  setExploreSortBy,
  
  // Actions
  loadPublicCalendars,
  joinPublicCalendar,
  leavePublicCalendar,
  handlePublicCalendarVote,
  onOpenCalendar,
  onEditCalendar,
  
  // State
  exploreLoading,
  exploreError,
  exploreVoteBusyByLayer = {},
  
  // Theme
  darkMode,
  categories = {},
  activeLayerPageTheme = {},
  themeAccentButtonStyle = {},
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFocused, setSearchFocused] = useState(false);

  // Simple color helper
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

  const accent = (themeAccentButtonStyle && themeAccentButtonStyle.backgroundColor) || activeLayerPageTheme?.accent || '#a855f7';
  
  // Filter calendars
  const filteredCalendars = publicCalendars.filter(cal => {
    const matchesSearch = !exploreSearch || 
      cal.name?.toLowerCase().includes(exploreSearch.toLowerCase()) ||
      cal.public_description?.toLowerCase().includes(exploreSearch.toLowerCase()) ||
      cal.public_tags?.some(tag => tag.toLowerCase().includes(exploreSearch.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      cal.public_tags?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });
  
  // Build gradient style from the calendar's theme
  const getCalendarHeaderStyle = (calendar) => {
    const ts = calendar?.title_style || {};
    const pt = calendar?.page_theme || {};
    if (String(ts?.mode || '').toLowerCase() === 'gradient' && ts?.gradientFrom && ts?.gradientVia && ts?.gradientTo) {
      return {
        backgroundImage: `linear-gradient(135deg, ${ts.gradientFrom} 0%, ${ts.gradientVia} 55%, ${ts.gradientTo} 100%)`,
      };
    }
    // Fallback: use page theme accent, or a neutral gradient
    const accent = pt?.accent || '#7c3aed';
    return {
      backgroundImage: `linear-gradient(135deg, ${accent} 0%, ${accent} 100%)`,
    };
  };
  
  // Categories for quick filtering
  const popularCategories = [
    { id: 'all', icon: '🔥', label: 'All' },
    { id: 'sports', icon: '⚽', label: 'Sports' },
    { id: 'education', icon: '🎓', label: 'Education' },
    { id: 'events', icon: '🎉', label: 'Events' },
    { id: 'business', icon: '💼', label: 'Business' },
    { id: 'community', icon: '👥', label: 'Community' },
  ];
  
  // Sort options with icons
  const sortOptions = [
    { value: 'popular', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Popular' },
    { value: 'members', icon: <Users className="w-3.5 h-3.5" />, label: 'Most Members' },
    { value: 'newest', icon: <Clock className="w-3.5 h-3.5" />, label: 'Newest' },
    { value: 'name', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'A-Z' },
  ];
  
  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${accent} 0%, ${hexToRgba(accent, 0.7)} 100%)` }}>
              Discover Calendars
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Find communities, events, and shared schedules
            </p>
          </div>
          <button
            onClick={loadPublicCalendars}
            disabled={exploreLoading}
            className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
            style={{ backgroundColor: darkMode ? hexToRgba(accent, 0.2) : hexToRgba(accent, 0.08), color: darkMode ? hexToRgba(accent, 0.9) : accent }}
          >
            {exploreLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={exploreSearch}
            onChange={(e) => setExploreSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search calendars, tags, or descriptions..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 
                       dark:border-gray-700 bg-white dark:bg-gray-800 
                       text-base text-gray-900 dark:text-white
                       placeholder:text-gray-400
                       focus:outline-none
                       transition-all"
            style={{ boxShadow: searchFocused ? `0 0 0 3px ${hexToRgba(accent, 0.35)}` : undefined, borderColor: searchFocused ? 'transparent' : undefined }}
          />
        </div>
      </div>
      
      {/* Category Pills */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {popularCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700"
              style={selectedCategory === cat.id ? { backgroundImage: `linear-gradient(90deg, ${accent} 0%, ${hexToRgba(accent, 0.85)} 100%)`, color: '#fff', boxShadow: `0 8px 20px ${hexToRgba(accent, 0.25)}`, borderColor: 'transparent' } : undefined}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Sort Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sort by:</span>
        <div className="flex gap-2">
          {sortOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setExploreSortBy(option.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              style={exploreSortBy === option.value ? { backgroundColor: darkMode ? hexToRgba(accent, 0.22) : hexToRgba(accent, 0.12), color: accent } : undefined}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Error State */}
      {exploreError && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 
                        border border-amber-200 dark:border-amber-800 
                        text-amber-700 dark:text-amber-300 text-sm">
          {exploreError}
        </div>
      )}
      
      {/* Loading State */}
      {exploreLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />
              <div className="p-4 bg-white dark:bg-gray-800 rounded-b-2xl border-x border-b border-gray-200 dark:border-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!exploreLoading && filteredCalendars.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No calendars found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setExploreSearch('');
              setSelectedCategory('all');
            }}
            className="px-6 py-3 rounded-xl text-white font-semibold hover:shadow-lg transition-all"
            style={{ backgroundImage: `linear-gradient(90deg, ${accent} 0%, ${hexToRgba(accent, 0.85)} 100%)`, boxShadow: `0 6px 18px ${hexToRgba(accent, 0.25)}` }}>
            Clear Filters
          </button>
        </div>
      )}
      
      {/* Calendar Grid */}
      {!exploreLoading && filteredCalendars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCalendars.map(calendar => {
            const layerId = String(calendar?.id || '');
            const isOwner = String(calendar?.owner_id || '') === String(user?.id || '');
            const joinedLayer = layers.find(layer => String(layer?.id || '') === layerId);
            const isJoined = Boolean(joinedLayer);
            const memberCount = Math.max(1, Number(calendar?.member_count || 0) + 1);
            const upvoteCount = Math.max(0, Number(calendar?.upvote_count || 0));
            const downvoteCount = Math.max(0, Number(calendar?.downvote_count || 0));
            const voteScore = upvoteCount - downvoteCount;
            const myVote = Number(calendar?.my_vote || 0);
            const voteBusy = Boolean(exploreVoteBusyByLayer[layerId]);
            const tags = Array.isArray(calendar?.public_tags) ? calendar.public_tags : [];
            const description = String(calendar?.public_description || '').trim();
            const headerStyle = getCalendarHeaderStyle(calendar);
            
            return (
              <div
                key={layerId}
                onClick={() => onOpenCalendar && onOpenCalendar(layerId)}
                className="group rounded-2xl overflow-hidden transition-all duration-300 
                           hover:transform hover:-translate-y-1 hover:shadow-xl
                           cursor-pointer">
                {/* Themed Header */}
                <div className="relative h-32" style={headerStyle}>
                  {/* Calendar Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-white/20" />
                  </div>
                  
                  {/* Member Count Badge */}
                  <div className="absolute top-3 right-3 
                                  bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                                  px-3 py-1 rounded-full 
                                  text-xs font-bold text-gray-900 dark:text-white
                                  flex items-center gap-1.5 shadow-sm">
                    <Users className="w-3.5 h-3.5" />
                    {memberCount}
                  </div>
                  
                  {/* Joined Badge */}
                  {isJoined && (
                    <div className="absolute top-3 left-3 
                                    bg-emerald-500 text-white 
                                    px-3 py-1 rounded-full 
                                    text-xs font-bold shadow-sm">
                      ✓ Joined
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 bg-white dark:bg-gray-800 border-x border-b border-gray-200 dark:border-gray-700">
                  {/* Name */}
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1 truncate">
                    {calendar.name || 'Untitled Calendar'}
                  </h3>
                  
                  {/* Description Preview */}
                  {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 min-h-[2.5rem]">
                      {description}
                    </p>
                  )}
                  
                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex gap-1.5 mb-3 flex-wrap">
                      {tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full 
                                     bg-gray-100 dark:bg-gray-700 
                                     text-gray-700 dark:text-gray-300 font-medium">
                          #{tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-0.5">
                          +{tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Actions Row */}
                  <div className="flex items-center gap-2">
                    {/* Vote Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublicCalendarVote(layerId, myVote === 1 ? 0 : 1);
                      }}
                      disabled={voteBusy}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                                 text-sm font-semibold transition-all
                                 ${myVote === 1
                                   ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                   : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                 }
                                 disabled:opacity-50`}>
                      <Heart className={`w-4 h-4 ${myVote === 1 ? 'fill-current' : ''}`} />
                      {voteScore > 0 && <span>{voteScore}</span>}
                    </button>

                    {/* Owner Edit Button */}
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCalendar && onEditCalendar(layerId);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                      >
                        Edit
                      </button>
                    )}
                    
                    {/* Spacer */}
                    <div className="flex-1" />
                    
                    {/* Join/Leave Button */}
                    {isJoined ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          leavePublicCalendar(layerId);
                        }}
                        className="px-4 py-2 rounded-xl 
                                   bg-gray-100 dark:bg-gray-700 
                                   text-gray-700 dark:text-gray-300 
                                   text-sm font-semibold
                                   hover:bg-gray-200 dark:hover:bg-gray-600
                                   transition-all">
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinPublicCalendar(layerId);
                        }}
                        className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:shadow-lg transition-all"
                        style={{ backgroundImage: `linear-gradient(90deg, ${accent} 0%, ${hexToRgba(accent, 0.85)} 100%)`, boxShadow: `0 6px 18px ${hexToRgba(accent, 0.25)}` }}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExploreTab;
