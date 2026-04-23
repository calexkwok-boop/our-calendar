import React, { useState } from 'react';
import { Plus, StickyNote, Trash2, X } from 'lucide-react';

const THOUGHT_COLORS = ['yellow', 'pink', 'blue', 'green'];

const colorClasses = {
  yellow: 'bg-yellow-200 dark:bg-yellow-900/50',
  pink: 'bg-pink-200 dark:bg-pink-900/50',
  blue: 'bg-blue-200 dark:bg-blue-900/50',
  green: 'bg-green-200 dark:bg-green-900/50',
};

const hashThoughtOrderKey = (value) => {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const QuickThoughtsSection = ({
  quickThoughts = [],
  onAddThought,
  onDeleteThought,
  onOpenSomeday,
  darkMode = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftColor, setDraftColor] = useState('yellow');
  const shuffleSeedRef = React.useRef(`thought-session-${Date.now()}-${Math.random()}`);
  const shuffledQuickThoughts = React.useMemo(() => (
    [...quickThoughts].sort((left, right) => {
      const leftKey = `${shuffleSeedRef.current}:${String(left?.id || left?.text || '')}`;
      const rightKey = `${shuffleSeedRef.current}:${String(right?.id || right?.text || '')}`;
      return hashThoughtOrderKey(leftKey) - hashThoughtOrderKey(rightKey);
    })
  ), [quickThoughts]);

  const closeAddThought = () => {
    setIsAdding(false);
    setDraftText('');
    setDraftColor('yellow');
  };

  const saveThought = () => {
    const text = draftText.trim();
    if (!text) return;
    onAddThought?.({ text, color: draftColor });
    closeAddThought();
  };

  return (
    <div className="rounded-[28px] border-2 border-yellow-900/20 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-6 shadow-xl dark:from-yellow-950/30 dark:via-slate-900 dark:to-orange-950/20">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onOpenSomeday}
          className="flex items-center gap-2 text-left active:opacity-70 transition-opacity"
        >
          <StickyNote className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
          <h3 className="font-handwritten text-3xl text-gray-900 dark:text-white">
            Quick Thoughts
          </h3>
        </button>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="rounded-full p-2 text-yellow-600 transition-colors hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {shuffledQuickThoughts.length > 0 ? (
        <div className="space-y-3">
          {shuffledQuickThoughts.map((thought, idx) => (
            <div
              key={thought.id || idx}
              onClick={onOpenSomeday}
              className={`sticky-note group relative rounded-lg p-4 cursor-pointer active:opacity-70 transition-opacity ${colorClasses[thought.color] || colorClasses.green}`}
            >
              <p className="font-handwritten text-lg text-gray-900 pr-8 dark:text-white">
                {thought.text}
              </p>
              {onDeleteThought && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteThought(thought); }}
                  className="absolute top-2 right-2 rounded-full bg-white/60 p-1.5 transition-all hover:bg-red-50 dark:bg-black/20 dark:hover:bg-red-900/50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="font-handwritten text-2xl text-gray-600 italic mb-4 dark:text-gray-400">
            Jot down ideas, reminders, random thoughts...
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-200 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-yellow-300 dark:bg-yellow-900/50 dark:text-white dark:hover:bg-yellow-900/70"
          >
            <Plus className="w-4 h-4" />
            Add your first thought
          </button>
        </div>
      )}

      {isAdding && (
        <div className={`${darkMode ? 'dark' : ''} fixed inset-0 z-[10020] flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center`}>
          <div className="w-full max-w-md rounded-[28px] border border-white/40 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">Quick Thoughts</div>
                <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Add a thought</h4>
              </div>
              <button
                type="button"
                onClick={closeAddThought}
                className="rounded-xl p-2 text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="mt-4 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-yellow-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              style={{ fontSize: '16px' }}
              autoFocus
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {THOUGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDraftColor(color)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize text-gray-900 transition-all dark:text-white ${colorClasses[color]} ${
                    draftColor === color ? 'ring-2 ring-gray-900 dark:ring-white' : ''
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeAddThought}
                className="flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 dark:bg-white/[0.08] dark:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveThought}
                disabled={!draftText.trim()}
                className="flex-[2] rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save thought
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickThoughtsSection;
