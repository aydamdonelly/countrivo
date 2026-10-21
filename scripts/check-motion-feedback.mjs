// Actual local UI; all mutation requests receive synthetic acknowledgements.
import assert from 'node:assert/strict';
import Module, {createRequire} from 'node:module';
import {mkdirSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url),load=Module._load;
Module._load=function(name,parent,main){return name==='server-only'?{}:load.call(this,name,parent,main);};
const {gameModule:higher}=require('../src/games/higher-or-lower/module.ts');
const {higherView}=require('../src/server/quick-sessions.ts');
const {getTodayDateKey}=require('../src/lib/daily-seed.ts');
Module._load=load;
const day=getTodayDateKey();
let revealed=higher.reduce(higher.create(73,'daily',day),{t:'guess',c:'higher'});
let finished=revealed;
while(!higher.done(finished))finished=higher.reduce(finished,finished.rev?{t:'advance',ui:true}:{t:'guess',c:'higher'});
const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local QA only.');
if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out='.check-render/motion-feedback';mkdirSync(out,{recursive:true});
let checks=0;const results=[];
function check(value,label){assert(value,label);checks++;}
function respond(route,value){return route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n`});}
const names=['qr-stamp','qr-value-settle','qr-verdict-settle','result-score-settle','result-clay-settle','standing-confirm','standing-check','flag-settle','answer-settle','answer-correct'];
try{
 for(const reducedMotion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion});
  await context.addInitScript(()=>{window.motionEvents=[];document.addEventListener('animationstart',event=>{
   const effect=event.target.getAnimations().find(animation=>animation.animationName===event.animationName)?.effect;
   const properties=effect?[...new Set(effect.getKeyframes().flatMap(frame=>Object.keys(frame).filter(key=>!['offset','computedOffset','easing','composite'].includes(key))))]:[];
   window.motionEvents.push({name:event.animationName,target:event.target.className,iterations:effect?.getTiming().iterations,properties});
  });});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const cdp=await context.newCDPSession(page);let layers=[];
  cdp.on('LayerTree.layerTreeDidChange',event=>{layers=event.layers??[];});
  await cdp.send('LayerTree.enable');
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  let actions=0,publishes=0,flagFixture;
  const score=Number.parseInt(higher.scoreLabel(finished),10);
  const run={id:990008,gameSlug:'higher-or-lower',mode:'daily',dailyDate:day,scoreRaw:score,scoreMax:13,scoreSortValue:score,scoreDisplay:higher.scoreLabel(finished),scoreNormalized:50,rankDaily:null,percentile:null,isPersonalBest:false,resultJson:{qaFixture:true},completedAt:new Date().toISOString(),dailyNameCount:0,rankPreview:{rank:1,playerCount:1},leaderboard:{available:true,playerCount:0,entries:[]}};
  await page.route('**/*',async route=>{
   const request=route.request();
   if(request.method()!=='POST')return new URL(request.url()).origin===new URL(base).origin?route.continue():route.abort();
   if(!request.headers()['next-action'])return route.abort();
   const args=JSON.parse(request.postData()??'[]');
   if(args.length===3){publishes++;return respond(route,{success:true,publishedName:args[1],run:{...run,rankDaily:1,dailyNameCount:1}});}
   actions++;
   const view=flagFixture??higherView(actions===1?revealed:finished,'daily',day);
   return respond(route,{success:true,view,sessionToken:'motion-fixture',revision:actions,run:view.phase==='finished'?run:undefined,publishedName:null});
  });
  await page.goto(base,{waitUntil:'networkidle'});
  const tile=page.locator('.game-tile-main').first(),clay=tile.locator('.clay-object');
  const original=await tile.evaluate(node=>({width:node.offsetWidth,height:node.offsetHeight,transform:getComputedStyle(node).transform}));
  await tile.hover();
  await page.waitForFunction(({reduced})=>{const tile=document.querySelector('.game-tile-main'),clay=tile.querySelector('.clay-object');return reduced?getComputedStyle(clay).transform==='none':getComputedStyle(clay).transform!=='none';},{reduced:reducedMotion==='reduce'});
  check(await clay.evaluate(node=>getComputedStyle(node).transform!=='none')===(reducedMotion==='no-preference'),'Card artwork motion follows reduced-motion preference');
  check(await tile.evaluate((node,original)=>node.offsetWidth===original.width&&node.offsetHeight===original.height,original),'Card motion leaves layout dimensions unchanged');
  await page.goto(`${base}/games/higher-or-lower/play?mode=daily`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{const node=document.querySelector('.qr-call');return node&&Object.keys(node).some(key=>key.startsWith('__reactProps'));});
  await page.locator('.qr-call').first().click();await page.locator('.qr-country-reveal').waitFor();
  check(await page.getByRole('button',{name:'Next',exact:true}).isEnabled(),'Reveal action is available immediately without waiting for animation');
  const animations=await page.locator('.qr-country-reveal').evaluate(node=>node.getAnimations({subtree:true}).map(animation=>({name:animation.animationName,iterations:animation.effect.getTiming().iterations,properties:[...new Set(animation.effect.getKeyframes().flatMap(frame=>Object.keys(frame).filter(key=>!['offset','computedOffset','easing','composite'].includes(key))))]})));
  check(animations.every(animation=>animation.iterations===1&&animation.properties.every(property=>['transform','opacity'].includes(property))),'Reveal uses finite transform/opacity animations only');
  check((animations.length>0)===(reducedMotion==='no-preference'),'Reveal has no decorative motion in reduced-motion mode');
  const compositingReasons=[...new Set((await Promise.all(layers.map(layer=>cdp.send('LayerTree.compositingReasons',{layerId:layer.layerId}).then(result=>result.compositingReasons).catch(()=>[])))).flat())];
  await page.getByRole('button',{name:'Next',exact:true}).click();await page.locator('.rp-arrived').waitFor();
  const input=page.getByRole('textbox',{name:'Your name on the board',exact:true});
  check(await input.isEnabled(),'Name entry is immediately usable while score settles');
  const scoreEvents=()=>page.evaluate(()=>window.motionEvents.filter(event=>event.name==='result-score-settle').length);
  if(reducedMotion==='no-preference')await page.waitForFunction(()=>window.motionEvents.some(event=>event.name==='result-score-settle'));
  const before=await scoreEvents();
  await input.fill('Motion Player');await page.getByRole('button',{name:'Put me on the leaderboard',exact:true}).click();
  await page.locator('.standing-you .standing-name > b').waitFor();
  check(publishes===1,'Only an explicit intercepted publication triggers confirmation');
  if(reducedMotion==='no-preference')await page.waitForFunction(()=>window.motionEvents.some(event=>event.name==='standing-confirm'));
  check(await scoreEvents()===before,'Publication never replays fresh-result motion');
  await page.locator('.name-management summary').click();await page.getByRole('button',{name:'Change name',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  check(await page.locator('.standing-confirmation').count()===0,'Cancelling rename does not replay a success confirmation');
  check(await scoreEvents()===before,'Unrelated management updates preserve the score animation instance');
  await page.waitForFunction(score=>document.querySelector('.rp-score-content .cu-live')?.textContent===String(score),score);
  await page.screenshot({path:`${out}/result-${reducedMotion}.png`,fullPage:true});
  const previousEvents=await page.evaluate(names=>window.motionEvents.filter(event=>names.includes(event.name)),names);
  await page.goto(`${base}/games/flag-quiz/play?mode=daily`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{const node=document.querySelector('.fq-opt');return node&&Object.keys(node).some(key=>key.startsWith('__reactProps'));});
  const options=await page.locator('.fq-opt .lbl').allTextContents(),flagSrc=await page.locator('.fq-box img').getAttribute('src');
  flagFixture={kind:'flag-quiz',mode:'daily',phase:'reveal',round:0,total:10,score:'1 / 13',progress:{done:1,total:10,label:'score',value:'1'},shareText:'Local fixture',history:[],flagSrc,options,picked:0,correctIndex:0,fact:null,source:null,doubled:false};
  await page.locator('.fq-opt').first().click();await page.locator('.qr-flag[data-phase=reveal]').waitFor();
  check(await page.getByRole('button',{name:'Next',exact:true}).isEnabled(),'Flag reveal never gates the next action behind motion');
  if(reducedMotion==='no-preference')await page.waitForFunction(()=>window.motionEvents.some(event=>event.name==='flag-settle'));
  const events=[...previousEvents,...await page.evaluate(names=>window.motionEvents.filter(event=>names.includes(event.name)),names)];
  const motionNames=events.map(event=>event.name);
  check(reducedMotion==='no-preference'?motionNames.includes('flag-settle'):motionNames.length===0,'Flag feedback respects reduced-motion preference');
  check(events.every(event=>event.iterations===1&&event.properties.length>0&&event.properties.every(property=>['transform','opacity'].includes(property))),'Score, confirmation, country and flag motion never animate layout or paint properties');
  check(errors.length===0,`No client errors: ${errors.join('; ')}`);
  results.push({reducedMotion,actions,publishes,motionNames,animations,compositingReasons,realMutations:0});
  await context.close();
 }
 writeFileSync(`${out}/report.json`,JSON.stringify({checks,fixture:'Local actual UI with synthetic acknowledgements. No public runs/names written. Compositor-friendly property checks are not a field performance benchmark.',results},null,2)+'\n');
 console.log(`Motion feedback: ${checks} checks passed; normal/reduced motion; no public data written.`);
}finally{await browser.close();}
