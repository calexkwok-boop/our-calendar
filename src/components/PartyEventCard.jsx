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

const isProbablyUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const detectPlaylistService = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('spotify.com')) {
    return {
      name: 'Spotify',
      icon: 'Spotify',
      chipClass: 'bg-[#1ed760]/15 text-[#15803d] dark:text-[#86efac]',
    };
  }
  if (normalized.includes('music.apple.com') || normalized.includes('itunes.apple.com')) {
    return {
      name: 'Apple Music',
      icon: 'Apple',
      chipClass: 'bg-[#fa233b]/12 text-[#be123c] dark:text-[#fda4af]',
    };
  }
  return null;
};

const SpotifyIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M7.2 9.3c3.2-1 6.8-.8 9.8.6" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M8.1 12.1c2.5-.8 5.2-.6 7.5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 14.7c1.8-.5 3.8-.4 5.2.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const AppleMusicIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="apple-music-gradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ff7aa2" />
        <stop offset="0.52" stopColor="#fa233b" />
        <stop offset="1" stopColor="#b3125d" />
      </linearGradient>
    </defs>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="url(#apple-music-gradient)" />
    <path
      d="M12.98 8.08c.33-.44.56-1.03.5-1.63-.48.03-1.08.34-1.42.79-.31.39-.58 1-.5 1.57.54.04 1.1-.28 1.42-.73Zm1.98 4.92c.01-1.26 1.03-1.86 1.08-1.89-.59-.86-1.49-.98-1.81-1-.78-.08-1.52.47-1.91.47-.39 0-.98-.46-1.61-.45-.83.01-1.6.49-2.02 1.23-.86 1.49-.22 3.71.62 4.93.41.59.89 1.26 1.53 1.23.61-.02.84-.39 1.58-.39.74 0 .95.39 1.58.38.65-.01 1.06-.59 1.46-1.18.47-.69.66-1.36.67-1.39-.01-.01-1.27-.49-1.28-1.94Z"
      fill="#fff"
    />
  </svg>
);

const PlaylistServiceIcon = ({ service, className }) => {
  if (service?.name === 'Spotify') {
    return <SpotifyIcon className={className} />;
  }
  if (service?.name === 'Apple Music') {
    return <AppleMusicIcon className={className} />;
  }
  return null;
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

const parseLineItems = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [item, person] = line.split('|').map((part) => part.trim());
      return { item: item || '', person: person || '' };
    })
    .filter((entry) => entry.item);

const normalizePotluckItems = (value) =>
  Array.isArray(value)
    ? value
        .map((entry) => ({
          item: String(entry?.item || '').trim(),
          person: String(entry?.person || '').trim(),
          claimedByUserId: String(entry?.claimedByUserId || '').trim(),
        }))
        .filter((entry) => entry.item)
    : [];

const parseGuestListItems = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, status] = line.split('|').map((part) => part.trim());
      const normalizedStatus = String(status || '').trim().toLowerCase();
      let rsvp = 'pending';
      if (normalizedStatus === 'yes' || normalizedStatus === 'going') rsvp = 'yes';
      if (normalizedStatus === 'no' || normalizedStatus === 'declined') rsvp = 'no';
      return { name: name || '', rsvp };
    })
    .filter((entry) => entry.name);

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
            variant: 'party',
            title: 'Notes',
            fields: [
              {
                key: 'description',
                label: 'Notes',
                type: 'textarea',
                rows: 6,
                value: notes,
                placeholder: 'Add party notes, house rules, parking info, or anything guests should know...',
              },
            ],
            onSave: (values) =>
              onUpdateEventData({
                description: String(values.description || '').trim(),
              }),
          })
      : onEdit;

  if (notes) {
    return (
      <Section title="Notes" actions={typeof openNotesEditor === 'function' ? <ActionPill onClick={openNotesEditor}>Edit</ActionPill> : null}>
        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-100/80 bg-white/88 px-4 py-4 text-sm leading-6 text-gray-700 dark:border-white/10 dark:bg-white/[0.045] dark:text-gray-300">
          <PartyTileConfetti />
          <div className="relative">{notes}</div>
        </div>
      </Section>
    );
  }

  if (typeof openNotesEditor === 'function') {
    return <EmptySection title="Notes" actions={<ActionPill onClick={openNotesEditor}>Add</ActionPill>} />;
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
@keyframes party-card-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-4deg); }
  75% { transform: rotate(4deg); }
}
@keyframes party-card-sway {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-5px); }
}
@keyframes party-card-balloon {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.05); }
}
@keyframes party-card-bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}
`;

const PartyEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const potluckItems = Array.isArray(event?.potluckItems) ? event.potluckItems : [];
  const guestList = Array.isArray(event?.guestList) ? event.guestList.filter((guest) => String(guest?.name || '').trim()) : [];
  const theme = String(event?.theme || '').trim();
  const musicPlaylist = String(event?.musicPlaylist || '').trim();
  const playlistService = detectPlaylistService(musicPlaylist);
  const plusOnesAllowed = event?.plusOnesAllowed !== false;
  const titleText = String(event?.title || '').trim();
  const shouldShowLocationLine = Boolean(event?.location);
  const claimedPotluckCount = potluckItems.filter((item) => String(item?.claimedByUserId || item?.person || '').trim()).length;
  const openPotluckCount = Math.max(0, potluckItems.length - claimedPotluckCount);
  const potluckPreviewItems = potluckItems.slice(0, 3);
  const guestSummary = guestList.length
    ? `${guestList.filter((guest) => guest?.rsvp === 'yes').length}/${guestList.length} RSVP'd yes`
    : (plusOnesAllowed ? 'Plus-ones welcome' : 'Invite only');
  const currentUserId = String(props.currentUserId || '').trim();
  const canClaimPotluck = Boolean(props.canClaimPotluck && typeof props.onClaimPotluck === 'function');
  const openHeaderEditor =
    onUpdateEventData && openEditor
      ? () =>
          openEditor({
            variant: 'party',
            title: 'Invitation',
            fields: [
              { key: 'title', label: 'Title', value: titleText, placeholder: 'House Party @ Home' },
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

  return (
    <div className="group relative w-full overflow-hidden rounded-[32px] border-2 border-fuchsia-200/80 bg-gradient-to-br from-white via-rose-50/55 to-cyan-50/60 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(15,23,42,0.12)] dark:border-fuchsia-400/20 dark:bg-gradient-to-br dark:from-[#15111f] dark:via-[#1b1930] dark:to-[#0f1727] dark:shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
      <style>{animationStyles}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-42 dark:opacity-26">
        <div className="absolute left-6 top-12 text-[2.8rem] opacity-80 drop-shadow-[0_10px_22px_rgba(236,72,153,0.22)] dark:opacity-70" style={{ animation: 'party-card-float 8.6s ease-in-out infinite 0.2s' }}>
          🥂
        </div>
        <div className="absolute right-28 top-10 text-[2.4rem] opacity-75 drop-shadow-[0_10px_20px_rgba(6,182,212,0.2)] dark:opacity-68" style={{ animation: 'party-card-float 7.8s ease-in-out infinite 1.1s' }}>
          🎉
        </div>
        <div className="absolute left-[38%] top-6 text-[2.2rem] opacity-70 drop-shadow-[0_10px_18px_rgba(139,92,246,0.18)] dark:opacity-64" style={{ animation: 'party-card-float 9.2s ease-in-out infinite 0.7s' }}>
          🎊
        </div>
        <div className="absolute right-8 top-[8.5rem] text-[2.6rem] opacity-72 drop-shadow-[0_10px_22px_rgba(251,191,36,0.2)] dark:opacity-68" style={{ animation: 'party-card-float 8.1s ease-in-out infinite 1.8s' }}>
          🍾
        </div>
        <div className="absolute left-[8%] top-[52%] text-[2.5rem] opacity-68 drop-shadow-[0_10px_20px_rgba(251,191,36,0.22)] dark:opacity-64" style={{ animation: 'party-card-float 8.9s ease-in-out infinite 1.4s' }}>
          🍾
        </div>
        <div className="absolute right-[18%] top-[72%] text-[2.2rem] opacity-72 drop-shadow-[0_10px_20px_rgba(244,63,94,0.2)] dark:opacity-66" style={{ animation: 'party-card-float 9.5s ease-in-out infinite 0.9s' }}>
          🥂
        </div>
        <div className="absolute left-[62%] top-[12%] text-[2rem] opacity-72 drop-shadow-[0_10px_18px_rgba(217,70,239,0.18)] dark:opacity-66" style={{ animation: 'party-card-float 7.4s ease-in-out infinite 1.5s' }}>
          🎉
        </div>
        <div className="absolute left-[74%] top-[48%] text-[2rem] opacity-66 drop-shadow-[0_10px_18px_rgba(6,182,212,0.18)] dark:opacity-62" style={{ animation: 'party-card-float 8.7s ease-in-out infinite 0.6s' }}>
          🎊
        </div>
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
        <div className="absolute right-20 top-24 h-34 w-14" style={{ animation: 'party-card-bob 5.9s ease-in-out infinite 1.2s' }}>
          <div className="mx-auto h-20 w-14 rounded-full bg-gradient-to-b from-violet-200 to-violet-500 opacity-82 shadow-[0_18px_44px_rgba(139,92,246,0.22)] dark:opacity-80" />
          <div className="mx-auto h-14 w-px bg-gradient-to-b from-violet-300/75 to-transparent dark:from-violet-300/45" />
        </div>
        <div className="absolute left-[18%] top-10 h-28 w-11" style={{ animation: 'party-card-bob 6.1s ease-in-out infinite 0.4s' }}>
          <div className="mx-auto h-16 w-11 rounded-full bg-gradient-to-b from-yellow-200 to-amber-400 opacity-80 shadow-[0_12px_32px_rgba(251,191,36,0.22)] dark:opacity-78" />
          <div className="mx-auto h-12 w-px bg-gradient-to-b from-amber-300/75 to-transparent dark:from-amber-300/45" />
        </div>
        <div className="absolute left-[56%] top-[58%] h-38 w-16" style={{ animation: 'party-card-bob 6.8s ease-in-out infinite 1.6s' }}>
          <div className="mx-auto h-24 w-16 rounded-full bg-gradient-to-b from-rose-200 to-fuchsia-500 opacity-78 shadow-[0_18px_44px_rgba(244,63,94,0.2)] dark:opacity-76" />
          <div className="mx-auto h-14 w-px bg-gradient-to-b from-rose-300/75 to-transparent dark:from-rose-300/45" />
        </div>
        <div className="absolute right-[36%] top-[63%] h-32 w-14" style={{ animation: 'party-card-bob 7.1s ease-in-out infinite 0.3s' }}>
          <div className="mx-auto h-20 w-14 rounded-full bg-gradient-to-b from-cyan-200 to-sky-500 opacity-76 shadow-[0_18px_44px_rgba(59,130,246,0.18)] dark:opacity-74" />
          <div className="mx-auto h-12 w-px bg-gradient-to-b from-sky-300/75 to-transparent dark:from-sky-300/45" />
        </div>

        <div className="absolute left-[10%] top-[15%] h-4 w-4 rotate-12 rounded-sm bg-gradient-to-br from-pink-400 to-rose-400 opacity-90 dark:opacity-90" style={{ animation: 'party-card-float 8s ease-in-out infinite' }} />
        <div className="absolute left-[25%] top-[45%] h-3 w-3 rotate-45 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-90 dark:opacity-86" style={{ animation: 'party-card-float 6s ease-in-out infinite 1s' }} />
        <div className="absolute right-[15%] top-[25%] h-6 w-2 rotate-[30deg] rounded-full bg-gradient-to-b from-yellow-300 to-fuchsia-400 opacity-88 dark:opacity-84" style={{ animation: 'party-card-float 7s ease-in-out infinite 0.5s' }} />
        <div className="absolute left-[70%] top-[60%] h-3.5 w-3.5 rotate-[60deg] bg-gradient-to-br from-purple-400 to-pink-400 opacity-86 dark:opacity-84" style={{ animation: 'party-card-float 9s ease-in-out infinite 1.5s' }} />
        <div className="absolute right-[30%] top-[70%] h-4 w-4 -rotate-12 rounded-sm bg-gradient-to-br from-green-400 to-emerald-400 opacity-82 dark:opacity-82" style={{ animation: 'party-card-float 8.5s ease-in-out infinite 2s' }} />
        <div className="absolute left-[45%] top-[35%] h-3 w-3 rotate-90 bg-gradient-to-br from-fuchsia-400 to-red-400 opacity-92 dark:opacity-86" style={{ animation: 'party-card-float 7.5s ease-in-out infinite 0.8s' }} />
        <div className="absolute right-[60%] top-[80%] h-5 w-2 rotate-[15deg] rounded-full bg-gradient-to-b from-pink-400 to-purple-400 opacity-86 dark:opacity-84" style={{ animation: 'party-card-float 6.5s ease-in-out infinite 1.2s' }} />
        <div className="absolute right-[20%] top-[50%] h-3 w-3 rotate-[75deg] rounded-sm bg-gradient-to-br from-cyan-400 to-blue-400 opacity-84 dark:opacity-82" style={{ animation: 'party-card-float 8s ease-in-out infinite 2.5s' }} />
        <div className="absolute left-[15%] top-[90%] h-2.5 w-2.5 rotate-45 bg-yellow-400 opacity-100 dark:opacity-90" style={{ animation: 'party-card-twinkle 3s ease-in-out infinite' }} />
        <div className="absolute right-[25%] top-[20%] h-2 w-2 rotate-12 bg-pink-400 opacity-95 dark:opacity-88" style={{ animation: 'party-card-twinkle 2.5s ease-in-out infinite 0.5s' }} />
        <div className="absolute left-[80%] top-[75%] h-2.5 w-2.5 rotate-[30deg] bg-fuchsia-400 opacity-95 dark:opacity-88" style={{ animation: 'party-card-twinkle 3.5s ease-in-out infinite 1s' }} />
        <div className="absolute right-[75%] top-[40%] h-2 w-2 rotate-[60deg] bg-purple-400 opacity-84 dark:opacity-84" style={{ animation: 'party-card-twinkle 2.8s ease-in-out infinite 1.5s' }} />
        <div className="absolute left-[36%] top-[16%] h-2.5 w-5 rotate-[18deg] rounded-full bg-rose-300 opacity-88 dark:opacity-84" style={{ animation: 'party-card-float 7.7s ease-in-out infinite 0.3s' }} />
        <div className="absolute left-[58%] top-[22%] h-4 w-2 -rotate-[22deg] rounded-full bg-cyan-300 opacity-88 dark:opacity-84" style={{ animation: 'party-card-float 6.8s ease-in-out infinite 1.1s' }} />
        <div className="absolute left-[52%] top-[74%] h-3 w-5 rotate-[28deg] rounded-full bg-lime-300 opacity-78 dark:opacity-76" style={{ animation: 'party-card-float 7.2s ease-in-out infinite 1.8s' }} />
        <div className="absolute right-[9%] top-[62%] h-3.5 w-3.5 rotate-[35deg] rounded-sm bg-red-400 opacity-82 dark:opacity-82" style={{ animation: 'party-card-float 8.8s ease-in-out infinite 0.9s' }} />
      </div>

      <div className="relative border-b-2 border-fuchsia-200/70 bg-gradient-to-br from-white via-rose-50/40 to-cyan-50/45 px-6 py-6 dark:border-fuchsia-400/15 dark:bg-gradient-to-br dark:from-[#211533] dark:via-[#1c2740] dark:to-[#19162d] sm:px-7">
        {(props.onEdit || props.onDelete) ? (
          <div className="absolute right-6 top-6 z-10 flex items-center gap-2">
            {props.onEdit ? (
              <button
                className="rounded-full border-2 border-gray-200 bg-white/95 p-2.5 text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={props.onEdit}
                type="button"
              >
                <EditIcon />
              </button>
            ) : null}
            {props.onDelete ? (
              <button
                className="rounded-full border-2 border-gray-200 bg-white/95 p-2.5 text-gray-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                onClick={props.onDelete}
                type="button"
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mx-auto max-w-[30rem] rounded-[28px] border border-fuchsia-200/80 bg-white/78 px-6 py-7 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-[10px] dark:border-fuchsia-400/15 dark:bg-[rgba(38,28,57,0.72)] dark:backdrop-blur-[12px]">
          <div className="pointer-events-none absolute inset-0 hidden overflow-hidden dark:block">
            <div className="absolute -left-2 top-6 h-16 w-11 rounded-full bg-gradient-to-b from-fuchsia-300/45 to-pink-500/55 blur-[0.2px]" style={{ animation: 'party-card-bob 5.8s ease-in-out infinite' }} />
            <div className="absolute left-4 top-[4.5rem] h-10 w-px bg-gradient-to-b from-fuchsia-200/70 to-transparent" />
            <div className="absolute right-3 top-5 h-14 w-10 rounded-full bg-gradient-to-b from-cyan-200/40 to-cyan-500/55 blur-[0.2px]" style={{ animation: 'party-card-bob 6.4s ease-in-out infinite 0.8s' }} />
            <div className="absolute right-7 top-[4.1rem] h-9 w-px bg-gradient-to-b from-cyan-200/60 to-transparent" />
            <div className="absolute right-16 top-12 h-12 w-9 rounded-full bg-gradient-to-b from-violet-200/35 to-violet-500/45 blur-[0.2px]" style={{ animation: 'party-card-bob 6.9s ease-in-out infinite 1.2s' }} />
            <div className="absolute right-[4.7rem] top-[5rem] h-7 w-px bg-gradient-to-b from-violet-200/55 to-transparent" />
          </div>
          <div className="mb-3 flex items-center justify-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-fuchsia-700 dark:text-fuchsia-200">
              You're Invited
            </div>
          </div>

          {typeof openHeaderEditor === 'function' ? (
            <button
              type="button"
              onClick={openHeaderEditor}
              className="mx-auto block rounded-2xl px-2 py-1 text-center transition-colors hover:bg-white/30 dark:hover:bg-white/5"
            >
              <h3 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
                {event?.title || 'Untitled party'}
              </h3>
            </button>
          ) : (
            <h3 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
              {event?.title || 'Untitled party'}
            </h3>
          )}

          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent dark:via-cyan-300/80" />

          <div className="mt-4 space-y-2 text-[15px] text-gray-600 dark:text-gray-300">
            {typeof openHeaderEditor === 'function' ? (
              <button
                type="button"
                onClick={openHeaderEditor}
                className="mx-auto block rounded-2xl px-3 py-1.5 transition-colors hover:bg-white/30 dark:hover:bg-white/5"
              >
                <div className="font-medium">{formatEventDateTime(event?.date, event?.time)}</div>
                {shouldShowLocationLine ? <div className="mt-1 font-medium">{event.location}</div> : null}
              </button>
            ) : (
              <>
                <div className="font-medium">{formatEventDateTime(event?.date, event?.time)}</div>
                {shouldShowLocationLine ? <div className="font-medium">{event.location}</div> : null}
              </>
            )}
            {theme ? (
              <div className="inline-flex items-center rounded-full border border-fuchsia-200 bg-fuchsia-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-200">
                {theme}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <span className="rounded-full border border-cyan-200 bg-cyan-50/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
              {plusOnesAllowed ? 'Plus-Ones Welcome' : 'Invite Only'}
            </span>
            {event?.location ? <ActionPill href={buildMapHref(event.location)}>View map</ActionPill> : null}
          </div>
        </div>
      </div>

      <div className="relative space-y-5 px-6 py-6 sm:px-7">
        <Section
          title="Invitation Details"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={
                onUpdateEventData && openEditor
                  ? () =>
                      openEditor({
                        variant: 'party',
                        title: 'Theme',
                        fields: [
                          { key: 'theme', label: 'Theme', value: theme, placeholder: 'Game night, disco, rooftop glow...' },
                        ],
                        onSave: (values) =>
                          onUpdateEventData({
                            theme: String(values.theme || '').trim(),
                          }),
                      })
                  : undefined
              }
              className="relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white/93 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-fuchsia-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-fuchsia-400/20"
            >
              <PartyTileConfetti />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-600 dark:text-fuchsia-300">Theme</div>
              <div className="relative mt-2 text-sm font-semibold text-gray-900 dark:text-white">{theme || 'Open celebration vibe'}</div>
            </button>
            <button
              type="button"
              onClick={
                onUpdateEventData && openEditor
                  ? () =>
                      openEditor({
                        variant: 'party',
                        title: 'Guest List',
                        fields: [
                          {
                            key: 'guestList',
                            label: 'Guest List',
                            type: 'guest-list',
                            value: guestList,
                            placeholder: 'Guest name',
                          },
                          { key: 'plusOnesAllowed', label: 'Allow plus-ones', type: 'toggle', value: plusOnesAllowed, toggleLabel: 'Allow plus-ones' },
                        ],
                        onSave: (values) =>
                          onUpdateEventData({
                            guestList: Array.isArray(values.guestList)
                              ? values.guestList
                                  .map((guest) => ({
                                    name: String(guest?.name || '').trim(),
                                    rsvp: String(guest?.rsvp || 'pending').trim().toLowerCase() === 'yes'
                                      ? 'yes'
                                      : String(guest?.rsvp || 'pending').trim().toLowerCase() === 'no'
                                        ? 'no'
                                        : 'pending',
                                  }))
                                  .filter((guest) => guest.name)
                              : parseGuestListItems(values.guestList),
                            plusOnesAllowed: Boolean(values.plusOnesAllowed),
                          }),
                      })
                  : undefined
              }
              className="relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white/93 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-cyan-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-cyan-400/20"
            >
              <PartyTileConfetti />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Guest List</div>
              <div className="relative mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {guestSummary}
              </div>
              {guestList.length ? (
                <div className="relative mt-3 space-y-1.5">
                  {guestList.slice(0, 3).map((guest, index) => (
                    <div key={`${guest.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-gray-600 dark:text-gray-300">{guest.name}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-semibold uppercase tracking-[0.12em] ${
                          guest.rsvp === 'yes'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                            : guest.rsvp === 'no'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200'
                              : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                        }`}
                      >
                        {guest.rsvp === 'yes' ? 'Yes' : guest.rsvp === 'no' ? 'No' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {guestList.length > 3 ? (
                    <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      +{guestList.length - 3} more
                    </div>
                  ) : null}
                </div>
              ) : null}
            </button>
            <button
              type="button"
              onClick={
                onUpdateEventData && openEditor
                  ? () =>
                      openEditor({
                        variant: 'party',
                        title: 'Music',
                        fields: [
                          { key: 'musicPlaylist', label: 'Playlist or mood', value: musicPlaylist, placeholder: 'Spotify link, Apple Music, or a vibe note...' },
                        ],
                        onSave: (values) =>
                          onUpdateEventData({
                            musicPlaylist: String(values.musicPlaylist || '').trim(),
                          }),
                      })
                  : undefined
              }
              className="relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white/93 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-violet-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-violet-400/20"
            >
              <PartyTileConfetti />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Music</div>
              <div className="relative mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {musicPlaylist ? (playlistService?.name || 'Playlist ready') : 'Set the soundtrack'}
              </div>
              {musicPlaylist ? (
                isProbablyUrl(musicPlaylist) ? (
                  <div className="relative mt-3 flex flex-wrap gap-2">
                    <a
                      href={musicPlaylist}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-90 ${playlistService?.chipClass || 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200'}`}
                    >
                      <PlaylistServiceIcon service={playlistService} className="h-3.5 w-3.5" />
                      <span>{playlistService?.name || 'Playlist'}</span>
                    </a>
                  </div>
                ) : (
                  <div className="relative mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">{musicPlaylist}</div>
                )
              ) : null}
            </button>
          </div>
        </Section>

        {potluckItems.length > 0 ? (
          <Section
            title="Potluck"
            subtitle={`${potluckItems.length} items • ${claimedPotluckCount} claimed${openPotluckCount ? ` • ${openPotluckCount} open` : ''}`}
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    variant: 'party',
                    title: 'Potluck Signups',
                    fields: [
                      {
                        key: 'potluckItems',
                        label: 'Potluck list',
                        type: 'potluck-list',
                        value: potluckItems,
                        placeholder: 'Chips',
                      },
                    ],
                    onSave: (values) => onUpdateEventData({
                      potluckItems: Array.isArray(values.potluckItems)
                        ? normalizePotluckItems(values.potluckItems)
                        : parseLineItems(values.potluckItems),
                    }),
                  })
                }
              >
                Edit
              </ActionPill>
            ) : null}
          >
            <div className="space-y-2.5">
              {potluckPreviewItems.map((item, index) => (
                <div
                  key={`${item?.item || item}-${index}`}
                  className="group/item relative overflow-hidden flex items-center justify-between gap-3 rounded-2xl border border-fuchsia-100/80 bg-white/88 px-3.5 py-2.5 text-sm shadow-sm transition-all hover:border-fuchsia-200 hover:shadow-md dark:border-fuchsia-500/10 dark:bg-white/[0.045] dark:hover:border-fuchsia-500/20"
                >
                  <PartyTileConfetti />
                  <div className="relative min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-900 dark:text-white">{item?.item || item}</div>
                    <div className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      {item?.person ? `Claimed by ${item.person}` : 'Open signup'}
                    </div>
                  </div>
                  <div className="relative ml-2 flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                      item?.person
                        ? 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'
                    }`}>
                      {item?.person ? 'Claimed' : 'Open'}
                    </span>
                    {canClaimPotluck ? (
                      item?.claimedByUserId && item.claimedByUserId !== currentUserId ? null : (
                        <button
                          type="button"
                          onClick={() => props.onClaimPotluck?.(index)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                            item?.claimedByUserId === currentUserId
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/12 dark:text-rose-200 dark:hover:bg-rose-500/18'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-200 dark:hover:bg-emerald-500/18'
                          }`}
                        >
                          {item?.claimedByUserId === currentUserId ? 'Unclaim' : 'Claim'}
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              ))}
              {potluckItems.length > potluckPreviewItems.length ? (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateEventData && openEditor
                      ? openEditor({
                          variant: 'party',
                          title: 'Potluck Signups',
                          fields: [
                            {
                              key: 'potluckItems',
                              label: 'Potluck list',
                              type: 'potluck-list',
                              value: potluckItems,
                              placeholder: 'Chips',
                            },
                          ],
                          onSave: (values) => onUpdateEventData({
                            potluckItems: Array.isArray(values.potluckItems)
                              ? normalizePotluckItems(values.potluckItems)
                              : parseLineItems(values.potluckItems),
                          }),
                        })
                      : undefined
                  }
                  className="relative w-full overflow-hidden rounded-2xl border border-dashed border-fuchsia-200/90 bg-white/65 px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-fuchsia-700 transition hover:border-fuchsia-300 hover:bg-fuchsia-50/70 dark:border-white/10 dark:bg-white/[0.03] dark:text-fuchsia-200 dark:hover:bg-white/[0.06]"
                >
                  <PartyTileConfetti />
                  <span className="relative">+{potluckItems.length - potluckPreviewItems.length} more items</span>
                </button>
              ) : null}
            </div>
          </Section>
        ) : (
          <EmptySection
            title="Potluck"
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    variant: 'party',
                title: 'Potluck Signups',
                    fields: [
                      {
                        key: 'potluckItems',
                        label: 'Potluck list',
                        type: 'potluck-list',
                        value: [],
                        placeholder: 'Brownies',
                      },
                    ],
                    onSave: (values) => onUpdateEventData({
                      potluckItems: Array.isArray(values.potluckItems)
                        ? normalizePotluckItems(values.potluckItems)
                        : parseLineItems(values.potluckItems),
                    }),
                  })
                }
              >
                Add
              </ActionPill>
            ) : null}
          />
        )}

        <NotesSection event={event} onEdit={onEdit} onUpdateEventData={onUpdateEventData} openEditor={openEditor} />

      </div>
    </div>
  );
};

export default PartyEventCard;
