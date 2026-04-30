create table if not exists public.destination_image_cache (
  destination_key text primary key,
  destination_name text not null default '',
  location text not null default '',
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.destination_image_cache enable row level security;

drop policy if exists destination_image_cache_select_authenticated on public.destination_image_cache;
create policy destination_image_cache_select_authenticated
on public.destination_image_cache
for select
to authenticated
using (true);

drop policy if exists destination_image_cache_insert_authenticated on public.destination_image_cache;
create policy destination_image_cache_insert_authenticated
on public.destination_image_cache
for insert
to authenticated
with check (true);

drop policy if exists destination_image_cache_update_authenticated on public.destination_image_cache;
create policy destination_image_cache_update_authenticated
on public.destination_image_cache
for update
to authenticated
using (true)
with check (true);

create index if not exists destination_image_cache_updated_at_idx
  on public.destination_image_cache (updated_at desc);
