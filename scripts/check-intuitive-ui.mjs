import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out='.check-render/intuitive';mkdirSync(out,{recursive:true});
const results=[];let checks=0;
function check(ok,label){assert(ok,label);checks++;}
function visibleWords(){
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let text='';
 for(let node=walker.nextNode();node;node=walker.nextNode()){
  const parent=node.parentElement;if(!parent||parent.closest('script,style,.sr-only,nextjs-portal'))continue;
  let hidden=false;
  for(let element=parent;element;element=element.parentElement){
   if(element.tagName==='DETAILS'&&!element.open&&!element.querySelector(':scope > summary')?.contains(parent)){hidden=true;break;}
   if(element.hasAttribute('popover')&&!element.matches(':popover-open')){hidden=true;break;}
  }
  if(hidden)continue;
  const range=document.createRange();range.selectNode(node);const box=range.getBoundingClientRect();
  if(box.width>1&&box.height>1)text+=' '+node.textContent;
 }
 return text.trim().split(/\s+/).filter(Boolean).length;
}
try {
 for(const width of [320,390,1440]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
  page.setDefaultTimeout(15000);let posts=0;const errors=[];
  page.on('request',request=>{if(request.method()==='POST'&&request.headers()['next-action'])posts++;});
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{if(route.request().method()==='POST'&&route.request().headers()['next-action'])await route.abort();else await route.continue();});
  for(const [name,path] of [['home','/'],['practice','/practice'],...['country-draft','flag-quiz','higher-or-lower','stat-guesser','geo-wordle','pinpoint','blind-pick','speed-flags'].map(slug=>[slug,`/games/${slug}/play?mode=practice`])]) {
   const response=await page.goto(base+path,{waitUntil:'networkidle'});
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>{const r=image.getBoundingClientRect();return image.checkVisibility()&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}).map(image=>image.decode().catch(()=>{})));});
   check(response?.status()===200,`${name}@${width} HTTP`);
   check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),`${name}@${width} no overflow`);
   const words=await page.evaluate(visibleWords);
   check(words<110,`${name}@${width} must stay concise, got ${words} visible words`);
   if(name==='home'){check(await page.locator('.game-tile-main').count()===6,'Home shows six direct game choices');check(await page.locator('.daily-game-grid .game-tile-actions a').count()===12,'Each daily game has Practice and Archive');}
   if(name==='country-draft'){check(await page.locator('.dr-country-card').count()===3,'Draft immediately displays choices');check(await page.locator('.dr-help-details[open]').count()===0,'Draft rules do not block playing');}
   const help=page.locator('.game-help-trigger');
   if(await help.count()&&await help.isVisible()) {
    await help.click();check(await page.locator('.game-help-panel:popover-open').count()===1,'Help opens natively');
    await page.keyboard.press('h');await page.keyboard.press('n');await page.keyboard.press('1');
    check(posts===0,'Reading help cannot trigger game moves');
    await page.keyboard.press('Escape');check(await page.locator(':popover-open').count()===0,'Escape closes help');
    check(await help.evaluate(element=>element===document.activeElement),'Help restores keyboard focus');
   }
   await page.screenshot({path:`${out}/${name}-${width}.png`,animations:'disabled'});
   results.push({name,width,words});
   console.log(`${name}@${width}: ${words} visible words`);
  }
  check(posts===0,'Visual review writes no game runs');check(errors.length===0,`No runtime errors @${width}: ${errors.join('; ')}`);
  await context.close();
 }
 writeFileSync(`${out}/report.json`,JSON.stringify({checks,results},null,2)+'\n');
 console.log(`Intuitive UI: ${checks} checks passed. Visible words per initial screen: ${Math.min(...results.map(row=>row.words))}–${Math.max(...results.map(row=>row.words))}. No game runs written.`);
} finally {await browser.close();}
