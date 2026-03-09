-- Layer-scoped categories migration (sync-safe, idempotent)
-- Run in Supabase SQL Editor.
--
-- Goal:
-- 1) Add layer_id/calendar_id to categories
-- 2) Backfill existing rows to each user's default layer
-- 3) Enforce per-layer uniqueness: (user_id, layer_id, key)
-- 4) Enable RLS policies for authenticated user ownership

do $$
begin
  if to_regclass('public.categories') is null then
    raise exception 'Table public.categories does not exist.';
  end if;
  if to_regclass('public.calendar_layers') is null then
    raise exception 'Table public.calendar_layers does not exist. Run layer calendar migration first.';
  end if;
end $$;

alter table public.categories add column if not exists layer_id uuid;
alter table public.categories add column if not exists calendar_id uuid;

-- Ensure each categories.owner has at least one default layer.
insert into public.calendar_layers (owner_id, name, is_default, created_by)
select distinct c.user_id, 'Main Calendar', true, null
from public.categories c
where c.user_id is not null
  and not exists (
    select 1
    from public.calendar_layers cl
    where cl.owner_id = c.user_id
      and cl.is_default = true
  );

-- Backfill categories.layer_id from owner's default layer.
with owner_default as (
  select distinct on (owner_id) owner_id, id as default_layer_id
  from public.calendar_layers
  where is_default = true
  order by owner_id, created_at asc, id asc
)
update public.categories c
set layer_id = od.default_layer_id
from owner_default od
where c.layer_id is null
  and c.user_id = od.owner_id;

update public.categories
set calendar_id = layer_id
where calendar_id is null
  and layer_id is not null;

-- Remove exact duplicates before creating unique index.
delete from public.categories a
using public.categories b
where a.ctid < b.ctid
  and a.user_id is not distinct from b.user_id
  and a.layer_id is not distinct from b.layer_id
  and lower(trim(a.key)) = lower(trim(b.key));

alter table public.categories alter column layer_id set not null;

create index if not exists idx_categories_user_layer
  on public.categories(user_id, layer_id);

create unique index if not exists uq_categories_user_layer_key
  on public.categories(user_id, layer_id, lower(trim(key)));

-- Drop legacy global uniqueness if present so each layer can have its own "work", etc.
do $$
declare
  con_name text;
begin
  select con.conname
  into con_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'categories'
    and con.contype = 'u'
    and con.conname = 'categories_user_id_key_key';

  if con_name is not null then
    execute format('alter table public.categories drop constraint %I', con_name);
  end if;
end $$;

alter table public.categories enable row level security;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own"
on public.categories
for select
using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
on public.categories
for insert
with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
on public.categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own"
on public.categories
for delete
using (auth.uid() = user_id);

-- Optional sanity checks:
-- select user_id, layer_id, count(*) from public.categories group by 1,2 order by 1,2;
-- select user_id, key, count(*) from public.categories group by 1,2 having count(*) > 1;
