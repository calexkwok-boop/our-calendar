import React from 'react';

// Import your existing pickleball game card
// import PickleballGameCard from './PickleballGameCard';

/**
 * EVENT CARD ROUTER
 * 
 * Routes to the correct event card based on category:
 * - Sports (pickleball, tennis, etc.) → Uses existing PickleballGameCard
 * - Party → PartyEventCard
 * - Celebration → CelebrationEventCard
 * - Hangout → HangoutEventCard
 * - Kids Event → KidsEventCard
 * - Custom → GenericEventCard
 */

export const resolveEventCardCategory = (event) => {
  const explicit = String(event?.category || '').trim().toLowerCase();
  if (['sports', 'party', 'celebration', 'hangout', 'kids', 'custom'].includes(explicit)) {
    return explicit;
  }

  const text = [
    event?.category,
    event?.description,
    event?.title,
    event?.activity,
    event?.theme,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');

  if (/(pickleball|tennis|basketball|soccer|golf|volleyball|softball|baseball|run|match|game|practice|workout|sports?)/.test(text)) {
    return 'sports';
  }
  if (/(birthday|house party|holiday party|potluck|dance party|game night|party)/.test(text)) {
    return 'party';
  }
  if (/(wedding|engagement|baby shower|bridal shower|graduation|celebration|anniversary)/.test(text)) {
    return 'celebration';
  }
  if (/(playdate|kids|child|children|school|birthday party|sports practice|parent)/.test(text)) {
    return 'kids';
  }
  if (/(coffee|brunch|drinks|dinner|movie|bbq|hangout|get together|lunch)/.test(text)) {
    return 'hangout';
  }
  return 'custom';
};

const EventCardRouter = ({ event, ...props }) => {
  const category = resolveEventCardCategory(event);
  
  // Route to appropriate card based on category
  switch (category) {
    case 'sports':
      // Use your existing pickleball game card
      return <PickleballGameCard event={event} {...props} />;
      
    case 'party':
      return <PartyEventCard event={event} {...props} />;
      
    case 'celebration':
      return <CelebrationEventCard event={event} {...props} />;
      
    case 'hangout':
      return <HangoutEventCard event={event} {...props} />;
      
    case 'kids':
      return <KidsEventCard event={event} {...props} />;
      
    case 'custom':
    default:
      return <GenericEventCard event={event} {...props} />;
  }
};

// ============================================================================
// PARTY EVENT CARD
// ============================================================================

const PartyEventCard = ({ event, onEdit, onDelete, onRSVP }) => {
  const potluckItems = event?.potluckItems || [];
  const musicPlaylist = event?.musicPlaylist || '';
  const plusOnesAllowed = event?.plusOnesAllowed !== false;
  const theme = event?.theme || '';
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎉</span>
            {theme && (
              <span className="px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full text-xs font-bold">
                {theme}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {formatEventDateTime(event.date, event.time)}
          </p>
          {event.location && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <span>📍</span>
              <span>{event.location}</span>
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-gray-400 hover:text-gray-600">
            <EditIcon />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600">
            <TrashIcon />
          </button>
        </div>
      </div>
      
      {/* Invitees */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">Going</span>
          <span className="text-xs text-gray-500">({event.invitees?.filter(i => i.status === 'accepted').length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.invitees?.slice(0, 5).map(invitee => (
            <div key={invitee.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-purple-200">
              <span className="text-sm">{invitee.avatar}</span>
              <span className="text-xs font-medium text-gray-700">{invitee.name}</span>
            </div>
          ))}
          {event.invitees?.length > 5 && (
            <div className="px-2.5 py-1 bg-white rounded-full border border-purple-200 text-xs font-medium text-gray-600">
              +{event.invitees.length - 5} more
            </div>
          )}
        </div>
        {plusOnesAllowed && (
          <p className="text-xs text-purple-600 mt-2">👥 Plus-ones welcome</p>
        )}
      </div>
      
      {/* Potluck List */}
      {potluckItems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">🍕 Potluck</span>
            <button className="text-xs text-purple-600 font-medium hover:text-purple-700">
              + Add item
            </button>
          </div>
          <div className="space-y-1.5">
            {potluckItems.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100">
                <span className="text-sm text-gray-700">{item.item}</span>
                <span className="text-xs text-gray-500">{item.person}</span>
              </div>
            ))}
            {potluckItems.length > 3 && (
              <button className="text-xs text-purple-600 hover:text-purple-700 w-full text-center py-1">
                See all {potluckItems.length} items
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Music Playlist */}
      {musicPlaylist && (
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-100">
            <span className="text-lg">🎵</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Party Playlist</p>
              <p className="text-xs text-gray-500">Add your favorites</p>
            </div>
            <button className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium">
              Open
            </button>
          </div>
        </div>
      )}
      
      {/* RSVP Button */}
      <button
        onClick={onRSVP}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all"
      >
        RSVP
      </button>
    </div>
  );
};

// ============================================================================
// CELEBRATION EVENT CARD (Wedding, Baby Shower, etc.)
// ============================================================================

const CelebrationEventCard = ({ event, onEdit, onDelete, onRSVP }) => {
  const registryLink = event?.registryLink || '';
  const dressCode = event?.dressCode || '';
  const rsvpDeadline = event?.rsvpDeadline || '';
  const schedule = event?.schedule || [];
  
  return (
    <div className="bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-200 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🥳</span>
            {dressCode && (
              <span className="px-2 py-0.5 bg-rose-200 text-rose-700 rounded-full text-xs font-bold">
                {dressCode}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {formatEventDateTime(event.date, event.time)}
          </p>
          {event.location && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <span>📍</span>
              <span>{event.location}</span>
            </p>
          )}
          {rsvpDeadline && (
            <p className="text-xs text-rose-600 font-medium mt-2">
              ⏰ RSVP by {new Date(rsvpDeadline).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-gray-400 hover:text-gray-600">
            <EditIcon />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600">
            <TrashIcon />
          </button>
        </div>
      </div>
      
      {/* Gift Registry */}
      {registryLink && (
        <div className="mb-4">
          <a
            href={registryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-rose-100 to-orange-100 border border-rose-200 rounded-xl hover:shadow-md transition-all"
          >
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Gift Registry</p>
              <p className="text-xs text-gray-600">View registry & shop</p>
            </div>
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
      
      {/* Schedule/Timeline */}
      {schedule.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">📅 Schedule</p>
          <div className="space-y-2">
            {schedule.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded-lg border border-rose-100">
                <span className="text-xs font-bold text-rose-600 min-w-[60px]">{item.time}</span>
                <span className="text-sm text-gray-700">{item.activity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Attendees */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">Attending</span>
          <span className="text-xs text-gray-500">({event.invitees?.filter(i => i.status === 'accepted').length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.invitees?.slice(0, 5).map(invitee => (
            <div key={invitee.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-rose-200">
              <span className="text-sm">{invitee.avatar}</span>
              <span className="text-xs font-medium text-gray-700">{invitee.name}</span>
              {invitee.plusOne && <span className="text-xs text-gray-500">+1</span>}
            </div>
          ))}
          {event.invitees?.length > 5 && (
            <div className="px-2.5 py-1 bg-white rounded-full border border-rose-200 text-xs font-medium text-gray-600">
              +{event.invitees.length - 5} more
            </div>
          )}
        </div>
      </div>
      
      {/* RSVP Button */}
      <button
        onClick={onRSVP}
        className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-bold rounded-xl transition-all"
      >
        RSVP {rsvpDeadline && `by ${new Date(rsvpDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
      </button>
    </div>
  );
};

// ============================================================================
// KIDS EVENT CARD
// ============================================================================

const KidsEventCard = ({ event, onEdit, onDelete, onRSVP }) => {
  const registryLink = event?.registryLink || '';
  const ageRange = event?.ageRange || '';
  const parentRequired = event?.parentRequired !== false;
  const activity = event?.activity || '';
  const allergenAlerts = event?.allergenAlerts || [];
  
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎈</span>
            {ageRange && (
              <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold">
                Ages {ageRange}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {formatEventDateTime(event.date, event.time)}
          </p>
          {event.location && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <span>📍</span>
              <span>{event.location}</span>
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-gray-400 hover:text-gray-600">
            <EditIcon />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600">
            <TrashIcon />
          </button>
        </div>
      </div>
      
      {/* Activity */}
      {activity && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-yellow-200">
          <p className="text-xs font-semibold text-gray-600 mb-1">Activity</p>
          <p className="text-sm text-gray-900">{activity}</p>
        </div>
      )}
      
      {/* Important Info */}
      <div className="mb-4 space-y-2">
        {parentRequired && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-lg">👨‍👩‍👧</span>
            <span className="text-xs font-medium text-blue-800">Parents must stay</span>
          </div>
        )}
        
        {allergenAlerts.length > 0 && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚠️</span>
              <span className="text-xs font-semibold text-red-800">Allergen Alert</span>
            </div>
            <p className="text-xs text-red-700">No {allergenAlerts.join(', ')}</p>
          </div>
        )}
      </div>
      
      {/* Gift Registry */}
      {registryLink && (
        <div className="mb-4">
          <a
            href={registryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-xl hover:shadow-md transition-all"
          >
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Birthday Registry</p>
              <p className="text-xs text-gray-600">See what they'd love</p>
            </div>
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
      
      {/* Kids Attending */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">Kids Attending</span>
          <span className="text-xs text-gray-500">({event.invitees?.filter(i => i.status === 'accepted').length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.invitees?.slice(0, 5).map(invitee => (
            <div key={invitee.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-yellow-200">
              <span className="text-sm">{invitee.avatar}</span>
              <span className="text-xs font-medium text-gray-700">{invitee.name}</span>
            </div>
          ))}
          {event.invitees?.length > 5 && (
            <div className="px-2.5 py-1 bg-white rounded-full border border-yellow-200 text-xs font-medium text-gray-600">
              +{event.invitees.length - 5} more
            </div>
          )}
        </div>
      </div>
      
      {/* RSVP Button */}
      <button
        onClick={onRSVP}
        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all"
      >
        RSVP
      </button>
    </div>
  );
};

// ============================================================================
// HANGOUT EVENT CARD
// ============================================================================

const HangoutEventCard = ({ event, onEdit, onDelete, onRSVP }) => {
  const reservationName = event?.reservationName || '';
  const billSplitting = event?.billSplitting || 'separate';
  const expectedDuration = event?.expectedDuration || '';
  
  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">☕</span>
            {expectedDuration && (
              <span className="px-2 py-0.5 bg-cyan-200 text-cyan-800 rounded-full text-xs font-bold">
                ~{expectedDuration}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {formatEventDateTime(event.date, event.time)}
          </p>
          {event.location && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <span>📍</span>
              <span>{event.location}</span>
            </p>
          )}
          {reservationName && (
            <p className="text-xs text-cyan-600 font-medium mt-2">
              Reservation under: {reservationName}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-gray-400 hover:text-gray-600">
            <EditIcon />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600">
            <TrashIcon />
          </button>
        </div>
      </div>
      
      {/* Bill Splitting Info */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-cyan-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">💳</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600">Bill</p>
            <p className="text-sm text-gray-900">
              {billSplitting === 'separate' ? 'Separate checks' : 
               billSplitting === 'split' ? 'Split evenly' : 
               'Host pays'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Who's Coming */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">Coming</span>
          <span className="text-xs text-gray-500">({event.invitees?.filter(i => i.status === 'accepted').length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.invitees?.slice(0, 5).map(invitee => (
            <div key={invitee.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-cyan-200">
              <span className="text-sm">{invitee.avatar}</span>
              <span className="text-xs font-medium text-gray-700">{invitee.name}</span>
            </div>
          ))}
          {event.invitees?.length > 5 && (
            <div className="px-2.5 py-1 bg-white rounded-full border border-cyan-200 text-xs font-medium text-gray-600">
              +{event.invitees.length - 5} more
            </div>
          )}
        </div>
      </div>
      
      {/* RSVP Button */}
      <button
        onClick={onRSVP}
        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all"
      >
        Count me in
      </button>
    </div>
  );
};

// ============================================================================
// GENERIC EVENT CARD (Fallback for custom/unknown)
// ============================================================================

const GenericEventCard = ({ event, onEdit, onDelete, onRSVP }) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-2xl mb-1">✨</div>
          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {formatEventDateTime(event.date, event.time)}
          </p>
          {event.location && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <span>📍</span>
              <span>{event.location}</span>
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-gray-400 hover:text-gray-600">
            <EditIcon />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600">
            <TrashIcon />
          </button>
        </div>
      </div>
      
      {/* Invitees */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">Invited</span>
          <span className="text-xs text-gray-500">({event.invitees?.length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.invitees?.slice(0, 5).map(invitee => (
            <div key={invitee.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-gray-200">
              <span className="text-sm">{invitee.avatar}</span>
              <span className="text-xs font-medium text-gray-700">{invitee.name}</span>
            </div>
          ))}
          {event.invitees?.length > 5 && (
            <div className="px-2.5 py-1 bg-white rounded-full border border-gray-200 text-xs font-medium text-gray-600">
              +{event.invitees.length - 5} more
            </div>
          )}
        </div>
      </div>
      
      {/* RSVP Button */}
      <button
        onClick={onRSVP}
        className="w-full py-3 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white font-bold rounded-xl transition-all"
      >
        RSVP
      </button>
    </div>
  );
};

// ============================================================================
// PLACEHOLDER PICKLEBALL GAME CARD (Replace with your actual component)
// ============================================================================

const PickleballGameCard = ({ event, onEdit, onDelete, onRSVP }) => {
  // This is a placeholder - replace with your actual PickleballGameCard import
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 shadow-sm">
      <div className="text-2xl mb-2">🏓</div>
      <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
      <p className="text-sm text-gray-600 mt-1">Your existing pickleball card goes here</p>
      <p className="text-xs text-green-600 mt-2">Keep all your pickleball-specific features!</p>
    </div>
  );
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatEventDateTime = (date, time) => {
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  if (time) {
    const timeObj = new Date(`2000-01-01T${time}`);
    const timeStr = timeObj.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${dateStr} at ${timeStr}`;
  }
  
  return dateStr;
};

// ============================================================================
// EXPORT
// ============================================================================

export default EventCardRouter;
export {
  PartyEventCard,
  CelebrationEventCard,
  KidsEventCard,
  HangoutEventCard,
  GenericEventCard,
  PickleballGameCard,
};
