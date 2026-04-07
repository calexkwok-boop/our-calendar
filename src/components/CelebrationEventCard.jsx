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

const buildRegistryOptions = (kind) => {
  const common = [
    {
      id: 'amazon',
      label: 'Amazon Registry',
      kind: 'amazon',
      href: 'https://www.amazon.com/baby-reg/benefits/summary',
      className: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]',
    },
    {
      id: 'target',
      label: 'Target Registry',
      kind: 'target',
      href: 'https://www.target.com/gift-registry/',
      className: 'border-red-300 bg-red-50 text-red-600 hover:border-red-400 hover:bg-red-100 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15',
    },
    {
      id: 'babylist',
      label: 'Babylist',
      kind: 'babylist',
      href: 'https://www.babylist.com/',
      className: 'border-teal-300 bg-teal-50 text-teal-700 hover:border-teal-400 hover:bg-teal-100 dark:border-teal-400/20 dark:bg-teal-500/10 dark:text-teal-200 dark:hover:bg-teal-500/15',
    },
  ];

  if (kind === 'baby') {
    return [
      ...common,
      {
        id: 'buybuybaby',
        label: 'buybuy BABY',
        kind: 'buybuybaby',
        href: 'https://www.buybuybaby.com/',
        className: 'border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-400 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/15',
      },
    ];
  }

  return common;
};

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
      shell: 'border-stone-300/70 bg-gradient-to-br from-white via-rose-50/55 to-amber-50/45 dark:border-stone-400/20 dark:from-[#241f1a] dark:via-[#1d1916] dark:to-[#181410]',
      header: 'border-stone-200/80 bg-gradient-to-br from-white/95 to-rose-50/45 dark:border-stone-400/15 dark:from-white/[0.04] dark:to-stone-500/[0.03]',
      iconWrap: 'border-stone-300 bg-gradient-to-br from-stone-100 to-amber-100 text-stone-700 shadow-stone-200/40 dark:border-stone-400/30 dark:from-stone-500/15 dark:to-amber-500/15 dark:text-stone-200 dark:shadow-stone-500/10',
      badge: 'bg-gradient-to-br from-stone-100 to-rose-100 text-stone-800 dark:from-stone-500/15 dark:to-rose-500/12 dark:text-stone-100',
      chip: 'border-stone-200 bg-white/92 text-stone-700 dark:border-stone-400/20 dark:bg-white/5 dark:text-stone-100',
      sectionBorder: 'border-stone-200/70 dark:border-stone-400/14',
      sectionShadow: 'shadow-[0_12px_30px_rgba(120,113,108,0.10)] hover:shadow-[0_18px_40px_rgba(120,113,108,0.16)]',
      empty: 'border-stone-200 bg-stone-50/70 text-stone-700 dark:border-stone-400/16 dark:bg-stone-500/8 dark:text-stone-100',
      invitee: 'border-stone-200 dark:border-stone-400/14',
      detailLabel: 'text-stone-700 dark:text-stone-200',
      detailSurface: 'border-stone-100 bg-white dark:border-stone-500/10 dark:bg-white/5',
      timeline: 'from-stone-200 via-rose-100 to-amber-200 dark:from-stone-500/20 dark:via-rose-500/12 dark:to-amber-500/16',
      motifA: '🧸',
      motifB: '✨',
      motifC: '🍼',
    };
  }

  if (/(wedding|bridal shower|engagement|reception|ceremony|bride|groom|mrs\.|mr\.)/.test(text)) {
    return {
      kind: 'wedding',
      label: 'Wedding',
      icon: '💍',
      shell: 'border-amber-300/75 bg-gradient-to-br from-white via-white to-amber-50/18 dark:border-amber-400/25 dark:from-[#201a12] dark:via-[#17130f] dark:to-[#120f0b]',
      header: 'border-amber-200/80 bg-gradient-to-br from-white/98 to-white/92 dark:border-amber-400/15 dark:from-white/[0.05] dark:to-white/[0.02]',
      iconWrap: 'border-amber-300 bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 shadow-amber-200/40 dark:border-amber-400/30 dark:from-amber-500/15 dark:to-yellow-500/15 dark:text-amber-200 dark:shadow-amber-500/10',
      badge: 'bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-800 dark:from-amber-500/15 dark:to-yellow-500/15 dark:text-amber-100',
      chip: 'border-amber-200 bg-white/92 text-amber-700 dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-100',
      sectionBorder: 'border-amber-200/70 dark:border-amber-400/14',
      sectionShadow: 'shadow-[0_12px_30px_rgba(245,158,11,0.10)] hover:shadow-[0_18px_40px_rgba(245,158,11,0.14)]',
      empty: 'border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-400/16 dark:bg-amber-500/8 dark:text-amber-100',
      invitee: 'border-amber-200 dark:border-amber-400/14',
      detailLabel: 'text-amber-700 dark:text-amber-200',
      detailSurface: 'border-amber-100 bg-white dark:border-amber-500/10 dark:bg-white/[0.04]',
      timeline: 'from-amber-200 via-yellow-200 to-amber-200 dark:from-amber-500/20 dark:via-yellow-500/20 dark:to-amber-500/20',
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
const CameraIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.75 8.75h2.6l1.35-2h6.6l1.35 2h2.6a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5H4.75a1.5 1.5 0 01-1.5-1.5v-7a1.5 1.5 0 011.5-1.5Z" />
    <circle cx="12" cy="13" r="3.1" strokeWidth={1.8} />
  </svg>
);

const ActionPill = ({ href, onClick, children, subdued = false, tone = null }) => {
  const palette = tone?.kind === 'wedding'
    ? {
        base: 'border-amber-200 bg-white/92 text-amber-700 dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-100',
        hover: 'hover:border-amber-300 hover:bg-amber-50/75 hover:text-amber-800 dark:hover:bg-white/10',
      }
    : tone?.kind === 'baby'
      ? {
          base: 'border-stone-200 bg-white/92 text-stone-700 dark:border-stone-400/20 dark:bg-white/5 dark:text-stone-100',
          hover: 'hover:border-stone-300 hover:bg-stone-50/75 hover:text-stone-800 dark:hover:bg-white/10',
        }
      : {
          base: 'border-rose-200 bg-white/92 text-rose-700 dark:border-rose-400/20 dark:bg-white/5 dark:text-rose-200',
          hover: 'hover:border-rose-300 hover:bg-rose-50/75 hover:text-rose-800 dark:hover:bg-white/10',
        };
  const className = subdued
    ? `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.25 text-[11px] font-medium shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${palette.base} ${palette.hover}`
    : `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${palette.base} ${palette.hover}`;

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
  <div className={`group/section rounded-[22px] border bg-white/96 p-5 backdrop-blur-sm transition-all dark:shadow-none dark:hover:bg-white/[0.08] ${tone?.sectionBorder || 'border-fuchsia-100/80 dark:border-white/10'} ${tone?.kind === 'baby' ? 'bg-gradient-to-br from-white via-sky-50/85 to-amber-50/60 dark:bg-gradient-to-br dark:from-white/[0.07] dark:via-sky-500/[0.05] dark:to-amber-500/[0.04]' : tone?.kind === 'wedding' ? 'bg-gradient-to-br from-white via-white to-amber-50/14 dark:bg-gradient-to-br dark:from-white/[0.06] dark:via-white/[0.04] dark:to-amber-500/[0.03]' : 'bg-gradient-to-br from-white via-rose-50/88 to-orange-50/55 dark:bg-gradient-to-br dark:from-white/[0.07] dark:via-rose-500/[0.05] dark:to-orange-500/[0.04]'} ${tone?.sectionShadow || 'shadow-[0_10px_26px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]'}`}>
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
    <div className={`rounded-2xl border border-dashed px-4 py-4 text-sm ${tone?.empty || 'border-fuchsia-100 bg-white text-slate-600 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-300'}`}>
      Nothing added yet.
    </div>
  </Section>
);

const NotesSection = ({ event, onEdit, tone }) => {
  const notes = normalizeEventNotes(event);
  const sectionTitle = tone?.kind === 'baby'
    ? 'Shower Notes'
    : tone?.kind === 'wedding'
      ? 'Celebration Notes'
      : 'Event Notes';

  if (notes) {
    return (
      <Section title={sectionTitle} actions={typeof onEdit === 'function' ? <ActionPill onClick={onEdit}>Edit</ActionPill> : null} tone={tone}>
        <div className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${tone?.detailSurface || 'border-fuchsia-100 bg-white dark:border-white/10 dark:bg-white/[0.05]'} text-gray-700 dark:text-gray-300`}>{notes}</div>
      </Section>
    );
  }

  if (typeof onEdit === 'function') {
    return <EmptySection title={sectionTitle} actions={<ActionPill onClick={onEdit}>Add</ActionPill>} tone={tone} />;
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

const CelebrationEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const dressCode = String(event?.dressCode || '').trim();
  const registryLink = String(event?.registryLink || '').trim();
  const schedule = Array.isArray(event?.schedule) ? event.schedule : [];
  const tone = resolveCelebrationStyle(event);
  const registryOptions = buildRegistryOptions(tone.kind);
  const titleText = String(event?.title || '').trim();
  const shouldShowLocationLine = Boolean(event?.location);
  const openHeaderEditor =
    onUpdateEventData && openEditor
      ? () =>
          openEditor({
            variant: 'celebration',
            title: 'Invitation',
            fields: [
              { key: 'title', label: 'Title', value: titleText, placeholder: 'Wedding Celebration' },
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
          variant: 'celebration',
          title: coverImageUrl ? 'Change Cover Photo' : 'Add Cover Photo',
          fields: [
            { key: 'coverImageUrl', label: 'Cover photo', type: 'image-upload', value: coverImageUrl },
          ],
          onSave: (values) => onUpdateEventData({ coverImageUrl: String(values.coverImageUrl || '').trim() || null }),
        })
    : null;

  return (
    <div className={`group relative w-full overflow-hidden rounded-[32px] border-2 border-fuchsia-200/80 bg-gradient-to-br ${tone.kind === 'baby' ? 'from-white via-stone-50/65 to-rose-50/45' : tone.kind === 'wedding' ? 'from-white via-white to-amber-50/18' : 'from-white via-rose-50/60 to-cyan-50/60'} shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(15,23,42,0.12)] dark:border-fuchsia-400/20 dark:bg-gradient-to-br ${tone.kind === 'baby' ? 'dark:from-[#241f1a] dark:via-[#1d1916] dark:to-[#181410] dark:shadow-[0_24px_80px_rgba(120,113,108,0.12)]' : tone.kind === 'wedding' ? 'dark:from-[#201a12] dark:via-[#17130f] dark:to-[#120f0b] dark:shadow-[0_24px_80px_rgba(245,158,11,0.10)]' : 'dark:from-[#171320] dark:via-[#201930] dark:to-[#111a2b] dark:shadow-[0_24px_80px_rgba(236,72,153,0.12)]'}`}>
      <style>{animationStyles}</style>
      {coverImageUrl && tone.kind !== 'wedding' ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.43] saturate-[1.12] contrast-[1.04]"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
          />
          <div className={`pointer-events-none absolute inset-0 ${coverImageUrl ? (tone.kind === 'baby' ? 'bg-gradient-to-br from-white/20 via-stone-50/10 to-rose-50/10 dark:from-[#241f1a]/34 dark:via-[#1d1916]/22 dark:to-[#181410]/28' : tone.kind === 'wedding' ? 'bg-gradient-to-br from-white/22 via-white/12 to-amber-50/06 dark:from-[#201a12]/34 dark:via-[#17130f]/22 dark:to-[#120f0b]/26' : 'bg-gradient-to-br from-white/18 via-rose-50/10 to-amber-50/10 dark:from-[#171320]/34 dark:via-[#201930]/22 dark:to-[#111a2b]/28') : (tone.kind === 'baby' ? 'bg-gradient-to-br from-white/82 via-stone-50/68 to-rose-50/62 dark:from-[#241f1a]/88 dark:via-[#1d1916]/84 dark:to-[#181410]/88' : tone.kind === 'wedding' ? 'bg-gradient-to-br from-white/90 via-white/78 to-amber-50/28 dark:from-[#201a12]/88 dark:via-[#17130f]/82 dark:to-[#120f0b]/86' : 'bg-gradient-to-br from-white/80 via-rose-50/70 to-amber-50/72 dark:from-[#171320]/88 dark:via-[#201930]/84 dark:to-[#111a2b]/88')}`} />
        </>
      ) : null}

      {tone.kind !== 'wedding' ? (
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
          <div className="absolute -left-3 top-20 h-44 w-[4.75rem]" style={{ animation: 'party-card-bob 5.5s ease-in-out infinite' }}>
            <div className="mx-auto h-28 w-[4.75rem] rounded-full bg-gradient-to-b from-fuchsia-300 to-pink-500 opacity-90 shadow-[0_18px_44px_rgba(236,72,153,0.28)] dark:opacity-88" />
            <div className="mx-auto h-16 w-px bg-gradient-to-b from-pink-300/75 to-transparent dark:from-pink-300/45" />
          </div>
          <div className="absolute right-2 top-14 h-40 w-16" style={{ animation: 'party-card-bob 6.3s ease-in-out infinite 0.7s' }}>
            <div className="mx-auto h-24 w-16 rounded-full bg-gradient-to-b from-sky-200 to-cyan-500 opacity-84 shadow-[0_18px_44px_rgba(6,182,212,0.24)] dark:opacity-82" />
            <div className="mx-auto h-16 w-px bg-gradient-to-b from-cyan-300/75 to-transparent dark:from-cyan-300/45" />
          </div>
          {tone.kind === 'baby' ? (
            <>
              <div className="absolute left-[5%] top-[60%] h-44 w-[4.6rem]" style={{ animation: 'party-card-bob 6.1s ease-in-out infinite 0.5s' }}>
                <div className="mx-auto h-28 w-[4.6rem] rounded-full bg-gradient-to-b from-rose-100 to-amber-200 opacity-88 shadow-[0_18px_44px_rgba(251,191,36,0.18)] dark:opacity-82" />
                <div className="mx-auto h-16 w-px bg-gradient-to-b from-stone-300/70 to-transparent dark:from-stone-300/35" />
              </div>
              <div className="absolute right-[7%] top-[58%] h-40 w-[4.2rem]" style={{ animation: 'party-card-bob 5.7s ease-in-out infinite 1.1s' }}>
                <div className="mx-auto h-24 w-[4.2rem] rounded-full bg-gradient-to-b from-stone-100 to-rose-200 opacity-84 shadow-[0_18px_40px_rgba(244,114,182,0.14)] dark:opacity-82" />
                <div className="mx-auto h-16 w-px bg-gradient-to-b from-stone-300/68 to-transparent dark:from-stone-300/35" />
              </div>
              <div className="absolute left-[18%] top-[79%] text-[2.2rem] opacity-70 drop-shadow-[0_10px_18px_rgba(251,191,36,0.16)] dark:opacity-64" style={{ animation: 'party-card-float 8.4s ease-in-out infinite 1.3s' }}>🎈</div>
              <div className="absolute right-[21%] top-[83%] text-[2.1rem] opacity-68 drop-shadow-[0_10px_18px_rgba(244,114,182,0.16)] dark:opacity-62" style={{ animation: 'party-card-float 9.1s ease-in-out infinite 0.8s' }}>🎉</div>
              <div className="absolute left-[44%] top-[76%] text-[1.9rem] opacity-64 drop-shadow-[0_10px_16px_rgba(214,211,209,0.18)] dark:opacity-58" style={{ animation: 'party-card-float 7.9s ease-in-out infinite 1.7s' }}>🎊</div>
              <div className="absolute left-[57%] top-[86%] text-[1.8rem] opacity-62 drop-shadow-[0_10px_16px_rgba(245,158,11,0.16)] dark:opacity-56" style={{ animation: 'party-card-float 8.8s ease-in-out infinite 0.9s' }}>✨</div>
              <div className="absolute right-[33%] top-[68%] h-10 w-28 rounded-full border-t-[5px] border-dashed border-rose-200/90 opacity-72 dark:border-rose-200/45 dark:opacity-52" style={{ transform: 'rotate(12deg)', animation: 'party-card-sway 8.1s ease-in-out infinite 0.5s' }} />
              <div className="absolute left-[31%] top-[88%] h-10 w-24 rounded-full border-t-[5px] border-dashed border-amber-200/85 opacity-68 dark:border-amber-200/40 dark:opacity-50" style={{ transform: 'rotate(-10deg)', animation: 'party-card-sway 7.7s ease-in-out infinite 1.1s' }} />
            </>
          ) : null}
        </div>
      ) : null}

      <div className="relative px-6 py-7 sm:px-7">
        {(props.onEdit || props.onDelete) ? (
          <div className="absolute right-6 top-5 z-10 flex items-center gap-2 sm:right-7">
            {props.onEdit ? (
              <button className={`rounded-full border-2 bg-white/95 p-2.5 shadow-sm transition-all hover:shadow-md dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white ${tone.kind === 'wedding' ? 'border-amber-200 text-amber-600 hover:border-amber-300 hover:text-amber-800 dark:border-amber-400/20 dark:text-amber-100' : 'border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-800 dark:border-rose-400/20 dark:text-rose-200'}`} onClick={props.onEdit} type="button">
                <EditIcon />
              </button>
            ) : null}
            {props.onDelete ? (
              <button className={`rounded-full border-2 bg-white/95 p-2.5 shadow-sm transition-all hover:shadow-md dark:bg-white/5 dark:hover:bg-white/10 ${tone.kind === 'wedding' ? 'border-amber-200 text-amber-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-400/20 dark:text-amber-100 dark:hover:border-amber-300/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-50' : 'border-rose-200 text-rose-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-rose-400/20 dark:text-rose-200 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400'}`} onClick={props.onDelete} type="button">
                <TrashIcon />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={`relative mx-auto max-w-[30rem] rounded-[28px] border px-6 py-7 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-[10px] dark:backdrop-blur-[12px] ${tone.sectionBorder || 'border-rose-200/80 dark:border-rose-400/15'} ${coverImageUrl ? 'bg-white/74' : 'bg-white/88'} ${tone.kind === 'baby' ? (coverImageUrl ? 'dark:bg-[rgba(23,34,48,0.68)]' : 'dark:bg-[rgba(23,34,48,0.76)]') : tone.kind === 'wedding' ? (coverImageUrl ? 'dark:bg-[rgba(30,24,18,0.72)]' : 'dark:bg-[rgba(30,24,18,0.82)]') : (coverImageUrl ? 'dark:bg-[rgba(38,28,57,0.68)]' : 'dark:bg-[rgba(38,28,57,0.76)]')}`}>
          {coverImageUrl && tone.kind !== 'wedding' ? (
            <>
              <div
                className="pointer-events-none absolute inset-0 rounded-[28px] bg-cover bg-center opacity-[0.48]"
                style={{ backgroundImage: `url(${coverImageUrl})` }}
              />
              <div className="pointer-events-none absolute left-5 right-5 top-5 h-[58%] rounded-[24px] bg-white/36 blur-xl dark:bg-black/18" />
              <div className={`pointer-events-none absolute inset-0 rounded-[28px] ${tone.kind === 'baby' ? 'bg-gradient-to-br from-white/28 via-white/12 to-sky-50/10 dark:from-[#341e28]/22 dark:via-[#2b2038]/12 dark:to-sky-500/[0.08]' : tone.kind === 'wedding' ? 'bg-gradient-to-br from-white/32 via-white/16 to-amber-50/06 dark:from-[#241d16]/22 dark:via-[#1d1711]/12 dark:to-yellow-500/[0.06]' : 'bg-gradient-to-br from-white/28 via-white/12 to-rose-50/10 dark:from-[#341e28]/22 dark:via-[#2b2038]/12 dark:to-amber-500/[0.08]'}`} />
            </>
          ) : null}
          {typeof openCoverEditor === 'function' ? (
            <button
              type="button"
              onClick={openCoverEditor}
              className={`absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/92 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15 dark:hover:text-white ${tone.kind === 'wedding' ? 'border-amber-200 text-amber-600 hover:border-amber-300 hover:text-amber-700 dark:text-amber-100' : 'border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700 dark:text-rose-200'}`}
              title={coverImageUrl ? 'Change cover photo' : 'Add cover photo'}
            >
              <CameraIcon />
            </button>
          ) : null}
          <div className="mx-auto max-w-[24rem] rounded-[22px] border border-white/60 bg-white/48 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-black/14">
            <div className="mb-3 flex items-center justify-center">
              <div className={`text-[15px] font-semibold ${tone.kind === 'wedding' ? 'text-amber-700 dark:text-amber-100' : tone.kind === 'baby' ? 'text-stone-700 dark:text-stone-100' : 'text-rose-700 dark:text-rose-200'}`}>
                You're Invited
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5">
              {dressCode ? (
                <span className={`rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-sm ${tone.chip}`}>
                  {dressCode}
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
                  {event?.title || 'Untitled celebration'}
                </h3>
              </button>
            ) : (
              <h3 className="relative text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
                {event?.title || 'Untitled celebration'}
              </h3>
            )}

            <div className={`mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent ${tone.kind === 'baby' ? 'via-stone-400 dark:via-stone-300/80' : tone.kind === 'wedding' ? 'via-amber-400 dark:via-amber-300/80' : 'via-rose-400 dark:via-rose-300/80'} to-transparent`} />

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
            {event?.location ? <ActionPill href={buildMapHref(event.location)} subdued tone={tone}>View map</ActionPill> : null}
          </div>
        </div>
      </div>

      <div className="relative space-y-5 px-6 py-6 sm:px-7">
        {registryLink ? (
          <a
            href={registryLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`group/gift relative block overflow-hidden rounded-2xl border p-5 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg ${tone?.detailSurface || 'border-fuchsia-200/80 bg-white/88 dark:border-white/10 dark:bg-white/[0.045]'}`}
          >
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/30 to-transparent opacity-0 transition-opacity group-hover/gift:opacity-100 dark:from-white/10" />

            <div className="relative flex items-center gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl shadow-sm transition-transform group-hover/gift:scale-110 ${tone.kind === 'wedding' ? 'from-amber-100 to-yellow-100 dark:from-amber-500/20 dark:to-yellow-500/20' : 'from-rose-200 to-pink-200 dark:from-rose-500/20 dark:to-pink-500/20'}`}>
                Gift
              </div>
              <div className="min-w-0 flex-1">
                <div className={`mb-1 text-sm font-bold uppercase tracking-[0.14em] ${tone.kind === 'wedding' ? 'text-amber-700 dark:text-amber-200' : 'text-rose-700 dark:text-rose-300'}`}>
                  Gift Registry
                </div>
                <div className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  View gifts and shop the registry
                </div>
              </div>
              <svg className={`h-6 w-6 shrink-0 transition-transform group-hover/gift:translate-x-1 ${tone.kind === 'wedding' ? 'text-amber-600 dark:text-amber-200' : 'text-rose-600 dark:text-rose-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ) : (
        <EmptySection
          title="Gift Registry"
          tone={tone}
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                tone={tone}
                onClick={() =>
                  openEditor({
                    variant: 'celebration',
                    title: 'Add Gift Registry',
                    fields: [{
                      key: 'registryLink',
                      label: 'Registry URL',
                      type: 'registry-link',
                      value: '',
                      placeholder: 'Paste a registry link...',
                      registryOptions,
                    }],
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
          tone={tone}
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              tone={tone}
              onClick={() =>
                openEditor({
                  variant: 'celebration',
                  title: 'Edit Details',
                  fields: [{ key: 'dressCode', label: 'Dress code', value: dressCode, placeholder: 'Formal, cocktail, casual...' }],
                  onSave: (values) => onUpdateEventData({ dressCode: String(values.dressCode || '').trim() }),
                })
              }
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${tone?.detailSurface || 'border-fuchsia-100/80 bg-white/88 dark:border-white/10 dark:bg-white/[0.045]'}`}>
            <div className="flex items-start gap-3">
              {!['wedding', 'baby'].includes(tone.kind) ? (
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold ${tone.kind === 'baby' ? 'from-stone-100 to-amber-50 text-stone-700 dark:from-stone-500/15 dark:to-amber-500/12 dark:text-stone-100' : 'from-rose-100 to-pink-100 text-rose-700 dark:from-rose-500/15 dark:to-pink-500/15 dark:text-rose-200'}`}>
                  Style
                </div>
              ) : null}
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
            tone={tone}
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                tone={tone}
                onClick={() =>
                  openEditor({
                    variant: 'celebration',
                    title: 'Edit Schedule',
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
                  <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-sm dark:bg-gray-900 ${tone.kind === 'wedding' ? 'border-amber-200 dark:border-amber-500/20' : 'border-rose-200 dark:border-rose-500/20'}`}>
                    <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${tone.kind === 'wedding' ? 'from-amber-400 to-yellow-400' : 'from-rose-400 to-pink-400'}`} />
                  </div>
                  <div className={`min-w-0 flex-1 rounded-xl border p-3 shadow-sm ${tone?.detailSurface || 'border-fuchsia-100/80 bg-white/88 dark:border-white/10 dark:bg-white/[0.045]'}`}>
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
            tone={tone}
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                tone={tone}
                onClick={() =>
                  openEditor({
                    variant: 'celebration',
                    title: 'Add Schedule',
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

