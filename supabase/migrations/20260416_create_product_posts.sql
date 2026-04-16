create extension if not exists pgcrypto;

create table if not exists public.product_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  product_brand text null,
  product_image text null,
  product_price text null,
  product_asin text null,
  amazon_url text null,
  target_url text null,
  walmart_url text null,
  product_description text null,
  product_rating numeric(3,1) null,
  review text not null,
  category text null,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_posts_likes_count_idx
  on public.product_posts (likes_count desc, created_at desc);

create index if not exists product_posts_user_id_idx
  on public.product_posts (user_id);

create or replace function public.set_product_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_product_posts_updated_at on public.product_posts;
create trigger trg_product_posts_updated_at
before update on public.product_posts
for each row execute function public.set_product_posts_updated_at();

alter table public.product_posts enable row level security;

drop policy if exists "product_posts_select_public" on public.product_posts;
create policy "product_posts_select_public"
on public.product_posts
for select
to anon, authenticated
using (true);

drop policy if exists "product_posts_insert_own" on public.product_posts;
create policy "product_posts_insert_own"
on public.product_posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "product_posts_update_own" on public.product_posts;
create policy "product_posts_update_own"
on public.product_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "product_posts_delete_own" on public.product_posts;
create policy "product_posts_delete_own"
on public.product_posts
for delete
to authenticated
using (auth.uid() = user_id);
