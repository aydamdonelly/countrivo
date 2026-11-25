// Local route integration: completion arrives in first HTML; never submit a game.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local only.');
if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const response=await fetch(`${base}/games/higher-or-lower/play?mode=daily`);
assert.equal(response.status,200);
const initial=(await response.text()).replaceAll('\\"','"');
const edition=initial.match(/"edition":"([^"\\]+)"/)?.[1];
const day=initial.match(/"dateKey":"([^"\\]+)"/)?.[1];
assert(edition&&day,'Live play route supplies the current date and edition');
const scores={'country-draft':'140 / 195','geo-wordle':'3 guesses','pinpoint':'920 / 1,200','blind-pick':'+7','higher-or-lower':'11 / 13','stat-guesser':'440 / 600'};
// 25 November 2026: every tile shows its game's colour frame (unplayed games must look inviting);
// a finished daily is marked by data-state="done" and its check badge, never by colour alone.
const registry=JSON.parse(readFileSync('src/data/game-registry.json','utf8'));
const order=registry.map(game=>game.slug);
const dailyOrder=registry.filter(game=>game.availableModes?.includes('daily')).map(game=>game.slug);
const noColourFrame=new Set(['flag-quiz','speed-flags','capital-quiz']);
const colourTiles=slugs=>slugs.filter(slug=>!noColourFrame.has(slug)).length;
const out='.check-render/daily-clay';mkdirSync(out,{recursive:true});
let checks=0,blockedPosts=0;
const check=(value,label)=>{assert(value,label);checks++;};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
async function contextWith({g={},d=day,e=edition,javaScriptEnabled=true,width=390,progress=false}={}){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',javaScriptEnabled});
  await context.addCookies([{name:'cv_done',value:encodeURIComponent(JSON.stringify({d,e,g})),url:base},...(progress?[{name:'cv_p_country-draft',value:encodeURIComponent(`${day}|${edition}|${Date.now().toString(36)}|m`),url:base}]:[])]);
  await context.route('**/*',route=>{if(route.request().method()==='POST'){blockedPosts++;return route.abort('blockedbyclient');}return route.continue();});
  return context;
}
try{
  for(const fixture of [
    {label:'fresh',g:{},expected:0},
    {label:'progress',g:{},progress:true,expected:0},
    {label:'zero score',g:{'country-draft':'0'},expected:1},
    {label:'today',g:scores,expected:Object.keys(scores).length},
    {label:'yesterday',g:scores,d:'2000-01-01',expected:0},
    {label:'old edition',g:scores,e:'old-color-test-edition',expected:0},
  ]){
    const context=await contextWith({...fixture,javaScriptEnabled:false});
    try{
      const page=await context.newPage();
      for(const path of ['/','/games','/practice']){
        const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});
        check(response.status()===200,`${fixture.label} ${path}: successful route`);
        const finished=await page.locator('.game-tile[data-state="done"]').count();
        check(finished===(path==='/practice'?0:fixture.expected),`${fixture.label} ${path}: daily completion state is correct in first HTML (${finished})`);
        const slugs=await page.locator('.game-tile').evaluateAll(tiles=>tiles.map(tile=>tile.dataset.game));
        const expectedOrder=path==='/'?dailyOrder:order;
        check(JSON.stringify(slugs)===JSON.stringify(expectedOrder),`${path}: cards follow the registry roster (the lead card stays in its own place on home)`);
        const colours=await page.locator('.game-tile [data-clay-tone="color"]').count();
        check(colours===colourTiles(slugs),`${fixture.label} ${path}: every tile with a colour frame shows it, played or not (${colours})`);
        check(await page.locator('.game-tile [data-clay-tone="monochrome"]').count()===0,`${path}: no tile is greyed out`);
        check(await page.locator('.game-tile [data-clay-tone="color"] img').evaluateAll(images=>images.every(image=>/-color\.webp$/.test(image.getAttribute('src')))),`${path}: completed first HTML references generated color artwork`);
        if(fixture.progress&&path==='/')check((await page.locator('.game-tile[data-game="country-draft"] .lead-chip').textContent())==='Continue','The in-progress daily is the lead card and reads Continue');
      }
    }finally{await context.close();}
  }
  for(const fixture of [
    {label:'home-mixed',width:390,path:'/',g:{'country-draft':scores['country-draft'],'geo-wordle':scores['geo-wordle'],'blind-pick':scores['blind-pick']},expected:3},
    {label:'games-complete',width:1440,path:'/games',g:scores,expected:6},
    {label:'home-complete',width:320,path:'/',g:scores,expected:6},
  ]){
    const context=await contextWith(fixture);
    try{
      const page=await context.newPage();const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('console',message=>{if(message.type()==='error'&&/hydration|did not match|server rendered/i.test(message.text()))errors.push(message.text());});
      await page.goto(base+fixture.path,{waitUntil:'domcontentloaded'});
      await page.locator('.game-tile img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
      check(await page.locator('.game-tile[data-state="done"]').count()===fixture.expected,'Hydration retains the server completion state');
      check(await page.locator('.game-tile filter').count()===0,'Hydrated cards contain no SVG tint filter');
      check(await page.locator('.game-tile [data-clay-tone="color"] img').evaluateAll(images=>images.every(image=>/-color(?:\.(?:128|256))?\.webp$/.test(new URL(image.currentSrc).pathname)&&getComputedStyle(image).filter==='none')),'Tile artwork uses decoded generated color files with no filter');
      check(await page.locator('.game-tile img').evaluateAll(images=>images.every(image=>getComputedStyle(image).filter==='none')),'No tile artwork is filtered to grey');
      if(fixture.width<768)check(await page.locator('.game-tile-main').evaluateAll(cards=>cards.every(card=>{
        const badge=card.querySelector('.tile-score');
        return !badge||badge.getBoundingClientRect().bottom+4<=card.querySelector('.clay-object').getBoundingClientRect().top;
      })),'Mobile score badges keep a reserved gap above all artwork');
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
      check(errors.length===0,`No hydration/runtime errors: ${errors.join('; ')}`);
      await page.screenshot({path:`${out}/live-${fixture.label}-${fixture.width}.png`,fullPage:true});
    }finally{await context.close();}
  }
  writeFileSync(`${out}/route-report.json`,JSON.stringify({checkedAt:new Date().toISOString(),checks,day,edition,blockedPosts},null,2)+'\n');
  console.log(`${checks} live daily-color route checks passed: first HTML, hydration, date/edition, progress and practice; all POSTs blocked.`);
}finally{await browser.close();}
