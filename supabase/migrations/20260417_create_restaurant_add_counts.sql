create table if not exists public.restaurant_add_counts (
  restaurant_key text primary key,
  google_place_id text null,
  restaurant_name text not null,
  address text null,
  photo text null,
  cuisine text null,
  rating numeric(3,1) null,
  price_level integer null,
  description text null,
  add_count integer not null default 0,
  first_added_at timestamptz not null default now(),
  last_added_at timestamptz not null default now()
);

create index if not exists restaurant_add_counts_rank_idx
  on public.restaurant_add_counts (add_count desc, last_added_at desc);

alter table public.restaurant_add_counts enable row level security;

drop policy if exists "restaurant_add_counts_select_public" on public.restaurant_add_counts;
create policy "restaurant_add_counts_select_public"
on public.restaurant_add_counts
for select
to anon, authenticated
using (true);

create or replace function public.record_restaurant_add(
  p_restaurant_key text,
  p_google_place_id text,
  p_restaurant_name text,
  p_address text default null,
  p_photo text default null,
  p_cuisine text default null,
  p_rating numeric default null,
  p_price_level integer default null,
  p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_restaurant_key), '') is null or nullif(trim(p_restaurant_name), '') is null then
    return;
  end if;

  insert into public.restaurant_add_counts (
    restaurant_key,
    google_place_id,
    restaurant_name,
    address,
    photo,
    cuisine,
    rating,
    price_level,
    description,
    add_count
  )
  values (
    trim(p_restaurant_key),
    nullif(trim(coalesce(p_google_place_id, '')), ''),
    trim(p_restaurant_name),
    nullif(trim(coalesce(p_address, '')), ''),
    nullif(trim(coalesce(p_photo, '')), ''),
    nullif(trim(coalesce(p_cuisine, '')), ''),
    p_rating,
    p_price_level,
    nullif(trim(coalesce(p_description, '')), ''),
    1
  )
  on conflict (restaurant_key) do update set
    google_place_id = coalesce(excluded.google_place_id, public.restaurant_add_counts.google_place_id),
    restaurant_name = excluded.restaurant_name,
    address = coalesce(excluded.address, public.restaurant_add_counts.address),
    photo = coalesce(excluded.photo, public.restaurant_add_counts.photo),
    cuisine = coalesce(excluded.cuisine, public.restaurant_add_counts.cuisine),
    rating = coalesce(excluded.rating, public.restaurant_add_counts.rating),
    price_level = coalesce(excluded.price_level, public.restaurant_add_counts.price_level),
    description = coalesce(excluded.description, public.restaurant_add_counts.description),
    add_count = public.restaurant_add_counts.add_count + 1,
    last_added_at = now();
end;
$$;

grant execute on function public.record_restaurant_add(text, text, text, text, text, text, numeric, integer, text) to anon, authenticated;

create or replace function public.get_most_added_restaurants(p_limit integer default 10)
returns table (
  restaurant_key text,
  google_place_id text,
  restaurant_name text,
  address text,
  photo text,
  cuisine text,
  rating numeric,
  price_level integer,
  description text,
  add_count integer
)
language sql
security definer
set search_path = public
as $$
  select
    restaurant_key,
    google_place_id,
    restaurant_name,
    address,
    photo,
    cuisine,
    rating,
    price_level,
    description,
    add_count
  from public.restaurant_add_counts
  order by add_count desc, last_added_at desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

grant execute on function public.get_most_added_restaurants(integer) to anon, authenticated;
