// Acknowledgements are local fixtures: this verifies UI decisions without writing runs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { createGame, openCountry, appoint, nextRound } = require('../src/lib/game-logic/country-draft/engine.ts');
const { draftView } = require('../src/lib/game-logic/country-draft/public-view.ts');
const { cabinetStory } = require('../src/games/country-draft/presentation.ts');
const installed = process.env.PLAYWRIGHT_MODULE;
if (!installed) throw new Error('Set PLAYWRIGHT_MODULE to an installed playwright-core/index.mjs.');
const { chromium } = await import(pathToFileURL(installed).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local fixtures only.');
const initial = createGame(31);
const people = draftView(openCountry(initial, 0));
let completed = initial;
for (let round = 0; round < 5; round++) {
  const pick = initial.board.best[round];
  completed = appoint(openCountry(completed, pick.countryIdx), pick.poolIdx, pick.seat);
  if (round < 4) completed = nextRound(completed);
}
const seated = draftView(completed);
const done = draftView(nextRound(completed), true);
const story = cabinetStory(done.seats);
let checks = 0;
const check = (ok, label) => { assert(ok, label); checks++; };
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const mobileLayoutOnly = process.argv.includes('--mobile-layout-only');
const output = '.check-render/draft-presentation';
const mobileLayouts = [];
mkdirSync(output, { recursive: true });
try {
  if (mobileLayoutOnly) {
    for (const viewport of [{width:375,height:667},{width:390,height:664},{width:390,height:844}]) {
      const context = await browser.newContext({viewport,reducedMotion:'reduce'});
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      const errors=[]; let moves=0, interceptedPosts=0;
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',async route=>{
        const request=route.request();
        if(request.method()!=='POST')return new URL(request.url()).origin===new URL(base).origin?route.continue():route.abort();
        interceptedPosts++;
        if(!request.headers()['next-action'])return route.abort();
        let input;try{[input]=request.postDataJSON();}catch{return route.abort();}
        if(input?.action?.t!=='open')return route.abort();
        moves++;
        return route.fulfill({status:200,contentType:'text/x-component',body:`0:{"a":"$@1","f":""}\n1:${JSON.stringify({success:true,view:people,revision:moves,sessionToken:'mobile-layout-fixture'})}\n`});
      });
      await page.goto(`${base}/games/country-draft/play?mode=practice`,{waitUntil:'networkidle'});
      check(await page.locator('.dr-intro').isVisible(),'A first draft opens with its goal and scoring rule');
      check(await page.locator('.dr-country-card').evaluateAll((cards,height)=>cards.length===3&&cards.every(card=>card.getBoundingClientRect().bottom<=height),viewport.height),'Country choices stay fully visible below the first-draft intro');
      await page.locator('.dr-country-card').first().click();
      await page.locator('.dr-person-select').first().waitFor();
      const layout=await page.locator('.dr-person-card').evaluateAll(cards=>cards.map(card=>{
        const box=card.getBoundingClientRect(),info=card.querySelector('.dr-info'),target=info.getBoundingClientRect();
        const copy=card.querySelector('.dr-person-copy'),text=copy.getBoundingClientRect();
        return {top:box.top,bottom:box.bottom,left:box.left,right:box.right,infoWidth:target.width,infoHeight:target.height,
          infoWithinCard:target.left>=box.left&&target.right<=box.right&&target.top>=box.top&&target.bottom<=box.bottom,
          textBeforeInfo:text.right<=target.left+1,textFits:copy.scrollWidth<=copy.clientWidth+1,
          infoReceivesTap:document.elementFromPoint(target.x+target.width/2,target.y+target.height/2)?.closest('.dr-info')===info};
      }));
      check(layout.length===3,'Exactly three genuine fixture people are displayed');
      check(await page.evaluate(()=>scrollY<=1),'People stage starts at the top without requiring a scroll');
      check(layout.every(row=>row.top>=0&&row.bottom<=viewport.height-8&&row.left>=0&&row.right<=viewport.width),'All three people fit completely inside the phone viewport');
      check(layout.every((row,index)=>index===0||row.top>=layout[index-1].bottom+7),'Person cards have distinct non-overlapping rows');
      check(layout.every(row=>row.infoWidth>=44&&row.infoHeight>=44&&row.infoWithinCard),'Every Info target is at least44px and inside its card');
      check(layout.every(row=>row.textBeforeInfo&&row.textFits&&row.infoReceivesTap),'Names avoid Info targets and each Info button receives its own tap');
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Compact people board has no horizontal overflow');
      await page.screenshot({path:`${output}/people-${viewport.width}x${viewport.height}.png`});
      const info=page.locator('.dr-info').last(),person=page.locator('.dr-person-select').last();
      await info.click();
      const detail=page.locator('.dr-detail-sheet');await detail.waitFor();
      await detail.evaluate(node=>Promise.all(node.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
      const detailBounds=await detail.evaluate(node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:innerWidth,height:innerHeight,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight,overflowY:getComputedStyle(node).overflowY};});
      check(detailBounds.top>=0&&detailBounds.bottom<=viewport.height+1&&detailBounds.left>=0&&detailBounds.right<=viewport.width+1,`Person details stay within the mobile viewport: ${JSON.stringify(detailBounds)}`);
      check(detailBounds.scrollHeight<=detailBounds.clientHeight+1||['auto','scroll'].includes(detailBounds.overflowY),'Long person detail content remains scrollable within the bounded sheet');
      const closeDetail=detail.getByRole('button',{name:'Close person details',exact:true});
      check(await closeDetail.evaluate(node=>{const r=node.getBoundingClientRect();return r.width>=44&&r.height>=44&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===node;}),'Details close has a clear44px tap target');
      await closeDetail.click();
      check(await detail.count()===0&&await info.evaluate(node=>document.activeElement===node),'Closing person details restores the original Info focus');
      await person.click();
      const jobs=page.locator('.dr-job-sheet');await jobs.waitFor();
      await jobs.evaluate(node=>Promise.all(node.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
      check(await jobs.evaluate(node=>{const r=node.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1&&node.scrollWidth<=node.clientWidth+1;}),'Job sheet stays within the viewport with no horizontal clipping');
      check(await jobs.locator('.dr-job-option').count()===5,'All five available jobs remain reachable');
      check(await jobs.locator('.dr-job-option').evaluateAll(nodes=>nodes.every((node,index)=>{const r=node.getBoundingClientRect(),previous=nodes[index-1]?.getBoundingClientRect();return r.height>=44&&r.width>=44&&(!previous||r.top>=previous.bottom);})), 'Job choices retain large separate touch targets');
      await page.screenshot({path:`${output}/jobs-${viewport.width}x${viewport.height}.png`});
      await jobs.getByRole('button',{name:'Put person back',exact:true}).click();
      check(await jobs.count()===0&&await person.evaluate(node=>document.activeElement===node),'Cancelling job selection restores the selected person focus');
      check(moves===1,'Opening and closing local details/job sheets adds no canonical move');
      check(errors.length===0,`No mobile runtime errors: ${errors.join('; ')}`);
      mobileLayouts.push({viewport,people:layout,canonicalMoves:moves,interceptedPosts,realMutationPosts:0});
      await context.close();
    }
  } else {
  for (const width of [320, 390, 1440]) for (const reducedMotion of ['reduce', 'no-preference']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let posts = 0;
    await page.route('**/*', async route => {
      if (route.request().method() !== 'POST') return route.continue(); if (!route.request().headers()['next-action']) return route.fulfill({status: 204});
      const view = [people, seated, done, draftView(initial)][Math.min(posts++, 3)];
      return route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify({ success: true, view, revision: posts, sessionToken: `presentation-${posts}` })}\n` });
    });
    await page.goto(`${base}/games/country-draft/play?mode=practice`, { waitUntil: 'networkidle' });
    await page.locator('.dr-country-card').first().click();
    await page.locator('.dr-person-select').first().click();
    const options = page.locator('.dr-job-options');
    check(await options.getByText('Seat as Science & ideas', { exact: true }).count() === 1, 'Science meaning is visible at the decision');
    check(await options.getByText('Science, invention and exploration', { exact: true }).count() === 1, 'Neutral role description includes exploration');
    check(!/\b(?:fit|fame|points|natural|strong|thin|\d+)\b/i.test(await options.innerText()), 'Role options reveal no individual points or fit');
    await options.getByRole('button', { name: /^Seat as Leader/ }).click();
    await page.getByRole('button', { name: 'Reveal my cabinet', exact: true }).click();
    await page.locator('.dr-result-card').first().waitFor();
    check(await page.getByRole('button', { name: /^(Share result|Challenge a friend)$/ }).isEnabled(), 'The one share is available during the reveal');
    check(await page.getByRole('button', { name: 'One more draft', exact: true }).isEnabled(), 'Replay is available during the reveal');
    if (reducedMotion === 'no-preference') {
      const skip = page.getByRole('button', { name: 'Skip animation', exact: true });
      if (await skip.count()) { await skip.click(); check(await page.locator('.dr-map-revealing').count() === 0, 'Skip immediately reveals the complete map'); }
      else check(await page.locator('.dr-map-revealing').count() === 0, 'Natural animation completion releases promoted layers');
    } else {
      check(await page.locator('.dr-map-wave').evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none')), 'Reduced motion has no map animation');
      check(await page.getByRole('button', { name: 'Skip animation', exact: true }).count() === 0, 'Reduced motion needs no skip action');
    }
    check(await page.locator('.dr-campaign-pick').count() === 2, 'The completed cabinet identifies two different appointments');
    check((await page.locator('.dr-campaign-highlights').innerText()).includes(story.strongest.person.name), 'Standout is derived from this cabinet');
    check(await page.locator('.a-card .score .sr-only').innerText() === `Country Draft result: ${done.score} / 195`, 'Final result retains the canonical score');
    check(await page.locator('.dr-map').getAttribute('aria-label') === `${done.score} of 195 countries taken`, 'Map has an accurate accessible final count');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No horizontal overflow at ${width}`);
    await page.screenshot({ path: `${output}/result-${width}-${reducedMotion}.png`, fullPage: true });
    await page.getByRole('button', { name: 'One more draft', exact: true }).click();
    await page.getByRole('heading', { name: 'Pick a country', exact: true }).waitFor();
    check(await page.locator('.dr-campaign-highlights').count() === 0 && await page.locator('.dr-header-score .num').innerText() === '0', 'Replay resets story and score together');
    check(errors.length === 0, `No browser errors: ${errors.join('; ')}`);
    await context.close();
  }
  const fullContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const fullPage = await fullContext.newPage();
  let simulated = initial;
  let moves = 0;
  let resetNext = false;
  await fullPage.route('**/*', async route => {
    if (route.request().method() !== 'POST') return route.continue(); if (!route.request().headers()['next-action']) return route.fulfill({status: 204});
    const [input] = route.request().postDataJSON();
    const action = input?.action;
    moves++;
    if (resetNext) simulated = initial;
    else if (action?.t === 'open') simulated = openCountry(simulated, action.c);
    else if (action?.t === 'appoint') simulated = appoint(simulated, action.i, action.s);
    else if (action?.t === 'next') simulated = nextRound(simulated);
    else if (!action) simulated = initial;
    else throw new Error(`Unexpected fixture action: ${JSON.stringify(action)}`);
    const view = draftView(simulated, true);
    return route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify({ success: !resetNext, reset: resetNext, view, revision: resetNext ? 0 : moves, sessionToken: `full-${moves}` })}\n` });
  });
  await fullPage.goto(`${base}/games/country-draft/play?mode=practice`, { waitUntil: 'networkidle' });
  const introText = await fullPage.locator('.dr-intro').innerText();
  check(/up to 25/.test(introText) && /up to 10/.test(introText) && /five jobs/i.test(introText), 'A first draft states the goal and both scoring parts before any choice');
  check(await fullPage.locator('.dr-meters').innerText().then(text => ['Bonuses', 'No bad fits', '3 regions', 'Two eras'].every(name => text.includes(name))), 'All three cabinet bonuses are tracked on the board');
  check(await fullPage.locator('.dr-stage-title .dr-step-hint').isVisible(), 'Round one says what opening a country leads to');
  let clicks = 0;
  for (let round = 0; round < 5; round++) {
    if (round > 0) check(await fullPage.locator('.dr-intro, .dr-step-hint').count() === 0, 'First-draft guidance stays on round one');
    await fullPage.locator('.dr-country-card').first().click(); clicks++;
    await fullPage.locator('.dr-person-select').first().waitFor();
    if (round === 0) check(await fullPage.locator('.dr-intro').count() === 0 && await fullPage.locator('.dr-person-prompt .dr-step-hint').isVisible(), 'The intro leaves once a country is open and the person step explains what to look for');
    await fullPage.locator('.dr-person-select').first().click(); clicks++;
    check(await fullPage.locator('.dr-job-option').count() === 5 - round, 'Only still-open jobs are offered');
    if (round < 4) check(await fullPage.locator('.dr-sheet-hint').isVisible() && !/\d/.test(await fullPage.locator('.dr-sheet-hint').innerText()), 'The job sheet states the scoring rule without previewing a number');
    else check(await fullPage.locator('.dr-sheet-hint').count() === 0, 'The last job needs no choice hint');
    await fullPage.locator('.dr-job-option').first().click(); clicks++;
    await fullPage.locator('.dr-reveal-score').waitFor();
    check(/ \d+ of 25 \+ fame \d+ of 10$/.test(await fullPage.locator('.dr-reveal-score > .t-meta').innerText()), 'The reveal shows fit and fame against their maximums');
    await fullPage.getByRole('button', { name: round === 4 ? 'Reveal my cabinet' : 'Next country', exact: true }).click(); clicks++;
    await fullPage.waitForFunction(() => document.querySelector('.dr-game .session-notice')?.getAttribute('data-state') === 'idle');
    // The header HUD leaves once the cabinet is complete; the result card then holds the score.
    check(round === 4 ? await fullPage.locator('.dr-header-score').count() === 0 : await fullPage.locator('.dr-header-score .num').innerText() === String(draftView(simulated).score), 'Early Next cannot freeze an intermediate score');
  }
  check(clicks === 20 && moves === 15, 'Complete draft needs exactly 20 intentional clicks and 15 canonical commits');
  check(await fullPage.locator('.a-card .score .sr-only').innerText() === `Country Draft result: ${draftView(simulated).score} / 195`, 'Complete flow shows the actual simulated score');
  check((await fullContext.cookies()).some(cookie => cookie.name === 'cv_draft_rules_seen' && cookie.value === '1'), 'Finishing a draft remembers that the instructions were seen');
  await fullPage.getByRole('button', { name: 'One more draft', exact: true }).click();
  await fullPage.getByRole('heading', { name: 'Pick a country', exact: true }).waitFor();
  check(await fullPage.locator('.dr-intro, .dr-step-hint').count() === 0, 'The next draft starts without first-game guidance');
  resetNext = true;
  await fullPage.locator('.dr-country-card').first().click();
  await fullPage.getByText('Practice roster updated. A fresh draft is ready.', { exact: true }).waitFor();
  check(await fullPage.getByRole('button', { name: 'Try again', exact: true }).count() === 0, 'A roster reset never offers to retry stale indices');
  check(await fullPage.locator('.dr-person-select').count() === 0 && await fullPage.locator('.dr-header-score .num').innerText() === '0', 'A roster reset shows only the fresh canonical board');
  await fullContext.close();
  const returningContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await returningContext.addCookies([{ name: 'cv_draft_rules_seen', value: '1', url: base }]);
  const returningPage = await returningContext.newPage();
  await returningPage.route('**/*', route => route.request().method() === 'POST' ? route.abort() : route.continue());
  await returningPage.goto(`${base}/games/country-draft/play?mode=practice`, { waitUntil: 'networkidle' });
  check(await returningPage.locator('.dr-intro, .dr-step-hint').count() === 0 && await returningPage.locator('.dr-country-card').count() === 3, 'A device that finished a draft goes straight to the choices');
  await returningContext.close();
  }
  if(mobileLayoutOnly) writeFileSync(`${output}/mobile-layout-report.json`,JSON.stringify({checks,scope:'Three small phone layouts; every POST intercepted, canonical open acknowledgement synthetic.',writesToDatabase:0,mobileLayouts},null,2)+'\n');
  else writeFileSync(`${output}/report.json`, JSON.stringify({ checks, writesToDatabase: 0, widths: [320, 390, 1440], motion: ['reduce', 'no-preference'] }, null, 2));
  console.log(`Draft ${mobileLayoutOnly?'mobile layout':'presentation'}: ${checks} checks passed; every tested game acknowledgement is a local fixture.`);
} finally { await browser.close(); }
