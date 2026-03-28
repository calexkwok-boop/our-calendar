import React from 'react';

const resolveEventCardCategory = (event) => {
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
  primaryActionClassName,
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
      ) : null}
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

const InviteeRow = ({ event, borderClassName }) => {
  const invitees = Array.isArray(event?.invitees) ? event.invitees : [];
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">Invited</span>
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

const PartyEventCard = ({ event, ...props }) => (
  <CardShell
    event={event}
    emoji="🎉"
    accentChip={event?.theme ? { label: event.theme, style: { background: '#e9d5ff', color: '#7e22ce' } } : null}
    backgroundClassName="bg-gradient-to-br from-purple-50 to-pink-50"
    borderClassName="border-purple-200"
    primaryActionClassName="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    {...props}
  >
    {event?.description ? (
      <div className="mb-4 rounded-lg border border-purple-100 bg-white p-3 text-sm text-gray-700">
        {event.description}
      </div>
    ) : null}
    <InviteeRow event={event} borderClassName="border-purple-200" />
  </CardShell>
);

const CelebrationEventCard = ({ event, ...props }) => (
  <CardShell
    event={event}
    emoji="🥳"
    accentChip={event?.dressCode ? { label: event.dressCode, style: { background: '#fecdd3', color: '#be123c' } } : null}
    backgroundClassName="bg-gradient-to-br from-rose-50 to-orange-50"
    borderClassName="border-rose-200"
    primaryActionClassName="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700"
    {...props}
  >
    {event?.registryLink ? (
      <a
        href={event.registryLink}
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
    ) : null}
    <InviteeRow event={event} borderClassName="border-rose-200" />
  </CardShell>
);

const KidsEventCard = ({ event, ...props }) => (
  <CardShell
    event={event}
    emoji="🎈"
    accentChip={event?.ageRange ? { label: `Ages ${event.ageRange}`, style: { background: '#fde68a', color: '#92400e' } } : null}
    backgroundClassName="bg-gradient-to-br from-yellow-50 to-orange-50"
    borderClassName="border-yellow-200"
    primaryActionClassName="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
    {...props}
  >
    {event?.activity ? (
      <div className="mb-4 rounded-lg border border-yellow-200 bg-white p-3">
        <p className="mb-1 text-xs font-semibold text-gray-600">Activity</p>
        <p className="text-sm text-gray-900">{event.activity}</p>
      </div>
    ) : null}
    <InviteeRow event={event} borderClassName="border-yellow-200" />
  </CardShell>
);

const HangoutEventCard = ({ event, ...props }) => (
  <CardShell
    event={event}
    emoji="☕"
    accentChip={event?.expectedDuration ? { label: `~${event.expectedDuration}`, style: { background: '#bae6fd', color: '#155e75' } } : null}
    backgroundClassName="bg-gradient-to-br from-cyan-50 to-blue-50"
    borderClassName="border-cyan-200"
    primaryActionClassName="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
    {...props}
  >
    {event?.description ? (
      <div className="mb-4 rounded-lg border border-cyan-200 bg-white p-3 text-sm text-gray-700">
        {event.description}
      </div>
    ) : null}
    <InviteeRow event={event} borderClassName="border-cyan-200" />
  </CardShell>
);

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
  EventCardRouter,
  resolveEventCardCategory,
  PartyEventCard,
  CelebrationEventCard,
  KidsEventCard,
  HangoutEventCard,
  GenericEventCard,
};
