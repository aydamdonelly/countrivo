// Complete the ten-call daily through the public UI. No fabricated scores or answer access.
import {pathToFileURL} from 'node:url';
import {mkdirSync} from 'node:fs';
const installed=process.env.PLAYWRIGHT_MODULE;
if(!installed)throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.');
const {chromium}=await import(pathToFileURL(installed).href);
const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage({viewport:{width:320,height:844},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`${base}/games/higher-or-lower/play?mode=daily`,{waitUntil:'networkidle'});
 for(let round=0;round<10;round++){
  await page.getByRole('button',{name:round%2?'Lower':'Higher',exact:true}).click();
  const next=page.getByRole('button',{name:round===9?'See result':'Next pair',exact:true});
  try {await next.click();} catch(error) {
    mkdirSync('.check-render/table',{recursive:true});
    await page.screenshot({path:'.check-render/table/higher-daily-failure.png',fullPage:true});
    console.error(`Round ${round+1}: ${await page.locator('body').innerText()}`);
    throw error;
  }
 }
 await page.getByRole('button',{name:'Put me on the leaderboard',exact:true}).waitFor();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Daily result overflows320px');
 if(!await page.getByText('Next:',{exact:false}).count())throw new Error('No next daily after completed run');
 mkdirSync('.check-render/table',{recursive:true});
 await page.screenshot({path:'.check-render/table/higher-daily-result-320.png',animations:'disabled',fullPage:true});
 const score=await page.locator('.rp .score').getAttribute('aria-label');
 await page.reload({waitUntil:'networkidle'});
 if(await page.locator('.rp .score').getAttribute('aria-label')!==score)throw new Error('Reload changed the saved daily result');
 if(errors.length)throw new Error(errors.join(';'));
 console.log(`check-quick-daily:10 calls, result ${score}, reload and320pxlayout clean`);
}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);}

process.exit(0);
