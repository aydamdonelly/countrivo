// Local browser transport checks. All POSTs intercepted; no analytics or feedback writes.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local QA only.');
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
let checks=0;
function check(value,label){assert(value,label);checks++;}
const respond=(route,value)=>route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n`});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const batches=[],errors=[];
  let feedbackPosts=0;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
    if(route.request().method()!=='POST')return route.continue();
    if(!route.request().headers()['next-action'])return route.abort('blockedbyclient');
    let body;
    try{body=JSON.parse(route.request().postData()??'null');}catch{return route.abort('blockedbyclient');}
    if(Array.isArray(body?.[0])&&body[0].every(event=>event.id&&event.event)){
      batches.push(body[0]);
      return respond(route,batches.length!==1);
    }
    if(body?.[0]?.message){feedbackPosts++;return respond(route,{success:true});}
    return route.abort('blockedbyclient');
  });
  await page.goto(base,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Give feedback',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'We’re listening.',exact:true});
  await dialog.getByRole('textbox',{name:'What should we improve?',exact:true}).fill('PRIVATE_QA_TEXT_MUST_NOT_ENTER_USAGE');
  // Analytics must stay out of the server-action queue while the player is typing.
  await page.waitForTimeout(6000);
  check(batches.length===0,'No telemetry request while feedback text is focused');
  const queued=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('cv_usage_queue')??'[]'));
  check(queued.some(event=>event.event==='page_view')&&queued.some(event=>event.event==='feedback_open'),'Page view and invitation are queued');
  check(!JSON.stringify(queued).includes('PRIVATE_QA'),'Typed text never enters the pending queue');
  await dialog.getByRole('button',{name:'Send feedback',exact:true}).click();
  const success=page.getByRole('dialog',{name:'That’s in. Thank you.',exact:true});
  await success.waitFor();
  check(feedbackPosts===1&&batches.length===0,'Feedback mutation runs before optional telemetry');
  await success.getByRole('button',{name:'Back to games',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(sessionStorage.getItem('cv_usage_queue')??'[]').length===0,{},{timeout:20000});
  check(batches.length===2,'Failed telemetry batch retries once and clears after acknowledgement');
  check(JSON.stringify(batches[0])===JSON.stringify(batches[1]),'Retry keeps event identifiers and payload stable');
  check(batches[0].some(event=>event.event==='feedback_submit')&&batches[0].some(event=>event.event==='feedback_result'&&event.outcome==='saved'),'Feedback attempt and confirmed response are distinct');
  check(!JSON.stringify(batches).includes('PRIVATE_QA'),'Only bounded categories reach the server action');
  await page.getByRole('link',{name:'Leaderboard',exact:true}).click();
  await page.waitForURL('**/leaderboard');
  const navigation=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('cv_usage_queue')??'[]'));
  check(navigation.filter(event=>event.event==='navigation').length===1,'A shared navigation link is counted once');
  check(navigation.some(event=>event.event==='leaderboard_open'&&event.target==='leaderboard'),'Full leaderboard intent is identified');
  check(errors.length===0,`No client exceptions: ${errors.join('; ')}`);
  console.log(`Usage browser transport: ${checks} checks passed; all POSTs intercepted.`);
}finally{await browser.close();}
