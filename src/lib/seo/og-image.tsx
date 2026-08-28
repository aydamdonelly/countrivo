import { ImageResponse } from "next/og";
import { getGameBySlug } from "@/lib/data/registry";
import type { GameMeta } from "@/types/game";
import { erodeFontData } from "./erode-font";

/**
 * Shared Open Graph card renderer for every game route.
 *
 * Design language is copied from src/app/opengraph-image.tsx: cream page, the
 * "Coun·trivo" wordmark with a gold separator, monospace metadata rows.
 * Each game gets its own accent wash so a link dropped in Discord/iMessage is
 * recognisable at a glance.
 *
 * ── Why hex literals live here ──
 * ImageResponse (Satori) cannot resolve CSS custom properties, so `var(--…)`
 * renders as nothing. game-colors.ts deliberately returns `var(--game-{slug}-…)`
 * for the DOM and warns against feeding those into an OG image. The maps below
 * therefore MIRROR the light-mode tokens in globals.css (`--game-{slug}-bg/fg`
 * and the core palette) as literals. This file is the single sanctioned
 * exception to the no-hardcoded-colour rule — never copy these values out.
 */

/** Mirrors --color-bg / --color-cream / --color-cream-muted / --color-gold (light). */
const PAGE_BG = "#fbfaf6";
const INK = "#17181a";
const INK_MUTED = "#555555";
const INK_FAINT = "#999999";
const GOLD = "#b8432a";

interface Accent {
  /** Wash behind the emoji tile — mirrors --game-{slug}-bg. */
  bg: string;
  /** Ink on the wash — mirrors --game-{slug}-fg. */
  fg: string;
}

/** Mirrors the light values of --game-{slug}-bg / -fg in globals.css. */
const GAME_ACCENTS: Record<string, Accent> = {
  "country-draft": { bg: "#f1f0ea", fg: "#17181a" },
  "flag-quiz": { bg: "#f1f0ea", fg: "#17181a" },
  "higher-or-lower": { bg: "#f1f0ea", fg: "#17181a" },
  "capital-match": { bg: "#f1f0ea", fg: "#17181a" },
  "population-sort": { bg: "#f1f0ea", fg: "#17181a" },
  "country-streak": { bg: "#f1f0ea", fg: "#17181a" },
  "border-buddies": { bg: "#f1f0ea", fg: "#17181a" },
  "continent-sprint": { bg: "#f1f0ea", fg: "#17181a" },
  "stat-guesser": { bg: "#f1f0ea", fg: "#17181a" },
  "speed-flags": { bg: "#f1f0ea", fg: "#17181a" },
  "odd-one-out": { bg: "#f1f0ea", fg: "#17181a" },
  supremacy: { bg: "#f1f0ea", fg: "#17181a" },
  borderline: { bg: "#f1f0ea", fg: "#17181a" },
  blitz: { bg: "#f1f0ea", fg: "#17181a" },
  // The three newest games have no DOM wash yet; these keep the OG set complete
  // and stay inside the same tint family as the tokens above.
  "geo-wordle": { bg: "#f1f0ea", fg: "#17181a" },
  cluster: { bg: "#f1f0ea", fg: "#17181a" },
  "risk-zone": { bg: "#f1f0ea", fg: "#17181a" },
};

/** Mirrors --game-drills-bg / -fg — used for unknown slugs. */
const FALLBACK_ACCENT: Accent = { bg: "#f5f4f0", fg: INK };

const DIFFICULTY_LABEL: Record<GameMeta["difficulty"], string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export interface GameOgProps {
  title: string;
  emoji?: string;
  shortDescription: string;
  accent: Accent;
  /** Small pill in the top-right — e.g. "Daily challenge". */
  badge: string;
  /** Monospace footer items, rendered with gold separators. */
  footer: string[];
}

/** Low-level renderer. Everything is explicit flex — Satori needs it. */
let erode: ArrayBuffer | null = null;
function erodeFont(): ArrayBuffer {
  if (!erode) erode = erodeFontData();
  return erode;
}

export async function renderGameOgImage({
  title,
  shortDescription,
  accent,
  badge,
  footer,
}: GameOgProps): Promise<ImageResponse> {
  const font = erodeFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAGE_BG,
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "56px 72px 52px 72px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", fontFamily: "Erode", fontSize: 40, color: INK, lineHeight: 1 }}>Countrivo</div>
          <div style={{ display: "flex", fontSize: 24, color: INK_MUTED }}>{badge}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Erode", fontSize: 96, color: accent.fg, lineHeight: 1.02, maxWidth: 1000 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 34, color: INK_MUTED, lineHeight: 1.35, maxWidth: 960 }}>{shortDescription}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, color: INK_FAINT }}>
          {footer.map((item, i) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {i > 0 ? <span style={{ color: GOLD }}>·</span> : null}
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: GOLD, display: "flex" }} />
      </div>
    ),
    { ...ogSize, fonts: [{ name: "Erode", data: font, weight: 600, style: "normal" }] }
  );
}

function accentFor(slug: string): Accent {
  return GAME_ACCENTS[slug] ?? FALLBACK_ACCENT;
}

/** Alt text for a game's card. Falls back to the brand line for unknown slugs. */
export function gameOgAlt(slug: string): string {
  const game = getGameBySlug(slug);
  return game ? `${game.title} — ${game.shortDescription}` : "Countrivo · One puzzle a day";
}

interface SlugOgOptions {
  /** Overrides the mode pill. */
  badge?: string;
  /** Overrides the description line. */
  shortDescription?: string;
}

/**
 * Registry-driven entry point used by every games/{slug}/opengraph-image.tsx.
 * Unknown slugs degrade to a generic Countrivo card instead of throwing.
 */
export function renderGameOgImageForSlug(
  slug: string,
  options: SlugOgOptions = {}
): Promise<ImageResponse> {
  const game = getGameBySlug(slug);

  if (!game) {
    return renderGameOgImage({
      title: "Countrivo",
      shortDescription: options.shortDescription ?? "One geography puzzle a day.",
      accent: FALLBACK_ACCENT,
      badge: options.badge ?? "Geography games",
      footer: ["18 games", "243 countries", "countrivo.com"],
    });
  }

  const isDaily = game.availableModes.includes("daily");

  return renderGameOgImage({
    title: game.title,
    shortDescription: options.shortDescription ?? game.shortDescription,
    accent: accentFor(slug),
    badge: options.badge ?? (isDaily ? "Daily challenge" : "Practice mode"),
    footer: [DIFFICULTY_LABEL[game.difficulty], game.estimatedTime, "countrivo.com"],
  });
}
