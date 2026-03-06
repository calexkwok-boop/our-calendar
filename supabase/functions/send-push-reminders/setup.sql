-- Required tables for push reminders

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_enabled
  on public.push_subscriptions (user_id, enabled);

create table if not exists public.push_notification_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  event_id text not null,
  date_key text not null,
  window_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_id, date_key, window_key)
);

-- Optional RLS (client writes subscription rows from App.js)
alter table public.push_subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_select_own'
  ) then
    create policy push_subscriptions_select_own
      on public.push_subscriptions
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_insert_own'
  ) then
    create policy push_subscriptions_insert_own
      on public.push_subscriptions
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'push_subscriptions_update_own'
  ) then
    create policy push_subscriptions_update_own
      on public.push_subscriptions
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
