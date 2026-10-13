import {getAllCountries} from './countries';
import {getStatValue} from './ranks';
import {sovereignIso3} from './loader';
export interface SurprisingPosition {iso3:string;rank:number;count:number;comparisonRank:number;comparisonCount:number;comparisonStat:string}
export function surprisingPositions(stat:string):SurprisingPosition[]{
 const comparisonStat=stat==='population'?'area-km2':'population',sovereign=new Set(sovereignIso3);
 const rank=(category:string)=>getAllCountries().filter(c=>sovereign.has(c.iso3)).flatMap(c=>{const value=getStatValue(c.iso3,category);return value!==null&&Number.isFinite(value)?[{iso3:c.iso3,value}]:[];}).sort((a,b)=>b.value-a.value||a.iso3.localeCompare(b.iso3,'en'));
 const selected=rank(stat),comparison=rank(comparisonStat),reference=new Map(comparison.map((c,i)=>[c.iso3,i+1]));
 return selected.flatMap((c,i)=>{const comparisonRank=reference.get(c.iso3);return comparisonRank===undefined?[]:[{iso3:c.iso3,rank:i+1,count:selected.length,comparisonRank,comparisonCount:comparison.length,comparisonStat}];}).sort((a,b)=>Math.abs(b.rank/b.count-b.comparisonRank/b.comparisonCount)-Math.abs(a.rank/a.count-a.comparisonRank/a.comparisonCount)||a.iso3.localeCompare(b.iso3,'en')).slice(0,3);
}
