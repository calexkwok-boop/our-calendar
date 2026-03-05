-- Full calendar scope migration
-- Run this in Supabase SQL editor before deploying the app changes.

create extension if not exists pgcrypto;

create table if not exists public.full_calendars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.events
  add column if not exists calendar_id uuid;

alter table public.shared_access
  add column if not exists calendar_id uuid;

alter table public.shared_list_groups
  add column if not exists calendar_id uuid;

alter table public.shared_lists
  add column if not exists calendar_id uuid;

insert into public.full_calendars (owner_id, name, created_by)
select distinct e.user_id, 'Main Calendar', e.created_by
from public.events e
where e.user_id is not null
  and not exists (
    select 1 from public.full_calendars fc where fc.owner_id = e.user_id
  );

insert into public.full_calendars (owner_id, name, created_by)
select distinct sa.owner_id, 'Main Calendar', sa.shared_with_email
from public.shared_access sa
where sa.owner_id is not null
  and not exists (
    select 1 from public.full_calendars fc where fc.owner_id = sa.owner_id
  );

with owner_main as (
  select distinct on (owner_id) owner_id, id as calendar_id
  from public.full_calendars
  order by owner_id, created_at asc, id asc
)
update public.events e
set calendar_id = om.calendar_id
from owner_main om
where e.calendar_id is null
  and e.user_id = om.owner_id;

with owner_main as (
  select distinct on (owner_id) owner_id, id as calendar_id
  from public.full_calendars
  order by owner_id, created_at asc, id asc
)
update public.shared_access sa
set calendar_id = om.calendar_id
from owner_main om
where sa.calendar_id is null
  and sa.owner_id = om.owner_id;

with owner_main as (
  select distinct on (owner_id) owner_id, id as calendar_id
  from public.full_calendars
  order by owner_id, created_at asc, id asc
)
update public.shared_list_groups g
set calendar_id = om.calendar_id
from owner_main om
where g.calendar_id is null
  and g.owner_id = om.owner_id;

with owner_main as (
  select distinct on (owner_id) owner_id, id as calendar_id
  from public.full_calendars
  order by owner_id, created_at asc, id asc
)
update public.shared_lists l
set calendar_id = om.calendar_id
from owner_main om
where l.calendar_id is null
  and l.owner_id = om.owner_id;

alter table public.events alter column calendar_id set not null;
alter table public.shared_access alter column calendar_id set not null;
alter table public.shared_list_groups alter column calendar_id set not null;
alter table public.shared_lists alter column calendar_id set not null;

create index if not exists idx_events_user_calendar on public.events(user_id, calendar_id);
create index if not exists idx_shared_access_target_calendar on public.shared_access(shared_with_email, shared_with_id, calendar_id);
create index if not exists idx_shared_access_owner_calendar on public.shared_access(owner_id, calendar_id);
create index if not exists idx_shared_list_groups_owner_calendar on public.shared_list_groups(owner_id, calendar_id);
create index if not exists idx_shared_lists_owner_calendar_list on public.shared_lists(owner_id, calendar_id, list_id);
