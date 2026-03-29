alter table public.popup_event_details
  add column if not exists event_data jsonb not null default '{}'::jsonb;
