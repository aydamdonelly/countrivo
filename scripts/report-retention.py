#!/usr/bin/env python3
"""Read-only, aggregate device retention from real anonymous daily runs.

No player identifiers leave Postgres. Bots live in a different table. Exact-day
D1/D7 cohorts only mature after the whole return day has ended in Berlin.
"""
import argparse
from datetime import date
import json
from pathlib import Path
import re
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--project-ref', required=True)
parser.add_argument('--since', type=date.fromisoformat, default=date(2026, 10, 13))
parser.add_argument('--output', type=Path)
args = parser.parse_args()
if not re.fullmatch(r'[a-z]{20}', args.project_ref):
    parser.error('Use the exact Supabase project reference.')

sql = f"""
with days as (
 select distinct device_id, date_key::date as day
 from public.countrivo_runs where mode='daily' and status='complete' and not archived
), firsts as (
 select device_id, min(day) as first_day from days group by device_id
), cohorts as (
 select first_day, count(*) as first_completed_devices,
 count(*) filter (where first_day+1 < (now() at time zone 'Europe/Berlin')::date) as d1_eligible,
 count(*) filter (where first_day+1 < (now() at time zone 'Europe/Berlin')::date and exists
   (select 1 from days d where d.device_id=f.device_id and d.day=f.first_day+1)) as d1_returned,
 count(*) filter (where first_day+7 < (now() at time zone 'Europe/Berlin')::date) as d7_eligible,
 count(*) filter (where first_day+7 < (now() at time zone 'Europe/Berlin')::date and exists
   (select 1 from days d where d.device_id=f.device_id and d.day=f.first_day+7)) as d7_returned
 from firsts f where first_day >= '{args.since.isoformat()}' group by first_day
), daily as (
 select date_key, count(*) as started_sessions,
 count(*) filter(where status='complete') as completed_sessions,
 count(distinct device_id) as playing_devices,
 count(distinct device_id) filter(where status='complete') as completed_devices
 from public.countrivo_runs where mode='daily' and not archived and date_key >= '{args.since.isoformat()}'
 group by date_key
)
select json_build_object('cohorts',(select coalesce(json_agg(cohorts order by first_day),'[]'::json) from cohorts),
'daily',(select coalesce(json_agg(daily order by date_key),'[]'::json) from daily)) as report;
"""
result = subprocess.run(['supabase', 'db', 'query', '--linked', '--project-ref', args.project_ref,
                         '--output', 'json', sql], capture_output=True, text=True, check=False)
if result.returncode:
    raise SystemExit('Retention query failed. Check Supabase CLI access and the project reference.')
try:
    output = result.stdout
    payload = json.loads(output[output.index('{'):])
    report = payload['rows'][0]['report']
except (ValueError, KeyError, IndexError):
    raise SystemExit('Supabase returned an unexpected report shape.')
for row in report['cohorts']:
    for day in (1, 7):
        eligible = row[f'd{day}_eligible']
        row[f'd{day}_percent'] = round(100 * row[f'd{day}_returned'] / eligible, 1) if eligible else None
report['measurement'] = 'Completed daily games on the same browser device, not identified people. Clearing cookies resets identity. Owner/testing devices may be included. Incomplete return days are excluded; null means not mature.'
text = json.dumps(report, indent=2)
if args.output:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text + '\n')
print(text)
