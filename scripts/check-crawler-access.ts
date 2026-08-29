/**
 * Guard AI-crawler reachability and server-rendering for Countrivo.
 *
 * Fetches the highest-value pages as each major AI/search crawler and asserts
 * that what arrives is a complete, readable, server-rendered document — not a
 * bot challenge, not an empty shell waiting for hydration, and not a page whose
 * metadata streams in after </head>.
 *
 * Zero dependencies — fetch is global in Node 20.
 *
 * Usage:  npx tsx scripts/check-crawler-access.ts
 *         CRAWLER_CHECK_BASE_URL=http://localhost:3000 npx tsx scripts/check-crawler-access.ts
 */

const BASE = (process.env.CRAWLER_CHECK_BASE_URL ?? "https://countrivo.com").replace(/\/$/, "");
const ROBOTS_URL = "https://countrivo.com/robots.txt";
const REQUEST_TIMEOUT_MS = 20_000;

// --------------- what we check ---------------

interface PageCheck {
  path: string;
  /** Today's real measured visible-text length minus 20%. A blanket floor
   *  would false-fail the short pages, so every page carries its own. */
  minTextLength: number;
  /** Case-insensitive regexes asserting on rendered VALUES, not labels.
   *  Labels are title-cased in the markup ("Life Expectancy"), which is what
   *  produced a false diagnosis when grepped case-sensitively. */
  canaries?: RegExp[];
}

const PAGES: PageCheck[] = [
  { path: "/", minTextLength: 1280 },
  {
    path: "/countries/japan",
    minTextLength: 1710,
    canaries: [/124\.5M/i, /84\.0 years/i],
  },
  { path: "/lists/largest-countries", minTextLength: 2320 },
  { path: "/games/country-draft", minTextLength: 870 },
  { path: "/games/geo-wordle", minTextLength: 870 },
  { path: "/countries", minTextLength: 800 },
];

const USER_AGENTS: Record<string, string> = {
  "OAI-SearchBot":
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  GPTBot:
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
  ClaudeBot: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  PerplexityBot: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  Bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  Googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

// --------------- html helpers ---------------

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

/** Strip <script>/<style> blocks and every remaining tag, leaving visible text. */
function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#?\w+;/g, (match) => ENTITIES[match.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the response looks like a Cloudflare / bot interstitial. */
function botChallengeReason(html: string, headers: Headers): string | null {
  if (headers.has("cf-ray")) return "cf-ray header present (Cloudflare in front of the origin)";
  if (headers.has("cf-mitigated")) return "cf-mitigated header present (request was challenged)";
  const haystack = html.slice(0, 20_000).toLowerCase();
  for (const marker of [
    "just a moment",
    "checking your browser",
    "enable javascript and cookies to continue",
    "attention required! | cloudflare",
    "__cf_chl",
  ]) {
    if (haystack.includes(marker)) return `bot-challenge marker in body: "${marker}"`;
  }
  return null;
}

/** Metadata must be inside <head>, not streamed in later. */
function metadataInHeadReason(html: string): string | null {
  const headEnd = html.search(/<\/head>/i);
  if (headEnd === -1) return "no </head> in the response at all";
  const head = html.slice(0, headEnd);
  if (!/<title[\s>]/i.test(head)) return "<title> appears after </head> (streaming metadata)";
  if (!/<meta[^>]+name=["']description["']/i.test(head)) {
    return '<meta name="description"> appears after </head> (streaming metadata)';
  }
  return null;
}

// --------------- fetching ---------------

interface FetchResult {
  status: number;
  html: string;
  headers: Headers;
}

async function fetchAs(url: string, userAgent: string): Promise<FetchResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: res.status, html: await res.text(), headers: res.headers };
}

// --------------- run ---------------

const failures: string[] = [];

function fail(label: string, message: string): void {
  failures.push(`${label} — ${message}`);
  console.error(`  ✗ ${label} — ${message}`);
}

async function checkPage(page: PageCheck, agentName: string, userAgent: string): Promise<void> {
  const url = `${BASE}${page.path}`;
  const label = `${agentName} ${page.path}`;
  const failuresBefore = failures.length;

  let result: FetchResult;
  try {
    result = await fetchAs(url, userAgent);
  } catch (error: unknown) {
    fail(label, `request failed: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  // (a) reachable, not challenged
  if (result.status !== 200) {
    fail(label, `expected HTTP 200, got ${result.status}`);
    return;
  }
  const challenge = botChallengeReason(result.html, result.headers);
  if (challenge) {
    fail(label, challenge);
    return;
  }

  // (b) server-rendered text above this page's own floor
  const text = visibleText(result.html);
  if (text.length < page.minTextLength) {
    fail(
      label,
      `visible text is ${text.length} chars, below the ${page.minTextLength} floor — ` +
        "the page is likely rendering client-side for this crawler"
    );
  }

  // (c) value canaries (not labels)
  for (const canary of page.canaries ?? []) {
    if (!canary.test(text)) {
      fail(label, `canary ${canary} not found in the rendered text — stat values are missing`);
    }
  }

  // (d) metadata before </head>
  const metaProblem = metadataInHeadReason(result.html);
  if (metaProblem) fail(label, metaProblem);

  if (failures.length === failuresBefore) {
    console.log(`  ✓ ${label} (${text.length} chars)`);
  }
}

async function checkRobots(): Promise<void> {
  try {
    const res = await fetch(ROBOTS_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (res.status !== 200) {
      fail("robots.txt", `expected HTTP 200, got ${res.status}`);
      return;
    }
    const body = await res.text();
    if (!body.includes("Allow: /")) {
      fail("robots.txt", `"Allow: /" is missing — crawlers may be blocked wholesale`);
      return;
    }
    console.log("  ✓ robots.txt contains Allow: /");
  } catch (error: unknown) {
    fail("robots.txt", `request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  console.log(`Crawler access check against ${BASE}\n`);

  for (const [agentName, userAgent] of Object.entries(USER_AGENTS)) {
    console.log(`${agentName}:`);
    for (const page of PAGES) {
      await checkPage(page, agentName, userAgent);
    }
    console.log("");
  }

  console.log("robots.txt:");
  await checkRobots();

  const total = Object.keys(USER_AGENTS).length * PAGES.length + 1;
  if (failures.length > 0) {
    console.error(`\n${failures.length} failure(s) across ${total} checks:`);
    for (const failure of failures) console.error(`  • ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nAll ${total} checks passed — every crawler gets a full server-rendered page.`);
}

main().catch((error: unknown) => {
  console.error("Crawler access check crashed:", error);
  process.exitCode = 1;
});
