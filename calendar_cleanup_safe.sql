-- Safe cleanup for full-calendar model already used by the app.
-- Goal: remove duplicate "main" calendars and duplicate shares, then add guards.
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

-- Ensure base tables/columns exist (idempotent guards)
create table if not exists public.full_calendars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.events add column if not exists calendar_id uuid;
alter table public.shared_access add column if not exists calendar_id uuid;
alter table public.shared_list_groups add column if not exists calendar_id uuid;
alter table public.shared_lists add column if not exists calendar_id uuid;

-- 1) Make sure each owner has at least one calendar
insert into public.full_calendars (owner_id, name, created_by)
select owners.owner_id, 'Main Calendar', null
from (
  select distinct user_id as owner_id from public.events where user_id is not null
  union
  select distinct owner_id from public.shared_access where owner_id is not null
) owners
where not exists (
  select 1 from public.full_calendars fc where fc.owner_id = owners.owner_id
);

-- 2) Pick one canonical calendar per owner (earliest created), map all owner rows to it
with canonical as (
  select distinct on (owner_id) owner_id, id as canonical_calendar_id
  from public.full_calendars
  order by owner_id, created_at asc, id asc
)
update public.events e
set calendar_id = c.canonical_calendar_id
from canonical c
where e.user_id = c.owner_id
  and (e.calendar_id is null or e.calendar_id <> c.canonical_calendar_id);

with canonical as (
  select distinct on (owner_id) owner_id, id as canonical_calendar_id
  from public.full_calendars
  order by owner_id, created_at asc, id asc
)
update public.shared_access s
set calendar_id = c.canonical_calendar_id
from canonical c
where s.owner_id = c.owner_id
  and (s.calendar_id is null or s.calendar_id <> c.canonical_calendar_id);

with canonical as (
  select distinct on (owner_id) owner_id, id as canonical_calendar_id
  from public.full_calendars
  order by owner_id, created_at asc, id asc
)
update public.shared_list_groups g
set calendar_id = c.canonical_calendar_id
from canonical c
where g.owner_id = c.owner_id
  and (g.calendar_id is null or g.calendar_id <> c.canonical_calendar_id);

with canonical as (
  select distinct on (owner_id) owner_id, id as canonical_calendar_id
  from public.full_calendars
  order by owner_id, created_at asc, id asc
)
update public.shared_lists l
set calendar_id = c.canonical_calendar_id
from canonical c
where l.owner_id = c.owner_id
  and (l.calendar_id is null or l.calendar_id <> c.canonical_calendar_id);

-- 3) Delete duplicate calendar rows per owner+name, keep earliest
with ranked as (
  select
    id,
    row_number() over (
      partition by owner_id, lower(trim(name))
      order by created_at asc, id asc
    ) as rn
  from public.full_calendars
)
delete from public.full_calendars fc
using ranked r
where fc.id = r.id
  and r.rn > 1;

-- 4) Remove duplicate share rows per calendar/email
with ranked as (
  select
    id,
    row_number() over (
      partition by calendar_id, lower(trim(shared_with_email))
      order by id asc
    ) as rn
  from public.shared_access
  where shared_with_email is not null
)
delete from public.shared_access sa
using ranked r
where sa.id = r.id
  and r.rn > 1;

-- 5) Add safety constraints/indexes (idempotent)
create unique index if not exists uq_full_cal_owner_name
  on public.full_calendars(owner_id, lower(trim(name)));

create unique index if not exists uq_shared_access_calendar_email
  on public.shared_access(calendar_id, lower(trim(shared_with_email)))
  where shared_with_email is not null;

create index if not exists idx_events_user_calendar on public.events(user_id, calendar_id);
create index if not exists idx_shared_access_owner_calendar on public.shared_access(owner_id, calendar_id);
create index if not exists idx_shared_list_groups_owner_calendar on public.shared_list_groups(owner_id, calendar_id);
create index if not exists idx_shared_lists_owner_calendar_list on public.shared_lists(owner_id, calendar_id, list_id);
