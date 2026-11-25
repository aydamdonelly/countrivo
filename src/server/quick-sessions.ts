import "server-only";

import { createHmac } from "node:crypto";
import { gameModule as higher, pairInView, cardValue, callLog, questionLine, recapLine, verdictLine, sourceLine, statLine as higherStat, unitLine, type HoLAction, type HoLState } from "@/games/higher-or-lower/module";
import { legacyGameModule as flags, currentQuestion, type QuizAction, type QuizState } from "@/games/flag-quiz/legacy-module";
import { gameModule as sprint } from "@/games/flag-quiz/module";
import { PENALTY_SECONDS, SPRINT_LENGTH, SPRINT_SECONDS, SPRINT_TARGET, createSprint, currentFlag, deadlineOf, flagLeftOnScreen, isSprintState, sprintHits, sprintName, type SprintMove, type SprintState } from "@/lib/game-logic/flag-quiz/sprint";
import { countryOf } from "@/lib/game-logic/flag-quiz/engine";
import { gameModule as stats, type GuesserAction } from "@/games/stat-guesser/module";
import { isGuessStat, retargetStatForPractice, retargetStatPractice, rulerFor, type StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";
import { createPracticeOnStat } from "@/lib/game-logic/higher-or-lower/engine";
import { isHoLStat } from "@/lib/game-logic/higher-or-lower/stats";
import { createEuropeFlagQuiz } from '@/lib/game-logic/flag-quiz/engine';
import { commitGameSession, prepareGameSession, type SessionSeed, type SessionResponse } from "./game-sessions";
import type { AnonymousRunRow } from "./anonymous-runs";
import type { RunTicket } from "./anonymous-identity";
import { mulberry32 } from "@/lib/seeded-random";
import { dailyBoardSeed } from "./anonymous-identity";
import { frozenBoardState } from "./board-snapshots";
import { contextLine, gapText, statLine as guessStat, valueText } from "@/games/stat-guesser/format";
import type { Action, Codec, GameModule } from "@/games/types";
import type { QuickAction, QuickView, HigherQuickView, FlagQuickView, FlagSprintView, StatQuickView } from "@/games/quick-views";
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

export async function flagSessionModule(mode:Mode,dateKey:string,edition:string,region?:string) {
  if(mode==='daily'||region!=='europe')return flagRemote;
  const excluded=[...await dailyFlagAnswers(dateKey,edition)];
  return {...flagRemote,create(seed:number):QuizState{return {g:createEuropeFlagQuiz(mulberry32(seed),excluded),pending:null};}};
}

/** Which rules a Flag Quiz board runs under: the sprint, or the ten-flag quiz a board was frozen with. */
export type FlagFormat = "sprint" | "quiz";

/**
 * Daily and archived boards keep the rules of their frozen snapshot, so a day that opened
 * under the ten-flag quiz finishes under it; every new day is a sprint. Practice is a sprint,
 * except the Europe flags practice, which stays a ten-flag quiz.
 */
export async function flagFormat(mode:Mode,dateKey:string,edition:string,region?:string,archived?:boolean):Promise<FlagFormat> {
  if(mode==='practice'&&!archived)return region==='europe'?'quiz':'sprint';
  const frozen=await frozenBoardState<unknown>('flag-quiz',dateKey,edition);
  return frozen&&!isSprintState(frozen)?'quiz':'sprint';
}

/** The answers of a frozen ten-flag board, read defensively from its stored JSON. */
function quizAnswers(value:unknown):string[] {
  if(!value||typeof value!=='object'||!('g' in value)||!value.g||typeof value.g!=='object'||!('questions' in value.g)||!Array.isArray(value.g.questions))return [];
  return value.g.questions.flatMap((q:unknown)=>q&&typeof q==='object'&&'country' in q&&q.country&&typeof q.country==='object'&&'iso3' in q.country&&typeof q.country.iso3==='string'?[q.country.iso3]:[]);
}

/** Today's daily flags, whichever rules the day runs under, so practice can leave them out. */
async function dailyFlagAnswers(dateKey:string,edition:string):Promise<Set<string>> {
  const frozen=await frozenBoardState<unknown>('flag-quiz',dateKey,edition);
  if(isSprintState(frozen))return new Set(frozen.flags.map(flag=>flag.iso3));
  if(frozen)return new Set(quizAnswers(frozen));
  return new Set(sprint.create(dailyBoardSeed('flag-quiz',dateKey,edition),'daily',dateKey).flags.map(flag=>flag.iso3));
}

export async function sprintSessionModule(mode:Mode,dateKey:string,edition:string,archived?:boolean):Promise<GameModule<SprintState,SprintMove>> {
  if(mode==='daily'||archived)return sprint;
  const exclude=await dailyFlagAnswers(dateKey,edition);
  return {...sprint,create(seed:number){return createSprint(mulberry32(seed),exclude);}};
}

/** The sprint's only client moves; the server stamps each with its receipt time. Anything else is refused. */
export function sprintMove(action:QuickAction,at:number):SprintMove {
  if(action.t==='start')return {t:'start',at};
  if(action.t==='finish')return {t:'finish',at};
  if(action.t==='answer'&&typeof action.i==='number'&&Number.isInteger(action.i)&&action.i>=0&&action.i<4)return {t:'answer',i:action.i,at};
  throw new Error('Invalid move');
}

export async function prepareFlagSession(input:SessionSeed,knownRun?:AnonymousRunRow|null|Promise<AnonymousRunRow|null>):Promise<SessionResponse<QuickView>> {
  const format=await flagFormat(input.mode,input.dateKey,input.edition,input.practiceRegion,input.archived);
  if(format==='sprint')return prepareGameSession(await sprintSessionModule(input.mode,input.dateKey,input.edition,input.archived),quickProject(sprintView,input.mode,input.dateKey),input,knownRun);
  return prepareGameSession(await flagSessionModule(input.mode,input.dateKey,input.edition,input.practiceRegion),quickProject(flagView,input.mode,input.dateKey),input,knownRun);
}

/** `at` is the server receipt time, taken before anything else in the action. */
export async function commitFlagSession(ticket:RunTicket,input:{sessionToken:string;revision:number;action:QuickAction},at:number):Promise<SessionResponse<QuickView>> {
  const format=await flagFormat(ticket.mode,ticket.dateKey,ticket.edition,ticket.practiceRegion,ticket.archived);
  if(format==='sprint')return commitGameSession(await sprintSessionModule(ticket.mode,ticket.dateKey,ticket.edition,ticket.archived),quickProject(sprintView,ticket.mode,ticket.dateKey),
    {sessionToken:input.sessionToken,revision:input.revision,action:sprintMove(input.action,at)});
  return commitGameSession(await flagSessionModule(ticket.mode,ticket.dateKey,ticket.edition,ticket.practiceRegion),quickProject(flagView,ticket.mode,ticket.dateKey),input);
}

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
    stat:higherStat(state.g),unit:unitLine(state.g),chosen,correct:revealed?chosen===pair.answer:null,comparison:revealed?verdictLine(state.g,pair.index):null,question:questionLine(state.g,pair.index),
    source:sourceLine(state.g),doubled:mode==='daily'&&pair.index>=7,history:callLog(state.g).map(r=>({label:`${r.right.name} vs ${r.left.name}`,guess:r.call,answer:cardValue(state.g.stat,r.right.value),points:r.points,correct:r.ok,note:recapLine(state.g,r.index),doubled:mode==='daily'&&r.index>=7}))};
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
    history:state.g.questions.flatMap((question,i)=>{const picked=state.g.answers[i];if(picked===null)return[];return[{label:`Flag ${i+1}`,guess:question.options[picked]?.displayName??'',answer:question.country.displayName,points:picked===question.correctIndex?question.points:0,correct:picked===question.correctIndex,note:picked===question.correctIndex?question.country.displayName:`You picked ${question.options[picked]?.displayName??''}, it was ${question.country.displayName}`,doubled:i>=7}];})};
  if(preview&&view.phase==='reveal') {
    const next=flagView(flagRemote.reduce(state,{t:'next'}),mode,dateKey,false);
    if(next.phase==='playing')view.nextView=next;
  }
  return view;
}

/**
 * The sprint as the client may see it. While the clock runs: the flag on screen (an opaque
 * asset name) and its four names, the counts, the server deadline and the server time now.
 * No later flag, no right answer for the flag on screen. The flags seen are listed only once
 * the run is over.
 */
export function sprintView(state:SprintState,mode:Mode,dateKey:string):FlagSprintView {
  const finished=sprint.done(state),flag=currentFlag(state),hits=sprintHits(state);
  const correct=hits.filter(Boolean).length,wrong=hits.length-correct;
  const stage=finished?'finished':state.startedAt===null?'ready':'running';
  const previous=state.answers.length?state.flags[state.answers.length-1]:null;
  const left=flagLeftOnScreen(state);
  const seen=finished?[...state.answers.map((answer,i)=>{const f=state.flags[i],c=countryOf(f.iso3);return {iso2:c.iso2,name:c.displayName,guess:sprintName(f.options[answer.i]),correct:hits[i]};}),
    ...(left?[{iso2:countryOf(left.iso3).iso2,name:sprintName(left.iso3),guess:null,correct:false}]:[])]:[];
  return {kind:'flag-quiz',format:'sprint',mode,stage,phase:finished?'finished':'playing',round:state.answers.length,total:SPRINT_LENGTH,
    score:sprint.scoreLabel(state),progress:sprint.progress(state),shareText:finished?sprint.share?.(state,{mode,dateKey,title:'Flag Quiz',rank:null})??'':'',
    history:seen.map(row=>({label:row.name,guess:row.guess??'No answer',answer:row.name,points:row.correct?1:0,correct:row.correct})),
    flagSrc:flag?opaqueFlagSrc(countryOf(flag.iso3).iso2):null,options:flag?flag.options.map(sprintName):[],correct,wrong,
    seconds:SPRINT_SECONDS,penaltySeconds:PENALTY_SECONDS,target:SPRINT_TARGET,deadline:stage==='running'?deadlineOf(state):null,serverNow:Date.now(),
    last:previous?{correct:hits[hits.length-1],answer:sprintName(previous.iso3)}:null,seen};
}

export function statView(state:StatGuesserState,mode:Mode,dateKey:string,preview=true):StatQuickView {
  const round=state.rounds[state.currentRound],revealed=state.phase!=='playing',ruler=rulerFor(round.stat),guess=state.guesses[state.currentRound];
  const view:StatQuickView={...common(stats,state,mode,dateKey,'Stat Guesser'),kind:'stat-guesser',phase:state.phase==='results'?'finished':revealed?'reveal':'playing',round:state.currentRound,total:5,
    country:{name:round.country.name,iso2:round.country.iso2},stat:guessStat(round.stat),unit:round.stat.includes('percent')?'percent':'',ruler,
    refs:round.refs.map(c=>({name:c.name,iso2:c.iso2,value:c.value})),actualValue:revealed?round.actualValue:null,guessValue:revealed?guess??null:null,
    points:revealed?state.points[state.currentRound]??null:null,context:revealed?contextLine(round.context.map(c=>c.name)):null,
    gap:revealed&&guess!==null?gapText(round.stat,guess,round.actualValue):null,doubled:state.currentRound===4,
    history:state.rounds.flatMap((r,i)=>{const g=state.guesses[i];if(g===null)return[];const base=state.points[i]??0;return[{label:`${r.country.name} · ${guessStat(r.stat)}`,guess:valueText(r.stat,g),answer:valueText(r.stat,r.actualValue),points:base*(i===4?2:1),correct:base>=80,
      tone:base>=80?'right' as const:base>0?'near' as const:'wrong' as const,note:`You said ${valueText(r.stat,g)}, it was ${valueText(r.stat,r.actualValue)} · ${gapText(r.stat,g,r.actualValue)}`,doubled:i===4}];})};
  if(preview&&view.phase==='reveal') {
    const next=statView(statRemote.reduce(state,{t:'next'}),mode,dateKey,false);
    if(next.phase==='playing')view.nextView=next;
  }
  return view;
}

export function quickProject<S>(project:(s:S,m:Mode,d:string)=>QuickView,mode:Mode,dateKey:string) {return (state:S)=>project(state,mode,dateKey);}
