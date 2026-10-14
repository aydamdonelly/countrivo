import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import postcss from 'postcss';
import legacyPlugin from './postcss-legacy.cjs';

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.');
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3296';
const directory = '.check-render/legacy-css';
mkdirSync(directory,{recursive:true});
let checks = 0;
function check(value,message) {assert(value,message);checks++;}
const isLegacy = rule => rule.type === 'atrule' && rule.name === 'supports' && rule.params.replace(/\s/g,'') === 'not(color:color-mix(insrgb,red,blue))';

function isolateLegacy(css) {
  const root = postcss.parse(css);
  const legacy = root.nodes.filter(isLegacy);
  return legacy.length ? legacy.flatMap(rule=>rule.nodes.map(node=>node.toString())).join('\n') : css;
}

for (const file of readdirSync('.next/static/chunks').filter(file=>file.endsWith('.css'))) {
  const root = postcss.parse(readFileSync(`.next/static/chunks/${file}`,'utf8'));
  const fallbacks = root.nodes.filter(isLegacy);
  let nativeLayers = 0;root.walkAtRules('layer',()=>nativeLayers++);
  if (!nativeLayers) continue;
  check(fallbacks.length>0,`${file}: layered CSS includes a legacy copy`);
  for (const fallback of fallbacks) {
    let layers=0,properties=0,mixes=0,selectors=0,viewport=0;
    fallback.walkAtRules(rule=>{if(rule.name==='layer')layers++;if(rule.name==='property')properties++;});
    fallback.walkDecls(decl=>{if(decl.value.includes('color-mix('))mixes++;if(/\d(?:svh|dvh)/.test(decl.value))viewport++;});
    fallback.walkRules(rule=>{if(/:has\(|:popover-open|:open(?:\W|$)|:focus-visible/.test(rule.selector))selectors++;});
    check(layers===0,`${file}: legacy has no cascade layers`);
    check(properties===0,`${file}: legacy has no property registration requirement`);
    check(mixes===0,`${file}: legacy uses RGB colour fallbacks`);
    check(viewport===0,`${file}: legacy uses actual vh rather than svh/dvh`);
    check(selectors===0,`${file}: legacy has no unsupported state selectors`);
  }
}

const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const cases=[
  ['home','/','.game-tile-main,.game-tile-actions,.table-top'],
  ['flag','/games/flag-quiz/play?mode=daily','.play-root,.qr-header,.fq-box,.fq-opt'],
  ['stat','/games/stat-guesser/play?mode=daily','.play-root,.qr-header,.sg-ruler,.sg-knob,.sg-cta'],
  ['draft','/games/country-draft/play?mode=daily','.play-root,.dr-game,.dr-country-card,.dr-cabinet-strip,.dr-header-score'],
];
const layouts = new Map();const results=[];

try {
  // Earlier layers beat later layers for !important; ordinary utilities beat even IDs in base.
  const fixture='@layer base{#priority{color:red}.important{color:red!important}.pseudo::before{content:"";height:11px}}@layer components{.same .within{border-width:7px}.within{border-width:2px}.pseudo::before{height:13px}}@layer utilities{.fixture{color:blue}.important{color:green!important}}.unlayered{color:orange}';
  const compiled=(await postcss([legacyPlugin()]).process(fixture,{from:undefined})).css;
  const fixtureContext=await browser.newContext();const fixturePage=await fixtureContext.newPage();let expected;
  for(const legacy of [false,true]) {
    await fixturePage.setContent(`<style>${legacy?isolateLegacy(compiled):compiled}</style><div id="priority" class="fixture">Layer</div><div class="important">Important</div><div class="same"><div class="within">Same layer</div></div><div class="pseudo">Pseudo</div><div class="fixture unlayered">Unlayered</div>`);
    const values=await fixturePage.evaluate(()=>[
      getComputedStyle(document.querySelector('#priority')).color,
      getComputedStyle(document.querySelector('.important')).color,
      getComputedStyle(document.querySelector('.within')).borderWidth,
      getComputedStyle(document.querySelector('.pseudo'),'::before').height,
      getComputedStyle(document.querySelector('.unlayered')).color,
    ]);
    if(!legacy)expected=values;else check(JSON.stringify(values)===JSON.stringify(expected),'Legacy preserves layer, important, same-layer, pseudo-element and unlayered priorities');
  }
  await fixtureContext.close();
  for(const width of [390,1440])for(const legacy of [false,true]) {
    const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
    if(legacy)await context.addInitScript(()=>{
      delete HTMLElement.prototype.showPopover;delete HTMLElement.prototype.hidePopover;delete HTMLElement.prototype.togglePopover;
      const query=document.querySelector;
      document.querySelector=function(selector){if(selector.includes(':popover-open'))throw new DOMException('Unsupported selector','SyntaxError');return query.call(this,selector);};
    });
    const page=await context.newPage();const errors=[];let posts=0,isolatedStyles=0;
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/*',async route=>{
      const request=route.request();
      if(request.method()==='POST'&&request.headers()['next-action']){posts++;await route.abort();return;}
      if(legacy&&request.resourceType()==='stylesheet') {
        const response=await route.fetch();const text=await response.text();const css=isolateLegacy(text);isolatedStyles++;
        await route.fulfill({response,body:css});return;
      }
      await route.continue();
    });
    for(const [name,path,selector] of cases) {
      const response=await page.goto(base+path,{waitUntil:'networkidle'});
      await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>image.checkVisibility()&&image.getBoundingClientRect().top<innerHeight).map(image=>image.decode().catch(()=>{})));});
      check(response?.status()===200,`${name} ${width} ${legacy?'legacy':'modern'} HTTP`);
      check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),`${name} ${width}: no horizontal overflow`);
      const layout=await page.locator(selector).evaluateAll(elements=>elements.map(element=>{
        const box=element.getBoundingClientRect(),style=getComputedStyle(element);
        return {tag:element.tagName,visible:style.display!=='none',x:box.x,y:box.y,width:box.width,height:box.height,color:style.color,background:style.backgroundColor,font:style.fontFamily,fontSize:style.fontSize,lineHeight:style.lineHeight,padding:style.padding,radius:style.borderRadius};
      }));
      const key=`${name}-${width}`;
      if(!legacy)layouts.set(key,layout);else check(JSON.stringify(layout)===JSON.stringify(layouts.get(key)),`${key}: core layout, colours and typography match modern CSS`);
      await page.screenshot({path:`${directory}/${name}-${width}-${legacy?'legacy':'modern'}.png`,animations:'disabled'});
      const help=page.locator('.game-help-trigger');
      if(await help.count()===1){
        const panel=page.locator('.game-help-panel');check(!await panel.isVisible(),`${key}: help initially hidden`);
        await help.click();await panel.waitFor({state:'visible'});
        for(const key of ['h','n','1'])await page.keyboard.press(key);
        check(posts===0,`${name}: help never submits a game move`);
        await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});
        check(await help.evaluate(element=>element===document.activeElement),`${name}: Escape restores focus`);
      }
      check(errors.length===0,`${key}: no browser errors ${errors.join(', ')}`);
      results.push({name,width,legacy,posts,isolatedStyles,layout});
    }
    if(legacy)check(isolatedStyles>0,'Legacy pass uses transformed CSS rather than modern styles');
    await context.close();
  }
  writeFileSync(`${directory}/results.json`,JSON.stringify({checks,results},null,2));
  console.log(`Legacy CSS: ${checks} checks passed; modern and deliberately isolated legacy layouts match on phone and desktop. No real iOS15 device was used.`);
} finally {await browser.close();}
