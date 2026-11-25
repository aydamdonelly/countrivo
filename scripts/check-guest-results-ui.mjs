import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local QA only');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out='.check-render/guest-results';mkdirSync(out,{recursive:true});
let checks=0;
function check(ok,label){assert(ok,label);checks++;}
const respond=(route,value)=>route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n`});
try{
 for(const width of [320,390,1440])for(const mode of ['daily','practice']){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let name='guest-a12bc345',posts=0,fail=false;
  const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
  const run=()=>({id:991234,displayName:name,gameSlug:'flag-quiz',mode,dailyDate:mode==='daily'?day:null,scoreRaw:10,scoreMax:13,scoreSortValue:10,scoreNormalized:10/13,scoreDisplay:'10 / 13',rankDaily:mode==='daily'?1:null,percentile:null,isPersonalBest:false,resultJson:{},completedAt:new Date().toISOString(),dailyNameCount:1,leaderboard:{available:true,entries:[],playerCount:1,gameSlug:'flag-quiz',dateKey:day}});
  await page.route('**/*',async route=>{
   if(route.request().method()!=='POST')return route.continue();
   posts++;
   const args=JSON.parse(route.request().postData());
   if(args[0]&&typeof args[0]==='object')return respond(route,{success:true,view:{kind:'flag-quiz',mode,phase:'finished',round:10,total:10,score:'10 / 13',progress:{done:10,total:10,label:'score',value:'10'},shareText:'Local QA',history:[],flagSrc:'',options:[],picked:null,correctIndex:null,fact:null,source:null,doubled:false},run:run(),publishedName:name,sessionToken:'local-fixture',revision:1});
   if(fail){fail=false;return respond(route,{success:false,error:'Connection interrupted. Try again.'});}
   name=args[1]?.trim()||'guest-a12bc345';
   return respond(route,{success:true,run:run(),publishedName:name});
  });
  await page.goto(`${base}/games/flag-quiz/play?mode=${mode}`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>{const b=document.querySelector('.fq-opt');return b&&Object.keys(b).some(k=>k.startsWith('__reactProps'));});
  await page.locator('.fq-opt').first().click();
  const entry=page.locator('.leaderboard-entry');await entry.waitFor();
  const input=entry.locator('input[name=displayName]');
  check(await input.isVisible(),'Guest can immediately enter an optional name');
  check(await input.getAttribute('required')===null,'No mandatory name');
  check((await entry.textContent()).includes('Saved automatically as guest-a12bc345'),'Automatic persistence is explicit');
  check(posts===1,'Result UI does not need another publication request');
  check(mode==='daily'?(await entry.textContent()).includes('You’re #1 of 1'):!(await entry.textContent()).includes('You’re #'),'Only daily results have a rank');
  await entry.getByRole('button',{name:'Save name',exact:true}).click();
  await entry.locator('.standing-name b').getByText('guest-a12bc345',{exact:true}).waitFor();
  check((await entry.textContent()).includes('guest-a12bc345'),'Blank name keeps the saved guest');
  await entry.locator('.name-management summary').click();
  await entry.getByRole('button',{name:'Change name',exact:true}).click();
  await input.fill('Player Test');fail=true;
  await entry.getByRole('button',{name:'Save name',exact:true}).click();
  await entry.getByRole('alert').waitFor();
  check(await input.inputValue()==='Player Test','Failed rename retains the draft');
  await entry.getByRole('button',{name:'Save name',exact:true}).click();
  await entry.locator('.standing-name b').getByText('Player Test',{exact:true}).waitFor();
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  const feedback=page.locator('.site-feedback-result');
  check(await feedback.isVisible(),'Result feedback invitation is visible');
  check(await feedback.getAttribute('aria-label')==='Give feedback','Feedback CTA is present');
  await feedback.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/${mode}-${width}.png`,fullPage:true});
  check(errors.length===0,`No client errors: ${errors.join('; ')}`);
  await context.close();
 }
 console.log(`Guest result UI: ${checks} checks passed; all POSTs intercepted, no writes.`);
}finally{await browser.close();}
