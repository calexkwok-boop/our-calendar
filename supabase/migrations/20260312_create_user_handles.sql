create table if not exists public.user_handles (
  email text primary key,
  handle text not null check (char_length(trim(handle)) > 0 and char_length(trim(handle)) <= 40),
  user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_handles_user_id_idx on public.user_handles (user_id);

alter table public.user_handles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_handles'
      and policyname = 'user_handles_select_own_email'
  ) then
    create policy user_handles_select_own_email
      on public.user_handles
      for select
      to authenticated
      using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_handles'
      and policyname = 'user_handles_insert_own_email'
  ) then
    create policy user_handles_insert_own_email
      on public.user_handles
      for insert
      to authenticated
      with check (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_handles'
      and policyname = 'user_handles_update_own_email'
  ) then
    create policy user_handles_update_own_email
      on public.user_handles
      for update
      to authenticated
      using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
      with check (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
  end if;
end $$;
