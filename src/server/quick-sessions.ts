import "server-only";

import { createHmac } from "node:crypto";
import { gameModule as higher, pairInView, cardValue, callLog, comparisonLine, sourceLine, statLine as higherStat, unitLine, type HoLAction, type HoLState } from "@/games/higher-or-lower/module";
import { gameModule as flags, currentQuestion, type QuizAction, type QuizState } from "@/games/flag-quiz/module";
import { gameModule as stats, type GuesserAction } from "@/games/stat-guesser/module";
import { isGuessStat, retargetStatForPractice, retargetStatPractice, rulerFor, type StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { createPracticeOnStat } from "@/lib/game-logic/higher-or-lower/engine";
import { isHoLStat } from "@/lib/game-logic/higher-or-lower/stats";
import { mulberry32 } from "@/lib/seeded-random";
import { dailyBoardSeed } from "./anonymous-identity";
import { frozenBoardState } from "./board-snapshots";
import { contextLine, gapText, statLine as guessStat, valueText } from "@/games/stat-guesser/format";
import type { Action, Codec, GameModule } from "@/games/types";
import type { QuickAction, QuickView, HigherQuickView, FlagQuickView, StatQuickView } from "@/games/quick-views";
import type { Mode } from "@/ui/types";

function quickAction(value: unknown): QuickAction {
  if (!value || typeof value !== "object" || !("t" in value)) throw new Error("Invalid move");
  if (value.t === "next") return { t: "next" };
  if (value.t === "guess" && "c" in value && (value.c === "higher" || value.c === "lower")) return { t: "guess", c: value.c };
  if ((value.t === "answer" || value.t === "lock") && "i" in value && typeof value.i === "number" && Number.isInteger(value.i) && value.i >= 0 && value.i <= 10000)
    return value.t === "answer" ? {t:"answer",i:value.i} : {t:"lock",i:value.i};
  throw new Error("Invalid move");
}

const codec: Codec<QuickAction> = {
  enc: (actions) => JSON.stringify(actions),
  dec(raw) { if (!raw) return []; const values: unknown = JSON.parse(raw); if (!Array.isArray(values) || values.length > 300) throw new Error("Invalid move log"); return values.map(quickAction); },
};

function remoteModule<S, A extends Action>(module: GameModule<S,A>, convert:(a:QuickAction)=>A|null):GameModule<S,QuickAction> {
  return {slug:module.slug,create:module.create,reduce:(s,a)=>{const move=convert(a);return move?module.reduce(s,move):s;},codec,
    done:module.done,progress:module.progress,verdict:()=>null,payload:module.payload,scoreLabel:module.scoreLabel,share:module.share,
    keepBoardOnResult:false,submits:true};
}

export const higherRemote = remoteModule(higher,(a):HoLAction|null=>a.t==='guess'?a:a.t==='next'?{t:'advance',ui:true}:null);
const flagBase = remoteModule(flags,(a):QuizAction|null=>a.t==='answer'?a:a.t==='next'?{t:'advance',ui:true}:null);
export const flagRemote = { ...flagBase, create(seed:number,mode:Mode,dateKey:string) {
  const rotationDate = new Date(Date.UTC(2000,0,1)+(seed%20000)*86400000).toISOString().slice(0,10);
  return flags.create(seed,mode,mode==='daily'?rotationDate:dateKey);
} };
export const statRemote = remoteModule(stats,(a):GuesserAction|null=>a.t==='lock'||a.t==='next'?a:null);

export async function statSessionModule(mode:Mode,dateKey:string,edition:string,country?:string,stat?:string) {
  if(mode==='daily'||(!country&&!stat))return statRemote;
  const daily=await frozenBoardState<StatGuesserState>('stat-guesser',dateKey,edition)??stats.create(dailyBoardSeed('stat-guesser',dateKey,edition),'daily',dateKey);
  return {...statRemote,create(seed:number){
    let state=stats.create(seed,'practice',dateKey);
    if(stat&&isGuessStat(stat))state=retargetStatForPractice(state,stat,daily.rounds.filter(r=>r.stat===stat).map(r=>r.country.iso3));
    if(country)state=retargetStatPractice(state,country,daily.rounds.filter(r=>r.country.iso3===country).map(r=>r.stat));
    return state;
  }};
}

export async function higherSessionModule(mode:Mode,dateKey:string,edition:string,stat?:string) {
  if(mode==='daily'||!stat||!isHoLStat(stat))return higherRemote;
  const daily=await frozenBoardState<HoLState>('higher-or-lower',dateKey,edition)??higher.create(dailyBoardSeed('higher-or-lower',dateKey,edition),'daily',dateKey);
  if(daily.g.stat===stat)return higherRemote;
  return {...higherRemote,create(seed:number){return {g:createPracticeOnStat(mulberry32(seed),stat),rev:false,fresh:false};}};
}

function common<S,A extends Action>(module:GameModule<S,A>,state:S,mode:Mode,dateKey:string,title:string) {
  const finished=module.done(state);
  return {mode,score:module.scoreLabel(state),progress:module.progress(state),shareText:finished?module.share?.(state,{mode,dateKey,title,rank:null})??'':'',history:[],phase:finished?'finished':'playing'};
}

export function opaqueFlagSrc(iso2:string):string {
  const secret=process.env.COUNTRIVO_GAME_SECRET;
  if(!secret)throw new Error('Flag assets are not configured');
  return `/quiz-flags/${createHmac('sha256',secret).update(`flag|${iso2.toLowerCase()}`).digest('hex').slice(0,40)}.svg`;
}

export function higherView(state:HoLState,mode:Mode,dateKey:string,preview=true):HigherQuickView {
  const pair=pairInView(state),revealed=state.rev,base=common(higher,state,mode,dateKey,'Higher or Lower');
  const chosen=revealed?state.g.calls[pair.index]??null:null;
  const view:HigherQuickView={...base,kind:'higher-or-lower',phase:higher.done(state)?'finished':revealed?'reveal':'playing',round:pair.index,total:mode==='daily'?10:120,
    left:{name:pair.left.name,iso2:pair.left.iso2,value:cardValue(state.g.stat,pair.left.value)},right:{name:pair.right.name,iso2:pair.right.iso2,value:revealed?cardValue(state.g.stat,pair.right.value):null},
    stat:higherStat(state.g),unit:unitLine(state.g),chosen,correct:revealed?chosen===pair.answer:null,comparison:revealed?comparisonLine(state.g,pair.index):null,
    source:sourceLine(state.g),doubled:mode==='daily'&&pair.index>=7,history:callLog(state.g).map(r=>({label:`${r.left.name} · ${r.right.name}`,guess:r.call,answer:cardValue(state.g.stat,r.right.value),points:r.points,correct:r.ok}))};
  if(preview&&view.phase==='reveal') {
    const next=higherView(higherRemote.reduce(state,{t:'next'}),mode,dateKey,false);
    if(next.phase==='playing')view.nextView=next;
  }
  return view;
}

export function flagView(state:QuizState,mode:Mode,dateKey:string,preview=true):FlagQuickView {
  const q=currentQuestion(state)??state.g.questions[state.g.questions.length-1];
  const revealed=state.pending!==null,finished=flags.done(state);
  const view:FlagQuickView={...common(flags,state,mode,dateKey,'Flag Quiz'),kind:'flag-quiz',phase:finished?'finished':revealed?'reveal':'playing',round:Math.min(state.g.currentQuestion,9),total:10,
    flagSrc:opaqueFlagSrc(q.country.iso2),options:q.options.map(c=>c.displayName),picked:state.pending,correctIndex:revealed?q.correctIndex:null,
    fact:revealed?q.family?.line??null:null,source:revealed?q.family?.source??null:null,doubled:state.g.currentQuestion>=7,
    history:state.g.questions.flatMap((question,i)=>{const picked=state.g.answers[i];if(picked===null)return[];return[{label:`Flag ${i+1}`,guess:question.options[picked]?.displayName??'',answer:question.country.displayName,points:picked===question.correctIndex?question.points:0,correct:picked===question.correctIndex}];})};
  if(preview&&view.phase==='reveal') {
    const next=flagView(flagRemote.reduce(state,{t:'next'}),mode,dateKey,false);
    if(next.phase==='playing')view.nextView=next;
  }
  return view;
}

export function statView(state:StatGuesserState,mode:Mode,dateKey:string,preview=true):StatQuickView {
  const round=state.rounds[state.currentRound],revealed=state.phase!=='playing',ruler=rulerFor(round.stat),guess=state.guesses[state.currentRound];
  const view:StatQuickView={...common(stats,state,mode,dateKey,'Stat Guesser'),kind:'stat-guesser',phase:state.phase==='results'?'finished':revealed?'reveal':'playing',round:state.currentRound,total:5,
    country:{name:round.country.name,iso2:round.country.iso2},stat:guessStat(round.stat),unit:round.stat.includes('percent')?'percent':'',ruler,
    refs:round.refs.map(c=>({name:c.name,iso2:c.iso2,value:c.value})),actualValue:revealed?round.actualValue:null,guessValue:revealed?guess??null:null,
    points:revealed?state.points[state.currentRound]??null:null,context:revealed?contextLine(round.context.map(c=>c.name)):null,
    gap:revealed&&guess!==null?gapText(round.stat,guess,round.actualValue):null,doubled:state.currentRound===4,
    history:state.rounds.flatMap((r,i)=>{const g=state.guesses[i];if(g===null)return[];return[{label:`${r.country.name} · ${guessStat(r.stat)}`,guess:valueText(r.stat,g),answer:valueText(r.stat,r.actualValue),points:(state.points[i]??0)*(i===4?2:1),correct:(state.points[i]??0)>=80}];})};
  if(preview&&view.phase==='reveal') {
    const next=statView(statRemote.reduce(state,{t:'next'}),mode,dateKey,false);
    if(next.phase==='playing')view.nextView=next;
  }
  return view;
}

export function quickProject<S>(project:(s:S,m:Mode,d:string)=>QuickView,mode:Mode,dateKey:string) {return (state:S)=>project(state,mode,dateKey);}
