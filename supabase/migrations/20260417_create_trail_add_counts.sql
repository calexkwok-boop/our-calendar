create table if not exists public.trail_add_counts (
  trail_key text primary key,
  trail_name text not null,
  city text null,
  state text null,
  photo text null,
  difficulty integer null,
  length numeric null,
  ascent numeric null,
  rating numeric(3,1) null,
  rating_count integer null,
  features text[] null,
  description text null,
  add_count integer not null default 0,
  first_added_at timestamptz not null default now(),
  last_added_at timestamptz not null default now()
);

create index if not exists trail_add_counts_rank_idx
  on public.trail_add_counts (add_count desc, last_added_at desc);

alter table public.trail_add_counts enable row level security;

drop policy if exists "trail_add_counts_select_public" on public.trail_add_counts;
create policy "trail_add_counts_select_public"
on public.trail_add_counts
for select
to anon, authenticated
using (true);

create or replace function public.record_trail_add(
  p_trail_key text,
  p_trail_name text,
  p_city text default null,
  p_state text default null,
  p_photo text default null,
  p_difficulty integer default null,
  p_length numeric default null,
  p_ascent numeric default null,
  p_rating numeric default null,
  p_rating_count integer default null,
  p_features text[] default null,
  p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_trail_key), '') is null or nullif(trim(p_trail_name), '') is null then
    return;
  end if;

  insert into public.trail_add_counts (
    trail_key,
    trail_name,
    city,
    state,
    photo,
    difficulty,
    length,
    ascent,
    rating,
    rating_count,
    features,
    description,
    add_count
  )
  values (
    trim(p_trail_key),
    trim(p_trail_name),
    nullif(trim(coalesce(p_city, '')), ''),
    nullif(trim(coalesce(p_state, '')), ''),
    nullif(trim(coalesce(p_photo, '')), ''),
    p_difficulty,
    p_length,
    p_ascent,
    p_rating,
    p_rating_count,
    p_features,
    nullif(trim(coalesce(p_description, '')), ''),
    1
  )
  on conflict (trail_key) do update set
    trail_name = excluded.trail_name,
    city = coalesce(excluded.city, public.trail_add_counts.city),
    state = coalesce(excluded.state, public.trail_add_counts.state),
    photo = coalesce(excluded.photo, public.trail_add_counts.photo),
    difficulty = coalesce(excluded.difficulty, public.trail_add_counts.difficulty),
    length = coalesce(excluded.length, public.trail_add_counts.length),
    ascent = coalesce(excluded.ascent, public.trail_add_counts.ascent),
    rating = coalesce(excluded.rating, public.trail_add_counts.rating),
    rating_count = coalesce(excluded.rating_count, public.trail_add_counts.rating_count),
    features = coalesce(excluded.features, public.trail_add_counts.features),
    description = coalesce(excluded.description, public.trail_add_counts.description),
    add_count = public.trail_add_counts.add_count + 1,
    last_added_at = now();
end;
$$;

grant execute on function public.record_trail_add(text, text, text, text, text, integer, numeric, numeric, numeric, integer, text[], text) to anon, authenticated;

create or replace function public.get_most_added_trails(p_limit integer default 10)
returns table (
  trail_key text,
  trail_name text,
  city text,
  state text,
  photo text,
  difficulty integer,
  length numeric,
  ascent numeric,
  rating numeric,
  rating_count integer,
  features text[],
  description text,
  add_count integer
)
language sql
security definer
set search_path = public
as $$
  select
    trail_key,
    trail_name,
    city,
    state,
    photo,
    difficulty,
    length,
    ascent,
    rating,
    rating_count,
    features,
    description,
    add_count
  from public.trail_add_counts
  order by add_count desc, last_added_at desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

grant execute on function public.get_most_added_trails(integer) to anon, authenticated;
