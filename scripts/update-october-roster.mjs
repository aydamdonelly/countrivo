// Apply the playable October daily set through the registry generator.
import {readFileSync,writeFileSync} from 'node:fs';
const file=new URL('../src/data/game-registry.json',import.meta.url);
const games=JSON.parse(readFileSync(file,'utf8'));
Object.assign(games.find(g=>g.slug==='country-draft'),{shortDescription:'Choose countries. Draft people. Build your cabinet.',description:'Five rounds. Choose one of three countries, then one of its people and a free job. Points appear only after seating. Build a cabinet worth up to 195.',estimatedTime:'3 min'});
const blind=games.find(g=>g.slug==='blind-pick');
Object.assign(blind,{shortDescription:'Six countries. Six stats. Beat the perfect board.',description:'Six countries arrive one at a time. Put each on the stat where it ranks highest. Your score is the gap from the perfect assignment.',availableModes:['practice'],tier:'drill',estimatedTime:'2 min'});
if(!games.some(g=>g.slug==='pinpoint'))games.push({slug:'pinpoint',title:'Pinpoint',shortDescription:'Five countries. Tap where they are.',description:'Place a pin on a blank coastline map. Closer taps score more. Five countries, with the last round counting double.',difficulty:'medium',estimatedTime:'2 min',category:'knowledge',tier:'main',isNew:true,isFlagship:false,availableModes:['daily','practice'],route:'/games/pinpoint'});
const order=['country-draft','geo-wordle','pinpoint','flag-quiz','higher-or-lower','stat-guesser','blind-pick','speed-flags'];
games.sort((a,b)=>order.indexOf(a.slug)-order.indexOf(b.slug));
writeFileSync(file,JSON.stringify(games,null,2)+'\n');
