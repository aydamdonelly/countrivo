alter table public.countrivo_name_reports add column if not exists ip_hash text;
create table if not exists public.countrivo_name_events (
  id bigint generated always as identity primary key,
  device_id uuid not null,
  ip_hash text not null,
  date_key date not null,
  created_at timestamptz not null default now()
);
alter table public.countrivo_name_events enable row level security;
revoke all on public.countrivo_name_events from anon, authenticated;
grant all on public.countrivo_name_events to service_role;
grant usage, select on sequence public.countrivo_name_events_id_seq to service_role;

create or replace function public.countrivo_publish_name(p_run_id bigint,p_device uuid,p_ip text,p_day date,p_edition text,p_name text,p_place text)
returns setof public.countrivo_runs language plpgsql security definer set search_path = public as $$
declare chosen public.countrivo_runs;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_ip || p_day::text,0));
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

create or replace function public.countrivo_report_name(p_run_id bigint,p_device uuid,p_ip text,p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('report|' || p_ip,0));
  if (select count(*) from public.countrivo_name_reports where ip_hash=p_ip and created_at>now()-interval '1 day')>=20 then raise exception 'report_throttled'; end if;
  if not exists(select 1 from public.countrivo_runs where id=p_run_id and display_name is not null) then raise exception 'name_missing'; end if;
  insert into public.countrivo_name_reports(run_id,device_id,ip_hash,reason) values(p_run_id,p_device,p_ip,p_reason) on conflict(run_id,device_id) do nothing;
  if (select count(distinct ip_hash) from public.countrivo_name_reports where run_id=p_run_id)>=3 then
    update public.countrivo_runs set moderation_hidden=true where id=p_run_id;
  end if;
end;
$$;
revoke all on function public.countrivo_report_name(bigint,uuid,text,text) from public,anon,authenticated;
grant execute on function public.countrivo_report_name(bigint,uuid,text,text) to service_role;

create or replace function public.countrivo_forget_device(p_device_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.countrivo_name_events where device_id=p_device_id;
  delete from public.countrivo_name_reports where device_id=p_device_id or run_id in (select id from public.countrivo_runs where device_id=p_device_id);
  delete from public.countrivo_runs where device_id=p_device_id;
end;
$$;
revoke all on function public.countrivo_forget_device(uuid) from public,anon,authenticated;
grant execute on function public.countrivo_forget_device(uuid) to service_role;
