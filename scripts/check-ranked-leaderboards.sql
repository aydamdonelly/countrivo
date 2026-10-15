-- Transactional regression for 20261016090000. Run against a migrated database with an owner connection.
-- All fixtures are rolled back, so none can become public leaderboard entries.
begin;
do $$
declare
  board jsonb;
  mine bigint;
  first_run bigint;
  viewer uuid:=gen_random_uuid();
  first_publisher uuid:=gen_random_uuid();
  next_publisher uuid:=gen_random_uuid();
  denied boolean:=false;
begin
  insert into public.countrivo_runs(session_id,device_id,game_slug,mode,date_key,edition,seed,status,score_raw,score_max,score_sort_value,score_display,display_name,completed_at)
  select gen_random_uuid(),case when i=1 then first_publisher else gen_random_uuid() end,'country-draft','daily','2000-01-01','leaderboard-regression-20261016',1,'complete',case when i=2 then 599 else 600-i end,1000,case when i=2 then 599 else 600-i end,(600-i)::text,'Test '||i,now()+i*interval '1 second'
  from generate_series(1,600) as s(i);
  select id into mine from public.countrivo_runs where edition='leaderboard-regression-20261016' and display_name='Test 600';
  select id into first_run from public.countrivo_runs where edition='leaderboard-regression-20261016' and display_name='Test 1';
  insert into public.countrivo_runs(session_id,device_id,game_slug,mode,date_key,edition,seed,status,score_raw,score_max,score_sort_value,score_display,display_name,completed_at)
  values(gen_random_uuid(),next_publisher,'country-draft','daily','2000-01-01','other-regression-edition',1,'complete',999,1000,999,'999','Other edition',now());
  board:=public.countrivo_ranked_board('country-draft','2000-01-01','leaderboard-regression-20261016',50,mine);
  if (board->>'count')::integer<>600 then raise exception 'Expected exact 600-player count'; end if;
  if jsonb_array_length(board->'entries')<>51 then raise exception 'Own row missing beyond top 50'; end if;
  if (board->'entries'->0->>'rank_daily')::integer<>1 or (board->'entries'->1->>'rank_daily')::integer<>1 or (board->'entries'->2->>'rank_daily')::integer<>3 then raise exception 'Competition ties incorrect'; end if;
  if not exists(select 1 from jsonb_array_elements(board->'entries') entry where (entry->>'id')::bigint=mine and (entry->>'rank_daily')::integer=600) then raise exception 'Own exact rank incorrect'; end if;
  if exists(select 1 from jsonb_array_elements(board->'entries') entry where entry ? 'device_id' or entry ? 'action_log' or entry ? 'result_json') then raise exception 'Private fields leaked'; end if;
  perform public.countrivo_block_publisher(first_run,viewer);
  if not exists(select 1 from public.countrivo_blocked_names(viewer,'country-draft','2000-01-01','leaderboard-regression-20261016') where run_id=first_run) then raise exception 'Publisher block missing'; end if;
  perform public.countrivo_ban_publisher(first_run);
  if not exists(select 1 from public.countrivo_runs where id=first_run and moderation_hidden=true) then raise exception 'Publisher ban failed to hide name'; end if;
  begin
    perform public.countrivo_publish_name(first_run,first_publisher,'regression-network','2000-01-01','leaderboard-regression-20261016','Renamed',null);
  exception when others then
    if sqlerrm='publisher_banned' then denied:=true; else raise; end if;
  end;
  if not denied then raise exception 'Banned publisher can rename'; end if;
  if has_function_privilege('anon','public.countrivo_block_publisher(bigint,uuid)','execute') or has_function_privilege('anon','public.countrivo_ban_publisher(bigint)','execute') then raise exception 'Anonymous moderation privilege'; end if;
  raise notice 'Leaderboard regression passed: editions, exact 600-player count, ties, own place, private fields, block and ban.';
end;
$$;
rollback;
