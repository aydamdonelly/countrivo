'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readRunTicket } from '@/server/anonymous-identity';
import { commitDraftSession } from './draft-session';
import { commitGeoWordleSession } from './geography-session';
import { commitBlindSession } from './blind-session';
import { commitQuickSession } from './quick-session';
import { publishAnonymousRun } from './anonymous-games';
import { guessableCountries } from '@/lib/game-logic/geo-wordle/engine';
import type { PoolIdx, SeatIdx } from '@/lib/game-logic/country-draft/types';

function poolIndex(value: FormDataEntryValue|null):PoolIdx|null { return value==='0'?0:value==='1'?1:value==='2'?2:null; }
function seatIndex(value:FormDataEntryValue|null):SeatIdx|null { return value==='0'?0:value==='1'?1:value==='2'?2:value==='3'?3:value==='4'?4:null; }
export async function noScriptMove(token:string,revision:number,form:FormData):Promise<void> {
  const ticket=readRunTicket(token);
  if(!ticket)redirect('/');
  const kind=form.get('move');
  if(ticket.slug==='country-draft') {
    const c=poolIndex(form.get('country')),i=poolIndex(form.get('person')),s=seatIndex(form.get('seat'));
    if(kind==='open'&&c!==null)await commitDraftSession({sessionToken:token,revision,action:{t:'open',c}});
    else if(kind==='appoint'&&i!==null&&s!==null)await commitDraftSession({sessionToken:token,revision,action:{t:'appoint',i,s}});
    else if(kind==='next')await commitDraftSession({sessionToken:token,revision,action:{t:'next'}});
  } else if(ticket.slug==='geo-wordle') {
    const name=form.get('country');
    const country=typeof name==='string'?guessableCountries().find((c)=>c.iso3===name||c.displayName.toLowerCase()===name.trim().toLowerCase()):undefined;
    if(country)await commitGeoWordleSession({sessionToken:token,revision,action:{t:'guess',iso3:country.iso3}});
    else if(kind==='clue')await commitGeoWordleSession({sessionToken:token,revision,action:{t:'clue'}});
  } else if(ticket.slug==='blind-pick') {
    const slot=Number(form.get('slot'));
    if(kind==='seen')await commitBlindSession({sessionToken:token,revision,action:{t:'seen'}});
    else if(Number.isInteger(slot)&&slot>=0&&slot<6)await commitBlindSession({sessionToken:token,revision,action:{t:'place',s:slot}});
  } else if(ticket.slug==='higher-or-lower'||ticket.slug==='flag-quiz'||ticket.slug==='stat-guesser') {
    const choice=form.get('choice');
    if(kind==='next')await commitQuickSession({sessionToken:token,revision,action:{t:'next'}});
    else if(ticket.slug==='higher-or-lower'&&(choice==='higher'||choice==='lower'))await commitQuickSession({sessionToken:token,revision,action:{t:'guess',c:choice}});
    else if(ticket.slug==='flag-quiz'&&typeof choice==='string'&&/^[0-3]$/.test(choice))await commitQuickSession({sessionToken:token,revision,action:{t:'answer',i:Number(choice)}});
    else if(ticket.slug==='stat-guesser') {
      const value=Number(form.get('index'));
      if(Number.isInteger(value)&&value>=0&&value<=10000)await commitQuickSession({sessionToken:token,revision,action:{t:'lock',i:value}});
    }
  }
  if(ticket.mode==='practice') {
    (await cookies()).set(`cv_nojs_${ticket.slug}`,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:3600});
  }
  redirect(`/games/${ticket.slug}/play?mode=${ticket.mode}${ticket.mode==='practice'?'&resume=1':''}`);
}

export async function noScriptPublish(runId:number,slug:string,form:FormData):Promise<void> {
  const name=form.get('name');
  if(typeof name==='string')await publishAnonymousRun(runId,name);
  redirect(`/games/${slug}/play`);
}
