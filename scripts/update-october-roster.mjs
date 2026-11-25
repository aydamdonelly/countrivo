// Apply the playable October daily set through the registry generator.
import {readFileSync,writeFileSync} from 'node:fs';
const file=new URL('../src/data/game-registry.json',import.meta.url);
const games=JSON.parse(readFileSync(file,'utf8'));
Object.assign(games.find(g=>g.slug==='country-draft'),{shortDescription:'Choose countries. Draft people. Build your cabinet.',description:'Five rounds. Choose one of three countries, then one of its people and a free job. Points appear only after seating. Build a cabinet worth up to 195.',estimatedTime:'3 min'});
const blind=games.find(g=>g.slug==='blind-pick');
Object.assign(blind,{shortDescription:'Eight countries. Eight categories. Find their best fit.',description:'Eight countries arrive one at a time. Place each on an open category, with one undo. Your score is the gap from the best possible assignment of those same eight countries.',availableModes:['daily','practice'],tier:'main',estimatedTime:'2 min'});
// Keep historical daily links and results working while Flag Quiz moves to the practice shelf.
Object.assign(games.find(g=>g.slug==='flag-quiz'),{tier:'drill'});
if(!games.some(g=>g.slug==='pinpoint'))games.push({slug:'pinpoint',title:'Pinpoint',shortDescription:'Five countries. Tap where they are.',description:'Place a pin on a blank coastline map. Closer taps score more. Five countries, with the last round counting double.',difficulty:'medium',estimatedTime:'2 min',category:'knowledge',tier:'main',isNew:true,isFlagship:false,availableModes:['daily','practice'],route:'/games/pinpoint'});
const order=['country-draft','geo-wordle','higher-or-lower','pinpoint','stat-guesser','blind-pick','flag-quiz','speed-flags'];
games.sort((a,b)=>order.indexOf(a.slug)-order.indexOf(b.slug));
writeFileSync(file,JSON.stringify(games,null,2)+'\n');
