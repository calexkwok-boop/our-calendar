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
    .find((value) => /^(https?:\/\/|data:image\/|blob:)/i.test(value)) || '';
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

const ActionPill = ({ href, onClick, children, subdued = false }) => {
  const className = subdued
    ? 'inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-white/88 px-3 py-1.25 text-[11px] font-medium text-cyan-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50/70 hover:shadow-md active:scale-[0.98] dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-200 dark:hover:bg-white/10'
    : 'inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-white/92 px-3.5 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm transition-all hover:border-cyan-300 hover:bg-cyan-50/75 hover:shadow-md active:scale-[0.98] dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-200 dark:hover:bg-white/10';

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
@keyframes hangout-float-drift {
  0%, 100% { 
    transform: translateY(0) translateX(0) rotate(0deg); 
    opacity: 0.7;
  }
  25% { 
    transform: translateY(-12px) translateX(8px) rotate(5deg); 
    opacity: 0.9;
  }
  50% { 
    transform: translateY(-6px) translateX(-6px) rotate(-3deg); 
    opacity: 0.85;
  }
  75% { 
    transform: translateY(-14px) translateX(4px) rotate(7deg); 
    opacity: 0.95;
  }
}
@keyframes hangout-spin-gentle {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes hangout-pulse-glow {
  0%, 100% { 
    opacity: 0.4; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.05);
  }
}
@keyframes hangout-bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes hangout-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes party-card-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(8deg); }
}
@keyframes party-card-twinkle {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.18; transform: scale(0.85); }
}
@keyframes party-card-sway {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-5px); }
}
@keyframes party-card-bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}
`;

const HangoutEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const duration = String(event?.expectedDuration || '').trim();
  const reservationName = String(event?.reservationName || '').trim();
  const billSplitting = String(event?.billSplitting || 'separate').trim();
  const titleText = String(event?.title || '').trim();
  const shouldShowLocationLine = Boolean(event?.location);
  const billText = billSplitting === 'split'
    ? 'Split evenly'
    : billSplitting === 'host'
      ? 'Host pays'
      : 'Separate checks';
  const openHeaderEditor =
    onUpdateEventData && openEditor
      ? () =>
          openEditor({
            variant: 'hangout',
            title: 'Invitation',
            fields: [
              { key: 'title', label: 'Title', value: titleText, placeholder: 'Coffee Hangout' },
              { key: 'date', label: 'Date', value: String(event?.date || '').trim(), placeholder: '2026-04-12' },
              { key: 'time', label: 'Time', value: String(event?.time || '').trim(), placeholder: '7:00 PM' },
              { key: 'location', label: 'Location', type: 'location', value: String(event?.location || '').trim(), placeholder: 'Search venue...' },
            ],
            onSave: (values) =>
              onUpdateEventData({
                title: String(values.title || '').trim(),
                date: String(values.date || '').trim(),
                time: String(values.time || '').trim(),
                location: String(values.location || '').trim(),
              }),
          })
      : onEdit;
  const coverImageUrl = getCardBackdropUrl(event);
  const openCoverEditor = onUpdateEventData && openEditor
    ? () =>
        openEditor({
          variant: 'hangout',
          title: coverImageUrl ? 'Change Cover Photo' : 'Add Cover Photo',
          fields: [
            { key: 'coverImageUrl', label: 'Cover photo', type: 'image-upload', value: coverImageUrl },
          ],
          onSave: (values) => onUpdateEventData({ coverImageUrl: String(values.coverImageUrl || '').trim() || null }),
        })
    : null;

  return (
    <div className="group relative w-full overflow-hidden rounded-[32px] border-2 border-fuchsia-200/80 bg-gradient-to-br from-white via-rose-50/60 to-cyan-50/60 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(15,23,42,0.12)] dark:border-fuchsia-400/20 dark:from-[#171320] dark:via-[#1d1a30] dark:to-[#111a2b] dark:shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <style>{animationStyles}</style>
      
      {/* Floating emoji decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[15%] text-4xl opacity-52 drop-shadow-[0_4px_8px_rgba(8,145,178,0.12)] dark:opacity-34" style={{ animation: 'hangout-float-drift 8s ease-in-out infinite' }}>
          ☕
        </div>
        <div className="absolute right-[12%] top-[25%] text-3xl opacity-48 drop-shadow-[0_4px_8px_rgba(14,116,144,0.12)] dark:opacity-30" style={{ animation: 'hangout-float-drift 7s ease-in-out infinite 1s' }}>
          🎮
        </div>
        <div className="absolute left-[15%] bottom-[20%] text-3xl opacity-48 drop-shadow-[0_4px_8px_rgba(8,145,178,0.12)] dark:opacity-30" style={{ animation: 'hangout-float-drift 9s ease-in-out infinite 2s' }}>
          🎸
        </div>
        <div className="absolute right-[10%] bottom-[30%] text-4xl opacity-52 drop-shadow-[0_4px_8px_rgba(59,130,246,0.12)] dark:opacity-34" style={{ animation: 'hangout-float-drift 6.5s ease-in-out infinite 0.5s' }}>
          🍕
        </div>
        <div className="absolute left-[45%] top-[10%] text-2xl opacity-36 drop-shadow-[0_3px_6px_rgba(125,211,252,0.12)] dark:opacity-24" style={{ animation: 'hangout-bounce-subtle 4s ease-in-out infinite' }}>
          ✨
        </div>
        <div className="absolute right-[40%] bottom-[15%] text-2xl opacity-36 drop-shadow-[0_3px_6px_rgba(34,197,94,0.12)] dark:opacity-24" style={{ animation: 'hangout-bounce-subtle 5s ease-in-out infinite 1.5s' }}>
          💬
        </div>
        
        {/* Sharper ambient shapes */}
        <div className="absolute -left-20 top-[18%] h-48 w-48 rounded-full border border-cyan-200/55 bg-gradient-to-br from-cyan-200/20 to-blue-300/12 dark:border-cyan-400/18 dark:from-cyan-400/10 dark:to-blue-500/6" style={{ animation: 'hangout-pulse-glow 8s ease-in-out infinite' }} />
        <div className="absolute right-0 bottom-[14%] h-40 w-40 rounded-[38%] border border-fuchsia-200/45 bg-gradient-to-tl from-fuchsia-200/18 to-pink-300/10 dark:border-fuchsia-400/16 dark:from-fuchsia-400/8 dark:to-pink-500/5" style={{ animation: 'hangout-pulse-glow 7s ease-in-out infinite 2s' }} />
      </div>

      <div className="relative px-6 py-7 sm:px-7">
        {(props.onEdit || props.onDelete) ? (
          <div className="absolute right-6 top-5 z-10 flex items-center gap-2 sm:right-7">
            {props.onEdit ? (
              <button className="rounded-full border-2 border-cyan-200 bg-white/95 p-2.5 text-cyan-600 shadow-sm transition-all hover:border-cyan-300 hover:text-cyan-800 hover:shadow-md dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-200 dark:hover:bg-white/10 dark:hover:text-white" onClick={props.onEdit} type="button">
                <EditIcon />
              </button>
            ) : null}
            {props.onDelete ? (
              <button className="rounded-full border-2 border-cyan-200 bg-white/95 p-2.5 text-cyan-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-200 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400" onClick={props.onDelete} type="button">
                <TrashIcon />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={`group/header relative mx-auto max-w-[30rem] overflow-hidden rounded-[28px] border border-cyan-200/80 px-6 py-7 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-[2px] transition-all hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] dark:border-cyan-400/15 dark:backdrop-blur-[3px] ${coverImageUrl ? 'bg-white/76 dark:bg-[rgba(24,37,45,0.8)]' : 'bg-white/88 dark:bg-[rgba(24,37,45,0.84)]'}`}>
          
          {/* Shimmer effect on hover */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-500 group-hover/header:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10" style={{ 
              backgroundSize: '200% 100%',
              animation: 'hangout-shimmer 3s linear infinite'
            }} />
          </div>

          {typeof openCoverEditor === 'function' ? (
            <button
              type="button"
              onClick={openCoverEditor}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-white/92 text-cyan-600 shadow-sm transition hover:border-cyan-300 hover:bg-white hover:text-cyan-700 hover:scale-110 dark:border-white/10 dark:bg-white/10 dark:text-cyan-200 dark:hover:bg-white/15 dark:hover:text-white"
              title={coverImageUrl ? 'Change cover photo' : 'Add cover photo'}
            >
              <CameraIcon />
            </button>
          ) : null}
          <div className="relative mx-auto max-w-[24rem] rounded-[22px] border border-white/70 bg-white/72 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-[1px] dark:border-white/12 dark:bg-[rgba(2,6,23,0.28)]">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
              {duration ? (
                <span className="animate-in fade-in slide-in-from-top-2 duration-500 rounded-full border border-cyan-200 bg-gradient-to-br from-white/90 to-cyan-50/70 px-3 py-1.5 text-[11px] font-medium text-cyan-700 shadow-sm dark:border-cyan-400/20 dark:bg-gradient-to-br dark:from-white/5 dark:to-cyan-500/10 dark:text-cyan-200">
                  ⏱️ ~{duration}
                </span>
              ) : null}
            </div>

            {typeof openHeaderEditor === 'function' ? (
              <button
                type="button"
                onClick={openHeaderEditor}
                className="mx-auto block rounded-2xl px-2 py-1 text-center transition-colors hover:bg-white/30 dark:hover:bg-white/5"
              >
                <h3 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
                  {event?.title || 'Untitled hangout'}
                </h3>
              </button>
            ) : (
              <h3 className="relative text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
                {event?.title || 'Untitled hangout'}
              </h3>
            )}

            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent dark:via-cyan-300/80" />

            <div className="mt-4 space-y-2 text-[15px] text-gray-700 dark:text-gray-200">
              {typeof openHeaderEditor === 'function' ? (
                <button
                  type="button"
                  onClick={openHeaderEditor}
                  className="mx-auto block rounded-2xl px-3 py-1.5 transition-colors hover:bg-white/30 dark:hover:bg-white/5"
                >
                  <div className="font-normal">{formatEventDateTime(event?.date, event?.time)}</div>
                  {shouldShowLocationLine ? <div className="mt-1 font-normal">{event.location}</div> : null}
                </button>
              ) : (
                <>
                  <div className="font-normal">{formatEventDateTime(event?.date, event?.time)}</div>
                  {shouldShowLocationLine ? <div className="font-normal">{event.location}</div> : null}
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {event?.location ? <ActionPill href={buildMapHref(event.location)} subdued>View map</ActionPill> : null}
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
            <div className={`group/card relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${hangoutDetailSurfaceClassName}`}>
              <div className="pointer-events-none absolute right-3 top-3 text-3xl opacity-10 transition-all group-hover/card:opacity-20 group-hover/card:scale-110">
                📋
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Reservation</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{reservationName || 'Walk-in'}</div>
                </div>
              </div>
            </div>

            <div className={`group/card relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${hangoutDetailSurfaceClassName}`}>
              <div className="pointer-events-none absolute right-3 top-3 text-3xl opacity-10 transition-all group-hover/card:opacity-20 group-hover/card:scale-110">
                💰
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Bill</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{billText}</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {duration ? (
          <div className={`group/card relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${hangoutDetailSurfaceClassName}`}>
            <div className="pointer-events-none absolute right-4 top-4 text-4xl opacity-10 transition-all group-hover/card:opacity-20 group-hover/card:scale-110">
              ⏰
            </div>
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
