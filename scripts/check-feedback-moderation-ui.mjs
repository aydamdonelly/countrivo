// Local UI only; all POSTs are intercepted, including moderation and analytics.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local only.');
if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE.');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out='.check-render/feedback-moderation';mkdirSync(out,{recursive:true});
let checks=0;
const results=[];
const check=(value,message)=>{assert(value,message);checks++;};
const respond=(route,value)=>route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${JSON.stringify(value)}\n`});
const post=(id,own=false)=>({id,message:`Useful feedback idea ${id}.`,scope:'site',context:'site',gameSlug:null,createdAt:'2026-10-28T12:00:00Z',source:'player',upvotes:0,downvotes:0,score:0,vote:0,own});
async function touchTargets(scope,label){
  const targets=await scope.locator('button,select').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().width>0).map(el=>{
    const r=el.getBoundingClientRect();return {name:el.getAttribute('aria-label')??el.textContent?.trim().slice(0,60),x:r.x,y:r.y,width:r.width,height:r.height};
  }));
  check(targets.length>0&&targets.every(target=>target.width>=44&&target.height>=44),`${label}: every control is at least44x44px: ${JSON.stringify(targets)}`);
  check(targets.every((a,i)=>targets.slice(i+1).every(b=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)<=1||Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)<=1)),`${label}: touch targets do not overlap`);
  return targets;
}
async function separateConfirmation(item){
  check(await item.getByRole('button',{name:'Confirm block author',exact:true}).isVisible(),'Blocking requires a clear confirmation');
  check(await item.locator('form[data-confirm="true"]').count()===1,'Confirmation exposes its distinct form mode');
  check(await item.getByLabel('Reason for reporting').count()===0&&await item.getByRole('button',{name:'Send report',exact:true}).count()===0,'Block confirmation contains no report reason or report submit');
  check(await item.getByRole('status').count()===0,'Report acknowledgement does not compete with block confirmation');
  check(await item.getByRole('button',{name:'Confirm block author',exact:true}).evaluate(node=>document.activeElement===node),'Confirmation receives keyboard focus');
  await touchTargets(item,'Block confirmation');
}
try{
  const mobile=[{width:375,height:667},{width:390,height:664},{width:390,height:844}];
  const scenarios=[...mobile.flatMap(viewport=>[{viewport,dialog:true},{viewport,dialog:false}]),{viewport:{width:320,height:568},dialog:false},{viewport:{width:1440,height:900},dialog:false}];
  for(const {viewport,dialog} of scenarios){
    const key=`${dialog?'dialog':'page'}-${viewport.width}x${viewport.height}`;
    const context=await browser.newContext({viewport,isMobile:viewport.width<768,hasTouch:viewport.width<768,reducedMotion:'reduce'});
    const page=await context.newPage();page.setDefaultTimeout(15000);
    const errors=[],reports=[],blocks=[];
    page.on('pageerror',error=>errors.push(error.message));
    const all=[post(204,true),post(203),post(202),post(201)];let blocked=false,failReport=true;
    const board=()=>({success:true,items:blocked?all.filter(item=>![201,202].includes(item.id)):all,nextBeforeId:null});
    await page.route('**/*',async route=>{
      if(route.request().method()!=='POST')return route.continue();
      if(!route.request().headers()['next-action'])return route.abort('blockedbyclient');
      let args;try{args=JSON.parse(route.request().postData()??'null');}catch{return route.abort('blockedbyclient');}
      const input=args?.[0];
      if(Array.isArray(input))return respond(route,true);
      if(input?.limit===20)return respond(route,board());
      if(input?.feedbackId&&input?.reason){reports.push(input);if(failReport){failReport=false;return respond(route,{success:false,error:'Local report failure. Try again.'});}return respond(route,{success:true});}
      if(typeof input==='number'){blocks.push(input);blocked=true;return respond(route,{success:true,board:board()});}
      if(args?.length===0){blocked=false;return respond(route,{success:true});}
      return route.abort('blockedbyclient');
    });
    await page.goto(`${base}${dialog?'/':'/feedback'}`,{waitUntil:'networkidle'});
    if(dialog)await page.getByRole('button',{name:'Give feedback',exact:true}).click();
    else await page.getByRole('button',{name:'Refresh',exact:true}).click();
    await page.locator('[data-feedback-id="202"]').waitFor();
    check(await page.locator('[data-feedback-id="204"]').getByRole('button',{name:'Report or block',exact:true}).count()===0,'Own post has no self-report/block controls');
    const item=page.locator('[data-feedback-id="202"]'),toggle=item.getByRole('button',{name:'Report or block',exact:true});
    await toggle.click();
    const reason=item.getByLabel('Reason for reporting');
    check(await item.getByRole('form',{name:'Report or block this feedback',exact:true}).evaluate(node=>document.activeElement===node),'Labeled report form receives focus without opening the native reason picker');
    const reportTargets=await touchTargets(item,'Report form');
    await item.getByRole('button',{name:'Block author',exact:true}).click();
    await separateConfirmation(item);
    await item.getByRole('button',{name:'Cancel',exact:true}).click();
    check(blocks.length===0&&reports.length===0,'Direct block cancellation creates no report or block');
    check(await item.locator('form').count()===0&&await toggle.evaluate(node=>document.activeElement===node),'A single Cancel closes the form and restores its trigger');
    await toggle.click();
    await page.keyboard.press('Escape');
    check(await toggle.evaluate(node=>document.activeElement===node),'Escape restores toggle focus');
    await toggle.click();await reason.selectOption('Harassment or bullying');
    await item.getByRole('button',{name:'Send report',exact:true}).click();
    await item.getByRole('alert').waitFor();
    check(await reason.inputValue()==='Harassment or bullying','Failed report preserves selected reason');
    await item.getByRole('button',{name:'Send report',exact:true}).click();
    await item.getByText('Report received. We’ll review it. You can also block this author.',{exact:true}).waitFor();
    check(reports.length===2&&reports.every(value=>value.feedbackId===202&&value.reason==='Harassment or bullying'),'Only explicit reports and bounded reasons reach transport');
    await item.getByRole('button',{name:'Block author',exact:true}).click();
    await separateConfirmation(item);
    await item.getByRole('button',{name:'Cancel',exact:true}).click();
    check(blocks.length===0,'Cancelling a block does not mutate');
    await toggle.click();await item.getByRole('button',{name:'Block author',exact:true}).click();
    await item.getByRole('button',{name:'Confirm block author',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`${out}/confirm-${key}.png`,fullPage:true});
    await item.getByRole('button',{name:'Confirm block author',exact:true}).click();
    await page.locator('[data-feedback-id="202"]').waitFor({state:'detached'});
    check(await page.locator('[data-feedback-id="201"]').count()===0,'All currently displayed posts by the blocked author disappear');
    check(await page.locator('[data-feedback-id="203"]').count()===1,'Unrelated author remains');
    check(await page.getByRole('heading',{name:'Community feedback',exact:true}).evaluate(node=>document.activeElement===node),'Block restores focus to a surviving heading');
    await page.getByRole('button',{name:'Refresh',exact:true}).click();
    check(await page.locator('[data-feedback-id="202"]').count()===0,'Refreshed server board does not reintroduce blocked posts');
    await page.getByRole('button',{name:'Unblock all authors',exact:true}).click();
    await page.locator('[data-feedback-id="202"]').waitFor();
    check(await page.locator('[data-feedback-id="201"]').count()===1,'Unblocking refreshes the full board');
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Controls fit without horizontal overflow');
    if(dialog){
      const close=page.getByRole('button',{name:'Close feedback',exact:true}),bounds=await close.boundingBox();
      check(bounds&&bounds.width>=44&&bounds.height>=44&&bounds.y>=0&&bounds.y+bounds.height<=viewport.height,'Modal close stays reachable with a44px target after moderation');
      await close.click();
      check(await page.getByRole('button',{name:'Give feedback',exact:true}).evaluate(node=>document.activeElement===node),'Closing feedback restores the entry-button focus');
    }
    check(errors.length===0,`No browser exceptions: ${errors.join(';')}`);
    await page.screenshot({path:`${out}/restored-${key}.png`,fullPage:true});
    results.push({viewport,dialog,reportTargets,reportsIntercepted:reports.length,blocksIntercepted:blocks.length});
    await context.close();
  }
  writeFileSync(`${out}/report.json`,JSON.stringify({checkedAt:new Date().toISOString(),checks,noDatabaseWrites:true,results},null,2)+'\n');
  console.log(`${checks} feedback moderation UI checks passed; all POSTs intercepted.`);
}finally{await browser.close();}
