import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const CURRENT_SUPABASE_AUTH_STORAGE_KEY = (() => {
  try {
    const url = String(supabase?.supabaseUrl || '').trim();
    const match = url.match(/^https:\/\/([^.]+)\.supabase\.co/i);
    const projectRef = String(match?.[1] || '').trim();
    return projectRef ? `sb-${projectRef}-auth-token` : '';
  } catch {
    return '';
  }
})();

const readCachedSupabaseSessionUser = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || (!(key.startsWith('sb-') && key.includes('-auth-token')) && key !== 'komo-supabase-auth')) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        const sessionLike = candidate?.currentSession || candidate?.session || candidate;
        const user = sessionLike?.user || null;
        if (user?.id) return user;
      }
    }
  } catch (error) {
    console.warn('Could not read cached Supabase auth session:', error);
  }
  return null;
};

const getSupabaseAuthDebugSnapshot = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      origin: '',
      tokenKeyCount: 0,
      tokenKeys: [],
      currentStorageKey: CURRENT_SUPABASE_AUTH_STORAGE_KEY,
      supabaseUrl: String(supabase?.supabaseUrl || ''),
      cachedUserId: '',
      hasCurrentSession: false,
      hasRefreshToken: false,
      hasAccessToken: false,
      hasSessionUser: false,
      expiresAt: '',
      expiresInPast: false,
    };
  }
  const tokenKeys = [];
  let hasCurrentSession = false;
  let hasRefreshToken = false;
  let hasAccessToken = false;
  let hasSessionUser = false;
  let expiresAt = '';
  let expiresInPast = false;
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if ((key.startsWith('sb-') && key.includes('-auth-token')) || key === 'komo-supabase-auth') {
      tokenKeys.push(key);
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        for (const candidate of candidates) {
          const sessionLike = candidate?.currentSession || candidate?.session || candidate;
          if (candidate?.currentSession || candidate?.session) hasCurrentSession = true;
          if (sessionLike?.refresh_token) hasRefreshToken = true;
          if (sessionLike?.access_token) hasAccessToken = true;
          if (sessionLike?.user?.id) hasSessionUser = true;
          const expiresAtValue = Number(sessionLike?.expires_at || 0);
          if (Number.isFinite(expiresAtValue) && expiresAtValue > 0) {
            expiresAt = new Date(expiresAtValue * 1000).toISOString();
            expiresInPast = (expiresAtValue * 1000) <= Date.now();
          }
          if (hasCurrentSession || hasRefreshToken || hasAccessToken || hasSessionUser || expiresAt) break;
        }
      } catch {}
    }
  }
  return {
    origin: String(window.location?.origin || ''),
    tokenKeyCount: tokenKeys.length,
    tokenKeys,
    currentStorageKey: CURRENT_SUPABASE_AUTH_STORAGE_KEY,
    supabaseUrl: String(supabase?.supabaseUrl || ''),
    cachedUserId: String(readCachedSupabaseSessionUser()?.id || ''),
    hasCurrentSession,
    hasRefreshToken,
    hasAccessToken,
    hasSessionUser,
    expiresAt,
    expiresInPast,
  };
};

const withTimeout = async (promise, timeoutMs, fallbackValue = null) => {
  let timeoutId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timeoutId = window.setTimeout(() => resolve(fallbackValue), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  }
};

/**
 * Manages the Supabase auth session lifecycle.
 *
 * @param readCachedProfilePhotoUrl  - pure util from App.js (stable module-level ref)
 * @param mergeAuthUserPreservingProfilePhoto - pure util from App.js (stable module-level ref)
 * @param onUserHydrated - called with the resolved user (or null) after each auth change
 */
export function useAuth({
  readCachedProfilePhotoUrl,
  mergeAuthUserPreservingProfilePhoto,
  onUserHydrated,
}) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authDebugInfo, setAuthDebugInfo] = useState(() => ({
    ...getSupabaseAuthDebugSnapshot(),
    sessionStatus: 'boot',
    authEvent: '',
  }));
  const preservedProfilePhotoUrlRef = useRef('');

  // Keep onUserHydrated in a ref so the auth effect (which runs once) always
  // calls the latest version without needing to re-subscribe.
  const onUserHydratedRef = useRef(onUserHydrated);
  useEffect(() => { onUserHydratedRef.current = onUserHydrated; });

  useEffect(() => {
    const hydrateAuthUser = async (sessionUser) => {
      const sessionUserId = String(sessionUser?.id || '').trim();
      const cachedProfilePhotoUrl = readCachedProfilePhotoUrl(sessionUserId);
      if (cachedProfilePhotoUrl) {
        preservedProfilePhotoUrlRef.current = cachedProfilePhotoUrl;
      }

      // Unblock the app immediately using session data — no extra network call needed.
      setUser((prev) => mergeAuthUserPreservingProfilePhoto(
        sessionUser ?? null,
        prev,
        preservedProfilePhotoUrlRef.current || cachedProfilePhotoUrl,
      ));
      setShowAuth(!sessionUser);
      onUserHydratedRef.current?.(sessionUser ?? null);
      setAuthDebugInfo((prev) => ({
        ...prev,
        ...getSupabaseAuthDebugSnapshot(),
        sessionStatus: sessionUser?.id ? 'session-user' : 'no-session-user',
      }));

      // Refresh full user object in background for updated metadata / avatar only.
      if (sessionUserId) {
        supabase.auth.getUser().then(({ data: userData }) => {
          if (userData?.user?.id && String(userData.user.id) === sessionUserId) {
            setUser((prev) => mergeAuthUserPreservingProfilePhoto(
              userData.user,
              prev,
              preservedProfilePhotoUrlRef.current || cachedProfilePhotoUrl,
            ));
          }
        }).catch((error) => {
          console.warn('Could not hydrate full auth user for avatar fallback:', error);
        });
      }
    };

    const cachedSessionUser = readCachedSupabaseSessionUser();
    if (cachedSessionUser?.id) {
      setAuthDebugInfo((prev) => ({
        ...prev,
        ...getSupabaseAuthDebugSnapshot(),
        sessionStatus: 'cached-session-user',
      }));
      void hydrateAuthUser(cachedSessionUser);
    } else {
      setAuthDebugInfo((prev) => ({
        ...prev,
        ...getSupabaseAuthDebugSnapshot(),
        sessionStatus: 'no-cached-session-user',
      }));
    }

    withTimeout(supabase.auth.getSession(), 12000, { timedOut: true })
      .then(async (sessionResult) => {
        if (sessionResult?.timedOut) {
          setAuthDebugInfo((prev) => ({
            ...prev,
            ...getSupabaseAuthDebugSnapshot(),
            sessionStatus: 'getSession-timeout',
          }));
          setIsLoading(false);
          return;
        }
        setAuthDebugInfo((prev) => ({
          ...prev,
          ...getSupabaseAuthDebugSnapshot(),
          sessionStatus: sessionResult?.data?.session?.user?.id ? 'getSession-user' : 'getSession-null',
        }));
        await hydrateAuthUser(sessionResult?.data?.session?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        setAuthDebugInfo((prev) => ({
          ...prev,
          ...getSupabaseAuthDebugSnapshot(),
          sessionStatus: 'getSession-error',
        }));
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthDebugInfo((prev) => ({
        ...prev,
        ...getSupabaseAuthDebugSnapshot(),
        authEvent: String(event || ''),
        sessionStatus: session?.user?.id ? `auth:${String(event || '').toLowerCase() || 'session'}` : `auth:${String(event || 'signed_out').toLowerCase()}`,
      }));
      void hydrateAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hard cap: never show the loading screen forever if auth restore stalls.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timeoutId = window.setTimeout(() => setIsLoading(false), 15000);
    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  return {
    user,
    setUser,
    isLoading,
    setIsLoading,
    showAuth,
    setShowAuth,
    authError,
    setAuthError,
    authBusy,
    setAuthBusy,
    authDebugInfo,
    preservedProfilePhotoUrlRef,
  };
}
