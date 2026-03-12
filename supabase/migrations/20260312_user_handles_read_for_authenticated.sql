do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_handles'
      and policyname = 'user_handles_select_authenticated'
  ) then
    create policy user_handles_select_authenticated
      on public.user_handles
      for select
      to authenticated
      using (true);
  end if;
end $$;
