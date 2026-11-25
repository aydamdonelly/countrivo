-- Apply after the migration inside the same outer transaction when previewing it.
-- All fixtures and operations are rolled back; no public test posts persist.
begin;
do $$
declare author uuid:=gen_random_uuid(); legacy_author uuid:=gen_random_uuid(); voter uuid:=gen_random_uuid(); voter2 uuid:=gen_random_uuid();
  submission uuid:=gen_random_uuid(); legacy_submission uuid:=gen_random_uuid(); request1 uuid:=gen_random_uuid(); public_id bigint; private_id bigint; result record; n bigint;
begin
  if has_table_privilege('anon','public.countrivo_site_feedback','SELECT') or has_table_privilege('anon','public.countrivo_feedback_votes','SELECT') or has_table_privilege('anon','public.countrivo_feedback_vote_requests','SELECT') then raise exception 'private tables readable'; end if;
  if has_function_privilege('anon','public.countrivo_public_feedback(uuid,bigint,integer,bigint[])','EXECUTE') or has_function_privilege('anon','public.countrivo_vote_feedback(uuid,bigint,integer,uuid)','EXECUTE') then raise exception 'RPC exposed without server projection'; end if;

  perform public.countrivo_submit_feedback(legacy_author,legacy_submission,'site','site',null,'Private QA original: must never appear on the board.');
  select id into private_id from public.countrivo_site_feedback where device_id=legacy_author and submission_id=legacy_submission;
  perform public.countrivo_submit_feedback(legacy_author,legacy_submission,'site','site',null,'Changed public retry must not replace a private original.',true);
  if exists(select 1 from public.countrivo_public_feedback(null,null,101,array[private_id])) then raise exception 'old private retry was published'; end if;
  if not exists(select 1 from public.countrivo_site_feedback where id=private_id and message='Private QA original: must never appear on the board.' and public_message is null) then raise exception 'private original changed'; end if;

  perform public.countrivo_submit_feedback(author,submission,'game','result','flag-quiz','Public QA fixture: only visible within this transaction.',true);
  perform public.countrivo_submit_feedback(author,submission,'game','result','flag-quiz','Retry cannot change original publication.',true);
  select id into public_id from public.countrivo_site_feedback where device_id=author and submission_id=submission;
  select * into result from public.countrivo_public_feedback(null,null,101,array[public_id]);
  if result.id is null or result.source<>'player' or result.upvotes<>0 or result.downvotes<>0 or result.vote<>0 then raise exception 'public submission projection invalid'; end if;
  if to_jsonb(result) ?| array['device_id','submission_id','public_message','moderation_hidden'] then raise exception 'private metadata leaked'; end if;
  if result.message<>'Public QA fixture: only visible within this transaction.' then raise exception 'retry changed public text'; end if;

  select * into result from public.countrivo_vote_feedback(voter,public_id,1,request1);
  if result.upvotes<>1 or result.vote<>1 then raise exception 'upvote failed'; end if;
  perform public.countrivo_vote_feedback(voter,public_id,1,request1);
  select count(*) into n from public.countrivo_feedback_votes where feedback_id=public_id and device_id=voter;
  if n<>1 then raise exception 'duplicate vote'; end if;
  select * into result from public.countrivo_vote_feedback(voter,public_id,-1,gen_random_uuid());
  if result.upvotes<>0 or result.downvotes<>1 or result.vote<>-1 then raise exception 'vote switch not atomic'; end if;
  select * into result from public.countrivo_vote_feedback(voter,public_id,1,request1);
  if result.vote<>-1 then raise exception 'late retry undid a newer vote'; end if;
  select * into result from public.countrivo_vote_feedback(voter,public_id,0,gen_random_uuid());
  if result.upvotes<>0 or result.downvotes<>0 or result.vote<>0 then raise exception 'toggle off failed'; end if;
  perform public.countrivo_vote_feedback(voter,public_id,0,gen_random_uuid());
  if (select count(*) from public.countrivo_usage_events where device_id=voter and event='feedback_vote')<>3 then raise exception 'vote events duplicated retries or noops'; end if;
  if not exists(select 1 from public.countrivo_usage_events where device_id=voter and event='feedback_vote' and action='upvote') or not exists(select 1 from public.countrivo_usage_events where device_id=voter and event='feedback_vote' and action='downvote') or not exists(select 1 from public.countrivo_usage_events where device_id=voter and event='feedback_vote' and action='remove_vote') then raise exception 'vote event direction missing'; end if;
  perform public.countrivo_vote_feedback(voter2,public_id,1,gen_random_uuid());
  select * into result from public.countrivo_public_feedback(voter,null,1,array[public_id]);
  if result.upvotes<>1 or result.vote<>0 then raise exception 'own vote leaked across devices'; end if;
  begin
    perform public.countrivo_vote_feedback(voter,public_id,0,request1);
    raise exception 'request reuse accepted';
  exception when raise_exception then if sqlerrm<>'feedback_vote_invalid' then raise; end if; end;
  begin
    perform public.countrivo_vote_feedback(voter,private_id,1,gen_random_uuid());
    raise exception 'private feedback vote accepted';
  exception when raise_exception then if sqlerrm<>'feedback_vote_unavailable' then raise; end if; end;

  update public.countrivo_site_feedback set moderation_hidden=true where id=public_id;
  if exists(select 1 from public.countrivo_public_feedback(voter,null,101,array[public_id])) then raise exception 'hidden post visible'; end if;
  begin
    perform public.countrivo_vote_feedback(voter,public_id,1,gen_random_uuid());
    raise exception 'hidden feedback vote accepted';
  exception when raise_exception then if sqlerrm<>'feedback_vote_unavailable' then raise; end if; end;
  update public.countrivo_site_feedback set moderation_hidden=false where id=public_id;
  if not exists(select 1 from public.countrivo_public_feedback(voter,null,101,array[public_id])) then raise exception 'restore failed'; end if;

  -- A reviewed projection is explicitly separate from its unmodified private original.
  update public.countrivo_site_feedback set public_message='An owner-reviewed anonymous summary for this rollback test.',published_at=now(),publication_source='reviewed' where id=private_id;
  select * into result from public.countrivo_public_feedback(null,null,101,array[private_id]);
  if result.source<>'reviewed' or result.message like '%Private QA original%' then raise exception 'reviewed projection leaked original'; end if;
  if exists(select 1 from public.countrivo_public_feedback(null,public_id,101,array[public_id])) then raise exception 'pagination cursor not exclusive'; end if;

  insert into public.countrivo_feedback_vote_requests(device_id,request_id,feedback_id,value)
    select voter,gen_random_uuid(),public_id,0 from generate_series(1,60);
  begin
    perform public.countrivo_vote_feedback(voter,public_id,1,gen_random_uuid());
    raise exception 'vote rate limit absent';
  exception when raise_exception then if sqlerrm<>'feedback_vote_rate_limited' then raise; end if; end;
  perform public.countrivo_vote_feedback(voter,public_id,1,request1);
  perform public.countrivo_forget_device(voter2);
  if exists(select 1 from public.countrivo_feedback_votes where device_id=voter2) or exists(select 1 from public.countrivo_feedback_vote_requests where device_id=voter2) then raise exception 'forget retained voter identity'; end if;
  perform public.countrivo_forget_device(author);
  if exists(select 1 from public.countrivo_site_feedback where id=public_id) or exists(select 1 from public.countrivo_feedback_votes where feedback_id=public_id) or exists(select 1 from public.countrivo_feedback_vote_requests where feedback_id=public_id) then raise exception 'author forget left orphan data'; end if;
  raise notice 'Feedback board SQL: privacy, publication, idempotency, voting, rate limits, moderation, pagination and forgetting passed.';
end;
$$;
rollback;
