import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

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
  const [showAuth, setShowAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
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

    withTimeout(supabase.auth.getSession(), 12000, { data: { session: null } })
      .then(async (sessionResult) => {
        await hydrateAuthUser(sessionResult?.data?.session?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    preservedProfilePhotoUrlRef,
  };
}
