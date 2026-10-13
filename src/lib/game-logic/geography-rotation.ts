export type GeographyGame = 'geo-wordle' | 'pinpoint';
export interface GeographyHistory {dateKey:string; answers:readonly string[]}
export const GEO_WORDLE_MIN_GAP_DAYS = 45;
export const PINPOINT_MIN_GAP_DAYS = 14;

export function isGeographyGame(slug:string):slug is GeographyGame {return slug==='geo-wordle'||slug==='pinpoint';}
export function rotationWindowStart(dateKey:string, gapDays:number):string {
  const date=new Date(`${dateKey}T12:00:00Z`);
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dateKey)throw new Error('Invalid daily date');
  date.setUTCDate(date.getUTCDate()-(gapDays-1));
  return date.toISOString().slice(0,10);
}

/** Read only the answer IDs needed for history, never guesses or completed-run scores. */
export function rotationAnswers(slug:GeographyGame,state:unknown):string[] {
  if(!state||typeof state!=='object')throw new Error('Invalid geography board snapshot');
  if(slug==='geo-wordle'&&'answerIso3' in state&&typeof state.answerIso3==='string'&&/^[A-Z]{3}$/.test(state.answerIso3))return [state.answerIso3];
  if(slug==='pinpoint'&&'countries' in state&&Array.isArray(state.countries)){
    const answers=state.countries.flatMap((country:unknown)=>country&&typeof country==='object'&&'iso3' in country&&typeof country.iso3==='string'&&/^[A-Z]{3}$/.test(country.iso3)?[country.iso3]:[]);
    if(answers.length===5&&new Set(answers).size===5)return answers;
  }
  throw new Error('Invalid geography answer snapshot');
}

const band=(round:number)=>round<3?0:round===3?1:2;
export function respectsRotation(slug:GeographyGame,dateKey:string,answers:readonly string[],history:readonly GeographyHistory[]):boolean {
  const floor=rotationWindowStart(dateKey,slug==='geo-wordle'?GEO_WORDLE_MIN_GAP_DAYS:PINPOINT_MIN_GAP_DAYS);
  return history.filter(previous=>previous.dateKey>=floor&&previous.dateKey<dateKey).every(previous=>slug==='geo-wordle'
    ? !previous.answers.includes(answers[0])
    : answers.every((iso3,round)=>!previous.answers.some((previousIso,previousRound)=>iso3===previousIso&&band(round)===band(previousRound))));
}

/** The caller supplies secret-derived seeds; this function performs no I/O or randomness. */
export function selectRotationCandidate<S>(slug:GeographyGame,dateKey:string,history:readonly GeographyHistory[],create:(seed:number)=>S,seedForAttempt:(attempt:number)=>number):{seed:number;state:S;attempt:number} {
  for(let attempt=0;attempt<50_000;attempt++){
    const seed=seedForAttempt(attempt),state=create(seed);
    if(respectsRotation(slug,dateKey,rotationAnswers(slug,state),history))return {seed,state,attempt};
  }
  throw new Error(`No ${slug} board satisfies its repetition window`);
}
