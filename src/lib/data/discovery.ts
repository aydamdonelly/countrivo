import {countryBorders,sovereignIso3} from './loader';
export interface BorderChain {from:string;to:string;route:string[];borders:number}
const OVERSEAS_SHORTCUTS=new Set(['ESP|MAR','LTU|RUS','POL|RUS','AZE|TUR']);
function pair(a:string,b:string):string{return [a,b].sort().join('|');}
/** Country-border graph, with named overseas and exclave shortcuts removed. */
export function longestBorderChains():BorderChain[]{
 const sovereign=new Set(sovereignIso3),graph=new Map<string,Set<string>>(sovereignIso3.map(iso=>[iso,new Set<string>()]));
 for(const from of sovereignIso3)for(const to of countryBorders[from]??[]){if(!sovereign.has(to)||OVERSEAS_SHORTCUTS.has(pair(from,to)))continue;graph.get(from)?.add(to);graph.get(to)?.add(from);}
 const routes:BorderChain[]=[];
 for(const start of sovereignIso3){const visited=new Set([start]),queue=[[start]];for(let i=0;i<queue.length;i++){const route=queue[i],end=route.at(-1);if(!end)continue;if(start<end)routes.push({from:start,to:end,route,borders:route.length-1});for(const next of [...graph.get(end)??[]].sort()){if(visited.has(next))continue;visited.add(next);queue.push([...route,next]);}}}
 return routes.sort((a,b)=>b.borders-a.borders||pair(a.from,a.to).localeCompare(pair(b.from,b.to),'en')).slice(0,10);
}
