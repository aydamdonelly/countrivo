-- avg_score must be the score players see (score_raw), not the internal sort value.
CREATE OR REPLACE FUNCTION public.get_daily_summary(p_game_slug text, p_daily_date date)
 RETURNS TABLE(player_count bigint, avg_score numeric, top_score_raw integer, top_score_display text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select
    count(*),
    round(avg(score_raw), 1),
    (select gr2.score_raw from public.game_runs gr2
     where gr2.game_slug = p_game_slug and gr2.daily_date = p_daily_date and gr2.mode = 'daily'
     order by gr2.score_sort_value desc limit 1),
    (select gr3.score_display from public.game_runs gr3
     where gr3.game_slug = p_game_slug and gr3.daily_date = p_daily_date and gr3.mode = 'daily'
     order by gr3.score_sort_value desc limit 1)
  from public.game_runs
  where game_slug = p_game_slug
    and daily_date = p_daily_date
    and mode = 'daily';
$function$;
