// TripsTab.jsx - Redesigned Trips Tab with visual cards and better UX
import React, { useState } from 'react';
import { MapPin, Calendar, Users, ChevronRight, Trash2, MoreVertical, Plus } from 'lucide-react';
import JourneyQuoteDisplay from './JourneyQuoteDisplay';
import TRAVEL_QUOTES from '../data/travelQuotes';

const TripsTab = ({
  // Data
  activeTrips = [],
  upcomingTrips = [],
  archivedTrips = [],
  user,
  
  // Actions
  openSubCalendar,
  deleteSubCalendar,
  setBottomNavTab,
  setShowSubCalendarModal,
  
  // Helpers
  getSubCalStartRaw,
  getSubCalEndRaw,
  getTripCoverPhoto,
  getTripMemberCount,
  
  // Theme
  darkMode,
  themeAccentButtonStyle,
  themeAccentHeadingStyle,
}) => {
  const [expandedSection, setExpandedSection] = useState('active'); // active, upcoming, past
  
  // Daily rotating travel quote (similar to Journey)
  const travelToday = new Date();
  const travelDailyQuoteSeed = (
    travelToday.getFullYear() * 10000 + (travelToday.getMonth() + 1) * 100 + travelToday.getDate()
  );
  const tripsQuote = TRAVEL_QUOTES[
    ((travelDailyQuoteSeed % TRAVEL_QUOTES.length) + TRAVEL_QUOTES.length) % TRAVEL_QUOTES.length
  ] || null;
  
  // Calculate trip duration
  const getTripDuration = (trip) => {
    const start = new Date(getSubCalStartRaw(trip));
    const end = new Date(getSubCalEndRaw(trip));
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const nights = days - 1;
    return { days, nights };
  };
  
  // Format date range nicely
  const formatDateRange = (trip) => {
    const startDate = new Date(getSubCalStartRaw(trip));
    const endDate = new Date(getSubCalEndRaw(trip));
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}–${endDay}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  };
  
  // Get days until trip
  const getDaysUntil = (trip) => {
    const start = new Date(getSubCalStartRaw(trip));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Render trip card
  const TripCard = ({ trip, isActive = false, isUpcoming = false, isPast = false }) => {
    const canDelete = trip.owner_id === user?.id;
    const coverPhoto = getTripCoverPhoto?.(trip.id);
    const memberCount = getTripMemberCount?.(trip.id) || 1;
    const duration = getTripDuration(trip);
    const daysUntil = isUpcoming ? getDaysUntil(trip) : null;
    const [showMenu, setShowMenu] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const showCoverPhoto = Boolean(coverPhoto) && !imageFailed;
    
    return (
      <div
        className={`group relative rounded-2xl overflow-hidden transition-all duration-300 
                   hover:shadow-xl hover:-translate-y-0.5 cursor-pointer
                   ${isPast ? 'opacity-75' : ''}`}
        onClick={() => {
          openSubCalendar(trip);
          setBottomNavTab('home');
        }}>
        
        {/* Cover Photo or Gradient */}
        <div className="relative h-40 overflow-hidden">
          {showCoverPhoto ? (
            <img
              src={coverPhoto}
              alt={trip.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${
              isActive
                ? 'from-emerald-400 via-teal-400 to-cyan-400'
                : isUpcoming
                ? 'from-blue-400 via-indigo-400 to-purple-400'
                : 'from-gray-400 via-gray-500 to-gray-600'
            }`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-16 h-16 text-white/20" />
              </div>
            </div>
          )}
          
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {isActive && (
              <div className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                🟢 Active Now
              </div>
            )}
            {isUpcoming && daysUntil !== null && (
              <div className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold shadow-lg">
                {daysUntil === 0 ? 'Starts Today!' : daysUntil === 1 ? 'Starts Tomorrow' : `In ${daysUntil} days`}
              </div>
            )}
            {isPast && (
              <div className="px-3 py-1 rounded-full bg-gray-500/80 backdrop-blur-sm text-white text-xs font-bold">
                Completed
              </div>
            )}
          </div>
          
          {/* Menu Button */}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="absolute top-3 right-3 p-2 rounded-full 
                         bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                         hover:bg-white dark:hover:bg-gray-900 
                         transition-all shadow-lg">
              <MoreVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          
          {/* Delete Menu */}
          {showMenu && canDelete && (
            <div
              className="absolute top-14 right-3 bg-white dark:bg-gray-800 
                         rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 
                         overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSubCalendar(trip.id);
                }}
                className="w-full px-4 py-3 flex items-center gap-2 
                           text-red-600 dark:text-red-400 text-sm font-semibold
                           hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete Trip
              </button>
            </div>
          )}
          
          {/* Trip Name & Date at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-lg mb-1 drop-shadow-lg" style={{ fontFamily: "'Caveat', cursive" }}>
              {trip.name}
            </h3>
            <div className="flex items-center gap-3 text-white/90 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDateRange(trip)}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">
                  {duration.days}d {duration.nights > 0 && `${duration.nights}n`}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card Footer */}
        <div className="bg-white dark:bg-gray-800 border-x border-b border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span className="font-medium">{memberCount} {memberCount === 1 ? 'person' : 'people'}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
          </div>
        </div>
      </div>
    );
  };
  
  // Section Header
  const SectionHeader = ({ icon, title, count, expanded, onToggle }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between mb-3 group">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h4 className="text-xs uppercase tracking-widest font-bold text-gray-700 dark:text-gray-300" style={{ fontFamily: "'Caveat', cursive", fontSize: '0.85rem' }}>
          {title}
        </h4>
        {count > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 
                         text-xs font-bold text-gray-700 dark:text-gray-300">
            {count}
          </span>
        )}
      </div>
      {count > 0 && (
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
          expanded ? 'rotate-90' : ''
        }`} />
      )}
    </button>
  );
  
  const hasNoTrips = activeTrips.length === 0 && upcomingTrips.length === 0 && archivedTrips.length === 0;
  
  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ ...themeAccentHeadingStyle, fontFamily: "'Caveat', cursive" }}>
            Your Trips
          </h2>
          <JourneyQuoteDisplay
            quote={tripsQuote}
            darkMode={darkMode}
            compact
            className="mt-1 max-w-xl"
          />
        </div>
        <button
          onClick={() => setShowSubCalendarModal(true)}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold font-handwritten text-white transition-all"
          style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 52%, #f97316 100%)' }}>
          <Plus className="w-3 h-3" />
          Add Trip
        </button>
      </div>
      
      {/* Empty State */}
      {hasNoTrips && (
        <div className="text-center py-16">
          <div className="text-7xl mb-4">🗺️</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Caveat', cursive" }}>
            No trips yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Start planning your next adventure! Create a trip to organize events, notes, and photos.
          </p>
          <button
            onClick={() => setShowSubCalendarModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 
                       text-white font-semibold
                       hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            style={themeAccentButtonStyle}>
            Create Your First Trip
          </button>
        </div>
      )}
      
      {/* Active Trips */}
      {!hasNoTrips && activeTrips.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            icon="🟢"
            title="Active Now"
            count={activeTrips.length}
            expanded={expandedSection === 'active'}
            onToggle={() => setExpandedSection(expandedSection === 'active' ? null : 'active')}
          />
          {expandedSection === 'active' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} isActive />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Upcoming Trips */}
      {!hasNoTrips && upcomingTrips.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            icon="📅"
            title="Upcoming"
            count={upcomingTrips.length}
            expanded={expandedSection === 'upcoming'}
            onToggle={() => setExpandedSection(expandedSection === 'upcoming' ? null : 'upcoming')}
          />
          {expandedSection === 'upcoming' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} isUpcoming />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Past Trips */}
      {!hasNoTrips && (
        <div>
          <SectionHeader
            icon="🗂"
            title="Past Trips"
            count={archivedTrips.length}
            expanded={expandedSection === 'past'}
            onToggle={() => setExpandedSection(expandedSection === 'past' ? null : 'past')}
          />
          {expandedSection === 'past' && archivedTrips.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No past trips yet. Your completed adventures will appear here!
              </p>
            </div>
          )}
          {expandedSection === 'past' && archivedTrips.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} isPast />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats (if has trips) */}
      {!hasNoTrips && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" style={{ fontFamily: "'Caveat', cursive" }}>
                {activeTrips.length + upcomingTrips.length + archivedTrips.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1" style={{ fontFamily: "'Caveat', cursive" }}>
                Total Trips
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" style={{ fontFamily: "'Caveat', cursive" }}>
                {upcomingTrips.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1" style={{ fontFamily: "'Caveat', cursive" }}>
                Coming Up
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: "'Caveat', cursive" }}>
                {archivedTrips.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1" style={{ fontFamily: "'Caveat', cursive" }}>
                Completed
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsTab;
