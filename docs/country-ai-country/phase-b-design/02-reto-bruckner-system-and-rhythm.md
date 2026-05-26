# 02 · Reto Bruckner · System & Rhythmus

> Mein Grossvater hat mir mit dreizehn beigebracht, dass jedes Buch eine Achse hat — und dass der erste Falz alle weiteren bestimmt. Countrivo hat einen ersten Falz. Er ist gut gemessen. Aber es gibt sechs Stellen, an denen das Papier krumm gefaltet wurde, weil niemand das Lineal zweimal aufgelegt hat. Ich lege es jetzt zweimal auf.

---

Ich komme spät dazu. Aurelie hat die Wand abgetragen und gezeigt, was sich überlagert. Hella wird die Stimme tragen, Aleksandr die Wegweiser. Mir gehört das Skelett: was hält die Komponenten zusammen, in welchem Takt bewegen sie sich, wie heisst ein Knopf, damit er an fünfzehn Stellen derselbe Knopf bleibt.

Ich arbeite an einem Spielsystem, nicht an einer Vitrine. Das heisst: jedes Token muss von einer realen Stelle gefordert sein. Wer ein Token hinzufügt, das nichts ruft, malt ein Wort an die Wand. Wer ein Token löscht, das etwas ruft, lässt eine Klammer offen. Beides macht die Naht hässlich.

Hier ist, was ich entscheide.

---

## Token-Architektur

**Verdict: `@theme` bleibt der einzige Ort. Aber er wird gewaschen, getrocknet und neu gelegt.**

Was raus muss:

- `--font-serif: var(--font-serif)` — zeigt auf sich selbst. Niemand benutzt `font-serif`. Geisterstift, wird gelöscht. Wenn Hella später eine Display-Serife möchte, wird sie als echte Variable über `next/font` eingeladen, nicht als Geist deklariert.
- `--color-gold-dim` als RGBA-Literal — wird zur tokenisierten Tinte, weil sie mehrfach gebraucht wird und die Opazität pro Stelle variiert. Lösung: `--color-gold` als Hex, `--color-gold-on-bg-soft` als separater Token (siehe unten), und die alte `gold-dim` wird beerdigt.

Was rein muss:

- **Eine vollständige `--font-size-*`-Skala mit `xxs`** — schliesst die zwanzig `text-[10px]/[11px]`-Hacks.
- **Spacing-Tokens für Inline-Lücken (`--gap-*`)**, damit `gap-1.5` und `gap-2.5` aufhören, im Kopf des Lesers durchgezählt zu werden.
- **Per-Game Color-Tokens** für die fünfzehn Spiele (siehe nächster Abschnitt), nicht in TS.
- **`--duration-*`** für Bewegung (4 Stufen) und **`--ease-*`** verfeinert (3 statt 2 Stufen).
- Ein neuer **`--color-accent`** und **`--color-accent-light`** Token, damit die `bg-amber-50`/`bg-emerald-100`-Inline-Klassen in den Boards (countryle, capital-match) ihren semantischen Platz finden.

Hier ist der Block, so wie er aussehen soll. Copy-paste-tauglich:

```css
@theme {
  /* ─── Typografie ─── */
  --font-sans: var(--font-sans);
  /* serif gelöscht */

  --font-size-xxs: 0.6875rem;   /* 11px — Footer, Meta-Chips, Badges */
  --font-size-xs:  0.75rem;     /* 12px — Hilfstext, Caption */
  --font-size-sm:  0.875rem;    /* 14px — Body small */
  --font-size-base:1rem;        /* 16px — Body */
  --font-size-lg:  1.125rem;    /* 18px — CTA, Lead */
  --font-size-xl:  1.5rem;      /* 24px — Section heading */
  --font-size-2xl: 2rem;        /* 32px — Game title */
  --font-size-3xl: 2.5rem;      /* 40px — Hero */
  --font-size-display: 3.5rem;  /* 56px — Result Hero */

  /* ─── Hintergrund & Oberfläche ─── */
  --color-bg: #fafaf8;
  --color-surface: #ffffff;
  --color-surface-elevated: #f5f4f0;
  --color-surface-sunken: #efeee8;       /* neu — für Empty-Rows, Skeletons */

  /* ─── Brand: Gold ─── */
  --color-gold: #b8860b;                  /* Ein Gold. Logo & Brand vereinigt. */
  --color-gold-bright: #d4a017;
  --color-gold-deep: #96700a;             /* umbenannt von -solid */
  --color-gold-on-bg-soft: rgba(184,134,11,0.10);
  --color-gold-on-bg-medium: rgba(184,134,11,0.20);
  --color-gold-shadow: rgba(184,134,11,0.25);

  /* ─── Akzent (semantisch, nicht Brand) ─── */
  --color-accent: #2563eb;                /* das "neutrale" Spielfeedback-Blau */
  --color-accent-light: #dbeafe;

  /* ─── Text ─── */
  --color-cream: #1a1a1a;
  --color-cream-muted: rgba(26,26,26,0.62);
  --color-cream-ghost: rgba(26,26,26,0.06);

  /* ─── Border ─── */
  --color-border: rgba(0,0,0,0.08);
  --color-border-hover: rgba(0,0,0,0.18);
  --color-border-focus: var(--color-gold);

  /* ─── Semantisch ─── */
  --color-correct: #16a34a;
  --color-correct-light: #dcfce7;
  --color-incorrect: #dc2626;
  --color-incorrect-light: #fef2f2;
  --color-warning: #d97706;
  --color-warning-light: #fef3c7;

  /* ─── Per-Game-Token-Stack — Hella darf hier später mischen ─── */
  /*   Pattern: --game-{slug}-bg / --game-{slug}-fg                  */
  /*   Siehe Per-Game-Color-System unten — gleicher Block.           */

  /* ─── Radius ─── */
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  10px;
  --radius-xl:  14px;
  --radius-2xl: 20px;     /* neu — Hero-Cards, Result-Hero */
  --radius-full: 9999px;

  /* ─── Spacing & Rhythmus (4-pt-Grundskala, fixiert) ─── */
  --space-1: 0.25rem;     /*  4 */
  --space-2: 0.5rem;      /*  8 */
  --space-3: 0.75rem;     /* 12 */
  --space-4: 1rem;        /* 16 */
  --space-5: 1.5rem;      /* 24 */
  --space-6: 2rem;        /* 32 */
  --space-7: 3rem;        /* 48 */
  --space-8: 4rem;        /* 64 */
  --space-9: 6rem;        /* 96 */

  /* ─── Shadow ─── */
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.08);
  --shadow-md:   0 4px 12px -2px rgba(0,0,0,0.10);
  --shadow-lg:   0 8px 24px -4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
  --shadow-xl:   0 12px 36px -8px rgba(0,0,0,0.15);
  --shadow-gold: 0 4px 14px -3px var(--color-gold-shadow);
  --shadow-inset:inset 0 1px 0 rgba(255,255,255,0.6);  /* neu — Glas auf Brand */

  /* ─── Bewegung ─── */
  --duration-instant: 80ms;     /* Tap-Feedback */
  --duration-fast:    160ms;    /* Hover, focus */
  --duration-base:    240ms;    /* Default für Spielfeedback */
  --duration-slow:    480ms;    /* Result-Reveal, Stagger */

  --ease-game:    cubic-bezier(0.34, 1.56, 0.64, 1);   /* bouncy — Spielfeedback */
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);          /* Navigation, UI */
  --ease-emphasis:cubic-bezier(0.2, 0, 0, 1);          /* Section-Reveal */
}
```

Begründung der Diät:

- Die Skala der Schriftgrössen ist explizit, sodass `text-xxs` ein reales Tailwind-Utility wird. Die zwanzig Bracket-Hacks fallen in einer Edit-Pass weg.
- `--color-gold-on-bg-soft` und `-medium` ersetzen die ad-hoc-Mischungen wie `bg-black/5` über Goldbereichen.
- `--shadow-inset` ist die einzige neue Shadow-Schicht — sie ist die ehrliche, sehr schmale Lichtreflektion auf einem Gold-Button, die ihn aus der Fläche hebt. Mehr braucht es nicht.
- Vier Dauern. Mehr ist Mode, weniger ist Armut.

---

## Per-Game-Color-System

**Verdict: Die Per-Game-Palette wandert von TypeScript in `@theme`. Tokens, nicht Hex-Konstanten.**

Aurelie hat recht, dass `game-colors.ts` eine zweite Farbtafel ist. Aber sie hat auch geschrieben, dass die Inline-Style-Lösung *akzeptabel* sei. Das ist sie nicht — nicht, weil Inline-Styles falsch sind, sondern weil eine **dritte Person** (Hella oder ein zukünftiger Mensch im Stuhl der Marke) niemals die Goldsemantik einer Farbe in einer TS-Datei sucht.

Farben sind Marke. Marke gehört in CSS-Custom-Properties, wo sie `currentColor`, `:where`, `data-attribute`-Selektoren und alle Tailwind-Klassen erreichen kann.

Die fünfzehn Spiele bekommen je zwei Tokens — `--game-{slug}-bg` und `--game-{slug}-fg`:

```css
@theme {
  /* … fortgesetzt … */

  /* Per-Game (Hella darf hier feilen) — bg = sanftes Pastell, fg = tiefe Tinte */
  --game-country-draft-bg:    #fee2e2;  --game-country-draft-fg:    #991b1b;
  --game-flag-quiz-bg:        #dbeafe;  --game-flag-quiz-fg:        #1e3a5f;
  --game-higher-or-lower-bg:  #d1fae5;  --game-higher-or-lower-fg:  #064e3b;
  --game-capital-match-bg:    #fef3c7;  --game-capital-match-fg:    #78350f;
  --game-population-sort-bg:  #ede9fe;  --game-population-sort-fg:  #4c1d95;
  --game-country-streak-bg:   #ffedd5;  --game-country-streak-fg:   #7c2d12;
  --game-border-buddies-bg:   #ccfbf1;  --game-border-buddies-fg:   #134e4a;
  --game-continent-sprint-bg: #e0e7ff;  --game-continent-sprint-fg: #312e81;
  --game-stat-guesser-bg:     #fce7f3;  --game-stat-guesser-fg:     #831843;
  --game-speed-flags-bg:      #ecfccb;  --game-speed-flags-fg:      #365314;
  --game-odd-one-out-bg:      #f3e8ff;  --game-odd-one-out-fg:      #581c87;
  --game-supremacy-bg:        #fef9c3;  --game-supremacy-fg:        #713f12;
  --game-borderline-bg:       #cffafe;  --game-borderline-fg:       #155e75;
  --game-blitz-bg:            #fecaca;  --game-blitz-fg:            #7f1d1d;
  --game-countryle-bg:        #e8f5e9;  --game-countryle-fg:        #1b5e20;
}
```

Die alte `game-colors.ts` wird zu einem **Resolver**, kein Datenträger mehr:

```ts
// src/lib/game-colors.ts
export function getGameColor(slug: string) {
  return {
    bg: `var(--game-${slug}-bg, var(--color-surface-elevated))`,
    fg: `var(--game-${slug}-fg, var(--color-cream))`,
  };
}
```

Vorteile:

1. **Eine Quelle, eine Wahrheit.** Hella kann einen Goldton heben, ohne TypeScript anzufassen.
2. **Tailwind-erreichbar.** Wer in einem Board `style={{ backgroundColor: "var(--game-flag-quiz-bg)" }}` schreibt, oder via Data-Attribut `data-game="flag-quiz"` und einem Selektor `[data-game] { background: var(--game-${attr}-bg); }` arbeitet (Aleksandr wird das mögen für Affordance) — beides geht jetzt.
3. **Konsistenter Default-Fallback.** Aktuell ist es `#f3f4f6/#374151` — ein grauer, harter Akkord, der nichts mit dem Brand-Cream zu tun hat. Neu: `--color-surface-elevated/--color-cream` — also die Marke spricht, auch wenn ein Spiel keine eigene Farbe hat.

Die fünfzehn Spiele × zwei Farben = **dreissig Tokens**. Das klingt nach Inflation, aber sie sind alle gleich strukturiert (`--game-{slug}-{bg|fg}`), und sie sind die einzigen brand-relevanten Daten, die heute in TS liegen.

Ich gebe Hella eine Notiz: *Wenn du diese fünfzehn Paletten neu mischst, denk daran, dass jede mit dem `--color-cream` (Text) und dem `--color-gold` (CTA) eine ungetrübte Hochzeit eingehen muss. Drei Paletten lügen heute: country-streak und blitz haben fast denselben Rotton; odd-one-out und population-sort fast denselben Lila. Wer fünfzehn Pastelle malt, muss zwei davon umfärben.*

---

## Spacing & Rhythmus

**Verdict: 4-pt-Grundskala mit fester Sequenz, kein modulares Verhältnis.**

Aurelie hat gezählt: `p-1, p-2, p-3, p-4, p-5, p-10, p-14` — Tailwinds Default. Das ist diszipliniert. Ein modulares Verhältnis (1.25× oder 1.5×) würde an einem Spielsystem mit Card-Grids und Multi-Column-Buttons zerren — wir brauchen *Ganzzahl-Vielfache*, sonst klemmt die Pixel-Naht zwischen einer 12px-Card und einem 24px-Gap.

Die Skala bleibt also 4-pt, aber sie wird **semantisiert** — also nicht "p-3" sondern "Component-Inner-Padding-Default", referenziert über Token. Das macht den Code lesbarer und legt einen klaren Rhythmus fest:

| Token | Wert | Use |
|---|---|---|
| `--space-1` | 4 | Icon-Gap, Chip-Padding-Y |
| `--space-2` | 8 | Card-Innenrand klein, Inline-Gap |
| `--space-3` | 12 | Default-Card-Padding, Button-Padding-Y |
| `--space-4` | 16 | Component-Innenrand-Default, Stack-Gap-Default |
| `--space-5` | 24 | Section-Gap, Card-Padding-Hero |
| `--space-6` | 32 | Section-Gap-Hero |
| `--space-7` | 48 | Page-Section-Distanz |
| `--space-8` | 64 | Hero-Innenraum, Result-Hero-Padding |
| `--space-9` | 96 | Page-Top-Bottom auf Landings |

Die Skala ist bewusst **nicht** doppelt so dicht wie Tailwinds Default. Tailwinds 4-pt-Sequenz `0/1/2/3/4/5/6/8/10/12/14/16/20/24` darf weiterleben — sie ist die Schreibsprache. Unsere Tokens sind die *Architektur* darüber, für sieben Hauptverhältnisse, die immer wieder kommen.

**Eine harte Regel:** ab heute keine `gap-1.5`, `gap-2.5`, `gap-3.5` in neuem Code. Wer ein Halbschritt-Spacing braucht, denkt zweimal — meistens ist die Hierarchie falsch, nicht das Spacing.

Die zwanzig `text-[10px]/[11px]`-Hacks lösen sich auf, wenn `text-xxs` ein echtes Tailwind-Utility wird (siehe Token-Block). Ich schätze das auf einen einzigen Pull-Request, eine Stunde Arbeit, achtzehn bis zweiundzwanzig Dateien.

---

## CTA-System

**Verdict: Tailwind-Klassen-Komposition wird beerdigt. `<Button>` wird Komponente.**

Aurelie hat fünfzehn Stellen gefunden, wo ein Gold-Button aus Tailwind-Strings gebaut wird. Das ist nicht *fast* eine Komponente — das ist eine fehlende. Wer fünfzehn Stellen mit `className="bg-gold text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.97] …"` hat, hat keine Klasse, sondern eine *unbewiesene* Komponente, die in fünfzehn Kopien verteilt liegt. Wer sich verschreibt, schreibt sich an vierzehn Stellen weiter unten verschieden.

Die `<Button>`-Komponente lebt in `src/components/ui/button.tsx`. Sie ist die *einzige* zentrale UI-Komponente, die ich vorschlage, in diesem Pass zu erzwingen. Andere Komponenten (Modal, Tooltip, Pill) sind nice-to-have. Diese ist Pflicht.

API-Skizze:

```tsx
// src/components/ui/button.tsx
import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "tertiary" | "ghost";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: string;        // Unicode-emoji — wir haben keine Icon-Lib
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

type ButtonProps =
  | (BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" })
  | (BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: "link"; href: string });

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ variant = "primary", size = "md", icon, iconPosition = "left", fullWidth, children, className, loading, ...rest }, ref) {
    const cls = [
      "btn",                                      // shared
      `btn-${variant}`,                           // variant
      `btn-${size}`,                              // size
      fullWidth && "btn-block",
      loading && "btn-loading",
      className,
    ].filter(Boolean).join(" ");

    const content = (
      <>
        {icon && iconPosition === "left" && <span aria-hidden="true">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === "right" && <span aria-hidden="true">{icon}</span>}
      </>
    );

    if ("as" in rest && rest.as === "link") {
      const { as: _, ...anchor } = rest;
      return <Link className={cls} {...anchor} ref={ref as never}>{content}</Link>;
    }
    return <button className={cls} ref={ref as never} disabled={loading || (rest as ButtonHTMLAttributes<HTMLButtonElement>).disabled} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>{content}</button>;
  }
);
```

Die Styles bleiben in `globals.css`, mit klaren Klassen — die `.cta-primary` heisst neu `.btn .btn-primary` (semantisch sauberer, BEM-leicht):

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-weight: 700;
  border-radius: var(--radius-xl);
  border: none;
  cursor: pointer;
  transition: filter var(--duration-fast) var(--ease-out),
              transform var(--duration-instant) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.btn-sm { padding: var(--space-2) var(--space-3); min-height: 36px; font-size: var(--font-size-sm); }
.btn-md { padding: var(--space-3) var(--space-5); min-height: 44px; font-size: var(--font-size-base); }
.btn-lg { padding: var(--space-3) var(--space-6); min-height: 52px; font-size: var(--font-size-lg); }

.btn-primary {
  background-color: var(--color-gold);
  color: white;
  box-shadow: var(--shadow-gold), var(--shadow-inset);
}
.btn-primary:hover    { filter: brightness(1.08); box-shadow: var(--shadow-lg), var(--shadow-inset); transform: translateY(-1px); }
.btn-primary:active   { transform: scale(0.98); box-shadow: var(--shadow-sm); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-secondary {
  background-color: var(--color-gold-on-bg-soft);
  color: var(--color-gold-deep);
}
.btn-secondary:hover  { background-color: var(--color-gold-on-bg-medium); }
.btn-secondary:active { transform: scale(0.98); }

.btn-tertiary {
  background: transparent;
  color: var(--color-gold);
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.btn-tertiary:hover { color: var(--color-gold-deep); }

.btn-ghost {
  background: transparent;
  color: var(--color-cream-muted);
}
.btn-ghost:hover { background-color: rgba(0,0,0,0.04); color: var(--color-cream); }

.btn-block  { width: 100%; }
.btn-loading { pointer-events: none; opacity: 0.7; }
```

Migration: fünfzehn Aufrufstellen werden zu `<Button variant="primary" size="lg">Daily challenge</Button>`. Eine Stunde, vielleicht zwei. Die `cta-*`-Klassen werden via Sed-Substitution zu `btn btn-*`, dann gelöscht.

**Warum Komponente und nicht nur Klasse:** Klassen haben keine Constraints. Eine Klasse erlaubt einem zukünftigen Entwickler, eine Loading-Spinner manuell hineinzubasteln, oder `aria-disabled` zu vergessen, oder den `<Link>` und `<button>`-Switch falsch zu treffen. Eine Komponente erzwingt eine Form. Mein Grossvater hat nie ein Buch ohne Vorsatzblatt gebunden. Ein Buch ohne Vorsatzblatt funktioniert auch — bis es nicht mehr.

---

## Bewegungs-Grammatik

**Verdict: Vierzehn Keyframes auf neun konsolidieren. Vier Dauern, drei Easings. Alles getauft.**

Die vierzehn Keyframes von Aurelie sind zu viele. Es gibt nicht vierzehn semantisch verschiedene Bewegungen in dem Produkt — es gibt fünf bis sechs, mit Variationen. Hier ist die Konsolidierung:

| Keyframe | Bleibt? | Warum |
|---|---|---|
| `fade-in` | ja | Universal. Page enter. |
| `slide-up` | ja | Section reveal. |
| `scale-in` | ja | Modal-Open, Score-Reveal. |
| `pulse` | **umgemalt** | Aktuell `rgba(201,164,76)` (vierter Goldton). Wird zu `var(--color-gold)`. |
| `count-up` | ja | Number reveal — heilig für Result-Hero. |
| `shake` | ja | Falsch-Antwort. Heilig. Eine Dauer: 0.4s. |
| `streak-glow` | ja | Streak-Badge. Heilig. |
| `feedback-slide` | ja | Pick-Feedback. Heilig. |
| `feedback-fade-out` | **gestrichen** | redundant — `fade-in` rückwärts reicht. |
| `endgame-glow` | ja | End-of-Game-Card. Heilig. |
| `score-pop` | ja | Score-Erhöhung. Heilig. |
| `verdict-reveal` | ja | Result-Hero. Heilig. |
| `shimmer` | ja | Skeleton. Funktional. |
| (implizit) `nav-active` | nicht Keyframe | bleibt CSS-Selektor. |

**Neun Keyframes** ist die Zielzahl. Eine pro semantischer Geste. Wer eine weitere will, muss vor Hella, Aleksandr und mir begründen, warum die bestehende neun ein Loch hat.

Die Dauern werden semantisch genannt und sind die einzigen zulässigen:

| Token | Wert | Wofür |
|---|---|---|
| `--duration-instant` | 80ms | `:active`-Scale, Tap-Feedback. Wer schneller wäre, würde unsichtbar; wer langsamer, träge. |
| `--duration-fast` | 160ms | Hover, Focus, Color-Transitions. |
| `--duration-base` | 240ms | Spielfeedback (`pick-feedback`, `score-pop`, `verdict-reveal-Start`). Default für allen Spielzustand. |
| `--duration-slow` | 480ms | Result-Reveal, Section-Stagger. Eine, höchstens zwei Stellen pro Page. |

Easings (drei, nicht zwei):

- **`--ease-game`** (`cubic-bezier(0.34, 1.56, 0.64, 1)`) — bouncy, overshoots. Ausschliesslich für **Spielfeedback**. Pick-Confirmation, Score-Pop, Verdict-Reveal. Das ist die Saftigkeit des Produkts. Wer Navigation damit easet, macht sie kitschig.
- **`--ease-out`** (`cubic-bezier(0, 0, 0.2, 1)`) — standard. Für **alles UI** ausserhalb des Spielfelds. Hover, Focus, Page-Enter, Modal-Open.
- **`--ease-emphasis`** (`cubic-bezier(0.2, 0, 0, 1)`) — neu, schwerer am Anfang, leicht am Ende. Für **Section-Reveals**, die Aufmerksamkeit verdienen aber kein Hüpfen wollen (z.B. Result-Screen Stagger, Endgame-Ramp).

**Die zwei Shake-Dauern (`0.4s` vs `0.5s`):** beide werden zu `0.4s` über `var(--duration-base) + bisschen`. Konkret: `animation: shake 400ms var(--ease-out) both`. Die `0.5s`-Variante in `blitz-board.tsx` wird in der nächsten Edit-Pass gefixt.

**Die `pulse_2.5s`-Punkte** (drei Stellen, blitz + supremacy) — `2.5s` ist eine bewusste Wahl, kein Drift. Aber: nach Multiplayer-Removal sind das vielleicht nur noch ein bis zwei Stellen. Wer dann noch `animate-[pulse_2.5s]` schreibt, schreibt eine Utility-Klasse `.pulse-slow` oder die Naht wird vom Reviewer aufgemacht.

---

## Komponenten-Inventar

**Status quo**, mit nüchterner Klassifizierung:

| Komponente | Status | Verdict |
|---|---|---|
| `Header` | gebaut, drift | refaktorisieren — CTA-Strings auf `<Button>` ziehen |
| `Footer` | inline in layout.tsx | extrahieren in `src/components/layout/footer.tsx` |
| `GameLanding` | gebaut, gut | hält. Nutzt `getGameColor` — wandert auf CSS-Tokens. |
| `GameOverScreen` | gebaut, schwer | hält. Stagger-Reveal ist heilig. CTA-Strings refactor. |
| `GameSessionTopBar` | gebaut | hält. Eine `text-[11px]`-Stelle wird `text-xxs`. |
| `DailyHero` | gebaut, drift | `#b8860b`-Literal raus, Token rein. |
| `StreakBadge` | gebaut | hält. |
| `PickFeedback` | gebaut | hält. Heilig. |
| `EndgameRamp` | gebaut | hält. |
| `DailyLockoutGuard` | gebaut | hält. |
| `JoinCodeInput` | gebaut | **fällt weg** mit Multiplayer-Removal. |
| `CreateGameButton` (×3) | gebaut | **fällt weg** mit Multiplayer-Removal. |
| `AuthProvider` + `AuthModal` | gebaut | hält. Magic-Link-Pfad wird gestrichen (Lina). |

**Halb-gebaute Stellen** (die "Pinselskizzen" in Aurelies Sprache):

- **`TopoBg`** — leer. Siehe nächster Abschnitt.
- **`Modal`** — existiert *implizit* via `AuthModal` und dem User-Menü im Header. Es gibt keine geteilte `<Modal>`-Komponente. Friend-Challenges, Share-Karten, Settings — alle würden eine brauchen.
- **Toast/Snackbar** — fehlt komplett. Friends-Client zeigt Fehler via `alert()` (siehe `friends-client.tsx`). Das ist ein Skandal in einem 2026er Produkt.

**Was ich vorschlage zu bauen** (Priorität in Reihenfolge):

1. **`<Button>`** — Pflicht, jetzt. Begründet oben.
2. **`<Pill>`** — ein einziges Component für die siebzehn Stellen, wo `<span className="px-2 py-0.5 bg-... text-... text-[10px] font-bold uppercase rounded-md">` steht. API: `<Pill variant="gold" size="sm">DAILY</Pill>`.
3. **`<Modal>`** — Pflicht für ein erwachsenes Produkt. Eine geteilte Implementation, focus-trap, Escape-Close, Backdrop-Click.
4. **`<Toast>`** — eine `useToast()`-Hook-API, ein Render-Slot in `layout.tsx`. Macht `alert()` und stille Fehler zur Sache der Vergangenheit.
5. **`<Tooltip>`** — nice-to-have. Für Affordance-Hints, die Aleksandr wahrscheinlich wollen wird. Kann eine Phase später kommen.

Nicht zu bauen (bewusst weggelassen):

- Datepicker, Datatable, Tab-System, Dropdown-Menü — wir haben sie nicht gebraucht, und ich will sie nicht haben, bis ein Spiel sie *zwingend* fordert. Sieben Production-Dependencies bleiben sieben.

---

## TopoBg & Hero-Globe

**`TopoBg`** ist tot. `export function TopoBg() { return null; }` rendert sich in `layout.tsx:111` und tut nichts. Das ist ein leeres Vorsatzblatt. **Gelöscht.** Wenn Hella später ein topografisches Hintergrundmuster will, malt sie es bewusst — und wir nennen es nicht `TopoBg` (weil der Name verbraucht ist), sondern `ContourField` oder `LatticeBg`, je nachdem was es wirklich tut.

**`HeroGlobe`** ist die schmerzhaftere Entscheidung. Aurelie hat festgestellt: zehn pulsierende Punkte in `#c9a44c` (vierter Goldton, nicht im Token-System), Strokes in `rgba(255,255,255,0.06)`, gemalt für *dunklen* Hintergrund, lebend auf `#fafaf8`. Das heisst: das Bild ist optisch nur zu 30% sichtbar.

Drei Optionen:

1. **Bewahren, neu malen.** Strokes auf `rgba(26,26,26,0.06–0.10)` (also auf `--color-cream` mit Opazität). Punkte auf `var(--color-gold)`. Arcs auf `var(--color-gold)`. Dauern bleiben. Das Bild lebt, in derselben Komposition, in der richtigen Tonart.

2. **Ersetzen.** Eine neue Hero-Grafik. Vielleicht eine sehr ruhige Karte, vielleicht ein Patchwork aus fünf Flaggen, vielleicht ein simples Wort-Bild "Geography, Daily". Mehr Designarbeit, mehr Risiko, mehr Identität.

3. **Streichen, keine Grafik.** Die Landing-Page bekommt eine ruhige Typografie, Daily-Challenge-Block, fünfzehn-Spiele-Grid. Funktional sauber, brand-spezifisch schwächer.

**Mein Verdict: Option 1.** Bewahren und neu malen. Begründung:

- Der Globus ist die einzige Stelle, an der Countrivo ein **bildhaftes** Markenelement hat — ohne ihn ist es nur Typografie und Pastell-Cards.
- Die Umarbeitung ist minimal: zehn `fill="#c9a44c"` → `fill="var(--color-gold)"`, alle Strokes von `rgba(255,255,255,...)` → `rgba(26,26,26,...)`. Eine Datei, zwanzig Minuten Edit, kein neuer Asset-Workflow.
- Hella darf später entscheiden, ob die Punkte vielleicht **per-Spiel-getönt** werden sollen — also der Globus atmet in fünfzehn Pulsen, jeweils in der Farbe des Spiels, das gerade auf dem Hover liegt. Das wäre eine echte Identitäts-Geste, die nichts kostet, weil die Tokens jetzt da sind.

Option 2 (ersetzen) wäre meine zweite Wahl, aber sie ist eine ganze Phase Arbeit für Hella, und die haben wir nicht hier. Option 3 (streichen) wäre voreilig — wir würden später nochmal hingehen müssen.

---

## Schluss

Wenn ich Countrivo binde, sehe ich:

Das Skelett trägt. Sieben Production-Dependencies, eine Schrift, gemessene Radius- und Shadow-Skalen, ein bewusst gewähltes `--ease-game`, das den Spielen Saft gibt, ohne sie zu verniedlichen. Die Architektur (drei Schichten pro Spiel, server-actions-only, pure engines) ist ein erster Falz, der präzise misst und alle weiteren bestimmt.

Was nicht zusammentrifft: die Goldnaht. An sechs Stellen treffen sich Farben, die sich nicht kennen — Logo, Brand, Hero-Globe, OG-Karte, daily-hero-Literal, plus die Spuren in `globals.css` (Rank-2, Rank-3, Grade-Hex). Eine Naht muss neu vernäht werden, und sie ist nicht in der Mitte des Buchs, sondern am Vorsatzblatt: da, wo das erste Auge fällt.

Was halbfertig liegt: ein leeres `TopoBg`, ein Token (`--font-serif`), der auf sich selbst zeigt, eine `.cta-primary`-Klasse, die fünfzehn lose Kopien hat. Diese Stellen sind keine Verbrechen, sondern Hinweise darauf, dass jemand das Lineal einmal aufgelegt hat und ein zweites Mal vergessen wurde.

Ich lege es zweimal auf. Erstens: ein gewaschener `@theme`-Block, fünfzehn-Spiele-Farben als Tokens, neun statt vierzehn Keyframes, vier Dauern, drei Easings. Zweitens: eine `<Button>`-Komponente, die fünfzehn Kopien einsammelt, eine `<Pill>` für siebzehn Inline-Spans, ein `<Modal>` und ein `<Toast>` für das, was bisher mit `alert()` und implizit gelöst war.

Das ist nicht mehr und nicht weniger, als ein erwachsenes Buch braucht: einen ehrlichen Einband, ein gemessenes Vorsatzblatt, eine Heftung, die hält. Wer in vier Jahren ein fünfzehntes Spiel hinzufügt, soll wissen, wie er anfängt. Wer das System einmal sieht, soll die Achse spüren.

Er hat es nicht mehr gelesen. Das war 2017. Aber das Album hatte vierzehn saubere Seiten, und wenn man die Heftung anhebt, sieht man, dass der erste Falz die Achse aller anderen war.

So soll dieses System auch sein.

— *Reto Bruckner, Luzern / Berlin, 26. Mai 2026*
