// Local UI regression with synthetic server responses. No move reaches the database.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const installed = process.env.PLAYWRIGHT_MODULE;
if (!installed) throw new Error("Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.");
const { chromium } = await import(pathToFileURL(installed).href);
const base = process.env.COUNTRIVO_QA_BASE ?? "http://localhost:3292";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("This check is local only.");
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const cases = [
  { slug: "higher-or-lower", answer: ".qr-call", next: "Next pair", stage: ".qr-question", marker: "Is Spain higher or lower than France?", protected: ".qr-verdict", controls: ".qr-call" },
  { slug: "flag-quiz", answer: ".fq-opt", next: "Next flag", stage: ".fq-meta", marker: "Flag 2 of 10", protected: ".fq-family .t-body", controls: ".fq-opt" },
  { slug: "stat-guesser", answer: ".sg-cta", next: "Next", stage: ".sg-name b", marker: "Spain", protected: ".sg-truth", controls: ".sg-cta" },
];

function fixture(slug, phase, round = 0) {
  const common = { kind: slug, mode: "practice", phase, round, total: slug === "stat-guesser" ? 5 : 10, score: "1 of 13", progress: { done: 1, total: 10, label: "score", value: "1", extra: "of 13" }, shareText: "", history: [] };
  const reveal = phase === "reveal";
  if (slug === "higher-or-lower") return { ...common, left: { name: round ? "France" : "Germany", iso2: round ? "fr" : "de", value: "68 million" }, right: { name: round ? "Spain" : "France", iso2: round ? "es" : "fr", value: reveal ? "48 million" : null }, stat: "Population, 2023", unit: "People", chosen: reveal ? "lower" : null, correct: reveal ? true : null, comparison: reveal ? "France: 48 million." : null, source: "Source: World Bank, 2023", doubled: false };
  if (slug === "flag-quiz") return { ...common, flagSrc: round ? "/quiz-flags/c588dbd85c7d9ff0694b689cf43bbfc4a22d8a92.svg" : "/flags/fr.svg", options: ["France", "Germany", "Spain", "Portugal"], picked: reveal ? 0 : null, correctIndex: reveal ? 0 : null, fact: null, source: null, doubled: false };
  return { ...common, country: { name: round ? "Spain" : "France", iso2: round ? "es" : "fr" }, stat: "Population, 2023", unit: "", ruler: { min: 100000, max: 1000000000, steps: [100000, 1000000, 10000000, 100000000, 1000000000], coarse: [0, 1, 2, 3, 4], kind: "magnitude" }, refs: [{ name: "Portugal", iso2: "pt", value: 10000000 }, { name: "India", iso2: "in", value: 1000000000 }], actualValue: reveal ? 68000000 : null, guessValue: reveal ? 10000000 : null, points: reveal ? 50 : null, context: reveal ? "One of Europe's larger countries." : null, gap: reveal ? "Your guess was lower." : null, doubled: false };
}

function respond(route, view, revision, success = true) {
  const result = { success, view, revision, sessionToken: `fixture-${revision}`, ...(success ? {} : { error: "Move was not saved." }) };
  return route.fulfill({ status: 200, contentType: "text/x-component", body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify(result)}\n` });
}

let checks = 0;
const latencies = [];
try {
  for (const scenario of cases) {
    for (const outcome of ["success", "failure", "stale", "network"]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const reveal = fixture(scenario.slug, "reveal");
      const next = fixture(scenario.slug, "playing", 1);
      reveal.nextView = next;
      let requests = 0;
      await page.route("**/*", async route => {
        const request = route.request();
        if (request.method() !== "POST" || !request.headers()["next-action"]) return route.continue();
        requests++;
        if (requests === 1) return respond(route, reveal, 1);
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (outcome === "network") return route.abort("failed");
        return outcome === "success" ? respond(route, next, 2) : respond(route, reveal, 1, outcome === "stale");
      });
      await page.goto(`${base}/games/${scenario.slug}/play?mode=practice`, { waitUntil: "networkidle" });
      await page.locator(scenario.answer).first().click();
      const button = page.getByRole("button", { name: scenario.next, exact: true });
      try { await button.waitFor({ timeout: 5000 }); }
      catch (error) { console.error({ requests, errors, body: await page.locator("body").innerText() }); throw error; }
      if (scenario.slug === "flag-quiz") {
        await page.waitForFunction(src => performance.getEntriesByType("resource").some(entry => entry.name.endsWith(src)), next.flagSrc);
      }
      const score = await page.locator(".prog").textContent();
      await button.evaluate(element => element.addEventListener("click", () => { document.documentElement.dataset.nextClickedAt = String(performance.now()); }, { once: true }));
      await button.click();
      await page.waitForFunction(({ selector, text }) => {
        const stage = document.querySelector(selector);
        if (stage?.textContent === text) {
          document.documentElement.dataset.nextLatency = String(performance.now() - Number(document.documentElement.dataset.nextClickedAt));
          return true;
        }
        return false;
      }, { selector: scenario.stage, text: scenario.marker });
      const latency = Number(await page.locator("html").getAttribute("data-next-latency"));
      assert.ok(latency < 150, `${scenario.slug}/${outcome}: next stage took ${latency.toFixed(1)} ms`); checks++;
      latencies.push(latency);
      assert.equal(await page.locator(scenario.protected).count(), 0, "No unanswered result may appear in a preview"); checks++;
      if (scenario.slug === "flag-quiz") {
        assert.ok(await page.locator(".fq-box img").evaluate(image => image.complete && image.naturalWidth > 0), "The next opaque flag is already loaded when its preview opens"); checks++;
      }
      assert.equal(await page.locator(".prog").textContent(), score, "No score or pip advances before acknowledgement"); checks++;
      assert.equal(await page.locator(scenario.controls).first().isDisabled(), true, "The next answer cannot race the pending Next commit"); checks++;
      await page.keyboard.press(scenario.slug === "flag-quiz" ? "2" : scenario.slug === "higher-or-lower" ? "h" : "Enter");
      if (scenario.slug === "stat-guesser") {
        const slider = page.getByRole("slider");
        assert.equal(await slider.getAttribute("aria-disabled"), "false", "The neutral ruler remains editable"); checks++;
        const pin = await slider.getAttribute("aria-valuenow");
        await page.keyboard.press("End");
        assert.notEqual(await slider.getAttribute("aria-valuenow"), pin, "Local ruler edit responds during persistence"); checks++;
      }
      await page.waitForTimeout(60);
      assert.equal(requests, 2, "Rapid keys cannot submit a second action while Next saves"); checks++;
      if (outcome === "success") {
        await page.waitForFunction(selector => !document.querySelector(selector).disabled, scenario.controls);
        assert.equal(await page.locator(scenario.stage).textContent(), scenario.marker, "Acknowledged stage stays in place"); checks++;
        if (scenario.slug === "stat-guesser") {
          assert.equal(await page.getByRole("slider").getAttribute("aria-valuenow"), "4", "Successful acknowledgement preserves the edited pin"); checks++;
        }
      } else {
        await button.waitFor();
        assert.equal(await button.isEnabled(), true, "Failed or stale Next restores canonical reveal for retry"); checks++;
        if (outcome !== "stale") { assert.equal(await page.locator('.quick-remote [role="alert"]').count(), 1, "Failed persistence gives a retry error"); checks++; }
      }
      assert.deepEqual(errors, [], "UI must not throw during preview recovery"); checks++;
      console.log(`${scenario.slug}/${outcome}: next challenge ${latency.toFixed(1)} ms with a 1,200 ms response delay`);
      await context.close();
    }
  }
  // Old servers and final rounds must keep their canonical reveal until the response arrives.
  for (const final of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const reveal = fixture("flag-quiz", "reveal", final ? 9 : 0);
    const finished = { ...reveal, phase: "finished", shareText: "A finished practice flag quiz." };
    let requests = 0;
    await page.route("**/*", async route => {
      if (route.request().method() !== "POST" || !route.request().headers()["next-action"]) return route.continue();
      requests++;
      if (requests === 1) return respond(route, reveal, 1);
      await new Promise(resolve => setTimeout(resolve, 1200));
      return respond(route, final ? finished : fixture("flag-quiz", "playing", 1), 2);
    });
    await page.goto(`${base}/games/flag-quiz/play?mode=practice`, { waitUntil: "networkidle" });
    await page.locator(".fq-opt").first().click();
    const button = page.getByRole("button", { name: final ? "See result" : "Next flag", exact: true });
    await button.click();
    assert.equal(await page.locator(".fq-family .t-body").count(), 1, "Legacy/final reveal remains while saving"); checks++;
    assert.equal(await page.locator(".rp").count(), 0, "No result panel before server confirmation"); checks++;
    await page.waitForFunction(() => document.querySelector('.quick-remote[aria-busy="false"]'));
    assert.equal(requests, 2, "Legacy/final Next commits once"); checks++;
    await context.close();
  }
  console.log(`check-instant-quick-next: ${checks} checks passed; ${Math.min(...latencies).toFixed(1)}–${Math.max(...latencies).toFixed(1)} ms next-stage feedback; no runs written`);
} finally {
  await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]);
}
process.exit(0);
