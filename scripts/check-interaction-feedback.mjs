// A slow connection must acknowledge the choice without guessing its server-owned result.
// All move POSTs are held, then aborted: this check never writes a run.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const installed = process.env.PLAYWRIGHT_MODULE;
if (!installed) throw new Error("Set PLAYWRIGHT_MODULE to an existing playwright-core/index.mjs.");
const { chromium } = await import(pathToFileURL(installed).href);
const base = process.env.COUNTRIVO_QA_BASE ?? "http://localhost:3292";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("This check is local only.");
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const cases = [
  { slug: "higher-or-lower", control: ".qr-call", feedback: '.qr-call[aria-pressed="true"]', protected: ".qr-verdict", unchanged: ".qr-value", retryKey: "h" },
  { slug: "flag-quiz", control: ".fq-opt", feedback: '.fq-opt[aria-pressed="true"]', protected: ".fq-family .t-body", unchanged: ".fq-family", retryKey: "2" },
  { slug: "stat-guesser", control: ".sg-cta", feedback: '.sg-cta[aria-busy="true"]', protected: ".sg-truth", unchanged: ".sg-live", retryKey: "Enter" },
  { slug: "blind-pick", control: ".bp-slot.open", feedback: '.bp-slot[aria-pressed="true"]', protected: ".bp-slot.placed", unchanged: ".bp-count", retryKey: "2" },
];
try {
  for (const scenario of cases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    let moveRequests = 0;
    await page.route("**/*", async route => {
      const request = route.request();
      if (request.method() !== "POST" || !request.headers()["next-action"]) return route.continue();
      moveRequests++;
      await new Promise(resolve => setTimeout(resolve, 1200));
      await route.abort("failed");
    });
    await page.goto(`${base}/games/${scenario.slug}/play?mode=practice`, { waitUntil: "networkidle" });
    const control = page.locator(scenario.control).first();
    const idlePresentation = await control.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, label: element.textContent }));
    const before = await page.locator(scenario.unchanged).allTextContents();
    await page.evaluate(({ controlSelector, feedbackSelector }) => {
      const target = document.querySelector(controlSelector);
      target.addEventListener("click", () => {
        const start = performance.now();
        const measure = () => {
          if (document.querySelector(feedbackSelector)) document.documentElement.dataset.feedbackMs = String(performance.now() - start);
          else if (performance.now() - start < 500) requestAnimationFrame(measure);
        };
        requestAnimationFrame(measure);
      }, { once: true });
    }, { controlSelector: scenario.control, feedbackSelector: scenario.feedback });
    await control.click();
    await page.locator(scenario.feedback).waitFor();
    await page.waitForFunction(() => document.documentElement.dataset.feedbackMs);
    const feedbackMs = Number(await page.locator("html").getAttribute("data-feedback-ms"));
    assert.ok(feedbackMs < 150, `${scenario.slug}: feedback took ${feedbackMs.toFixed(1)} ms`);
    assert.equal(await control.isDisabled(), true, `${scenario.slug}: duplicate click was enabled`);
    const pendingPresentation = await control.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, foreground: getComputedStyle(element).color, label: element.textContent }));
    assert.ok(pendingPresentation.background !== idlePresentation.background || pendingPresentation.label !== idlePresentation.label, `${scenario.slug}: acknowledgement changed no visible presentation`);
    assert.notEqual(pendingPresentation.foreground, pendingPresentation.background, `${scenario.slug}: selected text disappeared into its background`);
    assert.equal(await page.locator(scenario.protected).count(), 0, `${scenario.slug}: answer appeared before server confirmation`);
    assert.deepEqual(await page.locator(scenario.unchanged).allTextContents(), before, `${scenario.slug}: result changed while request was pending`);
    await page.keyboard.press(scenario.retryKey);
    await page.waitForTimeout(80);
    assert.equal(moveRequests, 1, `${scenario.slug}: second choice sent during an in-flight move`);
    await page.getByRole("alert").waitFor();
    await page.waitForFunction(selector => !document.querySelector(selector).disabled, scenario.control);
    assert.equal(await page.locator(scenario.feedback).count(), 0, `${scenario.slug}: failed move retained a selected state`);
    console.log(`${scenario.slug}: visible feedback ${feedbackMs.toFixed(1)} ms; no answer leak, duplicate move or stuck retry`);
    await context.close();
  }
  console.log("check-interaction-feedback: 32 checks passed; all move POSTs aborted, no runs written");
} finally {
  await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]);
}
process.exit(0);
