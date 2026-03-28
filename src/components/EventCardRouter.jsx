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
  if (/(playdate|kids|child|children|school|birthday party|parent)/.test(text)) {
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

const isProbablyUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());
const buildMapHref = (location) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(location || '').trim())}`;

const EditIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ActionPill = ({ href, onClick, children, tone = 'neutral' }) => {
  const className = tone === 'accent'
    ? 'inline-flex items-center rounded-full border border-transparent bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
    : 'inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10';

  if (href) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  );
};

const Section = ({ title, subtitle, actions, children }) => (
  <div className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
    {children}
  </div>
);

const EmptySection = ({ title, subtitle }) => (
  <Section title={title} subtitle={subtitle}>
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
      Nothing added yet.
    </div>
  </Section>
);

const InviteeRow = ({ event, label = 'Invited' }) => {
  const invitees = Array.isArray(event?.invitees) ? event.invitees : [];

  return (
    <Section title={label} subtitle={`${invitees.length} ${invitees.length === 1 ? 'person' : 'people'}`}>
      <div className="flex flex-wrap gap-2">
        {invitees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
            No one has responded yet.
          </div>
        ) : (
          invitees.slice(0, 8).map((invitee, index) => (
            <div
              key={invitee.id || invitee.user_id || invitee.name || `${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
            >
              <span>{invitee.avatar || '•'}</span>
              <span>{invitee.name || invitee.display_name || 'Guest'}</span>
            </div>
          ))
        )}
      </div>
    </Section>
  );
};

const CardShell = ({
  event,
  categoryLabel,
  accentClasses,
  accentChip,
  icon,
  onEdit,
  onDelete,
  children,
  primaryActionLabel,
  onPrimaryAction,
  hidePrimaryAction = false,
}) => {
  const location = String(event?.location || '').trim();

  return (
    <div className={`overflow-hidden rounded-[28px] border shadow-[0_20px_60px_rgba(15,23,42,0.10)] dark:shadow-none ${accentClasses.shell}`}>
      <div className={`border-b px-5 py-5 sm:px-6 ${accentClasses.header}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-lg ${accentClasses.iconWrap}`}>
                {icon}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${accentClasses.categoryChip}`}>
                {categoryLabel}
              </span>
              {accentChip ? (
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${accentClasses.secondaryChip}`}>
                  {accentChip}
                </span>
              ) : null}
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">{event?.title || 'Untitled event'}</h3>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{formatEventDateTime(event?.date, event?.time)}</div>
            {location ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="truncate">{location}</span>
                <ActionPill href={buildMapHref(location)}>Open map</ActionPill>
              </div>
            ) : null}
          </div>

          {(onEdit || onDelete) ? (
            <div className="flex items-center gap-2">
              {onEdit ? (
                <button className="rounded-full border border-gray-200 bg-white p-2 text-gray-500 transition hover:text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-white" onClick={onEdit} type="button">
                  <EditIcon />
                </button>
              ) : null}
              {onDelete ? (
                <button className="rounded-full border border-gray-200 bg-white p-2 text-gray-500 transition hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-red-400" onClick={onDelete} type="button">
                  <TrashIcon />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {children}

        {!hidePrimaryAction && onPrimaryAction ? (
          <div className="pt-1">
            <ActionPill onClick={onPrimaryAction} tone="accent">
              {primaryActionLabel || 'Open'}
            </ActionPill>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const PartyEventCard = ({ event, ...props }) => {
  const potluckItems = Array.isArray(event?.potluckItems) ? event.potluckItems : [];
  const theme = String(event?.theme || '').trim();
  const musicPlaylist = String(event?.musicPlaylist || '').trim();
  const plusOnesAllowed = event?.plusOnesAllowed !== false;

  return (
    <CardShell
      event={event}
      categoryLabel="Party"
      accentChip={theme || null}
      icon="✦"
      accentClasses={{
        shell: 'border-orange-200/80 bg-gradient-to-b from-orange-50 via-amber-50 to-white dark:border-orange-400/20 dark:from-[#2a1f14] dark:via-[#19140f] dark:to-[#111111]',
        header: 'border-orange-200/70 bg-white/70 dark:border-orange-400/10 dark:bg-white/[0.03]',
        iconWrap: 'border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-300',
        categoryChip: 'bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-200',
        secondaryChip: 'bg-white/80 text-orange-700 dark:bg-white/5 dark:text-orange-200',
      }}
      {...props}
    >
      <Section
        title="Party Setup"
        subtitle={plusOnesAllowed ? 'Plus-ones welcome' : 'Invite list only'}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-orange-50 px-3 py-3 text-sm text-orange-900 dark:bg-orange-500/10 dark:text-orange-100">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-300">Theme</div>
            <div className="mt-1">{theme || 'No theme added yet'}</div>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">Guest Style</div>
            <div className="mt-1">{plusOnesAllowed ? 'Open to plus-ones' : 'Direct invite only'}</div>
          </div>
        </div>
      </Section>

      {potluckItems.length > 0 ? (
        <Section title="Potluck" subtitle={`${potluckItems.length} planned item${potluckItems.length === 1 ? '' : 's'}`}>
          <div className="space-y-2">
            {potluckItems.slice(0, 4).map((item, index) => (
              <div key={`${item?.item || item}-${index}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10">
                <span>{item?.item || item}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{item?.person || 'Unassigned'}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <EmptySection title="Potluck" subtitle="No dish list added yet." />
      )}

      {musicPlaylist ? (
        <Section
          title="Music"
          subtitle={isProbablyUrl(musicPlaylist) ? 'Playlist link ready' : musicPlaylist}
          actions={isProbablyUrl(musicPlaylist) ? <ActionPill href={musicPlaylist}>Open playlist</ActionPill> : null}
        >
          <div className="rounded-xl bg-white px-3 py-3 text-sm text-gray-600 ring-1 ring-black/5 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
            {isProbablyUrl(musicPlaylist) ? 'Tap the button to open the playlist.' : musicPlaylist}
          </div>
        </Section>
      ) : (
        <EmptySection title="Music" subtitle="No playlist linked yet." />
      )}

      {event?.description ? (
        <Section title="Notes">
          <div className="text-sm leading-6 text-gray-700 dark:text-gray-300">{event.description}</div>
        </Section>
      ) : null}

      <InviteeRow event={event} label="Going" />
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
      categoryLabel="Celebration"
      accentChip={dressCode || null}
      icon="◌"
      accentClasses={{
        shell: 'border-rose-200/80 bg-gradient-to-b from-rose-50 via-orange-50 to-white dark:border-rose-400/20 dark:from-[#2b171d] dark:via-[#201514] dark:to-[#111111]',
        header: 'border-rose-200/70 bg-white/70 dark:border-rose-400/10 dark:bg-white/[0.03]',
        iconWrap: 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300',
        categoryChip: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200',
        secondaryChip: 'bg-white/80 text-rose-700 dark:bg-white/5 dark:text-rose-200',
      }}
      {...props}
    >
      {registryLink ? (
        <Section
          title="Gift Registry"
          subtitle="Guests can open the registry directly."
          actions={<ActionPill href={registryLink}>Open registry</ActionPill>}
        >
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Registry link is attached and ready to share.
          </div>
        </Section>
      ) : (
        <EmptySection title="Gift Registry" subtitle="No registry or gift link added yet." />
      )}

      {schedule.length > 0 ? (
        <Section title="Schedule" subtitle={`${schedule.length} timeline item${schedule.length === 1 ? '' : 's'}`}>
          <div className="space-y-2">
            {schedule.map((item, index) => (
              <div key={`${item?.time || 'time'}-${index}`} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                <div className="font-semibold text-rose-700 dark:text-rose-300">{item?.time || 'TBD'}</div>
                <div className="text-gray-700 dark:text-gray-200">{item?.activity || 'Planned moment'}</div>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <EmptySection title="Schedule" subtitle="No timeline added yet." />
      )}

      {event?.description ? (
        <Section title="Notes">
          <div className="text-sm leading-6 text-gray-700 dark:text-gray-300">{event.description}</div>
        </Section>
      ) : null}

      <InviteeRow event={event} label="Attending" />
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
      categoryLabel="Kids Event"
      accentChip={ageRange ? `Ages ${ageRange}` : null}
      icon="○"
      accentClasses={{
        shell: 'border-amber-200/80 bg-gradient-to-b from-amber-50 via-yellow-50 to-white dark:border-amber-400/20 dark:from-[#2d2314] dark:via-[#1c1811] dark:to-[#111111]',
        header: 'border-amber-200/70 bg-white/70 dark:border-amber-400/10 dark:bg-white/[0.03]',
        iconWrap: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300',
        categoryChip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
        secondaryChip: 'bg-white/80 text-amber-700 dark:bg-white/5 dark:text-amber-200',
      }}
      {...props}
    >
      {activity ? (
        <Section title="Main Activity" subtitle="What the kids will be doing">
          <div className="text-sm text-gray-700 dark:text-gray-300">{activity}</div>
        </Section>
      ) : (
        <EmptySection title="Main Activity" subtitle="No activity details added yet." />
      )}

      <Section title="Parent Notes" subtitle={parentRequired ? 'Parents should stay' : 'Drop-off friendly'}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Attendance</div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">{parentRequired ? 'Parents stay on-site' : 'Drop-off is okay'}</div>
          </div>
          <div className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-300">Allergies</div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">
              {allergenAlerts.length > 0 ? `Avoid ${allergenAlerts.join(', ')}` : 'No allergy notes added'}
            </div>
          </div>
        </div>
      </Section>

      {event?.description ? (
        <Section title="Notes">
          <div className="text-sm leading-6 text-gray-700 dark:text-gray-300">{event.description}</div>
        </Section>
      ) : null}

      <InviteeRow event={event} label="Kids Attending" />
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
      categoryLabel="Hangout"
      accentChip={duration ? `~${duration}` : null}
      icon="•"
      accentClasses={{
        shell: 'border-cyan-200/80 bg-gradient-to-b from-cyan-50 via-sky-50 to-white dark:border-cyan-400/20 dark:from-[#15262b] dark:via-[#111a1f] dark:to-[#111111]',
        header: 'border-cyan-200/70 bg-white/70 dark:border-cyan-400/10 dark:bg-white/[0.03]',
        iconWrap: 'border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-300',
        categoryChip: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200',
        secondaryChip: 'bg-white/80 text-cyan-700 dark:bg-white/5 dark:text-cyan-200',
      }}
      {...props}
    >
      <Section title="Plan" subtitle={reservationName ? `Reservation under ${reservationName}` : 'No reservation note yet'}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Reservation</div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">{reservationName || 'Walk-in or meetup spot'}</div>
          </div>
          <div className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Bill</div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">{billText}</div>
          </div>
        </div>
      </Section>

      {event?.description ? (
        <Section title="Notes">
          <div className="text-sm leading-6 text-gray-700 dark:text-gray-300">{event.description}</div>
        </Section>
      ) : null}

      <InviteeRow event={event} label="Coming" />
    </CardShell>
  );
};

const GenericEventCard = ({ event, ...props }) => (
  <CardShell
    event={event}
    categoryLabel="Event"
    icon="◇"
    accentClasses={{
      shell: 'border-gray-200/80 bg-gradient-to-b from-gray-50 via-slate-50 to-white dark:border-white/10 dark:from-[#181818] dark:via-[#141414] dark:to-[#111111]',
      header: 'border-gray-200/70 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]',
      iconWrap: 'border-gray-200 bg-gray-100 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200',
      categoryChip: 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-200',
      secondaryChip: 'bg-white/80 text-gray-700 dark:bg-white/5 dark:text-gray-200',
    }}
    {...props}
  >
    {event?.description ? (
      <Section title="Notes">
        <div className="text-sm leading-6 text-gray-700 dark:text-gray-300">{event.description}</div>
      </Section>
    ) : null}
    <InviteeRow event={event} />
  </CardShell>
);

const EventCardRouter = ({ event, ...props }) => {
  const category = resolveEventCardCategory(event);
  const routedEvent = { ...event, category };

  switch (category) {
    case 'party':
      return <PartyEventCard event={routedEvent} {...props} />;
    case 'celebration':
      return <CelebrationEventCard event={routedEvent} {...props} />;
    case 'hangout':
      return <HangoutEventCard event={routedEvent} {...props} />;
    case 'kids':
      return <KidsEventCard event={routedEvent} {...props} />;
    case 'sports':
    case 'custom':
    default:
      return <GenericEventCard event={routedEvent} {...props} />;
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
