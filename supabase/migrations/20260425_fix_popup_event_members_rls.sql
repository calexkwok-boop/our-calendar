-- Allow any member of an event to see all other members of that same event.
-- Also allow the host (or calendar layer owner) to update member roles (promote/demote).

-- Drop any existing restrictive SELECT policies on this table
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'popup_event_members' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.popup_event_members', pol.policyname);
  END LOOP;
END$$;

-- SELECT: see all members of any event you also belong to, or own via calendar layer
CREATE POLICY "event_members_can_see_peers"
ON public.popup_event_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.popup_event_members m
    WHERE m.event_id::text = popup_event_members.event_id::text
      AND m.user_id::text = auth.uid()::text
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.popup_events pe
    JOIN public.calendar_layers cl ON cl.id::text = pe.layer_id::text
    WHERE pe.event_id::text = popup_event_members.event_id::text
      AND cl.owner_id::text = auth.uid()::text
  )
);

-- UPDATE: host or layer owner can update member roles (promote / demote)
DROP POLICY IF EXISTS "host_can_update_member_roles" ON public.popup_event_members;

CREATE POLICY "host_can_update_member_roles"
ON public.popup_event_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.popup_event_members m
    WHERE m.event_id::text = popup_event_members.event_id::text
      AND m.user_id::text = auth.uid()::text
      AND m.role = 'host'
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.popup_events pe
    JOIN public.calendar_layers cl ON cl.id::text = pe.layer_id::text
    WHERE pe.event_id::text = popup_event_members.event_id::text
      AND cl.owner_id::text = auth.uid()::text
  )
);
