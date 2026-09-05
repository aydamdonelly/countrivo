import { ImageResponse } from "next/og";
import conquest from "@/assets/marks/conquest.json";
import { getGameContent } from "@/content/games";
import { getAllCountries } from "@/lib/data/countries";
import { getAllGames, getGameBySlug } from "@/lib/data/registry";
import type { GameMeta } from "@/types/game";
import { erodeFontData } from "./erode-font";

/**
 * The Open Graph card family: root, game landings and shared runs.
 *
 * Every card is the home screen's own composition, not a poster about it: paper
 * ground, a 6 px ember rule along the top edge, the Erode wordmark, and the ink
 * anchor card carrying the kicker row, the title, the one-line rule, the chips
 * and the paper Shoot button that overlaps them. Somebody who taps the link
 * lands on the same object.
 *
 * ── Why hex literals live here ──
 * Satori (ImageResponse) cannot resolve CSS custom properties: `var(--color-ink)`
 * renders as nothing. The constants below therefore MIRROR src/styles/tokens.css
 * one for one, and this file is the sanctioned exception to the no-hex rule
 * (blueprint section 1) together with tokens.css, global-error.tsx and
 * capacitor/www/offline.html. `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`
 * and `manifest.ts` import these names instead of writing their own literals.
 * If a token moves in tokens.css, move it here in the same commit.
 */
export const PAPER = "#fbfaf6"; /* --color-paper */
export const CARD = "#f1f0ea"; /* --color-card */
export const INK = "#17181a"; /* --color-ink */
export const INK_2 = "#2b2c2e"; /* --color-ink-2 */
export const INK_MUTED = "#74756f"; /* --color-mute */
export const INK_FAINT = "#b9b8b1"; /* --color-faint */
export const EMBER = "#b8432a"; /* --color-ember */
export const ON_INK = "#fbfaf6"; /* --color-on-ink */
export const ON_INK_BODY = "#c9c8c1"; /* --color-on-ink-body */
export const ON_INK_KICKER = "#a9aaa3"; /* --color-on-ink-kicker */
export const ON_INK_CHIP = "#d9d8d1"; /* --color-on-ink-chip */

/** The same precomputed Natural Earth paths the Country Draft mark draws (blueprint 3.36). */
const MAP = conquest as { viewBox: string; land: string; countries: Record<string, string> };

const DIFFICULTY_LABEL: Record<GameMeta["difficulty"], string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** The anchor of the site and of this card family (blueprint 0.4 roster). */
const FLAGSHIP_SLUG = "country-draft";

/** The first two sentences of Country Draft's landing rule, verbatim. */
const FLAGSHIP_HOW = "Draft five people. Give each a seat: leader, general, money, propaganda, diplomacy.";

/**
 * Erode 600, embedded as base64 (src/lib/seo/erode-font.ts) because Satori reads
 * ttf/otf/woff and the app's faces are woff2. Passing `fonts` replaces Satori's
 * bundled default outright, so the whole card is set in the display face: there
 * is no system-ui inside an OG image, and a second embedded family would be a
 * font nobody chose. Hierarchy comes from size, weight of colour and space.
 */
let erode: ArrayBuffer | null = null;
function erodeFont(): ArrayBuffer {
  if (!erode) erode = erodeFontData();
  return erode;
}

export interface GameOgProps {
  /** Left half of the card kicker, typed in caps: "DAILY BOARD · FLAG QUIZ". */
  kicker: string;
  /** Right half of the kicker row: "resets at midnight Berlin". */
  counter: string;
  /** The card headline, Erode. */
  title: string;
  /** The one-line rule under the headline. */
  how: string;
  /** Two or three facts as chips; they sit beside the button. */
  chips: string[];
  /** The paper button in the card's bottom-right corner; null for a card with no action. */
  cta: string | null;
  /**
   * Country Draft only: the conquest map takes the right half of the card, so the
   * flagship's card carries the thing the game is about (blueprint 3.36).
   */
  map?: boolean;
}

/** Card geometry, so the map column and the type column are measured, not guessed. */
const CARD_INNER = 976; /* 1200 - 2*64 page gutter - 2*48 card padding */
const MAP_W = 400;
const MAP_H = Math.round((MAP_W * 150) / 320); /* the conquest viewBox is 320x150 */
const TYPE_COL = 540; /* 540 + 36 gap + 400 = 976 */

/** Everything is explicit flex: Satori has no block layout. */
export async function renderGameOgImage({
  kicker,
  counter,
  title,
  how,
  chips,
  cta,
  map = false,
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
          background: PAPER,
          fontFamily: "Erode",
          color: INK,
        }}
      >
        {/* the one ember rule, along the top edge of every card in the family */}
        <div style={{ display: "flex", height: 6, width: "100%", background: EMBER }} />

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            padding: "40px 64px 0 64px",
          }}
        >
          <div style={{ display: "flex", fontSize: 40, lineHeight: 1, color: INK }}>Countrivo</div>
          <div style={{ display: "flex", fontSize: 26, lineHeight: 1, color: INK_MUTED }}>
            countrivo.com
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            margin: "32px 64px 56px 64px",
            padding: "44px 48px 46px 48px",
            background: INK,
            borderRadius: 32,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: 26,
              lineHeight: 1.2,
              letterSpacing: "0.02em",
              color: ON_INK_KICKER,
            }}
          >
            <div style={{ display: "flex" }}>{kicker}</div>
            <div style={{ display: "flex" }}>{counter}</div>
          </div>

          {/* the title block floats between the kicker and the chip row, so the two
              gaps read as one deliberate measure instead of a hole in the middle.
              With the map, the same block becomes the left column of one row and the
              world sits beside it on the same optical centre. */}
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: map ? TYPE_COL : CARD_INNER,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: map ? 76 : 104,
                  lineHeight: 1.05,
                  color: ON_INK,
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: "flex",
                  marginTop: map ? 16 : 18,
                  fontSize: map ? 30 : 32,
                  lineHeight: 1.4,
                  color: ON_INK_BODY,
                  maxWidth: map ? TYPE_COL : 920,
                }}
              >
                {how}
              </div>
            </div>

            {map ? (
              <svg width={MAP_W} height={MAP_H} viewBox={MAP.viewBox}>
                <path d={MAP.land} fill={INK_2} />
                {Object.entries(MAP.countries).map(([iso3, d]) => (
                  <path key={iso3} d={d} fill={ON_INK} />
                ))}
              </svg>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 14, paddingRight: 260 }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  padding: "11px 20px",
                  borderRadius: 12,
                  background: INK_2,
                  color: ON_INK_CHIP,
                  fontSize: 26,
                  lineHeight: 1.2,
                  letterSpacing: "0.02em",
                }}
              >
                {chip}
              </div>
            ))}
          </div>

          {cta ? (
            <div
              style={{
                position: "absolute",
                right: 40,
                bottom: 40,
                display: "flex",
                padding: "22px 32px",
                borderRadius: 16,
                background: PAPER,
                color: INK,
                fontSize: 38,
                lineHeight: 1,
              }}
            >
              {cta}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...ogSize, fonts: [{ name: "Erode", data: font, weight: 600, style: "normal" }] }
  );
}

interface SlugOgOptions {
  /** Overrides the kicker's first half: "Daily board" / "Practice" / "Shared result". */
  badge?: string;
  /** Overrides the kicker's right half. */
  counter?: string;
  /** Overrides the one-line rule. */
  shortDescription?: string;
}

/** "3-5 min" is registry data; the house writes spans in words. */
function spellTime(estimated: string): string {
  return estimated.replace("-", " to ");
}

/**
 * Registry-driven entry point used by the landing and run OG routes.
 * Unknown slugs degrade to the brand card instead of throwing.
 */
export function renderGameOgImageForSlug(
  slug: string,
  options: SlugOgOptions = {}
): Promise<ImageResponse> {
  const game = getGameBySlug(slug);

  if (!game) {
    return renderGameOgImage({
      kicker: (options.badge ?? "Geography games").toUpperCase(),
      counter: options.counter ?? "one shot a day",
      title: "Countrivo",
      how:
        options.shortDescription ??
        "Free geography games. One shot a day, same board for everyone.",
      chips: [`${getAllGames().length} games`, `${getAllCountries().length} countries`],
      cta: "Play",
    });
  }

  const isDaily = game.availableModes.includes("daily");
  const badge = options.badge ?? (isDaily ? "Daily board" : "Practice");
  // The landing's own rule and facts (blueprint 10.5), so the card and the page it
  // opens say the same thing in the same words. The registry strings are the
  // fallback only: several are off-voice.
  const content = getGameContent(slug);
  // A game that is announced but not yet playable shows no button; nothing on the
  // card may promise an action the landing cannot answer.
  const cta = game.comingSoon ? null : slug === "geo-wordle" ? "Play daily" : isDaily ? "Shoot" : "Play";

  // The flagship. Country Draft is the one game whose subject is the world itself:
  // five people take five countries out of 195, and the conquest map draws exactly
  // that (the same five outlines as its mark, blueprint 3.36). So its card gives the
  // right half to the map and sets the type against it, instead of running the same
  // full-width headline as the other six.
  if (slug === FLAGSHIP_SLUG) {
    return renderGameOgImage({
      kicker: `${badge} · ${game.title}`.toUpperCase(),
      counter: options.counter ?? "draft 5 people · conquer 195",
      title: game.title,
      // The first two sentences of the landing's own rule (src/content/games.ts):
      // the full four run past the card, and a card must not invent a new sentence.
      how: options.shortDescription ?? FLAGSHIP_HOW,
      chips: content ? [...content.facts] : [],
      cta,
      map: true,
    });
  }

  return renderGameOgImage({
    kicker: `${badge} · ${game.title}`.toUpperCase(),
    counter: options.counter ?? (isDaily ? "resets at midnight Berlin" : "unlimited"),
    title: game.title,
    how: options.shortDescription ?? content?.how ?? game.shortDescription,
    chips: content
      ? [...content.facts]
      : [DIFFICULTY_LABEL[game.difficulty], spellTime(game.estimatedTime)],
    cta,
  });
}
