create or replace function public.current_user_owns_chapter(p_owner_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    lower(coalesce(p_owner_id, '')) = lower(coalesce(auth.uid()::text, ''))
    or lower(coalesce(p_owner_id, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.user_handles uh
      where uh.user_id = auth.uid()
        and lower(coalesce(uh.handle, '')) = lower(coalesce(p_owner_id, ''))
    )
    or exists (
      select 1
      from public.user_handles uh
      where lower(coalesce(uh.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and lower(coalesce(uh.handle, '')) = lower(coalesce(p_owner_id, ''))
    );
$$;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chapters'
      and cmd = 'UPDATE'
  loop
    execute format('drop policy if exists %I on public.chapters', pol.policyname);
  end loop;
end
$$;

create policy chapters_owner_update
on public.chapters
for update
to authenticated
using (
  public.current_user_owns_chapter(owner_id)
)
with check (
  public.current_user_owns_chapter(owner_id)
);
