-- Fix infinite recursion in popup_event_members RLS.
-- The previous policy queried popup_event_members from within itself, causing infinite recursion.
-- Solution: wrap the membership check in a SECURITY DEFINER function so it bypasses RLS.

CREATE OR REPLACE FUNCTION public.current_user_is_event_member(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.popup_event_members
    WHERE event_id = p_event_id
      AND user_id = auth.uid()
  );
$$;

-- Drop and replace the broken SELECT policy
DROP POLICY IF EXISTS "event_members_can_see_peers" ON public.popup_event_members;

CREATE POLICY "event_members_can_see_peers"
ON public.popup_event_members
FOR SELECT
USING (
  public.current_user_is_event_member(event_id)
  OR
  EXISTS (
    SELECT 1
    FROM public.popup_events pe
    JOIN public.calendar_layers cl ON cl.id::text = pe.layer_id::text
    WHERE pe.event_id::text = popup_event_members.event_id::text
      AND cl.owner_id::text = auth.uid()::text
  )
);

-- Also fix the UPDATE policy for the same reason (it also self-references popup_event_members)
DROP POLICY IF EXISTS "host_can_update_member_roles" ON public.popup_event_members;

CREATE OR REPLACE FUNCTION public.current_user_is_event_host(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.popup_event_members
    WHERE event_id = p_event_id
      AND user_id = auth.uid()
      AND role = 'host'
  );
$$;

CREATE POLICY "host_can_update_member_roles"
ON public.popup_event_members
FOR UPDATE
USING (
  public.current_user_is_event_host(event_id)
  OR
  EXISTS (
    SELECT 1
    FROM public.popup_events pe
    JOIN public.calendar_layers cl ON cl.id::text = pe.layer_id::text
    WHERE pe.event_id::text = popup_event_members.event_id::text
      AND cl.owner_id::text = auth.uid()::text
  )
);
