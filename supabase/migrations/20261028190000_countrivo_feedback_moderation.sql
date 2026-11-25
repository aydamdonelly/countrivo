begin;

create table public.countrivo_feedback_reports (
  feedback_id bigint not null references public.countrivo_site_feedback(id) on delete cascade,
  device_id uuid not null,
  ip_hash text not null check(ip_hash ~ '^[a-f0-9]{64}$'),
  reason text not null check(reason in('Harassment or bullying','Hate or discrimination','Sexual or graphic content','Personal information','Spam or advertising','Other concern')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key(feedback_id,device_id)
);
create index countrivo_feedback_reports_queue on public.countrivo_feedback_reports(created_at desc) where resolved_at is null;
create index countrivo_feedback_reports_network on public.countrivo_feedback_reports(ip_hash,created_at desc);
alter table public.countrivo_feedback_reports enable row level security;
revoke all on public.countrivo_feedback_reports from public,anon,authenticated;
grant select,insert,update,delete on public.countrivo_feedback_reports to service_role;

-- Mirrors the lightweight public-text guard in src/lib/feedback-moderation.ts.
-- Private originals are never filtered, rewritten or retroactively published.
create function public.countrivo_feedback_text_allowed(p_message text)
returns boolean language sql immutable set search_path=public as $$
  with terms as (
    select string_agg(array_to_string(regexp_split_to_array(word,''),'[^a-z0-9]*'),'|') as pattern
    from unnest(array['nigger','nigga','faggot','cunt','fuck','shit','bitch','whore','slut','porn','pedophile']) as word
  ), normalized as (
    select regexp_replace(lower(normalize(p_message,NFKC)),U&'[\200B-\200D\FEFF]','','g') as value
  )
  select coalesce(value !~ ('(^|[^a-z])('||pattern||')(s|ing|er|ers)?($|[^a-z])')
    and translate(value,'013457@$!','oieastasi') !~ ('(^|[^a-z])('||pattern||')(s|ing|er|ers)?($|[^a-z])'),false) from terms,normalized;
$$;
revoke all on function public.countrivo_feedback_text_allowed(text) from public,anon,authenticated;
grant execute on function public.countrivo_feedback_text_allowed(text) to service_role;

create function public.countrivo_guard_public_feedback()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.public_message is null or new.moderation_hidden then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('publisher|'||new.device_id::text,0));
  if exists(select 1 from public.countrivo_publisher_bans where device_id=new.device_id) then raise exception 'publisher_banned'; end if;
  if not public.countrivo_feedback_text_allowed(new.public_message) then raise exception 'feedback_content_rejected'; end if;
  return new;
end;
$$;
revoke all on function public.countrivo_guard_public_feedback() from public,anon,authenticated;
create trigger countrivo_guard_public_feedback before insert or update of public_message,moderation_hidden on public.countrivo_site_feedback
for each row execute function public.countrivo_guard_public_feedback();

-- Retain originals and votes; existing disallowed public posts enter owner review.
update public.countrivo_site_feedback set moderation_hidden=true
where public_message is not null and not moderation_hidden and not public.countrivo_feedback_text_allowed(public_message);

create or replace function public.countrivo_public_feedback(p_device uuid default null,p_before bigint default null,p_limit integer default 51,p_ids bigint[] default null)
returns table(id bigint,message text,scope text,context text,game_slug text,created_at timestamptz,source text,upvotes bigint,downvotes bigint,vote smallint)
language sql stable security invoker set search_path=public as $$
  select f.id,f.public_message,f.scope,f.context,f.game_slug,f.created_at,f.publication_source,
    coalesce(t.upvotes,0),coalesce(t.downvotes,0),coalesce(own.value,0)::smallint
  from public.countrivo_site_feedback f
  left join lateral(select count(*) filter(where v.value=1) as upvotes,count(*) filter(where v.value=-1) as downvotes from public.countrivo_feedback_votes v where v.feedback_id=f.id)t on true
  left join public.countrivo_feedback_votes own on own.feedback_id=f.id and own.device_id=p_device
  where f.public_message is not null and not f.moderation_hidden
    and not exists(select 1 from public.countrivo_publisher_bans b where b.device_id=f.device_id)
    and not exists(select 1 from public.countrivo_publisher_blocks b where b.viewer_id=p_device and b.publisher_id=f.device_id)
    and (p_before is null or f.id<p_before) and (p_ids is null or f.id=any(p_ids))
  order by f.id desc limit greatest(1,least(coalesce(p_limit,51),101));
$$;
revoke all on function public.countrivo_public_feedback(uuid,bigint,integer,bigint[]) from public,anon,authenticated;
grant execute on function public.countrivo_public_feedback(uuid,bigint,integer,bigint[]) to service_role;

-- A boolean lets the UI omit self-report controls without disclosing device IDs.
create function public.countrivo_public_feedback_v2(p_device uuid default null,p_before bigint default null,p_limit integer default 51)
returns table(id bigint,message text,scope text,context text,game_slug text,created_at timestamptz,source text,upvotes bigint,downvotes bigint,vote smallint,own boolean)
language sql stable security invoker set search_path=public as $$
  select p.*,coalesce(f.device_id=p_device,false) from public.countrivo_public_feedback(p_device,p_before,p_limit) p
  join public.countrivo_site_feedback f on f.id=p.id order by p.id desc;
$$;
revoke all on function public.countrivo_public_feedback_v2(uuid,bigint,integer) from public,anon,authenticated;
grant execute on function public.countrivo_public_feedback_v2(uuid,bigint,integer) to service_role;

create function public.countrivo_report_feedback(p_feedback bigint,p_device uuid,p_ip text,p_reason text)
returns void language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
  if p_device is null or p_ip is null or p_ip !~ '^[a-f0-9]{64}$' or p_reason is null or p_reason not in('Harassment or bullying','Hate or discrimination','Sexual or graphic content','Personal information','Spam or advertising','Other concern') then raise exception 'feedback_report_invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended('feedback-report|'||p_ip,0));
  -- Different networks must observe each other's accepted reports at the threshold.
  perform pg_advisory_xact_lock(hashtextextended('feedback-report-post|'||p_feedback::text,0));
  if exists(select 1 from public.countrivo_feedback_reports where feedback_id=p_feedback and device_id=p_device) then return; end if;
  select device_id into target from public.countrivo_site_feedback where id=p_feedback and public_message is not null and not moderation_hidden;
  if not found or target=p_device then raise exception 'feedback_unavailable'; end if;
  if (select count(*) from public.countrivo_feedback_reports where (ip_hash=p_ip or device_id=p_device) and created_at>now()-interval '1 day')>=20 then raise exception 'report_throttled'; end if;
  insert into public.countrivo_feedback_reports(feedback_id,device_id,ip_hash,reason) values(p_feedback,p_device,p_ip,p_reason) on conflict do nothing;
  if (select count(distinct ip_hash) from public.countrivo_feedback_reports where feedback_id=p_feedback and resolved_at is null)>=3 then
    update public.countrivo_site_feedback set moderation_hidden=true where id=p_feedback;
  end if;
end;
$$;
revoke all on function public.countrivo_report_feedback(bigint,uuid,text,text) from public,anon,authenticated;
grant execute on function public.countrivo_report_feedback(bigint,uuid,text,text) to service_role;

create function public.countrivo_block_feedback_author(p_feedback bigint,p_viewer uuid)
returns void language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
  if p_viewer is null then raise exception 'feedback_unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended('block|'||p_viewer::text,0));
  select device_id into target from public.countrivo_site_feedback where id=p_feedback and public_message is not null;
  if not found or target=p_viewer then raise exception 'feedback_unavailable'; end if;
  if exists(select 1 from public.countrivo_publisher_blocks where viewer_id=p_viewer and publisher_id=target) then return; end if;
  if (select count(*) from public.countrivo_publisher_blocks where viewer_id=p_viewer)>=200 then raise exception 'block_limit'; end if;
  insert into public.countrivo_publisher_blocks(viewer_id,publisher_id) values(p_viewer,target) on conflict do nothing;
end;
$$;
revoke all on function public.countrivo_block_feedback_author(bigint,uuid) from public,anon,authenticated;
grant execute on function public.countrivo_block_feedback_author(bigint,uuid) to service_role;

create function public.countrivo_set_feedback_author_ban(p_feedback bigint,p_banned boolean)
returns void language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
  select device_id into target from public.countrivo_site_feedback where id=p_feedback and public_message is not null;
  if not found or p_banned is null then raise exception 'feedback_unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended('publisher|'||target::text,0));
  if p_banned then
    insert into public.countrivo_publisher_bans(device_id) values(target) on conflict do nothing;
    update public.countrivo_site_feedback set moderation_hidden=true where device_id=target and public_message is not null;
    update public.countrivo_runs set moderation_hidden=true where device_id=target;
  else
    delete from public.countrivo_publisher_bans where device_id=target;
  end if;
end;
$$;
revoke all on function public.countrivo_set_feedback_author_ban(bigint,boolean) from public,anon,authenticated;
grant execute on function public.countrivo_set_feedback_author_ban(bigint,boolean) to service_role;

-- Preserve vote idempotency and event accounting; reject blocked/banned posts
-- before any existing vote can be changed, including a remove-vote request.
alter function public.countrivo_vote_feedback(uuid,bigint,integer,uuid) rename to countrivo_vote_feedback_internal;
create function public.countrivo_vote_feedback(p_device uuid,p_feedback bigint,p_value integer,p_request uuid)
returns table(id bigint,message text,scope text,context text,game_slug text,created_at timestamptz,source text,upvotes bigint,downvotes bigint,vote smallint)
language plpgsql security invoker set search_path=public as $$
begin
  if not exists(select 1 from public.countrivo_public_feedback(p_device,null,1,array[p_feedback])) then raise exception 'feedback_vote_unavailable'; end if;
  return query select * from public.countrivo_vote_feedback_internal(p_device,p_feedback,p_value,p_request);
end;
$$;
revoke all on function public.countrivo_vote_feedback(uuid,bigint,integer,uuid) from public,anon,authenticated;
grant execute on function public.countrivo_vote_feedback(uuid,bigint,integer,uuid) to service_role;

create or replace function public.countrivo_forget_device(p_device_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  delete from public.countrivo_feedback_reports where device_id=p_device_id;
  delete from public.countrivo_usage_events where device_id=p_device_id;
  delete from public.countrivo_feedback_vote_requests where device_id=p_device_id;
  delete from public.countrivo_feedback_votes where device_id=p_device_id;
  delete from public.countrivo_site_feedback where device_id=p_device_id;
  delete from public.countrivo_publisher_blocks where viewer_id=p_device_id or publisher_id=p_device_id;
  delete from public.countrivo_name_events where device_id=p_device_id;
  delete from public.countrivo_name_reports where device_id=p_device_id or run_id in(select id from public.countrivo_runs where device_id=p_device_id);
  delete from public.countrivo_runs where device_id=p_device_id;
  -- Existing moderation-ban identifiers remain; removed posts cascade their reports/votes.
end;
$$;
revoke all on function public.countrivo_forget_device(uuid) from public,anon,authenticated;
grant execute on function public.countrivo_forget_device(uuid) to service_role;
notify pgrst,'reload schema';
commit;
