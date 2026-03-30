create or replace function public.redeem_share_link(p_token text)
returns table (
  target_type text,
  target_id text,
  layer_id text,
  owner_id uuid,
  granted boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_link public.share_links%rowtype;
  v_email text := null;
  v_phone text := null;
  v_owner_id uuid := null;
  v_layer_id text := null;
  v_layer_uuid uuid := null;
  v_trip_id text := null;
  v_trip_uuid uuid := null;
  v_existing_share_id uuid := null;
  v_existing_trip_member_id uuid := null;
  v_verified_share_id uuid := null;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_link
  from public.share_links
  where token = trim(coalesce(p_token, ''))
    and is_active = true
  order by created_at desc
  limit 1;

  if not found then
    return;
  end if;

  select u.email, u.phone
  into v_email, v_phone
  from auth.users u
  where u.id = v_user_id
  limit 1;

  if v_link.target_type = 'calendar' then
    select cl.owner_id, cl.id::text
    into v_owner_id, v_layer_id
    from public.calendar_layers cl
    where cl.id::text = v_link.target_id
    limit 1;

    if v_layer_id is null then
      return;
    end if;

    v_layer_uuid := v_layer_id::uuid;

    if v_owner_id is distinct from v_user_id then
      select sa.id
      into v_existing_share_id
      from public.shared_access sa
      where sa.layer_id = v_layer_uuid
        and (
          sa.shared_with_id = v_user_id
          or (v_email is not null and lower(coalesce(sa.shared_with_email, '')) = lower(v_email))
          or (v_phone is not null and coalesce(sa.shared_with_phone, '') = v_phone)
        )
      order by sa.created_at asc nulls last
      limit 1;

      if v_existing_share_id is null then
        select sa.id
        into v_existing_share_id
        from public.shared_access sa
        where sa.owner_id = v_owner_id
          and sa.layer_id = v_layer_uuid
          and coalesce(sa.shared_with_id::text, '') = ''
          and not coalesce(sa.is_banned, false)
        order by sa.created_at asc nulls last
        limit 1;
      end if;

      if v_existing_share_id is not null then
        update public.shared_access
        set shared_with_id = v_user_id,
            shared_with_email = coalesce(v_email, shared_with_email),
            shared_with_phone = coalesce(v_phone, shared_with_phone),
            can_edit = coalesce(can_edit, true),
            role = coalesce(role, 'member'),
            is_banned = false
        where id::text = v_existing_share_id;
      else
        begin
          insert into public.shared_access (
            owner_id,
            layer_id,
            calendar_id,
            shared_with_id,
            shared_with_email,
            shared_with_phone,
            can_edit,
            role,
            is_banned
          )
          values (
            v_owner_id,
            v_layer_uuid,
            v_layer_uuid,
            v_user_id,
            v_email,
            v_phone,
            true,
            'member',
            false
          );
        exception
          when unique_violation then
            null;
        end;
      end if;

      select sa.id
      into v_verified_share_id
      from public.shared_access sa
      where sa.layer_id = v_layer_uuid
        and (
          sa.shared_with_id = v_user_id
          or (v_email is not null and lower(coalesce(sa.shared_with_email, '')) = lower(v_email))
          or (v_phone is not null and coalesce(sa.shared_with_phone, '') = v_phone)
        )
      order by
        case when sa.shared_with_id = v_user_id then 0 else 1 end,
        sa.created_at asc nulls last
      limit 1;

      if v_verified_share_id is null then
        raise exception 'Unable to grant calendar access for this share link';
      end if;
    end if;

    return query
      select 'calendar'::text, v_layer_id, v_layer_id, v_owner_id, true;
    return;
  end if;

  if v_link.target_type = 'trip' then
    select sc.owner_id, sc.id::text, coalesce(sc.layer_id::text, sc.calendar_id::text)
    into v_owner_id, v_trip_id, v_layer_id
    from public.sub_calendars sc
    where sc.id::text = v_link.target_id
    limit 1;

    if v_trip_id is null then
      return;
    end if;

    v_trip_uuid := v_trip_id::uuid;
    v_layer_uuid := case when v_layer_id is not null then v_layer_id::uuid else null end;

    if v_owner_id is distinct from v_user_id and v_layer_id is not null then
      select sa.id
      into v_existing_share_id
      from public.shared_access sa
      where sa.layer_id = v_layer_uuid
        and (
          sa.shared_with_id = v_user_id
          or (v_email is not null and lower(coalesce(sa.shared_with_email, '')) = lower(v_email))
          or (v_phone is not null and coalesce(sa.shared_with_phone, '') = v_phone)
        )
      order by sa.created_at asc nulls last
      limit 1;

      if v_existing_share_id is null then
        select sa.id
        into v_existing_share_id
        from public.shared_access sa
        where sa.owner_id = v_owner_id
          and sa.layer_id = v_layer_uuid
          and coalesce(sa.shared_with_id::text, '') = ''
          and not coalesce(sa.is_banned, false)
        order by sa.created_at asc nulls last
        limit 1;
      end if;

      if v_existing_share_id is not null then
        update public.shared_access
        set shared_with_id = v_user_id,
            shared_with_email = coalesce(v_email, shared_with_email),
            shared_with_phone = coalesce(v_phone, shared_with_phone),
            can_edit = coalesce(can_edit, true),
            role = coalesce(role, 'member'),
            is_banned = false
        where id::text = v_existing_share_id;
      else
        begin
          insert into public.shared_access (
            owner_id,
            layer_id,
            calendar_id,
            shared_with_id,
            shared_with_email,
            shared_with_phone,
            can_edit,
            role,
            is_banned
          )
          values (
            v_owner_id,
            v_layer_uuid,
            v_layer_uuid,
            v_user_id,
            v_email,
            v_phone,
            true,
            'member',
            false
          );
        exception
          when unique_violation then
            null;
        end;
      end if;

      select sa.id
      into v_verified_share_id
      from public.shared_access sa
      where sa.layer_id = v_layer_uuid
        and (
          sa.shared_with_id = v_user_id
          or (v_email is not null and lower(coalesce(sa.shared_with_email, '')) = lower(v_email))
          or (v_phone is not null and coalesce(sa.shared_with_phone, '') = v_phone)
        )
      order by
        case when sa.shared_with_id = v_user_id then 0 else 1 end,
        sa.created_at asc nulls last
      limit 1;

      if v_verified_share_id is null then
        raise exception 'Unable to grant trip access for this share link';
      end if;
    end if;

    if v_owner_id is distinct from v_user_id and (v_email is not null or v_phone is not null) then
      select scm.id
      into v_existing_trip_member_id
      from public.sub_calendar_members scm
      where scm.sub_calendar_id = v_trip_uuid
        and (
          (v_email is not null and lower(coalesce(scm.email, '')) = lower(v_email))
          or (v_phone is not null and coalesce(scm.phone, '') = v_phone)
        )
      order by scm.created_at asc nulls last
      limit 1;

      if v_existing_trip_member_id is not null then
        update public.sub_calendar_members
        set status = 'accepted'
        where id::text = v_existing_trip_member_id;
      else
        begin
          insert into public.sub_calendar_members (
            sub_calendar_id,
            email,
            phone,
            added_by,
            status,
            invited_at
          )
          values (
            v_trip_uuid,
            v_email,
            v_phone,
            v_owner_id,
            'accepted',
            now()
          );
        exception
          when unique_violation then
            null;
        end;
      end if;
    end if;

    return query
      select 'trip'::text, v_trip_id, v_layer_id, v_owner_id, true;
    return;
  end if;

  return;
end;
$$;

grant execute on function public.redeem_share_link(text) to authenticated;
