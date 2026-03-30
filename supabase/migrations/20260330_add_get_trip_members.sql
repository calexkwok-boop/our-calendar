create or replace function public.get_trip_members(p_sub_calendar_id text)
returns table (
  id uuid,
  sub_calendar_id text,
  email text,
  phone text,
  added_by uuid,
  status text,
  invited_at timestamptz,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_phone text := coalesce(auth.jwt() ->> 'phone', '');
  v_owner_id uuid := null;
  v_is_member boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select sc.owner_id
  into v_owner_id
  from public.sub_calendars sc
  where sc.id::text = trim(coalesce(p_sub_calendar_id, ''))
  limit 1;

  if v_owner_id is null then
    return;
  end if;

  if v_owner_id = v_user_id then
    v_is_member := true;
  else
    select exists (
      select 1
      from public.sub_calendar_members scm
      where scm.sub_calendar_id::text = trim(coalesce(p_sub_calendar_id, ''))
        and lower(coalesce(scm.status, 'accepted')) = 'accepted'
        and (
          (v_email <> '' and lower(coalesce(scm.email, '')) = v_email)
          or (v_phone <> '' and coalesce(scm.phone, '') = v_phone)
        )
    )
    into v_is_member;
  end if;

  if not v_is_member then
    raise exception 'Not authorized to view trip members';
  end if;

  return query
    select
      scm.id,
      scm.sub_calendar_id::text,
      scm.email,
      scm.phone,
      scm.added_by,
      scm.status,
      scm.invited_at,
      scm.accepted_at
    from public.sub_calendar_members scm
    where scm.sub_calendar_id::text = trim(coalesce(p_sub_calendar_id, ''))
    order by scm.invited_at asc nulls last, scm.accepted_at asc nulls last, scm.email asc nulls last, scm.phone asc nulls last;
end;
$$;

grant execute on function public.get_trip_members(text) to authenticated;
