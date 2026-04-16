create or replace function public.vote_on_product_post(post_id uuid, vote_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_score integer;
begin
  update public.product_posts
    set likes_count = greatest(coalesce(likes_count, 0) + vote_delta, 0)
    where id = post_id
    returning likes_count into updated_score;

  return updated_score;
end;
$$;

grant execute on function public.vote_on_product_post(uuid, integer) to anon, authenticated;

create or replace function public.vote_on_restaurant_post(post_id uuid, vote_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_score integer;
begin
  update public.restaurant_posts
    set likes_count = greatest(coalesce(likes_count, 0) + vote_delta, 0)
    where id = post_id
    returning likes_count into updated_score;

  return updated_score;
end;
$$;

grant execute on function public.vote_on_restaurant_post(uuid, integer) to anon, authenticated;
