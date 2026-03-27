import React, { useMemo } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  Layers,
  Lock,
  Sparkles,
  Shield,
  Target,
  Trophy,
  X,
} from 'lucide-react';

const TROPHY_DEFINITIONS = Object.freeze([
  {
    id: 'committed',
    title: 'Committed',
    description: 'Reach 50% of any goal.',
    category: 'Completion',
    icon: Target,
    thresholdLabel: '50% progress',
  },
  {
    id: 'follow_through',
    title: 'Follow Through',
    description: 'Complete your first goal.',
    category: 'Completion',
    icon: CheckCircle2,
    thresholdLabel: '1 goal completed',
  },
  {
    id: 'momentum',
    title: 'Momentum',
    description: 'Complete 3 goals over time.',
    category: 'Completion',
    icon: Trophy,
    thresholdLabel: '3 goals completed',
  },
  {
    id: 'locked_in',
    title: 'Locked In',
    description: 'Log progress for 10 consecutive days on the same goal.',
    category: 'Consistency',
    icon: Flame,
    thresholdLabel: '10-day streak',
  },
  {
    id: 'unshakeable',
    title: 'Unshakeable',
    description: 'Log progress for 30 consecutive days on the same goal.',
    category: 'Consistency',
    icon: Shield,
    thresholdLabel: '30-day streak',
  },
  {
    id: 'steady_hand',
    title: 'Steady Hand',
    description: 'Log progress on 20 different days for the same goal.',
    category: 'Consistency',
    icon: Layers,
    thresholdLabel: '20 active days',
  },
  {
    id: 'journaled_honestly',
    title: 'Journaled Honestly',
    description: 'Journal on 10 different days.',
    category: 'Reflection',
    icon: BookOpen,
    thresholdLabel: '10 journal days',
  },
  {
    id: 'deep_reflection',
    title: 'Deep Reflection',
    description: 'Journal on 30 different days.',
    category: 'Reflection',
    icon: Sparkles,
    thresholdLabel: '30 journal days',
  },
  {
    id: 'category_builder',
    title: 'Category Builder',
    description: 'Complete 3 different goals in the same category.',
    category: 'Growth',
    icon: Award,
    thresholdLabel: '3 same-category completions',
  },
  {
    id: 'transformation',
    title: 'Transformation',
    description: 'Complete a goal after logging progress on at least 10 different days.',
    category: 'Growth',
    icon: Trophy,
    thresholdLabel: 'Goal completion with depth',
  },
]);

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDateLabel = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!(parsed instanceof Date) || Number.isNaN(parsed?.getTime?.())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getGoalProgress = (goal) => {
  const target = Math.max(0, normalizeNumber(goal?.target));
  if (!target) return 0;
  return Math.max(0, Math.min(1, Math.max(0, normalizeNumber(goal?.current)) / target));
};

const isGoalCompleted = (goal) => {
  const target = Math.max(0, normalizeNumber(goal?.target));
  if (!target) return false;
  return normalizeNumber(goal?.current) >= target;
};

const inferGoalType = (goal) => {
  const explicitType = String(goal?.goalType || '').trim();
  if (explicitType) return explicitType;
  const title = String(goal?.title || '').toLowerCase();
  const unit = String(goal?.unit || '').toLowerCase();
  const combined = `${title} ${unit}`;
  if (/(journal|write|writing|diary)/.test(combined)) return 'journal';
  if (/(run|walk|mile)/.test(combined)) return 'run_walk';
  if (/(work ?out|gym|exercise|fitness)/.test(combined)) return 'workout';
  if (/(lose weight|pound|lbs?|kg|kilogram)/.test(combined)) return 'lose_weight';
  if (/(save|\$|dollar|money|budget)/.test(combined)) return 'save_money';
  return 'custom';
};

const getGoalCategory = (goal) => {
  const type = inferGoalType(goal);
  if (type === 'journal') return 'mind';
  if (type === 'run_walk' || type === 'workout' || type === 'lose_weight') return 'body';
  if (type === 'save_money') return 'life';
  return 'general';
};

const getEntryDayKey = (entry) => {
  const explicit = String(entry?.entryDate || '').trim();
  if (explicit) return explicit.slice(0, 10);
  return String(entry?.createdAt || '').slice(0, 10);
};

const getEntryTimestamp = (entry) => {
  const primary = entry?.createdAt || entry?.updatedAt || entry?.entryDate || null;
  const parsed = primary ? new Date(primary) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
};

const isRealProgressEntry = (entry) => {
  const type = String(entry?.type || '').trim();
  if (type === 'note') return false;
  if (type === 'weight_checkin') return true;
  if (type === 'workout') return true;
  if (type === 'log') {
    const amount = normalizeNumber(entry?.amount);
    const note = String(entry?.note || '').trim();
    const photo = String(entry?.photoUrl || '').trim();
    return amount > 0 || Boolean(note) || Boolean(photo);
  }
  return false;
};

const buildUniqueDayList = (entries) => {
  const unique = Array.from(
    new Set(
      (Array.isArray(entries) ? entries : [])
        .map(getEntryDayKey)
        .filter(Boolean)
    )
  ).sort();
  return unique;
};

const calculateLongestStreak = (entries) => {
  const days = buildUniqueDayList(entries);
  if (days.length === 0) return { length: 0, lastDay: '', earnedAt: '' };
  let bestLength = 1;
  let bestEndDay = days[0];
  let currentLength = 1;
  for (let index = 1; index < days.length; index += 1) {
    const prev = new Date(`${days[index - 1]}T00:00:00`);
    const next = new Date(`${days[index]}T00:00:00`);
    const diffDays = Math.round((next.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      currentLength += 1;
    } else {
      currentLength = 1;
    }
    if (currentLength >= bestLength) {
      bestLength = currentLength;
      bestEndDay = days[index];
    }
  }
  return {
    length: bestLength,
    lastDay: bestEndDay,
    earnedAt: bestEndDay ? `${bestEndDay}T12:00:00` : '',
  };
};

const getCompletionTimestamp = (goal, entriesByGoalId) => {
  const relevant = Array.isArray(entriesByGoalId[String(goal?.id || '')]) ? entriesByGoalId[String(goal?.id || '')] : [];
  const sorted = [...relevant].sort((a, b) => getEntryTimestamp(b) - getEntryTimestamp(a));
  return sorted[0]?.createdAt || sorted[0]?.updatedAt || '';
};

export function deriveJourneyTrophyCase({ goals = [], entries = [], now = Date.now() } = {}) {
  const normalizedGoals = Array.isArray(goals) ? goals : [];
  const normalizedEntries = (Array.isArray(entries) ? entries : []).filter(isRealProgressEntry);
  const entriesByGoalId = normalizedEntries.reduce((accumulator, entry) => {
    const goalId = String(entry?.goalId || '').trim();
    if (!goalId) return accumulator;
    if (!accumulator[goalId]) accumulator[goalId] = [];
    accumulator[goalId].push(entry);
    return accumulator;
  }, {});

  const goalStats = normalizedGoals.map((goal) => {
    const goalId = String(goal?.id || '').trim();
    const relevantEntries = entriesByGoalId[goalId] || [];
    const activeDays = buildUniqueDayList(relevantEntries);
    const streak = calculateLongestStreak(relevantEntries);
    return {
      goal,
      goalId,
      progress: getGoalProgress(goal),
      completed: isGoalCompleted(goal),
      activeDays,
      activeDayCount: activeDays.length,
      streakLength: streak.length,
      streakEarnedAt: streak.earnedAt,
      category: getGoalCategory(goal),
      completedAt: isGoalCompleted(goal) ? getCompletionTimestamp(goal, entriesByGoalId) : '',
    };
  });

  const completedGoals = goalStats.filter((item) => item.completed);
  const journalGoalIds = new Set(goalStats.filter((item) => inferGoalType(item.goal) === 'journal').map((item) => item.goalId));
  const journalEntries = normalizedEntries.filter((entry) => journalGoalIds.has(String(entry?.goalId || '').trim()));
  const journalDayList = buildUniqueDayList(journalEntries);
  const journalDayCount = journalDayList.length;

  const completedGoalsByCategory = completedGoals.reduce((accumulator, item) => {
    const key = String(item.category || 'general');
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(item);
    return accumulator;
  }, {});

  const newestCompletion = [...completedGoals].sort((a, b) => getEntryTimestamp({ createdAt: b.completedAt }) - getEntryTimestamp({ createdAt: a.completedAt }))[0] || null;
  const longestGoalStreak = [...goalStats].sort((a, b) => b.streakLength - a.streakLength)[0] || null;
  const deepestGoal = [...goalStats].sort((a, b) => b.activeDayCount - a.activeDayCount)[0] || null;
  const sameCategoryWinner = Object.entries(completedGoalsByCategory)
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => b.items.length - a.items.length)[0] || null;

  const resolvedTrophies = TROPHY_DEFINITIONS.map((definition) => {
    let earned = false;
    let earnedAt = '';
    let relatedGoalId = '';
    let relatedGoalTitle = '';
    let progress = 0;

    if (definition.id === 'committed') {
      const best = [...goalStats].sort((a, b) => b.progress - a.progress)[0] || null;
      progress = best ? Math.min(1, best.progress / 0.5) : 0;
      if (best && best.progress >= 0.5) {
        earned = true;
        earnedAt = best.completedAt || (entriesByGoalId[best.goalId] || []).sort((a, b) => getEntryTimestamp(b) - getEntryTimestamp(a))[0]?.createdAt || '';
        relatedGoalId = best.goalId;
        relatedGoalTitle = String(best.goal?.title || '');
      }
    }

    if (definition.id === 'follow_through') {
      progress = Math.min(1, completedGoals.length / 1);
      if (completedGoals.length >= 1) {
        const winner = completedGoals[0];
        earned = true;
        earnedAt = winner.completedAt || '';
        relatedGoalId = winner.goalId;
        relatedGoalTitle = String(winner.goal?.title || '');
      }
    }

    if (definition.id === 'momentum') {
      progress = Math.min(1, completedGoals.length / 3);
      if (completedGoals.length >= 3) {
        earned = true;
        earnedAt = newestCompletion?.completedAt || '';
      }
    }

    if (definition.id === 'locked_in') {
      progress = Math.min(1, (longestGoalStreak?.streakLength || 0) / 10);
      if ((longestGoalStreak?.streakLength || 0) >= 10) {
        earned = true;
        earnedAt = longestGoalStreak?.streakEarnedAt || '';
        relatedGoalId = longestGoalStreak?.goalId || '';
        relatedGoalTitle = String(longestGoalStreak?.goal?.title || '');
      }
    }

    if (definition.id === 'unshakeable') {
      progress = Math.min(1, (longestGoalStreak?.streakLength || 0) / 30);
      if ((longestGoalStreak?.streakLength || 0) >= 30) {
        earned = true;
        earnedAt = longestGoalStreak?.streakEarnedAt || '';
        relatedGoalId = longestGoalStreak?.goalId || '';
        relatedGoalTitle = String(longestGoalStreak?.goal?.title || '');
      }
    }

    if (definition.id === 'steady_hand') {
      progress = Math.min(1, (deepestGoal?.activeDayCount || 0) / 20);
      if ((deepestGoal?.activeDayCount || 0) >= 20) {
        earned = true;
        earnedAt = (entriesByGoalId[deepestGoal.goalId] || []).sort((a, b) => getEntryTimestamp(b) - getEntryTimestamp(a))[0]?.createdAt || '';
        relatedGoalId = deepestGoal?.goalId || '';
        relatedGoalTitle = String(deepestGoal?.goal?.title || '');
      }
    }

    if (definition.id === 'journaled_honestly') {
      progress = Math.min(1, journalDayCount / 10);
      if (journalDayCount >= 10) {
        earned = true;
        earnedAt = journalDayList[9] ? `${journalDayList[9]}T12:00:00` : '';
      }
    }

    if (definition.id === 'deep_reflection') {
      progress = Math.min(1, journalDayCount / 30);
      if (journalDayCount >= 30) {
        earned = true;
        earnedAt = journalDayList[29] ? `${journalDayList[29]}T12:00:00` : '';
      }
    }

    if (definition.id === 'category_builder') {
      const categoryCount = sameCategoryWinner?.items?.length || 0;
      progress = Math.min(1, categoryCount / 3);
      if (categoryCount >= 3) {
        earned = true;
        earnedAt = sameCategoryWinner.items
          .map((item) => item.completedAt)
          .filter(Boolean)
          .sort()
          .slice(-1)[0] || '';
      }
    }

    if (definition.id === 'transformation') {
      const winner = goalStats
        .filter((item) => item.completed && item.activeDayCount >= 10)
        .sort((a, b) => b.activeDayCount - a.activeDayCount)[0] || null;
      progress = winner
        ? 1
        : Math.max(
          ...goalStats.map((item) => Math.min(1, Math.min(item.activeDayCount / 10, item.completed ? 1 : 0))),
          0
        );
      if (winner) {
        earned = true;
        earnedAt = winner.completedAt || '';
        relatedGoalId = winner.goalId;
        relatedGoalTitle = String(winner.goal?.title || '');
      }
    }

    const isNew = earned && earnedAt
      ? Math.max(0, Number(now) - Number(new Date(earnedAt))) <= (7 * 24 * 60 * 60 * 1000)
      : false;

    return {
      ...definition,
      earned,
      earnedAt,
      relatedGoalId,
      relatedGoalTitle,
      progress,
      isNew,
    };
  });

  return {
    trophies: resolvedTrophies,
    earnedTrophies: resolvedTrophies.filter((item) => item.earned),
    lockedTrophies: resolvedTrophies.filter((item) => !item.earned),
    stats: {
      completedGoals: completedGoals.length,
      activeGoals: goalStats.filter((item) => item.goal?.active !== false && !item.completed).length,
      journalDays: journalDayCount,
      longestStreak: longestGoalStreak?.streakLength || 0,
      newTrophies: resolvedTrophies.filter((item) => item.isNew).length,
    },
  };
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 96,
  background: 'rgba(15, 23, 42, 0.58)',
  backdropFilter: 'blur(10px)',
  padding: 16,
  overflowY: 'auto',
};

const modalStyle = {
  width: '100%',
  maxWidth: 720,
  margin: '0 auto',
  borderRadius: 28,
  overflow: 'hidden',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)',
  boxShadow: '0 28px 80px rgba(15,23,42,0.22)',
};

const darkModalStyle = {
  ...modalStyle,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(17,24,39,0.98) 100%)',
  boxShadow: '0 30px 80px rgba(2,6,23,0.55)',
};

const getCategoryColor = (category, accentColor) => {
  if (category === 'Consistency') return '#f97316';
  if (category === 'Reflection') return '#0ea5e9';
  if (category === 'Growth') return '#8b5cf6';
  return accentColor || '#10b981';
};

function TrophyCard({ trophy, darkMode = false, accentColor = '#10b981' }) {
  const Icon = trophy.icon || Trophy;
  const categoryColor = getCategoryColor(trophy.category, accentColor);
  return (
    <div
      className="rounded-3xl border p-4"
      style={{
        borderColor: trophy.earned
          ? (darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)')
          : (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.2)'),
        background: trophy.earned
          ? (darkMode
            ? `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(15,23,42,0.28) 100%)`
            : `linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.92) 100%)`)
          : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(248,250,252,0.82)'),
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            background: trophy.earned
              ? `${categoryColor}22`
              : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(148,163,184,0.12)'),
            color: trophy.earned ? categoryColor : (darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(71,85,105,0.55)'),
          }}
        >
          {trophy.earned ? <Icon size={20} /> : <Lock size={18} />}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              background: trophy.earned ? `${categoryColor}18` : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(148,163,184,0.12)'),
              color: trophy.earned ? categoryColor : (darkMode ? 'rgba(255,255,255,0.48)' : 'rgba(71,85,105,0.6)'),
            }}
          >
            {trophy.category}
          </span>
          {trophy.isNew ? (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{
                background: `${accentColor}18`,
                color: accentColor,
              }}
            >
              New
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
        {trophy.title}
      </div>
      <div className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
        {trophy.description}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(0, Math.min(100, Math.round((trophy.progress || 0) * 100)))}%`,
            background: trophy.earned ? categoryColor : (darkMode ? 'rgba(255,255,255,0.22)' : 'rgba(148,163,184,0.5)'),
          }}
        />
      </div>

      <div className="mt-3 flex items-start justify-between gap-3 text-xs">
        <span className="text-gray-500 dark:text-gray-400">{trophy.thresholdLabel}</span>
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {trophy.earned ? `Earned ${formatDateLabel(trophy.earnedAt)}` : `${Math.round((trophy.progress || 0) * 100)}% there`}
        </span>
      </div>

      {trophy.earned && trophy.relatedGoalTitle ? (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Goal: <span className="font-medium text-gray-700 dark:text-gray-200">{trophy.relatedGoalTitle}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function TrophyCase({
  isOpen = false,
  onClose,
  goals = [],
  entries = [],
  darkMode = false,
  accentColor = '#10b981',
  title = 'Trophy Case',
  subtitle = 'Real progress, consistency, and follow through. Becoming your best you.',
}) {
  const trophyCase = useMemo(
    () => deriveJourneyTrophyCase({ goals, entries }),
    [goals, entries]
  );

  if (!isOpen) return null;

  const surfaceStyle = darkMode ? darkModalStyle : modalStyle;
  const { earnedTrophies, lockedTrophies, stats } = trophyCase;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={surfaceStyle}
        className="my-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="relative border-b px-5 py-5 sm:px-6"
          style={{
            borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.14)',
            background: darkMode
              ? `linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(15,23,42,0.3) 100%)`
              : `linear-gradient(145deg, rgba(255,255,255,0.95) 0%, ${accentColor}12 100%)`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-gray-500 transition hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
            aria-label="Close trophy case"
          >
            <X size={18} />
          </button>

          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{
              background: `${accentColor}18`,
              color: accentColor,
            }}
          >
            <Trophy size={14} />
            Trophy Case
          </div>

          <div className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {title}
          </div>
          <div className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {subtitle}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Earned', value: earnedTrophies.length },
              { label: 'Completed Goals', value: stats.completedGoals },
              { label: 'Longest Streak', value: stats.longestStreak },
              { label: 'New', value: stats.newTrophies },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border px-3 py-3"
                style={{
                  borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.14)',
                  background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.75)',
                }}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  {item.label}
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Earned</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The wins that already reflect real change.
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {earnedTrophies.length > 0 ? earnedTrophies.map((trophy) => (
              <TrophyCard
                key={trophy.id}
                trophy={trophy}
                darkMode={darkMode}
                accentColor={accentColor}
              />
            )) : (
              <div
                className="rounded-3xl border border-dashed px-5 py-6 text-sm text-gray-500 dark:text-gray-400"
                style={{
                  borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.24)',
                }}
              >
                No trophies yet. That is okay. This case is meant for follow-through, not participation.
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">In Reach</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Locked until the progress is there.
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {lockedTrophies.map((trophy) => (
              <TrophyCard
                key={trophy.id}
                trophy={trophy}
                darkMode={darkMode}
                accentColor={accentColor}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { TROPHY_DEFINITIONS };
