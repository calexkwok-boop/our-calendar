-- Let event creators, layer moderators/owners, and current popup hosts delete events.
-- This fixes cases where the UI correctly exposes delete in shared/public calendars
-- but the underlying events row remains protected by stricter legacy RLS.

CREATE OR REPLACE FUNCTION public.current_user_can_moderate_layer(p_layer_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.calendar_layers cl
      WHERE cl.id = p_layer_id
        AND cl.owner_id::text = auth.uid()::text
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.shared_access sa
      WHERE sa.layer_id = p_layer_id
        AND COALESCE(sa.is_banned, false) = false
        AND lower(COALESCE(sa.role, '')) IN ('admin', 'moderator')
        AND (
          sa.shared_with_id::text = auth.uid()::text
          OR lower(COALESCE(sa.shared_with_email, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
          OR regexp_replace(COALESCE(sa.shared_with_phone, ''), '\D', '', 'g') = regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_matches_event_creator(
  p_user_id uuid,
  p_created_by text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(p_user_id::text, '') = auth.uid()::text
    OR lower(COALESCE(p_created_by, '')) = lower(COALESCE(auth.uid()::text, ''))
    OR lower(COALESCE(p_created_by, '')) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    OR regexp_replace(COALESCE(p_created_by, ''), '\D', '', 'g') = regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g');
$$;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'events'
      AND cmd = 'DELETE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events', pol.policyname);
  END LOOP;
END$$;

CREATE POLICY "events_delete_by_creator_moderator_or_popup_host"
ON public.events
FOR DELETE
USING (
  public.current_user_matches_event_creator(user_id, created_by)
  OR public.current_user_can_moderate_layer(layer_id)
  OR public.current_user_is_event_host(id)
);
