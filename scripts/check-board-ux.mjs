// Isolated component fixtures: no Next routes, server actions or database connection.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const require=createRequire(import.meta.url);
require.extensions['.css']=()=>{};
const {createGame,openCountry,appoint}=require('../src/lib/game-logic/country-draft/engine.ts');
const {draftView}=require('../src/lib/game-logic/country-draft/public-view.ts');
const {createPinpoint,dropPin,pinpointView}=require('../src/lib/game-logic/pinpoint/engine.ts');
const {projectPoint}=require('../src/lib/game-logic/map-projection.ts');
const {mulberry32}=require('../src/lib/seeded-random.ts');
const {revealViewport,pinpointExplanation}=require('../src/games/pinpoint/board.tsx');
let checks=0;const check=(ok,message)=>{assert(ok,message);checks++;};
for(let seed=0;seed<20;seed++)for(const pin of [{lat:48,lng:2},{lat:0,lng:179},{lat:0,lng:-179},{lat:-64,lng:0}]){
 const result=dropPin(createPinpoint(mulberry32(seed)),pin.lat,pin.lng).results[0],v=revealViewport(result),w=720/v.zoom,h=360/v.zoom;
 for(const p of [projectPoint(result),projectPoint(result.nearest)]){
  check(p.x>=v.x-w/2-.01&&p.x<=v.x+w/2+.01,'fit contains pin and target horizontally');
  check(p.y>=v.y-h/2-.01&&p.y<=v.y+h/2+.01,'fit contains pin and target vertically');
 }
 check(v.zoom>=1&&v.zoom<=20,'fit stays within supported zoom');check(pinpointExplanation(result).includes(result.name),'why names the actual target');
}
const initial=createGame(31),people=openCountry(initial,0),seated=appoint(people,0,0);
const pinGame=createPinpoint(mulberry32(31));pinGame.countries[0]={iso3:'FRA',name:'France'};
const pinInside=dropPin(pinGame,48.8566,2.3522),pinOutside=dropPin(pinGame,40.7,-74);
const fixtures={draftPeople:draftView(people),draftSeated:draftView(seated),pinStart:pinpointView(pinGame),pinInside:pinpointView(pinInside),pinOutside:pinpointView(pinOutside)};
const output='.check-render/board-ux';mkdirSync(output,{recursive:true});
const built=await build({stdin:{contents:`import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{Board as Draft}from'./src/games/country-draft/board';import{Board as Pin}from'./src/games/pinpoint/board';function Fixture(){const [f,show]=useState(globalThis.fixture),[selection,select]=useState({country:null,person:null,seat:null,detail:null,revealSeat:null});globalThis.showFixture=show;const actions=globalThis.actions??=[];return f.game==='draft'?<Draft state={f.view} selection={selection} busy={false} animate={false} onCountry={()=>{}} onOpenCountry={()=>{}} onOpen={()=>{}} onPerson={person=>select({...selection,person})} onCommit={seat=>actions.push({seat})} onDrop={()=>select({...selection,person:null})} onNext={()=>actions.push({next:true})} onDetail={detail=>select({...selection,detail})} onReveal={revealSeat=>select({...selection,revealSeat})}/>:<Pin state={f.view} busy={false} dispatch={action=>actions.push(action)}/>;}createRoot(document.getElementById('root')).render(<Fixture/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixture-boundaries',setup(build){build.onResolve({filter:/\.css$/},args=>({path:args.path,namespace:'empty-css'}));build.onLoad({filter:/.*/,namespace:'empty-css'},()=>({contents:'',loader:'js'}));build.onResolve({filter:/^next\/link$/},()=>({path:'next-link',namespace:'fixture-link'}));build.onLoad({filter:/.*/,namespace:'fixture-link'},()=>({contents:"import React from 'react';export default function Link({children,prefetch,onNavigate,...props}){return React.createElement('a',props,children)};export function useLinkStatus(){return{pending:false}}",loader:'js',resolveDir:process.cwd()}));}}]});
const tokens=readFileSync('src/styles/tokens.css','utf8').replace(/@import[^;]+;/g,'').replace('@theme',':root');
const css='@layer theme,base,components,utilities;@layer base{'+readFileSync('node_modules/tailwindcss/preflight.css','utf8')+'}'+tokens+['src/styles/base.css','src/styles/type.css','src/styles/ui.css','src/games/country-draft/draft.css','src/games/pinpoint/pinpoint.css'].map(p=>readFileSync(p,'utf8')).join('\n')+'main{max-width:720px;margin:auto;padding:20px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.text-mute{color:var(--color-mute)}.text-ember{color:var(--color-ember)}';
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/fixture.js'){res.setHeader('Content-Type','text/javascript');res.end(built.outputFiles[0].text);return;}
 if(url.pathname==='/fixture.css'){res.setHeader('Content-Type','text/css');res.end(css);return;}
 if(url.pathname==='/'){
  const type=url.searchParams.get('fixture')??'pinStart';res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"><main id="root"></main><script>globalThis.fixture='+JSON.stringify({game:type.startsWith('draft')?'draft':'pin',view:fixtures[type]})+'</script><script src="/fixture.js"></script>');return;
 }
 const file=path.resolve('public','.'+url.pathname);
 if(file.startsWith(path.resolve('public')+path.sep)&&existsSync(file)){res.end(readFileSync(file));return;}
 res.statusCode=404;res.end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE to installed playwright-core/index.mjs.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  for(const fixture of ['draftPeople','draftSeated','pinStart','pinInside','pinOutside']){
   await page.goto(base+'/?fixture='+fixture);await page.locator(fixture.startsWith('draft')?'.dr':'.pp-board').waitFor();
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),fixture+' fits viewport '+viewport.width);
   if(fixture==='draftPeople'){
    await page.locator('.dr-person-select').first().click();const options=page.locator('.dr-job-options');
    check(!/\b(?:fit|fame|points|natural|strong|thin|\d+)\b/i.test(await options.innerText()),'job choice has no point/fit preview');
    await page.getByRole('button',{name:'Put person back',exact:true}).click();
   }
   if(fixture==='draftSeated'){
    check(await page.locator('.dr-reveal-person h2').innerText()===fixtures.draftSeated.seats[0].person.name,'reveal names chosen person');
    check(await page.locator('.dr-reveal-why').innerText()===fixtures.draftSeated.seats[0].why,'specific reason is visible before expanding anything');
    check(await page.locator('.dr-passed-pool').getAttribute('open')===null,'old choices collapsed');
    check(await page.locator('.dr-person-select:visible').count()===0,'old disabled choices are no longer competing for attention');
    await page.locator('.dr-passed-pool summary').click();check(await page.locator('.dr-passed-pool button.dr-person-select').count()===0,'review rows cannot appoint again');
    await page.locator('.dr-passed-pool summary').click();
   }
   if(fixture.startsWith('pin')){
    const map=page.locator('.pp-map'),box=await map.boundingBox();check(Math.abs(box.width/box.height-2)<.01,'map canvas matches viewBox without large letterboxing');
    const contrast=await page.locator('.pp-coast').evaluate(node=>{const c=getComputedStyle(node),rgb=v=>v.match(/[\d.]+/g).slice(0,3).map(Number),lum=v=>rgb(v).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);const a=lum(c.stroke),b=lum(c.fill);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);});check(contrast>=3,'coastline contrast is at least3:1');
    if(fixture==='pinStart'){
     check(await page.locator('.pp-answer-land,.pp-target,.pp-legend').count()===0,'no answer shape or target point before commit');
     await map.focus();await page.keyboard.press('Enter');check(await page.getByRole('button',{name:'Drop pin',exact:true}).isEnabled(),'keyboard places a pin');
     await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');check(await page.evaluate(()=>actions.filter(a=>a.t==='drop').length)===1,'keyboard commits once, no network');
    }else{
     check(await page.locator('.pp-legend').innerText().then(t=>t.includes('Your pin')&&t.includes('France')),'legend distinguishes both locations');
     check((await page.locator('.pp-feedback').innerText()).includes('Your pin'),'score has a specific geographic reason');
     const fit=await map.getAttribute('viewBox');await page.getByRole('button',{name:'Reset world view',exact:true}).click();await page.getByRole('button',{name:'Fit country and your pin',exact:true}).click();check(await map.getAttribute('viewBox')===fit,'world reset can return to the confirmed result framing');
    }
   }
   if(viewport.width===320){await page.addStyleTag({content:'html{font-size:200%} .t-meta{font-size:26px;line-height:36px}.t-body{font-size:32px;line-height:48px}.t-h3{font-size:38px;line-height:48px}.t-h2{font-size:48px;line-height:60px}'});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),fixture+' survives200% text');}
   await page.screenshot({path:`${output}/${fixture}-${viewport.width}.png`,fullPage:true});
  }
  check(errors.length===0,'no client errors: '+errors.join(';'));await context.close();
 }
 writeFileSync(output+'/checks.json',JSON.stringify({checks,liveDatabaseWrites:false,fixtureOnly:true},null,2)+'\n');console.log(`Board UX: ${checks} isolated framing, explanation, secrecy, keyboard and responsive checks passed.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
