import 'server-only';
import { cookies } from 'next/headers';
import { verifyValue } from './anonymous-identity';
export async function hasAdminSession():Promise<boolean>{
  const token=(await cookies()).get('cv_admin')?.value;
  if(!token)return false;
  const signed=verifyValue(token);
  return Boolean(signed && signed.startsWith('admin|') && Number(signed.slice(6))>Date.now());
}
export async function requireAdminSession():Promise<void>{if(!await hasAdminSession())throw new Error('Admin access required');}
