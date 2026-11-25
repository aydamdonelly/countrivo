-- Synthetic fixtures are invisible to other transactions and are rolled back.
begin;
do $$
declare d uuid:=gen_random_uuid(); r bigint; eid uuid:=gen_random_uuid(); report jsonb; fixture record;
begin
  if has_table_privilege('anon','public.countrivo_usage_events','SELECT') or has_function_privilege('anon','public.countrivo_usage_summary(integer)','EXECUTE') then raise exception 'usage exposed publicly'; end if;
  perform public.countrivo_record_usage(d,jsonb_build_array(jsonb_build_object('id',eid,'event','share_intent','action','day','source','home')));
  perform public.countrivo_record_usage(d,jsonb_build_array(jsonb_build_object('id',eid,'event','share_intent','action','day','source','home')));
  if (select count(*) from public.countrivo_usage_events where device_id=d)<>1 then raise exception 'client retries duplicated'; end if;
  begin
    perform public.countrivo_record_usage(d,jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'event','game_complete','source','server')));
    raise exception 'client spoofed authoritative event';
  exception when raise_exception then if sqlerrm<>'usage_invalid' then raise; end if; end;

  insert into public.countrivo_runs(session_id,device_id,game_slug,mode,date_key,seed,revision,action_log)
  values(gen_random_uuid(),d,'blind-pick','practice',current_date,1,1,'b8.0') returning id into r;
  update public.countrivo_runs set revision=2,action_log='b8.0u' where id=r;
  update public.countrivo_runs set revision=2,action_log='b8.0u' where id=r;
  update public.countrivo_runs set revision=3,action_log='b8.0us',status='complete',completed_at=now(),score_raw=3,score_max=100,score_display='+3' where id=r;
  update public.countrivo_runs set display_name='QA name not copied' where id=r;
  if (select count(*) from public.countrivo_usage_events where run_id=r and event='game_start')<>1 then raise exception 'run start duplicated'; end if;
  if (select count(*) from public.countrivo_usage_events where run_id=r and event='game_action')<>3 then raise exception 'accepted action count wrong'; end if;
  if (select count(*) from public.countrivo_usage_events where run_id=r and action='undo')<>1 then raise exception 'undo not distinguished'; end if;
  if (select count(*) from public.countrivo_usage_events where run_id=r and action='reveal')<>1 then raise exception 'reveal not distinguished'; end if;
  if (select count(*) from public.countrivo_usage_events where run_id=r and event='game_complete')<>1 then raise exception 'completion duplicated'; end if;
  if (select count(*) from public.countrivo_usage_events where run_id=r and event='name_saved')<>1 then raise exception 'name change absent'; end if;
  if exists(select 1 from public.countrivo_usage_events e where device_id=d and to_jsonb(e)::text like '%QA name%') then raise exception 'name leaked'; end if;

  for fixture in select * from (values
    ('country-draft','o1','open'),('geo-wordle','gDEU','guess'),('pinpoint','d123,456;','drop'),
    ('flag-quiz','[{"t":"answer","i":0}]','answer'),('higher-or-lower','[{"t":"guess","c":"higher"}]','guess'),
    ('stat-guesser','[{"t":"lock","i":123}]','lock')
  ) as fixtures(game,log,kind) loop
    insert into public.countrivo_runs(session_id,device_id,game_slug,mode,date_key,seed,revision,action_log)
    values(gen_random_uuid(),d,fixture.game,'practice',current_date,1,1,fixture.log) returning id into r;
    if not exists(select 1 from public.countrivo_usage_events where run_id=r and event='game_action' and action=fixture.kind) then raise exception 'action missing for %',fixture.game; end if;
  end loop;

  perform public.countrivo_submit_feedback(d,gen_random_uuid(),'site','site',null,'QA rollback feedback not copied into events');
  if (select count(*) from public.countrivo_usage_events where device_id=d and event='feedback_saved')<>1 then raise exception 'durable feedback acknowledgement absent'; end if;
  if exists(select 1 from public.countrivo_usage_events e where device_id=d and to_jsonb(e)::text like '%rollback feedback%') then raise exception 'feedback leaked'; end if;
  report:=public.countrivo_usage_summary(7);
  if jsonb_typeof(report->'events')<>'array' or jsonb_typeof(report->'runs')<>'array' then raise exception 'summary malformed'; end if;

  insert into public.countrivo_usage_events(event_key,device_id,event,created_at) values('old:'||eid,d,'page_view',now()-interval '91 days');
  update public.countrivo_usage_maintenance set next_cleanup_at=now()-interval '1 minute' where singleton;
  perform public.countrivo_maintain_usage();
  if exists(select 1 from public.countrivo_usage_events where event_key='old:'||eid) then raise exception 'retention failed'; end if;
  if not exists(select 1 from public.countrivo_usage_maintenance where singleton and next_cleanup_at>now()) then raise exception 'cleanup not gated'; end if;
  perform public.countrivo_forget_device(d);
  if exists(select 1 from public.countrivo_usage_events where device_id=d) then raise exception 'forget retained usage'; end if;
  raise notice 'Usage database: idempotency, authority, actions, completion, privacy, summary, retention and forget passed.';
end;
$$;
rollback;
