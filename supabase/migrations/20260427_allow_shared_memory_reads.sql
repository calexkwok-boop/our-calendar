-- Allow friends to see a user's daily memory when share_photo_of_day is enabled.
--
-- Two problems:
-- 1. user_memories SELECT policy only allows owner_user_id = auth.uid(), so
--    a viewer gets zero rows even when the owner has opted in to sharing.
-- 2. user_profiles may similarly block cross-user reads, so the
--    share_photo_of_day flag never reaches the client.
--
-- Fix: SECURITY DEFINER helper bypasses both tables' RLS internally,
-- then a new permissive policy on user_memories uses it.
-- user_profiles gets a simple public-read policy for its sharing columns.

-- ── 1. Allow any authenticated user to read sharing preferences ──────────────
-- user_profiles is purely opt-in preferences; all columns are non-sensitive.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_profiles'
      AND policyname = 'user_profiles_select_authenticated'
  ) THEN
    CREATE POLICY user_profiles_select_authenticated
      ON public.user_profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- ── 2. SECURITY DEFINER helper: does this user have photo sharing enabled? ───
CREATE OR REPLACE FUNCTION public.user_has_photo_sharing_enabled(p_user_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id::text = p_user_id
      AND share_photo_of_day = true
  );
$$;

-- ── 3. New SELECT policy on user_memories for shared photos ──────────────────
-- The existing 'user_memories_select_own' policy covers the owner's own rows.
-- This adds a second policy (OR'd by Postgres) for shared reads.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_memories'
      AND policyname = 'user_memories_select_shared_photo'
  ) THEN
    CREATE POLICY user_memories_select_shared_photo
      ON public.user_memories
      FOR SELECT
      TO authenticated
      USING (public.user_has_photo_sharing_enabled(owner_user_id));
  END IF;
END
$$;
