-- Run only against a local/test database after the moderation migration.
-- Every fixture and mutation is rolled back. No public test post persists.
begin;
do $$
declare author uuid:=gen_random_uuid(); viewer uuid:=gen_random_uuid(); other uuid:=gen_random_uuid(); third uuid:=gen_random_uuid();
  private_author uuid:=gen_random_uuid(); first_id bigint; second_id bigint; private_id bigint; post_lock bigint; row record;
begin
  if has_table_privilege('anon','public.countrivo_feedback_reports','SELECT')
    or has_function_privilege('anon','public.countrivo_report_feedback(bigint,uuid,text,text)','EXECUTE')
    or has_function_privilege('authenticated','public.countrivo_set_feedback_author_ban(bigint,boolean)','EXECUTE') then raise exception 'moderation permission leak'; end if;
  if not public.countrivo_feedback_text_allowed('Support should reply faster. Scunthorpe and country comparisons are fine.') then raise exception 'ordinary text rejected'; end if;
  if public.countrivo_feedback_text_allowed('fuck!') or public.countrivo_feedback_text_allowed('f.u.c.k') or public.countrivo_feedback_text_allowed('sh!t') or public.countrivo_feedback_text_allowed('ＦＵＣＫ') then raise exception 'content guard bypass'; end if;
  begin
    perform public.countrivo_submit_feedback(author,gen_random_uuid(),'site','site',null,'This is f.u.c.k!',true);
    raise exception 'unsafe public text accepted';
  exception when raise_exception then if sqlerrm<>'feedback_content_rejected' then raise; end if; end;
  perform public.countrivo_submit_feedback(private_author,gen_random_uuid(),'site','site',null,'Private report quoting fuck! is not a public post.');
  select id into private_id from public.countrivo_site_feedback where device_id=private_author;
  perform public.countrivo_submit_feedback(author,gen_random_uuid(),'site','site',null,'First safe public fixture.',true);
  select id into first_id from public.countrivo_site_feedback where device_id=author;
  update public.countrivo_site_feedback set created_at=now()-interval '1 minute' where id=first_id;
  perform public.countrivo_submit_feedback(author,gen_random_uuid(),'site','site',null,'Second safe public fixture.',true);
  select max(id) into second_id from public.countrivo_site_feedback where device_id=author;
  select * into row from public.countrivo_public_feedback_v2(author,null,101) where id=first_id;
  if row.own is not true or to_jsonb(row)?|array['device_id','ip_hash','submission_id','moderation_hidden'] then raise exception 'ownership projection leaked metadata'; end if;
  select * into row from public.countrivo_public_feedback_v2(viewer,null,101) where id=first_id;
  if row.own is not false then raise exception 'other author marked own'; end if;
  begin
    perform public.countrivo_report_feedback(first_id,author,repeat('a',64),'Other concern');
    raise exception 'self report accepted';
  exception when raise_exception then if sqlerrm<>'feedback_unavailable' then raise; end if; end;
  begin
    perform public.countrivo_report_feedback(private_id,viewer,repeat('a',64),'Other concern');
    raise exception 'private report target accepted';
  exception when raise_exception then if sqlerrm<>'feedback_unavailable' then raise; end if; end;
  perform public.countrivo_report_feedback(first_id,viewer,repeat('a',64),'Harassment or bullying');
  post_lock:=hashtextextended('feedback-report-post|'||first_id::text,0);
  if not exists(select 1 from pg_locks where locktype='advisory' and pid=pg_backend_pid() and granted and mode='ExclusiveLock'
    and classid=((post_lock>>32)&4294967295)::oid and objid=(post_lock&4294967295)::oid and objsubid=1) then
    raise exception 'report threshold has no transaction-held post lock across different networks';
  end if;
  perform public.countrivo_report_feedback(first_id,viewer,repeat('a',64),'Harassment or bullying');
  if (select count(*) from public.countrivo_feedback_reports where feedback_id=first_id)<>1 then raise exception 'report retry duplicated'; end if;
  perform public.countrivo_report_feedback(first_id,other,repeat('b',64),'Spam or advertising');
  if not exists(select 1 from public.countrivo_public_feedback(null,null,101,array[first_id])) then raise exception 'post hidden before threshold'; end if;
  perform public.countrivo_report_feedback(first_id,third,repeat('c',64),'Other concern');
  if exists(select 1 from public.countrivo_public_feedback(null,null,101,array[first_id])) then raise exception 'reported post not hidden'; end if;
  update public.countrivo_feedback_reports set resolved_at=now() where feedback_id=first_id;
  update public.countrivo_site_feedback set moderation_hidden=false where id=first_id;
  perform public.countrivo_vote_feedback(viewer,first_id,1,gen_random_uuid());
  perform public.countrivo_block_feedback_author(second_id,viewer);
  perform public.countrivo_block_feedback_author(second_id,viewer);
  if exists(select 1 from public.countrivo_public_feedback(viewer,null,101,array[first_id,second_id])) then raise exception 'blocked author remained in feed'; end if;
  if (select count(*) from public.countrivo_public_feedback(other,null,101,array[first_id,second_id]))<>2 then raise exception 'block affected another viewer'; end if;
  begin
    perform public.countrivo_vote_feedback(viewer,first_id,0,gen_random_uuid());
    raise exception 'blocked post vote changed';
  exception when raise_exception then if sqlerrm<>'feedback_vote_unavailable' then raise; end if; end;
  if not exists(select 1 from public.countrivo_feedback_votes where device_id=viewer and feedback_id=first_id and value=1) then raise exception 'blocked vote was changed'; end if;
  delete from public.countrivo_publisher_blocks where viewer_id=viewer;
  if not exists(select 1 from public.countrivo_public_feedback(viewer,null,101,array[first_id])) then raise exception 'unblock failed'; end if;
  perform public.countrivo_set_feedback_author_ban(first_id,true);
  if exists(select 1 from public.countrivo_public_feedback(null,null,101,array[first_id,second_id])) then raise exception 'banned author visible'; end if;
  update public.countrivo_site_feedback set created_at=now()-interval '1 minute' where device_id=author;
  begin
    perform public.countrivo_submit_feedback(author,gen_random_uuid(),'site','site',null,'New public post from banned author.',true);
    raise exception 'banned publisher posted';
  exception when raise_exception then if sqlerrm<>'publisher_banned' then raise; end if; end;
  perform public.countrivo_submit_feedback(author,gen_random_uuid(),'site','site',null,'A private legacy appeal remains private.');
  perform public.countrivo_set_feedback_author_ban(first_id,false);
  if exists(select 1 from public.countrivo_public_feedback(null,null,101,array[first_id])) then raise exception 'unban restored hidden text without review'; end if;
  update public.countrivo_site_feedback set moderation_hidden=false where id=first_id;
  begin
    update public.countrivo_site_feedback set public_message='This is shit!' where id=first_id;
    raise exception 'edited public text bypassed guard';
  exception when raise_exception then if sqlerrm<>'feedback_content_rejected' then raise; end if; end;
  perform public.countrivo_forget_device(viewer);
  if exists(select 1 from public.countrivo_feedback_reports where device_id=viewer) or exists(select 1 from public.countrivo_feedback_votes where device_id=viewer) then raise exception 'forget retained reporter or votes'; end if;
  perform public.countrivo_set_feedback_author_ban(first_id,true);
  perform public.countrivo_forget_device(author);
  if exists(select 1 from public.countrivo_feedback_reports where feedback_id=first_id) or exists(select 1 from public.countrivo_site_feedback where device_id=author) then raise exception 'forget retained authored content/report'; end if;
  if not exists(select 1 from public.countrivo_publisher_bans where device_id=author) then raise exception 'forget erased retained abuse ban'; end if;
  if not exists(select 1 from public.countrivo_site_feedback where id=private_id and public_message is null and message like 'Private report quoting%') then raise exception 'private original changed'; end if;
  raise notice 'Feedback moderation SQL: guards, privacy, reports, blocks, bans, voting, review and forget cascades passed.';
end;
$$;
rollback;
