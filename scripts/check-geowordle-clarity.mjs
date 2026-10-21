// Local synthetic acknowledgements cover neighbour feedback and completion without writing runs.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url);
const {gameModule}=require('../src/games/geo-wordle/module.ts');
const {geoWordleView}=require('../src/lib/game-logic/geo-wordle/engine.ts');
const installed=process.env.PLAYWRIGHT_MODULE;
if(!installed)throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const {chromium}=await import(pathToFileURL(installed).href);
const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local QA only.');
const out='.check-render/geowordle-clarity';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
let checks=0;const check=(ok,label)=>{assert(ok,label);checks++;};
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  let state={answerIso3:'PRK',guesses:[],clueAt:null,phase:'playing'},posts=0;
  const sequence=['FRA','JPN','RUS','PRK'];
  await page.route('**/*',async route=>{
   if(route.request().method()!=='POST'||!route.request().headers()['next-action'])return route.continue();
   const index=posts++;
   state=index<sequence.length?gameModule.reduce(state,{t:'guess',iso3:sequence[index]}):{answerIso3:'PRK',guesses:[],clueAt:null,phase:'playing'};
   await new Promise(resolve=>setTimeout(resolve,250));
   return route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${JSON.stringify({success:true,view:geoWordleView(state),revision:posts,sessionToken:`clarity-${posts}`})}\n`});
  });
  await page.goto(`${base}/games/geo-wordle/play?mode=practice`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{const input=document.getElementById('geo-guess');return input&&Object.keys(input).some(key=>key.startsWith('__reactProps'));});
  check(await page.locator('.gw-start').textContent()==='Find the hidden country in 6 guesses. Tap the map or type a country.','First move explains the goal and both input methods in one line');
  check(await page.locator('.gw-result').count()===0,'No result or answer before completion');
  await page.screenshot({path:`${out}/start-${width}.png`});
  for(const [index,name] of ['France','Japan','Russia'].entries()){
   await page.getByRole('combobox',{name:'Country',exact:true}).fill(name);
   await page.getByRole('button',{name:'Guess',exact:true}).click();
   await page.locator('.gw-pending').waitFor();
   check(await page.locator('.gw-pending .gw-readout').count()===0,'Pending answers do not invent distance feedback');
   await page.waitForFunction(count=>document.querySelectorAll('.gw-row:not(.gw-pending)').length===count,index+1);
   await page.locator('.gw-pending').waitFor({state:'detached'});
  }
  const neighbour=page.locator('.gw-neighbour');
  check(await neighbour.locator('b').textContent()==='Neighbour','Shared border gets an unambiguous primary verdict');
  check(await neighbour.textContent()==='NeighbourShared border · 0 km','Zero kilometres are secondary to shared-border meaning');
  check(await neighbour.locator('svg').count()===0,'No misleading zero-distance direction arrow on a neighbour');
  const fills=await page.locator('.gw-map .gw-land').evaluateAll(paths=>paths.map(path=>getComputedStyle(path).fill));
  check(new Set(fills).size>=2,'Confirmed cold and close guesses have distinct map colours');
  check(await page.locator('.gw-band').filter({hasText:'Cold'}).count()===1,'Heat feedback also has text');
  await page.getByText('Distance & direction',{exact:true}).click();
  check(await page.getByText(/Arrows point towards the country’s centre/).isVisible(),'Optional explanation discloses mixed geographic reference');
  await page.getByText('Distance & direction',{exact:true}).click();
  await page.getByRole('button',{name:'Outline · −1 guess',exact:true}).click();
  await page.getByRole('button',{name:'Not now',exact:true}).click();
  check(posts===3,'Cancelling outline consumes no server move');
  await page.screenshot({path:`${out}/neighbour-${width}.png`});
  await page.getByRole('combobox',{name:'Country',exact:true}).fill('North Korea');
  await page.getByRole('button',{name:'Guess',exact:true}).click();
  await page.locator('.gw-result').waitFor();
  await page.waitForFunction(()=>document.activeElement?.classList.contains('gw-result'));
  check((await page.locator('.gw-result').boundingBox()).y>=0,'Completion focuses the visible result');
  check(!(await page.locator('.gw-history').getAttribute('open')),'Full route is collapsed after completion');
  check(await page.locator('.gw-result-title').textContent()==='North Korea','Completed answer is revealed in result heading');
  const bonus=page.getByRole('button',{name:'Bonus quiz, just for fun. Your score stays the same.',exact:true});
  const resultOrder=await bonus.evaluate(node=>{
   const before=selector=>Array.from(document.querySelectorAll(selector)).some(other=>!!(other.compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING));
   const after=selector=>Array.from(document.querySelectorAll(selector)).every(other=>!!(node.compareDocumentPosition(other)&Node.DOCUMENT_POSITION_FOLLOWING));
   return {standingBefore:before('.practice-standing'),weeklyAfter:after('.daily-habit'),feedbackAfter:after('.site-feedback-result'),feedbackCount:document.querySelectorAll('.site-feedback-result').length};
  });
  check(resultOrder.standingBefore,'Daily standings appear before the optional bonus');
  check(resultOrder.weeklyAfter&&resultOrder.feedbackAfter&&resultOrder.feedbackCount===1,'Bonus precedes weekly progress when present and the single result feedback form');
  await bonus.scrollIntoViewIfNeeded();
  check(await bonus.isVisible(),'Bonus remains accessible after the standings');
  check(await bonus.evaluate(node=>{const box=node.getBoundingClientRect();return document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)?.closest('button')===node;}),'Bonus control is not covered by another element');
  await page.screenshot({path:`${out}/result-${width}.png`});
  await bonus.click();
  for(const country of ['South Korea','Russia','China'])await page.getByRole('button',{name:country,exact:true}).click();
  await page.getByRole('button',{name:'Check',exact:true}).click();
  check(await page.getByRole('status').filter({hasText:'All found.'}).isVisible(),'Bonus reports success in words');
  check(await page.getByRole('button',{name:'Russia: correct',exact:true}).isVisible(),'Bonus option correctness is accessible');
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:'Pyongyang',exact:true}).click();
  check(await page.getByRole('status').filter({hasText:'Correct.'}).isVisible(),'Capital reports correctness in words');
  await page.locator('.gw-history>summary').click();
  check(await page.locator('.gw-map').isVisible(),'Route can still be explored after the result');
  check(await page.locator('.gw-row').count()===4,'All committed attempts remain in route history');
  await page.getByRole('button',{name:'One more',exact:true}).click();
  await page.locator('.gw-start').waitFor();
  check(await page.locator('.gw-history').count()===0,'Replay starts a fresh playable view');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'No horizontal overflow');
  check(errors.length===0,`No browser errors: ${errors.join('; ')}`);
  await context.close();
 }
 writeFileSync(`${out}/report.json`,JSON.stringify({checks,scope:'Synthetic local server acknowledgements; no persisted runs'},null,2)+'\n');
 console.log(`GeoWordle clarity: ${checks} checks passed at 390 and 1440 px; no runs written.`);
}finally{await browser.close();}
