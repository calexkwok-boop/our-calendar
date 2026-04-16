create extension if not exists pgcrypto;

create table if not exists public.restaurant_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  restaurant_name text not null,
  restaurant_image text null,
  address text null,
  google_place_id text null,
  website text null,
  phone text null,
  cuisine text null,
  price_level text null,
  rating numeric(3,1) null,
  review text not null,
  best_for text null,
  vibe_tags text null,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurant_posts_likes_count_idx
  on public.restaurant_posts (likes_count desc, created_at desc);

create index if not exists restaurant_posts_user_id_idx
  on public.restaurant_posts (user_id);

create or replace function public.set_restaurant_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_restaurant_posts_updated_at on public.restaurant_posts;
create trigger trg_restaurant_posts_updated_at
before update on public.restaurant_posts
for each row execute function public.set_restaurant_posts_updated_at();

alter table public.restaurant_posts enable row level security;

drop policy if exists "restaurant_posts_select_public" on public.restaurant_posts;
create policy "restaurant_posts_select_public"
on public.restaurant_posts
for select
to anon, authenticated
using (true);

drop policy if exists "restaurant_posts_insert_public" on public.restaurant_posts;
create policy "restaurant_posts_insert_public"
on public.restaurant_posts
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

drop policy if exists "restaurant_posts_update_own" on public.restaurant_posts;
create policy "restaurant_posts_update_own"
on public.restaurant_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "restaurant_posts_delete_own" on public.restaurant_posts;
create policy "restaurant_posts_delete_own"
on public.restaurant_posts
for delete
to authenticated
using (auth.uid() = user_id);
