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

const normalizeList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

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
    ? 'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/88 px-3 py-1.25 text-[11px] font-medium text-amber-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50/70 hover:shadow-md active:scale-[0.98] dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10'
    : 'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/92 px-3.5 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50/75 hover:shadow-md active:scale-[0.98] dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10';

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

const kidsSectionClassName = 'rounded-[22px] border border-amber-200/75 bg-gradient-to-br from-white via-amber-50/88 to-sky-50/70 p-5 shadow-[0_12px_30px_rgba(251,191,36,0.10)] backdrop-blur-sm transition-all hover:shadow-[0_18px_40px_rgba(56,189,248,0.12)] dark:border-amber-400/18 dark:bg-gradient-to-br dark:from-white/[0.07] dark:via-amber-500/[0.05] dark:to-sky-500/[0.05] dark:hover:bg-white/[0.08]';
const kidsDetailSurfaceClassName = 'border-amber-200/75 bg-white/88 dark:border-amber-400/16 dark:bg-white/[0.05]';
const kidsEmptyClassName = 'border-amber-200/75 bg-amber-50/75 text-amber-800 dark:border-amber-400/16 dark:bg-amber-500/8 dark:text-amber-100';

const Section = ({ title, subtitle, actions, children }) => (
  <div className={`group/section ${kidsSectionClassName}`}>
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
    <div className={`rounded-2xl border border-dashed px-4 py-4 text-sm ${kidsEmptyClassName}`}>
      Nothing added yet.
    </div>
  </Section>
);

const NotesSection = ({ event, onEdit }) => {
  const notes = normalizeEventNotes(event);
  const sectionTitle = 'Parent Notes';

  if (notes) {
    return (
      <Section title={sectionTitle} actions={typeof onEdit === 'function' ? <ActionPill onClick={onEdit}>Edit</ActionPill> : null}>
        <div className={`rounded-2xl border px-4 py-4 text-sm leading-6 text-gray-700 dark:text-gray-300 ${kidsDetailSurfaceClassName}`}>{notes}</div>
      </Section>
    );
  }

  if (typeof onEdit === 'function') {
    return <EmptySection title={sectionTitle} actions={<ActionPill onClick={onEdit}>Add</ActionPill>} />;
  }

  return null;
};

const animationStyles = `
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

const KidsEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const ageRange = String(event?.ageRange || '').trim();
  const activity = String(event?.activity || '').trim();
  const parentRequired = event?.parentRequired !== false;
  const allergenAlerts = Array.isArray(event?.allergenAlerts) ? event.allergenAlerts : [];
  const registryLink = String(event?.registryLink || '').trim();
  const titleText = String(event?.title || '').trim();
  const shouldShowLocationLine = Boolean(event?.location);
  const openHeaderEditor =
    onUpdateEventData && openEditor
      ? () =>
          openEditor({
            variant: 'kids',
            title: 'Invitation',
            fields: [
              { key: 'title', label: 'Title', value: titleText, placeholder: 'Kids Birthday Party' },
              { key: 'date', label: 'Date', value: String(event?.date || '').trim(), placeholder: '2026-04-12' },
              { key: 'time', label: 'Time', value: String(event?.time || '').trim(), placeholder: '2:00 PM' },
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
          variant: 'kids',
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
      {coverImageUrl ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.43] saturate-[1.12] contrast-[1.04]"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
          />
          <div className={`pointer-events-none absolute inset-0 ${coverImageUrl ? 'bg-gradient-to-br from-white/18 via-amber-50/10 to-sky-50/10 dark:from-[#171320]/34 dark:via-[#1d1a30]/22 dark:to-[#111a2b]/28' : 'bg-gradient-to-br from-white/78 via-amber-50/68 to-sky-50/72 dark:from-[#171320]/88 dark:via-[#1d1a30]/84 dark:to-[#111a2b]/88'}`} />
        </>
      ) : null}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[7%] top-[11%] text-[1.9rem] opacity-65 dark:opacity-38">🎈</div>
        <div className="absolute right-[10%] top-[12%] text-[1.8rem] opacity-60 dark:opacity-34">🧸</div>
        <div className="absolute right-[18%] top-[31%] text-[1.85rem] opacity-45 dark:opacity-26">🎠</div>
        <div className="absolute left-[76%] top-[62%] text-[1.8rem] opacity-55 dark:opacity-32">🖍️</div>
        <div className="absolute left-[10%] bottom-[14%] text-[1.7rem] opacity-55 dark:opacity-32">🧩</div>
        <div className="absolute left-[14%] bottom-[31%] text-[1.7rem] opacity-42 dark:opacity-24">🎠</div>
        <div className="absolute left-[38%] top-[8%] text-[1.85rem] opacity-52 dark:opacity-30">🎨</div>
        <div className="absolute right-[6%] top-[54%] text-[1.75rem] opacity-46 dark:opacity-28">🫧</div>
        <div className="absolute left-[28%] top-[58%] text-[1.8rem] opacity-44 dark:opacity-28">🎪</div>
        <div className="absolute left-[62%] top-[22%] text-[1.7rem] opacity-42 dark:opacity-26">⭐</div>

        <div className="absolute right-[24%] top-[8%] text-[1.8rem] opacity-44 dark:opacity-28">🎉</div>
        <div className="absolute left-[8%] top-[42%] text-[1.75rem] opacity-42 dark:opacity-24">✨</div>
        <div className="absolute left-[56%] top-[18%] text-[1.7rem] opacity-40 dark:opacity-24">🌈</div>
        <div className="absolute left-[84%] top-[30%] text-[1.8rem] opacity-44 dark:opacity-28">🎊</div>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[22%] top-[23%] h-2.5 w-2.5 rotate-12 rounded-sm bg-amber-200/70 dark:bg-amber-300/20" />
        <div className="absolute right-[18%] top-[58%] h-2 w-2 rounded-full bg-sky-200/80 dark:bg-sky-300/20" />
        <div className="absolute left-[70%] top-[32%] h-2.5 w-2.5 rotate-45 rounded-sm bg-rose-200/70 dark:bg-rose-300/20" />
        <div className="absolute left-[42%] top-[18%] h-3 w-5 rotate-[22deg] rounded-full bg-yellow-200/70 dark:bg-yellow-300/18" />
        <div className="absolute right-[24%] top-[28%] h-2.5 w-2.5 rotate-45 rounded-sm bg-amber-200/70 dark:bg-amber-300/18" />
        <div className="absolute left-[58%] top-[72%] h-2 w-2 rounded-full bg-pink-200/75 dark:bg-pink-300/18" />
      </div>

      <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-300/18 to-yellow-300/8 blur-2xl dark:from-amber-400/10 dark:to-yellow-400/5" />
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-sky-300/16 to-cyan-300/8 blur-2xl dark:from-sky-400/10 dark:to-cyan-400/5" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-42 dark:opacity-26">
        <div className="absolute left-6 top-12 text-[2.8rem] opacity-80 drop-shadow-[0_10px_22px_rgba(236,72,153,0.22)] dark:opacity-70" style={{ animation: 'party-card-float 8.6s ease-in-out infinite 0.2s' }}>🥂</div>
        <div className="absolute right-28 top-10 text-[2.4rem] opacity-75 drop-shadow-[0_10px_20px_rgba(6,182,212,0.2)] dark:opacity-68" style={{ animation: 'party-card-float 7.8s ease-in-out infinite 1.1s' }}>🎉</div>
        <div className="absolute left-[38%] top-6 text-[2.2rem] opacity-70 drop-shadow-[0_10px_18px_rgba(139,92,246,0.18)] dark:opacity-64" style={{ animation: 'party-card-float 9.2s ease-in-out infinite 0.7s' }}>🎊</div>
        <div className="absolute right-8 top-[8.5rem] text-[2.6rem] opacity-72 drop-shadow-[0_10px_22px_rgba(251,191,36,0.2)] dark:opacity-68" style={{ animation: 'party-card-float 8.1s ease-in-out infinite 1.8s' }}>🍾</div>
        <div className="absolute left-[8%] top-[52%] text-[2.5rem] opacity-68 drop-shadow-[0_10px_20px_rgba(251,191,36,0.22)] dark:opacity-64" style={{ animation: 'party-card-float 8.9s ease-in-out infinite 1.4s' }}>🍾</div>
        <div className="absolute right-[18%] top-[72%] text-[2.2rem] opacity-72 drop-shadow-[0_10px_20px_rgba(244,63,94,0.2)] dark:opacity-66" style={{ animation: 'party-card-float 9.5s ease-in-out infinite 0.9s' }}>🥂</div>
        <div className="absolute left-[62%] top-[12%] text-[2rem] opacity-72 drop-shadow-[0_10px_18px_rgba(217,70,239,0.18)] dark:opacity-66" style={{ animation: 'party-card-float 7.4s ease-in-out infinite 1.5s' }}>🎉</div>
        <div className="absolute left-[74%] top-[48%] text-[2rem] opacity-66 drop-shadow-[0_10px_18px_rgba(6,182,212,0.18)] dark:opacity-62" style={{ animation: 'party-card-float 8.7s ease-in-out infinite 0.6s' }}>🎊</div>
        <div className="absolute left-[12%] top-[32%] h-10 w-24 rounded-full border-t-[5px] border-dashed border-fuchsia-300/90 opacity-80 dark:border-fuchsia-300/60 dark:opacity-60" style={{ transform: 'rotate(-12deg)', animation: 'party-card-sway 7.4s ease-in-out infinite' }} />
        <div className="absolute right-[14%] top-[34%] h-10 w-24 rounded-full border-t-[5px] border-dashed border-cyan-300/90 opacity-80 dark:border-cyan-300/60 dark:opacity-60" style={{ transform: 'rotate(14deg)', animation: 'party-card-sway 8.2s ease-in-out infinite 0.9s' }} />
        <div className="absolute left-[28%] top-[73%] h-10 w-28 rounded-full border-t-[5px] border-dashed border-amber-300/90 opacity-75 dark:border-amber-300/55 dark:opacity-58" style={{ transform: 'rotate(10deg)', animation: 'party-card-sway 8.8s ease-in-out infinite 0.6s' }} />
        <div className="absolute left-[52%] top-[28%] h-12 w-32 rounded-full border-t-[5px] border-dashed border-violet-300/90 opacity-78 dark:border-violet-300/55 dark:opacity-58" style={{ transform: 'rotate(-8deg)', animation: 'party-card-sway 7.8s ease-in-out infinite 1.2s' }} />
        <div className="absolute right-[24%] top-[82%] h-10 w-24 rounded-full border-t-[5px] border-dashed border-rose-300/90 opacity-75 dark:border-rose-300/55 dark:opacity-56" style={{ transform: 'rotate(-14deg)', animation: 'party-card-sway 8.6s ease-in-out infinite 0.4s' }} />
      </div>

      <div className="relative px-6 py-7 sm:px-7">
        {(props.onEdit || props.onDelete) ? (
          <div className="absolute right-6 top-5 z-10 flex items-center gap-2 sm:right-7">
            {props.onEdit ? (
              <button className="rounded-full border-2 border-amber-200 bg-white/95 p-2.5 text-amber-600 shadow-sm transition-all hover:border-amber-300 hover:text-amber-800 hover:shadow-md dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10 dark:hover:text-white" onClick={props.onEdit} type="button">
                <EditIcon />
              </button>
            ) : null}
            {props.onDelete ? (
              <button className="rounded-full border-2 border-amber-200 bg-white/95 p-2.5 text-amber-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400" onClick={props.onDelete} type="button">
                <TrashIcon />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={`relative mx-auto max-w-[30rem] rounded-[28px] border border-amber-200/80 px-6 py-7 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-[10px] dark:border-amber-400/15 dark:backdrop-blur-[12px] ${coverImageUrl ? 'bg-white/68 dark:bg-[rgba(43,35,23,0.68)]' : 'bg-white/82 dark:bg-[rgba(43,35,23,0.76)]'}`}>
          {coverImageUrl ? (
            <>
              <div
                className="pointer-events-none absolute inset-0 rounded-[28px] bg-cover bg-center opacity-[0.5]"
                style={{ backgroundImage: `url(${coverImageUrl})` }}
              />
              <div className="pointer-events-none absolute left-5 right-5 top-5 h-[58%] rounded-[24px] bg-white/36 blur-xl dark:bg-black/18" />
              <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/28 via-white/12 to-amber-50/10 dark:from-[#352919]/22 dark:via-[#2a2037]/12 dark:to-sky-500/[0.08]" />
            </>
          ) : null}
          {typeof openCoverEditor === 'function' ? (
            <button
              type="button"
              onClick={openCoverEditor}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-white/92 text-amber-600 shadow-sm transition hover:border-amber-300 hover:bg-white hover:text-amber-700 dark:border-white/10 dark:bg-white/10 dark:text-amber-200 dark:hover:bg-white/15 dark:hover:text-white"
              title={coverImageUrl ? 'Change cover photo' : 'Add cover photo'}
            >
              <CameraIcon />
            </button>
          ) : null}
          <div className="mx-auto max-w-[24rem] rounded-[22px] border border-white/60 bg-white/48 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-black/14">
            <div className="mb-3 flex items-center justify-center">
              <div className="text-[15px] font-semibold text-amber-700 dark:text-amber-200">
                You're Invited
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
              {ageRange ? (
                <span className="rounded-full border border-amber-200 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-amber-700 shadow-sm dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200">
                  Ages {ageRange}
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
                  {event?.title || 'Untitled kids event'}
                </h3>
              </button>
            ) : (
              <h3 className="relative text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
                {event?.title || 'Untitled kids event'}
              </h3>
            )}

            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent dark:via-sky-300/80" />

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
        {activity ? (
        <Section
          title="Main Activity"
          actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    variant: 'kids',
                    title: 'Edit Activity',
                    fields: [
                      { key: 'activity', label: 'Activity', value: activity, placeholder: 'Face painting, bounce house...' },
                      { key: 'ageRange', label: 'Age range', value: ageRange, placeholder: '5-8' },
                    ],
                    onSave: (values) =>
                      onUpdateEventData({
                        activity: String(values.activity || '').trim(),
                        ageRange: String(values.ageRange || '').trim(),
                      }),
                  })
                }
              >
                Edit
              </ActionPill>
            ) : null}
          >
            <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${kidsDetailSurfaceClassName}`}>
              <div className="relative flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 text-sm font-semibold text-amber-700 shadow-sm dark:from-amber-500/15 dark:to-yellow-500/15 dark:text-amber-200">
                  Fun
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{activity}</div>
                </div>
              </div>
            </div>
          </Section>
        ) : (
        <EmptySection
          title="Main Activity"
          actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    variant: 'kids',
                    title: 'Add Activity',
                    fields: [
                      { key: 'activity', label: 'Activity', value: '', placeholder: 'Face painting, bounce house...' },
                      { key: 'ageRange', label: 'Age range', value: ageRange, placeholder: '5-8' },
                    ],
                    onSave: (values) =>
                      onUpdateEventData({
                        activity: String(values.activity || '').trim(),
                        ageRange: String(values.ageRange || '').trim(),
                      }),
                  })
                }
              >
                Add
              </ActionPill>
            ) : null}
          />
        )}

        <Section
          title="Parent Notes"
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() =>
                openEditor({
                  variant: 'kids',
                  title: 'Edit Parent Notes',
                  fields: [
                    { key: 'allergenAlerts', label: 'Allergy notes', value: allergenAlerts.join(', '), placeholder: 'peanuts, dairy, gluten' },
                    { key: 'parentRequired', label: 'Supervision', type: 'toggle', value: parentRequired, toggleLabel: 'Parents should stay' },
                  ],
                  onSave: (values) =>
                    onUpdateEventData({
                      allergenAlerts: normalizeList(values.allergenAlerts),
                      parentRequired: Boolean(values.parentRequired),
                    }),
                })
              }
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${kidsDetailSurfaceClassName}`}>
              <div className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Supervision</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {parentRequired ? 'Parents stay' : 'Drop-off OK'}
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${
              allergenAlerts.length > 0
                ? kidsDetailSurfaceClassName
                : kidsDetailSurfaceClassName
            }`}>
              <div className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className={`mb-1 text-xs font-bold uppercase tracking-[0.14em] ${
                    allergenAlerts.length > 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                    Allergies
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {allergenAlerts.length > 0 ? `No ${allergenAlerts.join(', ')}` : 'None noted'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {registryLink ? (
          <a
            href={registryLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`group/gift relative block overflow-hidden rounded-2xl border p-5 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg ${kidsDetailSurfaceClassName}`}
          >
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 text-sm font-semibold text-purple-700 shadow-sm transition-transform group-hover/gift:scale-105 dark:from-purple-500/20 dark:to-pink-500/20 dark:text-purple-200">
                🎁
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-purple-700 dark:text-purple-300">
                  Birthday Wishlist
                </div>
                <div className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  See what they would love
                </div>
              </div>
              <svg className="h-6 w-6 shrink-0 text-purple-600 transition-transform group-hover/gift:translate-x-1 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ) : null}

        <NotesSection event={event} onEdit={onEdit} />

      </div>
    </div>
  );
};

export default KidsEventCard;

