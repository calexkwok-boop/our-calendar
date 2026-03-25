import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

const QUICK_SUGGESTIONS = [
  { label: 'Morning', time: '09:00' },
  { label: 'Noon', time: '12:00' },
  { label: 'Afternoon', time: '15:00' },
  { label: 'Evening', time: '18:00' },
];

const parseTimeInput = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toLowerCase();

  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const WhatTimeModal = ({
  isOpen,
  pendingEvent,
  recurrence = 'once',
  suggestedTime = '',
  darkMode = false,
  accent = '#a855f7',
  onSubmit,
  onCancel,
}) => {
  const [timeInput, setTimeInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTimeInput(String(suggestedTime || ''));
  }, [isOpen, suggestedTime]);

  const recurrenceLabel = useMemo(() => {
    if (recurrence === 'weekly') return { icon: 'RE', label: 'Weekly' };
    if (recurrence === 'monthly') return { icon: 'Cal', label: 'Monthly' };
    if (recurrence === 'annual') return { icon: 'Yr', label: 'Annual' };
    return null;
  }, [recurrence]);

  if (!isOpen || !pendingEvent) return null;

  const submitCurrentValue = () => {
    const parsed = parseTimeInput(timeInput);
    onSubmit?.(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/50 px-3 pb-3 pt-8 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="max-h-[calc(100vh-2.75rem)] w-full max-w-md overflow-hidden rounded-t-[28px] rounded-b-none border-t border-transparent bg-white shadow-2xl dark:bg-slate-950 dark:border-white/10 sm:max-h-[90vh] sm:rounded-[28px]"
        style={{
          animation: 'what-time-fade-in 0.28s ease-out',
          boxShadow: darkMode
            ? '0 28px 80px rgba(0,0,0,0.55)'
            : '0 28px 80px rgba(15,23,42,0.22)',
        }}
      >
        <div
          className="relative overflow-hidden px-6 py-8"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, #ec4899 52%, #fb923c 100%)`,
          }}
        >
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 blur-xl" />

          <div className="relative z-10">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-semibold text-white backdrop-blur-sm">
              T
            </div>

            <h2 className="mb-2 text-3xl font-bold text-white">What time?</h2>
            <p className="text-lg text-white/90">{pendingEvent.title}</p>

            {recurrenceLabel && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">{recurrenceLabel.icon}</span>
                <span className="text-sm font-semibold text-white">{recurrenceLabel.label}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 bg-white px-6 py-6 dark:bg-slate-950">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {pendingEvent.isMultiDay
              ? "Multi-day events don't need a time"
              : 'Enter a time or skip to add without a specific time'}
          </p>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Time (Optional)
            </label>
            <input
              type="text"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitCurrentValue();
                }
              }}
              placeholder="e.g. 3:00 PM or 15:00"
              autoFocus
              className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              style={{
                fontSize: '16px',
                boxShadow: `0 0 0 0 ${accent}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 0 ${accent}`;
              }}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.time}
                  type="button"
                  onClick={() => setTimeInput(suggestion.time)}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:scale-[1.02] dark:bg-gray-800 dark:text-gray-300"
                  style={{
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}`,
                  }}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={submitCurrentValue}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, #ec4899 100%)`,
              }}
            >
              <Plus className="h-5 w-5" />
              <span>Add Event</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSubmit?.(null)}
                className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Skip Time
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 transition-all hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes what-time-fade-in {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default WhatTimeModal;
