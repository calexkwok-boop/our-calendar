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
  if (/^(party|kids event|celebration|hangout|custom|sports)( we event)?$/.test(normalized)) return '';
  if (/^[a-z ]+ we event$/.test(normalized)) return '';
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
    ? 'inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-white/88 px-3 py-1.25 text-[11px] font-medium text-fuchsia-700 shadow-sm transition-all hover:border-fuchsia-300 hover:bg-fuchsia-50/70 hover:text-fuchsia-800 hover:shadow-md active:scale-[0.98] dark:border-fuchsia-400/20 dark:bg-white/8 dark:text-fuchsia-200 dark:hover:bg-white/12 dark:hover:text-white'
    : 'inline-flex items-center gap-1.5 rounded-full border-2 border-fuchsia-200 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-fuchsia-700 shadow-sm transition-all hover:border-fuchsia-300 hover:bg-fuchsia-50/80 hover:text-fuchsia-800 hover:shadow-md active:scale-[0.98] dark:border-fuchsia-400/20 dark:bg-white/8 dark:text-fuchsia-200 dark:hover:bg-white/12 dark:hover:text-white';

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

const PartyTileConfetti = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-55 dark:opacity-40">
    <div className="absolute left-3 top-3 h-2.5 w-2.5 rotate-12 rounded-sm bg-fuchsia-300/80 dark:bg-fuchsia-300/55" />
    <div className="absolute right-5 top-4 h-3 w-1.5 rotate-[28deg] rounded-full bg-cyan-300/80 dark:bg-cyan-300/55" />
    <div className="absolute left-[22%] top-[58%] h-2 w-4 rotate-[22deg] rounded-full bg-pink-300/75 dark:bg-pink-300/50" />
    <div className="absolute right-[28%] top-[62%] h-2.5 w-2.5 rotate-45 bg-sky-300/80 dark:bg-sky-300/55" />
    <div className="absolute left-[58%] top-[20%] h-1.5 w-5 rotate-[-18deg] rounded-full bg-fuchsia-200/75 dark:bg-fuchsia-200/45" />
    <div className="absolute left-[70%] top-[70%] h-3 w-1.5 rotate-[40deg] rounded-full bg-cyan-200/80 dark:bg-cyan-200/50" />
  </div>
);

const Section = ({ title, subtitle, actions, children }) => (
  <div className="group/section rounded-[22px] border border-fuchsia-100/80 bg-white/96 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-all hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none dark:hover:bg-white/[0.09]">
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
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-fuchsia-100 bg-white px-4 py-4 text-sm text-slate-600 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-300">
      <PartyTileConfetti />
      <div className="relative">Nothing added yet.</div>
    </div>
  </Section>
);

const NotesSection = ({ event, onEdit, onUpdateEventData, openEditor }) => {
  const notes = normalizeEventNotes(event);
  const openNotesEditor =
    onUpdateEventData && openEditor
      ? () =>
          openEditor({
            variant: 'kids',
            title: 'Parent Notes',
            fields: [
              {
                key: 'description',
                label: 'Notes',
                type: 'textarea',
                rows: 6,
                value: notes,
                placeholder: 'Add anything parents should know before drop-off or pickup...',
              },
            ],
            onSave: (values) => onUpdateEventData({ description: String(values.description || '').trim() }),
          })
      : onEdit;

  if (notes) {
    return (
      <Section title="Parent Notes" actions={typeof openNotesEditor === 'function' ? <ActionPill onClick={openNotesEditor}>Edit</ActionPill> : null}>
        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-100/80 bg-white/88 px-4 py-4 text-sm leading-6 text-gray-700 dark:border-white/10 dark:bg-white/[0.045] dark:text-gray-300">
          <PartyTileConfetti />
          <div className="relative">{notes}</div>
        </div>
      </Section>
    );
  }

  if (typeof openNotesEditor === 'function') {
    return <EmptySection title="Parent Notes" actions={<ActionPill onClick={openNotesEditor}>Add</ActionPill>} />;
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
  const parentRequired = event?.parentRequired !== false;
  const allergenAlerts = Array.isArray(event?.allergenAlerts) ? event.allergenAlerts : [];
  const registryLink = String(event?.registryLink || '').trim();
  const titleText = String(event?.title || '').trim();
  const shouldShowLocationLine = Boolean(event?.location);
  const coverImageUrl = getCardBackdropUrl(event);
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
  const openRegistryEditor = onUpdateEventData && openEditor
    ? () =>
        openEditor({
          variant: 'kids',
          title: registryLink ? 'Edit Gift Registry' : 'Add Gift Registry',
          fields: [
            {
              key: 'registryLink',
              label: 'Registry link',
              type: 'registry-link',
              value: registryLink,
              placeholder: 'Paste a registry link...',
            },
          ],
          onSave: (values) => onUpdateEventData({ registryLink: String(values.registryLink || '').trim() }),
        })
    : null;

  return (
    <div className="group relative w-full overflow-hidden rounded-[32px] border-2 border-fuchsia-200/80 bg-gradient-to-br from-white via-rose-50/55 to-cyan-50/60 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(15,23,42,0.12)] dark:border-fuchsia-400/20 dark:bg-gradient-to-br dark:from-[#15111f] dark:via-[#1b1930] dark:to-[#0f1727] dark:shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
      <style>{animationStyles}</style>
      {coverImageUrl ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.5] saturate-[1.12] contrast-[1.03]"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
          />
          <div className={`pointer-events-none absolute inset-0 ${coverImageUrl ? 'bg-gradient-to-br from-white/22 via-rose-50/12 to-cyan-50/14 dark:from-[#15111f]/34 dark:via-[#1b1930]/24 dark:to-[#0f1727]/32' : 'bg-gradient-to-br from-white/78 via-rose-50/68 to-cyan-50/70 dark:from-[#15111f]/88 dark:via-[#1b1930]/84 dark:to-[#0f1727]/88'}`} />
        </>
      ) : null}

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

      <div className={`relative border-b-2 border-fuchsia-200/70 px-6 py-6 dark:border-fuchsia-400/15 sm:px-7 ${coverImageUrl ? 'bg-white/6 dark:bg-white/[0.03]' : 'bg-gradient-to-br from-white via-rose-50/40 to-cyan-50/45 dark:bg-gradient-to-br dark:from-[#211533] dark:via-[#1c2740] dark:to-[#19162d]'}`}>
        {(props.onEdit || props.onDelete) ? (
          <div className="absolute right-6 top-6 z-10 flex items-center gap-2">
            {props.onEdit ? (
              <button
                className="rounded-full border-2 border-fuchsia-200 bg-white/95 p-2.5 text-fuchsia-600 shadow-sm transition-all hover:border-fuchsia-300 hover:text-fuchsia-800 hover:shadow-md dark:border-fuchsia-400/20 dark:bg-white/8 dark:text-fuchsia-200 dark:hover:bg-white/12 dark:hover:text-white"
                onClick={props.onEdit}
                type="button"
              >
                <EditIcon />
              </button>
            ) : null}
            {props.onDelete ? (
              <button
                className="rounded-full border-2 border-fuchsia-200 bg-white/95 p-2.5 text-fuchsia-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-fuchsia-400/20 dark:bg-white/8 dark:text-fuchsia-200 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                onClick={props.onDelete}
                type="button"
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={`relative mx-auto max-w-[30rem] rounded-[28px] border border-fuchsia-200/80 px-6 py-7 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-[10px] dark:border-fuchsia-400/15 dark:backdrop-blur-[12px] ${coverImageUrl ? 'bg-white/42 dark:bg-[rgba(38,28,57,0.44)]' : 'bg-white/82 dark:bg-[rgba(38,28,57,0.76)]'}`}>
          {typeof openCoverEditor === 'function' ? (
            <button
              type="button"
              onClick={openCoverEditor}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-fuchsia-200 bg-white/92 text-fuchsia-600 shadow-sm transition hover:border-fuchsia-300 hover:bg-white hover:text-fuchsia-700 dark:border-white/10 dark:bg-white/10 dark:text-fuchsia-200 dark:hover:bg-white/15 dark:hover:text-white"
              title={coverImageUrl ? 'Change cover photo' : 'Add cover photo'}
            >
              <CameraIcon />
            </button>
          ) : null}
          <div className="pointer-events-none absolute inset-0 hidden overflow-hidden dark:block">
            <div className="absolute -left-2 top-6 h-16 w-11 rounded-full bg-gradient-to-b from-fuchsia-300/45 to-pink-500/55 blur-[0.2px]" />
            <div className="absolute left-4 top-[4.5rem] h-10 w-px bg-gradient-to-b from-fuchsia-200/70 to-transparent" />
            <div className="absolute right-3 top-5 h-14 w-10 rounded-full bg-gradient-to-b from-cyan-200/40 to-cyan-500/55 blur-[0.2px]" />
            <div className="absolute right-7 top-[4.1rem] h-9 w-px bg-gradient-to-b from-cyan-200/60 to-transparent" />
          </div>
          <div className="mx-auto max-w-[24rem] rounded-[22px] border border-white/60 bg-white/48 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-black/14">
            <div className="mb-3 flex items-center justify-center">
              <div className="text-[15px] font-semibold text-fuchsia-700 dark:text-fuchsia-200">
                You're Invited
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
              {ageRange ? (
                <span className="inline-flex items-center rounded-full border border-fuchsia-200 bg-fuchsia-50/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-200">
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

            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent dark:via-cyan-300/80" />

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
                  {shouldShowLocationLine ? <div className="mt-1 font-normal">{event.location}</div> : null}
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="rounded-full border border-cyan-200 bg-cyan-50/88 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-700 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/12 dark:text-cyan-200">
                {parentRequired ? 'Parents Stay' : 'Drop-Off OK'}
              </span>
              {event?.location ? <ActionPill href={buildMapHref(event.location)} subdued>View map</ActionPill> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="relative space-y-5 px-6 py-6 sm:px-7">
        {registryLink ? (
          <Section
            title="Gift Registry"
            actions={openRegistryEditor ? (
              <>
                <ActionPill href={registryLink}>Open registry</ActionPill>
                <ActionPill onClick={openRegistryEditor}>Edit</ActionPill>
              </>
            ) : (
              <ActionPill href={registryLink}>Open registry</ActionPill>
            )}
          >
            <a
              href={registryLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group/gift relative block overflow-hidden rounded-2xl border border-fuchsia-100/80 bg-white/88 p-5 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg dark:border-fuchsia-500/10 dark:bg-white/[0.045] dark:hover:border-fuchsia-500/20"
            >
              <PartyTileConfetti />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-100 to-pink-100 text-sm font-semibold text-fuchsia-700 shadow-sm transition-transform group-hover/gift:scale-105 dark:from-fuchsia-500/20 dark:to-pink-500/20 dark:text-fuchsia-200">
                  🎁
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-fuchsia-700 dark:text-fuchsia-300">
                    Gift Registry
                  </div>
                  <div className="text-[15px] font-semibold text-gray-900 dark:text-white">
                    See what they would love
                  </div>
                </div>
                <svg className="h-6 w-6 shrink-0 text-fuchsia-600 transition-transform group-hover/gift:translate-x-1 dark:text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          </Section>
        ) : (
          <EmptySection title="Gift Registry" actions={openRegistryEditor ? <ActionPill onClick={openRegistryEditor}>Add</ActionPill> : null} />
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white/93 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-cyan-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-cyan-400/20">
              <PartyTileConfetti />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Supervision</div>
              <div className="relative mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {parentRequired ? 'Parents stay' : 'Drop-off OK'}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white/93 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-fuchsia-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-fuchsia-400/20">
              <PartyTileConfetti />
              <div className={`text-[11px] font-bold uppercase tracking-[0.18em] ${allergenAlerts.length > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                Allergies
              </div>
              <div className="relative mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {allergenAlerts.length > 0 ? `No ${allergenAlerts.join(', ')}` : 'None noted'}
              </div>
            </div>
          </div>
        </Section>

        <NotesSection event={event} onEdit={onEdit} onUpdateEventData={onUpdateEventData} openEditor={openEditor} />
      </div>
    </div>
  );
};

export default KidsEventCard;
