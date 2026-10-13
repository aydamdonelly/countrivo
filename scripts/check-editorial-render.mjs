import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
if (!modulePath) throw new Error('Set PLAYWRIGHT_MODULE to the installed playwright-core/index.mjs path.');
const { chromium } = await import(pathToFileURL(modulePath).href);
const base = process.env.COUNTRIVO_QA_BASE ?? 'http://localhost:3291';
const browser = await chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
let checks = 0;
function check(condition, label) {
  checks++;
  if (!condition) throw new Error(label);
}

try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({viewport:{width, height:844}, reducedMotion:'reduce'});
    for (const route of ['/categories/population', '/lists/countries-in-africa', '/lists/countries-in-asia', '/lists/countries-in-europe', '/lists/countries-in-americas', '/lists/countries-in-oceania', '/lists/highest-fertility-rate', '/lists/largest-countries']) {
      const response = await page.goto(base + route, {waitUntil:'networkidle'});
      await page.evaluate(() => document.fonts.ready);
      const measured = await page.evaluate(() => {
        const facts = Array.from(document.querySelectorAll('.cat-facts .f, .list-facts .f'));
        return {
          pageFits: document.documentElement.scrollWidth <= innerWidth + 1,
          namesFit: Array.from(document.querySelectorAll('.rank .nm a')).every(name => name.scrollWidth <= name.clientWidth + 1 && getComputedStyle(name).whiteSpace !== 'nowrap'),
          valuesFit: facts.every(tile => {
            const value = tile.querySelector('.v');
            if (!value) return false;
            const a = tile.getBoundingClientRect(), b = value.getBoundingClientRect();
            return b.right <= a.right + 1 && b.left >= a.left - 1 && value.scrollWidth <= value.clientWidth + 1;
          }),
          tilesDoNotOverlap: facts.every((tile, i) => facts.slice(i + 1).every(other => {
            const a = tile.getBoundingClientRect(), b = other.getBoundingClientRect();
            return a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1;
          })),
        };
      });
      check(response?.status() === 200, `${route} @${width}: HTTP`);
      check(measured.pageFits, `${route} @${width}: page overflow`);
      check(measured.namesFit, `${route} @${width}: truncated country name`);
      check(measured.valuesFit, `${route} @${width}: fact value outside its tile`);
      check(measured.tilesDoNotOverlap, `${route} @${width}: overlapping fact tiles`);
    }
    if (width === 320) {
      await page.goto(base + '/lists/countries-in-africa', {waitUntil:'networkidle'});
      const quiz = page.locator('.name-all');
      const input = quiz.getByRole('textbox');
      const add = quiz.getByRole('button', {name:'Add country', exact:true});
      await input.fill('Ivory Coast');
      await input.press('Enter');
      await quiz.getByRole('heading', {name:'Your countries', exact:true}).waitFor();
      check(await quiz.locator('.name-all-country').count() === 1, '320px continent quiz accepts country');
      await input.fill('Côte d’Ivoire');
      await input.press('Enter');
      check(await quiz.locator('.name-all-country').count() === 1, '320px continent quiz rejects duplicate alias');
      const box = await add.boundingBox();
      check(box && box.height >= 44 && box.x >= 0 && box.x + box.width <= 320, '320px quiz add button fits and has a touch target');
      await quiz.getByRole('button', {name:'Give up and show the rest', exact:true}).click();
      check(await quiz.locator('.name-all-country').count() === 54, '320px give up reveals every sovereign African country');
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '320px revealed country list fits');
      await page.goto(base + '/lists/countries-in-oceania', {waitUntil:'networkidle'});
      const pacific = page.locator('.name-all');
      await pacific.getByRole('textbox').fill('Tuvalu');
      await pacific.getByRole('textbox').press('Enter');
      check(await pacific.locator('circle title').textContent() === 'Tuvalu', 'Oceania quiz marks Tuvalu even without a polygon');
      await pacific.getByRole('textbox').fill('Australia');
      await pacific.getByRole('textbox').press('Enter');
      check(await pacific.locator('.name-all-country').count() === 2, 'Oceania quiz includes Australia');
      await pacific.getByRole('button', {name:'Give up and show the rest', exact:true}).click();
      check(await pacific.locator('.name-all-country').count() === 14, 'Oceania quiz counts 14 sovereign countries');
    }
    await page.close();
  }
  console.log(`check-editorial-render: ${checks} narrow-screen fact, ranking and continent-form checks passed`);
} finally {
  await browser.close();
}
