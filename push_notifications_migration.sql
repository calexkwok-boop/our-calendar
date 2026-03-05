-- Web Push: subscriptions + send log

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);
create index if not exists idx_push_subscriptions_enabled on public.push_subscriptions(enabled);

create table if not exists public.push_notification_log (
  id bigserial primary key,
  user_id uuid not null,
  event_id text not null,
  date_key text not null,
  window_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_id, date_key, window_key)
);

create index if not exists idx_push_log_user_created on public.push_notification_log(user_id, created_at desc);
create index if not exists idx_push_log_event on public.push_notification_log(event_id, date_key);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own
on public.push_subscriptions
for select
using (user_id = auth.uid());

drop policy if exists push_subscriptions_insert_own on public.push_subscriptions;
create policy push_subscriptions_insert_own
on public.push_subscriptions
for insert
with check (user_id = auth.uid());

drop policy if exists push_subscriptions_update_own on public.push_subscriptions;
create policy push_subscriptions_update_own
on public.push_subscriptions
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own
on public.push_subscriptions
for delete
using (user_id = auth.uid());

-- Optional cleanup helper:
-- delete from public.push_notification_log where created_at < now() - interval '45 days';
