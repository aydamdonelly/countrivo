begin;

-- Calculate competition ranks over one immutable edition, before taking a page.
create index if not exists countrivo_published_edition_score on public.countrivo_runs
  (game_slug, date_key, edition, score_sort_value desc, completed_at, id)
  where mode = 'daily' and status = 'complete' and display_name is not null and moderation_hidden = false;

create or replace function public.countrivo_ranked_board(p_slug text,p_day date,p_edition text,p_limit integer default 500,p_run_id bigint default null)
returns jsonb language sql stable security definer set search_path = public as $$
  with published as materialized (
    select id,display_name,score_raw,score_max,score_sort_value,score_display,completed_at,place_country_code
    from public.countrivo_runs
    where game_slug=p_slug and date_key=p_day and edition=p_edition and mode='daily' and status='complete'
      and display_name is not null and moderation_hidden=false
  ), ranked as (
    select *,rank() over(order by score_sort_value desc) as rank_daily,
      row_number() over(order by score_sort_value desc,completed_at,id) as row_position,
      round(100.0*(count(*) over()-count(*) over(order by score_sort_value desc range between unbounded preceding and current row))/nullif(count(*) over(),0)) as percentile
    from published
  ), country_averages as (
    select place_country_code as code,count(*) as count,avg(score_raw) as average,avg(score_sort_value) as average_sort
    from published where place_country_code is not null group by place_country_code having count(*)>=10
  ), countries as (
    select *,rank() over(order by average_sort desc) as rank from country_averages
  )
  select jsonb_build_object(
    'count',(select count(*) from published),
    'average',coalesce((select avg(score_raw) from published),0),
    'entries',coalesce((select jsonb_agg(to_jsonb(r) order by row_position) from ranked r where row_position<=greatest(0,least(500,p_limit)) or id=p_run_id),'[]'::jsonb),
    'countries',coalesce((select jsonb_agg(to_jsonb(c) order by rank,code) from countries c),'[]'::jsonb)
  );
$$;
revoke all on function public.countrivo_ranked_board(text,date,text,integer,bigint) from public;
grant execute on function public.countrivo_ranked_board(text,date,text,integer,bigint) to anon,authenticated,service_role;

-- Devices may hide an abusive publisher without exposing either device identifier.
create table if not exists public.countrivo_publisher_blocks (
  viewer_id uuid not null,
  publisher_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(viewer_id,publisher_id),
  check(viewer_id<>publisher_id)
);
alter table public.countrivo_publisher_blocks enable row level security;
revoke all on public.countrivo_publisher_blocks from anon,authenticated;
grant all on public.countrivo_publisher_blocks to service_role;

create or replace function public.countrivo_block_publisher(p_run_id bigint,p_viewer uuid)
returns void language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('block|'||p_viewer::text,0));
  select device_id into target from public.countrivo_runs where id=p_run_id and display_name is not null and mode='daily';
  if not found or target=p_viewer then raise exception 'name_missing'; end if;
  if (select count(*) from public.countrivo_publisher_blocks where viewer_id=p_viewer)>=200 then raise exception 'block_limit'; end if;
  insert into public.countrivo_publisher_blocks(viewer_id,publisher_id) values(p_viewer,target) on conflict do nothing;
end;
$$;
revoke all on function public.countrivo_block_publisher(bigint,uuid) from public,anon,authenticated;
grant execute on function public.countrivo_block_publisher(bigint,uuid) to service_role;

create or replace function public.countrivo_blocked_names(p_viewer uuid,p_slug text,p_day date,p_edition text)
returns table(run_id bigint) language sql stable security definer set search_path = public as $$
  select r.id from public.countrivo_runs r join public.countrivo_publisher_blocks b on b.publisher_id=r.device_id
  where b.viewer_id=p_viewer and r.game_slug=p_slug and r.date_key=p_day and r.edition=p_edition;
$$;
revoke all on function public.countrivo_blocked_names(uuid,text,date,text) from public,anon,authenticated;
grant execute on function public.countrivo_blocked_names(uuid,text,date,text) to service_role;

-- Owner-only publisher bans prevent a reported publisher from renaming around moderation.
create table if not exists public.countrivo_publisher_bans (
  device_id uuid primary key,
  created_at timestamptz not null default now()
);
alter table public.countrivo_publisher_bans enable row level security;
revoke all on public.countrivo_publisher_bans from anon,authenticated;
grant all on public.countrivo_publisher_bans to service_role;

create or replace function public.countrivo_ban_publisher(p_run_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  select device_id into target from public.countrivo_runs where id=p_run_id;
  if not found then raise exception 'name_missing'; end if;
  perform pg_advisory_xact_lock(hashtextextended('publisher|'||target::text,0));
  insert into public.countrivo_publisher_bans(device_id) values(target) on conflict do nothing;
  update public.countrivo_runs set moderation_hidden=true where device_id=target;
end;
$$;
revoke all on function public.countrivo_ban_publisher(bigint) from public,anon,authenticated;
grant execute on function public.countrivo_ban_publisher(bigint) to service_role;

create or replace function public.countrivo_publish_name(p_run_id bigint,p_device uuid,p_ip text,p_day date,p_edition text,p_name text,p_place text)
returns setof public.countrivo_runs language plpgsql security definer set search_path = public as $$
declare chosen public.countrivo_runs;
begin
  perform pg_advisory_xact_lock(hashtextextended('publisher|'||p_device::text,0));
  perform pg_advisory_xact_lock(hashtextextended(p_ip||p_day::text,0));
  if exists(select 1 from public.countrivo_publisher_bans where device_id=p_device) then raise exception 'publisher_banned'; end if;
  select * into chosen from public.countrivo_runs where id=p_run_id and device_id=p_device and mode='daily' and status='complete' for update;
  if not found or chosen.date_key<>p_day or chosen.edition<>p_edition then raise exception 'board_closed'; end if;
  if char_length(p_name)<2 or char_length(p_name)>20 then raise exception 'invalid_name'; end if;
  if (select count(*) from public.countrivo_name_events where device_id=p_device and created_at>now()-interval '1 hour')>=10 then raise exception 'name_throttled'; end if;
  if not exists(select 1 from public.countrivo_name_events where device_id=p_device and ip_hash=p_ip and date_key=p_day)
    and (select count(distinct device_id) from public.countrivo_name_events where ip_hash=p_ip and date_key=p_day)>=10 then raise exception 'network_throttled'; end if;
  insert into public.countrivo_name_events(device_id,ip_hash,date_key) values(p_device,p_ip,p_day);
  return query update public.countrivo_runs set display_name=p_name,place_country_code=p_place,published_at=now() where id=p_run_id and device_id=p_device returning *;
end;
$$;
revoke all on function public.countrivo_publish_name(bigint,uuid,text,date,text,text,text) from public,anon,authenticated;
grant execute on function public.countrivo_publish_name(bigint,uuid,text,date,text,text,text) to service_role;

create or replace function public.countrivo_forget_device(p_device_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.countrivo_publisher_blocks where viewer_id=p_device_id or publisher_id=p_device_id;
  delete from public.countrivo_name_events where device_id=p_device_id;
  delete from public.countrivo_name_reports where device_id=p_device_id or run_id in (select id from public.countrivo_runs where device_id=p_device_id);
  delete from public.countrivo_runs where device_id=p_device_id;
  -- A moderation ban remains so clearing public results cannot re-enable the same device.
end;
$$;
revoke all on function public.countrivo_forget_device(uuid) from public,anon,authenticated;
grant execute on function public.countrivo_forget_device(uuid) to service_role;

commit;
