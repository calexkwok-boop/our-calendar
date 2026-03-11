-- Run this in the Supabase SQL editor for project qyifsblebdnlcyurrgbt.
-- Fixes:
-- 1) event descriptions not persisting
-- 2) calendar layer icon/cover/public description fields
-- 3) owner/shared access policies for calendar_layers when RLS is enabled

create extension if not exists pgcrypto;

alter table public.events
  add column if not exists description text;

alter table public.calendar_layers
  add column if not exists icon_url text,
  add column if not exists header_bg_url text,
  add column if not exists title_style jsonb,
  add column if not exists page_theme jsonb,
  add column if not exists is_public boolean not null default false,
  add column if not exists public_description text,
  add column if not exists public_tags jsonb;

alter table public.calendar_layers enable row level security;

drop policy if exists calendar_layers_select_access on public.calendar_layers;
create policy calendar_layers_select_access
  on public.calendar_layers
  for select
  to authenticated
  using (
    auth.uid() = owner_id
    or exists (
      select 1
      from public.shared_access sa
      where sa.layer_id = calendar_layers.id
        and (
          sa.shared_with_id = auth.uid()
          or lower(coalesce(sa.shared_with_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))
          or coalesce(sa.shared_with_phone, '') = coalesce(auth.jwt()->>'phone', '')
        )
    )
  );

drop policy if exists calendar_layers_insert_own on public.calendar_layers;
create policy calendar_layers_insert_own
  on public.calendar_layers
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists calendar_layers_update_own on public.calendar_layers;
create policy calendar_layers_update_own
  on public.calendar_layers
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists calendar_layers_delete_own on public.calendar_layers;
create policy calendar_layers_delete_own
  on public.calendar_layers
  for delete
  to authenticated
  using (auth.uid() = owner_id);
