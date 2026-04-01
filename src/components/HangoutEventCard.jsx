import React from 'react';

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

const normalizeEventNotes = (event) => {
  const rawNotes = String(event?.description || '').trim();
  if (!rawNotes) return '';
  const normalized = rawNotes.toLowerCase().replace(/\s+/g, ' ').trim();
  if (/^(party|kids event|celebration|hangout|custom|sports)( we event)?$/.test(normalized)) {
    return '';
  }
  if (/^[a-z ]+ we event$/.test(normalized)) {
    return '';
  }
  return rawNotes;
};
const getCardBackdropUrl = (event) => {
  const candidates = [
    event?.coverImageUrl,
    event?.cover_image_url,
    event?.backgroundImageUrl,
    event?.background_image_url,
    event?.event_data?.coverImageUrl,
    event?.event_data?.cover_image_url,
    event?.event_data?.backgroundImageUrl,
    event?.event_data?.background_image_url,
  ];
  return candidates
    .map((value) => String(value || '').trim())
    .find((value) => /^https?:\/\//i.test(value)) || '';
};

const buildMapHref = (location) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(location || '').trim())}`;

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
const CameraIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.75 8.75h2.6l1.35-2h6.6l1.35 2h2.6a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5H4.75a1.5 1.5 0 01-1.5-1.5v-7a1.5 1.5 0 011.5-1.5Z" />
    <circle cx="12" cy="13" r="3.1" strokeWidth={1.8} />
  </svg>
);

const ActionPill = ({ href, onClick, children }) => {
  const className = 'inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-white/92 px-3.5 py-1.5 text-xs font-semibold text-fuchsia-700 shadow-sm transition-all hover:border-fuchsia-300 hover:bg-fuchsia-50/75 hover:shadow-md active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-fuchsia-200 dark:hover:bg-white/10';

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

const hangoutSectionClassName = 'rounded-[22px] border border-cyan-200/75 bg-gradient-to-br from-white via-cyan-50/88 to-sky-50/72 p-5 shadow-[0_12px_30px_rgba(34,211,238,0.10)] backdrop-blur-sm transition-all hover:shadow-[0_18px_40px_rgba(59,130,246,0.12)] dark:border-cyan-400/18 dark:bg-gradient-to-br dark:from-white/[0.07] dark:via-cyan-500/[0.05] dark:to-sky-500/[0.05] dark:hover:bg-white/[0.08]';
const hangoutDetailSurfaceClassName = 'border-cyan-200/75 bg-white/88 dark:border-cyan-400/16 dark:bg-white/[0.05]';
const hangoutEmptyClassName = 'border-cyan-200/75 bg-cyan-50/75 text-cyan-800 dark:border-cyan-400/16 dark:bg-cyan-500/8 dark:text-cyan-100';

const Section = ({ title, subtitle, actions, children }) => (
  <div className={`group/section ${hangoutSectionClassName}`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold text-gray-900 dark:text-white">{title}</div>
        {subtitle ? <div className="mt-1.5 text-[13px] font-medium text-gray-500 dark:text-gray-400">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
    {children}
  </div>
);

const EmptySection = ({ title, subtitle, actions }) => (
  <Section title={title} subtitle={subtitle} actions={actions}>
    <div className={`rounded-2xl border border-dashed px-4 py-4 text-sm ${hangoutEmptyClassName}`}>
      Nothing added yet.
    </div>
  </Section>
);

const NotesSection = ({ event, onEdit }) => {
  const notes = normalizeEventNotes(event);
  const sectionTitle = 'Hangout Notes';

  if (notes) {
    return (
      <Section title={sectionTitle} actions={typeof onEdit === 'function' ? <ActionPill onClick={onEdit}>Edit</ActionPill> : null}>
        <div className={`rounded-2xl border px-4 py-4 text-sm leading-6 text-gray-700 dark:text-gray-300 ${hangoutDetailSurfaceClassName}`}>{notes}</div>
      </Section>
    );
  }

  if (typeof onEdit === 'function') {
    return <EmptySection title={sectionTitle} actions={<ActionPill onClick={onEdit}>Add</ActionPill>} />;
  }

  return null;
};

const animationStyles = `
@keyframes hangout-rise-steam {
  0% { transform: translateY(0) translateX(0) scaleY(1); opacity: 0; }
  10% { opacity: 0.4; }
  50% { transform: translateY(-80px) translateX(8px) scaleY(1.2); opacity: 0.3; }
  100% { transform: translateY(-120px) translateX(15px) scaleY(1.5); opacity: 0; }
}
@keyframes hangout-rise-mini-steam {
  0% { transform: translateY(0) scaleY(1); opacity: 0; }
  50% { opacity: 0.4; }
  100% { transform: translateY(-12px) scaleY(1.5); opacity: 0; }
}
@keyframes hangout-gentle-wobble {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-2deg); }
  75% { transform: rotate(2deg); }
}
`;

const HangoutEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const duration = String(event?.expectedDuration || '').trim();
  const reservationName = String(event?.reservationName || '').trim();
  const billSplitting = String(event?.billSplitting || 'separate').trim();
  const billText = billSplitting === 'split'
    ? 'Split evenly'
    : billSplitting === 'host'
      ? 'Host pays'
      : 'Separate checks';
  const coverImageUrl = getCardBackdropUrl(event);
  const openCoverEditor = onUpdateEventData && openEditor
    ? () =>
        openEditor({
          variant: 'hangout',
          title: coverImageUrl ? 'Change Cover Photo' : 'Add Cover Photo',
          subtitle: 'Set the image that sits behind the invitation card.',
          fields: [
            { key: 'coverImageUrl', label: 'Cover photo URL', value: coverImageUrl, placeholder: 'https://images.example.com/invitation-photo.jpg' },
          ],
          onSave: (values) => onUpdateEventData({ coverImageUrl: String(values.coverImageUrl || '').trim() || null }),
        })
    : null;

  return (
    <div className="group relative w-full overflow-hidden rounded-[32px] border-2 border-fuchsia-200/80 bg-gradient-to-br from-white via-rose-50/60 to-cyan-50/60 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(15,23,42,0.12)] dark:border-fuchsia-400/20 dark:from-[#171320] dark:via-[#1d1a30] dark:to-[#111a2b] dark:shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <style>{animationStyles}</style>
      {coverImageUrl ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.2] saturate-[1.04]"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-cyan-50/70 to-sky-50/74 dark:from-[#171320]/88 dark:via-[#1d1a30]/84 dark:to-[#111a2b]/88" />
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[20%] top-[100%] h-16 w-1 rounded-full bg-gradient-to-t from-cyan-200/40 to-transparent blur-sm dark:from-cyan-400/20" style={{ animation: 'hangout-rise-steam 6s ease-in infinite' }} />
        <div className="absolute left-[22%] top-[100%] h-20 w-1 rounded-full bg-gradient-to-t from-sky-200/30 to-transparent blur-sm dark:from-sky-400/15" style={{ animation: 'hangout-rise-steam 7s ease-in infinite 1s' }} />
        <div className="absolute left-[24%] top-[100%] h-14 w-1 rounded-full bg-gradient-to-t from-cyan-200/35 to-transparent blur-sm dark:from-cyan-400/18" style={{ animation: 'hangout-rise-steam 6.5s ease-in infinite 2s' }} />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <svg className="absolute left-[10%] top-[30%] h-8 w-8 opacity-10 dark:opacity-5" viewBox="0 0 40 40">
          <path d="M5,20 Q10,10 15,20 T25,20 T35,20" stroke="currentColor" strokeWidth="2" fill="none" className="text-cyan-400" />
        </svg>
      </div>

      <div className="pointer-events-none absolute -left-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-300/20 to-transparent blur-3xl dark:from-cyan-400/10" />
      <div className="pointer-events-none absolute -right-12 top-1/3 h-32 w-32 -translate-y-1/2 rounded-full bg-gradient-to-l from-sky-300/20 to-transparent blur-3xl dark:from-sky-400/10" />

      <div className="relative px-6 py-7 sm:px-7">
        {(props.onEdit || props.onDelete) ? (
          <div className="absolute right-6 top-5 z-10 flex items-center gap-2 sm:right-7">
            {props.onEdit ? (
              <button className="rounded-full border-2 border-gray-200 bg-white/95 p-2.5 text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white" onClick={props.onEdit} type="button">
                <EditIcon />
              </button>
            ) : null}
            {props.onDelete ? (
              <button className="rounded-full border-2 border-gray-200 bg-white/95 p-2.5 text-gray-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400" onClick={props.onDelete} type="button">
                <TrashIcon />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="relative mx-auto max-w-[30rem] rounded-[28px] border border-fuchsia-200/80 bg-white/78 px-6 py-7 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-[10px] dark:border-fuchsia-400/15 dark:bg-[rgba(38,28,57,0.72)] dark:backdrop-blur-[12px]">
          {typeof openCoverEditor === 'function' ? (
            <button
              type="button"
              onClick={openCoverEditor}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-white/92 text-cyan-600 shadow-sm transition hover:border-cyan-300 hover:bg-white hover:text-cyan-700 dark:border-white/10 dark:bg-white/10 dark:text-cyan-200 dark:hover:bg-white/15 dark:hover:text-white"
              title={coverImageUrl ? 'Change cover photo' : 'Add cover photo'}
            >
              <CameraIcon />
            </button>
          ) : null}
          <div className="mb-3 flex items-center justify-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-fuchsia-700 dark:text-fuchsia-200">
              You're Invited
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
            <span
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-[18px] border-2 border-cyan-200 bg-gradient-to-br from-cyan-100 to-sky-100 text-2xl shadow-lg shadow-cyan-200/30 transition-transform group-hover:scale-110 dark:border-cyan-400/20 dark:from-cyan-500/15 dark:to-sky-500/15 dark:shadow-cyan-500/10"
              style={{ animation: 'hangout-gentle-wobble 3s ease-in-out infinite' }}
            >
              Coffee
              <div className="absolute -top-1 left-1/2 h-3 w-0.5 -translate-x-1/2 rounded-full bg-cyan-300/40 blur-[1px] dark:bg-cyan-400/20" style={{ animation: 'hangout-rise-mini-steam 2s ease-in infinite' }} />
            </span>

            <span className="rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-cyan-800 shadow-sm dark:from-cyan-500/15 dark:to-cyan-600/15 dark:text-cyan-200">
              Hangout
            </span>

            {duration ? (
              <span className="rounded-full border-2 border-cyan-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-200">
                ~{duration}
              </span>
            ) : null}
          </div>

          <h3 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
            {event?.title || 'Untitled hangout'}
          </h3>

          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent dark:via-cyan-300/80" />

          <div className="mt-4 space-y-2 text-[15px] text-gray-600 dark:text-gray-300">
            <div className="font-medium">{formatEventDateTime(event?.date, event?.time)}</div>
            {event?.location ? <div className="font-medium">{event.location}</div> : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {event?.location ? <ActionPill href={buildMapHref(event.location)}>View map</ActionPill> : null}
          </div>
        </div>
      </div>

      <div className="relative space-y-5 px-6 py-6 sm:px-7">
        <Section
          title="The Plan"
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() =>
                openEditor({
                  variant: 'hangout',
                  title: 'Edit Plan',
                  subtitle: 'Update reservation and logistics.',
                  fields: [
                    { key: 'reservationName', label: 'Reservation name', value: reservationName, placeholder: 'Smith' },
                    { key: 'expectedDuration', label: 'Expected duration', value: duration, placeholder: '2 hours' },
                    { key: 'billSplitting', label: 'Bill style', value: billSplitting, placeholder: 'separate, split, or host' },
                  ],
                  onSave: (values) =>
                    onUpdateEventData({
                      reservationName: String(values.reservationName || '').trim(),
                      expectedDuration: String(values.expectedDuration || '').trim(),
                      billSplitting: ['separate', 'split', 'host'].includes(String(values.billSplitting || '').trim())
                        ? String(values.billSplitting || '').trim()
                        : 'separate',
                    }),
                })
              }
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`group/card relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${hangoutDetailSurfaceClassName}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-sky-100 text-sm font-semibold text-cyan-700 dark:from-cyan-500/15 dark:to-sky-500/15 dark:text-cyan-200">
                  Plan
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Reservation</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{reservationName || 'Walk-in'}</div>
                </div>
              </div>
            </div>

            <div className={`group/card relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${hangoutDetailSurfaceClassName}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 text-sm font-semibold text-sky-700 dark:from-sky-500/15 dark:to-blue-500/15 dark:text-sky-200">
                  Bill
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Bill</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{billText}</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {duration ? (
          <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${hangoutDetailSurfaceClassName}`}>
            <div className="relative flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                  Expected Duration
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Around {duration}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <NotesSection event={event} onEdit={onEdit} />

      </div>
    </div>
  );
};

export default HangoutEventCard;
