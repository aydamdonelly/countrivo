// Real SSR components and native browser pixels; no game submissions or database writes.
import assert from 'node:assert/strict';
import Module from 'node:module';
import {createRequire} from 'node:module';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {require as tsxRequire} from 'tsx/cjs/api';

const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3290';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local only.');
const originalLoad = Module._load;
const originalCss = Module._extensions['.css'];
Module._extensions['.css'] = () => undefined;
Module._load = function(request, parent, isMain) {
  if (request === 'server-only') return {};
  if (request.endsWith('.css')) return {};
  if (/(?:^|\/)game-play-link$/.test(request)) return {GamePlayLink:({children, href}) => React.createElement('a', {href}, children)};
  if (/(?:^|\/)navigation-link$/.test(request)) return {NavigationLink:({children, href, className, ...props}) => React.createElement('a', {href, className, 'data-game':props['data-game']}, children)};
  return originalLoad.call(this, request, parent, isMain);
};
let checks = 0;
const check = (value, label) => {assert(value, label); checks++;};
const out = '.check-render/daily-clay';
mkdirSync(out, {recursive:true});
let games, Clay, GameCard, GameRow, readDone;
try {
  ({Clay} = tsxRequire('../src/ui/clay.tsx', import.meta.url));
  ({GameCard} = tsxRequire('../src/ui/game-card.tsx', import.meta.url));
  ({GameRow} = tsxRequire('../src/ui/game-row.tsx', import.meta.url));
  ({readDone} = tsxRequire('../src/server/progress.ts', import.meta.url));
  const all = tsxRequire('../src/content/table.ts', import.meta.url).TABLE_GAMES;
  const {getAllGames,getDailyGames}=tsxRequire('../src/lib/data/registry.ts',import.meta.url);
  const {mainDailies,practiceGames}=tsxRequire('../src/features/home/lists.ts',import.meta.url);
  const {dailyRefs}=tsxRequire('../src/features/play/server.ts',import.meta.url);
  // 25 November 2026: registry order, Flag Quiz last among the seven dailies, then the practice drills.
  const order=['country-draft','geo-wordle','higher-or-lower','pinpoint','stat-guesser','blind-pick','flag-quiz','speed-flags','capital-quiz'];
  const slugs=items=>items.map(item=>item.slug);
  check(JSON.stringify(slugs(getAllGames()))===JSON.stringify(order),'Central roster follows the registry order');
  check(JSON.stringify(slugs(all))===JSON.stringify(order),'All visual presentations follow the complete central roster');
  check(JSON.stringify(slugs(dailyRefs()))===JSON.stringify(slugs(getDailyGames())),'Next-game choices follow the central daily order');
  check(JSON.stringify(slugs(mainDailies()))===JSON.stringify(order.slice(1,7)),'Daily list follows registry order after its Draft anchor');
  check(JSON.stringify(slugs(practiceGames()))===JSON.stringify(order.slice(1)),'Practice list follows the same central order');
  games = all.filter(game => getDailyGames().some(daily=>daily.slug===game.slug));
} finally {
  Module._load = originalLoad;
  if (originalCss) Module._extensions['.css'] = originalCss;
  else delete Module._extensions['.css'];
}
let renderId = 0;
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props), {identifierPrefix:`fixture-${renderId++}-`});
const day = '2026-10-28', edition = 'daily-clay-test';
const scores = Object.fromEntries(games.map(game => [game.slug, '0']));
const done = (date = day, e = edition) => readDone({get:() => ({value:encodeURIComponent(JSON.stringify({d:date,e,g:scores}))})},day,edition);
for (const game of games) {
  for (const [kind, props, expected] of [
    ['fresh', {}, 'monochrome'],
    ['in progress', {progress:'Board in progress'}, 'monochrome'],
    ['complete, including zero score', {score:done()[game.slug]}, 'color'],
    ['practice with daily score', {practice:true,score:done()[game.slug]}, 'monochrome'],
    ['yesterday', {score:done('2026-10-27')[game.slug]}, 'monochrome'],
    ['another edition', {score:done(day,'old-edition')[game.slug]}, 'monochrome'],
  ]) {
    const html = render(GameCard, {game,...props});
    check(html.includes(`data-clay-tone="${expected}"`), `${game.slug}: ${kind} has ${expected} in first HTML`);
    check(!html.includes('<filter')&&!html.includes('filter:'), `${game.slug}: no SVG tint or inline filter`);
    check(html.includes(`/${game.done}-color.webp`) === (expected === 'color'), `${game.slug}: ${kind} selects the dedicated generated bitmap only when completed today`);
  }
  const row=render(GameRow,{slug:game.slug,title:game.title,href:`/games/${game.slug}/play?mode=daily`,dailyCompleted:true});
  check(row.includes('data-clay-tone="color"')&&row.includes(`/${game.done}-color.webp`), 'Daily rows share the generated completed artwork');
  check(render(GameRow,{slug:game.slug,title:game.title,href:`/games/${game.slug}/play?mode=practice`}).includes('data-clay-tone="monochrome"'), 'Practice rows stay monochrome');
}
const allHtml = renderToStaticMarkup(React.createElement('div',null,...games.map(game => React.createElement(GameCard,{key:game.slug,game,score:'0'}))));
check(!allHtml.includes('<filter')&&!allHtml.includes('clay-material'), 'The full completed set contains no procedural SVG material');

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to the installed playwright-core/index.mjs.');
const {chromium,webkit} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const sharp = createRequire(import.meta.url)('sharp');
for(const game of games){
  for(const width of [128,256,480]){
    const file=`public/clay/${game.clay}/${game.done}-color${width===480?'':`.${width}`}.webp`;
    const metadata=await sharp(file).metadata();
    check(metadata.width===width&&metadata.height===width&&metadata.hasAlpha,`${file}: correct square resolution and transparency`);
  }
}
const tokens = readFileSync('src/styles/tokens.css','utf8').replace(/@theme\s*\{/g,':root {');
const palette = {'country-draft':'draft','geo-wordle':'geo','pinpoint':'pin','blind-pick':'blind','higher-or-lower':'higher','stat-guesser':'stat'};
const rules = Object.entries(palette).map(([slug,token]) => `[data-game="${slug}"]{--game-accent:var(--color-game-${token})}`).join('');
const art = (game,tone) => `<div class="art" data-game="${game.slug}" data-tone="${tone}">${render(Clay,{object:game.clay,state:game.done,tone,loading:'eager',sizes:'480px'})}</div>`;
const fixture = `<html><head><base href="${base}/"><style>${tokens}\n${readFileSync('src/ui/clay.css','utf8')}\n${rules}\n*{box-sizing:border-box}body{margin:0;background:transparent;font:14px system-ui}.pair{display:flex}.art,.clay-object{position:relative;display:block;width:480px;height:480px}.clay-object img{display:block;width:100%;height:100%;object-fit:contain}.clay-motion-frame{position:absolute;inset:0}h2{margin:0;padding:12px}.tile{background:var(--game-accent);border-radius:12px;display:flex;flex-direction:column;align-items:center;padding:16px}.tile .art,.tile .clay-object{width:112px;height:112px}.tile h2{font-size:18px;text-align:center}.proof{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px;background:var(--color-paper)}@media(max-width:500px){.proof{grid-template-columns:repeat(2,1fr);gap:12px;padding:12px}.tile .art,.tile .clay-object{width:72px;height:72px}.tile h2{font-size:16px}}</style></head><body>${games.map(game=>`<section class="pair">${art(game,'monochrome')}${art(game,'color')}</section>`).join('')}</body></html>`;
const pixelReports = [];
for (const [name, browserType] of [['chromium',chromium],['webkit',webkit]]) {
  const browser = await browserType.launch({headless:true,...(name==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:process.env.PLAYWRIGHT_WEBKIT?{executablePath:process.env.PLAYWRIGHT_WEBKIT}:{})});
  try {
    const page = await browser.newPage({viewport:{width:1000,height:900},reducedMotion:'reduce'});
    await page.route('**/*',route => route.request().method() === 'POST' ? route.abort('blockedbyclient') : route.continue());
    await page.setContent(fixture);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    check(await page.locator('filter').count()===0, `${name}: artwork uses no SVG material`);
    check(await page.locator('[data-tone="color"] img').evaluateAll(images=>images.every(image=>/-color(?:\.(?:128|256))?\.webp$/.test(new URL(image.currentSrc).pathname)&&getComputedStyle(image).filter==='none')), `${name}: decoded generated color bitmaps have no filter`);
    for (const game of games) {
      const raw = [];
      for (const tone of ['monochrome','color']) {
        const node = page.locator(`.art[data-game="${game.slug}"][data-tone="${tone}"]`);
        const buffer = await node.screenshot({omitBackground:true});
        raw.push(await sharp(buffer).ensureAlpha().raw().toBuffer());
      }
      let colorChroma=0,colorVisible=0,neutralVisible=0,neutralChroma=0,strongColor=0,edgeAlpha=0;
      for(let i=0;i<raw[0].length;i+=4){
        if(raw[0][i+3]>240){
          neutralVisible++;
          neutralChroma+=Math.max(...raw[0].subarray(i,i+3))-Math.min(...raw[0].subarray(i,i+3));
        }
        if(raw[1][i+3]>240){
          colorVisible++; const chroma=Math.max(...raw[1].subarray(i,i+3))-Math.min(...raw[1].subarray(i,i+3));
          colorChroma+=chroma;if(chroma>=25)strongColor++;
        }
        const pixel=i/4,x=pixel%480,y=Math.floor(pixel/480);
        if(x<4||x>=476||y<4||y>=476)edgeAlpha=Math.max(edgeAlpha,raw[1][i+3]);
      }
      check(neutralVisible>2000&&colorVisible>2000, `${name} ${game.slug}: both original and generated objects are visible`);
      check(edgeAlpha<=1, `${name} ${game.slug}: color artwork keeps transparent padding without clipping`);
      check(neutralChroma/neutralVisible<1, `${name} ${game.slug}: unplayed artwork is monochrome`);
      check(colorChroma/colorVisible>25&&strongColor/colorVisible>0.4, `${name} ${game.slug}: solid visible color, not a faint tint (${colorChroma/colorVisible})`);
      pixelReports.push({browser:name,game:game.slug,edgeAlpha,meanChroma:colorChroma/colorVisible,strongColorFraction:strongColor/colorVisible});
    }
    await page.evaluate(titles => {
      const proof=document.createElement('div');proof.className='proof';
      document.querySelectorAll('.pair').forEach(pair => {
        const art=pair.querySelector('[data-tone="color"]');
        const tile=document.createElement('div');tile.className='tile';tile.dataset.game=art.dataset.game;
        const title=document.createElement('h2');title.textContent=titles[art.dataset.game];
        tile.append(art,title);proof.append(tile);
      });
      document.body.replaceChildren(proof);
    },Object.fromEntries(games.map(game=>[game.slug,game.title])));
    for(const width of [320,1440]){
      await page.setViewportSize({width,height:900});
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${name} ${width}: no overflow`);
      await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true});
    }
  } finally {await browser.close();}
}
writeFileSync(`${out}/report.json`,JSON.stringify({checkedAt:new Date().toISOString(),checks,pixelReports},null,2)+'\n');
console.log(`${checks} daily clay checks passed: central order, SSR mode/date/edition, dedicated color bitmaps and transparent padding in Chromium/WebKit; no writes.`);
