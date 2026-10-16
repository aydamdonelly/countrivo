import type { Metadata } from 'next';
import { hasAdminSession } from '@/server/admin-session';
import { gameDatabase } from '@/server/anonymous-identity';
import { openAdmin, closeAdmin, setNameVisibility, prepareTomorrowBoards, banNamePublisher, unbanNamePublisher } from '@/app/actions/admin';
import { getTodayDateKey } from '@/lib/daily-seed';
import { Clay } from '@/ui/clay';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Countrivo administration',robots:{index:false,follow:false}};
interface NamedRun{device_id:string;date_key:string;id:number;display_name:string;game_slug:string;score_display:string;moderation_hidden:boolean;}
interface Report{run_id:number;reason:string;}
export default async function Admin({searchParams}:{searchParams:Promise<{denied?:string}>}){
  if(!await hasAdminSession()){const params=await searchParams;return <div className="system-page"><Clay object="cl-27" /><h1 className="t-h1">Countrivo administration</h1><p className="t-body mt-4">Owner access for board settings and reported names.</p><form action={openAdmin} className="admin-form"><label>Admin secret<input type="password" name="secret" required autoComplete="current-password" /></label><button className="btn btn-ink t-cta">Open administration</button>{params.denied?<p className="t-body text-ember" role="alert">That secret was not accepted.</p>:null}</form></div>;}
  const today=getTodayDateKey();
  const db=gameDatabase();
  const [runs,reports,queue,bans]=await Promise.all([db.from('countrivo_runs').select('id,device_id,date_key,display_name,game_slug,score_display,moderation_hidden').not('display_name','is',null).order('completed_at',{ascending:false}).limit(100).returns<NamedRun[]>(),db.from('countrivo_name_reports').select('run_id,reason').order('created_at',{ascending:false}).limit(100).returns<Report[]>(),db.from('countrivo_config').select('key,value').like('key','edition:%').order('key',{ascending:false}).limit(7),db.from('countrivo_publisher_bans').select('device_id').returns<{device_id:string}[]>()]);
  if(reports.error)throw new Error('Could not open name reports. Try again.');
  const reportIds=[...new Set((reports.data??[]).map(report=>report.run_id))];
  const recentIds=new Set((runs.data??[]).map(run=>run.id));
  const olderIds=reportIds.filter(id=>!recentIds.has(id));
  const reported=olderIds.length?await db.from('countrivo_runs')
    .select('id,device_id,date_key,display_name,game_slug,score_display,moderation_hidden')
    .in('id',olderIds).not('display_name','is',null).returns<NamedRun[]>():null;
  if(reported?.error)throw new Error('Could not open reported names. Try again.');
  const byId=new Map([...(runs.data??[]),...(reported?.data??[])].map(run=>[run.id,run]));
  const moderationRuns=[...reportIds.flatMap(id=>{const run=byId.get(id);return run?[run]:[];}),
    ...(runs.data??[]).filter(run=>!reportIds.includes(run.id))];
  const blocked=new Set(bans.data?.map(row=>row.device_id)??[]);
  return <div className="system-page"><h1 className="t-h1">Today behind the scenes</h1><p className="t-meta text-mute mt-4">{today}, Europe/Berlin</p><section><h2 className="t-h2">Tomorrow’s boards</h2><p className="t-body">Prepare a fresh shared seed for all six games tomorrow. Current boards and their scores stay together.</p><form action={prepareTomorrowBoards} className="mt-4"><button className="btn btn-ink t-cta">Prepare tomorrow’s boards</button></form>{queue.data?.map((row)=><p className="t-meta text-mute mt-3" key={row.key}>Prepared: {row.key.replace('edition:','')}</p>)}</section><section><h2 className="t-h2">Names and reports</h2><p className="t-meta text-mute">Names from the latest 100 reports first, followed by the latest 100 names. Archived boards are included. Blocking a publisher hides all their names and prevents new publication from that browser.</p>{!moderationRuns.length?<p className="t-body text-mute">No published names yet.</p>:moderationRuns.map((run)=><div className="admin-row" key={run.id}><div><b>{run.display_name}</b><p className="t-meta text-mute">{run.date_key}, {run.game_slug}, {run.score_display}</p>{reports.data?.filter((report)=>report.run_id===run.id).map((report,i)=><p className="t-meta text-ember" key={i}>{report.reason}</p>)}</div>{blocked.has(run.device_id)?<div><p className="t-meta text-ember">Publisher blocked</p><form action={unbanNamePublisher}><input type="hidden" name="id" value={run.id} /><button className="btn btn-quiet">Unblock publisher</button></form></div>:<><form action={setNameVisibility}><input type="hidden" name="id" value={run.id} /><input type="hidden" name="hidden" value={run.moderation_hidden?'0':'1'} /><button className="btn btn-quiet">{run.moderation_hidden?'Unhide':'Hide name'}</button></form><form action={banNamePublisher}><input type="hidden" name="id" value={run.id} /><button className="btn btn-quiet">Block publisher</button></form></>}</div>)}</section><form action={closeAdmin} className="mt-8"><button className="table-link">Close administration</button></form></div>;
}
