import { useState, useCallback } from 'react';

const LAYOUT_KEY = 'home-section-layout-v1';

export const DEFAULT_HOME_SECTIONS = [
  { id: 'whatsNext', label: "What's Next Today" },
  { id: 'photoOfDay', label: 'Photo of the Day' },
  { id: 'comingUpThisWeek', label: 'Coming Up This Week' },
  { id: 'tripSpotlight', label: 'Your Next Adventure' },
  { id: 'onYourMind', label: 'On Your Mind' },
  { id: 'yearSoFar', label: 'Year So Far' },
  { id: 'memories', label: 'Memories' },
  { id: 'quickThoughts', label: 'Quick Thoughts' },
];

function readLayout() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LAYOUT_KEY) : null;
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return null;
    const savedMap = new Map(saved.map((s) => [s.id, s]));
    const knownIds = new Set(DEFAULT_HOME_SECTIONS.map((s) => s.id));
    const merged = saved
      .filter((s) => knownIds.has(s.id))
      .map((s) => ({ ...DEFAULT_HOME_SECTIONS.find((d) => d.id === s.id), visible: s.visible !== false }));
    // Append any new sections not yet in saved layout
    DEFAULT_HOME_SECTIONS.forEach((d) => {
      if (!savedMap.has(d.id)) merged.push({ ...d, visible: true });
    });
    return merged;
  } catch {
    return null;
  }
}

export default function useHomeSectionLayout() {
  const [sections, setSectionsRaw] = useState(
    () => readLayout() || DEFAULT_HOME_SECTIONS.map((s) => ({ ...s, visible: true })),
  );

  const setSections = useCallback((updater) => {
    setSectionsRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        window.localStorage.setItem(
          LAYOUT_KEY,
          JSON.stringify(next.map(({ id, visible }) => ({ id, visible }))),
        );
      } catch {}
      return next;
    });
  }, []);

  const toggleVisible = useCallback((id) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  }, [setSections]);

  const moveUp = useCallback((id) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, [setSections]);

  const moveDown = useCallback((id) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return next;
    });
  }, [setSections]);

  const reorder = useCallback((fromIndex, toIndex) => {
    setSections((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, [setSections]);

  return { sections, toggleVisible, moveUp, moveDown, reorder };
}
