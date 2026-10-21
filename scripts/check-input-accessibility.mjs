// Local UI regressions. Every POST is intercepted; no runs, reports or blocks are persisted.
import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url), load = Module._load;
Module._load = function(name, parent, main) { return name === 'server-only' ? {} : load.call(this, name, parent, main); };
const {gameModule: higher} = require('../src/games/higher-or-lower/module.ts');
const {higherView} = require('../src/server/quick-sessions.ts');
const {gameModule: geo} = require('../src/games/geo-wordle/module.ts');
const {geoWordleView} = require('../src/lib/game-logic/geo-wordle/engine.ts');
Module._load = load;
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local QA only');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs');
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out = '.check-render/input-accessibility'; mkdirSync(out,{recursive:true});
const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}), page = await context.newPage();
page.setDefaultTimeout(20000);
let checks=0, posts=0, handler=null; const errors=[], results=[];
const check=(ok,label)=>{assert(ok,label);checks++;};
page.on('pageerror',error=>errors.push(error.message));
const respond=(route,value)=>route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n`});
await page.route('**/*',async route=>{
 const request=route.request();
 if(request.method()==='POST') { posts++; return request.headers()['next-action'] && handler ? handler(route,request) : route.abort('failed'); }
 if(new URL(request.url()).origin!==new URL(base).origin)return route.abort();
 return route.continue();
});
async function open(path,selector) {
 handler=null; await page.goto(base+path,{waitUntil:'networkidle'});
 await page.waitForFunction(selector=>{const element=document.querySelector(selector);return element&&Object.keys(element).some(key=>key.startsWith('__reactProps'));},selector);
}
try {
 await open('/games/geo-wordle/play?mode=practice','#geo-guess');
 const input=page.getByRole('combobox',{name:'Country',exact:true});
 check((await page.locator('.gw-start').textContent()).includes('hidden country in 6 guesses'),'GeoWordle names the goal and attempt limit');
 let before=posts;
 await input.fill('con'); await input.press('Shift+Tab');
 check(await input.inputValue()==='con','Shift+Tab preserves partial country text');
 check(await input.evaluate(element=>document.activeElement!==element),'Shift+Tab moves focus backwards');
 await input.focus(); await input.press('Tab');
 check(await input.inputValue()==='con','Tab preserves partial country text');
 check(await input.evaluate(element=>document.activeElement!==element),'Tab moves focus onwards');
 await input.fill('France'); await page.getByRole('option',{name:'France',exact:true}).click();
 check(await input.inputValue()==='France','Pointer suggestion fills the input');
 check(posts===before,'Pointer suggestion does not commit a guess');
 let geoState={answerIso3:'PRK',guesses:[],clueAt:null,phase:'playing'};
 handler=async(route,request)=>{
  const [{action}]=JSON.parse(request.postData());
  geoState=geo.reduce(geoState,action);
  return respond(route,{success:true,view:geoWordleView(geoState),revision:posts,sessionToken:'local-input-fixture'});
 };
 await input.press('Enter'); await page.locator('.gw-row:not(.gw-pending)').waitFor();
 check(posts===before+1,'Enter after choosing explicitly commits once');
 await input.fill('Japan'); await input.press('ArrowDown'); await input.press('Enter');
 check(await input.inputValue()==='Japan' && posts===before+1,'Keyboard suggestion fills without committing');
 await page.getByRole('button',{name:'Guess',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.gw-row:not(.gw-pending)').length===2);
 check(posts===before+2,'Guess explicitly commits the selected country once');
 await page.screenshot({path:`${out}/geo-confirmed-selection.png`,fullPage:true});

 await open('/games/stat-guesser/play?mode=practice','[role=slider]');
 const slider=page.getByRole('slider');
 const initial=await slider.getAttribute('aria-valuenow');
 await page.getByRole('button',{name:'How to play Stat Guesser',exact:true}).focus();
 await page.keyboard.press('ArrowRight'); await page.keyboard.press('Home'); await page.keyboard.press('End');
 check(await slider.getAttribute('aria-valuenow')===initial,'Stat navigation keys outside slider do not alter a guess');
 await slider.focus(); await slider.press('ArrowRight');
 check(await slider.getAttribute('aria-valuenow')!==initial,'Focused slider responds to ArrowRight');
 await slider.press('Home'); check(await slider.getAttribute('aria-valuenow')==='0','Focused slider Home reaches minimum');
 await slider.press('End'); check(await slider.getAttribute('aria-valuenow')===await slider.getAttribute('aria-valuemax'),'Focused slider End reaches maximum');
 await page.screenshot({path:`${out}/stat-focused-controls.png`,fullPage:true});

 await open('/games/higher-or-lower/play?mode=practice','.qr-call');
 before=posts;
 await page.getByRole('button',{name:'How to play Higher or Lower',exact:true}).focus();
 for(const key of ['h','l','n','1','ArrowUp','ArrowDown'])await page.keyboard.press(key);
 check(posts===before,'Higher/Lower never commits global shortcut keys from Help');
 let higherState=higher.create(73,'daily','2026-10-20');
 handler=async(route,request)=>{
  const [{action}]=JSON.parse(request.postData());
  higherState=higher.reduce(higherState,action.t==='next'?{t:'advance',ui:true}:action);
  return respond(route,{success:true,view:higherView(higherState,'practice','2026-10-20'),revision:posts,sessionToken:'local-higher-fixture'});
 };
 await page.getByRole('button',{name:'Higher',exact:true}).focus(); await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Next',exact:true}).waitFor();
 await page.waitForFunction(()=>document.activeElement?.closest('.qr-call-controls')?.textContent==='Next');
 check(posts===before+1,'Native answer activation commits once');
 check(await page.locator('.qr-higher [role=status]').textContent()!=='','Higher/Lower announces its revealed outcome');
 check(await page.locator('.qr-info > p').isVisible(),'Comparison explanation is visible without opening details');
 check(await page.getByRole('button',{name:'Next',exact:true}).evaluate(element=>document.activeElement===element),'Keyboard reveal focuses Next');
 await page.keyboard.press('Enter'); await page.getByRole('button',{name:'Higher',exact:true}).waitFor();
 await page.waitForFunction(()=>document.activeElement?.matches('.qr-call:not([disabled])'));
 check(await page.getByRole('button',{name:'Higher',exact:true}).evaluate(element=>document.activeElement===element),'Keyboard Next focuses a choice in the new round');

 for(const slug of ['country-draft','blind-pick']) {
  await open(`/games/${slug}/play?mode=practice`,slug==='country-draft'?'.dr-country-card':'.bp-slot.open');
  before=posts; await page.locator('main a[href]').first().focus();
  for(const key of ['1','2','n'])await page.keyboard.press(key);
  check(posts===before,`${slug} ignores global character keys`);
 }

 await open('/games/flag-quiz/leaderboard?date=2026-10-19','.lb-report');
 const trigger=page.locator('.lb-report[aria-label^="Report or block"]').first();
 check(await trigger.count()===1,'Existing read-only board supplies a report-control fixture');
 await trigger.focus(); await page.keyboard.press('Enter');
 const panel=page.getByRole('form',{name:/Report or block/});
 await page.waitForFunction(()=>document.activeElement?.matches('.lb-report-form select'));
 check(await panel.locator('select').evaluate(element=>document.activeElement===element),'Report opens with focus in its reason select');
 check(await trigger.getAttribute('aria-expanded')==='true','Report trigger exposes expanded state');
 await panel.getByRole('button',{name:'Close',exact:true}).click();
 check(await trigger.evaluate(element=>document.activeElement===element),'Closing report restores the original trigger');
 await trigger.press('Enter');
 await page.waitForFunction(()=>document.activeElement?.matches('.lb-report-form select'));
 await page.keyboard.press('Escape');
 check(await trigger.evaluate(element=>document.activeElement===element),'Escape restores report trigger focus');
 before=posts; handler=route=>respond(route,{success:true});
 await trigger.press('Enter');
 await page.waitForFunction(()=>document.activeElement?.matches('.lb-report-form select'));
 await panel.getByRole('button',{name:'Send report',exact:true}).click();
 await panel.getByRole('status').waitFor();
 await page.waitForFunction(()=>document.activeElement?.textContent==='Block player');
 check(posts===before+1,'Report acknowledgement is mocked locally');
 check(await panel.getByRole('button',{name:'Block player',exact:true}).evaluate(element=>document.activeElement===element),'Successful report moves keyboard focus to Block player');
 await panel.getByRole('button',{name:'Close',exact:true}).click();

 const countries=JSON.parse(readFileSync('src/data/countries.json','utf8'));
 const longNames=['VCT','CAF','BIH','ATG'].map(iso3=>countries.find(country=>country.iso3===iso3).displayName);
 for(const slug of ['flag-quiz','speed-flags']) {
  await page.setViewportSize({width:320,height:568});
  await open(`/games/${slug}/play?mode=practice`,slug==='flag-quiz'?'.fq-opt':'.sf-start');
  if(slug==='speed-flags')await page.getByRole('button',{name:'Start',exact:true}).click();
  check(await page.getByAltText('Flag to identify',{exact:true}).isVisible(),`${slug} gives the quiz image a neutral accessible identity`);
  const selector=slug==='flag-quiz'?'.fq-opt':'.sf-opt';
  for(const textPercent of [100,200]) {
   await page.evaluate(({selector,longNames,textPercent})=>{
    document.querySelectorAll(`${selector} .lbl`).forEach((label,index)=>{label.textContent=longNames[index%longNames.length];});
    document.querySelectorAll(selector).forEach(element=>{element.style.fontSize=`${16*textPercent/100}px`;});
   },{selector,longNames,textPercent});
   const layout=await page.locator(selector).evaluateAll(buttons=>buttons.map(button=>{const label=button.querySelector('.lbl');return{text:label.textContent,labelFits:label.scrollWidth<=label.clientWidth+1,right:button.getBoundingClientRect().right,height:button.getBoundingClientRect().height};}));
   check(layout.every(row=>row.labelFits&&row.right<=320&&row.height>=44),`${slug}: full country labels fit320px at${textPercent}% text`);
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${slug}: no horizontal overflow at${textPercent}% text`);
   results.push({slug,viewport:320,textPercent,layout,fixture:'Actual local component and CSS; names replaced with real sovereign-pool names without game actions.'});
   await page.screenshot({path:`${out}/${slug}-long-labels-${textPercent}pct.png`,fullPage:true});
  }
 }
 check(errors.length===0,`No browser errors: ${errors.join('; ')}`);
 writeFileSync(`${out}/report.json`,JSON.stringify({checks,posts,realMutationPosts:0,scope:'Local UI; every POST intercepted, report success and game acknowledgements synthetic. Country-label layout uses actual current component CSS with genuine pool names.',results},null,2)+'\n');
 console.log(`Input accessibility: ${checks} checks passed; ${posts} intercepted POSTs, zero persisted mutations.`);
} finally {await context.close();await browser.close();}
