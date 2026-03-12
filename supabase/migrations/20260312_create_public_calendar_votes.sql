-- Public calendar voting for Explore
-- Supports one vote per (layer_id, user_id), where vote_value is +1 or -1.

create extension if not exists pgcrypto;

create table if not exists public.public_calendar_votes (
  id uuid primary key default gen_random_uuid(),
  layer_id uuid not null references public.calendar_layers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_value smallint not null check (vote_value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(layer_id, user_id)
);

create index if not exists public_calendar_votes_layer_id_idx
  on public.public_calendar_votes(layer_id);

create index if not exists public_calendar_votes_user_id_idx
  on public.public_calendar_votes(user_id);

create or replace function public.set_public_calendar_votes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_public_calendar_votes_updated_at on public.public_calendar_votes;
create trigger trg_public_calendar_votes_updated_at
before update on public.public_calendar_votes
for each row execute function public.set_public_calendar_votes_updated_at();

alter table public.public_calendar_votes enable row level security;

-- Read votes only for calendars that are public.
drop policy if exists "public_calendar_votes_select_public" on public.public_calendar_votes;
create policy "public_calendar_votes_select_public"
on public.public_calendar_votes
for select
to authenticated
using (
  exists (
    select 1
    from public.calendar_layers cl
    where cl.id = public_calendar_votes.layer_id
      and coalesce(cl.is_public, false) = true
  )
);

-- Users can cast votes only for themselves and only on public calendars.
drop policy if exists "public_calendar_votes_insert_own" on public.public_calendar_votes;
create policy "public_calendar_votes_insert_own"
on public.public_calendar_votes
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.calendar_layers cl
    where cl.id = public_calendar_votes.layer_id
      and coalesce(cl.is_public, false) = true
  )
);

drop policy if exists "public_calendar_votes_update_own" on public.public_calendar_votes;
create policy "public_calendar_votes_update_own"
on public.public_calendar_votes
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.calendar_layers cl
    where cl.id = public_calendar_votes.layer_id
      and coalesce(cl.is_public, false) = true
  )
);

drop policy if exists "public_calendar_votes_delete_own" on public.public_calendar_votes;
create policy "public_calendar_votes_delete_own"
on public.public_calendar_votes
for delete
to authenticated
using (auth.uid() = user_id);
