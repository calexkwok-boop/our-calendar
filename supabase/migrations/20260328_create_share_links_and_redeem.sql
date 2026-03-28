create extension if not exists pgcrypto;

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  owner_id uuid not null,
  target_type text not null check (target_type in ('calendar', 'trip')),
  target_id text not null,
  layer_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists share_links_one_active_per_target_idx
  on public.share_links (owner_id, target_type, target_id)
  where is_active = true;

alter table public.share_links enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'share_links'
      and policyname = 'share_links_select_own'
  ) then
    create policy share_links_select_own
      on public.share_links
      for select
      to authenticated
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'share_links'
      and policyname = 'share_links_insert_own'
  ) then
    create policy share_links_insert_own
      on public.share_links
      for insert
      to authenticated
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'share_links'
      and policyname = 'share_links_update_own'
  ) then
    create policy share_links_update_own
      on public.share_links
      for update
      to authenticated
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'share_links'
      and policyname = 'share_links_delete_own'
  ) then
    create policy share_links_delete_own
      on public.share_links
      for delete
      to authenticated
      using (auth.uid() = owner_id);
  end if;
end
$$;

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
  v_trip_id text := null;
  v_existing_share_id text := null;
  v_existing_trip_member_id text := null;
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

    if v_owner_id is distinct from v_user_id then
      select sa.id::text
      into v_existing_share_id
      from public.shared_access sa
      where sa.layer_id::text = v_layer_id
        and (
          sa.shared_with_id = v_user_id
          or (v_email is not null and lower(coalesce(sa.shared_with_email, '')) = lower(v_email))
          or (v_phone is not null and coalesce(sa.shared_with_phone, '') = v_phone)
        )
      order by sa.created_at asc nulls last
      limit 1;

      if v_existing_share_id is not null then
        update public.shared_access
        set shared_with_id = coalesce(shared_with_id, v_user_id),
            shared_with_email = coalesce(shared_with_email, v_email),
            shared_with_phone = coalesce(shared_with_phone, v_phone)
        where id::text = v_existing_share_id;
      else
        begin
          insert into public.shared_access (
            owner_id,
            layer_id,
            calendar_id,
            shared_with_id,
            shared_with_email,
            shared_with_phone
          )
          values (
            v_owner_id,
            v_layer_id,
            v_layer_id,
            v_user_id,
            v_email,
            v_phone
          );
        exception
          when unique_violation then
            null;
        end;
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

    if v_owner_id is distinct from v_user_id and v_layer_id is not null then
      select sa.id::text
      into v_existing_share_id
      from public.shared_access sa
      where sa.layer_id::text = v_layer_id
        and (
          sa.shared_with_id = v_user_id
          or (v_email is not null and lower(coalesce(sa.shared_with_email, '')) = lower(v_email))
          or (v_phone is not null and coalesce(sa.shared_with_phone, '') = v_phone)
        )
      order by sa.created_at asc nulls last
      limit 1;

      if v_existing_share_id is not null then
        update public.shared_access
        set shared_with_id = coalesce(shared_with_id, v_user_id),
            shared_with_email = coalesce(shared_with_email, v_email),
            shared_with_phone = coalesce(shared_with_phone, v_phone)
        where id::text = v_existing_share_id;
      else
        begin
          insert into public.shared_access (
            owner_id,
            layer_id,
            calendar_id,
            shared_with_id,
            shared_with_email,
            shared_with_phone
          )
          values (
            v_owner_id,
            v_layer_id,
            v_layer_id,
            v_user_id,
            v_email,
            v_phone
          );
        exception
          when unique_violation then
            null;
        end;
      end if;
    end if;

    if v_owner_id is distinct from v_user_id and (v_email is not null or v_phone is not null) then
      select scm.id::text
      into v_existing_trip_member_id
      from public.sub_calendar_members scm
      where scm.sub_calendar_id::text = v_trip_id
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
            v_trip_id,
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
