create table if not exists public.user_quick_thoughts (
  owner_user_id text primary key,
  thoughts jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_quick_thoughts enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_quick_thoughts'
      and policyname = 'user_quick_thoughts_select_own'
  ) then
    create policy user_quick_thoughts_select_own
      on public.user_quick_thoughts
      for select
      to authenticated
      using (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_quick_thoughts'
      and policyname = 'user_quick_thoughts_insert_own'
  ) then
    create policy user_quick_thoughts_insert_own
      on public.user_quick_thoughts
      for insert
      to authenticated
      with check (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_quick_thoughts'
      and policyname = 'user_quick_thoughts_update_own'
  ) then
    create policy user_quick_thoughts_update_own
      on public.user_quick_thoughts
      for update
      to authenticated
      using (owner_user_id = auth.uid()::text)
      with check (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_quick_thoughts'
      and policyname = 'user_quick_thoughts_delete_own'
  ) then
    create policy user_quick_thoughts_delete_own
      on public.user_quick_thoughts
      for delete
      to authenticated
      using (owner_user_id = auth.uid()::text);
  end if;
end
$$;
