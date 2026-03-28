import React from 'react';

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
  if (/(pickleball|tennis|basketball|soccer|golf|volleyball|softball|baseball|run|match|practice|workout|sports?)/.test(text)) {
    return 'sports';
  }
  return 'custom';
};

const formatEventDateTime = (date, time) => {
  const rawDate = String(date || '').trim();
  if (!rawDate) return '';
  const dateObj = new Date(`${rawDate}T00:00:00`);
  const dateStr = Number.isNaN(dateObj.getTime())
    ? rawDate
    : dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  if (!time) return dateStr;

  const timeObj = new Date(`2000-01-01T${time}`);
  const timeStr = Number.isNaN(timeObj.getTime())
    ? String(time)
    : timeObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

  return `${dateStr} at ${timeStr}`;
};

const EditIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const InviteeRow = ({ event, borderClassName, label = 'Invited' }) => {
  const invitees = Array.isArray(event?.invitees) ? event.invitees : [];
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">({invitees.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {invitees.slice(0, 5).map((invitee, index) => (
          <div
            key={invitee.id || invitee.user_id || invitee.name || `${index}`}
            className={`flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 ${borderClassName}`}
          >
            <span className="text-sm">{invitee.avatar || '👤'}</span>
            <span className="text-xs font-medium text-gray-700">{invitee.name || invitee.display_name || 'Guest'}</span>
          </div>
        ))}
        {invitees.length > 5 ? (
          <div className={`rounded-full border bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ${borderClassName}`}>
            +{invitees.length - 5} more
          </div>
        ) : null}
      </div>
    </div>
  );
};

const EmptyStateRow = ({ icon, title, subtitle, borderClassName, accentClassName }) => (
  <div className={`mb-4 rounded-lg border bg-white p-3 ${borderClassName}`}>
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className={`text-xs ${accentClassName}`}>{subtitle}</p>
      </div>
    </div>
  </div>
);

const CardShell = ({
  event,
  emoji,
  accentChip,
  backgroundClassName,
  borderClassName,
  onEdit,
  onDelete,
  children,
  primaryActionLabel,
  onPrimaryAction,
  hidePrimaryAction = false,
  primaryActionClassName = '',
}) => (
  <div className={`rounded-2xl border-2 p-5 shadow-sm ${backgroundClassName} ${borderClassName}`}>
    <div className="mb-4 flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          {accentChip ? (
            <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={accentChip.style}>
              {accentChip.label}
            </span>
          ) : null}
        </div>
        <h3 className="text-xl font-bold text-gray-900">{event?.title || 'Untitled event'}</h3>
        <p className="mt-1 text-sm text-gray-600">{formatEventDateTime(event?.date, event?.time)}</p>
        {event?.location ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
            <span>📍</span>
            <span>{event.location}</span>
          </p>
        ) : null}
      </div>

      {(onEdit || onDelete) ? (
        <div className="ml-3 flex gap-2">
          {onEdit ? (
            <button onClick={onEdit} className="text-gray-400 hover:text-gray-600" type="button">
              <EditIcon />
            </button>
          ) : null}
          {onDelete ? (
            <button onClick={onDelete} className="text-gray-400 hover:text-red-600" type="button">
              <TrashIcon />
            </button>
          ) : null}
        </div>
      ) : (
        <EmptyStateRow
          icon="🎨"
          title="Activity"
          subtitle="Add the main activity so parents know what to expect."
          borderClassName="border-yellow-200"
          accentClassName="text-yellow-700"
        />
      )}
    </div>

    {children}

    {!hidePrimaryAction && onPrimaryAction ? (
      <button
        onClick={onPrimaryAction}
        type="button"
        className={`mt-4 w-full rounded-xl py-3 font-bold text-white transition-all ${primaryActionClassName}`}
      >
        {primaryActionLabel || 'Open'}
      </button>
    ) : null}
  </div>
);

const PartyEventCard = ({ event, ...props }) => {
  const potluckItems = Array.isArray(event?.potluckItems) ? event.potluckItems : [];
  const theme = String(event?.theme || '').trim();
  const musicPlaylist = String(event?.musicPlaylist || '').trim();
  const plusOnesAllowed = event?.plusOnesAllowed !== false;

  return (
    <CardShell
      event={event}
      emoji="🎉"
      accentChip={theme ? { label: theme, style: { background: '#e9d5ff', color: '#7e22ce' } } : null}
      backgroundClassName="bg-gradient-to-br from-purple-50 to-pink-50"
      borderClassName="border-purple-200"
      primaryActionClassName="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      {...props}
    >
      {!theme ? (
        <EmptyStateRow
          icon="✨"
          title="Theme"
          subtitle="Add a party theme to set the vibe."
          borderClassName="border-purple-100"
          accentClassName="text-purple-600"
        />
      ) : null}
      {plusOnesAllowed ? (
        <p className="mb-3 text-xs font-medium text-purple-600">Plus-ones welcome</p>
      ) : null}
      {potluckItems.length > 0 ? (
        <div className="mb-4">
          <div className="mb-2 text-sm font-semibold text-gray-700">Potluck</div>
          <div className="space-y-1.5">
            {potluckItems.slice(0, 3).map((item, index) => (
              <div key={`${item?.item || 'item'}-${index}`} className="flex items-center justify-between rounded-lg border border-purple-100 bg-white p-2">
                <span className="text-sm text-gray-700">{item?.item || item}</span>
                <span className="text-xs text-gray-500">{item?.person || ''}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyStateRow
          icon="🍕"
          title="Potluck"
          subtitle="No items yet. Guests can add what they are bringing."
          borderClassName="border-purple-100"
          accentClassName="text-purple-600"
        />
      )}
      {musicPlaylist ? (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-purple-100 bg-white p-3">
          <span className="text-lg">🎵</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700">Party Playlist</p>
            <p className="truncate text-xs text-gray-500">{musicPlaylist}</p>
          </div>
        </div>
      ) : (
        <EmptyStateRow
          icon="🎵"
          title="Music Playlist"
          subtitle="Link a playlist so everyone knows the soundtrack."
          borderClassName="border-purple-100"
          accentClassName="text-purple-600"
        />
      )}
      {event?.description ? (
        <div className="mb-4 rounded-lg border border-purple-100 bg-white p-3 text-sm text-gray-700">
          {event.description}
        </div>
      ) : (
        <EmptyStateRow
          icon="⚠️"
          title="Allergy Notes"
          subtitle="Add allergy guidance or food restrictions."
          borderClassName="border-yellow-200"
          accentClassName="text-yellow-700"
        />
      )}
      <InviteeRow event={event} borderClassName="border-purple-200" label="Going" />
    </CardShell>
  );
};

const CelebrationEventCard = ({ event, ...props }) => {
  const dressCode = String(event?.dressCode || '').trim();
  const registryLink = String(event?.registryLink || '').trim();
  const schedule = Array.isArray(event?.schedule) ? event.schedule : [];

  return (
    <CardShell
      event={event}
      emoji="🥳"
      accentChip={dressCode ? { label: dressCode, style: { background: '#fecdd3', color: '#be123c' } } : null}
      backgroundClassName="bg-gradient-to-br from-rose-50 to-orange-50"
      borderClassName="border-rose-200"
      primaryActionClassName="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700"
      {...props}
    >
      {registryLink ? (
        <a
          href={registryLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-100 to-orange-100 p-4 transition-all hover:shadow-md"
        >
          <span className="text-2xl">🎁</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Gift Registry</p>
            <p className="text-xs text-gray-600">View registry & shop</p>
          </div>
        </a>
      ) : (
        <EmptyStateRow
          icon="🎁"
          title="Gift Registry"
          subtitle="Add a registry or gift link for guests."
          borderClassName="border-rose-100"
          accentClassName="text-rose-600"
        />
      )}
      {schedule.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Schedule</p>
          <div className="space-y-2">
            {schedule.map((item, index) => (
              <div key={`${item?.time || 'time'}-${index}`} className="flex items-start gap-3 rounded-lg border border-rose-100 bg-white p-2">
                <span className="min-w-[60px] text-xs font-bold text-rose-600">{item?.time}</span>
                <span className="text-sm text-gray-700">{item?.activity}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyStateRow
          icon="🗓️"
          title="Schedule"
          subtitle="Add a simple timeline for the celebration."
          borderClassName="border-rose-100"
          accentClassName="text-rose-600"
        />
      )}
      {event?.description ? (
        <div className="mb-4 rounded-lg border border-rose-100 bg-white p-3 text-sm text-gray-700">
          {event.description}
        </div>
      ) : null}
      <InviteeRow event={event} borderClassName="border-rose-200" label="Attending" />
    </CardShell>
  );
};

const KidsEventCard = ({ event, ...props }) => {
  const ageRange = String(event?.ageRange || '').trim();
  const activity = String(event?.activity || '').trim();
  const parentRequired = event?.parentRequired !== false;
  const allergenAlerts = Array.isArray(event?.allergenAlerts) ? event.allergenAlerts : [];

  return (
    <CardShell
      event={event}
      emoji="🎈"
      accentChip={ageRange ? { label: `Ages ${ageRange}`, style: { background: '#fde68a', color: '#92400e' } } : null}
      backgroundClassName="bg-gradient-to-br from-yellow-50 to-orange-50"
      borderClassName="border-yellow-200"
      primaryActionClassName="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
      {...props}
    >
      {activity ? (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-white p-3">
          <p className="mb-1 text-xs font-semibold text-gray-600">Activity</p>
          <p className="text-sm text-gray-900">{activity}</p>
        </div>
      ) : null}
      {parentRequired ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
          <span className="text-lg">👨‍👩‍👧</span>
          <span className="text-xs font-medium text-blue-800">Parents must stay</span>
        </div>
      ) : null}
      {allergenAlerts.length > 0 ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-xs font-semibold text-red-800">Allergen Alert</span>
          </div>
          <p className="text-xs text-red-700">No {allergenAlerts.join(', ')}</p>
        </div>
      ) : null}
      {event?.description ? (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-white p-3 text-sm text-gray-700">
          {event.description}
        </div>
      ) : null}
      <InviteeRow event={event} borderClassName="border-yellow-200" label="Kids Attending" />
    </CardShell>
  );
};

const HangoutEventCard = ({ event, ...props }) => {
  const duration = String(event?.expectedDuration || '').trim();
  const reservationName = String(event?.reservationName || '').trim();
  const billSplitting = String(event?.billSplitting || 'separate').trim();
  const billText = billSplitting === 'split'
    ? 'Split evenly'
    : billSplitting === 'host'
      ? 'Host pays'
      : 'Separate checks';

  return (
    <CardShell
      event={event}
      emoji="☕"
      accentChip={duration ? { label: `~${duration}`, style: { background: '#bae6fd', color: '#155e75' } } : null}
      backgroundClassName="bg-gradient-to-br from-cyan-50 to-blue-50"
      borderClassName="border-cyan-200"
      primaryActionClassName="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
      {...props}
    >
      {reservationName ? (
        <p className="mb-3 text-xs font-medium text-cyan-600">Reservation under: {reservationName}</p>
      ) : (
        <EmptyStateRow
          icon="📍"
          title="Reservation"
          subtitle="Add a reservation name or meetup note."
          borderClassName="border-cyan-200"
          accentClassName="text-cyan-600"
        />
      )}
      <div className="mb-4 rounded-lg border border-cyan-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💳</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600">Bill</p>
            <p className="text-sm text-gray-900">{billText}</p>
          </div>
        </div>
      </div>
      {event?.description ? (
        <div className="mb-4 rounded-lg border border-cyan-200 bg-white p-3 text-sm text-gray-700">
          {event.description}
        </div>
      ) : null}
      <InviteeRow event={event} borderClassName="border-cyan-200" label="Coming" />
    </CardShell>
  );
};

const GenericEventCard = ({ event, ...props }) => (
  <CardShell
    event={event}
    emoji="✨"
    backgroundClassName="bg-gradient-to-br from-gray-50 to-slate-50"
    borderClassName="border-gray-200"
    primaryActionClassName="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
    {...props}
  >
    {event?.description ? (
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
        {event.description}
      </div>
    ) : null}
    <InviteeRow event={event} borderClassName="border-gray-200" />
  </CardShell>
);

const EventCardRouter = ({ event, ...props }) => {
  const category = resolveEventCardCategory(event);

  switch (category) {
    case 'party':
      return <PartyEventCard event={{ ...event, category }} {...props} />;
    case 'celebration':
      return <CelebrationEventCard event={{ ...event, category }} {...props} />;
    case 'hangout':
      return <HangoutEventCard event={{ ...event, category }} {...props} />;
    case 'kids':
      return <KidsEventCard event={{ ...event, category }} {...props} />;
    case 'sports':
    case 'custom':
    default:
      return <GenericEventCard event={{ ...event, category }} {...props} />;
  }
};

export default EventCardRouter;
export {
  PartyEventCard,
  CelebrationEventCard,
  KidsEventCard,
  HangoutEventCard,
  GenericEventCard,
};
