import { geography } from '@/lib/data/loader';

export interface GeoPoint { lat: number; lng: number }
export interface BorderDistance { km: number; nearest: GeoPoint; inside: boolean }
type Vector = readonly [number, number, number];
const EARTH_KM = 6371;
const rad = (n: number): number => n * Math.PI / 180;
const deg = (n: number): number => n * 180 / Math.PI;
const dot = (a: Vector,b: Vector): number => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a: Vector,b: Vector): Vector => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length = (v: Vector): number => Math.hypot(...v);
function unit(v: Vector): Vector { const n=length(v); return n ? [v[0]/n,v[1]/n,v[2]/n] : [0,0,0]; }
function vector(p: GeoPoint): Vector { const lat=rad(p.lat),lng=rad(p.lng); return [Math.cos(lat)*Math.cos(lng),Math.cos(lat)*Math.sin(lng),Math.sin(lat)]; }
function point(v: Vector): GeoPoint { return {lat:deg(Math.asin(Math.max(-1,Math.min(1,v[2])))),lng:deg(Math.atan2(v[1],v[0]))}; }
const angle = (a: Vector,b: Vector): number => Math.atan2(length(cross(a,b)),Math.max(-1,Math.min(1,dot(a,b))));
export function greatCircleKm(a: GeoPoint,b: GeoPoint): number { return EARTH_KM * angle(vector(a),vector(b)); }
export function bearingBetween(a: GeoPoint,b: GeoPoint): number {
 const phi1=rad(a.lat),phi2=rad(b.lat),dl=rad(b.lng-a.lng);
 return (deg(Math.atan2(Math.sin(dl)*Math.cos(phi2),Math.cos(phi1)*Math.sin(phi2)-Math.sin(phi1)*Math.cos(phi2)*Math.cos(dl)))+360)%360;
}
export function mapPoint(p: GeoPoint): { x:number; y:number } { return {x:(p.lng+180)*2,y:(85-p.lat)*2}; }
export function pointFromMap(x:number,y:number): GeoPoint { return {lat:Math.max(-65,Math.min(85,85-y/2)),lng:Math.max(-180,Math.min(180,x/2-180))}; }
function insideRing(pin:GeoPoint,ring:readonly number[][]):boolean {
 if(ring.length<3) return false;
 const unwrapped: GeoPoint[]=[]; let previous=ring[0][0];
 for(const coordinate of ring){let lng=coordinate[0];while(lng-previous>180)lng-=360;while(lng-previous< -180)lng+=360;unwrapped.push({lng,lat:coordinate[1]});previous=lng;}
 const middle=unwrapped.reduce((sum,p)=>sum+p.lng,0)/unwrapped.length;
 let lng=pin.lng;while(lng-middle>180)lng-=360;while(lng-middle< -180)lng+=360;
 let inside=false;
 for(let i=0,j=unwrapped.length-1;i<unwrapped.length;j=i++){
  const a=unwrapped[i],b=unwrapped[j];
  if((a.lat>pin.lat)!==(b.lat>pin.lat)&&lng<(b.lng-a.lng)*(pin.lat-a.lat)/(b.lat-a.lat)+a.lng)inside=!inside;
 }
 return inside;
}
function closestOnArc(pin:Vector,a:Vector,b:Vector):Vector {
 const normal=unit(cross(a,b));
 if(!length(normal)) return a;
 const projection=unit([pin[0]-dot(pin,normal)*normal[0],pin[1]-dot(pin,normal)*normal[1],pin[2]-dot(pin,normal)*normal[2]]);
 const arc=angle(a,b);
 let best=angle(pin,a)<=angle(pin,b)?a:b;
 const opposite:Vector=[-projection[0],-projection[1],-projection[2]];
 for(const candidate of [projection,opposite]){
  if(Math.abs(angle(a,candidate)+angle(candidate,b)-arc)<0.000001&&angle(pin,candidate)<angle(pin,best))best=candidate;
 }
 return best;
}
/** Approximate distance to Natural Earth 1:50m borders, on the sphere. */
export function distanceToCountry(pin:GeoPoint,iso3:string):BorderDistance|null {
 const shape=geography.countries[iso3];if(!shape)return null;
 const inside=shape.polygons.some(p=>insideRing(pin,p[0])&&!p.slice(1).some(hole=>insideRing(pin,hole)));
 if(inside)return {km:0,nearest:pin,inside:true};
 const v=vector(pin);let nearest:Vector|null=null;let distance=Infinity;
 for(const polygon of shape.polygons)for(const ring of polygon)for(let i=1;i<ring.length;i++){
  const a=vector({lng:ring[i-1][0],lat:ring[i-1][1]}),b=vector({lng:ring[i][0],lat:ring[i][1]});
  const candidate=closestOnArc(v,a,b),km=angle(v,candidate)*EARTH_KM;
  if(km<distance){distance=km;nearest=candidate;}
 }
 return nearest ? {km:Math.round(distance),nearest:point(nearest),inside:false} : null;
}

export function borderDistanceKm(iso3:string,otherIso3:string):number|null {
 if(iso3===otherIso3)return 0;
 const left=geography.countries[iso3],right=geography.countries[otherIso3];
 if(!left||!right)return null;
 const vertices=(polygons:number[][][][]):GeoPoint[]=>polygons.flatMap(p=>p.flatMap(r=>r.map(([lng,lat])=>({lat,lng}))));
 const a=vertices(left.polygons),b=vertices(right.polygons);
 // Check vertices against opposing edges in both directions: a closest pair can lie
 // between one endpoint and the other country's edge, rather than two endpoints.
 let nearest=Infinity;
 for(const vertex of a){const distance=distanceToCountry(vertex,otherIso3);if(distance)nearest=Math.min(nearest,distance.km);if(nearest===0)return 0;}
 for(const vertex of b){const distance=distanceToCountry(vertex,iso3);if(distance)nearest=Math.min(nearest,distance.km);if(nearest===0)return 0;}
 return Number.isFinite(nearest)?Math.round(nearest):null;
}
