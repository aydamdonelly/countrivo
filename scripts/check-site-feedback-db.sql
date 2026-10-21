-- Production-safe regression: every fixture is rolled back; no real device is used.
begin;

do $$
begin
  if not (select relrowsecurity from pg_class where oid='public.countrivo_site_feedback'::regclass) then raise exception 'feedback RLS disabled'; end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='countrivo_site_feedback') then raise exception 'feedback must have no public policies'; end if;
  if has_table_privilege('anon','public.countrivo_site_feedback','SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated','public.countrivo_site_feedback','SELECT,INSERT,UPDATE,DELETE') then raise exception 'feedback table publicly accessible'; end if;
  if has_function_privilege('anon','public.countrivo_submit_feedback(uuid,uuid,text,text,text,text)','EXECUTE')
    or has_function_privilege('authenticated','public.countrivo_submit_feedback(uuid,uuid,text,text,text,text)','EXECUTE') then raise exception 'feedback RPC publicly executable'; end if;
  if not has_function_privilege('service_role','public.countrivo_submit_feedback(uuid,uuid,text,text,text,text)','EXECUTE') then raise exception 'service role cannot execute'; end if;
end;
$$;

set local role service_role;
do $$
declare
  device uuid := gen_random_uuid();
  submission uuid := gen_random_uuid();
  other_device uuid := gen_random_uuid();
  cooldown_device uuid := gen_random_uuid();
begin
  perform public.countrivo_submit_feedback(device,submission,'game','result','flag-quiz','[QA rolled back] clear flag comparisons.');
  perform public.countrivo_submit_feedback(device,submission,'game','result','flag-quiz','[QA rolled back] clear flag comparisons.');
  if (select count(*) from public.countrivo_site_feedback where device_id=device) <> 1 then raise exception 'idempotency failed'; end if;
  begin
    perform public.countrivo_submit_feedback(device,gen_random_uuid(),'site','site',null,'[QA rolled back] should be rate limited.');
    raise exception 'five second limit did not reject';
  exception when raise_exception then
    if sqlerrm <> 'feedback_too_soon' then raise; end if;
  end;
  insert into public.countrivo_site_feedback(device_id,submission_id,scope,context,message,created_at)
    select device,gen_random_uuid(),'site','site','[QA rolled back] hourly fixture.',now()-sample*interval '1 minute' from generate_series(1,18) as sample;
  insert into public.countrivo_site_feedback(device_id,submission_id,scope,context,message,created_at)
    values(cooldown_device,gen_random_uuid(),'site','site','[QA rolled back] previous feedback.',now()-interval '6 seconds');
  perform public.countrivo_submit_feedback(cooldown_device,gen_random_uuid(),'site','site',null,'[QA rolled back] another message after five seconds is allowed.');
  -- Nineteen existing entries must still allow a twentieth, after the cooldown.
  insert into public.countrivo_site_feedback(device_id,submission_id,scope,context,message,created_at)
    select other_device,gen_random_uuid(),'site','site','[QA rolled back] nineteen hourly fixtures.',now()-sample*interval '1 minute' from generate_series(1,19) as sample;
  perform public.countrivo_submit_feedback(other_device,gen_random_uuid(),'site','site',null,'[QA rolled back] twentieth message is allowed.');
  if (select count(*) from public.countrivo_site_feedback where device_id=other_device) <> 20 then raise exception 'twentieth feedback not accepted'; end if;
  begin
    perform public.countrivo_submit_feedback(other_device,gen_random_uuid(),'site','site',null,'[QA rolled back] twenty-first message must be rejected.');
    raise exception 'hour limit did not reject';
  exception when raise_exception then
    if sqlerrm <> 'feedback_rate_limited' then raise; end if;
  end;
  -- Retrying a committed submission still succeeds when the rate limit is full.
  insert into public.countrivo_site_feedback(device_id,submission_id,scope,context,message,created_at)
    values(device,gen_random_uuid(),'site','site','[QA rolled back] fill final hourly slot.',now()-interval '40 minutes');
  perform public.countrivo_submit_feedback(device,submission,'game','result','flag-quiz','[QA rolled back] clear flag comparisons.');
  begin
    perform public.countrivo_submit_feedback(gen_random_uuid(),gen_random_uuid(),'game','site',null,'[QA rolled back] missing game.');
    raise exception 'missing game accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.countrivo_submit_feedback(gen_random_uuid(),gen_random_uuid(),'site','site',null,'four');
    raise exception 'short message accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.countrivo_submit_feedback(gen_random_uuid(),gen_random_uuid(),'site','site',null,repeat('a',1501));
    raise exception 'long message accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.countrivo_submit_feedback(gen_random_uuid(),gen_random_uuid(),'game','game','unregistered-game','[QA rolled back] unknown game.');
    raise exception 'unknown game accepted';
  exception when check_violation then null;
  end;
  perform public.countrivo_forget_device(other_device);
  if exists(select 1 from public.countrivo_site_feedback where device_id=other_device) then raise exception 'forget did not remove feedback-only device'; end if;
end;
$$;
reset role;
select 'passed' as feedback_private_grants_idempotency_rate_constraints_forget;
rollback;
