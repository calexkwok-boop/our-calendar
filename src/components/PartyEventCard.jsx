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
  <div className="group/section rounded-[22px] border border-orange-200/70 bg-white/88 p-5 shadow-[0_10px_26px_rgba(251,146,60,0.09)] backdrop-blur-sm transition-all hover:shadow-[0_16px_36px_rgba(251,146,60,0.14)] dark:border-orange-400/14 dark:bg-white/[0.06] dark:shadow-none dark:hover:bg-white/[0.08]">
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
    <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/70 px-4 py-4 text-sm text-orange-700 dark:border-orange-400/16 dark:bg-orange-500/8 dark:text-orange-200">
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
          <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/70 px-4 py-4 text-sm text-orange-700 dark:border-orange-400/16 dark:bg-orange-500/8 dark:text-orange-200">
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
`;

const PartyEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const potluckItems = Array.isArray(event?.potluckItems) ? event.potluckItems : [];
  const theme = String(event?.theme || '').trim();
  const musicPlaylist = String(event?.musicPlaylist || '').trim();
  const playlistService = detectPlaylistService(musicPlaylist);
  const plusOnesAllowed = event?.plusOnesAllowed !== false;

  return (
    <div className="group relative flex min-h-full flex-col overflow-hidden rounded-[32px] border-2 border-orange-300/70 bg-gradient-to-br from-orange-50 via-amber-50/80 to-yellow-50/55 shadow-[0_24px_80px_rgba(251,146,60,0.25)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(251,146,60,0.35)] dark:border-orange-400/25 dark:from-[#2d1f14] dark:via-[#1c150f] dark:to-[#13110e] dark:shadow-none">
      <style>{animationStyles}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[15%] h-3 w-3 rotate-12 rounded-sm bg-gradient-to-br from-pink-400 to-rose-400 opacity-40 dark:opacity-20" style={{ animation: 'party-card-float 8s ease-in-out infinite' }} />
        <div className="absolute left-[25%] top-[45%] h-2 w-2 rotate-45 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-50 dark:opacity-25" style={{ animation: 'party-card-float 6s ease-in-out infinite 1s' }} />
        <div className="absolute right-[15%] top-[25%] h-4 w-1 rotate-[30deg] rounded-full bg-gradient-to-b from-yellow-400 to-orange-400 opacity-40 dark:opacity-20" style={{ animation: 'party-card-float 7s ease-in-out infinite 0.5s' }} />
        <div className="absolute left-[70%] top-[60%] h-2.5 w-2.5 rotate-[60deg] bg-gradient-to-br from-purple-400 to-pink-400 opacity-40 dark:opacity-20" style={{ animation: 'party-card-float 9s ease-in-out infinite 1.5s' }} />
        <div className="absolute right-[30%] top-[70%] h-3 w-3 -rotate-12 rounded-sm bg-gradient-to-br from-green-400 to-emerald-400 opacity-35 dark:opacity-18" style={{ animation: 'party-card-float 8.5s ease-in-out infinite 2s' }} />
        <div className="absolute left-[45%] top-[35%] h-2 w-2 rotate-90 bg-gradient-to-br from-orange-400 to-red-400 opacity-45 dark:opacity-22" style={{ animation: 'party-card-float 7.5s ease-in-out infinite 0.8s' }} />
        <div className="absolute right-[60%] top-[80%] h-3 w-1 rotate-[15deg] rounded-full bg-gradient-to-b from-pink-400 to-purple-400 opacity-40 dark:opacity-20" style={{ animation: 'party-card-float 6.5s ease-in-out infinite 1.2s' }} />
        <div className="absolute right-[20%] top-[50%] h-2 w-2 rotate-[75deg] rounded-sm bg-gradient-to-br from-cyan-400 to-blue-400 opacity-38 dark:opacity-19" style={{ animation: 'party-card-float 8s ease-in-out infinite 2.5s' }} />
        <div className="absolute left-[15%] top-[90%] h-1.5 w-1.5 rotate-45 bg-yellow-400 opacity-60 dark:opacity-30" style={{ animation: 'party-card-twinkle 3s ease-in-out infinite' }} />
        <div className="absolute right-[25%] top-[20%] h-1 w-1 rotate-12 bg-pink-400 opacity-50 dark:opacity-25" style={{ animation: 'party-card-twinkle 2.5s ease-in-out infinite 0.5s' }} />
        <div className="absolute left-[80%] top-[75%] h-1.5 w-1.5 rotate-[30deg] bg-orange-400 opacity-55 dark:opacity-28" style={{ animation: 'party-card-twinkle 3.5s ease-in-out infinite 1s' }} />
        <div className="absolute right-[75%] top-[40%] h-1 w-1 rotate-[60deg] bg-purple-400 opacity-45 dark:opacity-23" style={{ animation: 'party-card-twinkle 2.8s ease-in-out infinite 1.5s' }} />
      </div>

      <div className="pointer-events-none absolute right-6 top-0 h-32 w-0.5 bg-gradient-to-b from-orange-300/40 to-transparent dark:from-orange-400/20" style={{ animation: 'party-card-sway 4s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute right-5 top-[-8px] h-6 w-6 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 opacity-80 shadow-lg dark:opacity-60" style={{ animation: 'party-card-balloon 6s ease-in-out infinite' }} />

      <div className="relative border-b-2 border-orange-200/80 bg-gradient-to-br from-white/95 to-orange-50/60 px-6 py-6 dark:border-orange-400/15 dark:from-white/[0.04] dark:to-orange-500/[0.02] sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] border-2 border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 text-2xl shadow-lg shadow-orange-200/40 transition-transform group-hover:scale-110 group-hover:rotate-12 dark:border-orange-400/30 dark:from-orange-500/15 dark:to-amber-500/15 dark:shadow-orange-500/10"
                style={{ animation: 'party-card-wiggle 2s ease-in-out infinite' }}
              >
                Party
              </span>
              <span className="rounded-full bg-gradient-to-br from-orange-100 to-orange-200 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-orange-800 shadow-sm dark:from-orange-500/15 dark:to-orange-600/15 dark:text-orange-200">
                Party
              </span>
              {theme ? (
                <span className="rounded-full border-2 border-orange-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm dark:border-orange-400/20 dark:bg-white/5 dark:text-orange-200">
                  {theme}
                </span>
              ) : null}
            </div>

            <h3 className="text-[22px] font-bold leading-tight tracking-tight text-gray-950 dark:text-white">
              {event?.title || 'Untitled party'}
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
                <button
                  className="rounded-full border-2 border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={props.onEdit}
                  type="button"
                >
                  <EditIcon />
                </button>
              ) : null}
              {props.onDelete ? (
                <button
                  className="rounded-full border-2 border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  onClick={props.onDelete}
                  type="button"
                >
                  <TrashIcon />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative flex-1 space-y-5 px-6 py-6 sm:px-7">
        <Section
          title="Party Setup"
          subtitle={plusOnesAllowed ? 'Plus-ones welcome' : 'Invite list only'}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="group/card relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 p-[2px] shadow-sm transition-all hover:shadow-md dark:from-orange-500/20 dark:to-orange-500/10">
              <div className="rounded-[14px] bg-white/90 px-4 py-3.5 dark:bg-gray-900/90">
                <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-300">
                  <span>Theme</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{theme || 'No theme added yet'}</div>
              </div>
            </div>
            <div className="group/card relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 p-[2px] shadow-sm transition-all hover:shadow-md dark:from-amber-500/20 dark:to-yellow-500/10">
              <div className="rounded-[14px] bg-white/90 px-4 py-3.5 dark:bg-gray-900/90">
                <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                  <span>Guest Style</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {plusOnesAllowed ? 'Open to plus-ones' : 'Direct invite only'}
                </div>
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
                  className="group/item flex items-center justify-between rounded-xl border-2 border-orange-100 bg-white px-4 py-3 text-sm shadow-sm transition-all hover:border-orange-200 hover:shadow-md dark:border-orange-500/10 dark:bg-white/5 dark:hover:border-orange-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-gray-900 dark:text-white">{item?.item || item}</span>
                  </div>
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
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
            <div className="relative overflow-hidden rounded-2xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-sm dark:border-purple-500/10 dark:from-purple-500/5 dark:to-pink-500/5">
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
