// Natural Earth 1:50m coastlines and country geometry, shared by the geography games.
// Regenerate: node scripts/build-geography.mjs. No new runtime dependencies.
import { geoEquirectangular, geoPath, geoArea } from 'd3-geo';
import { feature, merge } from 'topojson-client';
import { readFileSync, writeFileSync } from 'node:fs';

const source = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
const response = await fetch(source);
if (!response.ok) throw new Error(`Atlas download failed: ${response.status}`);
const topo = await response.json();
const countries = JSON.parse(readFileSync(new URL('../src/data/countries.json', import.meta.url), 'utf8'));
const sovereign = JSON.parse(readFileSync(new URL('../src/data/sovereign.json', import.meta.url), 'utf8'));
const wanted = new Set(sovereign);
const aliases = {'Vatican':'VAT','Marshall Is.':'MHL','United States of America':'USA','S. Sudan':'SSD','Solomon Is.':'SLB','São Tomé and Principe':'STP','St. Vin. and Gren.':'VCT','St. Kitts and Nevis':'KNA','Macedonia':'MKD','Eq. Guinea':'GNQ','Dominican Rep.':'DOM',"Côte d'Ivoire":'CIV','Dem. Rep. Congo':'COD','Congo':'COG','Central African Rep.':'CAF','Cabo Verde':'CPV','Bosnia and Herz.':'BIH','Antigua and Barb.':'ATG'};
const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
const names = new Map();
for (const country of countries) for (const name of [country.name,country.displayName]) names.set(normalize(name),country.iso3);
for (const [name,iso3] of Object.entries(aliases)) names.set(normalize(name),iso3);
const projection = geoEquirectangular().scale(360 / Math.PI).translate([360,170]);
const path = geoPath(projection).digits(2);
const all = feature(topo,topo.objects.countries);
function simplify(ring, tolerance = 0.05) {
 if (ring.length < 6) return ring;
 const keep = new Set([0,ring.length-1]);
 const stack = [[0,ring.length-1]];
 while (stack.length) {
  const [a,b] = stack.pop(); const [ax,ay] = ring[a]; const [bx,by] = ring[b]; const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;
  let largest=tolerance,index=-1;
  for(let i=a+1;i<b;i++) {
   const [px,py]=ring[i]; const t=l ? Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)) : 0;
   const distance=Math.hypot(px-ax-t*dx,py-ay-t*dy);
   if(distance>largest){largest=distance;index=i;}
  }
  if(index>=0){keep.add(index);stack.push([a,index],[index,b]);}
 }
 const result=ring.filter((_,i)=>keep.has(i));
 if(result.length<4)return ring;
 const originalWinding=geoArea({type:"Polygon",coordinates:[ring]})>2*Math.PI;
 const simplifiedWinding=geoArea({type:"Polygon",coordinates:[result]})>2*Math.PI;
 return originalWinding===simplifiedWinding ? result : ring;
}
const shapes = {};
for (const f of all.features) {
 const iso3 = names.get(normalize(f.properties.name));
 if (!iso3 || !wanted.has(iso3)) continue;
 const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
 const simplified=polygons.map(p=>p.map(r=>simplify(r).map(([lng,lat])=>[Math.round(lng*10000)/10000,Math.round(lat*10000)/10000])));
 const geometry={type:'MultiPolygon',coordinates:simplified};
 shapes[iso3] = {path:path(geometry),polygons:simplified};
}
const geometries = topo.objects.countries.geometries.filter(g=>g.properties.name !== 'Antarctica');
const data = {source:'Natural Earth 1:50m, world-atlas 2',sourceUrl:'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/',viewBox:'0 0 720 300',land:path(merge(topo,geometries)),countries:shapes};
writeFileSync(new URL('../src/data/geography.json',import.meta.url),JSON.stringify(data)+'\n');
writeFileSync(new URL('../src/data/geography-coastline.json',import.meta.url),JSON.stringify({viewBox:data.viewBox,land:data.land})+'\n');
console.log(`${Object.keys(shapes).length} sovereign country shapes; ${(JSON.stringify(data).length/1024).toFixed(0)} KB`);
