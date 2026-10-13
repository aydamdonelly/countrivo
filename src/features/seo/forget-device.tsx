'use client';
import { useState } from 'react';
import { forgetThisDevice } from '@/app/actions/anonymous-games';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
export function ForgetDevice(){
  const [confirm,setConfirm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const router=useRouter();
  async function forget(){
    setBusy(true);setError('');
    try {
      await forgetThisDevice();
      for(const key of Object.keys(localStorage)) if(key.startsWith('countrivo_') || key.startsWith('cv_'))localStorage.removeItem(key);
      router.replace('/');router.refresh();
    }catch{setError('Could not forget this device. Try again.');setBusy(false);}
  }
  return <div className="mt-6">{confirm?<><p className="t-body mb-4">Remove this device&apos;s saved runs, public names and streak?</p><div className="flex gap-4"><Button onClick={()=>void forget()} disabled={busy}>Forget this device</Button><Button variant="quiet" onClick={()=>setConfirm(false)} disabled={busy}>Cancel</Button></div>{error?<p role="alert" className="t-body text-ember mt-3">{error}</p>:null}</>:<Button variant="text" onClick={()=>setConfirm(true)}>Forget this device</Button>}</div>;
}
