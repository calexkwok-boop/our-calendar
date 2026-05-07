alter table public.sub_calendars
  add column if not exists komo_state jsonb not null default '{}'::jsonb;
