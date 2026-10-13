'use server';
import {countries,sovereignIso3} from '@/lib/data/loader';
import {distanceToCountry} from '@/lib/game-logic/geography';
/** A map preview identifies the place tapped; it carries no daily-answer information. */
export async function previewMapCountry(lat:number,lng:number):Promise<{iso3:string;name:string}|null>{
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat< -65||lat>85||lng< -180||lng>180)return null;
 const sovereign=new Set(sovereignIso3);
 for(const country of countries){if(!sovereign.has(country.iso3))continue;const distance=distanceToCountry({lat,lng},country.iso3);if(distance?.inside)return {iso3:country.iso3,name:country.displayName};}
 return null;
}
