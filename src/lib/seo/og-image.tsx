import { ImageResponse } from "next/og";
import { getGameBySlug } from "@/lib/data/registry";
import type { GameMeta } from "@/types/game";

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
const PAGE_BG = "#fafaf8";
const INK = "#1a1a1a";
const INK_MUTED = "#555555";
const INK_FAINT = "#999999";
const GOLD = "#b8860b";

interface Accent {
  /** Wash behind the emoji tile — mirrors --game-{slug}-bg. */
  bg: string;
  /** Ink on the wash — mirrors --game-{slug}-fg. */
  fg: string;
}

/** Mirrors the light values of --game-{slug}-bg / -fg in globals.css. */
const GAME_ACCENTS: Record<string, Accent> = {
  "country-draft": { bg: "#fee2e2", fg: "#991b1b" },
  "flag-quiz": { bg: "#dbeafe", fg: "#1e3a5f" },
  "higher-or-lower": { bg: "#d1fae5", fg: "#064e3b" },
  "capital-match": { bg: "#fef3c7", fg: "#78350f" },
  "population-sort": { bg: "#ede9fe", fg: "#4c1d95" },
  "country-streak": { bg: "#ffedd5", fg: "#7c2d12" },
  "border-buddies": { bg: "#ccfbf1", fg: "#134e4a" },
  "continent-sprint": { bg: "#e0e7ff", fg: "#312e81" },
  "stat-guesser": { bg: "#fce7f3", fg: "#831843" },
  "speed-flags": { bg: "#ecfccb", fg: "#365314" },
  "odd-one-out": { bg: "#f3e8ff", fg: "#581c87" },
  supremacy: { bg: "#fef9c3", fg: "#713f12" },
  borderline: { bg: "#cffafe", fg: "#155e75" },
  blitz: { bg: "#fecaca", fg: "#7f1d1d" },
  // The three newest games have no DOM wash yet; these keep the OG set complete
  // and stay inside the same tint family as the tokens above.
  "geo-wordle": { bg: "#dcfce7", fg: "#14532d" },
  cluster: { bg: "#ffe4e6", fg: "#881337" },
  "risk-zone": { bg: "#fae8ff", fg: "#701a75" },
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
  emoji: string;
  shortDescription: string;
  accent: Accent;
  /** Small pill in the top-right — e.g. "Daily challenge". */
  badge: string;
  /** Monospace footer items, rendered with gold separators. */
  footer: string[];
}

/** Low-level renderer. Everything is explicit flex — Satori needs it. */
export function renderGameOgImage({
  title,
  emoji,
  shortDescription,
  accent,
  badge,
  footer,
}: GameOgProps): ImageResponse {
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
        }}
      >
        {/* Per-game accent rail */}
        <div style={{ display: "flex", width: "100%", height: 16, background: accent.fg }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "52px 72px 56px 72px",
            justifyContent: "space-between",
          }}
        >
          {/* Wordmark + mode badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontSize: 40,
                fontWeight: 800,
                color: INK,
                letterSpacing: "-0.045em",
                lineHeight: 1,
              }}
            >
              <span>Coun</span>
              <span style={{ color: GOLD, margin: "0 3px" }}>·</span>
              <span>trivo</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 22px",
                borderRadius: 999,
                background: accent.bg,
                color: accent.fg,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.01em",
              }}
            >
              {badge}
            </div>
          </div>

          {/* Game identity */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 132,
                  height: 132,
                  borderRadius: 32,
                  background: accent.bg,
                  fontSize: 76,
                }}
              >
                {emoji}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 86,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  marginLeft: 32,
                  maxWidth: 820,
                }}
              >
                {title}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 36,
                color: INK_MUTED,
                lineHeight: 1.3,
                maxWidth: 1000,
              }}
            >
              {shortDescription}
            </div>
          </div>

          {/* Metadata row — always carries the domain so screenshots keep it */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 24,
              color: INK_FAINT,
              fontFamily: "monospace",
            }}
          >
            {footer.map((item, i) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {i > 0 ? <span style={{ color: GOLD }}>·</span> : null}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...ogSize }
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
): ImageResponse {
  const game = getGameBySlug(slug);

  if (!game) {
    return renderGameOgImage({
      title: "Countrivo",
      emoji: "🌍",
      shortDescription: options.shortDescription ?? "One geography puzzle a day.",
      accent: FALLBACK_ACCENT,
      badge: options.badge ?? "Geography games",
      footer: ["17 games", "243 countries", "countrivo.com"],
    });
  }

  const isDaily = game.availableModes.includes("daily");

  return renderGameOgImage({
    title: game.title,
    emoji: game.emoji,
    shortDescription: options.shortDescription ?? game.shortDescription,
    accent: accentFor(slug),
    badge: options.badge ?? (isDaily ? "Daily challenge" : "Practice mode"),
    footer: [DIFFICULTY_LABEL[game.difficulty], game.estimatedTime, "countrivo.com"],
  });
}
