-- Per-calendar group chat messages
-- Run in Supabase SQL editor before using Calendar Chat.

create extension if not exists pgcrypto;

create table if not exists public.calendar_messages (
  id uuid primary key default gen_random_uuid(),
  layer_id uuid not null,
  calendar_id uuid,
  user_id uuid not null,
  created_by text,
  message text not null,
  created_at timestamptz not null default now(),
  constraint calendar_messages_message_not_empty check (length(trim(message)) > 0)
);

create index if not exists idx_calendar_messages_layer_created
  on public.calendar_messages(layer_id, created_at);

create index if not exists idx_calendar_messages_user
  on public.calendar_messages(user_id);

alter table public.calendar_messages enable row level security;

-- Read access: owner of layer or recipient in shared_access for that layer.
drop policy if exists calendar_messages_select_access on public.calendar_messages;
create policy calendar_messages_select_access
on public.calendar_messages
for select
using (
  exists (
    select 1
    from public.calendar_layers cl
    where cl.id = calendar_messages.layer_id
      and cl.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.shared_access sa
    where sa.layer_id = calendar_messages.layer_id
      and (
        sa.shared_with_id = auth.uid()
        or lower(coalesce(sa.shared_with_email, '')) = lower(coalesce(auth.email(), ''))
        or coalesce(sa.shared_with_phone, '') = coalesce(auth.phone(), '')
      )
  )
);

-- Insert access: same as read, plus sender must match auth.uid().
drop policy if exists calendar_messages_insert_access on public.calendar_messages;
create policy calendar_messages_insert_access
on public.calendar_messages
for insert
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1
      from public.calendar_layers cl
      where cl.id = calendar_messages.layer_id
        and cl.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.shared_access sa
      where sa.layer_id = calendar_messages.layer_id
        and (
          sa.shared_with_id = auth.uid()
          or lower(coalesce(sa.shared_with_email, '')) = lower(coalesce(auth.email(), ''))
          or coalesce(sa.shared_with_phone, '') = coalesce(auth.phone(), '')
        )
    )
  )
);
