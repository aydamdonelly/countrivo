// Fails the build on any single-theme or no-loading-state violation (blueprint section 14 F0).
// Run: node scripts/check-theme.mjs [--strict]
//
// Default mode skips the legacy tree that section 12 deletes (src/components and the
// old route files) and the files P1/P7 rewrite; --strict scans everything. Once P8 has
// deleted the legacy tree the two modes are the same.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const strict = process.argv.includes("--strict");

/** Deleted by P8 (blueprint section 12). */
const LEGACY_PREFIXES = [
  "src/components/",
  "src/app/games/",
  "src/app/lists/",
  "src/app/countries/",
  "src/app/categories/",
  "src/app/friends/",
  "src/app/profile/",
  "src/app/auth/forgot-password/",
  "src/app/auth/reset-password/",
  "src/app/privacy/",
  "src/app/terms/",
  "src/app/support/",
];
const LEGACY_FILES = new Set([
  "src/app/page.tsx",
  "src/app/loading.tsx",
  "src/middleware.ts",
  "src/lib/supabase/middleware.ts",
  "src/hooks/use-countdown.ts",
  "src/hooks/use-daily-challenge.ts",
  "src/hooks/use-local-storage.ts",
  "src/hooks/use-daily-progress.ts",
  "src/hooks/use-reset-countdown.ts",
  "src/lib/game-colors.ts",
  "src/lib/confetti.ts",
  "src/types/storage.ts",
]);
/** Rewritten by P1 (layout, errors) and P7 (Satori routes, manifest); remove as they land. */
const REWRITTEN_LATER = new Set([
  "src/app/layout.tsx",
  "src/app/error.tsx",
  "src/app/not-found.tsx",
  "src/app/icon.tsx",
  "src/app/apple-icon.tsx",
  "src/app/opengraph-image.tsx",
  "src/app/manifest.ts",
  "src/lib/native/bootstrap.ts",
]);

/** Hex literals are allowed only here (section 1). */
const HEX_ALLOWED = new Set(["src/styles/tokens.css", "src/lib/seo/og-image.tsx", "src/app/global-error.tsx"]);
/** The clipboard share strings carry the coloured squares; the GeoWordle engine keeps `arrow` in the resultJson contract (section 5.1). */
const EMOJI_ALLOWED = (f) => f.startsWith("src/lib/share/") || f === "src/lib/game-logic/geo-wordle/engine.ts";

const TEXT = new Set([".ts", ".tsx", ".css", ".json", ".mjs"]);
const CODE = new Set([".ts", ".tsx", ".mjs"]);

const PALETTE = "(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";

/** [name, regex, extensions, exemption] */
const RULES = [
  ["prefers-color-scheme", /prefers-color-scheme/, [".ts", ".tsx", ".css", ".mjs"]],
  ["dark: variant", /(?:^|[\s"'`])dark:/, [".ts", ".tsx", ".css"]],
  // A hex colour: 3 to 8 hex chars with at least one letter (the palette has no all-digit hex);
  // all-digit ones are checked in CSS declarations and as 6 digits in code, so `#213` puzzle
  // numbers and `#118` rank strings in copy pass.
  ["hex literal outside tokens.css", /#(?=[0-9a-fA-F]*[a-fA-F])[0-9a-fA-F]{3,8}(?![\w-])/, [".ts", ".tsx", ".css", ".json"], (f) => HEX_ALLOWED.has(f)],
  ["all-digit hex literal", /[:=(]\s*#\d{3}(?:\d{3})?(?![\w-])/, [".css"], (f) => HEX_ALLOWED.has(f)],
  ["all-digit hex literal", /#\d{6}(?![\w-])/, [".ts", ".tsx", ".json"], (f) => HEX_ALLOWED.has(f)],
  ["opacity-0", /\bopacity-0(?![.\d])/, [".ts", ".tsx", ".css"]],
  ["animate-pulse", /animate-pulse/, [".ts", ".tsx", ".css"]],
  ["animate-spin", /animate-spin/, [".ts", ".tsx", ".css"]],
  ["skeleton", /skeleton/i, [".ts", ".tsx", ".css"]],
  ["backdrop-blur", /backdrop-blur|backdrop-filter/, [".ts", ".tsx", ".css"]],
  ["blur-", /\bblur-/, [".ts", ".tsx", ".css"]],
  ["shadow-", /\bshadow-(?!none\b)/, [".ts", ".tsx"]],
  ["ssr: false", /ssr:\s*false/, [".ts", ".tsx"]],
  ["unstable_instant", /unstable_instant/, [".ts", ".tsx"]],
  ["text-white", /\btext-white\b/, [".ts", ".tsx", ".css"]],
  ["bg-black", /\bbg-black\b/, [".ts", ".tsx", ".css"]],
  ["border-border", /\bborder-border\b/, [".ts", ".tsx", ".css"]],
  ["raw palette class", new RegExp(`\\b(?:bg|text|border|from|to|via|ring|fill|stroke|outline|decoration)-${PALETTE}-\\d{2,3}\\b`), [".ts", ".tsx", ".css"]],
  ["glyph icon character", /[→←✓✗✕↑↓↩★•]/, [".tsx"], (f) => f.startsWith("src/lib/share/")],
  ["emoji", /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u, [".ts", ".tsx", ".json"], EMOJI_ALLOWED],
  ["em dash", /—/, [".ts", ".tsx"], (f) => !/^src\/(ui|content|features|games|styles|app\/\()/.test(f)],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
}

function isLegacy(rel, source) {
  if (LEGACY_PREFIXES.some((p) => rel.startsWith(p))) return true;
  if (LEGACY_FILES.has(rel)) return true;
  if (REWRITTEN_LATER.has(rel)) return true;
  if (/\.tsx?$/.test(rel) && /from\s+["']@\/components\//.test(source)) return true;
  return false;
}

const files = walk(path.join(root, "src"));
const violations = [];
let scanned = 0;
let skipped = 0;

for (const abs of files) {
  const rel = path.relative(root, abs).split(path.sep).join("/");
  const ext = path.extname(rel);
  if (!TEXT.has(ext)) continue;
  const source = readFileSync(abs, "utf8");
  if (!strict && isLegacy(rel, source)) {
    skipped++;
    continue;
  }
  scanned++;
  if (path.basename(rel) === "loading.tsx" && rel.startsWith("src/app/")) violations.push(`${rel}: loading.tsx is not allowed (no loading states)`);
  const lines = source.split("\n");
  for (const [name, re, exts, exempt] of RULES) {
    if (!exts.includes(ext)) continue;
    if (exempt && exempt(rel)) continue;
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      // Comments never render; the rules are about what reaches the screen or the stylesheet.
      if (CODE.has(ext) && /^(\/\/|\*|\/\*)/.test(trimmed)) return;
      if (re.test(line)) violations.push(`${rel}:${i + 1}: ${name}: ${trimmed.slice(0, 120)}`);
    });
  }
}

console.log(`check-theme: ${scanned} files scanned${strict ? " (strict)" : `, ${skipped} legacy files skipped (deleted by P8; run with --strict to include them)`}`);
if (violations.length) {
  console.error(violations.join("\n"));
  console.error(`\n${violations.length} violation(s)`);
  process.exit(1);
}
console.log("check-theme: clean");
