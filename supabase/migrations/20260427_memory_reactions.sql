-- Reactions (likes + comments) on shared daily photos.
-- Drop and recreate to handle any stale partial table from earlier attempts.

DROP TABLE IF EXISTS public.memory_reactions CASCADE;

CREATE TABLE public.memory_reactions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_owner_id text        NOT NULL,
  memory_date     date        NOT NULL,
  reactor_user_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text        NOT NULL CHECK (type IN ('like', 'comment')),
  comment_text    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY memory_reactions_select
  ON public.memory_reactions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY memory_reactions_insert
  ON public.memory_reactions FOR INSERT
  TO authenticated WITH CHECK (reactor_user_id = auth.uid());

CREATE POLICY memory_reactions_delete
  ON public.memory_reactions FOR DELETE
  TO authenticated USING (reactor_user_id = auth.uid());
