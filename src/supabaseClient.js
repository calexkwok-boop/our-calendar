import { createClient } from '@supabase/supabase-js';

// Bypass navigator.locks so auth works correctly across all browsers/contexts.
const runWithoutNavigatorAuthLock = async (_name, _acquireTimeout, fn) => fn();
const AUTH_STORAGE_KEY = 'komo-supabase-auth';
const browserStorage = (() => {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  };
})();

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      lock: runWithoutNavigatorAuthLock,
      storage: browserStorage,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
