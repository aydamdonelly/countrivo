import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Local UI regression. Every POST is intercepted; game and usage state stay in memory.
const require=createRequire(import.meta.url), load=Module._load;
Module._load=function(name,parent,main){return name==='server-only'?{}:load.call(this,name,parent,main);};
const {gameModule,legacyGameModule}=require('../src/games/blind-pick/module.ts');
const {STAT_DEFINITIONS,worldRankQuality}=require('../src/lib/game-logic/blind-pick/display.ts');
const {blindView}=require('../src/server/blind-session.ts');
const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local QA only');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out='.check-render/blind-pick';mkdirSync(out,{recursive:true});
const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
const artworkSeen=new Set();
const viewportChecks=[];
let checks=0;
function check(ok,label){assert(ok,label);checks++;}
const respond=(route,value)=>route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n`});

async function fixture(viewport,{legacy=false,mode='practice',seed=71,motion='reduce'}={}){
  const context=await browser.newContext({viewport,isMobile:viewport.width<768,hasTouch:viewport.width<768,reducedMotion:motion});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const adapter=legacy?legacyGameModule:gameModule;
  let state=adapter.create(seed,mode,day),revision=0,failNext=false,hold;
  const moves=[];
  await page.route('**/*',async route=>{
    if(route.request().method()!=='POST')return route.continue();
    let args;
    try{args=JSON.parse(route.request().postData());}catch{return respond(route,{success:true});}
    const input=args[0];
    if(!['place','undo','seen'].includes(input?.action?.t))return respond(route,{success:true});
    moves.push(input.action);
    if(hold){const waiting=hold;hold=undefined;await waiting;}
    if(failNext){failNext=false;return respond(route,{success:false,view:blindView(state),sessionToken:'local-fixture',revision,error:'Local retry fixture. Your board is still here.'});}
    state=adapter.reduce(state,input.action);revision++;
    const payload=adapter.done(state)?adapter.payload(state,{mode,dateKey:day,startedAt:new Date().toISOString()}):null;
    const run=payload?{id:900123,displayName:'guest-a12bc345',gameSlug:'blind-pick',mode,dailyDate:mode==='daily'?day:null,scoreRaw:payload.scoreRaw,scoreMax:payload.scoreMax,scoreSortValue:-payload.scoreRaw,scoreNormalized:1-payload.scoreRaw/payload.scoreMax,scoreDisplay:payload.scoreDisplay,rankDaily:mode==='daily'?1:null,percentile:null,isPersonalBest:false,resultJson:payload.resultJson,completedAt:new Date().toISOString(),dailyNameCount:1,leaderboard:{available:true,entries:[],playerCount:1,gameSlug:'blind-pick',dateKey:day}}:undefined;
    return respond(route,{success:true,view:blindView(state),sessionToken:'local-fixture',revision,run,publishedName:run?.displayName});
  });
  await page.goto(`${base}/games/blind-pick/play?mode=${mode}`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{const b=document.querySelector('.bp-slot.open');return b&&Object.keys(b).some(k=>k.startsWith('__reactProps'));});
  return {page,moves,get state(){return state;},fail(){failNext=true;},hold(){let release;hold=new Promise(resolve=>{release=resolve;});return release;},async close(){check(errors.length===0,`No browser errors: ${errors.join('; ')}`);await context.close();}};
}

async function assets(page,selector='.bp-slot'){
  const images=await page.locator(`${selector} .bp-category-art img.clay-still`).evaluateAll(async els=>{
    await Promise.all(els.map(img=>img.decode().catch(()=>{})));
    return els.map(img=>({stat:img.closest('[data-stat]')?.dataset.stat,src:new URL(img.currentSrc).pathname,loaded:img.complete&&img.naturalWidth>0}));
  });
  check(images.length>0&&images.every(img=>img.loaded&&/^\/clay\/stat-[a-z0-9-]+\/rest(?:\.(?:128|256))?\.webp$/.test(img.src)),'Every category loads real Clay artwork');
  check(images.every(img=>!img.stat||img.src.includes(`/stat-${img.stat}/`)),'Clay artwork matches the category');
  images.forEach(img=>artworkSeen.add(img.src.split('/')[2].slice(5)));
}

async function geometry(page){
  return page.locator('.bp-slots').evaluate(grid=>{
    return [...grid.querySelectorAll('.bp-slot')].map(el=>{const r=el.getBoundingClientRect();return {slot:el.dataset.slot,x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height};});
  });
}
function sameGeometry(before,after,label){
  const changed=before.flatMap((a,i)=>!after[i]||a.slot!==after[i].slot||['x','y','w','h'].some(key=>Math.abs(a[key]-after[i][key])>=0.6)?[{before:a,after:after[i]}]:[]);
  check(before.length===after.length&&changed.length===0,`${label}: ${JSON.stringify(changed)}`);
}
async function noOverflow(page,label){
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label);
  check(await page.evaluate(()=>[...document.querySelectorAll('.bp-slbl,.bp-unit,.bp-placed-country,.bp-cell-name')].filter(el=>el.getBoundingClientRect().width>0).every(el=>el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=el.clientHeight+1&&getComputedStyle(el).textOverflow!=='ellipsis')),'Visible labels, units and full country names wrap without clipping');
  check(await page.evaluate(()=>{
    const context=document.createElement('canvas').getContext('2d');
    return [...document.querySelectorAll('.bp-slbl,.bp-unit')].filter(el=>el.getBoundingClientRect().width>0).every(el=>{
      const style=getComputedStyle(el);context.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      return el.textContent.split(/\s+/).every(word=>context.measureText(word).width<=el.clientWidth+1);
    });
  }),'Short category labels and units have room for complete words');
  check(await page.evaluate(()=>[...document.querySelectorAll('.bp-slot')].every(el=>{
    const heading=el.querySelector('.bp-category-heading').getBoundingClientRect(),foot=el.querySelector('.bp-slot-foot').getBoundingClientRect();
    return heading.bottom<=foot.top+1&&[...el.querySelectorAll('.bp-placed-country,.bp-rank,.bp-rank-quality')].every(child=>{const r=child.getBoundingClientRect();return r.top>=foot.top-1&&r.bottom<=foot.bottom+1;});
  })),'Category headers and country/rank footers fit without overlap');
  check(await page.evaluate(()=>[...document.querySelectorAll('.bp-card .bp-who')].every(el=>{
    const card=el.closest('.bp-card').getBoundingClientRect(),r=el.getBoundingClientRect(),name=el.querySelector('b');
    return r.top>=card.top&&r.bottom<=card.bottom&&name.scrollWidth<=name.clientWidth+1&&getComputedStyle(name).textOverflow!=='ellipsis';
  })),'The full current-country name fits its stable header');
}
async function boardInViewport(page,size,label){
  const viewport=page.viewportSize();
  if(viewport.width<375||viewport.width>=768)return;
  const result=await page.evaluate(()=>{
    const viewport=window.visualViewport,top=viewport?.offsetTop??0,left=viewport?.offsetLeft??0,bottom=top+(viewport?.height??innerHeight),right=left+(viewport?.width??innerWidth);
    const inside=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=left-1&&r.top>=top-1&&r.right<=right+1&&r.bottom<=bottom+1;};
    const slots=[...document.querySelectorAll('.bp-slot')],controls=[...document.querySelectorAll('.bp-card,.bp-undo button,.bp > .bp-scoring > summary')];
    return {scrollY,slots:slots.map(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {slot:el.dataset.slot,inside:inside(el),uncovered:hit===el||el.contains(hit),bottom:r.bottom,height:r.height};}),controls:controls.map(el=>({class:el.className,inside:inside(el)})),sticky:getComputedStyle(document.querySelector('.bp-arrive')).position==='sticky'};
  });
  check(Math.abs(result.scrollY)<1,`${label}: choosing a category never scrolls the board`);
  check(result.slots.length===size&&result.slots.every(slot=>slot.inside&&slot.uncovered),`${label}: all ${size} complete categories are visible and unobscured at ${viewport.width}x${viewport.height}: ${JSON.stringify(result.slots)}`);
  check(result.controls.every(control=>control.inside),`${label}: country, Undo and Scoring remain inside the viewport`);
  check(!result.sticky,`${label}: compact board does not depend on a sticky country overlay`);
  viewportChecks.push({viewport,state:label,size,...result});
}
async function reducedMotion(page){
  check(await page.evaluate(()=>document.querySelectorAll('.bp').length>0&&[...document.querySelector('.bp').getAnimations({subtree:true})].every(a=>Number(a.effect?.getTiming().duration)<=1)),'Reduced motion has no moving board artwork or text');
}
async function scoring(page,size){
  const detail=page.locator('details.bp-scoring');
  check(!(await detail.getAttribute('open'))&&!(await detail.evaluate(el=>el.open)),'Detailed scoring starts collapsed');
  await detail.locator('summary').focus();await page.keyboard.press('Enter');
  check(await detail.evaluate(el=>el.open),'Scoring details open with the keyboard');
  const text=await detail.innerText();
  check(text.includes('#1 = highest value')&&text.includes('available data')&&text.includes(`these same ${size} countries, each exactly once`),'Scoring explains direction, data coverage and the shared-country optimum');
  check(text.includes('top 10%')&&text.includes('bottom half')&&text.includes(`A weaker rank can still be the best fit for your ${size} countries`),'Quality is explicitly a world-rank label, not a judgment of the optimal assignment');
  check(await detail.locator('dd').count()===size,'Scoring defines every category precisely');
  await page.keyboard.press('Enter');
}
async function semantics(page,size){
  const categories=await page.locator('.bp-slot').evaluateAll(els=>els.map(el=>({stat:el.dataset.stat,label:el.getAttribute('aria-label'),unit:el.querySelector('.bp-unit')?.textContent})));
  check(categories.length===size&&categories.every(c=>c.label?.includes(STAT_DEFINITIONS[c.stat])),'Open and placed categories expose precise statistic definitions');
  check(categories.every(c=>c.unit?.length>0&&c.unit.length<=20),'Board uses short units');
  check(await page.locator('.bp-slot .bp-definition').count()===0,'Verbose definitions stay out of the main cards');
}

async function rankPresentation(page,state){
  const ranks=await page.locator('.bp-slot.placed').evaluateAll(els=>els.map(el=>{
    const number=el.querySelector('.bp-rank-number'),total=el.querySelector('.bp-rank-of'),quality=el.querySelector('.bp-rank-quality'),r=number.getBoundingClientRect(),t=total.getBoundingClientRect(),card=el.getBoundingClientRect();
    return {slot:Number(el.dataset.slot),rank:number.textContent,total:total.textContent,quality:quality.textContent,font:parseFloat(getComputedStyle(number).fontSize),labelFont:parseFloat(getComputedStyle(el.querySelector('.bp-slbl')).fontSize),inside:r.left>=card.left&&t.right<=card.right-1};
  }));
  for(const item of ranks){
    const owner=state.g.placements.indexOf(item.slot),rank=state.g.config.costMatrix[owner][item.slot],of=state.g.config.of[item.slot];
    check(item.rank===`#${rank}`&&item.total===`of ${of}`&&item.quality===worldRankQuality(rank,of),'Primary rank and its quality come from the exact confirmed country/category');
    check(item.font>=26&&item.font>=item.labelFont*1.8&&item.inside,`World rank is primary and fits: ${JSON.stringify(item)}`);
  }
}

async function prominentUndo(page){
  check(await page.locator('.bp-undo').evaluate(el=>{
    const button=el.querySelector('button').getBoundingClientRect(),country=document.querySelector('.bp-card').getBoundingClientRect(),grid=document.querySelector('.bp-slots').getBoundingClientRect();
    return button.height>=44&&button.width>=44&&button.top>=country.bottom-1&&button.bottom<=grid.top+1;
  }),'Undo retains a 44px target between the current country and category grid');
  await page.waitForFunction(()=>{
    const button=document.querySelector('.bp-undo button');
    return button.disabled||getComputedStyle(button).backgroundColor===getComputedStyle(document.querySelector('.bp-who')).color;
  });
  check(await page.locator('.bp-undo button').evaluate(button=>button.disabled||getComputedStyle(button).backgroundColor===getComputedStyle(document.querySelector('.bp-who')).color),'Available Undo settles to ink contrast instead of inheriting the lavender game accent');
}

async function scenario(viewport,{legacy=false,finalUndo=false,mode='practice'}={}){
  const {width,height}=viewport,key=`${width}x${height}`;
  const f=await fixture(viewport,{legacy,mode,seed:width<768?16:71}),{page,moves}=f;
  const size=legacy?6:8,main=!legacy&&!finalUndo;
  check(await page.locator('.bp-slot').count()===8,'New board has eight category slots');
  check(await page.locator('.bp-count').textContent()==='Country 1 of 8','Current country count remains accessible');
  check(await page.locator('.bp-rank-guide').evaluate(el=>el.firstChild.textContent==='World rank · lower is better'&&el.textContent.includes('#1 is the highest value')),'Rank guidance immediately explains which direction is better');
  await prominentUndo(page);
  check(await page.getByRole('button',{name:'Undo last pick'}).isDisabled()&&(await page.locator('#bp-undo-allowance').textContent())==='1 left','Undo starts visible with one use but requires a saved pick');
  check(await page.locator('.bp-slot.open[aria-describedby="bp-rank-guide"]').count()===8,'Choices announce rank guidance');
  check(await page.evaluate(()=>getComputedStyle(document.querySelector('.bp-slots')).gridTemplateColumns.split(' ').length)===(width<768?2:4),'Mobile keeps two columns and desktop keeps four');
  await assets(page);await semantics(page,8);await scoring(page,8);await noOverflow(page,'Initial board has no horizontal overflow');
  await page.evaluate(()=>scrollTo(0,0));await boardInViewport(page,8,'empty');
  if(main)await page.screenshot({path:`${out}/empty-${key}.png`,fullPage:true});
  const empty=await geometry(page),originalCountry=await page.locator('.bp-who b').textContent();
  const release=f.hold();await page.locator('.bp-slot.open').first().click();await page.locator('.bp-slot-pending').waitFor();
  check((await page.locator('.bp-slot-pending').textContent()).includes(originalCountry),'Held placement immediately contains the chosen country');
  check(!(await page.locator('.bp-slot-pending .bp-rank').textContent()).includes('#'),'Held placement invents no rank');
  check((await page.locator('.bp-slot-pending .bp-rank-quality').textContent())==='','Held placement invents no quality assessment');
  check(await page.locator('.bp-who b').textContent()===originalCountry,'Next country stays hidden until confirmation');
  check(await page.locator('.bp-slot.open:disabled').count()===7,'Other slots cannot race the held request');
  check(await page.getByRole('button',{name:'Undo last pick'}).isDisabled(),'Undo cannot race a held placement');
  sameGeometry(empty,await geometry(page),'Empty and pending cards keep identical bounds');await reducedMotion(page);
  await boardInViewport(page,8,'placement pending');
  if(main)await page.screenshot({path:`${out}/pending-${key}.png`,fullPage:true});
  release();await page.waitForFunction(n=>document.querySelector('.bp-count')?.textContent===`Country 2 of ${n}`,size);
  check(await page.locator('.bp-slot').count()===size,'Confirmed board respects current or legacy size');
  check((await page.locator('.bp-slot.placed .bp-rank').first().textContent()).startsWith('#'),'Rank appears after confirmation');
  await rankPresentation(page,f.state);
  if(!legacy)await prominentUndo(page);
  await boardInViewport(page,size,'placement confirmed');
  if(!legacy)sameGeometry(empty,await geometry(page),'Pending and confirmed cards keep identical bounds');
  await assets(page);await semantics(page,size);await reducedMotion(page);
  if(main)await page.screenshot({path:`${out}/board-${key}.png`,fullPage:true});
  if(main){
    const current=await page.locator('.bp-who b').textContent(),before=await geometry(page);
    if(width<768)check(current==='Saint Vincent and the Grenadines','Mobile fixture exercises a full long country name');
    f.fail();const retryRelease=f.hold();await page.locator('.bp-slot.open').first().click();await page.locator('.bp-slot-pending').waitFor();
    sameGeometry(before,await geometry(page),'Long-country pending footer preserves every card bound');await noOverflow(page,'Long country fits the pending board');
    await boardInViewport(page,size,'long-country pending');
    if(width<768)await page.screenshot({path:`${out}/long-country-pending-${key}.png`,fullPage:true});
    retryRelease();await page.getByRole('alert').waitFor();
    check(await page.locator('.bp-who b').textContent()===current,'Failed placement retains the current country');
    check(await page.locator('.bp-slot.placed').count()===1,'Failed placement retains the saved board');
    check(await page.locator('.bp-slot[data-feedback]').count()===0,'Failed placement has no success effect');
    sameGeometry(before,await geometry(page),'Error recovery preserves card bounds');
    await boardInViewport(page,size,'placement error');
    const failed=moves.at(-1);await page.getByRole('button',{name:'Try again',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.bp-slot.placed').length===2);
    check(JSON.stringify(moves.at(-1))===JSON.stringify(failed),'Retry sends the same intended placement');
    sameGeometry(before,await geometry(page),'Saved long country preserves card bounds');await noOverflow(page,'Saved long country fits its card');
    await boardInViewport(page,size,'long-country confirmed');
    const undoRelease=f.hold();await page.getByRole('button',{name:'Undo last pick'}).click();await page.locator('.bp-lifting').waitFor();
    check(await page.locator('.bp-slot.placed').count()===2,'Held undo retains both saved placements until confirmation');
    sameGeometry(before,await geometry(page),'Held undo preserves card bounds');await reducedMotion(page);
    await boardInViewport(page,size,'undo pending');
    undoRelease();await page.waitForFunction(()=>document.querySelectorAll('.bp-slot.placed').length===1);
    check((await page.locator('.bp-undo').textContent()).includes('Undo used'),'Undo allowance is visibly spent');
    check((await page.locator('#bp-undo-allowance').textContent())==='0 left','Spent undo clearly shows no uses remain');
    check(await page.getByRole('button',{name:'Undo last pick'}).isDisabled(),'Second undo is disabled');
    check(await page.locator('.bp-who b').textContent()===current,'Undo returns the same country for reassignment');
    check(await page.locator('.bp-slot[data-feedback="placed"]').count()===0,'Undo never replays placement on a retained slot');
    check(await page.locator('.bp-slot.open[data-feedback="undone"]').count()===1,'Undo feedback belongs to the cleared slot only');
    check((await page.locator('.bp-announcement').textContent())===`${current} returned. Choose a category again. Undo used.`,'Undo announcement describes the returned country');
    sameGeometry(before,await geometry(page),'Confirmed undo preserves card bounds');
    await boardInViewport(page,size,'undo confirmed');
    await page.screenshot({path:`${out}/undo-${key}.png`,fullPage:true});
  }
  if(legacy)check(await page.locator('.bp-undo').count()===0,'Legacy six-country board has no undo');
  while(f.state.g.placements.length<size){
    const before=f.state.g.placements.length;await page.locator('.bp-slot.open').first().click();
    await page.waitForFunction(count=>document.querySelectorAll('.bp-slot.placed').length===count,before+1);
  }
  check(await page.getByRole('button',{name:'See result',exact:true}).isVisible(),'Completed board waits for explicit result reveal');
  await boardInViewport(page,size,'all placed');
  await rankPresentation(page,f.state);
  check(await page.locator('.bp-result').count()===0&&!moves.some(a=>a.t==='seen'),'Final placement does not reveal the result automatically');
  if(finalUndo){
    await page.getByRole('button',{name:'Undo last pick'}).click();await page.waitForFunction(()=>document.querySelectorAll('.bp-slot.placed').length===7);
    check(await page.locator('.bp-count').textContent()==='Country 8 of 8','Final-choice undo returns the eighth country');
    check(await page.getByRole('button',{name:'Undo last pick'}).isDisabled(),'Final-choice undo spends the allowance');
    await page.locator('.bp-slot.open').first().click();await page.getByRole('button',{name:'See result',exact:true}).waitFor();
  }
  await page.getByRole('button',{name:'See result',exact:true}).click();await page.locator('.bp-result').waitFor();
  check((await page.locator('.leaderboard-entry').textContent()).includes('Saved automatically as guest-a12bc345'),'Result saves under the guest name');
  check(await page.locator('.site-feedback-result').isVisible(),'Result keeps the prominent feedback invitation');
  check(await page.locator('.bp-ov .bp-unit').count()===size,'Result retains each category and its short unit');
  check(await page.locator('.bp-cell-name').count()===size*2,'Result explicitly names both chosen and best-fit countries');
  await assets(page,'.bp-ovrow');await scoring(page,size);await noOverflow(page,'Result has no horizontal overflow');
  check(await page.evaluate(()=>document.querySelector('.rp-feedback').compareDocumentPosition(document.querySelector('.rp-primary'))&Node.DOCUMENT_POSITION_FOLLOWING),'Feedback precedes the entry form');
  await page.screenshot({path:`${out}/${legacy?'legacy-6':finalUndo?'final-undo':mode}-${key}.png`,fullPage:true});
  await f.close();
}

// Freeze real CSS animations, then compare card/text geometry at start, contact and rest.
async function freezeMotion(page,names){
  await page.waitForFunction(expected=>{
    const animations=document.querySelector('.bp')?.getAnimations({subtree:true})??[];
    if(!expected.every(name=>animations.some(a=>a.animationName===name)))return false;
    window.blindPickAnimations=animations.filter(a=>a.animationName?.startsWith('bp-'));
    for(const animation of window.blindPickAnimations){animation.pause();animation.currentTime=0;}
    return true;
  },names);
  const targets=await page.evaluate(()=>window.blindPickAnimations.map(a=>({name:a.animationName,art:a.effect.target.matches('.flag,.bp-category-art')})));
  check(targets.length>0&&targets.every(a=>a.art),'Motion targets whole flag/Clay artwork only');
}
async function frame(page,time){
  return page.evaluate(async time=>{
    for(const animation of window.blindPickAnimations)animation.currentTime=time;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const rects=selector=>[...document.querySelectorAll(selector)].map(el=>{const r=el.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height];});
    return {cards:rects('.bp-slot'),text:rects('.bp-who,.bp-slbl,.bp-unit,.bp-placed-country b,.bp-rank,.bp-rank-quality,.bp-undo-label'),art:window.blindPickAnimations.map(a=>getComputedStyle(a.effect.target).transform)};
  },time);
}
function stationary(a,b,label){
  check(['cards','text'].every(key=>a[key].length===b[key].length&&a[key].every((rect,i)=>rect.every((value,j)=>Math.abs(value-b[key][i][j])<0.6))),label);
  check(JSON.stringify(a.art)!==JSON.stringify(b.art),'Artwork visibly changes across the motion frames');
}
async function finishMotion(page){await page.evaluate(()=>{for(const a of window.blindPickAnimations??[])a.finish();});}
async function motionScenario(){
  const f=await fixture({width:390,height:664},{seed:72,motion:'no-preference'}),{page}=f;
  const release=f.hold();await page.locator('.bp-slot.open').first().click();
  await freezeMotion(page,['bp-clay-press','bp-deal']);
  const pendingStart=await frame(page,0),pendingContact=await frame(page,100);
  stationary(pendingStart,pendingContact,'Held-placement press keeps all text and card bounds stationary');
  await page.screenshot({path:`${out}/motion-pending-contact-390.png`,fullPage:true});
  release();await freezeMotion(page,['bp-place','bp-arrival']);await assets(page);
  const landedStart=await frame(page,0),landedContact=await frame(page,156);
  stationary(landedStart,landedContact,'Placement contact moves artwork while all text and cards stay stationary');
  await page.screenshot({path:`${out}/motion-place-contact-390.png`,fullPage:true});
  const landedRest=await frame(page,260);stationary(landedStart,landedRest,'Placement settles without moving text or cards');
  await page.screenshot({path:`${out}/motion-place-settled-390.png`,fullPage:true});await finishMotion(page);
  await page.locator('.bp-slot.open').first().click();await freezeMotion(page,['bp-place','bp-arrival']);await finishMotion(page);
  const current=await page.locator('.bp-slot[data-slot="1"] .bp-placed-country b').textContent();
  const undoRelease=f.hold();await page.getByRole('button',{name:'Undo last pick'}).click();
  await freezeMotion(page,['bp-lift']);const liftStart=await frame(page,0),liftEnd=await frame(page,220);
  stationary(liftStart,liftEnd,'Undo lift moves the flag while text and cards stay stationary');
  await page.screenshot({path:`${out}/motion-undo-lift-390.png`,fullPage:true});
  undoRelease();await freezeMotion(page,['bp-return','bp-release']);
  check(await page.locator('.bp-slot[data-slot="0"][data-feedback="placed"]').count()===0,'Retained slot has no false placement marker after undo');
  check(await page.locator('.bp-slot[data-slot="0"]').evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.animationName!=='bp-place')),'Retained slot does not replay a placement animation after undo');
  check(await page.locator('.bp-who b').textContent()===current,'Normal-motion undo restores the actual returned country');
  const returnStart=await frame(page,0),returnContact=await frame(page,140);
  stationary(returnStart,returnContact,'Returned flag and released Clay move without moving text or cards');
  await page.screenshot({path:`${out}/motion-undo-return-390.png`,fullPage:true});
  const returnRest=await frame(page,280);stationary(returnStart,returnRest,'Undo settles without shifting text or cards');
  await page.screenshot({path:`${out}/motion-undo-settled-390.png`,fullPage:true});await finishMotion(page);
  await noOverflow(page,'Normal-motion board has no overflow');await f.close();
}
try{
  for(const viewport of [{width:320,height:568},{width:375,height:667},{width:390,height:664},{width:390,height:844},{width:1440,height:900}])await scenario(viewport);
  await scenario({width:390,height:664},{finalUndo:true,mode:'daily'});
  await scenario({width:390,height:844},{legacy:true});
  await motionScenario();
  // Boards dated from the rotation on draw from twelve statistics, so the fixtures prove coverage, not one fixed set.
  check(artworkSeen.size>=8&&[...artworkSeen].every(stat=>Object.hasOwn(STAT_DEFINITIONS,stat)),'Deterministic fixtures load Clay artwork for every dealt statistic');
  writeFileSync(`${out}/report.json`,JSON.stringify({checkedAt:new Date().toISOString(),checks,noDatabaseWrites:true,viewportChecks},null,2)+'\n');
  console.log(`Blind Pick UI: ${checks} checks passed; all POSTs intercepted, no writes. Screenshots: ${out}`);
}finally{await browser.close();}
