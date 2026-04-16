create extension if not exists pgcrypto;

create table if not exists public.google_restaurant_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_place_id text not null,
  restaurant_name text not null,
  vote integer not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists google_restaurant_votes_user_place_uidx
  on public.google_restaurant_votes (user_id, google_place_id);

create index if not exists google_restaurant_votes_place_idx
  on public.google_restaurant_votes (google_place_id);

create or replace function public.set_google_restaurant_votes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_google_restaurant_votes_updated_at on public.google_restaurant_votes;
create trigger trg_google_restaurant_votes_updated_at
before update on public.google_restaurant_votes
for each row execute function public.set_google_restaurant_votes_updated_at();

alter table public.google_restaurant_votes enable row level security;

drop policy if exists "google_restaurant_votes_select_public" on public.google_restaurant_votes;
create policy "google_restaurant_votes_select_public"
on public.google_restaurant_votes
for select
to anon, authenticated
using (true);

drop policy if exists "google_restaurant_votes_insert_own" on public.google_restaurant_votes;
create policy "google_restaurant_votes_insert_own"
on public.google_restaurant_votes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "google_restaurant_votes_update_own" on public.google_restaurant_votes;
create policy "google_restaurant_votes_update_own"
on public.google_restaurant_votes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "google_restaurant_votes_delete_own" on public.google_restaurant_votes;
create policy "google_restaurant_votes_delete_own"
on public.google_restaurant_votes
for delete
to authenticated
using (auth.uid() = user_id);
