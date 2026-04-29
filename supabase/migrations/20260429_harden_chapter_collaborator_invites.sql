alter table if exists public.chapter_collaborators
  add column if not exists status text not null default 'accepted';

alter table if exists public.chapter_collaborators
  add column if not exists invited_at timestamptz;

alter table if exists public.chapter_collaborators
  add column if not exists accepted_at timestamptz;

update public.chapter_collaborators
set status = 'accepted'
where coalesce(status, '') = '';

update public.chapter_collaborators
set invited_at = coalesce(invited_at, created_at, now())
where invited_at is null;

update public.chapter_collaborators
set accepted_at = coalesce(accepted_at, created_at, invited_at, now())
where lower(coalesce(status, 'accepted')) = 'accepted'
  and accepted_at is null;

alter table if exists public.chapter_collaborators
  drop constraint if exists chapter_collaborators_status_check;

alter table if exists public.chapter_collaborators
  add constraint chapter_collaborators_status_check
  check (lower(status) in ('pending', 'accepted', 'declined'));

create unique index if not exists chapter_collaborators_chapter_email_idx
  on public.chapter_collaborators (chapter_id, lower(email));

create index if not exists chapter_collaborators_email_status_idx
  on public.chapter_collaborators (lower(email), status);
