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
  <div className="group/section rounded-[22px] border border-slate-200/70 bg-white/96 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-all hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none dark:hover:bg-white/[0.08]">
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
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-300">
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
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-300">
            No one has responded yet.
          </div>
        ) : (
          invitees.slice(0, 8).map((invitee, index) => (
            <div
              key={invitee.id || invitee.user_id || invitee.name || `${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-orange-400/14 dark:bg-white/5 dark:text-gray-200"
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
  const theme = String(event?.theme || '').trim();
  const musicPlaylist = String(event?.musicPlaylist || '').trim();
  const playlistService = detectPlaylistService(musicPlaylist);
  const plusOnesAllowed = event?.plusOnesAllowed !== false;

  return (
    <div className="group relative w-full overflow-hidden rounded-[32px] border-2 border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-gradient-to-br dark:from-[#121318] dark:via-[#171923] dark:to-[#11131a] dark:shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
      <style>{animationStyles}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-2 top-24 h-24 w-16 rounded-full bg-gradient-to-b from-fuchsia-400 to-pink-500 opacity-85 shadow-[0_16px_40px_rgba(236,72,153,0.3)] dark:opacity-95" style={{ animation: 'party-card-bob 5.5s ease-in-out infinite' }} />
        <div className="absolute left-5 top-[9.5rem] h-16 w-px bg-gradient-to-b from-pink-300/90 to-transparent dark:from-pink-300/70" />
        <div className="absolute right-3 top-16 h-20 w-14 rounded-full bg-gradient-to-b from-sky-300 to-cyan-500 opacity-80 shadow-[0_16px_40px_rgba(6,182,212,0.28)] dark:opacity-90" style={{ animation: 'party-card-bob 6.3s ease-in-out infinite 0.7s' }} />
        <div className="absolute right-9 top-[7.75rem] h-16 w-px bg-gradient-to-b from-cyan-300/90 to-transparent dark:from-cyan-300/70" />
        <div className="absolute right-20 top-24 h-[4.5rem] w-12 rounded-full bg-gradient-to-b from-violet-300 to-violet-500 opacity-75 shadow-[0_16px_40px_rgba(139,92,246,0.28)] dark:opacity-90" style={{ animation: 'party-card-bob 5.9s ease-in-out infinite 1.2s' }} />
        <div className="absolute right-[5.85rem] top-[9.5rem] h-14 w-px bg-gradient-to-b from-violet-300/90 to-transparent dark:from-violet-300/70" />

        <div className="absolute left-[10%] top-[15%] h-3.5 w-3.5 rotate-12 rounded-sm bg-gradient-to-br from-pink-400 to-rose-400 opacity-75 dark:opacity-80" style={{ animation: 'party-card-float 8s ease-in-out infinite' }} />
        <div className="absolute left-[25%] top-[45%] h-2.5 w-2.5 rotate-45 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-75 dark:opacity-75" style={{ animation: 'party-card-float 6s ease-in-out infinite 1s' }} />
        <div className="absolute right-[15%] top-[25%] h-5 w-1.5 rotate-[30deg] rounded-full bg-gradient-to-b from-yellow-300 to-fuchsia-400 opacity-70 dark:opacity-75" style={{ animation: 'party-card-float 7s ease-in-out infinite 0.5s' }} />
        <div className="absolute left-[70%] top-[60%] h-3 w-3 rotate-[60deg] bg-gradient-to-br from-purple-400 to-pink-400 opacity-70 dark:opacity-74" style={{ animation: 'party-card-float 9s ease-in-out infinite 1.5s' }} />
        <div className="absolute right-[30%] top-[70%] h-3.5 w-3.5 -rotate-12 rounded-sm bg-gradient-to-br from-green-400 to-emerald-400 opacity-68 dark:opacity-72" style={{ animation: 'party-card-float 8.5s ease-in-out infinite 2s' }} />
        <div className="absolute left-[45%] top-[35%] h-2.5 w-2.5 rotate-90 bg-gradient-to-br from-fuchsia-400 to-red-400 opacity-78 dark:opacity-76" style={{ animation: 'party-card-float 7.5s ease-in-out infinite 0.8s' }} />
        <div className="absolute right-[60%] top-[80%] h-4 w-1.5 rotate-[15deg] rounded-full bg-gradient-to-b from-pink-400 to-purple-400 opacity-72 dark:opacity-74" style={{ animation: 'party-card-float 6.5s ease-in-out infinite 1.2s' }} />
        <div className="absolute right-[20%] top-[50%] h-2.5 w-2.5 rotate-[75deg] rounded-sm bg-gradient-to-br from-cyan-400 to-blue-400 opacity-70 dark:opacity-72" style={{ animation: 'party-card-float 8s ease-in-out infinite 2.5s' }} />
        <div className="absolute left-[15%] top-[90%] h-2 w-2 rotate-45 bg-yellow-400 opacity-90 dark:opacity-85" style={{ animation: 'party-card-twinkle 3s ease-in-out infinite' }} />
        <div className="absolute right-[25%] top-[20%] h-1.5 w-1.5 rotate-12 bg-pink-400 opacity-80 dark:opacity-78" style={{ animation: 'party-card-twinkle 2.5s ease-in-out infinite 0.5s' }} />
        <div className="absolute left-[80%] top-[75%] h-2 w-2 rotate-[30deg] bg-fuchsia-400 opacity-80 dark:opacity-78" style={{ animation: 'party-card-twinkle 3.5s ease-in-out infinite 1s' }} />
        <div className="absolute right-[75%] top-[40%] h-1.5 w-1.5 rotate-[60deg] bg-purple-400 opacity-72 dark:opacity-74" style={{ animation: 'party-card-twinkle 2.8s ease-in-out infinite 1.5s' }} />
        <div className="absolute left-[36%] top-[16%] h-2 w-4 rotate-[18deg] rounded-full bg-rose-300 opacity-70 dark:opacity-72" style={{ animation: 'party-card-float 7.7s ease-in-out infinite 0.3s' }} />
        <div className="absolute left-[58%] top-[22%] h-3 w-1.5 -rotate-[22deg] rounded-full bg-cyan-300 opacity-75 dark:opacity-78" style={{ animation: 'party-card-float 6.8s ease-in-out infinite 1.1s' }} />
      </div>

      <div className="relative border-b-2 border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/50 px-6 py-6 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#181b24] dark:via-[#1d2230] dark:to-[#161923] sm:px-7">
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

        <div className="mx-auto max-w-[30rem] rounded-[28px] border border-slate-200/80 bg-white px-6 py-7 text-center shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#202431]">
          <div className="mb-3 flex items-center justify-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-fuchsia-600 dark:text-fuchsia-300">
              You're Invited
            </div>
          </div>

          <h3 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-gray-950 dark:text-white sm:text-[36px]">
            {event?.title || 'Untitled party'}
          </h3>

          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent dark:via-fuchsia-400/60" />

          <div className="mt-4 space-y-2 text-[15px] text-gray-600 dark:text-gray-300">
            <div className="font-medium">{formatEventDateTime(event?.date, event?.time)}</div>
            {event?.location ? <div className="font-medium">{event.location}</div> : null}
            {theme ? (
              <div className="inline-flex items-center rounded-full border border-fuchsia-200 bg-fuchsia-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-200">
                {theme}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm dark:border-white/12 dark:bg-white/5 dark:text-slate-200">
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
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() =>
                openEditor({
                  title: 'Edit Party Setup',
                  subtitle: 'Update the party vibe and guest policy.',
                  fields: [
                    { key: 'theme', label: 'Theme', value: theme, placeholder: 'Game night, retro, rooftop...' },
                    { key: 'plusOnesAllowed', label: 'Guest style', type: 'toggle', value: plusOnesAllowed, toggleLabel: 'Allow plus-ones' },
                  ],
                  onSave: (values) =>
                    onUpdateEventData({
                      theme: String(values.theme || '').trim(),
                      plusOnesAllowed: Boolean(values.plusOnesAllowed),
                    }),
                })
              }
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-600 dark:text-fuchsia-300">Theme</div>
              <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{theme || 'Open celebration vibe'}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Guest List</div>
              <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {plusOnesAllowed ? 'Bring a plus-one' : 'Named guests only'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Mood</div>
              <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                {musicPlaylist ? 'Playlist ready' : 'Set the soundtrack'}
              </div>
            </div>
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

        {musicPlaylist ? (
          <Section
            title="Music"
            subtitle={isProbablyUrl(musicPlaylist) ? `${playlistService?.name || 'Playlist'} link ready` : musicPlaylist}
            actions={
              <>
                {isProbablyUrl(musicPlaylist) ? <ActionPill href={musicPlaylist}>Open {playlistService?.name || 'playlist'}</ActionPill> : null}
                {onUpdateEventData && openEditor ? (
                  <ActionPill
                    onClick={() =>
                      openEditor({
                        title: 'Edit Music',
                        subtitle: 'Add a playlist link or a note for the music vibe.',
                        fields: [{ key: 'musicPlaylist', label: 'Playlist', value: musicPlaylist, placeholder: 'Spotify link or DJ note' }],
                        onSave: (values) => onUpdateEventData({ musicPlaylist: String(values.musicPlaylist || '').trim() }),
                      })
                    }
                  >
                    Edit
                  </ActionPill>
                ) : null}
              </>
            }
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-purple-100 bg-white p-4 shadow-sm dark:border-purple-500/10 dark:from-purple-500/5 dark:to-pink-500/5">
              <div className="relative flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  {isProbablyUrl(musicPlaylist) ? (
                    <div className="flex flex-col gap-1.5">
                      {playlistService ? (
                        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${playlistService.chipClass}`}>
                          <span>{playlistService.icon}</span>
                          <span>{playlistService.name}</span>
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-600 dark:text-gray-400">Tap the button to open the playlist.</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{musicPlaylist}</p>
                  )}
                </div>
              </div>
            </div>
          </Section>
        ) : (
          <EmptySection
            title="Music"
            subtitle="No playlist linked yet."
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    title: 'Add Music',
                    subtitle: 'Drop in a playlist link or a note for the soundtrack.',
                    fields: [{ key: 'musicPlaylist', label: 'Playlist', value: '', placeholder: 'Spotify link or DJ note' }],
                    onSave: (values) => onUpdateEventData({ musicPlaylist: String(values.musicPlaylist || '').trim() }),
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
