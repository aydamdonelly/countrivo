/*
 * The rendered-page gate (blueprint section 13, run by P8).
 *
 * Drives a real production server with Playwright and asserts the parts of the acceptance
 * checklist that only exist once the page is painted:
 *   look          light/dark pixel identity, the K3 fold diff, radii, shadows and gradients,
 *                 the computed-colour audit, the Erode-class audit, the emoji/glyph audit,
 *                 touch targets, crest-vs-flag placement
 *   rendering     no loading state in the first HTML, the Shoot-click mutation observer,
 *                 hydration-warning capture, the prefetch audit
 *   product       two modes, no cut game and no stale name survives, the roster redirects
 *
 * Usage:
 *   npm run build && npx next start -p 3290
 *   node scripts/check-render.mjs [--base http://localhost:3290] [--out <dir>] [--keep]
 *
 * Every failure prints the route, the element and what was measured. Exit code 1 on any.
 */
import { chromium } from "/Users/adamkahirov/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE = arg("--base", "http://localhost:3290").replace(/\/$/, "");
const OUT = arg("--out", path.join(process.cwd(), ".check-render"));
const KEEP = args.includes("--keep");
const EXECUTABLE =
  process.env.PLAYWRIGHT_CHROMIUM ??
  "/Users/adamkahirov/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell";

const PHONE = { width: 390, height: 844 };
const DESK = { width: 1280, height: 800 };

// --- the roster, in registry order ---------------------------------------------
const DAILIES = ["country-draft", "blind-pick", "higher-or-lower", "geo-wordle", "stat-guesser", "flag-quiz"];
const PRACTICE_ONLY = ["speed-flags"];
const GAMES = [...DAILIES, ...PRACTICE_ONLY];
const CUT = [
  "capital-match",
  "population-sort",
  "country-streak",
  "border-buddies",
  "continent-sprint",
  "odd-one-out",
  "cluster",
  "risk-zone",
  "supremacy",
  "borderline",
  "blitz",
];

const ROUTES = [
  "/",
  "/games",
  ...GAMES.map((s) => `/games/${s}`),
  "/countries",
  "/countries/germany",
  "/countries/japan",
  "/categories",
  "/categories/population",
  "/lists",
  "/lists/largest-countries",
  "/privacy",
  "/terms",
  "/support",
  ...DAILIES.map((s) => `/games/${s}/play?mode=daily`),
  ...GAMES.map((s) => `/games/${s}/play?mode=practice`),
  "/games/country-draft/leaderboard",
  "/auth/forgot-password",
  "/auth/reset-password",
];

/** Routes whose board is re-seeded per request, so two loads cannot be compared pixel for pixel. */
const PER_REQUEST = (r) => r.includes("mode=practice");

// --- the token palette (blueprint section 1) ------------------------------------
const TOKENS = {
  paper: "#fbfaf6",
  card: "#f1f0ea",
  line: "#e9e8e1",
  bar: "#ffffff",
  wait: "#cfcec6",
  faint: "#b9b8b1",
  mute: "#74756f",
  down: "#8a8b85",
  ink: "#17181a",
  "ink-2": "#2b2c2e",
  ember: "#b8432a",
  "on-ink-body": "#c9c8c1",
  "on-ink-kicker": "#a9aaa3",
  "on-ink-chip": "#d9d8d1",
};
const hexToRgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
const ALLOWED_COLOURS = new Set([
  ...Object.values(TOKENS).map(hexToRgb),
  "rgba(0, 0, 0, 0)",
  "transparent",
  "rgba(23, 24, 26, 0.45)", // scrim
  "rgba(23, 24, 26, 0.08)", // the flag inset ring
  "none",
  "currentcolor",
]);

// --- the K3 reference (measured from design/k/k3-ein-board.html at 390x844) ------
// The landmarks above the chip block are roster-independent and are held to the
// blueprint's 6 px. Everything below the chips moves with the anchor card's content
// height, which the blueprint makes content-driven (3.6): the six-game roster gives
// Country Draft five seat chips where the demo's game had eight category chips, so the
// board and the list sit about 26 px higher. That offset is asserted, not ignored.
const K3 = {
  header: { y: 0, h: 64 },
  switchTrack: { y: 64, h: 44 },
  help: 116,
  card: { y: 147 },
  cardH2: 184,
  how: 225,
  chips: 294,
  tabs: 432,
  meRow: 575,
  listHead: 631,
  fadeTop: 724,
  tabBar: 764,
};
const K3_TOLERANCE = 6;
/** How far the shorter anchor card is allowed to pull the loop up. */
const K3_CARD_LIFT = { min: 0, max: 40 };

// --- harness -------------------------------------------------------------------
let failures = 0;
let checks = 0;
const failed = [];

function check(ok, where, what) {
  checks += 1;
  if (!ok) {
    failures += 1;
    failed.push({ where, what });
    console.error(`FAIL  ${where}\n      ${what}`);
  }
}

function section(name) {
  console.log(`\n== ${name}`);
}

// --- in-page audits (serialised into the browser) --------------------------------

/** Collects every computed value the checklist audits, in one pass over the painted DOM. */
function auditFn() {
  const out = { colours: [], radii: [], shadows: [], filters: [], gradients: [], erode: [], small: [], glyphs: [], flags: 0, crests: 0 };
  const DISPLAY = new Set(["t-wm", "t-card", "t-h1", "t-h2", "t-h3", "t-score-xl", "t-score-l", "t-score", "t-num", "t-big"]);
  const classesOf = (el) => (typeof el.className === "string" ? el.className.trim().split(/\s+/).filter(Boolean) : []);
  const name = (el) => {
    const c = classesOf(el).slice(0, 3);
    return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (c.length ? "." + c.join(".") : "");
  };
  const COLOUR_PROPS = ["color", "backgroundColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor", "fill", "stroke", "textDecorationColor", "columnRuleColor"];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    for (const prop of COLOUR_PROPS) {
      const v = cs[prop];
      if (!v) continue;
      // A border colour on a zero-width border is never painted.
      if (prop.startsWith("border")) {
        const side = prop.slice(6, -5).toLowerCase();
        if (parseFloat(cs["border" + side.charAt(0).toUpperCase() + side.slice(1) + "Width"]) === 0) continue;
      }
      if (prop === "outlineColor" && parseFloat(cs.outlineWidth) === 0) continue;
      // fill/stroke compute to black on every SVG node, but only shape elements paint.
      if (prop === "fill" || prop === "stroke") {
        const PAINTS = ["path", "circle", "rect", "line", "polygon", "polyline", "ellipse", "text", "tspan", "use"];
        if (!PAINTS.includes(el.tagName.toLowerCase())) continue;
        if (prop === "stroke" && parseFloat(cs.strokeWidth) === 0) continue;
      }
      out.colours.push({ el: name(el), prop, v });
    }
    for (const corner of ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"]) {
      const v = cs[corner];
      if (v && v !== "0px") out.radii.push({ el: name(el), corner, v, w: Math.round(r.width), h: Math.round(r.height) });
    }
    if (cs.boxShadow && cs.boxShadow !== "none") out.shadows.push({ el: name(el), v: cs.boxShadow });
    if (cs.backdropFilter && cs.backdropFilter !== "none") out.filters.push({ el: name(el), v: "backdrop-filter: " + cs.backdropFilter });
    if (cs.filter && cs.filter !== "none") out.filters.push({ el: name(el), v: "filter: " + cs.filter });
    if (/gradient/.test(cs.backgroundImage)) out.gradients.push({ el: name(el), v: cs.backgroundImage });
    if (/erode/i.test(cs.fontFamily || "")) {
      let carrier = null;
      for (let n = el; n; n = n.parentElement) {
        if (classesOf(n).some((c) => DISPLAY.has(c))) { carrier = n; break; }
      }
      if (!carrier) out.erode.push({ el: name(el), ff: cs.fontFamily, text: (el.textContent || "").trim().slice(0, 30) });
    }
    if (el.tagName === "IMG" && /\/flags\//.test(el.getAttribute("src") || "")) out.flags += 1;
    if (classesOf(el).includes("crest")) out.crests += 1;
  }
  // Touch targets (blueprint 0.7, checklist 41). Height is the hard rule for every
  // control. Width is only enforced on controls that own a box: the horizontal extent of
  // a link inside running text is the word itself, and padding it out to 44 would break
  // the sentence it sits in.
  const CONTROLS = "a[href], button:not([disabled]), [role=tab], input:not([type=hidden]), select, summary, textarea";
  const INLINE = new Set(["inline", "inline-block", "ruby", "contents"]);
  for (const scope of ["main", "header", "footer"]) {
    for (const el of document.querySelectorAll(scope + " " + CONTROLS)) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      if (el.closest("[hidden], [inert]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const inlineText = INLINE.has(cs.display) && el.tagName === "A";
      const short = r.height < 43.5;
      const narrow = !inlineText && r.width < 43.5;
      if (short || narrow) {
        out.small.push({
          el: name(el),
          w: Math.round(r.width),
          h: Math.round(r.height),
          display: cs.display,
          why: short ? "under 44 tall" : "under 44 wide",
          text: (el.textContent || "").trim().slice(0, 24),
        });
      }
    }
  }
  const BANNED = /[\u2014\u2192\u2190\u2713\u2717\u2715\u2191\u2193\u21A9\u2605\u2022]/u;
  const EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u;
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walk.nextNode())) {
    const t = node.nodeValue || "";
    if (!t.trim()) continue;
    const p = node.parentElement;
    if (!p || p.tagName === "SCRIPT" || p.tagName === "STYLE" || p.tagName === "TITLE") continue;
    if (BANNED.test(t) || EMOJI.test(t)) out.glyphs.push({ el: name(p), text: t.trim().slice(0, 60) });
  }
  out.title = document.title;
  out.scrollWidth = document.documentElement.scrollWidth;
  out.clientWidth = document.documentElement.clientWidth;
  out.overflowX = out.scrollWidth > out.clientWidth;
  return out;
}

/** The home's K3 landmarks, by the class names the K3 demo and the app share. */
function landmarksFn() {
  const y = (el) => (el ? Math.round(el.getBoundingClientRect().top) : null);
  const h = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null);
  const q = (s) => document.querySelector(s);
  const card = q("main [data-mode] .anc, main .anc, .anc");
  const board = q(".gb");
  const list = q(".ls");
  return {
    header: { y: y(q("header")), h: h(q("header")) },
    switchTrack: { y: y(q(".sw-track")), h: h(q(".sw-track")) },
    help: y(q(".sw-help")),
    card: { y: y(card), h: h(card) },
    cardH2: y(card && card.querySelector("h1, h2")),
    how: y(card && card.querySelector(".how")),
    chips: y(card && card.querySelector(".chips")),
    tabs: y(board && board.querySelector(".tabs")),
    meRow: y(board && board.querySelector(".me")),
    listHead: y(list && list.querySelector("h3")),
    docH: document.documentElement.scrollHeight,
  };
}

// --- runners -------------------------------------------------------------------

async function newContext(browser, viewport, colorScheme) {
  return browser.newContext({
    viewport,
    deviceScaleFactor: viewport === PHONE ? 2 : 1,
    colorScheme,
    reducedMotion: "reduce",
    hasTouch: viewport === PHONE,
    isMobile: viewport === PHONE,
  });
}

/**
 * Vercel Analytics and Speed Insights fetch their script from /_vercel/*, which only
 * exists on Vercel. Off-platform that 404s, and the 404 is not a defect of the page.
 */
const OFF_PLATFORM = /_vercel\/(insights|speed-insights)/;

/** Loads a route and returns the page plus every console message it produced. */
async function open(ctx, route) {
  const page = await ctx.newPage();
  const messages = [];
  page.on("console", (m) => messages.push({ type: m.type(), text: m.text(), url: m.location()?.url ?? "" }));
  page.on("pageerror", (e) => messages.push({ type: "pageerror", text: String(e), url: "" }));
  const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForTimeout(500);
  return { page, messages, status: res ? res.status() : 0 };
}

function reportConsole(route, messages) {
  const bad = messages
    .filter((m) => !OFF_PLATFORM.test(m.url) && !OFF_PLATFORM.test(m.text))
    .filter(
      (m) =>
        m.type === "error" ||
        m.type === "pageerror" ||
        /hydrat|did not match|server rendered|text content does not match/i.test(m.text),
    );
  check(bad.length === 0, route, `console is clean (${bad.slice(0, 3).map((b) => b.type + ": " + b.text.slice(0, 140)).join(" | ")})`);
}

async function auditRoute(ctx, route, viewport) {
  const { page, messages, status } = await open(ctx, route);
  check(status === 200, route, `responds 200 (got ${status})`);
  reportConsole(route, messages);
  const a = await page.evaluate(auditFn);
  const where = `${route} @ ${viewport.width}`;

  const badColours = a.colours.filter((c) => !ALLOWED_COLOURS.has(c.v.toLowerCase()));
  check(
    badColours.length === 0,
    where,
    `every painted colour is a token (${badColours.slice(0, 4).map((c) => `${c.el} ${c.prop}=${c.v}`).join("; ")})`,
  );

  const badRadii = a.radii.filter((r) => {
    if (/%/.test(r.corner) || /%/.test(r.v)) return false;
    if (r.v.endsWith("%")) return false;
    const px = parseFloat(r.v);
    if (!Number.isFinite(px)) return false;
    if (px <= 12) return false;
    // a crest is a circle: a radius at or past half the box is the circle, not a fat corner
    return px < Math.min(r.w, r.h) / 2;
  });
  check(badRadii.length === 0, where, `nothing is rounder than 12px except a crest (${badRadii.slice(0, 4).map((r) => `${r.el} ${r.v}`).join("; ")})`);

  // The two authored shadows (section 1): the flag's inset ring, and the focus ring
  // (2px paper then 2px ink, both zero-offset zero-blur). Everything else is a bloom.
  const FOCUS_RING = /^rgb\(251, 250, 246\) 0px 0px 0px 2px, rgb\(23, 24, 26\) 0px 0px 0px 4px$|^rgb\(23, 24, 26\) 0px 0px 0px 2px, rgb\(251, 250, 246\) 0px 0px 0px 4px$/;
  const badShadows = a.shadows.filter((s) => !/rgba\(23, 24, 26, 0\.08\)/.test(s.v) && !/inset/.test(s.v) && !FOCUS_RING.test(s.v));
  check(badShadows.length === 0, where, `no box-shadow except the flag ring and the focus ring (${badShadows.slice(0, 4).map((s) => `${s.el}: ${s.v}`).join("; ")})`);

  check(a.filters.length === 0, where, `no backdrop-filter and no filter (${a.filters.slice(0, 4).map((f) => `${f.el}: ${f.v}`).join("; ")})`);

  const badGradients = a.gradients.filter((g) => !/rgba\(251, 250, 246, 0\)/.test(g.v));
  check(badGradients.length === 0, where, `no gradient except the fade bar (${badGradients.slice(0, 3).map((g) => `${g.el}: ${g.v.slice(0, 80)}`).join("; ")})`);

  check(a.erode.length === 0, where, `Erode only on the display classes (${a.erode.slice(0, 4).map((e) => `${e.el} "${e.text}"`).join("; ")})`);

  check(a.glyphs.length === 0, where, `no emoji and no glyph character in rendered text (${a.glyphs.slice(0, 4).map((g) => `${g.el}: ${JSON.stringify(g.text)}`).join("; ")})`);

  check(
    a.small.length === 0,
    where,
    `every control clears the 44px touch target (${a.small.slice(0, 6).map((s) => `${s.el} ${s.w}x${s.h} ${s.display} ${s.why} "${s.text}"`).join("; ")})`,
  );

  check(!a.overflowX, where, `the page never scrolls sideways (${a.scrollWidth} > ${a.clientWidth})`);

  await page.close();
  return a;
}

async function pixelIdentity(browser, route, viewport) {
  const shots = [];
  for (const scheme of ["light", "dark"]) {
    const ctx = await newContext(browser, viewport, scheme);
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load").catch(() => {});
    await page.waitForTimeout(500);
    shots.push(await page.screenshot({ fullPage: true }));
    await ctx.close();
  }
  const same = shots[0].equals(shots[1]);
  if (!same) {
    const dir = path.join(OUT, "theme-diff");
    mkdirSync(dir, { recursive: true });
    const slug = route.replace(/[^a-z0-9]+/gi, "_");
    writeFileSync(path.join(dir, `${slug}-${viewport.width}-light.png`), shots[0]);
    writeFileSync(path.join(dir, `${slug}-${viewport.width}-dark.png`), shots[1]);
  }
  check(same, `${route} @ ${viewport.width}`, "the light and the dark render are byte-identical (one theme)");
  return shots[0];
}

async function k3FoldDiff(browser) {
  const ctx = await newContext(browser, PHONE, "light");
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const m = await page.evaluate(landmarksFn);
  const near = (a, b, tol, what) => check(a !== null && Math.abs(a - b) <= tol, "/ K3 fold diff", `${what}: ${a} vs K3 ${b} (tolerance ${tol})`);

  near(m.header.y, K3.header.y, K3_TOLERANCE, "header top");
  near(m.header.h, K3.header.h, K3_TOLERANCE, "header height");
  near(m.switchTrack.y, K3.switchTrack.y, K3_TOLERANCE, "switch track top");
  near(m.switchTrack.h, K3.switchTrack.h, 1, "switch track height");
  near(m.help, K3.help, K3_TOLERANCE, "help line top");
  near(m.card.y, K3.card.y, K3_TOLERANCE, "anchor card top");
  near(m.cardH2, K3.cardH2, K3_TOLERANCE, "anchor card h2 top");
  near(m.how, K3.how, K3_TOLERANCE, "how-text top");
  near(m.chips, K3.chips, K3_TOLERANCE, "chip block top");

  // Below the chip block, two things K3 cannot fix move the loop: the anchor card's own
  // height (blueprint 3.6 makes it content-driven, and the six-game roster gives Country
  // Draft five seat chips where the demo's game had eight) and the day's board (an empty
  // global pane is shorter than three rows plus the me-row). So the absolute y is not the
  // contract below the card; the ORDER, the gaps and the fold budget are.
  const lift = K3.tabs - m.tabs;
  check(
    lift >= K3_CARD_LIFT.min && lift <= K3_CARD_LIFT.max,
    "/ K3 fold diff",
    `the board starts ${lift}px above K3, inside the content-driven card window ${K3_CARD_LIFT.min}..${K3_CARD_LIFT.max}`,
  );
  const cardBottom = m.card.y + m.card.h;
  check(m.tabs > cardBottom, "/ K3 fold diff", `the board follows the card (tabs ${m.tabs} > card bottom ${cardBottom})`);
  near(m.tabs - cardBottom, K3.tabs - (K3.card.y + 269), 6, "gap between the card and the board tabs");
  check(m.meRow > m.tabs, "/ K3 fold diff", `the me-row is inside the board, under the tabs (${m.meRow} > ${m.tabs})`);
  check(m.listHead > m.meRow, "/ K3 fold diff", `the More-dailies head follows the board (${m.listHead} > ${m.meRow})`);
  check(m.listHead !== null && m.listHead < K3.fadeTop, "/ K3 fold diff", `the More-dailies head is above the fade (${m.listHead} < ${K3.fadeTop})`);
  check(m.meRow !== null && m.meRow < K3.fadeTop, "/ K3 fold diff", `the me-row is above the fade (${m.meRow} < ${K3.fadeTop})`);
  check(m.listHead + 44 < PHONE.height, "/ K3 fold diff", `the first list row is on the first screen (${m.listHead + 44} < ${PHONE.height})`);
  await ctx.close();
  return m;
}

/** The play route must arrive with its board: no skeleton, no spinner, no post-hydration swap. */
async function firstPaint(browser) {
  // The signature has to be what a placeholder is actually made of. Two things look like
  // it and are not: `loading="eager"` is an <img> attribute, and a `role="progressbar"`
  // that carries an `aria-valuenow` is a real meter (the Speed Flags clock, the pip bar),
  // not a spinner. An INDETERMINATE progressbar would be one, so that stays caught.
  const SIGNS = /skeleton|animate-pulse|animate-spin|placeholder-shimmer|aria-busy="true"|>\s*Loading|loading\.\.\./i;
  const INDETERMINATE = /role="progressbar"(?![^>]*aria-valuenow)/i;
  for (const slug of GAMES) {
    const mode = DAILIES.includes(slug) ? "daily" : "practice";
    const route = `/games/${slug}/play?mode=${mode}`;
    const res = await fetch(BASE + route, { headers: { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" } });
    const html = await res.text();
    check(res.status === 200, route, `first HTML responds 200 (got ${res.status})`);
    check(!SIGNS.test(html) && !INDETERMINATE.test(html), route, "the first HTML carries no loading state");
    const body = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    check(body.length > 400, route, `the first HTML already carries the board (${body.length} chars inside <main>)`);
    check(/class="[^"]*play-bar|class="[^"]*pbar|Practice|Daily/.test(html), route, "the play bar is in the first HTML");
  }

  // The Shoot click: no frame between the click and the board may paint a placeholder.
  const ctx = await newContext(browser, PHONE, "light");
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.__frames = [];
    const obs = new MutationObserver(() => {
      const main = document.querySelector("main");
      if (main) window.__frames.push(main.textContent.slice(0, 4000));
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  });
  const shoot = page.locator('a:has-text("Shoot")').first();
  const href = await shoot.getAttribute("href");
  check(!!href && href.includes("/play"), "/", `the Shoot button points at a play route (${href})`);
  await shoot.click();
  await page.waitForURL(/\/play/, { timeout: 15000 });
  await page.waitForTimeout(400);
  const frames = await page.evaluate(() => window.__frames || []);
  const bad = frames.filter((f) => SIGNS.test(f));
  check(bad.length === 0, "/ -> Shoot", `no frame between the click and the board shows a placeholder (${bad.length} of ${frames.length})`);
  const painted = await page.evaluate(() => (document.querySelector("main")?.textContent || "").length);
  check(painted > 200, "/ -> Shoot", `the play route painted its board (${painted} chars)`);
  await ctx.close();
}

/**
 * Every play route answers a real control and moves the board. One recipe per game, so
 * the click is the move a player would actually make rather than "whatever is first".
 */
const RECIPES = {
  "country-draft": async (page) => {
    await page.locator("main .dr-card").first().click();
    await page.locator("main .dr-seat:not([disabled])").first().click();
  },
  "blind-pick": async (page) => {
    await page.locator("main .slot").first().click();
  },
  "higher-or-lower": async (page) => {
    await page.locator("main .opt").first().click();
  },
  "geo-wordle": async (page) => {
    await page.locator("main input").first().fill("Norway");
    await page.locator('main button:has-text("Guess")').click();
  },
  "stat-guesser": async (page) => {
    await page.locator("main input").first().fill("1000000");
    await page.locator('main button:has-text("Submit")').click();
  },
  "flag-quiz": async (page) => {
    await page.locator("main .opt").first().click();
  },
  "speed-flags": async (page) => {
    await page.locator('main button:has-text("Start")').click();
    await page.waitForTimeout(300);
    await page.locator("main .opt").first().click();
  },
};

async function playtest(browser) {
  for (const slug of GAMES) {
    const route = `/games/${slug}/play?mode=practice`;
    const ctx = await newContext(browser, PHONE, "light");
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error" && !OFF_PLATFORM.test(m.text()) && !OFF_PLATFORM.test(m.location()?.url ?? "")) errs.push(m.text());
    });
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    const before = await page.evaluate(() => document.querySelector("main")?.textContent ?? "");

    let threw = null;
    await RECIPES[slug](page).catch((e) => {
      threw = String(e).split("\n")[0];
    });
    check(threw === null, route, `the board's own controls are all there and clickable (${threw})`);
    await page.waitForTimeout(1900);

    const after = await page.evaluate(() => document.querySelector("main")?.textContent ?? "");
    check(after !== before, route, "the board answers a real move (the state moved)");
    check(errs.length === 0, route, `no console error while playing (${errs.slice(0, 2).join(" | ")})`);
    await ctx.close();
  }
}

/** The swap and the cut list. The two content assertions read the landing card, not the page. */
async function rosterSwap(browser) {
  section("roster swap and redirects");
  const ctx = await newContext(browser, PHONE, "light");

  const read = async (route) => {
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    const v = await page.evaluate(() => {
      const card = document.querySelector("main .anc");
      const about = [...document.querySelectorAll("main h2")].find((h) => /^What /.test(h.textContent || ""));
      return {
        title: document.title,
        h1: (document.querySelector("main h1")?.textContent || "").trim(),
        how: (card?.querySelector(".how, .steps")?.textContent || "").trim(),
        chips: [...(card?.querySelectorAll(".chips *") || [])].map((c) => c.textContent.trim()).filter(Boolean),
        about: (about?.parentElement?.textContent || "").trim().slice(0, 600),
      };
    });
    await page.close();
    return v;
  };

  const cd = await read("/games/country-draft");
  check(cd.h1 === "Country Draft", "/games/country-draft", `the card h1 reads Country Draft (got ${JSON.stringify(cd.h1)})`);
  check(/^Country Draft/.test(cd.title), "/games/country-draft", `the title starts with Country Draft (got ${JSON.stringify(cd.title)})`);
  check(/seat/i.test(cd.how + cd.chips.join(" ")), "/games/country-draft", `the card describes the cabinet draft (how: ${JSON.stringify(cd.how)}, chips: ${cd.chips.join("/")})`);
  check(
    !/(eight|8)\s*stats?/i.test(cd.how) && !/ranks? highest/i.test(cd.how),
    "/games/country-draft",
    `the card never describes the stat game (how: ${JSON.stringify(cd.how)})`,
  );

  const bp = await read("/games/blind-pick");
  check(bp.h1 === "Blind Pick", "/games/blind-pick", `the card h1 reads Blind Pick (got ${JSON.stringify(bp.h1)})`);
  check(/^Blind Pick/.test(bp.title), "/games/blind-pick", `the title starts with Blind Pick (got ${JSON.stringify(bp.title)})`);
  check(/stat/i.test(bp.how + bp.chips.join(" ")), "/games/blind-pick", `the card describes the stat game (how: ${JSON.stringify(bp.how)})`);
  check(!/Country Draft/.test(bp.how), "/games/blind-pick", `the card never calls the game Country Draft (how: ${JSON.stringify(bp.how)})`);
  check(!/Country Draft/i.test(bp.about.replace(/Country Draft(\?|,| is a| the same)/g, "")), "/games/blind-pick", "the about block does not present itself as Country Draft");
  await ctx.close();

  for (const url of ["/games/world-draft", "/games/world-draft/play"]) {
    const r = await fetch(BASE + url, { redirect: "manual" });
    check(r.status === 301 || r.status === 308, url, `redirects permanently (got ${r.status})`);
    check((r.headers.get("location") || "").includes("/games/country-draft"), url, `points at /games/country-draft (got ${r.headers.get("location")})`);
  }
  for (const slug of CUT) {
    const r = await fetch(BASE + `/games/${slug}`, { redirect: "manual" });
    check(r.status === 301 || r.status === 308, `/games/${slug}`, `the cut game redirects permanently (got ${r.status})`);
    const rp = await fetch(BASE + `/games/${slug}/play`, { redirect: "manual" });
    check(rp.status === 301 || rp.status === 308, `/games/${slug}/play`, `the cut play route redirects permanently (got ${rp.status})`);
  }
  const play404 = await fetch(BASE + "/games/cluster/play?mode=practice", { redirect: "follow" });
  check(play404.status === 200 && !/cluster/i.test(await play404.text()), "/games/cluster/play", "lands on a live page with no trace of the cut game");
}

/** No surviving page mentions a cut game or calls the stat game Country Draft. */
async function copySweep() {
  section("copy sweep");
  const pages = [
    "/",
    "/games",
    ...GAMES.map((s) => `/games/${s}`),
    "/countries",
    "/countries/germany",
    "/categories",
    "/categories/population",
    "/lists",
    "/lists/largest-countries",
    "/privacy",
    "/terms",
    "/support",
    "/sitemap.xml",
    "/games/sitemap.xml",
    "/manifest.webmanifest",
  ];
  const banned = [
    ...CUT.map((s) => new RegExp(`\\b${s.replace(/-/g, "[- ]")}\\b`, "i")),
    /world[- ]draft/i,
    /daily challenge/i,
    /\bblitz mode\b/i,
    /\bduel\b/i,
    /playing now/i,
    /\bXP\b/,
  ];
  for (const route of pages) {
    const res = await fetch(BASE + route);
    const html = await res.text();
    check(res.status === 200, route, `responds 200 (got ${res.status})`);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ");
    for (const re of banned) {
      const hit = text.match(re);
      check(!hit, route, `no rendered text matches ${re} (found ${JSON.stringify(hit && hit[0])})`);
    }
    check(!/—/.test(text), route, "no em dash in rendered copy");

    // The <head> is not rendered text but it IS shipped copy: a title, a description and
    // the OG/Twitter twins. Stripping tags hides a meta's content attribute, so the banned
    // families have to be re-checked against the head's own values.
    const head = html.slice(0, html.indexOf("</head>"));
    const metaValues = [
      ...[...head.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => ["title", m[1]]),
      ...[...head.matchAll(/<meta[^>]*?(?:name|property)="([^"]+)"[^>]*?content="([^"]*)"/g)].map((m) => [m[1], m[2]]),
      ...[...head.matchAll(/<meta[^>]*?content="([^"]*)"[^>]*?(?:name|property)="([^"]+)"/g)].map((m) => [m[2], m[1]]),
    ].map(([k, v]) => [k, v.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')]);
    const HEAD_BANNED = [/\bchallenges?\b/i, /playing now/i, /\bblitz mode\b/i, /\bduel\b/i, /\bXP\b/, /—/, ...CUT.map((c) => new RegExp(`\\b${c.replace(/-/g, "[- ]")}\\b`, "i")), /world[- ]draft/i];
    const headHits = metaValues.filter(([, v]) => HEAD_BANNED.some((re) => re.test(v)));
    check(
      headHits.length === 0,
      route,
      `the head metadata carries no banned copy (${headHits.slice(0, 2).map(([k, v]) => `<${k}> ${JSON.stringify(v.slice(0, 110))}`).join("; ")})`,
    );
    // Country Draft may only be the cabinet game; the stat game is Blind Pick everywhere.
    if (route === "/games/blind-pick" || route === "/") {
      const bad = /Country Draft[^<]{0,80}(eight|8 )\s*stat/i.test(text);
      check(!bad, route, "the stat game is never called Country Draft");
    }
  }
}

/** Sitemaps, robots and the metadata contract. */
async function seoSweep() {
  section("seo");
  const sm = await (await fetch(BASE + "/games/sitemap.xml")).text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check(urls.length === GAMES.length, "/games/sitemap.xml", `lists exactly the ${GAMES.length} roster games (got ${urls.length})`);
  for (const slug of CUT.concat(["world-draft"])) {
    check(!sm.includes(`/games/${slug}`), "/games/sitemap.xml", `no cut slug ${slug}`);
  }
  const robots = await (await fetch(BASE + "/robots.txt")).text();
  check(/Sitemap:/.test(robots), "/robots.txt", "registers the sitemaps");
  for (const route of ["/games/country-draft/play?mode=daily", "/games/country-draft/leaderboard", "/auth/forgot-password"]) {
    const html = await (await fetch(BASE + route)).text();
    check(/<meta name="robots" content="[^"]*noindex/.test(html), route, "is noindex");
  }
  for (const route of ["/", "/games/country-draft", "/countries/japan"]) {
    const html = await (await fetch(BASE + route)).text();
    const head = html.slice(0, html.indexOf("</head>"));
    check(/<title>/.test(head), route, "<title> is inside <head>");
    check(/<meta name="description"/.test(head), route, "the description is inside <head>");
    check(/rel="canonical"/.test(head), route, "the canonical is inside <head>");
  }
}

/** Link prefetch on the hot paths (blueprint item 22). */
async function prefetchAudit(browser) {
  section("prefetch");
  const ctx = await newContext(browser, PHONE, "light");
  const page = await ctx.newPage();
  // The router fires its prefetch burst while the page is still loading, so the listener
  // has to be attached BEFORE the navigation or the log comes back empty.
  const requested = [];
  page.on("request", (r) => requested.push({ url: r.url(), prefetch: !!r.headers()["next-router-prefetch"] }));
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href^='/']")].map((a) => ({
      href: a.getAttribute("href"),
      text: (a.textContent || "").trim().slice(0, 30),
    })),
  );
  check(rows.some((r) => /\/play\?mode=daily/.test(r.href || "")), "/", "the Shoot button links a daily play route");
  check(rows.filter((r) => /\/play\?mode=daily/.test(r.href || "")).length >= 5, "/", `every daily row links its play route (${rows.filter((r) => /\/play/.test(r.href || "")).length} play links)`);
  // Scroll the whole page so anything below the fold also enters the observer, then
  // assert the router really asked the server for the hot paths. An empty log means
  // prefetch is off, which is the regression this check exists to catch.
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(1500);
  const prefetched = requested.filter((r) => r.prefetch).map((r) => new URL(r.url).pathname);
  const unique = [...new Set(prefetched)];
  check(unique.length > 0, "/", `the router prefetched the hot paths (${unique.length} prefetched routes)`);
  check(
    unique.some((t) => /\/games\/.+\/play$/.test(t)),
    "/",
    `the daily play routes are prefetched (${unique.slice(0, 8).join(", ")})`,
  );
  check(
    unique.filter((t) => /\/games\/.+\/play$/.test(t)).length >= 5,
    "/",
    `every daily row prefetched its board (${unique.filter((t) => /\/play$/.test(t)).length} play routes)`,
  );
  await ctx.close();
}

// --- the signed-in surfaces -------------------------------------------------------
// /profile, /friends and a populated board only exist for a signed-in viewer, so a
// guest-only pass never sees them. The blueprint's own acceptance run creates guest
// sessions named `playtest*` through the Supabase anon endpoint and deletes them with the
// admin API afterwards; that is what this does. Skipped with a printed note when the
// keys are not on the machine, never silently.
function supabaseEnv() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  try {
    const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    url = url || (/NEXT_PUBLIC_SUPABASE_URL=(.*)/.exec(env)?.[1] ?? "").trim().replace(/"/g, "");
    anon = anon || (/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/.exec(env)?.[1] ?? "").trim().replace(/"/g, "");
  } catch {}
  const ref = url ? new URL(url).host.split(".")[0] : "";
  // A key for another project answers 401 on every call, and the DELETEs in dropGuest
  // would then fail silently and leave playtest accounts behind. Machines here export a
  // SUPABASE_SERVICE_ROLE_KEY for a different project, so the key's own `ref` claim is
  // checked against the URL and a mismatched key is discarded, not used.
  const refOf = (key) => {
    try {
      const part = key.split(".")[1];
      return JSON.parse(Buffer.from(part, "base64url").toString("utf8")).ref ?? "";
    } catch {
      return "";
    }
  };
  const candidates = [process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""];
  try {
    candidates.push(readFileSync(path.join(os.homedir(), ".config/countrivo-seo/supabase-service-role.key"), "utf8").trim());
  } catch {}
  const service = candidates.find((k) => k && refOf(k) === ref) ?? "";
  return url && anon && service ? { url, anon, service, ref } : null;
}

async function makeGuest(env, name) {
  const r = await fetch(`${env.url}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: env.anon, "Content-Type": "application/json" },
    body: JSON.stringify({ data: {}, gotrue_meta_security: {} }),
  });
  const session = await r.json();
  if (!session.access_token) throw new Error("anonymous sign-in failed: " + JSON.stringify(session));
  await fetch(`${env.url}/rest/v1/profiles?id=eq.${session.user.id}`, {
    method: "PATCH",
    headers: { apikey: env.anon, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: name }),
  });
  return { id: session.user.id, session };
}

function sessionCookies(env, session) {
  const value = "base64-" + Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const key = `sb-${env.ref}-auth-token`;
  const chunks = [];
  for (let i = 0; i < value.length; i += 3180) chunks.push(value.slice(i, i + 3180));
  const names = chunks.length === 1 ? [key] : chunks.map((_, i) => `${key}.${i}`);
  const host = new URL(BASE).hostname;
  return chunks.map((v, i) => ({ name: names[i], value: v, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}

/**
 * Removes every trace of the playtest guest. Order matters: `profiles.id` references
 * auth.users without ON DELETE CASCADE, so the profile row has to go first or the admin
 * delete answers 200 and leaves the user behind. The post-condition is asserted, never
 * assumed, so a leftover playtest account can never pass unnoticed.
 */
async function dropGuest(env, id) {
  const h = { apikey: env.service, Authorization: `Bearer ${env.service}` };
  await fetch(`${env.url}/rest/v1/game_runs?user_id=eq.${id}`, { method: "DELETE", headers: h });
  await fetch(`${env.url}/rest/v1/user_game_stats?user_id=eq.${id}`, { method: "DELETE", headers: h });
  await fetch(`${env.url}/rest/v1/friendships?or=(requester_id.eq.${id},addressee_id.eq.${id})`, { method: "DELETE", headers: h });
  await fetch(`${env.url}/rest/v1/profiles?id=eq.${id}`, { method: "DELETE", headers: h });
  await fetch(`${env.url}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: h });
  const stillUser = await fetch(`${env.url}/auth/v1/admin/users/${id}`, { headers: h });
  const stillProfile = await (await fetch(`${env.url}/rest/v1/profiles?select=id&id=eq.${id}`, { headers: h })).json();
  check(stillUser.status === 404, "signed-in pass", `the playtest auth user is deleted (GET answered ${stillUser.status})`);
  check(Array.isArray(stillProfile) && stillProfile.length === 0, "signed-in pass", `the playtest profile row is deleted (${JSON.stringify(stillProfile).slice(0, 80)})`);
}

/** Which daily board actually has rows today, so the audit sees a populated leaderboard. */
async function busiestBoard() {
  for (const slug of DAILIES) {
    const html = await (await fetch(BASE + `/games/${slug}/leaderboard`)).text();
    if (/class="[^"]*\brow\b[^"]*"[^>]*>(?![^<]*you)/.test(html) && !/No shots yet today/.test(html)) return slug;
  }
  return DAILIES[0];
}

async function signedInPass(browser) {
  section("signed-in surfaces (profile, friends, a populated board)");
  const env = supabaseEnv();
  if (!env) {
    check(false, "signed-in pass", "Supabase keys are available so /profile and /friends can be audited (set SUPABASE_SERVICE_ROLE_KEY or keep ~/.config/countrivo-seo/supabase-service-role.key)");
    return;
  }
  const board = await busiestBoard();
  const routes = ["/profile", "/friends", `/games/${board}/leaderboard`, "/"];
  const guest = await makeGuest(env, "playtestgate");
  try {
    for (const vp of [PHONE, DESK]) {
      const shots = {};
      for (const scheme of ["light", "dark"]) {
        const ctx = await newContext(browser, vp, scheme);
        await ctx.addCookies(sessionCookies(env, guest.session));
        for (const route of routes) {
          const page = await ctx.newPage();
          const messages = [];
          page.on("console", (m) => messages.push({ type: m.type(), text: m.text(), url: m.location()?.url ?? "" }));
          page.on("pageerror", (e) => messages.push({ type: "pageerror", text: String(e), url: "" }));
          const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("load").catch(() => {});
          await page.waitForTimeout(500);
          // The header countdown re-renders every 30 s, so the light pass and the dark pass
          // can straddle a minute boundary and differ by one digit. Freeze motion and hide
          // that one live string; everything else is compared byte for byte.
          await page.addStyleTag({
            content: "*,*::before,*::after{animation:none!important;transition:none!important} .cd{visibility:hidden!important}",
          });
          await page.waitForTimeout(100);
          const where = `${route} (signed in) @ ${vp.width}`;
          check(res && res.status() === 200, where, `responds 200 (got ${res && res.status()})`);
          reportConsole(where, messages);
          (shots[route] ||= {})[scheme] = await page.screenshot({ fullPage: true });
          if (scheme === "light") {
            const a = await page.evaluate(auditFn);
            const badColours = a.colours.filter((c) => !ALLOWED_COLOURS.has(c.v.toLowerCase()));
            check(badColours.length === 0, where, `every painted colour is a token (${badColours.slice(0, 3).map((c) => `${c.el} ${c.prop}=${c.v}`).join("; ")})`);
            check(a.erode.length === 0, where, `Erode only on the display classes (${a.erode.slice(0, 3).map((e) => e.el).join("; ")})`);
            check(a.glyphs.length === 0, where, `no emoji and no glyph character (${a.glyphs.slice(0, 3).map((g) => JSON.stringify(g.text)).join("; ")})`);
            check(a.filters.length === 0, where, `no backdrop-filter and no filter (${a.filters.slice(0, 3).map((f) => f.el).join("; ")})`);
            check(!a.overflowX, where, `the page never scrolls sideways (${a.scrollWidth} > ${a.clientWidth})`);
            check(
              a.small.length === 0,
              where,
              `every control clears the 44px touch target (${a.small.slice(0, 6).map((s) => `${s.el} ${s.w}x${s.h} ${s.why} "${s.text}"`).join("; ")})`,
            );
            // checklist 9: a global board row carries a flag, never a crest.
            const crestInGlobal = await page.evaluate(() =>
              [...document.querySelectorAll(".gb .row:not(.me), .lb .row:not(.me), main .row:not(.me)")]
                .filter((r) => r.querySelector(".crest"))
                .map((r) => (r.textContent || "").trim().slice(0, 40)),
            );
            check(
              crestInGlobal.length === 0,
              where,
              `no global board row shows a crest, per checklist 9 (${crestInGlobal.slice(0, 3).join("; ")}) - if the roster owner amends 3.15 to let a countryless shooter wear the seed crest, amend this check with it`,
            );
          }
          await page.close();
        }
        await ctx.close();
      }
      for (const [route, pair] of Object.entries(shots)) {
        const same = pair.light.equals(pair.dark);
        if (!same) {
          const dir = path.join(OUT, "theme-diff");
          mkdirSync(dir, { recursive: true });
          const slug = route.replace(/[^a-z0-9]+/gi, "_");
          writeFileSync(path.join(dir, `signedin-${slug}-${vp.width}-light.png`), pair.light);
          writeFileSync(path.join(dir, `signedin-${slug}-${vp.width}-dark.png`), pair.dark);
        }
        check(same, `${route} (signed in) @ ${vp.width}`, "the light and the dark render are byte-identical (one theme)");
      }
    }
  } finally {
    await dropGuest(env, guest.id);
    console.log("  playtest guest deleted");
  }
}

// --- main ----------------------------------------------------------------------

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  section("light vs dark pixel identity");
  for (const route of ROUTES.filter((r) => !PER_REQUEST(r))) {
    for (const vp of [PHONE, DESK]) await pixelIdentity(browser, route, vp);
  }

  section("K3 fold diff");
  const m = await k3FoldDiff(browser);
  console.log(`  landmarks: ${JSON.stringify(m)}`);

  section("page audits at 390 and 1280");
  for (const vp of [PHONE, DESK]) {
    const ctx = await newContext(browser, vp, "light");
    for (const route of ROUTES) await auditRoute(ctx, route, vp);
    await ctx.close();
  }

  section("first paint: every play route arrives with its board");
  await firstPaint(browser);

  section("playtest: every board answers a control");
  await playtest(browser);

  await rosterSwap(browser);
  await copySweep();
  await seoSweep();
  await prefetchAudit(browser);
  await signedInPass(browser);

  await browser.close();
  if (!KEEP && failures === 0) rmSync(OUT, { recursive: true, force: true });

  console.log(`\ncheck-render: ${checks} assertions, ${failures} failure(s)`);
  if (failures) {
    console.error(`\nartifacts in ${OUT}`);
    process.exit(1);
  }
  console.log("check-render: clean");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
