import {useState} from 'react';
import Link from 'next/link';
import {countries} from '@/lib/data/public';
import {mulberry32,seededShuffle} from '@/lib/seeded-random';
import {capitalBonusChoices,capitalIsAccepted} from '@/lib/game-logic/geo-wordle/bonus';
import type {GeoWordleState,GeoWordleView,GeoAnswer} from '@/lib/game-logic/geo-wordle/engine';
import type {ResultProps} from '@/games/types';
import {Button} from '@/ui/button';
import {Flag} from '@/ui/flag';
import {CheckIcon} from '@/ui/icons/check';
import {CrossIcon} from '@/ui/icons/cross';
interface Choice {iso3:string;name:string;iso2:string;correct:boolean}
function bonusChoices(answer:GeoAnswer):Choice[]{
 const seed=answer.iso3.split('').reduce((n,c)=>n*31+c.charCodeAt(0),7);
 const pool=seededShuffle(countries.filter(c=>c.iso3!==answer.iso3),mulberry32(seed));
 const correct=answer.borders.length?pool.filter(c=>answer.borders.includes(c.iso3)).slice(0,6):pool.filter(c=>c.iso3===answer.nearestCountry);
 const distractors=pool.filter(c=>!answer.borders.includes(c.iso3)&&c.iso3!==answer.nearestCountry).slice(0,Math.max(0,(answer.borders.length?6:4)-correct.length));
 return seededShuffle([...correct.map(c=>({iso3:c.iso3,name:c.displayName,iso2:c.iso2,correct:true})),...distractors.map(c=>({iso3:c.iso3,name:c.displayName,iso2:c.iso2,correct:false}))],mulberry32(seed+1));
}
export function GeoBonus({state}:{state:GeoWordleView}){
 const [stage,setStage]=useState<'offer'|'neighbours'|'capital'|'fact'>('offer'),[picks,setPicks]=useState<string[]>([]),[checked,setChecked]=useState(false),[capital,setCapital]=useState<string|null>(null);
 const answer=state.answer;if(!answer)return null;
 const choices=bonusChoices(answer),many=answer.borders.length>6;
 const required=many?3:choices.filter(c=>c.correct).length,hits=choices.filter(c=>c.correct&&picks.includes(c.iso3)).length,wrong=picks.length-hits,allRight=hits>=required&&wrong===0;
 const capitalChoices=capitalBonusChoices(answer.capitalsAccepted,mulberry32(answer.iso3.charCodeAt(0)*17)),hasCapital=capitalChoices.length>0;
 return <div className="gw-bonus">{stage==='offer'?<div className="flex gap-3"><Button variant="ink" onClick={()=>setStage('neighbours')} aria-label="Bonus quiz, just for fun. Your score stays the same.">Bonus quiz</Button><Button variant="text" onClick={()=>setStage('fact')}>One fact</Button></div>:stage==='neighbours'?<><p className="t-meta text-mute">Bonus 1 of {hasCapital?2:1}</p><h3 className="t-h3">{answer.borders.length?`Tap ${many?'any three neighbours of':'every country bordering'} ${answer.name}.`:`Which country’s centre is nearest to ${answer.name}?`}</h3><div className="gw-bonus-tiles">{choices.map(c=><button key={c.iso3} type="button" className={`gw-bonus-tile${picks.includes(c.iso3)?' selected':''}${checked&&picks.includes(c.iso3)&&!c.correct?' wrong':''}${checked&&c.correct&&!picks.includes(c.iso3)?' missed':''}`} aria-pressed={picks.includes(c.iso3)} aria-label={checked?`${c.name}: ${c.correct?'correct':'not a match'}`:undefined} disabled={checked} onClick={()=>setPicks(p=>p.includes(c.iso3)?p.filter(x=>x!==c.iso3):answer.borders.length?[...p,c.iso3]:[c.iso3])}><Flag iso2={c.iso2} size="xs" alt=""/><span>{c.name}</span>{checked&&c.correct?<CheckIcon size={18}/>:checked&&picks.includes(c.iso3)?<CrossIcon size={18}/>:null}</button>)}</div>{checked?<><p className="t-body" role="status">{allRight?'All found. ':`${Math.min(hits,required)} of ${required} found. `}{answer.borders.length?`${answer.name} borders ${answer.borders.length} ${answer.borders.length===1?'country':'countries'}.`:`${countries.find(c=>c.iso3===answer.nearestCountry)?.displayName??'This country'} is nearest by centre distance.`}</p><Button variant="ink" onClick={()=>setStage(hasCapital?'capital':'fact')}>{hasCapital?'Next':'One fact'}</Button></>:<Button variant="ink" onClick={()=>setChecked(true)} disabled={!picks.length}>Check</Button>}</>:stage==='capital'?<><p className="t-meta text-mute">Bonus 2 of 2</p><div className="gw-bonus-country"><Flag iso2={answer.iso2} size="s" alt=""/><span className="t-body">{answer.name}</span></div><h3 className="t-h3">{answer.capitalQuestion}</h3><div className="gw-bonus-tiles">{capitalChoices.map(c=><button type="button" key={c} disabled={capital!==null} className={`gw-bonus-tile${capital===c?' selected':''}${capital===c&&!capitalIsAccepted(answer.capitalsAccepted,c)?' wrong':''}${capital!==null&&capitalIsAccepted(answer.capitalsAccepted,c)?' missed':''}`} onClick={()=>setCapital(c)}>{c}</button>)}</div>{capital!==null?<><p className="t-body" role="status">{capitalIsAccepted(answer.capitalsAccepted,capital)?'Correct. ':'Not quite. '}{answer.capitalExplanation}</p><Button variant="ink" onClick={()=>setStage('fact')}>One fact</Button></>:null}</>:<><h3 className="t-h3">Did you know?</h3><p className="t-body">{answer.name} is in {answer.region==='Americas'?'the Americas':answer.region}.{hasCapital?` ${answer.capitalExplanation}`:''}</p><a className="t-meta text-mute" href={answer.capitalSourceUrl} target="_blank" rel="noreferrer">Source: {answer.capitalSourceLabel}</a><Link className="t-body" href={`/countries/${answer.slug}`}>More about {answer.name}</Link></>}</div>;
}
export function Result({state}:ResultProps<GeoWordleState>){return <div className="rhead"><b className="t-h3">{state.phase==='won'?'Found it':'Not found'}</b><span className="t-meta">Par 4</span></div>;}
