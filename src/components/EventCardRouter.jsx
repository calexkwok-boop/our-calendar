import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const resolveEventCardCategory = (event) => {
  const explicit = String(event?.category || '').trim().toLowerCase();
  if (['sports', 'party', 'celebration', 'hangout', 'kids', 'custom'].includes(explicit)) {
    return explicit;
  }

  const text = [
    event?.category,
    event?.description,
    event?.title,
    event?.activity,
    event?.theme,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');

  if (/(birthday|house party|holiday party|potluck|dance party|game night|party)/.test(text)) {
    return 'party';
  }
  if (/(wedding|engagement|baby shower|bridal shower|graduation|celebration|anniversary)/.test(text)) {
    return 'celebration';
  }
  if (/(playdate|kids|child|children|school|birthday party|parent)/.test(text)) {
    return 'kids';
  }
  if (/(coffee|brunch|drinks|dinner|movie|bbq|hangout|get together|lunch)/.test(text)) {
    return 'hangout';
  }
  if (/(pickleball|tennis|basketball|soccer|golf|volleyball|softball|baseball|run|match|practice|workout|sports?)/.test(text)) {
    return 'sports';
  }
  return 'custom';
};

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
    return { name: 'Spotify', icon: '♪', chipClass: 'bg-[#1ed760]/15 text-[#15803d] dark:text-[#86efac]' };
  }
  if (normalized.includes('music.apple.com') || normalized.includes('itunes.apple.com')) {
    return { name: 'Apple Music', icon: '♫', chipClass: 'bg-[#fa233b]/12 text-[#be123c] dark:text-[#fda4af]' };
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
const buildMapHref = (location) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(location || '').trim())}`;
const normalizeList = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const parseLineItems = (value) => String(value || '')
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

const ActionPill = ({ href, onClick, children, tone = 'neutral' }) => {
  const className = tone === 'accent'
    ? 'inline-flex items-center gap-1.5 rounded-full border-2 border-transparent bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-black hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
    : 'inline-flex items-center gap-1.5 rounded-full border-2 border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10';

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

const EventEditorModal = ({ config, onClose, onSave }) => {
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!config) {
      setDraft({});
      setSaving(false);
      return;
    }
    const nextDraft = {};
    (config.fields || []).forEach((field) => {
      nextDraft[field.key] = field.type === 'toggle' ? Boolean(field.value) : (field.value ?? '');
    });
    setDraft(nextDraft);
    setSaving(false);
  }, [config]);

  if (!config) return null;

  const setFieldValue = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const result = await onSave?.(draft);
      if (result !== false) onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const modalNode = (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 p-3 pt-6 pb-6 backdrop-blur-md sm:p-6" onClick={onClose}>
      <form
        className="max-h-[min(78dvh,42rem)] w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] dark:border-white/10 dark:bg-slate-950"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="border-b border-black/5 bg-gradient-to-br from-white via-slate-50 to-slate-100 px-5 py-5 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-bold tracking-tight text-slate-950 dark:text-white">{config.title || 'Edit details'}</div>
              {config.subtitle ? <div className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{config.subtitle}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/80 text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-5">
          {(config.fields || []).map((field) => (
            <label key={field.key} className="block">
              <div className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{field.label}</div>
              {field.type === 'textarea' ? (
                <textarea
                  value={draft[field.key] ?? ''}
                  onChange={(event) => setFieldValue(field.key, event.target.value)}
                  rows={field.rows || 4}
                  placeholder={field.placeholder || ''}
                  className="min-h-[112px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/20 dark:focus:bg-white/[0.06]"
                />
              ) : field.type === 'select' ? (
                <select
                  value={draft[field.key] ?? field.options?.[0]?.value ?? ''}
                  onChange={(event) => setFieldValue(field.key, event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-white/20 dark:focus:bg-white/[0.06]"
                >
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : field.type === 'toggle' ? (
                <button
                  type="button"
                  onClick={() => setFieldValue(field.key, !draft[field.key])}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    draft[field.key]
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                      : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200'
                  }`}
                >
                  <span className="text-[15px] font-medium">{field.toggleLabel || field.label}</span>
                  <span className={`inline-flex h-6 w-11 items-center rounded-full p-1 transition ${draft[field.key] ? 'bg-white/25 dark:bg-slate-950/20' : 'bg-slate-300 dark:bg-white/10'}`}>
                    <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${draft[field.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </span>
                </button>
              ) : (
                <input
                  type="text"
                  value={draft[field.key] ?? ''}
                  onChange={(event) => setFieldValue(field.key, event.target.value)}
                  placeholder={field.placeholder || ''}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/20 dark:focus:bg-white/[0.06]"
                />
              )}
              {field.help ? <div className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{field.help}</div> : null}
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-black/5 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-default disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
            {saving ? 'Saving…' : (config.saveLabel || 'Save changes')}
          </button>
        </div>
      </form>
    </div>
  );

  if (typeof document === 'undefined') return modalNode;
  return createPortal(modalNode, document.body);
};

const Section = ({ title, subtitle, actions, children }) => (
  <div className="group/section rounded-[20px] border-2 border-black/[0.06] bg-white/90 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all hover:shadow-[0_12px_32px_rgba(15,23,42,0.06)] dark:border-white/[0.12] dark:bg-white/[0.06] dark:shadow-none dark:hover:bg-white/[0.08]">
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
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
      Nothing added yet.
    </div>
  </Section>
);

const NotesSection = ({ event, onEdit }) => {
  const notes = normalizeEventNotes(event);

  if (notes) {
    return (
      <Section
        title="Notes"
        actions={typeof onEdit === 'function' ? (
          <ActionPill onClick={onEdit}>Edit</ActionPill>
        ) : null}
      >
        <div className="text-sm leading-6 text-gray-700 dark:text-gray-300">{notes}</div>
      </Section>
    );
  }

  if (typeof onEdit === 'function') {
    return (
      <EmptySection
        title="Notes"
        subtitle="No notes added yet."
        actions={<ActionPill onClick={onEdit}>Add</ActionPill>}
      />
    );
  }

  return null;
};

const InviteeRow = ({ event, label = 'Invited' }) => {
  const invitees = Array.isArray(event?.invitees) ? event.invitees : [];

  return (
    <Section title={label} subtitle={`${invitees.length} ${invitees.length === 1 ? 'person' : 'people'}`}>
      <div className="flex flex-wrap gap-2.5">
        {invitees.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-3.5 text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
            No one has responded yet.
          </div>
        ) : (
          invitees.slice(0, 8).map((invitee, index) => (
            <div
              key={invitee.id || invitee.user_id || invitee.name || `${index}`}
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/8"
            >
              <span className="text-base leading-none">{invitee.avatar || '👤'}</span>
              <span>{invitee.name || invitee.display_name || 'Guest'}</span>
            </div>
          ))
        )}
      </div>
    </Section>
  );
};

const CardShell = ({
  event,
  categoryLabel,
  accentClasses,
  accentChip,
  icon,
  onEdit,
  onDelete,
  children,
  primaryActionLabel,
  onPrimaryAction,
  hidePrimaryAction = false,
  fillHeight = false,
}) => {
  const location = String(event?.location || '').trim();

  return (
    <div className={`group relative overflow-hidden rounded-[32px] border-2 shadow-[0_24px_80px_rgba(15,23,42,0.12)] transition-all duration-300 hover:shadow-[0_28px_100px_rgba(15,23,42,0.16)] dark:shadow-none ${fillHeight ? 'flex min-h-full flex-col' : ''} ${accentClasses.shell}`}>
      {/* Decorative gradient overlay */}
      <div className={`pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.08] ${accentClasses.gradientOverlay || ''}`} />
      
      <div className={`relative border-b-2 px-6 py-6 sm:px-7 ${accentClasses.header}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-[18px] border-2 text-xl shadow-sm transition-transform group-hover:scale-105 ${accentClasses.iconWrap}`}>
                {icon}
              </span>
              <span className={`rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] shadow-sm ${accentClasses.categoryChip}`}>
                {categoryLabel}
              </span>
              {accentChip ? (
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${accentClasses.secondaryChip}`}>
                  {accentChip}
                </span>
              ) : null}
            </div>
            <h3 className="text-[22px] font-bold leading-tight tracking-tight text-gray-950 dark:text-white">{event?.title || 'Untitled event'}</h3>
            <div className="mt-2.5 flex items-center gap-2 text-[15px] font-medium text-gray-600 dark:text-gray-300">
              <svg className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatEventDateTime(event?.date, event?.time)}</span>
            </div>
            {location ? (
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 text-[15px] font-medium text-gray-600 dark:text-gray-300">
                  <svg className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{location}</span>
                </div>
                <ActionPill href={buildMapHref(location)}>View map</ActionPill>
              </div>
            ) : null}
          </div>

          {(onEdit || onDelete) ? (
            <div className="flex items-center gap-2">
              {onEdit ? (
                <button className="rounded-full border-2 border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white" onClick={onEdit} type="button">
                  <EditIcon />
                </button>
              ) : null}
              {onDelete ? (
                <button className="rounded-full border-2 border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-red-400/20 dark:hover:bg-red-500/10 dark:hover:text-red-400" onClick={onDelete} type="button">
                  <TrashIcon />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className={`relative space-y-5 px-6 py-6 sm:px-7 ${fillHeight ? 'flex-1' : ''}`}>
        {children}

        {!hidePrimaryAction && onPrimaryAction ? (
          <div className="pt-2">
            <ActionPill onClick={onPrimaryAction} tone="accent">
              {primaryActionLabel || 'Open'}
            </ActionPill>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const PartyEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const potluckItems = Array.isArray(event?.potluckItems) ? event.potluckItems : [];
  const theme = String(event?.theme || '').trim();
  const musicPlaylist = String(event?.musicPlaylist || '').trim();
  const playlistService = detectPlaylistService(musicPlaylist);
  const plusOnesAllowed = event?.plusOnesAllowed !== false;

  return (
    <CardShell
      event={event}
      categoryLabel="Party"
      accentChip={theme || null}
      icon="🎉"
      accentClasses={{
        shell: 'border-orange-300/70 bg-gradient-to-br from-orange-50 via-amber-50/80 to-yellow-50/50 dark:border-orange-400/25 dark:from-[#2d1f14] dark:via-[#1c150f] dark:to-[#13110e]',
        header: 'border-orange-200/80 bg-gradient-to-br from-white/95 to-orange-50/60 dark:border-orange-400/15 dark:bg-gradient-to-br dark:from-white/[0.04] dark:to-orange-500/[0.02]',
        iconWrap: 'border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 shadow-orange-200/40 dark:border-orange-400/30 dark:from-orange-500/15 dark:to-amber-500/15 dark:text-orange-300 dark:shadow-orange-500/10',
        categoryChip: 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 dark:from-orange-500/15 dark:to-orange-600/15 dark:text-orange-200',
        secondaryChip: 'border-orange-200 bg-white/90 text-orange-700 dark:border-orange-400/20 dark:bg-white/5 dark:text-orange-200',
        gradientOverlay: 'bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400',
      }}
      fillHeight
      {...props}
    >
      <Section
        title="Party Setup"
        subtitle={plusOnesAllowed ? 'Plus-ones welcome' : 'Invite list only'}
        actions={onUpdateEventData && openEditor ? (
          <ActionPill
            onClick={() => openEditor({
              title: 'Edit Party Setup',
              subtitle: 'Update the party vibe and guest policy.',
              fields: [
                { key: 'theme', label: 'Theme', value: theme, placeholder: 'Game night, retro, rooftop...' },
                { key: 'plusOnesAllowed', label: 'Guest style', type: 'toggle', value: plusOnesAllowed, toggleLabel: 'Allow plus-ones' },
              ],
              onSave: (values) => onUpdateEventData({
                theme: String(values.theme || '').trim(),
                plusOnesAllowed: Boolean(values.plusOnesAllowed),
              }),
            })}
          >
            Edit
          </ActionPill>
        ) : null}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-orange-50 px-3 py-3 text-sm text-orange-900 dark:bg-orange-500/10 dark:text-orange-100">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-300">Theme</div>
            <div className="mt-1">{theme || 'No theme added yet'}</div>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">Guest Style</div>
            <div className="mt-1">{plusOnesAllowed ? 'Open to plus-ones' : 'Direct invite only'}</div>
          </div>
        </div>
      </Section>

      {potluckItems.length > 0 ? (
        <Section
          title="Potluck"
          subtitle={`${potluckItems.length} planned item${potluckItems.length === 1 ? '' : 's'}`}
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() => openEditor({
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
              })}
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className="space-y-2">
            {potluckItems.slice(0, 4).map((item, index) => (
              <div key={`${item?.item || item}-${index}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10">
                <span>{item?.item || item}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{item?.person || 'Unassigned'}</span>
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
              onClick={() => openEditor({
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
              })}
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
          actions={(
            <>
              {isProbablyUrl(musicPlaylist) ? <ActionPill href={musicPlaylist}>Open {playlistService?.name || 'playlist'}</ActionPill> : null}
              {onUpdateEventData && openEditor ? (
                <ActionPill
                  onClick={() => openEditor({
                    title: 'Edit Music',
                    subtitle: 'Add a playlist link or a note for the music vibe.',
                    fields: [
                      { key: 'musicPlaylist', label: 'Playlist', value: musicPlaylist, placeholder: 'Spotify link or DJ note' },
                    ],
                    onSave: (values) => onUpdateEventData({ musicPlaylist: String(values.musicPlaylist || '').trim() }),
                  })}
                >
                  Edit
                </ActionPill>
              ) : null}
            </>
          )}
        >
          <div className="rounded-xl bg-white px-3 py-3 text-sm text-gray-600 ring-1 ring-black/5 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
            {isProbablyUrl(musicPlaylist) ? (
              <div className="flex flex-wrap items-center gap-2">
                {playlistService ? (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${playlistService.chipClass}`}>
                    <span className="text-sm leading-none">{playlistService.icon}</span>
                    <span>{playlistService.name}</span>
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
                  {playlistService ? 'Tap the button to open the playlist.' : musicPlaylist}
                </span>
              </div>
            ) : musicPlaylist}
          </div>
        </Section>
      ) : (
        <EmptySection
          title="Music"
          subtitle="No playlist linked yet."
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() => openEditor({
                title: 'Add Music',
                subtitle: 'Drop in a playlist link or a note for the soundtrack.',
                fields: [
                  { key: 'musicPlaylist', label: 'Playlist', value: '', placeholder: 'Spotify link or DJ note' },
                ],
                onSave: (values) => onUpdateEventData({ musicPlaylist: String(values.musicPlaylist || '').trim() }),
              })}
            >
              Add
            </ActionPill>
          ) : null}
        />
      )}

      <NotesSection event={event} onEdit={onEdit} />

      <InviteeRow event={event} label="Going" />
    </CardShell>
  );
};

const CelebrationEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const dressCode = String(event?.dressCode || '').trim();
  const registryLink = String(event?.registryLink || '').trim();
  const schedule = Array.isArray(event?.schedule) ? event.schedule : [];

  return (
    <CardShell
      event={event}
      categoryLabel="Celebration"
      accentChip={dressCode || null}
      icon="🥂"
      accentClasses={{
        shell: 'border-rose-300/70 bg-gradient-to-br from-rose-50 via-pink-50/80 to-orange-50/50 dark:border-rose-400/25 dark:from-[#2d1a1f] dark:via-[#1e1517] dark:to-[#14110f]',
        header: 'border-rose-200/80 bg-gradient-to-br from-white/95 to-rose-50/60 dark:border-rose-400/15 dark:bg-gradient-to-br dark:from-white/[0.04] dark:to-rose-500/[0.02]',
        iconWrap: 'border-rose-300 bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 shadow-rose-200/40 dark:border-rose-400/30 dark:from-rose-500/15 dark:to-pink-500/15 dark:text-rose-300 dark:shadow-rose-500/10',
        categoryChip: 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-800 dark:from-rose-500/15 dark:to-rose-600/15 dark:text-rose-200',
        secondaryChip: 'border-rose-200 bg-white/90 text-rose-700 dark:border-rose-400/20 dark:bg-white/5 dark:text-rose-200',
        gradientOverlay: 'bg-gradient-to-br from-rose-400 via-pink-400 to-orange-400',
      }}
      fillHeight
      {...props}
    >
      {registryLink ? (
        <Section
          title="Gift Registry"
          subtitle="Guests can open the registry directly."
          actions={(
            <>
              <ActionPill href={registryLink}>Open registry</ActionPill>
              {onUpdateEventData && openEditor ? (
                <ActionPill
                  onClick={() => openEditor({
                    title: 'Edit Celebration Details',
                    subtitle: 'Keep registry and dress expectations in one polished place.',
                    fields: [
                      { key: 'registryLink', label: 'Registry link', value: registryLink, placeholder: 'https://...' },
                      { key: 'dressCode', label: 'Dress code', value: dressCode, placeholder: 'Cocktail, garden, festive...' },
                    ],
                    onSave: (values) => onUpdateEventData({
                      registryLink: String(values.registryLink || '').trim(),
                      dressCode: String(values.dressCode || '').trim(),
                    }),
                  })}
                >
                  Edit
                </ActionPill>
              ) : null}
            </>
          )}
        >
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Registry link is attached and ready to share.
          </div>
        </Section>
      ) : (
        <EmptySection
          title="Gift Registry"
          subtitle="No registry or gift link added yet."
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() => openEditor({
                title: 'Add Registry',
                subtitle: 'Add a registry link and optional dress note.',
                fields: [
                  { key: 'registryLink', label: 'Registry link', value: '', placeholder: 'https://...' },
                  { key: 'dressCode', label: 'Dress code', value: dressCode, placeholder: 'Cocktail, garden, festive...' },
                ],
                onSave: (values) => onUpdateEventData({
                  registryLink: String(values.registryLink || '').trim(),
                  dressCode: String(values.dressCode || '').trim(),
                }),
              })}
            >
              Add
            </ActionPill>
          ) : null}
        />
      )}

      {schedule.length > 0 ? (
        <Section
          title="Schedule"
          subtitle={`${schedule.length} timeline item${schedule.length === 1 ? '' : 's'}`}
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() => openEditor({
                title: 'Edit Schedule',
                subtitle: 'Use one line per timeline item in the format `time | activity`.',
                fields: [
                  {
                    key: 'schedule',
                    label: 'Timeline',
                    type: 'textarea',
                    rows: 6,
                    value: schedule.map((item) => `${item?.time || ''} | ${item?.activity || ''}`).join('\n'),
                    placeholder: '6:30 PM | Toasts',
                  },
                ],
                onSave: (values) => onUpdateEventData({
                  schedule: String(values.schedule || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [time, activity] = line.split('|').map((part) => part.trim());
                      return { time: time || '', activity: activity || '' };
                    })
                    .filter((item) => item.time || item.activity),
                }),
              })}
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className="space-y-2">
            {schedule.map((item, index) => (
              <div key={`${item?.time || 'time'}-${index}`} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                <div className="font-semibold text-rose-700 dark:text-rose-300">{item?.time || 'TBD'}</div>
                <div className="text-gray-700 dark:text-gray-200">{item?.activity || 'Planned moment'}</div>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <EmptySection
          title="Schedule"
          subtitle="No timeline added yet."
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() => openEditor({
                title: 'Add Schedule',
                subtitle: 'Use one line per timeline item in the format `time | activity`.',
                fields: [
                  {
                    key: 'schedule',
                    label: 'Timeline',
                    type: 'textarea',
                    rows: 6,
                    value: '',
                    placeholder: '7:00 PM | First dance',
                  },
                ],
                onSave: (values) => onUpdateEventData({
                  schedule: String(values.schedule || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [time, activity] = line.split('|').map((part) => part.trim());
                      return { time: time || '', activity: activity || '' };
                    })
                    .filter((item) => item.time || item.activity),
                }),
              })}
            >
              Add
            </ActionPill>
          ) : null}
        />
      )}

      <NotesSection event={event} onEdit={onEdit} />

      <InviteeRow event={event} label="Attending" />
    </CardShell>
  );
};

const KidsEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const ageRange = String(event?.ageRange || '').trim();
  const activity = String(event?.activity || '').trim();
  const parentRequired = event?.parentRequired !== false;
  const allergenAlerts = Array.isArray(event?.allergenAlerts) ? event.allergenAlerts : [];

  return (
    <CardShell
      event={event}
      categoryLabel="Kids Event"
      accentChip={ageRange ? `Ages ${ageRange}` : null}
      icon="🎈"
      accentClasses={{
        shell: 'border-amber-300/70 bg-gradient-to-br from-amber-50 via-yellow-50/80 to-orange-50/50 dark:border-amber-400/25 dark:from-[#2d2314] dark:via-[#1e1911] dark:to-[#13110e]',
        header: 'border-amber-200/80 bg-gradient-to-br from-white/95 to-amber-50/60 dark:border-amber-400/15 dark:bg-gradient-to-br dark:from-white/[0.04] dark:to-amber-500/[0.02]',
        iconWrap: 'border-amber-300 bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 shadow-amber-200/40 dark:border-amber-400/30 dark:from-amber-500/15 dark:to-yellow-500/15 dark:text-amber-300 dark:shadow-amber-500/10',
        categoryChip: 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 dark:from-amber-500/15 dark:to-amber-600/15 dark:text-amber-200',
        secondaryChip: 'border-amber-200 bg-white/90 text-amber-700 dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200',
        gradientOverlay: 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400',
      }}
      fillHeight
      {...props}
    >
      {activity ? (
        <Section
          title="Main Activity"
          subtitle="What the kids will be doing"
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() => openEditor({
                title: 'Edit Activity',
                subtitle: 'Set the main activity and age range for the event.',
                fields: [
                  { key: 'activity', label: 'Main activity', value: activity, placeholder: 'Crafts, bounce house, movie...' },
                  { key: 'ageRange', label: 'Age range', value: ageRange, placeholder: '4-6, 8-10, all ages...' },
                ],
                onSave: (values) => onUpdateEventData({
                  activity: String(values.activity || '').trim(),
                  ageRange: String(values.ageRange || '').trim(),
                }),
              })}
            >
              Edit
            </ActionPill>
          ) : null}
        >
          <div className="text-sm text-gray-700 dark:text-gray-300">{activity}</div>
        </Section>
      ) : (
        <EmptySection
          title="Main Activity"
          subtitle="No activity details added yet."
          actions={onUpdateEventData && openEditor ? (
            <ActionPill
              onClick={() => openEditor({
                title: 'Add Activity',
                subtitle: 'Set the main activity and age range for the event.',
                fields: [
                  { key: 'activity', label: 'Main activity', value: '', placeholder: 'Crafts, scavenger hunt, trampoline...' },
                  { key: 'ageRange', label: 'Age range', value: ageRange, placeholder: '4-6, 8-10, all ages...' },
                ],
                onSave: (values) => onUpdateEventData({
                  activity: String(values.activity || '').trim(),
                  ageRange: String(values.ageRange || '').trim(),
                }),
              })}
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
            onClick={() => openEditor({
              title: 'Edit Parent Notes',
              subtitle: 'Add allergy context and set whether parents should stay.',
              fields: [
                { key: 'allergenAlerts', label: 'Allergy notes', value: allergenAlerts.join(', '), placeholder: 'Peanuts, dairy, latex...' },
                { key: 'parentRequired', label: 'Attendance', type: 'toggle', value: parentRequired, toggleLabel: 'Parents should stay' },
              ],
              onSave: (values) => onUpdateEventData({
                allergenAlerts: normalizeList(values.allergenAlerts),
                parentRequired: Boolean(values.parentRequired),
              }),
            })}
          >
            Edit
          </ActionPill>
        ) : null}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Attendance</div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">{parentRequired ? 'Parents stay on-site' : 'Drop-off is okay'}</div>
          </div>
          <div className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-300">Allergies</div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">
              {allergenAlerts.length > 0 ? `Avoid ${allergenAlerts.join(', ')}` : 'No allergy notes added'}
            </div>
          </div>
        </div>
      </Section>

      <NotesSection event={event} onEdit={onEdit} />

      <InviteeRow event={event} label="Kids Attending" />
    </CardShell>
  );
};

const HangoutEventCard = ({ event, onUpdateEventData, onEdit, openEditor, ...props }) => {
  const duration = String(event?.expectedDuration || '').trim();
  const reservationName = String(event?.reservationName || '').trim();
  const billSplitting = String(event?.billSplitting || 'separate').trim();
  const billText = billSplitting === 'split'
    ? 'Split evenly'
    : billSplitting === 'host'
      ? 'Host pays'
      : 'Separate checks';

  return (
    <CardShell
      event={event}
      categoryLabel="Hangout"
      accentChip={duration ? `~${duration}` : null}
      icon="☕"
      accentClasses={{
        shell: 'border-cyan-300/70 bg-gradient-to-br from-cyan-50 via-sky-50/80 to-blue-50/50 dark:border-cyan-400/25 dark:from-[#15242d] dark:via-[#121a1f] dark:to-[#0f1113]',
        header: 'border-cyan-200/80 bg-gradient-to-br from-white/95 to-cyan-50/60 dark:border-cyan-400/15 dark:bg-gradient-to-br dark:from-white/[0.04] dark:to-cyan-500/[0.02]',
        iconWrap: 'border-cyan-300 bg-gradient-to-br from-cyan-100 to-sky-100 text-cyan-700 shadow-cyan-200/40 dark:border-cyan-400/30 dark:from-cyan-500/15 dark:to-sky-500/15 dark:text-cyan-300 dark:shadow-cyan-500/10',
        categoryChip: 'bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-800 dark:from-cyan-500/15 dark:to-cyan-600/15 dark:text-cyan-200',
        secondaryChip: 'border-cyan-200 bg-white/90 text-cyan-700 dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-200',
        gradientOverlay: 'bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-400',
      }}
      fillHeight
      {...props}
    >
      <Section
        title="Plan"
        subtitle={reservationName ? `Reservation under ${reservationName}` : 'No reservation note yet'}
        actions={onUpdateEventData && openEditor ? (
          <ActionPill
            onClick={() => openEditor({
              title: 'Edit Hangout Plan',
              subtitle: 'Update the reservation name, timing, and bill style.',
              fields: [
                { key: 'reservationName', label: 'Reservation name', value: reservationName, placeholder: 'Under Mia, rooftop table...' },
                { key: 'expectedDuration', label: 'Expected duration', value: duration, placeholder: '2 hours' },
                {
                  key: 'billSplitting',
                  label: 'Bill style',
                  type: 'select',
                  value: billSplitting,
                  options: [
                    { value: 'separate', label: 'Separate checks' },
                    { value: 'split', label: 'Split evenly' },
                    { value: 'host', label: 'Host pays' },
                  ],
                },
              ],
              onSave: (values) => onUpdateEventData({
                reservationName: String(values.reservationName || '').trim(),
                expectedDuration: String(values.expectedDuration || '').trim(),
                billSplitting: ['separate', 'split', 'host'].includes(String(values.billSplitting || '').trim())
                  ? String(values.billSplitting || '').trim()
                  : 'separate',
              }),
            })}
          >
            Edit
          </ActionPill>
        ) : null}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Reservation</div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">{reservationName || 'Walk-in or meetup spot'}</div>
          </div>
          <div className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">Bill</div>
            <div className="mt-1 text-gray-700 dark:text-gray-200">{billText}</div>
          </div>
        </div>
      </Section>

      <NotesSection event={event} onEdit={onEdit} />

      <InviteeRow event={event} label="Coming" />
    </CardShell>
  );
};

const GenericEventCard = ({ event, onEdit, ...props }) => (
  <CardShell
    event={event}
    categoryLabel={event?.category === 'sports' ? 'Sports' : 'Event'}
    icon={event?.category === 'sports' ? '🏃' : '✨'}
    accentClasses={{
      shell: 'border-slate-300/70 bg-gradient-to-br from-slate-50 via-gray-50/80 to-zinc-50/50 dark:border-slate-400/25 dark:from-[#1a1a1a] dark:via-[#151515] dark:to-[#111111]',
      header: 'border-slate-200/80 bg-gradient-to-br from-white/95 to-slate-50/60 dark:border-slate-400/15 dark:bg-gradient-to-br dark:from-white/[0.04] dark:to-slate-500/[0.02]',
      iconWrap: 'border-slate-300 bg-gradient-to-br from-slate-100 to-gray-100 text-slate-700 shadow-slate-200/40 dark:border-slate-400/30 dark:from-slate-500/15 dark:to-gray-500/15 dark:text-slate-300 dark:shadow-slate-500/10',
      categoryChip: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 dark:from-slate-500/15 dark:to-slate-600/15 dark:text-slate-200',
      secondaryChip: 'border-slate-200 bg-white/90 text-slate-700 dark:border-slate-400/20 dark:bg-white/5 dark:text-slate-200',
      gradientOverlay: 'bg-gradient-to-br from-slate-400 via-gray-400 to-zinc-400',
    }}
    fillHeight
    {...props}
  >
    <NotesSection event={event} onEdit={onEdit} />
    <InviteeRow event={event} />
  </CardShell>
);

const EventCardRouter = ({ event, onEditBasics, ...props }) => {
  const category = resolveEventCardCategory(event);
  const routedEvent = { ...event, category };
  const [editorConfig, setEditorConfig] = useState(null);

  const openEditor = (config) => {
    setEditorConfig(config || null);
  };
  const closeEditor = () => {
    setEditorConfig(null);
  };
  const handleSaveEditor = async (values) => {
    if (typeof editorConfig?.onSave !== 'function') return false;
    return editorConfig.onSave(values);
  };
  const handleOpenBasicsEditor = typeof onEditBasics === 'function'
    ? () => openEditor({
        title: 'Edit Event Details',
        subtitle: 'Update the name, location, and notes for this event.',
        fields: [
          { key: 'title', label: 'Event title', value: String(event?.title || '').trim(), placeholder: 'Game Night @ Home' },
          { key: 'location', label: 'Location', value: String(event?.location || '').trim(), placeholder: 'Home, rooftop, park...' },
          { key: 'description', label: 'Notes', type: 'textarea', rows: 5, value: normalizeEventNotes(event), placeholder: 'Add anything guests should know.' },
        ],
        onSave: (values) => onEditBasics({
          title: String(values.title || '').trim() || String(event?.title || '').trim(),
          location: String(values.location || '').trim() || null,
          description: String(values.description || '').trim() || null,
        }),
      })
    : props.onEdit;
  const sharedProps = {
    ...props,
    onEdit: handleOpenBasicsEditor,
    openEditor,
  };

  let card = null;

  switch (category) {
    case 'party':
      card = <PartyEventCard event={routedEvent} {...sharedProps} />;
      break;
    case 'celebration':
      card = <CelebrationEventCard event={routedEvent} {...sharedProps} />;
      break;
    case 'hangout':
      card = <HangoutEventCard event={routedEvent} {...sharedProps} />;
      break;
    case 'kids':
      card = <KidsEventCard event={routedEvent} {...sharedProps} />;
      break;
    case 'sports':
    case 'custom':
    default:
      card = <GenericEventCard event={routedEvent} {...sharedProps} />;
      break;
  }

  return (
    <>
      {card}
      <EventEditorModal config={editorConfig} onClose={closeEditor} onSave={handleSaveEditor} />
    </>
  );
};

export default EventCardRouter;
export {
  PartyEventCard,
  CelebrationEventCard,
  KidsEventCard,
  HangoutEventCard,
  GenericEventCard,
};
