-- Adds phone-based sharing/invites alongside existing email flows.
-- Run in Supabase SQL editor before deploying app changes.

alter table public.shared_access
  add column if not exists shared_with_phone text;

alter table public.sub_calendar_members
  add column if not exists phone text;

-- Existing projects may have shared_with_email marked NOT NULL.
alter table public.shared_access
  alter column shared_with_email drop not null;

-- Normalize existing values.
update public.shared_access
set shared_with_email = nullif(lower(trim(shared_with_email)), '')
where shared_with_email is not null;

update public.sub_calendar_members
set email = nullif(lower(trim(email)), '')
where email is not null;

update public.shared_access
set shared_with_phone = nullif(trim(shared_with_phone), '')
where shared_with_phone is not null;

update public.sub_calendar_members
set phone = nullif(trim(phone), '')
where phone is not null;

-- Guardrails: each row must target at least one recipient identity.
alter table public.shared_access
  drop constraint if exists shared_access_recipient_required;
alter table public.shared_access
  add constraint shared_access_recipient_required
  check (coalesce(nullif(trim(shared_with_email), ''), nullif(trim(shared_with_phone), '')) is not null);

alter table public.sub_calendar_members
  drop constraint if exists sub_calendar_members_recipient_required;
alter table public.sub_calendar_members
  add constraint sub_calendar_members_recipient_required
  check (coalesce(nullif(trim(email), ''), nullif(trim(phone), '')) is not null);

-- Uniqueness by recipient identity.
create unique index if not exists uq_shared_access_layer_phone
  on public.shared_access(layer_id, shared_with_phone)
  where shared_with_phone is not null;

create unique index if not exists uq_sub_calendar_members_phone
  on public.sub_calendar_members(sub_calendar_id, phone)
  where phone is not null;

-- Lookup performance for notification/invite queries.
create index if not exists idx_shared_access_recipient_phone
  on public.shared_access(shared_with_phone);

create index if not exists idx_sub_calendar_members_phone
  on public.sub_calendar_members(phone);
