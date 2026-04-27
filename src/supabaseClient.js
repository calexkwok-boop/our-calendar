import { createClient } from '@supabase/supabase-js';

// Bypass navigator.locks so auth works correctly across all browsers/contexts.
const runWithoutNavigatorAuthLock = async (_name, _acquireTimeout, fn) => fn();

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      lock: runWithoutNavigatorAuthLock,
    },
  }
);
