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

const buildMapHref = (location) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(location || '').trim())}`;

const parseScheduleItems = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [time, activity] = line.split('|').map((part) => part.trim());
      return { time: time || '', activity: activity || '' };
    })
    .filter((entry) => entry.time || entry.activity);

const resolveCelebrationStyle = (event) => {
  const text = [
    event?.title,
    event?.description,
    event?.category,
    event?.dressCode,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');

  if (/(baby shower|baby sprinkle|gender reveal|new baby|welcome baby|mom to be)/.test(text)) {
    return {
      kind: 'baby',
      label: 'Baby Shower',
      icon: '🍼',
      shell: 'border-sky-300/70 bg-gradient-to-br from-sky-50 via-cyan-50/80 to-amber-50/50 dark:border-sky-400/25 dark:from-[#172230] dark:via-[#141b27] dark:to-[#17140f]',
      header: 'border-sky-200/80 bg-gradient-to-br from-white/95 to-sky-50/60 dark:border-sky-400/15 dark:from-white/[0.04] dark:to-sky-500/[0.02]',
      iconWrap: 'border-sky-300 bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700 shadow-sky-200/40 dark:border-sky-400/30 dark:from-sky-500/15 dark:to-cyan-500/15 dark:text-sky-300 dark:shadow-sky-500/10',
      badge: 'bg-gradient-to-br from-sky-100 to-cyan-200 text-sky-800 dark:from-sky-500/15 dark:to-cyan-600/15 dark:text-sky-200',
      chip: 'border-sky-200 bg-white/90 text-sky-700 dark:border-sky-400/20 dark:bg-white/5 dark:text-sky-200',
      sectionBorder: 'border-sky-200/70 dark:border-sky-400/14',
      sectionShadow: 'shadow-[0_12px_30px_rgba(56,189,248,0.10)] hover:shadow-[0_18px_40px_rgba(56,189,248,0.16)]',
      empty: 'border-sky-200 bg-sky-50/70 text-sky-700 dark:border-sky-400/16 dark:bg-sky-500/8 dark:text-sky-200',
      invitee: 'border-sky-200 dark:border-sky-400/14',
      detailLabel: 'text-sky-600 dark:text-sky-300',
      detailSurface: 'border-sky-100 bg-white dark:border-sky-500/10 dark:bg-white/5',
      timeline: 'from-sky-200 via-cyan-200 to-sky-200 dark:from-sky-500/20 dark:via-cyan-500/20 dark:to-sky-500/20',
      motifA: '🧸',
      motifB: '☁️',
      motifC: '🍼',
    };
  }

  if (/(wedding|bridal shower|engagement|reception|ceremony|bride|groom|mrs\.|mr\.)/.test(text)) {
    return {
      kind: 'wedding',
      label: 'Wedding',
      icon: '💍',
      shell: 'border-rose-300/70 bg-gradient-to-br from-rose-50 via-pink-50/80 to-amber-50/50 dark:border-rose-400/25 dark:from-[#2d1a1f] dark:via-[#1e1517] dark:to-[#14110f]',
      header: 'border-rose-200/80 bg-gradient-to-br from-white/95 to-rose-50/60 dark:border-rose-400/15 dark:from-white/[0.04] dark:to-rose-500/[0.02]',
      iconWrap: 'border-rose-300 bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 shadow-rose-200/40 dark:border-rose-400/30 dark:from-rose-500/15 dark:to-pink-500/15 dark:text-rose-300 dark:shadow-rose-500/10',
      badge: 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-800 dark:from-rose-500/15 dark:to-rose-600/15 dark:text-rose-200',
      chip: 'border-rose-200 bg-white/90 text-rose-700 dark:border-rose-400/20 dark:bg-white/5 dark:text-rose-200',
      sectionBorder: 'border-rose-200/70 dark:border-rose-400/14',
      sectionShadow: 'shadow-[0_12px_30px_rgba(244,63,94,0.09)] hover:shadow-[0_18px_40px_rgba(244,63,94,0.14)]',
      empty: 'border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-400/16 dark:bg-rose-500/8 dark:text-rose-200',
      invitee: 'border-rose-200 dark:border-rose-400/14',
      detailLabel: 'text-rose-600 dark:text-rose-300',
      detailSurface: 'border-rose-100 bg-white dark:border-rose-500/10 dark:bg-white/5',
      timeline: 'from-rose-200 via-pink-200 to-rose-200 dark:from-rose-500/20 dark:via-pink-500/20 dark:to-rose-500/20',
      motifA: '💐',
      motifB: '✨',
      motifC: '🥂',
    };
  }

  return {
    kind: 'celebration',
    label: 'Celebration',
    icon: '✨',
    shell: 'border-rose-300/70 bg-gradient-to-br from-rose-50 via-pink-50/80 to-orange-50/50 dark:border-rose-400/25 dark:from-[#2d1a1f] dark:via-[#1e1517] dark:to-[#14110f]',
    header: 'border-rose-200/80 bg-gradient-to-br from-white/95 to-rose-50/60 dark:border-rose-400/15 dark:from-white/[0.04] dark:to-rose-500/[0.02]',
    iconWrap: 'border-rose-300 bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 shadow-rose-200/40 dark:border-rose-400/30 dark:from-rose-500/15 dark:to-pink-500/15 dark:text-rose-300 dark:shadow-rose-500/10',
    badge: 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-800 dark:from-rose-500/15 dark:to-rose-600/15 dark:text-rose-200',
    chip: 'border-rose-200 bg-white/90 text-rose-700 dark:border-rose-400/20 dark:bg-white/5 dark:text-rose-200',
    sectionBorder: 'border-rose-200/70 dark:border-rose-400/14',
    sectionShadow: 'shadow-[0_12px_30px_rgba(244,63,94,0.09)] hover:shadow-[0_18px_40px_rgba(244,63,94,0.14)]',
    empty: 'border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-400/16 dark:bg-rose-500/8 dark:text-rose-200',
    invitee: 'border-rose-200 dark:border-rose-400/14',
    detailLabel: 'text-rose-600 dark:text-rose-300',
    detailSurface: 'border-rose-100 bg-white dark:border-rose-500/10 dark:bg-white/5',
    timeline: 'from-rose-200 via-pink-200 to-rose-200 dark:from-rose-500/20 dark:via-pink-500/20 dark:to-rose-500/20',
    motifA: '✨',
    motifB: '🎀',
    motifC: '🌸',
  };
};

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

const ActionPill = ({ href, onClick, children }) => {
  const className = 'inline-flex items-center gap-1.5 rounded-full border-2 border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10';

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

const Section = ({ title, subtitle, actions, children, tone }) => (
  <div className={`group/section rounded-[22px] border bg-white/90 p-5 backdrop-blur-sm transition-all dark:bg-white/[0.06] dark:shadow-none dark:hover:bg-white/[0.08] ${tone?.sectionBorder || 'border-rose-200/70 dark:border-rose-400/14'} ${tone?.sectionShadow || 'shadow-[0_12px_30px_rgba(244,63,94,0.09)] hover:shadow-[0_18px_40px_rgba(244,63,94,0.14)]'}`}>
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

const EmptySection = ({ title, subtitle, actions, tone }) => (
  <Section title={title} subtitle={subtitle} actions={actions} tone={tone}>
    <div className={`rounded-2xl border border-dashed px-4 py-4 text-sm ${tone?.empty || 'border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-400/16 dark:bg-rose-500/8 dark:text-rose-200'}`}>
      Nothing added yet.
    </div>
  </Section>
);

const NotesSection = ({ event, onEdit, tone }) => {
  const notes = normalizeEventNotes(event);

  if (notes) {
    return (
      <Section title="Notes" actions={typeof onEdit === 'function' ? <ActionPill onClick={onEdit}>Edit</ActionPill> : null} tone={tone}>
        <div className="text-sm leading-6 text-gray-700 dark:text-gray-300">{notes}</div>
      </Section>
    );
  }

  if (typeof onEdit === 'function') {
    return <EmptySection title="Notes" subtitle="No notes added yet." actions={<ActionPill onClick={onEdit}>Add</ActionPill>} tone={tone} />;
  }

  return null;
};

const animationStyles = `
@keyframes celebration-rise-bubble {
  0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  10% { opacity: 0.3; }
  90% { opacity: 0.3; }
  100% { transform: translateY(-100vh) translateX(30px) scale(0.8); opacity: 0; }
}
@keyframes celebration-gentle-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes celebration-twinkle {
  0%, 100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.2; transform: scale(0.8) rotate(90deg); }
}
@keyframes celebration-shimmer {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}
`;

const CelebrationEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const dressCode = String(event?.dressCode || '').trim();
  const registryLink = String(event?.registryLink || '').trim();
  const schedule = Array.isArray(event?.schedule) ? event.schedule : [];
  const tone = resolveCelebrationStyle(event);

  return (
    <div className={`group relative w-full overflow-hidden rounded-[32px] border-2 transition-all duration-300 dark:shadow-none ${tone.shell} ${tone.kind === 'baby' ? 'shadow-[0_24px_80px_rgba(56,189,248,0.22)] hover:shadow-[0_28px_100px_rgba(56,189,248,0.3)]' : 'shadow-[0_24px_80px_rgba(244,63,94,0.25)] hover:shadow-[0_28px_100px_rgba(244,63,94,0.35)]'}`}>
      <style>{animationStyles}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {tone.kind === 'baby' ? (
          <>
            <div className="absolute left-[10%] top-[16%] text-[2.2rem] opacity-65 dark:opacity-50" style={{ animation: 'celebration-gentle-float 6s ease-in-out infinite' }}>{tone.motifA}</div>
            <div className="absolute right-[12%] top-[18%] text-[2rem] opacity-60 dark:opacity-46" style={{ animation: 'celebration-gentle-float 7s ease-in-out infinite 1s' }}>{tone.motifB}</div>
            <div className="absolute left-[70%] top-[68%] text-[2.1rem] opacity-62 dark:opacity-46" style={{ animation: 'celebration-gentle-float 6.8s ease-in-out infinite 0.5s' }}>{tone.motifC}</div>
            <div className="absolute left-[18%] top-[100%] h-2 w-2 rounded-full bg-gradient-to-br from-sky-200 to-cyan-200 opacity-30 dark:opacity-15" style={{ animation: 'celebration-rise-bubble 12s ease-in infinite' }} />
            <div className="absolute left-[38%] top-[100%] h-1.5 w-1.5 rounded-full bg-gradient-to-br from-cyan-200 to-sky-200 opacity-35 dark:opacity-18" style={{ animation: 'celebration-rise-bubble 10s ease-in infinite 2s' }} />
            <div className="absolute left-[58%] top-[100%] h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-200 to-sky-200 opacity-25 dark:opacity-13" style={{ animation: 'celebration-rise-bubble 14s ease-in infinite 4s' }} />
            <div className="absolute left-[78%] top-[100%] h-2 w-2 rounded-full bg-gradient-to-br from-sky-200 to-amber-200 opacity-28 dark:opacity-14" style={{ animation: 'celebration-rise-bubble 11s ease-in infinite 1s' }} />
          </>
        ) : tone.kind === 'wedding' ? (
          <>
            <div className="absolute left-[12%] top-[14%] text-[2.2rem] opacity-60 dark:opacity-46" style={{ animation: 'celebration-gentle-float 6s ease-in-out infinite' }}>{tone.motifA}</div>
            <div className="absolute right-[14%] top-[18%] text-[2rem] opacity-52 dark:opacity-38" style={{ animation: 'celebration-gentle-float 7.4s ease-in-out infinite 1s' }}>{tone.motifB}</div>
            <div className="absolute left-[74%] top-[70%] text-[2.1rem] opacity-56 dark:opacity-42" style={{ animation: 'celebration-gentle-float 6.7s ease-in-out infinite 0.4s' }}>{tone.motifC}</div>
            <div className="absolute left-[15%] top-[100%] h-2 w-2 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 opacity-30 dark:opacity-15" style={{ animation: 'celebration-rise-bubble 12s ease-in infinite' }} />
            <div className="absolute left-[35%] top-[100%] h-1.5 w-1.5 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 opacity-35 dark:opacity-18" style={{ animation: 'celebration-rise-bubble 10s ease-in infinite 2s' }} />
            <div className="absolute left-[55%] top-[100%] h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-200 to-rose-200 opacity-25 dark:opacity-13" style={{ animation: 'celebration-rise-bubble 14s ease-in infinite 4s' }} />
            <div className="absolute left-[75%] top-[100%] h-2 w-2 rounded-full bg-gradient-to-br from-rose-200 to-orange-200 opacity-28 dark:opacity-14" style={{ animation: 'celebration-rise-bubble 11s ease-in infinite 1s' }} />
          </>
        ) : (
          <>
            <div className="absolute left-[15%] top-[100%] h-2 w-2 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 opacity-30 dark:opacity-15" style={{ animation: 'celebration-rise-bubble 12s ease-in infinite' }} />
            <div className="absolute left-[35%] top-[100%] h-1.5 w-1.5 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 opacity-35 dark:opacity-18" style={{ animation: 'celebration-rise-bubble 10s ease-in infinite 2s' }} />
            <div className="absolute left-[55%] top-[100%] h-2.5 w-2.5 rounded-full bg-gradient-to-br from-orange-200 to-rose-200 opacity-25 dark:opacity-13" style={{ animation: 'celebration-rise-bubble 14s ease-in infinite 4s' }} />
            <div className="absolute left-[75%] top-[100%] h-2 w-2 rounded-full bg-gradient-to-br from-rose-200 to-orange-200 opacity-28 dark:opacity-14" style={{ animation: 'celebration-rise-bubble 11s ease-in infinite 1s' }} />
            <div className="absolute left-[25%] top-[100%] h-1 w-1 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 opacity-40 dark:opacity-20" style={{ animation: 'celebration-rise-bubble 9s ease-in infinite 5s' }} />
            <div className="absolute left-[65%] top-[100%] h-1.5 w-1.5 rounded-full bg-gradient-to-br from-rose-300 to-pink-300 opacity-32 dark:opacity-16" style={{ animation: 'celebration-rise-bubble 13s ease-in infinite 3s' }} />
          </>
        )}
      </div>

      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rotate-45 ${tone.kind === 'baby' ? 'bg-gradient-to-br from-sky-400/20 to-cyan-400/10 dark:from-sky-500/10 dark:to-cyan-500/5' : 'bg-gradient-to-br from-rose-400/20 to-pink-400/10 dark:from-rose-500/10 dark:to-pink-500/5'}`} style={{ animation: 'celebration-shimmer 3s ease-in-out infinite' }} />

      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute left-[20%] top-[25%] h-1 w-1 rotate-45 ${tone.kind === 'baby' ? 'bg-sky-400' : 'bg-rose-400'} opacity-60 dark:opacity-30`} style={{ animation: 'celebration-twinkle 4s ease-in-out infinite' }} />
        <div className={`absolute right-[25%] top-[60%] h-1.5 w-1.5 rotate-12 ${tone.kind === 'baby' ? 'bg-cyan-400' : 'bg-pink-400'} opacity-50 dark:opacity-25`} style={{ animation: 'celebration-twinkle 3.5s ease-in-out infinite 1s' }} />
        <div className={`absolute left-[70%] top-[40%] h-1 w-1 rotate-[30deg] ${tone.kind === 'baby' ? 'bg-amber-400' : 'bg-orange-400'} opacity-55 dark:opacity-28`} style={{ animation: 'celebration-twinkle 4.5s ease-in-out infinite 2s' }} />
      </div>

      <div className={`relative border-b-2 px-6 py-6 sm:px-7 ${tone.header}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-[18px] border-2 text-2xl shadow-lg transition-transform group-hover:scale-110 ${tone.iconWrap}`}
                style={{ animation: 'celebration-gentle-float 4s ease-in-out infinite' }}
              >
                {tone.icon}
              </span>

              <span className={`rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] shadow-sm ${tone.badge}`}>
                {tone.label}
              </span>

              {dressCode ? (
                <span className={`rounded-full border-2 px-3 py-1.5 text-xs font-semibold shadow-sm ${tone.chip}`}>
                  {dressCode}
                </span>
              ) : null}
            </div>

            <h3 className="text-[22px] font-bold leading-tight tracking-tight text-gray-950 dark:text-white">
              {event?.title || 'Untitled celebration'}
            </h3>

            <div className="mt-2.5 flex items-center gap-2 text-[15px] font-medium text-gray-600 dark:text-gray-300">
              <svg className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatEventDateTime(event?.date, event?.time)}</span>
            </div>

            {event?.location ? (
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 text-[15px] font-medium text-gray-600 dark:text-gray-300">
                  <svg className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{event.location}</span>
                </div>
                <ActionPill href={buildMapHref(event.location)}>View map</ActionPill>
              </div>
            ) : null}
          </div>

          {(props.onEdit || props.onDelete) ? (
            <div className="flex items-center gap-2">
              {props.onEdit ? (
                <button className="rounded-full border-2 border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white" onClick={props.onEdit} type="button">
                  <EditIcon />
                </button>
              ) : null}
              {props.onDelete ? (
                <button className="rounded-full border-2 border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400" onClick={props.onDelete} type="button">
                  <TrashIcon />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative space-y-5 px-6 py-6 sm:px-7">
        {registryLink ? (
          <a
            href={registryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group/gift relative block overflow-hidden rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-100 to-pink-100 p-5 shadow-md transition-all hover:scale-[1.02] hover:border-rose-300 hover:shadow-lg dark:border-rose-400/20 dark:from-rose-500/15 dark:to-pink-500/15"
          >
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/30 to-transparent opacity-0 transition-opacity group-hover/gift:opacity-100 dark:from-white/10" />

            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-200 to-pink-200 text-xl shadow-sm transition-transform group-hover/gift:scale-110 dark:from-rose-500/20 dark:to-pink-500/20">
                Gift
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">
                  Gift Registry
                </div>
                <div className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  View gifts and shop the registry
                </div>
              </div>
              <svg className="h-6 w-6 shrink-0 text-rose-600 transition-transform group-hover/gift:translate-x-1 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ) : (
          <EmptySection
            title="Gift Registry"
            subtitle="No registry linked yet."
            tone={tone}
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    title: 'Add Gift Registry',
                    subtitle: 'Link to Amazon, Target, Zola, or any registry.',
                    fields: [{ key: 'registryLink', label: 'Registry URL', value: '', placeholder: 'https://...' }],
                    onSave: (values) => onUpdateEventData({ registryLink: String(values.registryLink || '').trim() }),
                  })
                }
              >
                Add
              </ActionPill>
            ) : null}
          />
        )}

        <Section
          title="Event Details"
          subtitle={dressCode ? `Dress code: ${dressCode}` : 'Details for the celebration'}
          tone={tone}
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() =>
                openEditor({
                  title: 'Edit Details',
                  subtitle: 'Update dress code and celebration specifics.',
                  fields: [{ key: 'dressCode', label: 'Dress code', value: dressCode, placeholder: 'Formal, cocktail, casual...' }],
                  onSave: (values) => onUpdateEventData({ dressCode: String(values.dressCode || '').trim() }),
                })
              }
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className={`relative overflow-hidden rounded-2xl border-2 p-4 shadow-sm ${tone.detailSurface}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold ${tone.kind === 'baby' ? 'from-sky-100 to-cyan-100 text-sky-700 dark:from-sky-500/15 dark:to-cyan-500/15 dark:text-sky-200' : 'from-rose-100 to-pink-100 text-rose-700 dark:from-rose-500/15 dark:to-pink-500/15 dark:text-rose-200'}`}>
                Style
              </div>
              <div className="min-w-0 flex-1">
                <div className={`mb-1 text-xs font-bold uppercase tracking-[0.14em] ${tone.detailLabel}`}>
                  Dress Code
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {dressCode || 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {schedule.length > 0 ? (
          <Section
            title="Schedule"
            subtitle={`${schedule.length} item${schedule.length === 1 ? '' : 's'} planned`}
            tone={tone}
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    title: 'Edit Schedule',
                    subtitle: 'Timeline for the celebration.',
                    fields: [
                      {
                        key: 'schedule',
                        label: 'Schedule',
                        type: 'textarea',
                        rows: 6,
                        value: schedule.map((item) => `${item?.time || ''} | ${item?.activity || ''}`).join('\n'),
                        placeholder: '2:00 PM | Ceremony\n5:00 PM | Reception',
                      },
                    ],
                    onSave: (values) => onUpdateEventData({ schedule: parseScheduleItems(values.schedule) }),
                  })
                }
              >
                Edit
              </ActionPill>
            ) : null}
          >
            <div className="relative space-y-3">
              <div className={`absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b ${tone.timeline}`} />
              {schedule.map((item, index) => (
                <div key={`schedule-${index}`} className="relative flex items-start gap-3 pl-1">
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-rose-200 bg-white shadow-sm dark:border-rose-500/20 dark:bg-gray-900">
                    <div className="h-2 w-2 rounded-full bg-gradient-to-br from-rose-400 to-pink-400" />
                  </div>
                  <div className={`min-w-0 flex-1 rounded-xl border-2 p-3 shadow-sm ${tone.detailSurface}`}>
                    <div className={`mb-1 text-xs font-bold ${tone.detailLabel}`}>
                      {item?.time || 'Time TBD'}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item?.activity || 'Activity'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : (
          <EmptySection
            title="Schedule"
            subtitle="No timeline added yet."
            tone={tone}
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    title: 'Add Schedule',
                    subtitle: 'Create a timeline for the celebration.',
                    fields: [
                      {
                        key: 'schedule',
                        label: 'Schedule',
                        type: 'textarea',
                        rows: 6,
                        value: '',
                        placeholder: '2:00 PM | Ceremony\n5:00 PM | Reception',
                      },
                    ],
                    onSave: (values) => onUpdateEventData({ schedule: parseScheduleItems(values.schedule) }),
                  })
                }
              >
                Add
              </ActionPill>
            ) : null}
          />
        )}

        <NotesSection event={event} onEdit={onEdit} tone={tone} />

      </div>
    </div>
  );
};

export default CelebrationEventCard;
