// Apply the playable daily set and the practice drills through the registry generator.
// Run: node scripts/update-october-roster.mjs
import {readFileSync,writeFileSync} from 'node:fs';
const file=new URL('../src/data/game-registry.json',import.meta.url);
const games=JSON.parse(readFileSync(file,'utf8'));
Object.assign(games.find(g=>g.slug==='country-draft'),{shortDescription:'Choose countries. Draft people. Build your cabinet.',description:'Five rounds. Choose one of three countries, then one of its people and a free job. Points appear only after seating. Build a cabinet worth up to 195.',estimatedTime:'3 min'});
const blind=games.find(g=>g.slug==='blind-pick');
Object.assign(blind,{shortDescription:'Eight countries. Eight categories. Find their best fit.',description:'Eight countries arrive one at a time. Place each on an open category, with one undo. Your score is the gap from the best possible assignment of those same eight countries.',availableModes:['daily','practice'],tier:'main',estimatedTime:'2 min'});
// November 2026: Flag Quiz returns to the daily set as a twenty-second sprint with a leaderboard.
Object.assign(games.find(g=>g.slug==='flag-quiz'),{tier:'main',availableModes:['daily','practice'],shortDescription:'20 seconds. Name as many flags as you can.',description:'A flag appears with four names. Name as many as you can in 20 seconds. A wrong answer costs 2 seconds. Everyone gets the same flags each day, and the most flags wins.',estimatedTime:'20 sec',category:'speed'});
if(!games.some(g=>g.slug==='pinpoint'))games.push({slug:'pinpoint',title:'Pinpoint',shortDescription:'Five countries. Tap where they are.',description:'Place a pin on a blank coastline map. Closer taps score more. Five countries, with the last round counting double.',difficulty:'medium',estimatedTime:'2 min',category:'knowledge',tier:'main',isNew:true,isFlagship:false,availableModes:['daily','practice'],route:'/games/pinpoint'});
// November 2026: Capital Quiz, a practice-only drill beside Speed Flags. Never a daily: the seven
// daily games, the home grid and the day-complete count stay as they are.
const capitalQuiz={slug:'capital-quiz',title:'Capital Quiz',shortDescription:'Ten countries. Pick each capital from four cities.',description:'A country is named. Pick its capital from four cities, the others capitals of nearby countries, and see the answer after every pick. Ten countries, the whole world or one continent.',difficulty:'medium',estimatedTime:'2 min',category:'knowledge',tier:'drill',isNew:true,isFlagship:false,availableModes:['practice'],route:'/games/capital-quiz'};
const existingCapitalQuiz=games.find(g=>g.slug==='capital-quiz');
if(existingCapitalQuiz)Object.assign(existingCapitalQuiz,capitalQuiz);else games.push(capitalQuiz);
const order=['country-draft','geo-wordle','higher-or-lower','flag-quiz','pinpoint','stat-guesser','blind-pick','speed-flags','capital-quiz'];
games.sort((a,b)=>order.indexOf(a.slug)-order.indexOf(b.slug));
writeFileSync(file,JSON.stringify(games,null,2)+'\n');
