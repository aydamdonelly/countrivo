begin;

-- Keep every private original unchanged. Only a separate public projection is shown.
alter table public.countrivo_site_feedback add column if not exists public_message text;
alter table public.countrivo_site_feedback add column if not exists published_at timestamptz;
alter table public.countrivo_site_feedback add column if not exists publication_source text;
alter table public.countrivo_site_feedback add column if not exists moderation_hidden boolean not null default false;
alter table public.countrivo_site_feedback add constraint countrivo_feedback_public_text check(public_message is null or char_length(btrim(public_message)) between 5 and 1500);
alter table public.countrivo_site_feedback add constraint countrivo_feedback_publication check(
  (public_message is null and published_at is null and publication_source is null) or
  (public_message is not null and published_at is not null and publication_source in('player','reviewed'))
);
create index if not exists countrivo_feedback_public_feed on public.countrivo_site_feedback(id desc) where public_message is not null and not moderation_hidden;
grant update on public.countrivo_site_feedback to service_role;
comment on column public.countrivo_site_feedback.message is 'Private original. Never selected by the public board RPC. Legacy submissions remain private unless a separate reviewed public_message is approved.';
comment on column public.countrivo_site_feedback.public_message is 'Explicitly public new submission or an owner-reviewed anonymous version. Null means never published.';

create table public.countrivo_feedback_votes (
  feedback_id bigint not null references public.countrivo_site_feedback(id) on delete cascade,
  device_id uuid not null,
  value smallint not null check(value in(-1,1)),
  updated_at timestamptz not null default now(),
  primary key(feedback_id,device_id)
);
create index countrivo_feedback_votes_device on public.countrivo_feedback_votes(device_id);
alter table public.countrivo_feedback_votes enable row level security;
revoke all on public.countrivo_feedback_votes from public,anon,authenticated;
grant select,insert,update,delete on public.countrivo_feedback_votes to service_role;

create table public.countrivo_feedback_vote_requests (
  device_id uuid not null,
  request_id uuid not null,
  feedback_id bigint not null references public.countrivo_site_feedback(id) on delete cascade,
  value smallint not null check(value in(-1,0,1)),
  created_at timestamptz not null default now(),
  primary key(device_id,request_id)
);
create index countrivo_feedback_vote_requests_rate on public.countrivo_feedback_vote_requests(device_id,created_at desc);
create index countrivo_feedback_vote_requests_feedback on public.countrivo_feedback_vote_requests(feedback_id);
alter table public.countrivo_feedback_vote_requests enable row level security;
revoke all on public.countrivo_feedback_vote_requests from public,anon,authenticated;
grant select,insert,delete on public.countrivo_feedback_vote_requests to service_role;

alter table public.countrivo_usage_events drop constraint countrivo_usage_events_event_check;
alter table public.countrivo_usage_events add constraint countrivo_usage_events_event_check check(event in('page_view','navigation','game_switch','leaderboard_open','entry_manage','entry_action','disclosure','game_control','share_intent','share_result','feedback_open','feedback_submit','feedback_result','feedback_close','game_start','game_action','game_complete','name_saved','feedback_saved','feedback_vote'));
alter table public.countrivo_usage_events drop constraint countrivo_usage_events_action_check;
alter table public.countrivo_usage_events add constraint countrivo_usage_events_action_check check(action in('day','result','challenge','game','site','save_name','change_name','restore_guest','cancel','country_flag','score_details','run_details','history','week','yesterday','world','hint','bonus','replay','next','retry','statistics','open','appoint','guess','drop','answer','lock','place','undo','reveal','commit','timed_round','upvote','downvote','remove_vote'));
alter table public.countrivo_usage_events drop constraint countrivo_usage_events_target_check;
alter table public.countrivo_usage_events add constraint countrivo_usage_events_target_check check(target in('home','play','game','leaderboard','practice','archive','world','countries','stats','lists','support','about','legal','feedback','other'));

create or replace function public.countrivo_submit_feedback(p_device uuid,p_submission uuid,p_scope text,p_context text,p_game text,p_message text,p_public boolean)
returns void language plpgsql security invoker set search_path=public as $$
begin
  if p_device is null or p_submission is null or p_public is null then raise exception 'feedback_invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended('feedback|'||p_device::text,0));
  -- An old private submission cannot be made public by retrying with a new flag.
  if exists(select 1 from public.countrivo_site_feedback where device_id=p_device and submission_id=p_submission) then return; end if;
  if (select count(*) from public.countrivo_site_feedback where device_id=p_device and created_at>now()-interval '1 hour')>=20 then raise exception 'feedback_rate_limited'; end if;
  if exists(select 1 from public.countrivo_site_feedback where device_id=p_device and created_at>now()-interval '5 seconds') then raise exception 'feedback_too_soon'; end if;
  insert into public.countrivo_site_feedback(device_id,submission_id,scope,context,game_slug,message,public_message,published_at,publication_source)
  values(p_device,p_submission,p_scope,p_context,p_game,btrim(p_message),case when p_public then btrim(p_message) else null end,case when p_public then now() else null end,case when p_public then 'player' else null end);
end;
$$;
revoke all on function public.countrivo_submit_feedback(uuid,uuid,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.countrivo_submit_feedback(uuid,uuid,text,text,text,text,boolean) to service_role;

create or replace function public.countrivo_submit_feedback(p_device uuid,p_submission uuid,p_scope text,p_context text,p_game text,p_message text)
returns void language sql security invoker set search_path=public as $$
  select public.countrivo_submit_feedback(p_device,p_submission,p_scope,p_context,p_game,p_message,false);
$$;
revoke all on function public.countrivo_submit_feedback(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.countrivo_submit_feedback(uuid,uuid,text,text,text,text) to service_role;

create or replace function public.countrivo_public_feedback(p_device uuid default null,p_before bigint default null,p_limit integer default 51,p_ids bigint[] default null)
returns table(id bigint,message text,scope text,context text,game_slug text,created_at timestamptz,source text,upvotes bigint,downvotes bigint,vote smallint)
language sql stable security invoker set search_path=public as $$
  select f.id,f.public_message,f.scope,f.context,f.game_slug,f.created_at,f.publication_source,
    coalesce(t.upvotes,0),coalesce(t.downvotes,0),coalesce(own.value,0)::smallint
  from public.countrivo_site_feedback f
  left join lateral(select count(*) filter(where v.value=1) as upvotes,count(*) filter(where v.value=-1) as downvotes from public.countrivo_feedback_votes v where v.feedback_id=f.id)t on true
  left join public.countrivo_feedback_votes own on own.feedback_id=f.id and own.device_id=p_device
  where f.public_message is not null and not f.moderation_hidden and (p_before is null or f.id<p_before) and (p_ids is null or f.id=any(p_ids))
  order by f.id desc limit greatest(1,least(coalesce(p_limit,51),101));
$$;
revoke all on function public.countrivo_public_feedback(uuid,bigint,integer,bigint[]) from public,anon,authenticated;
grant execute on function public.countrivo_public_feedback(uuid,bigint,integer,bigint[]) to service_role;

create or replace function public.countrivo_vote_feedback(p_device uuid,p_feedback bigint,p_value integer,p_request uuid)
returns table(id bigint,message text,scope text,context text,game_slug text,created_at timestamptz,source text,upvotes bigint,downvotes bigint,vote smallint)
language plpgsql security invoker set search_path=public as $$
declare prior public.countrivo_feedback_vote_requests; previous_value smallint; selected_game text;
begin
  if p_device is null or p_request is null or p_feedback is null or p_feedback<1 or p_value is null or p_value not in(-1,0,1) then raise exception 'feedback_vote_invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended('feedback-vote|'||p_device::text,0));
  select f.game_slug into selected_game from public.countrivo_site_feedback f where f.id=p_feedback and f.public_message is not null and not f.moderation_hidden for update;
  if not found then raise exception 'feedback_vote_unavailable'; end if;
  select * into prior from public.countrivo_feedback_vote_requests q where q.device_id=p_device and q.request_id=p_request;
  if found then
    if prior.feedback_id<>p_feedback or prior.value<>p_value then raise exception 'feedback_vote_invalid'; end if;
    return query select * from public.countrivo_public_feedback(p_device,null,1,array[p_feedback]);
    return;
  end if;
  if (select count(*) from public.countrivo_feedback_vote_requests q where q.device_id=p_device and q.created_at>now()-interval '1 minute')>=60
    or (select count(*) from public.countrivo_feedback_vote_requests q where q.device_id=p_device and q.created_at>now()-interval '1 hour')>=600 then raise exception 'feedback_vote_rate_limited'; end if;
  insert into public.countrivo_feedback_vote_requests(device_id,request_id,feedback_id,value) values(p_device,p_request,p_feedback,p_value);
  select v.value into previous_value from public.countrivo_feedback_votes v where v.feedback_id=p_feedback and v.device_id=p_device;
  if p_value=0 then
    delete from public.countrivo_feedback_votes v where v.feedback_id=p_feedback and v.device_id=p_device;
  else
    insert into public.countrivo_feedback_votes(feedback_id,device_id,value) values(p_feedback,p_device,p_value)
    on conflict(feedback_id,device_id) do update set value=excluded.value,updated_at=now();
  end if;
  if coalesce(previous_value,0)<>p_value then
    begin
      insert into public.countrivo_usage_events(event_key,device_id,event,game,source,action,outcome)
      values('feedback-vote:'||md5(p_device::text||p_request::text),p_device,'feedback_vote',selected_game,'server',case p_value when 1 then 'upvote' when -1 then 'downvote' else 'remove_vote' end,'saved')
      on conflict do nothing;
    exception when others then null; end;
  end if;
  return query select * from public.countrivo_public_feedback(p_device,null,1,array[p_feedback]);
end;
$$;
revoke all on function public.countrivo_vote_feedback(uuid,bigint,integer,uuid) from public,anon,authenticated;
grant execute on function public.countrivo_vote_feedback(uuid,bigint,integer,uuid) to service_role;

create or replace function public.countrivo_forget_device(p_device_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  delete from public.countrivo_usage_events where device_id=p_device_id;
  delete from public.countrivo_feedback_vote_requests where device_id=p_device_id;
  delete from public.countrivo_feedback_votes where device_id=p_device_id;
  delete from public.countrivo_site_feedback where device_id=p_device_id;
  delete from public.countrivo_publisher_blocks where viewer_id=p_device_id or publisher_id=p_device_id;
  delete from public.countrivo_name_events where device_id=p_device_id;
  delete from public.countrivo_name_reports where device_id=p_device_id or run_id in(select id from public.countrivo_runs where device_id=p_device_id);
  delete from public.countrivo_runs where device_id=p_device_id;
end;
$$;
revoke all on function public.countrivo_forget_device(uuid) from public,anon,authenticated;
grant execute on function public.countrivo_forget_device(uuid) to service_role;
notify pgrst,'reload schema';
commit;
