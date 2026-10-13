interface ShareRound {basePoints:number;points:number}
export function buildPinpointShareText(rounds:readonly ShareRound[],dateKey:string):string {
 const squares=rounds.map(r=>r.basePoints===200?'🟩':r.basePoints>=120?'🟨':r.basePoints>=50?'🟧':'⬜').join('');
 return `Countrivo Pinpoint ${dateKey}\n${rounds.reduce((n,r)=>n+r.points,0)} of 1,200\n${squares}\ncountrivo.com/games/pinpoint`;
}
