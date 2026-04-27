-- After a host handoff the new host's role in popup_event_members becomes 'host',
-- but the original creator's user_id is still stored in popup_event_details.created_by.
-- Any UPDATE policy that checks only created_by = auth.uid() blocks the new host.
-- This migration replaces those policies with one that also accepts the current host.

-- Drop every existing UPDATE policy on popup_event_details so we start clean.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'popup_event_details'
      AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.popup_event_details', pol.policyname);
  END LOOP;
END$$;

-- New UPDATE policy: original creator OR current host.
-- popup_event_details.id is the event UUID == popup_event_members.event_id.
CREATE POLICY "creator_or_host_can_update_event_details"
ON public.popup_event_details
FOR UPDATE
USING (
  -- Original creator
  created_by::text = auth.uid()::text
  OR
  -- Any member currently holding the host role (after a handoff)
  EXISTS (
    SELECT 1
    FROM public.popup_event_members m
    WHERE m.event_id::text = popup_event_details.id::text
      AND m.user_id::text = auth.uid()::text
      AND m.role = 'host'
  )
);
