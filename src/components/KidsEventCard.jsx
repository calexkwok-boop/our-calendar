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
  <div className="group/section rounded-[22px] border border-amber-200/55 bg-white/90 p-5 shadow-[0_12px_30px_rgba(245,158,11,0.08)] backdrop-blur-sm transition-all hover:shadow-[0_18px_40px_rgba(245,158,11,0.12)] dark:border-amber-400/14 dark:bg-white/[0.06] dark:shadow-none dark:hover:bg-white/[0.08]">
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
    <div className="rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/60 px-4 py-4 text-sm text-amber-700 dark:border-amber-400/16 dark:bg-amber-500/8 dark:text-amber-200">
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

const KidsEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const ageRange = String(event?.ageRange || '').trim();
  const activity = String(event?.activity || '').trim();
  const parentRequired = event?.parentRequired !== false;
  const allergenAlerts = Array.isArray(event?.allergenAlerts) ? event.allergenAlerts : [];
  const registryLink = String(event?.registryLink || '').trim();

  return (
    <div className="group relative w-full overflow-hidden rounded-[32px] border-2 border-amber-300/65 bg-gradient-to-br from-white via-amber-50/60 to-sky-50/45 shadow-[0_24px_80px_rgba(245,158,11,0.18)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(245,158,11,0.24)] dark:border-amber-400/25 dark:from-[#201b14] dark:via-[#171513] dark:to-[#14181c] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[7%] top-[11%] text-[1.9rem] opacity-65 dark:opacity-38">🎈</div>
        <div className="absolute right-[10%] top-[12%] text-[1.8rem] opacity-60 dark:opacity-34">🧸</div>
        <div className="absolute left-[76%] top-[62%] text-[1.8rem] opacity-55 dark:opacity-32">🖍️</div>
        <div className="absolute left-[10%] bottom-[14%] text-[1.7rem] opacity-55 dark:opacity-32">🧩</div>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[22%] top-[23%] h-2.5 w-2.5 rotate-12 rounded-sm bg-amber-200/70 dark:bg-amber-300/20" />
        <div className="absolute right-[18%] top-[58%] h-2 w-2 rounded-full bg-sky-200/80 dark:bg-sky-300/20" />
        <div className="absolute left-[70%] top-[32%] h-2.5 w-2.5 rotate-45 rounded-sm bg-rose-200/70 dark:bg-rose-300/20" />
      </div>

      <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-300/18 to-yellow-300/8 blur-2xl dark:from-amber-400/10 dark:to-yellow-400/5" />
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-sky-300/16 to-cyan-300/8 blur-2xl dark:from-sky-400/10 dark:to-cyan-400/5" />

      <div className="relative border-b-2 border-amber-200/80 bg-gradient-to-br from-white/95 to-amber-50/45 px-6 py-6 dark:border-amber-400/15 dark:from-white/[0.04] dark:to-amber-500/[0.02] sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] border-2 border-amber-300 bg-gradient-to-br from-amber-100 to-yellow-100 text-2xl shadow-lg shadow-amber-200/30 transition-transform group-hover:scale-105 dark:border-amber-400/30 dark:from-amber-500/15 dark:to-yellow-500/15 dark:shadow-amber-500/10">
                🎠
              </span>

              <span className="rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800 shadow-sm dark:from-amber-500/15 dark:to-yellow-500/15 dark:text-amber-200">
                Kids Event
              </span>

              {ageRange ? (
                <span className="rounded-full border-2 border-amber-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200">
                  Ages {ageRange}
                </span>
              ) : null}
            </div>

            <h3 className="text-[22px] font-bold leading-tight tracking-tight text-gray-950 dark:text-white">
              {event?.title || 'Untitled kids event'}
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
        {activity ? (
          <Section
            title="Main Activity"
            subtitle="What the kids will be doing"
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    title: 'Edit Activity',
                    subtitle: 'Update what the kids will be doing.',
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
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-100 bg-white p-4 shadow-sm dark:border-amber-400/20 dark:bg-white/5">
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
            subtitle="No activity details added yet."
            actions={onUpdateEventData && openEditor ? (
              <ActionPill
                onClick={() =>
                  openEditor({
                    title: 'Add Activity',
                    subtitle: 'What will the kids be doing?',
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
          subtitle={parentRequired ? 'Parents should stay' : 'Drop-off friendly'}
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() =>
                openEditor({
                  title: 'Edit Parent Notes',
                  subtitle: 'Update allergy info and supervision requirements.',
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
            <div className="relative overflow-hidden rounded-2xl border-2 border-sky-100 bg-white p-4 shadow-sm dark:border-sky-400/20 dark:bg-white/5">
              <div className="flex items-start gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">Supervision</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {parentRequired ? 'Parents stay' : 'Drop-off OK'}
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-2xl border-2 p-4 shadow-sm ${
              allergenAlerts.length > 0
                ? 'border-red-200 bg-white dark:border-red-400/20 dark:bg-white/5'
                : 'border-emerald-200 bg-white dark:border-emerald-400/20 dark:bg-white/5'
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
            className="group/gift relative block overflow-hidden rounded-2xl border-2 border-purple-200 bg-white p-5 shadow-md transition-all hover:scale-[1.02] hover:border-purple-300 hover:shadow-lg dark:border-purple-400/20 dark:bg-white/5"
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
