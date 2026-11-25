begin;

create table if not exists public.countrivo_usage_events (
  event_key text primary key check (char_length(event_key) between 1 and 120),
  device_id uuid not null,
  event text not null check (event in ('page_view','navigation','game_switch','leaderboard_open','entry_manage','entry_action','disclosure','game_control','share_intent','share_result','feedback_open','feedback_submit','feedback_result','feedback_close','game_start','game_action','game_complete','name_saved','feedback_saved')),
  game text check (game in ('country-draft','blind-pick','higher-or-lower','pinpoint','geo-wordle','stat-guesser','flag-quiz','speed-flags')),
  mode text check (mode in ('daily','practice')),
  source text not null default 'other' check (source in ('header','game','result','home','footer','leaderboard','other','server')),
  target text check (target in ('home','play','game','leaderboard','practice','archive','world','countries','stats','lists','support','about','legal','other')),
  target_game text check (target_game in ('country-draft','blind-pick','higher-or-lower','pinpoint','geo-wordle','stat-guesser','flag-quiz','speed-flags')),
  outcome text check (outcome in ('native','clipboard','cancelled','manual','saved','invalid','rate_limited','unavailable','closed','opened')),
  action text check (action in ('day','result','challenge','game','site','save_name','change_name','restore_guest','cancel','country_flag','score_details','run_details','history','week','yesterday','world','hint','bonus','replay','next','retry','statistics','open','appoint','guess','drop','answer','lock','place','undo','reveal','commit','timed_round')),
  run_id bigint references public.countrivo_runs(id) on delete cascade,
  step integer check (step between 0 and 10000),
  created_at timestamptz not null default now()
);
create index if not exists countrivo_usage_created on public.countrivo_usage_events(created_at desc);
create index if not exists countrivo_usage_device_created on public.countrivo_usage_events(device_id,created_at desc);
create index if not exists countrivo_runs_usage_started on public.countrivo_runs(started_at desc) include (game_slug,mode,status);
alter table public.countrivo_usage_events enable row level security;
revoke all on public.countrivo_usage_events from public, anon, authenticated;
grant select, insert, delete on public.countrivo_usage_events to service_role;
comment on table public.countrivo_usage_events is 'Private, bounded first-party product events. No names, guesses, feedback text, IPs, URLs, query strings or session tokens. Browser counts are received events; game events are authoritative committed revisions.';

create table if not exists public.countrivo_usage_maintenance (
  singleton boolean primary key default true check(singleton),
  next_cleanup_at timestamptz not null default now()
);
insert into public.countrivo_usage_maintenance(singleton) values(true) on conflict do nothing;
alter table public.countrivo_usage_maintenance enable row level security;
revoke all on public.countrivo_usage_maintenance from public,anon,authenticated;
grant select,update on public.countrivo_usage_maintenance to service_role;
create or replace function public.countrivo_maintain_usage()
returns void language plpgsql security definer set search_path=public as $$
declare removed bigint;
begin
  if (select next_cleanup_at>now() from public.countrivo_usage_maintenance where singleton) then return; end if;
  if not pg_try_advisory_xact_lock(hashtextextended('countrivo-usage-cleanup',0)) then return; end if;
  if (select next_cleanup_at>now() from public.countrivo_usage_maintenance where singleton) then return; end if;
  with expired as (select event_key from public.countrivo_usage_events where created_at<now()-interval '90 days' order by created_at limit 10000)
  delete from public.countrivo_usage_events e using expired where e.event_key=expired.event_key;
  get diagnostics removed=row_count;
  update public.countrivo_usage_maintenance set next_cleanup_at=now()+case when removed=10000 then interval '1 minute' else interval '1 day' end where singleton;
end;
$$;
revoke all on function public.countrivo_maintain_usage() from public,anon,authenticated;
grant execute on function public.countrivo_maintain_usage() to service_role;

create or replace function public.countrivo_record_usage(p_device uuid,p_events jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare item jsonb;
begin
  if p_device is null or jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events) not between 1 and 32 then raise exception 'usage_invalid'; end if;
  perform public.countrivo_maintain_usage();
  perform pg_advisory_xact_lock(hashtextextended('usage|'||p_device::text,0));
  if (select count(*) from public.countrivo_usage_events where device_id=p_device and source<>'server' and created_at>now()-interval '1 hour')>=2000 then raise exception 'usage_rate_limited'; end if;
  for item in select value from jsonb_array_elements(p_events) loop
    if item->>'event' not in ('page_view','navigation','game_switch','leaderboard_open','entry_manage','entry_action','disclosure','game_control','share_intent','share_result','feedback_open','feedback_submit','feedback_result','feedback_close') then raise exception 'usage_invalid'; end if;
    if coalesce(item->>'source','other')='server' then raise exception 'usage_invalid'; end if;
    insert into public.countrivo_usage_events(event_key,device_id,event,game,mode,source,target,target_game,outcome,action)
    values ('client:'||(item->>'id')::uuid::text,p_device,item->>'event',item->>'game',item->>'mode',coalesce(item->>'source','other'),item->>'target',item->>'targetGame',item->>'outcome',item->>'action')
    on conflict(event_key) do nothing;
  end loop;
end;
$$;
revoke all on function public.countrivo_record_usage(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.countrivo_record_usage(uuid,jsonb) to service_role;

create or replace function public.countrivo_track_run_usage()
returns trigger language plpgsql security definer set search_path=public as $$
declare prior_revision integer:=0; prior_log text:=''; prior_status text:='open'; action_kind text:='commit'; appended text; raw_action text;
begin
  if tg_op='UPDATE' then prior_revision:=old.revision; prior_log:=old.action_log; prior_status:=old.status; end if;
  if (tg_op='INSERT' or prior_revision=0) and (new.revision>0 or new.status='complete') then
    insert into public.countrivo_usage_events(event_key,device_id,event,game,mode,source,run_id)
    values('run:'||new.id||':start',new.device_id,'game_start',new.game_slug,new.mode,'server',new.id) on conflict do nothing;
  end if;
  if new.revision>prior_revision then
    appended:=substring(new.action_log from char_length(prior_log)+1);
    if new.game_slug='blind-pick' then
      action_kind:=case right(new.action_log,1) when 'u' then 'undo' when 's' then 'reveal' else 'place' end;
    elsif new.game_slug='country-draft' then
      action_kind:=case left(appended,1) when 'o' then 'open' when 'a' then 'appoint' when 'n' then 'next' when 'z' then 'reveal' else 'commit' end;
    elsif new.game_slug='geo-wordle' then
      action_kind:=case left(appended,1) when 'g' then 'guess' when 'c' then 'hint' else 'commit' end;
    elsif new.game_slug='pinpoint' then
      action_kind:=case left(appended,1) when 'd' then 'drop' when 'n' then 'next' else 'commit' end;
    elsif new.game_slug in ('flag-quiz','higher-or-lower','stat-guesser') and left(new.action_log,1)='[' then
      raw_action:=(new.action_log::jsonb->-1)->>'t';
      action_kind:=case when raw_action in ('answer','guess','lock','next') then raw_action else 'commit' end;
    end if;
    insert into public.countrivo_usage_events(event_key,device_id,event,game,mode,source,action,run_id,step)
    values('run:'||new.id||':action:'||new.revision,new.device_id,'game_action',new.game_slug,new.mode,'server',action_kind,new.id,new.revision) on conflict do nothing;
  end if;
  if new.status='complete' and (tg_op='INSERT' or prior_status<>'complete') then
    insert into public.countrivo_usage_events(event_key,device_id,event,game,mode,source,action,run_id)
    values('run:'||new.id||':complete',new.device_id,'game_complete',new.game_slug,new.mode,'server',case when new.game_slug='speed-flags' then 'timed_round' else null end,new.id) on conflict do nothing;
  end if;
  if tg_op='UPDATE' and old.status='complete' and (new.display_name is distinct from old.display_name or new.place_country_code is distinct from old.place_country_code) then
    insert into public.countrivo_usage_events(event_key,device_id,event,game,mode,source,action,run_id)
    values('name:'||gen_random_uuid()::text,new.device_id,'name_saved',new.game_slug,new.mode,'server',case when new.display_name like 'guest-%' then 'restore_guest' else 'save_name' end,new.id);
  end if;
  return new;
exception when others then
  -- Optional telemetry must never roll back a player's accepted move.
  return new;
end;
$$;
revoke all on function public.countrivo_track_run_usage() from public, anon, authenticated;
drop trigger if exists countrivo_track_run_usage on public.countrivo_runs;
create trigger countrivo_track_run_usage after insert or update on public.countrivo_runs for each row execute function public.countrivo_track_run_usage();

create or replace function public.countrivo_track_feedback_usage()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.countrivo_usage_events(event_key,device_id,event,game,source,action,outcome)
  values('feedback:'||new.id,new.device_id,'feedback_saved',new.game_slug,'server',new.scope,'saved') on conflict do nothing;
  return new;
exception when others then return new;
end;
$$;
revoke all on function public.countrivo_track_feedback_usage() from public, anon, authenticated;
drop trigger if exists countrivo_track_feedback_usage on public.countrivo_site_feedback;
create trigger countrivo_track_feedback_usage after insert on public.countrivo_site_feedback for each row execute function public.countrivo_track_feedback_usage();

create or replace function public.countrivo_usage_summary(p_days integer default 7)
returns jsonb language sql volatile security invoker set search_path=public as $$
select public.countrivo_maintain_usage();
with recent as (
  select * from public.countrivo_usage_events where created_at>=now()-make_interval(days=>greatest(1,least(p_days,90)))
), counts as (
  select event,game,mode,source,action,outcome,target,target_game,count(*) as total
  from recent group by event,game,mode,source,action,outcome,target,target_game
), runs as (
  select game_slug as game,mode,count(*) filter(where revision>0 or status='complete') as started,
    count(*) filter(where status='complete') as completed,
    count(*) filter(where status='open' and revision>0) as unfinished,
    round(avg(score_raw) filter(where status='complete'),1) as average_score
  from public.countrivo_runs where started_at>=now()-make_interval(days=>greatest(1,least(p_days,90))) group by game_slug,mode
)
select jsonb_build_object('events',coalesce((select jsonb_agg(to_jsonb(counts) order by total desc) from counts),'[]'::jsonb),
  'runs',coalesce((select jsonb_agg(to_jsonb(runs) order by started desc) from runs),'[]'::jsonb),
  'devices',(select count(distinct device_id) from recent),'received',(select count(*) from recent),
  'first_event',(select min(created_at) from public.countrivo_usage_events));
$$;
revoke all on function public.countrivo_usage_summary(integer) from public, anon, authenticated;
grant execute on function public.countrivo_usage_summary(integer) to service_role;

create or replace function public.countrivo_prune_usage()
returns bigint language plpgsql security definer set search_path=public as $$
declare removed bigint;
begin
  delete from public.countrivo_usage_events where created_at<now()-interval '90 days';
  get diagnostics removed=row_count;
  return removed;
end;
$$;
revoke all on function public.countrivo_prune_usage() from public, anon, authenticated;
grant execute on function public.countrivo_prune_usage() to service_role;

create or replace function public.countrivo_forget_device(p_device_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  delete from public.countrivo_usage_events where device_id=p_device_id;
  delete from public.countrivo_site_feedback where device_id=p_device_id;
  delete from public.countrivo_publisher_blocks where viewer_id=p_device_id or publisher_id=p_device_id;
  delete from public.countrivo_name_events where device_id=p_device_id;
  delete from public.countrivo_name_reports where device_id=p_device_id or run_id in(select id from public.countrivo_runs where device_id=p_device_id);
  delete from public.countrivo_runs where device_id=p_device_id;
end;
$$;
revoke all on function public.countrivo_forget_device(uuid) from public, anon, authenticated;
grant execute on function public.countrivo_forget_device(uuid) to service_role;
notify pgrst,'reload schema';
commit;
