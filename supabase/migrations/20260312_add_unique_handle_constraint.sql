create unique index if not exists user_handles_handle_lower_uq
  on public.user_handles (lower(handle));
