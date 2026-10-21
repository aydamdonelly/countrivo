import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Real local UI, synthetic acknowledgements. Every POST is intercepted; no public scores are written.
const installed=process.env.PLAYWRIGHT_MODULE;
if(!installed)throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const {chromium}=await import(pathToFileURL(installed).href);
const base=process.env.COUNTRIVO_QA_BASE??'http://localhost:3290';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local QA only.');
const out='.check-render/leaderboard-entry';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
let checks=0;const results=[];
const check=(ok,label)=>{assert(ok,label);checks++;};
const dateKey=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
const neighbours=[
 {runId:111,displayName:'Atlas Player',scoreDisplay:'13 / 13',scoreSortValue:13,rank:1},
 {runId:112,displayName:'River Player',scoreDisplay:'11 / 13',scoreSortValue:11,rank:2},
 {runId:113,displayName:'Equal Player',scoreDisplay:'10 / 13',scoreSortValue:10,rank:3},
 {runId:114,displayName:'Coast Player',scoreDisplay:'9 / 13',scoreSortValue:9,rank:4},
];
const respond=(route,value)=>route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${value===undefined?'"$undefined"':JSON.stringify(value)}\n`});
try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
  await context.addInitScript(()=>{if(!localStorage.getItem('qa-seeded')){localStorage.setItem('countrivo_leaderboard_name','"Previous Name"');localStorage.setItem('qa-seeded','1');}});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push(error.message));
  let posts=0,publishes=0,removals=0,countryReads=0,refreshes=0;
  let initialName=null,variant='normal',slug='flag-quiz',nextId=991234,refreshing=false;
  const publicationIds=[];
  function runFor(published=false){
   const available=variant!=='unavailable',hidden=variant==='moderated',empty=variant==='empty';
   const count=empty?published?1:0:published?5:4;
   return{id:nextId,gameSlug:slug,mode:'daily',dailyDate:dateKey,scoreRaw:10,scoreMax:13,scoreSortValue:10,scoreNormalized:10/13,scoreDisplay:'10 / 13',rankDaily:published&&available&&!hidden?empty?1:3:null,percentile:null,isPersonalBest:false,resultJson:{qaFixture:true},completedAt:new Date().toISOString(),dailyNameCount:available?count:undefined,moderationHidden:hidden,
    rankPreview:!published&&available?{rank:empty?1:3,playerCount:empty?1:5}:undefined,
    leaderboard:{available,entries:available&&!empty?neighbours.map(row=>({...row,rank:published&&row.scoreSortValue<10?5:row.rank})):[],playerCount:count,gameSlug:slug,dateKey}};
  }
  function viewFor(){return{kind:slug,mode:'daily',phase:'finished',round:10,total:10,score:'10 / 13',progress:{done:10,total:10,label:'score',value:'10'},shareText:'Local result fixture',history:[],flagSrc:'',options:[],picked:null,correctIndex:null,fact:null,source:null,doubled:false};}
  await page.route('**/*',async route=>{
   const request=route.request();
   if(request.method()!=='POST')return new URL(request.url()).origin===new URL(base).origin?route.continue():route.abort();
   posts++;
   if(!request.headers()['next-action'])return route.abort();
   const args=JSON.parse(request.postData()??'[]');let response;
   if(args[0]&&typeof args[0]==='object')response={success:true,view:viewFor(),run:runFor(!!initialName),publishedName:initialName,sessionToken:'local-standing-fixture',revision:1};
   else if(args.length===3){
    publishes++;publicationIds.push(args[0]);await new Promise(resolve=>setTimeout(resolve,200));
    response=publishes===1?{success:false,error:'Connection interrupted. Try again.'}:{success:true,run:runFor(true),publishedName:args[1].trim()};
   }else if(args.length===1){
    if(refreshing){refreshes++;variant='normal';refreshing=false;response=runFor();}
    else{removals++;response={success:true,run:runFor()};}
   }else if(new URL(page.url()).pathname==='/privacy')response=undefined;
   else{countryReads++;response=[{iso3:'DEU',name:'Germany'}];}
   return respond(route,response);
  });
  async function finish(game='flag-quiz'){
   slug=game;nextId++;
   await page.goto(`${base}/games/${slug}/play?mode=daily`,{waitUntil:'networkidle'});
   const selector=slug==='flag-quiz'?'.fq-opt':'.qr-call';
   await page.waitForFunction(selector=>{const button=document.querySelector(selector);return button&&Object.keys(button).some(key=>key.startsWith('__reactProps'));},selector);
   await page.locator(selector).first().click();
   await page.getByRole('heading',{name:'Today’s leaderboard',exact:true}).waitFor();
   await page.locator('.standing-you').waitFor();
  }
  const entry=page.locator('.leaderboard-entry'),own=entry.locator('.standing-you'),input=entry.getByRole('textbox',{name:'Your name on the board',exact:true});
  const ownIndex=()=>own.evaluate(node=>Array.from(node.parentElement.children).indexOf(node));
  async function manage(){const details=entry.locator('.name-management');if(!(await details.getAttribute('open')))await details.locator('summary').click();}
  async function fits(label){
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: no horizontal overflow`);
   check(await entry.locator('.standing-score,.standing-name,.standing-rank,.standing-join').evaluateAll(nodes=>nodes.every(node=>node.scrollWidth<=node.clientWidth+1)),`${label}: ranks, names, scores and CTA are not clipped`);
  }
  await finish();
  await page.waitForFunction(()=>document.querySelector('input[name=displayName]')?.value==='Previous Name');
  check(await input.isVisible(),'Name input is immediately visible in the private own row');
  check(await own.locator('form').count()===1,'Private score row contains the join form');
  check(await ownIndex()===2,'Own ghost row is between strictly better scores and equal/lower scores');
  check(await entry.locator('.standing-row').count()===4,'Real named neighbours are shown once');
  check(await entry.locator('.standing-row').nth(2).locator('.standing-rank').textContent()==='3','Private preview preserves the equal-score neighbour rank');
  check(await entry.locator('.standing-row').nth(3).locator('.standing-rank').textContent()==='5','Private preview moves strictly lower scores down by one');
  check(await entry.getByRole('button',{name:/^Report or block /}).count()===4,'Every public neighbour has report/block controls');
  check(await own.locator('.standing-rank').textContent()==='3','Ghost row shows the true hypothetical rank');
  check(await entry.getByText('You’d be #3 of 5 · equal scores share a place.',{exact:true}).isVisible(),'Rank preview and tie rule are explicitly provisional');
  check(await entry.getByText('4 published players · your place below',{exact:true}).isVisible(),'Existing published count does not include the private player');
  check(await own.locator('.standing-score').textContent()==='10 / 13','Own score stays beside the editable name');
  check(!(await input.evaluate(node=>document.activeElement===node)),'Result does not autofocus the input');
  check(publishes===0,'Remembered name is never published automatically');
  check(countryReads===0,'Country list is lazy');
  const full=entry.getByRole('link',{name:'Full leaderboard',exact:true});
  check((await full.getAttribute('href')).endsWith('#leaderboard-your-score'),'Full leaderboard targets the own score');
  await fits(`Private ${width}px`);await page.screenshot({path:`${out}/join-${width}.png`,fullPage:true});
  await input.fill('New Name');const join=entry.getByRole('button',{name:'Put me on the leaderboard',exact:true});
  await join.click();await entry.getByRole('button',{name:'Saving name…',exact:true}).waitFor();
  check(await entry.getByRole('button',{name:'Saving name…',exact:true}).isDisabled(),'Pending publication cannot be clicked twice');
  await input.evaluate(node=>node.form.requestSubmit());
  await entry.getByRole('alert').filter({hasText:'Connection interrupted.'}).waitFor();
  check(publishes===1,'Repeated submit during pending sends one publication request');
  check(await input.inputValue()==='New Name','Retry retains typed name');
  check(await page.evaluate(()=>localStorage.getItem('countrivo_leaderboard_name'))==='"Previous Name"','Failed publication preserves the confirmed name preference');
  check(await ownIndex()===2,'Failed publication leaves the own row in place');
  await join.click();await entry.getByText('You’re #3 of 5',{exact:true}).waitFor();
  check(await ownIndex()===2,'Publication keeps the same ordinal position between neighbours');
  check(await entry.locator('.standing-you').count()===1&&await own.locator('form').count()===0,'Publication replaces the form once without duplicating a player');
  check(await own.locator('.standing-name > b').textContent()==='New Name','Confirmed own name occupies the published row');
  check(await entry.locator('.standing-row').count()===4,'Publication preserves neighbouring rows');
  check(await entry.locator('.standing-row').nth(2).locator('.standing-rank').textContent()==='3','Equal-score neighbour shares rank3');
  check(await entry.locator('.standing-row').nth(3).locator('.standing-rank').textContent()==='5','Publication does not shift a lower score twice');
  check(await page.evaluate(()=>localStorage.getItem('countrivo_leaderboard_name'))==='"New Name"','Only confirmed publication updates the remembered name');
  check(publicationIds.length===2&&publicationIds.every(id=>id===nextId),'Publication retry uses the same run id');
  check(!(await entry.locator('.name-management').getAttribute('open')),'Management controls are secondary, collapsed by default');
  await manage();await entry.getByRole('button',{name:'Change name',exact:true}).click();
  check(await input.inputValue()==='New Name','Rename starts with current public name');
  await input.fill('Unsent Name');await entry.getByRole('button',{name:'Cancel',exact:true}).click();
  check(await own.locator('.standing-name > b').textContent()==='New Name','Cancelling rename preserves the public name');
  check(publishes===2,'Cancelling rename sends no request');
  await manage();await entry.getByRole('button',{name:'Change name',exact:true}).click();
  await input.fill('Renamed Name');await entry.getByRole('button',{name:'Save name',exact:true}).click();
  await own.getByText('Renamed Name',{exact:true}).waitFor();
  check(publishes===3&&await ownIndex()===2,'Explicit rename updates the same row and position');
  await manage();await entry.getByRole('button',{name:'Remove my name',exact:true}).click();
  await entry.getByRole('button',{name:'Keep it',exact:true}).click();
  check(removals===0,'Cancelling removal never unpublishes');
  await page.screenshot({path:`${out}/published-${width}.png`,fullPage:true});
  await entry.getByRole('button',{name:'Remove my name',exact:true}).click();await entry.getByRole('button',{name:'Remove name',exact:true}).click();
  await entry.getByText('Name removed. Your result is private.',{exact:true}).waitFor();
  check(await input.isVisible()&&await ownIndex()===2,'Removal restores the private row in the same score position');
  check(removals===1&&publishes===3,'Only explicit confirmations publish, rename or remove');
  await entry.locator('.name-country summary').click();await entry.getByRole('combobox',{name:'Country',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('.name-country option[value=DEU]'));
  check(countryReads===1,'Optional country list loads once when requested');
  await entry.locator('.name-country summary').click();await entry.locator('.name-country summary').click();
  check(countryReads===1,'Reopening country choices reuses the existing list');

  await finish('higher-or-lower');await page.waitForFunction(()=>document.querySelector('input[name=displayName]')?.value==='Renamed Name');
  check(await input.inputValue()==='Renamed Name','A different game recalls the last confirmed name');
  check(publishes===3,'Cross-game name reuse never auto-publishes');
  variant='empty';await finish();
  check(await entry.getByText('Be the first today · equal scores share a place.',{exact:true}).isVisible(),'Empty board invites the first player truthfully');
  check(await entry.locator('.standing-row').count()===0&&await ownIndex()===0,'Empty board contains only the private row, no invented crowd');
  variant='unavailable';await finish();
  check(await entry.getByText('The leaderboard couldn’t be opened. Your score is saved.',{exact:true}).isVisible(),'Unavailable leaderboard explains the state without hiding the saved result');
  check(await entry.locator('.standing-preview').count()===0,'Unavailable data never promises a rank');
  check(await own.locator('.standing-rank').textContent()==='-'&&await own.locator('.standing-rank').getAttribute('aria-label')==='Rank unavailable','Unavailable rank is an accessible fallback, not a guessed rank');
  refreshing=true;await entry.getByRole('button',{name:'Try again',exact:true}).click();
  await entry.getByText('You’d be #3 of 5 · equal scores share a place.',{exact:true}).waitFor();
  check(refreshes===1&&publishes===3,'Standing retry refreshes data without publishing');
  check(await entry.locator('.standing-row').count()===4,'Retry restores real neighbour context');

  initialName='Hidden Name';variant='moderated';await finish();
  check(await own.getByText('You · name under review',{exact:true}).isVisible(),'Moderated own name is clearly under review');
  check(await own.locator('.standing-rank').textContent()==='-'&&await own.locator('.standing-rank').getAttribute('aria-label')==='Rank unavailable','Moderated own name has no public rank');
  check(await entry.locator('.standing-preview').count()===0,'Moderated result does not advertise a hypothetical or public placing');
  initialName='Existing Name';variant='normal';await page.evaluate(()=>localStorage.removeItem('countrivo_leaderboard_name'));await finish();
  await page.waitForFunction(()=>localStorage.getItem('countrivo_leaderboard_name')==='"Existing Name"');
  check(await own.getByText('Existing Name',{exact:true}).isVisible(),'An already-published own name seeds an empty preference');
  await page.evaluate(()=>localStorage.setItem('countrivo_leaderboard_name','"More Recent Name"'));await finish();
  check(await page.evaluate(()=>localStorage.getItem('countrivo_leaderboard_name'))==='"More Recent Name"','An older public name never overwrites a newer remembered preference');
  check(publishes===3,'Migration of confirmed names sends no publication');

  await page.addStyleTag({content:'.leaderboard-entry .t-h3 {font-size:40px;line-height:1.4}.leaderboard-entry .t-meta,.leaderboard-entry input,.leaderboard-entry .btn,.leaderboard-entry .standing-name {font-size:32px;line-height:1.4}.leaderboard-entry .standing-score,.leaderboard-entry .standing-rank{font-size:36px;line-height:1.4}'});
  await fits(`Published200% ${width}px`);await manage();await entry.getByRole('button',{name:'Change name',exact:true}).click();
  await input.fill('QAWWWWWWWWWWWWWWWWWW');await fits(`Editable200% ${width}px`);
  check(await input.getAttribute('maxlength')==='20','Enlarged input retains nickname limit');
  await page.screenshot({path:`${out}/large-text-${width}.png`,fullPage:true});
  await page.goto(`${base}/privacy`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(button=>button.textContent==='Forget this device'&&Object.keys(button).some(key=>key.startsWith('__reactProps'))));
  await page.getByRole('button',{name:'Forget this device',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).waitFor();
  await page.getByRole('button',{name:'Forget this device',exact:true}).click();
  await page.waitForFunction(()=>localStorage.getItem('countrivo_leaderboard_name')===null);
  check(await page.evaluate(()=>localStorage.getItem('countrivo_leaderboard_name'))===null,'Forget this device clears remembered name');
  check(errors.length===0,`No browser errors: ${errors.join('; ')}`);
  results.push({width,posts,publishes,removals,countryReads,refreshes,realMutationPosts:0});await context.close();
 }
 writeFileSync(`${out}/report.json`,JSON.stringify({checks,scope:'Local actual client UI; every POST intercepted with synthetic acknowledgements. No public names/runs written.',results},null,2)+'\n');
 console.log(`Leaderboard entry: ${checks} checks passed at320/390/1440; no public data written.`);
}finally{await browser.close();}
