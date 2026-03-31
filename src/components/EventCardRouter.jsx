import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PartyEventCardView from './PartyEventCard';
import CelebrationEventCardView from './CelebrationEventCard';
import KidsEventCardView from './KidsEventCard';
import HangoutEventCardView from './HangoutEventCard';

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
const normalizeEventCoverImage = (event) => {
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
    .find((value) => isProbablyUrl(value)) || '';
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

const normalizeGuestListEntries = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      name: String(entry?.name || '').trim(),
      rsvp: String(entry?.rsvp || 'pending').trim().toLowerCase() === 'yes'
        ? 'yes'
        : String(entry?.rsvp || 'pending').trim().toLowerCase() === 'no'
          ? 'no'
          : 'pending',
    }))
    .filter((entry) => entry.name);
};

const normalizeGuestListDraftEntries = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => ({
    name: String(entry?.name || '').trim(),
    rsvp: String(entry?.rsvp || 'pending').trim().toLowerCase() === 'yes'
      ? 'yes'
      : String(entry?.rsvp || 'pending').trim().toLowerCase() === 'no'
        ? 'no'
        : 'pending',
  }));
};

const normalizePotluckEntries = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      item: String(entry?.item || '').trim(),
      person: String(entry?.person || '').trim(),
      claimedByUserId: String(entry?.claimedByUserId || '').trim(),
    }))
    .filter((entry) => entry.item);
};

const normalizePotluckDraftEntries = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => ({
    item: String(entry?.item || '').trim(),
    person: String(entry?.person || '').trim(),
    claimedByUserId: String(entry?.claimedByUserId || '').trim(),
  }));
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

const PlacesAutocompleteField = ({ value, onChange, placeholder, inputClassName, dropdownClassName, optionClassName }) => {
  const [input, setInput] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const serviceRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setInput(value || '');
  }, [value]);

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
      clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showSuggestions) return undefined;

    const updateDropdownPosition = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(Math.max(suggestions.length, 1) * 56, 280);
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUpward = spaceBelow < Math.min(estimatedHeight, 220) && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(estimatedHeight, openUpward ? spaceAbove : spaceBelow, 280));
      setDropdownStyle({
        position: 'fixed',
        top: openUpward ? Math.max(8, rect.top - maxHeight - 8) : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        maxHeight,
        overflowY: 'auto',
        zIndex: 10020,
      });
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [showSuggestions, input, suggestions.length]);

  const getService = () => {
    if (serviceRef.current) return serviceRef.current;
    if (!window.google?.maps?.places) return null;
    serviceRef.current = new window.google.maps.places.AutocompleteService();
    return serviceRef.current;
  };

  const search = (query) => {
    clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const service = getService();
      if (!service) return;
      service.getPlacePredictions({ input: query }, (predictions, status) => {
        if (predictions && status === 'OK') {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    }, 200);
  };

  const handleSelect = (prediction) => {
    const nextValue = prediction.description;
    setInput(nextValue);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange?.(nextValue);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInput(nextValue);
          onChange?.(nextValue);
          search(nextValue);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false);
            const nextValue = input.trim() || '';
            if (nextValue !== String(value || '')) {
              onChange?.(nextValue);
            }
          }, 200);
        }}
        placeholder={placeholder || 'Search venue...'}
        className={inputClassName}
      />
      {showSuggestions && suggestions.length > 0 && dropdownStyle
        ? createPortal(
            <div className={dropdownClassName} style={dropdownStyle}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(suggestion);
                  }}
                  className={optionClassName}
                >
                  <span className="mr-1 text-gray-400 dark:text-gray-500">📍</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </span>
                  {suggestion.structured_formatting?.secondary_text ? (
                    <span className="ml-1 text-gray-400 dark:text-gray-500">
                      {suggestion.structured_formatting.secondary_text}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

const EventEditorModal = ({ config, onClose, onSave }) => {
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const editorVariant = String(config?.variant || '').trim().toLowerCase();
  const isPartyEditor = editorVariant === 'party';
  const editorTheme = editorVariant === 'kids'
    ? {
        shell: 'border-amber-200/80 bg-gradient-to-br from-white via-amber-50/95 to-sky-50/90 dark:border-amber-400/20 dark:bg-gradient-to-br dark:from-[#2b2317] dark:via-[#241d2f] dark:to-[#16253a]',
        header: 'border-amber-200/60 bg-gradient-to-br from-white via-amber-50/92 to-sky-50/88 dark:border-amber-400/15 dark:from-[#352919] dark:via-[#2a2037] dark:to-[#1b2a3f]',
        title: 'text-amber-950 dark:text-white',
        subtitle: 'text-amber-700/80 dark:text-amber-100/75',
        close: 'border-amber-200/80 bg-white/75 text-amber-600 hover:text-amber-800 dark:border-white/10 dark:bg-white/10 dark:text-amber-200 dark:hover:bg-white/15 dark:hover:text-white',
        body: 'bg-gradient-to-b from-transparent via-amber-50/30 to-sky-50/26 dark:via-white/[0.02] dark:to-white/[0.03]',
        label: 'text-amber-700 dark:text-amber-200',
        input: 'border-amber-200 bg-white/88 text-slate-900 placeholder:text-amber-300 focus:border-amber-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-amber-200/40 dark:focus:border-amber-300 dark:focus:bg-white/[0.1]',
        panel: 'border-amber-200 bg-white/82 dark:border-white/10 dark:bg-white/[0.05]',
        empty: 'border-amber-200 bg-white/68 text-amber-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-amber-200',
        footer: 'border-amber-200/60 bg-white/50 dark:border-white/10 dark:bg-white/[0.04]',
        cancel: 'border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-amber-200 dark:hover:bg-white/[0.08]',
        submit: 'bg-gradient-to-r from-amber-500 to-sky-500 text-white hover:from-amber-600 hover:to-sky-600 dark:from-amber-500 dark:to-sky-400',
      }
    : editorVariant === 'hangout'
      ? {
          shell: 'border-cyan-200/80 bg-gradient-to-br from-white via-cyan-50/95 to-sky-50/92 dark:border-cyan-400/20 dark:bg-gradient-to-br dark:from-[#18252d] dark:via-[#1b2134] dark:to-[#132232]',
          header: 'border-cyan-200/60 bg-gradient-to-br from-white via-cyan-50/92 to-sky-50/88 dark:border-cyan-400/15 dark:from-[#1f313c] dark:via-[#1d2339] dark:to-[#193042]',
          title: 'text-cyan-950 dark:text-white',
          subtitle: 'text-cyan-700/80 dark:text-cyan-100/75',
          close: 'border-cyan-200/80 bg-white/75 text-cyan-600 hover:text-cyan-800 dark:border-white/10 dark:bg-white/10 dark:text-cyan-200 dark:hover:bg-white/15 dark:hover:text-white',
          body: 'bg-gradient-to-b from-transparent via-cyan-50/28 to-sky-50/24 dark:via-white/[0.02] dark:to-white/[0.03]',
          label: 'text-cyan-700 dark:text-cyan-200',
          input: 'border-cyan-200 bg-white/88 text-slate-900 placeholder:text-cyan-300 focus:border-cyan-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-cyan-200/40 dark:focus:border-cyan-300 dark:focus:bg-white/[0.1]',
          panel: 'border-cyan-200 bg-white/82 dark:border-white/10 dark:bg-white/[0.05]',
          empty: 'border-cyan-200 bg-white/68 text-cyan-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-cyan-200',
          footer: 'border-cyan-200/60 bg-white/50 dark:border-white/10 dark:bg-white/[0.04]',
          cancel: 'border-cyan-200 bg-white text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-cyan-200 dark:hover:bg-white/[0.08]',
          submit: 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white hover:from-cyan-600 hover:to-sky-600 dark:from-cyan-500 dark:to-sky-400',
        }
      : editorVariant === 'celebration'
        ? {
            shell: 'border-rose-200/80 bg-gradient-to-br from-white via-rose-50/95 to-amber-50/90 dark:border-rose-400/20 dark:bg-gradient-to-br dark:from-[#291a22] dark:via-[#261d33] dark:to-[#2a2318]',
            header: 'border-rose-200/60 bg-gradient-to-br from-white via-rose-50/92 to-amber-50/88 dark:border-rose-400/15 dark:from-[#341e28] dark:via-[#2b2038] dark:to-[#312618]',
            title: 'text-rose-950 dark:text-white',
            subtitle: 'text-rose-700/80 dark:text-rose-100/75',
            close: 'border-rose-200/80 bg-white/75 text-rose-600 hover:text-rose-800 dark:border-white/10 dark:bg-white/10 dark:text-rose-200 dark:hover:bg-white/15 dark:hover:text-white',
            body: 'bg-gradient-to-b from-transparent via-rose-50/28 to-amber-50/24 dark:via-white/[0.02] dark:to-white/[0.03]',
            label: 'text-rose-700 dark:text-rose-200',
            input: 'border-rose-200 bg-white/88 text-slate-900 placeholder:text-rose-300 focus:border-rose-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-rose-200/40 dark:focus:border-rose-300 dark:focus:bg-white/[0.1]',
            panel: 'border-rose-200 bg-white/82 dark:border-white/10 dark:bg-white/[0.05]',
            empty: 'border-rose-200 bg-white/68 text-rose-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-rose-200',
            footer: 'border-rose-200/60 bg-white/50 dark:border-white/10 dark:bg-white/[0.04]',
            cancel: 'border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-rose-200 dark:hover:bg-white/[0.08]',
            submit: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:from-rose-600 hover:to-amber-600 dark:from-rose-500 dark:to-amber-400',
          }
        : isPartyEditor
          ? {
              shell: 'border-fuchsia-200/80 bg-gradient-to-br from-white via-rose-50/95 to-cyan-50/95 dark:border-fuchsia-400/20 dark:bg-gradient-to-br dark:from-[#20162e] dark:via-[#251b38] dark:to-[#16233a]',
              header: 'border-fuchsia-200/60 bg-gradient-to-br from-white via-rose-50/90 to-cyan-50/90 dark:border-fuchsia-400/15 dark:from-[#2a1d3e] dark:via-[#231933] dark:to-[#1a2940]',
              title: 'text-fuchsia-950 dark:text-white',
              subtitle: 'text-fuchsia-700/80 dark:text-fuchsia-100/75',
              close: 'border-fuchsia-200/80 bg-white/75 text-fuchsia-500 hover:text-fuchsia-700 dark:border-white/10 dark:bg-white/10 dark:text-fuchsia-200 dark:hover:bg-white/15 dark:hover:text-white',
              body: 'bg-gradient-to-b from-transparent via-white/20 to-white/30 dark:via-white/[0.02] dark:to-white/[0.03]',
              label: 'text-fuchsia-700 dark:text-fuchsia-200',
              input: 'border-fuchsia-200 bg-white/85 text-slate-900 placeholder:text-fuchsia-300 focus:border-fuchsia-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-fuchsia-200/40 dark:focus:border-fuchsia-300 dark:focus:bg-white/[0.1]',
              panel: 'border-fuchsia-200 bg-white/82 dark:border-white/10 dark:bg-white/[0.05]',
              empty: 'border-fuchsia-200 bg-white/65 text-fuchsia-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-fuchsia-200',
              footer: 'border-fuchsia-200/60 bg-white/50 dark:border-white/10 dark:bg-white/[0.04]',
              cancel: 'border-fuchsia-200 bg-white text-fuchsia-700 hover:border-fuchsia-300 hover:bg-fuchsia-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-fuchsia-200 dark:hover:bg-white/[0.08]',
              submit: 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white hover:from-fuchsia-700 hover:to-cyan-600 dark:from-fuchsia-500 dark:to-cyan-400',
            }
          : {
              shell: 'border-white/10 bg-white dark:border-white/10 dark:bg-slate-950',
              header: 'border-black/5 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900',
              title: 'text-slate-950 dark:text-white',
              subtitle: 'text-slate-500 dark:text-slate-400',
              close: 'border-black/5 bg-white/80 text-slate-500 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
              body: '',
              label: 'text-slate-500 dark:text-slate-400',
              input: 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/20 dark:focus:bg-white/[0.06]',
              panel: 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]',
              empty: 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300',
              footer: 'border-black/5 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]',
              cancel: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]',
              submit: 'bg-slate-950 text-white hover:bg-black dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100',
            };
  const editorAccent = editorVariant === 'kids'
    ? {
        itemSurface: 'border-amber-100/90 bg-white/78 dark:border-white/8 dark:bg-white/[0.04]',
        remove: 'border-amber-200 bg-white/85 text-amber-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-amber-200 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-200',
        optionIdle: 'border-amber-200 bg-white/85 text-slate-600 hover:border-amber-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-amber-300',
        addChip: 'border-amber-200 bg-white/85 text-amber-700 hover:border-amber-300 hover:bg-amber-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-amber-200 dark:hover:bg-white/[0.08]',
        claimed: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
        unclaimed: 'text-amber-700/75 dark:text-amber-100/65',
        dropdown: 'border-amber-200 bg-white/98 dark:border-white/10 dark:bg-[#2b2317]/98',
        option: 'border-amber-100 hover:bg-amber-50 dark:border-white/10 dark:hover:bg-white/[0.06]',
        toggleOn: 'border-amber-500 bg-gradient-to-r from-amber-500 to-sky-500 text-white dark:border-amber-300 dark:from-amber-500 dark:to-sky-400 dark:text-white',
        toggleOff: 'border-amber-200 bg-white/85 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
        help: 'text-amber-700/80 dark:text-amber-100/70',
      }
    : editorVariant === 'hangout'
      ? {
          itemSurface: 'border-cyan-100/90 bg-white/78 dark:border-white/8 dark:bg-white/[0.04]',
          remove: 'border-cyan-200 bg-white/85 text-cyan-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-cyan-200 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-200',
          optionIdle: 'border-cyan-200 bg-white/85 text-slate-600 hover:border-cyan-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-cyan-300',
          addChip: 'border-cyan-200 bg-white/85 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-cyan-200 dark:hover:bg-white/[0.08]',
          claimed: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
          unclaimed: 'text-cyan-700/75 dark:text-cyan-100/65',
          dropdown: 'border-cyan-200 bg-white/98 dark:border-white/10 dark:bg-[#18252d]/98',
          option: 'border-cyan-100 hover:bg-cyan-50 dark:border-white/10 dark:hover:bg-white/[0.06]',
          toggleOn: 'border-cyan-500 bg-gradient-to-r from-cyan-500 to-sky-500 text-white dark:border-cyan-300 dark:from-cyan-500 dark:to-sky-400 dark:text-white',
          toggleOff: 'border-cyan-200 bg-white/85 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
          help: 'text-cyan-700/80 dark:text-cyan-100/70',
        }
      : editorVariant === 'celebration'
        ? {
            itemSurface: 'border-rose-100/90 bg-white/78 dark:border-white/8 dark:bg-white/[0.04]',
            remove: 'border-rose-200 bg-white/85 text-rose-500 hover:border-fuchsia-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-rose-200 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-200',
            optionIdle: 'border-rose-200 bg-white/85 text-slate-600 hover:border-rose-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-rose-300',
            addChip: 'border-rose-200 bg-white/85 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-rose-200 dark:hover:bg-white/[0.08]',
            claimed: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
            unclaimed: 'text-rose-700/75 dark:text-rose-100/65',
            dropdown: 'border-rose-200 bg-white/98 dark:border-white/10 dark:bg-[#291a22]/98',
            option: 'border-rose-100 hover:bg-rose-50 dark:border-white/10 dark:hover:bg-white/[0.06]',
            toggleOn: 'border-rose-500 bg-gradient-to-r from-rose-500 to-amber-500 text-white dark:border-rose-300 dark:from-rose-500 dark:to-amber-400 dark:text-white',
            toggleOff: 'border-rose-200 bg-white/85 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
            help: 'text-rose-700/80 dark:text-rose-100/70',
          }
        : isPartyEditor
          ? {
              itemSurface: 'border-white/60 bg-white/70 dark:border-white/8 dark:bg-white/[0.04]',
              remove: 'border-fuchsia-200 bg-white/85 text-fuchsia-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-fuchsia-200 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-200',
              optionIdle: 'border-fuchsia-200 bg-white/85 text-slate-600 hover:border-fuchsia-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-fuchsia-300',
              addChip: 'border-fuchsia-200 bg-white/85 text-fuchsia-700 hover:border-fuchsia-300 hover:bg-fuchsia-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-fuchsia-200 dark:hover:bg-white/[0.08]',
              claimed: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200',
              unclaimed: 'text-fuchsia-700/75 dark:text-fuchsia-100/65',
              dropdown: 'border-fuchsia-200 bg-white/98 dark:border-white/10 dark:bg-[#241b38]/98',
              option: 'border-fuchsia-100 hover:bg-fuchsia-50 dark:border-white/10 dark:hover:bg-white/[0.06]',
              toggleOn: 'border-fuchsia-500 bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white dark:border-fuchsia-300 dark:from-fuchsia-500 dark:to-cyan-400 dark:text-white',
              toggleOff: 'border-fuchsia-200 bg-white/85 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
              help: 'text-fuchsia-700/80 dark:text-fuchsia-100/70',
            }
          : {
              itemSurface: 'border-white/60 bg-white/70 dark:border-white/8 dark:bg-white/[0.04]',
              remove: 'border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-rose-400/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-200',
              optionIdle: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200',
              addChip: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.08]',
              claimed: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
              unclaimed: 'text-slate-500 dark:text-slate-400',
              dropdown: 'border-slate-200 bg-white/98 dark:border-white/10 dark:bg-slate-900/98',
              option: 'border-slate-100 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.06]',
              toggleOn: 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950',
              toggleOff: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200',
              help: 'text-slate-500 dark:text-slate-400',
            };

  useEffect(() => {
    if (!config) {
      setDraft({});
      setSaving(false);
      return;
    }
    const nextDraft = {};
    (config.fields || []).forEach((field) => {
      if (field.type === 'toggle') {
        nextDraft[field.key] = Boolean(field.value);
      } else if (field.type === 'guest-list') {
        nextDraft[field.key] = normalizeGuestListDraftEntries(field.value);
      } else if (field.type === 'potluck-list') {
        nextDraft[field.key] = normalizePotluckDraftEntries(field.value);
      } else {
        nextDraft[field.key] = field.value ?? '';
      }
    });
    setDraft(nextDraft);
    setSaving(false);
  }, [config]);

  if (!config) return null;

  const setFieldValue = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddGuestRow = (key) => {
    setDraft((prev) => ({
      ...prev,
      [key]: [...normalizeGuestListDraftEntries(prev[key]), { name: '', rsvp: 'pending' }],
    }));
  };

  const handleGuestRowChange = (key, index, patch) => {
    setDraft((prev) => {
      const rows = Array.isArray(prev[key]) ? [...prev[key]] : [];
      rows[index] = { ...(rows[index] || { name: '', rsvp: 'pending' }), ...patch };
      return { ...prev, [key]: rows };
    });
  };

  const handleRemoveGuestRow = (key, index) => {
    setDraft((prev) => {
      const rows = Array.isArray(prev[key]) ? [...prev[key]] : [];
      rows.splice(index, 1);
      return { ...prev, [key]: rows };
    });
  };

  const handleAddPotluckRow = (key) => {
    setDraft((prev) => ({
      ...prev,
      [key]: [...normalizePotluckDraftEntries(prev[key]), { item: '', person: '', claimedByUserId: '' }],
    }));
  };

  const handlePotluckRowChange = (key, index, patch) => {
    setDraft((prev) => {
      const rows = Array.isArray(prev[key]) ? [...prev[key]] : [];
      rows[index] = { ...(rows[index] || { item: '', person: '', claimedByUserId: '' }), ...patch };
      return { ...prev, [key]: rows };
    });
  };

  const handleRemovePotluckRow = (key, index) => {
    setDraft((prev) => {
      const rows = Array.isArray(prev[key]) ? [...prev[key]] : [];
      rows.splice(index, 1);
      return { ...prev, [key]: rows };
    });
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
        className={`max-h-[min(78dvh,42rem)] w-full max-w-md overflow-hidden rounded-[28px] border shadow-[0_30px_80px_rgba(15,23,42,0.24)] ${editorTheme.shell}`}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className={`relative overflow-hidden border-b px-5 py-5 ${editorTheme.header}`}>
          {isPartyEditor ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-3 top-3 text-2xl opacity-70 dark:opacity-60">🎉</div>
              <div className="absolute right-12 top-2 text-[1.7rem] opacity-65 dark:opacity-55">🥂</div>
              <div className="absolute right-5 top-10 h-2 w-2 rotate-[18deg] rounded-sm bg-cyan-400/75 dark:bg-cyan-300/50" />
              <div className="absolute right-10 top-[3.75rem] h-1.5 w-4 -rotate-[32deg] rounded-full bg-fuchsia-400/70 dark:bg-fuchsia-300/45" />
              <div className="absolute left-11 top-8 h-2 w-2 rotate-45 rounded-sm bg-fuchsia-400/70 dark:bg-fuchsia-300/50" />
              <div className="absolute left-[3.25rem] top-[3.65rem] h-1.5 w-4 -rotate-[24deg] rounded-full bg-cyan-400/70 dark:bg-cyan-300/45" />
              <div className="absolute left-[38%] top-2 text-xl opacity-55 dark:opacity-50">🎊</div>
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className={`text-[18px] font-bold tracking-tight ${editorTheme.title}`}>{config.title || 'Edit details'}</div>
              {config.subtitle ? <div className={`mt-1 text-sm leading-6 ${editorTheme.subtitle}`}>{config.subtitle}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${editorTheme.close}`}
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>

        <div className={`space-y-4 overflow-y-auto px-5 py-5 ${editorTheme.body}`}>
          {(config.fields || []).map((field) => (
            <label key={field.key} className="block">
              <div className={`mb-1.5 text-[12px] font-bold uppercase tracking-[0.16em] ${editorTheme.label}`}>{field.label}</div>
              {field.type === 'textarea' ? (
                <textarea
                  value={draft[field.key] ?? ''}
                  onChange={(event) => setFieldValue(field.key, event.target.value)}
                  rows={field.rows || 4}
                  placeholder={field.placeholder || ''}
                  className={`min-h-[112px] w-full rounded-2xl border px-4 py-3 text-[15px] outline-none transition ${editorTheme.input}`}
                />
              ) : field.type === 'guest-list' ? (
                <div className={`rounded-[24px] border p-3 ${editorTheme.panel}`}>
                  <div className="space-y-3">
                    {normalizeGuestListDraftEntries(draft[field.key]).map((guest, index) => (
                      <div key={`${field.key}-${index}`} className={`rounded-2xl border p-3 shadow-sm ${editorAccent.itemSurface}`}>
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={guest.name}
                            onChange={(event) => handleGuestRowChange(field.key, index, { name: event.target.value })}
                            placeholder={field.placeholder || 'Guest name'}
                            className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-[15px] outline-none transition ${editorTheme.input}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGuestRow(field.key, index)}
                            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${editorAccent.remove}`}
                          >
                            <span className="text-lg leading-none">×</span>
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            { value: 'yes', label: 'Yes', activeClass: 'border-emerald-400 bg-emerald-500 text-white dark:border-emerald-300 dark:bg-emerald-500' },
                            { value: 'no', label: 'No', activeClass: 'border-rose-400 bg-rose-500 text-white dark:border-rose-300 dark:bg-rose-500' },
                          ].map((option) => {
                            const active = guest.rsvp === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleGuestRowChange(field.key, index, { rsvp: option.value })}
                                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                                  active
                                    ? option.activeClass
                                    : editorAccent.optionIdle
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {normalizeGuestListDraftEntries(draft[field.key]).length === 0 ? (
                      <div className={`rounded-2xl border border-dashed px-4 py-4 text-sm ${editorTheme.empty}`}>
                        No guests added yet.
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddGuestRow(field.key)}
                    className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${editorAccent.addChip}`}
                  >
                    <span className="text-sm leading-none">+</span>
                    <span>Add guest</span>
                  </button>
                </div>
              ) : field.type === 'potluck-list' ? (
                <div className={`rounded-[24px] border p-3 ${editorTheme.panel}`}>
                  <div className="space-y-3">
                    {normalizePotluckDraftEntries(draft[field.key]).map((entry, index) => (
                      <div key={`${field.key}-${index}`} className={`rounded-2xl border p-3 shadow-sm ${editorAccent.itemSurface}`}>
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={entry.item}
                            onChange={(event) => handlePotluckRowChange(field.key, index, { item: event.target.value })}
                            placeholder={field.placeholder || 'Potluck item'}
                            className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-[15px] outline-none transition ${editorTheme.input}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePotluckRow(field.key, index)}
                            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition ${editorAccent.remove}`}
                          >
                            <span className="text-lg leading-none">×</span>
                          </button>
                        </div>
                        {entry.person ? (
                          <div className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${editorAccent.claimed}`}>
                            Claimed by {entry.person}
                          </div>
                        ) : (
                          <div className={`mt-3 text-xs font-medium ${editorAccent.unclaimed}`}>
                            Unclaimed
                          </div>
                        )}
                      </div>
                    ))}
                    {normalizePotluckDraftEntries(draft[field.key]).length === 0 ? (
                      <div className={`rounded-2xl border border-dashed px-4 py-4 text-sm ${editorTheme.empty}`}>
                        No potluck items yet.
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddPotluckRow(field.key)}
                    className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${editorAccent.addChip}`}
                  >
                    <span className="text-sm leading-none">+</span>
                    <span>Add item</span>
                  </button>
                </div>
              ) : field.type === 'select' ? (
                <select
                  value={draft[field.key] ?? field.options?.[0]?.value ?? ''}
                  onChange={(event) => setFieldValue(field.key, event.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-[15px] outline-none transition ${editorTheme.input}`}
                >
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : field.type === 'location' ? (
                <PlacesAutocompleteField
                  value={draft[field.key] ?? ''}
                  onChange={(value) => setFieldValue(field.key, value)}
                  placeholder={field.placeholder || 'Search venue...'}
                    inputClassName={`w-full rounded-2xl border px-4 py-3 text-[15px] outline-none transition ${editorTheme.input}`}
                  dropdownClassName={`overflow-hidden rounded-2xl border backdrop-blur-md ring-1 ring-black/5 shadow-[0_24px_60px_rgba(15,23,42,0.22)] ${editorAccent.dropdown}`}
                  optionClassName={`block w-full border-b px-4 py-3 text-left text-sm last:border-b-0 ${editorAccent.option}`}
                />
              ) : field.type === 'toggle' ? (
                <button
                  type="button"
                  onClick={() => setFieldValue(field.key, !draft[field.key])}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${draft[field.key] ? editorAccent.toggleOn : editorAccent.toggleOff}`}
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
                  className={`w-full rounded-2xl border px-4 py-3 text-[15px] outline-none transition ${editorTheme.input}`}
                />
              )}
              {field.help ? <div className={`mt-1.5 text-xs leading-5 ${editorAccent.help}`}>{field.help}</div> : null}
            </label>
          ))}
        </div>

        <div className={`flex items-center justify-end gap-3 border-t px-5 py-4 ${editorTheme.footer}`}>
          <button type="button" onClick={onClose} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${editorTheme.cancel}`}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-default disabled:opacity-70 ${editorTheme.submit}`}>
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

const PartyEventCard = (props) => <PartyEventCardView {...props} />;

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
      shell: 'border-fuchsia-200/80 bg-gradient-to-br from-white via-rose-50/65 to-cyan-50/60 dark:border-fuchsia-400/20 dark:from-[#171320] dark:via-[#1d1a30] dark:to-[#0f1727]',
      header: 'border-fuchsia-200/70 bg-gradient-to-br from-white via-rose-50/90 to-cyan-50/90 dark:border-fuchsia-400/15 dark:bg-gradient-to-br dark:from-[#261c38] dark:via-[#231933] dark:to-[#17263e]',
      iconWrap: 'border-fuchsia-300 bg-gradient-to-br from-fuchsia-100 to-rose-100 text-fuchsia-700 shadow-fuchsia-200/40 dark:border-fuchsia-400/30 dark:from-fuchsia-500/15 dark:to-rose-500/15 dark:text-fuchsia-200 dark:shadow-fuchsia-500/10',
      categoryChip: 'bg-gradient-to-br from-fuchsia-100 to-rose-100 text-fuchsia-800 dark:from-fuchsia-500/15 dark:to-rose-500/15 dark:text-fuchsia-200',
      secondaryChip: 'border-cyan-200 bg-white/90 text-cyan-700 dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-200',
      gradientOverlay: 'bg-gradient-to-br from-fuchsia-400 via-rose-400 to-cyan-400',
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
        variant: ['kids', 'hangout', 'celebration', 'party'].includes(category) ? category : 'party',
        title: 'Edit Event Details',
        subtitle: 'Update the name, location, notes, and invitation backdrop.',
        fields: [
          { key: 'title', label: 'Event title', value: String(event?.title || '').trim(), placeholder: 'Game Night @ Home' },
          { key: 'location', label: 'Location', value: String(event?.location || '').trim(), placeholder: 'Home, rooftop, park...' },
          { key: 'coverImageUrl', label: 'Cover photo URL', value: normalizeEventCoverImage(event), placeholder: 'https://images.example.com/invitation-photo.jpg' },
          { key: 'description', label: 'Notes', type: 'textarea', rows: 5, value: normalizeEventNotes(event), placeholder: 'Add anything guests should know.' },
        ],
        onSave: (values) => onEditBasics({
          title: String(values.title || '').trim() || String(event?.title || '').trim(),
          location: String(values.location || '').trim() || null,
          coverImageUrl: String(values.coverImageUrl || '').trim() || null,
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
      card = <CelebrationEventCardView event={routedEvent} {...sharedProps} />;
      break;
    case 'hangout':
      card = <HangoutEventCardView event={routedEvent} {...sharedProps} />;
      break;
    case 'kids':
      card = <KidsEventCardView event={routedEvent} {...sharedProps} />;
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
