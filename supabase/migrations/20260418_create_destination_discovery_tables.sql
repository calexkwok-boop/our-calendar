-- Destination discovery recommendations plus click/save tracking.
-- Apply this in Supabase SQL editor or through your migration flow.

create extension if not exists pgcrypto;

create table if not exists public.destination_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  destination_name text not null,
  destination_image text,
  location text,
  vibe text,
  review text not null,
  best_for text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists destination_posts_created_at_idx
  on public.destination_posts (created_at desc);

create index if not exists destination_posts_likes_count_idx
  on public.destination_posts (likes_count desc);

alter table public.destination_posts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'destination_posts'
      and policyname = 'destination_posts_select_authenticated'
  ) then
    create policy destination_posts_select_authenticated
      on public.destination_posts
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'destination_posts'
      and policyname = 'destination_posts_insert_own'
  ) then
    create policy destination_posts_insert_own
      on public.destination_posts
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'destination_posts'
      and policyname = 'destination_posts_delete_own'
  ) then
    create policy destination_posts_delete_own
      on public.destination_posts
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.destination_discovery_counts (
  destination_key text primary key,
  destination_name text not null,
  location text,
  vibe text,
  photo text,
  click_count integer not null default 0,
  save_count integer not null default 0,
  last_clicked_at timestamptz,
  last_saved_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists destination_discovery_counts_save_count_idx
  on public.destination_discovery_counts (save_count desc, updated_at desc);

create index if not exists destination_discovery_counts_click_count_idx
  on public.destination_discovery_counts (click_count desc, updated_at desc);

alter table public.destination_discovery_counts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'destination_discovery_counts'
      and policyname = 'destination_discovery_counts_select_authenticated'
  ) then
    create policy destination_discovery_counts_select_authenticated
      on public.destination_discovery_counts
      for select
      to authenticated
      using (true);
  end if;
end $$;

create table if not exists public.destination_discovery_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  destination_key text not null,
  destination_name text not null,
  location text,
  vibe text,
  photo text,
  event_type text not null check (event_type in ('click', 'save')),
  created_at timestamptz not null default now()
);

create index if not exists destination_discovery_events_destination_key_idx
  on public.destination_discovery_events (destination_key, created_at desc);

create index if not exists destination_discovery_events_user_id_idx
  on public.destination_discovery_events (user_id, created_at desc);

alter table public.destination_discovery_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'destination_discovery_events'
      and policyname = 'destination_discovery_events_select_own'
  ) then
    create policy destination_discovery_events_select_own
      on public.destination_discovery_events
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.record_destination_interaction(
  p_destination_key text,
  p_destination_name text,
  p_location text default null,
  p_vibe text default null,
  p_photo text default null,
  p_event_type text default 'click'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_event_type text := lower(coalesce(p_event_type, 'click'));
begin
  if nullif(trim(coalesce(p_destination_key, '')), '') is null
     or nullif(trim(coalesce(p_destination_name, '')), '') is null then
    return;
  end if;

  if normalized_event_type not in ('click', 'save') then
    raise exception 'Invalid destination event type: %', p_event_type;
  end if;

  insert into public.destination_discovery_events (
    user_id,
    destination_key,
    destination_name,
    location,
    vibe,
    photo,
    event_type
  )
  values (
    auth.uid(),
    p_destination_key,
    p_destination_name,
    nullif(trim(coalesce(p_location, '')), ''),
    nullif(trim(coalesce(p_vibe, '')), ''),
    nullif(trim(coalesce(p_photo, '')), ''),
    normalized_event_type
  );

  insert into public.destination_discovery_counts (
    destination_key,
    destination_name,
    location,
    vibe,
    photo,
    click_count,
    save_count,
    last_clicked_at,
    last_saved_at,
    updated_at
  )
  values (
    p_destination_key,
    p_destination_name,
    nullif(trim(coalesce(p_location, '')), ''),
    nullif(trim(coalesce(p_vibe, '')), ''),
    nullif(trim(coalesce(p_photo, '')), ''),
    case when normalized_event_type = 'click' then 1 else 0 end,
    case when normalized_event_type = 'save' then 1 else 0 end,
    case when normalized_event_type = 'click' then now() else null end,
    case when normalized_event_type = 'save' then now() else null end,
    now()
  )
  on conflict (destination_key) do update
    set destination_name = excluded.destination_name,
        location = coalesce(excluded.location, public.destination_discovery_counts.location),
        vibe = coalesce(excluded.vibe, public.destination_discovery_counts.vibe),
        photo = coalesce(excluded.photo, public.destination_discovery_counts.photo),
        click_count = public.destination_discovery_counts.click_count + excluded.click_count,
        save_count = public.destination_discovery_counts.save_count + excluded.save_count,
        last_clicked_at = coalesce(excluded.last_clicked_at, public.destination_discovery_counts.last_clicked_at),
        last_saved_at = coalesce(excluded.last_saved_at, public.destination_discovery_counts.last_saved_at),
        updated_at = now();
end;
$$;

grant execute on function public.record_destination_interaction(text, text, text, text, text, text)
  to authenticated;
