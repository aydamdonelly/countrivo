begin;
do $$
declare
  device uuid := gen_random_uuid();
  other_device uuid := gen_random_uuid();
  run_id bigint;
  saved_name text;
  slug text;
  mode_name text;
begin
  foreach slug in array array['country-draft','geo-wordle','pinpoint','flag-quiz','higher-or-lower','stat-guesser','blind-pick','speed-flags'] loop
    foreach mode_name in array array['daily','practice'] loop
      insert into public.countrivo_runs(session_id,device_id,game_slug,mode,date_key,edition,seed,status)
        values(gen_random_uuid(),device,slug,mode_name,current_date,'guest-qa-rollback',42,'open') returning id into run_id;
      if (select display_name is not null from public.countrivo_runs where id=run_id) then raise exception 'unfinished game got a name'; end if;
      update public.countrivo_runs set status='complete',score_raw=1,score_max=10,score_sort_value=1,score_display='1 / 10',completed_at=now() where id=run_id;
      select display_name into saved_name from public.countrivo_runs where id=run_id;
      if saved_name is distinct from 'guest-'||substr(md5(device::text),1,8) then raise exception 'guest name missing or unstable'; end if;
      if mode_name='daily' and not exists(select 1 from public.countrivo_leaderboard where id=run_id) then raise exception 'guest missing from daily leaderboard'; end if;
      if mode_name='practice' and exists(select 1 from public.countrivo_leaderboard where id=run_id) then raise exception 'practice entered daily leaderboard'; end if;
    end loop;
  end loop;
  perform public.countrivo_publish_name(run_id,device,'guest-qa-rollback',current_date,'guest-qa-rollback','QA Named',null);
  if (select display_name from public.countrivo_runs where id=run_id)<>'QA Named' then raise exception 'practice rename failed'; end if;
  begin
    perform public.countrivo_publish_name(run_id,other_device,'guest-qa-rollback',current_date,'guest-qa-rollback','Wrong owner',null);
    raise exception 'wrong owner accepted';
  exception when others then if sqlerrm<>'board_closed' then raise; end if; end;
  update public.countrivo_runs set score_display='1 / 10' where id=run_id;
  if (select display_name from public.countrivo_runs where id=run_id)<>'QA Named' then raise exception 'saved name overwritten on retry'; end if;
  insert into public.countrivo_runs(session_id,device_id,game_slug,mode,date_key,edition,seed,status)
    values(gen_random_uuid(),other_device,'flag-quiz','practice',current_date,'guest-qa-rollback',42,'complete');
  -- Simulate a private historical row without invoking the new-completion path.
  update public.countrivo_runs set display_name=null where device_id=other_device;
  update public.countrivo_runs set moderation_hidden=true where device_id=other_device;
  if exists(select 1 from public.countrivo_runs where device_id=other_device and display_name is not null) then raise exception 'historical private result made public'; end if;
  perform public.countrivo_ban_publisher(run_id);
  insert into public.countrivo_runs(session_id,device_id,game_slug,mode,date_key,edition,seed,status)
    values(gen_random_uuid(),device,'flag-quiz','practice',current_date,'guest-qa-rollback',42,'complete') returning id into run_id;
  if not (select moderation_hidden from public.countrivo_runs where id=run_id) then raise exception 'ban bypassed on completion'; end if;
  begin
    perform public.countrivo_publish_name(run_id,device,'guest-qa-rollback',current_date,'guest-qa-rollback','Bypass ban',null);
    raise exception 'banned publisher accepted';
  exception when others then if sqlerrm<>'publisher_banned' then raise; end if; end;
end;
$$;
select 'all game slugs, daily/practice persistence, stable guests, leaderboard isolation, ownership and bans passed' as result;
rollback;
