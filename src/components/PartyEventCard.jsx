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
      d="M14.35 7.55v6.3a2.05 2.05 0 1 1-1.25-1.9V9.15l3.85-1.05v5.05A2.05 2.05 0 1 1 15.7 11.2V7.2l-1.35.35Z"
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
    <div className="rounded-2xl border border-dashed border-fuchsia-100 bg-white px-4 py-4 text-sm text-slate-600 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-300">
      Nothing added yet.
    </div>
  </Section>
);

const NotesSection = ({ event, onEdit }) => {
  const notes = normalizeEventNotes(event);

  if (notes) {
    return (
      <Section title="Notes" actions={typeof onEdit === 'function' ? <ActionPill onClick={onEdit}>Edit</ActionPill> : null}>
        <div className="text-sm leading-6 text-gray-700 dark:text-gray-300">{notes}</div>
      </Section>
    );
  }

  if (typeof onEdit === 'function') {
    return <EmptySection title="Notes" subtitle="No notes added yet." actions={<ActionPill onClick={onEdit}>Add</ActionPill>} />;
  }

  return null;
};

const InviteeRow = ({ event, label = 'Going' }) => {
  const invitees = Array.isArray(event?.invitees) ? event.invitees : [];

  return (
    <Section title={label} subtitle={`${invitees.length} ${invitees.length === 1 ? 'person' : 'people'}`}>
      <div className="flex flex-wrap gap-2.5">
        {invitees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-fuchsia-100 bg-white px-4 py-4 text-sm text-slate-600 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-300">
            No one has responded yet.
          </div>
        ) : (
          invitees.slice(0, 8).map((invitee, index) => (
            <div
              key={invitee.id || invitee.user_id || invitee.name || `${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-fuchsia-400/18 dark:bg-white/5 dark:text-gray-200"
            >
              <span className="text-base leading-none">{invitee.avatar || 'Guest'}</span>
              <span>{invitee.name || invitee.display_name || 'Guest'}</span>
            </div>
          ))
        )}
      </div>
    </Section>
  );
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
  const shouldShowLocationLine = Boolean(event?.location) && !titleText.includes('@');
  const guestSummary = guestList.length
    ? `${guestList.filter((guest) => guest?.rsvp === 'yes').length}/${guestList.length} RSVP'd yes`
    : (plusOnesAllowed ? 'Plus-ones welcome' : 'Invite only');

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

          <h3 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
            {event?.title || 'Untitled party'}
          </h3>

          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent dark:via-cyan-300/80" />

          <div className="mt-4 space-y-2 text-[15px] text-gray-600 dark:text-gray-300">
            <div className="font-medium">{formatEventDateTime(event?.date, event?.time)}</div>
            {shouldShowLocationLine ? <div className="font-medium">{event.location}</div> : null}
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
          subtitle="Everything guests should know at a glance"
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
                        subtitle: 'Set the party vibe. Think colorful, fun, and instantly recognizable.',
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
              className="rounded-2xl border border-slate-200/85 bg-white/93 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-fuchsia-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-fuchsia-400/20"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-600 dark:text-fuchsia-300">Theme</div>
              <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{theme || 'Open celebration vibe'}</div>
            </button>
            <button
              type="button"
              onClick={
                onUpdateEventData && openEditor
                  ? () =>
                      openEditor({
                        variant: 'party',
                        title: 'Guest List',
                        subtitle: 'Add your invited guests one per line. Use `name | yes` or `name | no` for RSVP status.',
                        fields: [
                          {
                            key: 'guestList',
                            label: 'Guest List',
                            type: 'textarea',
                            rows: 7,
                            value: guestList.map((guest) => `${guest?.name || ''}${guest?.rsvp && guest.rsvp !== 'pending' ? ` | ${guest.rsvp}` : ''}`).join('\n'),
                            placeholder: 'Alex | yes\nJordan | no\nTaylor',
                          },
                          { key: 'plusOnesAllowed', label: 'Allow plus-ones', type: 'toggle', value: plusOnesAllowed, toggleLabel: 'Allow plus-ones' },
                        ],
                        onSave: (values) =>
                          onUpdateEventData({
                            guestList: parseGuestListItems(values.guestList),
                            plusOnesAllowed: Boolean(values.plusOnesAllowed),
                          }),
                      })
                  : undefined
              }
              className="rounded-2xl border border-slate-200/85 bg-white/93 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-cyan-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-cyan-400/20"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Guest List</div>
              <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {guestSummary}
              </div>
              {guestList.length ? (
                <div className="mt-3 space-y-1.5">
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
                        title: 'Mood',
                        subtitle: 'Drop in a playlist or describe the soundtrack for the night.',
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
              className="rounded-2xl border border-slate-200/85 bg-white/93 px-4 py-4 text-left backdrop-blur-md transition-all hover:border-violet-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-950/55 dark:hover:border-violet-400/20"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Mood</div>
              <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {musicPlaylist ? (playlistService?.name || 'Playlist ready') : 'Set the soundtrack'}
              </div>
              {musicPlaylist ? (
                isProbablyUrl(musicPlaylist) ? (
                  <div className="mt-3 flex flex-wrap gap-2">
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
                  <div className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">{musicPlaylist}</div>
                )
              ) : null}
            </button>
          </div>
        </Section>

        {potluckItems.length > 0 ? (
          <Section
            title="Potluck"
            subtitle={`${potluckItems.length} planned item${potluckItems.length === 1 ? '' : 's'}`}
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    variant: 'party',
                    title: 'Edit Potluck',
                    subtitle: 'Use one line per item. Optional format: `dish | person`.',
                    fields: [
                      {
                        key: 'potluckItems',
                        label: 'Potluck list',
                        type: 'textarea',
                        rows: 6,
                        value: potluckItems.map((item) => `${item?.item || ''}${item?.person ? ` | ${item.person}` : ''}`).join('\n'),
                        placeholder: 'Chips | Alex',
                      },
                    ],
                    onSave: (values) => onUpdateEventData({ potluckItems: parseLineItems(values.potluckItems) }),
                  })
                }
              >
                Edit
              </ActionPill>
            ) : null}
          >
            <div className="space-y-2">
              {potluckItems.slice(0, 4).map((item, index) => (
                <div
                  key={`${item?.item || item}-${index}`}
                  className="group/item flex items-center justify-between rounded-xl border-2 border-fuchsia-100/80 bg-white px-4 py-3 text-sm shadow-sm transition-all hover:border-fuchsia-200 hover:shadow-md dark:border-fuchsia-500/10 dark:bg-white/5 dark:hover:border-fuchsia-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-gray-900 dark:text-white">{item?.item || item}</span>
                  </div>
                  <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300">
                    {item?.person || 'Unassigned'}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        ) : (
          <EmptySection
            title="Potluck"
            subtitle="No dish list added yet."
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    variant: 'party',
                    title: 'Add Potluck Items',
                    subtitle: 'Use one line per item. Optional format: `dish | person`.',
                    fields: [
                      {
                        key: 'potluckItems',
                        label: 'Potluck list',
                        type: 'textarea',
                        rows: 6,
                        value: '',
                        placeholder: 'Brownies | Jordan',
                      },
                    ],
                    onSave: (values) => onUpdateEventData({ potluckItems: parseLineItems(values.potluckItems) }),
                  })
                }
              >
                Add
              </ActionPill>
            ) : null}
          />
        )}

        <NotesSection event={event} onEdit={onEdit} />

        <InviteeRow event={event} label="Going" />
      </div>
    </div>
  );
};

export default PartyEventCard;
