export interface MapPoint {lat:number;lng:number}
export function projectPoint(p:MapPoint):{x:number;y:number}{return {x:(p.lng+180)*2,y:(85-p.lat)*2};}
export function unprojectPoint(x:number,y:number):MapPoint{return {lat:Math.max(-65,Math.min(85,85-y/2)),lng:Math.max(-180,Math.min(180,x/2-180))};}
