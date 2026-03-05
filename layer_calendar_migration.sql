-- Layer-based calendars migration (safe, idempotent)
-- Purpose:
-- 1) Introduce top-level calendar layers
-- 2) Scope events/lists/shares by layer_id
-- 3) Backfill all current data into each owner's default "Ellie & Miles" layer
--
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

-- 1) Layers table
create table if not exists public.calendar_layers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  is_default boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);

-- 2) Add layer_id to app tables
alter table public.events add column if not exists layer_id uuid;
alter table public.shared_access add column if not exists layer_id uuid;
alter table public.shared_list_groups add column if not exists layer_id uuid;
alter table public.shared_lists add column if not exists layer_id uuid;

-- 3) Ensure each owner has one default layer named "Ellie & Miles"
insert into public.calendar_layers (owner_id, name, is_default, created_by)
select owners.owner_id, 'Ellie & Miles', true, null
from (
  select distinct user_id as owner_id from public.events where user_id is not null
  union
  select distinct owner_id from public.shared_access where owner_id is not null
  union
  select distinct owner_id from public.shared_list_groups where owner_id is not null
  union
  select distinct owner_id from public.shared_lists where owner_id is not null
) owners
where not exists (
  select 1
  from public.calendar_layers cl
  where cl.owner_id = owners.owner_id
    and cl.is_default = true
);

-- 4) Backfill layer_id to each table using owner default layer
with owner_default as (
  select distinct on (owner_id) owner_id, id as default_layer_id
  from public.calendar_layers
  where is_default = true
  order by owner_id, created_at asc, id asc
)
update public.events e
set layer_id = od.default_layer_id
from owner_default od
where e.layer_id is null
  and e.user_id = od.owner_id;

with owner_default as (
  select distinct on (owner_id) owner_id, id as default_layer_id
  from public.calendar_layers
  where is_default = true
  order by owner_id, created_at asc, id asc
)
update public.shared_access sa
set layer_id = od.default_layer_id
from owner_default od
where sa.layer_id is null
  and sa.owner_id = od.owner_id;

with owner_default as (
  select distinct on (owner_id) owner_id, id as default_layer_id
  from public.calendar_layers
  where is_default = true
  order by owner_id, created_at asc, id asc
)
update public.shared_list_groups g
set layer_id = od.default_layer_id
from owner_default od
where g.layer_id is null
  and g.owner_id = od.owner_id;

with owner_default as (
  select distinct on (owner_id) owner_id, id as default_layer_id
  from public.calendar_layers
  where is_default = true
  order by owner_id, created_at asc, id asc
)
update public.shared_lists l
set layer_id = od.default_layer_id
from owner_default od
where l.layer_id is null
  and l.owner_id = od.owner_id;

-- 5) Enforce not null after backfill
alter table public.events alter column layer_id set not null;
alter table public.shared_access alter column layer_id set not null;
alter table public.shared_list_groups alter column layer_id set not null;
alter table public.shared_lists alter column layer_id set not null;

-- 6) Constraints/indexes to prevent duplicates
create unique index if not exists uq_calendar_layers_owner_name
  on public.calendar_layers(owner_id, lower(trim(name)));

create unique index if not exists uq_calendar_layers_owner_default
  on public.calendar_layers(owner_id)
  where is_default = true;

create unique index if not exists uq_shared_access_layer_email
  on public.shared_access(layer_id, lower(trim(shared_with_email)))
  where shared_with_email is not null;

create index if not exists idx_events_user_layer on public.events(user_id, layer_id);
create index if not exists idx_shared_access_owner_layer on public.shared_access(owner_id, layer_id);
create index if not exists idx_shared_list_groups_owner_layer on public.shared_list_groups(owner_id, layer_id);
create index if not exists idx_shared_lists_owner_layer_list on public.shared_lists(owner_id, layer_id, list_id);

-- 7) Quick sanity report
-- select owner_id, count(*) as layers, sum(case when is_default then 1 else 0 end) as default_layers
-- from public.calendar_layers
-- group by owner_id
-- order by owner_id;
