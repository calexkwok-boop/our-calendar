create table if not exists public.user_memories (
  owner_user_id text not null,
  id text not null,
  memory jsonb not null default '{}'::jsonb,
  memory_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_user_id, id)
);

create index if not exists user_memories_owner_date_idx
  on public.user_memories (owner_user_id, memory_date desc, updated_at desc);

alter table public.user_memories enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_memories'
      and policyname = 'user_memories_select_own'
  ) then
    create policy user_memories_select_own
      on public.user_memories
      for select
      to authenticated
      using (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_memories'
      and policyname = 'user_memories_insert_own'
  ) then
    create policy user_memories_insert_own
      on public.user_memories
      for insert
      to authenticated
      with check (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_memories'
      and policyname = 'user_memories_update_own'
  ) then
    create policy user_memories_update_own
      on public.user_memories
      for update
      to authenticated
      using (owner_user_id = auth.uid()::text)
      with check (owner_user_id = auth.uid()::text);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_memories'
      and policyname = 'user_memories_delete_own'
  ) then
    create policy user_memories_delete_own
      on public.user_memories
      for delete
      to authenticated
      using (owner_user_id = auth.uid()::text);
  end if;
end
$$;
