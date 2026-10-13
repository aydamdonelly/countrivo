import type { Codec } from '@/games/types';
import type { PinpointAction } from './module';
export const codec:Codec<PinpointAction> = {
 enc(log){return log.map(a=>a.t==='next'?'n':`d${Math.round(a.lat*10000)},${Math.round(a.lng*10000)};`).join('');},
 dec(s){const actions:PinpointAction[]=[];let rest=s;while(rest){if(rest[0]==='n'){actions.push({t:'next'});rest=rest.slice(1);continue;}const match=/^d(-?\d{1,7}),(-?\d{1,7});/.exec(rest);if(!match)throw new Error('pinpoint: invalid log');const lat=Number(match[1])/10000,lng=Number(match[2])/10000;if(lat< -65||lat>85||lng< -180||lng>180)throw new Error('pinpoint: invalid coordinate');actions.push({t:'drop',lat,lng});rest=rest.slice(match[0].length);}if(actions.length>10)throw new Error('pinpoint: too many actions');return actions;},
};
