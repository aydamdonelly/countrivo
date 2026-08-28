-- Ghost Duels: reuse the friend_challenges table; add a type flag + a
-- same-seed opponent matchmaker for Quick Duel.

alter table public.friend_challenges
  add column if not exists duel_type text not null default 'friend'; -- 'friend' | 'quick'

-- Pick one stored same-seed run by ANOTHER user near the player's percentile.
-- Never-empty fallback ladder; returns no row only when truly nobody else
-- has played this puzzle (the action then surfaces a "be the first" state).
create or replace function public.match_quick_duel_opponent(
  p_game_slug text,
  p_daily_date text,
  p_user_id uuid
) returns table(run_id bigint, user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  target numeric;
begin
  -- Target percentile: the player's own if they've played, else the median.
  select gr.percentile into target
    from game_runs gr
   where gr.game_slug = p_game_slug and gr.daily_date = p_daily_date
     and gr.user_id = p_user_id and gr.mode = 'daily'
   limit 1;
  if target is null then target := 50; end if;

  -- 1) Nearest-percentile opponent we haven't already quick-dueled today.
  return query
    select gr.id, gr.user_id
      from game_runs gr
     where gr.game_slug = p_game_slug and gr.daily_date = p_daily_date
       and gr.mode = 'daily' and gr.user_id <> p_user_id
       and not exists (
         select 1 from friend_challenges fc
          where fc.challenged_id = p_user_id and fc.game_slug = p_game_slug
            and fc.daily_date = p_daily_date and fc.duel_type = 'quick'
            and fc.challenger_id = gr.user_id)
     order by abs(coalesce(gr.percentile, 50) - target) asc, random()
     limit 1;
  if found then return; end if;

  -- 2) Fallback: any same-seed run by another user.
  return query
    select gr.id, gr.user_id
      from game_runs gr
     where gr.game_slug = p_game_slug and gr.daily_date = p_daily_date
       and gr.mode = 'daily' and gr.user_id <> p_user_id
     order by random()
     limit 1;
end;
$$;

grant execute on function public.match_quick_duel_opponent(text, text, uuid) to authenticated;
