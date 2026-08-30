// Fails the build on any single-theme or no-loading-state violation (blueprint section 14 F0).
// Run: node scripts/check-theme.mjs
//
// Every file under src/ is scanned. The legacy tree the old build carried (src/components
// and the pre-group route files) was deleted by the section 12 gate, so there is nothing
// to skip any more; --strict is accepted and ignored so older invocations keep working.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
/** Hex literals are allowed only here (section 1). */
const HEX_ALLOWED = new Set(["src/styles/tokens.css", "src/lib/seo/og-image.tsx", "src/app/global-error.tsx"]);
/** The clipboard share strings carry the coloured squares; the GeoWordle engine keeps `arrow` in the resultJson contract (section 5.1). */
// The share builders draw their spoiler-safe squares, GeoWordle keeps its arrow fallback,
// and figure-credits.json holds third-party attribution strings verbatim: some carry a ©,
// which this rule reads as a pictograph. Attribution text is never edited to satisfy a
// linter, so the data file is exempt. Nothing in it is ever rendered as an icon.
const EMOJI_ALLOWED = (f) =>
  f.startsWith("src/lib/share/") ||
  f === "src/lib/game-logic/geo-wordle/engine.ts" ||
  f === "src/data/figure-credits.json";

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

const files = walk(path.join(root, "src"));
const violations = [];
let scanned = 0;

for (const abs of files) {
  const rel = path.relative(root, abs).split(path.sep).join("/");
  const ext = path.extname(rel);
  if (!TEXT.has(ext)) continue;
  const source = readFileSync(abs, "utf8");
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

console.log(`check-theme: ${scanned} files scanned`);
if (violations.length) {
  console.error(violations.join("\n"));
  console.error(`\n${violations.length} violation(s)`);
  process.exit(1);
}
console.log("check-theme: clean");
