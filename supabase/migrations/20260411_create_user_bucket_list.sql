create table if not exists public.user_bucket_list (
  owner_user_id text primary key,
  dreams jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_bucket_list enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_bucket_list'
      and policyname = 'user_bucket_list_select_own'
  ) then
    create policy user_bucket_list_select_own
      on public.user_bucket_list
      for select
      to authenticated
      using (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_bucket_list'
      and policyname = 'user_bucket_list_insert_own'
  ) then
    create policy user_bucket_list_insert_own
      on public.user_bucket_list
      for insert
      to authenticated
      with check (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_bucket_list'
      and policyname = 'user_bucket_list_update_own'
  ) then
    create policy user_bucket_list_update_own
      on public.user_bucket_list
      for update
      to authenticated
      using (owner_user_id = auth.uid()::text)
      with check (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_bucket_list'
      and policyname = 'user_bucket_list_delete_own'
  ) then
    create policy user_bucket_list_delete_own
      on public.user_bucket_list
      for delete
      to authenticated
      using (owner_user_id = auth.uid()::text);
  end if;
end
$$;
