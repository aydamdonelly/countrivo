'use server';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { gameDatabase, signValue } from '@/server/anonymous-identity';
import { requireAdminSession } from '@/server/admin-session';
import { getTodayDateKey } from '@/lib/daily-seed';
import { revalidateEdition } from '@/server/edition';
import { invalidateAnonymousLeaderboards } from '@/server/anonymous-runs';
export async function openAdmin(form:FormData):Promise<void>{
  const given=form.get('secret'),expected=process.env.COUNTRIVO_ADMIN_SECRET;
  if(typeof given!=='string'||!expected||expected.length<32)redirect('/admin?denied=1');
  const hash=(value:string)=>createHash('sha256').update(value).digest();
  if(!timingSafeEqual(hash(given),hash(expected)))redirect('/admin?denied=1');
  (await cookies()).set('cv_admin',signValue(`admin|${Date.now()+43200000}`),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/admin',maxAge:43200});
  redirect('/admin');
}
export async function closeAdmin():Promise<void>{(await cookies()).delete('cv_admin');redirect('/admin');}
export async function setNameVisibility(form:FormData):Promise<void>{
  await requireAdminSession();
  const id=Number(form.get('id')),hidden=form.get('hidden')==='1';
  if(!Number.isInteger(id)||id<1)return;
  const {error}=await gameDatabase().from('countrivo_runs').update({moderation_hidden:hidden}).eq('id',id);
  if(error)throw new Error('Could not update this name');
  invalidateAnonymousLeaderboards();
  revalidatePath('/admin');revalidatePath('/leaderboard');
}
export async function prepareTomorrowBoards():Promise<void>{
  await requireAdminSession();
  const next=new Date(`${getTodayDateKey()}T12:00:00Z`);next.setUTCDate(next.getUTCDate()+1);
  const day=next.toISOString().slice(0,10);
  const {error}=await gameDatabase().from('countrivo_config').upsert({key:`edition:${day}`,value:randomBytes(12).toString('hex')},{onConflict:'key'});
  if(error)throw new Error('Could not prepare tomorrow’s boards');
  revalidateEdition();revalidatePath('/admin');
}
/** Historical callers now receive a safe error instead of wiping live scores. */
export async function rerollDailyAction():Promise<{success:boolean;error:string}>{await requireAdminSession();return{success:false,error:'Use the admin page to prepare tomorrow’s boards.'};}
