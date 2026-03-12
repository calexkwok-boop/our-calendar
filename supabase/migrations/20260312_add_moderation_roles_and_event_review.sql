-- Moderation support:
-- 1) Member roles + bans on shared_access
-- 2) Event moderation state on events

alter table public.shared_access
  add column if not exists role text not null default 'member',
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_reason text,
  add column if not exists banned_at timestamptz,
  add column if not exists banned_by uuid references auth.users(id);

alter table public.shared_access
  drop constraint if exists shared_access_role_check;

alter table public.shared_access
  add constraint shared_access_role_check
  check (role in ('member', 'moderator', 'admin'));

create index if not exists shared_access_layer_id_is_banned_idx
  on public.shared_access(layer_id, is_banned);

alter table public.events
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists moderated_by uuid references auth.users(id),
  add column if not exists moderated_at timestamptz,
  add column if not exists moderation_reason text;

alter table public.events
  drop constraint if exists events_moderation_status_check;

alter table public.events
  add constraint events_moderation_status_check
  check (moderation_status in ('pending', 'approved', 'rejected'));

create index if not exists events_layer_id_moderation_status_idx
  on public.events(layer_id, moderation_status);
