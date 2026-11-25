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
  let initialName=null,variant='normal',slug='higher-or-lower',nextId=991234,refreshing=false;
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
  async function finish(game='higher-or-lower'){
   slug=game;nextId++;
   await page.goto(`${base}/games/${slug}/play?mode=daily`,{waitUntil:'networkidle'});
   // Flag Quiz is a timed sprint now; Higher or Lower finishes from one intercepted call.
   const selector='.qr-call';
   await page.waitForFunction(selector=>{const button=document.querySelector(selector);return button&&Object.keys(button).some(key=>key.startsWith('__reactProps'));},selector);
   if(await page.locator('.flag img').count()){
    check(await page.locator('.flag img').first().evaluate(img=>getComputedStyle(img).objectFit==='contain'&&img.naturalWidth>0),'Flag artwork loads completely without cover cropping');
    check(await page.locator('.flag img').first().evaluate(img=>new URL(img.currentSrc).pathname.startsWith('/clay-flags/')),'The board loads the shared locally rendered clay flag artwork');
   }
   await page.locator(selector).first().click();
   await page.getByRole('heading',{name:'Today’s leaderboard',exact:true}).waitFor();
   await page.locator('.standing-you').waitFor();
  }
  const entry=page.locator('.leaderboard-entry'),own=entry.locator('.standing-you'),input=entry.getByRole('textbox',{name:'Your name on the board (optional)',exact:true});
  const ownIndex=()=>own.evaluate(node=>Array.from(node.parentElement.children).indexOf(node));
  async function manage(){await entry.locator('.join-done').waitFor();}
  async function fits(label){
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: no horizontal overflow`);
   check(await entry.locator('.standing-score,.standing-label,.standing-rank,.standing-join').evaluateAll(nodes=>nodes.every(node=>node.scrollWidth<=node.clientWidth+1)),`${label}: ranks, names, scores and CTA are not clipped`);
  }
  if(width===320){
   const response=await page.goto(`${base}/games/blind-pick/leaderboard`,{waitUntil:'networkidle'});
   check(response.status()===200,'Blind Pick leaderboard route renders successfully');
   check(await page.getByText('Fewer extra rank points wins. Equal scores share a place.',{exact:true}).isVisible(),'Blind Pick explains the lower-is-better ranking');
   check((await page.locator('.lb-target').textContent()).includes('+10 over best fit'),'Blind Pick leaderboard has its real par target');
   check(await page.locator('.lb-demo .rank-marker img').count()===0,'Simulated opponents do not receive player podium artwork');
  }
  await finish();
  await page.waitForFunction(()=>document.querySelector('input[name=displayName]')?.value==='Previous Name');
  check(await input.isVisible(),'Name input is immediately visible in the private own row');
  check(await own.locator('form').count()===0&&await entry.locator('.join-panel form').count()===1,'The join form sits in the panel under the list, not inside the score row');
  check(await own.getByText('Not on the public board yet',{exact:true}).isVisible(),'The private own row says it is not public yet');
  check(await entry.locator('.join-row').evaluate(row=>{const [flag,name,save]=['.join-flag','.join-name','.standing-join'].map(s=>row.querySelector(s).getBoundingClientRect());return flag.right<=name.left&&name.right<=save.left&&Math.abs(flag.top-name.top)<2&&Math.abs(name.top-save.top)<2&&flag.width>=44&&flag.height>=44;}),'Flag button, name and Save share one compact line with the flag first');
  check(await ownIndex()===2,'Own ghost row is between strictly better scores and equal/lower scores');
  check(await entry.locator('.standing-row').count()===4,'Real named neighbours are shown once');
  check(await entry.locator('.standing-row').nth(2).locator('.standing-rank').textContent()==='3','Private preview preserves the equal-score neighbour rank');
  check(await entry.locator('.standing-row').nth(3).locator('.standing-rank').textContent()==='5','Private preview moves strictly lower scores down by one');
  check(await entry.getByRole('button',{name:/^Report or block /}).count()===4,'Every public neighbour has report/block controls');
  const player=entry.locator('.standing-row').first(),options=player.getByRole('button',{name:/^Report or block /});
  check(await options.evaluate(node=>{const r=node.getBoundingClientRect();return r.width>=44&&r.height>=44;}),'Player options retain a full square touch target');
  await options.click();
  const reportForm=player.getByRole('form'),reason=reportForm.getByRole('combobox');
  check(await reportForm.evaluate(node=>document.activeElement===node),'Player form receives focus without opening the iOS picker');
  check(await reason.evaluate(node=>node.getBoundingClientRect().height>=48&&parseFloat(getComputedStyle(node).fontSize)>=16),'Player reason has a 48px target and 16px text');
  check(await reportForm.getByRole('button',{name:'Send report',exact:true}).evaluate(node=>node.getBoundingClientRect().height>=48&&node.getBoundingClientRect().width>=node.form.clientWidth-25),'Player report primary is full width and at least48px');
  await page.screenshot({path:`${out}/report-${width}.png`,fullPage:true});
  await reportForm.getByRole('button',{name:'Block player',exact:true}).click();
  check(await reason.count()===0&&await reportForm.getByRole('button',{name:'Send report',exact:true}).count()===0,'Block confirmation excludes report fields and submit');
  check(await reportForm.getByRole('button',{name:'Confirm block player',exact:true}).evaluate(node=>document.activeElement===node),'Block confirmation receives deliberate focus');
  check(await reportForm.locator('button').evaluateAll(nodes=>nodes.every(node=>{const r=node.getBoundingClientRect();return r.width>=44&&r.height>=48;})),'Confirmation and cancel have clear 48px touch targets');
  const mutationCount=publishes+removals+countryReads;
  await reportForm.evaluate(node=>node.requestSubmit());await page.waitForTimeout(100);
  check(publishes+removals+countryReads===mutationCount,'Submit during block confirmation never sends a report');
  await page.screenshot({path:`${out}/block-confirm-${width}.png`,fullPage:true});
  await reportForm.getByRole('button',{name:'Cancel',exact:true}).click();
  check(await reportForm.count()===0&&await options.evaluate(node=>document.activeElement===node),'One cancel closes the player form and restores focus');
  check(publishes+removals+countryReads===mutationCount,'Cancelling block confirmation does not mutate');
  check(await own.locator('.standing-rank').textContent()==='3','Ghost row shows the true hypothetical rank');
  check(await own.locator('.rank-marker').getAttribute('data-podium')==='3'&&(await own.locator('.rank-medal').getAttribute('src')).includes('/cl-22/'),'The true hypothetical third place shows the third-place medal');
  check(await entry.locator('.standing-row').nth(2).locator('.rank-marker').getAttribute('data-podium')==='3','Equal scores share the third-place award');
  check(await entry.locator('.standing-row').nth(3).locator('.rank-medal').count()===0,'Places below the podium carry no medal');
  const medals=await entry.locator('.standing-row .rank-medal').evaluateAll(nodes=>nodes.map(node=>new URL(node.src).pathname));
  check(medals[0].includes('/cl-20/')&&medals[1].includes('/cl-21/')&&medals[2].includes('/cl-22/')&&new Set(medals).size===3,'Places 1, 2 and 3 each have their own clay award');
  check(await entry.locator('.standing-row').evaluateAll(rows=>rows.every(row=>getComputedStyle(row).backgroundColor==='rgba(0, 0, 0, 0)')),'Every public row, podium included, has a transparent background');
  check(await own.evaluate(row=>{const s=getComputedStyle(row),probe=document.createElement('span');probe.style.color='var(--color-ember)';probe.style.backgroundColor='var(--color-you)';row.append(probe);const p=getComputedStyle(probe),ok=s.backgroundColor===p.backgroundColor&&s.boxShadow.includes(p.color)&&s.boxShadow.includes('inset');probe.remove();return ok;}),'Your row has the ember tint and the ember inset edge');
  check(await entry.locator('.lb-report').evaluateAll(nodes=>nodes.every(node=>{const s=getComputedStyle(node);return s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.borderTopWidth==='0px';})),'Player options are quiet icon buttons without a box');
  check(await own.locator('.lb-report').count()===0,'Your own row has no player options');
  check(await entry.getByText('4 players',{exact:true}).isVisible(),'Existing published count does not include the private player');
  check(await own.locator('.standing-score').textContent()==='10 / 13','Own score stays beside the editable name');
  check(!(await input.evaluate(node=>document.activeElement===node)),'Result does not autofocus the input');
  check(publishes===0,'Remembered name is never published automatically');
  check(countryReads===0,'No country request before the picker opens');
  const full=page.locator('.a-links').getByRole('link',{name:'Full leaderboard',exact:true});
  check((await full.getAttribute('href')).endsWith('#leaderboard-your-score'),'Full leaderboard (tertiary link row under the result) targets the own score');
  check(await entry.getByRole('link',{name:'Full leaderboard',exact:true}).count()===0,'The leaderboard preview carries no second Full leaderboard link');
  check(await entry.locator('.standing-join').evaluate(node=>node.matches('.btn-secondary')),'Save is a secondary button, so the next game stays the only primary');
  await fits(`Private ${width}px`);await page.screenshot({path:`${out}/join-${width}.png`,fullPage:true});
  await input.fill('New Name');const join=entry.getByRole('button',{name:'Save',exact:true});
  await join.click();await entry.getByRole('button',{name:'Saving',exact:true}).waitFor();
  check(await entry.getByRole('button',{name:'Saving',exact:true}).isDisabled(),'Pending publication cannot be clicked twice');
  await input.evaluate(node=>node.form.requestSubmit());
  await entry.getByRole('alert').filter({hasText:'Connection interrupted.'}).waitFor();
  check(publishes===1,'Repeated submit during pending sends one publication request');
  check(await input.inputValue()==='New Name','Retry retains typed name');
  check(await page.evaluate(()=>localStorage.getItem('countrivo_leaderboard_name'))==='"Previous Name"','Failed publication preserves the confirmed name preference');
  check(await ownIndex()===2,'Failed publication leaves the own row in place');
  await join.click();await entry.getByText('Saved. You’re #3 of 5.',{exact:true}).waitFor();
  check(await ownIndex()===2,'Publication keeps the same ordinal position between neighbours');
  check(await entry.locator('.standing-you').count()===1&&await entry.locator('.join-panel').count()===0,'Publication replaces the form once without duplicating a player');
  check(await own.locator('.standing-label > b').textContent()==='New Name','Confirmed own name occupies the published row');
  check(await entry.locator('.join-done').getByText('New Name',{exact:true}).isVisible(),'The panel collapses to one line naming the public entry');
  check((await own.locator('.standing-you-label').textContent()).includes('You'),'Own identity remains explicit inside a podium row');
  check(await entry.locator('.standing-row').count()===4,'Publication preserves neighbouring rows');
  check(await entry.locator('.standing-row').nth(2).locator('.standing-rank').textContent()==='3','Equal-score neighbour shares rank3');
  check(await entry.locator('.standing-row').nth(3).locator('.standing-rank').textContent()==='5','Publication does not shift a lower score twice');
  check(await page.evaluate(()=>localStorage.getItem('countrivo_leaderboard_name'))==='"New Name"','Only confirmed publication updates the remembered name');
  check(publicationIds.length===2&&publicationIds.every(id=>id===nextId),'Publication retry uses the same run id');
  check(await entry.locator('.join-done .btn-tertiary').count()===2,'Change and Remove are quiet tertiary actions');
  await manage();await entry.getByRole('button',{name:'Change',exact:true}).click();
  check(await input.inputValue()==='New Name','Rename starts with current public name');
  await input.fill('Unsent Name');await entry.getByRole('button',{name:'Cancel',exact:true}).click();
  check(await own.locator('.standing-label > b').textContent()==='New Name','Cancelling rename preserves the public name');
  check(publishes===2,'Cancelling rename sends no request');
  await manage();await entry.getByRole('button',{name:'Change',exact:true}).click();
  await input.fill('Renamed Name');await entry.getByRole('button',{name:'Save',exact:true}).click();
  await own.getByText('Renamed Name',{exact:true}).waitFor();
  check(publishes===3&&await ownIndex()===2,'Explicit rename updates the same row and position');
  await manage();await entry.getByRole('button',{name:'Remove',exact:true}).click();
  await entry.getByRole('button',{name:'Keep it',exact:true}).click();
  check(removals===0,'Cancelling removal never unpublishes');
  await page.screenshot({path:`${out}/published-${width}.png`,fullPage:true});
  await entry.getByRole('button',{name:'Remove',exact:true}).click();await entry.getByRole('button',{name:'Remove name',exact:true}).click();
  await entry.getByText('Name removed. Your score is saved under a guest name.',{exact:true}).waitFor();
  check(await input.isVisible()&&await ownIndex()===2,'Removal reopens the optional name form in the same score position');
  check(removals===1&&publishes===3,'Only explicit confirmations publish, rename or remove');
  const flagButton=entry.getByRole('button',{name:'Choose your flag',exact:true});
  check(await flagButton.isVisible(),'No flag is chosen silently: the button still asks');
  check(await entry.locator('.join-suggest').evaluate(node=>node.getBoundingClientRect().height>=44&&node.textContent.endsWith('? Use this flag')),'The device region is offered as a one-tap suggestion');
  await flagButton.click();const sheet=page.getByRole('dialog');await sheet.waitFor();
  check(await sheet.getByRole('heading',{name:'Your flag',exact:true}).isVisible(),'The flag button opens the picker sheet');
  check(await sheet.locator('input[type=search]').evaluate(node=>document.activeElement===node&&node.placeholder==='Search 195 countries'),'Search is focused and counts the sovereign list');
  check(await sheet.locator('.fp-az button.fp-row').count()===195,'All 195 countries are listed A to Z');
  check(await sheet.getByRole('button',{name:'Keep my flag private',exact:true}).getAttribute('aria-pressed')==='true','Keep my flag private is the default');
  check(countryReads===0,'The country list ships with the page; opening it sends no request');
  await sheet.locator('input[type=search]').fill('Cote d ivoire');
  check((await sheet.locator('.fp-row .fp-name').first().textContent())==='Ivory Coast','Search uses the GeoWordle aliases and folds accents');
  await sheet.locator('input[type=search]').fill('usa');
  check((await sheet.locator('.fp-row .fp-name').first().textContent())==='United States','Search accepts USA');
  await sheet.locator('input[type=search]').fill('xyzq');
  check(await sheet.getByText('No country matches ‘xyzq’.',{exact:true}).isVisible(),'An empty search says so');
  await sheet.locator('input[type=search]').fill('germ');await page.keyboard.press('Enter');
  await sheet.waitFor({state:'detached'});
  check(await entry.getByRole('button',{name:'Flag: Germany',exact:true}).evaluate(node=>document.activeElement===node),'Choosing closes the sheet and returns focus to the flag button');
  check(await own.locator('.standing-flag img').evaluate(img=>new URL(img.src).pathname.startsWith('/clay-flags/de')),'Your row previews the chosen flag');
  check(await entry.locator('.join-suggest').count()===0,'The suggestion disappears once a flag is chosen');
  check(countryReads===0&&publishes===3,'Choosing a flag publishes nothing by itself');
  await entry.getByRole('button',{name:'Flag: Germany',exact:true}).click();await sheet.waitFor();
  await page.keyboard.press('Escape');await sheet.waitFor({state:'detached'});
  check(await entry.getByRole('button',{name:'Flag: Germany',exact:true}).isVisible(),'Escape closes the picker without changing the flag');

  await finish('higher-or-lower');await page.waitForFunction(()=>document.querySelector('input[name=displayName]')?.value==='Renamed Name');
  check(await input.inputValue()==='Renamed Name','A different game recalls the last confirmed name');
  check(publishes===3,'Cross-game name reuse never auto-publishes');
  variant='empty';await finish();
  check(await entry.getByText('Be the first on today’s board. Equal scores share a place.',{exact:true}).isVisible(),'Empty board invites the first player truthfully');
  check(await entry.locator('.standing-row').count()===0&&await ownIndex()===0,'Empty board contains only the private row, no invented crowd');
  variant='unavailable';await finish();
  check(await entry.getByText('The leaderboard couldn’t be opened. Your score is saved.',{exact:true}).isVisible(),'Unavailable leaderboard explains the state without hiding the saved result');
  check(await entry.locator('.standing-preview').count()===0,'Unavailable data never promises a rank');
  check(await own.locator('.standing-rank').textContent()==='–'&&await own.locator('.standing-rank').getAttribute('aria-label')==='Rank unavailable','Unavailable rank is an accessible fallback, not a guessed rank');
  check(await own.locator('.rank-marker img').count()===0&&await own.locator('.rank-marker').getAttribute('data-podium')===null,'Unavailable ranks receive no podium award');
  refreshing=true;await entry.getByRole('button',{name:'Try again',exact:true}).click();
  await entry.locator('.standing-row').nth(3).waitFor();
  check(refreshes===1&&publishes===3,'Standing retry refreshes data without publishing');
  check(await entry.locator('.standing-row').count()===4,'Retry restores real neighbour context');

  initialName='Hidden Name';variant='moderated';await finish();
  check(await own.getByText('Name under review',{exact:true}).isVisible()&&await own.locator('.standing-you-label').textContent()==='You','Moderated own name is clearly under review');
  check(await own.locator('.standing-rank').textContent()==='–'&&await own.locator('.standing-rank').getAttribute('aria-label')==='Rank unavailable','Moderated own name has no public rank');
  check(await own.locator('.rank-marker img').count()===0,'Moderated own name receives no podium award');
  check(await entry.locator('.standing-preview').count()===0&&!(await entry.textContent()).includes('You’re #'),'Moderated result does not advertise a hypothetical or public placing');
  initialName='Existing Name';variant='normal';await page.evaluate(()=>localStorage.removeItem('countrivo_leaderboard_name'));await finish();
  await page.waitForFunction(()=>localStorage.getItem('countrivo_leaderboard_name')==='"Existing Name"');
  check(await own.getByText('Existing Name',{exact:true}).isVisible(),'An already-published own name seeds an empty preference');
  await page.evaluate(()=>localStorage.setItem('countrivo_leaderboard_name','"More Recent Name"'));await finish();
  check(await page.evaluate(()=>localStorage.getItem('countrivo_leaderboard_name'))==='"More Recent Name"','An older public name never overwrites a newer remembered preference');
  check(publishes===3,'Migration of confirmed names sends no publication');

  await page.addStyleTag({content:'.leaderboard-entry .standing-title {font-size:40px;line-height:1.4}.leaderboard-entry .standing-count,.leaderboard-entry .join-note,.leaderboard-entry .join-done-line,.leaderboard-entry input,.leaderboard-entry .btn,.leaderboard-entry .standing-label {font-size:32px;line-height:1.4}.leaderboard-entry .standing-score,.leaderboard-entry .rank-marker{font-size:36px;line-height:1.4}'});
  await fits(`Published200% ${width}px`);await manage();await entry.getByRole('button',{name:'Change',exact:true}).click();
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
