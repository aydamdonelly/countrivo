import {capitalsAccepted,countries,sovereignIso3} from '@/lib/data/loader';
import {seededShuffle} from '@/lib/seeded-random';

export function capitalIsAccepted(accepted:readonly string[],choice:string):boolean {
  const normalize=(city:string)=>city.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
  return accepted.some(city=>normalize(city)===normalize(choice));
}

/** Every accepted city shown in a multi-capital question stays correct. */
export function capitalBonusChoices(accepted:readonly string[],rng:()=>number):string[] {
  if(!accepted.length)return [];
  const correct=[...new Set(accepted)].slice(0,3);
  const distractors=[...new Set(countries.filter(country=>sovereignIso3.includes(country.iso3)&&(capitalsAccepted[country.iso3]?.length??0)>0)
    .map(country=>country.capital).filter(city=>city&&!accepted.includes(city)))];
  return seededShuffle([...correct,...seededShuffle(distractors,rng).slice(0,4-correct.length)],rng);
}
