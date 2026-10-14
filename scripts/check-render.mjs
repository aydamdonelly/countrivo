// Regression checks for the October Table redesign. Visual walkthroughs use Chrome's extension.
// PLAYWRIGHT_MODULE points to an existing playwright-core installation; no repo dependency is added.
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const modulePath=process.env.PLAYWRIGHT_MODULE;
if(!modulePath)throw new Error('Set PLAYWRIGHT_MODULE to the installed playwright-core/index.mjs path.');
const {chromium}=await import(pathToFileURL(modulePath).href);
const args=process.argv.slice(2);
const option=(name,fallback)=>{const index=args.indexOf(name);return index>=0?args[index+1]:fallback;};
const base=option('--base','http://localhost:3290');
const out=option('--out','.check-render/table');
const readOnly=args.includes('--read-only');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
let checks=0,failures=0;
const results=[];
function check(ok,label,details=''){checks++;results.push({ok,label,details});if(!ok){failures++;console.error(`FAIL ${label}: ${details}`);}}
const routes=['/','/practice','/games','/countries','/countries/portugal','/categories','/categories/population','/lists/countries-in-africa','/leaderboard','/archive','/about','/sources','/privacy','/terms','/support','/imprint'];
async function settled(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).filter(image=>{const r=image.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}).map(image=>image.decode().catch(()=>undefined)));});}
for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  for(const route of routes){
    const errors=[];const handle=(error)=>errors.push(error.message);page.on('pageerror',handle);
    const response=await page.goto(base+route,{waitUntil:'networkidle'});
    await settled(page);
    const label=`${route} @${width}`;
    check(response?.status()===200,label+' HTTP',String(response?.status()));
    const measured=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,badLinks:Array.from(document.querySelectorAll('a[href]')).filter(a=>/\/(auth|friends|profile)(\/|$)/.test(new URL(a.href,location.href).pathname)).map(a=>a.textContent),broken:Array.from(document.images).filter(image=>{const r=image.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0&&!image.naturalWidth;}).map(image=>image.getAttribute('src'))}));
    check(!measured.overflow,label+' no page overflow');
    check(!measured.badLinks.length,label+' no account navigation',measured.badLinks.join(','));
    check(!measured.broken.length,label+' visible assets loaded',measured.broken.join(','));
    check(!errors.length,label+' browser runtime',errors.join(';'));
    if(['/','/countries/portugal','/leaderboard','/lists/countries-in-africa'].includes(route))await page.screenshot({path:path.join(out,`${route.replaceAll('/','_')||'home'}-${width}.png`),animations:'disabled'});
    page.off('pageerror',handle);
  }
  console.log(`checked editorial surfaces @${width}`);
  await context.close();
}
const daily=['country-draft','geo-wordle','pinpoint','flag-quiz','higher-or-lower','stat-guesser'];
for (const width of [320,390]) {
const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
const page=await context.newPage();
for(const slug of [...daily,'blind-pick','speed-flags']){
  const route=`/games/${slug}/play?mode=${daily.includes(slug)?'daily':'practice'}`;
  const response=await page.goto(base+route,{waitUntil:'networkidle'});await settled(page);
  check(response?.status()===200,`${slug} play HTTP @${width}`);
  check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),`${slug} play fits phone @${width}`);
  await page.screenshot({path:path.join(out,`${slug}-${width}.png`),animations:'disabled'});
  if(daily.includes(slug)&&width===390){
    await page.emulateMedia({colorScheme:'light'});await settled(page);
    const light=await page.screenshot({animations:'disabled'});
    await page.emulateMedia({colorScheme:'dark'});await settled(page);
    const dark=await page.screenshot({animations:'disabled'});
    check(light.equals(dark),slug+' single theme');
  }
}
await context.close();
}
const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
const plain=await noJs.newPage();
for(const slug of ['country-draft','geo-wordle','flag-quiz','higher-or-lower','stat-guesser','blind-pick']){
  await plain.goto(`${base}/games/${slug}/play?mode=practice`,{waitUntil:'networkidle'});
  const controls=plain.locator('.no-script-controls');
  check(await controls.isVisible(),slug+' no-JS controls visible');
  check(await controls.locator('form[action]').count()>0,slug+' no-JS server form');
  if(slug==='country-draft'&&!readOnly){
    await controls.getByRole('button',{name:'Open country',exact:true}).click();
    await plain.waitForLoadState('networkidle');
    check(await plain.getByText('Choose a person',{exact:false}).count()>0,'Draft no-JS practice resumes chosen country');
  }
  if(slug==='flag-quiz'&&!readOnly){
    await controls.locator('form button').first().click();await plain.waitForLoadState('networkidle');
    check(await plain.getByRole('button',{name:'Next',exact:true}).count()>0,'Flag no-JS reveal after commit');
  }
}
await noJs.close();
writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,failures,results},null,2)+'\n');
console.log(`check-render: ${checks} checks, ${failures} failures`);
await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
process.exit(failures?1:0);
